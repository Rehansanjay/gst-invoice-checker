/**
 * lib/invoiceNumber.ts
 * ─────────────────────────────────────────────────────────────────────
 * Rule 46(b) checks on an invoice number, on its own.
 *
 * Extracted so the standalone checker at /invoice-number-check and
 * RULE_INVOICE_NUMBER in the validation engine apply the same limits. A page
 * that tells someone their invoice number is fine, followed by a batch check
 * that flags it, is worse than not having the page.
 *
 * WHY THIS PAGE EXISTS AT ALL
 *
 * Search Console shows roughly 160 impressions a month across "invoice number
 * check", "invoice number check online", "check invoice number online india",
 * "invoice number verification" and their variants — and nothing on the site
 * targeted any of them. The engine has always known the rule; there was just
 * no page answering the question people actually type.
 */

/** Rule 46(b): the number must not exceed sixteen characters. */
export const MAX_INVOICE_NUMBER_LENGTH = 16;

/** Letters, digits, hyphen, and either slash. Nothing else. */
export const INVOICE_NUMBER_PATTERN = /^[A-Za-z0-9\-/\\]+$/;

export type InvoiceNumberProblem =
    | 'EMPTY'
    | 'TOO_LONG'
    | 'DISALLOWED_CHARACTERS'
    | 'LEADING_OR_TRAILING_SPACE';

export interface InvoiceNumberRead {
    input: string;
    length: number;
    /** True only when nothing at all is wrong with the shape. */
    valid: boolean;
    problems: InvoiceNumberProblem[];
}

export function readInvoiceNumber(raw: string | null | undefined): InvoiceNumberRead {
    const input = raw ?? '';
    const trimmed = input.trim();
    const problems: InvoiceNumberProblem[] = [];

    if (!trimmed) {
        return { input, length: 0, valid: false, problems: ['EMPTY'] };
    }

    // Surrounding whitespace is worth calling out separately: it is invisible
    // in a spreadsheet cell and it is a common reason a number that "looks
    // fine" fails on upload.
    if (trimmed !== input) problems.push('LEADING_OR_TRAILING_SPACE');
    if (trimmed.length > MAX_INVOICE_NUMBER_LENGTH) problems.push('TOO_LONG');
    if (!INVOICE_NUMBER_PATTERN.test(trimmed)) problems.push('DISALLOWED_CHARACTERS');

    return { input, length: trimmed.length, valid: problems.length === 0, problems };
}

/** What each problem means, and what the portal does about it. */
export const PROBLEM_DETAIL: Record<InvoiceNumberProblem, { title: string; detail: string }> = {
    EMPTY: {
        title: 'No invoice number',
        detail: 'Rule 46(b) requires a consecutive serial number on every tax invoice. An invoice without one is not a valid tax invoice.',
    },
    TOO_LONG: {
        title: `Longer than ${MAX_INVOICE_NUMBER_LENGTH} characters`,
        detail: 'Rule 46(b) caps the serial number at sixteen characters. The GSTR-1 upload rejects a longer one with error RET191115. Concatenated branch, year and sequence numbering is the usual cause.',
    },
    DISALLOWED_CHARACTERS: {
        title: 'Contains characters that are not allowed',
        detail: 'Rule 46(b) permits letters, numerals, hyphen and slash. Spaces, hashes, ampersands and other punctuation are outside it and are rejected by some portals.',
    },
    LEADING_OR_TRAILING_SPACE: {
        title: 'Starts or ends with a space',
        detail: 'Invisible in a spreadsheet cell, and a common reason a number that looks correct fails on upload. Trim it before exporting.',
    },
};
