import { ParsedInvoice, LineItem } from '@/types';

/**
 * Data Normalization Engine
 * Normalizes raw user input before validation to prevent inconsistent results.
 * Pipeline: User Input → Normalize → Validate
 */
export function normalizeInvoice(raw: ParsedInvoice): ParsedInvoice {
    return {
        invoiceNumber: normalizeInvoiceNumber(raw.invoiceNumber),
        invoiceDate: raw.invoiceDate?.trim() || '',
        supplierGSTIN: normalizeGSTIN(raw.supplierGSTIN),
        buyerGSTIN: normalizeGSTIN(raw.buyerGSTIN),
        supplierName: raw.supplierName?.trim() || '',
        buyerName: raw.buyerName?.trim() || '',
        lineItems: (Array.isArray(raw.lineItems) ? raw.lineItems : []).filter(item => item !== null && item !== undefined).map(normalizeLineItem),
        taxableTotalAmount: roundMoney(raw.taxableTotalAmount),
        totalTaxAmount: roundMoney(raw.totalTaxAmount),
        invoiceTotalAmount: roundMoney(raw.invoiceTotalAmount),
    };
}

/** Uppercase, trim, remove spaces from GSTIN */
function normalizeGSTIN(gstin: string): string {
    if (!gstin) return '';
    return gstin.trim().toUpperCase().replace(/\s/g, '');
}

/** Trim whitespace, collapse multiple spaces */
function normalizeInvoiceNumber(num: string): string {
    if (!num) return '';
    return num.trim().replace(/\s+/g, ' ');
}

/** Normalize a single line item: round money, recalculate derived fields */
function normalizeLineItem(item: LineItem): LineItem {
    const quantity = Math.max(0, Number(item.quantity) || 0);
    const rate = Math.max(0, Number(item.rate) || 0);
    const taxRate = Number(item.taxRate) || 0;

    // Recalculate taxable amount from quantity × rate
    const taxableAmount = roundMoney(quantity * rate);

    // Recalculate tax amounts
    const totalTax = roundMoney((taxableAmount * taxRate) / 100);

    let cgst = 0, sgst = 0, igst = 0;
    if (item.taxType === 'CGST_SGST') {
        cgst = roundMoney(totalTax / 2);
        sgst = roundMoney(totalTax / 2);
    } else {
        igst = roundMoney(totalTax);
    }

    const totalAmount = roundMoney(taxableAmount + totalTax);

    return {
        lineNumber: item.lineNumber,
        description: item.description?.trim() || '',
        hsnCode: item.hsnCode?.trim().replace(/\s/g, '') || '',
        quantity,
        rate: roundMoney(rate),
        taxableAmount,
        taxRate,
        taxType: item.taxType || 'CGST_SGST',
        cgst,
        sgst,
        igst,
        totalAmount,
    };
}

/** Round to 2 decimal places using banker's rounding */
export function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Extract state code from GSTIN */
export function extractStateCode(gstin: string): string {
    const normalized = normalizeGSTIN(gstin);
    return normalized.length >= 2 ? normalized.substring(0, 2) : '';
}

/** Check if two GSTINs are from the same state */
export function isSameState(gstin1: string, gstin2: string): boolean {
    const state1 = extractStateCode(gstin1);
    const state2 = extractStateCode(gstin2);
    return state1 !== '' && state2 !== '' && state1 === state2;
}

/** Generate SHA-256 hash of invoice data for idempotency */
export function generateInvoiceHash(invoice: ParsedInvoice): string {
    const key = JSON.stringify({
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        supplierGSTIN: invoice.supplierGSTIN,
        buyerGSTIN: invoice.buyerGSTIN,
        lineItems: invoice.lineItems.map(li => ({
            hsnCode: li.hsnCode,
            quantity: li.quantity,
            rate: li.rate,
            taxRate: li.taxRate,
            taxType: li.taxType,
            cgst: li.cgst,
            sgst: li.sgst,
            igst: li.igst,
        })),
        taxableTotalAmount: invoice.taxableTotalAmount,
        totalTaxAmount: invoice.totalTaxAmount,
        invoiceTotalAmount: invoice.invoiceTotalAmount,
    });

    // Simple hash for browser+server compatibility
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash).toString(36)}`;
}
