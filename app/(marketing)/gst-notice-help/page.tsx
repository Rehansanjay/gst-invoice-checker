import type { Metadata } from 'next';
import Link from 'next/link';
import { FileSearch, ClipboardList, PenLine, AlertTriangle } from 'lucide-react';
import { SITE_URL, OG_IMAGE } from '@/lib/site';
import { EARLY_ACCESS } from '@/lib/earlyAccess';
import EarlyAccessForm from '@/components/EarlyAccessForm';

/**
 * GST Notice Help — an early-access page, not a product.
 *
 * Tests whether a business holding a GST notice (ASMT-10, DRC-01A, a show
 * cause notice) will pay per notice for a plain explanation, the deadline,
 * a documents checklist and a draft reply for their CA to review. The page
 * says plainly that it is not built and that it is not legal advice.
 */

export const metadata: Metadata = {
    title: 'Got a GST Notice? Understand It and Prepare Your Reply',
    description:
        'ASMT-10, DRC-01A or a show cause notice explained in plain language: what it says, the deadline, the documents you need, and a draft reply for your CA. Early access.',
    alternates: { canonical: '/gst-notice-help' },
    openGraph: {
        type: 'website',
        title: 'Got a GST Notice? Know What It Means and What to Do',
        description:
            'A plain explanation of your GST notice, the reply deadline, a documents checklist and a draft reply for your CA.',
        url: `${SITE_URL}/gst-notice-help`,
        images: [OG_IMAGE],
    },
};

const STEPS = [
    {
        icon: FileSearch,
        title: 'Upload the notice',
        body: 'A PDF or a photo of the notice from the GST portal or the letter you received.',
    },
    {
        icon: ClipboardList,
        title: 'Know where you stand',
        body: 'What the notice says in plain language, which period and amount it is about, and the date your reply is due.',
    },
    {
        icon: PenLine,
        title: 'Start the reply',
        body: 'A checklist of the documents to gather and a draft reply, for your CA to review and file.',
    },
];

export default function GstNoticeHelpPage() {
    const config = EARLY_ACCESS.notice;
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
                        Got a GST notice? Know what it means and what to do next
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        A notice arrives in legal language with a deadline attached. Before you can reply, you need to
                        know what the department is questioning, how much is at stake, and what to send back.
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
                    <EarlyAccessForm product="notice" from="gst-notice-help" />
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
                        <p className="font-semibold mb-1" style={{ color: 'var(--warm-charcoal)' }}>Do not miss the deadline</p>
                        <p>
                            Every notice states the date by which you must reply. Missing it can lead to the demand being
                            confirmed without your side being heard. This service helps you prepare; it is not legal
                            advice, and your reply should be reviewed and filed by your CA or tax advocate.
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <p className="mb-3" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        Notice about invoice errors? Check the invoices themselves free today.
                    </p>
                    <Link
                        href="/check"
                        className="inline-block rounded-lg px-6 py-3 font-semibold"
                        style={{ border: '1px solid var(--warm-border)', color: 'var(--warm-charcoal)' }}
                    >
                        Check an invoice free
                    </Link>
                </div>
            </div>
        </div>
    );
}
