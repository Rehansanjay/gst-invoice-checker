'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, Plus, UploadCloud, Zap, FileJson, Calculator } from 'lucide-react';

export default function LoggedInHome() {
    const { user } = useAuth();
    const userName = user?.email?.split('@')[0] || 'User';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* 1. Feature Hero Section */}
            <section className="bg-white border-b py-20 flex-1 flex flex-col justify-center">
                <div className="container mx-auto px-4 text-center max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                        Welcome back, <span className="text-purple-600">{userName}</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                        Ready to check your invoices? Our AI is standing by to find errors for you.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/check">
                            <Button size="lg" className="h-16 px-8 text-lg gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all bg-gradient-to-r from-purple-600 to-indigo-600 border-0">
                                <Plus className="w-6 h-6" /> Check Your Invoice
                            </Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button size="lg" variant="outline" className="h-16 px-8 text-lg gap-3 border-2 hover:bg-slate-50">
                                Go to Dashboard <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                        <Link href="/gst-penalty-calculator">
                            <Button size="lg" variant="ghost" className="h-16 px-6 text-base gap-2 border border-amber-300 text-amber-700 hover:bg-amber-50">
                                <Calculator className="w-5 h-5" /> Penalty Calculator
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* 2. Simple Usage Guide */}
            <section className="py-16 bg-slate-50">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="text-center mb-12">
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">How it Works</h2>
                        <p className="text-2xl font-semibold text-slate-900">Validating your invoice is simple</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting Lines for Desktop */}
                        <div className="hidden md:block absolute top-[40%] left-[20%] w-[25%] border-t-2 border-slate-200 border-dashed -z-10"></div>
                        <div className="hidden md:block absolute top-[40%] right-[20%] w-[25%] border-t-2 border-slate-200 border-dashed -z-10"></div>

                        {/* Step 1 */}
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border group-hover:border-purple-200 group-hover:shadow-md transition-all">
                                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-purple-600 transition-colors" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2 text-slate-900">1. Upload Invoice</h3>
                            <p className="text-sm text-muted-foreground max-w-[200px]">Upload any PDF or image invoice you want to check.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border group-hover:border-blue-200 group-hover:shadow-md transition-all">
                                <Zap className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2 text-slate-900">2. AI Validation</h3>
                            <p className="text-sm text-muted-foreground max-w-[200px]">We instantly scan for 11+ types of common GST errors.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border group-hover:border-green-200 group-hover:shadow-md transition-all">
                                <FileJson className="w-8 h-8 text-slate-400 group-hover:text-green-600 transition-colors" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2 text-slate-900">3. View Report</h3>
                            <p className="text-sm text-muted-foreground max-w-[200px]">See exactly what to fix to avoid payment rejections.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
