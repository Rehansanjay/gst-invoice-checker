/**
 * Guards the free letter template.
 *
 * The thing being protected is the line between publishing and advising.
 * Section 29 of the Advocates Act reserves legal drafting and advice to
 * enrolled advocates; this ships free, unbranded, with gaps the user fills,
 * and it cites provisions without interpreting them for anyone.
 *
 * The strongest tests below are the negative ones. An earlier draft of
 * paragraph 6 explained that the buyer would lose their deduction — that was
 * this product advising the reader's counterparty on their tax position, and
 * PARA_6_MUST_NOT_EXPLAIN exists so it cannot come back.
 */
import { buildDemandLetter, buildSchedule, letterFilename } from '../lib/demandLetter';
import { computeInterest, type InterestComputed } from '../lib/msmeInterest';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra ?? ''); }
};

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

const r = computeInterest({
    principalPaise: 30_000_000,
    acceptanceDate: d('2026-02-13'),
    writtenAgreement: false,
    paidOn: d('2026-07-01'),
});
if (!r.ok) { console.log('fixture failed to compute:', r.reason); process.exit(1); }
const computed: InterestComputed = r;

const letter = buildDemandLetter({ computed, writtenAgreement: false });

/**
 * The letter with whitespace flattened.
 *
 * Paragraphs are wrapped programmatically, so a phrase can legitimately span a
 * line break. Assertions about wording must not depend on where the wrap
 * happens to fall — only assertions about layout should look at real lines.
 */
const flat = letter.replace(/\s+/g, ' ');

// ─── It announces itself as a template ────────────────────────────────

ok('opens by saying it is a template', letter.startsWith('THIS IS A TEMPLATE'));
ok('says it was not drafted by a lawyer', /NOT[\s\S]{0,40}DRAFTED BY A LAWYER/.test(letter));
ok('tells the user to send it in their own name', /in your own name/i.test(letter));
ok('points at an advocate or CA for anything material', /advocate or a\s+chartered accountant/i.test(letter));
ok('says InvoiceCheck is not a law firm', /not a law firm/i.test(letter));
ok('the filename marks it a template', letterFilename(computed).includes('TEMPLATE'));
ok('the file is plain text', letterFilename(computed).endsWith('.txt'));

// ─── Gaps stay gaps ───────────────────────────────────────────────────
// The placeholders are the compliance posture: a document the user must
// complete cannot be a document we drafted for them.

for (const gap of ["[BUYER'S NAME]", '[YOUR NAME / FIRM NAME]', '[DATE YOU SEND THIS]', '[INVOICE NUMBER]', '[DATE OF ACCEPTANCE]']) {
    ok(`leaves a gap for ${gap}`, letter.includes(gap), gap);
}
ok('an unsupplied Udyam number stays a gap', letter.includes('[YOUR UDYAM NUMBER]'));
ok('a supplied Udyam number is filled in',
    buildDemandLetter({ computed, writtenAgreement: false, udyam: 'UDYAM-KA-03-0001234' })
        .includes('UDYAM-KA-03-0001234'));
ok('a supplied invoice number is filled in',
    buildDemandLetter({ computed, writtenAgreement: false, invoiceNumber: 'INV-2026-004' })
        .includes('INV-2026-004'));

// ─── The figures are the ones computed ────────────────────────────────

ok('carries the principal', letter.includes('3,00,000.00'));
ok('carries the interest', letter.includes('16,843.45'));
ok('carries the total', letter.includes('3,16,843.45'));
ok('carries the day count', letter.includes('122 days'));
ok('carries the date interest runs from', letter.includes('2026-03-01'));

// ─── Sections cited, not construed ────────────────────────────────────

for (const s of ['Section 15', 'Section 16', 'Section 18', 'Section 37(2)(g)']) {
    ok(`cites ${s}`, letter.includes(s));
}
ok('names the current filing venue', letter.includes('odr.msme.gov.in'));
ok('dates the portal change', flat.includes('15 October 2025'));
ok('gives the previous section number too', letter.includes('43B(h)'));

// PARA 6 REGRESSION. It may cite s.37(2)(g); it may not explain what follows
// for the recipient. Explaining is advising a third party on their tax.
const para6 = letter.slice(letter.indexOf('6.'), letter.indexOf('7.'));
const PARA_6_MUST_NOT_EXPLAIN = [
    /disallow/i, /not be allowed/i, /cannot claim/i, /will lose/i,
    /unavailable/i, /you will not/i, /deduction will/i,
];
for (const banned of PARA_6_MUST_NOT_EXPLAIN) {
    ok(`paragraph 6 does not explain the consequence (${banned})`, !banned.test(para6), para6.trim().slice(0, 160));
}
ok('paragraph 6 is short enough to be a citation, not an argument',
    para6.trim().length < 420, para6.trim().length);

// ─── Register: a supplier writing to a customer ───────────────────────

const THREATS = [
    /failing which/i, /legal action will/i, /we shall be constrained/i,
    /without prejudice/i, /you are hereby called upon/i, /at your own risk/i,
    /criminal/i, /prosecut/i,
];
for (const t of THREATS) {
    ok(`no threatening register (${t})`, !t.test(letter));
}
ok('asks rather than demands', /I request that/i.test(letter));

// We must never claim an outcome, and never offer to act for the user.
const OVERREACH = [
    /we will send/i, /on your behalf/i, /we guarantee/i, /you are entitled to/i,
    /you can recover/i, /your claim is valid/i, /we have determined/i,
];
for (const o of OVERREACH) {
    ok(`no overreach (${o})`, !o.test(letter), o.source);
}

// ─── No branding inside the letter body ───────────────────────────────
// It is sent on the user's letterhead. Our name belongs in the instructions
// and the provenance note, not in the document they sign.

const bodyStart = letter.indexOf('NOTICE OF DELAYED PAYMENT');
const bodyEnd = letter.indexOf('Enclosures:');
const body = letter.slice(bodyStart, bodyEnd);
ok('the letter body carries no InvoiceCheck branding', !/invoicecheck/i.test(body), body.match(/.{0,60}invoicecheck.{0,60}/i)?.[0]);
ok('provenance is stated outside the letter body', /invoicecheck\.in/i.test(letter.slice(bodyEnd)));

// ─── Agreed period wording ────────────────────────────────────────────

const agreed = buildDemandLetter({ computed, writtenAgreement: true, agreedDays: 30 });
ok('an agreed period is described as agreed', agreed.includes('30 days agreed between us'));
ok('no agreement falls back to the fifteen day wording',
    flat.includes('fifteen days provided for where no period is agreed'));
ok('an over-long agreed period is stated as capped',
    buildDemandLetter({ computed, writtenAgreement: true, agreedDays: 90 }).includes('45 days agreed between us'));

// ─── The enclosure ────────────────────────────────────────────────────

const schedule = buildSchedule(computed);
ok('the schedule is a titled enclosure', schedule.startsWith('INTEREST COMPUTATION'));
ok('the schedule has a row per rest',
    computed.schedule.every((s) => schedule.includes(s.periodStart)));
ok('the schedule states the compounding basis', /compounded with monthly rests/i.test(schedule));
ok('the schedule explains part-period treatment', /pro rata/i.test(schedule));
ok('the schedule is embedded in the letter file', letter.includes('INTEREST COMPUTATION'));
ok('the schedule columns line up',
    schedule.split('\n').filter((l) => l.includes('2026-')).every((l) => l.length === schedule.split('\n')[2].length),
    schedule.split('\n').filter((l) => l.includes('2026-')).map((l) => l.length));

// ─── Line wrapping ────────────────────────────────────────────────────
// Paragraphs are wrapped programmatically because hand-placed breaks look
// right against the placeholders and then fall apart once real values of a
// different length are substituted. A letter with ragged lines reads as
// careless, and this one goes to a finance team.

const bodyLines = letter.slice(letter.indexOf('Sir/Madam'), letter.indexOf('Yours faithfully')).split('\n');
ok('no letter body line exceeds 72 characters',
    bodyLines.every((l) => l.length <= 72),
    bodyLines.filter((l) => l.length > 72).map((l) => `${l.length}: ${l.slice(0, 80)}`));

// A long substituted value must not blow the wrap either.
const longName = buildDemandLetter({
    computed, writtenAgreement: true, agreedDays: 45,
    invoiceNumber: 'INV/2026-27/EXPORT-CONSIGNMENT/000412-REVISED',
    udyam: 'UDYAM-MH-26-0009999',
});
const longLines = longName.slice(longName.indexOf('Sir/Madam'), longName.indexOf('Yours faithfully')).split('\n');
ok('long substituted values still wrap',
    longLines.every((l) => l.length <= 72),
    longLines.filter((l) => l.length > 72).map((l) => `${l.length}: ${l}`));

ok('continuation lines are indented under the number',
    bodyLines.filter((l) => /^\s{4}\S/.test(l)).length > 4);
// Scoped to the body: the enclosure's rule line is legitimately all dashes.
ok('no word is hyphenated across lines in the body', !/\S-\n/.test(bodyLines.join('\n')));

// ─── Financial year ───────────────────────────────────────────────────
// Indian FY ends 31 March, so a computation in July 2026 sits in FY 2026-27.

ok('names the financial year ending after the computation date', letter.includes('31 March 2027'), letter.match(/31 March \d{4}/)?.[0]);
const janClaim = computeInterest({
    principalPaise: 10_000_000, acceptanceDate: d('2026-01-05'),
    writtenAgreement: false, paidOn: d('2026-03-01'),
});
if (janClaim.ok) {
    ok('a computation before 31 March sits in the year ending that March',
        buildDemandLetter({ computed: janClaim, writtenAgreement: false }).includes('31 March 2026'),
        buildDemandLetter({ computed: janClaim, writtenAgreement: false }).match(/31 March \d{4}/)?.[0]);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
