/**
 * Root-cause grouping. The value of this feature is entirely in not
 * over-reporting: a defect that isn't actually shared must stay out, and a
 * counterparty problem must not also appear as a systemic one.
 */
import { detectRootCauses, normaliseIssueTitle } from '../lib/services/bulkRootCause';
import { BulkInvoiceResult, LockedIssueSummary } from '../types';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra ?? ''); }
};

const issue = (title: string, o: Partial<LockedIssueSummary> = {}): LockedIssueSummary => ({
    id: `${title}-${Math.random()}`, severity: 'critical', category: 'Tax Type', title, ...o,
});

const inv = (
    invoiceNumber: string,
    buyerGSTIN: string,
    issues: LockedIssueSummary[],
    amount = 1000
): BulkInvoiceResult => ({
    invoiceNumber, invoiceDate: '2026-08-01', buyerGSTIN,
    invoiceTotalAmount: amount, healthScore: 70, riskLevel: 'high',
    criticalCount: issues.filter(i => i.severity === 'critical').length,
    warningCount: issues.filter(i => i.severity === 'warning').length,
    issues,
});

// ── title normalisation ────────────────────────────────────────────────
ok('strips em-dash line suffix', normaliseIssueTitle('Wrong Tax Type — Line 1') === 'Wrong Tax Type');
ok('strips hyphen line suffix', normaliseIssueTitle('Wrong Tax Type - Line 12') === 'Wrong Tax Type');
ok('leaves plain titles alone', normaliseIssueTitle('Invoice Total Wrong') === 'Invoice Total Wrong');
ok('different lines group together',
    normaliseIssueTitle('Wrong Tax Type — Line 1') === normaliseIssueTitle('Wrong Tax Type — Line 7'));

// ── counterparty detection ─────────────────────────────────────────────
const sameBuyer = detectRootCauses([
    inv('A-1', '29AACCM1234C1ZK', [issue('Wrong Tax Type — Line 1')], 5000),
    inv('A-2', '29AACCM1234C1ZK', [issue('Wrong Tax Type — Line 1')], 3000),
    inv('A-3', '27AAAAA1111A1Z5', [issue('Invoice Total Wrong')]),
]);
const cp = sameBuyer.find(c => c.scope === 'counterparty');
ok('detects a repeated defect on one buyer', !!cp, sameBuyer);
ok('counts the right invoices', cp?.invoiceCount === 2, cp?.invoiceCount);
ok('sums the affected value', cp?.amountAffected === 8000, cp?.amountAffected);
ok('names the buyer', cp?.key === '29AACCM1234C1ZK', cp?.key);
ok('does not flag the single unrelated issue', sameBuyer.length === 1, sameBuyer.map(c => c.id));

// ── a one-off must NOT be reported ─────────────────────────────────────
const oneOff = detectRootCauses([
    inv('B-1', '29AACCM1234C1ZK', [issue('Wrong Tax Type — Line 1')]),
    inv('B-2', '27AAAAA1111A1Z5', [issue('Invoice Total Wrong')]),
]);
ok('no root cause from unrelated single issues', oneOff.length === 0, oneOff);

// ── systemic detection ─────────────────────────────────────────────────
const systemic = detectRootCauses([
    inv('C-1', '29AAAAA1111A1Z5', [issue('Invoice Number Too Long', { category: 'Invoice Number' })]),
    inv('C-2', '27BBBBB2222B1Z5', [issue('Invoice Number Too Long', { category: 'Invoice Number' })]),
    inv('C-3', '24CCCCC3333C1Z5', [issue('Invoice Number Too Long', { category: 'Invoice Number' })]),
]);
const sys = systemic.find(c => c.scope === 'systemic');
ok('detects a systemic defect across buyers', !!sys, systemic);
ok('systemic counts all invoices', sys?.invoiceCount === 3, sys?.invoiceCount);
ok('systemic has no counterparty key', sys?.key === '', sys?.key);

// ── a counterparty problem must not ALSO be reported as systemic ───────
const notBoth = detectRootCauses([
    inv('D-1', '29AACCM1234C1ZK', [issue('Wrong Tax Type — Line 1')]),
    inv('D-2', '29AACCM1234C1ZK', [issue('Wrong Tax Type — Line 1')]),
    inv('D-3', '29AACCM1234C1ZK', [issue('Wrong Tax Type — Line 1')]),
]);
ok('three invoices, one buyer → counterparty only', notBoth.length === 1 && notBoth[0].scope === 'counterparty',
    notBoth.map(c => c.scope));

// ── B2C invoices have no master record to blame ────────────────────────
const b2c = detectRootCauses([
    inv('E-1', '', [issue('Wrong Tax Type — Line 1')]),
    inv('E-2', '', [issue('Wrong Tax Type — Line 1')]),
]);
ok('no counterparty cause without a buyer GSTIN', b2c.length === 0, b2c);

// ── one invoice, same defect on many lines, is still one invoice ───────
const multiLine = detectRootCauses([
    inv('F-1', '29AACCM1234C1ZK', [
        issue('Wrong Tax Type — Line 1'),
        issue('Wrong Tax Type — Line 2'),
        issue('Wrong Tax Type — Line 3'),
    ]),
]);
ok('multiple lines on one invoice is not a pattern', multiLine.length === 0, multiLine);

// ── ordering: critical before warning ──────────────────────────────────
const ordered = detectRootCauses([
    inv('G-1', '29AAAAA1111A1Z5', [issue('Place of Supply Not Specified', { severity: 'warning', category: 'Place of Supply' })]),
    inv('G-2', '29AAAAA1111A1Z5', [issue('Place of Supply Not Specified', { severity: 'warning', category: 'Place of Supply' })]),
    inv('G-3', '27BBBBB2222B1Z5', [issue('Wrong Tax Type — Line 1')]),
    inv('G-4', '27BBBBB2222B1Z5', [issue('Wrong Tax Type — Line 1')]),
]);
ok('criticals sort ahead of warnings', ordered[0]?.severity === 'critical', ordered.map(c => c.severity));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
