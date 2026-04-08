'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

type Instructor = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  created_at: string
  instructor_profiles: InstructorProfile | null
}

type InstructorProfile = {
  id: string
  bio: string | null
  certifications: string[] | null
  experience_level: string | null
  locations: string[] | null
  can_teach_private: boolean
  can_teach_group: boolean
  private_hourly_rate: number | null
}

type TeachingStats = {
  total_sessions: number
  this_month: number
  group_count: number
  private_count: number
}

const EXPERIENCE_LEVELS = [
  { value: 'standard', label: 'Standard (< 1 yr)' },
  { value: 'senior', label: 'Senior (1+ yr)' },
  { value: 'master_trainer', label: 'Master Trainer' },
]

const EXPERIENCE_COLORS: Record<string, { bg: string; color: string }> = {
  standard:       { bg: '#f5f5f5', color: '#808282' },
  senior:         { bg: '#fff8e6', color: '#c8860a' },
  master_trainer: { bg: '#e8f7f4', color: '#87CEBF' },
}

// Pay rate lookup matching payroll engine
function getPrivatePay(level: string | null, customRate: number | null): string {
  if (level === 'master_trainer' && customRate) return `$${customRate}/session (custom)`
  if (level === 'senior') return '$55/session'
  return '$45/session'
}

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Instructor | null>(null)
  const [stats, setStats] = useState<TeachingStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Edit form
  const [editBio, setEditBio] = useState('')
  const [editLevel, setEditLevel] = useState('')
  const [editRate, setEditRate] = useState('')
  const [editCanPrivate, setEditCanPrivate] = useState(false)
  const [editCanGroup, setEditCanGroup] = useState(false)
  const [editCerts, setEditCerts] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    const supabase = createClient()
    supabase.from('profiles')
      .select('id, first_name, last_name, email, phone, created_at, instructor_profiles(id, bio, certifications, experience_level, locations, can_teach_private, can_teach_group, private_hourly_rate)')
      .in('role', ['instructor', 'admin'])
      .order('first_name', { ascending: true })
      .then(({ data }) => {
        setInstructors((data ?? []) as unknown as Instructor[])
        setLoading(false)
      })
  }, [])

  const loadStats = useCallback(async (instructorId: string) => {
    setStatsLoading(true)
    const supabase = createClient()
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: allSessions } = await supabase
      .from('scheduled_sessions')
      .select('id, session_type, starts_at')
      .eq('instructor_id', instructorId)
      .eq('is_cancelled', false)

    const total = allSessions?.length ?? 0
    const thisMonth = allSessions?.filter(s => s.starts_at >= monthStart).length ?? 0
    const groupCount = allSessions?.filter(s => s.session_type === 'group_reformer').length ?? 0
    const privateCount = allSessions?.filter(s => s.session_type.startsWith('private')).length ?? 0

    setStats({ total_sessions: total, this_month: thisMonth, group_count: groupCount, private_count: privateCount })
    setStatsLoading(false)
  }, [])

  const selectInstructor = (inst: Instructor) => {
    if (selected?.id === inst.id) { setSelected(null); setEditing(false); return }
    setSelected(inst)
    setEditing(false)
    loadStats(inst.id)
  }

  const startEdit = (inst: Instructor) => {
    const ip = inst.instructor_profiles
    setEditBio(ip?.bio ?? '')
    setEditLevel(ip?.experience_level ?? 'standard')
    setEditRate(ip?.private_hourly_rate ? String(ip.private_hourly_rate) : '')
    setEditCanPrivate(ip?.can_teach_private ?? false)
    setEditCanGroup(ip?.can_teach_group ?? true)
    setEditCerts(ip?.certifications?.join(', ') ?? '')
    setEditing(true)
  }

  const saveProfile = async () => {
    if (!selected) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      bio: editBio.trim() || null,
      experience_level: editLevel,
      private_hourly_rate: editRate ? parseFloat(editRate) : null,
      can_teach_private: editCanPrivate,
      can_teach_group: editCanGroup,
      certifications: editCerts.split(',').map(s => s.trim()).filter(Boolean),
    }

    // Upsert instructor_profiles (id = profiles.id)
    const { error } = await supabase.from('instructor_profiles').upsert({ id: selected.id, ...payload })
    if (error) { showToast('Error saving profile'); setSaving(false); return }

    // Update local state
    setInstructors(is => is.map(i => i.id === selected.id
      ? { ...i, instructor_profiles: { ...(i.instructor_profiles ?? { id: i.id, locations: null }), ...payload } as InstructorProfile }
      : i
    ))
    setSelected(s => s ? { ...s, instructor_profiles: { ...(s.instructor_profiles ?? { id: s.id, locations: null }), ...payload } as InstructorProfile } : s)
    setEditing(false)
    showToast('Profile saved')
    setSaving(false)
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const inputStyle = { width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #e0e0e0', borderRadius: '2px', fontSize: '0.82rem', outline: 'none', background: 'white', fontFamily: "'Poppins', sans-serif" }
  const labelStyle = { fontFamily: "'Raleway', sans-serif", fontWeight: 600 as const, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#808282', display: 'block' as const, marginBottom: '0.3rem' }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '1100px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: '#1a1a1a', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a' }}>Instructors</h1>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#808282', marginTop: '0.25rem' }}>
          {loading ? '—' : instructors.length} team member{instructors.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

          {/* Instructor list */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {instructors.map(inst => {
              const ip = inst.instructor_profiles
              const level = ip?.experience_level ?? 'standard'
              const chip = EXPERIENCE_COLORS[level] ?? EXPERIENCE_COLORS.standard
              const isSelected = selected?.id === inst.id
              return (
                <div
                  key={inst.id}
                  onClick={() => selectInstructor(inst)}
                  style={{ background: isSelected ? '#f0faf8' : 'white', border: `1px solid ${isSelected ? '#87CEBF' : '#eee'}`, borderRadius: '2px', padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}
                >
                  <div>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.88rem', color: '#1a1a1a', marginBottom: '0.15rem' }}>
                      {inst.first_name} {inst.last_name}
                    </p>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa' }}>{inst.email}</p>
                    {ip?.bio && (
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#808282', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                        {ip.bio}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.52rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '2px', background: chip.bg, color: chip.color }}>
                      {EXPERIENCE_LEVELS.find(e => e.value === level)?.label ?? level}
                    </span>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      {ip?.can_teach_group && <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.48rem', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.15rem 0.4rem', borderRadius: '2px', background: '#f5f5f5', color: '#808282' }}>Group</span>}
                      {ip?.can_teach_private && <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.48rem', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.15rem 0.4rem', borderRadius: '2px', background: '#f0f4ff', color: '#6b88c8' }}>Private</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ width: '320px', flexShrink: 0, position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* Header */}
              <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '1rem', color: '#1a1a1a' }}>
                      {selected.first_name} {selected.last_name}
                    </p>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa' }}>{selected.email}</p>
                    {selected.phone && <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa' }}>{selected.phone}</p>}
                  </div>
                  {!editing && (
                    <button onClick={() => startEdit(selected)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'none', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.3rem 0.7rem', cursor: 'pointer', color: '#808282' }}>
                      Edit
                    </button>
                  )}
                </div>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa' }}>On team since {formatDate(selected.created_at)}</p>
              </div>

              {/* Teaching stats */}
              <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>Teaching Stats</p>
                {statsLoading ? (
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa' }}>Loading...</p>
                ) : stats ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <StatItem label="Total sessions" value={String(stats.total_sessions)} />
                    <StatItem label="This month" value={String(stats.this_month)} />
                    <StatItem label="Group classes" value={String(stats.group_count)} />
                    <StatItem label="Private sessions" value={String(stats.private_count)} />
                  </div>
                ) : null}
              </div>

              {/* Pay rates */}
              <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>Pay Rates</p>
                {(() => {
                  const ip = selected.instructor_profiles
                  const level = ip?.experience_level ?? 'standard'
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <PayRow label="Group (0–4)" value="$30 flat" />
                      <PayRow label="Group (5–7)" value="$48 flat" />
                      <PayRow label="Group (full)" value="$58 flat" />
                      <PayRow label="Solo private" value={getPrivatePay(level, ip?.private_hourly_rate ?? null)} highlight />
                      <PayRow label="Duet" value="$40/person" />
                      <PayRow label="Trio" value="$35/person" />
                      <PayRow label="Internal event" value="$75 flat" />
                      <PayRow label="External event" value="$100 flat" />
                      <PayRow label="Social content" value="$25/hr" />
                    </div>
                  )
                })()}
              </div>

              {/* Profile — view or edit */}
              <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>Profile</p>

                {editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <label style={labelStyle}>Experience Level</label>
                      <select value={editLevel} onChange={e => setEditLevel(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                    {editLevel === 'master_trainer' && (
                      <div>
                        <label style={labelStyle}>Custom Private Session Rate ($)</label>
                        <input type="number" step="1" placeholder="e.g. 62" value={editRate} onChange={e => setEditRate(e.target.value)} style={inputStyle}
                          onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
                      </div>
                    )}
                    <div>
                      <label style={labelStyle}>Bio</label>
                      <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} placeholder="Short bio shown to clients..." style={{ ...inputStyle, resize: 'vertical' as const }}
                        onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
                    </div>
                    <div>
                      <label style={labelStyle}>Certifications (comma-separated)</label>
                      <input type="text" value={editCerts} onChange={e => setEditCerts(e.target.value)} placeholder="e.g. BASI, Polestar, CPR" style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#555' }}>
                        <input type="checkbox" checked={editCanGroup} onChange={e => setEditCanGroup(e.target.checked)} /> Group classes
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#555' }}>
                        <input type="checkbox" checked={editCanPrivate} onChange={e => setEditCanPrivate(e.target.checked)} /> Private sessions
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button onClick={saveProfile} disabled={saving} style={{ flex: 1, fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem', background: saving ? '#b0ddd6' : '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: saving ? 'not-allowed' : 'pointer' }}>
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setEditing(false)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1rem', background: 'none', border: '1px solid #ddd', color: '#808282', borderRadius: '2px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selected.instructor_profiles?.bio && (
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#555', lineHeight: 1.5 }}>
                        {selected.instructor_profiles.bio}
                      </p>
                    )}
                    {selected.instructor_profiles?.certifications && selected.instructor_profiles.certifications.length > 0 && (
                      <div>
                        <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.35rem' }}>Certifications</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {selected.instructor_profiles.certifications.map(cert => (
                            <span key={cert} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.52rem', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.18rem 0.45rem', borderRadius: '2px', background: '#f5f5f5', color: '#808282' }}>{cert}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selected.instructor_profiles?.locations && selected.instructor_profiles.locations.length > 0 && (
                      <div>
                        <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.35rem' }}>Teaches at</p>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#555', textTransform: 'capitalize' }}>
                          {selected.instructor_profiles.locations.map(l => l.replace(/_/g, ' ')).join(', ')}
                        </p>
                      </div>
                    )}
                    {!selected.instructor_profiles?.bio && !selected.instructor_profiles?.certifications?.length && (
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#aaa' }}>No profile yet — click Edit to add details.</p>
                    )}
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

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.5rem', color: '#1a1a1a', lineHeight: 1 }}>{value}</p>
      <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginTop: '0.2rem' }}>{label}</p>
    </div>
  )
}

function PayRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.3rem', borderBottom: '1px solid #f8f8f8' }}>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#808282' }}>{label}</p>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: highlight ? 500 : 300, fontSize: '0.72rem', color: highlight ? '#87CEBF' : '#555' }}>{value}</p>
    </div>
  )
}
