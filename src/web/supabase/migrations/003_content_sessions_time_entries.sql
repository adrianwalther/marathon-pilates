-- Migration 003: Social content sessions + front desk time entries
-- Run in Supabase Dashboard → SQL Editor

-- ── content_sessions ────────────────────────────────────────────────
-- Tracks social/marketing content creation hours submitted by instructors.
-- Admin approves → flows into payroll at $25/hr.

CREATE TABLE IF NOT EXISTS content_sessions (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date            date        NOT NULL,
  hours           numeric(5,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  description     text        NOT NULL,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE content_sessions ENABLE ROW LEVEL SECURITY;

-- Instructors: see and manage their own submissions
CREATE POLICY "instructors_select_own_content"
  ON content_sessions FOR SELECT
  USING (instructor_id = auth.uid());

CREATE POLICY "instructors_insert_own_content"
  ON content_sessions FOR INSERT
  WITH CHECK (instructor_id = auth.uid());

-- Admins + managers: full access
CREATE POLICY "admins_all_content_sessions"
  ON content_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );


-- ── time_entries ─────────────────────────────────────────────────────
-- Front desk clock in / clock out tracking.
-- Hours computed on clock-out (rounded to nearest 15 min in app).
-- Admin can edit entries to correct times.

CREATE TABLE IF NOT EXISTS time_entries (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clock_in    timestamptz NOT NULL DEFAULT now(),
  clock_out   timestamptz,
  hours       numeric(5,2),
  notes       text,
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT  clock_out_after_in CHECK (clock_out IS NULL OR clock_out > clock_in)
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Staff: see their own entries
CREATE POLICY "staff_select_own_entries"
  ON time_entries FOR SELECT
  USING (staff_id = auth.uid());

-- Staff: clock in (insert)
CREATE POLICY "staff_insert_own_entries"
  ON time_entries FOR INSERT
  WITH CHECK (staff_id = auth.uid());

-- Staff: clock out (update their own open entries)
CREATE POLICY "staff_update_own_entries"
  ON time_entries FOR UPDATE
  USING (staff_id = auth.uid());

-- Admins + managers: full access
CREATE POLICY "admins_all_time_entries"
  ON time_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );
