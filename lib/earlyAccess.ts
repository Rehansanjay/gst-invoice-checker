/**
 * lib/earlyAccess.ts
 * ─────────────────────────────────────────────────────────────────────
 * Early-access tests for products that are not built yet, shared by the
 * form and the API.
 *
 * Same method as Vendor GST Watch (lib/watch.ts): the page says plainly
 * that nothing exists yet, and the sign-up asks one sizing question and
 * one price question. An email alone says "curious"; a "yes" at a stated
 * price says "buyer". Whichever test gets more yeses gets built first.
 */

export const EARLY_ACCESS_PRODUCTS = ['recon', 'notice'] as const;
export type EarlyAccessProduct = (typeof EARLY_ACCESS_PRODUCTS)[number];

export const PRICE_ANSWERS = ['yes', 'maybe', 'no'] as const;
export type PriceAnswer = (typeof PRICE_ANSWERS)[number];

/** GSTR-2B reconciliation: how many GSTINs are reconciled each month. */
export const RECON_PRICE_RUPEES = 999;
export const RECON_GSTIN_BANDS = ['1', '2-10', '11-50', '50+'] as const;

/** GST notice help: which notice the visitor is holding. */
export const NOTICE_PRICE_RUPEES = 499;
export const NOTICE_TYPES = ['ASMT-10', 'DRC-01A', 'DRC-01 / SCN', 'Other / not sure'] as const;

export interface EarlyAccessConfig {
    name: string;
    priceLabel: string;
    sizeQuestion: string;
    sizeOptions: readonly string[];
}

export const EARLY_ACCESS: Record<EarlyAccessProduct, EarlyAccessConfig> = {
    recon: {
        name: 'GSTR-2B Reconciliation',
        priceLabel: `₹${RECON_PRICE_RUPEES}/month`,
        sizeQuestion: 'How many GSTINs do you reconcile each month?',
        sizeOptions: RECON_GSTIN_BANDS,
    },
    notice: {
        name: 'GST Notice Help',
        priceLabel: `₹${NOTICE_PRICE_RUPEES} per notice`,
        sizeQuestion: 'Which notice have you received?',
        sizeOptions: NOTICE_TYPES,
    },
};
