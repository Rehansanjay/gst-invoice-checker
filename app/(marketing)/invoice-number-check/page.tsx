import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL, OG_IMAGE } from '@/lib/site';
import InvoiceNumberClient from './InvoiceNumberClient';
import { MAX_INVOICE_NUMBER_LENGTH } from '@/lib/invoiceNumber';

/**
 * Built from Search Console rather than from a guess.
 *
 * "invoice number check" (65 impressions), "check invoice number online india"
 * (65), "invoice number check online" (14), plus "invoice number verification",
 * "invoice number checker", "check invoice number" and "how to check invoice
 * number is valid or not" — roughly 160 impressions a month against no page.
 *
 * The engine has always enforced Rule 46(b); there was simply nothing
 * answering the question in the form people type it. The checker validates in
 * the browser so an answer appears before the page has finished being read.
 */

export const metadata: Metadata = {
    title: 'Invoice Number Check — Is Yours Valid Under Rule 46(b)?',
    description:
        'Check an invoice number against Rule 46(b): sixteen characters, permitted characters only. Free, instant, no sign-up. Avoid GSTR-1 error RET191115.',
    alternates: { canonical: '/invoice-number-check' },
    openGraph: {
        type: 'website',
        title: 'Invoice Number Check — Rule 46(b)',
        description:
            'Sixteen characters, letters and numbers with hyphen or slash. Check yours before GSTR-1 rejects it.',
        url: `${SITE_URL}/invoice-number-check`,
        images: [OG_IMAGE],
    },
};

const FAQS = [
    {
        q: 'What is the maximum length of a GST invoice number?',
        a: 'Sixteen characters. Rule 46(b) of the CGST Rules 2017 requires a consecutive serial number not exceeding sixteen characters. A longer number is rejected by the GSTR-1 upload with error RET191115.',
    },
    {
        q: 'Which characters are allowed in an invoice number?',
        a: 'Letters, numerals, hyphen and slash. Rule 46(b) permits alphanumerics with those two special characters and nothing else — no spaces, hashes, ampersands, dots or brackets.',
    },
    {
        q: 'Can I restart my invoice numbering each financial year?',
        a: 'Yes, and it is the normal practice. Rule 46(b) requires the series to be unique within a financial year, so starting again at 1 on 1 April is correct. What is not permitted is two invoices carrying the same number inside the same year.',
    },
    {
        q: 'Can I run more than one invoice series at the same time?',
        a: 'Yes. Separate series per branch, per place of business or per document type are allowed, provided each series is consecutive in itself and every number stays unique within the financial year across all of them.',
    },
    {
        q: 'What is error RET191115?',
        a: 'The GSTR-1 upload error returned when an invoice number breaches Rule 46(b) — most often because it exceeds sixteen characters. The record is rejected and the return has to be corrected and resubmitted.',
    },
];

export default function InvoiceNumberCheckPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: FAQS.map((f) => ({
                            '@type': 'Question',
                            name: f.q,
                            acceptedAnswer: { '@type': 'Answer', text: f.a },
                        })),
                    }),
                }}
            />

            <div className="mx-auto max-w-3xl">
                <h1 className="text-4xl font-bold leading-tight font-heading sm:text-5xl mb-4" style={{ color: 'var(--warm-charcoal)' }}>
                    Invoice number check
                </h1>
                <p className="text-lg mb-8" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    Rule 46(b) of the CGST Rules puts two hard limits on an invoice number: at most{' '}
                    {MAX_INVOICE_NUMBER_LENGTH} characters, and letters and numerals with only a hyphen
                    or slash besides. Break either and the GSTR-1 upload rejects the record. Check
                    yours below — it runs in your browser and nothing is sent anywhere.
                </p>

                <InvoiceNumberClient />

                <h2 className="text-2xl font-bold mt-14 mb-4 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                    What Rule 46(b) actually requires
                </h2>
                <p className="mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    The rule asks for four things at once, and only two of them can be seen in a single
                    number. It must be a <strong>consecutive serial number</strong>, it must be{' '}
                    <strong>unique within the financial year</strong>, it must not exceed{' '}
                    <strong>sixteen characters</strong>, and it may contain only{' '}
                    <strong>alphanumerics, hyphen and slash</strong>.
                </p>
                <p className="mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    Length and character set are visible in the number itself, which is what the
                    checker above tests. Consecutiveness and uniqueness are properties of the whole
                    series — they need the register, not one row, which is what the{' '}
                    <Link href="/bulk" style={{ color: 'var(--warm-accent)' }}>batch check</Link>{' '}
                    is for.
                </p>

                <h2 className="text-2xl font-bold mt-12 mb-4 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                    Why sixteen characters catches people out
                </h2>
                <p className="mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    Almost nobody sets out to write a seventeen-character invoice number. It happens
                    because the number is assembled from parts: a branch code, a financial year, a
                    document type and a running sequence. Each is reasonable on its own and the
                    concatenation quietly runs over.
                </p>
                <p className="mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    <code>INVOICE/MUMBAI/2026-27/00412</code> is twenty-eight characters and will be
                    rejected. <code>MUM/26-27/00412</code> is fifteen, carries the same information, and
                    will not. The usual fix is shortening the branch token and the year rather than
                    touching the sequence.
                </p>

                <h2 className="text-2xl font-bold mt-12 mb-4 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                    The one that is invisible
                </h2>
                <p className="mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    A leading or trailing space. It survives a copy-paste out of a spreadsheet, it
                    looks like nothing on screen, and it makes the number fail the character-set test
                    on upload. If a number looks correct and is still rejected, this is the first thing
                    to check — the checker above flags it explicitly for that reason.
                </p>

                <h2 className="text-2xl font-bold mt-12 mb-5 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                    Common questions
                </h2>
                <div className="space-y-3">
                    {FAQS.map((f, i) => (
                        <details
                            key={f.q}
                            open={i === 0}
                            className="group rounded-xl overflow-hidden"
                            style={{ background: 'var(--warm-cream)', border: '1px solid var(--warm-border)' }}
                        >
                            <summary className="cursor-pointer list-none px-5 py-4 font-semibold flex items-start justify-between gap-4" style={{ color: 'var(--warm-charcoal)' }}>
                                <h3 className="text-[15px] font-semibold m-0">{f.q}</h3>
                                <span className="shrink-0 mt-0.5 transition-transform group-open:rotate-45 text-xl leading-none" style={{ color: 'var(--warm-accent)' }} aria-hidden="true">+</span>
                            </summary>
                            <div className="px-5 pb-5 -mt-1">
                                <p className="text-[15px] leading-relaxed" style={{ color: 'var(--warm-charcoal-soft)' }}>{f.a}</p>
                            </div>
                        </details>
                    ))}
                </div>

                <div className="mt-12 rounded-xl p-6" style={{ background: 'var(--warm-bg-alt)', border: '1px solid var(--warm-border)' }}>
                    <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--warm-charcoal)' }}>
                        The number is one of sixteen checks
                    </h2>
                    <p className="text-[15px] mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        Tax head against place of supply, HSN length against your turnover band, the
                        arithmetic line by line, rounding at invoice level — an invoice fails on any of
                        them. Running the whole thing takes about as long as this did.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/check" className="btn-warm-primary px-5 py-2.5 text-[15px] inline-flex items-center">
                            Check one invoice
                        </Link>
                        <Link href="/bulk" className="btn-warm-secondary px-5 py-2.5 text-[15px] inline-flex items-center">
                            Check a whole batch
                        </Link>
                    </div>
                </div>

                <p className="mt-8 text-xs" style={{ color: 'var(--warm-text-secondary)' }}>
                    General information about Indian GST, not tax advice. Rule 46 is amended by
                    notification from time to time — confirm the current position with your CA before
                    relying on it. See also{' '}
                    <Link href="/gst-error-codes/ret191115" style={{ color: 'var(--warm-accent)' }}>
                        error RET191115
                    </Link>.
                </p>
            </div>
        </div>
    );
}
