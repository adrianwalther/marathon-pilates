-- One-time cleanup: remove duplicate SEED profile rows so the admin client
-- roster doesn't show people twice during the beta.
--
-- Context: five demo emails each have 2 profile rows (distinct ids), all created
-- 2026-04-08/05-13 by seeding. Verified safe: every duplicate has 0 bookings,
-- 0 memberships, 0 client_events — nothing real is attached.
--
-- Logic: for each affected email, KEEP one canonical row (prefer the row that
-- has a real auth login, else the earliest-created) and delete the rest — but
-- ONLY if the row to delete has no bookings/memberships/events (belt + braces,
-- so this can never remove a real account even if data changes later).
-- Idempotent: safe to run more than once.

with ranked as (
  select p.id, p.email,
    row_number() over (
      partition by p.email
      order by
        case when exists (select 1 from auth.users au where au.id = p.id) then 0 else 1 end,
        p.created_at
    ) as rn
  from profiles p
  where p.email in (
    'jazzgodard@gmail.com',
    'kendrick.ruby@gmail.com',
    'kpjazz@gmail.com',
    'marathon@marathonpilates.com',
    'theresa@marathonpilates.com'
  )
)
delete from profiles
where id in (select id from ranked where rn > 1)
  and not exists (select 1 from bookings    b where b.client_id = profiles.id)
  and not exists (select 1 from memberships m where m.client_id = profiles.id)
  and not exists (select 1 from client_events e where e.client_id = profiles.id);

-- Verify: each email should now return exactly 1 row.
select email, count(*) as profile_rows
from profiles
where email in (
  'jazzgodard@gmail.com',
  'kendrick.ruby@gmail.com',
  'kpjazz@gmail.com',
  'marathon@marathonpilates.com',
  'theresa@marathonpilates.com'
)
group by email
order by email;
