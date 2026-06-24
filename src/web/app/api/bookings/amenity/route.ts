import { createClient } from '@supabase/supabase-js'
import { isUuid } from '@/lib/validation'
import { notifyBookingConfirmed } from '@/lib/emails/notify'

// Charlotte Park is the only location with amenities
const CHARLOTTE_PARK_ID = 'd727b8df-d963-4bc5-a080-5908a1f4711e'

// POST /api/bookings/amenity
// Atomically: finds or creates the scheduled_session for the slot, then books
// the client into it via the existing book_session RPC.
// Body: { session_type, starts_at, credit_id }

export async function POST(req: Request) {
  try {
    const { session_type, starts_at, credit_id } = await req.json()

    if (!session_type || !starts_at) {
      return Response.json({ error: 'Missing session_type or starts_at' }, { status: 400 })
    }
    if (credit_id != null && !isUuid(credit_id)) {
      return Response.json({ error: 'Invalid credit_id' }, { status: 400 })
    }

    // Authenticate caller
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Load the amenity rule to get duration + capacity + cutoff
    const { data: rule } = await supabase
      .from('amenity_rules')
      .select('*')
      .eq('session_type', session_type)
      .eq('is_active', true)
      .single()

    if (!rule) {
      return Response.json({ error: 'Amenity type not available' }, { status: 404 })
    }

    // Enforce 24-hour cutoff server-side
    const slotTime = new Date(starts_at).getTime()
    const cutoff = Date.now() + rule.advance_cutoff_hours * 60 * 60 * 1000
    if (slotTime <= cutoff) {
      return Response.json({ error: 'This slot is no longer available for booking' }, { status: 400 })
    }

    const endsAt = new Date(slotTime + rule.session_duration_minutes * 60 * 1000).toISOString()

    // Find or create the scheduled_session for this slot
    // Use upsert on (session_type, starts_at, location_id) to handle races
    const { data: session, error: sessionError } = await supabase
      .from('scheduled_sessions')
      .upsert({
        session_type,
        name: rule.display_name,
        starts_at,
        ends_at: endsAt,
        duration_minutes: rule.session_duration_minutes,
        max_capacity: rule.max_capacity,
        location_id: CHARLOTTE_PARK_ID,
        is_cancelled: false,
        drop_in_price: null,
      }, {
        onConflict: 'session_type,starts_at,location_id',
        ignoreDuplicates: false,
      })
      .select('id')
      .single()

    if (sessionError || !session) {
      console.error('[amenity-booking] session upsert error:', sessionError)
      return Response.json({ error: 'Could not reserve slot' }, { status: 500 })
    }

    // Book via the existing atomic RPC
    const { data, error: rpcError } = await supabase.rpc('book_session', {
      p_session_id: session.id,
      p_client_id: user.id,
      p_amount_paid: 0,
      p_payment_status: credit_id ? 'credit' : 'included',
      p_credit_id: credit_id ?? null,
    })

    if (rpcError) throw rpcError

    const result = data as { booking_id: string; status: string }

    await notifyBookingConfirmed(supabase, {
      clientId: user.id,
      sessionId: session.id,
      waitlisted: result.status === 'waitlisted',
    })

    return Response.json({ status: result.status, session_id: session.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('duplicate') || message.includes('unique')) {
      return Response.json({ error: 'Already booked' }, { status: 409 })
    }
    if (message.includes('No credits remaining') || message.includes('Credit not found')) {
      return Response.json({ error: 'No credits available' }, { status: 400 })
    }
    if (message.includes('Session is full')) {
      return Response.json({ error: 'This slot just filled up — please choose another' }, { status: 409 })
    }
    console.error('[amenity-booking] error:', err)
    return Response.json({ error: 'Could not complete booking' }, { status: 500 })
  }
}
