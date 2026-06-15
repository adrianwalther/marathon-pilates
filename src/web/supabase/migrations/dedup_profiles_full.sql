-- ONE-TIME DEDUP of the Arketa double-import (2026-06-02 audit finding).
-- 18,748 profiles, but 8,848 emails appear EXACTLY twice (17,696 rows) — the
-- import ran twice. Verified safe: 0 of the duplicate rows have any bookings,
-- credits, or memberships, and the pairs are identical (same name/fields, same
-- created date). Net effect: delete 8,848 inert copies → ~9,900 real clients.
--
-- DESTRUCTIVE (deletes profile rows). Run in the Supabase SQL editor. It is
-- guarded so it can ONLY ever delete a row with zero attached activity, and it
-- ends by adding a UNIQUE index so duplicates can't recur (that index creation
-- will FAIL if any dup somehow remains — a built-in safety check).

-- STEP 0 (optional preview — run this SELECT first to see what will happen):
--   select count(*) as will_delete from (
--     select id, row_number() over (partition by lower(email)
--       order by (case when exists(select 1 from auth.users u where u.id=profiles.id) then 0 else 1 end),
--                updated_at desc nulls last, created_at asc, id) rn
--     from profiles where email is not null
--   ) r where rn > 1;

-- STEP 1 — delete the inert duplicate(s) per email, keeping the best row:
--   priority: has an auth login > most recently updated > earliest created > id.
with ranked as (
  select p.id,
    row_number() over (
      partition by lower(p.email)
      order by
        (case when exists (select 1 from auth.users u where u.id = p.id) then 0 else 1 end),
        p.updated_at desc nulls last,
        p.created_at asc,
        p.id
    ) as rn
  from profiles p
  where p.email is not null
)
delete from profiles
where id in (select id from ranked where rn > 1)
  and not exists (select 1 from bookings    b where b.client_id = profiles.id)
  and not exists (select 1 from credits     c where c.client_id = profiles.id)
  and not exists (select 1 from memberships m where m.client_id = profiles.id);

-- STEP 2 — prevent recurrence. Fails loudly if any duplicate email still exists.
create unique index if not exists profiles_email_lower_uidx
  on public.profiles (lower(email)) where email is not null;

-- STEP 3 — verify (should return 0):
--   select count(*) from (select lower(email) from profiles where email is not null
--     group by lower(email) having count(*) > 1) d;
