// Shared, idempotent fulfillment for paid Stripe checkouts.
//
// WHY: previously only CLASS bookings were fulfilled by the signed webhook;
// memberships/packs/gift-cards were granted by client-redirect endpoints hit
// from the success URL. If the customer closed the tab after paying, they got
// nothing and no record tied the charge to the missing grant. Now the webhook
// is the source of truth and calls these functions; the confirm endpoints call
// the SAME functions purely for instant UI feedback. Both are safe to run
// (even concurrently) thanks to the unique indexes on stripe_session_id /
// stripe_payment_intent_id (see migration payment_idempotency_infra).
//
// Every function returns { ok, error?, alreadyDone? } and NEVER throws for an
// expected condition — callers decide whether to retry (webhook → non-2xx).

import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

export type FulfillResult = { ok: boolean; error?: string; alreadyDone?: boolean }

const CREDIT_CONFIG: Record<string, { credits: number; type: string }> = {
  four_class:            { credits: 4,  type: 'group' },
  eight_class:           { credits: 8,  type: 'group' },
  drop_in:               { credits: 1,  type: 'group' },
  five_class_pack:       { credits: 5,  type: 'group' },
  ten_class_pack:        { credits: 10, type: 'group' },
  sauna_single:          { credits: 1,  type: 'amenity' },
  sauna_five_pack:       { credits: 5,  type: 'amenity' },
  cold_plunge_single:    { credits: 1,  type: 'amenity' },
  cold_plunge_five_pack: { credits: 5,  type: 'amenity' },
  contrast_single:       { credits: 1,  type: 'amenity' },
}
const SUBSCRIPTION_PLANS = ['unlimited', 'eight_class', 'four_class', 'on_demand']

// Grant a membership (+ its bundled credits) for a paid session. Idempotent on
// memberships.stripe_session_id / credits.stripe_session_id.
export async function fulfillMembership(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<FulfillResult> {
  const { plan_key, user_id } = session.metadata ?? {}
  if (!plan_key || !user_id) return { ok: false, error: 'missing plan_key/user_id' }

  const { data: existing, error: exErr } = await supabase
    .from('memberships').select('id')
    .eq('stripe_session_id', session.id).maybeSingle()
  if (exErr) return { ok: false, error: `membership lookup: ${exErr.message}` }
  if (existing) return { ok: true, alreadyDone: true }

  const now = new Date().toISOString()
  const isSubscription = SUBSCRIPTION_PLANS.includes(plan_key)

  if (isSubscription) {
    const { error } = await supabase.from('memberships')
      .update({ status: 'cancelled' }).eq('client_id', user_id).eq('status', 'active')
    if (error) return { ok: false, error: `deactivate prior: ${error.message}` }
  }

  const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1)
  const { error: insErr } = await supabase.from('memberships').upsert({
    client_id: user_id,
    membership_type: plan_key === 'five_class_pack' || plan_key === 'ten_class_pack' ? 'drop_in' : plan_key,
    status: 'active',
    starts_at: now,
    billing_cycle_start: isSubscription ? now : null,
    billing_cycle_end: isSubscription ? nextMonth.toISOString() : null,
    stripe_session_id: session.id,
    stripe_subscription_id: (session.subscription as string | null) ?? null,
  }, { onConflict: 'stripe_session_id', ignoreDuplicates: true })
  if (insErr) return { ok: false, error: `membership insert: ${insErr.message}` }

  const creditCfg = CREDIT_CONFIG[plan_key]
  if (creditCfg) {
    const expiresAt = new Date(); expiresAt.setMonth(expiresAt.getMonth() + (isSubscription ? 1 : 3))
    const { error: credErr } = await supabase.from('credits').upsert({
      client_id: user_id,
      credit_type: creditCfg.type,
      total_credits: creditCfg.credits,
      used_credits: 0,
      source: plan_key,
      expires_at: expiresAt.toISOString(),
      stripe_session_id: session.id,
    }, { onConflict: 'stripe_session_id', ignoreDuplicates: true })
    if (credErr) return { ok: false, error: `credits: ${credErr.message}` }
  }
  return { ok: true }
}

// Confirm/create a paid CLASS booking. Mirrors the prior inline webhook logic
// but with checked errors. Booking creation goes through the atomic book_session
// RPC (capacity-safe); an already-present row (e.g. a held waitlist spot) is just
// flipped to confirmed+paid.
export async function fulfillClassBooking(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<FulfillResult> {
  const { session_id, user_id } = session.metadata ?? {}
  if (!session_id || !user_id) return { ok: false, error: 'missing session_id/user_id' }
  const amountPaid = (session.amount_total ?? 0) / 100
  const pi = session.payment_intent as string

  const { data: existing, error: exErr } = await supabase
    .from('bookings').select('id')
    .eq('client_id', user_id).eq('session_id', session_id).maybeSingle()
  if (exErr) return { ok: false, error: `booking lookup: ${exErr.message}` }

  if (existing) {
    const { error } = await supabase.from('bookings').update({
      status: 'confirmed', amount_paid: amountPaid, payment_status: 'paid', stripe_payment_intent_id: pi,
    }).eq('id', existing.id)
    if (error) return { ok: false, error: `booking update: ${error.message}` }
  } else {
    const { error } = await supabase.rpc('book_session', {
      p_session_id: session_id,
      p_client_id: user_id,
      p_amount_paid: amountPaid,
      p_payment_status: 'paid',
      p_stripe_payment_intent_id: pi,
    })
    if (error) return { ok: false, error: `book_session: ${error.message}` }
  }
  return { ok: true }
}

function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  const segment = (offset: number) =>
    Array.from({ length: 4 }, (_, i) => chars[bytes[offset + i] % chars.length]).join('')
  return `${segment(0)}-${segment(4)}-${segment(8)}`
}

// Create a gift card for a paid session. Idempotent on
// gift_cards.stripe_payment_intent_id. Returns the code/amount (re-read on a
// duplicate so the buyer's confirm screen still gets it).
export async function fulfillGiftCard(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<FulfillResult & { code?: string; amount?: number }> {
  const pi = session.payment_intent as string | null
  if (!pi) return { ok: false, error: 'missing payment_intent' }
  const { amount, recipient_name, recipient_email, message, is_physical, purchaser_id } = session.metadata ?? {}

  const { data: existing, error: exErr } = await supabase
    .from('gift_cards').select('code, initial_balance')
    .eq('stripe_payment_intent_id', pi).maybeSingle()
  if (exErr) return { ok: false, error: `gift lookup: ${exErr.message}` }
  if (existing) return { ok: true, alreadyDone: true, code: existing.code, amount: existing.initial_balance }

  const code = generateGiftCode()
  const giftAmount = parseFloat(amount ?? '0')
  const { error: insErr } = await supabase.from('gift_cards').insert({
    code,
    initial_balance: giftAmount,
    current_balance: giftAmount,
    purchaser_id: purchaser_id ?? null,
    recipient_name: recipient_name || null,
    recipient_email: recipient_email || null,
    message: message || null,
    is_physical: is_physical === 'true',
    stripe_payment_intent_id: pi,
  })
  if (insErr) {
    // Lost a race with the webhook/confirm twin — the card already exists. Re-read it.
    const { data: now } = await supabase
      .from('gift_cards').select('code, initial_balance')
      .eq('stripe_payment_intent_id', pi).maybeSingle()
    if (now) return { ok: true, alreadyDone: true, code: now.code, amount: now.initial_balance }
    return { ok: false, error: `gift insert: ${insErr.message}` }
  }
  return { ok: true, code, amount: giftAmount }
}
