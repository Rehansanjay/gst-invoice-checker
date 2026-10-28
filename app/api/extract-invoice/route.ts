import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';
import { invoiceDataSchema } from '@/lib/schemas';
import { ParsedInvoice, LineItem } from '@/types';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// ── Shape Gemini must return — line items only; totals are recomputed below
// rather than trusted from the model, so a hallucinated total never reaches
// the validator. ─────────────────────────────────────────────────────────
const extractedLineItemSchema = z.object({
    description: z.string().optional().default(''),
    hsnCode: z.string().optional().default(''),
    quantity: z.number().optional().default(1),
    rate: z.number().optional().default(0),
    taxRate: z.number().optional().default(18),
    taxType: z.enum(['CGST_SGST', 'IGST']).optional(),
});

const extractedInvoiceSchema = z.object({
    invoiceNumber: z.string().optional().default(''),
    invoiceDate: z.string().optional().default(''), // YYYY-MM-DD
    supplierGSTIN: z.string().optional().default(''),
    buyerGSTIN: z.string().optional().default(''),
    supplierName: z.string().optional().default(''),
    buyerName: z.string().optional().default(''),
    invoiceType: z
        .enum(['tax_invoice', 'bill_of_supply', 'credit_note', 'debit_note', 'export_invoice'])
        .optional(),
    placeOfSupply: z.string().optional().default(''),
    reverseCharge: z.boolean().optional().default(false),
    lineItems: z.array(extractedLineItemSchema).max(500).optional().default([]),
});

const GEMINI_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        invoiceNumber: { type: 'string' },
        invoiceDate: { type: 'string', description: 'YYYY-MM-DD' },
        supplierGSTIN: { type: 'string', description: '15-character GSTIN' },
        buyerGSTIN: { type: 'string', description: '15-character GSTIN, empty string if absent' },
        supplierName: { type: 'string' },
        buyerName: { type: 'string' },
        invoiceType: {
            type: 'string',
            enum: ['tax_invoice', 'bill_of_supply', 'credit_note', 'debit_note', 'export_invoice'],
        },
        placeOfSupply: { type: 'string', description: '2-digit GST state code' },
        reverseCharge: { type: 'boolean' },
        lineItems: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    description: { type: 'string' },
                    hsnCode: { type: 'string' },
                    quantity: { type: 'number' },
                    rate: { type: 'number', description: 'price per unit, excluding tax' },
                    taxRate: { type: 'number', description: 'GST % such as 5, 12, 18, 28' },
                    taxType: { type: 'string', enum: ['CGST_SGST', 'IGST'] },
                },
                required: ['description', 'rate', 'taxRate'],
            },
        },
    },
    required: ['invoiceNumber', 'invoiceDate', 'supplierGSTIN', 'lineItems'],
};

const EXTRACTION_PROMPT = `You are reading a photo or PDF of an Indian GST invoice, which may be a messy phone photo or a WhatsApp forward. Extract the fields below exactly as printed. Rules:
- GSTINs are 15 characters: 2-digit state code, 10-character PAN, entity code, "Z", checksum. Copy digits/letters carefully; do not guess a GSTIN that is not visible.
- invoiceDate must be YYYY-MM-DD. Convert from whatever format is printed.
- taxType is "CGST_SGST" if the invoice shows separate CGST and SGST lines, or "IGST" if it shows IGST.
- rate is the per-unit price before tax. quantity defaults to 1 if not itemized.
- If a field is not visible or not printed, leave it as an empty string / 0 — never invent a value.
- Return one lineItems entry per distinct product/service line on the invoice.`;

function recalcLineItem(item: z.infer<typeof extractedLineItemSchema>, index: number): LineItem {
    const quantity = item.quantity || 1;
    const rate = item.rate || 0;
    const taxableAmount = quantity * rate;
    const taxRate = item.taxRate || 0;
    const taxType: 'CGST_SGST' | 'IGST' = item.taxType || 'CGST_SGST';
    const taxAmount = (taxableAmount * taxRate) / 100;
    const cgst = taxType === 'CGST_SGST' ? taxAmount / 2 : 0;
    const sgst = taxType === 'CGST_SGST' ? taxAmount / 2 : 0;
    const igst = taxType === 'IGST' ? taxAmount : 0;
    return {
        lineNumber: index + 1,
        description: item.description || '',
        hsnCode: item.hsnCode || '',
        quantity,
        rate,
        taxableAmount,
        taxRate,
        taxType,
        cgst,
        sgst,
        igst,
        totalAmount: taxableAmount + taxAmount,
    };
}

/** True once the extraction has enough to skip straight to validation. */
function isCompleteEnough(invoice: ParsedInvoice): boolean {
    const gstinOk = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(invoice.supplierGSTIN);
    const infoOk = !!invoice.invoiceNumber && !!invoice.invoiceDate;
    const lineItemsOk = invoice.lineItems.length > 0 && invoice.lineItems.some((i) => i.taxableAmount > 0);
    return gstinOk && infoOk && lineItemsOk;
}

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const rl = checkRateLimit(ip, '/api/extract-invoice', { limit: 10, windowMs: 60 * 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            );
        }

        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
        }
        if (file.size > MAX_FILE_BYTES) {
            return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 });
        }

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            console.error('GEMINI_API_KEY not configured');
            return NextResponse.json({ error: 'Extraction service not configured' }, { status: 503 });
        }

        const fileBytes = await file.arrayBuffer();
        const base64Data = Buffer.from(fileBytes).toString('base64');

        const geminiBody = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: EXTRACTION_PROMPT },
                        { inlineData: { mimeType: file.type, data: base64Data } },
                    ],
                },
            ],
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: GEMINI_RESPONSE_SCHEMA,
                temperature: 0,
            },
        };

        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody),
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini HTTP error:', geminiResponse.status, errorText);
            return NextResponse.json({ error: 'Extraction service unavailable' }, { status: 502 });
        }

        const geminiData = await geminiResponse.json();
        const rawJson = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJson) {
            console.error('Gemini returned no content:', JSON.stringify(geminiData).slice(0, 500));
            return NextResponse.json({ error: 'Could not read the document' }, { status: 422 });
        }

        let parsedJson: unknown;
        try {
            parsedJson = JSON.parse(rawJson);
        } catch (e) {
            console.error('Gemini returned invalid JSON:', e);
            return NextResponse.json({ error: 'Could not read the document' }, { status: 422 });
        }

        const parseResult = extractedInvoiceSchema.safeParse(parsedJson);
        if (!parseResult.success) {
            console.error('Gemini output failed schema:', parseResult.error.format());
            return NextResponse.json({ error: 'Could not read the document' }, { status: 422 });
        }

        const extracted = parseResult.data;
        const lineItems = extracted.lineItems.length > 0
            ? extracted.lineItems.map(recalcLineItem)
            : [];

        const taxableTotalAmount = lineItems.reduce((sum, i) => sum + i.taxableAmount, 0);
        const totalTaxAmount = lineItems.reduce((sum, i) => sum + i.cgst + i.sgst + i.igst, 0);

        const invoice: ParsedInvoice = {
            invoiceNumber: extracted.invoiceNumber,
            invoiceDate: extracted.invoiceDate,
            supplierGSTIN: extracted.supplierGSTIN.toUpperCase(),
            buyerGSTIN: extracted.buyerGSTIN.toUpperCase(),
            supplierName: extracted.supplierName,
            buyerName: extracted.buyerName,
            lineItems,
            taxableTotalAmount,
            totalTaxAmount,
            invoiceTotalAmount: taxableTotalAmount + totalTaxAmount,
            invoiceType: extracted.invoiceType,
            placeOfSupply: extracted.placeOfSupply,
            reverseCharge: extracted.reverseCharge,
        };

        // Confirm the recomputed invoice still satisfies the shared schema
        // before telling the client it's complete enough to auto-submit.
        const schemaCheck = invoiceDataSchema.safeParse(invoice);
        const complete = schemaCheck.success && isCompleteEnough(invoice);

        return NextResponse.json({
            success: true,
            extracted: invoice,
            complete,
        });

    } catch (error) {
        console.error('Extract-invoice error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
