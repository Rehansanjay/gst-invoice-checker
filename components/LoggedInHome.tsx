'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, Plus, History, CreditCard, UploadCloud, Zap, FileJson } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoggedInHome() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        credits: 0,
        checks: 0,
        lastCheckDate: null as string | null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            try {
                // Fetch user credits
                const { data: userData } = await supabase
                    .from('users')
                    .select('credits_remaining')
                    .eq('id', user.id)
                    .single();

                // Fetch check count
                const { count, data } = await supabase
                    .from('checks')
                    .select('created_at', { count: 'exact' })
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                setStats({
                    credits: userData?.credits_remaining || 0,
                    checks: count || 0,
                    lastCheckDate: data?.[0]?.created_at || null
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    const userName = user?.email?.split('@')[0] || 'User';

    return (
        <div className="min-h-screen bg-slate-50">
            {/* 1. Header Hero Section */}
            <section className="bg-white border-b py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                Welcome back, {userName} 👋
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Ready to validate your next invoice?
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Link href="/check">
                                <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                                    <Plus className="w-5 h-5" /> New Check
                                </Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button size="lg" variant="outline" className="gap-2">
                                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-8 space-y-12">

                {/* 2. Quick Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Credits Available</p>
                                <h3 className="text-3xl font-bold mt-1 text-slate-900">
                                    {loading ? '-' : stats.credits}
                                </h3>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <CreditCard className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <Link href="/pricing" className="text-sm text-purple-600 font-medium hover:underline flex items-center gap-1">
                            Buy more credits <ArrowRight className="w-3 h-3" />
                        </Link>
                    </Card>

                    <Card className="p-6 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Checks</p>
                                <h3 className="text-3xl font-bold mt-1 text-slate-900">
                                    {loading ? '-' : stats.checks}
                                </h3>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <History className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <Link href="/dashboard/history" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                            View full history <ArrowRight className="w-3 h-3" />
                        </Link>
                    </Card>

                    <Card className="p-6 border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Last Activity</p>
                                <h3 className="text-lg font-semibold mt-2 text-slate-900">
                                    {loading ? 'Loading...' : stats.lastCheckDate
                                        ? new Date(stats.lastCheckDate).toLocaleDateString()
                                        : 'No checks yet'}
                                </h3>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Zap className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        {stats.lastCheckDate && (
                            <p className="text-sm text-muted-foreground">Processed successfully</p>
                        )}
                    </Card>
                </div>

                {/* 3. Steps Indicator (Usage Guide) */}
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        How to Check an Invoice
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting Lines for Desktop */}
                        <div className="hidden md:block absolute top-[50%] left-[20%] w-[25%] border-t-2 border-slate-200 border-dashed -z-10"></div>
                        <div className="hidden md:block absolute top-[50%] right-[20%] w-[25%] border-t-2 border-slate-200 border-dashed -z-10"></div>

                        {/* Step 1 */}
                        <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl border shadow-sm relative group hover:border-purple-200 transition-colors">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">1. Upload Invoice</h3>
                            <p className="text-sm text-muted-foreground">Upload your PDF or Image invoice directly to our secure scanner.</p>
                            <span className="absolute -top-3 left-6 text-xs font-bold text-slate-300">STEP 01</span>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl border shadow-sm relative group hover:border-blue-200 transition-colors">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">2. AI Validation</h3>
                            <p className="text-sm text-muted-foreground">Our 11-point system scans for GST errors, math mistakes, and compliance issues.</p>
                            <span className="absolute -top-3 left-6 text-xs font-bold text-slate-300">STEP 02</span>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl border shadow-sm relative group hover:border-green-200 transition-colors">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                                <FileJson className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">3. View Report</h3>
                            <p className="text-sm text-muted-foreground">Get an instant pass/fail report with detailed instructions on how to fix errors.</p>
                            <span className="absolute -top-3 left-6 text-xs font-bold text-slate-300">STEP 03</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
