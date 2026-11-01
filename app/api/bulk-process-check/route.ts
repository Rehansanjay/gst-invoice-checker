import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

/**
 * Verifies payment and unlocks a guest's `/bulk` batch.
 *
 * Unlike /api/process-check (single check), there is no re-validation step:
 * /api/bulk-check already ran every rule and saved the full-fidelity result
 * (real issue titles, howToFix, rootCauses) to `checks.validation_result`
 * at save time. Unlocking is just verifying the payment actually happened
 * and handing that already-computed result back.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { checkId, paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

        if (!checkId || !paymentId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
            return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
        }

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            console.error('Bulk signature mismatch:', { expected: expectedSignature, got: razorpaySignature });
            return NextResponse.json({ error: 'Payment verification failed. Invalid signature.' }, { status: 400 });
        }

        const { data: checkRecord, error: checkError } = await supabaseAdmin
            .from('checks')
            .select('id, check_type, payment_id, validation_result')
            .eq('id', checkId)
            .maybeSingle();

        if (checkError || !checkRecord || checkRecord.check_type !== 'bulk') {
            console.error('bulk-process-check: batch not found:', checkId);
            return NextResponse.json({ error: 'Batch not found. Please re-run the check.' }, { status: 404 });
        }

        if (checkRecord.payment_id !== paymentId) {
            console.error('bulk-process-check: payment_id mismatch — possible fraud attempt', {
                checkId,
                expectedPaymentId: checkRecord.payment_id,
                suppliedPaymentId: paymentId,
            });
            return NextResponse.json({ error: 'Payment record mismatch. Access denied.' }, { status: 403 });
        }

        if (!checkRecord.validation_result) {
            return NextResponse.json({ error: 'Batch result not found. Please re-run the check.' }, { status: 404 });
        }

        await supabaseAdmin
            .from('payments')
            .update({
                status: 'captured',
                captured_at: new Date().toISOString(),
                razorpay_payment_id: razorpayPaymentId,
                razorpay_signature: razorpaySignature,
            })
            .eq('id', paymentId);

        await supabaseAdmin
            .from('checks')
            .update({ payment_status: 'success', razorpay_payment_id: razorpayPaymentId })
            .eq('id', checkId);

        return NextResponse.json({ success: true, result: checkRecord.validation_result });

    } catch (error) {
        console.error('bulk-process-check internal error:', error);
        return NextResponse.json({ error: 'Processing failed. Please contact support.' }, { status: 500 });
    }
}
