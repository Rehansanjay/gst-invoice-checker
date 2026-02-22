-- Migration: Add UTM and referral tracking to checks table
-- Run in Supabase SQL editor

ALTER TABLE checks
    ADD COLUMN IF NOT EXISTS utm_source  TEXT,
    ADD COLUMN IF NOT EXISTS utm_medium  TEXT,
    ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
    ADD COLUMN IF NOT EXISTS ref_code    TEXT;

-- Index for attribution queries
CREATE INDEX IF NOT EXISTS idx_checks_ref_code    ON checks(ref_code)    WHERE ref_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checks_utm_source  ON checks(utm_source)  WHERE utm_source IS NOT NULL;

COMMENT ON COLUMN checks.utm_source   IS 'UTM source (e.g. whatsapp, google)';
COMMENT ON COLUMN checks.utm_medium   IS 'UTM medium (e.g. personal, cpc)';
COMMENT ON COLUMN checks.utm_campaign IS 'UTM campaign (e.g. week1, march20)';
COMMENT ON COLUMN checks.ref_code     IS 'Referral code from ?ref= param (e.g. OWNER10)';
