-- ═══════════════════════════════════════════════════════════
-- FREE TRIAL SETUP — Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- STEP 1: Give 1 free trial to all existing users with 0 credits (one-time patch)
UPDATE public.users
SET credits_remaining = 1
WHERE credits_remaining = 0
  AND credits_used = 0
  AND current_plan IS NULL;

-- STEP 2: Create trigger function that auto-creates user profile on signup
--         with 1 free trial credit
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

-- STEP 3: Attach trigger to auth.users (fires after new signup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
