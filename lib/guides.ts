import { SITE_URL } from '@/lib/site';

export type Guide = {
    slug: string;
    title: string;
    /** <title> tag — keep unique and under ~60 visible chars before the brand. */
    metaTitle: string;
    description: string;
    /** Short teaser used on the /guides index. */
    excerpt: string;
    published: string;
    updated: string;
    readingMinutes: number;
};

/**
 * Registry for the /guides section. The sitemap and the index page both read
 * from here, so adding a guide only requires adding its entry plus the page.
 */
export const GUIDES: Guide[] = [
    {
        slug: 'gst-invoice-mandatory-fields',
        title: 'What a GST invoice must contain, under Rule 46',
        metaTitle: 'GST Invoice Mandatory Fields — Rule 46 Checklist',
        description:
            'Rule 46 of the CGST Rules sets out every particular a tax invoice must carry. Here is the full list in plain English, the four fields people actually leave off, and what happens to your buyer\'s input tax credit when one is missing.',
        excerpt:
            'The complete Rule 46 checklist — and the four particulars that get left off most often, each of which can cost your buyer their input tax credit.',
        published: '2026-08-18',
        updated: '2026-08-18',
        readingMinutes: 7,
    },
    {
        slug: 'igst-vs-cgst-sgst-place-of-supply',
        title: 'IGST vs CGST + SGST: how Place of Supply decides your tax type',
        metaTitle: 'IGST vs CGST/SGST — Place of Supply Rules Explained',
        description:
            'Charging IGST when you owed CGST+SGST is the single most common GST invoice error. Learn how Place of Supply decides the tax type, with worked examples for goods, services and e-commerce sellers.',
        excerpt:
            'The most common reason an invoice gets rejected. Work out whether a transaction is inter-state or intra-state, and which tax heads belong on the invoice.',
        published: '2026-08-13',
        updated: '2026-08-13',
        readingMinutes: 7,
    },
    {
        slug: 'amazon-flipkart-gst-invoice-rejection-reasons',
        title: 'Why Amazon and Flipkart rejected your GST invoice',
        metaTitle: 'Why Amazon & Flipkart Reject GST Invoices (9 Causes)',
        description:
            'Marketplace systems reject invoices automatically and rarely explain why. Here are the nine checks Amazon, Flipkart and Meesho run on seller invoices, and how to fix each one before your payment gets held.',
        excerpt:
            'Nine automated checks marketplaces run before releasing payment — and the exact fix for each rejection message.',
        published: '2026-08-13',
        updated: '2026-08-13',
        readingMinutes: 8,
    },
    {
        slug: 'gstr-1-late-fee-calculation',
        title: 'How GSTR-1 late fees are calculated',
        metaTitle: 'GSTR-1 Late Fee Calculation — Rates, Caps & Examples',
        description:
            'GSTR-1 filed late attracts a daily late fee under Section 47 of the CGST Act. Understand the per-day rates, the NIL-return rate, the turnover-based caps, and how the fee compounds across months.',
        excerpt:
            'The per-day rates, the NIL-return rate, and the turnover-based caps — with worked examples showing how a single late month compounds.',
        published: '2026-08-13',
        updated: '2026-08-13',
        readingMinutes: 6,
    },
];

export function getGuide(slug: string): Guide | undefined {
    return GUIDES.find((g) => g.slug === slug);
}

export function guideUrl(slug: string): string {
    return `${SITE_URL}/guides/${slug}`;
}
