import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * login/signup are client components and cannot export metadata themselves, so
 * both were inheriting the homepage title verbatim. Set here instead. They are
 * disallowed in robots.txt, hence noindex rather than a marketing title.
 */
export const metadata: Metadata = {
    title: 'Sign in — InvoiceCheck.in',
    description: 'Access your InvoiceCheck.in dashboard and validation history.',
    robots: { index: false, follow: true },
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="border-b bg-white p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold tracking-tight">
                        InvoiceCheck.in
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                {children}
            </main>
        </div>
    );
}
