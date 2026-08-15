import { Resend } from 'resend';
import { BulkCheckResult } from '@/types';

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

export type LeadSource = 'bulk' | 'check';

function formatINR(value: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(value);
}

const shell = (body: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,Segoe UI,Arial,sans-serif;line-height:1.6;color:#281E15;max-width:640px;margin:0 auto;padding:24px;">
${body}
<hr style="border:none;border-top:1px solid #E8E0D8;margin:32px 0 16px;">
<p style="font-size:12px;color:#9E8A78;">
  InvoiceCheck.in — GST invoice validation.<br>
  General information about Indian GST, not tax advice. Confirm with your CA before filing.
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
