import { NextResponse } from 'next/server';
import { CSV_TEMPLATE } from '@/lib/services/bulkParse';

/** Serves the bulk-upload CSV template, headers plus worked example rows. */
export async function GET() {
    return new NextResponse(CSV_TEMPLATE, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="invoicecheck-bulk-template.csv"',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}
