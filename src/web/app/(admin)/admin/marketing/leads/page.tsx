'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const TEAL = '#87CEBF'

type Lead = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  source: string
  stage: 'new_lead' | 'contacted' | 'trial_booked' | 'trial_done' | 'converted' | 'lost'
  assigned_to: string | null
  notes: string | null
  interested_in: string[] | null
  converted_to_client_id: string | null
  converted_at: string | null
  lost_reason: string | null
  created_at: string
}

type Task = {
  id: string
  lead_id: string
  title: string
  status: 'pending' | 'in_progress' | 'done'
  due_at: string | null
  created_at: string
}

const STAGES: { key: Lead['stage']; label: string; color: string }[] = [
  { key: 'new_lead', label: 'New Lead', color: '#f3f4f6' },
  { key: 'contacted', label: 'Contacted', color: '#dbeafe' },
  { key: 'trial_booked', label: 'Trial Booked', color: '#fef9c3' },
  { key: 'trial_done', label: 'Trial Done', color: '#e0e7ff' },
  { key: 'converted', label: 'Converted', color: '#d1fae5' },
  { key: 'lost', label: 'Lost', color: '#fee2e2' },
]

const SOURCE_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  google: 'Google',
  referral: 'Referral',
  walk_in: 'Walk-in',
  website: 'Website',
  other: 'Other',
}

type View = 'kanban' | 'list' | 'tasks'

export default function LeadsPage() {
  const supabase = createClient()
  const [leads, setLeads] = useState<Lead[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('kanban')
  const [showModal, setShowModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState<string | null>(null) // lead id
  const [saving, setSaving] = useState(false)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', source: 'instagram', notes: '', stage: 'new_lead' as Lead['stage'] })
  const [taskForm, setTaskForm] = useState({ title: '', due_at: '' })

  async function load() {
    setLoading(true)
    const [{ data: ldata }, { data: tdata }] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('lead_tasks').select('*').order('due_at', { ascending: true }),
    ])
    setLeads((ldata as Lead[]) || [])
    setTasks((tdata as Task[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function moveStage(id: string, stage: Lead['stage']) {
    setMovingId(id)
    await supabase.from('leads').update({ stage }).eq('id', id)
    setMovingId(null)
    load()
  }

  async function submitLead() {
    if (!form.first_name || !form.email) return
    setSaving(true)
    await supabase.from('leads').insert(form)
    setSaving(false)
    setShowModal(false)
    setForm({ first_name: '', last_name: '', email: '', phone: '', source: 'instagram', notes: '', stage: 'new_lead' })
    load()
  }

  async function submitTask() {
    if (!taskForm.title || !showTaskModal) return
    setSaving(true)
    await supabase.from('lead_tasks').insert({
      lead_id: showTaskModal,
      title: taskForm.title,
      due_at: taskForm.due_at || null,
      status: 'pending',
    })
    setSaving(false)
    setShowTaskModal(null)
    setTaskForm({ title: '', due_at: '' })
    load()
  }

  async function completeTask(id: string) {
    await supabase.from('lead_tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  const pendingTasks = tasks.filter(t => t.status !== 'done')

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', padding: '2rem', background: '#f9f8f6', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase', margin: 0 }}>MARKETING</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#1a1a1a', margin: '0.25rem 0 0' }}>Lead Management</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 2, padding: '0.6rem 1.2rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          + Add Lead
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {STAGES.map(s => (
          <div key={s.key} style={{ background: '#fff', borderRadius: 2, padding: '0.875rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', letterSpacing: '0.08em', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 0.4rem' }}>{s.label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 300, color: '#1a1a1a', margin: 0 }}>{leads.filter(l => l.stage === s.key).length}</p>
          </div>
        ))}
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: '#fff', padding: '0.25rem', borderRadius: 2, width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {(['kanban', 'list', 'tasks'] as View[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              background: view === v ? TEAL : 'transparent',
              color: view === v ? '#fff' : '#6b7280',
              border: 'none',
              borderRadius: 2,
              padding: '0.4rem 0.875rem',
              fontSize: '0.75rem',
              fontFamily: 'Raleway, sans-serif',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
            {v === 'tasks' && pendingTasks.length > 0 && (
              <span style={{ background: view === 'tasks' ? 'rgba(255,255,255,0.3)' : '#ef4444', color: '#fff', borderRadius: '999px', fontSize: '0.65rem', padding: '0 0.375rem', lineHeight: '1.4' }}>{pendingTasks.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
      ) : view === 'kanban' ? (
        /* Kanban */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '0.75rem', alignItems: 'start' }}>
          {STAGES.map(stage => (
            <div key={stage.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', margin: 0 }}>{stage.label}</p>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{leads.filter(l => l.stage === stage.key).length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {leads.filter(l => l.stage === stage.key).map(lead => (
                  <div key={lead.id} style={{ background: '#fff', borderRadius: 2, padding: '0.875rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', opacity: movingId === lead.id ? 0.5 : 1 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#1a1a1a', margin: '0 0 0.2rem' }}>{lead.first_name} {lead.last_name}</p>
                    <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: '0 0 0.5rem' }}>{lead.email}</p>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.1rem 0.4rem', borderRadius: 2, fontSize: '0.6rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase' }}>
                        {SOURCE_LABELS[lead.source] || lead.source}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <select
                        value={lead.stage}
                        onChange={e => moveStage(lead.id, e.target.value as Lead['stage'])}
                        style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.25rem', fontSize: '0.65rem', color: '#6b7280' }}
                      >
                        {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                      <button
                        onClick={() => setShowTaskModal(lead.id)}
                        style={{ background: '#f3f4f6', border: 'none', borderRadius: 2, padding: '0.25rem 0.5rem', fontSize: '0.65rem', cursor: 'pointer', color: '#6b7280' }}
                        title="Add task"
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : view === 'list' ? (
        /* List view */
        <div style={{ background: '#fff', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f8f6' }}>
                {['Name', 'Email', 'Phone', 'Source', 'Stage', 'Added', 'Action'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 1rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>No leads yet.</td></tr>
              ) : leads.map(lead => {
                const stageInfo = STAGES.find(s => s.key === lead.stage)
                return (
                  <tr key={lead.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#1a1a1a', fontWeight: 500 }}>{lead.first_name} {lead.last_name}</td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#4b5563' }}>{lead.email}</td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#6b7280' }}>{lead.phone || '—'}</td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', color: '#6b7280' }}>{SOURCE_LABELS[lead.source] || lead.source}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ background: stageInfo?.color || '#f3f4f6', color: '#1a1a1a', padding: '0.2rem 0.6rem', borderRadius: 2, fontSize: '0.7rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase' }}>
                        {stageInfo?.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                      {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <select
                        value={lead.stage}
                        onChange={e => moveStage(lead.id, e.target.value as Lead['stage'])}
                        style={{ border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: '#6b7280' }}
                      >
                        {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Tasks view */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', margin: 0 }}>Pending Tasks</p>
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: '999px', fontSize: '0.65rem', padding: '0 0.5rem', lineHeight: '1.6' }}>{pendingTasks.length}</span>
            </div>
            {pendingTasks.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>All caught up!</div>
            ) : pendingTasks.map(task => {
              const lead = leads.find(l => l.id === task.lead_id)
              return (
                <div key={task.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                  <button onClick={() => completeTask(task.id)} style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${TEAL}`, background: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', color: '#1a1a1a', margin: '0 0 0.2rem' }}>{task.title}</p>
                    {lead && <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{lead.first_name} {lead.last_name} · {STAGES.find(s => s.key === lead.stage)?.label}</p>}
                  </div>
                  {task.due_at && (
                    <span style={{ fontSize: '0.72rem', color: new Date(task.due_at) < new Date() ? '#ef4444' : '#9ca3af', whiteSpace: 'nowrap' }}>
                      {new Date(task.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ background: '#fff', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', margin: 0 }}>Leads Needing Follow-up</p>
            </div>
            {leads.filter(l => l.stage === 'new_lead' || l.stage === 'contacted').map(lead => (
              <div key={lead.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1a1a1a', margin: '0 0 0.2rem' }}>{lead.first_name} {lead.last_name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                    {STAGES.find(s => s.key === lead.stage)?.label} · {SOURCE_LABELS[lead.source] || lead.source}
                  </p>
                </div>
                <button
                  onClick={() => setShowTaskModal(lead.id)}
                  style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 2, padding: '0.3rem 0.75rem', fontSize: '0.7rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Add Task
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add lead modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 2, padding: '2rem', width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 400, color: '#1a1a1a', margin: '0 0 1.5rem' }}>Add Lead</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>First Name *</label>
                  <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Last Name</label>
                  <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Email *</label>
                <input type='email' value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Source</label>
                  <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}>
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Stage</label>
                <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as Lead['stage'] }))} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}>
                  {STAGES.filter(s => s.key !== 'converted' && s.key !== 'lost').map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box', resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer', color: '#6b7280' }}>Cancel</button>
              <button onClick={submitLead} disabled={saving} style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 2, padding: '0.5rem 1.25rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add task modal */}
      {showTaskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 2, padding: '2rem', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 400, color: '#1a1a1a', margin: '0 0 1.5rem' }}>Add Task</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Task</label>
                <input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Follow up by phone" style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Due Date</label>
                <input type='datetime-local' value={taskForm.due_at} onChange={e => setTaskForm(f => ({ ...f, due_at: e.target.value }))} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setShowTaskModal(null)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer', color: '#6b7280' }}>Cancel</button>
              <button onClick={submitTask} disabled={saving} style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 2, padding: '0.5rem 1.25rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
