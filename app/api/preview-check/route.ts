import { NextRequest, NextResponse } from 'next/server';
import { validateInvoice } from '@/lib/services/validationService';
import { ParsedInvoice } from '@/types';
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

        // Run validation logic (Pure function, no DB side effects)
        const validationResult = await validateInvoice(invoiceData);

        // Return the result directly for preview (Client will handle blurring)
        return NextResponse.json({
            success: true,
            result: validationResult,
        });

    } catch (error: any) {
        console.error('Preview check error:', error);
        console.error('Stack trace:', error?.stack);
        return NextResponse.json({
            error: 'Validation failed',
            message: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}
