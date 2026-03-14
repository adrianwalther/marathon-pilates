'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const TEAL = '#87CEBF'

type Referral = {
  id: string
  referrer_id: string
  referred_email: string
  referred_client_id: string | null
  status: 'pending' | 'signed_up' | 'converted' | 'rewarded'
  referral_code: string
  reward_type: string | null
  reward_value: number | null
  reward_issued_at: string | null
  converted_at: string | null
  created_at: string
  referrer: { first_name: string; last_name: string; email: string } | null
}

type Profile = { id: string; first_name: string; last_name: string; email: string }

const STATUS_COLORS: Record<string, string> = {
  pending: '#f3f4f6',
  signed_up: '#dbeafe',
  converted: '#d1fae5',
  rewarded: '#f3e8ff',
}
const STATUS_TEXT: Record<string, string> = {
  pending: '#6b7280',
  signed_up: '#1d4ed8',
  converted: '#065f46',
  rewarded: '#6d28d9',
}

function genCode() {
  return Math.random().toString(36).toUpperCase().slice(2, 8)
}

export default function ReferralsPage() {
  const supabase = createClient()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ referrer_id: '', referred_email: '', referral_code: genCode() })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('referrals')
      .select('*, referrer:profiles!referrer_id(first_name, last_name, email)')
      .order('created_at', { ascending: false })
    setReferrals((data as Referral[]) || [])
    const { data: pdata } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('role', 'client')
      .order('first_name')
    setProfiles((pdata as Profile[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function issueReward(id: string) {
    await supabase
      .from('referrals')
      .update({ status: 'rewarded', reward_issued_at: new Date().toISOString() })
      .eq('id', id)
    load()
  }

  async function submitReferral() {
    if (!form.referrer_id || !form.referred_email) return
    setSaving(true)
    await supabase.from('referrals').insert({
      referrer_id: form.referrer_id,
      referred_email: form.referred_email,
      referral_code: form.referral_code,
      status: 'pending',
    })
    setSaving(false)
    setShowModal(false)
    setForm({ referrer_id: '', referred_email: '', referral_code: genCode() })
    load()
  }

  const total = referrals.length
  const converted = referrals.filter(r => r.status === 'converted' || r.status === 'rewarded').length
  const rewarded = referrals.filter(r => r.status === 'rewarded').length
  const rate = total > 0 ? Math.round((converted / total) * 100) : 0

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', padding: '2rem', background: '#f9f8f6', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase', margin: 0 }}>MARKETING</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#1a1a1a', margin: '0.25rem 0 0' }}>Referral Program</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 2, padding: '0.6rem 1.2rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          + Add Referral
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'TOTAL REFERRALS', value: total },
          { label: 'CONVERTED', value: converted },
          { label: 'CONVERSION RATE', value: `${rate}%` },
          { label: 'REWARDS ISSUED', value: rewarded },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 2, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>{s.label}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 300, color: '#1a1a1a', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        {/* Referrals table */}
        <div style={{ background: '#fff', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', margin: 0 }}>All Referrals</p>
          </div>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
          ) : referrals.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>No referrals yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f8f6' }}>
                  {['Referrer', 'Referred Email', 'Code', 'Status', 'Date', 'Action'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 1rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map(r => (
                  <tr key={r.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#1a1a1a' }}>
                      {r.referrer ? `${r.referrer.first_name} ${r.referrer.last_name}` : '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#4b5563' }}>{r.referred_email}</td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#6b7280', fontFamily: 'monospace' }}>{r.referral_code}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ background: STATUS_COLORS[r.status], color: STATUS_TEXT[r.status], padding: '0.2rem 0.6rem', borderRadius: 2, fontSize: '0.7rem', fontFamily: 'Raleway, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#9ca3af' }}>
                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {r.status === 'converted' && (
                        <button
                          onClick={() => issueReward(r.id)}
                          style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 2, padding: '0.3rem 0.75rem', fontSize: '0.7rem', fontFamily: 'Raleway, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer' }}
                        >
                          Issue Reward
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 2, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 1rem' }}>Program Config</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Referrer Reward', value: '1 free group class' },
                { label: 'Friend Reward', value: '10% off first month' },
                { label: 'Trigger', value: "Friend's first completed class" },
              ].map(item => (
                <div key={item.label} style={{ background: '#f9f8f6', borderRadius: 2, padding: '0.875rem' }}>
                  <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 0.25rem' }}>{item.label}</p>
                  <p style={{ fontSize: '0.875rem', color: '#1a1a1a', margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 2, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 0.75rem' }}>Pipeline</p>
            {(['pending', 'signed_up', 'converted', 'rewarded'] as const).map(stage => (
              <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '0.8rem', color: '#4b5563', textTransform: 'capitalize' }}>{stage.replace('_', ' ')}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1a1a1a' }}>{referrals.filter(r => r.status === stage).length}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 2, padding: '2rem', width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 400, color: '#1a1a1a', margin: '0 0 1.5rem' }}>Add Referral</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Referrer (Client)</label>
                <select
                  value={form.referrer_id}
                  onChange={e => setForm(f => ({ ...f, referrer_id: e.target.value }))}
                  style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: '#1a1a1a' }}
                >
                  <option value=''>Select client...</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Referred Email</label>
                <input
                  type='email'
                  value={form.referred_email}
                  onChange={e => setForm(f => ({ ...f, referred_email: e.target.value }))}
                  placeholder='friend@email.com'
                  style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Referral Code</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    value={form.referral_code}
                    onChange={e => setForm(f => ({ ...f, referral_code: e.target.value.toUpperCase() }))}
                    style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                  <button onClick={() => setForm(f => ({ ...f, referral_code: genCode() }))} style={{ background: '#f3f4f6', border: 'none', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', color: '#6b7280' }}>Regen</button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer', color: '#6b7280' }}>Cancel</button>
              <button onClick={submitReferral} disabled={saving} style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 2, padding: '0.5rem 1.25rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Add Referral'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
