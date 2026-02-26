'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReportViewer from '@/components/ReportViewer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ValidationResult } from '@/types';

export default function ReportPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const checkId = params?.id as string;

    const [report, setReport] = useState<{
        validationResult: ValidationResult;
        invoiceNumber: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!checkId || authLoading) return;
        if (!user) return;
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkId, user, authLoading]);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: dbError } = await supabase
                .from('checks')
                .select('id, invoice_number, validation_result, parsed_data, user_id')
                .eq('id', checkId)
                .single();

            if (dbError || !data) {
                setError('Report not found. It may have been deleted or you may not have access.');
                return;
            }

            // Only the owner can view their report
            if (data.user_id !== user?.id) {
                setError('You do not have permission to view this report.');
                return;
            }

            // Try validation_result column first, fall back to parsed result
            const validationResult: ValidationResult | null =
                data.validation_result ?? null;

            if (!validationResult) {
                setError('Report data is incomplete. Please re-validate this invoice.');
                return;
            }

            setReport({
                validationResult,
                invoiceNumber: data.invoice_number || 'Invoice',
            });
        } catch (err: any) {
            setError('Failed to load report. Please try again.');
            console.error('fetchReport error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Loading states
    if (authLoading || (loading && !error)) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground text-sm">Loading report...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md space-y-4 p-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold">Report Not Found</h2>
                    <p className="text-muted-foreground text-sm">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Button>
                        <Button asChild>
                            <Link href="/dashboard/history">View All Reports</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!report) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                            Report · {report.invoiceNumber}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/history">
                            <Button variant="ghost" size="sm" className="text-muted-foreground">
                                History
                            </Button>
                        </Link>
                        <Link href="/check">
                            <Button size="sm" className="gap-1.5">
                                Check New Invoice
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Report */}
            <main className="container mx-auto px-4 py-8">
                <ReportViewer
                    result={report.validationResult}
                    invoiceNumber={report.invoiceNumber}
                />
            </main>
        </div>
    );
}
