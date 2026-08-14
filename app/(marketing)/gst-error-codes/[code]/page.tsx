import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GST_ERROR_CODES, getErrorCode } from '@/lib/gstErrorCodes';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export function generateStaticParams() {
    return GST_ERROR_CODES.map((e) => ({ code: e.code.toLowerCase() }));
}

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { code } = await params;
    const entry = getErrorCode(code);
    if (!entry) return { title: 'GST error code not found | InvoiceCheck.in' };

    const title = `${entry.code} — ${entry.shortTitle} | GST Error Code Fix`;
    const description = `${entry.code}: "${entry.officialMessage}". What this GSTR-1 error means, why it happens and how to fix it before you re-upload.`;

    return {
        title,
        description,
        alternates: { canonical: `/gst-error-codes/${entry.code.toLowerCase()}` },
        openGraph: {
            type: 'article',
            title,
            description,
            url: `${SITE_URL}/gst-error-codes/${entry.code.toLowerCase()}`,
        },
    };
}

export default async function ErrorCodePage({ params }: Params) {
    const { code } = await params;
    const entry = getErrorCode(code);
    if (!entry) notFound();

    const url = `${SITE_URL}/gst-error-codes/${entry.code.toLowerCase()}`;

    return (
        <div className="container mx-auto px-4 py-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'TechArticle',
                        headline: `${entry.code} — ${entry.shortTitle}`,
                        description: entry.summary,
                        dateModified: entry.lastReviewed,
                        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
                        author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
                        publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
                    }),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: [
                            {
                                '@type': 'Question',
                                name: `What does GST error ${entry.code} mean?`,
                                acceptedAnswer: { '@type': 'Answer', text: entry.whatItMeans },
                            },
                            {
                                '@type': 'Question',
                                name: `How do I fix GST error ${entry.code}?`,
                                acceptedAnswer: { '@type': 'Answer', text: entry.howToFix.join(' ') },
                            },
                        ],
                    }),
                }}
            />

            <article className="max-w-3xl mx-auto">
                <nav className="mb-6 text-sm" style={{ color: 'var(--warm-text-secondary)' }}>
                    <Link href="/" className="hover:underline">Home</Link>
                    <span className="mx-2">/</span>
                    <Link href="/gst-error-codes" className="hover:underline">GST error codes</Link>
                </nav>

                <p className="mb-2 font-mono text-sm font-semibold" style={{ color: 'var(--warm-accent)' }}>
                    {entry.code}
                </p>
                <h1
                    className="mb-4 text-3xl font-bold leading-tight sm:text-4xl font-heading"
                    style={{ color: 'var(--warm-charcoal)' }}
                >
                    {entry.shortTitle}
                </h1>

                <div
                    className="mb-8 rounded-lg p-4"
                    style={{ background: 'var(--warm-bg-alt)', borderLeft: '3px solid var(--warm-accent)' }}
                >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--warm-text-secondary)' }}>
                        What the portal shows
                    </p>
                    <p className="font-mono text-sm" style={{ color: 'var(--warm-charcoal)' }}>
                        {entry.officialMessage}
                    </p>
                </div>

                <div className="space-y-5 text-base leading-relaxed" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    <p className="text-lg" style={{ color: 'var(--warm-charcoal)' }}>{entry.summary}</p>

                    <h2 className="pt-4 text-2xl font-bold font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                        What it means
                    </h2>
                    <p>{entry.whatItMeans}</p>

                    <h2 className="pt-4 text-2xl font-bold font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                        Common causes
                    </h2>
                    <ul className="list-disc space-y-2 pl-6">
                        {entry.commonCauses.map((c) => <li key={c}>{c}</li>)}
                    </ul>

                    <h2 className="pt-4 text-2xl font-bold font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                        How to fix it
                    </h2>
                    <ol className="list-decimal space-y-2 pl-6">
                        {entry.howToFix.map((s) => <li key={s}>{s}</li>)}
                    </ol>
                </div>

                {entry.preventable && (
                    <div
                        className="mt-10 rounded-xl p-6"
                        style={{ background: 'var(--warm-bg-alt)', border: '1px solid var(--warm-border)' }}
                    >
                        <h2 className="mb-2 text-lg font-bold" style={{ color: 'var(--warm-charcoal)' }}>
                            This one is catchable before you upload
                        </h2>
                        <p className="mb-5" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            {entry.code} is produced by something already present in your invoice data —
                            our <strong>{entry.caughtBy}</strong> flags it before the file reaches the
                            portal, so you fix it once instead of discovering it on upload day.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/bulk"
                                className="inline-block rounded-lg px-5 py-2.5 font-semibold"
                                style={{ background: 'var(--warm-accent)', color: 'var(--warm-cream)' }}
                            >
                                Check a whole batch
                            </Link>
                            <Link
                                href="/check"
                                className="inline-block rounded-lg px-5 py-2.5 font-semibold"
                                style={{ border: '1px solid var(--warm-border)', color: 'var(--warm-charcoal)' }}
                            >
                                Check one invoice
                            </Link>
                        </div>
                    </div>
                )}

                {entry.related.length > 0 && (
                    <div className="mt-10">
                        <h2 className="mb-3 text-lg font-bold" style={{ color: 'var(--warm-charcoal)' }}>
                            Related errors
                        </h2>
                        <ul className="space-y-2">
                            {entry.related.map((r) => {
                                const rel = getErrorCode(r);
                                if (!rel) return null;
                                return (
                                    <li key={r}>
                                        <Link
                                            href={`/gst-error-codes/${r.toLowerCase()}`}
                                            className="underline"
                                            style={{ color: 'var(--warm-accent)' }}
                                        >
                                            {rel.code} — {rel.shortTitle}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                <p className="mt-10 text-xs" style={{ color: 'var(--warm-text-secondary)' }}>
                    Reviewed {new Date(entry.lastReviewed).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                    })}. GSTN changes error wording and adds codes without notice, and this is general
                    information rather than tax advice — confirm the current position on{' '}
                    <a href="https://www.gst.gov.in/" rel="nofollow noopener" target="_blank" className="underline">
                        gst.gov.in
                    </a>{' '}
                    or with your CA.
                </p>
            </article>
        </div>
    );
}
