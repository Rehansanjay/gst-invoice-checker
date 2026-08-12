import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * Serves /robots.txt. Previously this route did not exist and the path 404'd,
 * which meant the sitemap was never declared to crawlers.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                // Private / per-user surfaces — nothing here is useful in an index,
                // and report pages contain customer invoice data.
                disallow: [
                    '/api/',
                    '/dashboard',
                    '/dashboard/',
                    '/settings',
                    '/report/',
                    '/login',
                    '/signup',
                    '/auth/',
                ],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
