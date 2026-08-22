/**
 * lib/bankRate.ts
 * ─────────────────────────────────────────────────────────────────────
 * The RBI Bank Rate, as a dated series.
 *
 * Section 16 of the MSMED Act 2006 sets interest on a delayed payment to a
 * micro or small enterprise at three times the Bank Rate notified by the
 * Reserve Bank, compounded with monthly rests. A claim running eighteen
 * months can span several Bank Rate changes, so interest has to be computed
 * against the rate in force during each period rather than one rate applied
 * flat across the whole span.
 *
 * This mirrors migrations/add_bank_rate_history.sql. The constant here is the
 * fallback for the same reason /api/lead-capture tolerates a missing `leads`
 * table: migrations that touch RLS are applied by hand and may sit unapplied
 * for a while. When the table exists it is authoritative; this keeps the tool
 * working correctly until then.
 *
 * WHAT IS AND IS NOT VERIFIED
 *
 * The rate is verified: 5.50%, read from rbi.org.in on 2026-08-22, shown as
 * at 1.00pm 2026-08-21.
 *
 * The date it changed is not. Secondary sources contradict each other on the
 * late-2025 sequence, and RBI's rate archive redirects rather than serving a
 * history. So coverage starts at a conservative 2026-01-01 and anything
 * earlier is REFUSED rather than computed against the oldest rate we happen
 * to hold. See `coverageGapFor`.
 *
 * Refusing is the right failure mode here. This number goes into a document
 * the user sends a debtor; being quietly wrong costs them credibility they
 * cannot recover, and saying "we don't cover that period yet" costs nothing.
 */

import { todayIST } from './gstDeadlines';

export interface BankRatePeriod {
    /** ISO date. Inclusive. */
    effectiveFrom: string;
    /** ISO date, exclusive. Null means still in force. */
    effectiveTo: string | null;
    /** Basis points. 550 = 5.50%. Integer — never a float on a rate. */
    bankRateBps: number;
    sourceUrl: string;
    sourceNote: string;
    /**
     * Whether `effectiveFrom` is the genuine change date or a conservative
     * placeholder. False means the rate is right but the start date is not
     * evidence of anything.
     */
    changeDateVerified: boolean;
    /** ISO date this row was last checked against the source. */
    recordedOn: string;
}

/** The statutory multiplier in MSMED Act s.16. */
export const STATUTORY_MULTIPLIER = 3;

/**
 * Earliest date a series can be trusted for: the start of its oldest row.
 *
 * Derived rather than declared, so extending coverage is a matter of adding a
 * verified row and nothing else. A separate constant would be a second place
 * to update and therefore a place to forget.
 */
export function coverageStartOf(series: readonly BankRatePeriod[] = BANK_RATE_SERIES): string {
    return series.reduce((earliest, p) => (p.effectiveFrom < earliest ? p.effectiveFrom : earliest), '9999-12-31');
}

/** Coverage start for the shipped series. Periods before this are refused. */
export const COVERAGE_STARTS_ON = '2026-01-01';

/**
 * How long a recorded rate may go unchecked before the series is treated as
 * stale. The MPC meets roughly every two months, so 120 days means we have
 * missed at least two opportunities for the rate to have moved.
 */
const STALE_AFTER_DAYS = 120;

export const BANK_RATE_SERIES: readonly BankRatePeriod[] = [
    {
        effectiveFrom: '2026-01-01',
        effectiveTo: null,
        bankRateBps: 550,
        sourceUrl: 'https://www.rbi.org.in/',
        sourceNote:
            'Bank Rate 5.50% (MSF 5.50%, Repo 5.25%) read from the RBI homepage on 2026-08-22, shown as at 1.00pm 2026-08-21. effectiveFrom is a conservative placeholder: the change happened during 2025 and sources conflict on when. 2026-01-01 is supported by the repo rate having been held at 5.25% at every 2026 MPC.',
        changeDateVerified: false,
        recordedOn: '2026-08-22',
    },
];

/** ISO `YYYY-MM-DD` for a date, read in IST. */
export function toISODate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

/**
 * The Bank Rate in force on a given date, in basis points, or null if the
 * date falls outside verified coverage.
 *
 * Callers must treat null as "cannot compute" and surface that to the user.
 * Substituting the nearest known rate would produce a confident wrong figure,
 * which is the failure this whole module exists to prevent.
 */
export function bankRateBpsOn(date: Date, series: readonly BankRatePeriod[] = BANK_RATE_SERIES): number | null {
    const iso = toISODate(date);
    if (iso < coverageStartOf(series)) return null;

    for (const period of series) {
        const startedYet = iso >= period.effectiveFrom;
        const stillInForce = period.effectiveTo === null || iso < period.effectiveTo;
        if (startedYet && stillInForce) return period.bankRateBps;
    }
    return null;
}

/** The statutory interest rate in basis points for a date: 3 × Bank Rate. */
export function statutoryRateBpsOn(date: Date, series: readonly BankRatePeriod[] = BANK_RATE_SERIES): number | null {
    const bankRate = bankRateBpsOn(date, series);
    return bankRate === null ? null : bankRate * STATUTORY_MULTIPLIER;
}

/**
 * Checks a whole claim period against coverage before any arithmetic runs.
 * Returns a message to show the user, or null when the period is computable.
 *
 * Called first by the interest engine so a partially-computable claim fails
 * cleanly rather than returning a figure covering only part of the span.
 */
export function coverageGapFor(
    from: Date,
    to: Date,
    series: readonly BankRatePeriod[] = BANK_RATE_SERIES,
): string | null {
    const fromISO = toISODate(from);
    const toISO = toISODate(to);
    const start = coverageStartOf(series);

    if (fromISO < start) {
        return `Our verified Bank Rate series starts on ${start}. This period begins on ${fromISO}, so we cannot compute it without publishing a rate we have not checked at source. The RBI rate archive is at rbi.org.in.`;
    }
    if (bankRateBpsOn(to, series) === null) {
        return `We do not hold a Bank Rate covering ${toISO}. The series may need updating.`;
    }
    return null;
}

/**
 * True when the newest rate has gone unchecked long enough that it may have
 * moved. Does not block computation — an out-of-date rate is still the last
 * one we verified — but the UI should say when it was last checked so nobody
 * is misled about how fresh the figure is.
 */
export function isSeriesStale(asOf: Date = todayIST(), series: readonly BankRatePeriod[] = BANK_RATE_SERIES): boolean {
    const current = series.find((p) => p.effectiveTo === null);
    if (!current) return true;

    const recorded = new Date(`${current.recordedOn}T00:00:00Z`);
    const days = (asOf.getTime() - recorded.getTime()) / (24 * 60 * 60 * 1000);
    return days > STALE_AFTER_DAYS;
}

/** The rate currently in force, for display. Null if the series is empty. */
export function currentRate(series: readonly BankRatePeriod[] = BANK_RATE_SERIES): BankRatePeriod | null {
    return series.find((p) => p.effectiveTo === null) ?? null;
}

/** Basis points as a percentage string: 1650 → "16.50". */
export function bpsToPercent(bps: number): string {
    return (bps / 100).toFixed(2);
}
