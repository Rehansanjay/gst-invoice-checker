import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert, Search, FileWarning, CheckCircle2 } from 'lucide-react';
import { SITE_URL, OG_IMAGE } from '@/lib/site';

/**
 * Landing page for the RECEIVER of an invoice, not the filer.
 *
 * Search Console shows the verification cluster ("invoice number check",
 * "check invoice number online india", "verify invoice online") outweighs the
 * GST-compliance term roughly 9:1 — people arrive via the domain name asking
 * "is this invoice real?" and were being shown a filing-compliance tool.
 *
 * Same engine, receiver framing. Deliberately distinct from
 * /vendor-invoice-check, which addresses AP teams protecting ITC at volume;
 * this addresses a single suspicious invoice and the question of authenticity.
 */

export const metadata: Metadata = {
    title: 'Verify a GST Invoice — Check if an Invoice is Genuine',
    description:
        'Received an invoice you are not sure about? Check the GSTIN, tax calculation, HSN code and invoice format in seconds. A fabricated GST invoice usually fails at least one of these checks.',
    alternates: { canonical: '/verify-invoice' },
    openGraph: {
        type: 'website',
        title: 'Verify a GST Invoice — Check if an Invoice is Genuine',
        description:
            'Check the GSTIN, tax arithmetic, HSN and invoice format before you pay. A fabricated invoice usually fails at least one.',
        url: `${SITE_URL}/verify-invoice`,
        images: [OG_IMAGE],
    },
};

const CHECKS = [
    {
        icon: Search,
        title: 'GSTIN structure and state code',
        body: 'A GSTIN is 15 characters with a checksum derived from the preceding fourteen. An invented number almost never satisfies it.',
        automated: true,
    },
    {
        icon: FileWarning,
        title: 'Mandatory particulars under Rule 46',
        body: 'Place of supply, HSN or SAC, reverse charge status, invoice number and date. Fabricated documents usually omit something.',
        automated: true,
    },
    {
        icon: CheckCircle2,
        title: 'Tax rate against the notified slabs',
        body: 'An arbitrary rate, or one worked backwards from a round total, is not something a compliant billing system produces.',
        automated: true,
    },
    {
        icon: CheckCircle2,
        title: 'Tax arithmetic, line by line',
        body: 'Taxable value × rate must equal the tax charged, and CGST and SGST must be equal halves. Fakes often fail here.',
        automated: true,
    },
    {
        icon: CheckCircle2,
        title: 'Invoice number and date',
        body: 'Maximum 16 characters, permitted characters only, and a date that is neither in the future nor before the supplier was registered.',
        automated: true,
    },
    {
        icon: ShieldAlert,
        title: 'Whether the supplier actually filed',
        body: 'This one needs the GST portal — check whether the invoice appears in your GSTR-2B. No tool reading only the invoice can tell you.',
        automated: false,
    },
];

export default function VerifyInvoicePage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: [
                            {
                                '@type': 'Question',
                                name: 'How do I check if a GST invoice is genuine?',
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: 'Verify six things: that the supplier\'s GSTIN is structurally valid and still active, that the invoice carries every particular Rule 46 requires, that the tax rate is a notified slab, that the HSN or SAC code fits the goods or service, that the invoice number and date are within the permitted format and window, and that the supplier has reported the invoice in their return. The first five can be checked from the invoice itself; the sixth requires the GST portal.',
                                },
                            },
                            {
                                '@type': 'Question',
                                name: 'What does a fake GST invoice usually get wrong?',
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: 'Most commonly: a GSTIN that fails its checksum or belongs to a cancelled registration, tax that does not reconcile against the taxable value and rate, CGST and SGST that are not equal halves, a missing place of supply, or an invoice number longer than the 16 characters Rule 46(b) permits.',
                                },
                            },
                            {
                                '@type': 'Question',
                                name: 'Can I lose input tax credit because of a supplier\'s invoice error?',
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: 'Yes. Input tax credit requires a valid tax invoice, and under Section 16(2)(c) of the CGST Act it also depends on the tax having been paid to the government. A defect in the supplier\'s document puts the recipient\'s credit at risk even though the mistake was not theirs.',
                                },
                            },
                        ],
                    }),
                }}
            />

            <div className="mx-auto max-w-3xl">
                <div className="mb-12 text-center">
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: 'var(--warm-bg-alt)', color: 'var(--warm-charcoal-soft)' }}
                    >
                        <ShieldAlert className="h-3 w-3" />
                        Before you pay it
                    </span>
                    <h1
                        className="mt-4 text-4xl font-bold leading-tight font-heading sm:text-5xl"
                        style={{ color: 'var(--warm-charcoal)' }}
                    >
                        Is this invoice genuine?
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        Received an invoice you are not sure about? Check the GSTIN, the tax
                        arithmetic, the HSN code and the invoice format in seconds. A fabricated GST
                        invoice usually fails at least one of these.
                    </p>

                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/check?utm_source=verify-invoice"
                            className="inline-block rounded-lg px-6 py-3 font-semibold"
                            style={{ background: 'var(--warm-accent)', color: 'var(--warm-cream)' }}
                        >
                            Check an invoice — free
                        </Link>
                        <Link
                            href="/guides/how-to-check-fake-gst-invoice"
                            className="inline-block rounded-lg px-6 py-3 font-semibold"
                            style={{ border: '1px solid var(--warm-border)', color: 'var(--warm-charcoal)' }}
                        >
                            Read the full method
                        </Link>
                    </div>
                </div>

                <h2 className="mb-4 text-2xl font-bold font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                    What gets checked
                </h2>
                <p className="mb-6" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    Most guides tell you to do this by hand across the GST portal, the CBIC rate
                    chart and an HSN lookup. Five of the six are mechanical, and we do those from
                    the invoice itself.
                </p>

                <div className="space-y-3">
                    {CHECKS.map((c) => (
                        <div
                            key={c.title}
                            className="rounded-xl p-5"
                            style={{
                                background: c.automated ? 'var(--warm-cream)' : 'var(--warm-bg-alt)',
                                border: '1px solid var(--warm-border)',
                            }}
                        >
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <c.icon
                                    className="h-4 w-4"
                                    style={{ color: c.automated ? 'var(--warm-success)' : 'var(--warm-text-secondary)' }}
                                />
                                <span className="font-semibold" style={{ color: 'var(--warm-charcoal)' }}>
                                    {c.title}
                                </span>
                                <span
                                    className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium"
                                    style={{
                                        background: c.automated ? '#E8F5EE' : 'var(--warm-border-light)',
                                        color: c.automated ? 'var(--warm-success)' : 'var(--warm-text-secondary)',
                                    }}
                                >
                                    {c.automated ? 'Checked automatically' : 'Needs the GST portal'}
                                </span>
                            </div>
                            <p className="text-sm" style={{ color: 'var(--warm-charcoal-soft)' }}>{c.body}</p>
                        </div>
                    ))}
                </div>

                {/* Stating the limit plainly is what makes the other five credible. */}
                <div
                    className="mt-8 rounded-xl p-5"
                    style={{ background: 'var(--warm-cream-dark)', borderLeft: '3px solid var(--warm-accent)' }}
                >
                    <p style={{ color: 'var(--warm-charcoal-soft)' }}>
                        <strong style={{ color: 'var(--warm-charcoal)' }}>What we cannot tell you:</strong>{' '}
                        whether the supplier has actually paid the tax and reported the invoice. That
                        lives on the GST portal, and it is what your input tax credit ultimately
                        depends on under Section 16(2)(c). Check your GSTR-2B for that — anyone
                        claiming to verify it from the invoice alone is overstating what is possible.
                    </p>
                </div>

                <div
                    className="mt-12 rounded-2xl p-8 text-center"
                    style={{ background: 'var(--warm-bg-alt)', border: '1px solid var(--warm-border)' }}
                >
                    <h2 className="mb-2 text-xl font-bold" style={{ color: 'var(--warm-charcoal)' }}>
                        Checking one invoice, or a supplier&apos;s whole file?
                    </h2>
                    <p className="mx-auto mb-6 max-w-lg" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        One invoice takes about a minute. If you are reviewing a batch of supplier
                        invoices before releasing payment or claiming credit, upload the lot at once.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link
                            href="/check?utm_source=verify-invoice"
                            className="inline-block rounded-lg px-6 py-3 font-semibold"
                            style={{ background: 'var(--warm-accent)', color: 'var(--warm-cream)' }}
                        >
                            Check one invoice
                        </Link>
                        <Link
                            href="/vendor-invoice-check"
                            className="inline-block rounded-lg px-6 py-3 font-semibold"
                            style={{ border: '1px solid var(--warm-border)', color: 'var(--warm-charcoal)' }}
                        >
                            Check a batch
                        </Link>
                    </div>
                </div>

                <p className="mt-10 text-xs" style={{ color: 'var(--warm-text-secondary)' }}>
                    General information about Indian GST, not tax advice. If you believe an invoice
                    has been deliberately fabricated, it can be reported to the GST authorities
                    through the grievance facility on{' '}
                    <a href="https://www.gst.gov.in/" rel="nofollow noopener" target="_blank" className="underline">
                        gst.gov.in
                    </a>
                    .
                </p>
            </div>
        </div>
    );
}
