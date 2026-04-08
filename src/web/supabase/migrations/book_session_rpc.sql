-- Atomically book a session: locks the session row, checks capacity,
-- and inserts the booking in a single transaction — eliminates the race
-- condition between the capacity check and the insert.
--
-- Run in Supabase SQL editor.

CREATE OR REPLACE FUNCTION book_session(
  p_session_id              UUID,
  p_client_id               UUID,
  p_amount_paid             NUMERIC  DEFAULT 0,
  p_payment_status          TEXT     DEFAULT 'included',
  p_stripe_payment_intent_id TEXT    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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
    p_client_id, p_session_id, v_status,
    p_amount_paid, p_payment_status, p_stripe_payment_intent_id
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('booking_id', v_booking_id, 'status', v_status);
END;
$$;
