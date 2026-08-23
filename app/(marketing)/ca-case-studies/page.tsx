import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Clock, ArrowRight, Star } from 'lucide-react';

/**
 * Noindexed until there is a real case study on it.
 *
 * The page previously claimed "real results, named clients" and then said the
 * case studies were still being collected, beneath two invented practices. The
 * claim was untrue in the meta description, in the OG card and on the page
 * itself, which is the same problem as the fabricated aggregateRating removed
 * from the root layout earlier.
 *
 * Rather than delete the page, the claims are withdrawn and it is kept out of
 * the index: the illustrative examples are now labelled as hypothetical, and
 * `index: false` stops it competing for "CA GST tool" searches on the strength
 * of results that do not exist. `follow: true` so the links out still carry.
 *
 * Turn indexing back on the day one CA agrees to be named. Not before, and not
 * because the page looks empty.
 */
export const metadata: Metadata = {
    title: 'InvoiceCheck for CA Practices — What It Checks',
    description:
        'What a CA practice gets from InvoiceCheck: batch validation before GSTR-1, sixteen statutory checks per invoice, and every flag citing its section.',
    robots: { index: false, follow: true },
    keywords: ['CA GST tool', 'GST invoice validation for CA', 'chartered accountant GST software', 'bulk GST invoice checker India'],
    openGraph: {
        title: 'InvoiceCheck for CA Practices',
        description: 'Batch validation before GSTR-1, sixteen statutory checks per invoice, every flag citing its section.',
        url: 'https://invoicecheck.in/ca-case-studies',
        siteName: 'InvoiceCheck.in',
        images: [
            {
                url: 'https://invoicecheck.in/ca-case-studies/opengraph-image',
                width: 1200,
                height: 630,
                alt: 'InvoiceCheck for CA practices',
            },
        ],
        locale: 'en_IN',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'InvoiceCheck for CA Practices',
        description: 'Batch validation before GSTR-1, with every flag citing its section.',
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
                    For CA practices
                </div>
                <h1 className="text-4xl font-bold mb-4">InvoiceCheck for CA practices</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Batch validation before filing, sixteen statutory checks on every invoice,
                    and every flag citing the rule it comes from.
                </p>
            </div>

            {/*
              This card previously carried three statistics — "15+ violations
              caught", "₹0 penalties paid", "30s per invoice" — presented as
              results with nothing behind them, beside a launch date that is now
              six months stale. The counts are gone rather than restated with
              smaller numbers: a figure nobody measured is not improved by being
              modest.
            */}
            <Card className="p-10 text-center border-dashed border-2 border-slate-300 bg-slate-50/50 mb-10">
                <Clock className="w-14 h-14 text-slate-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-3 text-slate-700">No case studies yet</h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                    We would rather leave this empty than fill it in. When a practice using
                    InvoiceCheck is willing to be named and say what it found, their account goes
                    here — in their words, with their numbers.
                </p>

                <p className="text-sm font-semibold text-slate-600 mb-4">
                    Tell me when the first one is published:
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

            {/*
              These two carried invented practices — "CA Rahul Sharma, Mumbai"
              and "Priya Electronics, Pune" — with specific rupee figures, under
              a heading that read "Stories Like These". Greyed out and tagged
              COMING SOON, but a made-up firm with a made-up recovery is a
              fabricated testimonial however faintly it is drawn, and the page
              above it claimed named clients.

              Replaced with the defects themselves, which are real and need no
              customer to vouch for them: these are things the engine actually
              catches, described as errors rather than as somebody's win.
            */}
            <h2 className="text-xl font-bold mb-2 text-slate-700">What it tends to catch in a client batch</h2>
            <p className="text-sm text-muted-foreground mb-5">
                Not case studies. These are the defects the engine looks for, and the exposure each
                one carries under the Act.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
                {[
                    {
                        defect: 'IGST charged on an intrastate supply',
                        why: 'Or CGST and SGST on an interstate one. The department treats the correct head as underpaid, which is a short payment under Section 73 rather than a clerical slip — penalty of 10% of the tax or ₹10,000, whichever is higher, with interest from the original due date.',
                    },
                    {
                        defect: 'HSN missing, or too short for the turnover band',
                        why: 'Six digits are required above the threshold set by Notification 78/2020-CT. An incorrect invoice attracts penalty under Section 122, and the buyer may lose the credit on it.',
                    },
                    {
                        defect: 'Invoice number over sixteen characters',
                        why: 'Rule 46(b) caps it. The GSTR-1 upload rejects the record outright with RET191115, which means unpicking and resubmitting the return, usually against the clock.',
                    },
                    {
                        defect: 'Tax that does not reconcile to the taxable value',
                        why: 'Line by line, and again at invoice level after rounding. A slab that drifts by a few rupees across many lines is invisible on a printed invoice and not invisible to the portal.',
                    },
                ].map((item) => (
                    <Card key={item.defect} className="p-5">
                        <div className="flex items-start gap-2 mb-2">
                            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                            <span className="font-semibold text-sm">{item.defect}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.why}</p>
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
