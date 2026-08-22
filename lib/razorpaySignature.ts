import crypto from 'crypto';

/**
 * lib/razorpaySignature.ts
 * ─────────────────────────────────────────────────────────────────────
 * Verifies that a Razorpay payment really happened.
 *
 * This is the only thing standing between "somebody posted a JSON body" and
 * "we hand over a paid document", so it is pulled out of the route to be
 * unit-testable. Inline in a handler it could only ever be exercised through
 * HTTP, which needs a live secret and therefore never gets tested at all.
 *
 * Two details that are easy to get wrong and hard to notice:
 *
 *   - `crypto.timingSafeEqual` THROWS when the buffers differ in length. A
 *     forged signature of the wrong length would take down the handler rather
 *     than being rejected, so the length is checked first.
 *   - A plain `===` leaks timing on a value the caller controls and can retry
 *     without limit. The comparison is constant-time once lengths match.
 */

export interface SignatureCheck {
    valid: boolean;
    /** Why it failed, for the log. Never returned to the caller. */
    reason?: 'NO_SECRET' | 'LENGTH_MISMATCH' | 'DIGEST_MISMATCH' | 'MALFORMED';
}

/**
 * Razorpay signs `${orderId}|${paymentId}` with the key secret, HMAC-SHA256,
 * hex encoded.
 */
export function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
    secret: string | undefined,
): SignatureCheck {
    if (!secret) return { valid: false, reason: 'NO_SECRET' };
    if (!orderId || !paymentId || !signature) return { valid: false, reason: 'MALFORMED' };

    // A hex digest of anything else cannot be a valid signature, and feeding
    // non-hex into the length check below would be misleading.
    if (!/^[0-9a-f]+$/i.test(signature)) return { valid: false, reason: 'MALFORMED' };

    const expected = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    if (expected.length !== signature.length) return { valid: false, reason: 'LENGTH_MISMATCH' };

    const equal = crypto.timingSafeEqual(
        Buffer.from(expected, 'utf8'),
        Buffer.from(signature.toLowerCase(), 'utf8'),
    );
    return equal ? { valid: true } : { valid: false, reason: 'DIGEST_MISMATCH' };
}

/** Produces the signature Razorpay would send. Test helper, not used in app code. */
export function signForTest(orderId: string, paymentId: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}
