import type { Metadata } from 'next';
import Link from 'next/link';
import { GUIDES } from '@/lib/guides';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
    title: 'GST Invoice Guides for Indian Sellers | InvoiceCheck.in',
    description:
        'Practical guides on GST invoicing: place of supply and tax heads, marketplace invoice rejections, GSTR-1 late fees and compliance deadlines. Written for sellers and CA firms.',
    alternates: { canonical: '/guides' },
    openGraph: {
        type: 'website',
        title: 'GST Invoice Guides for Indian Sellers',
        description:
            'Practical guides on place of supply, marketplace invoice rejections and GSTR-1 late fees.',
        url: `${SITE_URL}/guides`,
    },
};

export default function GuidesPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'CollectionPage',
                        name: 'GST Invoice Guides',
                        url: `${SITE_URL}/guides`,
                        hasPart: GUIDES.map((g) => ({
                            '@type': 'Article',
                            headline: g.title,
                            url: `${SITE_URL}/guides/${g.slug}`,
                            datePublished: g.published,
                        })),
                    }),
                }}
            />

            <div className="max-w-3xl mx-auto">
                <h1
                    className="text-4xl font-bold mb-4 font-heading"
                    style={{ color: 'var(--warm-charcoal)' }}
                >
                    GST invoice guides
                </h1>
                <p className="text-lg mb-12" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    The rules behind the checks we run — written out properly, with worked examples,
                    so you can fix the cause rather than the symptom.
                </p>

                <div className="space-y-6">
                    {GUIDES.map((g) => (
                        <Link
                            key={g.slug}
                            href={`/guides/${g.slug}`}
                            className="block rounded-xl p-6 transition-shadow hover:shadow-lg"
                            style={{
                                background: 'var(--warm-cream)',
                                border: '1px solid var(--warm-border)',
                            }}
                        >
                            <h2
                                className="text-xl font-bold mb-2"
                                style={{ color: 'var(--warm-charcoal)' }}
                            >
                                {g.title}
                            </h2>
                            <p className="mb-3" style={{ color: 'var(--warm-charcoal-soft)' }}>
                                {g.excerpt}
                            </p>
                            <span className="text-sm" style={{ color: 'var(--warm-text-secondary)' }}>
                                {g.readingMinutes} min read
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
