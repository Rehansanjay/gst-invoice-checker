import type { Metadata } from 'next';
import BulkCheckClient from './BulkCheckClient';
import { SITE_URL, OG_IMAGE } from '@/lib/site';

export const metadata: Metadata = {
    title: 'Bulk GST Invoice Validation for CA Firms — Pre-Filing Check',
    description:
        'Upload a Tally, Zoho, Busy or GSTR-1 export and validate up to 100 invoices at once. Find every invoice that will be rejected before you file GSTR-1, with a worst-first exception report.',
    alternates: { canonical: '/bulk' },
    openGraph: {
        type: 'website',
        title: 'Bulk GST Invoice Validation — Check a Batch Before You File',
        description:
            'Validate a whole batch of invoices before GSTR-1. Built for CA practices and high-volume sellers.',
        url: `${SITE_URL}/bulk`,
        images: [OG_IMAGE],
    },
};

export default function BulkPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'WebApplication',
                        name: 'Bulk GST Invoice Validation',
                        url: `${SITE_URL}/bulk`,
                        applicationCategory: 'BusinessApplication',
                        operatingSystem: 'Web',
                        description:
                            'Validate up to 100 GST invoices at once from a CSV export, and get a worst-first exception report before filing GSTR-1.',
                    }),
                }}
            />
            <BulkCheckClient />
        </>
    );
}
