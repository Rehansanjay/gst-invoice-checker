import { ParsedInvoice, LineItem, ValidationIssue, VALID_GST_RATES, VALID_STATE_CODES } from '@/types';

export function validateGSTINFormat(gstin: string, label: string): ValidationIssue | null {
    if (!gstin || gstin.trim() === '') {
        return {
            id: `gstin-missing-${label}`,
            severity: 'critical',
            category: 'GSTIN Validation',
            title: `${label} GSTIN Missing`,
            description: 'GSTIN is mandatory for GST invoices',
            found: 'Not provided',
            expected: '15-character GSTIN',
            howToFix: `Enter valid ${label} GSTIN in format: 22AAAAA0000A1Z5`,
            impact: 'Invoice invalid without GSTIN',
        };
    }

    const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (gstin.length !== 15) {
        return {
            id: `gstin-length-${label}`,
            severity: 'critical',
            category: 'GSTIN Validation',
            title: `${label} GSTIN Invalid Length`,
            description: 'GSTIN must be exactly 15 characters',
            found: `${gstin.length} characters`,
            expected: '15 characters',
            howToFix: 'Verify GSTIN has all 15 characters',
            impact: 'Portal will reject invalid GSTIN format',
        };
    }

    if (!pattern.test(gstin)) {
        return {
            id: `gstin-format-${label}`,
            severity: 'critical',
            category: 'GSTIN Validation',
            title: `${label} GSTIN Invalid Format`,
            description: 'GSTIN does not match required pattern',
            found: gstin,
            expected: 'Format: 22AAAAA0000A1Z5',
            howToFix: 'Check GSTIN follows pattern: 2-digit state + 10-char PAN + 3-char code',
            impact: 'Portal will reject invalid format',
        };
    }

    const stateCode = gstin.substring(0, 2);
    if (!VALID_STATE_CODES.includes(stateCode as any)) {
        return {
            id: `gstin-state-${label}`,
            severity: 'critical',
            category: 'GSTIN Validation',
            title: `${label} GSTIN Invalid State Code`,
            description: `State code ${stateCode} is not valid`,
            found: stateCode,
            expected: 'Valid state code (01-38, 97)',
            howToFix: 'Verify first 2 digits of GSTIN are correct state code',
            impact: 'Invalid state code will be rejected',
        };
    }

    return null;
}

export function validateTaxType(invoice: ParsedInvoice): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const supplierState = invoice.supplierGSTIN.substring(0, 2);
    const buyerState = invoice.buyerGSTIN.substring(0, 2);
    const isSameState = supplierState === buyerState;

    invoice.lineItems.forEach((item, index) => {
        if (isSameState && item.taxType === 'IGST') {
            issues.push({
                id: `tax-type-igst-same-state-line-${index + 1}`,
                severity: 'critical',
                category: 'Tax Type',
                title: `Wrong Tax Type - Line ${index + 1}`,
                description: 'IGST used for same-state transaction',
                location: `Line ${index + 1}: ${item.description}`,
                found: 'IGST',
                expected: 'CGST + SGST',
                howToFix: `Change from IGST ${item.taxRate}% to CGST ${item.taxRate / 2}% + SGST ${item.taxRate / 2}%`,
                impact: 'Portal will REJECT during GSTR-1 filing. Common cause of payment holds.',
            });
        }

        if (!isSameState && item.taxType === 'CGST_SGST') {
            issues.push({
                id: `tax-type-cgst-sgst-different-state-line-${index + 1}`,
                severity: 'critical',
                category: 'Tax Type',
                title: `Wrong Tax Type - Line ${index + 1}`,
                description: 'CGST+SGST used for interstate transaction',
                location: `Line ${index + 1}: ${item.description}`,
                found: 'CGST + SGST',
                expected: 'IGST',
                howToFix: `Change from CGST+SGST to IGST ${item.taxRate}%`,
                impact: 'Interstate transaction shown as intrastate. ITC mismatch will occur.',
            });
        }
    });

    return issues;
}

export function validateGSTCalculation(item: LineItem, lineNumber: number): ValidationIssue | null {
    const expectedTax = (item.taxableAmount * item.taxRate) / 100;
    const actualTax = item.cgst + item.sgst + item.igst;
    const difference = Math.abs(expectedTax - actualTax);

    if (difference > 1) {
        return {
            id: `calc-error-line-${lineNumber}`,
            severity: 'critical',
            category: 'GST Calculation',
            title: `Calculation Mismatch - Line ${lineNumber}`,
            description: 'GST amount does not match expected calculation',
            location: `Line ${lineNumber}: ${item.description}`,
            expected: expectedTax.toFixed(2),
            found: actualTax.toFixed(2),
            difference: difference,
            howToFix: `Update tax from ₹${actualTax.toFixed(2)} to ₹${expectedTax.toFixed(2)}. Formula: ₹${item.taxableAmount} × ${item.taxRate}% = ₹${expectedTax.toFixed(2)}`,
            impact: 'Calculation errors trigger audits and cause rejections',
        };
    }

    return null;
}

export function validateCGSTSGSTSplit(item: LineItem, lineNumber: number): ValidationIssue | null {
    if (item.taxType === 'CGST_SGST' && item.cgst > 0 && item.sgst > 0) {
        const difference = Math.abs(item.cgst - item.sgst);

        if (difference > 1) {
            return {
                id: `split-error-line-${lineNumber}`,
                severity: 'critical',
                category: 'CGST/SGST Split',
                title: `Unequal Split - Line ${lineNumber}`,
                description: 'CGST and SGST amounts must be equal',
                location: `Line ${lineNumber}`,
                expected: `Each should be ₹${((item.cgst + item.sgst) / 2).toFixed(2)}`,
                found: `CGST: ₹${item.cgst}, SGST: ₹${item.sgst}`,
                howToFix: `Make equal: CGST = SGST = ₹${((item.cgst + item.sgst) / 2).toFixed(2)}`,
                impact: 'Portal validation will fail',
            };
        }
    }

    return null;
}

export function validateHSNCode(item: LineItem, lineNumber: number): ValidationIssue | null {
    if (!item.hsnCode || item.hsnCode.trim() === '') {
        return {
            id: `hsn-missing-line-${lineNumber}`,
            severity: 'warning',
            category: 'HSN Code',
            title: `HSN Code Missing - Line ${lineNumber}`,
            description: 'HSN code is mandatory for GST compliance',
            location: `Line ${lineNumber}: ${item.description}`,
            expected: '4, 6, or 8 digit HSN code',
            found: 'Not provided',
            howToFix: 'Add appropriate HSN code for this product',
            impact: 'Required for GST filing. May cause rejection.',
        };
    }

    const hsnPattern = /^[0-9]{4,8}$/;
    if (!hsnPattern.test(item.hsnCode)) {
        return {
            id: `hsn-invalid-line-${lineNumber}`,
            severity: 'warning',
            category: 'HSN Code',
            title: `Invalid HSN Format - Line ${lineNumber}`,
            description: 'HSN code must be 4, 6, or 8 digits',
            location: `Line ${lineNumber}`,
            found: item.hsnCode,
            expected: '4-8 digit number',
            howToFix: 'Use only numeric HSN code with 4, 6, or 8 digits',
            impact: 'Portal may reject invalid format',
        };
    }

    return null;
}

export function validateTaxRate(item: LineItem, lineNumber: number): ValidationIssue | null {
    if (!VALID_GST_RATES.includes(item.taxRate as any)) {
        return {
            id: `rate-invalid-line-${lineNumber}`,
            severity: 'critical',
            category: 'Tax Rate',
            title: `Invalid GST Rate - Line ${lineNumber}`,
            description: `${item.taxRate}% is not a valid GST rate`,
            location: `Line ${lineNumber}`,
            found: `${item.taxRate}%`,
            expected: 'One of: 0%, 0.25%, 3%, 5%, 12%, 18%, 28%',
            howToFix: 'Use valid GST rate. Common rates: 5%, 12%, 18%, 28%',
            impact: 'Invalid rate will cause filing errors',
        };
    }

    return null;
}

export function validateInvoiceNumber(invoiceNumber: string): ValidationIssue | null {
    if (!invoiceNumber || invoiceNumber.trim() === '') {
        return {
            id: 'invoice-number-missing',
            severity: 'critical',
            category: 'Invoice Number',
            title: 'Invoice Number Missing',
            description: 'Invoice number is mandatory',
            found: 'Not provided',
            expected: 'Alphanumeric invoice number',
            howToFix: 'Enter invoice number',
            impact: 'Invoice invalid without number',
        };
    }

    if (invoiceNumber.length > 50) {
        return {
            id: 'invoice-number-too-long',
            severity: 'warning',
            category: 'Invoice Number',
            title: 'Invoice Number Too Long',
            description: 'Invoice number exceeds 50 characters',
            found: `${invoiceNumber.length} characters`,
            expected: 'Maximum 50 characters',
            howToFix: 'Shorten invoice number to 50 characters or less',
            impact: 'May cause tracking issues',
        };
    }

    const validPattern = /^[A-Za-z0-9\-\/\\]+$/;
    if (!validPattern.test(invoiceNumber)) {
        return {
            id: 'invoice-number-invalid-chars',
            severity: 'warning',
            category: 'Invoice Number',
            title: 'Invalid Characters in Invoice Number',
            description: 'Invoice number contains invalid characters',
            found: invoiceNumber,
            expected: 'Only letters, numbers, -, /, \\',
            howToFix: 'Remove special characters from invoice number',
            impact: 'May cause system errors',
        };
    }

    return null;
}

export function validateInvoiceDate(dateString: string): ValidationIssue | null {
    if (!dateString || dateString.trim() === '') {
        return {
            id: 'date-missing',
            severity: 'critical',
            category: 'Invoice Date',
            title: 'Invoice Date Missing',
            description: 'Invoice date is mandatory',
            found: 'Not provided',
            expected: 'Valid date',
            howToFix: 'Enter invoice date in DD-MM-YYYY format',
            impact: 'Invoice invalid without date',
        };
    }

    const date = new Date(dateString);
    const today = new Date();

    if (isNaN(date.getTime())) {
        return {
            id: 'date-invalid',
            severity: 'critical',
            category: 'Invoice Date',
            title: 'Invalid Date Format',
            description: 'Date format is not valid',
            found: dateString,
            expected: 'Valid date (DD-MM-YYYY)',
            howToFix: 'Enter date in correct format',
            impact: 'Portal will reject invalid dates',
        };
    }

    if (date > today) {
        return {
            id: 'date-future',
            severity: 'critical',
            category: 'Invoice Date',
            title: 'Future Date Not Allowed',
            description: 'Invoice date cannot be in the future',
            found: dateString,
            expected: 'Date today or earlier',
            howToFix: 'Correct invoice date to valid past date',
            impact: 'Portal rejects future dates',
        };
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (date < oneYearAgo) {
        return {
            id: 'date-too-old',
            severity: 'warning',
            category: 'Invoice Date',
            title: 'Invoice Date Very Old',
            description: 'Invoice date is more than 1 year old',
            found: dateString,
            expected: 'Within last 365 days',
            howToFix: 'Verify invoice date is correct',
            impact: 'May be questioned during audit',
        };
    }

    return null;
}

export function validateTaxableSum(invoice: ParsedInvoice): ValidationIssue | null {
    const calculatedSum = invoice.lineItems.reduce((sum, item) => sum + item.taxableAmount, 0);
    const difference = Math.abs(calculatedSum - invoice.taxableTotalAmount);

    if (difference > 1) {
        return {
            id: 'taxable-sum-mismatch',
            severity: 'critical',
            category: 'Taxable Sum',
            title: 'Taxable Amount Sum Mismatch',
            description: 'Line items do not add up to total taxable amount',
            expected: calculatedSum.toFixed(2),
            found: invoice.taxableTotalAmount.toFixed(2),
            difference: difference,
            howToFix: `Total taxable should be ₹${calculatedSum.toFixed(2)}, not ₹${invoice.taxableTotalAmount.toFixed(2)}`,
            impact: 'Summation errors cause rejection',
        };
    }

    return null;
}

export function validateInvoiceTotal(invoice: ParsedInvoice): ValidationIssue | null {
    const expectedTotal = invoice.taxableTotalAmount + invoice.totalTaxAmount;
    const difference = Math.abs(expectedTotal - invoice.invoiceTotalAmount);

    if (difference > 1) {
        return {
            id: 'invoice-total-mismatch',
            severity: 'critical',
            category: 'Invoice Total',
            title: 'Invoice Total Calculation Wrong',
            description: 'Total does not match taxable + tax amounts',
            expected: expectedTotal.toFixed(2),
            found: invoice.invoiceTotalAmount.toFixed(2),
            difference: difference,
            howToFix: `Total should be ₹${invoice.taxableTotalAmount} + ₹${invoice.totalTaxAmount} = ₹${expectedTotal.toFixed(2)}`,
            impact: 'Incorrect total will be flagged',
        };
    }

    return null;
}
