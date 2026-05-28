-- Fix: credit deduction was not atomic with the booking insert.
--
-- Background (2026-05-28): both booking routes created the booking row first,
-- then deducted the credit in a SEPARATE statement computed in JS
-- (used_credits + 1), with no error handling and no row lock:
--   * api/bookings        (client self-book)
--   * api/admin/bookings  (staff books on behalf of a client)
-- Two failure modes:
--   1) If the deduction failed/threw, the booking still existed -> a free
--      booking (credit never decremented).
--   2) Two concurrent bookings could both read the same used_credits value and
--      both write +1 -> one credit consumed for two bookings (double-spend).
--
-- This folds the deduction INTO book_session so the insert + decrement happen
-- in one transaction. The credit row is locked FOR UPDATE (serializing
-- concurrent bookings on the same credit), and we validate ownership + balance
-- before decrementing. Any RAISE rolls the whole thing back.
--
-- Adds a 6th parameter p_credit_id (defaults NULL = no credit, e.g. paid Stripe
-- or complimentary bookings). Because adding a parameter changes the signature,
-- we DROP the old 5-arg overload first so PostgREST has exactly one candidate
-- (otherwise a 4-named-arg call from the client route would be ambiguous).
--
-- NOTE: expiry is intentionally NOT enforced here, to match the client-side
-- credit lookup (dashboard/schedule) which does not filter expired credits.
-- Filtering expired credits is a frontend concern / future improvement.
--
-- Run in the Supabase SQL editor. Safe to run repeatedly.

DROP FUNCTION IF EXISTS book_session(UUID, UUID, NUMERIC, TEXT, TEXT);

CREATE OR REPLACE FUNCTION book_session(
  p_session_id               UUID,
  p_client_id                UUID,
  p_amount_paid              NUMERIC DEFAULT 0,
  p_payment_status           TEXT    DEFAULT 'included',
  p_stripe_payment_intent_id TEXT    DEFAULT NULL,
  p_credit_id                UUID    DEFAULT NULL
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
  v_credit       credits%ROWTYPE;
BEGIN
  -- Lock the session row so no concurrent call can read a stale capacity
  SELECT max_capacity INTO v_max_capacity
  FROM scheduled_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF v_max_capacity IS NULL THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  -- If a credit is supplied, lock + validate it BEFORE inserting so we fail
  -- fast and serialize concurrent bookings against the same credit row.
  IF p_credit_id IS NOT NULL THEN
    SELECT * INTO v_credit FROM credits WHERE id = p_credit_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Credit not found: %', p_credit_id;
    END IF;
    IF v_credit.client_id <> p_client_id THEN
      RAISE EXCEPTION 'Credit does not belong to client';
    END IF;
    IF v_credit.used_credits >= v_credit.total_credits THEN
      RAISE EXCEPTION 'No credits remaining';
    END IF;
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

  -- Deduct the credit in the SAME transaction (atomic with the insert above).
  IF p_credit_id IS NOT NULL THEN
    UPDATE credits
    SET used_credits = used_credits + 1,
        updated_at   = now()
    WHERE id = p_credit_id;
  END IF;

  RETURN jsonb_build_object('booking_id', v_booking_id, 'status', v_status);
END;
$$;

-- Only the server (service_role) may call this.
REVOKE EXECUTE ON FUNCTION book_session(UUID, UUID, NUMERIC, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION book_session(UUID, UUID, NUMERIC, TEXT, TEXT, UUID) TO service_role;
