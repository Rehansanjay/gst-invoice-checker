/**
 * lib/feedback.ts
 * ─────────────────────────────────────────────────────────────────────
 * The tools that ask "Did this help?", shared by the widget and the API.
 */

export const FEEDBACK_TOOLS = ['check', 'bulk', 'unpaid', 'verify'] as const;
export type FeedbackTool = (typeof FEEDBACK_TOOLS)[number];

export const FEEDBACK_TOOL_NAMES: Record<FeedbackTool, string> = {
    check: 'Single invoice check',
    bulk: 'Bulk check',
    unpaid: 'Unpaid invoice interest',
    verify: 'Invoice verifier',
};
