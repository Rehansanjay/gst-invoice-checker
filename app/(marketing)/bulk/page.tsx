import type { Metadata } from 'next';
import Link from 'next/link';
import BulkCheckClient from './BulkCheckClient';
import { SITE_URL, OG_IMAGE } from '@/lib/site';

export const metadata: Metadata = {
    title: 'Bulk GST Invoice Validation for CA Firms — Pre-Filing Check',
    description:
        'Upload a Tally, Zoho or Busy export and check 100 invoices at once. Find what GSTR-1 will reject before you file it. Free, worst-first.',
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
              This page served 234 words to a crawler — the upload widget and
              almost nothing else. Thin content is a real contributor to
              "Discovered — currently not indexed", which is where thirteen
              pages on this domain already sit, so what follows is not filler:
              it is the questions people actually arrive with about a batch
              upload, answered where they land rather than in a guide.
            */}
            <div className="container mx-auto px-4 pb-4">
                <div className="mx-auto max-w-3xl">
                    <h2 className="text-2xl font-bold mb-4 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                        What the batch check does
                    </h2>
                    <p className="mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        It reads a CSV of invoices and runs the same sixteen statutory checks over
                        every row that a single check runs over one — GSTIN structure and state code
                        for both parties, the tax head against place of supply, whether CGST and SGST
                        split evenly, HSN presence and length, the rate against the permitted slabs,
                        the tax recomputed line by line, line totals against the invoice total,
                        invoice number length and characters, date sanity, reverse charge
                        consistency, and rounding at both line and invoice level.
                    </p>
                    <p className="mb-6" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        Results come back worst first. The point of a batch is not to read every row
                        — it is to find the handful that will fail on upload, so you can fix those
                        and file. Every flag names the rule or section it comes from, so a
                        practitioner can check the reasoning rather than take it on trust.
                    </p>

                    <h2 className="text-2xl font-bold mb-4 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                        What file to give it
                    </h2>
                    <p className="mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        A CSV export from Tally, Zoho Books, Busy or the GSTR-1 offline tool works as
                        it comes. Column names do not have to match ours — common variations are
                        recognised, so <em>Invoice No</em>, <em>Invoice Number</em> and{' '}
                        <em>Inv No</em> all read the same. One row per line item; rows sharing an
                        invoice number are grouped back into one invoice before the checks run, which
                        is what lets invoice-level totals and rounding be checked at all.
                    </p>
                    <p className="mb-6" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        Up to 100 invoices per upload, and the file stays under 2MB. Nothing is
                        written to a database — a free batch is processed in memory and discarded.
                    </p>

                    <h2 className="text-2xl font-bold mb-4 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                        Why run it before filing rather than after
                    </h2>
                    <p className="mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        A GSTR-1 upload fails on the JSON as a whole. One malformed invoice number or
                        one tax head that contradicts the place of supply returns an error code
                        against that record, and the practical effect is a return you have to unpick
                        and resubmit under time pressure — usually on the 10th or 11th.
                    </p>
                    <p className="mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        The errors that cause it are mechanical and almost all of them are visible in
                        the data before submission. Catching them the week before costs a few minutes.
                        Catching them at the portal costs an evening, and sometimes a late fee under
                        Section 47 plus interest under Section 50 if the return slips past the due
                        date as a result.
                    </p>
                    <p className="mb-6" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        For a practice filing across many clients, the same argument applies with more
                        force: the mechanical layer is the one that scales badly and the one a person
                        should not be spending review time on.
                    </p>
                </div>
            </div>

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
