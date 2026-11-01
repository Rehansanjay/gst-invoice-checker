import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';
import { BULK_UNLOCK_PRICE_PAISE } from '@/lib/pricing';

/**
 * Creates the Razorpay order to unlock a guest's already-free `/bulk` batch
 * result — mirrors /api/quick-check for the single-check flow, but reuses
 * the `checks` row /api/bulk-check already saved (checkId is required here;
 * unlike quick-check there is no "insert a fresh row" fallback, because a
 * bulk unlock with nothing to unlock makes no sense).
 */
const schema = z.object({
    checkId: z.string().uuid(),
    guestEmail: z.string().email().optional().or(z.literal('')).nullable(),
});

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const rl = checkRateLimit(ip, '/api/bulk-quick-check', { limit: 5, windowMs: 60 * 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            );
        }

        const body = await request.json();
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
        }

        const { checkId, guestEmail } = parsed.data;

        // The row must exist — /api/bulk-check saves it before this is ever
        // callable from the UI.
        const { data: existingCheck, error: lookupError } = await supabaseAdmin
            .from('checks')
            .select('id, check_type')
            .eq('id', checkId)
            .maybeSingle();

        if (lookupError || !existingCheck || existingCheck.check_type !== 'bulk') {
            return NextResponse.json({ error: 'Batch not found. Please re-run the check.' }, { status: 404 });
        }

        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            console.error(`Razorpay credentials missing — key_id: ${keyId ? 'present' : 'MISSING'}, key_secret: ${keySecret ? 'present' : 'MISSING'}`);
            return NextResponse.json(
                { error: 'Payment gateway is not configured. Please contact support.', code: 'GATEWAY_NOT_CONFIGURED' },
                { status: 503 }
            );
        }

        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

        let order;
        try {
            order = await razorpay.orders.create({
                amount: BULK_UNLOCK_PRICE_PAISE,
                currency: 'INR',
                receipt: `bulk_${Date.now()}`,
            });
        } catch (rzpError: unknown) {
            const e = rzpError as { statusCode?: number; error?: { description?: string }; message?: string };
            console.error('Razorpay order creation failed (bulk):', e);
            return NextResponse.json(
                {
                    error: 'Could not reach the payment gateway. Please try again shortly.',
                    code: 'GATEWAY_ORDER_FAILED',
                    reason: e?.error?.description ?? null,
                },
                { status: 502 }
            );
        }

        const { data: payment, error: paymentError } = await supabaseAdmin
            .from('payments')
            .insert({
                razorpay_order_id: order.id,
                amount: BULK_UNLOCK_PRICE_PAISE / 100,
                payment_type: 'bulk_check',
                package_type: 'bulk',
                customer_email: guestEmail || null,
                status: 'created',
            })
            .select()
            .single();

        if (paymentError || !payment) {
            console.error('Payment record insert failed (bulk):', paymentError);
            return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 500 });
        }

        // Link the payment to the batch row. Status stays whatever it already
        // is (the free run already set it to 'completed' — there is nothing
        // left to validate, only to unlock), so there's no "pending" state to
        // fall back out of if the guest abandons checkout.
        const { error: updateError } = await supabaseAdmin
            .from('checks')
            .update({ guest_email: guestEmail || null, payment_id: payment.id })
            .eq('id', checkId);

        if (updateError) {
            console.error('Batch row update failed (bulk):', updateError);
            return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: BULK_UNLOCK_PRICE_PAISE,
            checkId,
            paymentId: payment.id,
            razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error('Bulk quick-check error:', error);
        return NextResponse.json({ error: 'Failed to start unlock' }, { status: 500 });
    }
}
