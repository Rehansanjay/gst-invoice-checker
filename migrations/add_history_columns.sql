-- ═══════════════════════════════════════════════════════════════
-- Migration: Add missing columns to the checks table
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Add check_type if missing (controls auto-delete: bulk=90 days, quick=7 days)
ALTER TABLE checks ADD COLUMN IF NOT EXISTS check_type TEXT DEFAULT 'quick'
    CHECK (check_type IN ('quick', 'bulk'));

-- Add status if missing
ALTER TABLE checks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Add health score if missing
ALTER TABLE checks ADD COLUMN IF NOT EXISTS health_score INTEGER;

-- Add risk level if missing
ALTER TABLE checks ADD COLUMN IF NOT EXISTS risk_level TEXT
    CHECK (risk_level IN ('low', 'medium', 'high'));

-- Add line items JSONB if missing
ALTER TABLE checks ADD COLUMN IF NOT EXISTS line_items JSONB;

-- Add tax amount columns if missing
ALTER TABLE checks ADD COLUMN IF NOT EXISTS taxable_total_amount DECIMAL(12,2);
ALTER TABLE checks ADD COLUMN IF NOT EXISTS total_tax_amount DECIMAL(12,2);

-- Add invoice total if missing
ALTER TABLE checks ADD COLUMN IF NOT EXISTS invoice_total_amount DECIMAL(12,2);

-- Add full result storage columns if missing
ALTER TABLE checks ADD COLUMN IF NOT EXISTS parsed_data JSONB;
ALTER TABLE checks ADD COLUMN IF NOT EXISTS validation_result JSONB;
ALTER TABLE checks ADD COLUMN IF NOT EXISTS issues_found JSONB DEFAULT '[]';
ALTER TABLE checks ADD COLUMN IF NOT EXISTS checks_passed JSONB DEFAULT '[]';
ALTER TABLE checks ADD COLUMN IF NOT EXISTS score_breakdown JSONB;
ALTER TABLE checks ADD COLUMN IF NOT EXISTS invoice_hash TEXT;

-- Add processing time if missing
ALTER TABLE checks ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

-- Add auto-delete column if missing
ALTER TABLE checks ADD COLUMN IF NOT EXISTS auto_delete_at TIMESTAMPTZ;

-- ── Re-create the auto-delete trigger (safe to run multiple times) ──────────
CREATE OR REPLACE FUNCTION set_auto_delete_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_type = 'quick' THEN
        NEW.auto_delete_at := NEW.created_at + INTERVAL '7 days';
    ELSIF NEW.check_type = 'bulk' THEN
        NEW.auto_delete_at := NEW.created_at + INTERVAL '90 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_auto_delete ON checks;
CREATE TRIGGER trigger_set_auto_delete
    BEFORE INSERT ON checks
    FOR EACH ROW
    EXECUTE FUNCTION set_auto_delete_date();

-- ── Reload schema cache so PostgREST picks up new columns immediately ───────
-- NOTE: This is done automatically in Supabase Cloud within ~30 seconds.
-- If checks still fail after running this, wait 30s and restart your local server.

SELECT 'Migration complete! All columns added.' AS status;
