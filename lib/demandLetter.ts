/**
 * lib/demandLetter.ts
 * ─────────────────────────────────────────────────────────────────────
 * A plain-text template a supplier completes and sends in their own name.
 *
 * WHY THIS IS FREE, AND WHY IT IS PLAIN TEXT
 *
 * Section 29 of the Advocates Act 1961 reserves the practice of law to
 * enrolled advocates, and the courts read "practice" to include drafting legal
 * documents and giving legal advice — not only appearing in court. Section 45
 * makes unauthorised practice a criminal offence. Every online legal-notice
 * service in this market leads with "drafted by advocates", which is not a
 * marketing line but the structure that lets them charge for a document.
 *
 * Two design consequences follow, and neither is cosmetic:
 *
 *   1. NO FEE. Charging for a drafted document is the clearest way to engage
 *      s.29. This ships free. The paid product is the interest computation,
 *      which is arithmetic.
 *
 *   2. PLAIN TEXT, WITH GAPS LEFT IN. A polished PDF on our letterhead would
 *      read as a finished legal instrument issued by us. A .txt file with
 *      [SQUARE BRACKETS] the user has to fill in reads as what it is: a
 *      starting point they complete, review and send themselves. The
 *      placeholders are the compliance posture, not an unfinished feature.
 *
 * TONE
 *
 * No threats, no adjectives, no pleading. Every sentence is a fact or a
 * citation. A letter that reads as calm and correct is more effective with a
 * finance team than one that reads as angry — and it is also the only register
 * in which we can write, since anything predicting an outcome would be advice.
 *
 * Note what paragraph 6 does NOT do. An earlier draft explained that the
 * buyer's deduction would be lost. That was this product advising the reader's
 * counterparty on their tax position. It now cites the section and stops.
 */

import type { InterestComputed } from './msmeInterest';
import { formatPaise } from './msmeInterest';
import { bpsToPercent } from './bankRate';

export interface LetterInput {
    computed: InterestComputed;
    /** Format-checked only; may be blank. Blank leaves a placeholder in. */
    udyam?: string;
    invoiceNumber?: string;
    writtenAgreement: boolean;
    agreedDays?: number;
    /** Days the letter allows for payment before nothing further is said. */
    graceDays?: number;
}

const DEFAULT_GRACE_DAYS = 15;

/** Line width for the letter body. Comfortable in any monospaced viewer. */
const WRAP_WIDTH = 72;

/**
 * Wraps a numbered paragraph with a hanging indent.
 *
 * The paragraphs are written as continuous strings and wrapped here rather
 * than laid out by hand in the template. Hand-placed line breaks look right
 * against the placeholder text and then fall apart the moment a real value is
 * substituted: "[YOUR NAME / FIRM NAME]" and "Kumar & Co" are not the same
 * length, so every following line shifts. A letter with ragged lines reads as
 * careless, and this one is going to a finance team.
 */
function wrapNumbered(number: string, text: string): string {
    const indent = ' '.repeat(4);
    const first = `${number}.`.padEnd(4);
    const words = text.split(/\s+/).filter(Boolean);

    const lines: string[] = [];
    let line = first;
    let atStart = true;

    for (const word of words) {
        const candidate = atStart ? line + word : `${line} ${word}`;
        if (candidate.length > WRAP_WIDTH && !atStart) {
            lines.push(line);
            line = indent + word;
        } else {
            line = candidate;
        }
        atStart = false;
    }
    if (line.trim()) lines.push(line);
    return lines.join('\n');
}

/** A gap the user must fill. Uppercase and bracketed so it cannot be missed. */
function slot(value: string | undefined, placeholder: string): string {
    const v = (value ?? '').trim();
    return v || `[${placeholder}]`;
}

/**
 * The interest computation, as an enclosure.
 *
 * Sent alongside the letter because a bare total invites an argument, whereas
 * a period-by-period table that names its rate and its source can simply be
 * checked. It is also what a reference to the Facilitation Council needs.
 */
export function buildSchedule(computed: InterestComputed): string {
    const head = ['Period', 'Days', 'Rate', 'Opening (Rs)', 'Interest (Rs)', 'Closing (Rs)'];
    const rows = computed.schedule.map((s) => [
        `${s.periodStart} to ${s.periodEnd}${s.fullMonth ? '' : ' (part)'}`,
        String(s.days),
        `${bpsToPercent(s.statutoryRateBps)}%`,
        formatPaise(s.openingBalancePaise),
        formatPaise(s.interestPaise),
        formatPaise(s.closingBalancePaise),
    ]);

    const widths = head.map((h, i) =>
        Math.max(h.length, ...rows.map((r) => r[i].length)));
    const line = (cells: string[]) =>
        cells.map((c, i) => (i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join('  ');

    return [
        'INTEREST COMPUTATION',
        '',
        line(head),
        widths.map((w) => '-'.repeat(w)).join('  '),
        ...rows.map(line),
        '',
        `Principal            Rs ${formatPaise(computed.principalPaise)}`,
        `Interest to date     Rs ${formatPaise(computed.interestPaise)}`,
        `Total                Rs ${formatPaise(computed.totalPaise)}`,
        '',
        'Interest is compounded with monthly rests at three times the Bank Rate',
        'notified by the Reserve Bank of India. Where a period ends part way',
        'through a month, that part period is charged pro rata rather than',
        'compounded. Figures are rounded to whole paise at each monthly rest.',
    ].join('\n');
}

/** The complete downloadable file: instructions, letter, and enclosure. */
export function buildDemandLetter(input: LetterInput): string {
    const c = input.computed;
    const grace = input.graceDays ?? DEFAULT_GRACE_DAYS;
    const rate = c.schedule.length
        ? bpsToPercent(c.schedule[c.schedule.length - 1].bankRateBps)
        : null;

    const period = input.writtenAgreement && typeof input.agreedDays === 'number'
        ? `the period of ${Math.min(input.agreedDays, 45)} days agreed between us`
        : 'the period of fifteen days provided for where no period is agreed in writing';

    // Financial year in which the computation date falls. Indian FY ends 31 March.
    const endYear = new Date(`${c.computedTo}T00:00:00Z`);
    const fyEnd = endYear.getUTCMonth() >= 3 ? endYear.getUTCFullYear() + 1 : endYear.getUTCFullYear();

    return `THIS IS A TEMPLATE. IT IS NOT A LEGAL NOTICE AND IT HAS NOT BEEN
DRAFTED BY A LAWYER.

Before you send anything:

  1. Replace every [BRACKETED] item with your own details.
  2. Read it through and change anything that does not match your facts.
  3. Check the figures against your own records.
  4. Send it in your own name, on your own letterhead or from your own
     email address.
  5. If the amount matters to you, take advice from an advocate or a
     chartered accountant before sending it.

InvoiceCheck.in has computed the interest figures below from what you
entered. It has not advised you on your legal position and cannot do so.
Whether to send this, and what it means for you, is your decision.

Delete this whole block before sending.

${'='.repeat(70)}


NOTICE OF DELAYED PAYMENT UNDER THE MICRO, SMALL AND MEDIUM
ENTERPRISES DEVELOPMENT ACT, 2006

To:     ${slot(undefined, "BUYER'S NAME")}
        ${slot(undefined, "BUYER'S ADDRESS")}

From:   ${slot(undefined, 'YOUR NAME / FIRM NAME')}
        ${slot(undefined, 'YOUR ADDRESS')}

Date:   ${slot(undefined, 'DATE YOU SEND THIS')}


Sir/Madam,

${wrapNumbered('1', `${slot(undefined, 'YOUR NAME / FIRM NAME')} is registered under the Micro, Small and Medium Enterprises Development Act, 2006, vide Udyam Registration No. ${slot(input.udyam, 'YOUR UDYAM NUMBER')}, dated ${slot(undefined, 'DATE ON YOUR UDYAM CERTIFICATE')}.`)}

${wrapNumbered('2', `Invoice No. ${slot(input.invoiceNumber, 'INVOICE NUMBER')} was raised for Rs ${formatPaise(c.principalPaise)} in respect of goods supplied or services rendered, which were accepted on ${slot(undefined, 'DATE OF ACCEPTANCE')}.`)}

${wrapNumbered('3', `Section 15 of the said Act provides for payment within the period agreed in writing, not exceeding forty-five days from the day of acceptance, or within fifteen days where no period is agreed. On the basis of ${period}, payment fell due on ${c.interestStartsOn}. ${c.daysOverdue} days have since elapsed and the sum remains unpaid.`)}

${wrapNumbered('4', `Section 16 of the said Act provides for compound interest with monthly rests at three times the Bank Rate notified by the Reserve Bank of India${rate ? `, the Bank Rate being ${rate}%` : ''}. On that basis the interest computed to ${c.computedTo} is Rs ${formatPaise(c.interestPaise)}. A period-by-period computation is enclosed.`)}

${wrapNumbered('5', `The total sum computed as due is Rs ${formatPaise(c.totalPaise)}.`)}

${wrapNumbered('6', `Your attention is drawn to Section 37(2)(g) of the Income-tax Act, 2025, previously Section 43B(h) of the Income-tax Act, 1961, concerning the deductibility of sums payable to micro and small enterprises, and to the financial year ending 31 March ${fyEnd}.`)}

${wrapNumbered('7', `Section 18 of the said Act provides for reference to the Micro and Small Enterprises Facilitation Council. With effect from 15 October 2025 such references are filed through the MSME Online Dispute Resolution Portal at odr.msme.gov.in.`)}

${wrapNumbered('8', `I request that Rs ${formatPaise(c.totalPaise)} be remitted within ${grace} days of receipt of this letter. Interest continues to accrue until payment.`)}

Yours faithfully,



${slot(undefined, 'YOUR NAME')}
${slot(undefined, 'YOUR FIRM NAME')}


Enclosures:
  - Copy of invoice ${slot(input.invoiceNumber, 'INVOICE NUMBER')}
  - Interest computation (below)
  - Copy of Udyam Registration Certificate


${'='.repeat(70)}


${buildSchedule(c)}


${'='.repeat(70)}

Figures computed by InvoiceCheck.in on ${c.computedTo}. Bank Rate taken from
the Reserve Bank of India at rbi.org.in. This document is a template, not
legal advice, and InvoiceCheck.in is not a law firm.
`;
}

/** Filename for the download. Dated so successive drafts do not collide. */
export function letterFilename(computed: InterestComputed): string {
    return `demand-letter-TEMPLATE-${computed.computedTo}.txt`;
}
