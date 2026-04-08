-- ============================================================
-- Marathon Pilates Platform — Row Level Security Policies
-- Migration 002
-- ============================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table intake_questionnaires enable row level security;
alter table instructors enable row level security;
alter table locations enable row level security;
alter table resources enable row level security;
alter table class_templates enable row level security;
alter table class_sessions enable row level security;
alter table membership_plans enable row level security;
alter table memberships enable row level security;
alter table credits enable row level security;
alter table purchases enable row level security;
alter table bookings enable row level security;
alter table private_sessions enable row level security;
alter table private_session_bookings enable row level security;
alter table amenity_sessions enable row level security;
alter table instructor_availability enable row level security;
alter table gift_cards enable row level security;
alter table gift_card_redemptions enable row level security;
alter table staff_shifts enable row level security;
alter table pay_periods enable row level security;
alter table payroll_line_items enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table on_demand_videos enable row level security;
alter table cancel_policies enable row level security;

-- ============================================================
-- Helper functions
-- ============================================================

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

create or replace function is_staff()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('admin', 'manager', 'front_desk', 'instructor')
  );
$$ language sql security definer;

create or replace function is_instructor()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('admin', 'manager', 'instructor')
  );
$$ language sql security definer;

-- ============================================================
-- PROFILES
-- ============================================================

-- Clients can read/update their own profile
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- Staff can read all profiles
create policy "profiles_select_staff" on profiles
  for select using (is_staff());

-- Admin can do everything
create policy "profiles_all_admin" on profiles
  for all using (is_admin());

-- ============================================================
-- LOCATIONS (public read)
-- ============================================================

create policy "locations_public_read" on locations
  for select using (true);

create policy "locations_admin_write" on locations
  for all using (is_admin());

-- ============================================================
-- CLASS SESSIONS (public read for active sessions)
-- ============================================================

create policy "class_sessions_public_read" on class_sessions
  for select using (not is_cancelled);

create policy "class_sessions_staff_all" on class_sessions
  for all using (is_staff());

-- ============================================================
-- CLASS TEMPLATES (public read)
-- ============================================================

create policy "class_templates_public_read" on class_templates
  for select using (is_active);

create policy "class_templates_admin_write" on class_templates
  for all using (is_admin());

-- ============================================================
-- MEMBERSHIP PLANS (public read for active plans)
-- ============================================================

create policy "membership_plans_public_read" on membership_plans
  for select using (is_active);

create policy "membership_plans_admin_write" on membership_plans
  for all using (is_admin());

-- ============================================================
-- MEMBERSHIPS
-- ============================================================

create policy "memberships_select_own" on memberships
  for select using (auth.uid() = client_id);

create policy "memberships_staff_all" on memberships
  for all using (is_staff());

-- ============================================================
-- CREDITS
-- ============================================================

create policy "credits_select_own" on credits
  for select using (auth.uid() = client_id);

create policy "credits_staff_all" on credits
  for all using (is_staff());

-- ============================================================
-- PURCHASES
-- ============================================================

create policy "purchases_select_own" on purchases
  for select using (auth.uid() = client_id);

create policy "purchases_staff_all" on purchases
  for all using (is_staff());

-- ============================================================
-- BOOKINGS
-- ============================================================

create policy "bookings_select_own" on bookings
  for select using (auth.uid() = client_id);

create policy "bookings_insert_own" on bookings
  for insert with check (auth.uid() = client_id);

create policy "bookings_update_own" on bookings
  for update using (auth.uid() = client_id);

create policy "bookings_staff_all" on bookings
  for all using (is_staff());

-- Instructors can see bookings for their own sessions
create policy "bookings_instructor_sessions" on bookings
  for select using (
    exists (
      select 1 from class_sessions cs
      where cs.id = bookings.session_id
      and (cs.instructor_id = auth.uid() or cs.substitute_instructor_id = auth.uid())
    )
  );

-- ============================================================
-- PRIVATE SESSIONS
-- ============================================================

create policy "private_sessions_public_read" on private_sessions
  for select using (not is_cancelled);

create policy "private_sessions_staff_all" on private_sessions
  for all using (is_staff());

-- Instructors can see their own private sessions
create policy "private_sessions_instructor_own" on private_sessions
  for select using (instructor_id = auth.uid());

-- ============================================================
-- PRIVATE SESSION BOOKINGS
-- ============================================================

create policy "private_session_bookings_own" on private_session_bookings
  for select using (auth.uid() = client_id);

create policy "private_session_bookings_insert_own" on private_session_bookings
  for insert with check (auth.uid() = client_id);

create policy "private_session_bookings_staff_all" on private_session_bookings
  for all using (is_staff());

-- ============================================================
-- AMENITY SESSIONS
-- ============================================================

create policy "amenity_sessions_own" on amenity_sessions
  for select using (auth.uid() = client_id or auth.uid() = member_id);

create policy "amenity_sessions_insert_own" on amenity_sessions
  for insert with check (auth.uid() = client_id or auth.uid() = member_id);

create policy "amenity_sessions_update_own" on amenity_sessions
  for update using (auth.uid() = client_id);

create policy "amenity_sessions_staff_all" on amenity_sessions
  for all using (is_staff());

-- ============================================================
-- INTAKE QUESTIONNAIRES
-- ============================================================

create policy "intake_own" on intake_questionnaires
  for all using (auth.uid() = client_id);

create policy "intake_staff_read" on intake_questionnaires
  for select using (is_staff());

-- ============================================================
-- INSTRUCTORS (public read for active)
-- ============================================================

create policy "instructors_public_read" on instructors
  for select using (is_active);

create policy "instructors_own" on instructors
  for update using (auth.uid() = id);

create policy "instructors_admin_all" on instructors
  for all using (is_admin());

-- ============================================================
-- INSTRUCTOR AVAILABILITY
-- ============================================================

create policy "availability_public_read" on instructor_availability
  for select using (is_available);

create policy "availability_instructor_own" on instructor_availability
  for all using (auth.uid() = instructor_id);

create policy "availability_admin_all" on instructor_availability
  for all using (is_admin());

-- ============================================================
-- GIFT CARDS
-- ============================================================

create policy "gift_cards_own" on gift_cards
  for select using (
    auth.uid() = purchased_by_id or
    auth.uid()::text = (select id::text from profiles where email = gift_cards.recipient_email limit 1)
  );

create policy "gift_cards_staff_all" on gift_cards
  for all using (is_staff());

-- ============================================================
-- STAFF SHIFTS
-- ============================================================

create policy "shifts_own" on staff_shifts
  for select using (auth.uid() = staff_id);

create policy "shifts_insert_own" on staff_shifts
  for insert with check (auth.uid() = staff_id);

create policy "shifts_update_own" on staff_shifts
  for update using (auth.uid() = staff_id);

create policy "shifts_admin_all" on staff_shifts
  for all using (is_admin());

-- ============================================================
-- PAY PERIODS + PAYROLL (admin/manager only)
-- ============================================================

create policy "pay_periods_admin" on pay_periods
  for all using (is_admin() or is_instructor());

create policy "payroll_items_admin" on payroll_line_items
  for select using (
    is_admin() or auth.uid() = employee_id
  );

create policy "payroll_items_admin_write" on payroll_line_items
  for all using (is_admin());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create policy "notifications_own" on notifications
  for select using (auth.uid() = recipient_id);

create policy "notifications_admin_all" on notifications
  for all using (is_admin());

-- ============================================================
-- AUDIT LOGS (admin only)
-- ============================================================

create policy "audit_logs_admin" on audit_logs
  for all using (is_admin());

-- ============================================================
-- ON-DEMAND VIDEOS
-- ============================================================

-- Published videos are readable by anyone with an account
create policy "on_demand_published" on on_demand_videos
  for select using (is_published and auth.uid() is not null);

create policy "on_demand_admin" on on_demand_videos
  for all using (is_admin());

-- ============================================================
-- CANCEL POLICIES (public read)
-- ============================================================

create policy "cancel_policies_public" on cancel_policies
  for select using (true);

create policy "cancel_policies_admin" on cancel_policies
  for all using (is_admin());

-- ============================================================
-- RESOURCES (public read)
-- ============================================================

create policy "resources_public_read" on resources
  for select using (is_active);

create policy "resources_admin_write" on resources
  for all using (is_admin());
