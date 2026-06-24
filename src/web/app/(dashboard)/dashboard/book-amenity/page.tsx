'use client'

import { pageStyle } from '@/lib/pageStyle'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { pickUsableCredit, creditTypeFor } from '@/lib/credits'

const AMENITY_LABELS: Record<string, string> = {
  sauna: 'Infrared Sauna',
  cold_plunge: 'Cold Plunge',
  contrast_therapy: 'Contrast Therapy',
}

const AMENITY_DESCRIPTIONS: Record<string, string> = {
  sauna: 'A deeply restorative infrared sauna session. Arrive 5 minutes early.',
  cold_plunge: 'An invigorating cold water immersion. Towels provided.',
  contrast_therapy: 'The full experience — infrared sauna followed by cold plunge. The ultimate recovery session.',
}

type Slot = {
  starts_at: string
  ends_at: string
  capacity: number
  booked: number
}

function buildDays(count = 14): { label: string; short: string; value: string }[] {
  const days = []
  for (let i = 1; i <= count; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    days.push({
      label: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      short: d.toLocaleDateString('en-US', { weekday: 'short' }),
      value: d.toISOString().split('T')[0],
    })
  }
  return days
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function BookAmenityInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams.get('type') ?? 'sauna'

  const days = buildDays(14)
  const [selectedDay, setSelectedDay] = useState(days[0].value)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [booking, setBooking] = useState<string | null>(null) // starts_at of slot being booked
  const [creditId, setCreditId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [confirmed, setConfirmed] = useState<{ starts_at: string } | null>(null)
  const [sessionDuration, setSessionDuration] = useState(50)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Load credit for this amenity type on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const creditType = creditTypeFor(type)
      if (!creditType) return
      const { data: credits } = await supabase
        .from('credits')
        .select('id, total_credits, used_credits')
        .eq('client_id', data.user.id)
        .eq('credit_type', creditType)
        .order('expires_at', { ascending: true, nullsFirst: false })
      const usable = pickUsableCredit(credits)
      if (usable) setCreditId(usable.id)
    })
  }, [type])

  // Load slots when day changes
  useEffect(() => {
    setSlots([])
    setLoadingSlots(true)
    fetch(`/api/amenity-slots?type=${type}&date=${selectedDay}`)
      .then(r => r.json())
      .then(d => {
        setSlots(d.slots ?? [])
        if (d.rule?.session_duration_minutes) setSessionDuration(d.rule.session_duration_minutes)
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [type, selectedDay])

  const handleBook = async (slot: Slot) => {
    setBooking(slot.starts_at)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/bookings/amenity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: session ? `Bearer ${session.access_token}` : '',
      },
      body: JSON.stringify({
        session_type: type,
        starts_at: slot.starts_at,
        credit_id: creditId,
      }),
    })
    const result = await res.json().catch(() => ({}))

    if (!res.ok) {
      showToast(result.error || 'Could not complete booking', 'error')
    } else {
      setConfirmed({ starts_at: slot.starts_at })
    }
    setBooking(null)
  }

  const labelStyle = {
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700 as const,
    fontSize: '0.6rem',
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-text-muted)',
  }

  if (!(type in AMENITY_LABELS)) {
    return (
      <div style={pageStyle(700)}>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, color: '#aaa' }}>Unknown amenity type.</p>
      </div>
    )
  }

  // Booking confirmed screen
  if (confirmed) {
    const d = new Date(confirmed.starts_at)
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const timeStr = formatTime(confirmed.starts_at)
    return (
      <div style={{ ...pageStyle(500), textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text)', marginBottom: '0.5rem' }}>
          You&rsquo;re booked.
        </h1>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
          {AMENITY_LABELS[type]}
        </p>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.15rem' }}>
          {dateStr} · {timeStr}
        </p>
        <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', marginBottom: '2rem' }}>
          Charlotte Park · {sessionDuration} min
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.85rem 2.5rem', background: 'var(--color-text)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div style={pageStyle(750)}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: toast.type === 'success' ? 'var(--color-text)' : '#e05555', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={labelStyle}>Book a Session</p>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text)', margin: '0.4rem 0 0.6rem' }}>
          {AMENITY_LABELS[type]}
        </h1>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.7, maxWidth: '480px' }}>
          {AMENITY_DESCRIPTIONS[type]}
        </p>
        {!creditId && (
          <div style={{ marginTop: '1rem', background: '#fff8e6', border: '1px solid #f0ddb0', borderRadius: '2px', padding: '0.75rem 1rem', display: 'inline-block' }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#7a5a00', margin: 0 }}>
              No amenity credits on file. <a href="/dashboard/membership" style={{ color: '#c8860a', fontWeight: 500 }}>Add a pack →</a>
            </p>
          </div>
        )}
      </div>

      {/* Day selector */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ ...labelStyle, marginBottom: '0.75rem' }}>Choose a Date</p>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {days.map(d => (
            <button
              key={d.value}
              onClick={() => setSelectedDay(d.value)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '0.6rem 0.85rem', borderRadius: '2px', border: 'none', cursor: 'pointer', flexShrink: 0,
                background: selectedDay === d.value ? 'var(--color-text)' : 'white',
                outline: selectedDay === d.value ? 'none' : '1px solid #eee',
              }}
            >
              <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: selectedDay === d.value ? 'var(--color-cta)' : '#aaa' }}>
                {d.short}
              </span>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: selectedDay === d.value ? 400 : 100, fontSize: '1.1rem', color: selectedDay === d.value ? 'white' : 'var(--color-text)', lineHeight: 1.3 }}>
                {new Date(d.value + 'T12:00:00').getDate()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Slot grid */}
      <div>
        <p style={{ ...labelStyle, marginBottom: '0.75rem' }}>Available Times</p>

        {loadingSlots ? (
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#aaa' }}>Loading...</p>
        ) : slots.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#aaa', margin: 0 }}>
              No availability on this day. Try another date.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.6rem' }}>
            {slots.map(slot => {
              const isBooking = booking === slot.starts_at
              const spotsLeft = slot.capacity - slot.booked
              return (
                <button
                  key={slot.starts_at}
                  onClick={() => handleBook(slot)}
                  disabled={isBooking || !creditId}
                  style={{
                    background: isBooking ? '#f5ece6' : 'white',
                    border: `1px solid ${isBooking ? 'var(--color-cta)' : '#eee'}`,
                    borderRadius: '2px',
                    padding: '1rem',
                    cursor: isBooking || !creditId ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => { if (!isBooking && creditId) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-cta)' }}
                  onMouseLeave={e => { if (!isBooking) (e.currentTarget as HTMLButtonElement).style.borderColor = '#eee' }}
                >
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text)', margin: '0 0 0.25rem' }}>
                    {formatTime(slot.starts_at)}
                  </p>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: spotsLeft <= 1 ? '#c8860a' : 'var(--color-text-muted)', margin: 0 }}>
                    {isBooking ? 'Booking...' : spotsLeft === 1 ? '1 spot left' : `${spotsLeft} spots`}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', marginTop: '2rem', lineHeight: 1.6 }}>
        Bookings must be made at least 24 hours in advance · Charlotte Park only · {sessionDuration}-minute sessions
      </p>
    </div>
  )
}

export default function BookAmenityPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem 2.5rem' }}><p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p></div>}>
      <BookAmenityInner />
    </Suspense>
  )
}
