import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { GUIDES } from '@/lib/guides';

/**
 * Dates are fixed constants rather than `new Date()`. Stamping every entry with
 * the build time tells crawlers the whole site changed on every deploy, which
 * makes lastmod worthless as a signal — bump these when the page actually changes.
 */
const CORE_UPDATED = new Date('2026-08-13');
const LEGAL_UPDATED = new Date('2026-02-22');

export default function sitemap(): MetadataRoute.Sitemap {
    const guidePages: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
        url: `${SITE_URL}/guides/${guide.slug}`,
        lastModified: new Date(guide.updated),
        changeFrequency: 'monthly',
        priority: 0.7,
    }));

    return [
        // Core
        {
            url: SITE_URL,
            lastModified: CORE_UPDATED,
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${SITE_URL}/check`,
            lastModified: CORE_UPDATED,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/pricing`,
            lastModified: CORE_UPDATED,
            changeFrequency: 'weekly',
            priority: 0.8,
        },

        // SEO / Free tools (high-value pages for March GST deadline traffic)
        {
            url: `${SITE_URL}/gst-penalty-calculator`,
            lastModified: CORE_UPDATED,
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/ca-case-studies`,
            lastModified: CORE_UPDATED,
            changeFrequency: 'weekly',
            priority: 0.7,
        },

        // Guides
        {
            url: `${SITE_URL}/guides`,
            lastModified: CORE_UPDATED,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        ...guidePages,

        // Marketing
        {
            url: `${SITE_URL}/about`,
            lastModified: CORE_UPDATED,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${SITE_URL}/faq`,
            lastModified: CORE_UPDATED,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${SITE_URL}/contact`,
            lastModified: CORE_UPDATED,
            changeFrequency: 'monthly',
            priority: 0.4,
        },

        // Legal
        {
            url: `${SITE_URL}/privacy`,
            lastModified: LEGAL_UPDATED,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/terms`,
            lastModified: LEGAL_UPDATED,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/refund`,
            lastModified: LEGAL_UPDATED,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];
}
