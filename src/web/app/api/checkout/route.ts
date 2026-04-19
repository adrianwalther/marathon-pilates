import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getCheckoutRatelimit } from "@/lib/ratelimit"

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  try {
    const { session_id, user_id } = await req.json()

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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the scheduled session
    const { data: sessionRaw, error } = await supabase
      .from('scheduled_sessions')
      .select('name, drop_in_price, starts_at, locations(name)')
      .eq('id', session_id)
      .single()

    if (error || !sessionRaw) {
      return Response.json({ error: 'Session not found' }, { status: 404 })
    }

    const session = sessionRaw as typeof sessionRaw & { locations: { name: string } | null }

    if (!session.drop_in_price) {
      return Response.json({ error: 'No price set for this session' }, { status: 400 })
    }

    // Get user email for prefill
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', user_id)
      .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://marathon-pilates.vercel.app'
    const sessionDate = new Date(session.starts_at).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
    })

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: profile?.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: session.name,
              description: `${sessionDate} · ${session.locations?.name ?? ''}`,
            },
            unit_amount: Math.round(session.drop_in_price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/dashboard/schedule?payment=success&session_id=${session_id}`,
      cancel_url: `${appUrl}/dashboard/schedule?payment=cancelled`,
      metadata: {
        session_id,
        user_id,
      },
    })

    return Response.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
