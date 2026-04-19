import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getCheckoutRatelimit } from "@/lib/ratelimit"

type PlanConfig = {
  name: string
  amount: number // in cents
  mode: 'payment' | 'subscription'
  credits?: number
  creditType?: string
  membershipType: string
}

const PLANS: Record<string, PlanConfig> = {
  // Subscriptions
  unlimited: {
    name: 'Unlimited Membership',
    amount: 28900,
    mode: 'subscription',
    membershipType: 'unlimited',
  },
  eight_class: {
    name: '8-Class Monthly Membership',
    amount: 22400,
    mode: 'subscription',
    credits: 8,
    creditType: 'group',
    membershipType: 'eight_class',
  },
  four_class: {
    name: '4-Class Monthly Membership',
    amount: 12800,
    mode: 'subscription',
    credits: 4,
    creditType: 'group',
    membershipType: 'four_class',
  },
  on_demand: {
    name: 'On Demand Subscription',
    amount: 1000,
    mode: 'subscription',
    membershipType: 'on_demand',
  },
  // One-time class packs
  drop_in: {
    name: 'Single Class',
    amount: 4000,
    mode: 'payment',
    credits: 1,
    creditType: 'group',
    membershipType: 'drop_in',
  },
  five_class_pack: {
    name: '5 Class Pack',
    amount: 17500,
    mode: 'payment',
    credits: 5,
    creditType: 'group',
    membershipType: 'drop_in',
  },
  ten_class_pack: {
    name: '10 Class Pack',
    amount: 33000,
    mode: 'payment',
    credits: 10,
    creditType: 'group',
    membershipType: 'drop_in',
  },
  // Amenity packs — TODO: confirm prices with Ruby
  sauna_single: {
    name: 'Single Sauna Session',
    amount: 3500,
    mode: 'payment',
    credits: 1,
    creditType: 'amenity',
    membershipType: 'drop_in',
  },
  sauna_five_pack: {
    name: 'Sauna 5-Pack',
    amount: 15000,
    mode: 'payment',
    credits: 5,
    creditType: 'amenity',
    membershipType: 'drop_in',
  },
  cold_plunge_single: {
    name: 'Single Cold Plunge Session',
    amount: 3000,
    mode: 'payment',
    credits: 1,
    creditType: 'amenity',
    membershipType: 'drop_in',
  },
  cold_plunge_five_pack: {
    name: 'Cold Plunge 5-Pack',
    amount: 12500,
    mode: 'payment',
    credits: 5,
    creditType: 'amenity',
    membershipType: 'drop_in',
  },
  contrast_single: {
    name: 'Single Contrast Therapy Session',
    amount: 4500,
    mode: 'payment',
    credits: 1,
    creditType: 'amenity',
    membershipType: 'drop_in',
  },
}

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  try {
    const { plan_key, user_id } = await req.json()

    // Verify the requester is authenticated and matches the user_id
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user || user.id !== user_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { success } = await getCheckoutRatelimit().limit(user.id)
    if (!success) return Response.json({ error: 'Too many requests — please wait before trying again.' }, { status: 429 })

    const plan = PLANS[plan_key]
    if (!plan) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', user_id)
      .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://marathon-pilates.vercel.app'

    const lineItem = plan.mode === 'subscription'
      ? {
          price_data: {
            currency: 'usd',
            product_data: { name: plan.name },
            unit_amount: plan.amount,
            recurring: { interval: 'month' as const },
          },
          quantity: 1,
        }
      : {
          price_data: {
            currency: 'usd',
            product_data: { name: plan.name },
            unit_amount: plan.amount,
          },
          quantity: 1,
        }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: profile?.email ?? undefined,
      line_items: [lineItem],
      mode: plan.mode,
      success_url: `${appUrl}/dashboard/membership?success=${plan_key}&stripe_session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/membership`,
      metadata: { plan_key, user_id },
    })

    return Response.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('Membership checkout error:', err)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
