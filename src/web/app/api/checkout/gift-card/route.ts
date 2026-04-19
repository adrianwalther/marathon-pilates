import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getCheckoutRatelimit } from "@/lib/ratelimit"

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  try {
    const { amount, recipient_name, recipient_email, message, is_physical, user_id } = await req.json()

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

    if (!amount || amount <= 0 || amount > 10000) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Validate recipient email format
    if (recipient_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient_email)) {
      return Response.json({ error: 'Invalid recipient email' }, { status: 400 })
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

    const description = is_physical
      ? 'Physical gift card — available for pickup at either studio'
      : recipient_name
        ? `Digital gift card for ${recipient_name}`
        : 'Digital gift card'

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: profile?.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Marathon Pilates Gift Card',
              description,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/dashboard/gift-cards?gift_success=true&stripe_session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/gift-cards`,
      metadata: {
        type: 'gift_card',
        amount: String(amount),
        recipient_name: recipient_name ?? '',
        recipient_email: recipient_email ?? '',
        message: message ?? '',
        is_physical: String(is_physical),
        purchaser_id: user_id,
      },
    })

    return Response.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('Gift card checkout error:', err)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
