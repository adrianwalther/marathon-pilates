-- Fix: a client could not rebook a session they had previously cancelled.
--
-- Background (2026-05-28): bookings has a table-level UNIQUE(client_id,
-- session_id). When a booking is cancelled the row is KEPT (status =
-- 'cancelled') for history. So a re-book hit two walls:
--   1) the API dup-check found the cancelled row and returned 409 "Already
--      booked";
--   2) even past that, book_session's INSERT violated the unique constraint.
--
-- This swaps the full unique constraint for a PARTIAL unique index that only
-- covers ACTIVE bookings (confirmed/waitlisted). Effect:
--   * at most one active booking per (client, session)  -- still race-safe
--   * any number of cancelled rows allowed              -- history preserved
--   * rebooking after a cancel now inserts cleanly
--
-- The matching API change filters the dup-check to active statuses (see
-- app/api/bookings/route.ts and app/api/admin/bookings/route.ts).
--
-- Run in the Supabase SQL editor. Safe to run repeatedly.

-- Drop the table-level unique constraint (look it up by its columns so we don't
-- depend on the auto-generated name).
DO $$
DECLARE
  v_conname TEXT;
BEGIN
  SELECT con.conname INTO v_conname
  FROM pg_constraint con
  JOIN pg_class     rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'bookings'
    AND con.contype = 'u'
    AND (
      SELECT array_agg(att.attname::text ORDER BY att.attname::text)
      FROM unnest(con.conkey) AS k(attnum)
      JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
    ) = ARRAY['client_id', 'session_id']
  LIMIT 1;

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT %I', v_conname);
    RAISE NOTICE 'dropped unique constraint %', v_conname;
  ELSE
    RAISE NOTICE 'no (client_id, session_id) unique constraint found (already dropped?)';
  END IF;
END $$;

-- Partial unique index: only one active booking per (client, session).
CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_client_session_uidx
ON public.bookings (client_id, session_id)
WHERE status IN ('confirmed', 'waitlisted');
