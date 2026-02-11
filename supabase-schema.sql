-- ═══════════════════════════════════════════════
-- GST Invoice Checker — Supabase Schema
-- Run this in Supabase SQL Editor (supabase.com → SQL)
-- ═══════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── CHECKS TABLE ──────────────────────────────
-- Stores every validation run
CREATE TABLE IF NOT EXISTS checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_hash TEXT,
  invoice_file_url TEXT,
  invoice_file_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Raw and normalized invoice data
  parsed_data JSONB,
  normalized_data JSONB,
  
  -- Validation results
  health_score INTEGER,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  issues_found JSONB DEFAULT '[]',
  checks_passed JSONB DEFAULT '[]',
  score_breakdown JSONB,
  validation_result JSONB,
  
  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  payment_id TEXT,
  
  -- Meta
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for idempotent lookups
CREATE INDEX IF NOT EXISTS idx_checks_invoice_hash ON checks(invoice_hash);
CREATE INDEX IF NOT EXISTS idx_checks_created_at ON checks(created_at DESC);

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
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')),
  payment_method TEXT,
  package_type TEXT DEFAULT 'single',
  checks_included INTEGER DEFAULT 1,
  checks_used INTEGER DEFAULT 0,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

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
-- Enable RLS but allow service role full access
ALTER TABLE checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Service role policies (full access for backend)
CREATE POLICY "Service role full access on checks" ON checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on line_items" ON line_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on validation_results" ON validation_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on analytics" ON analytics FOR ALL USING (true) WITH CHECK (true);

-- ─── STORAGE BUCKET ───────────────────────────
-- Run separately: Create 'invoices' bucket in Supabase Storage dashboard
-- Settings: Public = false, Max file size = 5MB, Allowed MIME types: application/pdf, image/jpeg, image/png
