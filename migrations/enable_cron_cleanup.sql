-- ─────────────────────────────────────────────────────────────────────
-- enable_cron_cleanup.sql
-- Run this ONCE in the Supabase SQL Editor on your PRODUCTION project.
-- Schedules daily cleanup of expired guest checks (7 days) and
-- bulk checks (90 days).
-- ─────────────────────────────────────────────────────────────────────

-- 1. Enable pg_cron extension (may already be enabled on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Grant cron usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- 3. Schedule: daily at 2:00 AM UTC
SELECT cron.schedule(
    'cleanup-expired-checks',   -- job name (unique)
    '0 2 * * *',                -- cron expression: 2 AM daily
    $$
        DELETE FROM checks
        WHERE auto_delete_at IS NOT NULL
          AND auto_delete_at < NOW();
    $$
);

-- 4. Verify the job was scheduled
SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'cleanup-expired-checks';

-- ─────────────────────────────────────────────────────────────────────
-- To REMOVE the job later:
--   SELECT cron.unschedule('cleanup-expired-checks');
-- ─────────────────────────────────────────────────────────────────────
