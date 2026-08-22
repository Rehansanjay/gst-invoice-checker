import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import { computeInterest, formatPaise, type ClaimInput, type InterestComputed } from './msmeInterest';
import { currentRate, bpsToPercent, STATUTORY_MULTIPLIER } from './bankRate';

/**
 * lib/computationCertificate.ts
 * ─────────────────────────────────────────────────────────────────────
 * The paid deliverable: a dated, sourced computation of interest under
 * section 16 of the MSMED Act 2006.
 *
 * WHAT MAKES THIS WORTH PAYING FOR, GIVEN THE NUMBERS ARE FREE
 *
 * The calculator shows the same figures on screen for nothing, and gating them
 * would be the wrong trade — the number is the hook. What this adds is the
 * things a figure on a web page cannot be:
 *
 *   - A document that can be attached to a reference to the Facilitation
 *     Council, which needs the computation, not a screenshot.
 *   - Provenance. The Bank Rate is printed with the source it was read from
 *     and the date it was checked, so the recipient's accountant can verify it
 *     rather than take it on trust.
 *   - A forward projection. What the sum becomes in 30, 60 and 90 days is the
 *     figure that actually moves a negotiation, and it is not on the free
 *     screen.
 *   - A reference number, derived from the claim itself, so two people
 *     discussing "the computation" are discussing the same one.
 *
 * It states no legal position and reaches no conclusion about entitlement.
 * Section 29 of the Advocates Act reserves that, and selling a document is
 * exactly the circumstance in which the line matters most.
 */

const INK = '#281E15';
const MUTED = '#7C6A58';
const ACCENT = '#9E542F';
const RULE = '#D8D2CA';

/** Points from the left margin for each column of the schedule. */
const COLS = { period: 50, days: 232, rate: 274, opening: 330, interest: 420, closing: 500 };

/** Days ahead to project. The figures a negotiation actually turns on. */
export const PROJECTION_DAYS = [30, 60, 90];

/**
 * Stable reference derived from the claim, not from time or a counter.
 *
 * The same claim always produces the same reference, so a user who buys twice
 * gets one identifier rather than two, and a query about "IC-…" can be tied
 * back to a computation without storing anything.
 */
export function certificateReference(input: ClaimInput): string {
    const basis = [
        input.principalPaise,
        input.acceptanceDate.toISOString().slice(0, 10),
        input.writtenAgreement ? `A${input.agreedDays ?? ''}` : 'N',
        input.paidOn ? input.paidOn.toISOString().slice(0, 10) : 'OPEN',
    ].join('|');
    const digest = crypto.createHash('sha256').update(basis).digest('hex').slice(0, 8).toUpperCase();
    return `IC-${digest}`;
}

export interface CertificateInput {
    claim: ClaimInput;
    computed: InterestComputed;
    udyam?: string;
    invoiceNumber?: string;
}

/** Forward projection rows: what the sum becomes if payment keeps slipping. */
export function projectForward(claim: ClaimInput, computed: InterestComputed) {
    // Only meaningful while the sum is outstanding. A settled claim stopped
    // accruing on the day it was paid.
    if (claim.paidOn) return [];

    const from = new Date(`${computed.computedTo}T00:00:00Z`);
    const rows: { days: number; on: string; total: string; extra: string }[] = [];

    for (const days of PROJECTION_DAYS) {
        const asOf = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
        const future = computeInterest({ ...claim, asOf, paidOn: null });
        if (!future.ok) continue;
        rows.push({
            days,
            on: future.computedTo,
            total: formatPaise(future.totalPaise),
            extra: formatPaise(future.totalPaise - computed.totalPaise),
        });
    }
    return rows;
}

function rule(doc: PDFKit.PDFDocument, y?: number) {
    const at = y ?? doc.y;
    doc.save().strokeColor(RULE).lineWidth(0.75)
        .moveTo(50, at).lineTo(545, at).stroke().restore();
}

function label(doc: PDFKit.PDFDocument, text: string) {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED)
        .text(text.toUpperCase(), { characterSpacing: 1.2 });
    doc.moveDown(0.35);
}

export async function generateComputationCertificate(input: CertificateInput): Promise<Buffer> {
    const { claim, computed } = input;
    const rate = currentRate();
    const reference = certificateReference(claim);
    const projection = projectForward(claim, computed);

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ── Masthead ──────────────────────────────────────────────────
        doc.font('Helvetica-Bold').fontSize(16).fillColor(INK)
            .text('Computation of interest on a delayed payment');
        doc.font('Helvetica').fontSize(10).fillColor(MUTED)
            .text('Section 16, Micro, Small and Medium Enterprises Development Act, 2006');
        doc.moveDown(0.8);
        rule(doc);
        doc.moveDown(0.8);

        doc.font('Helvetica').fontSize(9).fillColor(MUTED);
        doc.text(`Reference ${reference}`, 50, doc.y, { continued: true });
        doc.text(`Computed to ${computed.computedTo}`, { align: 'right' });
        doc.moveDown(1.2);

        // ── Particulars ───────────────────────────────────────────────
        label(doc, 'Particulars');
        doc.font('Helvetica').fontSize(10).fillColor(INK);

        const particulars: [string, string][] = [
            ['Principal sum', `Rs ${formatPaise(computed.principalPaise)}`],
            ['Invoice number', input.invoiceNumber || 'Not supplied'],
            ['Udyam registration', input.udyam || 'Not supplied'],
            ['Date of acceptance', claim.acceptanceDate.toISOString().slice(0, 10)],
            ['Payment period', claim.writtenAgreement
                ? `${Math.min(claim.agreedDays ?? 0, 45)} days, agreed in writing`
                : '15 days, no written agreement'],
            ['Interest runs from', computed.interestStartsOn],
            ['Days elapsed', `${computed.daysOverdue}`],
            ['Status', claim.paidOn ? `Paid on ${claim.paidOn.toISOString().slice(0, 10)}` : 'Outstanding'],
        ];

        for (const [k, v] of particulars) {
            doc.font('Helvetica').fillColor(MUTED).text(k, 50, doc.y, { continued: true, width: 200 });
            doc.font('Helvetica-Bold').fillColor(INK).text(v, { align: 'left' });
            doc.moveDown(0.15);
        }

        doc.moveDown(0.9);

        // ── Schedule ──────────────────────────────────────────────────
        label(doc, 'Month by month');

        const header = doc.y;
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED);
        doc.text('PERIOD', COLS.period, header);
        doc.text('DAYS', COLS.days, header);
        doc.text('RATE', COLS.rate, header);
        doc.text('OPENING', COLS.opening, header, { width: 80, align: 'right' });
        doc.text('INTEREST', COLS.interest, header, { width: 70, align: 'right' });
        doc.text('CLOSING', COLS.closing, header, { width: 45, align: 'right' });
        doc.moveDown(0.5);
        rule(doc);
        doc.moveDown(0.4);

        doc.font('Helvetica').fontSize(8).fillColor(INK);
        for (const s of computed.schedule) {
            if (doc.y > 700) { doc.addPage(); doc.moveDown(1); }
            const y = doc.y;
            doc.fillColor(INK).text(`${s.periodStart} to ${s.periodEnd}${s.fullMonth ? '' : ' (part)'}`, COLS.period, y);
            doc.fillColor(MUTED).text(String(s.days), COLS.days, y);
            doc.text(`${bpsToPercent(s.statutoryRateBps)}%`, COLS.rate, y);
            doc.text(formatPaise(s.openingBalancePaise), COLS.opening, y, { width: 80, align: 'right' });
            doc.fillColor(ACCENT).text(formatPaise(s.interestPaise), COLS.interest, y, { width: 70, align: 'right' });
            doc.fillColor(INK).text(formatPaise(s.closingBalancePaise), COLS.closing, y, { width: 45, align: 'right' });
            doc.moveDown(0.45);
        }

        doc.moveDown(0.3);
        rule(doc);
        doc.moveDown(0.6);

        // ── Totals ────────────────────────────────────────────────────
        const totals: [string, string, string?][] = [
            ['Principal', `Rs ${formatPaise(computed.principalPaise)}`],
            ['Interest to date', `Rs ${formatPaise(computed.interestPaise)}`, ACCENT],
            ['Total', `Rs ${formatPaise(computed.totalPaise)}`],
        ];
        for (const [k, v, colour] of totals) {
            const y = doc.y;
            doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(k, 330, y, { width: 100 });
            doc.font('Helvetica-Bold').fillColor(colour ?? INK).text(v, 430, y, { width: 115, align: 'right' });
            doc.moveDown(0.3);
        }

        // ── Forward projection ────────────────────────────────────────
        if (projection.length) {
            doc.moveDown(1);
            label(doc, 'If payment continues to be delayed');
            doc.font('Helvetica').fontSize(9).fillColor(MUTED)
                .text('Interest continues to accrue with monthly rests at the rate presently in force.');
            doc.moveDown(0.5);

            for (const p of projection) {
                const y = doc.y;
                doc.font('Helvetica').fontSize(9).fillColor(MUTED)
                    .text(`In ${p.days} days, on ${p.on}`, 50, y, { width: 220 });
                doc.font('Helvetica-Bold').fillColor(INK)
                    .text(`Rs ${p.total}`, 300, y, { width: 130, align: 'right' });
                doc.font('Helvetica').fillColor(ACCENT)
                    .text(`+Rs ${p.extra}`, 435, y, { width: 110, align: 'right' });
                doc.moveDown(0.35);
            }
        }

        // ── Basis and provenance ──────────────────────────────────────
        doc.moveDown(1.2);
        rule(doc);
        doc.moveDown(0.6);
        label(doc, 'Basis of computation');
        doc.font('Helvetica').fontSize(8.5).fillColor(MUTED);

        doc.text(
            `Section 16 provides for compound interest with monthly rests at three times the Bank Rate `
            + `notified by the Reserve Bank of India. Interest runs from the appointed day, defined in `
            + `section 2(b) as the day following the expiry of fifteen days from the day of acceptance, `
            + `or where a period is agreed in writing, from the day after that date. Section 15 caps any `
            + `agreed period at forty-five days.`,
            { align: 'left', lineGap: 1.5 }
        );
        doc.moveDown(0.5);
        doc.text(
            `The rate is applied period by period against the Bank Rate in force during each month, `
            + `rather than one rate applied across the whole span. Sums are held in whole paise and `
            + `rounded at each monthly rest, because the interest capitalises. A period ending part way `
            + `through a month is charged pro rata rather than compounded.`,
            { lineGap: 1.5 }
        );
        doc.moveDown(0.5);

        if (rate) {
            doc.font('Helvetica-Bold').fillColor(INK).text(
                `Bank Rate ${bpsToPercent(rate.bankRateBps)} per cent, giving `
                + `${bpsToPercent(rate.bankRateBps * STATUTORY_MULTIPLIER)} per cent per annum. `
                + `Read from ${rate.sourceUrl} on ${rate.recordedOn}.`,
                { lineGap: 1.5 }
            );
        }

        // ── Limits ────────────────────────────────────────────────────
        doc.moveDown(1);
        rule(doc);
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(
            'This is a computation prepared from the particulars supplied above. It is not legal or tax '
            + 'advice, it reaches no conclusion as to whether any sum is recoverable, and InvoiceCheck.in '
            + 'is not a law firm. The delayed payment provisions of the Act run to micro and small '
            + 'enterprises; medium enterprises are outside them. Registration is evidenced by a Udyam '
            + 'number, which has been recorded as supplied and not verified against the Udyam portal. '
            + 'References to the Micro and Small Enterprises Facilitation Council are filed at '
            + 'odr.msme.gov.in with effect from 15 October 2025.',
            { lineGap: 1.5 }
        );
        doc.moveDown(0.6);
        doc.fontSize(7.5).fillColor(MUTED)
            .text(`${reference}  ·  Generated by InvoiceCheck.in on ${computed.computedTo}`, { align: 'center' });

        doc.end();
    });
}

/** Filename for the emailed attachment. */
export function certificateFilename(input: ClaimInput, computed: InterestComputed): string {
    return `interest-computation-${certificateReference(input)}-${computed.computedTo}.pdf`;
}
