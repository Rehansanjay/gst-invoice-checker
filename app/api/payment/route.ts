import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabase';

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        const { amount, packageType, email, phone } = await request.json();

        if (!amount || amount < 99) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: amount * 100, // Convert to paisa
            currency: 'INR',
            receipt: `order_${Date.now()}`,
            notes: {
                packageType: packageType || 'single',
                email: email || '',
                phone: phone || '',
            },
        });

        // Store in database
        await supabaseAdmin.from('payments').insert({
            razorpay_order_id: order.id,
            amount: amount,
            currency: 'INR',
            status: 'created',
            package_type: packageType || 'single',
            checks_included: packageType === 'pack_10' ? 10 : packageType === 'pack_50' ? 50 : packageType === 'pack_100' ? 100 : 1,
            email: email || null,
            phone: phone || null,
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
