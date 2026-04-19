import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const CREDIT_CONFIG: Record<string, { credits: number; type: string }> = {
  four_class:          { credits: 4,  type: 'group' },
  eight_class:         { credits: 8,  type: 'group' },
  drop_in:             { credits: 1,  type: 'group' },
  five_class_pack:     { credits: 5,  type: 'group' },
  ten_class_pack:      { credits: 10, type: 'group' },
  sauna_single:        { credits: 1,  type: 'amenity' },
  sauna_five_pack:     { credits: 5,  type: 'amenity' },
  cold_plunge_single:  { credits: 1,  type: 'amenity' },
  cold_plunge_five_pack: { credits: 5, type: 'amenity' },
  contrast_single:     { credits: 1,  type: 'amenity' },
}

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  try {
    const { stripe_session_id } = await req.json()

    if (!stripe_session_id) {
      return Response.json({ error: 'Missing session ID' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(stripe_session_id)

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return Response.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const { plan_key, user_id } = session.metadata ?? {}

    if (!plan_key || !user_id) {
      return Response.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Strong idempotency check — both session ID AND user_id must match
    const { data: existing } = await supabase
      .from('memberships')
      .select('id')
      .eq('stripe_session_id', stripe_session_id)
      .eq('client_id', user_id)
      .single()

    if (existing) {
      return Response.json({ success: true, already_processed: true })
    }

    const now = new Date().toISOString()
    const isSubscription = ['unlimited', 'eight_class', 'four_class', 'on_demand'].includes(plan_key)

    // Deactivate existing memberships for subscriptions
    if (isSubscription) {
      await supabase
        .from('memberships')
        .update({ status: 'cancelled' })
        .eq('client_id', user_id)
        .eq('status', 'active')
    }

    // Create new membership record — upsert on stripe_session_id to handle race conditions
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const { error: insertError } = await supabase.from('memberships').upsert({
      client_id: user_id,
      membership_type: plan_key === 'five_class_pack' || plan_key === 'ten_class_pack' ? 'drop_in' : plan_key,
      status: 'active',
      starts_at: now,
      billing_cycle_start: isSubscription ? now : null,
      billing_cycle_end: isSubscription ? nextMonth.toISOString() : null,
      stripe_session_id,
      stripe_subscription_id: session.subscription as string | null,
    }, { onConflict: 'stripe_session_id', ignoreDuplicates: true })

    // Only add credits if the membership insert was new (not a duplicate)
    if (!insertError) {
      const creditCfg = CREDIT_CONFIG[plan_key]
      if (creditCfg) {
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + (isSubscription ? 1 : 3))

        await supabase.from('credits').upsert({
          client_id: user_id,
          credit_type: creditCfg.type,
          total_credits: creditCfg.credits,
          used_credits: 0,
          source: plan_key,
          expires_at: expiresAt.toISOString(),
          stripe_session_id,
        }, { onConflict: 'stripe_session_id', ignoreDuplicates: true })
      }
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('Confirm error:', err)
    return Response.json({ error: 'Failed to confirm payment' }, { status: 500 })
  }
}
