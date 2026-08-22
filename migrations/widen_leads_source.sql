-- ─────────────────────────────────────────────────────────────────────
-- leads.source: allow 'unpaid', from the delayed-payment calculator.
--
-- REVIEW BEFORE RUNNING. This alters a CHECK constraint on an existing
-- table. It touches no RLS policy and no data.
--
-- Safe to apply at any time, and safe NOT to apply: /api/lead-capture already
-- treats an insert failure as non-fatal, so until this runs a visitor from
-- /unpaid-invoice still receives their computation and letter template, and we
-- are still notified by email. Only the stored row is lost.
--
-- Run in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────

alter table public.leads
    drop constraint if exists leads_source_check;

alter table public.leads
    add constraint leads_source_check
    check (source in ('bulk', 'check', 'unpaid'));

comment on column public.leads.source is
    'Which free tool produced the lead: bulk (CSV batch), check (single invoice), unpaid (MSMED delayed-payment calculator).';
