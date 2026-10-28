import { ParsedInvoice } from '@/types';

// A faulty interstate invoice for the homepage's "test with a sample" button.
// Maharashtra supplier, Karnataka buyer, but billed as CGST+SGST instead of
// IGST — the single most common error in RULE_TAX_TYPE, and the one most
// casual visitors are looking to catch. No placeOfSupply set, so the rule's
// GSTIN-state fallback is what fires.
export const SAMPLE_INVOICE: ParsedInvoice = {
    invoiceNumber: 'INV-2026-0847',
    invoiceDate: '2026-10-15',
    supplierGSTIN: '27AAPFU0939F1ZV',
    buyerGSTIN: '29AACCM1234C1ZY',
    supplierName: 'Sample Traders Pvt Ltd',
    buyerName: 'Sample Buyer Enterprises',
    lineItems: [
        {
            lineNumber: 1,
            description: 'Industrial steel fittings',
            hsnCode: '7307',
            quantity: 100,
            rate: 14800,
            taxableAmount: 1480000,
            taxRate: 18,
            taxType: 'CGST_SGST',
            cgst: 133200,
            sgst: 133200,
            igst: 0,
            totalAmount: 1746400,
        },
    ],
    taxableTotalAmount: 1480000,
    totalTaxAmount: 266400,
    invoiceTotalAmount: 1746400,
    invoiceType: 'tax_invoice',
};
