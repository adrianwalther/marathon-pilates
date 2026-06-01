-- Cache for AI-generated post-class celebration messages (Ruby's brand voice).
--
-- After a client finishes a class, the dashboard shows a warm, class-aware line.
-- Cached per (client, class instance) so we don't regenerate on every dashboard
-- load while the card is up, and the client sees the same message each time.
--
-- Same shape/policy as nudge_copy: writes ONLY through the service-role route
-- POST /api/post-class-copy; clients never query this directly (the route
-- returns the line). Staff/owner may read for debugging. service_role bypasses RLS.
--
-- Run in the Supabase SQL editor. Safe to run repeatedly.

CREATE TABLE IF NOT EXISTS public.post_class_copy (
  client_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.scheduled_sessions(id) ON DELETE CASCADE,
  message    text NOT NULL,
  model      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, session_id)
);

ALTER TABLE public.post_class_copy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read post-class copy" ON public.post_class_copy;
CREATE POLICY "Staff read post-class copy"
  ON public.post_class_copy
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin', 'manager')
    )
  );
