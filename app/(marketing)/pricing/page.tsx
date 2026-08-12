import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, AlertTriangle, ShieldCheck, Zap, CreditCard, Star } from 'lucide-react';
import PackagePurchaseButton from '@/components/PackagePurchaseButton';
import ScrollRevealWrapper from '@/components/ScrollRevealWrapper';

export const metadata = {
    title: 'GST Invoice Checker Pricing — ₹99 Per Check | InvoiceCheck.in',
    description: 'Affordable GST invoice validation. Single checks at ₹99 or bulk packs. 80% cheaper than hiring a CA.',
    alternates: { canonical: '/pricing' },
};

export default function PricingPage() {
    return (
        <ScrollRevealWrapper className="min-h-screen py-24 md:py-32" style={{ background: 'var(--warm-bg)' }}>
            <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                
                {/* Loss-aversion penalty banner */}
                <div className="max-w-4xl mx-auto mb-16 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 transition-transform hover:scale-[1.01]" style={{ background: 'rgba(212, 160, 23, 0.05)', border: '1px solid rgba(212, 160, 23, 0.2)' }}>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(212, 160, 23, 0.1)' }}>
                            <AlertTriangle className="w-5 h-5" style={{ color: '#D4A017' }} />
                        </div>
                        <div>
                            <p className="font-bold text-[15px]" style={{ color: 'var(--warm-charcoal)' }}>One GST penalty = ₹10,000+</p>
                            <p className="text-[14px] mt-1" style={{ color: 'var(--warm-text-secondary)' }}>
                                A single wrong tax type or calculation error triggers Section 73 penalties plus 18% interest. <span className="font-semibold" style={{ color: 'var(--warm-charcoal)' }}>One prevented penalty pays for your entire subscription.</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl px-5 py-3 whitespace-nowrap" style={{ background: 'var(--warm-accent)', color: 'white' }}>
                        <ShieldCheck className="w-5 h-5" />
                        <span className="font-semibold text-[14px]">Protect your filing</span>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-20 scroll-reveal">
                    <span className="pill-badge mb-5 text-[12px] hover-glow-border cursor-default" style={{ background: '#E8F5EE', borderColor: '#C8E6D4', color: 'var(--warm-success)' }}>
                        <Star className="w-3 h-3 fill-current" />
                        Transparent Pricing
                    </span>
                    <h1 className="text-[2.75rem] md:text-[3.5rem] leading-[1.05] mb-6 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                        Choose Your Plan
                    </h1>
                    <p className="text-[1.125rem] md:text-xl" style={{ color: 'var(--warm-text-secondary)' }}>
                        Pay-as-you-go or save big with bulk credits.
                    </p>
                    <p className="mt-3 text-[14px] font-medium" style={{ color: '#9E8A78' }}>
                        CA firm? Ask about our bulk plan — <span className="font-bold" style={{ color: 'var(--warm-accent)' }}>₹4,999/mo for 100+ checks</span> with multi-client dashboard.
                    </p>
                </div>

                {/* Main Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto scroll-reveal-stagger">

                    {/* Option 1: Starter Pack */}
                    <div className="warm-card hover-glow-border p-8 flex flex-col">
                        <h3 className="text-xl font-bold font-heading mb-2" style={{ color: 'var(--warm-charcoal)' }}>Starter Pack</h3>
                        <div className="text-[2.5rem] font-bold font-heading mb-1" style={{ color: 'var(--warm-charcoal)' }}>
                            ₹599
                        </div>
                        <p className="text-[14px] font-semibold mb-4" style={{ color: 'var(--warm-success)' }}>
                            ₹60 / check (Save 40%)
                        </p>
                        <p className="text-[14px] mb-8" style={{ color: 'var(--warm-text-secondary)' }}>
                            10 Credits. Good for small sellers.
                        </p>

                        <PackagePurchaseButton
                            packageType="pack_10"
                            price={599}
                            credits={10}
                            title="Starter Pack"
                            className="w-full btn-warm-secondary magnetic-btn mb-8 h-12"
                        />

                        <ul className="space-y-3 text-[14px] font-medium mt-auto" style={{ color: '#9E8A78' }}>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4" style={{ color: 'var(--warm-accent)' }} /> Valid forever</li>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4" style={{ color: 'var(--warm-accent)' }} /> Dashboard Access</li>
                        </ul>
                    </div>

                    {/* Option 2: Growth Pack */}
                    <div className="warm-card p-8 flex flex-col relative transform md:-translate-y-4 shadow-xl" style={{ border: '2px solid var(--warm-accent)' }}>
                        <div className="absolute top-0 right-0 text-[11px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider" style={{ background: 'var(--warm-accent)', color: 'white' }}>
                            Best Value
                        </div>
                        <h3 className="text-xl font-bold font-heading mb-2" style={{ color: 'var(--warm-charcoal)' }}>Growth Pack</h3>
                        <div className="text-[2.5rem] font-bold font-heading mb-1" style={{ color: 'var(--warm-charcoal)' }}>
                            ₹1,999
                        </div>
                        <p className="text-[14px] font-semibold mb-4" style={{ color: 'var(--warm-success)' }}>
                            ₹40 / check (Save 60%)
                        </p>
                        <p className="text-[14px] mb-8" style={{ color: 'var(--warm-text-secondary)' }}>
                            50 Credits. For growing businesses.
                        </p>

                        <PackagePurchaseButton
                            packageType="pack_50"
                            price={1999}
                            credits={50}
                            title="Growth Pack"
                            className="w-full btn-warm-primary magnetic-btn mb-8 h-12 text-[15px]"
                        />

                        <ul className="space-y-3 text-[14px] font-medium mt-auto" style={{ color: '#9E8A78' }}>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4" style={{ color: 'var(--warm-accent)' }} /> Priority Support</li>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4" style={{ color: 'var(--warm-accent)' }} /> Export Reports</li>
                        </ul>
                    </div>

                    {/* Option 3: Power Pack */}
                    <div className="warm-card hover-glow-border p-8 flex flex-col">
                        <h3 className="text-xl font-bold font-heading mb-2" style={{ color: 'var(--warm-charcoal)' }}>Power Pack</h3>
                        <div className="text-[2.5rem] font-bold font-heading mb-1" style={{ color: 'var(--warm-charcoal)' }}>
                            ₹2,999
                        </div>
                        <p className="text-[14px] font-semibold mb-4" style={{ color: 'var(--warm-success)' }}>
                            ₹30 / check (Save 70%)
                        </p>
                        <p className="text-[14px] mb-8" style={{ color: 'var(--warm-text-secondary)' }}>
                            100 Credits. For high volume.
                        </p>

                        <PackagePurchaseButton
                            packageType="pack_100"
                            price={2999}
                            credits={100}
                            title="Power Pack"
                            className="w-full btn-warm-secondary magnetic-btn mb-8 h-12"
                        />

                        <ul className="space-y-3 text-[14px] font-medium mt-auto" style={{ color: '#9E8A78' }}>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4" style={{ color: 'var(--warm-accent)' }} /> Dedicated Manager</li>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4" style={{ color: 'var(--warm-accent)' }} /> API Access</li>
                        </ul>
                    </div>

                </div>

                {/* Annual Plan + CA Bulk */}
                <div className="max-w-7xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 scroll-reveal">

                    {/* Annual Plan */}
                    <div className="warm-card p-10 relative overflow-hidden flex flex-col shadow-lg" style={{ background: 'var(--warm-charcoal)' }}>
                        <div className="absolute inset-0 opacity-[0.05]" style={{ background: 'radial-gradient(circle at top right, var(--warm-accent), transparent 70%)' }} />
                        <div className="absolute top-0 right-0 text-[11px] font-bold px-5 py-2 rounded-bl-2xl uppercase tracking-wider flex items-center gap-2 z-10" style={{ background: 'var(--warm-accent)', color: 'white' }}>
                            <Star className="w-3 h-3 fill-current" /> Best for Full Year
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(250, 248, 246, 0.1)' }}>
                                    <Zap className="w-5 h-5" style={{ color: 'var(--warm-cream)' }} />
                                </div>
                                <h3 className="text-2xl font-bold font-heading" style={{ color: 'white' }}>Annual Plan</h3>
                            </div>

                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-[2.75rem] font-black font-heading leading-none" style={{ color: 'var(--warm-cream)' }}>₹4,166</span>
                                <span className="text-[15px] font-medium mb-1" style={{ color: '#B8A895' }}>/month</span>
                            </div>
                            <p className="text-[14px] font-semibold mb-2" style={{ color: 'var(--warm-success)' }}>
                                Billed annually at <span className="line-through font-normal opacity-60">₹59,988</span>{' '}
                                ₹49,999/yr — Save ₹9,989
                            </p>
                            <p className="text-[14px] mb-8" style={{ color: '#B8A895' }}>
                                600 credits/year · Auto-refill monthly · Never expire
                            </p>

                            {/* EMI pill */}
                            <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-8 w-fit" style={{ background: 'rgba(250, 248, 246, 0.05)', border: '1px solid rgba(250, 248, 246, 0.1)' }}>
                                <CreditCard className="w-4 h-4" style={{ color: 'var(--warm-cream)' }} />
                                <span className="text-[13px] font-medium" style={{ color: 'var(--warm-cream)' }}>EMI available via Razorpay — No Cost EMI on select cards</span>
                            </div>

                            <Link href="/contact" className="block mt-auto mb-8">
                                <button className="w-full btn-warm-primary magnetic-btn h-12 text-[15px]">
                                    Get Annual Plan — Contact Sales
                                </button>
                            </Link>

                            <ul className="space-y-3 text-[14px] font-medium" style={{ color: '#9E8A78' }}>
                                <li className="flex items-center gap-3"><Check className="w-4 h-4" style={{ color: 'var(--warm-success)' }} /> <span style={{ color: 'var(--warm-cream)' }}>600 checks/year (50/mo)</span></li>
                                <li className="flex items-center gap-3"><Check className="w-4 h-4" style={{ color: 'var(--warm-success)' }} /> <span style={{ color: 'var(--warm-cream)' }}>Dashboard history + PDF exports</span></li>
                                <li className="flex items-center gap-3"><Check className="w-4 h-4" style={{ color: 'var(--warm-success)' }} /> <span style={{ color: 'var(--warm-cream)' }}>Priority email support</span></li>
                            </ul>
                        </div>
                    </div>

                    {/* CA Bulk Plan */}
                    <div className="warm-card p-10 relative overflow-hidden flex flex-col shadow-lg" style={{ background: '#F8F6F4' }}>
                        <div className="absolute top-0 right-0 text-[11px] font-bold px-5 py-2 rounded-bl-2xl uppercase tracking-wider" style={{ background: 'var(--warm-charcoal)', color: 'white' }}>
                            CA / Firm
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border" style={{ borderColor: 'var(--warm-border)' }}>
                                <ShieldCheck className="w-5 h-5" style={{ color: 'var(--warm-charcoal)' }} />
                            </div>
                            <h3 className="text-2xl font-bold font-heading" style={{ color: 'var(--warm-charcoal)' }}>CA Bulk Plan</h3>
                        </div>

                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-[2.75rem] font-black font-heading leading-none" style={{ color: 'var(--warm-charcoal)' }}>₹4,999</span>
                            <span className="text-[15px] font-medium mb-1" style={{ color: 'var(--warm-text-secondary)' }}>/month</span>
                        </div>
                        <p className="text-[14px] font-semibold mb-2" style={{ color: 'var(--warm-success)' }}>100+ checks/month · ₹50/check</p>
                        <p className="text-[14px] mb-8" style={{ color: 'var(--warm-text-secondary)' }}>
                            Multi-client dashboard · Branded reports · Referral dashboard
                        </p>

                        <Link href="/contact" className="block mt-auto mb-8">
                            <button className="w-full btn-warm-secondary magnetic-btn h-12 text-[15px]" style={{ background: 'white' }}>
                                Contact Us for CA Pricing
                            </button>
                        </Link>

                        <ul className="space-y-3 text-[14px] font-medium" style={{ color: '#9E8A78' }}>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4" style={{ color: 'var(--warm-accent)' }} /> <span style={{ color: 'var(--warm-charcoal)' }}>Multi-GSTIN dashboard</span></li>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4" style={{ color: 'var(--warm-accent)' }} /> <span style={{ color: 'var(--warm-charcoal)' }}>Referral partner tracking</span></li>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4" style={{ color: 'var(--warm-accent)' }} /> <span style={{ color: 'var(--warm-charcoal)' }}>Bulk CSV upload (coming Week 3)</span></li>
                        </ul>
                    </div>

                </div>

                <div className="section-divider" />

                {/* FAQ Style Credits Info */}
                <div className="text-center p-12 rounded-3xl max-w-4xl mx-auto scroll-reveal" style={{ background: 'white', border: '1px solid var(--warm-border)' }}>
                    <h3 className="text-[2rem] font-heading font-bold mb-4" style={{ color: 'var(--warm-charcoal)' }}>Why credits?</h3>
                    <p className="text-lg mb-8" style={{ color: 'var(--warm-text-secondary)' }}>
                        Credits give you the flexibility to check invoices whenever you need without a monthly expiry.
                        Unused credits roll over forever.
                    </p>
                    <Link href="/contact">
                        <span className="text-[15px] font-bold underline hover:no-underline" style={{ color: 'var(--warm-accent)' }}>Have questions? Contact Sales →</span>
                    </Link>
                </div>

                {/* Penalty calculator CTA */}
                <div className="mt-12 text-center scroll-reveal">
                    <p className="text-[15px] font-medium" style={{ color: '#9E8A78' }}>
                        Not sure what a mistake costs you?{' '}
                        <Link href="/gst-penalty-calculator" className="font-bold underline hover:no-underline" style={{ color: 'var(--warm-charcoal)' }}>
                            Use our free GST Penalty Calculator →
                        </Link>
                    </p>
                </div>
            </div>
        </ScrollRevealWrapper>
    );
}
