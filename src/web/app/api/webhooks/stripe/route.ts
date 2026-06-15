import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { notifyBookingConfirmed } from '@/lib/emails/notify'
import { fulfillClassBooking, fulfillMembership, fulfillGiftCard } from '@/lib/fulfillment'

// Signed Stripe webhook — the SINGLE source of truth for fulfilling paid
// checkouts (class bookings, memberships/packs, gift cards). Previously only
// class bookings were handled here and everything else relied on the client
// hitting a success-URL endpoint, so closing the tab after paying = paid-but-
// nothing. Now every product type is fulfilled here, idempotently, and any
// failure returns non-2xx so Stripe retries.

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body = await req.text() // raw body required for signature verification
  const sig = req.headers.get('stripe-signature')
  if (!sig) return Response.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return Response.json({ received: true })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Idempotency: claim the event once. A duplicate delivery hits the PK and is
  // acked without re-fulfilling. (Fulfillment itself is also idempotent via the
  // unique indexes, so this is defense-in-depth.)
  const { error: claimErr } = await supabase
    .from('stripe_events')
    .insert({ event_id: event.id, type: event.type })
  if (claimErr) {
    return Response.json({ received: true, duplicate: true })
  }

  // On failure: release the claim so Stripe's retry can reprocess, and return
  // non-2xx so Stripe actually retries (instead of the old always-200).
  const fail = async (msg: string) => {
    console.error('Webhook fulfillment failed:', event.id, msg)
    await supabase.from('stripe_events').delete().eq('event_id', event.id)
    return Response.json({ error: 'fulfillment failed' }, { status: 500 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const meta = session.metadata ?? {}

  try {
    if (meta.type === 'gift_card') {
      const r = await fulfillGiftCard(supabase, session)
      if (!r.ok) return fail(r.error ?? 'gift_card')
    } else if (meta.session_id) {
      const r = await fulfillClassBooking(supabase, session)
      if (!r.ok) return fail(r.error ?? 'class_booking')
      // Best-effort confirmation email — never fails the webhook.
      await notifyBookingConfirmed(supabase, {
        clientId: meta.user_id!,
        sessionId: meta.session_id,
        waitlisted: false,
      }).catch(() => {})
    } else if (meta.plan_key) {
      const r = await fulfillMembership(supabase, session)
      if (!r.ok) return fail(r.error ?? 'membership')
    }
    // Unknown metadata shape → nothing to fulfill; event is claimed, ack it.
    return Response.json({ received: true })
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err))
  }
}
