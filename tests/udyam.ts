/**
 * Guards the Udyam format reader.
 *
 * The thing being protected is restraint. This reads the shape of a string —
 * it does not verify a registration, and it must not reject a real number
 * because our state-code list is incomplete. An unrecognised state code is
 * reported as unrecognised, not as invalid, and the tests below pin that
 * distinction so nobody later "tightens" it into a rejection.
 */
import { readUdyam, describeUdyamProblem, UDYAM_STATE_CODES } from '../lib/udyam';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra ?? ''); }
};

// ─── Well-formed ──────────────────────────────────────────────────────

const good = readUdyam('UDYAM-KA-03-0001234');
ok('a correctly formatted number is well formed', good.wellFormed);
ok('the state code is read', good.stateCode === 'KA', good.stateCode);
ok('the state is named', good.stateName === 'Karnataka', good.stateName);
ok('no problems reported', good.problems.length === 0, good.problems);

// ─── Normalisation ────────────────────────────────────────────────────

ok('lowercase is accepted', readUdyam('udyam-mh-12-0009876').wellFormed);
ok('lowercase is uppercased', readUdyam('udyam-mh-12-0009876').normalised === 'UDYAM-MH-12-0009876');
ok('internal spaces are stripped', readUdyam('UDYAM - GJ - 05 - 0000001').wellFormed);
ok('surrounding whitespace is stripped', readUdyam('  UDYAM-TN-01-0000001  ').wellFormed);

// ─── Empty is not an error ────────────────────────────────────────────
// The field is optional: someone without a registration still gets a figure.

for (const empty of ['', '   ', null, undefined]) {
    const r = readUdyam(empty);
    ok(`empty input (${JSON.stringify(empty)}) reports EMPTY`, r.problems[0] === 'EMPTY', r.problems);
    ok(`empty input (${JSON.stringify(empty)}) is not well formed`, r.wellFormed === false);
}

// ─── Malformed ────────────────────────────────────────────────────────

const malformed = [
    ['UDYAM-KA-3-0001234', 'single digit district'],
    ['UDYAM-KA-03-001234', 'six digit serial'],
    ['UDYAM-KA-03-00012345', 'eight digit serial'],
    ['UDYAM-K-03-0001234', 'one letter state'],
    ['UDYAM-KAR-03-0001234', 'three letter state'],
    ['UDYAM-03-03-0001234', 'digits where letters belong'],
    ['UDYOG-KA-03-0001234', 'wrong prefix'],
    ['KA-03-0001234', 'missing prefix'],
    ['29AABCU9603R1ZM', 'a GSTIN, not a Udyam number'],
    ['UDYAM-KA-03-0001234-X', 'trailing junk'],
];
for (const [value, why] of malformed) {
    const r = readUdyam(value);
    ok(`rejected: ${why}`, r.wellFormed === false && r.problems[0] === 'MALFORMED', { value, problems: r.problems });
}

// ─── Unrecognised state: flagged, never rejected ──────────────────────
// The Ministry publishes no machine-readable list, so our map is best-effort.
// A real registration from a state we have missed must still read as valid.

const unknown = readUdyam('UDYAM-ZZ-03-0001234');
ok('an unknown state code is still WELL FORMED', unknown.wellFormed === true, unknown);
ok('an unknown state code is flagged, not rejected',
    unknown.problems.length === 1 && unknown.problems[0] === 'UNRECOGNISED_STATE', unknown.problems);
ok('an unknown state code is never MALFORMED', !unknown.problems.includes('MALFORMED'));
ok('an unknown state has no name', unknown.stateName === null);
ok('the state code is still reported', unknown.stateCode === 'ZZ');

// ─── The state map ────────────────────────────────────────────────────

const codes = Object.keys(UDYAM_STATE_CODES);
ok('the state map covers the major states',
    ['KA', 'MH', 'TN', 'GJ', 'DL', 'UP', 'WB', 'TS', 'KL', 'RJ'].every((c) => codes.includes(c)));
ok('every state code is two uppercase letters', codes.every((c) => /^[A-Z]{2}$/.test(c)));
ok('every state has a non-empty name',
    Object.values(UDYAM_STATE_CODES).every((n) => n.trim().length > 2));
ok('no duplicate state names',
    new Set(Object.values(UDYAM_STATE_CODES)).size === codes.length);

// Every code in the map must actually read back as recognised.
ok('every mapped code produces a recognised read',
    codes.every((c) => readUdyam(`UDYAM-${c}-01-0000001`).problems.length === 0));

// ─── Copy stays on the publishing side of the line ────────────────────
// These strings are shown to a specific user about their own number, so they
// must observe, never rule. Words that assert a legal conclusion are barred.

const ADVICE_WORDS = /\b(you can claim|you cannot claim|entitled|eligible|ineligible|invalid claim|you must|we advise|you should file)\b/i;
for (const problem of ['EMPTY', 'MALFORMED', 'UNRECOGNISED_STATE'] as const) {
    const text = describeUdyamProblem(problem);
    ok(`${problem} has explanatory copy`, text.length > 30, text);
    ok(`${problem} copy states no legal conclusion`, !ADVICE_WORDS.test(text), text);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
