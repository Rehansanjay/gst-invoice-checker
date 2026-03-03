import { supabaseAdmin } from '@/lib/supabase';
import { validateInvoice } from '@/lib/services/validationService';
import { sendEmailReport } from '@/lib/emailService';

export async function processInvoiceCheck(
    checkId: string,
    paymentId?: string,
    razorpayPaymentId?: string,
    razorpaySignature?: string
) {
    console.log(`[ProcessingService] Starting processing for check: ${checkId}`);

    // 1. Get Check Data
    const { data: check, error: checkError } = await supabaseAdmin
        .from('checks')
        .select('*')
        .eq('id', checkId)
        .single();

    if (checkError || !check) {
        throw new Error('Check not found');
    }

    if (check.status === 'completed') {
        console.log(`[ProcessingService] Check ${checkId} already completed.`);
        return {
            success: true,
            alreadyProcessed: true,
            result: check.validation_result,
        };
    }

    // 2. Mark Payment as Captured (if payment details provided)
    if (paymentId) {
        const updateData: any = {
            status: 'captured',
            captured_at: new Date().toISOString(), // was: completed_at (wrong column)
        };

        if (razorpayPaymentId) updateData.razorpay_payment_id = razorpayPaymentId;
        if (razorpaySignature) updateData.razorpay_signature = razorpaySignature;

        await supabaseAdmin
            .from('payments')
            .update(updateData)
            .eq('id', paymentId);
    }

    // Update check status to processing
    await supabaseAdmin
        .from('checks')
        .update({
            status: 'processing',
            payment_status: 'success',
            ...(razorpayPaymentId ? { razorpay_payment_id: razorpayPaymentId } : {}),
        })
        .eq('id', checkId);

    // 3. Deduct Credit (if applicable)
    if (check.user_id) {
        await deductCredit(check.user_id, checkId);
    }

    // 4. Build Invoice Data
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

    // 5. Run Validation
    const startTime = Date.now();
    const validationResult = await validateInvoice(invoiceData);
    const processingTime = Date.now() - startTime;

    // 6. Save Results
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
        })
        .eq('id', checkId);

    console.log(`[ProcessingService] Check ${checkId} completed successfully.`);

    // 7. Send Email Report (Non-blocking)
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
            console.error('[ProcessingService] Email failed (non-blocking):', err)
        );
    }

    return {
        success: true,
        result: validationResult,
    };
}

async function deductCredit(userId: string, checkId: string) {
    // Use atomic RPC to prevent race conditions (same pattern as /api/validate)
    const { error: rpcError } = await supabaseAdmin
        .rpc('decrement_credits', { user_id_param: userId, amount: 1 });

    if (rpcError) {
        console.error('Credit deduction RPC error:', rpcError);
        throw new Error('Credit deduction failed');
    }

    // Get updated balance for the transaction log
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('credits_remaining')
        .eq('id', userId)
        .single();

    await supabaseAdmin
        .from('credit_transactions')
        .insert({
            user_id: userId,
            transaction_type: 'usage',
            credits_used: 1,
            credits_added: 0,
            credits_balance: user?.credits_remaining ?? 0,
            check_id: checkId,
            description: 'Invoice validation check',
        });
}
