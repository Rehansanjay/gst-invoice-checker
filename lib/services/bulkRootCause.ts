import { BulkInvoiceResult, BulkRootCause } from '@/types';

/**
 * lib/services/bulkRootCause.ts
 * ─────────────────────────────────────────────────────────────────────
 * Groups repeating defects in a batch by their likely upstream source.
 *
 * A practitioner reviewing the exception report made the point that these
 * defects "stem from master data mismatches" — one wrong GSTIN in a customer
 * master produces a wrong tax head on every invoice to that customer. Listing
 * twelve invoices as twelve findings describes twelve symptoms of one problem,
 * and sends the reader to fix the same thing twelve times.
 *
 * Two patterns are detected, deliberately conservative:
 *
 *   counterparty — the same defect on ≥2 invoices sharing a buyer GSTIN.
 *                  Almost always that customer's master record.
 *   systemic     — the same defect on ≥3 invoices across ≥3 distinct buyers,
 *                  so no single counterparty explains it. Points at a template
 *                  or a configuration setting.
 *
 * The ≥3-buyer condition on systemic is what stops a counterparty problem being
 * reported twice under two different headings.
 *
 * Not detected yet: item-master defects (the same HSN carrying the same problem
 * across invoices). That needs an issue-to-line-item mapping the current issue
 * summary does not carry, and a wrong guess about which line an HSN issue
 * belongs to is worse than staying silent.
 */

/** Strips the trailing line reference so "Wrong Tax Type — Line 1" and "— Line 4" group together. */
export function normaliseIssueTitle(title: string): string {
    return title.replace(/\s*[—–-]\s*Line\s*\d+\s*$/i, '').trim();
}

const MIN_COUNTERPARTY_INVOICES = 2;
const MIN_SYSTEMIC_INVOICES = 3;
const MIN_SYSTEMIC_BUYERS = 3;

type Occurrence = {
    invoiceNumber: string;
    buyerGSTIN: string;
    amount: number;
    category: string;
    severity: BulkRootCause['severity'];
};

export function detectRootCauses(results: BulkInvoiceResult[]): BulkRootCause[] {
    // One entry per (normalised title, invoice) — an invoice with the same
    // defect on four lines is still one invoice for this purpose.
    const byTitle = new Map<string, Occurrence[]>();

    for (const inv of results) {
        const seenOnThisInvoice = new Set<string>();
        for (const issue of inv.issues) {
            const title = normaliseIssueTitle(issue.title);
            if (seenOnThisInvoice.has(title)) continue;
            seenOnThisInvoice.add(title);

            const list = byTitle.get(title) ?? [];
            list.push({
                invoiceNumber: inv.invoiceNumber,
                buyerGSTIN: (inv.buyerGSTIN || '').toUpperCase(),
                amount: inv.invoiceTotalAmount,
                category: issue.category,
                severity: issue.severity,
            });
            byTitle.set(title, list);
        }
    }

    const causes: BulkRootCause[] = [];

    for (const [title, occurrences] of byTitle) {
        const { category, severity } = occurrences[0];

        // ── Counterparty: same defect, same buyer ──────────────────────
        const byBuyer = new Map<string, Occurrence[]>();
        for (const o of occurrences) {
            if (!o.buyerGSTIN) continue; // B2C — no master record to blame
            byBuyer.set(o.buyerGSTIN, [...(byBuyer.get(o.buyerGSTIN) ?? []), o]);
        }

        const explainedByBuyer = new Set<string>();
        for (const [gstin, group] of byBuyer) {
            if (group.length < MIN_COUNTERPARTY_INVOICES) continue;
            group.forEach((o) => explainedByBuyer.add(o.invoiceNumber));
            causes.push({
                id: `counterparty:${gstin}:${title}`,
                scope: 'counterparty',
                key: gstin,
                issueTitle: title,
                category,
                severity,
                invoiceCount: group.length,
                invoiceNumbers: group.map((o) => o.invoiceNumber),
                amountAffected: round2(group.reduce((s, o) => s + o.amount, 0)),
                hint: `All ${group.length} invoices to ${gstin} carry this same defect. That usually means the record for this customer is wrong — correcting it once fixes every invoice to them, including future ones.`,
            });
        }

        // ── Systemic: spread across buyers, so no one master explains it ──
        const distinctBuyers = new Set(occurrences.map((o) => o.buyerGSTIN).filter(Boolean));
        if (
            occurrences.length >= MIN_SYSTEMIC_INVOICES &&
            distinctBuyers.size >= MIN_SYSTEMIC_BUYERS
        ) {
            causes.push({
                id: `systemic:${title}`,
                scope: 'systemic',
                key: '',
                issueTitle: title,
                category,
                severity,
                invoiceCount: occurrences.length,
                invoiceNumbers: occurrences.map((o) => o.invoiceNumber),
                amountAffected: round2(occurrences.reduce((s, o) => s + o.amount, 0)),
                hint: `This appears on ${occurrences.length} invoices across ${distinctBuyers.size} different customers, so it is unlikely to be one bad record. Check the invoice template or the setting in your billing software that produces this field.`,
            });
        }
    }

    // Worst first: criticals, then breadth, then value.
    const severityRank = { critical: 0, warning: 1, info: 2 } as const;
    return causes.sort((a, b) => {
        if (severityRank[a.severity] !== severityRank[b.severity]) {
            return severityRank[a.severity] - severityRank[b.severity];
        }
        if (b.invoiceCount !== a.invoiceCount) return b.invoiceCount - a.invoiceCount;
        return b.amountAffected - a.amountAffected;
    });
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}
