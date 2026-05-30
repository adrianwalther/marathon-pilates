// Pure lapsed-client detection for the win-back worklist. Extracted from the
// /api/admin/win-back route so the rules ("had a visit, nothing upcoming, quiet
// N days") are unit-testable. The route maps Supabase rows into WinBackBooking
// (pulling starts_at off the joined session) and does the enrichment.

export type WinBackBooking = {
  clientId: string
  status: string
  startsAtMs: number | null // session start; null rows are ignored
}

export type ClientActivity = { lastVisit: number; visits: number; upcoming: number }

const UPCOMING = new Set(['confirmed', 'waitlisted'])
const NON_VISIT = new Set(['cancelled', 'no_show']) // past rows that don't count as a visit

// Roll bookings up per client: most-recent past visit, count of past visits,
// and count of upcoming (confirmed/waitlisted) sessions.
export function aggregateActivity(bookings: WinBackBooking[], nowMs: number): Record<string, ClientActivity> {
  const agg: Record<string, ClientActivity> = {}
  for (const b of bookings) {
    if (!b.clientId || b.startsAtMs == null) continue
    const a = (agg[b.clientId] ??= { lastVisit: 0, visits: 0, upcoming: 0 })
    if (b.startsAtMs >= nowMs) {
      if (UPCOMING.has(b.status)) a.upcoming++
    } else if (!NON_VISIT.has(b.status)) {
      a.visits++
      if (b.startsAtMs > a.lastVisit) a.lastVisit = b.startsAtMs
    }
  }
  return agg
}

// Lapsed = had ≥1 past visit, nothing upcoming, and last visit older than cutoff.
export function lapsedClientIds(agg: Record<string, ClientActivity>, cutoffMs: number): string[] {
  return Object.entries(agg)
    .filter(([, a]) => a.visits > 0 && a.upcoming === 0 && a.lastVisit > 0 && a.lastVisit < cutoffMs)
    .map(([id]) => id)
}
