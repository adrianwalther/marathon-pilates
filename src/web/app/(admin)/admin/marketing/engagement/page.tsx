'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SERVICE_CATALOG } from '@/lib/nudges'

// Staff-facing engagement analytics over the client_events log. Shows what
// clients are browsing, which nudges land vs. get dismissed, and recent
// activity — so Ruby can see the dashboard "learning" in aggregate. Reads are
// allowed by the "Staff read all events" RLS policy on client_events.

type Ev = {
  client_id: string
  event_type: string
  service_key: string | null
  created_at: string
  profiles: { first_name: string | null } | { first_name: string | null }[] | null
}

const LABELS: Record<string, string> = Object.fromEntries(SERVICE_CATALOG.map(s => [s.key, s.label]))

const ACTION_VERB: Record<string, string> = {
  service_view: 'browsed',
  schedule_filter: 'filtered for',
  quick_book_click: 'tapped book on',
  nudge_shown: 'was shown',
  nudge_clicked: 'clicked',
  nudge_dismissed: 'dismissed',
}

function firstName(p: Ev['profiles']): string {
  const obj = Array.isArray(p) ? p[0] : p
  return obj?.first_name?.trim() || 'A client'
}

function pct(n: number, d: number): string {
  if (d === 0) return '—'
  return `${Math.round((n / d) * 100)}%`
}

export default function EngagementPage() {
  const [events, setEvents] = useState<Ev[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('client_events')
      .select('client_id, event_type, service_key, created_at, profiles(first_name)')
      .order('created_at', { ascending: false })
      .limit(2000)
      .then(({ data }) => {
        setEvents((data as Ev[]) ?? [])
        setLoading(false)
      })
  }, [])

  // Totals
  const shown = events.filter(e => e.event_type === 'nudge_shown').length
  const clicked = events.filter(e => e.event_type === 'nudge_clicked').length
  const dismissed = events.filter(e => e.event_type === 'nudge_dismissed').length
  const activeClients = new Set(events.map(e => e.client_id)).size

  // Per-service breakdown (every catalog service, stable order)
  const perService = SERVICE_CATALOG.map(s => {
    const forSvc = (t: string) => events.filter(e => e.event_type === t && e.service_key === s.key).length
    const sShown = forSvc('nudge_shown')
    return {
      key: s.key,
      label: s.label,
      views: forSvc('service_view'),
      shown: sShown,
      clicked: forSvc('nudge_clicked'),
      dismissed: forSvc('nudge_dismissed'),
      ctr: pct(forSvc('nudge_clicked'), sShown),
    }
  })

  const recent = events.slice(0, 25)

  const card = { background: '#fff', borderRadius: 2, padding: '0.875rem 1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
  const statLabel = { fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', letterSpacing: '0.08em', color: '#9ca3af', textTransform: 'uppercase' as const, margin: '0 0 0.4rem' }
  const statValue = { fontSize: '1.5rem', fontWeight: 300, color: 'var(--color-text)', margin: 0 }
  const th = { fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase' as const, textAlign: 'left' as const, padding: '0.6rem 0.75rem', fontWeight: 700 }
  const td = { fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', color: 'var(--color-text)', padding: '0.7rem 0.75rem', borderTop: '1px solid #f0ece6' }

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', padding: '2rem', background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase', margin: 0 }}>MARKETING</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--color-text)', margin: '0.25rem 0 0' }}>Client Engagement</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: '0.4rem 0 0' }}>
          What clients are exploring on their dashboard, and how the personalized nudges perform.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
      ) : events.length === 0 ? (
        <div style={{ ...card, padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
          No engagement yet. Activity will appear here as clients use their dashboards.
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={card}>
              <p style={statLabel}>Nudges Shown</p>
              <p style={statValue}>{shown}</p>
            </div>
            <div style={card}>
              <p style={statLabel}>Click-Through</p>
              <p style={statValue}>{pct(clicked, shown)}</p>
            </div>
            <div style={card}>
              <p style={statLabel}>Dismiss Rate</p>
              <p style={statValue}>{pct(dismissed, shown)}</p>
            </div>
            <div style={card}>
              <p style={statLabel}>Active Clients</p>
              <p style={statValue}>{activeClients}</p>
            </div>
          </div>

          {/* Per-service breakdown */}
          <div style={{ ...card, padding: 0, marginBottom: '1.5rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#faf7f2' }}>
                  <th style={th}>Service</th>
                  <th style={th}>Views</th>
                  <th style={th}>Shown</th>
                  <th style={th}>Clicked</th>
                  <th style={th}>Dismissed</th>
                  <th style={th}>CTR</th>
                </tr>
              </thead>
              <tbody>
                {perService.map(s => (
                  <tr key={s.key}>
                    <td style={{ ...td, fontWeight: 500 }}>{s.label}</td>
                    <td style={td}>{s.views}</td>
                    <td style={td}>{s.shown}</td>
                    <td style={td}>{s.clicked}</td>
                    <td style={td}>{s.dismissed}</td>
                    <td style={{ ...td, color: 'var(--color-cta)', fontWeight: 600 }}>{s.ctr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent activity */}
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.14em', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 0.75rem' }}>
            Recent Activity
          </p>
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            {recent.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 1rem', borderTop: i === 0 ? 'none' : '1px solid #f0ece6' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
                  <strong style={{ fontWeight: 600 }}>{firstName(e.profiles)}</strong>{' '}
                  {ACTION_VERB[e.event_type] ?? e.event_type}
                  {e.service_key ? ` ${LABELS[e.service_key] ?? e.service_key}` : ''}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                  {new Date(e.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
