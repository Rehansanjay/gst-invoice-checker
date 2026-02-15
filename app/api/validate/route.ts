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

        // 1. Identify User
        const supabase = await createSupabaseServerClient();
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        // 2. Check Credits (if user is logged in)
        if (userId) {
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
        }

        // 3. Validate
        const validationResult = await validateInvoice(invoice);

        // 4. Deduct Credit & Save (if user is logged in)
        let dbCheckId: string | null = null;

        if (userId) {
            try {
                // Deduct 1 credit
                await supabaseAdmin.rpc('decrement_credits', { user_id_param: userId, amount: 1 });

                // Save Check
                const { data: checkRecord, error: dbError } = await supabaseAdmin
                    .from('checks')
                    .insert({
                        user_id: userId, // Link to user
                        invoice_hash: validationResult.invoiceHash,
                        invoice_number: invoice.invoiceNumber,
                        invoice_date: invoice.invoiceDate,
                        supplier_gstin: invoice.supplierGSTIN,
                        buyer_gstin: invoice.buyerGSTIN,
                        invoice_total_amount: invoice.invoiceTotalAmount,
                        status: 'completed',
                        parsed_data: invoice, // Store full JSON
                        health_score: validationResult.healthScore,
                        risk_level: validationResult.riskLevel,
                        issues_found: validationResult.issuesFound,
                        checks_passed: validationResult.checksPassed,
                        score_breakdown: validationResult.scoreBreakdown,
                        validation_result: validationResult,
                        processing_time_ms: validationResult.processingTimeMs,
                    })
                    .select()
                    .single();

                if (dbError) {
                    console.error('DB Insert Error:', dbError);
                    // Don't fail the request if saving fails, but log it
                }

                if (checkRecord) dbCheckId = checkRecord.id;

            } catch (error) {
                console.error('Credit deduction or DB save failed:', error);
            }
        } else {
            // Guest Check (Optional: Save without user_id if needed, or skip)
            // For now, we skip saving guest checks to DB to save space, or save them with user_id=null if required.
            // Let's save them for analytics if needed, but the requirement was about user history.
        }

        return NextResponse.json({
            success: true,
            checkId: dbCheckId || validationResult.checkId,
            result: validationResult,
            remainingCredits: userId ? 'Updated' : 'Guest', // Frontend can refetch
        });
    } catch (error) {
        console.error('Validation error:', error);
        return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }
}
