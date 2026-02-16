import { NextRequest, NextResponse } from 'next/server';
import { processInvoiceCheck } from '@/lib/services/checkProcessingService';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { checkId, paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

        // ─── STEP 1: Verify Razorpay Signature Directly ───────────────
        if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
            return NextResponse.json(
                { error: 'Missing payment verification fields' },
                { status: 400 }
            );
        }

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            console.error('Signature mismatch:', { expected: expectedSignature, got: razorpaySignature });
            return NextResponse.json(
                { error: 'Payment verification failed. Invalid signature.' },
                { status: 400 }
            );
        }

        // ─── STEP 2: Process Check via Shared Service ─────────────────
        const processingResult = await processInvoiceCheck(checkId, paymentId, razorpayPaymentId, razorpaySignature);

        return NextResponse.json({
            success: processingResult.success,
            result: processingResult.result,
            alreadyProcessed: processingResult.alreadyProcessed,
        });

    } catch (error: any) {
        console.error('process-check error:', error);
        return NextResponse.json(
            { error: error.message || 'Processing failed. Please contact support.' },
            { status: 500 }
        );
    }
}
