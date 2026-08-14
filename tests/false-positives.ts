/**
 * False-positive sweep: every invoice below is CORRECT and should produce zero
 * issues. Anything that fires here is the engine crying wolf on valid data —
 * the failure mode that ends a CA demo in the first five minutes.
 */
import { validateInvoice } from '../lib/services/validationService';
import { ParsedInvoice, LineItem } from '../types';

const SUP = '27AAPFU0939F1ZV'; // Maharashtra
const BUY_MH = '27AACCM1234C1ZK'; // Maharashtra
const BUY_KA = '29AACCM1234C1ZK'; // Karnataka

const line = (o: Partial<LineItem>): LineItem => ({
    lineNumber: 1, description: 'Goods', hsnCode: '7307', quantity: 1, rate: 1000,
    taxableAmount: 1000, taxRate: 18, taxType: 'CGST_SGST', cgst: 90, sgst: 90, igst: 0,
    totalAmount: 1180, ...o,
});

const inv = (o: Partial<ParsedInvoice>): ParsedInvoice => ({
    invoiceNumber: 'INV-1', invoiceDate: '2026-08-01', supplierGSTIN: SUP, buyerGSTIN: BUY_MH,
    lineItems: [line({})], taxableTotalAmount: 1000, totalTaxAmount: 180, invoiceTotalAmount: 1180,
    invoiceType: 'tax_invoice', placeOfSupply: '27', reverseCharge: false, ...o,
});

const cases: { name: string; invoice: ParsedInvoice }[] = [
    {
        name: 'Intra-state, single line, 18%',
        invoice: inv({ invoiceNumber: 'A-1' }),
    },
    {
        name: 'Inter-state, single line, 18% IGST',
        invoice: inv({
            invoiceNumber: 'A-2', buyerGSTIN: BUY_KA, placeOfSupply: '29',
            lineItems: [line({ taxType: 'IGST', cgst: 0, sgst: 0, igst: 180 })],
        }),
    },
    {
        name: 'B2C — unregistered buyer, no buyer GSTIN',
        invoice: inv({ invoiceNumber: 'A-3', buyerGSTIN: '' }),
    },
    {
        name: 'Multi-rate intra-state (5% + 12% + 18%)',
        invoice: inv({
            invoiceNumber: 'A-4',
            // quantity × rate must equal taxableAmount — the normalizer derives
            // taxableAmount from qty × rate, so inconsistent test data produces
            // a mismatch that is the fixture's fault, not the engine's.
            lineItems: [
                line({ lineNumber: 1, quantity: 1, rate: 1000, taxableAmount: 1000, taxRate: 5, cgst: 25, sgst: 25, totalAmount: 1050 }),
                line({ lineNumber: 2, quantity: 2, rate: 1000, taxableAmount: 2000, taxRate: 12, cgst: 120, sgst: 120, totalAmount: 2240, hsnCode: '7318' }),
                line({ lineNumber: 3, quantity: 3, rate: 1000, taxableAmount: 3000, taxRate: 18, cgst: 270, sgst: 270, totalAmount: 3540, hsnCode: '8481' }),
            ],
            taxableTotalAmount: 6000, totalTaxAmount: 830, invoiceTotalAmount: 6830,
        }),
    },
    {
        name: 'Rounding edge — taxable 333.33 at 18%',
        invoice: inv({
            invoiceNumber: 'A-5',
            lineItems: [line({ quantity: 1, rate: 333.33, taxableAmount: 333.33, cgst: 30, sgst: 30, totalAmount: 393.33 })],
            taxableTotalAmount: 333.33, totalTaxAmount: 60, invoiceTotalAmount: 393.33,
        }),
    },
    {
        name: 'Export invoice — zero-rated, no buyer GSTIN',
        invoice: inv({
            invoiceNumber: 'A-6', invoiceType: 'export_invoice', buyerGSTIN: '', placeOfSupply: '97',
            lineItems: [line({ taxType: 'IGST', taxRate: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 1000 })],
            taxableTotalAmount: 1000, totalTaxAmount: 0, invoiceTotalAmount: 1000,
        }),
    },
    {
        name: 'Reverse charge — tax payable by recipient',
        invoice: inv({
            invoiceNumber: 'A-7', reverseCharge: true,
            lineItems: [line({ taxRate: 18, cgst: 0, sgst: 0, igst: 0, totalAmount: 1000 })],
            taxableTotalAmount: 1000, totalTaxAmount: 0, invoiceTotalAmount: 1000,
        }),
    },
    {
        name: 'Bill of supply — composition dealer, no tax',
        invoice: inv({
            invoiceNumber: 'A-8', invoiceType: 'bill_of_supply',
            lineItems: [line({ taxRate: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 1000 })],
            taxableTotalAmount: 1000, totalTaxAmount: 0, invoiceTotalAmount: 1000,
        }),
    },
    {
        name: 'Nil-rated goods at 0%',
        invoice: inv({
            invoiceNumber: 'A-9',
            lineItems: [line({ taxRate: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 1000, hsnCode: '0401' })],
            taxableTotalAmount: 1000, totalTaxAmount: 0, invoiceTotalAmount: 1000,
        }),
    },
    {
        name: 'Gold at 3%',
        invoice: inv({
            invoiceNumber: 'A-10',
            lineItems: [line({ taxRate: 3, cgst: 15, sgst: 15, totalAmount: 1030, hsnCode: '7108' })],
            taxableTotalAmount: 1000, totalTaxAmount: 30, invoiceTotalAmount: 1030,
        }),
    },
    {
        name: 'Rough diamonds at 0.25%',
        invoice: inv({
            invoiceNumber: 'A-11',
            lineItems: [line({ taxableAmount: 10000, rate: 10000, taxRate: 0.25, cgst: 12.5, sgst: 12.5, totalAmount: 10025, hsnCode: '7102' })],
            taxableTotalAmount: 10000, totalTaxAmount: 25, invoiceTotalAmount: 10025,
        }),
    },
    {
        name: '28% luxury rate, inter-state',
        invoice: inv({
            invoiceNumber: 'A-12', buyerGSTIN: BUY_KA, placeOfSupply: '29',
            lineItems: [line({ taxType: 'IGST', taxRate: 28, cgst: 0, sgst: 0, igst: 280, totalAmount: 1280, hsnCode: '8703' })],
            taxableTotalAmount: 1000, totalTaxAmount: 280, invoiceTotalAmount: 1280,
        }),
    },
    {
        name: '10 lines, per-line rounding accumulation',
        invoice: (() => {
            const lines = Array.from({ length: 10 }, (_, i) =>
                line({ lineNumber: i + 1, quantity: 3, rate: 111.11, taxableAmount: 333.33, cgst: 30, sgst: 30, totalAmount: 393.33 })
            );
            return inv({
                invoiceNumber: 'A-13', lineItems: lines,
                taxableTotalAmount: 3333.3, totalTaxAmount: 600, invoiceTotalAmount: 3933.3,
            });
        })(),
    },
    {
        name: 'Credit note',
        invoice: inv({
            invoiceNumber: 'CN-1', invoiceType: 'credit_note',
            lineItems: [line({ taxableAmount: 500, rate: 500, cgst: 45, sgst: 45, totalAmount: 590 })],
            taxableTotalAmount: 500, totalTaxAmount: 90, invoiceTotalAmount: 590,
        }),
    },
    {
        name: 'Invoice dated 8 months ago (within the year)',
        invoice: inv({ invoiceNumber: 'A-14', invoiceDate: '2025-12-15' }),
    },
    {
        name: 'Invoice number with a slash',
        invoice: inv({ invoiceNumber: 'INV/2026-27/0001' }),
    },
    {
        name: '8-digit HSN code',
        invoice: inv({ invoiceNumber: 'A-15', lineItems: [line({ hsnCode: '73071100' })] }),
    },
    {
        name: 'Union territory supply (Chandigarh, intra-UT)',
        invoice: inv({
            invoiceNumber: 'A-16', supplierGSTIN: '04AAPFU0939F1ZV', buyerGSTIN: '04AACCM1234C1ZK',
            placeOfSupply: '04',
        }),
    },
];

(async () => {
    let clean = 0;
    const failures: string[] = [];

    for (const c of cases) {
        const r = await validateInvoice(c.invoice);
        // Info-level notes are commentary, not defects — an RCM invoice carries
        // one by design. Only critical/warning findings are false positives.
        const problems = r.issuesFound.filter((i) => i.severity !== 'info');
        const notes = r.issuesFound.filter((i) => i.severity === 'info');

        if (problems.length === 0) {
            clean++;
            const suffix = notes.length ? `  [+${notes.length} info: ${notes.map((n) => n.title).join(', ')}]` : '';
            console.log(`  OK    ${c.name}  (score ${r.healthScore})${suffix}`);
        } else {
            failures.push(c.name);
            console.log(`  FALSE POSITIVE  ${c.name}  (score ${r.healthScore})`);
            for (const i of problems) {
                console.log(`         [${i.severity}] ${i.title} — ${i.description}`);
            }
        }
    }

    console.log(`\n${clean}/${cases.length} correct invoices came back clean`);
    if (failures.length) {
        console.log(`\nFalse positives on:\n${failures.map((f) => `  - ${f}`).join('\n')}`);
    }
})();
