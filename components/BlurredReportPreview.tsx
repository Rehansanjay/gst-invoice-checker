'use client';

import { ValidationResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Lock, Zap } from 'lucide-react';

interface BlurredReportPreviewProps {
    result: Partial<ValidationResult>;
    onUnlock: () => void;
    isProcessing: boolean;
}

export default function BlurredReportPreview({ result, onUnlock, isProcessing }: BlurredReportPreviewProps) {
    const totalIssues = result.scoreBreakdown?.totalIssues ?? 0;
    const healthScore = result.healthScore ?? 0;
    const criticalCount = result.scoreBreakdown?.criticalCount ?? 0;
    const warningCount = result.scoreBreakdown?.warningCount ?? 0;
    const riskLevel = result.riskLevel ?? 'medium';

    return (
        <div className="relative w-full max-w-4xl mx-auto mt-8">
            {/* 1. Fake placeholder content (blurred) — NO real data in DOM */}
            <div className="filter blur-md pointer-events-none select-none opacity-50 overflow-hidden h-[600px] relative">
                <div className="p-8 space-y-6">
                    <div className="h-8 bg-slate-200 rounded w-2/3" />
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-24 bg-slate-100 rounded-lg" />
                        <div className="h-24 bg-slate-100 rounded-lg" />
                        <div className="h-24 bg-slate-100 rounded-lg" />
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex gap-3 items-start p-4 bg-slate-50 rounded-lg">
                                <div className="h-5 w-5 bg-red-200 rounded-full shrink-0 mt-0.5" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-3 bg-slate-100 rounded w-full" />
                                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. Overlay (Call to Action) */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-transparent via-white/80 to-white/95 rounded-xl border border-white/20">
                <div className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-200 text-center max-w-md w-full animate-in fade-in zoom-in duration-500">

                    {/* Status Icon */}
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                        <Lock className="w-8 h-8 text-white" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        Wait! Critical Errors Found
                    </h2>

                    <p className="text-slate-600 mb-6">
                        We found <span className="font-bold text-red-600">{totalIssues} issues</span> in your invoice.
                        <br />
                        Your Health Score is <span className="font-bold text-orange-600">{healthScore}/100</span>.
                    </p>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6 text-sm text-left space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Critical Issues:</span>
                            <span className="font-mono font-bold text-red-600">{criticalCount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Warnings:</span>
                            <span className="font-mono font-bold text-yellow-600">{warningCount}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 mt-2 flex justify-between font-medium">
                            <span>Potential Penalty Risk:</span>
                            <span className={riskLevel === 'high' ? 'text-red-600' : 'text-yellow-600'}>
                                {riskLevel.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        onClick={onUnlock}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-12 shadow-xl hover:scale-105 transition-all"
                    >
                        {isProcessing ? (
                            'Processing Payment...'
                        ) : (
                            <>
                                <Zap className="w-4 h-4 mr-2" />
                                Unlock Full Report - ₹99
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-slate-400 mt-4">
                        100% Satisfaction Guarantee. Instant Access.
                    </p>
                </div>
            </div>
        </div>
    );
}

