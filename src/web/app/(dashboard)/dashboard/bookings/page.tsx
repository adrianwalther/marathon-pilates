'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type PrivateRequest = {
  id: string
  session_type: string
  location: string
  preferred_dates: string[]
  focus_area: string | null
  notes: string | null
  status: string
  proposed_time: string | null
  admin_notes: string | null
  created_at: string
}

type Booking = {
  id: string
  status: string
  attended: boolean | null
  amount_paid: number
  created_at: string
  cancelled_at: string | null
  late_cancel: boolean
  scheduled_sessions: {
    id: string
    name: string
    session_type: string
    starts_at: string
    ends_at: string
    duration_minutes: number
    locations: { name: string }
  }
}

const TABS = ['upcoming', 'past', 'cancelled', 'requests'] as const
type Tab = typeof TABS[number]

const SESSION_TYPE_LABELS: Record<string, string> = {
  private_solo: 'Solo Private',
  private_duet: 'Duet Private',
  private_trio: 'Trio Private',
}

const LOCATION_LABELS: Record<string, string> = {
  charlotte_park: 'Charlotte Park',
  green_hills: 'Green Hills',
  no_preference: 'No Preference',
}

const REQUEST_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: '#fff8e6', color: '#c8860a' },
  proposed:  { bg: '#e8f0fe', color: '#3b5bdb' },
  confirmed: { bg: '#e8f7f4', color: '#87CEBF' },
  declined:  { bg: '#fef0f0', color: '#e05555' },
  cancelled: { bg: '#f0f0f0', color: '#808282' },
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  confirmed:  { bg: '#e8f7f4', color: '#87CEBF' },
  waitlisted: { bg: '#fff8e6', color: '#c8860a' },
  completed:  { bg: '#f0f0f0', color: '#808282' },
  cancelled:  { bg: '#fef0f0', color: '#e05555' },
  no_show:    { bg: '#fef0f0', color: '#e05555' },
}

function BookingsPageInner() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) ?? 'upcoming'
  const submitted = searchParams.get('submitted') === '1'

  const [bookings, setBookings] = useState<Booking[]>([])
  const [requests, setRequests] = useState<PrivateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>(initialTab)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (submitted) showToast('Private session request submitted! We\'ll be in touch within 24 hours.')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadBookings = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date().toISOString()

    let query = supabase
      .from('bookings')
      .select('id, status, attended, amount_paid, created_at, cancelled_at, late_cancel, scheduled_sessions(id, name, session_type, starts_at, ends_at, duration_minutes, locations(name))')
      .eq('client_id', user.id)
      .order('scheduled_sessions.starts_at', { ascending: tab === 'upcoming' })

    if (tab === 'upcoming') {
      query = query.in('status', ['confirmed', 'waitlisted']).gte('scheduled_sessions.starts_at', now)
    } else if (tab === 'past') {
      query = query.in('status', ['completed', 'no_show', 'confirmed']).lt('scheduled_sessions.starts_at', now)
    } else {
      query = query.eq('status', 'cancelled')
    }

    const { data } = await query
    setBookings((data ?? []) as unknown as Booking[])
    setLoading(false)
  }, [tab])

  const loadRequests = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('private_session_requests')
      .select('id, session_type, location, preferred_dates, focus_area, notes, status, proposed_time, admin_notes, created_at')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
    setRequests((data ?? []) as PrivateRequest[])
  }, [])

  useEffect(() => { loadBookings() }, [loadBookings])
  useEffect(() => { loadRequests() }, [loadRequests])

  const handleCancel = async (booking: Booking) => {
    setCancellingId(booking.id)
    const supabase = createClient()
    const now = new Date()
    const classTime = new Date(booking.scheduled_sessions.starts_at)
    const hoursUntil = (classTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    const lateCancel = hoursUntil < 12

    const { error } = await supabase.from('bookings').update({
      status: 'cancelled',
      cancelled_at: now.toISOString(),
      late_cancel: lateCancel,
    }).eq('id', booking.id)

    if (error) {
      showToast('Could not cancel booking', 'error')
    } else {
      showToast(lateCancel ? 'Cancelled (late cancel — within 12hr window)' : 'Booking cancelled')
      loadBookings()
    }
    setCancellingId(null)
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const tabStyle = (active: boolean) => ({
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700,
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    padding: '0.6rem 1.25rem',
    borderRadius: '2px',
    border: 'none',
    background: active ? '#1a1a1a' : 'white',
    color: active ? 'white' : '#808282',
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '900px' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: toast.type === 'success' ? '#1a1a1a' : '#e05555', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a' }}>
          My Bookings
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/dashboard/book-private" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', background: '#1a1a1a', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '2px', textDecoration: 'none' }}>
            + Request Private
          </Link>
          <Link href="/dashboard/schedule" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', background: '#87CEBF', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '2px', textDecoration: 'none' }}>
            + Book a Class
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(tab === t)}>
            {t === 'requests' ? 'Private Requests' : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'requests' && requests.filter(r => r.status === 'pending' || r.status === 'proposed').length > 0 && (
              <span style={{ marginLeft: '0.4rem', background: '#c8860a', color: 'white', borderRadius: '10px', padding: '0.1rem 0.45rem', fontSize: '0.55rem' }}>
                {requests.filter(r => r.status === 'pending' || r.status === 'proposed').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests tab */}
      {tab === 'requests' && (
        <div>
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ccc' }}>No requests yet</p>
              <Link href="/dashboard/book-private" style={{ display: 'inline-block', marginTop: '1.5rem', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#87CEBF', textDecoration: 'none' }}>
                Request a Private →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {requests.map(r => {
                const statusStyle = REQUEST_STATUS_COLORS[r.status] ?? { bg: '#f0f0f0', color: '#808282' }
                return (
                  <div key={r.id} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.9rem', color: '#1a1a1a' }}>
                            {SESSION_TYPE_LABELS[r.session_type] ?? r.session_type}
                          </p>
                          <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '2px', background: statusStyle.bg, color: statusStyle.color }}>
                            {r.status}
                          </span>
                        </div>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#808282', marginBottom: '0.25rem' }}>
                          {LOCATION_LABELS[r.location]} {r.focus_area ? `· ${r.focus_area}` : ''}
                        </p>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa' }}>
                          {r.preferred_dates?.slice(0, 3).join(', ')}{(r.preferred_dates?.length ?? 0) > 3 ? ` +${(r.preferred_dates?.length ?? 0) - 3} more` : ''}
                        </p>
                        {r.status === 'proposed' && r.proposed_time && (
                          <div style={{ marginTop: '0.75rem', background: '#e8f0fe', borderRadius: '2px', padding: '0.75rem 1rem' }}>
                            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3b5bdb', marginBottom: '0.25rem' }}>
                              Time Proposed
                            </p>
                            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.82rem', color: '#1a1a1a' }}>
                              {new Date(r.proposed_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {new Date(r.proposed_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                            {r.admin_notes && <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#555', marginTop: '0.25rem' }}>{r.admin_notes}</p>}
                          </div>
                        )}
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#ccc', marginTop: '0.5rem' }}>
                          Submitted {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab !== 'requests' && loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : tab !== 'requests' && bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ccc' }}>
            {tab === 'upcoming' ? 'No upcoming classes' : tab === 'past' ? 'No past classes yet' : 'No cancelled bookings'}
          </p>
          {tab === 'upcoming' && (
            <Link href="/dashboard/schedule" style={{ display: 'inline-block', marginTop: '1.5rem', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#87CEBF', textDecoration: 'none' }}>
              Browse Schedule →
            </Link>
          )}
        </div>
      ) : tab !== 'requests' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {bookings.map(b => {
            const session = b.scheduled_sessions
            const isPast = new Date(session.starts_at) < new Date()
            const canCancel = b.status === 'confirmed' && !isPast
            const hoursUntil = (new Date(session.starts_at).getTime() - Date.now()) / (1000 * 60 * 60)
            const lateWindow = hoursUntil < 12 && hoursUntil > 0
            const statusStyle = STATUS_COLORS[b.status] ?? { bg: '#f0f0f0', color: '#808282' }

            return (
              <div key={b.id} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.9rem', color: '#1a1a1a' }}>
                        {session.name}
                      </p>
                      <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '2px', background: statusStyle.bg, color: statusStyle.color }}>
                        {b.status}
                      </span>
                      {b.late_cancel && (
                        <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '2px', background: '#fff0e0', color: '#c8860a' }}>
                          Late Cancel
                        </span>
                      )}
                    </div>

                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#808282' }}>
                      {formatDate(session.starts_at)} · {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
                    </p>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa', marginTop: '0.15rem' }}>
                      {session.locations?.name} · {session.duration_minutes} min
                    </p>

                    {lateWindow && canCancel && (
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c8860a', marginTop: '0.5rem' }}>
                        ⚠ Within 12-hour cancel window
                      </p>
                    )}
                  </div>

                  {canCancel && (
                    <button
                      onClick={() => handleCancel(b)}
                      disabled={cancellingId === b.id}
                      style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 1rem', border: '1px solid #e0e0e0', borderRadius: '2px', background: 'white', color: '#808282', cursor: cancellingId === b.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {cancellingId === b.id ? '...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem 2.5rem' }}><p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p></div>}>
      <BookingsPageInner />
    </Suspense>
  )
}
