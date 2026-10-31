/**
 * lib/invoiceExport.ts
 * ─────────────────────────────────────────────────────────────────────
 * Client-side export of a validated invoice into formats a CA/accounts
 * team can drop straight into their existing workflow instead of
 * re-typing the invoice: a Tally Prime "Purchase" voucher XML, and a
 * flat Purchase Register CSV. Both are generated from data already on
 * screen — no server round-trip, no new API route.
 */
import { ParsedInvoice, ValidationResult } from '@/types';

function xmlEscape(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function tallyDate(isoDate: string): string {
    // Tally's XML import expects YYYYMMDD, not ISO.
    const digits = isoDate.replace(/[^0-9]/g, '');
    return digits.length === 8 ? digits : digits.slice(0, 8);
}

/**
 * Best-effort Tally Prime "Purchase" voucher, one ledger entry per line item
 * plus one per tax type actually used on the invoice. Field names follow
 * Tally's documented XML import structure, but every Tally install has its
 * own ledger/stock-item names — this is a starting point to import and
 * remap, not a guaranteed drop-in.
 */
export function buildTallyPurchaseXml(invoice: ParsedInvoice): string {
    const supplier = invoice.supplierName || invoice.supplierGSTIN;
    const totalCgst = invoice.lineItems.reduce((sum, i) => sum + i.cgst, 0);
    const totalSgst = invoice.lineItems.reduce((sum, i) => sum + i.sgst, 0);
    const totalIgst = invoice.lineItems.reduce((sum, i) => sum + i.igst, 0);

    const itemEntries = invoice.lineItems.map((item) => `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${xmlEscape(item.description || 'Purchase')}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${item.taxableAmount.toFixed(2)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`).join('');

    const taxEntries = [
        totalCgst > 0 ? { name: 'CGST', amount: totalCgst } : null,
        totalSgst > 0 ? { name: 'SGST', amount: totalSgst } : null,
        totalIgst > 0 ? { name: 'IGST', amount: totalIgst } : null,
    ].filter((t): t is { name: string; amount: number } => t !== null)
        .map((t) => `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${t.name}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${t.amount.toFixed(2)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`).join('');

    const partyEntry = `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${xmlEscape(supplier)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${invoice.invoiceTotalAmount.toFixed(2)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Purchase" ACTION="Create">
            <DATE>${tallyDate(invoice.invoiceDate)}</DATE>
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${xmlEscape(invoice.invoiceNumber)}</VOUCHERNUMBER>
            <REFERENCE>${xmlEscape(invoice.invoiceNumber)}</REFERENCE>
            <PARTYNAME>${xmlEscape(supplier)}</PARTYNAME>
            <PARTYLEDGERNAME>${xmlEscape(supplier)}</PARTYLEDGERNAME>
            <NARRATION>Imported from InvoiceCheck.in — GSTIN ${xmlEscape(invoice.supplierGSTIN)}</NARRATION>
            ${partyEntry}${itemEntries}${taxEntries}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

function csvCell(value: string | number): string {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * One row per line item (not one row per invoice), since that is how a
 * Purchase Register is normally read into Excel/Tally — repeated invoice
 * fields across rows, varying line-item fields down the columns.
 */
export function buildPurchaseRegisterCsv(invoice: ParsedInvoice, result: ValidationResult): string {
    const headers = [
        'Invoice Number', 'Invoice Date', 'Supplier GSTIN', 'Supplier Name',
        'Buyer GSTIN', 'Line No', 'Description', 'HSN Code', 'Quantity', 'Rate',
        'Taxable Amount', 'Tax Rate %', 'CGST', 'SGST', 'IGST', 'Line Total',
        'Health Score', 'Risk Level', 'Issues Found',
    ];

    const rows = invoice.lineItems.map((item) => [
        invoice.invoiceNumber,
        invoice.invoiceDate,
        invoice.supplierGSTIN,
        invoice.supplierName || '',
        invoice.buyerGSTIN || '',
        item.lineNumber,
        item.description,
        item.hsnCode,
        item.quantity,
        item.rate,
        item.taxableAmount,
        item.taxRate,
        item.cgst,
        item.sgst,
        item.igst,
        item.totalAmount,
        result.healthScore,
        result.riskLevel,
        result.issuesFound.length,
    ]);

    const lines = [headers, ...rows].map((row) => row.map(csvCell).join(','));
    return lines.join('\n');
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
