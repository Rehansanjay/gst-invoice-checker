'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Plus, CreditCard, Clock, CheckCircle2,
    Loader2, Lock, FileText, Building2, Calendar, ArrowRight,
    TrendingUp, ShieldCheck, ShieldAlert, ShieldX,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

// ── Subcomponents ──────────────────────────────────────────────────

function HealthBar({ score }: { score: number }) {
    const color = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2 min-w-[130px]">
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
            </div>
            <span className="text-xs font-bold tabular-nums w-8 text-right">{score}%</span>
        </div>
    );
}

function RiskBadge({ level, issues }: { level: string; issues?: number }) {
    if (level === 'high' || level === 'critical') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                <ShieldX className="w-3.5 h-3.5" />
                {issues ? `${issues} Issue${issues > 1 ? 's' : ''}` : 'High Risk'}
            </span>
        );
    }
    if (level === 'medium') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                <ShieldAlert className="w-3.5 h-3.5" />
                {issues ? `${issues} Warning${issues > 1 ? 's' : ''}` : 'Medium Risk'}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            Clean
        </span>
    );
}

function CheckCard({ check }: { check: any }) {
    const riskLevel = check.risk_level || 'low';
    const health = check.health_score ?? 100;
    const issueCount =
        check.issues_count ??
        (Array.isArray(check.validation_result?.issuesFound)
            ? check.validation_result.issuesFound.length
            : 0);
    const lineItemCount = Array.isArray(check.line_items) ? check.line_items.length : 0;
    const amount = check.invoice_total_amount;

    const borderColor =
        riskLevel === 'high' || riskLevel === 'critical'
            ? 'border-l-red-500'
            : riskLevel === 'medium'
                ? 'border-l-yellow-500'
                : 'border-l-green-500';

    return (
        <Card className={`border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-all hover:-translate-y-px bg-white`}>
            <div className="p-5">
                {/* Row 1: Invoice icon + number + date + risk badge */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 leading-tight">
                                {check.invoice_number || 'Invoice'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                {new Date(check.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                    <RiskBadge level={riskLevel} issues={issueCount > 0 ? issueCount : undefined} />
                </div>

                {/* Row 2: Supplier GSTIN + invoice value + line items */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 bg-slate-50 rounded-lg p-3">
                    <div>
                        <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> Supplier GSTIN
                        </p>
                        <p className="text-sm font-medium text-slate-800 font-mono truncate">
                            {check.supplier_gstin
                                ? check.supplier_gstin.substring(0, 10) + '…'
                                : '—'}
                        </p>
                    </div>

                    {amount != null && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Invoice Value</p>
                            <p className="text-sm font-semibold text-slate-800">
                                ₹{Number(amount).toLocaleString('en-IN')}
                            </p>
                        </div>
                    )}

                    {lineItemCount > 0 && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Line Items</p>
                            <p className="text-sm font-medium text-slate-800">{lineItemCount}</p>
                        </div>
                    )}
                </div>

                {/* Row 3: Health bar + View Report CTA */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TrendingUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground shrink-0">Health</span>
                        <HealthBar score={health} />
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 gap-1.5 text-xs h-8" asChild>
                        <Link href={`/report/${check.id}`}>
                            View Report
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </Button>
                </div>
            </div>
        </Card>
    );
}

// ── Main Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [userData, setUserData] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [checks, setChecks] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !user) router.replace('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) fetchUserData();
    }, [user]);

    const fetchUserData = async () => {
        if (!user) return;
        try {
            const { data: ud } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
            if (ud) setUserData(ud);

            const { data: cd } = await supabase
                .from('checks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);
            if (cd) setChecks(cd);
        } catch (e) {
            console.error('fetchUserData error:', e);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        (window as any).refreshDashboard = fetchUserData;
        return () => { delete (window as any).refreshDashboard; };
    }, [user]);

    if (authLoading || loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    const creditsRemaining = userData?.credits_remaining ?? 0;
    const creditsUsed = userData?.credits_used ?? 0;
    const totalCredits = creditsRemaining + creditsUsed;
    const hasPlan = !!userData?.current_plan;
    const isOutOfCredits = creditsRemaining === 0;

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">

            {/* Welcome */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                    Welcome back, {userData?.full_name || 'User'}! 👋
                </h1>
                <p className="text-muted-foreground">Here&apos;s your invoice validation activity.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Credits card */}
                <Card className={`p-6 border-l-4 shadow-sm hover:shadow-md transition-shadow ${isOutOfCredits ? 'border-l-red-500 bg-red-50/50' : 'border-l-primary'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-muted-foreground">Checks Available</h3>
                        {isOutOfCredits
                            ? <Lock className="w-5 h-5 text-red-500" />
                            : <CreditCard className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="text-4xl font-bold mb-1">
                        {creditsRemaining}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                            / {totalCredits}{' '}
                            {!hasPlan && totalCredits > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-1 font-medium">
                                    Free Trial
                                </span>
                            )}
                        </span>
                    </div>
                    <p className={`text-xs ${isOutOfCredits ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                        {isOutOfCredits ? '⚠️ No checks left — upgrade to continue' : 'Use anytime, never expires'}
                    </p>
                </Card>

                {/* Checks used */}
                <Card className="p-6 border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-muted-foreground">Checks Used</h3>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-4xl font-bold mb-1">{creditsUsed}</div>
                    <p className="text-xs text-muted-foreground">Total invoices validated</p>
                </Card>

                {/* Last check */}
                <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-muted-foreground">Last Check</h3>
                        <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-4xl font-bold mb-1">
                        {checks.length > 0
                            ? new Date(checks[0].created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                            })
                            : <span className="text-2xl">—</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {checks.length > 0
                            ? `Invoice #${checks[0].invoice_number || 'Unknown'}`
                            : 'No checks yet'}
                    </p>
                </Card>
            </div>

            {/* Action buttons */}
            {isOutOfCredits ? (
                <div className="flex flex-col sm:flex-row gap-4 p-5 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex-1">
                        <p className="font-semibold text-red-800">You&apos;ve used all your checks</p>
                        <p className="text-sm text-red-600">Buy a credit pack to keep validating invoices.</p>
                    </div>
                    <Link href="/pricing">
                        <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700 text-white h-12">
                            <CreditCard className="w-5 h-5" /> Upgrade Now
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="flex gap-4 flex-wrap">
                    <Link href="/pricing">
                        <Button size="lg" variant="outline" className="h-12 gap-2">
                            <CreditCard className="w-5 h-5" /> Buy More Checks
                        </Button>
                    </Link>
                    <Link href="/check">
                        <Button size="lg" className="h-12 gap-2">
                            <Plus className="w-5 h-5" /> Check New Invoice
                        </Button>
                    </Link>
                </div>
            )}

            {/* Recent Checks — enriched document cards */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h2 className="text-xl font-bold text-slate-900">Recent Checks</h2>
                    {checks.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {checks.length} most recent
                        </span>
                    )}
                </div>

                {checks.length === 0 ? (
                    <Card className="p-10 text-center text-muted-foreground bg-slate-50 border-dashed">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium mb-1">No invoices checked yet</p>
                        <p className="text-sm mb-4">
                            Validated invoices appear here with supplier info, amounts, and health scores.
                        </p>
                        <Link href="/check">
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" /> Check Your First Invoice
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {checks.map((check) => (
                            <CheckCard key={check.id} check={check} />
                        ))}
                    </div>
                )}

                {checks.length > 0 && (
                    <div className="text-center pt-2">
                        <Button variant="link" className="text-primary gap-1" asChild>
                            <Link href="/history">
                                View All Checks <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
