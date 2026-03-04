import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Validate GST Invoice Online — Free Check | InvoiceCheck.in',
    description: 'Enter your invoice details and get instant GST compliance validation in 15 seconds.',
};

export default function CheckLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
