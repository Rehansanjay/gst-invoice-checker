/**
 * True-positive sweep: every invoice below is BROKEN in a specific, named way
 * and must be caught. Guards against the false-positive fixes having made the
 * engine lenient — a tool that says "clean" on a bad invoice is worse than one
 * that cries wolf.
 */
import { validateInvoice } from '../lib/services/validationService';
import { ParsedInvoice, LineItem } from '../types';

const SUP = '27AAPFU0939F1ZV';
const BUY_MH = '27AACCM1234C1ZK';
const BUY_KA = '29AACCM1234C1ZK';

const line = (o: Partial<LineItem>): LineItem => ({
    lineNumber: 1, description: 'Goods', hsnCode: '7307', quantity: 1, rate: 1000,
    taxableAmount: 1000, taxRate: 18, taxType: 'CGST_SGST', cgst: 90, sgst: 90, igst: 0,
    totalAmount: 1180, ...o,
});

const inv = (o: Partial<ParsedInvoice>): ParsedInvoice => ({
    invoiceNumber: 'BAD-1', invoiceDate: '2026-08-01', supplierGSTIN: SUP, buyerGSTIN: BUY_MH,
    lineItems: [line({})], taxableTotalAmount: 1000, totalTaxAmount: 180, invoiceTotalAmount: 1180,
    invoiceType: 'tax_invoice', placeOfSupply: '27', reverseCharge: false, ...o,
});

/** name → invoice, and a substring that must appear in some issue title. */
const cases: { name: string; mustCatch: string; invoice: ParsedInvoice }[] = [
    {
        name: 'IGST charged on intra-state supply',
        mustCatch: 'IGST',
        invoice: inv({
            invoiceNumber: 'B-1', placeOfSupply: '27',
            lineItems: [line({ taxType: 'IGST', cgst: 0, sgst: 0, igst: 180 })],
        }),
    },
    {
        name: 'CGST+SGST charged on inter-state supply',
        mustCatch: 'CGST',
        invoice: inv({ invoiceNumber: 'B-2', buyerGSTIN: BUY_KA, placeOfSupply: '29' }),
    },
    {
        name: 'Invalid GST rate (17%)',
        mustCatch: 'Rate',
        invoice: inv({
            invoiceNumber: 'B-3',
            lineItems: [line({ taxRate: 17, cgst: 85, sgst: 85, totalAmount: 1170 })],
            totalTaxAmount: 170, invoiceTotalAmount: 1170,
        }),
    },
    {
        name: 'HSN code missing',
        mustCatch: 'HSN',
        invoice: inv({ invoiceNumber: 'B-4', lineItems: [line({ hsnCode: '' })] }),
    },
    {
        name: 'Invoice total does not reconcile',
        mustCatch: 'Total',
        invoice: inv({ invoiceNumber: 'B-5', invoiceTotalAmount: 9999 }),
    },
    {
        name: 'Taxable total does not match line items',
        mustCatch: 'Taxable',
        invoice: inv({ invoiceNumber: 'B-6', taxableTotalAmount: 5000 }),
    },
    {
        name: 'Malformed supplier GSTIN',
        mustCatch: 'GSTIN',
        invoice: inv({ invoiceNumber: 'B-7', supplierGSTIN: '27AAPFU0939F1Z' }),
    },
    {
        name: 'Invalid state code in GSTIN (99)',
        mustCatch: 'State Code',
        invoice: inv({ invoiceNumber: 'B-8', supplierGSTIN: '99AAPFU0939F1ZV', placeOfSupply: '99' }),
    },
    {
        name: 'Supplier and buyer GSTIN identical',
        mustCatch: 'GSTIN',
        invoice: inv({ invoiceNumber: 'B-9', buyerGSTIN: SUP }),
    },
    {
        name: 'Invoice number longer than 16 characters',
        mustCatch: 'Invoice Number',
        invoice: inv({ invoiceNumber: 'BRANCH/2026-27/000000123' }),
    },
    {
        name: 'Invoice number with disallowed characters',
        mustCatch: 'Invoice Number',
        invoice: inv({ invoiceNumber: 'INV#2026@1' }),
    },
    {
        name: 'Invoice dated in the future',
        mustCatch: 'Date',
        invoice: inv({ invoiceNumber: 'B-10', invoiceDate: '2027-12-31' }),
    },
    {
        name: 'Place of supply missing',
        mustCatch: 'Place of Supply',
        invoice: inv({ invoiceNumber: 'B-11', placeOfSupply: '' }),
    },
    {
        name: 'RCM flagged but supplier charged tax',
        mustCatch: 'RCM',
        invoice: inv({
            invoiceNumber: 'B-12', reverseCharge: true,
            // Tax explicitly charged on the line despite RCM.
            lineItems: [line({ cgst: 90, sgst: 90 })],
        }),
    },
    {
        name: 'Line tax amounts contradict the stated rate',
        mustCatch: 'Calculation',
        invoice: inv({
            invoiceNumber: 'B-13',
            // 18% of 1000 is 180, but only 50 is charged.
            lineItems: [line({ taxRate: 18, cgst: 25, sgst: 25, totalAmount: 1050 })],
            totalTaxAmount: 50, invoiceTotalAmount: 1050,
        }),
    },
];

(async () => {
    let caught = 0;
    const missed: string[] = [];

    for (const c of cases) {
        const r = await validateInvoice(c.invoice);
        const problems = r.issuesFound.filter((i) => i.severity !== 'info');
        const hit = problems.some(
            (i) => i.title.toLowerCase().includes(c.mustCatch.toLowerCase())
                || i.category.toLowerCase().includes(c.mustCatch.toLowerCase())
        );

        if (hit) {
            caught++;
            console.log(`  CAUGHT  ${c.name}  (score ${r.healthScore}, ${problems.length} issue(s))`);
        } else {
            missed.push(c.name);
            console.log(`  MISSED  ${c.name}  (score ${r.healthScore})`);
            console.log(`          expected an issue matching "${c.mustCatch}"; got: ${problems.map((p) => p.title).join(', ') || 'nothing'}`);
        }
    }

    console.log(`\n${caught}/${cases.length} broken invoices correctly flagged`);
    if (missed.length) console.log(`\nMISSED:\n${missed.map((m) => `  - ${m}`).join('\n')}`);
})();
