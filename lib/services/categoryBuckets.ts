/**
 * lib/services/categoryBuckets.ts
 * ─────────────────────────────────────────────────────────────────────
 * Maps a validation rule to one of 3 broad compliance-risk buckets, for
 * anywhere a free preview names an issue's category without revealing the
 * narrow per-field name (which on an invoice with only one issue of that
 * kind instantly gives away the exact defect — e.g. "Invoice Number"
 * points straight at the 16-character rule).
 *
 * Shared by /api/preview-check (single-check free preview, PR #76) and
 * /api/bulk-check (batch exception report) so both free surfaces redact
 * at the same depth.
 */

export const CATEGORY_BUCKET_BY_RULE: Record<string, string> = {
    RULE_INVOICE_NUMBER: 'GSTR-1 Portal Rejection Risk',
    RULE_HSN_CODE: 'GSTR-1 Portal Rejection Risk',
    RULE_INVOICE_DATE: 'GSTR-1 Portal Rejection Risk',
    RULE_GSTIN_FORMAT: 'GSTR-1 Portal Rejection Risk',
    RULE_STATE_CODE: 'GSTR-1 Portal Rejection Risk',
    RULE_TAX_TYPE: 'ITC Disallowance & Tax Logic Mismatch',
    RULE_PLACE_OF_SUPPLY: 'ITC Disallowance & Tax Logic Mismatch',
    RULE_DUPLICATE_GSTIN: 'ITC Disallowance & Tax Logic Mismatch',
    RULE_REVERSE_CHARGE: 'ITC Disallowance & Tax Logic Mismatch',
    RULE_INVOICE_TYPE: 'ITC Disallowance & Tax Logic Mismatch',
    RULE_TAX_RATE: 'Tax Calculation & Slab Discrepancy',
    RULE_GST_CALCULATION: 'Tax Calculation & Slab Discrepancy',
    RULE_CGST_SGST_SPLIT: 'Tax Calculation & Slab Discrepancy',
    RULE_TAXABLE_SUM: 'Tax Calculation & Slab Discrepancy',
    RULE_INVOICE_TOTAL: 'Tax Calculation & Slab Discrepancy',
    RULE_INVOICE_LEVEL_TAX: 'Tax Calculation & Slab Discrepancy',
};

/** Falls back to the rule's own category on an unmapped ruleId rather than
 * showing nothing — safer than crashing or leaking `undefined`, and a new
 * rule added later degrades to the old (still-free-safe for most names)
 * behavior instead of breaking the preview. */
export function bucketCategory(ruleId: string, fallback: string): string {
    return CATEGORY_BUCKET_BY_RULE[ruleId] ?? fallback;
}
