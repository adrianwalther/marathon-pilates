import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const randomBytes = crypto.getRandomValues(new Uint8Array(12))
  const segment = (bytes: Uint8Array, offset: number) =>
    Array.from({ length: 4 }, (_, i) => chars[bytes[offset + i] % chars.length]).join('')
  return `${segment(randomBytes, 0)}-${segment(randomBytes, 4)}-${segment(randomBytes, 8)}`
}

export async function POST(req: Request) {
  try {
    const { stripe_session_id } = await req.json()

    // Verify payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(stripe_session_id)
    if (session.payment_status !== 'paid') {
      return Response.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const { amount, recipient_name, recipient_email, message, is_physical, purchaser_id } = session.metadata ?? {}

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if already created for this Stripe session (idempotency)
    const { data: existing } = await supabase
      .from('gift_cards')
      .select('code, initial_balance')
      .eq('stripe_payment_intent_id', session.payment_intent as string)
      .single()

    if (existing) {
      return Response.json({ code: existing.code, amount: existing.initial_balance })
    }

    const code = generateCode()
    const giftAmount = parseFloat(amount ?? '0')

    await supabase.from('gift_cards').insert({
      code,
      initial_balance: giftAmount,
      current_balance: giftAmount,
      purchaser_id: purchaser_id ?? null,
      recipient_name: recipient_name || null,
      recipient_email: recipient_email || null,
      message: message || null,
      is_physical: is_physical === 'true',
      stripe_payment_intent_id: session.payment_intent as string,
    })

    return Response.json({ code, amount: giftAmount })
  } catch (err) {
    console.error('Gift card create error:', err)
    return Response.json({ error: 'Failed to create gift card' }, { status: 500 })
  }
}
