import { ParsedInvoice, ValidationIssue, ValidationRule, VALID_GST_RATES, VALID_STATE_CODES } from '@/types';

/**
 * Validation Rules Registry
 * Each rule has: id, name, category, severityWeight, gstLawRef, execute()
 * Execute returns ValidationIssue[] — even single-issue rules return arrays for uniformity.
 */

// ─── RULE 1: GSTIN Format Validation ───────────────────────────────
export const gstinFormatRule: ValidationRule = {
    id: 'RULE_GSTIN_FORMAT',
    name: 'GSTIN Format Validation',
    category: 'GSTIN Validation',
    severityWeight: 10,
    gstLawRef: 'Section 25 of CGST Act 2017 — Registration',
    execute: (invoice) => {
        const issues: ValidationIssue[] = [];
        const check = (gstin: string, label: string) => {
            if (!gstin || gstin.trim() === '') {
                issues.push({
                    id: `gstin-missing-${label.toLowerCase()}`,
                    ruleId: 'RULE_GSTIN_FORMAT',
                    severity: 'critical',
                    category: 'GSTIN Validation',
                    title: `${label} GSTIN Missing`,
                    description: 'GSTIN is mandatory for GST invoices',
                    found: 'Not provided',
                    expected: '15-character GSTIN',
                    howToFix: `Enter valid ${label} GSTIN in format: 22AAAAA0000A1Z5`,
                    impact: 'Invoice invalid without GSTIN. Will be rejected on portal.',
                    gstLawContext: 'Under Section 25 of CGST Act, every registered dealer must display GSTIN on invoices.',
                });
                return;
            }

            if (gstin.length !== 15) {
                issues.push({
                    id: `gstin-length-${label.toLowerCase()}`,
                    ruleId: 'RULE_GSTIN_FORMAT',
                    severity: 'critical',
                    category: 'GSTIN Validation',
                    title: `${label} GSTIN Invalid Length`,
                    description: `GSTIN must be exactly 15 characters, found ${gstin.length}`,
                    found: `${gstin.length} characters`,
                    expected: '15 characters',
                    howToFix: 'Verify GSTIN has all 15 characters',
                    impact: 'Portal will reject invalid GSTIN format',
                    gstLawContext: 'GSTIN structure: 2(state) + 10(PAN) + 1(entity) + 1(Z) + 1(checksum) = 15 chars',
                });
                return;
            }

            const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!pattern.test(gstin)) {
                issues.push({
                    id: `gstin-format-${label.toLowerCase()}`,
                    ruleId: 'RULE_GSTIN_FORMAT',
                    severity: 'critical',
                    category: 'GSTIN Validation',
                    title: `${label} GSTIN Invalid Format`,
                    description: 'GSTIN does not match the required pattern',
                    found: gstin,
                    expected: 'Format: 22AAAAA0000A1Z5',
                    howToFix: 'Check GSTIN follows: 2-digit state + 10-char PAN + entity number + Z + checksum',
                    impact: 'Portal will reject invalid format. ITC claim will fail.',
                    gstLawContext: 'GSTIN format defined under Rule 10 of CGST Rules 2017.',
                });
            }
        };

        check(invoice.supplierGSTIN, 'Supplier');
        check(invoice.buyerGSTIN, 'Buyer');
        return issues;
    },
};

// ─── RULE 2: State Code Validation ─────────────────────────────────
export const stateCodeRule: ValidationRule = {
    id: 'RULE_STATE_CODE',
    name: 'State Code Validation',
    category: 'State Code',
    severityWeight: 8,
    gstLawRef: 'Schedule I of CGST Act 2017 — State Codes',
    execute: (invoice) => {
        const issues: ValidationIssue[] = [];
        const check = (gstin: string, label: string) => {
            if (gstin.length >= 2) {
                const stateCode = gstin.substring(0, 2);
                if (!VALID_STATE_CODES.includes(stateCode as any)) {
                    issues.push({
                        id: `state-code-invalid-${label.toLowerCase()}`,
                        ruleId: 'RULE_STATE_CODE',
                        severity: 'critical',
                        category: 'State Code',
                        title: `${label} Invalid State Code: ${stateCode}`,
                        description: `State code ${stateCode} is not a valid Indian state/UT code`,
                        found: stateCode,
                        expected: 'Valid code: 01-38 or 97',
                        howToFix: `Verify first 2 digits of ${label} GSTIN match the registration state`,
                        impact: 'Invalid state code means GSTIN is fabricated or incorrect.',
                        gstLawContext: 'State codes are defined under GST notification. Valid range: 01 (Jammu & Kashmir) to 38 (Ladakh), 97 (Other Territory).',
                    });
                }
            }
        };

        check(invoice.supplierGSTIN, 'Supplier');
        check(invoice.buyerGSTIN, 'Buyer');
        return issues;
    },
};

// ─── RULE 3: Duplicate GSTIN Check ─────────────────────────────────
export const duplicateGstinRule: ValidationRule = {
    id: 'RULE_DUPLICATE_GSTIN',
    name: 'Duplicate GSTIN Detection',
    category: 'GSTIN Validation',
    severityWeight: 9,
    gstLawRef: 'Section 31 of CGST Act — Tax Invoice',
    execute: (invoice) => {
        if (
            invoice.supplierGSTIN &&
            invoice.buyerGSTIN &&
            invoice.supplierGSTIN === invoice.buyerGSTIN
        ) {
            return [{
                id: 'gstin-duplicate',
                ruleId: 'RULE_DUPLICATE_GSTIN',
                severity: 'critical',
                category: 'GSTIN Validation',
                title: 'Supplier and Buyer GSTIN Are Same',
                description: 'Self-invoicing detected — supplier and buyer cannot have the same GSTIN',
                found: invoice.supplierGSTIN,
                expected: 'Different GSTINs',
                howToFix: 'Verify buyer GSTIN is different from supplier. Self-supply needs special handling.',
                impact: 'Will be flagged as fraudulent. Can trigger GST audit.',
                gstLawContext: 'Under Section 31, a tax invoice must be issued to a distinct person. Self-supply requires separate treatment under Schedule I.',
            }];
        }
        return [];
    },
};

// ─── RULE 4: Tax Type Logic ────────────────────────────────────────
export const taxTypeRule: ValidationRule = {
    id: 'RULE_TAX_TYPE',
    name: 'Tax Type Logic (CGST/SGST vs IGST)',
    category: 'Tax Type',
    severityWeight: 10,
    gstLawRef: 'Section 7 of IGST Act 2017 — Interstate Supply',
    execute: (invoice) => {
        const issues: ValidationIssue[] = [];
        const supplierState = invoice.supplierGSTIN.substring(0, 2);
        const buyerState = invoice.buyerGSTIN.substring(0, 2);
        const isSameState = supplierState === buyerState;

        invoice.lineItems.forEach((item, index) => {
            if (isSameState && item.taxType === 'IGST') {
                issues.push({
                    id: `tax-type-wrong-igst-line-${index + 1}`,
                    ruleId: 'RULE_TAX_TYPE',
                    severity: 'critical',
                    category: 'Tax Type',
                    title: `Wrong Tax Type — Line ${index + 1}`,
                    description: `IGST used for same-state transaction (both state ${supplierState})`,
                    location: `Line ${index + 1}: ${item.description}`,
                    found: 'IGST',
                    expected: 'CGST + SGST',
                    howToFix: `Change to CGST ${item.taxRate / 2}% + SGST ${item.taxRate / 2}% (total ${item.taxRate}%)`,
                    impact: 'GSTR-1 filing will REJECT this invoice. Most common cause of payment holds on Amazon/Flipkart.',
                    gstLawContext: 'Under Section 7 of IGST Act, IGST applies only to inter-state supply. Intra-state supply must use CGST+SGST under Section 9 of CGST Act.',
                });
            }

            if (!isSameState && item.taxType === 'CGST_SGST') {
                issues.push({
                    id: `tax-type-wrong-cgst-line-${index + 1}`,
                    ruleId: 'RULE_TAX_TYPE',
                    severity: 'critical',
                    category: 'Tax Type',
                    title: `Wrong Tax Type — Line ${index + 1}`,
                    description: `CGST+SGST used for interstate transaction (${supplierState} → ${buyerState})`,
                    location: `Line ${index + 1}: ${item.description}`,
                    found: 'CGST + SGST',
                    expected: 'IGST',
                    howToFix: `Change to IGST ${item.taxRate}%`,
                    impact: 'Interstate shown as intrastate. ITC mismatch in GSTR-2B for buyer.',
                    gstLawContext: 'Section 5 of IGST Act mandates IGST on inter-state supplies. Using CGST+SGST for inter-state is a violation.',
                });
            }
        });

        return issues;
    },
};

// ─── RULE 5: Tax Rate Validity ─────────────────────────────────────
export const taxRateRule: ValidationRule = {
    id: 'RULE_TAX_RATE',
    name: 'GST Rate Validity',
    category: 'Tax Rate',
    severityWeight: 8,
    gstLawRef: 'GST Rate Schedule — Notification 1/2017',
    execute: (invoice) => {
        const issues: ValidationIssue[] = [];

        invoice.lineItems.forEach((item, index) => {
            if (!VALID_GST_RATES.includes(item.taxRate as any)) {
                issues.push({
                    id: `rate-invalid-line-${index + 1}`,
                    ruleId: 'RULE_TAX_RATE',
                    severity: 'critical',
                    category: 'Tax Rate',
                    title: `Invalid GST Rate — Line ${index + 1}`,
                    description: `${item.taxRate}% is not a valid GST slab rate`,
                    location: `Line ${index + 1}: ${item.description}`,
                    found: `${item.taxRate}%`,
                    expected: 'One of: 0%, 0.25%, 3%, 5%, 12%, 18%, 28%',
                    howToFix: 'Use correct GST rate for this HSN code. Most goods: 18%, food: 5%, luxury: 28%',
                    impact: 'Invalid rate will cause GSTR-1 filing errors and ITC mismatch',
                    gstLawContext: 'GST rates are fixed by GST Council under Notification 1/2017-CT(Rate). Only 7 rate slabs exist.',
                });
            }
        });

        return issues;
    },
};

// ─── RULE 6: GST Calculation Accuracy ──────────────────────────────
export const gstCalculationRule: ValidationRule = {
    id: 'RULE_GST_CALCULATION',
    name: 'GST Amount Calculation',
    category: 'GST Calculation',
    severityWeight: 9,
    gstLawRef: 'Section 15 of CGST Act — Value of Taxable Supply',
    execute: (invoice) => {
        const issues: ValidationIssue[] = [];

        invoice.lineItems.forEach((item, index) => {
            const expectedTax = (item.taxableAmount * item.taxRate) / 100;
            const actualTax = item.cgst + item.sgst + item.igst;
            const difference = Math.abs(expectedTax - actualTax);

            if (difference > 1) {
                issues.push({
                    id: `calc-error-line-${index + 1}`,
                    ruleId: 'RULE_GST_CALCULATION',
                    severity: 'critical',
                    category: 'GST Calculation',
                    title: `Calculation Mismatch — Line ${index + 1}`,
                    description: `Tax amount doesn't match: ₹${item.taxableAmount} × ${item.taxRate}% = ₹${expectedTax.toFixed(2)}, but ₹${actualTax.toFixed(2)} charged`,
                    location: `Line ${index + 1}: ${item.description}`,
                    expected: `₹${expectedTax.toFixed(2)}`,
                    found: `₹${actualTax.toFixed(2)}`,
                    difference,
                    howToFix: `Correct tax to ₹${expectedTax.toFixed(2)}. Formula: Taxable Amount (₹${item.taxableAmount}) × Rate (${item.taxRate}%) = ₹${expectedTax.toFixed(2)}`,
                    impact: 'Wrong tax amount = excess or short collection. Triggers scrutiny under Section 73/74.',
                    gstLawContext: 'Section 15 defines how tax is computed on value of supply. Any miscalculation is a compliance violation.',
                });
            }
        });

        return issues;
    },
};

// ─── RULE 7: CGST/SGST Equal Split ────────────────────────────────
export const cgstSgstSplitRule: ValidationRule = {
    id: 'RULE_CGST_SGST_SPLIT',
    name: 'CGST/SGST Equal Split',
    category: 'CGST/SGST Split',
    severityWeight: 8,
    gstLawRef: 'Section 9(1) of CGST Act — CGST equals SGST',
    execute: (invoice) => {
        const issues: ValidationIssue[] = [];

        invoice.lineItems.forEach((item, index) => {
            if (item.taxType === 'CGST_SGST' && item.cgst > 0 && item.sgst > 0) {
                const difference = Math.abs(item.cgst - item.sgst);
                if (difference > 1) {
                    issues.push({
                        id: `split-error-line-${index + 1}`,
                        ruleId: 'RULE_CGST_SGST_SPLIT',
                        severity: 'critical',
                        category: 'CGST/SGST Split',
                        title: `Unequal Split — Line ${index + 1}`,
                        description: `CGST (₹${item.cgst}) and SGST (₹${item.sgst}) must be equal`,
                        location: `Line ${index + 1}: ${item.description}`,
                        expected: `Each = ₹${((item.cgst + item.sgst) / 2).toFixed(2)}`,
                        found: `CGST: ₹${item.cgst}, SGST: ₹${item.sgst}`,
                        howToFix: `Set both CGST and SGST to ₹${((item.cgst + item.sgst) / 2).toFixed(2)}`,
                        impact: 'Unequal split violates CGST Act and will be flagged in GSTR-1.',
                        gstLawContext: 'Under Section 9(1), CGST rate always equals SGST rate (each = half of total GST rate).',
                    });
                }
            }
        });

        return issues;
    },
};

// ─── RULE 8: HSN Code Validation ───────────────────────────────────
export const hsnCodeRule: ValidationRule = {
    id: 'RULE_HSN_CODE',
    name: 'HSN Code Validation',
    category: 'HSN Code',
    severityWeight: 5,
    gstLawRef: 'Notification 78/2020 — Mandatory HSN on invoices',
    execute: (invoice) => {
        const issues: ValidationIssue[] = [];

        invoice.lineItems.forEach((item, index) => {
            if (!item.hsnCode || item.hsnCode.trim() === '') {
                issues.push({
                    id: `hsn-missing-line-${index + 1}`,
                    ruleId: 'RULE_HSN_CODE',
                    severity: 'warning',
                    category: 'HSN Code',
                    title: `HSN Code Missing — Line ${index + 1}`,
                    description: 'HSN/SAC code is mandatory on GST invoices',
                    location: `Line ${index + 1}: ${item.description}`,
                    expected: '4, 6, or 8 digit HSN code',
                    found: 'Not provided',
                    howToFix: 'Look up HSN code for this product at cbic-gst.gov.in',
                    impact: 'GSTR-1 requires HSN. Without it, return filing will fail.',
                    gstLawContext: 'Notification 78/2020-CT mandates 4-digit HSN for turnover > ₹5 Cr, 6-digit for > ₹5 Cr from April 2021.',
                });
            } else {
                const hsnPattern = /^[0-9]{4,8}$/;
                if (!hsnPattern.test(item.hsnCode)) {
                    issues.push({
                        id: `hsn-invalid-line-${index + 1}`,
                        ruleId: 'RULE_HSN_CODE',
                        severity: 'warning',
                        category: 'HSN Code',
                        title: `Invalid HSN Format — Line ${index + 1}`,
                        description: 'HSN code must be 4-8 digits only',
                        location: `Line ${index + 1}`,
                        found: item.hsnCode,
                        expected: '4-8 digit number',
                        howToFix: 'Use numeric HSN code with 4, 6, or 8 digits. No letters.',
                        impact: 'Invalid format will be rejected on portal.',
                        gstLawContext: 'HSN codes follow WCO Harmonized System. Indian GST uses 4-8 digit codes.',
                    });
                }
            }
        });

        return issues;
    },
};

// ─── RULE 9: Invoice Number ────────────────────────────────────────
export const invoiceNumberRule: ValidationRule = {
    id: 'RULE_INVOICE_NUMBER',
    name: 'Invoice Number Validation',
    category: 'Invoice Number',
    severityWeight: 6,
    gstLawRef: 'Rule 46 of CGST Rules — Invoice Particulars',
    execute: (invoice) => {
        if (!invoice.invoiceNumber || invoice.invoiceNumber.trim() === '') {
            return [{
                id: 'invoice-number-missing',
                ruleId: 'RULE_INVOICE_NUMBER',
                severity: 'critical',
                category: 'Invoice Number',
                title: 'Invoice Number Missing',
                description: 'Invoice number is mandatory on every GST invoice',
                found: 'Not provided',
                expected: 'Alphanumeric invoice number',
                howToFix: 'Add invoice number. Format: sequential, unique per financial year.',
                impact: 'Invoice without number is invalid under GST law.',
                gstLawContext: 'Rule 46(b) mandates consecutive serial number, unique for a financial year.',
            }];
        }

        if (invoice.invoiceNumber.length > 50) {
            return [{
                id: 'invoice-number-too-long',
                ruleId: 'RULE_INVOICE_NUMBER',
                severity: 'warning',
                category: 'Invoice Number',
                title: 'Invoice Number Too Long',
                description: `Invoice number is ${invoice.invoiceNumber.length} characters (max 50)`,
                found: `${invoice.invoiceNumber.length} characters`,
                expected: 'Maximum 50 characters',
                howToFix: 'Shorten invoice number. GST portal allows max 16 chars in GSTR-1.',
                impact: 'May be truncated during GSTR-1 filing.',
                gstLawContext: 'GSTR-1 portal field allows max 16 characters for invoice number.',
            }];
        }

        const validPattern = /^[A-Za-z0-9\-\/\\]+$/;
        if (!validPattern.test(invoice.invoiceNumber)) {
            return [{
                id: 'invoice-number-invalid-chars',
                ruleId: 'RULE_INVOICE_NUMBER',
                severity: 'warning',
                category: 'Invoice Number',
                title: 'Special Characters in Invoice Number',
                description: 'Invoice number contains characters that may cause issues',
                found: invoice.invoiceNumber,
                expected: 'Only letters, numbers, -, /, \\',
                howToFix: 'Remove special characters. Use only alphanumeric with - or /',
                impact: 'Some portals reject special characters.',
                gstLawContext: 'Rule 46 requires alpha-numeric characters only.',
            }];
        }

        return [];
    },
};

// ─── RULE 10: Invoice Date ─────────────────────────────────────────
export const invoiceDateRule: ValidationRule = {
    id: 'RULE_INVOICE_DATE',
    name: 'Invoice Date Validation',
    category: 'Invoice Date',
    severityWeight: 7,
    gstLawRef: 'Section 31 of CGST Act — Time of Issue',
    execute: (invoice) => {
        if (!invoice.invoiceDate || invoice.invoiceDate.trim() === '') {
            return [{
                id: 'date-missing',
                ruleId: 'RULE_INVOICE_DATE',
                severity: 'critical',
                category: 'Invoice Date',
                title: 'Invoice Date Missing',
                description: 'Invoice date is mandatory',
                found: 'Not provided',
                expected: 'Valid date',
                howToFix: 'Enter invoice date',
                impact: 'Invoice without date is invalid.',
                gstLawContext: 'Section 31(1) — invoice must be issued at the time of supply with date.',
            }];
        }

        const date = new Date(invoice.invoiceDate);
        const today = new Date();

        if (isNaN(date.getTime())) {
            return [{
                id: 'date-invalid',
                ruleId: 'RULE_INVOICE_DATE',
                severity: 'critical',
                category: 'Invoice Date',
                title: 'Invalid Date Format',
                description: 'Cannot parse the date provided',
                found: invoice.invoiceDate,
                expected: 'Valid date (YYYY-MM-DD)',
                howToFix: 'Enter date in correct format',
                impact: 'Portal will reject invalid dates.',
                gstLawContext: 'dates must follow portal-accepted format.',
            }];
        }

        if (date > today) {
            return [{
                id: 'date-future',
                ruleId: 'RULE_INVOICE_DATE',
                severity: 'critical',
                category: 'Invoice Date',
                title: 'Future Date Not Allowed',
                description: `Invoice dated ${invoice.invoiceDate} is in the future`,
                found: invoice.invoiceDate,
                expected: 'Today or earlier',
                howToFix: 'Correct date to actual date of supply',
                impact: 'Future-dated invoices are rejected on portal.',
                gstLawContext: 'Section 31 — invoice issued at or before time of supply, not after.',
            }];
        }

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (date < oneYearAgo) {
            return [{
                id: 'date-too-old',
                ruleId: 'RULE_INVOICE_DATE',
                severity: 'warning',
                category: 'Invoice Date',
                title: 'Invoice Date Over 1 Year Old',
                description: `Invoice dated ${invoice.invoiceDate} is more than 1 year old`,
                found: invoice.invoiceDate,
                expected: 'Within last 365 days',
                howToFix: 'Verify date. Old invoices cannot claim ITC after time limit.',
                impact: 'ITC on invoices older than 1 year cannot be claimed under Section 16(4).',
                gstLawContext: 'Section 16(4) — ITC must be claimed before September of next FY or annual return, whichever is earlier.',
            }];
        }

        return [];
    },
};

// ─── RULE 11: Taxable Sum Verification ─────────────────────────────
export const taxableSumRule: ValidationRule = {
    id: 'RULE_TAXABLE_SUM',
    name: 'Taxable Amount Sum',
    category: 'Totals',
    severityWeight: 9,
    gstLawRef: 'Section 15 of CGST Act — Value of Supply',
    execute: (invoice) => {
        const calculatedSum = invoice.lineItems.reduce((sum, item) => sum + item.taxableAmount, 0);
        const difference = Math.abs(calculatedSum - invoice.taxableTotalAmount);

        if (difference > 1) {
            return [{
                id: 'taxable-sum-mismatch',
                ruleId: 'RULE_TAXABLE_SUM',
                severity: 'critical',
                category: 'Totals',
                title: 'Taxable Amount Sum Mismatch',
                description: `Line items total ₹${calculatedSum.toFixed(2)} but invoice shows ₹${invoice.taxableTotalAmount.toFixed(2)}`,
                expected: `₹${calculatedSum.toFixed(2)}`,
                found: `₹${invoice.taxableTotalAmount.toFixed(2)}`,
                difference,
                howToFix: `Update total taxable amount to ₹${calculatedSum.toFixed(2)}`,
                impact: 'Summation errors cause automatic rejection on GST portal.',
                gstLawContext: 'Value of supply under Section 15 must accurately reflect the sum of all line items.',
            }];
        }
        return [];
    },
};

// ─── RULE 12: Invoice Total Verification ───────────────────────────
export const invoiceTotalRule: ValidationRule = {
    id: 'RULE_INVOICE_TOTAL',
    name: 'Invoice Total Calculation',
    category: 'Totals',
    severityWeight: 9,
    gstLawRef: 'Rule 46(n) of CGST Rules — Total Invoice Value',
    execute: (invoice) => {
        const expectedTotal = invoice.taxableTotalAmount + invoice.totalTaxAmount;
        const difference = Math.abs(expectedTotal - invoice.invoiceTotalAmount);

        if (difference > 1) {
            return [{
                id: 'invoice-total-mismatch',
                ruleId: 'RULE_INVOICE_TOTAL',
                severity: 'critical',
                category: 'Totals',
                title: 'Invoice Total Wrong',
                description: `Expected ₹${expectedTotal.toFixed(2)} (taxable + tax), found ₹${invoice.invoiceTotalAmount.toFixed(2)}`,
                expected: `₹${expectedTotal.toFixed(2)}`,
                found: `₹${invoice.invoiceTotalAmount.toFixed(2)}`,
                difference,
                howToFix: `Total = Taxable (₹${invoice.taxableTotalAmount}) + Tax (₹${invoice.totalTaxAmount}) = ₹${expectedTotal.toFixed(2)}`,
                impact: 'Wrong total means wrong payment amount. Will be flagged.',
                gstLawContext: 'Rule 46(n) mandates total value of supply = taxable value + tax amount.',
            }];
        }
        return [];
    },
};

// ─── RULES REGISTRY ────────────────────────────────────────────────
export const ALL_RULES: ValidationRule[] = [
    gstinFormatRule,
    stateCodeRule,
    duplicateGstinRule,
    taxTypeRule,
    taxRateRule,
    gstCalculationRule,
    cgstSgstSplitRule,
    hsnCodeRule,
    invoiceNumberRule,
    invoiceDateRule,
    taxableSumRule,
    invoiceTotalRule,
];

// ─── RULE 13: Place of Supply Validation ───────────────────────────
export const placeOfSupplyRule: ValidationRule = {
    id: 'RULE_PLACE_OF_SUPPLY',
    name: 'Place of Supply Validation',
    category: 'Place of Supply',
    severityWeight: 8,
    gstLawRef: 'Section 10-12 of IGST Act 2017 — Place of Supply',
    execute: (invoice) => {
        const issues: ValidationIssue[] = [];

        if (!invoice.placeOfSupply) {
            issues.push({
                id: 'pos-missing',
                ruleId: 'RULE_PLACE_OF_SUPPLY',
                severity: 'warning',
                category: 'Place of Supply',
                title: 'Place of Supply Not Specified',
                description: 'Place of Supply (PoS) is a mandatory field on GST invoices',
                found: 'Not provided',
                expected: '2-digit state code',
                howToFix: 'Add Place of Supply. Usually it is the buyer\'s state code.',
                impact: 'Tax type (CGST/SGST vs IGST) is legally determined by PoS, not the buyer GSTIN.',
                gstLawContext: 'Section 10 of IGST Act determines PoS for goods; Section 12 for services. PoS must appear on invoice under Rule 46(n).',
            });
            return issues;
        }

        // Cross-check: if PoS == supplier state → should be intrastate (CGST+SGST)
        // if PoS != supplier state → should be interstate (IGST)
        const supplierState = invoice.supplierGSTIN.substring(0, 2);
        const isIntrastate = invoice.placeOfSupply === supplierState;

        invoice.lineItems.forEach((item, index) => {
            if (isIntrastate && item.taxType === 'IGST') {
                issues.push({
                    id: `pos-igst-conflict-line-${index + 1}`,
                    ruleId: 'RULE_PLACE_OF_SUPPLY',
                    severity: 'critical',
                    category: 'Place of Supply',
                    title: `PoS Conflict: IGST on Intrastate Supply — Line ${index + 1}`,
                    description: `Place of Supply (${invoice.placeOfSupply}) equals Supplier state (${supplierState}), but IGST is charged`,
                    location: `Line ${index + 1}: ${item.description}`,
                    found: 'IGST',
                    expected: 'CGST + SGST (intrastate supply)',
                    howToFix: 'Change tax type to CGST + SGST. IGST is only for interstate supplies.',
                    impact: 'GSTR-1 will reject. Buyer cannot claim ITC correctly.',
                    gstLawContext: 'Section 8 of IGST Act: supply is intrastate if PoS and supplier location are in the same state.',
                });
            }
            if (!isIntrastate && item.taxType === 'CGST_SGST') {
                issues.push({
                    id: `pos-cgst-conflict-line-${index + 1}`,
                    ruleId: 'RULE_PLACE_OF_SUPPLY',
                    severity: 'critical',
                    category: 'Place of Supply',
                    title: `PoS Conflict: CGST+SGST on Interstate Supply — Line ${index + 1}`,
                    description: `Place of Supply (${invoice.placeOfSupply}) differs from Supplier state (${supplierState}), but CGST+SGST is charged`,
                    location: `Line ${index + 1}: ${item.description}`,
                    found: 'CGST + SGST',
                    expected: 'IGST (interstate supply)',
                    howToFix: 'Change tax type to IGST for interstate supplies.',
                    impact: 'Wrong tax type. Buyer ITC will fail in GSTR-2B reconciliation.',
                    gstLawContext: 'Section 7 of IGST Act: supply is interstate if PoS and supplier location are in different states.',
                });
            }
        });

        return issues;
    },
};

// ─── RULE 14: Invoice Type Validation ──────────────────────────────
export const invoiceTypeRule: ValidationRule = {
    id: 'RULE_INVOICE_TYPE',
    name: 'Invoice Type Compliance',
    category: 'Invoice Type',
    severityWeight: 7,
    gstLawRef: 'Section 31 of CGST Act — Type of Invoice',
    execute: (invoice) => {
        const issues: ValidationIssue[] = [];

        if (!invoice.invoiceType || invoice.invoiceType === 'tax_invoice') {
            return issues; // Default — no extra checks needed
        }

        const totalTax = invoice.lineItems.reduce(
            (sum, item) => sum + item.cgst + item.sgst + item.igst, 0
        );

        // Bill of Supply: exempt/composition — must have 0 tax
        if (invoice.invoiceType === 'bill_of_supply' && totalTax > 0) {
            issues.push({
                id: 'bos-has-tax',
                ruleId: 'RULE_INVOICE_TYPE',
                severity: 'critical',
                category: 'Invoice Type',
                title: 'Bill of Supply Cannot Have GST',
                description: `Bill of Supply is for exempt goods/composition dealers — no GST should be charged. Found ₹${totalTax.toFixed(2)} in tax.`,
                found: `₹${totalTax.toFixed(2)} GST charged`,
                expected: 'Zero tax (₹0.00)',
                howToFix: 'Either change to Tax Invoice, or remove all tax amounts. Bill of Supply is only for exempt supplies or composition dealers.',
                impact: 'Composition dealers are prohibited from collecting GST. Charging GST on BoS is a serious violation.',
                gstLawContext: 'Section 10(1) of CGST Act: Composition dealers cannot collect tax from recipients. Rule 49 permits Bill of Supply instead of Tax Invoice.',
            });
        }

        // Export Invoice: should ideally have 0 tax (LUT/Bond) or IGST only
        if (invoice.invoiceType === 'export_invoice') {
            const hasCgstSgst = invoice.lineItems.some(
                (item) => item.taxType === 'CGST_SGST' && (item.cgst > 0 || item.sgst > 0)
            );
            if (hasCgstSgst) {
                issues.push({
                    id: 'export-has-cgst-sgst',
                    ruleId: 'RULE_INVOICE_TYPE',
                    severity: 'critical',
                    category: 'Invoice Type',
                    title: 'Export Invoice Cannot Have CGST/SGST',
                    description: 'Export invoices must charge either zero tax (under LUT/Bond) or IGST only',
                    found: 'CGST + SGST',
                    expected: 'IGST or Zero-rated (under LUT)',
                    howToFix: 'Change tax type to IGST. For zero-rated exports under LUT, set all taxes to 0.',
                    impact: 'GSTR-1 will not accept CGST/SGST on export invoices.',
                    gstLawContext: 'Section 16 of IGST Act: Exports are zero-rated supplies. Tax can only be IGST (to be refunded) or nil (under LUT/Bond).',
                });
            }
        }

        return issues;
    },
};

// ─── RULE 15: Reverse Charge Mechanism (RCM) ───────────────────────
export const reverseChargeRule: ValidationRule = {
    id: 'RULE_REVERSE_CHARGE',
    name: 'Reverse Charge Mechanism (RCM)',
    category: 'Reverse Charge',
    severityWeight: 6,
    gstLawRef: 'Section 9(3) & 9(4) of CGST Act — Reverse Charge',
    execute: (invoice) => {
        const issues: ValidationIssue[] = [];

        if (invoice.reverseCharge === true) {
            // RCM invoices: supplier charges 0 tax, buyer pays tax directly
            const totalTax = invoice.lineItems.reduce(
                (sum, item) => sum + item.cgst + item.sgst + item.igst, 0
            );

            if (totalTax > 1) {
                issues.push({
                    id: 'rcm-tax-charged',
                    ruleId: 'RULE_REVERSE_CHARGE',
                    severity: 'warning',
                    category: 'Reverse Charge',
                    title: 'RCM Invoice Should Have Zero Tax from Supplier',
                    description: `Reverse Charge is enabled, but ₹${totalTax.toFixed(2)} in tax is charged. Under RCM, the buyer pays tax directly to the government.`,
                    found: `Supplier charging ₹${totalTax.toFixed(2)} GST`,
                    expected: '₹0.00 GST (buyer pays directly)',
                    howToFix: 'For RCM supplies, set all tax amounts to ₹0. The buyer will self-assess and pay GST.',
                    impact: 'Double taxation risk. Buyer will cannot claim ITC on supplier-charged tax in RCM.',
                    gstLawContext: 'Under Section 9(3) of CGST Act, for notified RCM supplies, tax liability shifts to recipient. Supplier must not charge GST.',
                });
            } else {
                // RCM is correctly set — add informational note
                issues.push({
                    id: 'rcm-note',
                    ruleId: 'RULE_REVERSE_CHARGE',
                    severity: 'info',
                    category: 'Reverse Charge',
                    title: 'Reverse Charge Applicable',
                    description: 'This invoice is under Reverse Charge Mechanism. The buyer is liable to pay GST directly to the government.',
                    howToFix: 'No action needed. Ensure buyer files GSTR-2 and pays RCM tax.',
                    impact: 'Buyer must pay RCM GST and can then claim ITC in the same return period.',
                    gstLawContext: 'Section 9(3) of CGST Act. Buyer files in GSTR-2 and claims ITC subject to conditions in Section 16.',
                });
            }
        }

        return issues;
    },
};

// ─── APPEND NEW RULES TO REGISTRY ──────────────────────────────────
// Done here (after declarations) to avoid "used before declaration" TS errors
ALL_RULES.push(placeOfSupplyRule, invoiceTypeRule, reverseChargeRule);
