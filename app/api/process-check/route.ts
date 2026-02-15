import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateInvoice } from '@/lib/services/validationService';
import { sendEmailReport } from '@/lib/emailService';
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

        // ─── STEP 2: Get Check Data ────────────────────────────────────
        const { data: check, error: checkError } = await supabaseAdmin
            .from('checks')
            .select('*')
            .eq('id', checkId)
            .single();

        if (checkError || !check) {
            return NextResponse.json({ error: 'Check not found' }, { status: 404 });
        }

        if (check.status === 'completed') {
            return NextResponse.json({
                success: true,
                alreadyProcessed: true,
                result: check.validation_result,
            });
        }

        // ─── STEP 3: Mark Payment as Captured ─────────────────────────
        if (paymentId) {
            await supabaseAdmin
                .from('payments')
                .update({
                    status: 'captured',
                    razorpay_payment_id: razorpayPaymentId,
                    razorpay_signature: razorpaySignature,
                    // captured_at: new Date().toISOString(), // Column might not exist, checking schema... Schema doesn't show captured_at, removing to be safe or assuming schema update? 
                    // User provided code has it. I'll include it but if it fails I'll remove. 
                    // Actually looking at schema provided earlier (Step 61), payments table has updated_at but no specific captured_at. 
                    // However user *provided* this code explicitly. I should probably trust them or check schema again.
                    // Schema in Step 61: 
                    // completed_at TIMESTAMPTZ,
                    // created_at TIMESTAMPTZ DEFAULT NOW(),
                    // updated_at TIMESTAMPTZ DEFAULT NOW()
                    // It does NOT have captured_at. I will map it to completed_at or remove it.
                    // safely remove captured_at to avoid error, or map to completed_at.
                    // I'll map to completed_at which exists.
                    completed_at: new Date().toISOString(),
                })
                .eq('id', paymentId);
        }

        // Also update check's payment status
        await supabaseAdmin
            .from('checks')
            .update({
                status: 'processing',
                payment_status: 'success',
                razorpay_payment_id: razorpayPaymentId,
            })
            .eq('id', checkId);

        // ─── STEP 4: Deduct Credit for Bulk Users (BEFORE validation) ─
        if (check.user_id) {
            await deductCredit(check.user_id, checkId);
        }

        // ─── STEP 5: Build Invoice Data for Validation ────────────────
        const invoiceData = {
            invoiceNumber: check.invoice_number,
            invoiceDate: check.invoice_date,
            supplierGSTIN: check.supplier_gstin,
            buyerGSTIN: check.buyer_gstin,
            lineItems: check.line_items,
            taxableTotalAmount: check.taxable_total_amount,
            totalTaxAmount: check.total_tax_amount,
            invoiceTotalAmount: check.invoice_total_amount,
        };

        // ─── STEP 6: Run Validation ────────────────────────────────────
        const startTime = Date.now();
        const validationResult = await validateInvoice(invoiceData);
        const processingTime = Date.now() - startTime;

        // ─── STEP 7: Save Results ──────────────────────────────────────
        await supabaseAdmin
            .from('checks')
            .update({
                status: 'completed',
                health_score: validationResult.healthScore,
                risk_level: validationResult.riskLevel,
                issues_found: validationResult.issuesFound,
                checks_passed: validationResult.checksPassed,
                validation_result: validationResult,
                processing_time_ms: processingTime,
                // completed_at: new Date().toISOString(), // Check table doesn't support completed_at in schema Step 61? 
                // Schema Step 61 Check table:
                // created_at TIMESTAMPTZ DEFAULT NOW(),
                // updated_at TIMESTAMPTZ DEFAULT NOW()
                // auto_delete_at
                // NO completed_at.
                // I will remove completed_at from checks update to be safe.
            })
            .eq('id', checkId);

        // ─── STEP 8: Send Email Report (Non-blocking) ──────────────────
        let reportEmail = check.guest_email;

        if (!reportEmail && check.user_id) {
            const { data: userData } = await supabaseAdmin
                .from('users')
                .select('email')
                .eq('id', check.user_id)
                .single();
            reportEmail = userData?.email;
        }

        if (reportEmail) {
            sendEmailReport(reportEmail, validationResult, checkId).catch((err) =>
                console.error('Email failed (non-blocking):', err)
            );
        }

        return NextResponse.json({
            success: true,
            checkId,
            result: validationResult,
        });

    } catch (error: any) {
        console.error('process-check error:', error);
        return NextResponse.json(
            { error: 'Processing failed. Please contact support.' },
            { status: 500 }
        );
    }
}

async function deductCredit(userId: string, checkId: string) {
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('credits_remaining, credits_used')
        .eq('id', userId)
        .single();

    if (error || !user) throw new Error('User not found for credit deduction');
    if (user.credits_remaining <= 0) throw new Error('No credits remaining');

    const newBalance = user.credits_remaining - 1;

    await supabaseAdmin
        .from('users')
        .update({
            credits_remaining: newBalance,
            credits_used: user.credits_used + 1,
        })
        .eq('id', userId);

    await supabaseAdmin
        .from('credit_transactions')
        .insert({
            user_id: userId,
            transaction_type: 'usage',
            credits_used: 1,
            credits_added: 0,
            credits_balance: newBalance,
            check_id: checkId,
            description: 'Invoice validation check',
        });
}

async function refundCredit(userId: string, checkId: string, reason: string) {
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('credits_remaining')
        .eq('id', userId)
        .single();

    if (!user) return;

    const newBalance = user.credits_remaining + 1;

    await supabaseAdmin
        .from('users')
        .update({ credits_remaining: newBalance })
        .eq('id', userId);

    await supabaseAdmin
        .from('credit_transactions')
        .insert({
            user_id: userId,
            transaction_type: 'refund',
            credits_added: 1,
            credits_used: 0,
            credits_balance: newBalance,
            check_id: checkId,
            description: `Refund: ${reason}`,
        });

    console.log(`Credit refunded for user ${userId}: ${reason}`);
}
