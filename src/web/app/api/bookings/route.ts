import { createClient } from '@supabase/supabase-js'
import { getBookingRatelimit } from '@/lib/ratelimit'

export async function POST(req: Request) {
  try {
    const { session_id, credit_id } = await req.json()

    if (!session_id) {
      return Response.json({ error: 'Missing session_id' }, { status: 400 })
    }

    // Verify auth
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { success } = await getBookingRatelimit().limit(user.id)
    if (!success) return Response.json({ error: 'Too many requests' }, { status: 429 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check for duplicate booking before hitting the RPC
    const { data: existing } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('client_id', user.id)
      .eq('session_id', session_id)
      .maybeSingle()

    if (existing) {
      return Response.json({ error: 'Already booked', status: existing.status }, { status: 409 })
    }

    // Atomically check capacity + insert via RPC (eliminates race condition)
    const { data, error } = await supabase.rpc('book_session', {
      p_session_id: session_id,
      p_client_id: user.id,
      p_amount_paid: 0,
      p_payment_status: credit_id ? 'credit' : 'included',
    })

    if (error) throw error

    const result = data as { booking_id: string; status: string }

    // Deduct credit after successful booking
    if (credit_id) {
      const { data: credit } = await supabase
        .from('credits')
        .select('used_credits')
        .eq('id', credit_id)
        .single()

      if (credit) {
        await supabase
          .from('credits')
          .update({ used_credits: credit.used_credits + 1 })
          .eq('id', credit_id)
      }
    }

    return Response.json({ status: result.status })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to book session'
    if (message.includes('duplicate') || message.includes('unique')) {
      return Response.json({ error: 'Already booked' }, { status: 409 })
    }
    console.error('Booking error:', err)
    return Response.json({ error: 'Failed to book session' }, { status: 500 })
  }
}
