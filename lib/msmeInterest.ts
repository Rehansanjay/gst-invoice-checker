/**
 * lib/msmeInterest.ts
 * ─────────────────────────────────────────────────────────────────────
 * Interest on a delayed payment to a micro or small enterprise, under
 * section 16 of the MSMED Act 2006.
 *
 * The statute, verbatim:
 *
 *   "...the buyer shall ... be liable to pay compound interest with monthly
 *   rests to the supplier on that amount from the appointed day or, as the
 *   case may be, from the date immediately following the date agreed upon,
 *   at three times of the bank rate notified by the Reserve Bank."
 *
 * Three things follow, and each is implemented literally below:
 *
 *   1. COMPOUND, with MONTHLY RESTS. Interest is added to the balance each
 *      month and the next month's interest is charged on the larger figure.
 *   2. From the APPOINTED DAY, which is not the invoice date and not the
 *      acceptance date — see `interestStartDate`.
 *   3. At THREE TIMES THE BANK RATE, which moves. The rate in force during
 *      each month is used for that month, so a long claim is computed
 *      period by period. See lib/bankRate.ts.
 *
 * WHY THE ARITHMETIC IS WRITTEN OUT RATHER THAN A CLOSED FORM
 *
 * P × (1 + r/12)^n is only correct while the rate is constant. It is the
 * formula most published explainers use, and it silently produces the wrong
 * figure across a rate change. Walking the rests is the same work and stays
 * correct.
 *
 * A worked example published at bcshettyco.com was used to validate the
 * method: its first three monthly rests reproduce exactly here. Its fourth
 * does not — the published figure is ₹374.52 short, because ₹10,49,544.89 ×
 * 1.875% is ₹19,678.97 and not the ₹19,304.45 printed. The method is right,
 * that source's total is not. See tests/msme-interest.ts, which pins both.
 */

import {
    BANK_RATE_SERIES,
    STATUTORY_MULTIPLIER,
    bankRateBpsOn,
    coverageGapFor,
    toISODate,
    type BankRatePeriod,
} from './bankRate';
import { todayIST } from './gstDeadlines';

/** Section 15 caps an agreed payment period at forty-five days. */
export const MAX_AGREED_DAYS = 45;

/** Section 2(b): the period that runs from acceptance where nothing is agreed. */
export const DEFAULT_PERIOD_DAYS = 15;

/**
 * Day count used to pro-rate the trailing partial month.
 *
 * The statute prescribes monthly rests and says nothing about a period that
 * ends mid-month, so this is a choice rather than a rule. Simple interest at
 * actual/365 on the balance is the conventional treatment and is the more
 * conservative of the available readings — compounding the stub would produce
 * a slightly larger claim than this does.
 */
const DAYS_IN_YEAR = 365;

export interface ClaimInput {
    /** Integer paise. Never rupees, never a float. */
    principalPaise: number;
    /** Day of acceptance, or deemed acceptance, of the goods or services. */
    acceptanceDate: Date;
    /** Whether a written agreement fixes a payment period. */
    writtenAgreement: boolean;
    /** Days agreed, if any. Capped at MAX_AGREED_DAYS in code. */
    agreedDays?: number;
    /** Date of payment. Null or omitted means still outstanding. */
    paidOn?: Date | null;
    /** Computation date for an outstanding claim. Defaults to today, IST. */
    asOf?: Date;
}

export interface MonthlyRest {
    periodStart: string;
    periodEnd: string;
    days: number;
    /** False for the trailing stub, which is pro-rated rather than compounded. */
    fullMonth: boolean;
    bankRateBps: number;
    statutoryRateBps: number;
    openingBalancePaise: number;
    interestPaise: number;
    closingBalancePaise: number;
}

export interface InterestComputed {
    ok: true;
    /** The appointed day, or the day after the agreed date. */
    interestStartsOn: string;
    computedTo: string;
    daysOverdue: number;
    principalPaise: number;
    interestPaise: number;
    totalPaise: number;
    /** What the next full month would add at the current balance and rate. */
    monthlyAccrualPaise: number;
    schedule: MonthlyRest[];
}

export interface InterestRefused {
    ok: false;
    reason: string;
}

export type InterestResult = InterestComputed | InterestRefused;

/** Adds months, clamping to the end of a shorter month (31 Jan + 1 = 28 Feb). */
export function addMonths(date: Date, months: number): Date {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    const d = date.getUTCDate();
    const target = new Date(Date.UTC(y, m + months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(d, lastDay));
    return target;
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Drops the time of day, keeping the calendar date.
 *
 * Every date here is a calendar date — a day of acceptance, a day of payment.
 * None is an instant. But `todayIST()` returns a shifted timestamp that still
 * carries a time, and mixing that into a day count rounds it up: a claim
 * running to 22 August reported 175 days rather than 174, and the closing
 * period rendered as "1 Aug to 22 Aug, 22 days", which is visibly not 22 days.
 *
 * Normalising at the boundary keeps the arithmetic and the printed schedule
 * telling the same story, which matters more here than usual — the schedule is
 * meant to be checkable by the recipient's accountant.
 */
function atMidnightUTC(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysBetween(from: Date, to: Date): number {
    return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * The date interest begins to run.
 *
 * Section 2(b) defines the appointed day as "the day following immediately
 * after the expiry of the period of fifteen days from the day of acceptance".
 * Section 9 of the General Clauses Act excludes the first day when a period
 * runs "from" a date, so fifteen days from acceptance D covers D+1 to D+15,
 * expiring at the end of D+15, and the day following is D+16.
 *
 * Where a period is agreed, section 16 instead runs interest "from the date
 * immediately following the date agreed upon" — the agreed date plus one.
 *
 * A one-day reading either way is arguable. This takes the later start, which
 * understates the claim rather than overstating it. In a document the user
 * sends a debtor, erring small is recoverable and erring large is not.
 */
export function interestStartDate(input: ClaimInput): Date {
    if (input.writtenAgreement && typeof input.agreedDays === 'number') {
        const agreed = Math.min(Math.max(input.agreedDays, 0), MAX_AGREED_DAYS);
        return addDays(atMidnightUTC(input.acceptanceDate), agreed + 1);
    }
    return addDays(atMidnightUTC(input.acceptanceDate), DEFAULT_PERIOD_DAYS + 1);
}

/** Interest for one period, rounded to whole paise. */
function restInterest(balancePaise: number, statutoryRateBps: number, days: number, fullMonth: boolean): number {
    const annualRate = statutoryRateBps / 10000;
    const raw = fullMonth
        ? (balancePaise * annualRate) / 12
        : balancePaise * annualRate * (days / DAYS_IN_YEAR);
    return Math.round(raw);
}

/**
 * Computes the claim.
 *
 * Rounds to whole paise at every rest rather than once at the end. That is
 * not an approximation of the model — it is the model. Interest capitalises
 * monthly, so the balance the next month is charged on is a real, settled
 * amount, and carrying a fraction of a paisa forward would be inventing
 * precision the money does not have.
 */
export function computeInterest(
    input: ClaimInput,
    series: readonly BankRatePeriod[] = BANK_RATE_SERIES,
): InterestResult {
    if (!Number.isInteger(input.principalPaise) || input.principalPaise <= 0) {
        return { ok: false, reason: 'The invoice amount must be a positive whole number of paise.' };
    }

    const start = interestStartDate(input);
    const end = atMidnightUTC(input.paidOn ?? input.asOf ?? todayIST());

    if (daysBetween(start, end) <= 0) {
        return {
            ok: false,
            reason: `This is not yet overdue. Payment falls due on ${toISODate(start)}.`,
        };
    }

    const gap = coverageGapFor(start, end, series);
    if (gap) return { ok: false, reason: gap };

    const schedule: MonthlyRest[] = [];
    let balance = input.principalPaise;
    let cursor = start;

    // Whole monthly rests.
    for (;;) {
        const next = addMonths(cursor, 1);
        if (next > end) break;

        const bankRateBps = bankRateBpsOn(cursor, series);
        if (bankRateBps === null) {
            return { ok: false, reason: `No verified Bank Rate covers ${toISODate(cursor)}.` };
        }
        const statutoryRateBps = bankRateBps * STATUTORY_MULTIPLIER;
        const days = daysBetween(cursor, next);
        const interest = restInterest(balance, statutoryRateBps, days, true);

        schedule.push({
            periodStart: toISODate(cursor),
            periodEnd: toISODate(next),
            days,
            fullMonth: true,
            bankRateBps,
            statutoryRateBps,
            openingBalancePaise: balance,
            interestPaise: interest,
            closingBalancePaise: balance + interest,
        });

        balance += interest;
        cursor = next;
    }

    // Trailing stub, pro-rated.
    const stubDays = daysBetween(cursor, end);
    if (stubDays > 0) {
        const bankRateBps = bankRateBpsOn(cursor, series);
        if (bankRateBps === null) {
            return { ok: false, reason: `No verified Bank Rate covers ${toISODate(cursor)}.` };
        }
        const statutoryRateBps = bankRateBps * STATUTORY_MULTIPLIER;
        const interest = restInterest(balance, statutoryRateBps, stubDays, false);

        schedule.push({
            periodStart: toISODate(cursor),
            periodEnd: toISODate(end),
            days: stubDays,
            fullMonth: false,
            bankRateBps,
            statutoryRateBps,
            openingBalancePaise: balance,
            interestPaise: interest,
            closingBalancePaise: balance + interest,
        });

        balance += interest;
    }

    // Run-rate for "accruing at about ₹X a month", using the rate in force now.
    const currentBankRateBps = bankRateBpsOn(end, series);
    const monthlyAccrualPaise = currentBankRateBps === null
        ? 0
        : restInterest(balance, currentBankRateBps * STATUTORY_MULTIPLIER, 30, true);

    return {
        ok: true,
        interestStartsOn: toISODate(start),
        computedTo: toISODate(end),
        daysOverdue: daysBetween(start, end),
        principalPaise: input.principalPaise,
        interestPaise: balance - input.principalPaise,
        totalPaise: balance,
        monthlyAccrualPaise,
        schedule,
    };
}

/** Paise to a rupee string with two decimals: 316843_25 → "3,16,843.25". */
export function formatPaise(paise: number): string {
    const rupees = Math.floor(Math.abs(paise) / 100);
    const p = Math.abs(paise) % 100;
    // Indian grouping: last three digits, then pairs.
    const s = String(rupees);
    const head = s.length > 3 ? s.slice(0, -3) : '';
    const tail = s.slice(-3);
    const grouped = head ? `${head.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${tail}` : tail;
    return `${paise < 0 ? '-' : ''}${grouped}.${String(p).padStart(2, '0')}`;
}
