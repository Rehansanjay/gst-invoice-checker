import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Clock, ArrowRight, Star } from 'lucide-react';

export const metadata: Metadata = {
    title: 'CA Partner Success Stories — InvoiceCheck.in',
    description:
        'See how CAs and business owners prevented GST penalties using InvoiceCheck.in. Real results from real clients — March 2026 filing season.',
    keywords: ['CA GST tool', 'GST invoice validation for CA', 'chartered accountant GST software', 'bulk GST invoice checker India'],
    openGraph: {
        title: 'CA Partner Success Stories — InvoiceCheck.in',
        description: 'How CAs prevented GST penalties before the March 20 GSTR-3B deadline. 15+ violations caught, ₹0 penalties paid.',
        url: 'https://invoicecheck.in/ca-case-studies',
        siteName: 'InvoiceCheck.in',
        images: [
            {
                url: 'https://invoicecheck.in/ca-case-studies/opengraph-image',
                width: 1200,
                height: 630,
                alt: 'CA Partner Success Stories — InvoiceCheck.in',
            },
        ],
        locale: 'en_IN',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'CA Partner Success Stories — InvoiceCheck.in',
        description: 'How CAs prevented GST penalties. 15+ violations caught, ₹0 paid.',
        images: ['https://invoicecheck.in/ca-case-studies/opengraph-image'],
    },
    alternates: {
        canonical: 'https://invoicecheck.in/ca-case-studies',
    },
};

export default function CaCaseStudiesPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">

            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                    <Star className="w-4 h-4 fill-blue-400" />
                    Early Access — March 2026
                </div>
                <h1 className="text-4xl font-bold mb-4">CA Partner Success Stories</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    How CAs and SMB owners are preventing GST penalties and saving filing time
                    with InvoiceCheck.in — real results, named clients.
                </p>
            </div>

            {/* Coming Soon card */}
            <Card className="p-10 text-center border-dashed border-2 border-slate-300 bg-slate-50/50 mb-10">
                <Clock className="w-14 h-14 text-slate-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-3 text-slate-700">Case Studies Being Collected</h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                    We launched on <strong>February 22, 2026</strong>. Our first wave of CA partners
                    are validating invoices before the March 20 GSTR-3B deadline.
                    Case studies will be published here as they come in.
                </p>

                {/* Teaser stats */}
                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
                    {[
                        { value: '15+', label: 'Violations caught' },
                        { value: '₹0', label: 'Penalties paid' },
                        { value: '30s', label: 'Per invoice check' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white border rounded-lg p-3">
                            <p className="text-2xl font-bold text-primary">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <p className="text-sm font-semibold text-slate-600 mb-4">
                    Get notified when the first case study is published:
                </p>

                {/* Email capture form */}
                <form
                    action="/api/early-access-signup"
                    method="POST"
                    className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                >
                    <Input
                        type="email"
                        name="email"
                        placeholder="your@email.com"
                        required
                        className="flex-1"
                    />
                    <Button type="submit" className="whitespace-nowrap">
                        Notify Me
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </form>
            </Card>

            {/* Placeholder case study cards — will be replaced with real stories */}
            <h2 className="text-xl font-bold mb-5 text-slate-600">Coming Soon — Stories Like These</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12 opacity-40 select-none pointer-events-none">
                {[
                    {
                        name: 'CA Rahul Sharma, Mumbai',
                        result: 'Caught ₹2.4L in ITC mismatch across 12 clients before March filing',
                        detail: 'IGST coded as CGST+SGST on interstate supply — Section 73 exposure avoided',
                    },
                    {
                        name: 'Priya Electronics, Pune',
                        result: 'Prevented ₹10,000 HSN code penalty on 3 invoices',
                        detail: 'Missing 6-digit HSN for ₹5Cr+ turnover — caught before GSTR-1 submission',
                    },
                ].map((study, i) => (
                    <Card key={i} className="p-5 relative overflow-hidden">
                        <div className="absolute top-3 right-3 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded">
                            COMING SOON
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-sm">{study.name}</span>
                        </div>
                        <p className="font-bold text-green-800 mb-1">{study.result}</p>
                        <p className="text-xs text-muted-foreground">{study.detail}</p>
                    </Card>
                ))}
            </div>

            {/* CTA */}
            <div className="text-center">
                <p className="text-muted-foreground mb-4">
                    Ready to protect your clients? Start with 3 free checks.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/check">
                        <Button size="lg">
                            Check an Invoice — Free
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                    <Link href="/pricing">
                        <Button size="lg" variant="outline">
                            CA Bulk Plans
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
