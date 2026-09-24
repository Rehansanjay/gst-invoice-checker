-- ─────────────────────────────────────────────────────────────────────
-- leads.source: allow 'watch', the Vendor GST Watch early-access list.
--
-- REVIEW BEFORE RUNNING. This alters a CHECK constraint on an existing
-- table. It touches no RLS policy and no data.
--
-- Safe to apply at any time, and safe NOT to apply: /api/lead-capture treats
-- an insert failure as non-fatal, so until this runs a sign-up still gets its
-- confirmation email and we are still notified. Only the stored row is lost.
--
-- Run in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────

alter table public.leads
    drop constraint if exists leads_source_check;

alter table public.leads
    add constraint leads_source_check
    check (source in ('bulk', 'check', 'unpaid', 'watch'));

comment on column public.leads.source is
    'Which free tool produced the lead: bulk (CSV batch), check (single invoice), unpaid (MSMED delayed-payment calculator), watch (Vendor GST Watch early access).';
