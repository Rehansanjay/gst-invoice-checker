import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
    try {
        const { userId, packageType } = await request.json();
        // packageType: 'pack_10', 'pack_50', 'pack_100'

        const packages: Record<string, { price: number; credits: number }> = {
            pack_10: { price: 799, credits: 10 },
            pack_50: { price: 2999, credits: 50 },
            pack_100: { price: 4999, credits: 100 },
        };

        const pkg = packages[packageType];
        if (!pkg) {
            return NextResponse.json({ error: 'Invalid package type' }, { status: 400 });
        }

        // Create Razorpay order
        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const order = await razorpay.orders.create({
            amount: pkg.price * 100,
            currency: 'INR',
            receipt: `package_${userId}_${Date.now()}`,
        });

        // Create payment record
        await supabaseAdmin
            .from('payments')
            .insert({
                user_id: userId,
                razorpay_order_id: order.id,
                amount: pkg.price,
                payment_type: 'package_purchase',
                package_type: packageType,
                credits_included: pkg.credits,
                status: 'created',
            });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: pkg.price,
            credits: pkg.credits,
            razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error('Package purchase error:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
