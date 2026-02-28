import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

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

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
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

        // Create Razorpay order
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
