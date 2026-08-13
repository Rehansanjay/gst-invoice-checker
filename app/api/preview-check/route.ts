import { NextRequest, NextResponse } from 'next/server';
import { validateInvoice } from '@/lib/services/validationService';
import { ALL_RULES } from '@/lib/services/validationRules';
import { ParsedInvoice, ValidationIssue, LockedIssueSummary, RevealedIssue } from '@/types';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';
import { invoiceDataSchema } from '@/lib/schemas';

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

        // Run validation logic (Pure function, no DB side effects)
        const validationResult = await validateInvoice(invoiceData);

        // ── Free tier: one issue diagnosed, the rest named but locked ──
        // Showing one real, specifically-explained issue is what proves the check
        // actually ran — a bare count of "3 issues" is indistinguishable from an
        // upsell. The remedy stays paid: `howToFix`, the corrected `expected`
        // value and `difference` are stripped here so they never reach the
        // browser, and are served only by /api/process-check after payment.
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
                description: topIssue.description,
                location: topIssue.location,
                found: topIssue.found,
                impact: topIssue.impact,
                gstLawContext: topIssue.gstLawContext,
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
