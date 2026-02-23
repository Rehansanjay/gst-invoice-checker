import { MetadataRoute } from 'next';

const BASE_URL = 'https://invoicecheck.in';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        // Core
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/check`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/pricing`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },

        // SEO / Free tools (high-value pages for March GST deadline traffic)
        {
            url: `${BASE_URL}/gst-penalty-calculator`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/ca-case-studies`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },

        // Marketing
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },

        // Legal
        {
            url: `${BASE_URL}/privacy`,
            lastModified: new Date('2026-02-22'),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/terms`,
            lastModified: new Date('2026-02-22'),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/refund`,
            lastModified: new Date('2026-02-22'),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];
}
