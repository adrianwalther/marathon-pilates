-- Liability-waiver consent record on the client intake.
--
-- profiles.liability_waiver_signed (bool) already exists. To make the
-- click-wrap acknowledgment legally useful we also record WHEN it was signed,
-- WHICH version of the waiver text was agreed to, and the typed-name signature.
-- Storing the version matters: if the waiver wording changes later, we still
-- know exactly what each client agreed to (the text lives in lib/waiver.ts,
-- keyed by WAIVER_VERSION).
--
-- Run in the Supabase SQL editor. Safe to run repeatedly.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS waiver_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS waiver_version   text,
  ADD COLUMN IF NOT EXISTS waiver_signature text;
