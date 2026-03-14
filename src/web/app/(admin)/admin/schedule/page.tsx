'use client'

import { useEffect, useState, useCallback } from 'react'
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
  booking_count: number
  location_id: string
  locations: { name: string; slug: string }
  profiles: { first_name: string; last_name: string } | null
}

type RosterEntry = {
  id: string
  status: string
  attended: boolean | null
  late_cancel: boolean
  profiles: { first_name: string; last_name: string; email: string } | null
}

type Instructor = { id: string; first_name: string; last_name: string }
type Location = { id: string; slug: string; name: string }

const LOCATION_IDS: Record<string, string> = {
  charlotte_park: 'd727b8df-d963-4bc5-a080-5908a1f4711e',
  green_hills: '9410b236-c577-4d37-bd3e-094c66b3c921',
}

const SESSION_TYPES = [
  { value: 'group_reformer', label: 'Group Reformer', capacity: 8 },
  { value: 'private_solo', label: 'Private — Solo', capacity: 1 },
  { value: 'private_duet', label: 'Private — Duet', capacity: 2 },
  { value: 'private_trio', label: 'Private — Trio', capacity: 3 },
  { value: 'sauna', label: 'Sauna', capacity: 4 },
  { value: 'cold_plunge', label: 'Cold Plunge', capacity: 2 },
  { value: 'contrast_therapy', label: 'Contrast Therapy', capacity: 2 },
  { value: 'neveskin', label: 'Neveskin', capacity: 1 },
]

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'group', label: 'Group' },
  { value: 'private', label: 'Private' },
  { value: 'amenity', label: 'Amenities' },
]

const LOCATION_FILTER_OPTIONS = [
  { value: '', label: 'Both Studios' },
  { value: 'charlotte_park', label: 'Charlotte Park' },
  { value: 'green_hills', label: 'Green Hills' },
]

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  confirmed:  { bg: '#e8f7f4', color: '#87CEBF' },
  waitlisted: { bg: '#fff8e6', color: '#c8860a' },
  cancelled:  { bg: '#fef0f0', color: '#e05555' },
  no_show:    { bg: '#fef0f0', color: '#e05555' },
  completed:  { bg: '#f0f0f0', color: '#808282' },
}

const emptyForm = {
  name: '',
  session_type: 'group_reformer',
  location_id: '',
  instructor_id: '',
  date: '',
  start_time: '',
  duration_minutes: 50,
  max_capacity: 8,
  drop_in_price: '',
}

export default function AdminSchedulePage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [typeFilter, setTypeFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [rosterSession, setRosterSession] = useState<Session | null>(null)
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [rosterLoading, setRosterLoading] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const getWeekRange = useCallback(() => {
    const start = new Date()
    // Snap to start of current week (Sunday)
    const dayOfWeek = start.getDay()
    start.setDate(start.getDate() - dayOfWeek + weekOffset * 7)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start: start.toISOString(), end: end.toISOString(), startDate: new Date(start) }
  }, [weekOffset])

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { start, end } = getWeekRange()

    let query = supabase
      .from('scheduled_sessions')
      .select('id, name, session_type, starts_at, ends_at, duration_minutes, max_capacity, drop_in_price, is_cancelled, location_id, locations(name, slug), profiles(first_name, last_name)')
      .gte('starts_at', start)
      .lte('starts_at', end)
      .order('starts_at', { ascending: true })

    if (locationFilter && LOCATION_IDS[locationFilter]) {
      query = query.eq('location_id', LOCATION_IDS[locationFilter])
    }

    if (typeFilter === 'group') {
      query = query.eq('session_type', 'group_reformer')
    } else if (typeFilter === 'private') {
      query = query.in('session_type', ['private_solo', 'private_duet', 'private_trio'])
    } else if (typeFilter === 'amenity') {
      query = query.in('session_type', ['sauna', 'cold_plunge', 'contrast_therapy', 'neveskin'])
    }

    const [{ data: sessionsData }, { data: instructorProfiles }, { data: locs }] = await Promise.all([
      query,
      supabase.from('profiles').select('id, first_name, last_name').in('role', ['instructor', 'admin']),
      supabase.from('locations').select('id, slug, name'),
    ])

    if (sessionsData && sessionsData.length > 0) {
      const ids = sessionsData.map(s => s.id)
      const { data: bookings } = await supabase
        .from('bookings')
        .select('session_id')
        .in('session_id', ids)
        .in('status', ['confirmed', 'waitlisted'])
      const countMap: Record<string, number> = {}
      bookings?.forEach(b => { countMap[b.session_id] = (countMap[b.session_id] ?? 0) + 1 })
      setSessions(sessionsData.map(s => ({ ...s, booking_count: countMap[s.id] ?? 0 })) as Session[])
    } else {
      setSessions([])
    }

    setInstructors((instructorProfiles ?? []) as Instructor[])
    setLocations((locs ?? []) as Location[])
    if (locs && locs.length > 0 && !form.location_id) {
      setForm(f => ({ ...f, location_id: locs[0].id }))
    }
    setLoading(false)
  }, [weekOffset, typeFilter, locationFilter, getWeekRange]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData() }, [loadData])

  const openRoster = async (session: Session) => {
    setRosterSession(session)
    setRosterLoading(true)
    setRoster([])
    const supabase = createClient()
    const { data } = await supabase
      .from('bookings')
      .select('id, status, attended, late_cancel, profiles(first_name, last_name, email)')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })
    setRoster((data ?? []) as RosterEntry[])
    setRosterLoading(false)
  }

  const markAttended = async (bookingId: string, attended: boolean) => {
    const supabase = createClient()
    await supabase.from('bookings').update({ attended, status: attended ? 'completed' : 'no_show' }).eq('id', bookingId)
    if (rosterSession) openRoster(rosterSession)
  }

  const handleTypeChange = (type: string) => {
    const t = SESSION_TYPES.find(s => s.value === type)
    setForm(f => ({ ...f, session_type: type, max_capacity: t?.capacity ?? 1, name: t?.label ?? '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const startsAt = new Date(`${form.date}T${form.start_time}`)
    const endsAt = new Date(startsAt.getTime() + form.duration_minutes * 60000)

    const { error } = await supabase.from('scheduled_sessions').insert({
      name: form.name,
      session_type: form.session_type,
      location_id: form.location_id,
      instructor_id: form.instructor_id || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      duration_minutes: form.duration_minutes,
      max_capacity: form.max_capacity,
      drop_in_price: form.drop_in_price ? parseFloat(form.drop_in_price) : null,
    })

    if (error) showToast(error.message, 'error')
    else {
      showToast('Class added')
      setShowForm(false)
      setForm(emptyForm)
      loadData()
    }
    setSaving(false)
  }

  const handleCancelSession = async (id: string) => {
    if (!confirm('Cancel this class? Booked clients will need to be notified separately.')) return
    const supabase = createClient()
    await supabase.from('scheduled_sessions').update({ is_cancelled: true }).eq('id', id)
    showToast('Class cancelled')
    loadData()
  }

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const formatDay = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const isToday = (d: Date) => d.toDateString() === new Date().toDateString()

  const { startDate } = getWeekRange()
  const weekEnd = new Date(startDate); weekEnd.setDate(startDate.getDate() + 6)

  // Group sessions by day
  const grouped: Record<string, Session[]> = {}
  sessions.forEach(s => {
    const day = new Date(s.starts_at).toDateString()
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(s)
  })
  const days = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  const pillStyle = (active: boolean) => ({
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700 as const,
    fontSize: '0.62rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    padding: '0.35rem 0.9rem',
    borderRadius: '2px',
    border: active ? 'none' : '1px solid #e0e0e0',
    background: active ? '#1a1a1a' : 'white',
    color: active ? 'white' : '#808282',
    cursor: 'pointer',
  })

  const inputStyle = { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '2px', fontSize: '0.85rem', outline: 'none', background: 'white', fontFamily: "'Poppins', sans-serif" }
  const labelStyle = { fontFamily: "'Raleway', sans-serif", fontWeight: 600 as const, fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#808282', display: 'block', marginBottom: '0.35rem' }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '1100px' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: toast.type === 'success' ? '#1a1a1a' : '#e05555', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          {toast.msg}
        </div>
      )}

      {/* Roster Modal */}
      {rosterSession && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setRosterSession(null) }}>
          <div style={{ background: 'white', borderRadius: '2px', width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.95rem', color: '#1a1a1a', marginBottom: '0.2rem' }}>{rosterSession.name}</p>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#808282' }}>
                  {new Date(rosterSession.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(rosterSession.starts_at)} · {rosterSession.locations?.name}
                </p>
              </div>
              <button onClick={() => setRosterSession(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ padding: '1rem 2rem', overflowY: 'auto', flex: 1 }}>
              {rosterLoading ? (
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#aaa', padding: '1rem 0' }}>Loading roster...</p>
              ) : roster.length === 0 ? (
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#aaa', padding: '1rem 0' }}>No bookings yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {roster.map(r => {
                    const sc = STATUS_COLORS[r.status] ?? STATUS_COLORS.completed
                    return (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f5f5f5' }}>
                        <div>
                          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.85rem', color: '#1a1a1a' }}>
                            {r.profiles?.first_name} {r.profiles?.last_name}
                          </p>
                          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', marginTop: '0.1rem' }}>
                            {r.profiles?.email}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '2px', background: sc.bg, color: sc.color }}>
                            {r.late_cancel ? 'Late Cancel' : r.status}
                          </span>
                          {r.status === 'confirmed' && (
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                onClick={() => markAttended(r.id, true)}
                                style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.25rem 0.6rem', borderRadius: '2px', border: 'none', background: '#e8f7f4', color: '#87CEBF', cursor: 'pointer' }}>
                                ✓ In
                              </button>
                              <button
                                onClick={() => markAttended(r.id, false)}
                                style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.25rem 0.6rem', borderRadius: '2px', border: 'none', background: '#fef0f0', color: '#e05555', cursor: 'pointer' }}>
                                No Show
                              </button>
                            </div>
                          )}
                          {r.attended === true && <span style={{ fontSize: '0.75rem', color: '#87CEBF' }}>✓</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 2rem', borderTop: '1px solid #eee' }}>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#808282' }}>
                {rosterSession.booking_count} / {rosterSession.max_capacity} booked
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a' }}>Schedule</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.7rem 1.5rem', background: showForm ? '#1a1a1a' : '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>
          {showForm ? '✕ Close' : '+ Add Class'}
        </button>
      </div>

      {/* Add class form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '2rem', marginBottom: '2rem' }}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '1.5rem' }}>New Class</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Class Type</label>
              <select value={form.session_type} onChange={e => handleTypeChange(e.target.value)} style={inputStyle} required>
                {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Class Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} required
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
            </div>
            <div>
              <label style={labelStyle}>Studio</label>
              <select value={form.location_id} onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))} style={inputStyle} required>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Instructor</label>
              <select value={form.instructor_id} onChange={e => setForm(f => ({ ...f, instructor_id: e.target.value }))} style={inputStyle}>
                <option value="">Unassigned</option>
                {instructors.map(i => <option key={i.id} value={i.id}>{i.first_name} {i.last_name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} required
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
            </div>
            <div>
              <label style={labelStyle}>Start Time</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} style={inputStyle} required
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
            </div>
            <div>
              <label style={labelStyle}>Duration (min)</label>
              <input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))} style={inputStyle} min={15} max={120}
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
            </div>
            <div>
              <label style={labelStyle}>Max Capacity</label>
              <input type="number" value={form.max_capacity} onChange={e => setForm(f => ({ ...f, max_capacity: parseInt(e.target.value) }))} style={inputStyle} min={1} max={20}
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
            </div>
            <div>
              <label style={labelStyle}>Drop-in Price ($)</label>
              <input type="number" value={form.drop_in_price} onChange={e => setForm(f => ({ ...f, drop_in_price: e.target.value }))} placeholder="Optional" style={inputStyle} min={0} step="0.01"
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={saving} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.7rem 1.5rem', background: saving ? '#b0ddd6' : '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : 'Add to Schedule'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.7rem 1.5rem', background: 'white', color: '#808282', border: '1px solid #e0e0e0', borderRadius: '2px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setWeekOffset(w => w - 1)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', background: 'white', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.4rem 0.8rem', cursor: 'pointer', color: '#808282' }}>←</button>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#1a1a1a', minWidth: '160px', textAlign: 'center' }}>
            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <button onClick={() => setWeekOffset(w => w + 1)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', background: 'white', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.4rem 0.8rem', cursor: 'pointer', color: '#808282' }}>→</button>
          {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', color: '#87CEBF' }}>This Week</button>}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
        {TYPE_FILTER_OPTIONS.map(f => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)} style={pillStyle(typeFilter === f.value)}>{f.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {LOCATION_FILTER_OPTIONS.map(f => (
          <button key={f.value} onClick={() => setLocationFilter(f.value)} style={pillStyle(locationFilter === f.value)}>{f.label}</button>
        ))}
      </div>

      {/* Sessions grouped by day */}
      {loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ccc' }}>No classes this week</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {days.map(day => {
            const dayDate = new Date(day)
            const today = isToday(dayDate)
            return (
              <div key={day}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: today ? '#87CEBF' : '#808282' }}>
                    {formatDay(dayDate)}
                  </p>
                  {today && <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: '2px', background: '#e8f7f4', color: '#87CEBF' }}>Today</span>}
                  <div style={{ flex: 1, height: '1px', background: '#eee' }} />
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa' }}>{grouped[day].length} class{grouped[day].length !== 1 ? 'es' : ''}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {grouped[day].map(s => {
                    const isFull = s.booking_count >= s.max_capacity
                    const fillPct = Math.min(100, (s.booking_count / s.max_capacity) * 100)
                    return (
                      <div key={s.id} style={{ background: s.is_cancelled ? '#fef9f9' : 'white', border: `1px solid ${s.is_cancelled ? '#fdd' : '#eee'}`, borderRadius: '2px', padding: '0.9rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', opacity: s.is_cancelled ? 0.65 : 1 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.88rem', color: '#1a1a1a' }}>{s.name}</p>
                            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.15rem 0.45rem', borderRadius: '2px', background: '#f0f0f0', color: '#808282' }}>
                              {s.locations?.slug === 'charlotte_park' ? 'CP' : 'GH'}
                            </span>
                            {s.is_cancelled && <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.15rem 0.45rem', borderRadius: '2px', background: '#fdd', color: '#e05555' }}>Cancelled</span>}
                          </div>
                          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.74rem', color: '#808282' }}>
                            {formatTime(s.starts_at)} – {formatTime(s.ends_at)}
                            {s.profiles ? ` · ${s.profiles.first_name} ${s.profiles.last_name}` : ''}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.85rem', color: isFull ? '#c8860a' : '#1a1a1a' }}>
                              {s.booking_count}/{s.max_capacity}
                            </p>
                            <div style={{ height: '3px', background: '#f0f0f0', borderRadius: '2px', marginTop: '0.25rem', width: '50px' }}>
                              <div style={{ height: '100%', width: `${fillPct}%`, background: isFull ? '#c8860a' : '#87CEBF', borderRadius: '2px', transition: 'width 0.3s' }} />
                            </div>
                          </div>

                          <button
                            onClick={() => openRoster(s)}
                            style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.4rem 0.8rem', border: '1px solid #87CEBF', borderRadius: '2px', background: 'white', color: '#87CEBF', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Roster
                          </button>

                          {!s.is_cancelled && (
                            <button
                              onClick={() => handleCancelSession(s.id)}
                              style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.4rem 0.8rem', border: '1px solid #e0e0e0', borderRadius: '2px', background: 'white', color: '#808282', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
