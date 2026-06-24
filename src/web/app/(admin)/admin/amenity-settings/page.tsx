'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type AmenityRule = {
  id: string
  session_type: string
  display_name: string
  open_time: string
  close_time: string
  slot_duration_minutes: number
  session_duration_minutes: number
  max_capacity: number
  advance_cutoff_hours: number
  is_active: boolean
}

const sectionLabel = {
  fontFamily: "'Raleway', sans-serif",
  fontWeight: 700 as const,
  fontSize: '0.65rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: 'var(--color-text-muted)',
  marginBottom: '1rem',
}

const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  border: '1px solid #e0e0e0',
  borderRadius: '2px',
  fontSize: '0.85rem',
  fontFamily: "'Poppins', sans-serif",
  background: 'white',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  display: 'block' as const,
  fontFamily: "'Raleway', sans-serif",
  fontWeight: 700 as const,
  fontSize: '0.58rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: 'var(--color-text-muted)',
  marginBottom: '0.35rem',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function RuleCard({
  rule,
  onSave,
}: {
  rule: AmenityRule
  onSave: (updated: AmenityRule) => Promise<void>
}) {
  const [draft, setDraft] = useState<AmenityRule>(rule)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDirty = JSON.stringify(draft) !== JSON.stringify(rule)

  const set = (key: keyof AmenityRule, value: unknown) =>
    setDraft(d => ({ ...d, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const statusColor = draft.is_active ? '#2a7a4b' : '#aaa'

  return (
    <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.75rem 2rem', opacity: draft.is_active ? 1 : 0.65 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <input
            value={draft.display_name}
            onChange={e => set('display_name', e.target.value)}
            style={{ ...inputStyle, fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '1.05rem', border: 'none', padding: '0', background: 'transparent', color: 'var(--color-text)' }}
            onFocus={e => (e.target.style.borderBottom = '1px solid var(--color-cta)')}
            onBlur={e => (e.target.style.borderBottom = 'none')}
          />
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', marginTop: '0.2rem' }}>
            {rule.session_type}
          </p>
        </div>

        {/* Active toggle */}
        <button
          onClick={() => set('is_active', !draft.is_active)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: draft.is_active ? 'var(--color-cta)' : '#ddd', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: '3px', left: draft.is_active ? '19px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
          </div>
          <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: statusColor }}>
            {draft.is_active ? 'Active' : 'Inactive'}
          </span>
        </button>
      </div>

      {/* Fields grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <Field label="Session Duration (min)">
          <input
            type="number" min={5} max={240} step={5}
            value={draft.session_duration_minutes}
            onChange={e => set('session_duration_minutes', parseInt(e.target.value) || 0)}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-cta)')}
            onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
          />
        </Field>
        <Field label="Slot Block (min)">
          <input
            type="number" min={5} max={240} step={5}
            value={draft.slot_duration_minutes}
            onChange={e => set('slot_duration_minutes', parseInt(e.target.value) || 0)}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-cta)')}
            onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
          />
        </Field>
        <Field label="Capacity (clients/slot)">
          <input
            type="number" min={1} max={20}
            value={draft.max_capacity}
            onChange={e => set('max_capacity', parseInt(e.target.value) || 1)}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-cta)')}
            onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
          />
        </Field>
        <Field label="Advance Cutoff (hours)">
          <input
            type="number" min={1} max={168}
            value={draft.advance_cutoff_hours}
            onChange={e => set('advance_cutoff_hours', parseInt(e.target.value) || 1)}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-cta)')}
            onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
          />
        </Field>
        <Field label="Open Time">
          <input
            type="time"
            value={draft.open_time.slice(0, 5)}
            onChange={e => set('open_time', e.target.value + ':00')}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-cta)')}
            onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
          />
        </Field>
        <Field label="Close Time">
          <input
            type="time"
            value={draft.close_time.slice(0, 5)}
            onChange={e => set('close_time', e.target.value + ':00')}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-cta)')}
            onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
          />
        </Field>
      </div>

      {/* Summary line */}
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        {draft.session_duration_minutes}-min session · {draft.slot_duration_minutes}-min block · {draft.max_capacity} client{draft.max_capacity !== 1 ? 's' : ''} per slot · {draft.advance_cutoff_hours}hr advance cutoff · {draft.open_time.slice(0, 5)} – {draft.close_time.slice(0, 5)}
      </p>

      {error && (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#c0392b', marginBottom: '0.75rem' }}>{error}</p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          style={{
            fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '0.65rem 1.5rem', borderRadius: '2px', border: 'none', cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
            background: saving || !isDirty ? '#e0e0e0' : 'var(--color-cta)', color: saving || !isDirty ? '#aaa' : 'white',
            transition: 'background 0.15s',
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && (
          <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2a7a4b' }}>
            ✓ Saved
          </span>
        )}
        {isDirty && !saving && (
          <button
            onClick={() => setDraft(rule)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa' }}
          >
            Discard
          </button>
        )}
      </div>
    </div>
  )
}

export default function AmenitySettingsPage() {
  const [rules, setRules] = useState<AmenityRule[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      const t = data.session?.access_token ?? null
      setToken(t)
      fetch('/api/admin/amenity-rules', {
        headers: { Authorization: t ? `Bearer ${t}` : '' },
      })
        .then(r => r.json())
        .then(d => { if (d.rules) setRules(d.rules) })
        .finally(() => setLoading(false))
    })
  }, [])

  const handleSave = async (updated: AmenityRule) => {
    const res = await fetch('/api/admin/amenity-rules', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(updated),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Save failed')
    // Update local state with the saved rule
    setRules(prev => prev.map(r => r.session_type === updated.session_type ? data.rule : r))
  }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '900px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text)' }}>
          Amenity Settings
        </h1>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Configure session durations, capacity, and hours for each wellness service. Changes take effect immediately.
        </p>
      </div>

      {loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : rules.length === 0 ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>No amenity rules found.</p>
      ) : (
        <>
          <p style={sectionLabel}>Wellness Services</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rules.map(rule => (
              <RuleCard key={rule.session_type} rule={rule} onSave={handleSave} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
