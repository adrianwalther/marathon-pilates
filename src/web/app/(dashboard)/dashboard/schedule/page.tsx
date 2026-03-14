'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

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

export default function SchedulePage() {
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
      })) as Session[])
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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Please sign in', 'error'); setBookingLoading(false); return }

    const isFull = session.booking_count >= session.max_capacity
    const { error } = await supabase.from('bookings').insert({
      client_id: user.id,
      session_id: session.id,
      status: isFull ? 'waitlisted' : 'confirmed',
      amount_paid: 0,
      payment_status: 'pending',
    })

    if (error) {
      showToast(error.message.includes('unique') ? 'Already booked' : error.message, 'error')
    } else {
      showToast(isFull ? 'Added to waitlist' : 'Booking confirmed!')
      loadSessions()
    }
    setBookingLoading(false)
    setBookingId(null)
  }

  const handleCancel = async (session: Session) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('bookings').update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('client_id', user.id).eq('session_id', session.id)
    showToast('Booking cancelled')
    loadSessions()
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
    background: active ? '#87CEBF' : 'white',
    color: active ? 'white' : '#808282',
    cursor: 'pointer',
  })

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '900px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100,
          background: toast.type === 'success' ? '#1a1a1a' : '#e05555',
          color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px',
          fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em',
        }}>
          {toast.msg}
        </div>
      )}

      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '2rem' }}>
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
              background: selectedDay === i ? '#1a1a1a' : 'white',
              minWidth: '52px', flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: selectedDay === i ? '#87CEBF' : '#aaa' }}>
              {formatDay(w.date)}
            </span>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: selectedDay === i ? 400 : 100, fontSize: '1.2rem', color: selectedDay === i ? 'white' : '#1a1a1a', lineHeight: 1.3 }}>
              {formatDayNum(w.date)}
            </span>
            {isToday(w.date) && (
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#87CEBF', marginTop: '2px' }} />
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
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.9rem', color: '#1a1a1a' }}>
                      {s.name}
                    </p>
                    <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: '2px', background: '#f0f0f0', color: '#808282' }}>
                      {SESSION_LABELS[s.session_type] ?? s.session_type}
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#808282' }}>
                    {formatTime(s.starts_at)} – {formatTime(s.ends_at)} · {s.duration_minutes} min
                  </p>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa', marginTop: '0.15rem' }}>
                    {s.locations?.name}
                    {s.drop_in_price ? ` · $${s.drop_in_price}` : ''}
                  </p>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.4rem', color: isFull ? '#c8860a' : spotsLeft <= 2 ? '#c8860a' : '#87CEBF' }}>
                    {isFull ? 'Full — waitlist open' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                  </p>
                </div>

                <div>
                  {userBooked ? (
                    <button onClick={() => handleCancel(s)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1rem', border: '1px solid #e0e0e0', borderRadius: '2px', background: 'white', color: '#808282', cursor: 'pointer' }}>
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
                      style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', border: 'none', borderRadius: '2px', background: isLoading ? '#b0ddd6' : '#87CEBF', color: 'white', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                      {isLoading ? '...' : isFull ? 'Join Waitlist' : 'Book'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
