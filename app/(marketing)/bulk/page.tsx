import type { Metadata } from 'next';
import Link from 'next/link';
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

            {/*
              The natural next question after a batch comes back with flags on
              it: what does the portal actually say when this is rejected? The
              error-code pages answer that, and had exactly one inbound link
              before this — from the footer.
            */}
            <div className="container mx-auto px-4 pb-16">
                <div className="mx-auto max-w-3xl rounded-xl p-6" style={{ border: '1px solid var(--warm-border)' }}>
                    <h2 className="mb-2 text-lg font-bold" style={{ color: 'var(--warm-charcoal)' }}>
                        If the portal has already rejected a return
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        Every GSTR-1 upload error has a code, and the code says exactly which field
                        the portal objected to.{' '}
                        <Link href="/gst-error-codes" className="font-semibold underline underline-offset-2" style={{ color: 'var(--warm-accent)' }}>
                            Look up a GSTN error code
                        </Link>
                        {' '}— RET191113, RET191150, RET191205 and the rest, each with what actually
                        triggers it.
                    </p>
                </div>
            </div>
        </>
    );
}
