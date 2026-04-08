'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

type ContentEntry = {
  id: string
  instructor_id: string
  date: string
  hours: number
  description: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  profiles: { first_name: string; last_name: string } | null
}

const RATE = 25 // $25/hr

export default function SocialContentPage() {
  const [entries, setEntries] = useState<ContentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [saving, setSaving] = useState(false)

  // Form
  const [formDate, setFormDate] = useState('')
  const [formHours, setFormHours] = useState('')
  const [formDesc, setFormDesc] = useState('')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const userRole = prof?.role ?? 'instructor'
    setRole(userRole)
    setUserId(user.id)

    const isAdmin = userRole === 'admin' || userRole === 'manager'

    let query = supabase
      .from('content_sessions')
      .select('*, profiles(first_name, last_name)')
      .order('date', { ascending: false })

    if (!isAdmin) {
      query = query.eq('instructor_id', user.id)
    }

    const { data } = await query
    setEntries((data ?? []) as unknown as ContentEntry[])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const submitEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    const hrs = parseFloat(formHours)
    if (!formDate || isNaN(hrs) || hrs <= 0 || !formDesc.trim()) {
      showToast('Fill in all fields', 'error'); return
    }
    // Round to nearest 0.25
    const rounded = Math.round(hrs * 4) / 4
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('content_sessions').insert({
      instructor_id: userId,
      date: formDate,
      hours: rounded,
      description: formDesc.trim(),
      status: 'pending',
    })
    if (error) { showToast(error.message, 'error') }
    else {
      showToast('Submitted for approval')
      setShowForm(false)
      setFormDate(''); setFormHours(''); setFormDesc('')
      loadData()
    }
    setSaving(false)
  }

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const supabase = createClient()
    await supabase.from('content_sessions').update({ status }).eq('id', id)
    showToast(status === 'approved' ? 'Approved' : 'Rejected')
    loadData()
  }

  const isAdmin = role === 'admin' || role === 'manager'

  const pendingEntries = entries.filter(e => e.status === 'pending')
  const otherEntries = entries.filter(e => e.status !== 'pending')

  const totalApprovedHours = entries.filter(e => e.status === 'approved').reduce((a, e) => a + e.hours, 0)
  const totalApprovedPay = totalApprovedHours * RATE

  const inputStyle = { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '2px', fontSize: '0.85rem', outline: 'none', background: 'white', fontFamily: "'Poppins', sans-serif" }
  const labelStyle = { fontFamily: "'Raleway', sans-serif", fontWeight: 600 as const, fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#808282', display: 'block' as const, marginBottom: '0.35rem' }

  const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    pending:  { bg: '#fff8e6', color: '#c8860a' },
    approved: { bg: '#e8f7f4', color: '#87CEBF' },
    rejected: { bg: '#fef0f0', color: '#e05555' },
  }

  const renderEntry = (entry: ContentEntry) => {
    const ss = STATUS_STYLES[entry.status] ?? STATUS_STYLES.pending
    const pay = entry.hours * RATE
    return (
      <div key={entry.id} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          {isAdmin && entry.profiles && (
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#87CEBF', marginBottom: '0.2rem' }}>
              {entry.profiles.first_name} {entry.profiles.last_name}
            </p>
          )}
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.85rem', color: '#1a1a1a', marginBottom: '0.2rem' }}>{entry.description}</p>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#808282' }}>
            {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            {' · '}{entry.hours} hr{entry.hours !== 1 ? 's' : ''} · ${pay.toFixed(2)}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: '2px', background: ss.bg, color: ss.color }}>
            {entry.status}
          </span>
          {isAdmin && entry.status === 'pending' && (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button onClick={() => updateStatus(entry.id, 'approved')} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.3rem 0.7rem', background: '#e8f7f4', color: '#87CEBF', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>
                Approve
              </button>
              <button onClick={() => updateStatus(entry.id, 'rejected')} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.3rem 0.7rem', background: '#fef0f0', color: '#e05555', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '800px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: toast.type === 'success' ? '#1a1a1a' : '#e05555', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a' }}>Social Content</h1>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#808282', marginTop: '0.25rem' }}>$25/hr · Rounds to nearest 15 min · Admin approval required</p>
        </div>
        {!isAdmin && (
          <button onClick={() => setShowForm(!showForm)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.7rem 1.5rem', background: showForm ? '#1a1a1a' : '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>
            {showForm ? '✕ Close' : '+ Log Hours'}
          </button>
        )}
      </div>

      {/* Stats strip (admin) */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Pending Review', value: pendingEntries.length },
            { label: 'Approved Hours', value: `${totalApprovedHours}h` },
            { label: 'Approved Pay', value: `$${totalApprovedPay.toFixed(2)}` },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.1rem 1.4rem' }}>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.8rem', color: '#1a1a1a', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#808282', marginTop: '0.3rem' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Submit form (instructor) */}
      {showForm && !isAdmin && (
        <form onSubmit={submitEntry} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '2rem', marginBottom: '2rem' }}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '1.25rem' }}>Log Content Hours</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} style={inputStyle} required
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
            </div>
            <div>
              <label style={labelStyle}>Hours · $25/hr</label>
              <input type="number" step="0.25" min="0.25" max="8" placeholder="e.g. 1.5" value={formHours} onChange={e => setFormHours(e.target.value)} style={inputStyle} required
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
              {formHours && !isNaN(parseFloat(formHours)) && (
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#87CEBF', marginTop: '0.3rem' }}>
                  = ${(Math.round(parseFloat(formHours) * 4) / 4 * RATE).toFixed(2)}
                </p>
              )}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Description</label>
              <input type="text" placeholder="e.g. Filmed 3 reformer reels for Instagram" value={formDesc} onChange={e => setFormDesc(e.target.value)} style={inputStyle} required
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
            </div>
          </div>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', marginBottom: '1rem' }}>Hours round to the nearest 15 minutes. Admin will review before it appears in payroll.</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" disabled={saving} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.7rem 1.5rem', background: saving ? '#b0ddd6' : '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Submitting...' : 'Submit'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.7rem 1.2rem', background: 'white', color: '#808282', border: '1px solid #e0e0e0', borderRadius: '2px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ccc' }}>No entries yet</p>
          {!isAdmin && <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#aaa', marginTop: '0.75rem' }}>Log hours for photos, videos, or reels you create for Marathon.</p>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Pending (admin) */}
          {isAdmin && pendingEntries.length > 0 && (
            <div>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c8860a', marginBottom: '0.75rem' }}>
                Pending Review — {pendingEntries.length}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pendingEntries.map(renderEntry)}
              </div>
            </div>
          )}

          {/* All other entries */}
          {otherEntries.length > 0 && (
            <div>
              {isAdmin && <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>History</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {otherEntries.map(renderEntry)}
              </div>
            </div>
          )}

          {/* Instructor pending */}
          {!isAdmin && pendingEntries.length > 0 && (
            <div>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c8860a', marginBottom: '0.75rem' }}>
                Awaiting Approval
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pendingEntries.map(renderEntry)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
