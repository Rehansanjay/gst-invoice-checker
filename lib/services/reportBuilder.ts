import { ValidationResult, ValidationIssue } from '@/types';

/**
 * Report Builder — Single source of truth for structured reports
 * Used by: UI (ReportViewer), PDF generation, Email templates
 */

export interface StructuredReport {
    summary: ReportSummary;
    sections: ReportSection[];
    disclaimer: string;
    generatedAt: string;
}

export interface ReportSummary {
    checkId: string;
    healthScore: number;
    riskLevel: string;
    totalIssues: number;
    criticalCount: number;
    warningCount: number;
    passedCount: number;
    processingTimeMs: number;
    verdict: string;
}

export interface ReportSection {
    title: string;
    type: 'critical' | 'warning' | 'passed';
    icon: string;
    items: ReportItem[];
}

export interface ReportItem {
    title: string;
    description: string;
    severity?: string;
    location?: string;
    expected?: string | number;
    found?: string | number;
    difference?: number;
    howToFix?: string;
    impact?: string;
    gstLawContext?: string;
}

/** Build structured report from validation result */
export function buildReport(result: ValidationResult): StructuredReport {
    const critical = result.issuesFound.filter(i => i.severity === 'critical');
    const warnings = result.issuesFound.filter(i => i.severity === 'warning');

    const sections: ReportSection[] = [];

    if (critical.length > 0) {
        sections.push({
            title: `Critical Issues (${critical.length})`,
            type: 'critical',
            icon: '🔴',
            items: critical.map(issueToReportItem),
        });
    }

    if (warnings.length > 0) {
        sections.push({
            title: `Warnings (${warnings.length})`,
            type: 'warning',
            icon: '🟡',
            items: warnings.map(issueToReportItem),
        });
    }

    sections.push({
        title: `Checks Passed (${result.checksPassed.length})`,
        type: 'passed',
        icon: '✅',
        items: result.checksPassed.map(check => ({
            title: check.title,
            description: check.description,
        })),
    });

    return {
        summary: {
            checkId: result.checkId,
            healthScore: result.healthScore,
            riskLevel: result.riskLevel,
            totalIssues: result.issuesFound.length,
            criticalCount: critical.length,
            warningCount: warnings.length,
            passedCount: result.checksPassed.length,
            processingTimeMs: result.processingTimeMs,
            verdict: getVerdict(result.healthScore, result.riskLevel),
        },
        sections,
        disclaimer: 'This validation is based on user-entered data. Verify with a qualified CA before GST filing. Not a substitute for professional tax advice. Maximum liability: ₹99.',
        generatedAt: result.timestamp,
    };
}

/** Convert issue to report item */
function issueToReportItem(issue: ValidationIssue): ReportItem {
    return {
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        location: issue.location,
        expected: issue.expected,
        found: issue.found,
        difference: issue.difference,
        howToFix: issue.howToFix,
        impact: issue.impact,
        gstLawContext: issue.gstLawContext,
    };
}

/** Generate human-readable verdict */
function getVerdict(score: number, riskLevel: string): string {
    if (score >= 95) return 'Excellent! Invoice is GST-compliant and ready for submission.';
    if (score >= 85) return 'Good overall, but fix the warnings before filing.';
    if (score >= 70) return 'Several issues found. Fix critical issues before submitting.';
    if (score >= 50) return 'Significant problems detected. Invoice needs major corrections.';
    return 'Invoice has critical compliance failures. Do NOT submit without fixing all issues.';
}

/** Generate plain text report (for email/PDF) */
export function buildPlainTextReport(result: ValidationResult): string {
    const report = buildReport(result);
    const lines: string[] = [];

    lines.push(`═══ GST INVOICE VALIDATION REPORT ═══`);
    lines.push(`Check ID: ${report.summary.checkId}`);
    lines.push(`Health Score: ${report.summary.healthScore}/100 (${report.summary.riskLevel} risk)`);
    lines.push(`Verdict: ${report.summary.verdict}`);
    lines.push(`Processed in: ${report.summary.processingTimeMs}ms`);
    lines.push('');

    report.sections.forEach(section => {
        lines.push(`─── ${section.icon} ${section.title} ───`);
        section.items.forEach((item, i) => {
            lines.push(`  ${i + 1}. ${item.title}`);
            if (item.description) lines.push(`     ${item.description}`);
            if (item.howToFix) lines.push(`     Fix: ${item.howToFix}`);
            if (item.gstLawContext) lines.push(`     Law: ${item.gstLawContext}`);
        });
        lines.push('');
    });

    lines.push(report.disclaimer);
    return lines.join('\n');
}
