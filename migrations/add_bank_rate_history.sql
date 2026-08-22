-- ─────────────────────────────────────────────────────────────────────
-- bank_rate_history: the RBI Bank Rate as a DATED SERIES, not a constant.
--
-- REVIEW BEFORE RUNNING. This creates a table and enables RLS.
-- Per CLAUDE.md, RLS changes are yours to approve — nothing here has been
-- applied.
--
-- WHY A TABLE AND NOT A CONSTANT
--
-- Section 16 of the MSMED Act 2006 sets interest at three times the Bank
-- Rate notified by the Reserve Bank, compounded with monthly rests. A claim
-- running eighteen months can span two or three Bank Rate changes, so the
-- interest has to be computed period by period against the rate that was in
-- force at the time. A single hardcoded rate produces a figure that is wrong
-- in a document the user sends to a debtor, and wrong in a way the debtor's
-- accountant will notice.
--
-- This is also the shape of a bug we have already shipped once: the filing
-- deadline reminder had three March dates hardcoded and went on firing
-- against them after they expired. Same failure, higher stakes.
--
-- Run in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.bank_rate_history (
    -- The date this rate came into force. Primary key: two rates cannot
    -- begin on the same day.
    effective_from date primary key,

    -- Null means "still in force". Exactly one row should have a null here.
    effective_to   date,

    -- Basis points as an integer: 550 = 5.50%. Never a float. Money and
    -- rates are integers everywhere in this codebase for the same reason —
    -- compounded monthly over eighteen months, float drift becomes visible
    -- in a figure that has to reconcile against a principal exactly.
    bank_rate_bps  integer not null check (bank_rate_bps between 0 and 5000),

    -- Where this figure came from. Printed in the generated computation
    -- schedule so the recipient can check it themselves.
    source_url     text    not null,

    -- Free text recording HOW this row was established, including any
    -- uncertainty. Read this before trusting effective_from.
    source_note    text,

    -- Epistemic status of effective_from specifically.
    --
    -- The RATE is easy to verify — it is on the RBI homepage today. The DATE
    -- IT CHANGED is harder, and secondary sources contradict each other on
    -- the late-2025 sequence. This column keeps that distinction visible
    -- instead of flattening a guess into the same shape as a fact.
    --
    -- False means: the rate is right, the start date is a conservative
    -- placeholder, and this row must not be used to justify a computation
    -- that depends on precisely when the change happened.
    change_date_verified boolean not null default false,

    -- When we last checked this against the source.
    recorded_on    date    not null default current_date
);

-- Lookups are always "which rate applied on date X", so the range matters.
create index if not exists bank_rate_history_range_idx
    on public.bank_rate_history (effective_from desc);

-- Guard against an overlapping or duplicated open row. Exactly one rate may
-- be in force at a time.
create unique index if not exists bank_rate_history_one_current_idx
    on public.bank_rate_history ((effective_to is null))
    where effective_to is null;

alter table public.bank_rate_history enable row level security;

-- No policy is defined, so this is service-role only — the same posture as
-- public.leads.
--
-- Deliberate, though the data itself is public information. Interest is
-- computed server-side so the figure in a generated document is always the
-- one we can defend, never one a client could have tampered with before
-- submitting. If a client-side calculator is ever wanted, add a read policy
-- for `anon` at that point rather than opening it pre-emptively.

comment on table public.bank_rate_history is
    'RBI Bank Rate as a dated series, for MSMED Act s.16 interest. Service-role only.';


-- ─────────────────────────────────────────────────────────────────────
-- SEED
--
-- One row. This is deliberate, and the reason is worth reading before
-- anyone adds more.
--
-- VERIFIED at rbi.org.in on 22 August 2026:
--     Bank Rate 5.50%, MSF 5.50%, Policy Repo 5.25%,
--     shown "as at 1.00pm of August 21, 2026".
--
-- NOT VERIFIED: the date the Bank Rate became 5.50%. Secondary sources
-- disagree with each other on the late-2025 sequence — one reports a cut to
-- 5.50% repo in August 2025 and a further cut in October, another reports
-- the December 2025 MPC cutting *from* 5.50%. Those cannot both be right,
-- and RBI's own rate archive redirects to the homepage rather than serving
-- a machine-readable history.
--
-- So effective_from is set conservatively to 2026-01-01, which is defensible
-- on the one thing the sources DO agree on: the repo rate has been held at
-- 5.25% at every MPC through 2026 (February, April, June and August), which
-- puts the Bank Rate at 5.50% across the whole of that period.
--
-- The practical effect: the engine can compute any claim period falling in
-- 2026, and must REFUSE any period starting earlier rather than silently
-- applying the oldest rate it happens to hold. Refusing is correct here —
-- a wrong figure in a letter to a debtor costs the user credibility they
-- cannot get back, and a 2025 invoice is rare for the audience this is for.
--
-- TO EXTEND COVERAGE: verify each earlier change against the RBI press
-- release that announced it, close the open row's effective_to, and insert
-- with change_date_verified = true. Do not backfill from a blog.
-- ─────────────────────────────────────────────────────────────────────

insert into public.bank_rate_history
    (effective_from, effective_to, bank_rate_bps, source_url, source_note, change_date_verified, recorded_on)
values
    ('2026-01-01', null, 550, 'https://www.rbi.org.in/',
     'Rate read from the RBI homepage Current Rates panel on 2026-08-22, shown as at 1.00pm 2026-08-21 (Bank Rate 5.50%, MSF 5.50%, Repo 5.25%). effective_from is a CONSERVATIVE PLACEHOLDER, not the actual change date: the change occurred during 2025 and the secondary sources conflict on when. 2026-01-01 is supported by the repo rate having been held at 5.25% at every 2026 MPC. Verify against the originating RBI press release before relying on any pre-2026 period.',
     false, '2026-08-22')
on conflict (effective_from) do nothing;
