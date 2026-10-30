import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';
import { invoiceDataSchema } from '@/lib/schemas';
import { SINGLE_CHECK_PRICE_PAISE } from '@/lib/pricing';

const quickCheckSchema = z.object({
    guestEmail: z.string().email().optional().or(z.literal('')).nullable(),
    invoiceData: invoiceDataSchema,
    // The `checks` row /api/preview-check already inserted for this guest
    // run, if that save succeeded — reused below instead of inserting a
    // second row for the same check.
    checkId: z.string().uuid().optional().nullable(),
    isOwnerTest: z.boolean().optional(),
    // ── UTM & Referral Tracking ──────────────────────────────────────
    utm_source: z.string().max(64).optional().nullable(),
    utm_medium: z.string().max(64).optional().nullable(),
    utm_campaign: z.string().max(64).optional().nullable(),
    ref_code: z.string().max(32).optional().nullable(),
});

export async function POST(request: NextRequest) {
    try {
        // ── Rate Limit: 5 order creations per IP per hour ────────────
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const rl = checkRateLimit(ip, '/api/quick-check', { limit: 5, windowMs: 60 * 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            );
        }

        const body = await request.json();

        const result = quickCheckSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error.format() }, { status: 400 });
        }

        const { invoiceData, guestEmail, checkId, isOwnerTest, utm_source, utm_medium, utm_campaign, ref_code } = result.data;
        const resolvedUtmSource = isOwnerTest ? 'owner_test' : (utm_source || null);

        // Step 1: Create Razorpay order
        // Fail loudly and specifically if credentials are absent — previously a
        // missing secret produced an opaque auth error from the SDK, caught by
        // the generic handler below as "Failed to create check".
        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            console.error(
                `Razorpay credentials missing — key_id: ${keyId ? 'present' : 'MISSING'}, ` +
                `key_secret: ${keySecret ? 'present' : 'MISSING'}`
            );
            return NextResponse.json(
                { error: 'Payment gateway is not configured. Please contact support.', code: 'GATEWAY_NOT_CONFIGURED' },
                { status: 503 }
            );
        }

        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

        let order;
        try {
            order = await razorpay.orders.create({
                amount: SINGLE_CHECK_PRICE_PAISE,
                currency: 'INR',
                receipt: `quick_${Date.now()}`,
            });
        } catch (rzpError: unknown) {
            // Razorpay SDK errors carry statusCode and error.description — the
            // actual reason (unactivated account, bad credentials, amount limits)
            // lives here and was previously discarded.
            const e = rzpError as {
                statusCode?: number;
                error?: { code?: string; description?: string; reason?: string };
                message?: string;
            };
            console.error('Razorpay order creation failed:', {
                statusCode: e?.statusCode,
                code: e?.error?.code,
                description: e?.error?.description,
                reason: e?.error?.reason,
                message: e?.message,
                keyMode: keyId.startsWith('rzp_live_') ? 'live' : 'test',
            });
            return NextResponse.json(
                {
                    error: 'Could not reach the payment gateway. Please try again shortly.',
                    code: 'GATEWAY_ORDER_FAILED',
                    // Safe to expose: Razorpay's own description, no credentials.
                    reason: e?.error?.description ?? null,
                },
                { status: 502 }
            );
        }

        console.log('Razorpay order created:', order.id);

        // Step 2: Create payment record
        const { data: payment, error: paymentError } = await supabaseAdmin
            .from('payments')
            .insert({
                razorpay_order_id: order.id,
                amount: 99,
                payment_type: 'quick_check',
                package_type: 'single',
                customer_email: guestEmail || null,
                status: 'created',
            })
            .select()
            .single();

        // Without this the failure surfaces as `payment.id` throwing a
        // TypeError, caught below as a generic "Failed to create check" — which
        // tells neither the user nor Sentry that the DB write was the problem.
        if (paymentError || !payment) {
            console.error('Payment record insert failed:', paymentError);
            return NextResponse.json(
                { error: 'Could not start payment. Please try again.' },
                { status: 500 }
            );
        }

        // Step 3: Link to the check record (pending), with attribution.
        // If /api/preview-check already saved this exact guest run, update
        // that row rather than inserting a second one — otherwise (preview
        // save failed, or no checkId was ever issued) fall back to inserting
        // a fresh row, same as before. Status goes to 'pending' either way:
        // processInvoiceCheck short-circuits on a row already 'completed',
        // which preview-check's own row is, since it ran validation for the
        // free preview.
        const checkQuery = checkId
            ? supabaseAdmin
                .from('checks')
                .update({
                    guest_email: guestEmail || null,
                    payment_id: payment.id,
                    status: 'pending',
                    utm_source: resolvedUtmSource,
                    utm_medium: utm_medium || null,
                    utm_campaign: utm_campaign || null,
                    ref_code: ref_code || null,
                })
                .eq('id', checkId)
                .select()
                .single()
            : supabaseAdmin
                .from('checks')
                .insert({
                    check_type: 'quick',
                    guest_email: guestEmail || null,
                    guest_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
                    invoice_number: invoiceData.invoiceNumber,
                    invoice_date: invoiceData.invoiceDate,
                    supplier_gstin: invoiceData.supplierGSTIN,
                    buyer_gstin: invoiceData.buyerGSTIN || null,
                    line_items: invoiceData.lineItems,
                    taxable_total_amount: invoiceData.taxableTotalAmount,
                    total_tax_amount: invoiceData.totalTaxAmount,
                    invoice_total_amount: invoiceData.invoiceTotalAmount,
                    payment_id: payment.id,
                    status: 'pending',
                    // Attribution fields
                    utm_source: resolvedUtmSource,
                    utm_medium: utm_medium || null,
                    utm_campaign: utm_campaign || null,
                    ref_code: ref_code || null,
                })
                .select()
                .single();

        const { data: check, error: checkError } = await checkQuery;

        if (checkError || !check) {
            console.error('Check record insert/update failed:', checkError);
            return NextResponse.json(
                { error: 'Could not start payment. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: SINGLE_CHECK_PRICE_PAISE,
            checkId: check.id,
            paymentId: payment.id,
            razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error('Quick check error:', error);
        return NextResponse.json({ error: 'Failed to create check' }, { status: 500 });
    }
}
