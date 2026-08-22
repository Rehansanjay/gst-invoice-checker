import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { computeInterest, formatPaise, MAX_AGREED_DAYS } from '@/lib/msmeInterest';
import { readUdyam } from '@/lib/udyam';
import { currentRate, isSeriesStale, bpsToPercent, STATUTORY_MULTIPLIER } from '@/lib/bankRate';
import { checkRateLimit } from '@/lib/rateLimit';
import { buildDemandLetter, letterFilename } from '@/lib/demandLetter';

/**
 * Delayed-payment interest under section 16 of the MSMED Act 2006.
 *
 * Computed server-side rather than in the browser for two reasons. The figure
 * ends up in a letter the user sends a debtor, so it should be one we can
 * stand behind and reproduce, not one a client could have altered before
 * asking us to print it. And this endpoint is the measurement that decides
 * whether the rest of the product gets built: how many people arrive at all,
 * and how many of them hold a Udyam registration.
 *
 * WHAT THIS DELIBERATELY DOES NOT RETURN
 *
 * No verdict on whether the user has a claim, is eligible, or should file.
 * Those are legal conclusions, and stating one for a specific person is
 * advice — reserved to enrolled advocates under s.29 of the Advocates Act.
 * The response carries numbers, dates, and neutral observations. The user
 * draws the conclusion.
 */

const schema = z.object({
    // Rupees as entered, converted to paise here. Capped at ₹100 crore, which
    // is far past this audience and stops absurd input reaching the engine.
    amountRupees: z.number().positive().max(1_000_000_000),
    /** Day the goods or services were accepted, or deemed accepted. */
    acceptanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    writtenAgreement: z.boolean(),
    agreedDays: z.number().int().min(0).max(365).optional(),
    /** Omitted or null when the invoice is still outstanding. */
    paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    udyam: z.string().max(40).nullable().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const rl = checkRateLimit(ip, '/api/unpaid-invoice', { limit: 30, windowMs: 60 * 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            );
        }

        const parsed = schema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: 'Please check the values entered.' }, { status: 400 });
        }
        const input = parsed.data;

        const acceptanceDate = new Date(`${input.acceptanceDate}T00:00:00Z`);
        const paidOn = input.paidOn ? new Date(`${input.paidOn}T00:00:00Z`) : null;
        if (Number.isNaN(acceptanceDate.getTime()) || (paidOn && Number.isNaN(paidOn.getTime()))) {
            return NextResponse.json({ error: 'Please check the dates entered.' }, { status: 400 });
        }

        const udyam = readUdyam(input.udyam);

        const result = computeInterest({
            // Rupees arrive as a float from a number input; paise are the unit
            // everything downstream works in, so round once, here, at the edge.
            principalPaise: Math.round(input.amountRupees * 100),
            acceptanceDate,
            writtenAgreement: input.writtenAgreement,
            agreedDays: input.agreedDays,
            paidOn,
        });

        // Answers the question v1 exists to answer, without storing anything:
        // does the audience arriving here actually hold a registration?
        console.log('[unpaid-invoice]', JSON.stringify({
            computed: result.ok,
            udyamSupplied: udyam.problems[0] !== 'EMPTY',
            udyamWellFormed: udyam.wellFormed,
            writtenAgreement: input.writtenAgreement,
            outstanding: paidOn === null,
            reason: result.ok ? null : result.reason,
        }));

        if (!result.ok) {
            return NextResponse.json({ ok: false, reason: result.reason }, { status: 200 });
        }

        const rate = currentRate();

        // Built here, from the computation just performed, and returned with
        // it. Generating it later in a second request would risk composing a
        // letter against a Bank Rate that moved in between, so the figures in
        // the letter and the figures on screen could silently disagree.
        const letterText = buildDemandLetter({
            computed: result,
            udyam: udyam.wellFormed ? udyam.normalised : undefined,
            writtenAgreement: input.writtenAgreement,
            agreedDays: input.agreedDays,
        });

        return NextResponse.json({
            ok: true,
            letterText,
            letterFilename: letterFilename(result),
            interestStartsOn: result.interestStartsOn,
            computedTo: result.computedTo,
            daysOverdue: result.daysOverdue,
            principal: formatPaise(result.principalPaise),
            interest: formatPaise(result.interestPaise),
            total: formatPaise(result.totalPaise),
            monthlyAccrual: formatPaise(result.monthlyAccrualPaise),
            schedule: result.schedule.map((s) => ({
                periodStart: s.periodStart,
                periodEnd: s.periodEnd,
                days: s.days,
                fullMonth: s.fullMonth,
                ratePercent: bpsToPercent(s.statutoryRateBps),
                opening: formatPaise(s.openingBalancePaise),
                interest: formatPaise(s.interestPaise),
                closing: formatPaise(s.closingBalancePaise),
            })),
            // Neutral observations, never a ruling on entitlement.
            notes: udyam.problems,
            udyam: {
                normalised: udyam.normalised,
                wellFormed: udyam.wellFormed,
                stateName: udyam.stateName,
            },
            rate: {
                bankRatePercent: rate ? bpsToPercent(rate.bankRateBps) : null,
                statutoryPercent: rate ? bpsToPercent(rate.bankRateBps * STATUTORY_MULTIPLIER) : null,
                sourceUrl: rate?.sourceUrl ?? null,
                checkedOn: rate?.recordedOn ?? null,
                stale: isSeriesStale(),
            },
            maxAgreedDays: MAX_AGREED_DAYS,
        });

    } catch (error: unknown) {
        console.error('Unpaid invoice calculation error:', error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}
