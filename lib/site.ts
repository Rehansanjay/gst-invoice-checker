/**
 * Canonical site origin — single source of truth for every absolute URL we emit
 * (metadata, canonicals, sitemap, robots, JSON-LD).
 *
 * IMPORTANT: this must match the primary domain configured in Vercel. The bare
 * domain is canonical; www.invoicecheck.in must 308-redirect here. If these ever
 * disagree, Google sees canonicals pointing at a redirecting host and the
 * sitemap lists URLs that all redirect — which is what happened before.
 */
export const SITE_URL = 'https://invoicecheck.in';

export const SITE_NAME = 'InvoiceCheck.in';

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = '/'): string {
    return new URL(path, SITE_URL).toString().replace(/\/$/, '') || SITE_URL;
}
