-- SECURITY FIX (2026-06-02 audit) — applied live via MCP.
-- CRITICAL: clients held direct INSERT + UPDATE on bookings. Combined with the
-- Stripe-return handler (dashboard/schedule), any logged-in user could mint a
-- free 'confirmed' booking for ANY session — bypassing payment, capacity, and
-- the credit-deducting book_session RPC. Real bookings/cancels run through the
-- service-role RPCs (book_session / cancel_booking), which bypass RLS, so
-- clients need no direct write access.
drop policy if exists "Clients create own bookings" on public.bookings;
drop policy if exists "Clients update own bookings" on public.bookings;

-- BONUS FIX: staff mark attendance from the roster/schedule using the authed
-- client (not service-role), but there was NO staff UPDATE policy — so
-- attendance marking was silently RLS-denied (0 bookings ever reached
-- 'completed'). This restores it.
drop policy if exists "Staff update bookings" on public.bookings;
create policy "Staff update bookings" on public.bookings
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());
