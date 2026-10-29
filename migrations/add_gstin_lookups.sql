-- ─────────────────────────────────────────────────────────────────────
-- gstin_lookups: cached live GSTIN status, keyed by GSTIN
--
-- Backs lib/services/gstinStatusService.ts, used in the paid full-report
-- flow (checkProcessingService.ts) after payment, never in the free
-- InvoiceVerifier widget — that's an unauthenticated tool with no paywall,
-- and a live lookup costs money per call.
--
-- 7-day TTL: a supplier's registration status and filing record do not
-- change minute to minute, and this is what keeps repeat checks on the
-- same vendor free of a new API call.
--
-- REVIEW BEFORE RUNNING. Per CLAUDE.md, RLS changes are yours to approve —
-- nothing here has been applied. Run in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.gstin_lookups (
    gstin           text primary key,
    legal_name      text,
    status          text check (status in ('Active', 'Cancelled', 'Suspended', 'Unknown')),
    taxpayer_type   text check (taxpayer_type in ('Regular', 'Composition', 'Unknown')),
    last_filed_at   timestamptz,
    fetched_at      timestamptz not null default now(),
    expires_at      timestamptz not null default (now() + interval '7 days')
);

create index if not exists gstin_lookups_expires_at_idx on public.gstin_lookups (expires_at);

alter table public.gstin_lookups enable row level security;

-- No policy grants access to anon or authenticated roles — readable and
-- writable only via the service role key used server-side by
-- gstinStatusService.ts (same pattern as public.leads). Nothing in the
-- client application queries this table directly.

comment on table public.gstin_lookups is
    'Cached live GSTIN status (7-day TTL), used by the paid full-report flow. Service-role access only.';
