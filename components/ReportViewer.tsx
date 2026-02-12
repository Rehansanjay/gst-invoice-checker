'use client';

import { ValidationResult } from '@/types';
import HealthScore from './HealthScore';
import IssueCard from './IssueCard';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Download, Share2, Mail, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface ReportViewerProps {
    result: ValidationResult;
}

export default function ReportViewer({ result }: ReportViewerProps) {
    const criticalIssues = result.issuesFound.filter(i => i.severity === 'critical');
    const warningIssues = result.issuesFound.filter(i => i.severity === 'warning');
    const passedChecks = result.checksPassed;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Invoice Health Report</h2>
                    <p className="text-sm text-muted-foreground">Check ID: {result.checkId} • {new Date().toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" /> PDF
                    </Button>
                    <Button variant="outline" size="sm">
                        <Mail className="w-4 h-4 mr-2" /> Email
                    </Button>
                </div>
            </div>

            {/* Health Score */}
            <HealthScore score={result.healthScore} riskLevel={result.riskLevel} />

            {/* Critical Issues */}
            {criticalIssues.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
                        🔴 CRITICAL ISSUES ({criticalIssues.length})
                    </h3>
                    <div className="space-y-6">
                        {criticalIssues.map((issue) => (
                            <IssueCard key={issue.id} issue={issue} />
                        ))}
                    </div>
                </div>
            )}

            {/* Warning Issues */}
            {warningIssues.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-4 text-yellow-600 flex items-center gap-2">
                        ⚠️ WARNINGS ({warningIssues.length})
                    </h3>
                    <div className="space-y-6">
                        {warningIssues.map((issue) => (
                            <IssueCard key={issue.id} issue={issue} />
                        ))}
                    </div>
                </div>
            )}

            {/* Checks Passed */}
            <div>
                <h3 className="text-xl font-bold mb-4 text-green-600 flex items-center gap-2">
                    ✅ CHECKS PASSED ({passedChecks.length})
                </h3>
                <Card className="p-6 border-green-200 bg-green-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {passedChecks.map((check) => (
                            <div key={check.id} className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm font-medium text-slate-700">{check.title}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Recommended Actions */}
            <Card className="p-6 border-blue-200 bg-blue-50/30">
                <h3 className="text-lg font-bold mb-4 text-blue-900">📋 RECOMMENDED ACTIONS</h3>
                <div className="space-y-4">
                    {criticalIssues.length > 0 ? (
                        <div>
                            <h4 className="font-semibold text-red-700 mb-2">Priority 1 (Must Fix):</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                {criticalIssues.map((issue, i) => (
                                    <li key={i}>Fix {issue.title} {issue.location ? `at ${issue.location}` : ''}</li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div>
                            <h4 className="font-semibold text-green-700 mb-2">Invoice Ready!</h4>
                            <p className="text-sm text-slate-700">Your invoice looks good. ready for submission.</p>
                        </div>
                    )}

                    <div>
                        <h4 className="font-semibold text-slate-700 mb-2">Priority 2 (Review):</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                            <li>Share this report with your CA</li>
                            <li>Generate revised invoice if needed</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Estimated Savings */}
            {criticalIssues.length > 0 && (
                <Card className="p-6 border-green-200 bg-green-50 border-l-4 border-l-green-500">
                    <h3 className="text-lg font-bold mb-4 text-green-800">💰 ESTIMATED SAVINGS</h3>
                    <p className="mb-2 text-sm font-medium text-green-900">By catching these errors now:</p>
                    <ul className="space-y-2 text-sm text-green-800">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Avoided ₹500 CA review fee</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Prevented 2-7 day payment delay</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Saved potential payment hold</li>
                    </ul>
                </Card>
            )}

            {/* Footer Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="w-full" variant="outline">
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                </Button>
                <Button className="w-full" variant="outline">
                    <Share2 className="w-4 h-4 mr-2" /> Share WhatsApp
                </Button>
                <Button className="w-full" variant="outline">
                    <Mail className="w-4 h-4 mr-2" /> Email Report
                </Button>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Check Another
                </Button>
            </div>

            {/* Disclaimer */}
            <Card className="p-4 bg-yellow-50 border-yellow-200 text-xs text-muted-foreground">
                <p className="font-bold mb-1">⚠️ DISCLAIMER</p>
                <p>
                    This is an automated validation tool. Always consult a qualified Chartered Accountant for final approval before
                    GST filing. Maximum liability: ₹99 (amount paid).
                </p>
            </Card>
        </div>
    );
}
