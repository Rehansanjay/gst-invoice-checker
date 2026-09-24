import type { Metadata } from 'next';
import Link from 'next/link';
import { BellRing, ListChecks, CalendarCheck, AlertTriangle } from 'lucide-react';
import { SITE_URL, OG_IMAGE } from '@/lib/site';
import { WATCH_PRICE_RUPEES } from '@/lib/watch';
import WatchEarlyAccess from '@/components/WatchEarlyAccess';

/**
 * Vendor GST Watch — an early-access page, not a product.
 *
 * The CA and law-firm channels both said no (Sep 2026), so before building
 * anything new this page tests one question with real visitors: will a
 * business pay monthly to be told when a supplier's GSTIN is cancelled or it
 * stops filing? The page says plainly that it is not built. The sign-up asks
 * the price question, which is the signal that decides whether to build it.
 */

export const metadata: Metadata = {
    title: 'Vendor GST Watch — Alerts When a Supplier Stops Filing GST',
    description:
        'Get told when a supplier’s GSTIN is cancelled or it stops filing GSTR-1, before it costs you input tax credit. Early access.',
    alternates: { canonical: '/vendor-gst-watch' },
    openGraph: {
        type: 'website',
        title: 'Vendor GST Watch — Know When a Supplier Stops Filing',
        description:
            'A monthly check of every supplier’s GSTIN and return filing, with an alert before it costs you ITC.',
        url: `${SITE_URL}/vendor-gst-watch`,
        images: [OG_IMAGE],
    },
};

const STEPS = [
    {
        icon: ListChecks,
        title: 'Add your suppliers once',
        body: 'Paste or upload the GSTINs of the suppliers you buy from. Each one is checked for a valid format as you add it.',
    },
    {
        icon: CalendarCheck,
        title: 'Every month, each one is checked',
        body: 'Is the GSTIN still active? Did the supplier file GSTR-1 and GSTR-3B for the period? The status comes from the GST system, not from the invoice.',
    },
    {
        icon: BellRing,
        title: 'You hear about problems first',
        body: 'When a supplier is cancelled or misses a filing, you get an alert naming them, while there is still time to chase them or hold the payment.',
    },
];

export default function VendorGstWatchPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-3xl">
                <div className="mb-10 text-center">
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: 'var(--warm-bg-alt)', color: 'var(--warm-charcoal-soft)' }}
                    >
                        Early access · not built yet
                    </span>
                    <h1
                        className="mt-4 text-4xl font-bold leading-tight font-heading sm:text-5xl"
                        style={{ color: 'var(--warm-charcoal)' }}
                    >
                        Know when a supplier stops filing, before it costs you ITC
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        You can only claim input tax credit on an invoice your supplier has reported. If their GSTIN is
                        cancelled, or they skip a return, the credit you were counting on disappears, and you usually
                        find out weeks later.
                    </p>
                </div>

                <div
                    className="mb-12 rounded-2xl p-6 sm:p-8"
                    style={{ background: '#fff', border: '1px solid var(--warm-border)', boxShadow: 'var(--warm-card-shadow)' }}
                >
                    <div className="flex items-baseline justify-between flex-wrap gap-2 mb-5">
                        <h2 className="text-2xl font-bold font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                            Vendor GST Watch
                        </h2>
                        <p className="text-[15px]" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            <strong style={{ color: 'var(--warm-charcoal)' }}>₹{WATCH_PRICE_RUPEES}/month</strong> early-access price
                        </p>
                    </div>
                    <WatchEarlyAccess from="vendor-gst-watch" />
                </div>

                <h2 className="mb-6 text-2xl font-bold font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                    How it would work
                </h2>
                <div className="mb-12 grid gap-4 sm:grid-cols-3">
                    {STEPS.map((s) => (
                        <div key={s.title} className="rounded-xl p-5" style={{ background: 'var(--warm-cream-dark)' }}>
                            <s.icon className="mb-3 h-5 w-5" style={{ color: 'var(--warm-accent)' }} />
                            <h3 className="mb-1.5 font-semibold" style={{ color: 'var(--warm-charcoal)' }}>{s.title}</h3>
                            <p className="text-[14px] leading-relaxed" style={{ color: 'var(--warm-charcoal-soft)' }}>{s.body}</p>
                        </div>
                    ))}
                </div>

                <div className="mb-12 flex gap-3 rounded-xl p-5" style={{ background: 'var(--warm-bg-alt)' }}>
                    <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: '#B7791F' }} />
                    <div className="text-[14.5px] leading-relaxed" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        <p className="font-semibold mb-1" style={{ color: 'var(--warm-charcoal)' }}>Why this matters now</p>
                        <p>
                            Under Section 16(2)(aa) of the CGST Act, credit is available only for invoices that appear
                            in your GSTR-2B, which fills from what your supplier reports. A supplier who files late or
                            not at all blocks your credit, even when you paid them in full.
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <p className="mb-3" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        Checking a single supplier? That part is free today.
                    </p>
                    <Link
                        href="/#verify"
                        className="inline-block rounded-lg px-6 py-3 font-semibold"
                        style={{ border: '1px solid var(--warm-border)', color: 'var(--warm-charcoal)' }}
                    >
                        Check a supplier&apos;s GSTIN free
                    </Link>
                </div>
            </div>
        </div>
    );
}
