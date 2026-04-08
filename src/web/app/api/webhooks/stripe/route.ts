import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return Response.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { session_id, user_id } = session.metadata ?? {}

    if (!session_id || !user_id) {
      return Response.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const amountPaid = (session.amount_total ?? 0) / 100

    // Check if spot is still available
    const { data: existing } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('client_id', user_id)
      .eq('session_id', session_id)
      .single()

    if (existing) {
      // Update existing booking to confirmed + paid
      await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          amount_paid: amountPaid,
          payment_status: 'paid',
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq('id', existing.id)
    } else {
      // Atomically check capacity + insert — eliminates the race condition
      // between the capacity check and the insert
      await supabase.rpc('book_session', {
        p_session_id: session_id,
        p_client_id: user_id,
        p_amount_paid: amountPaid,
        p_payment_status: 'paid',
        p_stripe_payment_intent_id: session.payment_intent as string,
      })
    }
  }

  return Response.json({ received: true })
}
