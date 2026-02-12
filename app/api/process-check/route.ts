import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateInvoice } from '@/lib/services/validationService';
import { sendEmailReport } from '@/lib/emailService';

export async function POST(request: NextRequest) {
    try {
        const { checkId, paymentId } = await request.json();

        // Step 1: Verify payment is successful
        const { data: payment } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        if (payment.status !== 'captured') {
            return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 });
        }

        // Step 2: Get check data
        const { data: check } = await supabaseAdmin
            .from('checks')
            .select('*')
            .eq('id', checkId)
            .single();

        if (!check) {
            return NextResponse.json({ error: 'Check not found' }, { status: 404 });
        }

        // Step 3: Run validation
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

        const validationResult = await validateInvoice(invoiceData);

        // Step 4: Update check with results
        await supabaseAdmin
            .from('checks')
            .update({
                status: 'completed',
                health_score: validationResult.healthScore,
                risk_level: validationResult.riskLevel,
                issues_found: validationResult.issuesFound,
                checks_passed: validationResult.checksPassed,
                validation_result: validationResult,
                processing_time_ms: validationResult.processingTimeMs,
                payment_status: 'success',
            })
            .eq('id', checkId);

        // Step 5: Send email if provided
        if (check.guest_email || check.user_id) {
            try {
                await sendEmailReport(
                    check.guest_email || check.user_id,
                    validationResult,
                    checkId
                );
            } catch (emailError) {
                console.error('Email sending failed, but continuing:', emailError);
            }
        }

        // Step 6: For bulk users, deduct credit
        if (check.user_id) {
            await deductCredit(check.user_id, checkId);
        }

        return NextResponse.json({
            success: true,
            result: validationResult,
        });

    } catch (error) {
        console.error('Processing error:', error);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}

async function deductCredit(userId: string, checkId: string) {
    // Get current user credits
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('credits_remaining, credits_used')
        .eq('id', userId)
        .single();

    if (!user || user.credits_remaining <= 0) {
        throw new Error('No credits remaining');
    }

    // Deduct 1 credit
    await supabaseAdmin
        .from('users')
        .update({
            credits_remaining: user.credits_remaining - 1,
            credits_used: user.credits_used + 1,
        })
        .eq('id', userId);

    // Log transaction
    await supabaseAdmin
        .from('credit_transactions')
        .insert({
            user_id: userId,
            transaction_type: 'usage',
            credits_used: 1,
            credits_balance: user.credits_remaining - 1,
            check_id: checkId,
            description: 'Invoice validation check',
        });
}
