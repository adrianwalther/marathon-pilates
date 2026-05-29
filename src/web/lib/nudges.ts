// ─────────────────────────────────────────────────────────────────────────────
// Dashboard nudge engine — "haven't tried yet" service recommendations.
//
// Step 1: a CONTENT-BASED read model. Given the set of session_types a client
// has booked, it computes which services they've never tried and returns them
// ranked by business value, plus brand-voice copy for the top one.
//
// Pure + dependency-free on purpose: the caller does the Supabase query and
// passes in the raw session_type strings, so this logic is unit-testable with
// no DB. (Behavioral signals — what they browsed/searched — come later, once we
// add an interaction-log table.)
// ─────────────────────────────────────────────────────────────────────────────

// A nudge-able service. The four private_* session_types collapse into one
// "private" service so we don't nag someone who's done a solo to also "try" a duet.
export type ServiceKey =
  | 'group_reformer'
  | 'private'
  | 'sauna'
  | 'cold_plunge'
  | 'contrast_therapy'
  | 'neveskin'

// Maps the raw session_type enum (from scheduled_sessions / bookings) to a
// nudge-able service. Keep in sync with the session_type enum in
// supabase/migrations/001_initial_schema.sql.
const SESSION_TYPE_TO_SERVICE: Record<string, ServiceKey> = {
  group_reformer: 'group_reformer',
  private_solo: 'private',
  private_duet: 'private',
  private_trio: 'private',
  sauna: 'sauna',
  cold_plunge: 'cold_plunge',
  contrast_therapy: 'contrast_therapy',
  neveskin: 'neveskin',
}

export type ServiceMeta = {
  key: ServiceKey
  label: string // display name (matches SESSION_LABELS elsewhere)
  href: string // schedule link with the right ?type= filter
  priority: number // lower = surfaced first
  // Brand-voice nudge copy. `{first}` is replaced with the client's first name.
  // Warm + inviting, benefit-led, never salesy (see brand guide voice don'ts).
  nudge: string
}

// Priority reflects business priority #3 — grow wellness-service revenue — so the
// recovery amenities (the studio's under-used, high-margin offerings) surface
// ahead of the Pilates services an active client is probably already doing.
export const SERVICE_CATALOG: ServiceMeta[] = [
  {
    key: 'contrast_therapy',
    label: 'Contrast Therapy',
    href: '/dashboard/schedule?type=contrast_therapy',
    priority: 1,
    nudge: "Hot, then cold, then glowing. {first}, our contrast therapy pairs the infrared sauna with a cold plunge for a full-body reset — the perfect bookend to class.",
  },
  {
    key: 'sauna',
    label: 'Sauna',
    href: '/dashboard/schedule?type=sauna',
    priority: 2,
    nudge: "Have you met our infrared sauna yet, {first}? It's a quiet little ritual your muscles will thank you for — come unwind after your next class.",
  },
  {
    key: 'cold_plunge',
    label: 'Cold Plunge',
    href: '/dashboard/schedule?type=cold_plunge',
    priority: 3,
    nudge: "Ready for a reset, {first}? The cold plunge is a bold few minutes that can change your whole day. We'll be right there with you.",
  },
  {
    key: 'neveskin',
    label: 'Neveskin',
    href: '/dashboard/schedule?type=neveskin',
    priority: 4,
    nudge: "A little something just for you, {first}. Neveskin is our gentle, non-invasive glow-up — no downtime, and you'll notice a difference from the very first session.",
  },
  {
    key: 'private',
    label: 'Private Pilates',
    href: '/dashboard/schedule?type=private',
    priority: 5,
    nudge: "Want a session that's all yours, {first}? Private Pilates meets you exactly where you are — your pace, your goals, our full attention.",
  },
  {
    key: 'group_reformer',
    label: 'Group Reformer',
    href: '/dashboard/schedule?type=group_reformer',
    priority: 6,
    nudge: "Come move with us, {first}. Group Reformer is where the community magic happens — strong, supportive, and never intimidating.",
  },
]

const CATALOG_BY_KEY: Record<ServiceKey, ServiceMeta> = SERVICE_CATALOG.reduce(
  (acc, s) => {
    acc[s.key] = s
    return acc
  },
  {} as Record<ServiceKey, ServiceMeta>,
)

// Map a schedule `type` filter value (or raw session_type) to a ServiceKey.
// Handles the collapsed 'private' filter the schedule page uses.
export function serviceKeyFromType(type: string): ServiceKey | null {
  if (type === 'private') return 'private'
  return SESSION_TYPE_TO_SERVICE[type] ?? null
}

// Given the session_types a client has engaged with (their non-cancelled
// bookings), return the services they have NOT tried, ranked by priority.
export function untriedServices(bookedSessionTypes: string[]): ServiceMeta[] {
  const triedKeys = new Set<ServiceKey>()
  for (const t of bookedSessionTypes) {
    const svc = SESSION_TYPE_TO_SERVICE[t]
    if (svc) triedKeys.add(svc)
  }
  return SERVICE_CATALOG.filter(s => !triedKeys.has(s.key)).sort(
    (a, b) => a.priority - b.priority,
  )
}

export type Nudge = { service: ServiceMeta; message: string }

// Behavioral signals derived from the client_events log. Optional — without
// them pickNudge falls back to pure business-priority order (its original
// behavior). This is what makes the dashboard "learn":
//   * viewed: service_key -> how many times the client browsed it without
//     booking. High count = high intent → boosted ahead of business priority.
//   * dismissed: services the client explicitly dismissed a nudge for →
//     suppressed so we stop nagging.
export type NudgeSignals = {
  viewed?: Record<string, number>
  dismissed?: string[]
}

// Pick the single best nudge for a client, with its copy fully rendered.
//
// Returns null when the client has tried NOTHING — a brand-new client with zero
// bookings shouldn't be told they "haven't tried" a recovery amenity before
// they've taken a single class. The dashboard's existing empty state guides
// first-timers to book; nudges kick in once they've engaged at all.
//
// When signals are supplied, ranking becomes: drop anything they dismissed,
// then surface what they've shown intent toward (most-viewed first), then fall
// back to business priority. So a client who keeps eyeing the sauna gets nudged
// about the sauna — even though contrast therapy outranks it by default.
export function pickNudge(
  firstName: string | null | undefined,
  bookedSessionTypes: string[],
  signals?: NudgeSignals,
): Nudge | null {
  if (bookedSessionTypes.length === 0) return null

  const dismissed = new Set(signals?.dismissed ?? [])
  const viewed = signals?.viewed ?? {}

  const candidates = untriedServices(bookedSessionTypes)
    .filter(s => !dismissed.has(s.key))
    .sort((a, b) => {
      const va = viewed[a.key] ?? 0
      const vb = viewed[b.key] ?? 0
      if (va !== vb) return vb - va // more-viewed (more intent) first
      return a.priority - b.priority // else business priority
    })

  if (candidates.length === 0) return null // tried/dismissed everything

  const service = candidates[0]
  const first = (firstName ?? '').trim() || 'there'
  return { service, message: service.nudge.replace('{first}', first) }
}

export { CATALOG_BY_KEY }
