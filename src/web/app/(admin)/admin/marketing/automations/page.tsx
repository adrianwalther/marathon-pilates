'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const TEAL = '#87CEBF'

type AutomationStep = {
  delay_hours: number
  channel: string
  subject?: string
  message: string
}

type Automation = {
  id: string
  name: string
  description: string
  trigger_type: string
  trigger_config: Record<string, unknown>
  is_active: boolean
  channel: string[]
  steps: AutomationStep[]
  sent_count: number
  created_at: string
}

const TRIGGER_LABELS: Record<string, string> = {
  new_signup: 'New Signup',
  pack_expiring: 'Pack Expiring',
  no_visit: 'No Visit (30 days)',
  failed_payment: 'Failed Payment',
  milestone_reached: 'Milestone Reached',
  birthday: 'Birthday',
  trial_completed: 'Trial Completed',
}

const DEFAULT_AUTOMATIONS: Omit<Automation, 'id' | 'created_at' | 'sent_count'>[] = [
  {
    name: 'Welcome Series',
    description: 'Onboard new clients with studio info and first booking nudge',
    trigger_type: 'new_signup',
    trigger_config: {},
    is_active: true,
    channel: ['email'],
    steps: [
      { delay_hours: 0, channel: 'email', subject: 'Welcome to Marathon Pilates!', message: 'Welcome! Here\'s everything you need to know to get started.' },
      { delay_hours: 24, channel: 'email', subject: 'Ready to book your first class?', message: 'Your journey starts with one class. Book yours today.' },
      { delay_hours: 72, channel: 'sms', message: 'Hey! Don\'t forget to book your first class at Marathon Pilates. Reply BOOK for the link.' },
    ],
  },
  {
    name: 'Pack Expiring Soon',
    description: 'Remind clients when their class pack is about to expire',
    trigger_type: 'pack_expiring',
    trigger_config: { days_before: 7 },
    is_active: true,
    channel: ['email', 'sms'],
    steps: [
      { delay_hours: 0, channel: 'email', subject: 'Your class pack expires in 7 days', message: 'You have credits remaining — use them before they expire!' },
      { delay_hours: 120, channel: 'sms', message: 'Heads up! Your Marathon Pilates pack expires in 2 days. Book now!' },
    ],
  },
  {
    name: 'Win-Back',
    description: "Re-engage clients who haven't visited in 30 days",
    trigger_type: 'no_visit',
    trigger_config: { days: 30 },
    is_active: true,
    channel: ['email'],
    steps: [
      { delay_hours: 0, channel: 'email', subject: 'We miss you at Marathon Pilates', message: "It's been a while — come back and move with us." },
      { delay_hours: 168, channel: 'email', subject: 'A little something for you', message: 'Here\'s 10% off your next class pack as a welcome-back gift.' },
    ],
  },
  {
    name: 'Failed Payment',
    description: 'Notify and prompt clients when a membership payment fails',
    trigger_type: 'failed_payment',
    trigger_config: {},
    is_active: true,
    channel: ['email', 'sms'],
    steps: [
      { delay_hours: 0, channel: 'email', subject: 'Payment issue with your membership', message: 'We were unable to process your payment. Please update your billing info.' },
      { delay_hours: 48, channel: 'sms', message: 'Action needed: your Marathon Pilates membership payment failed. Update your card to keep your spot.' },
    ],
  },
  {
    name: 'Milestone Celebration',
    description: 'Celebrate client class milestones (10, 25, 50, 100, 200)',
    trigger_type: 'milestone_reached',
    trigger_config: {},
    is_active: true,
    channel: ['email'],
    steps: [
      { delay_hours: 0, channel: 'email', subject: '🎉 You hit a milestone!', message: 'Congratulations on reaching this incredible achievement. You inspire us every day.' },
    ],
  },
  {
    name: 'Birthday',
    description: 'Send a birthday message with a special gift',
    trigger_type: 'birthday',
    trigger_config: { days_before: 0 },
    is_active: true,
    channel: ['email', 'sms'],
    steps: [
      { delay_hours: 0, channel: 'email', subject: 'Happy Birthday from Marathon Pilates! 🎂', message: 'Wishing you a wonderful birthday. Enjoy a complimentary class on us this month.' },
      { delay_hours: 0, channel: 'sms', message: 'Happy Birthday! 🎉 A free class is waiting for you at Marathon Pilates — our gift to you.' },
    ],
  },
]

export default function AutomationsPage() {
  const supabase = createClient()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Automation | null>(null)
  const [seeding, setSeeding] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('automations')
      .select('*')
      .order('created_at', { ascending: true })
    setAutomations((data as Automation[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggle(id: string, current: boolean) {
    await supabase.from('automations').update({ is_active: !current }).eq('id', id)
    load()
  }

  async function seedDefaults() {
    setSeeding(true)
    for (const a of DEFAULT_AUTOMATIONS) {
      await supabase.from('automations').insert({ ...a, sent_count: 0 })
    }
    setSeeding(false)
    load()
  }

  const active = automations.filter(a => a.is_active).length

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', padding: '2rem', background: '#f9f8f6', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase', margin: 0 }}>MARKETING</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#1a1a1a', margin: '0.25rem 0 0' }}>Automations</h1>
        </div>
        {automations.length === 0 && (
          <button
            onClick={seedDefaults}
            disabled={seeding}
            style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 2, padding: '0.6rem 1.2rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            {seeding ? 'Loading...' : 'Load Default Automations'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'TOTAL AUTOMATIONS', value: automations.length },
          { label: 'ACTIVE', value: active },
          { label: 'TOTAL SENDS', value: automations.reduce((s, a) => s + (a.sent_count || 0), 0).toLocaleString() },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 2, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>{s.label}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 300, color: '#1a1a1a', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
          ) : automations.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 2, padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0 0 1rem' }}>No automations yet. Load the defaults to get started.</p>
            </div>
          ) : automations.map(a => (
            <div
              key={a.id}
              onClick={() => setSelected(selected?.id === a.id ? null : a)}
              style={{ background: '#fff', borderRadius: 2, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer', borderLeft: selected?.id === a.id ? `3px solid ${TEAL}` : '3px solid transparent', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1a1a1a', margin: 0 }}>{a.name}</p>
                  <span style={{ background: a.is_active ? '#d1fae5' : '#f3f4f6', color: a.is_active ? '#065f46' : '#6b7280', padding: '0.15rem 0.5rem', borderRadius: 2, fontSize: '0.65rem', fontFamily: 'Raleway, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {a.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.5rem' }}>{a.description}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.15rem 0.5rem', borderRadius: 2, fontSize: '0.65rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase' }}>
                    {TRIGGER_LABELS[a.trigger_type] || a.trigger_type}
                  </span>
                  {(Array.isArray(a.channel) ? a.channel : [a.channel]).map((ch: string) => (
                    <span key={ch} style={{ background: ch === 'email' ? '#eff6ff' : '#f0fdf4', color: ch === 'email' ? '#1d4ed8' : '#15803d', padding: '0.15rem 0.5rem', borderRadius: 2, fontSize: '0.65rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase' }}>
                      {ch}
                    </span>
                  ))}
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{(a.steps || []).length} steps · {(a.sent_count || 0).toLocaleString()} sent</span>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); toggle(a.id, a.is_active) }}
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  background: a.is_active ? TEAL : '#e5e7eb',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 3,
                  left: a.is_active ? 21 : 3,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: 2, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 0.25rem' }}>Automation</p>
                <h2 style={{ fontSize: '1rem', fontWeight: 400, color: '#1a1a1a', margin: 0 }}>{selected.name}</h2>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 0.5rem' }}>Trigger</p>
              <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.3rem 0.75rem', borderRadius: 2, fontSize: '0.8rem' }}>
                {TRIGGER_LABELS[selected.trigger_type] || selected.trigger_type}
              </span>
            </div>

            <div>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 0.75rem' }}>Steps</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(selected.steps || []).map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${TEAL}20`, border: `1px solid ${TEAL}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600, color: TEAL, flexShrink: 0 }}>{i + 1}</div>
                      {i < (selected.steps || []).length - 1 && <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '2px 0' }} />}
                    </div>
                    <div style={{ background: '#f9f8f6', borderRadius: 2, padding: '0.75rem', flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                        <span style={{ background: step.channel === 'email' ? '#eff6ff' : '#f0fdf4', color: step.channel === 'email' ? '#1d4ed8' : '#15803d', padding: '0.1rem 0.4rem', borderRadius: 2, fontSize: '0.6rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase' }}>{step.channel}</span>
                        {step.delay_hours > 0 && <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>+{step.delay_hours >= 24 ? `${step.delay_hours / 24}d` : `${step.delay_hours}h`}</span>}
                        {step.delay_hours === 0 && i === 0 && <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Immediately</span>}
                      </div>
                      {step.subject && <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1a1a1a', margin: '0 0 0.2rem' }}>{step.subject}</p>}
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{step.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
