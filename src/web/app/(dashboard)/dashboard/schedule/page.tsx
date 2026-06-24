'use client'

import { pageStyle } from '@/lib/pageStyle'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { logEvent } from '@/lib/events'
import { serviceKeyFromType } from '@/lib/nudges'
import { bookClass } from '@/lib/bookClass'
import RebookModal, { type CancelledInfo } from '@/components/RebookModal'

type Session = {
  id: string
  name: string
  session_type: string
  starts_at: string
  ends_at: string
  duration_minutes: number
  max_capacity: number
  drop_in_price: number | null
  is_cancelled: boolean
  instructor_id: string | null
  locations: { name: string; slug: string }
  booking_count: number
  user_booking: { status: string } | null
}

const SESSION_LABELS: Record<string, string> = {
  group_reformer: 'Group Reformer',
  private_solo: 'Private — Solo',
  private_duet: 'Private — Duet',
  private_trio: 'Private — Trio',
  sauna: 'Sauna',
  cold_plunge: 'Cold Plunge',
  contrast_therapy: 'Contrast Therapy',
  neveskin: 'Neveskin',
}

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'group_reformer', label: 'Group' },
  { value: 'private', label: 'Private' },
  { value: 'sauna', label: 'Sauna' },
  { value: 'cold_plunge', label: 'Cold Plunge' },
  { value: 'contrast_therapy', label: 'Contrast Therapy' },
  { value: 'neveskin', label: 'Neveskin' },
]

const LOCATION_FILTERS = [
  { value: '', label: 'Both Studios' },
  { value: 'charlotte_park', label: 'Charlotte Park' },
  { value: 'green_hills', label: 'Green Hills' },
]

function getDayRange(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(0, 0, 0, 0)
  const start = d.toISOString()
  d.setHours(23, 59, 59, 999)
  const end = d.toISOString()
  return { start, end, date: new Date(start) }
}

function buildWeek() {
  return Array.from({ length: 7 }, (_, i) => getDayRange(i))
}

type ConfirmedBooking = {
  name: string
  starts_at: string
  location: string
  needsHealthCheck: boolean
}

function BookingConfirmedModal({ booking, onDone }: { booking: ConfirmedBooking; onDone: () => void }) {
  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' +
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const handleAllGood = () => {
    localStorage.setItem('health_checkin_dismissed', String(Date.now()))
    onDone()
  }

  return (
    <div
      onClick={onDone}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(48, 45, 39, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '4px', width: '100%', maxWidth: '420px',
          boxShadow: '0 20px 60px rgba(48,45,39,0.18)',
          overflow: 'hidden',
        }}
      >
        {/* Confirmation header */}
        <div style={{ padding: '2.25rem 2rem 1.75rem', textAlign: 'center' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'var(--color-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text)', margin: '0 0 0.5rem' }}>
            You&rsquo;re all set.
          </h2>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.88rem', color: 'var(--color-text)', margin: '0 0 0.2rem' }}>
            {booking.name}
          </p>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>
            {formatDateTime(booking.starts_at)}
          </p>
          {booking.location && (
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', margin: '0.35rem 0 0' }}>
              {booking.location}
            </p>
          )}
        </div>

        {booking.needsHealthCheck ? (
          <>
            <div style={{ height: '1px', background: '#f0ebe4', margin: '0 2rem' }} />
            <div style={{ background: '#f5ece6', padding: '1.5rem 2rem 2rem' }}>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-cta)', margin: '0 0 0.5rem' }}>
                Before you come in
              </p>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.88rem', color: 'var(--color-text)', margin: '0 0 0.4rem' }}>
                Is your health info still current?
              </p>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.65, margin: '0 0 1.25rem' }}>
                A new injury, surgery, or life change helps your instructor keep every session safe and just right for you.
              </p>
              <button
                onClick={handleAllGood}
                style={{ width: '100%', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.85rem', background: 'var(--color-cta)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', marginBottom: '0.65rem' }}
              >
                All good — see you there →
              </button>
              <a
                href="/dashboard/account"
                style={{ display: 'block', textAlign: 'center', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-cta)', textDecoration: 'none', padding: '0.5rem' }}
              >
                Update Health Info
              </a>
            </div>
          </>
        ) : (
          <div style={{ padding: '0 2rem 2rem' }}>
            <button
              onClick={onDone}
              style={{ width: '100%', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.85rem', background: 'var(--color-text)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
            >
              Great — see you there →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SchedulePageInner() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') ?? ''

  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState(initialType)
  const [locationFilter, setLocationFilter] = useState('')

  // Green Hills is privates-only — auto-switch type filter when location changes
  const handleLocationChange = (loc: string) => {
    setLocationFilter(loc)
    if (loc === 'green_hills') setTypeFilter('private')
    else if (locationFilter === 'green_hills') setTypeFilter('')
  }
  const [selectedDay, setSelectedDay] = useState(0)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [rebook, setRebook] = useState<CancelledInfo | null>(null)
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null)
  const [healthLastUpdated, setHealthLastUpdated] = useState<string | null>(null)

  // Behavioral signal: when the client browses a specific service, log it as
  // intent. The dashboard nudge ranker boosts services a client keeps viewing
  // but hasn't booked. Fires once per distinct service the filter resolves to.
  useEffect(() => {
    const key = serviceKeyFromType(typeFilter)
    if (key) logEvent('service_view', { serviceKey: key })
  }, [typeFilter])

  // Handle Stripe redirect back after payment.
  // The booking is created by the SIGNED Stripe webhook (the trusted server-side
  // source of truth) — never client-side. A previous version inserted the booking
  // straight from the browser, which let anyone mint a free 'confirmed' booking for
  // any class (bypassing payment, capacity, and the credit RPC). We now only give
  // feedback and refresh so the new booking appears once the webhook lands.
  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success') {
      showToast('Payment received — confirming your booking…')
      loadSessions()
      const t = setTimeout(loadSessions, 2500) // webhook normally lands within a second or two
      return () => clearTimeout(t)
    } else if (payment === 'cancelled') {
      showToast('Payment cancelled', 'error')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: prof } = await supabase.from('profiles').select('intake_completed_at').eq('id', data.user.id).single()
      if (prof) setHealthLastUpdated(prof.intake_completed_at)
    })
  }, [])

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const week = buildWeek()

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadSessions = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { start, end } = week[selectedDay]

    let query = supabase
      .from('scheduled_sessions')
      .select('id, name, session_type, starts_at, ends_at, duration_minutes, max_capacity, drop_in_price, is_cancelled, instructor_id, locations(name, slug)')
      .gte('starts_at', start)
      .lte('starts_at', end)
      .eq('is_cancelled', false)
      .order('starts_at', { ascending: true })

    const LOCATION_IDS: Record<string, string> = {
      charlotte_park: 'd727b8df-d963-4bc5-a080-5908a1f4711e',
      green_hills: '9410b236-c577-4d37-bd3e-094c66b3c921',
    }
    if (locationFilter && LOCATION_IDS[locationFilter]) {
      query = query.eq('location_id', LOCATION_IDS[locationFilter])
    }

    if (typeFilter === 'private') {
      query = query.in('session_type', ['private_solo', 'private_duet', 'private_trio'])
    } else if (typeFilter) {
      query = query.eq('session_type', typeFilter)
    }

    const { data } = await query

    // Get booking counts + user bookings
    if (data && data.length > 0) {
      const sessionIds = data.map(s => s.id)
      const [{ data: counts }, { data: userBookings }] = await Promise.all([
        supabase.from('bookings').select('session_id').in('session_id', sessionIds).in('status', ['confirmed', 'waitlisted']),
        user ? supabase.from('bookings').select('session_id, status').eq('client_id', user.id).in('session_id', sessionIds) : { data: [] },
      ])

      const countMap: Record<string, number> = {}
      counts?.forEach(b => { countMap[b.session_id] = (countMap[b.session_id] ?? 0) + 1 })

      const bookingMap: Record<string, { status: string }> = {}
      userBookings?.forEach(b => { bookingMap[b.session_id] = { status: b.status } })

      setSessions(data.map(s => ({
        ...s,
        booking_count: countMap[s.id] ?? 0,
        user_booking: bookingMap[s.id] ?? null,
      })) as unknown as Session[])
    } else {
      setSessions([])
    }

    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, typeFilter, locationFilter])

  useEffect(() => { loadSessions() }, [loadSessions])

  const handleBook = async (session: Session) => {
    setBookingId(session.id)
    setBookingLoading(true)
    const r = await bookClass(session)
    if (r.outcome === 'checkout') return // redirecting to Stripe — page is navigating away
    if (r.outcome === 'error') {
      showToast(r.message, 'error')
    } else {
      loadSessions()
      // Show the branded confirmation modal.
      // Health check: prompt if last update was >30 days ago and not recently dismissed.
      const dismissed = localStorage.getItem('health_checkin_dismissed')
      const dismissedRecently = dismissed && Date.now() - Number(dismissed) < 30 * 24 * 60 * 60 * 1000
      const lastReview = healthLastUpdated ? new Date(healthLastUpdated).getTime() : 0
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
      const needsHealthCheck = !dismissedRecently && lastReview < thirtyDaysAgo
      setConfirmedBooking({
        name: session.name,
        starts_at: session.starts_at,
        location: session.locations?.name ?? '',
        needsHealthCheck,
      })
    }
    setBookingLoading(false)
    setBookingId(null)
  }

  const handleCancel = async (session: Session) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: { session: authSession } } = await supabase.auth.getSession()

    // Cancel via API so the server can atomically refund the credit (unless a
    // late cancel) and promote the waitlist
    const res = await fetch('/api/bookings/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authSession ? `Bearer ${authSession.access_token}` : '',
      },
      body: JSON.stringify({ session_id: session.id }),
    })
    const result = await res.json().catch(() => ({}))

    if (!res.ok) {
      showToast(result.error || 'Could not cancel booking', 'error')
    } else if (result.late_cancel) {
      showToast('Cancelled — late cancel, credit not refunded')
    } else if (result.refunded) {
      showToast('Cancelled — credit refunded')
    } else {
      showToast('Booking cancelled')
    }
    loadSessions()

    // Retention: offer an alternative class right after a successful cancel.
    if (res.ok) {
      setRebook({ sessionId: session.id, name: session.name, sessionType: session.session_type, refunded: !!result.refunded })
    }
  }

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const formatDay = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' })
  const formatDayNum = (d: Date) => d.getDate()
  const isToday = (d: Date) => d.toDateString() === new Date().toDateString()

  const pillStyle = (active: boolean) => ({
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700,
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    padding: '0.4rem 1rem',
    borderRadius: '2px',
    border: active ? 'none' : '1px solid #e0e0e0',
    background: active ? 'var(--color-cta)' : 'white',
    color: active ? 'white' : 'var(--color-text-muted)',
    cursor: 'pointer',
  })

  return (
    <div style={pageStyle()}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100,
          background: toast.type === 'success' ? 'var(--color-text)' : '#e05555',
          color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px',
          fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em',
        }}>
          {toast.msg}
        </div>
      )}

      {rebook && (
        <RebookModal cancelled={rebook} onClose={() => setRebook(null)} onBooked={loadSessions} />
      )}

      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text)', marginBottom: '2rem' }}>
        Schedule
      </h1>

      {/* Day picker */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {week.map((w, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '0.6rem 0.9rem', borderRadius: '2px', border: 'none', cursor: 'pointer',
              background: selectedDay === i ? 'var(--color-text)' : 'white',
              minWidth: '52px', flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: selectedDay === i ? 'var(--color-cta)' : '#aaa' }}>
              {formatDay(w.date)}
            </span>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: selectedDay === i ? 400 : 100, fontSize: '1.2rem', color: selectedDay === i ? 'white' : 'var(--color-text)', lineHeight: 1.3 }}>
              {formatDayNum(w.date)}
            </span>
            {isToday(w.date) && (
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-cta)', marginTop: '2px' }} />
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {TYPE_FILTERS.map(f => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)} style={pillStyle(typeFilter === f.value)}>
            {f.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {LOCATION_FILTERS.map(f => (
          <button key={f.value} onClick={() => handleLocationChange(f.value)} style={pillStyle(locationFilter === f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ccc' }}>No classes</p>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.8rem', color: '#aaa', marginTop: '0.5rem' }}>Try a different day or filter</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sessions.map(s => {
            const spotsLeft = s.max_capacity - s.booking_count
            const isFull = spotsLeft <= 0
            const userBooked = s.user_booking?.status === 'confirmed'
            const userWaitlisted = s.user_booking?.status === 'waitlisted'
            const isLoading = bookingLoading && bookingId === s.id

            return (
              <div key={s.id} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                      {s.name}
                    </p>
                    <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: '2px', background: '#f0f0f0', color: 'var(--color-text-muted)' }}>
                      {SESSION_LABELS[s.session_type] ?? s.session_type}
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {formatTime(s.starts_at)} – {formatTime(s.ends_at)} · {s.duration_minutes} min
                  </p>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa', marginTop: '0.15rem' }}>
                    {s.locations?.name}
                    {s.drop_in_price ? ` · $${s.drop_in_price}` : ''}
                  </p>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.4rem', color: isFull ? '#c8860a' : spotsLeft <= 2 ? '#c8860a' : 'var(--color-cta)' }}>
                    {isFull ? 'Full — waitlist open' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                  </p>
                </div>

                <div>
                  {userBooked ? (
                    <button onClick={() => handleCancel(s)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1rem', border: '1px solid #e0e0e0', borderRadius: '2px', background: 'white', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  ) : userWaitlisted ? (
                    <button onClick={() => handleCancel(s)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1rem', border: '1px solid #c8860a', borderRadius: '2px', background: 'white', color: '#c8860a', cursor: 'pointer' }}>
                      Waitlisted
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBook(s)}
                      disabled={isLoading}
                      style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', border: 'none', borderRadius: '2px', background: isLoading ? 'var(--color-cta-disabled)' : 'var(--color-cta)', color: 'white', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                      {isLoading ? '...' : isFull ? 'Join Waitlist' : 'Book'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {confirmedBooking && (
        <BookingConfirmedModal
          booking={confirmedBooking}
          onDone={() => setConfirmedBooking(null)}
        />
      )}
    </div>
  )
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem 2.5rem' }}><p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p></div>}>
      <SchedulePageInner />
    </Suspense>
  )
}
