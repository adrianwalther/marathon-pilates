'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Membership = {
  id: string
  membership_type: string
  status: string
  is_founding_member: boolean
  monthly_price: number | null
  starts_at: string
  ends_at: string | null
  billing_cycle_start: string | null
  billing_cycle_end: string | null
}

type Credit = {
  id: string
  credit_type: string
  total_credits: number
  used_credits: number
  expires_at: string | null
  source: string
}

const MEMBERSHIP_LABELS: Record<string, string> = {
  founding:    'Founding Member',
  unlimited:   'Unlimited',
  eight_class: '8-Class Pack',
  four_class:  '4-Class Pack',
  drop_in:     'Drop-In',
}

const PLANS = [
  {
    key: 'founding',
    name: 'Founding Member',
    price: 'Special Rate',
    perks: ['Unlimited group classes', 'Priority booking', 'Locked-in founding rate', 'HSA/FSA eligible'],
    highlight: true,
  },
  {
    key: 'unlimited',
    name: 'Unlimited',
    price: 'Monthly',
    perks: ['Unlimited group classes', 'Priority booking', 'HSA/FSA eligible'],
    highlight: false,
  },
  {
    key: 'eight_class',
    name: '8-Class Pack',
    price: 'Per pack',
    perks: ['8 group classes', 'Use within 3 months', 'HSA/FSA eligible'],
    highlight: false,
  },
  {
    key: 'four_class',
    name: '4-Class Pack',
    price: 'Per pack',
    perks: ['4 group classes', 'Use within 6 weeks', 'HSA/FSA eligible'],
    highlight: false,
  },
]

export default function MembershipPage() {
  const [membership, setMembership] = useState<Membership | null>(null)
  const [credits, setCredits] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: mem }, { data: creds }] = await Promise.all([
        supabase.from('memberships').select('*').eq('client_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('credits').select('*').eq('client_id', user.id).order('created_at', { ascending: false }),
      ])

      if (mem) setMembership(mem)
      if (creds) setCredits(creds)
      setLoading(false)
    }
    load()
  }, [])

  const groupCredits = credits.filter(c => c.credit_type === 'group')
  const privateCredits = credits.filter(c => c.credit_type === 'private')
  const amenityCredits = credits.filter(c => c.credit_type === 'amenity')

  const totalRemaining = (list: Credit[]) => list.reduce((a, c) => a + (c.total_credits - c.used_credits), 0)

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const sectionLabel = {
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700,
    fontSize: '0.65rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: '#808282',
    marginBottom: '1rem',
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '900px' }}>
      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '2.5rem' }}>
        Membership
      </h1>

      {/* Current membership */}
      {membership ? (
        <div style={{ marginBottom: '3rem' }}>
          <p style={sectionLabel}>Current Plan</p>
          <div style={{ background: '#1a1a1a', borderRadius: '2px', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white' }}>
                  {MEMBERSHIP_LABELS[membership.membership_type] ?? membership.membership_type}
                </p>
                {membership.is_founding_member && (
                  <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.25rem 0.6rem', borderRadius: '2px', background: '#87CEBF', color: 'white' }}>
                    Founding
                  </span>
                )}
              </div>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#555' }}>
                Active since {formatDate(membership.starts_at)}
                {membership.billing_cycle_end ? ` · Renews ${formatDate(membership.billing_cycle_end)}` : ''}
              </p>
            </div>
            {membership.monthly_price && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.8rem', color: '#87CEBF', lineHeight: 1 }}>
                  ${membership.monthly_price}
                </p>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>/ month</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '3rem', background: '#f9f8f6', border: '1px dashed #e0e0e0', borderRadius: '2px', padding: '2rem', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ccc', marginBottom: '0.5rem' }}>
            No Active Membership
          </p>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#aaa' }}>
            Choose a plan below to get started
          </p>
        </div>
      )}

      {/* Credits */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={sectionLabel}>Credits Remaining</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          <CreditCard label="Group Classes" count={totalRemaining(groupCredits)} />
          <CreditCard label="Private Sessions" count={totalRemaining(privateCredits)} />
          <CreditCard label="Amenity" count={totalRemaining(amenityCredits)} />
        </div>

        {/* Credit detail rows */}
        {credits.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {credits.map(c => {
              const remaining = c.total_credits - c.used_credits
              if (remaining <= 0) return null
              return (
                <div key={c.id} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1a1a' }}>
                      {c.credit_type} — {c.source}
                    </p>
                    {c.expires_at && (
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', marginTop: '0.1rem' }}>
                        Expires {formatDate(c.expires_at)}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.4rem', color: '#87CEBF', lineHeight: 1 }}>{remaining}</p>
                    <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa' }}>of {c.total_credits}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Plans */}
      <div>
        <p style={sectionLabel}>Available Plans</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {PLANS.map(plan => {
            const isCurrent = membership?.membership_type === plan.key
            return (
              <div key={plan.key} style={{ background: plan.highlight ? '#1a1a1a' : 'white', border: plan.highlight ? 'none' : '1px solid #eee', borderRadius: '2px', padding: '1.5rem' }}>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: plan.highlight ? '#87CEBF' : '#87CEBF', marginBottom: '0.5rem' }}>
                  {plan.name}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {plan.perks.map(p => (
                    <li key={p} style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: plan.highlight ? '#888' : '#808282', paddingLeft: '1rem', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: '#87CEBF' }}>·</span>
                      {p}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={isCurrent}
                  style={{ width: '100%', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.65rem', borderRadius: '2px', border: isCurrent ? 'none' : '1px solid #87CEBF', background: isCurrent ? '#87CEBF' : 'transparent', color: isCurrent ? 'white' : '#87CEBF', cursor: isCurrent ? 'default' : 'pointer' }}
                >
                  {isCurrent ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            )
          })}
        </div>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa', marginTop: '1rem' }}>
          HSA & FSA accepted · Contact us at <a href="mailto:info@marathonpilates.com" style={{ color: '#87CEBF', textDecoration: 'none' }}>info@marathonpilates.com</a> to upgrade or change plans.
        </p>
      </div>
    </div>
  )
}

function CreditCard({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', color: count > 0 ? '#1a1a1a' : '#ddd', lineHeight: 1 }}>{count}</p>
      <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#808282', marginTop: '0.4rem' }}>{label}</p>
    </div>
  )
}
