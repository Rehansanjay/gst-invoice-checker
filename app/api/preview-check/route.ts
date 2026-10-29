import { NextRequest, NextResponse } from 'next/server';
import { validateInvoice } from '@/lib/services/validationService';
import { ALL_RULES } from '@/lib/services/validationRules';
import { ParsedInvoice, ValidationIssue, ValidationResult, LockedIssueSummary, RevealedIssue } from '@/types';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';
import { invoiceDataSchema } from '@/lib/schemas';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { PostgrestError } from '@supabase/supabase-js';
import { SAMPLE_INVOICE } from '@/lib/sample-invoice';

const validateSchema = z.object({
    invoiceData: invoiceDataSchema,
});

const SEVERITY_ORDER: Record<ValidationIssue['severity'], number> = {
    critical: 0,
    warning: 1,
    info: 2,
};

/**
 * Picks the single issue revealed for free: the most severe one, and within the
 * same severity the first the rules produced. Deterministic, so re-running the
 * same invoice always reveals the same issue.
 */
function pickRevealedIssue(issues: ValidationIssue[]): ValidationIssue | null {
    if (issues.length === 0) return null;
    return [...issues].sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    )[0];
}

/**
 * Saves a guest's free check to `checks` with `user_id: null`. Best-effort: a
 * failure here is logged and swallowed, never surfaced to the visitor, who
 * already has their preview by the time this is called.
 *
 * Uses the same progressive-fallback insert as /api/validate: drops any
 * column the live schema cache rejects (PGRST204) and retries, so drift
 * between this file's assumed columns and the live DB degrades gracefully
 * instead of losing the row entirely.
 */
async function saveGuestCheck(
    invoiceData: ParsedInvoice,
    guestIp: string,
    validationResult: ValidationResult
): Promise<void> {
    const invoiceDateValue = invoiceData.invoiceDate && invoiceData.invoiceDate.trim() !== ''
        ? invoiceData.invoiceDate
        : null;

    // The homepage's "test with a sample invoice" button (#70) submits this
    // exact constant straight through this same preview flow, so without a
    // marker these runs are indistinguishable from a real upload when
    // querying `checks`. Matched on invoice number alone: it's a fixed,
    // distinctive value ('INV-2026-0847') that only this constant ever
    // produces, and reusing the existing `utm_source` column needs no schema
    // change or new request field.
    const isSampleInvoice = invoiceData.invoiceNumber === SAMPLE_INVOICE.invoiceNumber;

    const insertAttempt: Record<string, unknown> = {
        check_type: 'quick',
        user_id: null,
        guest_ip: guestIp,
        invoice_number: invoiceData.invoiceNumber,
        invoice_date: invoiceDateValue,
        supplier_gstin: invoiceData.supplierGSTIN,
        buyer_gstin: invoiceData.buyerGSTIN || null,
        line_items: invoiceData.lineItems,
        taxable_total_amount: invoiceData.taxableTotalAmount,
        total_tax_amount: invoiceData.totalTaxAmount,
        invoice_total_amount: invoiceData.invoiceTotalAmount,
        invoice_hash: validationResult.invoiceHash,
        status: 'completed',
        health_score: validationResult.healthScore,
        risk_level: validationResult.riskLevel,
        issues_found: validationResult.issuesFound,
        checks_passed: validationResult.checksPassed,
        validation_result: validationResult,
        score_breakdown: validationResult.scoreBreakdown,
        processing_time_ms: validationResult.processingTimeMs,
        payment_status: 'pending',
        utm_source: isSampleInvoice ? 'sample_invoice' : null,
    };

    let dbError: PostgrestError | null = null;

    for (let attempt = 0; attempt < 12; attempt++) {
        const res = await supabaseAdmin.from('checks').insert(insertAttempt).select('id').single();

        if (!res.error) {
            dbError = null;
            break;
        }

        dbError = res.error;

        if (res.error.code === 'PGRST204') {
            const match = res.error.message.match(/'([^']+)' column/);
            const badCol = match?.[1];
            if (badCol && badCol in insertAttempt) {
                console.warn(`⚠️  [preview-check] Column '${badCol}' missing in live DB — skipping and retrying`);
                delete insertAttempt[badCol];
                continue;
            }
        }

        break;
    }

    if (dbError) {
        console.error('❌ [preview-check] Guest check save failed:', JSON.stringify(dbError, null, 2));
    }
}

export async function POST(request: NextRequest) {
    try {
        // ── Rate Limit: 10 previews per IP per hour ──────────────────
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const rl = checkRateLimit(ip, '/api/preview-check', { limit: 10, windowMs: 60 * 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            );
        }

        const body = await request.json();

        // Validation
        const result = validateSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error.format() }, { status: 400 });
        }

        const { invoiceData } = result.data as { invoiceData: ParsedInvoice };

        // Run validation logic
        const validationResult = await validateInvoice(invoiceData);

        // ── Save every guest check, immediately ─────────────────────────
        // Previously this route had no DB side effects at all, so a guest who
        // finished a check and never unlocked left no record anywhere — no way
        // to know whether the invoice they checked was clean or broken, or what
        // they uploaded. Saved best-effort and non-blocking: a DB hiccup here
        // must never stop a visitor from seeing their free preview.
        saveGuestCheck(invoiceData, ip, validationResult).catch((err) =>
            console.error('[preview-check] Guest check save threw:', err)
        );

        // ── Free tier: the #1 issue named but not explained ─────────────
        // Naming the single most severe issue (category + title) is what proves
        // the check actually ran — a bare count of "3 issues" is indistinguishable
        // from an upsell. Most faulty invoices carry one dominant error, so
        // explaining it in full for free (description, location, impact, GST law
        // reference) handed over the whole answer. All of that stays paid, served
        // only by /api/process-check after payment.
        const topIssue = pickRevealedIssue(validationResult.issuesFound);

        // Built as an explicit allowlist rather than by removing keys: if a new
        // sensitive field is ever added to ValidationIssue, this omits it by
        // default instead of leaking it until someone remembers to exclude it.
        const revealedIssue: RevealedIssue | null = topIssue
            ? {
                id: topIssue.id,
                ruleId: topIssue.ruleId,
                severity: topIssue.severity,
                category: topIssue.category,
                title: topIssue.title,
            }
            : null;

        const lockedIssues: LockedIssueSummary[] = validationResult.issuesFound
            .filter((issue) => issue.id !== topIssue?.id)
            .map((issue) => ({
                id: issue.id,
                severity: issue.severity,
                category: issue.category,
                title: issue.title,
            }));

        return NextResponse.json({
            success: true,
            result: {
                healthScore: validationResult.healthScore,
                riskLevel: validationResult.riskLevel,
                scoreBreakdown: validationResult.scoreBreakdown,
                processingTimeMs: validationResult.processingTimeMs,
                timestamp: validationResult.timestamp,
                revealedIssue,
                lockedIssues,
                passedCount: validationResult.checksPassed.length,
                totalCheckCount: ALL_RULES.length,
                // Explicitly NOT returning:
                // - the full issuesFound array (howToFix, impact, expected/found)
                // - checksPassed detail, checkId, invoiceHash
            },
        });

    } catch (error: unknown) {
        console.error('Preview check internal error:', error);
        return NextResponse.json({
            error: 'Validation failed'
        }, { status: 500 });
    }
}
