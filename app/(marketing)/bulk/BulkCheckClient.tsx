'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Upload, Download, AlertCircle, AlertTriangle, CheckCircle2, Lock, Loader2, FileSpreadsheet, Zap } from 'lucide-react';
import { BulkCheckResult } from '@/types';
import EmailReportCapture from '@/components/EmailReportCapture';
import FeedbackPrompt from '@/components/FeedbackPrompt';
import { toast } from 'sonner';
import { track, trackPurchase } from '@/lib/analytics';
import { BULK_UNLOCK_PRICE_RUPEES } from '@/lib/pricing';
import { buildBulkExceptionCsv, buildBulkTallyXml, downloadTextFile } from '@/lib/invoiceExport';
import type { RazorpaySuccessResponse, RazorpayFailureResponse } from '@/types/razorpay';

const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const SEVERITY_DOT = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
} as const;

function formatINR(value: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function BulkCheckClient() {
    const [result, setResult] = useState<BulkCheckResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [fileName, setFileName] = useState<string>('');
    const [checkId, setCheckId] = useState<string | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadRazorpayScript();
    }, []);

    const runCheck = async (csv: string) => {
        setIsProcessing(true);
        setResult(null);
        setCheckId(null);
        setIsUnlocked(false);
        try {
            const res = await fetch('/api/bulk-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csv }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || 'Could not process the file.');
                return;
            }
            setResult(data.result);
            setCheckId(data.checkId ?? null);
            track('bulk_check_completed', { invoices: data.result.totalInvoices });
            toast.success(`${data.result.totalInvoices} invoices checked.`);
        } catch {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUnlock = async () => {
        if (!checkId) {
            toast.error('Session expired. Please re-upload your file.');
            return;
        }

        track('unlock_clicked', { item: 'bulk_check' });
        setIsUnlocking(true);

        try {
            const orderResponse = await fetch('/api/bulk-quick-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checkId }),
            });
            const orderData = await orderResponse.json();

            if (!orderResponse.ok || !orderData.orderId) {
                throw new Error(orderData.error || 'Failed to create payment order');
            }

            if (!window.Razorpay) {
                await loadRazorpayScript();
            }
            if (!window.Razorpay) {
                throw new Error('Payment gateway failed to load.');
            }

            const options = {
                key: orderData.razorpayKeyId,
                amount: orderData.amount,
                currency: 'INR',
                name: 'InvoiceCheck.in',
                description: `Bulk Batch Unlock — ₹${BULK_UNLOCK_PRICE_RUPEES}`,
                image: 'https://invoicecheck.in/invoicecheck-logo.svg',
                order_id: orderData.orderId,
                // Same UPI-first guest flow as the single-check unlock —
                // most guests are on mobile and already pay this way.
                config: {
                    display: {
                        blocks: {
                            upi_block: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] },
                        },
                        sequence: ['block.upi_block'],
                        preferences: { show_default_blocks: true },
                    },
                },
                handler: async function (response: RazorpaySuccessResponse) {
                    try {
                        const resultResponse = await fetch('/api/bulk-process-check', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                checkId: orderData.checkId,
                                paymentId: orderData.paymentId,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpaySignature: response.razorpay_signature,
                            }),
                        });
                        const data = await resultResponse.json();

                        if (!resultResponse.ok || !data.success) {
                            throw new Error(data.error || 'Processing failed');
                        }

                        trackPurchase('bulk_check', response.razorpay_payment_id, orderData.amount / 100);
                        toast.success('Payment verified! Full report unlocked.');
                        setResult(data.result);
                        setIsUnlocked(true);
                    } catch (err) {
                        console.error('Bulk process-check error:', err);
                        toast.error('Payment processing failed. Contact support.');
                    } finally {
                        setIsUnlocking(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        track('checkout_dismissed', { item: 'bulk_check' });
                        setIsUnlocking(false);
                        toast('Payment cancelled');
                    },
                },
                theme: { color: '#6d28d9' },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response: RazorpayFailureResponse) => {
                track('payment_failed', { item: 'bulk_check' });
                toast.error(`Payment failed: ${response.error.description}`);
                setIsUnlocking(false);
            });

            rzp.open();
            track('checkout_opened', { item: 'bulk_check' });

        } catch (error) {
            console.error('Bulk unlock error:', error);
            toast.error((error instanceof Error && error.message) || 'Payment initiation failed.');
            setIsUnlocking(false);
        }
    };

    const handleDownloadCsv = () => {
        if (!result) return;
        downloadTextFile(
            `bulk-exception-report-${Date.now()}.csv`,
            buildBulkExceptionCsv(result.results),
            'text/csv'
        );
    };

    const handleDownloadTallyXml = () => {
        if (!result) return;
        // `invoiceData` is only present once unlocked — the free response
        // never carries it (see /api/bulk-check).
        const invoices = result.results
            .map((r) => r.invoiceData)
            .filter((inv): inv is NonNullable<typeof inv> => !!inv);
        if (invoices.length === 0) {
            toast.error('No invoice data available to export.');
            return;
        }
        downloadTextFile(
            `bulk-tally-vouchers-${Date.now()}.xml`,
            buildBulkTallyXml(invoices),
            'application/xml'
        );
    };

    const handleFile = (file: File) => {
        if (file.size > 2_000_000) {
            toast.error('File is larger than 2MB.');
            return;
        }
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => runCheck(String(reader.result ?? ''));
        reader.onerror = () => toast.error('Could not read that file.');
        reader.readAsText(file);
    };

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
                <div className="mb-10 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        <FileSpreadsheet className="h-3 w-3" />
                        For CA firms &amp; high-volume sellers
                    </span>
                    <h1 className="mt-4 text-4xl font-bold text-slate-900 font-heading">
                        Check a whole batch before you file
                    </h1>
                    <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
                        Upload your invoice export and find every invoice that will be rejected —
                        before it reaches GSTR-1. Up to {result?.limit ?? 100} invoices per batch.
                    </p>
                </div>

                {/* ── Upload ─────────────────────────────────────────── */}
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFile(f);
                        }}
                    />

                    {isProcessing ? (
                        <div className="flex flex-col items-center gap-3 text-slate-600">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p>Checking your invoices…</p>
                        </div>
                    ) : (
                        <>
                            <Upload className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                            <p className="mb-1 font-medium text-slate-800">
                                {fileName || 'Upload your CSV export'}
                            </p>
                            <p className="mb-6 text-sm text-slate-500">
                                Tally, Zoho, Busy or a GSTR-1 export. One row per line item.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <Button onClick={() => inputRef.current?.click()}>
                                    Choose file
                                </Button>
                                <a href="/api/bulk-template" download>
                                    <Button variant="outline" className="gap-2">
                                        <Download className="h-4 w-4" />
                                        Download template
                                    </Button>
                                </a>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Results ────────────────────────────────────────── */}
                {result && (
                    <div className="mt-10 space-y-6" data-clarity-mask="true">
                        <div className="grid gap-4 sm:grid-cols-4">
                            <Tile label="Invoices checked" value={String(result.totalInvoices)} />
                            <Tile label="Clean" value={String(result.cleanInvoices)} tone="good" />
                            <Tile label="Will be rejected" value={String(result.invoicesWithCritical)} tone="bad" />
                            <Tile label="Value at risk" value={formatINR(result.amountAtRisk)} tone="bad" />
                        </div>

                        {result.droppedForLimit > 0 && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                Your file contained {result.droppedForLimit} more invoices than the{' '}
                                {result.limit}-invoice batch limit, so they were not checked.{' '}
                                <Link href="/contact" className="font-semibold underline">
                                    Talk to us about a practice plan
                                </Link>{' '}
                                to run your full book.
                            </div>
                        )}

                        {result.rowErrors.length > 0 && (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-2 text-sm font-semibold text-slate-800">
                                    {result.rowErrors.length} row(s) could not be read
                                </p>
                                <ul className="space-y-1 text-sm text-slate-600">
                                    {result.rowErrors.slice(0, 8).map((e) => (
                                        <li key={`${e.row}-${e.message}`}>Row {e.row}: {e.message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Root causes come before the invoice list: if twelve
                            invoices share one bad customer record, that is one
                            fix, and reading twelve rows first is wasted effort. */}
                        {result.rootCauses?.length > 0 && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
                                <h2 className="mb-1 font-bold text-amber-900">
                                    {result.rootCauses.length === 1
                                        ? '1 defect is repeating — fix it once'
                                        : `${result.rootCauses.length} defects are repeating — fix each once`}
                                </h2>
                                <p className="mb-5 text-sm text-amber-800">
                                    These appear on several invoices for the same reason. Correcting
                                    the source fixes all of them, including next month&apos;s.
                                </p>

                                <div className="space-y-3">
                                    {result.rootCauses.map((rc) => (
                                        <div
                                            key={rc.id}
                                            className="rounded-lg border border-amber-200 bg-white p-4"
                                        >
                                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[rc.severity]}`}
                                                />
                                                <span className="font-semibold text-slate-900">
                                                    {rc.issueTitle}
                                                    {!isUnlocked && ' — unlock to view root cause & fix'}
                                                </span>
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                    {rc.scope === 'counterparty' ? 'Customer record' : 'Template or setting'}
                                                </span>
                                                <span className="ml-auto text-sm font-semibold text-slate-700">
                                                    {rc.invoiceCount} invoices · {formatINR(rc.amountAffected)}
                                                </span>
                                            </div>

                                            {rc.key && (
                                                <p className="mb-1 font-mono text-xs text-slate-500">{rc.key}</p>
                                            )}
                                            <p className="text-sm text-slate-600">{rc.hint}</p>
                                            <p className="mt-2 text-xs text-slate-400">
                                                Affected: {rc.invoiceNumbers.slice(0, 6).join(', ')}
                                                {rc.invoiceNumbers.length > 6
                                                    ? ` and ${rc.invoiceNumbers.length - 6} more`
                                                    : ''}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Exception report */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <div className="border-b border-slate-200 px-6 py-4">
                                <h2 className="font-bold text-slate-900">Exception report</h2>
                                <p className="text-sm text-slate-500">
                                    Worst first. Unlock to see the corrected values and how to fix each one.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold">Invoice</th>
                                            <th className="px-6 py-3 font-semibold">Value</th>
                                            <th className="px-6 py-3 font-semibold">Score</th>
                                            <th className="px-6 py-3 font-semibold">Problems found</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {result.results.map((r) => (
                                            <tr key={r.invoiceNumber} className="align-top">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-slate-900">{r.invoiceNumber}</p>
                                                    <p className="text-xs text-slate-500">{r.invoiceDate}</p>
                                                    {r.buyerGSTIN && (
                                                        <p className="font-mono text-xs text-slate-400">{r.buyerGSTIN}</p>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                                                    {formatINR(r.invoiceTotalAmount)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`font-bold tabular-nums ${
                                                            r.healthScore >= 80 ? 'text-emerald-600'
                                                                : r.healthScore >= 50 ? 'text-amber-600'
                                                                    : 'text-red-600'
                                                        }`}
                                                    >
                                                        {r.healthScore}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {r.issues.length === 0 ? (
                                                        <span className="inline-flex items-center gap-1.5 text-emerald-700">
                                                            <CheckCircle2 className="h-4 w-4" /> Clean
                                                        </span>
                                                    ) : (
                                                        <ul className="space-y-1">
                                                            {r.issues.map((issue) => {
                                                                // Present only once unlocked — bulk-process-check
                                                                // returns the full stored ValidationIssue, which
                                                                // carries this field; the free redacted payload
                                                                // never does.
                                                                const howToFix = (issue as { howToFix?: string }).howToFix;
                                                                return (
                                                                    <li key={issue.id} className="flex items-start gap-2">
                                                                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[issue.severity]}`} />
                                                                        <span className="min-w-0">
                                                                            <span className="flex items-center gap-2 text-slate-700">
                                                                                {issue.title}
                                                                                {!isUnlocked && <Lock className="h-3 w-3 shrink-0 text-slate-300" />}
                                                                            </span>
                                                                            {isUnlocked && howToFix && (
                                                                                <span className="block text-xs text-slate-500">{howToFix}</span>
                                                                            )}
                                                                        </span>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <EmailReportCapture
                            source="bulk"
                            summary={result}
                            heading="Email me this exception report"
                            subheading={
                                result.invoicesWithCritical > 0
                                    ? `Send the ${result.invoicesWithCritical} flagged invoice${result.invoicesWithCritical === 1 ? '' : 's'} to your inbox so you can work through them.`
                                    : 'Send the results to your inbox for your records.'
                            }
                        />

                        <FeedbackPrompt tool="bulk" />

                        {result.totalIssues > 0 && !isUnlocked && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                                {result.invoicesWithCritical > 0 && (
                                    <div className="mb-3 flex items-center justify-center gap-2 text-red-600">
                                        <AlertCircle className="h-5 w-5" />
                                        <p className="font-semibold">
                                            {result.invoicesWithCritical} of {result.totalInvoices} invoices will be
                                            rejected as filed
                                        </p>
                                    </div>
                                )}
                                <p className="mx-auto mb-6 max-w-lg text-sm text-slate-600">
                                    {result.invoicesWithCritical > 0
                                        ? <>Filing these means amendments next month and{' '}
                                            {formatINR(result.amountAtRisk)} of invoice value sitting in dispute.{' '}</>
                                        : null}
                                    Unlock the exact defect and the fix for every invoice above, plus a CSV
                                    export of the full exception report and a Tally Prime voucher XML for
                                    the whole batch — without losing this batch to a login screen.
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <Button size="lg" onClick={handleUnlock} disabled={isUnlocking}>
                                        {isUnlocking ? (
                                            'Processing Payment...'
                                        ) : (
                                            <>
                                                <Zap className="mr-2 h-4 w-4" />
                                                Unlock Full Batch Error Report, Fixes, Corrected CSV &amp; Tally Prime XML — ₹{BULK_UNLOCK_PRICE_RUPEES}
                                            </>
                                        )}
                                    </Button>
                                    <Link href="/contact">
                                        <Button size="lg" variant="outline">
                                            Talk to us about a practice plan
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {isUnlocked && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center sm:p-8">
                                <p className="font-semibold text-emerald-900">
                                    Unlocked — every title above is the exact defect, with the fix included.
                                </p>
                                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                                    <Button size="lg" variant="outline" className="gap-2" onClick={handleDownloadCsv}>
                                        <Download className="h-4 w-4" />
                                        Download exception report (CSV)
                                    </Button>
                                    <Button size="lg" variant="outline" className="gap-2" onClick={handleDownloadTallyXml}>
                                        <Download className="h-4 w-4" />
                                        Download Batch Tally Prime XML
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!result && !isProcessing && (
                    <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            What your file needs
                        </h2>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li>
                                <strong>One row per line item.</strong> Repeat the invoice-level fields on
                                every row of the same invoice — we group by invoice number.
                            </li>
                            <li>
                                <strong>Required columns:</strong> invoice_number, invoice_date,
                                supplier_gstin. Everything else is optional but improves coverage.
                            </li>
                            <li>
                                <strong>Include your stated totals</strong> (invoice_total, invoice_tax_total)
                                if you have them — that lets us reconcile them against the line items rather
                                than deriving them.
                            </li>
                            <li>
                                Common header spellings from Tally, Zoho, Busy and GSTR-1 exports are
                                recognised automatically.
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
    const colour = tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-red-600' : 'text-slate-900';
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${colour}`}>{value}</p>
        </div>
    );
}
