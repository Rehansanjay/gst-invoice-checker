-- Keep the Data API reachable after Supabase's 30 October 2026 change.
--
-- Until now Supabase granted Data API access to every new table in "public"
-- automatically. From 30 October it stops doing that for existing projects, and
-- any table created afterwards needs an explicit GRANT before supabase-js,
-- PostgREST or GraphQL can read it. Without one the API answers
-- "permission denied", which is easy to misread as an RLS problem.
--
-- The tables already in production are not affected -- they keep the grants they
-- have. What breaks is *recreating* the schema: a fresh project, a preview
-- branch, or a local `supabase db reset`. None of the migrations in this folder
-- granted anything, so a rebuilt database would come up with every table
-- invisible to the API.
--
-- Two things here:
--
--   1. Explicit grants on the existing tables, so a rebuilt schema matches what
--      production actually has today. These were read off the live database
--      rather than chosen -- every table currently grants all privileges to all
--      three API roles, and access is controlled by row level security instead
--      (see the policies in supabase-schema.sql). Narrowing them here would
--      change behaviour: guest checks insert as `anon`.
--
--   2. Default privileges, so a table added later is not silently unreachable.
--      This restores, for this project only, the behaviour Supabase is dropping.
--
-- Safe to run more than once. To tighten this later, revoke per table and grant
-- only what each role needs -- `anon` almost certainly does not need DELETE or
-- TRUNCATE on `payments`.

-- 1. existing tables -----------------------------------------------------------

do $$
declare
  t text;
begin
  for t in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format(
      'grant all privileges on table public.%I to anon, authenticated, service_role',
      t
    );
  end loop;
end
$$;

-- views and materialised views are reached through the same API
do $$
declare
  v text;
begin
  for v in
    select table_name
    from information_schema.views
    where table_schema = 'public'
  loop
    execute format(
      'grant all privileges on table public.%I to anon, authenticated, service_role',
      v
    );
  end loop;
end
$$;

-- sequences back the identity columns those inserts use
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- 2. anything created from here on --------------------------------------------

-- `for role postgres` matters: default privileges attach to the role that
-- creates the object, and migrations run as postgres.
alter default privileges for role postgres in schema public
  grant all privileges on tables to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant usage, select on sequences to anon, authenticated, service_role;

-- Nothing here for supabase_admin on purpose. Production already carries its
-- own default privileges for that role (checked with pg_default_acl), and
-- altering another role's defaults needs membership in it, which would make
-- this migration fail wherever that is not granted.
