-- Fix: 25 live RLS policies gate on staff roles but OMIT 'owner'.
--
-- Background (audit 2026-05-28): the owner role was added 2026-05-27 (Ruby +
-- Adrian). But 25 of the ~63 live policies were written before that and list
-- only ('admin', 'manager', ...) in their profiles.role checks, never 'owner'.
-- Latent today because admin pages hit the DB with the service-role key (which
-- bypasses RLS), but it's a correctness bug: an owner using any code path that
-- goes through the anon/authenticated client would be denied.
--
-- profiles.role is the `user_role` ENUM (confirmed: stragglers render as
-- `profiles.role = 'admin'::user_role`). So we add a BARE 'owner' literal —
-- Postgres coerces it to user_role automatically, which works whether the
-- existing array elements are cast (::user_role) or bare.
--
-- 23 policies use the array form  `role = ANY (ARRAY[...])`  -> handled by the
--    DO block below via regex insertion.
-- 2 payroll policies use the single-value form `role = 'admin'::user_role` ->
--    rewritten explicitly afterward.
--
-- Uses ALTER POLICY (atomic, no drop/recreate window). Idempotent: the filter
-- skips any policy that already contains 'owner'. Wrapped in a transaction with
-- a verification count that must return 0.
--
-- Run in the Supabase SQL editor.

BEGIN;

-- Part 1: array-form policies — insert a bare 'owner' literal into the role array.
DO $$
DECLARE
  r         RECORD;
  new_qual  TEXT;
  new_check TEXT;
  stmt      TEXT;
  n         INT := 0;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (COALESCE(qual,'') || COALESCE(with_check,'')) ILIKE '%role%'
      AND (COALESCE(qual,'') || COALESCE(with_check,'')) ILIKE '%admin%'
      AND (COALESCE(qual,'') || COALESCE(with_check,'')) NOT ILIKE '%owner%'
      AND (COALESCE(qual,'') || COALESCE(with_check,'')) ILIKE '%= ANY (ARRAY[%'
  LOOP
    new_qual  := regexp_replace(r.qual,      '(role = ANY \(ARRAY\[)', '\1''owner'', ', 'gi');
    new_check := regexp_replace(r.with_check, '(role = ANY \(ARRAY\[)', '\1''owner'', ', 'gi');

    stmt := 'ALTER POLICY ' || quote_ident(r.policyname)
         || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    IF r.qual       IS NOT NULL THEN stmt := stmt || ' USING ('      || new_qual  || ')'; END IF;
    IF r.with_check IS NOT NULL THEN stmt := stmt || ' WITH CHECK (' || new_check || ')'; END IF;

    EXECUTE stmt;
    n := n + 1;
    RAISE NOTICE 'patched %.%', r.tablename, r.policyname;
  END LOOP;
  RAISE NOTICE 'array-form policies patched: %', n;
END $$;

-- Part 2: the 2 single-value payroll policies.
ALTER POLICY payroll_periods_admin_all ON public.payroll_periods
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
  ));

ALTER POLICY payroll_line_items_admin_all ON public.payroll_line_items
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
  ));

-- Verification: must return 0.
SELECT count(*) AS still_missing_owner
FROM pg_policies
WHERE schemaname = 'public'
  AND (COALESCE(qual,'') || COALESCE(with_check,'')) ILIKE '%role%'
  AND (COALESCE(qual,'') || COALESCE(with_check,'')) ILIKE '%admin%'
  AND (COALESCE(qual,'') || COALESCE(with_check,'')) NOT ILIKE '%owner%';

COMMIT;
