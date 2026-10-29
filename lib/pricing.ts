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
