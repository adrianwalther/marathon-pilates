import Stripe from 'stripe'
import { isStripeConfigured, stripeNotConfiguredResponse } from '@/lib/env'
import { createClient } from '@supabase/supabase-js'
import { fulfillGiftCard } from '@/lib/fulfillment'

// Best-effort INSTANT-feedback endpoint after a gift-card purchase (returns the
// code to the buyer's success screen). The signed Stripe webhook fulfills the
// same way and is the source of truth. Idempotent + safe to race with it.

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    console.error('[gift-card-create] STRIPE_SECRET_KEY is not configured')
    return stripeNotConfiguredResponse()
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  try {
    const { stripe_session_id } = await req.json()
    if (!stripe_session_id) return Response.json({ error: 'Missing session ID' }, { status: 400 })

    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const session = await stripe.checkout.sessions.retrieve(stripe_session_id)
    if (session.payment_status !== 'paid') {
      return Response.json({ error: 'Payment not completed' }, { status: 400 })
    }
    // Ownership: only the buyer may mint/read the card (the code is returned).
    if (session.metadata?.purchaser_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const r = await fulfillGiftCard(supabase, session)
    if (!r.ok) {
      console.error('Gift card create failed:', r.error)
      return Response.json({ error: 'Failed to create gift card' }, { status: 500 })
    }
    return Response.json({ code: r.code, amount: r.amount })
  } catch (err) {
    console.error('Gift card create error:', err)
    return Response.json({ error: 'Failed to create gift card' }, { status: 500 })
  }
}
