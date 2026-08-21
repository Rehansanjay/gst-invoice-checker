/**
 * Guards the number quoted in marketing against the number of rules that
 * actually run.
 *
 * This has drifted twice. The site said "11-point check" while 15 rules ran;
 * that was corrected to 15, and then adding RULE_INVOICE_LEVEL_TAX made it 16
 * within days. Anyone counting the results in a report can see the discrepancy
 * immediately, and it is exactly the kind of small inaccuracy that costs
 * credibility with a professional audience.
 *
 * ADVERTISED_COUNT below must be updated in the same commit that adds or
 * removes a rule, along with the copy listed in COPY_LOCATIONS.
 */
import { ALL_RULES } from '../lib/services/validationRules';
import fs from 'fs';
import path from 'path';

const ADVERTISED_COUNT = 16;

/** Files whose copy states the number. Kept here so the failure names them. */
const COPY_LOCATIONS = [
    'app/layout.tsx',
    'app/(marketing)/page.tsx',
    'app/(marketing)/vendor-invoice-check/page.tsx',
    'app/(auth)/login/page.tsx',
    'app/(auth)/signup/page.tsx',
    'app/opengraph-image.tsx',
    'components/Navbar.tsx',
];

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra ?? ''); }
};

ok(
    `ALL_RULES length (${ALL_RULES.length}) matches the advertised count (${ADVERTISED_COUNT})`,
    ALL_RULES.length === ADVERTISED_COUNT,
    `If you added a rule, update ADVERTISED_COUNT here and the copy in:\n    ${COPY_LOCATIONS.join('\n    ')}`
);

// Every rule needs a distinct id, or the registry silently double-counts.
const ids = ALL_RULES.map(r => r.id);
ok('every rule id is unique', new Set(ids).size === ids.length,
    ids.filter((id, i) => ids.indexOf(id) !== i));

// The stale number must not survive anywhere in the copy.
const root = path.join(__dirname, '..');
const stale: string[] = [];
for (const rel of COPY_LOCATIONS) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) { stale.push(`${rel} (missing — update COPY_LOCATIONS)`); continue; }
    const text = fs.readFileSync(file, 'utf8');
    // Deliberately ignores "15 seconds" / "15-digit GSTIN", which are unrelated.
    const bad = text.match(/\b(?!16\b)\d{1,2}[-\s](?:point|compliance check|mechanical check|statutory check|Validation Check|GST Check)/gi);
    if (bad) stale.push(`${rel}: ${[...new Set(bad)].join(', ')}`);
}
ok('no stale check-count claims in copy', stale.length === 0, '\n    ' + stale.join('\n    '));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
