'use client';

import { ValidationResult } from '@/types';
import HealthScore from './HealthScore';
import IssueCard from './IssueCard';
import { Card } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ReportViewerProps {
    result: ValidationResult;
}

export default function ReportViewer({ result }: ReportViewerProps) {
    const criticalIssues = result.issuesFound.filter(i => i.severity === 'critical');
    const warningIssues = result.issuesFound.filter(i => i.severity === 'warning');

    return (
        <div className="space-y-6">
            <HealthScore score={result.healthScore} riskLevel={result.riskLevel} />

            {criticalIssues.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-4 text-red-600">
                        🔴 Critical Issues ({criticalIssues.length})
                    </h3>
                    <div className="space-y-4">
                        {criticalIssues.map((issue) => (
                            <IssueCard key={issue.id} issue={issue} />
                        ))}
                    </div>
                </div>
            )}

            {warningIssues.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-4 text-yellow-600">
                        🟡 Warnings ({warningIssues.length})
                    </h3>
                    <div className="space-y-4">
                        {warningIssues.map((issue) => (
                            <IssueCard key={issue.id} issue={issue} />
                        ))}
                    </div>
                </div>
            )}

            <Separator />

            <div>
                <h3 className="text-xl font-bold mb-4 text-green-600">
                    ✅ Checks Passed ({result.checksPassed.length})
                </h3>
                <Card className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {result.checksPassed.map((check) => (
                            <div key={check.id} className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span className="text-sm">{check.title}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card className="p-6 bg-yellow-50 border-yellow-200">
                <h4 className="font-semibold mb-2">⚠️ DISCLAIMER</h4>
                <p className="text-sm text-muted-foreground">
                    This validation is based on the data you entered. We recommend final verification
                    with a qualified Chartered Accountant before GST filing. This tool is not a substitute
                    for professional tax advice. Maximum liability: ₹99 (amount paid for this check).
                </p>
            </Card>
        </div>
    );
}
