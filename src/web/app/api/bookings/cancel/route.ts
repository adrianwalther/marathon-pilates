import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json()
    if (!session_id) return Response.json({ error: 'Missing session_id' }, { status: 400 })

    // Verify auth
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

    // Cancel the booking
    const { data: cancelled, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('client_id', user.id)
      .eq('session_id', session_id)
      .in('status', ['confirmed', 'waitlisted'])
      .select('status')
      .single()

    if (error || !cancelled) {
      return Response.json({ error: 'Booking not found' }, { status: 404 })
    }

    // If a confirmed spot just opened up, promote the first waitlisted booking
    if (cancelled.status === 'confirmed') {
      const { data: nextUp } = await supabase
        .from('bookings')
        .select('id')
        .eq('session_id', session_id)
        .eq('status', 'waitlisted')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextUp) {
        await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', nextUp.id)
      }
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('Cancel error:', err)
    return Response.json({ error: 'Failed to cancel booking' }, { status: 500 })
  }
}
