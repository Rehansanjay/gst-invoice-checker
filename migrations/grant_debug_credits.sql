-- Grants 1,000,000 credits to the debug user
-- Uses 'pack_100' as the plan name to satisfy database constraints
UPDATE public.users
SET 
    credits_remaining = 1000000,
    total_credits_purchased = total_credits_purchased + 1000000,
    current_plan = 'pack_100',
    updated_at = NOW()
WHERE email = 'sit22cs170@sairamtap.edu.in';
