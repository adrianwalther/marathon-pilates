-- is_staff() was missing 'owner' role, which prevented Ruby from reading
-- other clients' credits, bookings, and any table gated by this function.
-- The add_owner_to_rls_policies.sql migration patched individual ARRAY-form
-- policies but didn't fix the function itself.
create or replace function is_staff()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('owner', 'admin', 'manager', 'front_desk', 'instructor')
  );
$$ language sql security definer;
