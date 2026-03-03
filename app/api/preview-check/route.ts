import { NextRequest, NextResponse } from 'next/server';
import { validateInvoice } from '@/lib/services/validationService';
import { ParsedInvoice } from '@/types';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';
import { invoiceDataSchema } from '@/lib/schemas';

const validateSchema = z.object({
    invoiceData: invoiceDataSchema,
});

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

        // ── SECURITY: Return ONLY teaser data ────────────────────────
        // Full details (issuesFound, checksPassed, howToFix) are ONLY
        // available after payment via /api/process-check.
        // This prevents users from calling the API directly to bypass payment.
        return NextResponse.json({
            success: true,
            result: {
                healthScore: validationResult.healthScore,
                riskLevel: validationResult.riskLevel,
                scoreBreakdown: validationResult.scoreBreakdown,
                processingTimeMs: validationResult.processingTimeMs,
                timestamp: validationResult.timestamp,
                // Explicitly NOT returning:
                // - issuesFound (detailed issue descriptions, howToFix, impact)
                // - checksPassed (passed check details)
                // - checkId, invoiceHash (internal identifiers)
            },
        });

    } catch (error: unknown) {
        console.error('Preview check internal error:', error);
        return NextResponse.json({
            error: 'Validation failed'
        }, { status: 500 });
    }
}
