import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_RULES } from '@/lib/services/validationRules';
import AffiliateSuggestion from '@/components/AffiliateSuggestion';

/**
 * Content below the tool, and the metadata for the page.
 *
 * WHY THIS PAGE GOT ATTENTION
 *
 * Analytics for 17–23 Aug: /check holds visitors for 53 seconds, three times
 * longer than anything else on the site. It is also the thinnest page here at
 * 257 words, carried an 83-character description that wasted half the search
 * snippet, and — because the navbar is deliberately suppressed for a focused
 * flow — had no internal links leaving it at all.
 *
 * So the page people actually use was the one Google had least reason to rank
 * and no way to crawl onward from. The content lives in the layout rather than
 * the page because page.tsx is a client component: this way it is server
 * rendered and in the HTML, and the tool itself is untouched.
 *
 * The exits at the bottom matter for the funnel too. Somebody finishing a
 * check had nowhere to go next, on the one page where they were engaged.
 */

export const metadata: Metadata = {
    // Homepage now targets the generic "invoice check" terms, so this one takes
    // the GST-qualified variants — "gst invoice check online", "check gst
    // invoice online", "validate gst invoice" — rather than competing with it.
    title: 'GST Invoice Check Online — Free, 16 Statutory Checks',
    description:
        'Enter your invoice details and get 16 statutory checks in 15 seconds — GSTIN, HSN, tax head, place of supply and the arithmetic. Free, no sign-up.',
    alternates: { canonical: '/check' },
};

const CHECK_GROUPS = [
    {
        heading: 'Who the parties are',
        items: [
            'GSTIN structure for supplier and buyer — 15 characters, checksum position, entity code',
            'State code inside each GSTIN against the valid list',
            'Supplier and buyer GSTIN not identical',
        ],
    },
    {
        heading: 'Which tax applies',
        items: [
            'Tax head against place of supply — IGST for interstate, CGST plus SGST for intrastate',
            'CGST and SGST splitting evenly, which they must',
            'Rate against the permitted slabs',
            'Reverse charge flagged consistently with the tax actually charged',
        ],
    },
    {
        heading: 'Whether the arithmetic holds',
        items: [
            'Tax recomputed line by line against the taxable value and rate',
            'Line taxable amounts summing to the stated total',
            'Invoice total reconciling against lines plus tax',
            'Rounding at invoice level, not only per line',
        ],
    },
    {
        heading: 'Whether the document is well formed',
        items: [
            'HSN present, and long enough for your turnover band',
            'Invoice number within 16 characters and using permitted characters only',
            'Invoice date within a sane period',
            'Place of supply present where it is required',
            'Invoice type consistent with the parties and the tax charged',
        ],
    },
];

export default function CheckLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}

            <section className="border-t" style={{ background: 'var(--warm-bg)', borderColor: 'var(--warm-border)' }}>
                <div className="container mx-auto px-4 py-14">
                    <div className="mx-auto max-w-3xl">

                        <h2 className="text-2xl font-bold mb-3 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                            What the {ALL_RULES.length} checks actually look at
                        </h2>
                        <p className="mb-6" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            All of them are mechanical — structure, arithmetic, formatting and tax heads.
                            None of them is a judgement call, which is exactly why they are worth
                            automating and why they are the errors that get returns rejected on upload.
                            Every flag names the rule or section it comes from.
                        </p>

                        <div className="grid gap-6 sm:grid-cols-2 mb-10">
                            {CHECK_GROUPS.map((g) => (
                                <div key={g.heading}>
                                    <h3 className="text-[15px] font-bold mb-2" style={{ color: 'var(--warm-charcoal)' }}>
                                        {g.heading}
                                    </h3>
                                    <ul className="space-y-1.5">
                                        {g.items.map((i) => (
                                            <li key={i} className="text-[14px] leading-snug flex gap-2" style={{ color: 'var(--warm-charcoal-soft)' }}>
                                                <span style={{ color: 'var(--warm-success)' }}>✓</span>
                                                {i}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <h2 className="text-2xl font-bold mb-3 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                            Why a rejected invoice costs more than it looks
                        </h2>
                        <p className="mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            A GSTR-1 upload fails against the whole JSON. One invoice with a malformed
                            number or a tax head that contradicts the place of supply returns an error
                            code against that record, and the return has to be unpicked and resubmitted
                            — usually on the 10th or 11th, under time pressure.
                        </p>
                        <p className="mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            Marketplaces apply the same particulars and hold the payment rather than
                            cancelling the order, so the money stops moving while nobody tells you why.
                            And where the defect is in an invoice you <em>received</em>, the exposure is
                            yours rather than the supplier&apos;s: input tax credit under Section 16
                            requires a valid tax invoice, and their mistake is what costs you the credit.
                        </p>
                        <p className="mb-10" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            None of that is difficult to avoid. It is just tedious to check by eye, on
                            every invoice, every month.
                        </p>

                        <h2 className="text-2xl font-bold mb-3 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                            What happens to your data
                        </h2>
                        <p className="mb-10" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            A free check is processed in memory and never written to our database —
                            nothing from it is kept. A paid report is stored, because that is what lets
                            you re-open, download and email it afterwards. Nothing is sold, nothing
                            trains a model, and a stored check can be deleted on request.
                        </p>

                        {/*
                          The exits. The navbar is suppressed on this route for a
                          focused flow, which left the page with no internal links
                          out — a crawl dead end, and a funnel dead end for anyone
                          who had just spent a minute using it.
                        */}
                        <div className="rounded-xl p-6" style={{ background: 'var(--warm-bg-alt)', border: '1px solid var(--warm-border)' }}>
                            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--warm-charcoal)' }}>
                                Where to go next
                            </h2>
                            <ul className="grid gap-2 sm:grid-cols-2">
                                {[
                                    { href: '/bulk', label: 'Check a whole batch', detail: 'A CSV, up to 100 invoices, free' },
                                    { href: '/invoice-number-check', label: 'Invoice number only', detail: 'The Rule 46(b) limits' },
                                    { href: '/gst-error-codes', label: 'Look up an error code', detail: 'If the portal already rejected it' },
                                    { href: '/verify-invoice', label: 'Verify one you received', detail: 'Is it genuine?' },
                                    { href: '/unpaid-invoice', label: 'Chase a late payment', detail: 'Interest under the MSMED Act' },
                                    { href: '/pricing', label: 'Pricing', detail: 'Free to run, ₹99 for the fixes' },
                                ].map((l) => (
                                    <li key={l.href}>
                                        <Link href={l.href} className="group block py-1">
                                            <span className="text-[14.5px] font-semibold group-hover:underline underline-offset-4" style={{ color: 'var(--warm-charcoal)' }}>
                                                {l.label}
                                            </span>
                                            <span className="block text-[13px]" style={{ color: 'var(--warm-text-secondary)' }}>
                                                {l.detail}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/*
                          Renders nothing until a real tracking URL is set in
                          lib/affiliates.ts, so this is inert until the
                          programme approves. Placed here rather than beside the
                          results: someone mid-check is working, and a
                          recommendation lands better once they have their
                          answer.
                        */}
                        <div className="mt-6">
                            <AffiliateSuggestion
                                intro="Most of what the checker flags is a data-entry problem rather than a filing one. Software that enforces the fields at entry stops it recurring."
                            />
                        </div>

                        <p className="mt-8 text-xs" style={{ color: 'var(--warm-text-secondary)' }}>
                            General information about Indian GST, not tax advice. Rules are amended by
                            notification from time to time — confirm the current position with your CA
                            before filing.
                        </p>

                    </div>
                </div>
            </section>
        </>
    );
}
