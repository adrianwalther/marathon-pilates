'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const TEAL = '#87CEBF'

type Milestone = {
  id: string
  client_id: string
  milestone_type: 'class_count' | 'private_count' | 'anniversary'
  milestone_value: number
  achieved_at: string
  celebrated: boolean
  reward_issued: boolean
  created_at: string
  profiles: { first_name: string; last_name: string; email: string } | null
}

const MILESTONE_TIERS = [
  { type: 'class_count', value: 10, label: '10 Classes', reward: '1 group credit' },
  { type: 'class_count', value: 25, label: '25 Classes', reward: '1 group credit' },
  { type: 'class_count', value: 50, label: '50 Classes', reward: '2 group credits' },
  { type: 'class_count', value: 100, label: '100 Classes', reward: '1 month free' },
  { type: 'class_count', value: 200, label: '200 Classes', reward: 'Custom reward' },
  { type: 'private_count', value: 1, label: 'First Private', reward: '10% off next private' },
  { type: 'anniversary', value: 1, label: '1 Year Anniversary', reward: 'Special badge + shoutout' },
]

function getMilestoneLabel(m: Milestone) {
  if (m.milestone_type === 'anniversary') return `${m.milestone_value} Year Anniversary`
  if (m.milestone_type === 'private_count') return `${m.milestone_value === 1 ? 'First' : m.milestone_value + 'th'} Private`
  return `${m.milestone_value} Classes`
}

type Filter = 'pending' | 'all'

export default function MilestonesPage() {
  const supabase = createClient()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('pending')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('client_milestones')
      .select('*, profiles(first_name, last_name, email)')
      .order('achieved_at', { ascending: false })
    setMilestones((data as Milestone[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function celebrate(id: string) {
    await supabase.from('client_milestones').update({ celebrated: true }).eq('id', id)
    load()
  }

  async function issueReward(id: string) {
    await supabase.from('client_milestones').update({ reward_issued: true }).eq('id', id)
    load()
  }

  const pending = milestones.filter(m => !m.celebrated)
  const filtered = filter === 'pending' ? pending : milestones

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', padding: '2rem', background: '#f9f8f6', minHeight: '100vh' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase', margin: 0 }}>MARKETING</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#1a1a1a', margin: '0.25rem 0 0' }}>Client Milestones</h1>
      </div>

      {/* Pending alert */}
      {pending.length > 0 && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 2, padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1rem' }}>🎉</span>
          <p style={{ fontSize: '0.875rem', color: '#854d0e', margin: 0 }}>
            <strong>{pending.length}</strong> {pending.length === 1 ? 'client has' : 'clients have'} pending milestone celebrations
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>
        {/* Main panel */}
        <div>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: '#fff', padding: '0.25rem', borderRadius: 2, width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {(['pending', 'all'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? TEAL : 'transparent',
                  color: filter === f ? '#fff' : '#6b7280',
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
                {f === 'pending' ? 'Needs Celebration' : 'All Milestones'}
                {f === 'pending' && pending.length > 0 && (
                  <span style={{ background: filter === 'pending' ? 'rgba(255,255,255,0.3)' : '#ef4444', color: '#fff', borderRadius: '999px', fontSize: '0.65rem', padding: '0 0.375rem', lineHeight: '1.4' }}>{pending.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div style={{ background: '#fff', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                {filter === 'pending' ? 'No pending celebrations — great work!' : 'No milestones recorded yet.'}
              </div>
            ) : (
              filtered.map(m => (
                <div key={m.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${TEAL}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem' }}>
                    {m.milestone_type === 'anniversary' ? '🎂' : m.milestone_type === 'private_count' ? '⭐' : '🏆'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1a1a1a', margin: '0 0 0.15rem' }}>
                      {m.profiles ? `${m.profiles.first_name} ${m.profiles.last_name}` : 'Unknown Client'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
                      {getMilestoneLabel(m)} · {new Date(m.achieved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {m.celebrated ? (
                      <span style={{ fontSize: '0.7rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase', color: TEAL, letterSpacing: '0.05em' }}>Celebrated ✓</span>
                    ) : (
                      <button onClick={() => celebrate(m.id)} style={{ background: '#fef9c3', color: '#854d0e', border: 'none', borderRadius: 2, padding: '0.3rem 0.75rem', fontSize: '0.7rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase', cursor: 'pointer' }}>
                        Send Celebration
                      </button>
                    )}
                    {m.reward_issued ? (
                      <span style={{ fontSize: '0.7rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em' }}>Reward Issued ✓</span>
                    ) : (
                      <button onClick={() => issueReward(m.id)} style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 2, padding: '0.3rem 0.75rem', fontSize: '0.7rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase', cursor: 'pointer' }}>
                        Issue Reward
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tiers sidebar */}
        <div style={{ background: '#fff', borderRadius: 2, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', height: 'fit-content' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 1rem' }}>Milestone Tiers</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {MILESTONE_TIERS.map(tier => (
              <div key={`${tier.type}-${tier.value}`} style={{ background: '#f9f8f6', borderRadius: 2, padding: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#1a1a1a', margin: 0 }}>{tier.label}</p>
                  <span style={{ fontSize: '0.75rem', color: milestones.filter(m => m.milestone_type === tier.type && m.milestone_value === tier.value).length > 0 ? TEAL : '#9ca3af' }}>
                    {milestones.filter(m => m.milestone_type === tier.type && m.milestone_value === tier.value).length}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.2rem 0 0' }}>{tier.reward}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
