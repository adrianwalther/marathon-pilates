'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const SESSION_TYPES = [
  { value: 'private_solo', label: 'Solo', desc: '1-on-1 with your instructor' },
  { value: 'private_duet', label: 'Duet', desc: 'You + 1 friend' },
  { value: 'private_trio', label: 'Trio', desc: 'You + 2 friends' },
]

const LOCATIONS = [
  { value: 'charlotte_park', label: 'Charlotte Park' },
  { value: 'green_hills', label: 'Green Hills' },
  { value: 'no_preference', label: 'No Preference' },
]

const FOCUS_AREAS = [
  'Full Body', 'Core & Stability', 'Hip Mobility', 'Spinal Health',
  'Strength', 'Flexibility', 'Back Care', 'Posture', 'Pre/Postnatal',
  'Injury Recovery', 'Athletic Performance', 'Beginner Foundations',
]

const PREFERRED_TIMES = [
  'Monday mornings', 'Monday afternoons', 'Monday evenings',
  'Tuesday mornings', 'Tuesday afternoons', 'Tuesday evenings',
  'Wednesday mornings', 'Wednesday afternoons', 'Wednesday evenings',
  'Thursday mornings', 'Thursday afternoons', 'Thursday evenings',
  'Friday mornings', 'Friday afternoons', 'Friday evenings',
  'Saturday mornings', 'Saturday afternoons',
  'Sunday mornings', 'Sunday afternoons',
]

const pillStyle = (active: boolean, color = '#87CEBF') => ({
  fontFamily: "'Raleway', sans-serif",
  fontWeight: 700,
  fontSize: '0.65rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  padding: '0.4rem 1rem',
  borderRadius: '2px',
  border: active ? 'none' : '1px solid #e0e0e0',
  background: active ? color : 'white',
  color: active ? 'white' : '#808282',
  cursor: 'pointer',
})

const labelStyle = {
  fontFamily: "'Raleway', sans-serif",
  fontWeight: 700,
  fontSize: '0.62rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: '#808282',
  marginBottom: '0.75rem',
  display: 'block',
}

export default function BookPrivatePage() {
  const router = useRouter()
  const [sessionType, setSessionType] = useState('private_solo')
  const [location, setLocation] = useState('no_preference')
  const [preferredTimes, setPreferredTimes] = useState<string[]>([])
  const [focusArea, setFocusArea] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleTime = (t: string) =>
    setPreferredTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleSubmit = async () => {
    if (preferredTimes.length === 0) { setError('Please select at least one preferred time.'); return }
    setSubmitting(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: insertError } = await supabase.from('private_session_requests').insert({
      client_id: user.id,
      session_type: sessionType,
      location,
      preferred_dates: preferredTimes,
      focus_area: focusArea || null,
      notes: notes.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
    } else {
      router.push('/dashboard/bookings?tab=requests&submitted=1')
    }
  }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '720px' }}>
      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '0.4rem' }}>
        Request a Private
      </h1>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#808282', marginBottom: '2.5rem' }}>
        Our team will reach out within 24 hours to confirm your session.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Session type */}
        <div>
          <span style={labelStyle}>Session Type</span>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {SESSION_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setSessionType(t.value)}
                style={{
                  ...pillStyle(sessionType === t.value),
                  padding: '0.75rem 1.5rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem',
                  textAlign: 'left',
                }}
              >
                <span>{t.label}</span>
                <span style={{ fontWeight: 400, fontSize: '0.6rem', letterSpacing: '0.04em', textTransform: 'none', opacity: 0.8 }}>
                  {t.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <span style={labelStyle}>Location</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {LOCATIONS.map(l => (
              <button key={l.value} onClick={() => setLocation(l.value)} style={pillStyle(location === l.value)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred times */}
        <div>
          <span style={labelStyle}>
            Preferred Times <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: '0.04em', color: '#aaa' }}>— select all that work</span>
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {PREFERRED_TIMES.map(t => (
              <button key={t} onClick={() => toggleTime(t)} style={{ ...pillStyle(preferredTimes.includes(t)), fontSize: '0.6rem', padding: '0.35rem 0.8rem' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Focus area */}
        <div>
          <span style={labelStyle}>
            Focus Area <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: '0.04em', color: '#aaa' }}>— optional</span>
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {FOCUS_AREAS.map(f => (
              <button key={f} onClick={() => setFocusArea(focusArea === f ? '' : f)} style={{ ...pillStyle(focusArea === f), fontSize: '0.6rem', padding: '0.35rem 0.8rem' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <span style={labelStyle}>
            Notes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: '0.04em', color: '#aaa' }}>— injuries, goals, questions</span>
          </span>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anything we should know before your session..."
            rows={4}
            style={{
              width: '100%', boxSizing: 'border-box',
              fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#1a1a1a',
              border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.85rem 1rem',
              resize: 'vertical', outline: 'none', lineHeight: 1.6,
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.82rem', color: '#e05555' }}>{error}</p>
        )}

        {/* Submit */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase',
              padding: '0.85rem 2.5rem', border: 'none', borderRadius: '2px',
              background: submitting ? '#b0ddd6' : '#87CEBF', color: 'white',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
          <button
            onClick={() => router.back()}
            style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.85rem 1.5rem', border: '1px solid #e0e0e0', borderRadius: '2px', background: 'white', color: '#808282', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
