-- ─────────────────────────────────────────────────────────────────────
-- leads: email capture from the FREE tools (/bulk and /check)
--
-- REVIEW BEFORE RUNNING. This creates a table and defines RLS policies.
-- Per CLAUDE.md, RLS changes are yours to approve — nothing here has been
-- applied. /api/lead-capture treats a missing table as non-fatal (it still
-- sends the report and still emails you the lead), so applying this is safe
-- to do whenever you are ready.
--
-- Run in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.leads (
    id           uuid primary key default gen_random_uuid(),
    email        text        not null,
    source       text        not null check (source in ('bulk', 'check')),
    detail       text,
    utm_source   text,
    utm_campaign text,
    ip           text,
    created_at   timestamptz not null default now()
);

-- The list is queried by recency and deduplicated by address.
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_email_idx      on public.leads (email);

alter table public.leads enable row level security;

-- No policy grants access to anon or authenticated roles, so the table is
-- readable only via the service role key used server-side by
-- /api/lead-capture and by you in the Supabase dashboard. Deliberate: these
-- are contact details for people who have not created an account, and nothing
-- in the client application needs to read them.
--
-- If you later build an admin view, add a policy scoped to your own user id
-- rather than opening this to `authenticated`.

comment on table public.leads is
    'Email captures from the free bulk/single check tools. Service-role access only.';
