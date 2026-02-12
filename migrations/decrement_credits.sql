-- Create a stored procedure to atomically decrement credits
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
