'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Loader2, FileText, Building2, Calendar, ArrowRight,
    TrendingUp, ShieldCheck, ShieldAlert, ShieldX, Search,
    Plus, ChevronLeft, ChevronRight, RotateCcw, Filter,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 10;

function HealthBar({ score }: { score: number }) {
    const color = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2 min-w-[110px]">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
            </div>
            <span className="text-xs font-bold tabular-nums w-8 text-right">{score}%</span>
        </div>
    );
}

function RiskBadge({ level, issues }: { level: string; issues?: number }) {
    if (level === 'high' || level === 'critical') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                <ShieldX className="w-3 h-3" />
                {issues != null && issues > 0 ? `${issues} issue${issues > 1 ? 's' : ''}` : 'High Risk'}
            </span>
        );
    }
    if (level === 'medium') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                <ShieldAlert className="w-3 h-3" />
                {issues != null && issues > 0 ? `${issues} warning${issues > 1 ? 's' : ''}` : 'Medium Risk'}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <ShieldCheck className="w-3 h-3" />
            Clean
        </span>
    );
}

function CheckRow({ check }: { check: any }) {
    const riskLevel = check.risk_level || 'low';
    const health = check.health_score ?? 100;
    const issueCount =
        check.issues_count ??
        (Array.isArray(check.validation_result?.issuesFound)
            ? check.validation_result.issuesFound.length
            : 0);
    const amount = check.invoice_total_amount;
    const borderColor =
        riskLevel === 'high' || riskLevel === 'critical'
            ? 'border-l-red-500'
            : riskLevel === 'medium'
                ? 'border-l-amber-400'
                : 'border-l-green-500';

    return (
        <Card className={`border-l-4 ${borderColor} bg-white shadow-sm hover:shadow-md transition-all hover:-translate-y-px`}>
            <div className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Invoice info */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate leading-tight">
                                {check.invoice_number || 'Invoice'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3 shrink-0" />
                                {new Date(check.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Middle: supplier + amount */}
                    <div className="hidden sm:flex items-center gap-6 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                                <Building2 className="w-3 h-3" /> Supplier
                            </p>
                            <p className="font-mono text-xs text-slate-700 truncate max-w-[130px]">
                                {check.supplier_gstin
                                    ? check.supplier_gstin.substring(0, 10) + '…'
                                    : '—'}
                            </p>
                        </div>
                        {amount != null && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Value</p>
                                <p className="text-sm font-semibold">₹{Number(amount).toLocaleString('en-IN')}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                                <TrendingUp className="w-3 h-3" /> Health
                            </p>
                            <HealthBar score={health} />
                        </div>
                    </div>

                    {/* Right: badge + CTA */}
                    <div className="flex items-center gap-3 shrink-0">
                        <RiskBadge level={riskLevel} issues={issueCount > 0 ? issueCount : undefined} />
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" asChild>
                            <Link href={`/report/${check.id}`}>
                                View <ArrowRight className="w-3 h-3" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}

export default function HistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [checks, setChecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [riskFilter, setRiskFilter] = useState<'all' | 'clean' | 'issues'>('all');

    useEffect(() => {
        if (!authLoading && !user) router.replace('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) fetchChecks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, page, search, riskFilter]);

    const fetchChecks = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let query = supabase
                .from('checks')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

            if (search) {
                query = query.ilike('invoice_number', `%${search}%`);
            }
            if (riskFilter === 'clean') {
                query = query.eq('risk_level', 'low');
            } else if (riskFilter === 'issues') {
                query = query.in('risk_level', ['medium', 'high', 'critical']);
            }

            const { data, count } = await query;
            if (data) setChecks(data);
            if (count != null) setTotal(count);
        } catch (e) {
            console.error('fetchChecks error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        setSearch(searchInput);
    };

    const handleReset = () => {
        setSearchInput('');
        setSearch('');
        setRiskFilter('all');
        setPage(0);
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Invoice History</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        All {total > 0 ? total : ''} invoice checks on your account
                    </p>
                </div>
                <Link href="/check">
                    <Button className="gap-2 h-10">
                        <Plus className="w-4 h-4" />
                        Check New Invoice
                    </Button>
                </Link>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by invoice number..."
                            className="pl-9 h-10"
                        />
                    </div>
                    <Button type="submit" size="sm" className="h-10 px-4">Search</Button>
                </form>

                {/* Risk Filter */}
                <div className="flex gap-2 items-center">
                    <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                    {(['all', 'clean', 'issues'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => { setRiskFilter(f); setPage(0); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${riskFilter === f
                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                    : 'bg-white text-muted-foreground border-border hover:border-primary/40'
                                }`}
                        >
                            {f === 'all' ? 'All' : f === 'clean' ? '✅ Clean' : '⚠️ Issues'}
                        </button>
                    ))}
                </div>

                {/* Reset */}
                {(search || riskFilter !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 h-10 text-muted-foreground">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                    </Button>
                )}
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
            ) : checks.length === 0 ? (
                <Card className="p-12 text-center bg-slate-50 border-dashed">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-600 mb-1">
                        {search || riskFilter !== 'all' ? 'No matching invoices found' : 'No invoices checked yet'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                        {search || riskFilter !== 'all'
                            ? 'Try adjusting your search or filter.'
                            : 'Validated invoices will appear here.'}
                    </p>
                    {(search || riskFilter !== 'all') ? (
                        <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                            <RotateCcw className="w-3.5 h-3.5" />
                            Clear Filters
                        </Button>
                    ) : (
                        <Link href="/check">
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Check Your First Invoice
                            </Button>
                        </Link>
                    )}
                </Card>
            ) : (
                <div className="space-y-3">
                    {checks.map((check) => (
                        <CheckRow key={check.id} check={check} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">
                        Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            className="gap-1.5 h-8"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            Prev
                        </Button>
                        <span className="flex items-center px-3 text-sm text-muted-foreground">
                            {page + 1} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                            className="gap-1.5 h-8"
                        >
                            Next
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
