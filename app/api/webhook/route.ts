import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('❌ Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const event = JSON.parse(body);
        console.log('✅ Webhook received:', event.event);

        if (event.event === 'payment.captured') {
            const payment = event.payload.payment.entity;

            // Update payment record
            const { data: paymentRecord } = await supabaseAdmin
                .from('payments')
                .update({
                    razorpay_payment_id: payment.id,
                    status: 'captured',
                    payment_method: payment.method,
                    completed_at: new Date().toISOString(),
                })
                .eq('razorpay_order_id', payment.order_id)
                .select()
                .single();

            if (!paymentRecord) {
                console.error('❌ Payment record not found for order:', payment.order_id);
                return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
            }

            console.log(`✅ Payment captured: ${paymentRecord.payment_type}`);

            // If package purchase, add credits to user
            if (paymentRecord.payment_type === 'package_purchase' && paymentRecord.user_id) {
                await handlePackagePurchase(paymentRecord);
            }

            // If quick check, trigger processing
            if (paymentRecord.payment_type === 'quick_check') {
                await handleQuickCheck(paymentRecord);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

async function handlePackagePurchase(paymentRecord: any) {
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('credits_remaining, total_credits_purchased')
        .eq('id', paymentRecord.user_id)
        .single();

    if (!user) {
        console.error('❌ User not found:', paymentRecord.user_id);
        return;
    }

    const newBalance = user.credits_remaining + paymentRecord.credits_included;

    await supabaseAdmin
        .from('users')
        .update({
            credits_remaining: newBalance,
            total_credits_purchased: user.total_credits_purchased + paymentRecord.credits_included,
            current_plan: paymentRecord.package_type,
            plan_purchased_at: new Date().toISOString(),
            credits_expire_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        })
        .eq('id', paymentRecord.user_id);

    // Log credit transaction
    await supabaseAdmin
        .from('credit_transactions')
        .insert({
            user_id: paymentRecord.user_id,
            transaction_type: 'purchase',
            credits_added: paymentRecord.credits_included,
            credits_balance: newBalance,
            payment_id: paymentRecord.id,
            description: `Purchased ${paymentRecord.package_type}`,
        });

    console.log(`✅ Added ${paymentRecord.credits_included} credits to user ${paymentRecord.user_id}`);
}

async function handleQuickCheck(paymentRecord: any) {
    // Get the check associated with this payment
    const { data: check } = await supabaseAdmin
        .from('checks')
        .select('id')
        .eq('payment_id', paymentRecord.id)
        .single();

    if (!check) {
        console.error('❌ Check not found for payment:', paymentRecord.id);
        return;
    }

    console.log(`✅ Triggering validation for check ${check.id}`);

    // Trigger background processing
    // In production, use queue like BullMQ or Supabase Edge Function
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/process-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                checkId: check.id,
                paymentId: paymentRecord.id,
            }),
        });

        if (!response.ok) {
            console.error('❌ Processing failed:', await response.text());
        } else {
            console.log('✅ Check processed successfully');
        }
    } catch (error) {
        console.error('❌ Failed to trigger processing:', error);
    }
}
