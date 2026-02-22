import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import PackagePurchaseButton from '@/components/PackagePurchaseButton';

export const metadata = {
    title: 'Pricing — GST Invoice Checker',
    description: 'Validate GST invoices from ₹99. One prevented penalty pays for your entire subscription.',
};

export default function PricingPage() {
    return (
        <div className="container mx-auto px-4 py-16">

            {/* Loss-aversion penalty banner */}
            <div className="max-w-4xl mx-auto mb-10 bg-amber-50 border border-amber-300 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-amber-900 text-base">One GST penalty = ₹10,000+</p>
                        <p className="text-amber-800 text-sm mt-0.5">A single wrong tax type, invalid HSN, or calculation error can trigger Section 73 penalties plus 18% interest. <span className="font-semibold">One prevented penalty pays for your entire subscription.</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-green-100 border border-green-300 rounded-lg px-4 py-2 whitespace-nowrap">
                    <ShieldCheck className="w-5 h-5 text-green-700" />
                    <span className="text-green-800 font-semibold text-sm">Protect your filing now</span>
                </div>
            </div>

            <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
                <p className="text-xl text-muted-foreground">
                    Pay-as-you-go or save big with bulk credits.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                    CA firm? Ask about our bulk plan — <span className="font-semibold text-primary">₹4,999/mo for 100+ checks</span> with multi-client dashboard.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">

                {/* Option 2: Starter Pack */}
                <Card className="p-6 border hover:border-primary/50 transition-colors flex flex-col">
                    <h3 className="text-lg font-bold mb-2">Starter Pack</h3>
                    <div className="text-3xl font-bold mb-1">
                        ₹399
                    </div>
                    <p className="text-sm text-green-600 font-semibold mb-4">
                        ₹40 / check (Save 60%)
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                        10 Credits. Good for small sellers.
                    </p>

                    <PackagePurchaseButton
                        packageType="pack_10"
                        price={399}
                        credits={10}
                        title="Starter Pack"
                        className="mb-6 border-input hover:bg-accent h-11"
                    />

                    <ul className="space-y-2 text-sm text-muted-foreground mt-auto">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Valid forever</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Dashboard Access</li>
                    </ul>
                </Card>

                {/* Option 3: Pro Pack */}
                <Card className="p-6 border-2 border-blue-200 bg-blue-50/20 flex flex-col relative">
                    <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase">
                        Best Value
                    </div>
                    <h3 className="text-lg font-bold mb-2">Growth Pack</h3>
                    <div className="text-3xl font-bold mb-1">
                        ₹1,499
                    </div>
                    <p className="text-sm text-green-600 font-semibold mb-4">
                        ₹30 / check (Save 70%)
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                        50 Credits. For growing businesses.
                    </p>

                    <PackagePurchaseButton
                        packageType="pack_50"
                        price={1499}
                        credits={50}
                        title="Growth Pack"
                        className="mb-6 h-11 bg-blue-600 hover:bg-blue-700 text-white"
                    />

                    <ul className="space-y-2 text-sm text-muted-foreground mt-auto">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Priority Support</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Export Reports</li>
                    </ul>
                </Card>

                {/* Option 4: Power Pack */}
                <Card className="p-6 border flex flex-col">
                    <h3 className="text-lg font-bold mb-2">Power Pack</h3>
                    <div className="text-3xl font-bold mb-1">
                        ₹2,499
                    </div>
                    <p className="text-sm text-green-600 font-semibold mb-4">
                        ₹25 / check (Save 75%)
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                        100 Credits. For high volume.
                    </p>

                    <PackagePurchaseButton
                        packageType="pack_100"
                        price={2499}
                        credits={100}
                        title="Power Pack"
                        className="mb-6 border-input hover:bg-accent h-11"
                    />

                    <ul className="space-y-2 text-sm text-muted-foreground mt-auto">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Dedicated Manager</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> API Access</li>
                    </ul>
                </Card>

            </div>

            <div className="mt-16 text-center bg-muted/30 p-8 rounded-lg max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold mb-4">Why credits?</h3>
                <p className="text-muted-foreground mb-6">
                    Credits give you the flexibility to check invoices whenever you need without a monthly expiry.
                    Unused credits roll over forever.
                </p>
                <Link href="/contact">
                    <Button variant="link" className="text-primary">Have questions? Contact Sales</Button>
                </Link>
            </div>

            {/* Penalty calculator CTA */}
            <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Not sure what a mistake costs you?{' '}
                    <Link href="/gst-penalty-calculator" className="text-primary underline font-medium hover:text-primary/80">
                        Use our free GST Penalty Calculator →
                    </Link>
                </p>
            </div>
        </div>
    );
}
