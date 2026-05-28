import { createClient } from '@supabase/supabase-js'
import { getBookingRatelimit } from '@/lib/ratelimit'

// Admin-initiated booking: a staff member (owner/admin/manager) books a client
// into a scheduled session. Reuses the same atomic book_session RPC as the
// client flow, but the booking is created on behalf of p_client_id and auto-uses
// a matching credit when one is available (otherwise booked complimentary).

const STAFF_ROLES = ['owner', 'admin', 'manager']

function creditTypeFor(sessionType: string): 'group' | 'private' | 'amenity' | null {
  if (sessionType === 'group_reformer') return 'group'
  if (['private_solo', 'private_duet', 'private_trio'].includes(sessionType)) return 'private'
  if (['sauna', 'cold_plunge', 'contrast_therapy', 'neveskin'].includes(sessionType)) return 'amenity'
  return null
}

export async function POST(req: Request) {
  try {
    const { session_id, client_id } = await req.json()

    if (!session_id || !client_id) {
      return Response.json({ error: 'Missing session_id or client_id' }, { status: 400 })
    }

    // Verify the caller is authenticated
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { success } = await getBookingRatelimit().limit(`admin:${user.id}`)
    if (!success) return Response.json({ error: 'Too many requests' }, { status: 429 })

    // Service-role client for the privileged work
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify the caller is staff allowed to create bookings
    const { data: caller } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!caller || !STAFF_ROLES.includes(caller.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Confirm the target client exists and is a client
    const { data: target } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', client_id)
      .single()

    if (!target) return Response.json({ error: 'Client not found' }, { status: 404 })

    // Prevent duplicate booking
    const { data: existing } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('client_id', client_id)
      .eq('session_id', session_id)
      .maybeSingle()

    if (existing) {
      return Response.json({ error: 'Already booked', status: existing.status }, { status: 409 })
    }

    // Look up the session's type so we know which credit to draw from
    const { data: session } = await supabase
      .from('scheduled_sessions')
      .select('session_type')
      .eq('id', session_id)
      .single()

    if (!session) return Response.json({ error: 'Session not found' }, { status: 404 })

    // Try to use a matching, unexpired credit for this client
    const creditType = creditTypeFor(session.session_type)
    let creditId: string | null = null
    let usedCredits = 0

    if (creditType) {
      const { data: credits } = await supabase
        .from('credits')
        .select('id, total_credits, used_credits')
        .eq('client_id', client_id)
        .eq('credit_type', creditType)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('expires_at', { ascending: true, nullsFirst: false })

      const usable = credits?.find(c => c.total_credits - c.used_credits > 0)
      if (usable) {
        creditId = usable.id
        usedCredits = usable.used_credits
      }
    }

    // Capacity check + insert, done with the service-role client.
    // We intentionally do NOT use the book_session RPC here: the deployed
    // version enforces auth.uid() (so a client can only book themselves),
    // which a staff-initiated, service-role booking can't satisfy. Admin
    // bookings are low-volume and single-operator, so an inline count+insert
    // mirrors the RPC's confirmed/waitlisted logic without that guard.
    const { data: sessionRow, error: capError } = await supabase
      .from('scheduled_sessions')
      .select('max_capacity')
      .eq('id', session_id)
      .single()

    if (capError || !sessionRow) throw capError ?? new Error('Session not found')

    const { count: bookedCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session_id)
      .in('status', ['confirmed', 'waitlisted'])

    const status = (bookedCount ?? 0) >= sessionRow.max_capacity ? 'waitlisted' : 'confirmed'

    const { data: inserted, error } = await supabase
      .from('bookings')
      .insert({
        client_id,
        session_id,
        status,
        amount_paid: 0,
        payment_status: creditId ? 'credit' : 'included',
        stripe_payment_intent_id: null,
      })
      .select('id')
      .single()

    if (error) throw error
    const result = { booking_id: inserted.id, status }

    // Deduct the credit after a successful booking
    if (creditId) {
      await supabase
        .from('credits')
        .update({ used_credits: usedCredits + 1 })
        .eq('id', creditId)
    }

    return Response.json({ status: result.status, method: creditId ? 'credit' : 'comp' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to book client'
    if (message.includes('duplicate') || message.includes('unique')) {
      return Response.json({ error: 'Already booked' }, { status: 409 })
    }
    console.error('Admin booking error:', err)
    return Response.json({ error: 'Failed to book client' }, { status: 500 })
  }
}
