import { ValidationIssue } from '@/types';

/**
 * Independent Score Engine
 * Separated from validationService for easy tuning and A/B testing.
 */

/** Configurable weights for scoring */
export interface ScoreConfig {
    criticalWeight: number;
    warningWeight: number;
    infoWeight: number;
    maxScore: number;
}

const DEFAULT_CONFIG: ScoreConfig = {
    criticalWeight: 15,
    warningWeight: 5,
    infoWeight: 2,
    maxScore: 100,
};

/** Calculate health score from issues using configurable weights */
export function calculateHealthScore(
    issues: ValidationIssue[],
    config: ScoreConfig = DEFAULT_CONFIG
): number {
    let score = config.maxScore;

    issues.forEach(issue => {
        switch (issue.severity) {
            case 'critical':
                score -= config.criticalWeight;
                break;
            case 'warning':
                score -= config.warningWeight;
                break;
            case 'info':
                score -= config.infoWeight;
                break;
        }
    });

    return Math.max(0, Math.min(config.maxScore, score));
}

/** Determine risk level from score and issues */
export function determineRiskLevel(
    score: number,
    issues: ValidationIssue[]
): 'low' | 'medium' | 'high' {
    const hasCritical = issues.some(i => i.severity === 'critical');

    if (hasCritical || score < 70) return 'high';
    if (score < 90) return 'medium';
    return 'low';
}

/** Get score breakdown for analytics */
export function getScoreBreakdown(issues: ValidationIssue[], config: ScoreConfig = DEFAULT_CONFIG) {
    const critical = issues.filter(i => i.severity === 'critical');
    const warnings = issues.filter(i => i.severity === 'warning');
    const info = issues.filter(i => i.severity === 'info');

    return {
        totalIssues: issues.length,
        criticalCount: critical.length,
        warningCount: warnings.length,
        infoCount: info.length,
        criticalDeduction: critical.length * config.criticalWeight,
        warningDeduction: warnings.length * config.warningWeight,
        infoDeduction: info.length * config.infoWeight,
        totalDeduction: (critical.length * config.criticalWeight) +
            (warnings.length * config.warningWeight) +
            (info.length * config.infoWeight),
    };
}

/** Generate check ID */
export function generateCheckId(): string {
    return `IC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}
