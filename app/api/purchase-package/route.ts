import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import Razorpay from 'razorpay';
import { z } from 'zod';

const purchaseSchema = z.object({
    userId: z.string().uuid(),
    packageType: z.enum(['pack_10', 'pack_50', 'pack_100']),
    couponCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validation
        const result = purchaseSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error.format() }, { status: 400 });
        }

        const { userId, packageType, couponCode } = result.data;
        // packageType: 'pack_10', 'pack_50', 'pack_100'

        const packages: Record<string, { price: number; credits: number }> = {
            pack_10: { price: 399, credits: 10 },
            pack_50: { price: 1499, credits: 50 },
            pack_100: { price: 2499, credits: 100 },
        };

        const pkg = packages[packageType];

        let finalPrice = pkg.price;
        let discountApplied = false;

        // Apply coupon logic
        if (couponCode && couponCode.toUpperCase() === 'SAVE50') {
            finalPrice = Math.floor(pkg.price * 0.5);
            discountApplied = true;
        }

        // Create Razorpay order
        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const order = await razorpay.orders.create({
            amount: finalPrice * 100,
            currency: 'INR',
            receipt: `package_${userId}_${Date.now()}`,
        });

        // Create payment record
        await supabaseAdmin
            .from('payments')
            .insert({
                user_id: userId,
                razorpay_order_id: order.id,
                amount: finalPrice,
                payment_type: 'package_purchase',
                package_type: packageType,
                credits_included: pkg.credits,
                status: 'created',
            });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: finalPrice,
            credits: pkg.credits,
            razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error('Package purchase error:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
