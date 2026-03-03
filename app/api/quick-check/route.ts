import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';
import { invoiceDataSchema } from '@/lib/schemas';

const quickCheckSchema = z.object({
    guestEmail: z.string().email().optional().or(z.literal('')).nullable(),
    invoiceData: invoiceDataSchema,
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

        const { invoiceData, guestEmail, utm_source, utm_medium, utm_campaign, ref_code } = result.data;

        // Step 1: Create Razorpay order
        console.log('Init Razorpay with key:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'Present' : 'Missing');

        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const order = await razorpay.orders.create({
            amount: 9900, // ₹99 in paisa
            currency: 'INR',
            receipt: `quick_${Date.now()}`,
        });
        console.log('Razorpay order created:', order.id);

        // Step 2: Create payment record
        const { data: payment } = await supabaseAdmin
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

        // Step 3: Create check record (pending) — with attribution
        const { data: check } = await supabaseAdmin
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
                utm_source: utm_source || null,
                utm_medium: utm_medium || null,
                utm_campaign: utm_campaign || null,
                ref_code: ref_code || null,
            })
            .select()
            .single();

        return NextResponse.json({
            success: true,
            orderId: order.id,
            checkId: check.id,
            paymentId: payment.id,
            razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error('Quick check error:', error);
        return NextResponse.json({ error: 'Failed to create check' }, { status: 500 });
    }
}
