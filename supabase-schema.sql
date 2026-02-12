-- ═══════════════════════════════════════════════
-- GST Invoice Checker — Complete Schema (Two-Path)
-- Run this in Supabase SQL Editor (supabase.com → SQL)
-- ═══════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS TABLE ────────────────────────────────
-- Only for bulk (registered) users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  
  -- Credits
  credits_remaining INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  total_credits_purchased INTEGER DEFAULT 0,
  
  -- Plan
  current_plan TEXT, -- 'pack_10', 'pack_50', 'pack_100'
  plan_purchased_at TIMESTAMPTZ,
  credits_expire_at TIMESTAMPTZ,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);

-- ─── CHECKS TABLE ──────────────────────────────
-- Stores ALL validations (both guest and user)
CREATE TABLE IF NOT EXISTS checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Type of check
  check_type TEXT DEFAULT 'quick' CHECK (check_type IN ('quick', 'bulk')),
  
  -- User reference (NULL for guests)
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  guest_email TEXT,
  guest_ip TEXT,
  
  -- Invoice data
  invoice_number TEXT,
  invoice_date DATE,
  supplier_gstin TEXT,
  buyer_gstin TEXT,
  line_items JSONB,
  taxable_total_amount DECIMAL(12,2),
  total_tax_amount DECIMAL(12,2),
  invoice_total_amount DECIMAL(12,2),
  
  -- Legacy fields (for compatibility)
  invoice_hash TEXT,
  invoice_file_url TEXT,
  invoice_file_name TEXT,
  parsed_data JSONB,
  normalized_data JSONB,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Validation results
  health_score INTEGER,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  issues_found JSONB DEFAULT '[]',
  checks_passed JSONB DEFAULT '[]',
  score_breakdown JSONB,
  validation_result JSONB,
  
  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  payment_id UUID,
  
  -- Auto-deletion (GDPR compliance)
  auto_delete_at TIMESTAMPTZ,
  
  -- Meta
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checks_user ON checks(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checks_guest_email ON checks(guest_email) WHERE guest_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checks_type ON checks(check_type);
CREATE INDEX IF NOT EXISTS idx_checks_auto_delete ON checks(auto_delete_at) WHERE auto_delete_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checks_invoice_hash ON checks(invoice_hash);
CREATE INDEX IF NOT EXISTS idx_checks_created_at ON checks(created_at DESC);

-- Auto-set deletion date based on check type
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

CREATE TRIGGER trigger_set_auto_delete
  BEFORE INSERT ON checks
  FOR EACH ROW
  EXECUTE FUNCTION set_auto_delete_date();

-- ─── LINE ITEMS TABLE ──────────────────────────
-- Denormalized line items for analytics
CREATE TABLE IF NOT EXISTS line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_id UUID REFERENCES checks(id) ON DELETE CASCADE,
  line_number INTEGER,
  description TEXT,
  hsn_code TEXT,
  quantity DECIMAL(12,2),
  rate DECIMAL(12,2),
  taxable_amount DECIMAL(12,2),
  tax_rate DECIMAL(5,2),
  tax_type TEXT CHECK (tax_type IN ('CGST_SGST', 'IGST')),
  cgst DECIMAL(12,2),
  sgst DECIMAL(12,2),
  igst DECIMAL(12,2),
  total_amount DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_items_check ON line_items(check_id);
CREATE INDEX IF NOT EXISTS idx_line_items_hsn ON line_items(hsn_code);

-- ─── VALIDATION RESULTS TABLE ──────────────────
-- Individual issues for analytics
CREATE TABLE IF NOT EXISTS validation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_id UUID REFERENCES checks(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'warning', 'info')),
  category TEXT,
  title TEXT,
  description TEXT,
  expected TEXT,
  found TEXT,
  difference DECIMAL(12,2),
  how_to_fix TEXT,
  impact TEXT,
  gst_law_context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_results_check ON validation_results(check_id);
CREATE INDEX IF NOT EXISTS idx_results_rule ON validation_results(rule_id);
CREATE INDEX IF NOT EXISTS idx_results_severity ON validation_results(severity);

-- ─── PAYMENTS TABLE ────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User reference (NULL for quick checks)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Payment type
  payment_type TEXT CHECK (payment_type IN ('quick_check', 'package_purchase')),
  
  -- Razorpay
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  
  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  
  -- Status
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')),
  payment_method TEXT,
  
  -- Package details
  package_type TEXT DEFAULT 'single',
  credits_included INTEGER DEFAULT 1,
  
  -- Customer info (for quick checks)
  customer_email TEXT,
  
  -- Legacy fields
  checks_included INTEGER DEFAULT 1,
  checks_used INTEGER DEFAULT 0,
  email TEXT,
  phone TEXT,
  
  -- Timestamps
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);

-- ─── CREDIT TRANSACTIONS TABLE ─────────────────
-- Track all credit movements for bulk users
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  transaction_type TEXT CHECK (transaction_type IN ('purchase', 'usage', 'refund')),
  
  credits_added INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  credits_balance INTEGER NOT NULL,
  
  payment_id UUID REFERENCES payments(id),
  check_id UUID REFERENCES checks(id),
  
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_txn_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_txn_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_txn_created ON credit_transactions(created_at DESC);

-- ─── ANALYTICS TABLE ──────────────────────────
-- Track common errors, patterns for product intelligence
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  event_data JSONB,
  supplier_state TEXT,
  buyer_state TEXT,
  is_interstate BOOLEAN,
  total_line_items INTEGER,
  health_score INTEGER,
  risk_level TEXT,
  most_common_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_state ON analytics(supplier_state, buyer_state);

-- ─── ROW LEVEL SECURITY ───────────────────────
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Service role policies (full access for backend)
CREATE POLICY "Service role full access on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on checks" ON checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on line_items" ON line_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on validation_results" ON validation_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on credit_transactions" ON credit_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on analytics" ON analytics FOR ALL USING (true) WITH CHECK (true);

-- User policies (users can only see their own data)
-- Note: Uncomment when you add auth.uid() support
-- CREATE POLICY "Users can see own data" ON checks FOR SELECT USING (user_id = auth.uid());
-- CREATE POLICY "Users can see own payments" ON payments FOR SELECT USING (user_id = auth.uid());
-- CREATE POLICY "Users can see own transactions" ON credit_transactions FOR SELECT USING (user_id = auth.uid());

-- ─── STORAGE BUCKET ───────────────────────────
-- Run separately: Create 'invoices' bucket in Supabase Storage dashboard
-- Settings: Public = false, Max file size = 5MB, Allowed MIME types: application/pdf, image/jpeg, image/png

-- ─── CLEANUP FUNCTION ──────────────────────────
-- Function to delete expired checks (run via cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_checks()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM checks
  WHERE auto_delete_at IS NOT NULL
    AND auto_delete_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Note: Set up a cron job to run this periodically:
-- SELECT cron.schedule('cleanup-checks', '0 2 * * *', 'SELECT cleanup_expired_checks()');
