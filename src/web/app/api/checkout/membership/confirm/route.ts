import Stripe from 'stripe'
import { isStripeConfigured, stripeNotConfiguredResponse } from '@/lib/env'
import { createClient } from '@supabase/supabase-js'
import { fulfillMembership } from '@/lib/fulfillment'

// Best-effort INSTANT-feedback endpoint after a membership/pack purchase. The
// signed Stripe webhook is the real source of truth and fulfills the same way;
// this just lets the success screen reflect it immediately. Idempotent + safe
// to race with the webhook (shared fulfillment, unique-indexed).

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    console.error('[membership-confirm] STRIPE_SECRET_KEY is not configured')
    return stripeNotConfiguredResponse()
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  try {
    const { stripe_session_id } = await req.json()
    if (!stripe_session_id) return Response.json({ error: 'Missing session ID' }, { status: 400 })

    // Authenticate the caller (was previously UNAUTHENTICATED).
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const session = await stripe.checkout.sessions.retrieve(stripe_session_id)
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return Response.json({ error: 'Payment not completed' }, { status: 400 })
    }
    // Ownership: only the buyer named in the session may trigger fulfillment.
    if (session.metadata?.user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const r = await fulfillMembership(supabase, session)
    if (!r.ok) {
      console.error('Membership confirm fulfillment failed:', r.error)
      return Response.json({ error: 'Failed to confirm payment' }, { status: 500 })
    }
    return Response.json({ success: true, already_processed: r.alreadyDone ?? false })
  } catch (err) {
    console.error('Confirm error:', err)
    return Response.json({ error: 'Failed to confirm payment' }, { status: 500 })
  }
}
