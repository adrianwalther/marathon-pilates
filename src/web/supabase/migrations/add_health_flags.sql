-- AI-structured health flags for the trainer roster.
--
-- Today the intake stores a client's self-reported health note as raw tokens in
-- profiles.health_conditions (e.g. ['prenatal','injury_noted','note: lower back
-- pain and right knee surgery 2023']) and the trainer roster shows that array
-- verbatim — internal tokens and all. This adds a clean, AI-structured version
-- the trainer can scan at a glance.
--
--   health_flags     — short neutral flags, e.g. ['Prenatal','Lower back','Right knee']
--   health_flags_at  — when they were last generated (so we can regenerate if the
--                      client's note changes)
--
-- health_conditions remains the source of truth (the client's own words);
-- health_flags is a derived, display-friendly summary. Written by the
-- service-role route /api/health-flags. No client policy needed — staff already
-- read profiles for the roster; this is just another profiles column.
--
-- Run in the Supabase SQL editor. Safe to run repeatedly.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS health_flags    text[],
  ADD COLUMN IF NOT EXISTS health_flags_at timestamptz;
