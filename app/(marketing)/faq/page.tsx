import Link from 'next/link';
import { SITE_URL, OG_IMAGE } from '@/lib/site';
import { ALL_RULES } from '@/lib/services/validationRules';

/**
 * FAQ.
 *
 * WHY NOT THE ACCORDION COMPONENT
 *
 * This page used Radix Accordion, which does not render collapsed content
 * into the DOM at all. The answers existed in the source and never reached
 * the HTML, so the whole page served five question headings and nothing else
 * — 121 words, on a domain where thirteen pages already sit at "Discovered —
 * currently not indexed". An FAQ that a crawler reads as five headings is not
 * an FAQ.
 *
 * Native <details>/<summary> instead. The content is in the markup whether
 * open or shut, it collapses without JavaScript, and it carries the right
 * semantics for a screen reader without any of the wiring.
 */

const UPDATED = '2026-08-23';

export const metadata = {
    title: 'GST Invoice Checker FAQ — What It Checks, What It Costs',
    description:
        'What the checker validates, what it costs, whether it replaces your CA, and what happens to your invoice data. Straight answers.',
    alternates: { canonical: '/faq' },
    openGraph: {
        type: 'website',
        title: 'GST Invoice Checker — Frequently Asked Questions',
        description: 'What it checks, what it costs, and what happens to your data.',
        url: `${SITE_URL}/faq`,
        images: [OG_IMAGE],
    },
};

interface QA { q: string; a: string; }

/**
 * Answers are plain strings so the same text feeds both the page and the
 * FAQPage structured data. Two copies would drift, and the copy Google reads
 * is the one that would rot unnoticed.
 */
const FAQS: QA[] = [
    {
        q: 'What does the checker actually look at?',
        a: `${ALL_RULES.length} mechanical checks on the invoice itself: GSTIN structure and state code for both parties, the tax head against place of supply, whether CGST and SGST split evenly, HSN presence and length, the GST rate against the permitted slabs, the tax recomputed line by line, the line totals against the invoice total, invoice number length and characters, invoice date sanity, reverse charge consistency, and rounding at invoice level as well as per line. Every flag names the rule or section it comes from, so you can check the reasoning rather than take it on trust.`,
    },
    {
        q: 'What does it cost?',
        a: 'Running a check is free and needs no account — the tool validates the invoice and names every problem it finds without payment. ₹99 unlocks the full report for that invoice: the corrected values, and how to put each issue right. A batch upload is free to run as well. If you check often, credit packs bring the per-invoice cost down to ₹40, ₹30 or ₹25, and a practice pack of 250 checks works out at ₹20 each.',
    },
    {
        q: 'Does this replace my CA?',
        a: `No, and it is not meant to. These are ${ALL_RULES.length} mechanical checks on the document — structure, arithmetic, formatting, tax heads. That is the tedious layer, and it is the layer that gets returns rejected on upload. Judgement calls, classification, notices and the return itself are your CA's work. A number of practices run their own client batches through it for exactly that reason: it clears the mechanical errors before the professional review starts, so the review is spent on things that need a person.`,
    },
    {
        q: 'Is my invoice data safe?',
        a: 'A free check is processed in memory and never written to our database — nothing from it is kept. A paid check is different: the invoice details are stored so you can re-open, download and email that report later, and so it appears in your dashboard history if you have an account. Data is encrypted in transit and at rest. We do not sell it and do not use it to train AI models. You can ask us to delete a stored check at any time by emailing privacy@invoicecheck.in.',
    },
    {
        q: 'Do I need an account?',
        a: 'Not to check an invoice. Guests get three free checks with nothing to sign up for. An account is worth having if you want your reports saved and re-openable, dashboard history across checks, or credits that carry across sessions — but the tool works without one, and it works before you have decided whether you trust it.',
    },
    {
        q: 'Why was my invoice rejected by Amazon or Flipkart?',
        a: 'Marketplace systems check the same mechanical particulars the GST portal does, and reject on any of them: the wrong tax head for the place of supply, an HSN code that is missing or too short for your turnover band, tax that does not reconcile against the taxable value, an invalid or cancelled GSTIN, or an invoice number outside the permitted format. A rejection usually holds the payment rather than cancelling the order, which is why it is worth catching before submission rather than after.',
    },
    {
        q: 'Can I check more than one invoice at a time?',
        a: 'Yes. The batch check takes a CSV of up to 100 invoices and returns a worst-first list — the invoices most likely to be rejected at the top, with what is wrong on each. Exports from Tally, Zoho, Busy and the GSTR-1 offline tool are recognised automatically, and the column names do not have to match ours exactly. It is free to run.',
    },
    {
        q: 'Can I check invoices I have received, rather than ones I issue?',
        a: 'Yes, and it is a different question worth asking. A supplier\'s defective invoice puts your input tax credit at risk under Section 16, not theirs — so the vendor check runs the same engine over invoices arriving at your books. There is also a verification check for the narrower question of whether an invoice you were handed is genuine at all.',
    },
    {
        q: 'What if a customer has not paid me?',
        a: 'That is a different tool. Where a buyer pays a registered micro or small enterprise late, section 16 of the MSMED Act 2006 provides for compound interest with monthly rests at three times the RBI Bank Rate. The calculator works out what has accrued, period by period against the rate in force during each month, and it is free. It is a computation, not advice on your legal position.',
    },
    {
        q: 'What happens after it finds an error?',
        a: 'The free result names every issue and where it is. The paid report adds the corrected value for each one and what to change in your accounting software to fix it. You make the correction in Tally, Zoho or wherever the invoice lives, and re-run the check to confirm it comes back clean. Nothing is filed or submitted on your behalf at any point.',
    },
    {
        q: 'Do you offer refunds?',
        a: 'Yes. If the validation report is wrong or you are not satisfied with it, contact us within 48 hours of purchase for a full refund. Email mailtoinvoicecheck@gmail.com with your transaction ID or the address used for payment, and it is processed within 5 to 7 business days to the original payment method.',
    },
    {
        q: 'Is this built for Indian GST specifically?',
        a: 'Yes. It is built against the CGST, SGST and IGST Acts and the CGST Rules — state codes, the permitted rate slabs, HSN requirements per Notification 78/2020-CT, place of supply under Sections 7 and 8 of the IGST Act, and the Rule 46 particulars an invoice has to carry. It is not a general-purpose invoice validator with an Indian option bolted on.',
    },
];

export default function FAQPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            {/*
              The same answers as the page, machine-readable. Built from the
              FAQS array rather than restated, so the two cannot drift — and
              the copy Google reads is exactly the copy a visitor reads.
            */}
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

            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-4 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                    Frequently asked questions
                </h1>
                <p className="text-lg mb-10" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    What the checker looks at, what it costs, and what happens to your data.
                    If something is not answered here,{' '}
                    <Link href="/contact" className="underline underline-offset-2" style={{ color: 'var(--warm-accent)' }}>
                        ask us
                    </Link>.
                </p>

                <div className="space-y-3">
                    {FAQS.map((f, i) => (
                        <details
                            key={f.q}
                            open={i === 0}
                            className="group rounded-xl overflow-hidden"
                            style={{ background: 'var(--warm-cream)', border: '1px solid var(--warm-border)' }}
                        >
                            <summary
                                className="cursor-pointer list-none px-6 py-4 font-semibold flex items-start justify-between gap-4"
                                style={{ color: 'var(--warm-charcoal)' }}
                            >
                                <h2 className="text-[16px] font-semibold m-0">{f.q}</h2>
                                <span
                                    className="shrink-0 mt-0.5 transition-transform group-open:rotate-45 text-xl leading-none"
                                    style={{ color: 'var(--warm-accent)' }}
                                    aria-hidden="true"
                                >
                                    +
                                </span>
                            </summary>
                            <div className="px-6 pb-5 -mt-1">
                                <p className="text-[15px] leading-relaxed" style={{ color: 'var(--warm-charcoal-soft)' }}>
                                    {f.a}
                                </p>
                            </div>
                        </details>
                    ))}
                </div>

                <div
                    className="mt-12 rounded-xl p-6"
                    style={{ background: 'var(--warm-bg-alt)', border: '1px solid var(--warm-border)' }}
                >
                    <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--warm-charcoal)' }}>
                        Try it before you decide
                    </h2>
                    <p className="text-[15px] mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        Three checks free, no account. If you have a batch, the CSV upload is free to
                        run however many invoices are in it.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/check" className="btn-warm-primary px-5 py-2.5 text-[15px] inline-flex items-center">
                            Check one invoice
                        </Link>
                        <Link href="/bulk" className="btn-warm-secondary px-5 py-2.5 text-[15px] inline-flex items-center">
                            Check a batch
                        </Link>
                    </div>
                </div>

                <p className="mt-8 text-xs" style={{ color: 'var(--warm-text-secondary)' }}>
                    Last reviewed {UPDATED}. General information about Indian GST, not tax advice —
                    confirm the current position with your CA before filing.
                </p>
            </div>
        </div>
    );
}
