/**
 * lib/services/gstinStatusService.ts
 * ─────────────────────────────────────────────────────────────────────
 * Live GSTIN status — Active/Cancelled/Suspended, legal name, Regular vs.
 * Composition, last filing — cache-first against `gstin_lookups` (7-day
 * TTL, migrations/add_gstin_lookups.sql), with an env-driven provider
 * adapter behind it.
 *
 * Used only by the paid full-report flow (checkProcessingService.ts),
 * never by the free InvoiceVerifier homepage widget — that tool has no
 * paywall, so a live lookup there would spend money with zero revenue
 * attached and cannibalize the thing this app actually sells.
 *
 * No GSTIN_API_KEY is configured yet, and no provider has been chosen —
 * this ships as a pluggable scaffold that degrades to an explicit
 * "offline" result (never a thrown error, never a guess dressed up as
 * data) until both are set. Swapping providers later means adding a case
 * to `callProvider`, not touching the cache or the call site.
 */

import { supabaseAdmin } from '@/lib/supabase-admin';

export type GstinLiveStatus = 'Active' | 'Cancelled' | 'Suspended' | 'Unknown';
export type GstinTaxpayerType = 'Regular' | 'Composition' | 'Unknown';

export interface GstinStatusResult {
    gstin: string;
    /** Where this answer came from — lets callers decide whether to show it. */
    source: 'cache' | 'live' | 'offline';
    status?: GstinLiveStatus;
    legalName?: string;
    taxpayerType?: GstinTaxpayerType;
    lastFiledAt?: string | null;
    fetchedAt?: string;
}

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface GstinLookupRow {
    gstin: string;
    legal_name: string | null;
    status: GstinLiveStatus | null;
    taxpayer_type: GstinTaxpayerType | null;
    last_filed_at: string | null;
    fetched_at: string;
    expires_at: string;
}

function rowToResult(row: GstinLookupRow): GstinStatusResult {
    return {
        gstin: row.gstin,
        source: 'cache',
        status: row.status ?? 'Unknown',
        legalName: row.legal_name ?? undefined,
        taxpayerType: row.taxpayer_type ?? 'Unknown',
        lastFiledAt: row.last_filed_at,
        fetchedAt: row.fetched_at,
    };
}

/**
 * Calls whichever provider GSTIN_API_PROVIDER names, using GSTIN_API_KEY.
 * Returns null — never throws — on a missing key, an unrecognised
 * provider, or any network/parse failure, so a bad response degrades to
 * the offline result rather than breaking the check.
 */
async function callProvider(gstin: string): Promise<Omit<GstinStatusResult, 'gstin' | 'source'> | null> {
    const apiKey = process.env.GSTIN_API_KEY;
    const provider = process.env.GSTIN_API_PROVIDER;

    if (!apiKey || !provider) return null;

    try {
        switch (provider) {
            // Each case owns its own request shape and response mapping.
            // Add a new provider by adding a case here — the cache and the
            // call site never need to change.
            case 'sandbox': {
                const res = await fetch(`https://api.sandbox.co.in/gsp/public/gstin/${gstin}/details`, {
                    headers: { Authorization: `Bearer ${apiKey}` },
                });
                if (!res.ok) return null;
                const data = await res.json();
                return {
                    status: normaliseStatus(data?.status ?? data?.data?.sts),
                    legalName: data?.legalName ?? data?.data?.lgnm ?? undefined,
                    taxpayerType: normaliseTaxpayerType(data?.taxpayerType ?? data?.data?.dty),
                    lastFiledAt: data?.lastFiledAt ?? null,
                };
            }
            default:
                console.warn(`[gstinStatusService] Unknown GSTIN_API_PROVIDER: ${provider}`);
                return null;
        }
    } catch (err) {
        console.error('[gstinStatusService] Provider call failed:', err);
        return null;
    }
}

function normaliseStatus(raw: unknown): GstinLiveStatus {
    const s = String(raw ?? '').toLowerCase();
    if (s.includes('active')) return 'Active';
    if (s.includes('cancel')) return 'Cancelled';
    if (s.includes('suspend')) return 'Suspended';
    return 'Unknown';
}

function normaliseTaxpayerType(raw: unknown): GstinTaxpayerType {
    const s = String(raw ?? '').toLowerCase();
    if (s.includes('composition')) return 'Composition';
    if (s.includes('regular')) return 'Regular';
    return 'Unknown';
}

/**
 * Cache-first GSTIN status lookup. Best-effort: a cache or provider
 * failure returns an "offline" result rather than throwing, so this can
 * never be what breaks a paid report from generating.
 */
export async function getGstinStatus(gstin: string): Promise<GstinStatusResult> {
    const normalised = gstin.trim().toUpperCase();

    try {
        const { data: cached } = await supabaseAdmin
            .from('gstin_lookups')
            .select('*')
            .eq('gstin', normalised)
            .gte('expires_at', new Date().toISOString())
            .maybeSingle();

        if (cached) return rowToResult(cached as GstinLookupRow);
    } catch (err) {
        console.error('[gstinStatusService] Cache read failed:', err);
    }

    const live = await callProvider(normalised);
    if (!live) {
        return { gstin: normalised, source: 'offline' };
    }

    const fetchedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

    try {
        await supabaseAdmin.from('gstin_lookups').upsert({
            gstin: normalised,
            legal_name: live.legalName ?? null,
            status: live.status ?? 'Unknown',
            taxpayer_type: live.taxpayerType ?? 'Unknown',
            last_filed_at: live.lastFiledAt ?? null,
            fetched_at: fetchedAt,
            expires_at: expiresAt,
        });
    } catch (err) {
        // Cache write failing must never discard a live answer we already have.
        console.error('[gstinStatusService] Cache write failed:', err);
    }

    return { gstin: normalised, source: 'live', ...live, fetchedAt };
}
