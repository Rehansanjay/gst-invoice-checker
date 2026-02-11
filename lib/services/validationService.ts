import { ParsedInvoice, ValidationResult, ValidationCheck } from '@/types';
import { ALL_RULES } from './validationRules';
import { normalizeInvoice, generateInvoiceHash } from './normalizeInvoice';
import { calculateHealthScore, determineRiskLevel, getScoreBreakdown, generateCheckId } from './scoreEngine';

/**
 * Validation Service — Orchestrator
 * Pipeline: Normalize → Hash (idempotency) → Parallel Execute → Score → Result
 */

// In-memory cache for idempotent validation (production: use Redis/DB)
const resultCache = new Map<string, ValidationResult>();

export async function validateInvoice(rawInvoice: ParsedInvoice): Promise<ValidationResult> {
    const startTime = Date.now();

    // Step 1: Normalize input data
    const invoice = normalizeInvoice(rawInvoice);

    // Step 2: Generate hash for idempotency check
    const invoiceHash = generateInvoiceHash(invoice);

    // Step 3: Check cache — return early if same invoice was already validated
    const cached = resultCache.get(invoiceHash);
    if (cached) {
        return { ...cached, processingTimeMs: 0 };
    }

    // Step 4: Execute ALL rules in parallel
    const ruleResults = await Promise.all(
        ALL_RULES.map(async (rule) => {
            try {
                return rule.execute(invoice);
            } catch (error) {
                console.error(`Rule ${rule.id} failed:`, error);
                return [];
            }
        })
    );

    // Flatten all issues from all rules
    const issues = ruleResults.flat();

    // Step 5: Determine passed checks (rules that returned no issues)
    const passed: ValidationCheck[] = [];
    const failedCategories = new Set(issues.map(i => i.category));

    ALL_RULES.forEach(rule => {
        const ruleIssues = issues.filter(i => i.ruleId === rule.id);
        if (ruleIssues.length === 0) {
            passed.push({
                id: rule.id,
                category: rule.category,
                title: `${rule.name} ✓`,
                description: `Passed — ${rule.gstLawRef || 'Verified'}`,
            });
        }
    });

    // Step 6: Calculate score using independent score engine
    const healthScore = calculateHealthScore(issues);
    const riskLevel = determineRiskLevel(healthScore, issues);
    const scoreBreakdown = getScoreBreakdown(issues);
    const processingTimeMs = Date.now() - startTime;

    const result: ValidationResult = {
        checkId: generateCheckId(),
        invoiceHash,
        healthScore,
        riskLevel,
        issuesFound: issues,
        checksPassed: passed,
        scoreBreakdown,
        processingTimeMs,
        timestamp: new Date().toISOString(),
    };

    // Step 7: Cache result for idempotency
    resultCache.set(invoiceHash, result);

    // Keep cache manageable (max 1000 entries)
    if (resultCache.size > 1000) {
        const firstKey = resultCache.keys().next().value;
        if (firstKey) resultCache.delete(firstKey);
    }

    return result;
}
