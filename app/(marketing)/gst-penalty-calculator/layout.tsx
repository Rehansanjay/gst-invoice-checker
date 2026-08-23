import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'GST Penalty Calculator — Free Tool | InvoiceCheck.in',
    description:
        'What a late return costs in fee and interest. Covers Sections 47, 50, 73 and 122 — late filing, wrong tax head, missing HSN, ITC mismatch. Free.',
    keywords: [
        'GST penalty calculator',
        'GST late filing penalty India',
        'Section 50 interest calculator',
        'Section 73 penalty CGST',
        'IGST vs CGST penalty',
        'missing HSN code fine',
        'ITC mismatch penalty',
        'GST interest calculator 2024',
    ],
    openGraph: {
        title: 'GST Penalty Calculator — Free | InvoiceCheck.in',
        description:
            'Estimate GST penalty exposure in seconds. Section 47, 50, 73 & 122 of CGST Act 2017. Free — no signup.',
        url: 'https://invoicecheck.in/gst-penalty-calculator',
        siteName: 'InvoiceCheck.in',
        images: [
            {
                url: 'https://invoicecheck.in/gst-penalty-calculator/opengraph-image',
                width: 1200,
                height: 630,
                alt: 'GST Penalty Calculator — InvoiceCheck.in',
            },
        ],
        locale: 'en_IN',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'GST Penalty Calculator — Free | InvoiceCheck.in',
        description: 'Estimate GST penalty exposure instantly. Section 47, 50, 73 & 122.',
        images: ['https://invoicecheck.in/gst-penalty-calculator/opengraph-image'],
    },
    alternates: {
        canonical: 'https://invoicecheck.in/gst-penalty-calculator',
    },
};

export default function GstPenaltyCalculatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
