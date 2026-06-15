-- SECURITY FIX (2026-06-02 audit) — applied live via MCP.
-- Two CRITICALs on public.profiles (18.7k real client rows):
--   (1) PII/health exposure: the "Admins can view all profiles" SELECT policy
--       was USING(true) — every authenticated user could read all clients'
--       health_conditions, DOB, emergency contacts, waiver signature, etc.
--   (2) Privilege escalation: authenticated/anon hold UPDATE on profiles.role
--       and the UPDATE policy is (auth.uid()=id), so a client could set their
--       own role to 'owner'.

-- is_staff(): SECURITY DEFINER so it reads profiles.role WITHOUT re-triggering
-- profiles RLS (avoids infinite recursion inside a profiles policy).
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('owner','admin','instructor')
  );
$$;
revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- (1) Restrict all-profiles read to staff. Own-row read stays via the separate
-- "Users can view own profile" policy.
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Staff can view all profiles" on public.profiles
  for select to authenticated
  using (public.is_staff());

-- (2) Silently preserve role on client-facing updates; service_role (admin API)
-- and internal callers may still change it.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated','anon') and NEW.role is distinct from OLD.role then
    NEW.role := OLD.role;
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();
