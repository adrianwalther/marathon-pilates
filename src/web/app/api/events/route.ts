import { createClient } from '@supabase/supabase-js'
import { getEventsRatelimit } from '@/lib/ratelimit'

// Behavioral event ingest for the "ever-learning" dashboard. Clients POST
// in-app signals here (what they viewed/filtered, which nudges they clicked or
// dismissed). The row is written with the service-role key so it lands in
// client_events (which has no client INSERT policy), but client_id is FORCED to
// the authenticated user — a client can never log an event as someone else.
//
// Best-effort + cheap: this is fire-and-forget telemetry, so it returns fast,
// never does heavy work, and never surfaces errors that would matter to the UX.

// The single source of truth for valid event types. Adding a new event is a
// code change here, not a DB migration (the table stores event_type as text).
const EVENT_TYPES = new Set([
  'service_view', // viewed a service's schedule/detail
  'schedule_filter', // applied a type filter on the schedule
  'quick_book_click', // tapped a quick-book button
  'nudge_shown', // a "For You" nudge was rendered
  'nudge_clicked', // clicked through a nudge's CTA
  'nudge_dismissed', // dismissed a nudge
  'rebook_offered', // post-cancel rebook modal was shown
  'rebook_booked', // client rebooked an alternative from that modal
  'post_class_shown', // post-class celebration card was shown
  'post_class_dismissed', // client dismissed the celebration card
])

// Mirror of ServiceKey in lib/nudges.ts. Kept as a plain set here so the route
// has no client-bundle import; if you add a service, update both.
const SERVICE_KEYS = new Set([
  'group_reformer', 'private', 'sauna', 'cold_plunge', 'contrast_therapy', 'neveskin',
])

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body.event_type !== 'string' || !EVENT_TYPES.has(body.event_type)) {
      return Response.json({ error: 'Invalid event_type' }, { status: 400 })
    }

    // service_key is optional, but if present must be a known service.
    let service_key: string | null = null
    if (body.service_key != null) {
      if (typeof body.service_key !== 'string' || !SERVICE_KEYS.has(body.service_key)) {
        return Response.json({ error: 'Invalid service_key' }, { status: 400 })
      }
      service_key = body.service_key
    }

    // metadata is optional; accept a small plain object, ignore anything else.
    let metadata: Record<string, unknown> = {}
    if (body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)) {
      const serialized = JSON.stringify(body.metadata)
      if (serialized.length <= 2000) metadata = body.metadata
    }

    // Authenticate the caller (same Bearer-token pattern as the booking routes).
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Generous per-user cap — only catches pathological spam (a dropped
    // telemetry event is harmless).
    const { success } = await getEventsRatelimit().limit(user.id)
    if (!success) return Response.json({ ok: false }, { status: 429 })

    // Service-role insert — client_id is forced to the authed user.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await supabase.from('client_events').insert({
      client_id: user.id,
      event_type: body.event_type,
      service_key,
      metadata,
    })

    if (error) {
      // Don't 500 the client over telemetry — log and accept.
      console.error('Event insert error:', error)
      return Response.json({ ok: false }, { status: 202 })
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Event route error:', err)
    return Response.json({ ok: false }, { status: 202 })
  }
}
