'use client';

import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ValidationIssue } from '@/types';

interface IssueCardProps {
    issue: ValidationIssue;
}

export default function IssueCard({ issue }: IssueCardProps) {
    const getIcon = () => {
        if (issue.severity === 'critical') return <AlertCircle className="w-5 h-5 text-red-500" />;
        if (issue.severity === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        return <Info className="w-5 h-5 text-blue-500" />;
    };

    const getBadgeVariant = (): 'destructive' | 'secondary' | 'default' => {
        if (issue.severity === 'critical') return 'destructive';
        if (issue.severity === 'warning') return 'secondary';
        return 'default';
    };

    const getBorderColor = () => {
        if (issue.severity === 'critical') return 'border-l-red-500';
        if (issue.severity === 'warning') return 'border-l-yellow-500';
        return 'border-l-blue-500';
    };

    return (
        <Card className={`p-4 border-l-4 ${getBorderColor()}`}>
            <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">{getIcon()}</div>

                <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold">{issue.title}</h4>
                        <Badge variant={getBadgeVariant()} className="flex-shrink-0">
                            {issue.severity.toUpperCase()}
                        </Badge>
                    </div>

                    {issue.location && (
                        <p className="text-sm text-muted-foreground">{issue.location}</p>
                    )}

                    <p className="text-sm">{issue.description}</p>

                    {(issue.expected || issue.found) && (
                        <div className="grid grid-cols-2 gap-2 text-sm bg-muted p-2 rounded">
                            {issue.expected && (
                                <div>
                                    <span className="font-medium">Expected:</span>
                                    <p className="text-muted-foreground">{issue.expected}</p>
                                </div>
                            )}
                            {issue.found && (
                                <div>
                                    <span className="font-medium">Found:</span>
                                    <p className="text-muted-foreground">{issue.found}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {issue.difference !== undefined && issue.difference > 0 && (
                        <div className="text-sm bg-red-50 text-red-700 p-2 rounded">
                            <span className="font-medium">Difference:</span> ₹{issue.difference.toFixed(2)}
                        </div>
                    )}

                    <div className="bg-blue-50 p-3 rounded space-y-1">
                        <p className="font-medium text-sm text-blue-900">💡 How to Fix:</p>
                        <p className="text-sm text-blue-800">{issue.howToFix}</p>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded">
                        <p className="font-medium text-sm text-yellow-900">⚠️ Impact:</p>
                        <p className="text-sm text-yellow-800">{issue.impact}</p>
                    </div>

                    {issue.gstLawContext && (
                        <div className="bg-purple-50 p-3 rounded">
                            <p className="font-medium text-sm text-purple-900">📖 GST Law Reference:</p>
                            <p className="text-sm text-purple-800">{issue.gstLawContext}</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
