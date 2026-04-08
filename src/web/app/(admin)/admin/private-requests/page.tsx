'use client'

import { useEffect, useState, useCallback } from 'react'
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
  assigned_instructor_id: string | null
  created_at: string
  client_id: string
  profiles: { first_name: string; last_name: string; email: string } | null
}

type Instructor = {
  id: string
  first_name: string
  last_name: string
}

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

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: '#fff8e6', color: '#c8860a' },
  proposed:  { bg: '#e8f0fe', color: '#3b5bdb' },
  confirmed: { bg: '#e8f7f4', color: '#87CEBF' },
  declined:  { bg: '#fef0f0', color: '#e05555' },
  cancelled: { bg: '#f0f0f0', color: '#808282' },
}

const STATUS_FILTERS = ['all', 'pending', 'proposed', 'confirmed', 'declined', 'cancelled']

const labelStyle = {
  fontFamily: "'Raleway', sans-serif",
  fontWeight: 700 as const,
  fontSize: '0.6rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: '#808282',
  display: 'block',
  marginBottom: '0.4rem',
}

export default function PrivateRequestsPage() {
  const [requests, setRequests] = useState<PrivateRequest[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [proposedTime, setProposedTime] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [assignedInstructor, setAssignedInstructor] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadRequests = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('private_session_requests')
      .select('id, session_type, location, preferred_dates, focus_area, notes, status, proposed_time, admin_notes, created_at, client_id, profiles(first_name, last_name, email)')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    setRequests((data ?? []) as unknown as PrivateRequest[])
    setLoading(false)
  }, [statusFilter])

  const loadInstructors = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'instructor')
      .order('first_name')
    setInstructors((data ?? []) as Instructor[])
  }, [])

  useEffect(() => { loadRequests() }, [loadRequests])
  useEffect(() => { loadInstructors() }, [loadInstructors])

  const openPanel = (req: PrivateRequest) => {
    setActiveId(req.id)
    setProposedTime(req.proposed_time ? new Date(req.proposed_time).toISOString().slice(0, 16) : '')
    setAdminNotes(req.admin_notes ?? '')
    setAssignedInstructor(req.assigned_instructor_id ?? '')
  }

  const handlePropose = async () => {
    if (!activeId || !proposedTime) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('private_session_requests')
      .update({
        status: 'proposed',
        proposed_time: new Date(proposedTime).toISOString(),
        admin_notes: adminNotes.trim() || null,
        assigned_instructor_id: assignedInstructor || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeId)

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Time proposed — client will be notified')
      setActiveId(null)
      loadRequests()
    }
    setSaving(false)
  }

  const handleDecline = async (id: string) => {
    const supabase = createClient()
    await supabase.from('private_session_requests').update({ status: 'declined', updated_at: new Date().toISOString() }).eq('id', id)
    showToast('Request declined')
    loadRequests()
  }

  const handleConfirm = async (id: string) => {
    const supabase = createClient()
    await supabase.from('private_session_requests').update({ status: 'confirmed', updated_at: new Date().toISOString() }).eq('id', id)
    showToast('Session confirmed')
    loadRequests()
  }

  const pillStyle = (active: boolean) => ({
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700 as const,
    fontSize: '0.62rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    padding: '0.35rem 0.9rem',
    borderRadius: '2px',
    border: active ? 'none' : '1px solid #333',
    background: active ? '#87CEBF' : 'transparent',
    color: active ? 'white' : '#888',
    cursor: 'pointer',
  })

  const activeReq = requests.find(r => r.id === activeId)

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '1000px' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: toast.type === 'success' ? '#1a1a1a' : '#e05555', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '0.4rem' }}>
          Private Requests
        </h1>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#808282' }}>
          Review incoming requests, assign an instructor, and propose a time.
        </p>
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={pillStyle(statusFilter === s)}>
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : requests.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>
            No {statusFilter === 'all' ? '' : statusFilter} requests
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {requests.map(req => {
            const statusStyle = STATUS_COLORS[req.status] ?? { bg: '#f0f0f0', color: '#808282' }
            const client = req.profiles
            return (
              <div key={req.id} style={{ background: 'white', border: activeId === req.id ? '1px solid #87CEBF' : '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    {/* Client + type + status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.9rem', color: '#1a1a1a' }}>
                        {client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'}
                      </p>
                      <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '2px', background: '#f0f0f0', color: '#808282' }}>
                        {SESSION_TYPE_LABELS[req.session_type] ?? req.session_type}
                      </span>
                      <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '2px', background: statusStyle.bg, color: statusStyle.color }}>
                        {req.status}
                      </span>
                    </div>

                    {client?.email && (
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa', marginBottom: '0.3rem' }}>
                        {client.email}
                      </p>
                    )}

                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#808282' }}>
                      {LOCATION_LABELS[req.location]}{req.focus_area ? ` · ${req.focus_area}` : ''}
                    </p>

                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa', marginTop: '0.2rem' }}>
                      {req.preferred_dates?.join(', ')}
                    </p>

                    {req.notes && (
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontStyle: 'italic', fontSize: '0.78rem', color: '#555', marginTop: '0.4rem', borderLeft: '2px solid #e0e0e0', paddingLeft: '0.75rem' }}>
                        {req.notes}
                      </p>
                    )}

                    {req.status === 'proposed' && req.proposed_time && (
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.78rem', color: '#3b5bdb', marginTop: '0.4rem' }}>
                        Proposed: {new Date(req.proposed_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(req.proposed_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    )}

                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.68rem', color: '#ccc', marginTop: '0.4rem' }}>
                      Submitted {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Action buttons */}
                  {(req.status === 'pending' || req.status === 'proposed') && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button
                        onClick={() => activeId === req.id ? setActiveId(null) : openPanel(req)}
                        style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 1rem', border: 'none', borderRadius: '2px', background: '#87CEBF', color: 'white', cursor: 'pointer' }}
                      >
                        {activeId === req.id ? 'Close' : req.status === 'proposed' ? 'Edit Proposal' : 'Propose Time'}
                      </button>
                      {req.status === 'proposed' && (
                        <button
                          onClick={() => handleConfirm(req.id)}
                          style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 1rem', border: 'none', borderRadius: '2px', background: '#1a1a1a', color: 'white', cursor: 'pointer' }}
                        >
                          Confirm
                        </button>
                      )}
                      <button
                        onClick={() => handleDecline(req.id)}
                        style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 1rem', border: '1px solid #e0e0e0', borderRadius: '2px', background: 'white', color: '#808282', cursor: 'pointer' }}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline propose panel */}
                {activeId === req.id && activeReq && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <span style={labelStyle}>Proposed Date & Time</span>
                        <input
                          type="datetime-local"
                          value={proposedTime}
                          onChange={e => setProposedTime(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box', fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.6rem 0.75rem', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <span style={labelStyle}>Assign Instructor</span>
                        <select
                          value={assignedInstructor}
                          onChange={e => setAssignedInstructor(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box', fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.6rem 0.75rem', outline: 'none', background: 'white' }}
                        >
                          <option value="">— Unassigned —</option>
                          {instructors.map(i => (
                            <option key={i.id} value={i.id}>{i.first_name} {i.last_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={labelStyle}>Note to Client — optional</span>
                      <textarea
                        value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                        placeholder="e.g. We've got you with Sarah at Green Hills — let us know if you need anything!"
                        rows={2}
                        style={{ width: '100%', boxSizing: 'border-box', fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.6rem 0.75rem', outline: 'none', resize: 'vertical' }}
                      />
                    </div>
                    <button
                      onClick={handlePropose}
                      disabled={saving || !proposedTime}
                      style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.65rem 1.5rem', border: 'none', borderRadius: '2px', background: saving || !proposedTime ? '#b0ddd6' : '#87CEBF', color: 'white', cursor: saving || !proposedTime ? 'not-allowed' : 'pointer' }}
                    >
                      {saving ? 'Saving...' : 'Send Proposal'}
                    </button>
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
