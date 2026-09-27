import type { Metadata } from 'next';
import Link from 'next/link';
import { Upload, ListChecks, Send, AlertTriangle } from 'lucide-react';
import { SITE_URL, OG_IMAGE } from '@/lib/site';
import { EARLY_ACCESS } from '@/lib/earlyAccess';
import EarlyAccessForm from '@/components/EarlyAccessForm';

/**
 * GSTR-2B Reconciliation — an early-access page, not a product.
 *
 * Tests whether businesses and CAs will pay monthly to have the purchase
 * register matched against GSTR-2B before GSTR-3B is filed. Most do it by
 * hand in Excel every month. The page says plainly that it is not built;
 * the sign-up's price answer decides whether to build it.
 */

export const metadata: Metadata = {
    title: 'GSTR-2B Reconciliation — Find Missing ITC Before You File GSTR-3B',
    description:
        'Match your purchase register against GSTR-2B in minutes. See which supplier invoices are missing, how much ITC is at risk, and who to chase. Early access.',
    alternates: { canonical: '/gstr-2b-reconciliation' },
    openGraph: {
        type: 'website',
        title: 'GSTR-2B Reconciliation — Find Missing ITC in Minutes',
        description:
            'Upload GSTR-2B and your purchase register. Get the missing invoices, the ITC at risk and a message for each supplier.',
        url: `${SITE_URL}/gstr-2b-reconciliation`,
        images: [OG_IMAGE],
    },
};

const STEPS = [
    {
        icon: Upload,
        title: 'Upload two files',
        body: 'The GSTR-2B you download from the GST portal, and your purchase register exported from Tally, Zoho or Busy.',
    },
    {
        icon: ListChecks,
        title: 'Every invoice is matched',
        body: 'Matched, missing from 2B, missing from your books, or different amounts. Each mismatch shows the ITC it puts at risk.',
    },
    {
        icon: Send,
        title: 'Chase the right suppliers',
        body: 'A list of suppliers who have not reported your invoices, with a ready-to-send message for each one, before you file GSTR-3B.',
    },
];

export default function Gstr2bReconciliationPage() {
    const config = EARLY_ACCESS.recon;
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
                        Find missing ITC in minutes, not a day of Excel
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        Every month, before GSTR-3B, someone matches the purchase register against GSTR-2B line by line.
                        Any invoice your supplier did not report is credit you cannot claim, and finding them by hand
                        takes hours for every GSTIN.
                    </p>
                </div>

                <div
                    className="mb-12 rounded-2xl p-6 sm:p-8"
                    style={{ background: '#fff', border: '1px solid var(--warm-border)', boxShadow: 'var(--warm-card-shadow)' }}
                >
                    <div className="flex items-baseline justify-between flex-wrap gap-2 mb-5">
                        <h2 className="text-2xl font-bold font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                            {config.name}
                        </h2>
                        <p className="text-[15px]" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            <strong style={{ color: 'var(--warm-charcoal)' }}>{config.priceLabel}</strong> early-access price
                        </p>
                    </div>
                    <EarlyAccessForm product="recon" from="gstr-2b-reconciliation" />
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
                        <p className="font-semibold mb-1" style={{ color: 'var(--warm-charcoal)' }}>Why this matters every month</p>
                        <p>
                            Under Section 16(2)(aa) of the CGST Act, credit is available only for invoices that appear
                            in your GSTR-2B. Claim more than 2B shows and you risk a notice; claim less and you lose
                            credit you paid for. Reconciling first is the only way to know which.
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <p className="mb-3" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        Already have a batch of invoices to check? That part is free today.
                    </p>
                    <Link
                        href="/bulk"
                        className="inline-block rounded-lg px-6 py-3 font-semibold"
                        style={{ border: '1px solid var(--warm-border)', color: 'var(--warm-charcoal)' }}
                    >
                        Check a batch of invoices free
                    </Link>
                </div>
            </div>
        </div>
    );
}
