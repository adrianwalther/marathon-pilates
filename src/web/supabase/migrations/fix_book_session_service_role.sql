-- Fix: book_session was broken for ALL server-initiated bookings.
--
-- Root cause (discovered 2026-05-28): the deployed function had drifted from
-- the repo. The live version (a) had NO parameter defaults and (b) carried a
-- runtime guard `IF auth.uid() IS NULL THEN RAISE 'Authentication required'`.
-- Every booking in this app is created by a server API route using the
-- SERVICE-ROLE key (where auth.uid() is always NULL), so:
--   * the client self-book route (4-arg call) failed: "function not found"
--   * the Stripe webhook (5-arg call) failed: "Authentication required"
--     => customers were charged but no booking row was inserted.
--
-- This restores the canonical, single-overload function with proper defaults
-- and REMOVES the auth.uid() guard. Authorization is already enforced in the
-- API routes (getUser() + role checks) BEFORE this is ever called. To prevent
-- direct client calls (the old guard had no auth.uid() = p_client_id check, so
-- any logged-in user could already book anyone), EXECUTE is locked to the
-- service_role only.
--
-- Run in the Supabase SQL editor. Safe to run repeatedly.

CREATE OR REPLACE FUNCTION book_session(
  p_session_id               UUID,
  p_client_id                UUID,
  p_amount_paid              NUMERIC DEFAULT 0,
  p_payment_status           TEXT    DEFAULT 'included',
  p_stripe_payment_intent_id TEXT    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_capacity INTEGER;
  v_count        INTEGER;
  v_status       TEXT;
  v_booking_id   UUID;
BEGIN
  -- Lock the session row so no concurrent call can read a stale capacity
  SELECT max_capacity INTO v_max_capacity
  FROM scheduled_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF v_max_capacity IS NULL THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  -- Count confirmed + waitlisted bookings
  SELECT COUNT(*) INTO v_count
  FROM bookings
  WHERE session_id = p_session_id
    AND status IN ('confirmed', 'waitlisted');

  v_status := CASE WHEN v_count >= v_max_capacity THEN 'waitlisted' ELSE 'confirmed' END;

  INSERT INTO bookings (
    client_id, session_id, status,
    amount_paid, payment_status, stripe_payment_intent_id
  )
  VALUES (
    p_client_id, p_session_id, v_status::booking_status,
    p_amount_paid, p_payment_status::payment_status, p_stripe_payment_intent_id
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('booking_id', v_booking_id, 'status', v_status);
END;
$$;

-- Only the server (service_role) may call this. Block anon/authenticated so a
-- logged-in client can't invoke it directly and book on someone else's behalf.
REVOKE EXECUTE ON FUNCTION book_session(UUID, UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION book_session(UUID, UUID, NUMERIC, TEXT, TEXT) TO service_role;
