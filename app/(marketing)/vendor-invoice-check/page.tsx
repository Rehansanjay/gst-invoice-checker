import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, FileSpreadsheet, ShieldCheck, Scale } from 'lucide-react';
import { SITE_URL, OG_IMAGE } from '@/lib/site';

/**
 * Landing page for the BUYER side of the transaction.
 *
 * Same engine, same /bulk upload, different anxiety. Where /bulk speaks to the
 * person issuing invoices ("this will be rejected when you file"), this speaks
 * to the person receiving them ("you will lose the input tax credit on this").
 * The buyer's exposure is larger and the budget sits with a finance team, so
 * this is a cheap test of a second segment — a page, not a product.
 */

export const metadata: Metadata = {
    title: 'Check Vendor Invoices Before You Claim ITC — InvoiceCheck.in',
    description:
        'Validate supplier invoices before claiming input tax credit. Catch invalid GSTINs, wrong tax heads, short HSN codes and tax that does not reconcile — the defects that cost you ITC under Section 16. Upload a batch free.',
    alternates: { canonical: '/vendor-invoice-check' },
    openGraph: {
        type: 'website',
        title: 'Check Vendor Invoices Before You Claim ITC',
        description:
            'A supplier’s mistake costs you the credit. Validate incoming invoices before they reach your books.',
        url: `${SITE_URL}/vendor-invoice-check`,
        images: [OG_IMAGE],
    },
};

const RISKS = [
    {
        icon: Scale,
        section: 'SECTION 16(2)',
        title: 'Credit denied on a defective invoice',
        body: 'Input tax credit requires a valid tax invoice. If the supplier\'s document carries an invalid GSTIN, the wrong tax head or tax that does not reconcile, the credit you claimed against it is exposed on scrutiny — and the mistake was never yours.',
    },
    {
        icon: AlertTriangle,
        section: 'GSTR-2B',
        title: 'Mismatches you find too late',
        body: 'A supplier who files the wrong tax head leaves your credit sitting under a head you cannot use. You discover it during reconciliation, weeks after you paid the invoice and long after you had any leverage.',
    },
    {
        icon: ShieldCheck,
        section: 'VENDOR ONBOARDING',
        title: 'A bad GSTIN on file, repeated monthly',
        body: 'A GSTIN captured wrongly at onboarding, or one that has since been cancelled, quietly breaks every invoice from that vendor until someone notices. Validating at the point of entry costs nothing and stops the repeat.',
    },
];

export default function VendorInvoiceCheckPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        name: 'Check Vendor Invoices Before You Claim ITC',
                        url: `${SITE_URL}/vendor-invoice-check`,
                        description:
                            'Validate supplier invoices before claiming input tax credit under Section 16 of the CGST Act.',
                    }),
                }}
            />

            <div className="mx-auto max-w-3xl">
                <div className="mb-12 text-center">
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: 'var(--warm-bg-alt)', color: 'var(--warm-charcoal-soft)' }}
                    >
                        <FileSpreadsheet className="h-3 w-3" />
                        For accounts payable &amp; finance teams
                    </span>
                    <h1
                        className="mt-4 text-4xl font-bold leading-tight font-heading sm:text-5xl"
                        style={{ color: 'var(--warm-charcoal)' }}
                    >
                        Your supplier&apos;s mistake costs you the credit
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        Input tax credit depends on the invoice your vendor issued being valid. Check
                        incoming invoices before they reach your books — not during reconciliation,
                        when the money has already gone out.
                    </p>
                </div>

                <div className="space-y-4">
                    {RISKS.map((r) => (
                        <div
                            key={r.title}
                            className="rounded-xl p-6"
                            style={{ background: 'var(--warm-cream)', border: '1px solid var(--warm-border)' }}
                        >
                            <div className="mb-2 flex items-center gap-2">
                                <r.icon className="h-4 w-4" style={{ color: 'var(--warm-accent)' }} />
                                <span
                                    className="text-xs font-bold uppercase tracking-wide"
                                    style={{ color: 'var(--warm-accent)' }}
                                >
                                    {r.section}
                                </span>
                            </div>
                            <h2 className="mb-2 text-lg font-bold" style={{ color: 'var(--warm-charcoal)' }}>
                                {r.title}
                            </h2>
                            <p style={{ color: 'var(--warm-charcoal-soft)' }}>{r.body}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-12">
                    <h2 className="mb-4 text-2xl font-bold font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                        What gets checked
                    </h2>
                    <p className="mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        The same 16 statutory checks we run on outgoing invoices, applied to the ones
                        you receive. Upload a CSV of vendor invoices — from your ERP, your purchase
                        register, or a GSTR-2B export — and get back a list of which ones are defective
                        and why.
                    </p>
                    <ul className="grid gap-2 sm:grid-cols-2" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        {[
                            'Supplier GSTIN format and state code',
                            'Tax head against place of supply',
                            'HSN present and correctly sized',
                            'Tax recomputed line by line',
                            'Invoice number within the 16-character limit',
                            'Invoice date and period sanity',
                            'Reverse charge flagged correctly',
                            'Totals reconciled against line items',
                        ].map((c) => (
                            <li key={c} className="flex items-start gap-2">
                                <span style={{ color: 'var(--warm-success)' }}>✓</span> {c}
                            </li>
                        ))}
                    </ul>
                </div>

                <div
                    className="mt-12 rounded-2xl p-8 text-center"
                    style={{ background: 'var(--warm-bg-alt)', border: '1px solid var(--warm-border)' }}
                >
                    <h2 className="mb-2 text-xl font-bold" style={{ color: 'var(--warm-charcoal)' }}>
                        Check a batch of vendor invoices
                    </h2>
                    <p className="mx-auto mb-6 max-w-lg" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        Up to 100 invoices per upload, free. You get a worst-first list of which
                        invoices are defective before you claim credit against them.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link
                            href="/bulk?utm_source=vendor-invoice-check"
                            className="inline-block rounded-lg px-6 py-3 font-semibold"
                            style={{ background: 'var(--warm-accent)', color: 'var(--warm-cream)' }}
                        >
                            Upload a batch — free
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-block rounded-lg px-6 py-3 font-semibold"
                            style={{ border: '1px solid var(--warm-border)', color: 'var(--warm-charcoal)' }}
                        >
                            Talk to us about volume
                        </Link>
                    </div>
                </div>

                <p className="mt-10 text-xs" style={{ color: 'var(--warm-text-secondary)' }}>
                    General information about Indian GST, not tax advice. Input tax credit conditions
                    are set out in Section 16 of the CGST Act and change by notification — confirm the
                    current position with your CA before relying on it.
                </p>
            </div>
        </div>
    );
}
