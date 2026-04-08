'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const TEAL = '#87CEBF'

type Broadcast = {
  id: string
  title: string
  subject: string
  body: string
  channel: string[]
  audience: string
  audience_filter: Record<string, unknown> | null
  status: 'draft' | 'scheduled' | 'sending' | 'sent'
  scheduled_at: string | null
  sent_at: string | null
  recipient_count: number
  open_count: number
  click_count: number
  created_at: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#f3f4f6', text: '#6b7280' },
  scheduled: { bg: '#dbeafe', text: '#1d4ed8' },
  sending: { bg: '#fef9c3', text: '#854d0e' },
  sent: { bg: '#d1fae5', text: '#065f46' },
}

const AUDIENCE_OPTIONS = [
  { value: 'all_clients', label: 'All Clients' },
  { value: 'active_members', label: 'Active Members' },
  { value: 'leads', label: 'Leads' },
  { value: 'charlotte_park', label: 'Charlotte Park Only' },
  { value: 'green_hills', label: 'Green Hills Only' },
]

export default function BroadcastsPage() {
  const supabase = createClient()
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    subject: '',
    body: '',
    channel: ['email'] as string[],
    audience: 'all_clients',
    scheduled_at: '',
  })

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
    setBroadcasts((data as Broadcast[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function toggleChannel(ch: string) {
    setForm(f => ({
      ...f,
      channel: f.channel.includes(ch) ? f.channel.filter(c => c !== ch) : [...f.channel, ch],
    }))
  }

  async function submit(asDraft: boolean) {
    if (!form.title || !form.subject || !form.body) return
    setSaving(true)
    await supabase.from('broadcasts').insert({
      title: form.title,
      subject: form.subject,
      body: form.body,
      channel: form.channel,
      audience: form.audience,
      status: asDraft ? 'draft' : form.scheduled_at ? 'scheduled' : 'draft',
      scheduled_at: form.scheduled_at || null,
      recipient_count: 0,
      open_count: 0,
      click_count: 0,
    })
    setSaving(false)
    setShowModal(false)
    setForm({ title: '', subject: '', body: '', channel: ['email'], audience: 'all_clients', scheduled_at: '' })
    load()
  }

  const sent = broadcasts.filter(b => b.status === 'sent')
  const avgOpen = sent.length > 0 ? Math.round(sent.reduce((s, b) => s + (b.recipient_count > 0 ? (b.open_count / b.recipient_count) * 100 : 0), 0) / sent.length) : 0

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', padding: '2rem', background: '#f9f8f6', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase', margin: 0 }}>MARKETING</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#1a1a1a', margin: '0.25rem 0 0' }}>Broadcasts</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 2, padding: '0.6rem 1.2rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          + Compose
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'TOTAL SENT', value: sent.length },
          { label: 'DRAFTS', value: broadcasts.filter(b => b.status === 'draft').length },
          { label: 'SCHEDULED', value: broadcasts.filter(b => b.status === 'scheduled').length },
          { label: 'AVG OPEN RATE', value: sent.length > 0 ? `${avgOpen}%` : '—' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 2, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>{s.label}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 300, color: '#1a1a1a', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Broadcasts list */}
      <div style={{ background: '#fff', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', margin: 0 }}>All Broadcasts</p>
        </div>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
        ) : broadcasts.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>No broadcasts yet. Compose your first one.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f8f6' }}>
                {['Title', 'Audience', 'Channels', 'Status', 'Date', 'Metrics'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 1rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {broadcasts.map(b => {
                const audienceLabel = AUDIENCE_OPTIONS.find(a => a.value === b.audience)?.label || b.audience
                const openRate = b.recipient_count > 0 ? Math.round((b.open_count / b.recipient_count) * 100) : null
                const clickRate = b.recipient_count > 0 ? Math.round((b.click_count / b.recipient_count) * 100) : null
                return (
                  <tr key={b.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1a1a1a', margin: '0 0 0.15rem' }}>{b.title}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{b.subject}</p>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#4b5563' }}>{audienceLabel}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {(Array.isArray(b.channel) ? b.channel : [b.channel]).map((ch: string) => (
                          <span key={ch} style={{ background: ch === 'email' ? '#eff6ff' : ch === 'sms' ? '#f0fdf4' : '#faf5ff', color: ch === 'email' ? '#1d4ed8' : ch === 'sms' ? '#15803d' : '#7c3aed', padding: '0.15rem 0.4rem', borderRadius: 2, fontSize: '0.65rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase' }}>
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ background: STATUS_COLORS[b.status].bg, color: STATUS_COLORS[b.status].text, padding: '0.2rem 0.6rem', borderRadius: 2, fontSize: '0.7rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase' }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#9ca3af' }}>
                      {b.sent_at
                        ? new Date(b.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : b.scheduled_at
                          ? `Scheduled ${new Date(b.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                          : new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {b.status === 'sent' ? (
                        <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                          <span style={{ color: '#6b7280' }}>{b.recipient_count} sent</span>
                          {openRate !== null && <span style={{ marginLeft: '0.5rem' }}>· {openRate}% open</span>}
                          {clickRate !== null && <span style={{ marginLeft: '0.5rem' }}>· {clickRate}% click</span>}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Compose modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 2, padding: '2rem', width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 400, color: '#1a1a1a', margin: '0 0 1.5rem' }}>Compose Broadcast</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Title (internal)</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. March Newsletter" style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Subject Line</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Spring classes are here 🌿" style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Audience</label>
                  <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}>
                    {AUDIENCE_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 8 }}>Channels</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['email', 'sms', 'push'].map(ch => (
                      <button
                        key={ch}
                        onClick={() => toggleChannel(ch)}
                        style={{
                          background: form.channel.includes(ch) ? TEAL : '#f3f4f6',
                          color: form.channel.includes(ch) ? '#fff' : '#6b7280',
                          border: 'none',
                          borderRadius: 2,
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          fontFamily: 'Raleway, sans-serif',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Message</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={6} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Schedule Send (optional)</label>
                <input type='datetime-local' value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer', color: '#6b7280' }}>Cancel</button>
              <button onClick={() => submit(true)} disabled={saving} style={{ background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: 2, padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}>Save Draft</button>
              <button onClick={() => submit(false)} disabled={saving} style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 2, padding: '0.5rem 1.25rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                {saving ? 'Saving...' : form.scheduled_at ? 'Schedule' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
