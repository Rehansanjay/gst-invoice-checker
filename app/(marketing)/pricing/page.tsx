import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, AlertTriangle, ShieldCheck, Zap, CreditCard, Star } from 'lucide-react';
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

            {/* Annual Plan + CA Bulk — full-width section */}
            <div className="max-w-7xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Annual Plan */}
                <Card className="p-8 border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50/40 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wide flex items-center gap-1.5">
                        <Star className="w-3 h-3 fill-white" /> Best for Full Year
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold text-indigo-900">Annual Plan</h3>
                    </div>

                    <div className="flex items-end gap-2 mb-1">
                        <span className="text-4xl font-black text-indigo-900">₹4,166</span>
                        <span className="text-muted-foreground text-sm mb-1.5">/month</span>
                    </div>
                    <p className="text-sm text-indigo-700 font-semibold mb-1">
                        Billed annually at <span className="line-through text-slate-400 font-normal">₹59,988</span>{' '}
                        <span className="text-green-700">₹49,999/yr — Save ₹9,989</span>
                    </p>
                    <p className="text-sm text-muted-foreground mb-5">
                        600 credits/year · Auto-refill monthly · Never expire
                    </p>

                    {/* EMI pill */}
                    <div className="flex items-center gap-2 bg-white border border-indigo-200 rounded-lg px-4 py-2.5 mb-6 w-fit">
                        <CreditCard className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-indigo-800">EMI available via Razorpay — No Cost EMI on select cards</span>
                    </div>

                    <Link href="/contact" className="mt-auto">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11">
                            Get Annual Plan — Contact Sales
                        </Button>
                    </Link>

                    <ul className="space-y-2 text-sm text-muted-foreground mt-5">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> 600 checks/year (50/mo)</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> Dashboard history + PDF exports</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> Priority email support</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> Razorpay No Cost EMI</li>
                    </ul>
                </Card>

                {/* CA Bulk Plan */}
                <Card className="p-8 border-2 border-slate-200 bg-slate-50/40 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 bg-slate-700 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wide">
                        CA / Firm
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">CA Bulk Plan</h3>
                    </div>

                    <div className="flex items-end gap-2 mb-1">
                        <span className="text-4xl font-black text-slate-900">₹4,999</span>
                        <span className="text-muted-foreground text-sm mb-1.5">/month</span>
                    </div>
                    <p className="text-sm text-green-700 font-semibold mb-1">100+ checks/month · ₹50/check</p>
                    <p className="text-sm text-muted-foreground mb-6">
                        Multi-client dashboard · Branded reports · Referral dashboard
                    </p>

                    <Link href="/contact" className="mt-auto">
                        <Button variant="outline" className="w-full border-slate-300 h-11 font-semibold">
                            Contact Us for CA Pricing
                        </Button>
                    </Link>

                    <ul className="space-y-2 text-sm text-muted-foreground mt-5">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Multi-GSTIN dashboard</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Referral partner tracking</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Bulk CSV upload (coming Week 3)</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Dedicated account manager</li>
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
