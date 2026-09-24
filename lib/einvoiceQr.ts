/**
 * lib/einvoiceQr.ts
 * ─────────────────────────────────────────────────────────────────────
 * Reads the signed QR code printed on a GST e-invoice.
 *
 * WHAT THE QR IS
 *
 * When a supplier registers a B2B invoice on an Invoice Registration
 * Portal (IRP), the IRP returns a QR code holding a JWT: a header, a
 * payload and an RSA signature. The payload carries eight facts about the
 * invoice (both GSTINs, number, date, value, item count, main HSN) plus
 * the 64-character IRN, and `iss` names the IRP that signed it.
 *
 * WHAT THIS DOES NOT DO — AND WHY
 *
 * It decodes and cross-checks; it does not verify the RSA signature.
 * Verifying needs the signing IRP's current public key. NIC hands its
 * production key only to logged-in API users, and the private IRPs rotate
 * theirs (IRIS's listed key expired June 2026). A "signature verified"
 * badge backed by a stale or second-hand key would be worse than none, so
 * the result says plainly that the signature is unchecked and points to
 * the government's own verifier app, which does check it.
 *
 * What decoding alone still catches: a QR that is not an e-invoice QR at
 * all, a payload whose GSTINs fail their checksum, a malformed IRN, and —
 * the one that matters most — values that differ from the ones printed on
 * the paper invoice, which the page asks the reader to compare.
 */

import { readGstin, type GstinReading } from './gstin';

export interface EInvoiceQrFields {
    sellerGstin: string;
    buyerGstin: string;
    docNo: string;
    docType: string;
    docDate: string;
    totalValue: number | null;
    itemCount: number | null;
    mainHsn: string;
    irn: string;
    irnDate: string;
    issuer: string;
}

export type QrReading =
    | { kind: 'einvoice'; fields: EInvoiceQrFields; seller: GstinReading; buyer: GstinReading | null; problems: string[] }
    | { kind: 'upi'; note: string }
    | { kind: 'not-einvoice'; note: string };

const IRN_SHAPE = /^[0-9a-f]{64}$/i;

function base64UrlToText(part: string): string {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function str(v: unknown): string {
    return v === undefined || v === null ? '' : String(v);
}

function num(v: unknown): number | null {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
}

export function readEInvoiceQr(raw: string): QrReading {
    const text = raw.trim();

    if (/^upi:\/\//i.test(text)) {
        return {
            kind: 'upi',
            note: 'This is a UPI payment QR, not an e-invoice QR. B2C invoices often carry one, and it only tells you where the money goes, not whether the invoice was registered.',
        };
    }

    const parts = text.split('.');
    if (parts.length !== 3) {
        return {
            kind: 'not-einvoice',
            note: 'This QR is not a GST e-invoice QR. An e-invoice QR is a long signed code issued by the government invoice portal. Not every invoice needs one: e-invoicing applies to B2B invoices from suppliers above the turnover limit.',
        };
    }

    let payload: Record<string, unknown>;
    try {
        payload = JSON.parse(base64UrlToText(parts[1]));
    } catch {
        return { kind: 'not-einvoice', note: 'This QR looks like a signed token but its contents could not be read, so it is not a GST e-invoice QR.' };
    }

    // NIC puts the invoice facts in `data` as a JSON string; accept an object too.
    let data: Record<string, unknown> = {};
    try {
        data = typeof payload.data === 'string' ? JSON.parse(payload.data) : ((payload.data as Record<string, unknown>) ?? {});
    } catch {
        data = {};
    }

    if (!data.SellerGstin && !data.Irn) {
        return { kind: 'not-einvoice', note: 'This QR is a signed token, but it does not carry GST e-invoice details.' };
    }

    const fields: EInvoiceQrFields = {
        sellerGstin: str(data.SellerGstin),
        buyerGstin: str(data.BuyerGstin),
        docNo: str(data.DocNo),
        docType: str(data.DocTyp),
        docDate: str(data.DocDt),
        totalValue: num(data.TotInvVal),
        itemCount: num(data.ItemCnt),
        mainHsn: str(data.MainHsnCode),
        irn: str(data.Irn),
        irnDate: str(data.IrnDt),
        issuer: str(payload.iss),
    };

    const problems: string[] = [];
    const seller = readGstin(fields.sellerGstin);
    if (!seller.valid) problems.push(`The supplier GSTIN inside the QR fails its own checks: ${seller.problems.join(' ')}`);

    // Buyer GSTIN is "URP" (unregistered) for some exports and supplies.
    const buyer = fields.buyerGstin && fields.buyerGstin.toUpperCase() !== 'URP' ? readGstin(fields.buyerGstin) : null;
    if (buyer && !buyer.valid) problems.push(`The buyer GSTIN inside the QR fails its own checks: ${buyer.problems.join(' ')}`);

    if (!IRN_SHAPE.test(fields.irn)) problems.push('The IRN is not the 64-character code the portal issues.');
    if (!fields.issuer) problems.push('The QR does not say which invoice portal issued it.');

    return { kind: 'einvoice', fields, seller, buyer, problems };
}

/** Government e-invoice verifier app, which does check the signature. */
export const OFFICIAL_QR_VERIFIER_URL = 'https://einvoice1.gst.gov.in/Others/QRCodeVerifyApp';
