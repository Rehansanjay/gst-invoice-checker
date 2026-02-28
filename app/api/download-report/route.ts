import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/generatePDF';
import { ValidationResult } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { result, invoiceNumber } = body as { result: ValidationResult; invoiceNumber: string };

        if (!result) {
            return NextResponse.json({ error: 'Missing validation result' }, { status: 400 });
        }

        const safeName = (invoiceNumber || result.checkId || 'report').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
        const pdfBuffer = await generatePDF(result, invoiceNumber || 'Unknown');

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="invoice-report-${safeName}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error('PDF generation error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
