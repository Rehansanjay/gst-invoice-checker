import { NextRequest, NextResponse } from 'next/server';

const OCR_API_URL = 'https://api.ocr.space/parse/image';
const OCR_API_KEY = process.env.OCR_SPACE_API_KEY || 'helloworld';

// GST regex patterns
const GSTIN_REGEX = /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/g;
const INVOICE_NUMBER_REGEX = /(?:invoice\s*(?:no|number|#)|bill\s*(?:no|number)|inv\.?\s*no\.?)[:\s#]*([\w\-\/]+)/i;
const DATE_REGEX = /\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})\b/;
const AMOUNT_REGEX = /(?:taxable|taxable\s+value|assessable)[^₹\d]*([\d,]+\.?\d*)/i;
const CGST_REGEX = /\bCGST\b[^₹\d]*([\d,]+\.?\d*)/i;
const SGST_REGEX = /\bSGST\b[^₹\d]*([\d,]+\.?\d*)/i;
const IGST_REGEX = /\bIGST\b[^₹\d]*([\d,]+\.?\d*)/i;
const TOTAL_REGEX = /(?:grand\s+total|invoice\s+total|total\s+amount)[^₹\d]*([\d,]+\.?\d*)/i;
const HSN_REGEX = /\bHSN\b[:\s]*(\d{4,8})/i;
const SUPPLIER_NAME_REGEX = /(?:from|seller|supplier|issued\s+by)[:\s]*([A-Z][A-Za-z\s&.]+(?:Pvt\.?\s*Ltd\.?|LLP|LLC|Corp|Inc|Ltd\.?)?)/i;
const BUYER_NAME_REGEX = /(?:to|buyer|billed\s+to|ship\s+to|consignee)[:\s]*([A-Z][A-Za-z\s&.]+(?:Pvt\.?\s*Ltd\.?|LLP|LLC|Corp|Inc|Ltd\.?)?)/i;

function parseAmount(raw: string | undefined): number {
    if (!raw) return 0;
    return parseFloat(raw.replace(/,/g, '')) || 0;
}

function parseDate(raw: string): string {
    // Convert various formats to YYYY-MM-DD
    const parts = raw.split(/[\/\-\.]/);
    if (parts.length !== 3) return '';
    if (parts[0].length === 4) {
        // Already YYYY-MM-DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    // DD/MM/YYYY or DD/MM/YY
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
}

function extractFieldsFromText(text: string) {
    const gstins = [...text.matchAll(GSTIN_REGEX)].map(m => m[0]);

    const invoiceNumberMatch = text.match(INVOICE_NUMBER_REGEX);
    const dateMatch = text.match(DATE_REGEX);
    const amountMatch = text.match(AMOUNT_REGEX);
    const cgstMatch = text.match(CGST_REGEX);
    const sgstMatch = text.match(SGST_REGEX);
    const igstMatch = text.match(IGST_REGEX);
    const totalMatch = text.match(TOTAL_REGEX);
    const hsnMatch = text.match(HSN_REGEX);
    const supplierNameMatch = text.match(SUPPLIER_NAME_REGEX);
    const buyerNameMatch = text.match(BUYER_NAME_REGEX);

    const cgst = parseAmount(cgstMatch?.[1]);
    const sgst = parseAmount(sgstMatch?.[1]);
    const igst = parseAmount(igstMatch?.[1]);
    const taxableAmount = parseAmount(amountMatch?.[1]);
    const totalTaxAmount = cgst + sgst + igst;

    return {
        supplierGSTIN: gstins[0] || '',
        buyerGSTIN: gstins[1] || '',
        supplierName: supplierNameMatch?.[1]?.trim() || '',
        buyerName: buyerNameMatch?.[1]?.trim() || '',
        invoiceNumber: invoiceNumberMatch?.[1]?.trim() || '',
        invoiceDate: dateMatch ? parseDate(dateMatch[1]) : '',
        hsnCode: hsnMatch?.[1] || '',
        taxableAmount,
        cgst,
        sgst,
        igst,
        totalAmount: parseAmount(totalMatch?.[1]) || (taxableAmount + totalTaxAmount),
        totalTaxAmount,
        taxType: igst > 0 ? 'IGST' : 'CGST_SGST',
    };
}

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowed.includes(file.type)) {
            return NextResponse.json({ error: 'Unsupported file type for OCR' }, { status: 400 });
        }

        // Forward to OCR.space
        const ocrForm = new FormData();
        ocrForm.append('apikey', OCR_API_KEY);
        ocrForm.append('file', file);
        ocrForm.append('isOverlayRequired', 'false');
        ocrForm.append('detectOrientation', 'true');
        ocrForm.append('scale', 'true');
        ocrForm.append('OCREngine', '2'); // Engine 2 is better for structured docs
        if (file.type === 'application/pdf') {
            ocrForm.append('filetype', 'PDF');
        }

        const ocrResponse = await fetch(OCR_API_URL, {
            method: 'POST',
            body: ocrForm,
        });

        if (!ocrResponse.ok) {
            const errorText = await ocrResponse.text();
            console.error('OCR.space HTTP error:', ocrResponse.status, errorText);
            return NextResponse.json({ error: 'OCR service unavailable' }, { status: 502 });
        }

        const ocrData = await ocrResponse.json();

        if (ocrData.IsErroredOnProcessing) {
            console.error('OCR error:', ocrData.ErrorMessage);
            return NextResponse.json({ error: ocrData.ErrorMessage?.[0] || 'OCR processing failed' }, { status: 422 });
        }

        // Combine all parsed pages
        const fullText = (ocrData.ParsedResults || [])
            .map((r: any) => r.ParsedText || '')
            .join('\n');

        if (!fullText.trim()) {
            return NextResponse.json({ error: 'No text found in document' }, { status: 422 });
        }

        const extracted = extractFieldsFromText(fullText);

        return NextResponse.json({
            success: true,
            rawText: fullText,
            extracted,
        });

    } catch (error: any) {
        console.error('OCR extract error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
