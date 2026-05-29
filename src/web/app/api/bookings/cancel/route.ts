import { createClient } from '@supabase/supabase-js'
import { getBookingRatelimit } from '@/lib/ratelimit'
import { notifyBookingCancelled, notifyWaitlistPromoted } from '@/lib/emails/notify'
import { isUuid } from '@/lib/validation'

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json()
    if (!session_id) return Response.json({ error: 'Missing session_id' }, { status: 400 })
    if (!isUuid(session_id)) return Response.json({ error: 'Invalid session_id' }, { status: 400 })

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

    // Atomic cancel via RPC: cancels the booking, refunds the credit unless it's
    // a late cancel (within 24h of a confirmed class — credit forfeited), and
    // promotes the next waitlisted booking — all in one transaction.
    const { data, error } = await supabase.rpc('cancel_booking', {
      p_session_id: session_id,
      p_client_id: user.id,
    })

    if (error) {
      if (error.message?.includes('Booking not found')) {
        return Response.json({ error: 'Booking not found' }, { status: 404 })
      }
      throw error
    }

    const result = data as {
      cancelled: boolean
      late_cancel: boolean
      refunded: boolean
      promoted_booking_id: string | null
    }

    // Email the canceller their receipt — best-effort, never blocks the cancel.
    await notifyBookingCancelled(supabase, {
      clientId: user.id,
      sessionId: session_id,
      refunded: result.refunded,
      lateCancel: result.late_cancel,
    })

    // If a waitlisted client was just auto-promoted into the freed spot, let
    // them know they're in — otherwise they'd never find out.
    if (result.promoted_booking_id) {
      await notifyWaitlistPromoted(supabase, { bookingId: result.promoted_booking_id })
    }

    return Response.json(result)
  } catch (err) {
    console.error('Cancel error:', err)
    return Response.json({ error: 'Failed to cancel booking' }, { status: 500 })
  }
}
