import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { type Guide, guideUrl } from '@/lib/guides';

/**
 * Shared shell for /guides articles: header, Article + Breadcrumb JSON-LD,
 * readable prose column and a closing CTA.
 *
 * Note: the project does not include @tailwindcss/typography, so prose styling
 * is applied explicitly here rather than via `prose` utility classes.
 */
export default function GuideArticle({
    guide,
    children,
}: {
    guide: Guide;
    children: React.ReactNode;
}) {
    const url = guideUrl(guide.slug);

    return (
        <div className="container mx-auto px-4 py-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Article',
                        headline: guide.title,
                        description: guide.description,
                        datePublished: guide.published,
                        dateModified: guide.updated,
                        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
                        author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
                        publisher: {
                            '@type': 'Organization',
                            name: SITE_NAME,
                            url: SITE_URL,
                            logo: {
                                '@type': 'ImageObject',
                                url: `${SITE_URL}/invoicecheck-logo.svg`,
                            },
                        },
                    }),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                            { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
                            { '@type': 'ListItem', position: 3, name: guide.title, item: url },
                        ],
                    }),
                }}
            />

            <article className="max-w-3xl mx-auto">
                <nav className="mb-6 text-sm" style={{ color: 'var(--warm-text-secondary)' }}>
                    <Link href="/" className="hover:underline">Home</Link>
                    <span className="mx-2">/</span>
                    <Link href="/guides" className="hover:underline">Guides</Link>
                </nav>

                <h1
                    className="text-3xl sm:text-4xl font-bold leading-tight mb-4 font-heading"
                    style={{ color: 'var(--warm-charcoal)' }}
                >
                    {guide.title}
                </h1>

                <p className="text-lg mb-2" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    {guide.description}
                </p>

                <p className="text-sm mb-10" style={{ color: 'var(--warm-text-secondary)' }}>
                    Updated{' '}
                    {new Date(guide.updated).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}{' '}
                    · {guide.readingMinutes} min read
                </p>

                <div className="guide-body space-y-5 text-base leading-relaxed" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    {children}
                </div>

                <div
                    className="mt-14 rounded-xl p-8 text-center"
                    style={{ background: 'var(--warm-bg-alt)', border: '1px solid var(--warm-border)' }}
                >
                    <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--warm-charcoal)' }}>
                        Not sure your invoice passes?
                    </h2>
                    <p className="mb-6" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        Run it through 15 compliance checks and get a line-by-line report in 15 seconds.
                    </p>
                    <Link
                        href="/check"
                        className="inline-block rounded-lg px-6 py-3 font-semibold"
                        style={{ background: 'var(--warm-accent)', color: 'var(--warm-cream)' }}
                    >
                        Check an invoice
                    </Link>
                </div>

                <p className="mt-10 text-xs" style={{ color: 'var(--warm-text-secondary)' }}>
                    This guide is general information about Indian GST law, not tax advice. Rates,
                    caps and due dates change by CBIC notification — confirm the current position on{' '}
                    <a
                        href="https://www.cbic.gov.in/"
                        rel="nofollow noopener"
                        target="_blank"
                        className="underline"
                    >
                        cbic.gov.in
                    </a>{' '}
                    or with your CA before you file.
                </p>
            </article>
        </div>
    );
}

/** Section heading inside a guide body. */
export function GuideH2({ children, id }: { children: React.ReactNode; id?: string }) {
    return (
        <h2
            id={id}
            className="text-2xl font-bold pt-6 font-heading"
            style={{ color: 'var(--warm-charcoal)' }}
        >
            {children}
        </h2>
    );
}

/** Callout for the "this is the bit that gets people rejected" points. */
export function GuideNote({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="rounded-lg p-5 my-2"
            style={{ background: 'var(--warm-cream-dark)', borderLeft: '3px solid var(--warm-accent)' }}
        >
            {children}
        </div>
    );
}
