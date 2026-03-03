import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/generatePDF';
import { ValidationResult } from '@/types';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
    try {
        // ── Rate Limit: 20 downloads per IP per hour ─────────────────
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const rl = checkRateLimit(ip, '/api/download-report', { limit: 20, windowMs: 60 * 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            );
        }

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
