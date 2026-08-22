/**
 * Guards the Bank Rate series that MSMED Act s.16 interest is computed from.
 *
 * Two things are being protected here.
 *
 * First, the REFUSAL. A date outside verified coverage must return null, not
 * the nearest rate we happen to hold. Silently substituting a rate would put
 * a confident wrong figure into a document the user sends to a debtor — the
 * single worst failure this tool can have, because it costs the user
 * credibility they cannot recover.
 *
 * Second, DRIFT between lib/bankRate.ts and the migration that seeds the
 * table. The constant is the fallback for an unapplied migration, so the two
 * must agree; if they diverge, the figure changes the day the migration is
 * applied and nobody notices. Same class of bug as the check-count drift.
 */
import fs from 'fs';
import path from 'path';
import {
    BANK_RATE_SERIES,
    COVERAGE_STARTS_ON,
    STATUTORY_MULTIPLIER,
    bankRateBpsOn,
    statutoryRateBpsOn,
    coverageGapFor,
    currentRate,
    bpsToPercent,
    isSeriesStale,
} from '../lib/bankRate';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra ?? ''); }
};

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

// ─── The verified figure ──────────────────────────────────────────────
// Read from rbi.org.in on 2026-08-22: Bank Rate 5.50%, as at 1.00pm 2026-08-21.
// If the MPC moves the rate, this test SHOULD fail — that is the point.

const current = currentRate();
ok('a rate is currently in force', current !== null);
ok('current Bank Rate is 5.50% (550 bps)', current?.bankRateBps === 550, current?.bankRateBps);
ok('statutory multiplier is 3', STATUTORY_MULTIPLIER === 3);
ok('statutory rate is 16.50%', bpsToPercent(550 * STATUTORY_MULTIPLIER) === '16.50');

// The compounded figure quoted in the letter and marketing copy.
const effectiveYield = Math.pow(1 + 0.165 / 12, 12) - 1;
ok('effective yield with monthly rests is 17.81%',
    (effectiveYield * 100).toFixed(2) === '17.81',
    (effectiveYield * 100).toFixed(2));

// ─── Coverage: the refusal ────────────────────────────────────────────

ok('a date inside coverage resolves', bankRateBpsOn(d('2026-06-15')) === 550);
ok('the first covered day resolves', bankRateBpsOn(d(COVERAGE_STARTS_ON)) === 550);

ok('the day before coverage returns null', bankRateBpsOn(d('2025-12-31')) === null,
    bankRateBpsOn(d('2025-12-31')));
ok('a 2024 date returns null', bankRateBpsOn(d('2024-05-01')) === null);
ok('statutoryRateBpsOn also refuses outside coverage', statutoryRateBpsOn(d('2025-06-01')) === null);
ok('statutoryRateBpsOn returns 1650 inside coverage', statutoryRateBpsOn(d('2026-06-15')) === 1650);

// A whole claim period is checked before any arithmetic runs, so a partially
// computable span fails cleanly instead of returning half a figure.
ok('a fully covered period reports no gap',
    coverageGapFor(d('2026-03-01'), d('2026-08-01')) === null);
ok('a period starting before coverage is refused',
    coverageGapFor(d('2025-09-01'), d('2026-08-01')) !== null);
ok('the refusal names the coverage start date',
    (coverageGapFor(d('2025-09-01'), d('2026-08-01')) ?? '').includes(COVERAGE_STARTS_ON));
ok('the refusal points at the RBI archive',
    (coverageGapFor(d('2025-09-01'), d('2026-08-01')) ?? '').includes('rbi.org.in'));

// ─── Series integrity ─────────────────────────────────────────────────

const open = BANK_RATE_SERIES.filter((p) => p.effectiveTo === null);
ok('exactly one rate is open-ended', open.length === 1, open.length);

ok('every rate is a positive integer in basis points',
    BANK_RATE_SERIES.every((p) => Number.isInteger(p.bankRateBps) && p.bankRateBps > 0));

ok('every row cites a source', BANK_RATE_SERIES.every((p) => p.sourceUrl.startsWith('https://')));

// A row whose change date is unverified must say so in its note, or the
// caveat is invisible to whoever reads the series next.
ok('unverified change dates are explained in the note',
    BANK_RATE_SERIES.every((p) => p.changeDateVerified || p.sourceNote.length > 40));

// Rows must be ordered newest-first and must not overlap.
for (let i = 1; i < BANK_RATE_SERIES.length; i++) {
    const newer = BANK_RATE_SERIES[i - 1];
    const older = BANK_RATE_SERIES[i];
    ok(`row ${i} starts before row ${i - 1}`, older.effectiveFrom < newer.effectiveFrom);
    ok(`row ${i} closes where row ${i - 1} opens`, older.effectiveTo === newer.effectiveFrom);
}

// ─── Staleness ────────────────────────────────────────────────────────

ok('series is not stale on the day it was recorded', isSeriesStale(d('2026-08-22')) === false);
ok('series is stale 200 days later', isSeriesStale(d('2027-03-10')) === true);

// ─── Drift against the migration ──────────────────────────────────────

const sqlPath = path.join(__dirname, '..', 'migrations', 'add_bank_rate_history.sql');
if (!fs.existsSync(sqlPath)) {
    ok('migration file exists', false, sqlPath);
} else {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const seeded = [...sql.matchAll(/\('(\d{4}-\d{2}-\d{2})',\s*(null|'[\d-]+')\s*,\s*(\d+)\s*,/g)]
        .map((m) => ({ from: m[1], bps: Number(m[3]) }));

    ok('migration seeds at least one rate', seeded.length > 0, seeded);
    ok('migration seeds the same number of rows as the constant',
        seeded.length === BANK_RATE_SERIES.length,
        { sql: seeded.length, constant: BANK_RATE_SERIES.length });

    for (const row of seeded) {
        const match = BANK_RATE_SERIES.find((p) => p.effectiveFrom === row.from);
        ok(`migration row ${row.from} exists in BANK_RATE_SERIES`, match !== undefined);
        ok(`migration row ${row.from} has the same rate as the constant`,
            match?.bankRateBps === row.bps, { sql: row.bps, constant: match?.bankRateBps });
    }

    ok('migration coverage start matches COVERAGE_STARTS_ON',
        seeded.some((r) => r.from === COVERAGE_STARTS_ON), seeded.map((r) => r.from));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
