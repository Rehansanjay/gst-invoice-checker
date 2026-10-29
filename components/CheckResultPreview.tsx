'use client';

import { PreviewResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Lock, Zap, AlertTriangle, AlertCircle, Info, CheckCircle2, ShieldCheck } from 'lucide-react';

interface CheckResultPreviewProps {
    result: PreviewResult;
    onUnlock: () => void;
    isProcessing: boolean;
    /** Invoice total, used to frame the ₹99 against what is actually at stake. */
    invoiceTotal?: number;
    /** Total tax on the invoice — the ITC amount the financial hook names. */
    taxAmount?: number;
}

const SEVERITY_STYLES = {
    critical: {
        label: 'Critical',
        icon: AlertCircle,
        text: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
        dot: 'bg-red-500',
    },
    warning: {
        label: 'Warning',
        icon: AlertTriangle,
        text: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
    },
    info: {
        label: 'Info',
        icon: Info,
        text: 'text-sky-700',
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        dot: 'bg-sky-500',
    },
} as const;

function formatINR(value: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
}

/** A field the visitor can see only after paying. */
function LockedField({ label, hint }: { label: string; hint: string }) {
    return (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Lock className="h-3 w-3" />
                {label}
            </div>
            <p className="mt-1 text-sm text-slate-400">{hint}</p>
        </div>
    );
}

export default function CheckResultPreview({
    result,
    onUnlock,
    isProcessing,
    invoiceTotal,
    taxAmount,
}: CheckResultPreviewProps) {
    const {
        healthScore,
        scoreBreakdown,
        revealedIssue,
        lockedIssues,
        passedCount,
        totalCheckCount,
    } = result;

    const totalIssues = scoreBreakdown?.totalIssues ?? 0;
    const criticalCount = scoreBreakdown?.criticalCount ?? 0;
    const lockedCount = lockedIssues?.length ?? 0;

    // A clean invoice is a real outcome, not a failed upsell — say so plainly
    // rather than manufacturing alarm.
    const isClean = totalIssues === 0;

    const headline = isClean
        ? 'No compliance issues found'
        : criticalCount > 0
            ? `${criticalCount} critical ${criticalCount === 1 ? 'problem' : 'problems'} on this invoice`
            : `${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'} on this invoice`;

    const severity = revealedIssue ? SEVERITY_STYLES[revealedIssue.severity] : null;
    const SeverityIcon = severity?.icon;

    const unlockLabel = isClean
        ? 'Download Audit-Ready Verification PDF — ₹99 →'
        : 'Unlock Full Error Report & Fix — ₹99 →';

    return (
        <div className="mx-auto mt-8 w-full max-w-3xl space-y-6">
            {/* ── Summary ─────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{headline}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {passedCount} of {totalCheckCount} compliance checks passed
                        </p>
                    </div>
                    <div className="text-right">
                        <div
                            className={`text-4xl font-bold tabular-nums ${
                                healthScore >= 80
                                    ? 'text-emerald-600'
                                    : healthScore >= 50
                                        ? 'text-amber-600'
                                        : 'text-red-600'
                            }`}
                        >
                            {healthScore}
                            <span className="text-lg font-medium text-slate-400">/100</span>
                        </div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Health score</p>
                    </div>
                </div>
            </div>

            {isClean ? (
                /* ── Clean invoice — a paid hook, not a dead end ─────── */
                <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                            <div>
                                <h3 className="font-semibold text-emerald-900">
                                    Passed: {totalCheckCount}/{totalCheckCount} math &amp; format rules
                                </h3>
                                <p className="mt-1 text-sm text-emerald-800">
                                    No math or format errors. That is not the same as audit-proof — a
                                    buyer or auditor will still want it on record.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h3 className="mb-1 font-semibold text-slate-900">Put it on record</h3>
                        <p className="mb-4 text-sm text-slate-500">
                            A signed PDF certificate showing every check this invoice passed — to send
                            to your buyer or keep for an audit.
                        </p>
                        <LockedField
                            label="Audit-ready verification certificate (PDF)"
                            hint="Every rule checked, every result, signed and dated"
                        />
                    </div>
                </div>
            ) : (
                <>
                    {taxAmount !== undefined && taxAmount > 0 && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center sm:p-5">
                            <p className="font-semibold text-red-800">
                                🚨 {formatINR(taxAmount)} in Input Tax Credit (ITC) is at risk of rejection
                            </p>
                        </div>
                    )}

                    {/* ── The #1 issue, named but blurred ─────────────── */}
                    {revealedIssue && severity && SeverityIcon && (
                        <div className={`rounded-2xl border ${severity.border} ${severity.bg} p-6 sm:p-8`}>
                            <div className="mb-4 flex items-center gap-2">
                                <SeverityIcon className={`h-4 w-4 ${severity.text}`} />
                                <span className={`text-xs font-bold uppercase tracking-wide ${severity.text}`}>
                                    {severity.label} Error #1
                                </span>
                                <span className="text-xs text-slate-400">·</span>
                                <span className="text-xs font-medium text-slate-500">
                                    {revealedIssue.category}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900">{revealedIssue.title}</h3>

                            <div className="relative mt-4 overflow-hidden rounded-xl border border-white/60 bg-white/50">
                                <div aria-hidden className="select-none space-y-2 p-4 blur-sm">
                                    <p className="h-3 w-5/6 rounded bg-slate-300" />
                                    <p className="h-3 w-full rounded bg-slate-300" />
                                    <p className="h-3 w-2/3 rounded bg-slate-300" />
                                    <p className="h-3 w-1/2 rounded bg-slate-300" />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                                    <span className="flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white">
                                        <Lock className="h-3 w-3" />
                                        Exact line, GST law reference &amp; corrected value — locked
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── The rest, named but locked ──────────────────── */}
                    {lockedCount > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <h3 className="mb-1 font-semibold text-slate-900">
                                {lockedCount} more {lockedCount === 1 ? 'problem' : 'problems'} found
                            </h3>
                            <p className="mb-4 text-sm text-slate-500">
                                We know what each one is. Unlock to see the detail and the fix.
                            </p>

                            <ul className="space-y-2">
                                {lockedIssues.map((issue) => {
                                    const s = SEVERITY_STYLES[issue.severity];
                                    return (
                                        <li
                                            key={issue.id}
                                            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3"
                                        >
                                            <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-slate-800">
                                                    {issue.title}
                                                </p>
                                                <p className="text-xs text-slate-500">{issue.category}</p>
                                            </div>
                                            <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </>
            )}

            {/* ── Unlock ──────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
                {!isClean && invoiceTotal !== undefined && invoiceTotal > 0 && (
                    <p className="mb-4 text-sm text-slate-600">
                        This invoice is worth{' '}
                        <span className="font-bold text-slate-900">{formatINR(invoiceTotal)}</span>.
                        Marketplaces typically hold payment 2–7 days on invoices with errors like these.
                    </p>
                )}

                <Button
                    size="lg"
                    onClick={onUnlock}
                    disabled={isProcessing}
                    className="h-12 w-full max-w-sm text-base font-bold"
                >
                    {isProcessing ? (
                        'Processing Payment...'
                    ) : (
                        <>
                            <Zap className="mr-2 h-4 w-4" />
                            {unlockLabel}
                        </>
                    )}
                </Button>

                <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left text-sm text-slate-600">
                    {!isClean && (
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            Every issue explained, with the corrected value
                        </li>
                    )}
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        Step-by-step fixes you can apply in Tally or Zoho
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        Downloadable PDF report for your buyer or CA
                    </li>
                </ul>

                <p className="mt-5 text-xs text-slate-400">
                    One-time payment · Full refund within 48 hours if the report is wrong
                </p>
            </div>
        </div>
    );
}
