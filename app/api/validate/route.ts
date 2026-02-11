import { NextRequest, NextResponse } from 'next/server';
import { validateInvoice } from '@/lib/services/validationService';
import { ParsedInvoice } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { invoiceData } = body as {
            invoiceData?: ParsedInvoice;
        };

        // Support both { invoiceData: {...} } and direct invoice object
        const invoice = invoiceData || body as ParsedInvoice;

        if (!invoice || !invoice.lineItems) {
            return NextResponse.json({ error: 'Invoice data required' }, { status: 400 });
        }

        // Validate invoice
        const validationResult = await validateInvoice(invoice);

        // Try to store in database (optional, only if Supabase is configured)
        let dbCheckId: string | null = null;
        if (
            process.env.NEXT_PUBLIC_SUPABASE_URL &&
            process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url'
        ) {
            try {
                const { supabaseAdmin } = await import('@/lib/supabase');
                const { data: checkRecord } = await supabaseAdmin
                    .from('checks')
                    .insert({
                        invoice_file_name: invoice.invoiceNumber,
                        status: 'completed',
                        parsed_data: invoice,
                        health_score: validationResult.healthScore,
                        risk_level: validationResult.riskLevel,
                        issues_found: validationResult.issuesFound,
                        checks_passed: validationResult.checksPassed,
                        validation_result: validationResult,
                        processing_time_ms: validationResult.processingTimeMs,
                    })
                    .select()
                    .single();

                if (checkRecord) {
                    dbCheckId = checkRecord.id;
                }
            } catch (dbError) {
                console.warn('DB storage skipped (Supabase not configured):', dbError);
            }
        }

        return NextResponse.json({
            success: true,
            checkId: dbCheckId || validationResult.checkId,
            result: validationResult,
        });

    } catch (error) {
        console.error('Validation error:', error);
        return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }
}
