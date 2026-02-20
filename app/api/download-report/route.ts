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

        const pdfBuffer = await generatePDF(result, invoiceNumber || 'Unknown');

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="invoice-report-${invoiceNumber || result.checkId}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error('PDF generation error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
