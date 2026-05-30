import { createClient } from '@supabase/supabase-js'

// Staff-only "win-back" worklist: clients who were active but have gone quiet —
// at least one past visit, nothing upcoming, and no class in the last N days.
// Aggregated server-side with the service-role key (after authenticating the
// caller as staff) so it doesn't depend on broad client-side RLS over bookings.

const STAFF_ROLES = ['owner', 'admin', 'manager']
const DAY_MS = 86_400_000

type Agg = { lastVisit: number; visits: number; upcoming: number }

function relName(rel: { starts_at?: string } | { starts_at?: string }[] | null): string | null {
  const o = Array.isArray(rel) ? rel[0] : rel
  return o?.starts_at ?? null
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const days = Math.min(180, Math.max(7, parseInt(url.searchParams.get('days') ?? '30', 10) || 30))
    const cutoff = Date.now() - days * DAY_MS

    // Authenticate the caller, then confirm they're staff.
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
    const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!caller || !STAFF_ROLES.includes(caller.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Pull bookings with their session time and aggregate per client.
    const { data: bookings } = await supabase
      .from('bookings')
      .select('client_id, status, scheduled_sessions(starts_at)')
      .limit(20000)

    const now = Date.now()
    const agg: Record<string, Agg> = {}
    for (const b of bookings ?? []) {
      const cid = (b as { client_id: string }).client_id
      const startsStr = relName((b as { scheduled_sessions: { starts_at?: string } | { starts_at?: string }[] | null }).scheduled_sessions)
      if (!cid || !startsStr) continue
      const t = new Date(startsStr).getTime()
      const a = (agg[cid] ??= { lastVisit: 0, visits: 0, upcoming: 0 })
      const status = (b as { status: string }).status
      if (t >= now) {
        if (status === 'confirmed' || status === 'waitlisted') a.upcoming++
      } else if (status !== 'cancelled' && status !== 'no_show') {
        a.visits++
        if (t > a.lastVisit) a.lastVisit = t
      }
    }

    // Lapsed = had a visit, nothing upcoming, last visit older than the cutoff.
    const lapsedIds = Object.entries(agg)
      .filter(([, a]) => a.visits > 0 && a.upcoming === 0 && a.lastVisit > 0 && a.lastVisit < cutoff)
      .map(([id]) => id)

    if (lapsedIds.length === 0) return Response.json({ days, count: 0, clients: [] })

    // Enrich: profile, active membership, unused credits.
    const [{ data: profs }, { data: mems }, { data: creds }] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, email, phone, total_classes_completed').in('id', lapsedIds).eq('role', 'client'),
      supabase.from('memberships').select('client_id, membership_type, status').in('client_id', lapsedIds).eq('status', 'active'),
      supabase.from('credits').select('client_id, total_credits, used_credits').in('client_id', lapsedIds),
    ])

    const memByClient: Record<string, string> = {}
    mems?.forEach(m => { memByClient[m.client_id] = m.membership_type })
    const creditsByClient: Record<string, number> = {}
    creds?.forEach(c => { creditsByClient[c.client_id] = (creditsByClient[c.client_id] ?? 0) + Math.max(0, (c.total_credits ?? 0) - (c.used_credits ?? 0)) })

    const clients = (profs ?? []).map(p => {
      const a = agg[p.id]
      return {
        id: p.id,
        name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Unnamed',
        email: p.email,
        phone: p.phone ?? null,
        classesDone: p.total_classes_completed ?? a.visits,
        lastVisit: new Date(a.lastVisit).toISOString(),
        daysSince: Math.floor((now - a.lastVisit) / DAY_MS),
        activeMembership: memByClient[p.id] ?? null, // active membership but lapsed = churn risk
        creditsRemaining: creditsByClient[p.id] ?? 0,
      }
    })
      // Warmest leads first (most recently lapsed), but float active members up —
      // a paying member who's stopped coming is the most urgent to save.
      .sort((x, y) => {
        if (!!x.activeMembership !== !!y.activeMembership) return x.activeMembership ? -1 : 1
        return y.lastVisit.localeCompare(x.lastVisit)
      })

    return Response.json({ days, count: clients.length, clients })
  } catch (err) {
    console.error('Win-back error:', err)
    return Response.json({ error: 'Failed to load win-back list' }, { status: 500 })
  }
}
