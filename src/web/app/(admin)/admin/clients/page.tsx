'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

type Client = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  total_classes_completed: number
  first_class_at: string | null
  polestar_traffic_light: string
  health_conditions: string[] | null
  preferred_location: string | null
  intake_completed_at: string | null
  created_at: string
  memberships: { membership_type: string; status: string; created_at: string }[]
}

type Booking = {
  id: string
  status: string
  attended: boolean | null
  late_cancel: boolean
  created_at: string
  scheduled_sessions: { name: string; starts_at: string; session_type: string } | null
}

type Credit = {
  id: string
  credit_type: string
  total_credits: number
  used_credits: number
  expires_at: string | null
}

const TRAFFIC_COLORS = {
  green:  { bg: '#e8f7f4', color: '#87CEBF', label: 'No restrictions' },
  yellow: { bg: '#fff8e6', color: '#c8860a', label: 'Modifications needed' },
  red:    { bg: '#fef0f0', color: '#e05555', label: 'Review required' },
}

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'member', label: 'Active Members' },
  { value: 'red', label: 'Red Flag' },
  { value: 'yellow', label: 'Yellow Flag' },
  { value: 'new', label: 'New (< 3 classes)' },
]

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<Client | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [credits, setCredits] = useState<Credit[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [editingTrafficLight, setEditingTrafficLight] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    const supabase = createClient()
    supabase.from('profiles')
      .select('id, first_name, last_name, email, phone, date_of_birth, emergency_contact_name, emergency_contact_phone, total_classes_completed, first_class_at, polestar_traffic_light, health_conditions, preferred_location, intake_completed_at, created_at, memberships(membership_type, status, created_at)')
      .eq('role', 'client')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setClients((data ?? []) as unknown as Client[])
        setLoading(false)
      })
  }, [])

  const loadDetail = useCallback(async (client: Client) => {
    setDetailLoading(true)
    const supabase = createClient()
    const [{ data: bData }, { data: cData }] = await Promise.all([
      supabase.from('bookings')
        .select('id, status, attended, late_cancel, created_at, scheduled_sessions(name, starts_at, session_type)')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('credits')
        .select('id, credit_type, total_credits, used_credits, expires_at')
        .eq('client_id', client.id)
        .gt('total_credits', 0),
    ])
    setBookings((bData ?? []) as unknown as Booking[])
    setCredits((cData ?? []) as unknown as Credit[])
    setDetailLoading(false)
  }, [])

  const selectClient = (c: Client) => {
    if (selected?.id === c.id) { setSelected(null); return }
    setSelected(c)
    loadDetail(c)
    setEditingTrafficLight(false)
  }

  const updateTrafficLight = async (clientId: string, value: string) => {
    const supabase = createClient()
    await supabase.from('profiles').update({ polestar_traffic_light: value }).eq('id', clientId)
    setClients(cs => cs.map(c => c.id === clientId ? { ...c, polestar_traffic_light: value } : c))
    setSelected(s => s ? { ...s, polestar_traffic_light: value } : s)
    setEditingTrafficLight(false)
    showToast('Health status updated')
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const activeMembership = (c: Client) => c.memberships?.find(m => m.status === 'active')

  const filtered = clients.filter(c => {
    const matchSearch = `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (filter === 'member') return !!activeMembership(c)
    if (filter === 'red') return c.polestar_traffic_light === 'red'
    if (filter === 'yellow') return c.polestar_traffic_light === 'yellow'
    if (filter === 'new') return c.total_classes_completed < 3
    return true
  })

  const totalCreditsRemaining = credits.reduce((a, c) => a + (c.total_credits - c.used_credits), 0)

  const pillStyle = (active: boolean) => ({
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700 as const,
    fontSize: '0.6rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    padding: '0.3rem 0.8rem',
    borderRadius: '2px',
    border: active ? 'none' : '1px solid #e0e0e0',
    background: active ? '#1a1a1a' : 'white',
    color: active ? 'white' : '#808282',
    cursor: 'pointer',
  })

  const BOOKING_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    confirmed:  { bg: '#e8f7f4', color: '#87CEBF' },
    completed:  { bg: '#f0f0f0', color: '#808282' },
    cancelled:  { bg: '#fef0f0', color: '#e05555' },
    no_show:    { bg: '#fef0f0', color: '#e05555' },
    waitlisted: { bg: '#fff8e6', color: '#c8860a' },
  }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '1100px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: '#1a1a1a', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a' }}>Clients</h1>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.8rem', color: '#aaa', marginTop: '0.6rem' }}>
          {loading ? '—' : clients.length} total
        </p>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or email..."
          style={{ flex: 1, minWidth: '200px', maxWidth: '320px', padding: '0.65rem 1rem', border: '1px solid #e0e0e0', borderRadius: '2px', fontSize: '0.85rem', outline: 'none', fontFamily: "'Poppins', sans-serif" }}
          onFocus={e => (e.target.style.borderColor = '#87CEBF')}
          onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
        />
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} style={pillStyle(filter === f.value)}>{f.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

          {/* Client list */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.25rem' }}>
              {filtered.length} client{filtered.length !== 1 ? 's' : ''}
            </p>

            {filtered.length === 0 ? (
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa', padding: '2rem 0', textAlign: 'center' }}>No clients match</p>
            ) : filtered.map(c => {
              const tl = TRAFFIC_COLORS[c.polestar_traffic_light as keyof typeof TRAFFIC_COLORS] ?? TRAFFIC_COLORS.green
              const mem = activeMembership(c)
              const isSelected = selected?.id === c.id
              const isNew = c.total_classes_completed < 3
              return (
                <div
                  key={c.id}
                  onClick={() => selectClient(c)}
                  style={{ background: isSelected ? '#f0faf8' : 'white', border: `1px solid ${isSelected ? '#87CEBF' : '#eee'}`, borderRadius: '2px', padding: '0.85rem 1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.1rem' }}>
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.87rem', color: '#1a1a1a' }}>
                        {c.first_name} {c.last_name}
                      </p>
                      {isNew && <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.12rem 0.4rem', borderRadius: '2px', background: '#e8f7f4', color: '#87CEBF' }}>New</span>}
                    </div>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa' }}>{c.email}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                    {mem && (
                      <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.52rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.18rem 0.45rem', borderRadius: '2px', background: '#e8f7f4', color: '#87CEBF' }}>
                        {mem.membership_type.replace(/_/g, ' ')}
                      </span>
                    )}
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: tl.color, display: 'block', flexShrink: 0 }} title={tl.label} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ width: '320px', flexShrink: 0, position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* Identity */}
              <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.5rem' }}>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '1rem', color: '#1a1a1a', marginBottom: '0.1rem' }}>
                  {selected.first_name} {selected.last_name}
                </p>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#aaa', marginBottom: '0.1rem' }}>{selected.email}</p>
                {selected.phone && <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#aaa', marginBottom: '1rem' }}>{selected.phone}</p>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem', marginTop: '1rem' }}>
                  <InfoItem label="Member since" value={formatDate(selected.created_at)} />
                  <InfoItem label="Classes done" value={String(selected.total_classes_completed)} />
                  <InfoItem label="First class" value={selected.first_class_at ? formatDate(selected.first_class_at) : '—'} />
                  <InfoItem label="Preferred studio" value={selected.preferred_location?.replace(/_/g, ' ') ?? '—'} />
                  {selected.date_of_birth && <InfoItem label="Date of birth" value={formatDate(selected.date_of_birth)} />}
                  <InfoItem label="Intake done" value={selected.intake_completed_at ? '✓ Yes' : 'No'} />
                </div>
              </div>

              {/* Membership + credits */}
              <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>Membership & Credits</p>
                {activeMembership(selected) ? (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.22rem 0.55rem', borderRadius: '2px', background: '#e8f7f4', color: '#87CEBF' }}>
                      {activeMembership(selected)!.membership_type.replace(/_/g, ' ')} — Active
                    </span>
                  </div>
                ) : (
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#aaa', marginBottom: '0.75rem' }}>No active membership</p>
                )}
                {detailLoading ? (
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa' }}>Loading credits...</p>
                ) : credits.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {credits.map(cr => (
                      <div key={cr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#555', textTransform: 'capitalize' }}>
                          {cr.credit_type.replace(/_/g, ' ')}
                        </p>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.78rem', color: '#1a1a1a' }}>
                          {cr.total_credits - cr.used_credits} / {cr.total_credits}
                          {cr.expires_at && <span style={{ fontSize: '0.65rem', color: '#aaa', marginLeft: '0.4rem' }}>exp {formatDate(cr.expires_at)}</span>}
                        </p>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '0.4rem', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#808282' }}>Total remaining</p>
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.82rem', color: '#87CEBF' }}>{totalCreditsRemaining}</p>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa' }}>No credits on file</p>
                )}
              </div>

              {/* Health status */}
              <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#808282' }}>Health Status</p>
                  <button onClick={() => setEditingTrafficLight(!editingTrafficLight)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', color: '#87CEBF' }}>
                    {editingTrafficLight ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                {editingTrafficLight ? (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {(['green', 'yellow', 'red'] as const).map(tl => (
                      <button key={tl} onClick={() => updateTrafficLight(selected.id, tl)}
                        style={{ flex: 1, fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.4rem 0', borderRadius: '2px', border: 'none', cursor: 'pointer', background: TRAFFIC_COLORS[tl].bg, color: TRAFFIC_COLORS[tl].color }}>
                        {tl}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    {(() => {
                      const tl = TRAFFIC_COLORS[selected.polestar_traffic_light as keyof typeof TRAFFIC_COLORS] ?? TRAFFIC_COLORS.green
                      return (
                        <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.25rem 0.6rem', borderRadius: '2px', background: tl.bg, color: tl.color }}>
                          {selected.polestar_traffic_light} — {tl.label}
                        </span>
                      )
                    })()}
                    {selected.health_conditions && selected.health_conditions.length > 0 && (
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#555', marginTop: '0.6rem' }}>
                        {selected.health_conditions.join(', ')}
                      </p>
                    )}
                  </>
                )}

                {(selected.emergency_contact_name || selected.emergency_contact_phone) && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #f0f0f0' }}>
                    <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.25rem' }}>Emergency Contact</p>
                    {selected.emergency_contact_name && <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#555' }}>{selected.emergency_contact_name}</p>}
                    {selected.emergency_contact_phone && <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#555' }}>{selected.emergency_contact_phone}</p>}
                  </div>
                )}
              </div>

              {/* Recent bookings */}
              <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>Recent Bookings</p>
                {detailLoading ? (
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa' }}>Loading...</p>
                ) : bookings.length === 0 ? (
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa' }}>No bookings on record</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {bookings.map(b => {
                      const sc = BOOKING_STATUS_COLORS[b.status] ?? BOOKING_STATUS_COLORS.completed
                      return (
                        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '0.5rem', borderBottom: '1px solid #f8f8f8', gap: '0.5rem' }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.78rem', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {b.scheduled_sessions?.name ?? 'Session'}
                            </p>
                            {b.scheduled_sessions?.starts_at && (
                              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.68rem', color: '#aaa' }}>
                                {formatDate(b.scheduled_sessions.starts_at)} · {formatTime(b.scheduled_sessions.starts_at)}
                              </p>
                            )}
                          </div>
                          <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.15rem 0.4rem', borderRadius: '2px', background: sc.bg, color: sc.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {b.late_cancel ? 'Late cancel' : b.status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.1rem' }}>{label}</p>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.78rem', color: '#1a1a1a', textTransform: 'capitalize' }}>{value}</p>
    </div>
  )
}
