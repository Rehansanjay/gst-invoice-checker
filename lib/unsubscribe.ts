import crypto from 'crypto';

/**
 * lib/unsubscribe.ts
 * ─────────────────────────────────────────────────────────────────────
 * One-click unsubscribe links for the filing-deadline reminders.
 *
 * The token is an HMAC of the address, so a link only ever unsubscribes the
 * person it was sent to — without it, anyone could unsubscribe an arbitrary
 * address by editing the query string.
 */

function secret(): string {
    // Reuses an existing server secret rather than requiring a new env var.
    const s = process.env.INTERNAL_API_SECRET || process.env.CRON_SECRET;
    if (!s) throw new Error('No INTERNAL_API_SECRET or CRON_SECRET set for unsubscribe tokens');
    return s;
}

export function unsubscribeToken(email: string): string {
    return crypto
        .createHmac('sha256', secret())
        .update(email.trim().toLowerCase())
        .digest('hex')
        .slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
    try {
        const expected = unsubscribeToken(email);
        const a = Buffer.from(expected);
        const b = Buffer.from(token);
        // Constant-time compare; timingSafeEqual throws on length mismatch.
        return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
        return false;
    }
}

export function unsubscribeUrl(email: string, appUrl: string): string {
    const e = encodeURIComponent(email.trim().toLowerCase());
    return `${appUrl}/unsubscribe?email=${e}&token=${unsubscribeToken(email)}`;
}
