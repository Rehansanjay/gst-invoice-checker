import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit } from '@/lib/rateLimit';

/**
 * Creates the ₹299 order for the interest computation certificate.
 *
 * ANONYMOUS, DELIBERATELY
 *
 * Every other paid path here requires a login. This one does not, and follows
 * /api/quick-check instead: the free calculator asks for nothing, so demanding
 * an account at the one moment somebody has decided to pay would lose most of
 * them. The certificate is delivered by email, which is the only identifier
 * actually needed.
 *
 * Nothing about the claim is stored at this point. The particulars are
 * re-supplied at delivery and recomputed server-side there, which avoids a
 * migration on a database that already has two waiting to be applied. The
 * price is fixed here regardless of anything the client sends.
 */

export const PRICE_RUPEES = 299;

const schema = z.object({
    email: z.string().email().max(200),
    utm_source: z.string().max(64).optional().nullable(),
    utm_campaign: z.string().max(64).optional().nullable(),
});

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const rl = checkRateLimit(ip, '/api/unpaid-invoice/order', { limit: 5, windowMs: 60 * 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            );
        }

        const parsed = schema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
        }

        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
            console.error(
                `Razorpay credentials missing — key_id: ${keyId ? 'present' : 'MISSING'}, `
                + `key_secret: ${keySecret ? 'present' : 'MISSING'}`
            );
            return NextResponse.json(
                { error: 'Payment is not available right now. Please try again later.', code: 'GATEWAY_NOT_CONFIGURED' },
                { status: 503 }
            );
        }

        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

        let order;
        try {
            order = await razorpay.orders.create({
                amount: PRICE_RUPEES * 100,
                currency: 'INR',
                receipt: `msme_${String(Date.now()).slice(-10)}`,
            });
        } catch (rzpError: unknown) {
            // Razorpay's own description carries the actual reason — an
            // unactivated account, bad credentials, an amount limit. Discarding
            // it here is what made an earlier payment failure undiagnosable.
            const e = rzpError as {
                statusCode?: number;
                error?: { code?: string; description?: string; reason?: string };
                message?: string;
            };
            console.error('Razorpay order creation failed:', {
                statusCode: e?.statusCode,
                code: e?.error?.code,
                description: e?.error?.description,
                keyMode: keyId.startsWith('rzp_live_') ? 'live' : 'test',
            });
            return NextResponse.json(
                {
                    error: 'Could not reach the payment gateway. Please try again shortly.',
                    code: 'GATEWAY_ORDER_FAILED',
                    reason: e?.error?.description ?? null,
                },
                { status: 502 }
            );
        }

        const { error: insertError } = await supabaseAdmin.from('payments').insert({
            razorpay_order_id: order.id,
            amount: PRICE_RUPEES,
            payment_type: 'msme_computation',
            package_type: 'single',
            customer_email: parsed.data.email.trim().toLowerCase(),
            status: 'created',
        });

        // Non-fatal. The delivery step verifies the Razorpay signature, which
        // is what actually proves payment; the row is for reconciliation. A
        // customer who has paid must not be refused their document because a
        // bookkeeping insert failed.
        if (insertError) {
            console.error('MSME computation payment row insert failed:', insertError.message);
        }

        return NextResponse.json({
            orderId: order.id,
            amount: PRICE_RUPEES,
            razorpayKeyId: keyId,
        });

    } catch (error: unknown) {
        console.error('MSME computation order error:', error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}
