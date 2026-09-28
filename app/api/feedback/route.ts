import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';
import { FEEDBACK_TOOLS } from '@/lib/feedback';
import { notifyFeedback } from '@/lib/leadService';

/**
 * "Did this help?" comments from the free tools (components/FeedbackPrompt).
 *
 * The thumbs answer itself goes to GA; only a written comment comes here,
 * and it is emailed to us rather than stored, so there is no table and no
 * RLS to change. Email is optional and only used to ask a follow-up.
 */

const schema = z.object({
    tool: z.enum(FEEDBACK_TOOLS),
    useful: z.boolean(),
    comment: z.string().trim().min(1).max(1000),
    email: z.string().email().max(200).optional(),
    page: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const rl = checkRateLimit(ip, '/api/feedback', { limit: 10, windowMs: 60 * 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            );
        }

        const parsed = schema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
        }

        await notifyFeedback(parsed.data);
        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        console.error('Feedback error:', error);
        return NextResponse.json({ error: 'Could not send feedback.' }, { status: 500 });
    }
}
