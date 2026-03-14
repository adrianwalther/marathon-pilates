'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

type Session = {
  id: string
  name: string
  session_type: string
  starts_at: string
  ends_at: string
  max_capacity: number
  is_cancelled: boolean
  booking_count: number
  locations: { name: string; slug: string }
  profiles: { first_name: string; last_name: string } | null
}

type Instructor = { id: string; first_name: string; last_name: string }
type Location = { id: string; slug: string; name: string }

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

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const getWeekRange = () => {
    const start = new Date()
    start.setDate(start.getDate() + weekOffset * 7)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start: start.toISOString(), end: end.toISOString(), startDate: start }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { start, end } = getWeekRange()

    const [{ data: sessions }, { data: instructorProfiles }, { data: locs }] = await Promise.all([
      supabase.from('scheduled_sessions')
        .select('id, name, session_type, starts_at, ends_at, max_capacity, is_cancelled, locations(name, slug), profiles(first_name, last_name)')
        .gte('starts_at', start).lte('starts_at', end)
        .order('starts_at', { ascending: true }),
      supabase.from('profiles').select('id, first_name, last_name').in('role', ['instructor', 'admin']),
      supabase.from('locations').select('id, slug, name'),
    ])

    if (sessions && sessions.length > 0) {
      const ids = sessions.map(s => s.id)
      const { data: bookings } = await supabase.from('bookings').select('session_id').in('session_id', ids).in('status', ['confirmed', 'waitlisted'])
      const countMap: Record<string, number> = {}
      bookings?.forEach(b => { countMap[b.session_id] = (countMap[b.session_id] ?? 0) + 1 })
      setSessions(sessions.map(s => ({ ...s, booking_count: countMap[s.id] ?? 0 })) as Session[])
    } else {
      setSessions([])
    }

    setInstructors((instructorProfiles ?? []) as Instructor[])
    setLocations((locs ?? []) as Location[])
    if (locs && locs.length > 0) setForm(f => ({ ...f, location_id: locs[0].id }))
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset])

  useEffect(() => { loadData() }, [loadData])

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
      showToast('Class added to schedule')
      setShowForm(false)
      setForm(emptyForm)
      loadData()
    }
    setSaving(false)
  }

  const handleCancel = async (id: string) => {
    const supabase = createClient()
    await supabase.from('scheduled_sessions').update({ is_cancelled: true, cancel_reason: 'Cancelled by admin' }).eq('id', id)
    showToast('Class cancelled')
    loadData()
  }

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const formatDay = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const { startDate } = getWeekRange()
  const weekEnd = new Date(startDate); weekEnd.setDate(startDate.getDate() + 6)

  const inputStyle = { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '2px', fontSize: '0.85rem', outline: 'none', background: 'white', fontFamily: "'Poppins', sans-serif" }
  const labelStyle = { fontFamily: "'Raleway', sans-serif", fontWeight: 600 as const, fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#808282', display: 'block', marginBottom: '0.35rem' }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '1000px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: toast.type === 'success' ? '#1a1a1a' : '#e05555', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          {toast.msg}
        </div>
      )}

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', background: 'white', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.4rem 0.8rem', cursor: 'pointer', color: '#808282' }}>←</button>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#1a1a1a' }}>
          {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <button onClick={() => setWeekOffset(w => w + 1)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', background: 'white', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.4rem 0.8rem', cursor: 'pointer', color: '#808282' }}>→</button>
        {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', color: '#87CEBF' }}>Today</button>}
      </div>

      {/* Sessions */}
      {loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ccc' }}>No classes this week</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {sessions.map(s => {
            const isFull = s.booking_count >= s.max_capacity
            const fillPct = (s.booking_count / s.max_capacity) * 100
            return (
              <div key={s.id} style={{ background: s.is_cancelled ? '#fef0f0' : 'white', border: `1px solid ${s.is_cancelled ? '#fdd' : '#eee'}`, borderRadius: '2px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', opacity: s.is_cancelled ? 0.6 : 1 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.88rem', color: '#1a1a1a' }}>{s.name}</p>
                    {s.is_cancelled && <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.15rem 0.4rem', borderRadius: '2px', background: '#fdd', color: '#e05555' }}>Cancelled</span>}
                  </div>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#808282' }}>
                    {formatDay(s.starts_at)} · {formatTime(s.starts_at)} – {formatTime(s.ends_at)} · {s.locations?.name}
                  </p>
                  {s.profiles && <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', marginTop: '0.1rem' }}>{s.profiles.first_name} {s.profiles.last_name}</p>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.88rem', color: isFull ? '#c8860a' : '#1a1a1a' }}>{s.booking_count}/{s.max_capacity}</p>
                    <div style={{ height: '3px', background: '#f0f0f0', borderRadius: '2px', marginTop: '0.3rem', width: '60px' }}>
                      <div style={{ height: '100%', width: `${fillPct}%`, background: isFull ? '#c8860a' : '#87CEBF', borderRadius: '2px' }} />
                    </div>
                  </div>
                  {!s.is_cancelled && (
                    <button onClick={() => handleCancel(s.id)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.4rem 0.8rem', border: '1px solid #e0e0e0', borderRadius: '2px', background: 'white', color: '#808282', cursor: 'pointer' }}>
                      Cancel
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
