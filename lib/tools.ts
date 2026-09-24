/**
 * lib/tools.ts
 * ─────────────────────────────────────────────────────────────────────
 * Every public tool and resource, grouped by the question a visitor
 * arrives with. The header menu, the mobile menu and the homepage tool
 * grid all render from this one list, so a new page added here is
 * reachable everywhere at once and none of them can drift.
 *
 * Grouped by side of the invoice rather than by product type: someone
 * holding an invoice they received, someone issuing one, and someone
 * working out what a lapse costs are three different visitors.
 */

export interface ToolLink {
    href: string;
    label: string;
    desc: string;
    /** Shown as a small badge. Use sparingly. */
    badge?: string;
}

export interface ToolGroup {
    id: 'received' | 'issuing' | 'money';
    title: string;
    blurb: string;
    tools: ToolLink[];
}

export const TOOL_GROUPS: ToolGroup[] = [
    {
        id: 'received',
        title: 'You received an invoice',
        blurb: 'Make sure it is genuine and that your input tax credit is safe.',
        tools: [
            { href: '/verify-invoice', label: 'Verify an invoice', desc: 'Is an invoice you were given genuine?' },
            { href: '/vendor-invoice-check', label: 'Check vendor invoices', desc: 'Catch defects before you claim ITC' },
            { href: '/vendor-gst-watch', label: 'Vendor GST Watch', desc: 'Get told when a supplier stops filing', badge: 'New' },
        ],
    },
    {
        id: 'issuing',
        title: 'You are issuing invoices',
        blurb: 'Catch the errors before the portal or the marketplace rejects them.',
        tools: [
            { href: '/check', label: 'Check one invoice', desc: '16 checks, each citing its section' },
            { href: '/bulk', label: 'Check a whole batch', desc: 'A CSV from Tally, Zoho or Busy' },
            { href: '/invoice-number-check', label: 'Invoice number check', desc: '16 characters, Rule 46(b)' },
        ],
    },
    {
        id: 'money',
        title: 'Money and deadlines',
        blurb: 'What a late return costs, what a late payment owes you, and why uploads fail.',
        tools: [
            { href: '/gst-penalty-calculator', label: 'Late return calculator', desc: 'What a missed GSTR-1 or 3B costs' },
            { href: '/unpaid-invoice', label: 'Interest on a late payment', desc: 'What a buyer owes under the MSMED Act' },
            { href: '/gst-error-codes', label: 'GSTR-1 error codes', desc: 'Every rejection code, explained' },
            { href: '/guides', label: 'GST guides', desc: 'Place of supply, Rule 46, late fees' },
        ],
    },
];

export const ALL_TOOLS: ToolLink[] = TOOL_GROUPS.flatMap((g) => g.tools);
