-- Behavioral event log for the "ever-learning" client dashboard.
--
-- Why: today we can only personalize off transactional data (what a client
-- BOOKED). This table captures in-app behavior — what they view, filter, and
-- which nudges they click or dismiss — so the dashboard nudge engine can learn
-- from intent, not just completed bookings (e.g. someone who keeps viewing the
-- sauna schedule but never books = high-intent → nudge it harder).
--
-- Design notes:
--   * Append-only. One row per event. Generic (event_type + optional
--     service_key + jsonb metadata) so new event types need NO migration.
--   * Writes go ONLY through the service-role route POST /api/events, which
--     forces client_id = the authenticated user. There is intentionally NO
--     INSERT policy for authenticated/anon — this prevents event forgery and
--     matches the platform's "all writes through service-role API routes"
--     posture. service_role bypasses RLS, so the route can insert.
--   * Clients CAN read their own events (the dashboard computes nudge signals
--     client-side). Staff/owner can read all for future analytics.
--   * event_type / service_key are free-text in the DB on purpose (no CHECK) —
--     the API route is the single allowlist, so adding an event type is a
--     code change, not a migration. Keep the route's allowlist authoritative.
--
-- Uses the same inline EXISTS-on-profiles idiom as the other live policies
-- (the is_staff()/is_admin() helpers are NOT deployed — migration 002 never
-- applied — so we don't reference them). 'owner' is included explicitly.
--
-- Run in the Supabase SQL editor. Safe to run repeatedly.

CREATE TABLE IF NOT EXISTS public.client_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  service_key text,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Fetch a client's recent events (the dashboard reads the latest N to build
-- nudge signals).
CREATE INDEX IF NOT EXISTS client_events_client_created_idx
  ON public.client_events (client_id, created_at DESC);

-- Count/inspect events per service for a client (viewed-but-not-booked, etc.).
CREATE INDEX IF NOT EXISTS client_events_client_service_idx
  ON public.client_events (client_id, service_key)
  WHERE service_key IS NOT NULL;

ALTER TABLE public.client_events ENABLE ROW LEVEL SECURITY;

-- Clients read their own events.
DROP POLICY IF EXISTS "Clients read own events" ON public.client_events;
CREATE POLICY "Clients read own events"
  ON public.client_events
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Staff/owner read all events (future analytics dashboards).
DROP POLICY IF EXISTS "Staff read all events" ON public.client_events;
CREATE POLICY "Staff read all events"
  ON public.client_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin', 'manager')
    )
  );

-- NOTE: no INSERT/UPDATE/DELETE policies by design — only the service-role
-- route writes here (it bypasses RLS). Do not add a client INSERT policy
-- without revisiting the forge-an-event risk.
