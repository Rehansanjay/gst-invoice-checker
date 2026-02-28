/**
 * lib/rateLimit.ts
 * ─────────────────────────────────────────────────────────────────────
 * Lightweight in-memory rate limiter.
 * Uses a sliding-window counter keyed on IP + route.
 *
 * ⚠️  Resets on serverless cold starts (acceptable for early-stage).
 *     For high-traffic production, swap the Map store for Upstash Redis.
 */

interface Window {
    count: number;
    resetAt: number;
}

// Global store: key → { count, resetAt }
const store = new Map<string, Window>();

export interface RateLimitConfig {
    /** Max requests allowed within `windowMs` */
    limit: number;
    /** Window duration in milliseconds */
    windowMs: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

/**
 * Check whether the given `ip` + `route` combination is within rate limit.
 * Call this at the top of your API route or middleware.
 */
export function checkRateLimit(
    ip: string,
    route: string,
    config: RateLimitConfig
): RateLimitResult {
    const key = `${route}:${ip}`;
    const now = Date.now();

    const existing = store.get(key);

    // If no entry or window expired → create fresh window
    if (!existing || now > existing.resetAt) {
        const resetAt = now + config.windowMs;
        store.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: config.limit - 1, resetAt };
    }

    // Within window
    if (existing.count >= config.limit) {
        return { allowed: false, remaining: 0, resetAt: existing.resetAt };
    }

    existing.count += 1;
    return {
        allowed: true,
        remaining: config.limit - existing.count,
        resetAt: existing.resetAt,
    };
}

/** Periodically purge expired entries to avoid memory leak. */
setInterval(() => {
    const now = Date.now();
    for (const [key, win] of store.entries()) {
        if (now > win.resetAt) store.delete(key);
    }
}, 60_000);
