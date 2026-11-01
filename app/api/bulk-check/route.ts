import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateInvoice } from '@/lib/services/validationService';
import { parseBulkCSV } from '@/lib/services/bulkParse';
import { checkRateLimit } from '@/lib/rateLimit';
import { detectRootCauses } from '@/lib/services/bulkRootCause';
import { bucketCategory } from '@/lib/services/categoryBuckets';
import { BulkCheckResult, BulkInvoiceResult, ValidationIssue } from '@/types';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { PostgrestError } from '@supabase/supabase-js';

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

/**
 * An internal, full-fidelity invoice result — same shape `BulkInvoiceResult`
 * exposes, but `issues` carries the complete `ValidationIssue` (title,
 * ruleId, howToFix, etc.) rather than the redacted summary. Structurally a
 * superset of `BulkInvoiceResult`, so it can stand in anywhere that type is
 * expected (root-cause detection, the DB save) without a cast. Only the
 * free JSON response gets redacted down, right before it's sent.
 */
type FullBulkInvoiceResult = Omit<BulkInvoiceResult, 'issues'> & { issues: ValidationIssue[] };

/**
 * Saves a guest's free batch run to `checks` with `user_id: null`, mirroring
 * /api/preview-check's `saveGuestCheck` for the single-check flow — until
 * now a guest's bulk batch left no record anywhere. `line_items` is NOT
 * NULL on `checks`, so an empty array stands in for "no single invoice's
 * line items" on a batch row. The full, unredacted payload (real issue
 * titles and fixes) is what gets stored — the free *response* is redacted
 * separately, never this saved copy, since it also backs the paid unlock.
 */
async function saveGuestBulkCheck(
    payload: BulkCheckResult,
    guestIp: string,
    totalValue: number,
    totalTaxAtRisk: number
): Promise<string | null> {
    const riskLevel = payload.invoicesWithCritical > 0 ? 'high' : payload.totalIssues > 0 ? 'medium' : 'low';

    const insertAttempt: Record<string, unknown> = {
        check_type: 'bulk',
        user_id: null,
        guest_ip: guestIp,
        line_items: [],
        invoice_total_amount: Math.round(totalValue * 100) / 100,
        total_tax_amount: Math.round(totalTaxAtRisk * 100) / 100,
        status: 'completed',
        payment_status: 'pending',
        risk_level: riskLevel,
        validation_result: payload,
    };

    let dbError: PostgrestError | null = null;
    let insertedId: string | null = null;

    for (let attempt = 0; attempt < 12; attempt++) {
        const res = await supabaseAdmin.from('checks').insert(insertAttempt).select('id').single();

        if (!res.error) {
            dbError = null;
            insertedId = res.data?.id ?? null;
            break;
        }

        dbError = res.error;

        if (res.error.code === 'PGRST204') {
            const match = res.error.message.match(/'([^']+)' column/);
            const badCol = match?.[1];
            if (badCol && badCol in insertAttempt) {
                console.warn(`⚠️  [bulk-check] Column '${badCol}' missing in live DB — skipping and retrying`);
                delete insertAttempt[badCol];
                continue;
            }
        }

        break;
    }

    if (dbError) {
        console.error('❌ [bulk-check] Guest batch save failed:', JSON.stringify(dbError, null, 2));
    }

    return insertedId;
}

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
        const results: FullBulkInvoiceResult[] = [];
        let totalIssues = 0;
        let cleanInvoices = 0;
        let invoicesWithCritical = 0;
        let amountAtRisk = 0;
        let totalValue = 0;
        let totalTaxAtRisk = 0;

        for (const invoice of invoices) {
            const validation = await validateInvoice(invoice);

            const criticalCount = validation.scoreBreakdown.criticalCount;
            totalIssues += validation.issuesFound.length;
            totalValue += invoice.invoiceTotalAmount;
            if (validation.issuesFound.length === 0) cleanInvoices++;
            if (criticalCount > 0) {
                invoicesWithCritical++;
                amountAtRisk += invoice.invoiceTotalAmount;
                totalTaxAtRisk += invoice.totalTaxAmount;
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
                // Full fidelity here (title, ruleId, howToFix, ...) — this is
                // what gets saved to `checks` and what the paid unlock later
                // reads back. Only the free JSON response redacts it.
                issues: validation.issuesFound,
            });
        }

        // Worst first — a practitioner opens this to find what to fix, not to
        // read their file back in order.
        results.sort((a, b) => {
            if (b.criticalCount !== a.criticalCount) return b.criticalCount - a.criticalCount;
            return a.healthScore - b.healthScore;
        });

        // Group repeating defects by their likely upstream source, so the
        // report reads as a diagnosis rather than a list of symptoms.
        // FullBulkInvoiceResult is a structural superset of BulkInvoiceResult
        // (issues carries more fields, not fewer), so this needs no cast.
        const rootCauses = detectRootCauses(results);

        const payload: BulkCheckResult = {
            totalInvoices: results.length,
            cleanInvoices,
            invoicesWithCritical,
            totalIssues,
            amountAtRisk: Math.round(amountAtRisk * 100) / 100,
            results,
            rootCauses,
            rowErrors,
            droppedForLimit,
            limit: MAX_INVOICES,
        };

        // Every guest batch is now logged, same as /api/preview-check does
        // for single checks — previously a guest's bulk run left no record
        // anywhere. Best-effort: a save failure must never block the free
        // result the visitor is already looking at.
        const checkId = await saveGuestBulkCheck(payload, ip, totalValue, totalTaxAtRisk).catch((err) => {
            console.error('[bulk-check] Guest batch save threw:', err);
            return null;
        });

        // ── Free tier: category bucketed, title withheld ────────────────
        // Previously this sent back the real `issue.title` (e.g. "HSN Code
        // Missing — Line 1") for every issue on every invoice, for free —
        // the exact defect, not just that one exists. Redacted here, not
        // merely hidden in the UI: the real titles never leave this
        // function in the free response. The paid unlock reads them back
        // from the row just saved above.
        const freeResult: BulkCheckResult = {
            ...payload,
            results: results.map((r) => ({
                ...r,
                issues: r.issues.map((issue) => {
                    const bucket = bucketCategory(issue.ruleId, issue.category);
                    return {
                        id: issue.id,
                        severity: issue.severity,
                        category: bucket,
                        title: bucket,
                    };
                }),
            })),
        };

        return NextResponse.json({ success: true, checkId, result: freeResult });

    } catch (error: unknown) {
        console.error('Bulk check error:', error);
        return NextResponse.json({ error: 'Could not process the file.' }, { status: 500 });
    }
}
