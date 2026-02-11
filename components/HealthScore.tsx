'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface HealthScoreProps {
    score: number;
    riskLevel: 'low' | 'medium' | 'high';
}

export default function HealthScore({ score, riskLevel }: HealthScoreProps) {
    const getColor = () => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getIcon = () => {
        if (score >= 90) return '✅';
        if (score >= 70) return '⚠️';
        return '🔴';
    };

    const getBadgeVariant = (): 'default' | 'secondary' | 'destructive' => {
        if (riskLevel === 'low') return 'default';
        if (riskLevel === 'medium') return 'secondary';
        return 'destructive';
    };

    const getRiskLabel = () => {
        if (riskLevel === 'low') return 'Low Risk';
        if (riskLevel === 'medium') return 'Medium Risk';
        return 'High Risk';
    };

    const getMessage = () => {
        if (score >= 90) return 'Great! Your invoice looks good.';
        if (score >= 70) return 'Some issues need attention before submission.';
        return 'Critical issues detected. Fix before submitting.';
    };

    return (
        <Card className="p-8">
            <div className="text-center space-y-4">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Invoice Health Score</h2>
                    <Badge variant={getBadgeVariant()}>{getRiskLabel()}</Badge>
                </div>

                <div className={`text-7xl font-bold ${getColor()}`}>
                    {getIcon()} {score}/100
                </div>

                <Progress value={score} className="h-4" />

                <p className="text-muted-foreground">{getMessage()}</p>
            </div>
        </Card>
    );
}
