-- ============================================================
-- Migration 004: RLS Security Fixes
-- Fixes critical tables missing Row Level Security
-- ============================================================

-- ── payroll_periods ──────────────────────────────────────────
alter table if exists payroll_periods enable row level security;

drop policy if exists "payroll_periods_admin_all" on payroll_periods;
create policy "payroll_periods_admin_all" on payroll_periods
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin')
    )
  );

drop policy if exists "payroll_periods_manager_read" on payroll_periods;
create policy "payroll_periods_manager_read" on payroll_periods
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
    )
  );

-- ── payroll_line_items ───────────────────────────────────────
alter table if exists payroll_line_items enable row level security;

drop policy if exists "payroll_line_items_admin_all" on payroll_line_items;
create policy "payroll_line_items_admin_all" on payroll_line_items
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin')
    )
  );

drop policy if exists "payroll_line_items_manager_read" on payroll_line_items;
create policy "payroll_line_items_manager_read" on payroll_line_items
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
    )
  );

drop policy if exists "payroll_line_items_instructor_own" on payroll_line_items;
create policy "payroll_line_items_instructor_own" on payroll_line_items
  for select using (
    instructor_id = auth.uid()
  );

-- ── instructor_profiles ──────────────────────────────────────
alter table if exists instructor_profiles enable row level security;

drop policy if exists "instructor_profiles_own" on instructor_profiles;
create policy "instructor_profiles_own" on instructor_profiles
  for all using (
    id = auth.uid()
  );

drop policy if exists "instructor_profiles_admin_all" on instructor_profiles;
create policy "instructor_profiles_admin_all" on instructor_profiles
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
    )
  );

drop policy if exists "instructor_profiles_staff_read" on instructor_profiles;
create policy "instructor_profiles_staff_read" on instructor_profiles
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager', 'instructor')
    )
  );

-- ── waitlist_entries ─────────────────────────────────────────
alter table if exists waitlist_entries enable row level security;

drop policy if exists "waitlist_own" on waitlist_entries;
create policy "waitlist_own" on waitlist_entries
  for all using (
    client_id = auth.uid()
  );

drop policy if exists "waitlist_staff_read" on waitlist_entries;
create policy "waitlist_staff_read" on waitlist_entries
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager', 'front_desk', 'instructor')
    )
  );

-- ── gift_cards ───────────────────────────────────────────────
-- Ensure RLS is enabled (policy defined in 002 but RLS not confirmed in 001)
alter table if exists gift_cards enable row level security;

-- ── session_templates ────────────────────────────────────────
alter table if exists session_templates enable row level security;

drop policy if exists "session_templates_public_read" on session_templates;
create policy "session_templates_public_read" on session_templates
  for select using (auth.uid() is not null);

drop policy if exists "session_templates_admin_write" on session_templates;
create policy "session_templates_admin_write" on session_templates
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
    )
  );
