import { createClient } from './supabase'

// Client-side telemetry helper for the "ever-learning" dashboard. Fire-and-forget:
// it never blocks the UI and never throws — telemetry must not break UX. The
// server (POST /api/events) forces client_id to the authed user, so callers
// only pass what happened, not who.

export type ClientEventType =
  | 'service_view'
  | 'schedule_filter'
  | 'quick_book_click'
  | 'nudge_shown'
  | 'nudge_clicked'
  | 'nudge_dismissed'
  | 'rebook_offered'
  | 'rebook_booked'

type LogOpts = {
  serviceKey?: string
  metadata?: Record<string, unknown>
}

export async function logEvent(eventType: ClientEventType, opts: LogOpts = {}): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return // not signed in — nothing to attribute

    await fetch('/api/events', {
      method: 'POST',
      // keepalive lets the request finish even if the user navigates away
      // immediately after (e.g. a nudge click that routes to /schedule).
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        event_type: eventType,
        service_key: opts.serviceKey ?? null,
        metadata: opts.metadata ?? {},
      }),
    })
  } catch {
    // Swallow — a failed telemetry beacon must never surface to the user.
  }
}
