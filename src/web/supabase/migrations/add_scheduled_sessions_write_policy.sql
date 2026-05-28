-- Fix: staff could not add or cancel classes from the admin Schedule UI.
--
-- Root cause (discovered 2026-05-28): scheduled_sessions has RLS enabled but
-- ONLY a SELECT policy ("Anyone can view sessions", USING true). There is no
-- INSERT/UPDATE/DELETE policy, so every write through the browser/anon client
-- is denied for ALL roles — including owners and admins. The admin Schedule
-- page writes directly with the client key:
--   * add class    -> scheduled_sessions INSERT (schedule/page.tsx handleSubmit)
--   * cancel class  -> scheduled_sessions UPDATE is_cancelled (handleCancelSession)
-- The seed scripts work only because they run as the postgres role in the SQL
-- editor (RLS bypassed).
--
-- This adds a write policy scoped to owner + admin, matching the role matrix
-- in app/(admin)/layout.tsx (manager.schedule_edit = false, so managers stay
-- view-only). It uses the same inline EXISTS-on-profiles idiom as the other
-- 63 live policies (the is_staff()/is_admin() helper functions are NOT deployed
-- — migration 002 never applied — so we intentionally do not reference them).
--
-- The existing "Anyone can view sessions" SELECT policy is left in place;
-- Postgres RLS policies are permissive (OR-combined), so reads are unaffected.
--
-- Run in the Supabase SQL editor. Safe to run repeatedly.

DROP POLICY IF EXISTS "Staff manage sessions" ON public.scheduled_sessions;

CREATE POLICY "Staff manage sessions"
  ON public.scheduled_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin')
    )
  );
