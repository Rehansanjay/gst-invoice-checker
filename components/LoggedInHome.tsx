'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, Plus, UploadCloud, Zap, FileJson, Calculator, Activity } from 'lucide-react';
import { useScrollReveal } from '@/lib/useScrollReveal';

export default function LoggedInHome() {
    const { user } = useAuth();
    const userName = user?.email?.split('@')[0] || 'User';
    const scrollRef = useScrollReveal();

    return (
        <div ref={scrollRef as any} className="min-h-screen flex flex-col" style={{ background: 'var(--warm-bg)' }}>
            {/* 1. Feature Hero Section */}
            <section className="relative py-24 md:py-32 flex-1 flex flex-col justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03]" style={{ background: 'radial-gradient(circle at 50% 50%, var(--warm-charcoal), transparent 70%)' }} />
                
                <div className="container mx-auto px-5 relative z-10 max-w-5xl text-center scroll-reveal">
                    <span className="pill-badge mb-6 hover-glow-border cursor-default inline-flex">
                        <Activity className="w-4 h-4 mr-1.5" style={{ color: 'var(--warm-success)' }} />
                        System Online
                    </span>
                    <h1 className="text-[3rem] md:text-[4rem] leading-[1.05] font-heading font-bold mb-6" style={{ color: 'var(--warm-charcoal)' }}>
                        Welcome back, <span style={{ color: 'var(--warm-accent)' }}>{userName}</span>
                    </h1>
                    <p className="text-[1.25rem] mb-12 max-w-2xl mx-auto" style={{ color: 'var(--warm-text-secondary)' }}>
                        Ready to check your invoices? Our validation engine is standing by to find errors for you.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/check" className="w-full sm:w-auto">
                            <button className="w-full btn-warm-primary magnetic-btn h-16 px-10 text-[18px] flex items-center justify-center gap-3">
                                <Plus className="w-6 h-6" /> Check Your Invoice
                            </button>
                        </Link>
                        <Link href="/dashboard" className="w-full sm:w-auto">
                            <button className="w-full btn-warm-secondary magnetic-btn h-16 px-8 text-[16px] flex items-center justify-center gap-3">
                                Go to Dashboard <ArrowRight className="w-5 h-5" />
                            </button>
                        </Link>
                    </div>
                    
                    <div className="mt-6">
                        <Link href="/gst-penalty-calculator" className="inline-flex items-center gap-2 text-[14px] font-bold hover:opacity-80 transition-opacity" style={{ color: 'var(--warm-accent)' }}>
                            <Calculator className="w-4 h-4" /> Use Penalty Calculator →
                        </Link>
                    </div>
                </div>
            </section>

            {/* 2. Simple Usage Guide */}
            <section className="py-24 relative" style={{ background: '#F8F6F4' }}>
                <div className="container mx-auto px-5 max-w-6xl scroll-reveal">
                    <div className="text-center mb-16">
                        <h2 className="text-[12px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--warm-text-secondary)' }}>How it Works</h2>
                        <p className="text-[2rem] font-bold font-heading" style={{ color: 'var(--warm-charcoal)' }}>Validating your invoice is simple</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting Lines for Desktop */}
                        <div className="hidden md:block absolute top-[40%] left-[20%] w-[25%] border-t-2 border-dashed -z-10" style={{ borderColor: 'var(--warm-border)' }}></div>
                        <div className="hidden md:block absolute top-[40%] right-[20%] w-[25%] border-t-2 border-dashed -z-10" style={{ borderColor: 'var(--warm-border)' }}></div>

                        {/* Step 1 */}
                        <div className="warm-card p-8 flex flex-col items-center text-center transition-all hover:-translate-y-2 hover:shadow-xl group">
                            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border transition-all" style={{ borderColor: 'var(--warm-border)' }}>
                                <UploadCloud className="w-10 h-10 transition-colors" style={{ color: 'var(--warm-accent)' }} />
                            </div>
                            <h3 className="font-bold font-heading text-xl mb-3" style={{ color: 'var(--warm-charcoal)' }}>1. Upload Invoice</h3>
                            <p className="text-[15px]" style={{ color: 'var(--warm-text-secondary)' }}>Upload any PDF or image invoice you want to check.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="warm-card p-8 flex flex-col items-center text-center transition-all hover:-translate-y-2 hover:shadow-xl group" style={{ borderColor: 'var(--warm-accent)' }}>
                            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm border transition-all" style={{ background: 'var(--warm-accent)', borderColor: 'var(--warm-accent)' }}>
                                <Zap className="w-10 h-10 text-white transition-colors" />
                            </div>
                            <h3 className="font-bold font-heading text-xl mb-3" style={{ color: 'var(--warm-charcoal)' }}>2. AI Validation</h3>
                            <p className="text-[15px]" style={{ color: 'var(--warm-text-secondary)' }}>We instantly scan for 11+ types of common GST errors.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="warm-card p-8 flex flex-col items-center text-center transition-all hover:-translate-y-2 hover:shadow-xl group">
                            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border transition-all" style={{ borderColor: 'var(--warm-border)' }}>
                                <FileJson className="w-10 h-10 transition-colors" style={{ color: 'var(--warm-success)' }} />
                            </div>
                            <h3 className="font-bold font-heading text-xl mb-3" style={{ color: 'var(--warm-charcoal)' }}>3. View Report</h3>
                            <p className="text-[15px]" style={{ color: 'var(--warm-text-secondary)' }}>See exactly what to fix to avoid payment rejections.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
