-- Keep profiles.total_classes_completed in sync with the number of classes a
-- client has actually completed.
--
-- WHY: attendance is marked from the client (instructor roster + schedule page)
-- by setting bookings.status = 'completed'. Nothing was updating the cached
-- counter, so "Classes Done", the milestone progress bar, and the "new client"
-- badge (total_classes_completed < 3) were all frozen at the signup value.
--
-- A trigger is the right layer: it's atomic, can't be bypassed by whichever
-- code path marks attendance, and it RECOMPUTES the count from source on every
-- change (mark present / no-show / un-mark / cancel / delete), so it can never
-- drift. SECURITY DEFINER lets it update the client's profile regardless of the
-- RLS context of whoever changed the booking.

create or replace function public.sync_classes_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
  set total_classes_completed = (
    select count(*) from public.bookings b
    where b.client_id = p.id and b.status = 'completed'
  )
  where p.id = coalesce(NEW.client_id, OLD.client_id);
  return null;
end;
$$;

drop trigger if exists trg_sync_classes_completed on public.bookings;
create trigger trg_sync_classes_completed
after insert or delete or update of status on public.bookings
for each row execute function public.sync_classes_completed();

-- One-time backfill so existing data is correct (currently a no-op: no
-- completed bookings yet, but keeps the migration self-healing if re-run later).
update public.profiles p
set total_classes_completed = (
  select count(*) from public.bookings b
  where b.client_id = p.id and b.status = 'completed'
)
where coalesce(p.total_classes_completed, 0) <> (
  select count(*) from public.bookings b
  where b.client_id = p.id and b.status = 'completed'
);
