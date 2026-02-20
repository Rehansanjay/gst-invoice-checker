'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, CreditCard, Clock, AlertTriangle, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [userData, setUserData] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(true);

    const [checks, setChecks] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [user, authLoading, router]);

    // Fetch user data and checks when authenticated
    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user]);

    const fetchUserData = async () => {
        if (!user) return;

        try {
            // Fetch User Profile
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!userError && userData) {
                setUserData(userData);
            }

            // Fetch Recent Checks
            const { data: checksData, error: checksError } = await supabase
                .from('checks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (!checksError && checksData) {
                setChecks(checksData);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    // Expose refresh function to window for interactions
    useEffect(() => {
        (window as any).refreshDashboard = fetchUserData;
        return () => {
            delete (window as any).refreshDashboard;
        };
    }, [user]);

    // Show loading while checking auth or fetching data
    if (authLoading || loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Don't render if not authenticated (will redirect)
    if (!user) {
        return null;
    }

    const creditsRemaining = userData?.credits_remaining ?? 0;
    const creditsUsed = userData?.credits_used ?? 0;
    const totalCredits = creditsRemaining + creditsUsed;
    const hasPlan = !!userData?.current_plan;
    const isOutOfCredits = creditsRemaining === 0;

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Welcome Section */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                    Welcome back, {userData?.full_name || 'User'}! 👋
                </h1>
                <p className="text-muted-foreground">Here's what's happening with your invoices.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className={`p-6 border-l-4 shadow-sm hover:shadow-md transition-shadow ${isOutOfCredits ? 'border-l-red-500 bg-red-50/50' : 'border-l-primary'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-muted-foreground">Checks Available</h3>
                        {isOutOfCredits ? (
                            <Lock className="w-5 h-5 text-red-500" />
                        ) : (
                            <CreditCard className="w-5 h-5 text-primary" />
                        )}
                    </div>
                    <div className="text-4xl font-bold mb-1">
                        {creditsRemaining}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                            / {totalCredits} {!hasPlan && totalCredits > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-1 font-medium">Free Trial</span>}
                        </span>
                    </div>
                    <p className={`text-xs ${isOutOfCredits ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                        {isOutOfCredits ? '⚠️ No checks left — upgrade to continue' : 'Use anytime'}
                    </p>
                </Card>

                <Card className="p-6 border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-muted-foreground">Checks Used</h3>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-4xl font-bold mb-1">{creditsUsed}</div>
                    <p className="text-xs text-muted-foreground">Total checks processed</p>
                </Card>

                <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-muted-foreground">Last Check</h3>
                        <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-4xl font-bold mb-1">
                        {checks.length > 0 ? (
                            new Date(checks[0].created_at).toLocaleDateString()
                        ) : (
                            <span className="text-2xl">No checks yet</span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {checks.length > 0 ? `Invoice #${checks[0].invoice_number || 'Unknown'}` : 'Start checking now'}
                    </p>
                </Card>
            </div>

            {/* Actions */}
            {isOutOfCredits ? (
                <div className="flex flex-col sm:flex-row gap-4 p-5 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex-1">
                        <p className="font-semibold text-red-800">You've used your free trial</p>
                        <p className="text-sm text-red-600">Buy a credit pack to keep validating invoices.</p>
                    </div>
                    <Link href="/pricing">
                        <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700 text-white h-12">
                            <CreditCard className="w-5 h-5" /> Upgrade Now
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="flex gap-4">
                    <Link href="/pricing">
                        <Button size="lg" variant="outline" className="w-full md:w-auto h-12 text-lg gap-2">
                            <CreditCard className="w-5 h-5" /> Buy More Checks
                        </Button>
                    </Link>
                    <Link href="/check">
                        <Button size="lg" className="w-full md:w-auto h-12 text-lg gap-2">
                            <Plus className="w-5 h-5" /> Check New Invoice
                        </Button>
                    </Link>
                </div>
            )}

            {/* Recent Checks */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 border-b pb-2">Recent Checks</h2>

                {checks.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground bg-slate-50 border-dashed">
                        <p>No invoices checked yet.</p>
                        <Link href="/check" className="text-primary hover:underline mt-2 inline-block">
                            Check one now?
                        </Link>
                    </Card>
                ) : (
                    checks.map((check) => (
                        <Card key={check.id} className={`p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer border-l-4 shadow-sm ${check.risk_level === 'high' ? 'border-l-red-500' :
                            check.risk_level === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                            }`}>
                            <div className="space-y-1">
                                <div className="font-bold text-lg">Invoice: {check.invoice_number || 'Unknown'}</div>
                                <div className="text-sm text-muted-foreground">
                                    Checked: {new Date(check.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${check.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                                check.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                }`}>
                                {check.risk_level === 'high' ? <AlertTriangle className="w-4 h-4" /> :
                                    check.risk_level === 'medium' ? <AlertTriangle className="w-4 h-4" /> :
                                        <CheckCircle2 className="w-4 h-4" />}
                                {check.health_score || 0}% Health Score ({check.risk_level?.toUpperCase() || 'UNKNOWN'})
                            </div>

                            <Button size="sm" variant="outline" asChild>
                                <Link href={`/report/${check.id}`}>View Report</Link>
                            </Button>
                        </Card>
                    ))
                )}

                {checks.length > 0 && (
                    <div className="text-center pt-4">
                        <Button variant="link" className="text-primary" asChild>
                            <Link href="/history">View All Checks →</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
