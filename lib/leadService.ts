import { Resend } from 'resend';
import { BulkCheckResult } from '@/types';
import { EARLY_ACCESS, type EarlyAccessProduct } from '@/lib/earlyAccess';
import { FEEDBACK_TOOL_NAMES, type FeedbackTool } from '@/lib/feedback';

/**
 * lib/leadService.ts
 * ─────────────────────────────────────────────────────────────────────
 * Capture for anonymous users of the FREE tools.
 *
 * Until now every free visitor was anonymous: /check hardcoded guestEmail to ''
 * and /bulk asked for nothing, so people ran a check, saw it work and left with
 * no way to follow up. This sends them the summary they asked for and records
 * who they were.
 *
 * Note the emails deliberately carry the same depth as the free tier — issues
 * named, never explained. The email is the receipt for a free check, not a way
 * around the paywall.
 */

function getResend() { return new Resend(process.env.RESEND_API_KEY!); }

/** Where lead notifications go. Falls back to the published support address. */
const NOTIFY_TO = process.env.LEAD_NOTIFY_EMAIL || 'mailtoinvoicecheck@gmail.com';

const FROM = 'InvoiceCheck.in <noreply@invoicecheck.in>';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://invoicecheck.in';

export type LeadSource = 'bulk' | 'check' | 'unpaid' | 'watch' | EarlyAccessProduct;

function formatINR(value: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(value);
}

const GST_FOOTER =
    'General information about Indian GST, not tax advice. Confirm with your CA before filing.';

/**
 * The delayed-payment tool needs its own footer. The GST wording points at a
 * CA and at filing, neither of which fits a letter template about the MSMED
 * Act — and the disclaimer that matters there is about legal advice, not tax.
 */
const MSME_FOOTER =
    'Figures computed from what you entered. Not legal advice, and InvoiceCheck.in is not a law firm.';

const shell = (body: string, footer: string = GST_FOOTER) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,Segoe UI,Arial,sans-serif;line-height:1.6;color:#281E15;max-width:640px;margin:0 auto;padding:24px;">
${body}
<hr style="border:none;border-top:1px solid #E8E0D8;margin:32px 0 16px;">
<p style="font-size:12px;color:#9E8A78;">
  InvoiceCheck.in<br>
  ${footer}
</p>
</body></html>`;

/** Sends a practitioner their bulk exception summary. */
export async function sendBulkSummaryEmail(email: string, result: BulkCheckResult) {
    const worst = result.results.filter((r) => r.criticalCount > 0).slice(0, 15);

    const rows = worst.map((r) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #F0EBE5;">
          <strong>${r.invoiceNumber}</strong><br>
          <span style="font-size:12px;color:#9E8A78;">${r.invoiceDate}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #F0EBE5;">${formatINR(r.invoiceTotalAmount)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #F0EBE5;">${r.healthScore}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #F0EBE5;font-size:13px;">
          ${r.issues.map((i) => i.title).join('<br>')}
        </td>
      </tr>`).join('');

    const body = `
      <h1 style="font-size:22px;margin:0 0 8px;">Your pre-filing check</h1>
      <p style="color:#52402F;margin:0 0 24px;">
        ${result.invoicesWithCritical} of ${result.totalInvoices} invoices will be rejected as filed.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:12px;background:#F0EBE5;border-radius:8px;">
            <strong style="font-size:20px;">${result.totalInvoices}</strong><br>
            <span style="font-size:12px;color:#52402F;">checked</span>
          </td>
          <td style="padding:12px;background:#F0EBE5;border-radius:8px;">
            <strong style="font-size:20px;color:#2D7A4F;">${result.cleanInvoices}</strong><br>
            <span style="font-size:12px;color:#52402F;">clean</span>
          </td>
          <td style="padding:12px;background:#F0EBE5;border-radius:8px;">
            <strong style="font-size:20px;color:#C44B3F;">${result.invoicesWithCritical}</strong><br>
            <span style="font-size:12px;color:#52402F;">will be rejected</span>
          </td>
          <td style="padding:12px;background:#F0EBE5;border-radius:8px;">
            <strong style="font-size:20px;color:#C44B3F;">${formatINR(result.amountAtRisk)}</strong><br>
            <span style="font-size:12px;color:#52402F;">at risk</span>
          </td>
        </tr>
      </table>

      ${worst.length ? `
      <h2 style="font-size:16px;margin:0 0 8px;">Invoices needing attention</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="text-align:left;color:#9E8A78;font-size:12px;text-transform:uppercase;">
            <th style="padding:8px 12px;">Invoice</th><th style="padding:8px 12px;">Value</th>
            <th style="padding:8px 12px;">Score</th><th style="padding:8px 12px;">Problems</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${result.invoicesWithCritical > worst.length
            ? `<p style="font-size:13px;color:#9E8A78;">…and ${result.invoicesWithCritical - worst.length} more.</p>` : ''}
      ` : ''}

      <p style="margin:24px 0 8px;color:#52402F;">
        This lists what is wrong. The corrected values and step-by-step fixes are in the full report.
      </p>
      <p>
        <a href="${APP_URL}/pricing" style="display:inline-block;background:#9E542F;color:#FAF8F6;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          Get the fixes
        </a>
      </p>
      <p style="font-size:13px;color:#9E8A78;">
        Filing for several clients? <a href="${APP_URL}/contact" style="color:#9E542F;">Ask about a practice plan</a>.
      </p>`;

    await getResend().emails.send({
        from: FROM,
        to: email,
        subject: result.invoicesWithCritical > 0
            ? `${result.invoicesWithCritical} of ${result.totalInvoices} invoices will be rejected`
            : `All ${result.totalInvoices} invoices passed`,
        html: shell(body),
    });
}

/** Sends a single free-check summary. */
export async function sendCheckSummaryEmail(
    email: string,
    summary: { invoiceNumber: string; healthScore: number; issueTitles: string[] }
) {
    const body = `
      <h1 style="font-size:22px;margin:0 0 8px;">Your invoice check</h1>
      <p style="color:#52402F;">
        Invoice <strong>${summary.invoiceNumber || '—'}</strong> scored
        <strong>${summary.healthScore}/100</strong>.
      </p>
      ${summary.issueTitles.length ? `
        <h2 style="font-size:16px;margin:20px 0 8px;">What we found</h2>
        <ul style="color:#52402F;">${summary.issueTitles.map((t) => `<li>${t}</li>`).join('')}</ul>
        <p style="color:#52402F;">The corrected values and how to fix each one are in the full report.</p>
        <p><a href="${APP_URL}/check" style="display:inline-block;background:#9E542F;color:#FAF8F6;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Unlock the fixes</a></p>
      ` : `<p style="color:#2D7A4F;">No compliance issues found on this invoice.</p>`}
      <p style="font-size:13px;color:#9E8A78;margin-top:24px;">
        Checking more than one at a time? <a href="${APP_URL}/bulk" style="color:#9E542F;">Upload a batch free</a>.
      </p>`;

    await getResend().emails.send({
        from: FROM,
        to: email,
        subject: summary.issueTitles.length
            ? `${summary.issueTitles.length} issue(s) on invoice ${summary.invoiceNumber || ''}`.trim()
            : `Invoice ${summary.invoiceNumber || ''} passed all checks`.trim(),
        html: shell(body),
    });
}

/**
 * Sends the delayed-payment computation, with the letter template attached.
 *
 * The template goes out as a .txt attachment rather than inline HTML on
 * purpose. Inline, it would read as a letter from us; as a plain file with
 * bracketed gaps it reads as a draft the recipient completes and sends
 * themselves, which is what it is. See lib/demandLetter.ts.
 */
export async function sendUnpaidSummaryEmail(
    email: string,
    summary: {
        principal: string;
        interest: string;
        total: string;
        monthlyAccrual: string;
        daysOverdue: number;
        interestStartsOn: string;
        computedTo: string;
    },
    letterText: string,
    letterFilename: string
) {
    const body = `
      <h1 style="font-size:22px;margin:0 0 8px;">Your delayed-payment computation</h1>
      <p style="color:#52402F;">
        Payment fell due on <strong>${summary.interestStartsOn}</strong>.
        <strong>${summary.daysOverdue} days</strong> had elapsed as at ${summary.computedTo}.
      </p>
      <table style="border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:4px 24px 4px 0;color:#9E8A78;">Invoice amount</td>
            <td style="padding:4px 0;font-weight:600;">₹${summary.principal}</td></tr>
        <tr><td style="padding:4px 24px 4px 0;color:#9E8A78;">Interest computed</td>
            <td style="padding:4px 0;font-weight:600;color:#9E542F;">₹${summary.interest}</td></tr>
        <tr><td style="padding:4px 24px 4px 0;color:#9E8A78;">Total</td>
            <td style="padding:4px 0;font-weight:600;">₹${summary.total}</td></tr>
      </table>
      <p style="color:#52402F;">
        At the current balance and rate this adds about
        <strong>₹${summary.monthlyAccrual}</strong> a month, compounding with monthly rests.
      </p>
      <h2 style="font-size:16px;margin:24px 0 8px;">The attached template</h2>
      <p style="color:#52402F;">
        A letter template is attached as a text file. It has gaps in square brackets
        for you to fill in. Read it through, change anything that does not match your
        facts, and send it in your own name — it is a starting point, not a legal
        notice, and it was not drafted by a lawyer.
      </p>
      <p style="font-size:13px;color:#9E8A78;margin-top:24px;">
        References to the Facilitation Council are filed at
        <a href="https://odr.msme.gov.in" style="color:#9E542F;">odr.msme.gov.in</a>.
        The MSME Samadhaan portal stopped accepting new filings on 15 October 2025.
      </p>`;

    await getResend().emails.send({
        from: FROM,
        to: email,
        subject: `Interest computed on your unpaid invoice: ₹${summary.interest}`,
        html: shell(body, MSME_FOOTER),
        attachments: [{
            filename: letterFilename,
            content: Buffer.from(letterText, 'utf8').toString('base64'),
        }],
    });
}

/**
 * Sends the paid interest computation certificate.
 *
 * Deliberately plain. The customer has already bought; an email that carries
 * on selling to someone who just paid reads badly, and there is nothing to
 * upsell them to. It confirms what they have, and gets out of the way.
 */
export async function sendComputationCertificate(
    email: string,
    summary: { reference: string; total: number; interest: number; computedTo: string },
    pdf: Buffer,
    filename: string
) {
    const rupees = (paise: number) =>
        new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
            .format(paise / 100);

    const body = `
      <h1 style="font-size:22px;margin:0 0 8px;">Your interest computation</h1>
      <p style="color:#52402F;">
        Attached as a PDF, reference <strong>${summary.reference}</strong>, computed to
        ${summary.computedTo}.
      </p>
      <table style="border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:4px 24px 4px 0;color:#9E8A78;">Interest to date</td>
            <td style="padding:4px 0;font-weight:600;color:#9E542F;">₹${rupees(summary.interest)}</td></tr>
        <tr><td style="padding:4px 24px 4px 0;color:#9E8A78;">Total</td>
            <td style="padding:4px 0;font-weight:600;">₹${rupees(summary.total)}</td></tr>
      </table>
      <p style="color:#52402F;">
        It sets out the calculation month by month, names the Bank Rate it used and where
        that came from, and projects the sum forward at 30, 60 and 90 days. It is the
        enclosure the letter template refers to.
      </p>
      <p style="font-size:13px;color:#9E8A78;margin-top:24px;">
        Keep the reference — quote it if you need to ask us anything about this computation.
      </p>`;

    await getResend().emails.send({
        from: FROM,
        to: email,
        subject: `Interest computation ${summary.reference} — ₹${rupees(summary.total)} total`,
        html: shell(body, MSME_FOOTER),
        attachments: [{ filename, content: pdf.toString('base64') }],
    });
}

/**
 * Confirms a Vendor GST Watch early-access sign-up. Says plainly that nothing
 * is running yet and nothing will be charged without asking, because the
 * page is a test and the email must not read as a subscription.
 */
export async function sendWatchConfirmationEmail(email: string) {
    await getResend().emails.send({
        from: FROM,
        to: email,
        subject: 'You are on the Vendor GST Watch early-access list',
        html: shell(`
          <h1 style="font-size:20px;margin:0 0 12px;">You're on the list</h1>
          <p>Thanks for signing up for Vendor GST Watch: a monthly check of your suppliers' GSTINs and return
          filing, with an alert when one gets cancelled or stops filing, before it costs you input tax credit.</p>
          <p>It is not running yet. We are finding out whether enough businesses want it before we build it,
          and your answer is part of that. Nothing will be charged without asking you first.</p>
          <p>If you want to tell us what would make it worth paying for, just reply to this email.</p>
          <p>Meanwhile, you can check any single supplier's GSTIN for free:
          <a href="${APP_URL}/#verify" style="color:#9E542F;">invoicecheck.in</a></p>
        `),
    });
}

/** What each early-access product would do, for its confirmation email. */
const EARLY_ACCESS_PITCH: Record<EarlyAccessProduct, string> = {
    recon: 'your purchase register matched against GSTR-2B every month, with the invoices your suppliers have not reported, the ITC at risk, and a message for each supplier to chase',
    notice: 'a plain explanation of your GST notice, the reply deadline, a checklist of the documents to gather and a draft reply for your CA to review',
};

/**
 * Confirms a GSTR-2B Reconciliation or GST Notice Help early-access sign-up.
 * Like the Watch email, it says plainly that nothing exists yet and nothing
 * will be charged without asking.
 */
export async function sendEarlyAccessConfirmationEmail(email: string, product: EarlyAccessProduct) {
    const name = EARLY_ACCESS[product].name;
    await getResend().emails.send({
        from: FROM,
        to: email,
        subject: `You are on the ${name} early-access list`,
        html: shell(`
          <h1 style="font-size:20px;margin:0 0 12px;">You're on the list</h1>
          <p>Thanks for signing up for ${name}: ${EARLY_ACCESS_PITCH[product]}.</p>
          <p>It is not running yet. We are finding out whether enough people want it before we build it,
          and your answer is part of that. Nothing will be charged without asking you first.</p>
          <p>If you want to tell us what would make it worth paying for, just reply to this email.</p>
        `),
    });
}

/** Escapes visitor-written text before it goes into an HTML email. */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Sends us a "Did this help?" comment from a free tool. The comment is free
 * text from an anonymous visitor, so everything they wrote is escaped.
 */
export async function notifyFeedback(params: {
    tool: FeedbackTool;
    useful: boolean;
    comment: string;
    email?: string;
    page?: string;
}) {
    const toolName = FEEDBACK_TOOL_NAMES[params.tool];
    const verdict = params.useful ? '👍 Helpful' : '👎 Not helpful';
    await getResend().emails.send({
        from: FROM,
        to: NOTIFY_TO,
        ...(params.email ? { replyTo: params.email } : {}),
        subject: `${verdict}: ${toolName} feedback`,
        html: shell(`
          <h1 style="font-size:18px;">${verdict}: ${toolName}</h1>
          <p style="color:#52402F;white-space:pre-wrap;">${escapeHtml(params.comment)}</p>
          <p style="font-size:13px;color:#9E8A78;">
            Page: ${escapeHtml(params.page || '—')}<br>
            ${params.email ? `Follow-up email: ${escapeHtml(params.email)} (reply to this email to reach them)` : 'No email left.'}
          </p>
        `),
    });
}

/**
 * Notifies us that a lead came in. Sent regardless of whether the `leads` table
 * exists, so no lead is lost while the migration is still unapplied.
 */
export async function notifyNewLead(params: {
    email: string;
    source: LeadSource;
    detail: string;
}) {
    await getResend().emails.send({
        from: FROM,
        to: NOTIFY_TO,
        subject: `New ${params.source} lead: ${params.email}`,
        html: shell(`
          <h1 style="font-size:18px;">New lead from the free ${params.source} tool</h1>
          <p><strong>${params.email}</strong></p>
          <p style="color:#52402F;">${params.detail}</p>
        `),
    });
}
