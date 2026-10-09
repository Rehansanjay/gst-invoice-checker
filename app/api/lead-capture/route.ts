import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit } from '@/lib/rateLimit';
import { WATCH_SUPPLIER_BANDS, WATCH_PRICE_ANSWERS, WATCH_PRICE_RUPEES } from '@/lib/watch';
import { EARLY_ACCESS, PRICE_ANSWERS, RECON_GSTIN_BANDS, NOTICE_TYPES } from '@/lib/earlyAccess';
import { sendBulkSummaryEmail, sendCheckSummaryEmail, sendUnpaidSummaryEmail, sendWatchConfirmationEmail, sendEarlyAccessConfirmationEmail, notifyNewLead } from '@/lib/leadService';

/**
 * Email capture for the FREE tools. Distinct from /api/email-report, which
 * requires an authenticated session and a paid checkId.
 *
 * Delivery is what the visitor asked for, so it takes priority: if the leads
 * table is missing or the insert fails, the email still goes out and we are
 * still notified. A storage problem must not cost the user their report.
 */

const bulkSummarySchema = z.object({
    totalInvoices: z.number().int().min(0).max(1000),
    cleanInvoices: z.number().int().min(0).max(1000),
    invoicesWithCritical: z.number().int().min(0).max(1000),
    totalIssues: z.number().int().min(0).max(100000),
    amountAtRisk: z.number().min(0),
    results: z.array(z.object({
        invoiceNumber: z.string().max(100),
        invoiceDate: z.string().max(20),
        buyerGSTIN: z.string().max(20),
        invoiceTotalAmount: z.number(),
        healthScore: z.number(),
        riskLevel: z.enum(['low', 'medium', 'high']),
        criticalCount: z.number(),
        warningCount: z.number(),
        issues: z.array(z.object({
            id: z.string(), severity: z.enum(['critical', 'warning', 'info']),
            category: z.string(), title: z.string(),
        })),
    })).max(200),
    rowErrors: z.array(z.object({ row: z.number(), message: z.string() })).max(200),
    droppedForLimit: z.number(),
    limit: z.number(),
});

const checkSummarySchema = z.object({
    invoiceNumber: z.string().max(100),
    healthScore: z.number().min(0).max(100),
    issueTitles: z.array(z.string().max(200)).max(50),
});

/**
 * The delayed-payment tool. Carries the letter template so the attachment is
 * built from the same computation the visitor saw, rather than recomputed here
 * against a Bank Rate that may have moved between the two requests.
 */
const unpaidSummarySchema = z.object({
    principal: z.string().max(40),
    interest: z.string().max(40),
    total: z.string().max(40),
    monthlyAccrual: z.string().max(40),
    daysOverdue: z.number().int().min(0).max(100000),
    interestStartsOn: z.string().max(20),
    computedTo: z.string().max(20),
    letterText: z.string().max(60000),
    letterFilename: z.string().max(120),
});

/**
 * Vendor GST Watch early access. Not a product yet: these two answers are the
 * test of whether it should become one, so they are stored in `detail`.
 */
const watchSummarySchema = z.object({
    suppliers: z.enum(WATCH_SUPPLIER_BANDS),
    wouldPay: z.enum(WATCH_PRICE_ANSWERS),
    // Set when the sign-up came from the home-page GSTIN check rather than the
    // landing page. Records which supplier prompted it, which is the difference
    // between "someone liked the idea" and "someone wanted this one watched".
    gstin: z.string().max(20).optional().nullable(),
});

/**
 * GSTR-2B Reconciliation and GST Notice Help early access (lib/earlyAccess.ts).
 * Same idea as Watch: a sizing answer and a price answer, stored in `detail`.
 */
const reconSummarySchema = z.object({
    size: z.enum(RECON_GSTIN_BANDS),
    wouldPay: z.enum(PRICE_ANSWERS),
});

const noticeSummarySchema = z.object({
    size: z.enum(NOTICE_TYPES),
    wouldPay: z.enum(PRICE_ANSWERS),
});

const schema = z.discriminatedUnion('source', [
    z.object({
        source: z.literal('recon'),
        email: z.string().email().max(200),
        summary: reconSummarySchema,
        utm_source: z.string().max(64).optional().nullable(),
        utm_campaign: z.string().max(64).optional().nullable(),
    }),
    z.object({
        source: z.literal('notice'),
        email: z.string().email().max(200),
        summary: noticeSummarySchema,
        utm_source: z.string().max(64).optional().nullable(),
        utm_campaign: z.string().max(64).optional().nullable(),
    }),
    z.object({
        source: z.literal('watch'),
        email: z.string().email().max(200),
        summary: watchSummarySchema,
        utm_source: z.string().max(64).optional().nullable(),
        utm_campaign: z.string().max(64).optional().nullable(),
    }),
    z.object({
        source: z.literal('bulk'),
        email: z.string().email().max(200),
        summary: bulkSummarySchema,
        utm_source: z.string().max(64).optional().nullable(),
        utm_campaign: z.string().max(64).optional().nullable(),
    }),
    z.object({
        source: z.literal('check'),
        email: z.string().email().max(200),
        summary: checkSummarySchema,
        utm_source: z.string().max(64).optional().nullable(),
        utm_campaign: z.string().max(64).optional().nullable(),
    }),
    z.object({
        source: z.literal('unpaid'),
        email: z.string().email().max(200),
        summary: unpaidSummarySchema,
        utm_source: z.string().max(64).optional().nullable(),
        utm_campaign: z.string().max(64).optional().nullable(),
    }),
]);

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const rl = checkRateLimit(ip, '/api/lead-capture', { limit: 5, windowMs: 60 * 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            );
        }

        const parsed = schema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
        }

        const data = parsed.data;
        const email = data.email.trim().toLowerCase();

        // Deliver first — this is the thing the visitor actually asked for.
        try {
            if (data.source === 'recon' || data.source === 'notice') {
                await sendEarlyAccessConfirmationEmail(email, data.source);
            } else if (data.source === 'watch') {
                await sendWatchConfirmationEmail(email);
            } else if (data.source === 'bulk') {
                await sendBulkSummaryEmail(email, data.summary as never);
            } else if (data.source === 'unpaid') {
                const { letterText, letterFilename, ...summary } = data.summary;
                await sendUnpaidSummaryEmail(email, summary, letterText, letterFilename);
            } else {
                await sendCheckSummaryEmail(email, data.summary);
            }
        } catch (err) {
            console.error('Lead email delivery failed:', err);
            return NextResponse.json(
                { error: 'Could not send the email. Please check the address and try again.' },
                { status: 502 }
            );
        }

        let detail: string;
        if (data.source === 'recon') {
            detail = `${EARLY_ACCESS.recon.name} early access: reconciles ${data.summary.size} GSTINs a month; would pay ${EARLY_ACCESS.recon.priceLabel}: ${data.summary.wouldPay}.`;
        } else if (data.source === 'notice') {
            detail = `${EARLY_ACCESS.notice.name} early access: notice ${data.summary.size}; would pay ${EARLY_ACCESS.notice.priceLabel}: ${data.summary.wouldPay}.`;
        } else if (data.source === 'watch') {
            detail = `Vendor GST Watch early access: buys from ${data.summary.suppliers} suppliers; would pay ₹${WATCH_PRICE_RUPEES}/month: ${data.summary.wouldPay}.`;
            if (data.summary.gstin) {
                detail += ` Asked after checking ${data.summary.gstin}.`;
            }
        } else if (data.source === 'bulk') {
            detail = `${data.summary.invoicesWithCritical} of ${data.summary.totalInvoices} invoices flagged, ₹${data.summary.amountAtRisk} at risk.`;
        } else if (data.source === 'unpaid') {
            detail = `₹${data.summary.principal} unpaid for ${data.summary.daysOverdue} days; interest computed ₹${data.summary.interest}.`;
        } else {
            detail = `Invoice ${data.summary.invoiceNumber || '—'} scored ${data.summary.healthScore}/100 with ${data.summary.issueTitles.length} issue(s).`;
        }

        // Best-effort persistence. The `leads` table ships as a migration that
        // has to be applied manually (it defines RLS), so treat its absence as
        // non-fatal rather than failing a request the user considers done.
        try {
            const { error } = await supabaseAdmin.from('leads').insert({
                email,
                source: data.source,
                detail,
                utm_source: data.utm_source || null,
                utm_campaign: data.utm_campaign || null,
                ip,
            });
            if (error) console.error('Lead insert failed (is the leads migration applied?):', error.message);
        } catch (err) {
            console.error('Lead insert threw:', err);
        }

        // Notified regardless of storage, so no lead is lost pre-migration.
        try {
            await notifyNewLead({ email, source: data.source, detail });
        } catch (err) {
            console.error('Lead notification failed:', err);
        }

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        console.error('Lead capture error:', error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}
