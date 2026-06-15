-- PAYMENT FIX (2026-06-02 audit) — applied live via MCP.
-- Make paid-checkout fulfillment truly idempotent so the signed Stripe webhook
-- AND the client-confirm endpoints can both run (even concurrently) without
-- double-granting. Partial indexes ignore non-Stripe rows (e.g. manually granted
-- credits with NULL stripe_session_id).
create unique index if not exists memberships_stripe_session_uidx
  on public.memberships (stripe_session_id) where stripe_session_id is not null;
create unique index if not exists credits_stripe_session_uidx
  on public.credits (stripe_session_id) where stripe_session_id is not null;
create unique index if not exists gift_cards_payment_intent_uidx
  on public.gift_cards (stripe_payment_intent_id) where stripe_payment_intent_id is not null;

-- Webhook-level idempotency ledger: each Stripe event is processed at most once.
create table if not exists public.stripe_events (
  event_id text primary key,
  type text,
  processed_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;
-- No policies → only service_role (which bypasses RLS) can read/write it.
