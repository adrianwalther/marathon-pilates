'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

type ClassWithRoster = {
  id: string
  name: string
  session_type: string
  starts_at: string
  ends_at: string
  duration_minutes: number
  max_capacity: number
  locations: { name: string }
  bookings: RosterEntry[]
}

type RosterEntry = {
  id: string
  status: string
  attended: boolean | null
  profiles: {
    id: string
    first_name: string
    last_name: string
    polestar_traffic_light: string
    health_conditions: string[] | null
    total_classes_completed: number
  }
}

const TRAFFIC_COLORS = {
  green:  { bg: '#e8f7f4', color: '#87CEBF', label: 'No restrictions' },
  yellow: { bg: '#fff8e6', color: '#c8860a', label: 'Modifications may apply' },
  red:    { bg: '#fef0f0', color: '#e05555', label: 'Review before class' },
}

export default function MyClassesPage() {
  const [classes, setClasses] = useState<ClassWithRoster[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const getWeekRange = () => {
    const start = new Date()
    start.setDate(start.getDate() + weekOffset * 7 - start.getDay() + 1)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start: start.toISOString(), end: end.toISOString(), startDate: start }
  }

  const loadClasses = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { start, end } = getWeekRange()

    const { data: sessions } = await supabase
      .from('scheduled_sessions')
      .select('id, name, session_type, starts_at, ends_at, duration_minutes, max_capacity, locations(name)')
      .eq('instructor_id', user.id)
      .gte('starts_at', start)
      .lte('starts_at', end)
      .eq('is_cancelled', false)
      .order('starts_at', { ascending: true })

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id)
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, status, attended, session_id, profiles(id, first_name, last_name, polestar_traffic_light, health_conditions, total_classes_completed)')
        .in('session_id', sessionIds)
        .in('status', ['confirmed', 'waitlisted', 'completed'])

      const bookingsBySession: Record<string, RosterEntry[]> = {}
      bookings?.forEach(b => {
        if (!bookingsBySession[b.session_id]) bookingsBySession[b.session_id] = []
        bookingsBySession[b.session_id].push(b as RosterEntry)
      })

      setClasses(sessions.map(s => ({ ...s, bookings: bookingsBySession[s.id] ?? [] })) as ClassWithRoster[])
    } else {
      setClasses([])
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset])

  useEffect(() => { loadClasses() }, [loadClasses])

  const markAttendance = async (bookingId: string, attended: boolean) => {
    setMarkingId(bookingId)
    const supabase = createClient()
    await supabase.from('bookings').update({
      attended,
      status: attended ? 'completed' : 'no_show',
    }).eq('id', bookingId)
    showToast(attended ? 'Marked present' : 'Marked no-show')
    loadClasses()
    setMarkingId(null)
  }

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const formatDay = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const isUpcoming = (iso: string) => new Date(iso) > new Date()
  const isPast = (iso: string) => new Date(iso) < new Date()

  const { startDate } = getWeekRange()
  const weekEnd = new Date(startDate); weekEnd.setDate(startDate.getDate() + 6)

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '800px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: '#1a1a1a', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          {toast}
        </div>
      )}

      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '2rem' }}>
        My Classes
      </h1>

      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', background: 'white', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.4rem 0.8rem', cursor: 'pointer', color: '#808282' }}>←</button>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#1a1a1a' }}>
          {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <button onClick={() => setWeekOffset(w => w + 1)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', background: 'white', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.4rem 0.8rem', cursor: 'pointer', color: '#808282' }}>→</button>
        {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', color: '#87CEBF' }}>This week</button>}
      </div>

      {loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : classes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ccc' }}>No classes this week</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {classes.map(cls => {
            const isOpen = expanded === cls.id
            const past = isPast(cls.ends_at)
            const upcoming = isUpcoming(cls.starts_at)
            const confirmedCount = cls.bookings.filter(b => ['confirmed', 'completed'].includes(b.status)).length
            const hasRedFlag = cls.bookings.some(b => b.profiles?.polestar_traffic_light === 'red')

            return (
              <div key={cls.id} style={{ background: 'white', border: `1px solid ${hasRedFlag && upcoming ? '#fdd' : '#eee'}`, borderRadius: '2px', overflow: 'hidden' }}>
                {/* Class header */}
                <div
                  onClick={() => setExpanded(isOpen ? null : cls.id)}
                  style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '1rem' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.9rem', color: '#1a1a1a' }}>{cls.name}</p>
                      {hasRedFlag && upcoming && (
                        <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: '2px', background: '#fef0f0', color: '#e05555' }}>
                          ⚠ Review needed
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#808282' }}>
                      {formatDay(cls.starts_at)} · {formatTime(cls.starts_at)} – {formatTime(cls.ends_at)} · {cls.locations?.name}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.88rem', color: '#1a1a1a' }}>{confirmedCount}/{cls.max_capacity}</p>
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa' }}>booked</p>
                    </div>
                    <span style={{ color: '#aaa', fontSize: '0.8rem' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Roster */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #f0f0f0', padding: '1.25rem 1.5rem' }}>
                    {cls.bookings.length === 0 ? (
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#aaa' }}>No bookings yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.25rem' }}>
                          Roster — {cls.bookings.length} client{cls.bookings.length !== 1 ? 's' : ''}
                        </p>
                        {cls.bookings.map(b => {
                          const tl = TRAFFIC_COLORS[b.profiles?.polestar_traffic_light as keyof typeof TRAFFIC_COLORS] ?? TRAFFIC_COLORS.green
                          const isNew = (b.profiles?.total_classes_completed ?? 0) < 3

                          return (
                            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f9f8f6', borderRadius: '2px', gap: '1rem' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.85rem', color: '#1a1a1a' }}>
                                    {b.profiles?.first_name} {b.profiles?.last_name}
                                  </p>
                                  {isNew && (
                                    <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.15rem 0.4rem', borderRadius: '2px', background: '#e8f7f4', color: '#87CEBF' }}>New</span>
                                  )}
                                  <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.15rem 0.4rem', borderRadius: '2px', background: tl.bg, color: tl.color }}>
                                    {b.profiles?.polestar_traffic_light}
                                  </span>
                                </div>
                                {b.profiles?.health_conditions && b.profiles.health_conditions.length > 0 && (
                                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#808282', marginTop: '0.2rem' }}>
                                    {b.profiles.health_conditions.join(', ')}
                                  </p>
                                )}
                              </div>

                              {/* Attendance buttons — only for past classes */}
                              {past && (
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button
                                    onClick={() => markAttendance(b.id, true)}
                                    disabled={markingId === b.id}
                                    style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.35rem 0.7rem', borderRadius: '2px', border: 'none', background: b.attended === true ? '#87CEBF' : '#e8f7f4', color: b.attended === true ? 'white' : '#87CEBF', cursor: 'pointer' }}
                                  >
                                    ✓ Present
                                  </button>
                                  <button
                                    onClick={() => markAttendance(b.id, false)}
                                    disabled={markingId === b.id}
                                    style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.35rem 0.7rem', borderRadius: '2px', border: 'none', background: b.attended === false ? '#e05555' : '#f5f5f5', color: b.attended === false ? 'white' : '#808282', cursor: 'pointer' }}
                                  >
                                    No-show
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
