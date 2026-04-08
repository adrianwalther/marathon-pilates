-- Add stripe_session_id to credits table for idempotent credit creation.
-- Without this column the upsert in /api/checkout/membership/confirm silently
-- fails, meaning credits are never created after payment.
--
-- Run in Supabase SQL editor.

ALTER TABLE credits ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS credits_stripe_session_id_key
  ON credits (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
