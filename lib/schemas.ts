/**
 * lib/schemas.ts
 * ─────────────────────────────────────────────────────────────────────
 * Shared Zod schemas for API input validation.
 * Centralised here so every route uses the same strict definitions.
 */
import { z } from 'zod';

// ── Line Item Schema ─────────────────────────────────────────────────
// Matches the TypeScript LineItem interface in types/index.ts
export const lineItemSchema = z.object({
    lineNumber: z.number().int().min(0).max(9999).optional(),
    description: z.string().max(500).optional().default(''),
    hsnCode: z.string().max(8).optional().default(''),
    quantity: z.number().min(0).max(999999999).optional().default(0),
    rate: z.number().min(0).max(999999999).optional().default(0),
    taxableAmount: z.number().min(0).max(999999999).optional().default(0),
    taxRate: z.number().min(0).max(100).optional().default(0),
    taxType: z.enum(['CGST_SGST', 'IGST']).optional(),
    cgst: z.number().min(0).max(999999999).optional().default(0),
    sgst: z.number().min(0).max(999999999).optional().default(0),
    igst: z.number().min(0).max(999999999).optional().default(0),
    totalAmount: z.number().min(0).max(999999999).optional().default(0),
}).passthrough();  // Allow extra fields but validate known ones

// Cap at 500 line items to prevent payload abuse
export const lineItemsSchema = z.array(lineItemSchema).max(500);

// ── Invoice Data Schema (shared across preview-check, quick-check, validate) ──
export const invoiceDataSchema = z.object({
    invoiceNumber: z.string().min(1).max(100),
    invoiceDate: z.string().max(20),
    supplierGSTIN: z.string().length(15),
    buyerGSTIN: z.string().length(15).optional().or(z.literal('')).nullable(),
    lineItems: lineItemsSchema,
    taxableTotalAmount: z.number().min(0).max(999999999999),
    totalTaxAmount: z.number().min(0).max(999999999999),
    invoiceTotalAmount: z.number().min(0).max(999999999999),

    // ── Compliance fields ────────────────────────────────────────────
    // InvoiceForm collects all three, but z.object() strips unknown keys,
    // so omitting them here silently dropped them before validation ran:
    // every invoice reported "Place of Supply Not Specified" even when the
    // user had filled it in, the bill-of-supply / export branches of the
    // invoice-type rule were unreachable, and the reverse-charge rule never
    // fired. See placeOfSupplyRule / invoiceTypeRule / reverseChargeRule.
    invoiceType: z
        .enum(['tax_invoice', 'bill_of_supply', 'credit_note', 'debit_note', 'export_invoice'])
        .optional(),
    placeOfSupply: z.string().max(2).optional().or(z.literal('')),
    reverseCharge: z.boolean().optional(),
});
