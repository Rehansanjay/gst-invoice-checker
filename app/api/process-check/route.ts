import { NextRequest, NextResponse } from 'next/server';
import { processInvoiceCheck } from '@/lib/services/checkProcessingService';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { checkId, paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

        // ── STEP 1: Basic field presence check ──────────────────────
        if (!checkId || !paymentId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
            return NextResponse.json(
                { error: 'Missing payment verification fields' },
                { status: 400 }
            );
        }

        // ── STEP 2: Verify Razorpay Signature ───────────────────────
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

        // ── STEP 3: Fraud Detection — DB Cross-Check ─────────────────
        // Verify the checkId actually belongs to this paymentId in the DB.
        // Prevents replaying a checkId with a different payment to skip paying.
        const { data: checkRecord, error: checkError } = await supabaseAdmin
            .from('checks')
            .select('id, status, payment_id, validation_result')
            .eq('id', checkId)
            .maybeSingle();

        if (checkError || !checkRecord) {
            console.error('process-check: check not found:', checkId);
            return NextResponse.json(
                { error: 'Check not found. Please start a new check.' },
                { status: 404 }
            );
        }

        if (checkRecord.payment_id !== paymentId) {
            console.error('process-check: payment_id mismatch — possible fraud attempt', {
                checkId,
                expectedPaymentId: checkRecord.payment_id,
                suppliedPaymentId: paymentId,
            });
            return NextResponse.json(
                { error: 'Payment record mismatch. Access denied.' },
                { status: 403 }
            );
        }

        // ── STEP 4: Return cached result if already completed ─────────
        if (checkRecord.status === 'completed' && checkRecord.validation_result) {
            return NextResponse.json({
                success: true,
                result: checkRecord.validation_result,
                alreadyProcessed: true,
            });
        }

        // ── STEP 5: Process Check via Shared Service ──────────────────
        const processingResult = await processInvoiceCheck(checkId, paymentId, razorpayPaymentId, razorpaySignature);

        return NextResponse.json({
            success: processingResult.success,
            result: processingResult.result,
            alreadyProcessed: processingResult.alreadyProcessed,
        });

    } catch (error: any) {
        console.error('process-check internal error:', error);
        return NextResponse.json(
            { error: 'Processing failed. Please contact support.' },
            { status: 500 }
        );
    }
}

