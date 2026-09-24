/**
 * lib/watch.ts
 * ─────────────────────────────────────────────────────────────────────
 * Vendor GST Watch — early-access test, shared by the form and the API.
 *
 * Not a product yet. The page takes sign-ups with two answers (how many
 * suppliers, would ₹499/month be worth it) and nothing is charged or
 * monitored. Those answers are the evidence for whether to build it;
 * an email alone says "curious", a "yes" at a stated price says "buyer".
 */

export const WATCH_PRICE_RUPEES = 499;

export const WATCH_SUPPLIER_BANDS = ['1-10', '11-50', '51-200', '200+'] as const;
export type WatchSupplierBand = (typeof WATCH_SUPPLIER_BANDS)[number];

export const WATCH_PRICE_ANSWERS = ['yes', 'maybe', 'no'] as const;
export type WatchPriceAnswer = (typeof WATCH_PRICE_ANSWERS)[number];
