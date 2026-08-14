/**
 * lib/services/bulkParse.ts
 * ─────────────────────────────────────────────────────────────────────
 * CSV → ParsedInvoice[] for bulk (multi-invoice) validation.
 *
 * Shape: ONE ROW PER LINE ITEM, with invoice-level fields repeated on every
 * row of that invoice. Rows are grouped by invoice_number. This mirrors how
 * GSTR-1 B2B exports and Tally line-item exports are already laid out, so a
 * practitioner can export and upload without reshaping anything.
 */
import { ParsedInvoice, LineItem, InvoiceType } from '@/types';

export interface BulkRowError {
    /** 1-based row number as it appears in the file, header included. */
    row: number;
    message: string;
}

export interface BulkParseOutput {
    invoices: ParsedInvoice[];
    rowErrors: BulkRowError[];
    /** Invoices dropped because the batch exceeded the cap. */
    droppedForLimit: number;
}

/**
 * Accepted header spellings. Practitioners export from Tally, Zoho, Busy and
 * the GST portal, none of which agree on naming, so match generously rather
 * than rejecting a file over a header we could have understood.
 */
const COLUMN_ALIASES: Record<string, string[]> = {
    invoiceNumber: ['invoice_number', 'invoice no', 'invoice_no', 'invoiceno', 'inv no', 'invoice number', 'bill no', 'document number'],
    invoiceDate: ['invoice_date', 'invoice date', 'date', 'inv date', 'document date'],
    supplierGSTIN: ['supplier_gstin', 'supplier gstin', 'seller gstin', 'gstin of supplier', 'from gstin', 'our gstin'],
    buyerGSTIN: ['buyer_gstin', 'buyer gstin', 'recipient gstin', 'gstin of recipient', 'customer gstin', 'to gstin', 'gstin/uin of recipient'],
    placeOfSupply: ['place_of_supply', 'place of supply', 'pos', 'pos code', 'state code'],
    invoiceType: ['invoice_type', 'invoice type', 'document type', 'type'],
    reverseCharge: ['reverse_charge', 'reverse charge', 'rcm', 'is rcm'],
    description: ['line_description', 'description', 'item', 'item name', 'particulars', 'product'],
    hsnCode: ['hsn_code', 'hsn', 'hsn/sac', 'hsn code', 'sac'],
    quantity: ['quantity', 'qty'],
    rate: ['rate', 'unit price', 'price'],
    taxableAmount: ['taxable_amount', 'taxable value', 'taxable amount', 'assessable value'],
    taxRate: ['tax_rate', 'tax rate', 'gst rate', 'rate %', 'gst %'],
    taxType: ['tax_type', 'tax type'],
    cgst: ['cgst', 'cgst amount', 'central tax'],
    sgst: ['sgst', 'sgst amount', 'state tax', 'utgst'],
    igst: ['igst', 'igst amount', 'integrated tax'],
    lineTotal: ['line_total', 'line total', 'total', 'amount', 'total amount'],
    // Optional: the invoice's own stated totals. Supplying these lets the
    // engine reconcile them against the line items — omit them and we compute
    // the totals ourselves, which makes that particular check tautological.
    invoiceTaxableTotal: ['invoice_taxable_total', 'invoice taxable total', 'total taxable value'],
    invoiceTaxTotal: ['invoice_tax_total', 'invoice tax total', 'total tax'],
    invoiceTotal: ['invoice_total', 'invoice total', 'invoice value', 'grand total'],
};

/** Minimal RFC 4180 parser: handles quoted fields, embedded commas/newlines and "" escapes. */
export function parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    // Strip BOM — Excel writes one and it corrupts the first header.
    const src = text.replace(/^﻿/, '');

    for (let i = 0; i < src.length; i++) {
        const ch = src[i];

        if (inQuotes) {
            if (ch === '"') {
                if (src[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
            continue;
        }

        if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            row.push(field);
            field = '';
        } else if (ch === '\n' || ch === '\r') {
            // Swallow \r\n as one break.
            if (ch === '\r' && src[i + 1] === '\n') i++;
            row.push(field);
            field = '';
            rows.push(row);
            row = [];
        } else {
            field += ch;
        }
    }

    // Final field/row if the file does not end with a newline.
    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    // Drop entirely blank rows — trailing newlines are extremely common.
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Maps the header row to our canonical field names. */
function mapHeaders(header: string[]): Record<string, number> {
    const normalised = header.map((h) => h.trim().toLowerCase().replace(/\s+/g, ' '));
    const map: Record<string, number> = {};

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
        const idx = normalised.findIndex((h) => aliases.includes(h));
        if (idx !== -1) map[field] = idx;
    }
    return map;
}

function cell(row: string[], idx: number | undefined): string {
    if (idx === undefined) return '';
    return (row[idx] ?? '').trim();
}

/** Tolerates "1,234.50", "₹1234", "18%" and blanks. */
function num(row: string[], idx: number | undefined): number {
    const raw = cell(row, idx).replace(/[₹,\s%]/g, '');
    if (raw === '') return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
}

const INVOICE_TYPES: InvoiceType[] = [
    'tax_invoice', 'bill_of_supply', 'credit_note', 'debit_note', 'export_invoice',
];

function parseInvoiceType(raw: string): InvoiceType | undefined {
    if (!raw) return undefined;
    const key = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
    return INVOICE_TYPES.find((t) => t === key);
}

function parseBool(raw: string): boolean {
    return ['y', 'yes', 'true', '1'].includes(raw.trim().toLowerCase());
}

/**
 * Converts CSV text into invoices. Row-level problems are collected rather
 * than thrown — one malformed row in a 200-row export must not cost the
 * practitioner the other 199.
 */
export function parseBulkCSV(text: string, maxInvoices: number): BulkParseOutput {
    const rows = parseCSV(text);
    const rowErrors: BulkRowError[] = [];

    if (rows.length === 0) {
        return { invoices: [], rowErrors: [{ row: 0, message: 'The file is empty.' }], droppedForLimit: 0 };
    }

    const cols = mapHeaders(rows[0]);

    const required = ['invoiceNumber', 'invoiceDate', 'supplierGSTIN'] as const;
    const missing = required.filter((r) => cols[r] === undefined);
    if (missing.length > 0) {
        // Report the CSV header the user has to add, not our internal field
        // name — "invoiceNumber" is not something they can act on.
        const asColumns = missing.map((m) => COLUMN_ALIASES[m][0]).join(', ');
        return {
            invoices: [],
            rowErrors: [{
                row: 1,
                message: `Missing required column(s): ${asColumns}. Download the template for the expected format.`,
            }],
            droppedForLimit: 0,
        };
    }

    // Preserve first-seen order so the report matches the practitioner's file.
    const grouped = new Map<string, { invoice: ParsedInvoice; statedTotals: boolean }>();

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const fileRow = i + 1; // 1-based, header counted

        const invoiceNumber = cell(row, cols.invoiceNumber);
        if (!invoiceNumber) {
            rowErrors.push({ row: fileRow, message: 'Missing invoice number — row skipped.' });
            continue;
        }

        const supplierGSTIN = cell(row, cols.supplierGSTIN).toUpperCase();
        if (!supplierGSTIN) {
            rowErrors.push({ row: fileRow, message: `Invoice ${invoiceNumber}: missing supplier GSTIN — row skipped.` });
            continue;
        }

        let entry = grouped.get(invoiceNumber);

        if (!entry) {
            if (grouped.size >= maxInvoices) {
                continue; // counted as dropped below
            }

            const statedTaxable = cols.invoiceTaxableTotal !== undefined && cell(row, cols.invoiceTaxableTotal) !== '';
            const statedTotal = cols.invoiceTotal !== undefined && cell(row, cols.invoiceTotal) !== '';

            entry = {
                statedTotals: statedTaxable || statedTotal,
                invoice: {
                    invoiceNumber,
                    invoiceDate: cell(row, cols.invoiceDate),
                    supplierGSTIN,
                    buyerGSTIN: cell(row, cols.buyerGSTIN).toUpperCase(),
                    lineItems: [],
                    taxableTotalAmount: num(row, cols.invoiceTaxableTotal),
                    totalTaxAmount: num(row, cols.invoiceTaxTotal),
                    invoiceTotalAmount: num(row, cols.invoiceTotal),
                    invoiceType: parseInvoiceType(cell(row, cols.invoiceType)) ?? 'tax_invoice',
                    placeOfSupply: cell(row, cols.placeOfSupply).padStart(2, '0').slice(0, 2),
                    reverseCharge: parseBool(cell(row, cols.reverseCharge)),
                },
            };
            grouped.set(invoiceNumber, entry);
        }

        const cgst = num(row, cols.cgst);
        const sgst = num(row, cols.sgst);
        const igst = num(row, cols.igst);

        const explicitType = cell(row, cols.taxType).toUpperCase().replace(/[^A-Z]/g, '');
        const taxType: LineItem['taxType'] =
            explicitType === 'IGST' ? 'IGST'
                : explicitType.includes('CGST') ? 'CGST_SGST'
                    // Fall back to whichever heads actually carry an amount.
                    : igst > 0 ? 'IGST' : 'CGST_SGST';

        const line: LineItem = {
            lineNumber: entry.invoice.lineItems.length + 1,
            description: cell(row, cols.description),
            hsnCode: cell(row, cols.hsnCode),
            quantity: num(row, cols.quantity),
            rate: num(row, cols.rate),
            taxableAmount: num(row, cols.taxableAmount),
            taxRate: num(row, cols.taxRate),
            taxType,
            cgst,
            sgst,
            igst,
            totalAmount: num(row, cols.lineTotal),
        };

        entry.invoice.lineItems.push(line);
    }

    // Count invoices that never got created because of the cap.
    const distinctInFile = new Set<string>();
    for (let i = 1; i < rows.length; i++) {
        const n = cell(rows[i], cols.invoiceNumber);
        if (n) distinctInFile.add(n);
    }
    const droppedForLimit = Math.max(0, distinctInFile.size - grouped.size);

    // Derive any totals the file did not state, so downstream validation has
    // complete invoices to work with.
    const invoices = [...grouped.values()].map(({ invoice }) => {
        const sumTaxable = invoice.lineItems.reduce((s, l) => s + l.taxableAmount, 0);
        const sumTax = invoice.lineItems.reduce((s, l) => s + l.cgst + l.sgst + l.igst, 0);

        if (invoice.taxableTotalAmount === 0) invoice.taxableTotalAmount = round2(sumTaxable);
        if (invoice.totalTaxAmount === 0) invoice.totalTaxAmount = round2(sumTax);
        if (invoice.invoiceTotalAmount === 0) {
            invoice.invoiceTotalAmount = round2(invoice.taxableTotalAmount + invoice.totalTaxAmount);
        }
        return invoice;
    });

    return { invoices, rowErrors, droppedForLimit };
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

/** The template offered for download — headers plus one worked example row. */
export const CSV_TEMPLATE = [
    'invoice_number,invoice_date,supplier_gstin,buyer_gstin,place_of_supply,invoice_type,reverse_charge,line_description,hsn_code,quantity,rate,taxable_amount,tax_rate,tax_type,cgst,sgst,igst,line_total,invoice_taxable_total,invoice_tax_total,invoice_total',
    'INV-001,2026-08-01,27AAPFU0939F1ZV,27AACCM1234C1ZK,27,tax_invoice,N,Steel fittings,7307,10,1000,10000,18,CGST_SGST,900,900,0,11800,10000,1800,11800',
    'INV-001,2026-08-01,27AAPFU0939F1ZV,27AACCM1234C1ZK,27,tax_invoice,N,Freight,9965,1,500,500,18,CGST_SGST,45,45,0,590,10000,1800,11800',
    'INV-002,2026-08-02,27AAPFU0939F1ZV,29AACCM1234C1ZK,29,tax_invoice,N,Steel fittings,7307,5,1000,5000,18,IGST,0,0,900,5900,5000,900,5900',
].join('\n');
