import type { Metadata } from 'next';
import Link from 'next/link';
import { GST_ERROR_CODES, PREVENTABLE_COUNT } from '@/lib/gstErrorCodes';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
    title: 'GST Error Codes Explained — GSTR-1 Upload Errors & Fixes',
    description:
        `Every common GSTR-1 JSON upload error code explained in plain English, with causes and step-by-step fixes. RET191113, RET191150, RET191175, RET191205 and more — ${GST_ERROR_CODES.length} codes covered.`,
    alternates: { canonical: '/gst-error-codes' },
    openGraph: {
        type: 'website',
        title: 'GST Error Codes Explained — GSTR-1 Upload Errors & Fixes',
        description:
            'What each GSTR-1 upload error code means, why it happens and how to fix it before you re-upload.',
        url: `${SITE_URL}/gst-error-codes`,
    },
};

export default function ErrorCodesIndex() {
    return (
        <div className="container mx-auto px-4 py-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'CollectionPage',
                        name: 'GST Error Codes',
                        url: `${SITE_URL}/gst-error-codes`,
                        hasPart: GST_ERROR_CODES.map((e) => ({
                            '@type': 'TechArticle',
                            headline: `${e.code} — ${e.shortTitle}`,
                            url: `${SITE_URL}/gst-error-codes/${e.code.toLowerCase()}`,
                        })),
                    }),
                }}
            />

            <div className="mx-auto max-w-3xl">
                <h1
                    className="mb-4 text-4xl font-bold font-heading"
                    style={{ color: 'var(--warm-charcoal)' }}
                >
                    GST error codes, explained
                </h1>
                <p className="mb-4 text-lg" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    Your GSTR-1 upload failed and the portal gave you a code and one terse line.
                    Here is what each one actually means, why it happened, and how to fix it —
                    written for people who file, not for search engines.
                </p>
                <p className="mb-12 text-sm" style={{ color: 'var(--warm-text-secondary)' }}>
                    {GST_ERROR_CODES.length} codes covered · {PREVENTABLE_COUNT} of them are
                    catchable before you upload
                </p>

                <div className="space-y-3">
                    {GST_ERROR_CODES.map((e) => (
                        <Link
                            key={e.code}
                            href={`/gst-error-codes/${e.code.toLowerCase()}`}
                            className="block rounded-xl p-5 transition-shadow hover:shadow-md"
                            style={{ background: 'var(--warm-cream)', border: '1px solid var(--warm-border)' }}
                        >
                            <div className="flex flex-wrap items-center gap-3">
                                <span
                                    className="font-mono text-sm font-semibold"
                                    style={{ color: 'var(--warm-accent)' }}
                                >
                                    {e.code}
                                </span>
                                <span className="font-semibold" style={{ color: 'var(--warm-charcoal)' }}>
                                    {e.shortTitle}
                                </span>
                                {e.preventable && (
                                    <span
                                        className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium"
                                        style={{ background: 'var(--warm-bg-alt)', color: 'var(--warm-charcoal-soft)' }}
                                    >
                                        Preventable
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-sm" style={{ color: 'var(--warm-charcoal-soft)' }}>
                                {e.summary}
                            </p>
                        </Link>
                    ))}
                </div>

                <div
                    className="mt-12 rounded-xl p-8 text-center"
                    style={{ background: 'var(--warm-bg-alt)', border: '1px solid var(--warm-border)' }}
                >
                    <h2 className="mb-2 text-xl font-bold" style={{ color: 'var(--warm-charcoal)' }}>
                        Most of these are avoidable
                    </h2>
                    <p className="mb-6" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        {PREVENTABLE_COUNT} of the {GST_ERROR_CODES.length} codes above come from
                        something already sitting in your invoice data. Check the batch before you
                        generate the JSON and you never see them.
                    </p>
                    <Link
                        href="/bulk"
                        className="inline-block rounded-lg px-6 py-3 font-semibold"
                        style={{ background: 'var(--warm-accent)', color: 'var(--warm-cream)' }}
                    >
                        Check a batch before filing
                    </Link>
                </div>
            </div>
        </div>
    );
}
