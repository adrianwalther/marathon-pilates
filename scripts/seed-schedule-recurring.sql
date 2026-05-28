-- Marathon Pilates — Recurring Schedule Generator
-- Group reformer classes only | Charlotte Park only | Instructor placeholder: Ruby Ramdhan
-- Generates a full Mon–Sun weekly pattern (43 classes/week) for 13 weeks
-- Anchored to Monday 2026-05-25; past sessions are filtered out (>= CURRENT_DATE)
-- Timezone: America/Chicago (DST handled automatically)
-- Run ONCE in Supabase SQL Editor. Wrapped in a transaction — all-or-nothing.

BEGIN;

-- ── STEP 1: Full reset — remove ALL group reformer sessions at Charlotte Park ──
-- (Beta: these are freshly seeded with no real client bookings.)
DELETE FROM scheduled_sessions
WHERE session_type = 'group_reformer'
  AND location_id  = 'd727b8df-d963-4bc5-a080-5908a1f4711e';

-- ── STEP 2: Generate the recurring schedule ──
INSERT INTO scheduled_sessions (
  session_type, location_id, instructor_id, name,
  starts_at, ends_at, duration_minutes, max_capacity,
  waitlist_enabled, drop_in_price
)
SELECT
  'group_reformer',
  'd727b8df-d963-4bc5-a080-5908a1f4711e',
  '3a6cd143-6bae-4ba1-8d21-f67d5a50b957',
  t.name,
  t.starts_at,
  t.starts_at + interval '50 minutes',
  50, 8, true, 40
FROM (
  SELECT
    tmpl.name,
    (((DATE '2026-05-25'
        + (tmpl.dow || ' days')::interval          -- day-of-week offset (0=Mon)
        + (w.wk * 7 || ' days')::interval)::date
      + tmpl.start_time)::timestamp AT TIME ZONE 'America/Chicago') AS starts_at
  FROM (VALUES
    -- dow: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
    -- ── MONDAY (6) ──
    (0, TIME '06:30', 'Pilates Reformer: Flow Beyond Basics'),
    (0, TIME '07:30', 'Pilates Reformer: Level 1'),
    (0, TIME '08:30', 'Pilates Reformer: Core, Arms + Glutes'),
    (0, TIME '12:30', 'Strength'),
    (0, TIME '16:30', 'Pilates Reformer: Level 1'),
    (0, TIME '17:30', 'Pilates Reformer: Level 2'),
    -- ── TUESDAY (8) ──
    (1, TIME '06:30', 'Pilates Reformer: Flow Beyond Basics'),
    (1, TIME '07:30', 'Pilates Reformer: Level 2'),
    (1, TIME '08:30', 'Pilates Reformer: Upper Body & Core Sculpt'),
    (1, TIME '09:30', 'Pilates Reformer: Level 1+'),
    (1, TIME '10:30', 'Pilates Reformer: Core, Arms + Glutes'),
    (1, TIME '12:00', 'Pilates Reformer: Level 1'),
    (1, TIME '16:30', 'Pilates Reformer: Level 2'),
    (1, TIME '17:30', 'Jump + Burn'),
    -- ── WEDNESDAY (7) ──
    (2, TIME '06:30', 'Pilates Reformer: Flow Beyond Basics'),
    (2, TIME '07:30', 'Pilates Reformer: Level 2'),
    (2, TIME '08:30', 'Pilates Reformer: Level 1'),
    (2, TIME '12:30', 'Strength'),
    (2, TIME '16:30', 'Pilates Reformer: Core, Arms + Glutes'),
    (2, TIME '17:30', 'Pilates Reformer: Level 1'),
    (2, TIME '18:30', 'Pilates Reformer: Level 2'),
    -- ── THURSDAY (8) ──
    (3, TIME '06:30', 'Pilates Reformer: Flow Beyond Basics'),
    (3, TIME '07:30', 'Pilates Reformer: Level 1+'),
    (3, TIME '08:30', 'Pilates Reformer: Level 2'),
    (3, TIME '09:30', 'Pilates Reformer: Upper Body & Core Sculpt'),
    (3, TIME '10:30', 'Pilates Reformer: Core, Arms + Glutes'),
    (3, TIME '12:00', 'Pilates Reformer: Upper Body & Core Sculpt'),
    (3, TIME '16:30', 'Pilates Reformer + Mat: Beginner Level'),
    (3, TIME '17:30', 'Pilates Reformer: Level 2'),
    -- ── FRIDAY (4) ──
    (4, TIME '06:30', 'Pilates Reformer: Flow Beyond Basics'),
    (4, TIME '07:30', 'Pilates Reformer: Level 1'),
    (4, TIME '08:30', 'Strength'),
    (4, TIME '12:30', 'Pilates Reformer: Level 2'),
    -- ── SATURDAY (4) ──
    (5, TIME '08:00', 'Pilates Reformer: Level 2'),
    (5, TIME '09:00', 'Pilates Reformer: Level 1'),
    (5, TIME '10:00', 'Pilates Reformer: Upper Body & Core Sculpt'),
    (5, TIME '11:00', 'Pilates Reformer: Core, Arms + Glutes'),
    -- ── SUNDAY (6) ──
    (6, TIME '08:00', 'Pilates Reformer: Level 1'),
    (6, TIME '09:00', 'Pilates Reformer: Level 2'),
    (6, TIME '10:00', 'Restorative Pilates Mat Stretch'),
    (6, TIME '11:30', 'Pilates Reformer: Core, Arms + Glutes'),
    (6, TIME '12:30', 'Pilates Reformer: Level 2'),
    (6, TIME '15:30', 'Pilates Reformer: Level 1+')
  ) AS tmpl(dow, start_time, name)
  CROSS JOIN generate_series(0, 12) AS w(wk)
) t
WHERE t.starts_at >= CURRENT_DATE
ORDER BY t.starts_at;

COMMIT;
