'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

// Staff worklist of lapsed clients (active before, quiet now) so the team can
// reach out personally. Data comes from the service-role /api/admin/win-back
// route. Membership type labels mirror the rest of the app.

type WinBackClient = {
  id: string
  name: string
  email: string
  phone: string | null
  classesDone: number
  lastVisit: string
  daysSince: number
  activeMembership: string | null
  creditsRemaining: number
}

const MEMBERSHIP_LABELS: Record<string, string> = {
  founding: 'Founding',
  unlimited: 'Unlimited',
  eight_class: '8-Class',
  four_class: '4-Class',
  drop_in: 'Drop-In',
}

const THRESHOLDS = [21, 30, 45, 60]

export default function WinBackPage() {
  const [clients, setClients] = useState<WinBackClient[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  const load = useCallback(async (d: number) => {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/admin/win-back?days=${d}`, {
      headers: { Authorization: session ? `Bearer ${session.access_token}` : '' },
    })
    const json = await res.json().catch(() => ({ clients: [] }))
    setClients(json.clients ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load(days) }, [days, load])

  const atRisk = clients.filter(c => c.activeMembership).length
  const withCredits = clients.filter(c => c.creditsRemaining > 0).length

  const card = { background: '#fff', borderRadius: 2, padding: '0.875rem 1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
  const statLabel = { fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', letterSpacing: '0.08em', color: '#9ca3af', textTransform: 'uppercase' as const, margin: '0 0 0.4rem' }
  const statValue = { fontSize: '1.5rem', fontWeight: 300, color: 'var(--color-text)', margin: 0 }
  const th = { fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase' as const, textAlign: 'left' as const, padding: '0.6rem 0.75rem', fontWeight: 700 }
  const td = { fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', color: 'var(--color-text)', padding: '0.7rem 0.75rem', borderTop: '1px solid #f0ece6', verticalAlign: 'middle' as const }

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', padding: '2rem', background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase', margin: 0 }}>MARKETING</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--color-text)', margin: '0.25rem 0 0' }}>Win-Back</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: '0.4rem 0 0' }}>
          Clients who used to come in but have gone quiet. A personal note from the studio goes a long way.
        </p>
      </div>

      {/* Threshold filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase' }}>Quiet for</span>
        {THRESHOLDS.map(t => (
          <button
            key={t}
            onClick={() => setDays(t)}
            style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.45rem 0.9rem', borderRadius: 2, border: 'none', cursor: 'pointer', background: days === t ? 'var(--color-text)' : '#fff', color: days === t ? '#fff' : 'var(--color-text-muted)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            {t}+ days
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={card}><p style={statLabel}>Lapsed Clients</p><p style={statValue}>{clients.length}</p></div>
            <div style={card}><p style={statLabel}>Active Members (at risk)</p><p style={{ ...statValue, color: atRisk > 0 ? '#e05555' : 'var(--color-text)' }}>{atRisk}</p></div>
            <div style={card}><p style={statLabel}>Have Unused Credits</p><p style={statValue}>{withCredits}</p></div>
          </div>

          {clients.length === 0 ? (
            <div style={{ ...card, padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              No lapsed clients at this threshold — everyone active is staying engaged. 🎉
            </div>
          ) : (
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#faf7f2' }}>
                    <th style={th}>Client</th>
                    <th style={th}>Last Visit</th>
                    <th style={th}>Classes</th>
                    <th style={th}>Membership</th>
                    <th style={th}>Credits</th>
                    <th style={th}>Reach Out</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id}>
                      <td style={{ ...td, fontWeight: 500 }}>{c.name}</td>
                      <td style={td}>
                        {c.daysSince} days ago
                        {c.activeMembership && (
                          <span style={{ marginLeft: '0.5rem', fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.12rem 0.4rem', borderRadius: 2, background: '#fef0f0', color: '#e05555' }}>At risk</span>
                        )}
                      </td>
                      <td style={td}>{c.classesDone}</td>
                      <td style={td}>{c.activeMembership ? (MEMBERSHIP_LABELS[c.activeMembership] ?? c.activeMembership) : <span style={{ color: '#bbb' }}>—</span>}</td>
                      <td style={{ ...td, color: c.creditsRemaining > 0 ? 'var(--color-cta)' : '#bbb', fontWeight: c.creditsRemaining > 0 ? 600 : 400 }}>
                        {c.creditsRemaining > 0 ? `${c.creditsRemaining} left` : '—'}
                      </td>
                      <td style={td}>
                        <a href={`mailto:${c.email}`} style={{ color: 'var(--color-cta)', textDecoration: 'none', fontWeight: 600, fontSize: '0.78rem' }}>Email</a>
                        {c.phone && <> · <a href={`tel:${c.phone}`} style={{ color: 'var(--color-cta)', textDecoration: 'none', fontWeight: 600, fontSize: '0.78rem' }}>Call</a></>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
