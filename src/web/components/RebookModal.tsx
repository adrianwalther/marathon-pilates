'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { bookClass } from '@/lib/bookClass'
import { logEvent } from '@/lib/events'
import { serviceKeyFromType, CATALOG_BY_KEY, type ServiceKey } from '@/lib/nudges'

// Retention modal shown right after a client cancels a class. It recommends
// other upcoming sessions of the same kind and lets them rebook in one tap —
// catching them at the moment of cancellation so a cancel doesn't just become
// a lapse. The cancel that triggers this refunds the credit, so the rebook can
// spend it again.

export type CancelledInfo = {
  sessionId: string
  name: string
  sessionType: string
  refunded: boolean // false for a late cancel (credit forfeited) — adjusts copy
}

type Alt = {
  id: string
  name: string
  session_type: string
  starts_at: string
  duration_minutes: number
  max_capacity: number
  drop_in_price: number | null
  locations: { name: string } | { name: string }[] | null
  spotsLeft: number
}

function locName(l: Alt['locations']): string {
  const o = Array.isArray(l) ? l[0] : l
  return o?.name ?? ''
}

export default function RebookModal({
  cancelled,
  onClose,
  onBooked,
}: {
  cancelled: CancelledInfo
  onClose: () => void
  onBooked?: () => void
}) {
  const [alts, setAlts] = useState<Alt[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [booked, setBooked] = useState(false)

  const serviceKey = serviceKeyFromType(cancelled.sessionType) as ServiceKey | null
  const label = serviceKey ? CATALOG_BY_KEY[serviceKey].label : 'class'

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const now = new Date().toISOString()
      const types = cancelled.sessionType.startsWith('private_')
        ? ['private_solo', 'private_duet', 'private_trio']
        : [cancelled.sessionType]

      const { data: sess } = await supabase
        .from('scheduled_sessions')
        .select('id, name, session_type, starts_at, duration_minutes, max_capacity, drop_in_price, locations(name)')
        .in('session_type', types)
        .eq('is_cancelled', false)
        .gte('starts_at', now)
        .neq('id', cancelled.sessionId)
        .order('starts_at', { ascending: true })
        .limit(12)

      const ids = (sess ?? []).map(s => s.id)
      const countMap: Record<string, number> = {}
      const mine = new Set<string>()
      if (ids.length) {
        // Capacity (confirmed + waitlisted) — same read the schedule page uses.
        const { data: counts } = await supabase
          .from('bookings').select('session_id').in('session_id', ids).in('status', ['confirmed', 'waitlisted'])
        counts?.forEach(b => { countMap[b.session_id] = (countMap[b.session_id] ?? 0) + 1 })
        if (user) {
          const { data: own } = await supabase
            .from('bookings').select('session_id').eq('client_id', user.id).in('session_id', ids).in('status', ['confirmed', 'waitlisted'])
          own?.forEach(b => mine.add(b.session_id))
        }
      }

      const list: Alt[] = (sess ?? [])
        .filter(s => !mine.has(s.id)) // don't recommend a class they're already in
        .map(s => ({ ...s, spotsLeft: Math.max(0, (s.max_capacity ?? 0) - (countMap[s.id] ?? 0)) }) as Alt)
        .slice(0, 4)

      setAlts(list)
      setLoading(false)
      if (serviceKey) logEvent('rebook_offered', { serviceKey, metadata: { count: list.length } })
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Modal a11y/UX: close on Escape, and lock background scroll while open so the
  // page behind doesn't move under the overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const handleBook = async (a: Alt) => {
    setBookingId(a.id)
    setError('')
    const r = await bookClass(a)
    if (r.outcome === 'checkout') return // navigating to Stripe
    if (r.outcome === 'error') {
      setError(r.message)
      setBookingId(null)
      return
    }
    if (serviceKey) logEvent('rebook_booked', { serviceKey, metadata: { session_id: a.id, status: r.outcome } })
    setBooked(true)
    setBookingId(null)
    onBooked?.()
    setTimeout(onClose, 1400)
  }

  const fmt = (iso: string) => {
    const d = new Date(iso)
    return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(48,45,39,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Find another ${label} class`}
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--color-bg)', borderRadius: '4px', maxWidth: '440px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '2rem', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}
      >
        {booked ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text)' }}>You're booked!</p>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>See you on the reformer.</p>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-cta)', marginBottom: '0.6rem' }}>
              Before you go
            </p>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.5rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
              Find another time?
            </h2>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {cancelled.refunded ? 'Your credit is back in your account. ' : ''}Here are other {label} classes coming up — grab the one that fits.
            </p>

            {loading ? (
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa', textAlign: 'center', padding: '1.5rem 0' }}>Finding classes…</p>
            ) : alts.length === 0 ? (
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem 0 1.5rem' }}>
                No other {label} classes are on the schedule right now — check back soon!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
                {alts.map(a => {
                  const full = a.spotsLeft <= 0
                  return (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', background: 'white', border: '1px solid var(--color-border)', borderRadius: '2px', padding: '0.85rem 1rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.85rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</p>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{fmt(a.starts_at)}</p>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.68rem', color: full ? '#c8860a' : '#aaa' }}>
                          {locName(a.locations)}{locName(a.locations) ? ' · ' : ''}{full ? 'Full — join waitlist' : `${a.spotsLeft} spot${a.spotsLeft === 1 ? '' : 's'} left`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleBook(a)}
                        disabled={bookingId === a.id}
                        style={{ flexShrink: 0, fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 1rem', borderRadius: '2px', border: 'none', background: full ? 'var(--color-accent)' : 'var(--color-cta)', color: 'white', cursor: bookingId === a.id ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {bookingId === a.id ? '…' : full ? 'Waitlist' : 'Book'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {error && <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.78rem', color: '#e05555', marginBottom: '0.75rem' }}>{error}</p>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <Link href="/dashboard/schedule" onClick={onClose} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-cta)', textDecoration: 'none' }}>
                Full schedule →
              </Link>
              <button onClick={onClose} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                No thanks
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
