import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPaymentSignature } from '@/lib/razorpaySignature';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit } from '@/lib/rateLimit';
import { computeInterest } from '@/lib/msmeInterest';
import { readUdyam } from '@/lib/udyam';
import { generateComputationCertificate, certificateFilename, certificateReference } from '@/lib/computationCertificate';
import { sendComputationCertificate } from '@/lib/leadService';

/**
 * Verifies the Razorpay signature, generates the certificate and emails it.
 *
 * WHY THE CLAIM IS RE-SUPPLIED RATHER THAN STORED
 *
 * The particulars come back with this request and are recomputed here. That
 * avoids adding a column to `payments` on a database with two migrations
 * already waiting, and it costs nothing in safety: the price is fixed
 * server-side, the signature proves a real payment against a real order, and
 * the only thing the particulars can change is the buyer's own document.
 *
 * What re-supplying DOES expose is replay — one payment, many certificates.
 * That is handled by marking the payment row `completed` and refusing an order
 * already delivered, so a signature can be redeemed once.
 */

const schema = z.object({
    razorpayOrderId: z.string().min(4).max(64),
    razorpayPaymentId: z.string().min(4).max(64),
    razorpaySignature: z.string().min(16).max(256),
    email: z.string().email().max(200),
    claim: z.object({
        amountRupees: z.number().positive().max(1_000_000_000),
        acceptanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        writtenAgreement: z.boolean(),
        agreedDays: z.number().int().min(0).max(365).optional(),
        paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
        udyam: z.string().max(40).nullable().optional(),
        invoiceNumber: z.string().max(100).nullable().optional(),
    }),
});

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const rl = checkRateLimit(ip, '/api/unpaid-invoice/deliver', { limit: 10, windowMs: 60 * 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        }

        const parsed = schema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
        }
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, email, claim } = parsed.data;

        // ── Verify the payment actually happened ──────────────────────
        const check = verifyPaymentSignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            process.env.RAZORPAY_KEY_SECRET,
        );

        if (!check.valid) {
            console.error('MSME computation signature rejected:', { order: razorpayOrderId, reason: check.reason });
            // A missing secret is our problem, not the caller's, and should not
            // be reported as their payment failing.
            return check.reason === 'NO_SECRET'
                ? NextResponse.json({ error: 'Payment verification unavailable.' }, { status: 503 })
                : NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
        }

        // ── Refuse a signature already redeemed ───────────────────────
        const { data: existing } = await supabaseAdmin
            .from('payments')
            .select('status')
            .eq('razorpay_order_id', razorpayOrderId)
            .maybeSingle();

        if (existing?.status === 'completed') {
            return NextResponse.json(
                { error: 'This payment has already been used. Check your inbox for the computation.' },
                { status: 409 }
            );
        }

        // ── Recompute, server-side, from the supplied particulars ─────
        const claimInput = {
            principalPaise: Math.round(claim.amountRupees * 100),
            acceptanceDate: new Date(`${claim.acceptanceDate}T00:00:00Z`),
            writtenAgreement: claim.writtenAgreement,
            agreedDays: claim.agreedDays,
            paidOn: claim.paidOn ? new Date(`${claim.paidOn}T00:00:00Z`) : null,
        };

        const computed = computeInterest(claimInput);
        if (!computed.ok) {
            // Payment has already been taken, so this must not read as a
            // silent failure. Nothing is marked completed, so the signature
            // stays redeemable once the particulars are corrected.
            console.error('Paid computation could not be produced:', computed.reason);
            return NextResponse.json(
                { error: `We could not produce a computation: ${computed.reason} Your payment has not been used — please contact us and we will sort it out.` },
                { status: 422 }
            );
        }

        const udyam = readUdyam(claim.udyam);
        const pdf = await generateComputationCertificate({
            claim: claimInput,
            computed,
            udyam: udyam.wellFormed ? udyam.normalised : undefined,
            invoiceNumber: claim.invoiceNumber || undefined,
        });

        const filename = certificateFilename(claimInput, computed);
        const reference = certificateReference(claimInput);

        try {
            await sendComputationCertificate(email.trim().toLowerCase(), {
                reference,
                total: computed.totalPaise,
                interest: computed.interestPaise,
                computedTo: computed.computedTo,
            }, pdf, filename);
        } catch (err) {
            console.error('Certificate delivery failed:', err);
            return NextResponse.json(
                { error: 'Payment went through but the email did not send. Contact us with your payment id and we will send it manually.' },
                { status: 502 }
            );
        }

        // Only now, after the customer actually has the document.
        const { error: updateError } = await supabaseAdmin
            .from('payments')
            .update({
                status: 'completed',
                razorpay_payment_id: razorpayPaymentId,
                razorpay_signature: razorpaySignature,
            })
            .eq('razorpay_order_id', razorpayOrderId);

        if (updateError) console.error('Payment row update failed:', updateError.message);

        console.log('[unpaid-invoice] certificate delivered', JSON.stringify({
            reference, udyamWellFormed: udyam.wellFormed, outstanding: claimInput.paidOn === null,
        }));

        return NextResponse.json({ success: true, reference, filename });

    } catch (error: unknown) {
        console.error('Certificate delivery error:', error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}
