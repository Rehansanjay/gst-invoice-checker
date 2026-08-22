/**
 * Guards the MSMED Act s.16 interest engine.
 *
 * The headline fixture is a worked example published at bcshettyco.com, which
 * runs a ₹10,00,000 claim across four monthly rests at a rate that moves every
 * month. It is used because it exercises the one thing a closed-form
 * P × (1 + r/12)^n cannot: a rate change mid-claim.
 *
 * Its first three rests reproduce here to the paisa. Its fourth does not, and
 * that is not a bug in this engine — ₹10,49,544.89 × 1.875% is ₹19,678.97, not
 * the ₹19,304.45 printed, so the published total is ₹374.52 short. Both the
 * agreement and the divergence are pinned below, so that if anyone later
 * "fixes" this engine to match the published total, the test says why not to.
 */
import {
    computeInterest,
    interestStartDate,
    addMonths,
    formatPaise,
    MAX_AGREED_DAYS,
    type ClaimInput,
} from '../lib/msmeInterest';
import type { BankRatePeriod } from '../lib/bankRate';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra ?? ''); }
};

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

const row = (from: string, to: string | null, bps: number): BankRatePeriod => ({
    effectiveFrom: from,
    effectiveTo: to,
    bankRateBps: bps,
    sourceUrl: 'https://example.test/fixture',
    sourceNote: 'Test fixture only. Not a real RBI rate.',
    changeDateVerified: true,
    recordedOn: '2025-03-01',
});

// ─── Fixture: the published worked example ────────────────────────────
// Bank Rate moves 6.0 → 6.5 → 7.0 → 7.5 across the four months.

const FIXTURE_SERIES: readonly BankRatePeriod[] = [
    row('2025-06-01', null, 750),
    row('2025-05-01', '2025-06-01', 700),
    row('2025-04-01', '2025-05-01', 650),
    row('2025-03-01', '2025-04-01', 600),
];

// Acceptance on 13 Feb 2025 puts the appointed day at 1 March 2025 (+16).
const fixture: ClaimInput = {
    principalPaise: 100_000_000,      // ₹10,00,000
    acceptanceDate: d('2025-02-13'),
    writtenAgreement: false,
    paidOn: d('2025-07-01'),
};

const r = computeInterest(fixture, FIXTURE_SERIES);
ok('fixture computes', r.ok === true, r.ok === false ? r.reason : '');

if (r.ok) {
    ok('interest starts on the appointed day, 2025-03-01', r.interestStartsOn === '2025-03-01', r.interestStartsOn);
    ok('four monthly rests, no stub', r.schedule.length === 4, r.schedule.length);
    ok('every rest is a full month', r.schedule.every((s) => s.fullMonth));

    // Rests 1–3 agree with the published example exactly.
    ok('rest 1 (Mar, 18%) = ₹15,000.00', r.schedule[0]?.interestPaise === 1_500_000, r.schedule[0]?.interestPaise);
    ok('rest 2 (Apr, 19.5%) = ₹16,493.75', r.schedule[1]?.interestPaise === 1_649_375, r.schedule[1]?.interestPaise);
    ok('rest 3 (May, 21%) = ₹18,051.14', r.schedule[2]?.interestPaise === 1_805_114, r.schedule[2]?.interestPaise);

    // Rest 4 deliberately does NOT match the published figure.
    ok('rest 4 (Jun, 22.5%) = ₹19,678.97, not the published ₹19,304.45',
        r.schedule[3]?.interestPaise === 1_967_897, r.schedule[3]?.interestPaise);
    ok('the published rest 4 figure is not reproduced', r.schedule[3]?.interestPaise !== 1_930_445);

    ok('total = ₹10,69,223.86', r.totalPaise === 106_922_386, r.totalPaise);
    ok('published total ₹10,68,849.34 is short by exactly ₹374.52',
        r.totalPaise - 106_884_934 === 37_452, r.totalPaise - 106_884_934);

    // The rate genuinely varies rest to rest — this is what a closed form misses.
    ok('each rest uses its own month rate',
        r.schedule.map((s) => s.statutoryRateBps).join(',') === '1800,1950,2100,2250',
        r.schedule.map((s) => s.statutoryRateBps));

    // Balances must chain: each closing is the next opening.
    let chained = true;
    for (let i = 1; i < r.schedule.length; i++) {
        if (r.schedule[i - 1].closingBalancePaise !== r.schedule[i].openingBalancePaise) chained = false;
    }
    ok('balances chain through the schedule', chained);
    ok('final closing balance equals the total',
        r.schedule[r.schedule.length - 1]?.closingBalancePaise === r.totalPaise);
    ok('every figure is whole paise',
        r.schedule.every((s) => Number.isInteger(s.interestPaise) && Number.isInteger(s.closingBalancePaise)));
}

// ─── The figure quoted in the plan document ───────────────────────────
// ₹3,00,000 outstanding four full months at the current 5.50% Bank Rate.

const planDoc = computeInterest({
    principalPaise: 30_000_000,
    acceptanceDate: d('2026-02-13'),   // appointed day 2026-03-01
    writtenAgreement: false,
    paidOn: d('2026-07-01'),
});
ok('plan-document example computes', planDoc.ok === true, planDoc.ok === false ? planDoc.reason : '');
if (planDoc.ok) {
    ok('₹3,00,000 over four months accrues ₹16,843.45',
        planDoc.interestPaise === 1_684_345, planDoc.interestPaise);
    ok('formatted as ₹16,843.45', formatPaise(planDoc.interestPaise) === '16,843.45', formatPaise(planDoc.interestPaise));
    ok('all four rests at the current 16.50%',
        planDoc.schedule.every((s) => s.statutoryRateBps === 1650));
}

// ─── When interest starts ─────────────────────────────────────────────

const acc = d('2026-03-01');
ok('no agreement: appointed day is acceptance + 16 days',
    interestStartDate({ principalPaise: 1, acceptanceDate: acc, writtenAgreement: false }).getTime()
    === d('2026-03-17').getTime());

ok('agreed 45 days: interest runs from acceptance + 46',
    interestStartDate({ principalPaise: 1, acceptanceDate: acc, writtenAgreement: true, agreedDays: 45 }).getTime()
    === d('2026-04-16').getTime());

ok('agreed 30 days: interest runs from acceptance + 31',
    interestStartDate({ principalPaise: 1, acceptanceDate: acc, writtenAgreement: true, agreedDays: 30 }).getTime()
    === d('2026-04-01').getTime());

// Section 15 caps the agreed period, so a 90-day contract term is read down.
ok(`an agreed period over ${MAX_AGREED_DAYS} days is capped`,
    interestStartDate({ principalPaise: 1, acceptanceDate: acc, writtenAgreement: true, agreedDays: 90 }).getTime()
    === interestStartDate({ principalPaise: 1, acceptanceDate: acc, writtenAgreement: true, agreedDays: 45 }).getTime());

// ─── Refusals ─────────────────────────────────────────────────────────

const notYetDue = computeInterest({
    principalPaise: 10_000_000,
    acceptanceDate: d('2026-08-01'),
    writtenAgreement: false,
    asOf: d('2026-08-10'),
});
ok('a claim that is not yet overdue is refused', notYetDue.ok === false);
ok('the refusal states when payment falls due',
    notYetDue.ok === false && notYetDue.reason.includes('2026-08-17'),
    notYetDue.ok === false ? notYetDue.reason : '');

const preCoverage = computeInterest({
    principalPaise: 10_000_000,
    acceptanceDate: d('2025-01-01'),
    writtenAgreement: false,
    paidOn: d('2026-06-01'),
});
ok('a period starting before verified coverage is refused', preCoverage.ok === false);
ok('the refusal explains why rather than returning zero',
    preCoverage.ok === false && preCoverage.reason.includes('2026-01-01'),
    preCoverage.ok === false ? preCoverage.reason : '');

for (const bad of [0, -100, 1.5]) {
    const res = computeInterest({
        principalPaise: bad,
        acceptanceDate: d('2026-01-01'),
        writtenAgreement: false,
        paidOn: d('2026-06-01'),
    });
    ok(`principal of ${bad} is refused`, res.ok === false);
}

// ─── Compounding actually compounds ───────────────────────────────────

const twoMonths = computeInterest({
    principalPaise: 10_000_000,
    acceptanceDate: d('2026-02-13'),
    writtenAgreement: false,
    paidOn: d('2026-05-01'),
});
if (twoMonths.ok) {
    ok('later rests exceed earlier ones at the same rate',
        twoMonths.schedule[1].interestPaise > twoMonths.schedule[0].interestPaise,
        twoMonths.schedule.map((s) => s.interestPaise));
}

// ─── The trailing stub is pro-rated, not compounded ───────────────────

const withStub = computeInterest({
    principalPaise: 10_000_000,
    acceptanceDate: d('2026-02-13'),   // appointed day 2026-03-01
    writtenAgreement: false,
    paidOn: d('2026-05-16'),           // two full months + 15 days
});
if (withStub.ok) {
    ok('a part month produces a stub rest', withStub.schedule.length === 3, withStub.schedule.length);
    const stub = withStub.schedule[2];
    ok('the stub is marked as a part period', stub?.fullMonth === false);
    ok('the stub covers 15 days', stub?.days === 15, stub?.days);
    ok('the stub charges less than a full month would',
        (stub?.interestPaise ?? 0) < (withStub.schedule[1]?.interestPaise ?? 0),
        { stub: stub?.interestPaise, full: withStub.schedule[1]?.interestPaise });
}

// Payment stops the clock: paying earlier must cost less.
const paidEarly = computeInterest({
    principalPaise: 10_000_000, acceptanceDate: d('2026-02-13'),
    writtenAgreement: false, paidOn: d('2026-04-01'),
});
const paidLate = computeInterest({
    principalPaise: 10_000_000, acceptanceDate: d('2026-02-13'),
    writtenAgreement: false, paidOn: d('2026-08-01'),
});
ok('paying earlier accrues less interest',
    paidEarly.ok && paidLate.ok && paidEarly.interestPaise < paidLate.interestPaise);

// ─── Calendar dates, not instants ─────────────────────────────────────
// Regression: todayIST() carries a time of day, and feeding that into a day
// count rounded it up. A claim to 22 Aug reported 175 days instead of 174 and
// the closing period printed "2026-08-01 → 2026-08-22, 22 days", which is
// visibly not 22 days. Anyone checking the schedule would catch it instantly.

const midnight = computeInterest({
    principalPaise: 30_000_000, acceptanceDate: d('2026-02-13'),
    writtenAgreement: false, asOf: d('2026-08-22'),
});
for (const clock of ['T09:30:00Z', 'T14:30:00Z', 'T23:59:59Z']) {
    const withTime = computeInterest({
        principalPaise: 30_000_000,
        acceptanceDate: new Date('2026-02-13' + clock),
        writtenAgreement: false,
        asOf: new Date('2026-08-22' + clock),
    });
    ok(`a time of day (${clock}) does not change the result`,
        midnight.ok && withTime.ok && withTime.totalPaise === midnight.totalPaise,
        { midnight: midnight.ok && midnight.totalPaise, withTime: withTime.ok && withTime.totalPaise });
}
if (midnight.ok) {
    ok('2026-03-01 to 2026-08-22 is 174 days', midnight.daysOverdue === 174, midnight.daysOverdue);
    ok('computedTo agrees with the day count', midnight.computedTo === '2026-08-22');
    const last = midnight.schedule[midnight.schedule.length - 1];
    ok('the closing stub is 21 days, matching its printed dates', last?.days === 21, last?.days);
    ok('every period length matches its own printed dates',
        midnight.schedule.every((s) =>
            s.days === Math.round((Date.parse(s.periodEnd) - Date.parse(s.periodStart)) / 86_400_000)),
        midnight.schedule.map((s) => `${s.periodStart}→${s.periodEnd}=${s.days}`));
}

// ─── Date helpers ─────────────────────────────────────────────────────

ok('addMonths clamps 31 Jan to 28 Feb in a common year',
    addMonths(d('2026-01-31'), 1).getTime() === d('2026-02-28').getTime());
ok('addMonths clamps 31 Jan to 29 Feb in a leap year',
    addMonths(d('2028-01-31'), 1).getTime() === d('2028-02-29').getTime());
ok('addMonths crosses a year boundary',
    addMonths(d('2026-12-15'), 1).getTime() === d('2027-01-15').getTime());

// ─── Indian digit grouping ────────────────────────────────────────────

ok('formatPaise groups lakhs the Indian way', formatPaise(31_684_345) === '3,16,843.45', formatPaise(31_684_345));
ok('formatPaise handles thousands', formatPaise(1_500_000) === '15,000.00', formatPaise(1_500_000));
ok('formatPaise handles small amounts', formatPaise(9_950) === '99.50', formatPaise(9_950));
ok('formatPaise handles a crore', formatPaise(1_000_000_000) === '1,00,00,000.00', formatPaise(1_000_000_000));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
