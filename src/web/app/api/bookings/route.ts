import { createClient } from '@supabase/supabase-js'
import { getBookingRatelimit } from '@/lib/ratelimit'
import { notifyBookingConfirmed } from '@/lib/emails/notify'

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

    // Check for an ACTIVE duplicate before hitting the RPC. Cancelled rows are
    // kept for history and must NOT block a rebook (see fix_rebook_after_cancel).
    const { data: existing } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('client_id', user.id)
      .eq('session_id', session_id)
      .in('status', ['confirmed', 'waitlisted'])
      .maybeSingle()

    if (existing) {
      return Response.json({ error: 'Already booked', status: existing.status }, { status: 409 })
    }

    // Atomically check capacity + insert + deduct the credit via RPC.
    // book_session locks the session and the credit row, validates ownership +
    // balance, inserts the booking, and decrements the credit in ONE
    // transaction — so a credit can never be double-spent or left un-deducted.
    const { data, error } = await supabase.rpc('book_session', {
      p_session_id: session_id,
      p_client_id: user.id,
      p_amount_paid: 0,
      p_payment_status: credit_id ? 'credit' : 'included',
      p_credit_id: credit_id ?? null,
    })

    if (error) throw error

    const result = data as { booking_id: string; status: string }

    // Send a confirmation (or waitlist) email — best-effort, never blocks booking.
    await notifyBookingConfirmed(supabase, {
      clientId: user.id,
      sessionId: session_id,
      waitlisted: result.status === 'waitlisted',
    })

    return Response.json({ status: result.status })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to book session'
    if (message.includes('duplicate') || message.includes('unique')) {
      return Response.json({ error: 'Already booked' }, { status: 409 })
    }
    if (message.includes('No credits remaining') || message.includes('Credit not found') || message.includes('Credit does not belong')) {
      return Response.json({ error: 'No credits available' }, { status: 400 })
    }
    console.error('Booking error:', err)
    return Response.json({ error: 'Failed to book session' }, { status: 500 })
  }
}
