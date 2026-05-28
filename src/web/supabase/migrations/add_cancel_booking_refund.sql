-- Feature: refund a class credit when a booking is cancelled (atomically).
--
-- Background (2026-05-28): api/bookings/cancel flipped the booking to
-- 'cancelled' and promoted the waitlist, but NEVER refunded the credit — so a
-- client who booked with a credit and cancelled (even days in advance) silently
-- lost it. Also, book_session never populated bookings.credit_used, so there
-- was no record of WHICH credit to refund.
--
-- This migration:
--   1) Updates book_session to record credit_used = p_credit_id on the booking.
--   2) Adds cancel_booking(p_session_id, p_client_id): in ONE transaction it
--      locks the booking, decides whether it's a late cancel, cancels it,
--      refunds the credit unless it's a late cancel, and promotes the waitlist.
--
-- Policy (confirmed 2026-05-28): 24-hour window. Cancelling 24h+ before class
-- start refunds the credit. Cancelling inside 24h = LATE cancel: the credit is
-- FORFEITED (the lost credit is the penalty; any $15 cash fee is handled
-- separately). Late-cancel forfeit applies ONLY to confirmed bookings — a
-- waitlisted booking never held a confirmed spot, so it always refunds.
--
-- NOTE: bookings created BEFORE this migration have credit_used = NULL, so
-- cancelling them won't refund (we don't know which credit they used). Only
-- bookings created after this ships carry the credit_used link.
--
-- Run in the Supabase SQL editor. Safe to run repeatedly.

-- 1) Record which credit was spent (signature unchanged -> plain replace).
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
  SELECT max_capacity INTO v_max_capacity
  FROM scheduled_sessions WHERE id = p_session_id FOR UPDATE;

  IF v_max_capacity IS NULL THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

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

  SELECT COUNT(*) INTO v_count
  FROM bookings
  WHERE session_id = p_session_id AND status IN ('confirmed', 'waitlisted');

  v_status := CASE WHEN v_count >= v_max_capacity THEN 'waitlisted' ELSE 'confirmed' END;

  INSERT INTO bookings (
    client_id, session_id, status,
    amount_paid, payment_status, stripe_payment_intent_id, credit_used
  )
  VALUES (
    p_client_id, p_session_id, v_status::booking_status,
    p_amount_paid, p_payment_status::payment_status, p_stripe_payment_intent_id, p_credit_id
  )
  RETURNING id INTO v_booking_id;

  IF p_credit_id IS NOT NULL THEN
    UPDATE credits SET used_credits = used_credits + 1, updated_at = now()
    WHERE id = p_credit_id;
  END IF;

  RETURN jsonb_build_object('booking_id', v_booking_id, 'status', v_status);
END;
$$;

REVOKE EXECUTE ON FUNCTION book_session(UUID, UUID, NUMERIC, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION book_session(UUID, UUID, NUMERIC, TEXT, TEXT, UUID) TO service_role;

-- 2) Atomic cancel + conditional refund + waitlist promotion.
CREATE OR REPLACE FUNCTION cancel_booking(
  p_session_id UUID,
  p_client_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking   bookings%ROWTYPE;
  v_starts_at TIMESTAMPTZ;
  v_is_late   BOOLEAN := FALSE;
  v_refunded  BOOLEAN := FALSE;
  v_next_id   UUID;
BEGIN
  -- Lock the caller's active booking for this session.
  SELECT * INTO v_booking
  FROM bookings
  WHERE client_id = p_client_id
    AND session_id = p_session_id
    AND status IN ('confirmed', 'waitlisted')
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Late cancel only applies to a confirmed spot within 24h of start.
  -- >>> POLICY KNOB #1 (revisit w/ Ruby): the cancellation window. <<<
  IF v_booking.status = 'confirmed' THEN
    SELECT starts_at INTO v_starts_at FROM scheduled_sessions WHERE id = p_session_id;
    IF v_starts_at IS NOT NULL AND now() > (v_starts_at - interval '24 hours') THEN
      v_is_late := TRUE;
    END IF;
  END IF;

  UPDATE bookings
  SET status       = 'cancelled',
      cancelled_at = now(),
      late_cancel  = v_is_late,
      updated_at   = now()
  WHERE id = v_booking.id;

  -- Refund the credit unless this was a late cancel (forfeit).
  -- >>> POLICY KNOB #2 (revisit w/ Ruby): forfeit vs. refund on late cancel.
  -- Drop the `AND NOT v_is_late` to always refund (handle the $15 fee elsewhere). <<<
  IF v_booking.credit_used IS NOT NULL AND NOT v_is_late THEN
    UPDATE credits
    SET used_credits = GREATEST(used_credits - 1, 0),
        updated_at   = now()
    WHERE id = v_booking.credit_used;
    v_refunded := TRUE;
  END IF;

  -- If a confirmed spot just opened, promote the earliest waitlisted booking.
  IF v_booking.status = 'confirmed' THEN
    SELECT id INTO v_next_id
    FROM bookings
    WHERE session_id = p_session_id AND status = 'waitlisted'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_next_id IS NOT NULL THEN
      UPDATE bookings SET status = 'confirmed', updated_at = now() WHERE id = v_next_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'cancelled', true,
    'late_cancel', v_is_late,
    'refunded', v_refunded,
    'promoted_booking_id', v_next_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION cancel_booking(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION cancel_booking(UUID, UUID) TO service_role;
