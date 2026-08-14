import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateInvoice } from '@/lib/services/validationService';
import { parseBulkCSV } from '@/lib/services/bulkParse';
import { checkRateLimit } from '@/lib/rateLimit';
import { BulkCheckResult, BulkInvoiceResult, LockedIssueSummary } from '@/types';

/**
 * Per-batch invoice cap. A real practice batch is larger than this; the cap is
 * the beta boundary and the natural point to talk to a firm about a plan.
 */
const MAX_INVOICES = 100;

/** ~2MB of CSV is far more than 100 invoices needs, and bounds the payload. */
const MAX_CSV_CHARS = 2_000_000;

const bulkSchema = z.object({
    csv: z.string().min(1).max(MAX_CSV_CHARS),
});

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        // Heavier than a single check — each batch runs up to 100 validations.
        const rl = checkRateLimit(ip, '/api/bulk-check', { limit: 6, windowMs: 60 * 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many uploads. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            );
        }

        const body = await request.json();
        const parsed = bulkSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input. Expected a CSV file under 2MB.' },
                { status: 400 }
            );
        }

        const { invoices, rowErrors, droppedForLimit } = parseBulkCSV(parsed.data.csv, MAX_INVOICES);

        if (invoices.length === 0) {
            return NextResponse.json(
                {
                    error: rowErrors[0]?.message ?? 'No valid invoices found in the file.',
                    rowErrors,
                },
                { status: 422 }
            );
        }

        // Validate sequentially rather than with Promise.all: validateInvoice is
        // CPU-bound and synchronous underneath, so parallelising buys nothing and
        // a 100-invoice Promise.all just spikes memory.
        const results: BulkInvoiceResult[] = [];
        let totalIssues = 0;
        let cleanInvoices = 0;
        let invoicesWithCritical = 0;
        let amountAtRisk = 0;

        for (const invoice of invoices) {
            const validation = await validateInvoice(invoice);

            const issues: LockedIssueSummary[] = validation.issuesFound.map((issue) => ({
                id: issue.id,
                severity: issue.severity,
                category: issue.category,
                title: issue.title,
            }));

            const criticalCount = validation.scoreBreakdown.criticalCount;
            totalIssues += validation.issuesFound.length;
            if (validation.issuesFound.length === 0) cleanInvoices++;
            if (criticalCount > 0) {
                invoicesWithCritical++;
                amountAtRisk += invoice.invoiceTotalAmount;
            }

            results.push({
                invoiceNumber: invoice.invoiceNumber,
                invoiceDate: invoice.invoiceDate,
                buyerGSTIN: invoice.buyerGSTIN,
                invoiceTotalAmount: invoice.invoiceTotalAmount,
                healthScore: validation.healthScore,
                riskLevel: validation.riskLevel,
                criticalCount,
                warningCount: validation.scoreBreakdown.warningCount,
                issues,
            });
        }

        // Worst first — a practitioner opens this to find what to fix, not to
        // read their file back in order.
        results.sort((a, b) => {
            if (b.criticalCount !== a.criticalCount) return b.criticalCount - a.criticalCount;
            return a.healthScore - b.healthScore;
        });

        const payload: BulkCheckResult = {
            totalInvoices: results.length,
            cleanInvoices,
            invoicesWithCritical,
            totalIssues,
            amountAtRisk: Math.round(amountAtRisk * 100) / 100,
            results,
            rowErrors,
            droppedForLimit,
            limit: MAX_INVOICES,
        };

        return NextResponse.json({ success: true, result: payload });

    } catch (error: unknown) {
        console.error('Bulk check error:', error);
        return NextResponse.json({ error: 'Could not process the file.' }, { status: 500 });
    }
}
