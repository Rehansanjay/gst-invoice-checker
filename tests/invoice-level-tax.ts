/**
 * Invoice-level tax rounding (RULE_INVOICE_LEVEL_TAX).
 *
 * Raised by a practitioner: GSTN computes tax on taxable value aggregated per
 * rate slab, so software that rounds each line and sums the results produces a
 * total the portal rejects — while every individual line checks out.
 *
 * The risk in adding this rule is double-reporting. If a line is itself wrong,
 * the slab total is wrong too, and both rules would fire for one defect. That
 * case is pinned below.
 */
import { validateInvoice } from '../lib/services/validationService';
import { ParsedInvoice, LineItem } from '../types';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra ?? ''); }
};

const line = (o: Partial<LineItem>): LineItem => ({
    lineNumber: 1, description: 'Item', hsnCode: '7307', quantity: 1, rate: 100,
    taxableAmount: 100, taxRate: 18, taxType: 'CGST_SGST', cgst: 9, sgst: 9, igst: 0,
    totalAmount: 118, ...o,
});

const inv = (o: Partial<ParsedInvoice>): ParsedInvoice => ({
    invoiceNumber: 'R-1', invoiceDate: '2026-08-01',
    supplierGSTIN: '27AAPFU0939F1ZV', buyerGSTIN: '27AACCM1234C1ZK',
    lineItems: [], taxableTotalAmount: 0, totalTaxAmount: 0, invoiceTotalAmount: 0,
    invoiceType: 'tax_invoice', placeOfSupply: '27', reverseCharge: false, ...o,
});

const has = (r: { issuesFound: { ruleId: string }[] }) =>
    r.issuesFound.some(i => i.ruleId === 'RULE_INVOICE_LEVEL_TAX');
const hasLineLevel = (r: { issuesFound: { ruleId: string }[] }) =>
    r.issuesFound.some(i => i.ruleId === 'RULE_GST_CALCULATION');

(async () => {
    // ── The gap the practitioner described ─────────────────────────────
    // 6 lines, taxable 47.22 at 18%. Per line: 47.22 × 18% = 8.4996, declared
    // 8 — drift 0.4996, inside the ₹1 line tolerance, so every line passes.
    // Aggregate: 283.32 × 18% = 50.9976 ≈ 51.00, declared 48. Off by ₹3.
    const drift = await validateInvoice(inv({
        invoiceNumber: 'R-DRIFT',
        lineItems: Array.from({ length: 6 }, (_, i) =>
            line({ lineNumber: i + 1, quantity: 1, rate: 47.22, taxableAmount: 47.22, cgst: 4, sgst: 4, totalAmount: 55.22 })),
        taxableTotalAmount: 283.32, totalTaxAmount: 48, invoiceTotalAmount: 331.32,
    }));
    ok('flags a slab total that drifts from per-line rounding', has(drift),
        drift.issuesFound.map(i => i.title));
    ok('and the line-level rule stays quiet on it', !hasLineLevel(drift),
        drift.issuesFound.map(i => i.ruleId));

    // ── Correct invoice: rounded once at slab level ────────────────────
    const clean = await validateInvoice(inv({
        invoiceNumber: 'R-OK',
        lineItems: [
            line({ lineNumber: 1, quantity: 1, rate: 1000, taxableAmount: 1000, cgst: 90, sgst: 90, totalAmount: 1180 }),
            line({ lineNumber: 2, quantity: 1, rate: 2000, taxableAmount: 2000, cgst: 180, sgst: 180, totalAmount: 2360 }),
        ],
        taxableTotalAmount: 3000, totalTaxAmount: 540, invoiceTotalAmount: 3540,
    }));
    ok('silent on a correctly computed invoice', !has(clean), clean.issuesFound.map(i => i.title));

    // ── No double-reporting when a line is itself wrong ────────────────
    // Line 1 declares 20 against an expected 180 — the line rule owns this.
    const lineWrong = await validateInvoice(inv({
        invoiceNumber: 'R-LINE',
        lineItems: [
            line({ lineNumber: 1, quantity: 1, rate: 1000, taxableAmount: 1000, cgst: 10, sgst: 10, totalAmount: 1020 }),
            line({ lineNumber: 2, quantity: 1, rate: 1000, taxableAmount: 1000, cgst: 90, sgst: 90, totalAmount: 1180 }),
        ],
        taxableTotalAmount: 2000, totalTaxAmount: 200, invoiceTotalAmount: 2200,
    }));
    ok('line-level rule fires on a genuinely wrong line', hasLineLevel(lineWrong));
    ok('invoice-level rule does NOT also fire — one defect, one finding', !has(lineWrong),
        lineWrong.issuesFound.map(i => i.ruleId));

    // ── Per-slab, not per-invoice ──────────────────────────────────────
    // 5% slab is correct; the 18% slab drifts. Only the 18% one should fire.
    const mixed = await validateInvoice(inv({
        invoiceNumber: 'R-MIX',
        lineItems: [
            line({ lineNumber: 1, quantity: 1, rate: 1000, taxableAmount: 1000, taxRate: 5, cgst: 25, sgst: 25, totalAmount: 1050 }),
            line({ lineNumber: 2, quantity: 1, rate: 1000, taxableAmount: 1000, taxRate: 5, cgst: 25, sgst: 25, totalAmount: 1050 }),
            ...Array.from({ length: 6 }, (_, i) =>
                line({ lineNumber: i + 3, quantity: 1, rate: 47.22, taxableAmount: 47.22, taxRate: 18, cgst: 4, sgst: 4, totalAmount: 55.22 })),
        ],
        taxableTotalAmount: 2283.32, totalTaxAmount: 148, invoiceTotalAmount: 2431.32,
    }));
    const slabIssues = mixed.issuesFound.filter(i => i.ruleId === 'RULE_INVOICE_LEVEL_TAX');
    ok('reports only the drifting slab', slabIssues.length === 1, slabIssues.map(i => i.title));
    ok('names the 18% slab', slabIssues[0]?.title.includes('18%'), slabIssues[0]?.title);

    // ── Reverse charge: supplier collects nothing, nothing to reconcile ─
    const rcm = await validateInvoice(inv({
        invoiceNumber: 'R-RCM', reverseCharge: true,
        lineItems: Array.from({ length: 6 }, (_, i) =>
            line({ lineNumber: i + 1, quantity: 1, rate: 47.22, taxableAmount: 47.22, cgst: 0, sgst: 0, totalAmount: 47.22 })),
        taxableTotalAmount: 283.32, totalTaxAmount: 0, invoiceTotalAmount: 283.32,
    }));
    ok('skips reverse-charge invoices', !has(rcm), rcm.issuesFound.map(i => i.title));

    // ── A single-line invoice cannot have cross-line drift ─────────────
    const single = await validateInvoice(inv({
        invoiceNumber: 'R-ONE',
        lineItems: [line({ quantity: 1, rate: 47.22, taxableAmount: 47.22, cgst: 4, sgst: 4, totalAmount: 55.22 })],
        taxableTotalAmount: 47.22, totalTaxAmount: 8, invoiceTotalAmount: 55.22,
    }));
    ok('silent on a single-line invoice', !has(single), single.issuesFound.map(i => i.title));

    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail === 0 ? 0 : 1);
})();
