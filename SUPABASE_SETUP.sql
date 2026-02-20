-- ═══════════════════════════════════════════════════════════
-- GST INVOICE CHECKER - COMPLETE SUPABASE SETUP
-- ═══════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════

-- STEP 1: Enable Required Extensions
-- ═══════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- STEP 2: Create Users Table (Bulk Check Users)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  
  -- Credits System
  credits_remaining INTEGER DEFAULT 0 NOT NULL,
  credits_used INTEGER DEFAULT 0 NOT NULL,
  total_credits_purchased INTEGER DEFAULT 0 NOT NULL,
  
  -- Current Plan
  current_plan TEXT, -- 'pack_10', 'pack_50', 'pack_100'
  plan_purchased_at TIMESTAMPTZ,
  credits_expire_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- STEP 3: Create Checks Table (All Invoice Validations)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Check Type: 'quick' (guest ₹99) or 'bulk' (user credits)
  check_type TEXT DEFAULT 'quick' CHECK (check_type IN ('quick', 'bulk')) NOT NULL,
  
  -- User References
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  guest_email TEXT,
  guest_ip TEXT,
  
  -- Invoice Data
  invoice_number TEXT,
  invoice_date DATE,
  supplier_gstin TEXT,
  buyer_gstin TEXT,
  line_items JSONB,
  taxable_total_amount DECIMAL(12,2),
  total_tax_amount DECIMAL(12,2),
  invoice_total_amount DECIMAL(12,2),
  
  -- Legacy/Optional Fields
  invoice_hash TEXT,
  invoice_file_url TEXT,
  invoice_file_name TEXT,
  parsed_data JSONB,
  normalized_data JSONB,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL,
  
  -- Validation Results
  health_score INTEGER,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  issues_found JSONB DEFAULT '[]'::jsonb,
  checks_passed JSONB DEFAULT '[]'::jsonb,
  score_breakdown JSONB,
  validation_result JSONB,
  
  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')) NOT NULL,
  payment_id UUID,
  
  -- Auto-Deletion (GDPR Compliance)
  auto_delete_at TIMESTAMPTZ,
  
  -- Metadata
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- STEP 4: Create Payments Table
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User Reference (NULL for quick checks)
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Payment Type
  payment_type TEXT CHECK (payment_type IN ('quick_check', 'package_purchase')) NOT NULL,
  
  -- Razorpay Integration
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  
  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')) NOT NULL,
  payment_method TEXT,
  
  -- Package Details
  package_type TEXT DEFAULT 'single',
  credits_included INTEGER DEFAULT 1,
  
  -- Customer Info (for quick checks)
  customer_email TEXT,
  
  -- Legacy Fields
  checks_included INTEGER DEFAULT 1,
  checks_used INTEGER DEFAULT 0,
  email TEXT,
  phone TEXT,
  
  -- Timestamps
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- STEP 5: Create Credit Transactions Table (Audit Log)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  transaction_type TEXT CHECK (transaction_type IN ('purchase', 'usage', 'refund')) NOT NULL,
  
  credits_added INTEGER DEFAULT 0 NOT NULL,
  credits_used INTEGER DEFAULT 0 NOT NULL,
  credits_balance INTEGER NOT NULL,
  
  payment_id UUID REFERENCES public.payments(id),
  check_id UUID REFERENCES public.checks(id),
  
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- STEP 6: Create Line Items Table (Denormalized for Analytics)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_id UUID REFERENCES public.checks(id) ON DELETE CASCADE NOT NULL,
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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- STEP 7: Create Validation Results Table (Individual Issues)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.validation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_id UUID REFERENCES public.checks(id) ON DELETE CASCADE NOT NULL,
  rule_id TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'warning', 'info')) NOT NULL,
  category TEXT,
  title TEXT,
  description TEXT,
  expected TEXT,
  found TEXT,
  difference DECIMAL(12,2),
  how_to_fix TEXT,
  impact TEXT,
  gst_law_context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- STEP 8: Create Analytics Table (Product Intelligence)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.analytics (
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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- STEP 9: Create Indexes for Performance
-- ═══════════════════════════════════════════════════════════

-- Users Table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created ON public.users(created_at DESC);

-- Checks Table
CREATE INDEX IF NOT EXISTS idx_checks_user ON public.checks(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checks_guest_email ON public.checks(guest_email) WHERE guest_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checks_type ON public.checks(check_type);
CREATE INDEX IF NOT EXISTS idx_checks_status ON public.checks(status);
CREATE INDEX IF NOT EXISTS idx_checks_auto_delete ON public.checks(auto_delete_at) WHERE auto_delete_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checks_created ON public.checks(created_at DESC);

-- Payments Table
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON public.payments(payment_type);

-- Credit Transactions Table
CREATE INDEX IF NOT EXISTS idx_credit_txn_user ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_txn_type ON public.credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_txn_created ON public.credit_transactions(created_at DESC);

-- Line Items Table
CREATE INDEX IF NOT EXISTS idx_line_items_check ON public.line_items(check_id);
CREATE INDEX IF NOT EXISTS idx_line_items_hsn ON public.line_items(hsn_code);

-- Validation Results Table
CREATE INDEX IF NOT EXISTS idx_results_check ON public.validation_results(check_id);
CREATE INDEX IF NOT EXISTS idx_results_rule ON public.validation_results(rule_id);
CREATE INDEX IF NOT EXISTS idx_results_severity ON public.validation_results(severity);

-- Analytics Table
CREATE INDEX IF NOT EXISTS idx_analytics_event ON public.analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_state ON public.analytics(supplier_state, buyer_state);

-- STEP 10: Create Auto-Delete Trigger
-- ═══════════════════════════════════════════════════════════
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

DROP TRIGGER IF EXISTS trigger_set_auto_delete ON public.checks;
CREATE TRIGGER trigger_set_auto_delete
  BEFORE INSERT ON public.checks
  FOR EACH ROW
  EXECUTE FUNCTION set_auto_delete_date();

-- STEP 11: Create Updated_At Trigger
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_checks_updated_at ON public.checks;
CREATE TRIGGER update_checks_updated_at
  BEFORE UPDATE ON public.checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- STEP 12: Create Cleanup Function (Run via Cron)
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION cleanup_expired_checks()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.checks
  WHERE auto_delete_at IS NOT NULL
    AND auto_delete_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- STEP 13: Enable Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- STEP 14: Create RLS Policies
-- ═══════════════════════════════════════════════════════════

-- Allow Service Role Full Access (Backend API)
DROP POLICY IF EXISTS "service_role_users" ON public.users;
CREATE POLICY "service_role_users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_checks" ON public.checks;
CREATE POLICY "service_role_checks" ON public.checks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_payments" ON public.payments;
CREATE POLICY "service_role_payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_credit_transactions" ON public.credit_transactions;
CREATE POLICY "service_role_credit_transactions" ON public.credit_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_line_items" ON public.line_items;
CREATE POLICY "service_role_line_items" ON public.line_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_validation_results" ON public.validation_results;
CREATE POLICY "service_role_validation_results" ON public.validation_results FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_analytics" ON public.analytics;
CREATE POLICY "service_role_analytics" ON public.analytics FOR ALL USING (true) WITH CHECK (true);

-- User-Specific Policies (Authenticated Users)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "checks_select_own" ON public.checks;
CREATE POLICY "checks_select_own" ON public.checks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "credit_transactions_select_own" ON public.credit_transactions;
CREATE POLICY "credit_transactions_select_own" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- SETUP COMPLETE! ✅
-- ═══════════════════════════════════════════════════════════
-- Next Steps:
-- 1. Set up Cron Job (Optional):
--    SELECT cron.schedule('cleanup-checks', '0 2 * * *', 'SELECT cleanup_expired_checks()');
--
-- 2. Create Storage Bucket for Invoice Files:
--    - Go to Supabase Dashboard → Storage
--    - Create bucket: 'invoices'
--    - Set to Private
--    - Max file size: 5MB
--    - Allowed types: application/pdf, image/jpeg, image/png
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- STEP 15: Create Helper Functions (Credit Deduction)
-- ═══════════════════════════════════════════════════════════
create or replace function decrement_credits(user_id_param uuid, amount int)
returns void
language plpgsql
security definer
as $$
begin
  update public.users
  set 
    credits_remaining = credits_remaining - amount,
    credits_used = credits_used + amount
  where id = user_id_param;
end;
$$;

-- ═══════════════════════════════════════════════════════════
-- STEP 16: Free Trial — Auto-create user profile on signup
-- ═══════════════════════════════════════════════════════════
-- This trigger fires when a new user signs up via Supabase Auth.
-- It inserts a profile row in public.users with 1 free trial credit.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, credits_remaining)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    1  -- 1 free trial credit
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- One-time patch: give 1 free trial to all existing 0-credit users
-- UPDATE public.users
-- SET credits_remaining = 1
-- WHERE credits_remaining = 0 AND credits_used = 0 AND current_plan IS NULL;
