import { ParsedInvoice, ValidationResult, ValidationIssue, ValidationCheck } from '@/types';
import * as rules from './validationRules';

export async function validateInvoice(invoice: ParsedInvoice): Promise<ValidationResult> {
    const startTime = Date.now();
    const issues: ValidationIssue[] = [];
    const passed: ValidationCheck[] = [];

    // RULE 1: GSTIN Format
    const supplierGSTINError = rules.validateGSTINFormat(invoice.supplierGSTIN, 'Supplier');
    const buyerGSTINError = rules.validateGSTINFormat(invoice.buyerGSTIN, 'Buyer');

    if (supplierGSTINError) issues.push(supplierGSTINError);
    else passed.push({ id: 'gstin-supplier', category: 'GSTIN', title: 'Supplier GSTIN Valid', description: 'Format verified' });

    if (buyerGSTINError) issues.push(buyerGSTINError);
    else passed.push({ id: 'gstin-buyer', category: 'GSTIN', title: 'Buyer GSTIN Valid', description: 'Format verified' });

    // RULE 2: Tax Type Logic
    const taxTypeErrors = rules.validateTaxType(invoice);
    if (taxTypeErrors.length > 0) issues.push(...taxTypeErrors);
    else passed.push({ id: 'tax-type', category: 'Tax Type', title: 'Tax Type Correct', description: 'CGST/SGST or IGST used correctly' });

    // RULE 3-6: Line Item Validations
    invoice.lineItems.forEach((item, index) => {
        const lineNumber = index + 1;

        // Calculation
        const calcError = rules.validateGSTCalculation(item, lineNumber);
        if (calcError) issues.push(calcError);

        // Split
        const splitError = rules.validateCGSTSGSTSplit(item, lineNumber);
        if (splitError) issues.push(splitError);

        // HSN
        const hsnError = rules.validateHSNCode(item, lineNumber);
        if (hsnError) issues.push(hsnError);

        // Tax Rate
        const rateError = rules.validateTaxRate(item, lineNumber);
        if (rateError) issues.push(rateError);
    });

    if (!issues.some(i => i.category === 'GST Calculation')) {
        passed.push({ id: 'calculation', category: 'Calculation', title: 'GST Calculations Accurate', description: 'All line items calculated correctly' });
    }

    if (!issues.some(i => i.category === 'CGST/SGST Split')) {
        passed.push({ id: 'split', category: 'Split', title: 'CGST/SGST Split Equal', description: 'Tax split verified' });
    }

    if (!issues.some(i => i.category === 'HSN Code')) {
        passed.push({ id: 'hsn', category: 'HSN', title: 'HSN Codes Present', description: 'All items have HSN codes' });
    }

    if (!issues.some(i => i.category === 'Tax Rate')) {
        passed.push({ id: 'rate', category: 'Rate', title: 'Tax Rates Valid', description: 'All rates are valid GST rates' });
    }

    // RULE 7: Invoice Number
    const invoiceNumberError = rules.validateInvoiceNumber(invoice.invoiceNumber);
    if (invoiceNumberError) issues.push(invoiceNumberError);
    else passed.push({ id: 'invoice-number', category: 'Invoice Number', title: 'Invoice Number Valid', description: 'Format acceptable' });

    // RULE 8: Invoice Date
    const dateError = rules.validateInvoiceDate(invoice.invoiceDate);
    if (dateError) issues.push(dateError);
    else passed.push({ id: 'date', category: 'Date', title: 'Invoice Date Valid', description: 'Date is valid' });

    // RULE 9: Taxable Sum
    const taxableSumError = rules.validateTaxableSum(invoice);
    if (taxableSumError) issues.push(taxableSumError);
    else passed.push({ id: 'taxable-sum', category: 'Totals', title: 'Taxable Sum Correct', description: 'Line items add up correctly' });

    // RULE 10: Invoice Total
    const totalError = rules.validateInvoiceTotal(invoice);
    if (totalError) issues.push(totalError);
    else passed.push({ id: 'invoice-total', category: 'Totals', title: 'Invoice Total Correct', description: 'Total calculation verified' });

    // Calculate health score
    const healthScore = calculateHealthScore(issues);
    const riskLevel = determineRiskLevel(healthScore, issues);
    const processingTimeMs = Date.now() - startTime;

    return {
        checkId: generateCheckId(),
        healthScore,
        riskLevel,
        issuesFound: issues,
        checksPassed: passed,
        processingTimeMs,
        timestamp: new Date().toISOString(),
    };
}

function calculateHealthScore(issues: ValidationIssue[]): number {
    let score = 100;

    issues.forEach(issue => {
        if (issue.severity === 'critical') score -= 15;
        else if (issue.severity === 'warning') score -= 5;
        else score -= 2;
    });

    return Math.max(0, score);
}

function determineRiskLevel(score: number, issues: ValidationIssue[]): 'low' | 'medium' | 'high' {
    const hasCritical = issues.some(i => i.severity === 'critical');

    if (hasCritical || score < 70) return 'high';
    if (score < 90) return 'medium';
    return 'low';
}

function generateCheckId(): string {
    return `IC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}
