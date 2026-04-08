'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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
    price: 'Contact us',
    priceNote: 'Special rate',
    perks: ['Unlimited group classes', 'Priority booking', 'Locked-in founding rate', 'HSA/FSA eligible'],
    highlight: true,
    contactOnly: true,
  },
  {
    key: 'unlimited',
    name: 'Unlimited',
    price: '$289',
    priceNote: '/ month',
    perks: ['Unlimited group classes', 'Priority booking', 'HSA/FSA eligible'],
    highlight: false,
    contactOnly: false,
  },
  {
    key: 'eight_class',
    name: '8-Class Monthly',
    price: '$224',
    priceNote: '/ month · 8 classes',
    perks: ['8 group classes per month', 'Credits reset monthly', 'HSA/FSA eligible'],
    highlight: false,
    contactOnly: false,
  },
  {
    key: 'four_class',
    name: '4-Class Monthly',
    price: '$128',
    priceNote: '/ month · 4 classes',
    perks: ['4 group classes per month', 'Credits reset monthly', 'HSA/FSA eligible'],
    highlight: false,
    contactOnly: false,
  },
]

const CLASS_PACKS = [
  {
    key: 'drop_in',
    name: 'Drop-In',
    price: '$40',
    priceNote: '1 class',
    description: 'Single group class. No commitment.',
  },
  {
    key: 'five_class_pack',
    name: '5-Class Pack',
    price: '$175',
    priceNote: '$35 / class',
    description: 'Five group classes. Use anytime.',
  },
  {
    key: 'ten_class_pack',
    name: '10-Class Pack',
    price: '$330',
    priceNote: '$33 / class',
    description: 'Ten group classes. Best value.',
  },
]

// TODO: confirm amenity prices with Ruby
const AMENITY_PACKS = [
  {
    key: 'sauna_single',
    name: 'Sauna — Single',
    price: '$35',
    priceNote: '1 session',
    description: 'Single Sunlighten mPulse infrared sauna session.',
  },
  {
    key: 'sauna_five_pack',
    name: 'Sauna — 5 Pack',
    price: '$150',
    priceNote: '$30 / session',
    description: 'Five sauna sessions. Use anytime.',
  },
  {
    key: 'cold_plunge_single',
    name: 'Cold Plunge — Single',
    price: '$30',
    priceNote: '1 session',
    description: 'Single cold plunge session.',
  },
  {
    key: 'cold_plunge_five_pack',
    name: 'Cold Plunge — 5 Pack',
    price: '$125',
    priceNote: '$25 / session',
    description: 'Five cold plunge sessions. Use anytime.',
  },
  {
    key: 'contrast_single',
    name: 'Contrast Therapy — Single',
    price: '$45',
    priceNote: '1 session',
    description: 'Single contrast therapy session (sauna + cold plunge).',
  },
]

export default function MembershipPageWrapper() {
  return (
    <Suspense>
      <MembershipPage />
    </Suspense>
  )
}

function MembershipPage() {
  const [membership, setMembership] = useState<Membership | null>(null)
  const [credits, setCredits] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [successPlan, setSuccessPlan] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Handle post-payment confirmation
      const stripeSession = searchParams.get('stripe_session')
      const successKey = searchParams.get('success')
      if (stripeSession && successKey) {
        setSuccessPlan(successKey)
        await fetch('/api/checkout/membership/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stripe_session_id: stripeSession }),
        })
      }

      const [{ data: mem }, { data: creds }] = await Promise.all([
        supabase.from('memberships').select('*').eq('client_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('credits').select('*').eq('client_id', user.id).order('created_at', { ascending: false }),
      ])

      if (mem) setMembership(mem)
      if (creds) setCredits(creds)
      setLoading(false)
    }
    load()
  }, [searchParams])

  const handleSelectPlan = async (planKey: string) => {
    if (!userId) return
    setCheckingOut(planKey)
    try {
      const supabase = createClient()
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const res = await fetch('/api/checkout/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authSession ? `Bearer ${authSession.access_token}` : '' },
        body: JSON.stringify({ plan_key: planKey, user_id: userId }),
      })
      const { url, error } = await res.json()
      if (error) { alert(error); setCheckingOut(null); return }
      window.location.href = url
    } catch {
      alert('Something went wrong. Please try again.')
      setCheckingOut(null)
    }
  }

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

      {/* Success banner */}
      {successPlan && (
        <div style={{ background: '#e8f7f4', border: '1px solid #87CEBF', borderRadius: '2px', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: '#87CEBF', fontSize: '1.2rem' }}>✓</span>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#1a1a1a' }}>
            Payment confirmed — your membership is now active.
          </p>
        </div>
      )}

      {/* Membership Plans */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={sectionLabel}>Membership Plans</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {PLANS.map(plan => {
            const isCurrent = membership?.membership_type === plan.key
            const isLoading = checkingOut === plan.key
            return (
              <div key={plan.key} style={{ background: plan.highlight ? '#1a1a1a' : 'white', border: plan.highlight ? 'none' : '1px solid #eee', borderRadius: '2px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#87CEBF', marginBottom: '0.75rem' }}>
                  {plan.name}
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.6rem', color: plan.highlight ? 'white' : '#1a1a1a', lineHeight: 1 }}>{plan.price}</span>
                  {plan.priceNote && (
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', marginLeft: '0.35rem' }}>{plan.priceNote}</span>
                  )}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                  {plan.perks.map(p => (
                    <li key={p} style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: plan.highlight ? '#888' : '#808282', paddingLeft: '1rem', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: '#87CEBF' }}>·</span>
                      {p}
                    </li>
                  ))}
                </ul>
                {plan.contactOnly ? (
                  <a href="mailto:info@marathonpilates.com" style={{ display: 'block', width: '100%', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.65rem', borderRadius: '2px', border: '1px solid #87CEBF', background: 'transparent', color: '#87CEBF', cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
                    Contact Us
                  </a>
                ) : (
                  <button
                    disabled={isCurrent || !!checkingOut}
                    onClick={() => !isCurrent && handleSelectPlan(plan.key)}
                    style={{ width: '100%', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.65rem', borderRadius: '2px', border: isCurrent ? 'none' : '1px solid #87CEBF', background: isCurrent ? '#87CEBF' : 'transparent', color: isCurrent ? 'white' : '#87CEBF', cursor: isCurrent || checkingOut ? 'default' : 'pointer', opacity: checkingOut && !isLoading ? 0.5 : 1 }}
                  >
                    {isCurrent ? 'Current Plan' : isLoading ? 'Redirecting...' : 'Select Plan'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Class Packs */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={sectionLabel}>Class Packs</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {CLASS_PACKS.map(pack => {
            const isLoading = checkingOut === pack.key
            return (
              <div key={pack.key} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#87CEBF', marginBottom: '0.75rem' }}>{pack.name}</p>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.6rem', color: '#1a1a1a', lineHeight: 1 }}>{pack.price}</span>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', marginLeft: '0.35rem' }}>{pack.priceNote}</span>
                </div>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#808282', flex: 1, marginBottom: '1.25rem' }}>{pack.description}</p>
                <button
                  disabled={!!checkingOut}
                  onClick={() => handleSelectPlan(pack.key)}
                  style={{ width: '100%', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.65rem', borderRadius: '2px', border: '1px solid #87CEBF', background: 'transparent', color: '#87CEBF', cursor: checkingOut ? 'default' : 'pointer', opacity: checkingOut && !isLoading ? 0.5 : 1 }}
                >
                  {isLoading ? 'Redirecting...' : 'Purchase'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Amenity Packs */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={sectionLabel}>Amenity Packs</p>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#aaa', marginBottom: '1.25rem' }}>
          Sauna · Cold Plunge · Contrast Therapy — credits work across all amenity sessions.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {AMENITY_PACKS.map(pack => {
            const isLoading = checkingOut === pack.key
            return (
              <div key={pack.key} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#87CEBF', marginBottom: '0.75rem' }}>{pack.name}</p>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.6rem', color: '#1a1a1a', lineHeight: 1 }}>{pack.price}</span>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', marginLeft: '0.35rem' }}>{pack.priceNote}</span>
                </div>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#808282', flex: 1, marginBottom: '1.25rem' }}>{pack.description}</p>
                <button
                  disabled={!!checkingOut}
                  onClick={() => handleSelectPlan(pack.key)}
                  style={{ width: '100%', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.65rem', borderRadius: '2px', border: '1px solid #87CEBF', background: 'transparent', color: '#87CEBF', cursor: checkingOut ? 'default' : 'pointer', opacity: checkingOut && !isLoading ? 0.5 : 1 }}
                >
                  {isLoading ? 'Redirecting...' : 'Purchase'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa', marginTop: '1rem' }}>
        HSA & FSA accepted · Questions? <a href="mailto:info@marathonpilates.com" style={{ color: '#87CEBF', textDecoration: 'none' }}>info@marathonpilates.com</a>
      </p>
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
