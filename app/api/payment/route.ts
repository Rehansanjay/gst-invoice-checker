import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';

// ── Input Validation Schema ──────────────────────────────────────────
const paymentSchema = z.object({
    amount: z.number().int().min(99, 'Minimum amount is ₹99'),
    packageType: z.enum(['single', 'pack_10', 'pack_50', 'pack_100']).default('single'),
    email: z.string().email().optional().or(z.literal('')).nullable(),
    phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits').optional().or(z.literal('')).nullable(),
});

const CREDITS_MAP: Record<string, number> = {
    single: 1,
    pack_10: 10,
    pack_50: 50,
    pack_100: 100,
};

// ── Server-Side Price Validation ─────────────────────────────────────
const PRICES: Record<string, number> = {
    single: 99,
    pack_10: 399,
    pack_50: 1499,
    pack_100: 2499,
};

export async function POST(request: NextRequest) {
    try {
        // ── Rate Limit: 5 order creations per IP per hour ────────────
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const rl = checkRateLimit(ip, '/api/payment', { limit: 5, windowMs: 60 * 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            );
        }

        const body = await request.json();

        // ── Validate input ──────────────────────────────────────────
        const parsed = paymentSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: parsed.error.format() },
                { status: 400 }
            );
        }

        const { amount, packageType, email, phone } = parsed.data;

        // ── Server-Side Price Validation ──────────────────────────────
        const expectedPrice = PRICES[packageType];
        if (!expectedPrice || amount !== expectedPrice) {
            return NextResponse.json(
                { error: 'Invalid amount for the selected package.' },
                { status: 400 }
            );
        }

        // Lazily init Razorpay inside handler (env vars not available at build time)
        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });
        const order = await razorpay.orders.create({
            amount: amount * 100, // paisa
            currency: 'INR',
            receipt: `order_${Date.now()}`,
            notes: {
                packageType,
                email: email || '',
                phone: phone || '',
            },
        });

        // Store in database
        await supabaseAdmin.from('payments').insert({
            razorpay_order_id: order.id,
            amount,
            currency: 'INR',
            status: 'created',
            payment_type: 'package_purchase',       // required field — package purchases only
            package_type: packageType,
            credits_included: CREDITS_MAP[packageType] ?? 1,  // was: checks_included (wrong column)
            customer_email: email || null,          // was: email (wrong column)
            customer_phone: phone || null,          // was: phone (wrong column)
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error('Payment creation error:', error);
        return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 });
    }
}
