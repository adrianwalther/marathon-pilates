'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

type TimeEntry = {
  id: string
  staff_id: string
  clock_in: string
  clock_out: string | null
  hours: number | null
  notes: string | null
  created_at: string
  profiles: { first_name: string; last_name: string } | null
}

const HOURLY_RATE = 18
const OT_RATE = 27
const OT_THRESHOLD = 40

function computeHours(clockIn: string, clockOut: string): number {
  const diff = (new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 3600000
  return Math.round(diff * 4) / 4 // round to nearest 15 min
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function TimeClockPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [clockingIn, setClockingIn] = useState(false)
  const [clockingOut, setClockingOut] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [now, setNow] = useState(new Date())

  // Admin editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editClockOut, setEditClockOut] = useState('')

  // Week nav
  const [weekOffset, setWeekOffset] = useState(0)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Live clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(t)
  }, [])

  const getWeekRange = useCallback(() => {
    const start = new Date()
    start.setDate(start.getDate() - start.getDay() + weekOffset * 7)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start: start.toISOString(), end: end.toISOString(), startDate: new Date(start) }
  }, [weekOffset])

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const userRole = prof?.role ?? 'front_desk'
    setRole(userRole)
    setUserId(user.id)

    const isAdmin = userRole === 'admin' || userRole === 'manager'
    const { start, end } = getWeekRange()

    let query = supabase
      .from('time_entries')
      .select('*, profiles(first_name, last_name)')
      .gte('clock_in', start)
      .lte('clock_in', end)
      .order('clock_in', { ascending: false })

    if (!isAdmin) {
      query = query.eq('staff_id', user.id)
    }

    const { data } = await query
    const allEntries = (data ?? []) as unknown as TimeEntry[]
    setEntries(allEntries)

    // Check for open (clocked-in) entry for this user
    const { data: openEntry } = await supabase
      .from('time_entries')
      .select('*, profiles(first_name, last_name)')
      .eq('staff_id', user.id)
      .is('clock_out', null)
      .single()

    setActiveEntry(openEntry ? openEntry as unknown as TimeEntry : null)
    setLoading(false)
  }, [weekOffset, getWeekRange])

  useEffect(() => { loadData() }, [loadData])

  const clockIn = async () => {
    setClockingIn(true)
    const supabase = createClient()
    const { error } = await supabase.from('time_entries').insert({
      staff_id: userId,
      clock_in: new Date().toISOString(),
    })
    if (error) showToast(error.message, 'error')
    else showToast('Clocked in')
    loadData()
    setClockingIn(false)
  }

  const clockOut = async () => {
    if (!activeEntry) return
    setClockingOut(true)
    const supabase = createClient()
    const out = new Date().toISOString()
    const hrs = computeHours(activeEntry.clock_in, out)
    await supabase.from('time_entries').update({
      clock_out: out,
      hours: hrs,
    }).eq('id', activeEntry.id)
    showToast(`Clocked out · ${formatDuration(hrs)}`)
    loadData()
    setClockingOut(false)
  }

  const saveEdit = async (id: string) => {
    const supabase = createClient()
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    const clockOut = editClockOut || entry.clock_out
    const hrs = clockOut ? computeHours(entry.clock_in, clockOut) : null
    await supabase.from('time_entries').update({
      clock_out: clockOut || null,
      hours: hrs,
      notes: editNotes || null,
    }).eq('id', id)
    showToast('Entry updated')
    setEditingId(null)
    loadData()
  }

  const isAdmin = role === 'admin' || role === 'manager'

  const { startDate } = getWeekRange()
  const weekEnd = new Date(startDate); weekEnd.setDate(startDate.getDate() + 6)

  // Weekly totals per person
  const totalsByPerson: Record<string, { name: string; hours: number; pay: number }> = {}
  entries.forEach(e => {
    if (!e.staff_id) return
    const hrs = e.hours ?? 0
    if (!totalsByPerson[e.staff_id]) {
      totalsByPerson[e.staff_id] = {
        name: `${e.profiles?.first_name ?? ''} ${e.profiles?.last_name ?? ''}`.trim(),
        hours: 0,
        pay: 0,
      }
    }
    totalsByPerson[e.staff_id].hours += hrs
    // Basic pay calc (no split-week OT for now — flagged if over threshold)
    totalsByPerson[e.staff_id].pay += hrs * HOURLY_RATE
  })

  const myTotal = totalsByPerson[userId]
  const isNearOT = myTotal && myTotal.hours >= 36
  const isOT = myTotal && myTotal.hours > OT_THRESHOLD

  const activeElapsed = activeEntry
    ? computeHours(activeEntry.clock_in, now.toISOString())
    : 0

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const inputStyle = { padding: '0.65rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '2px', fontSize: '0.82rem', outline: 'none', background: 'white', fontFamily: "'Poppins', sans-serif", width: '100%' }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '900px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: toast.type === 'success' ? '#1a1a1a' : '#e05555', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a' }}>Time Clock</h1>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#808282', marginTop: '0.25rem' }}>
          $18/hr · OT ${OT_RATE}/hr after {OT_THRESHOLD}h/week · Rounds to nearest 15 min
        </p>
      </div>

      {/* Clock in/out panel — front desk + any staff */}
      {!isAdmin && (
        <div style={{ background: 'white', border: `2px solid ${activeEntry ? '#87CEBF' : '#eee'}`, borderRadius: '2px', padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
          {activeEntry ? (
            <>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#87CEBF', marginBottom: '0.5rem' }}>Currently Clocked In</p>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2.8rem', color: '#1a1a1a', lineHeight: 1, marginBottom: '0.25rem' }}>
                {formatDuration(activeElapsed)}
              </p>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#aaa', marginBottom: '1.5rem' }}>
                Since {formatTime(activeEntry.clock_in)} · {formatDate(activeEntry.clock_in)}
              </p>
              <button
                onClick={clockOut}
                disabled={clockingOut}
                style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.9rem 2.5rem', background: clockingOut ? '#b0ddd6' : '#1a1a1a', color: 'white', border: 'none', borderRadius: '2px', cursor: clockingOut ? 'not-allowed' : 'pointer' }}
              >
                {clockingOut ? 'Clocking Out...' : 'Clock Out'}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ccc', marginBottom: '0.5rem' }}>
                {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#aaa', marginBottom: '1.5rem' }}>
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              {(isNearOT || isOT) && (
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: isOT ? '#e05555' : '#c8860a', marginBottom: '1rem' }}>
                  {isOT ? `⚠ Over ${OT_THRESHOLD}h this week — OT rate applies` : `⚠ Approaching ${OT_THRESHOLD}h this week (${myTotal?.hours.toFixed(1)}h logged)`}
                </p>
              )}
              <button
                onClick={clockIn}
                disabled={clockingIn}
                style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.9rem 2.5rem', background: clockingIn ? '#b0ddd6' : '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: clockingIn ? 'not-allowed' : 'pointer' }}
              >
                {clockingIn ? 'Clocking In...' : 'Clock In'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Admin: weekly summary */}
      {isAdmin && Object.keys(totalsByPerson).length > 0 && (
        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.5rem', marginBottom: '2rem' }}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#808282', marginBottom: '1rem' }}>Weekly Totals</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.values(totalsByPerson).map(p => (
              <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f8f8f8' }}>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.85rem', color: '#1a1a1a' }}>{p.name}</p>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: p.hours > OT_THRESHOLD ? '#e05555' : '#808282' }}>
                    {formatDuration(p.hours)}
                    {p.hours > OT_THRESHOLD && ' ⚠ OT'}
                  </p>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.85rem', color: '#1a1a1a' }}>${p.pay.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', background: 'white', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.4rem 0.8rem', cursor: 'pointer', color: '#808282' }}>←</button>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#1a1a1a' }}>
          {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <button onClick={() => setWeekOffset(w => w + 1)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', background: 'white', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.4rem 0.8rem', cursor: 'pointer', color: '#808282' }}>→</button>
        {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', color: '#87CEBF' }}>This week</button>}
      </div>

      {/* Entries list */}
      {loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ccc' }}>No entries this week</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.5rem' }}>Shifts This Week</p>
          {entries.map(e => {
            const isEditing = editingId === e.id
            const hrs = e.hours ?? (e.clock_out ? computeHours(e.clock_in, e.clock_out) : null)
            const pay = hrs != null ? hrs * HOURLY_RATE : null
            const isOpen = !e.clock_out

            return (
              <div key={e.id} style={{ background: 'white', border: `1px solid ${isOpen ? '#87CEBF' : '#eee'}`, borderRadius: '2px', padding: '1rem 1.5rem' }}>
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#808282', display: 'block', marginBottom: '0.3rem' }}>Clock Out</label>
                        <input type="datetime-local" defaultValue={e.clock_out ? new Date(e.clock_out).toISOString().slice(0,16) : ''} onChange={ev => setEditClockOut(ev.target.value ? new Date(ev.target.value).toISOString() : '')} style={inputStyle} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#808282', display: 'block', marginBottom: '0.3rem' }}>Notes</label>
                        <input type="text" defaultValue={e.notes ?? ''} onChange={ev => setEditNotes(ev.target.value)} placeholder="Optional" style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => saveEdit(e.id)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.4rem 1rem', background: '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.4rem 0.8rem', background: 'none', border: '1px solid #ddd', color: '#808282', borderRadius: '2px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      {isAdmin && e.profiles && (
                        <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#87CEBF', marginBottom: '0.15rem' }}>
                          {e.profiles.first_name} {e.profiles.last_name}
                        </p>
                      )}
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.85rem', color: '#1a1a1a' }}>
                        {formatDate(e.clock_in)} · {formatTime(e.clock_in)} – {e.clock_out ? formatTime(e.clock_out) : <span style={{ color: '#87CEBF' }}>Active</span>}
                      </p>
                      {e.notes && <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', marginTop: '0.15rem' }}>{e.notes}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                      {hrs != null && (
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.88rem', color: '#1a1a1a' }}>{formatDuration(hrs)}</p>
                          {pay != null && <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa' }}>${pay.toFixed(2)}</p>}
                        </div>
                      )}
                      {isOpen && !isAdmin && (
                        <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: '2px', background: '#e8f7f4', color: '#87CEBF' }}>Active</span>
                      )}
                      {isAdmin && (
                        <button onClick={() => { setEditingId(e.id); setEditNotes(e.notes ?? ''); setEditClockOut(e.clock_out ?? '') }} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.3rem 0.7rem', border: '1px solid #e0e0e0', background: 'white', color: '#808282', borderRadius: '2px', cursor: 'pointer' }}>
                          Edit
                        </button>
                      )}
                    </div>
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
