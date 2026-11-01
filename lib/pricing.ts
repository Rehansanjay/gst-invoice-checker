/**
 * lib/pricing.ts
 * ─────────────────────────────────────────────────────────────────────
 * The single-check price, shared by the order-creation route and every
 * place in the UI that states it.
 *
 * Previously ₹99 was hardcoded independently in `/api/quick-check` (the
 * route that actually creates the Razorpay order) and restated as copy in
 * about a dozen components and pages, with no shared source. Lowering the
 * price meant finding every string by hand, and nothing would have caught
 * a missed one — the same class of silent-drift bug `tests/pricing-consistency.ts`
 * was written to catch for the credit packs. This constant, plus that
 * test's new assertion, closes the single-check side of the same gap.
 *
 * Does not cover the legal-liability-cap text in ReportViewer.tsx and
 * emailService.ts ("Maximum liability: ₹99") — that number is a liability
 * ceiling, not this price, and is intentionally left alone here.
 */

export const SINGLE_CHECK_PRICE_RUPEES = 49;
export const SINGLE_CHECK_PRICE_PAISE = SINGLE_CHECK_PRICE_RUPEES * 100;

/**
 * Unlocking a guest's free `/bulk` batch result: full per-invoice issue
 * titles and fixes, plus a CSV export. A separate one-off price from the
 * single-check and credit-pack ladders — a batch is worth more than one
 * check but this isn't a subscription credit pack, so it doesn't belong on
 * the pack ladder tests/pricing-consistency.ts guards.
 */
export const BULK_UNLOCK_PRICE_RUPEES = 299;
export const BULK_UNLOCK_PRICE_PAISE = BULK_UNLOCK_PRICE_RUPEES * 100;
