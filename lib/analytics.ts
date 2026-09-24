/**
 * lib/analytics.ts
 * ─────────────────────────────────────────────────────────────────────
 * Funnel events for GA4.
 *
 * WHY THIS EXISTS
 *
 * GA4 only recorded page views, so it could say ~376 people a month
 * arrive but not whether any of them ran a check, saw the ₹99 unlock,
 * opened checkout, or walked away at the payment sheet. Each event below
 * marks one step, so the drop-off between steps is visible.
 *
 * The events carry no invoice data: no GSTINs, names, amounts or
 * emails. Only which step happened, and counts where they explain it.
 *
 * `purchase` uses GA4's recommended ecommerce shape (transaction_id,
 * value, currency), so revenue shows up in GA's own reports.
 */

import { sendGAEvent } from '@next/third-parties/google';

export type FunnelEvent =
    | 'check_submitted'
    | 'check_completed'
    | 'check_failed'
    | 'unlock_clicked'
    | 'checkout_opened'
    | 'checkout_dismissed'
    | 'payment_failed'
    | 'purchase'
    | 'bulk_check_completed'
    | 'verify_gstin'
    | 'verify_qr'
    | 'verify_full_check_clicked'
    | 'watch_signup';

type Params = Record<string, string | number | boolean | undefined>;

export function track(event: FunnelEvent, params: Params = {}): void {
    // Analytics must never break the page it is measuring.
    try {
        sendGAEvent('event', event, params);
    } catch {
        // ignore
    }
}

export function trackPurchase(item: string, transactionId: string, valueRupees: number): void {
    track('purchase', {
        transaction_id: transactionId,
        value: valueRupees,
        currency: 'INR',
        item,
    });
}
