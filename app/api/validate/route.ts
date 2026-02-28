import { NextRequest, NextResponse } from 'next/server';
import { validateInvoice } from '@/lib/services/validationService';
import { ParsedInvoice } from '@/types';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const validateSchema = z.object({
    invoiceData: z.object({
        invoiceNumber: z.string().min(1),
        invoiceDate: z.string(),
        supplierGSTIN: z.string().length(15),
        buyerGSTIN: z.string().length(15).optional().or(z.literal('')),
        lineItems: z.array(z.any()),
        taxableTotalAmount: z.number(),
        totalTaxAmount: z.number(),
        invoiceTotalAmount: z.number(),
    })
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validation
        const result = validateSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error.format() }, { status: 400 });
        }

        const { invoiceData } = result.data as { invoiceData: ParsedInvoice };
        const invoice = invoiceData;

        // 1. Require Authentication — guests must use /api/quick-check (₹99)
        const supabase = await createSupabaseServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({
                error: 'Please log in or use Quick Check (₹99) for guest validation.',
                code: 'auth_required'
            }, { status: 401 });
        }

        const userId = session.user.id;

        // 2. Check Credits
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('credits_remaining')
            .eq('id', userId)
            .single();

        if (!user || user.credits_remaining <= 0) {
            return NextResponse.json({
                error: 'Insufficient credits. Please upgrade your plan.',
                code: 'insufficient_credits'
            }, { status: 403 });
        }

        // 3. Validate
        const validationResult = await validateInvoice(invoice);

        // 4. Deduct Credit & Save — ONLY for signed-in users.
        //    Guest ₹99 checks go through /api/quick-check + /api/process-check — NOT saved here.
        let dbCheckId: string | null = null;

        if (userId) {
            try {
                // Deduct 1 credit
                const { error: rpcError } = await supabaseAdmin
                    .rpc('decrement_credits', { user_id_param: userId, amount: 1 });
                if (rpcError) console.error('Credit deduction RPC error:', rpcError);

                // Sanitize date — DB column is DATE type, must be valid or null
                const invoiceDateValue = invoice.invoiceDate && invoice.invoiceDate.trim() !== ''
                    ? invoice.invoiceDate
                    : null;

                // Progressive-fallback insert:
                // Tries to save with full columns, then auto-removes any column the live DB
                // schema cache rejects (PGRST204) until the insert succeeds.
                // This handles schema drift between the local schema file and the live DB.
                const baseInsert: Record<string, any> = {
                    user_id: userId,
                    invoice_number: invoice.invoiceNumber,
                    invoice_date: invoiceDateValue,
                    supplier_gstin: invoice.supplierGSTIN,
                    buyer_gstin: invoice.buyerGSTIN || null,
                    invoice_total_amount: invoice.invoiceTotalAmount,
                };

                // Desirable extra columns — may or may not exist in live DB
                const extras: Record<string, any> = {
                    check_type: 'bulk',
                    status: 'completed',
                    health_score: validationResult.healthScore,
                    risk_level: validationResult.riskLevel,
                    processing_time_ms: validationResult.processingTimeMs,
                };

                let checkRecord: { id: string } | null = null;
                let dbError: any = null;
                let insertAttempt: Record<string, any> = { ...baseInsert, ...extras };

                for (let attempt = 0; attempt < 12; attempt++) {
                    const res = await supabaseAdmin
                        .from('checks')
                        .insert(insertAttempt)
                        .select('id')
                        .single();

                    if (!res.error) {
                        checkRecord = res.data;
                        dbError = null;
                        break;
                    }

                    dbError = res.error;

                    // PGRST204 = column not found in schema cache → remove it and retry
                    if (res.error.code === 'PGRST204') {
                        const match = res.error.message.match(/'([^']+)' column/);
                        const badCol = match?.[1];
                        if (badCol && badCol in insertAttempt) {
                            console.warn(`⚠️  Column '${badCol}' missing in live DB — skipping and retrying`);
                            delete insertAttempt[badCol];
                            continue;
                        }
                    }

                    // Any other error — stop retrying
                    break;
                }

                if (dbError) {
                    console.error('❌ DB Insert Error (checks table):', JSON.stringify(dbError, null, 2));
                } else {
                    console.log(`✅ Check saved: ${checkRecord?.id} for user ${userId}`);
                    dbCheckId = checkRecord?.id ?? null;
                }

            } catch (error) {
                console.error('❌ Credit deduction or DB save threw exception:', error);
            }
        }
        // Guest/₹99 checks are intentionally NOT saved here.

        return NextResponse.json({
            success: true,
            checkId: dbCheckId || validationResult.checkId,
            result: validationResult,
            remainingCredits: userId ? 'Updated' : 'Guest',
        });
    } catch (error) {
        console.error('Validation error:', error);
        return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }
}
