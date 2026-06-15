-- SECURITY FIX (2026-06-02 audit) — applied live via MCP.
-- HIGH: scheduled_sessions has a public "Anyone can view sessions" SELECT policy
-- (USING true), which exposed instructor_pay_amount/tier to anyone (even anon).
-- RLS can't filter columns, so revoke column-level SELECT from the public API
-- roles. No app code reads these columns (payroll computes pay from attendee
-- tiers); service_role retains access.
revoke select (instructor_pay_amount, instructor_pay_tier)
  on public.scheduled_sessions from anon, authenticated;

-- INTEGRITY: bookings.credit_used referenced credits(id) by comment only (no FK).
-- Verified 0 orphans. NO ACTION (default) keeps refund linkage intact — a credit
-- a booking still points at can't be deleted out from under it.
alter table public.bookings
  add constraint bookings_credit_used_fkey
  foreign key (credit_used) references public.credits(id);
