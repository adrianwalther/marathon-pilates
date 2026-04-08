'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const GOALS = [
  'Build strength',
  'Improve flexibility',
  'Recovery & rehab',
  'Stress relief',
  'Posture & alignment',
  'Weight management',
  'Athletic performance',
]

const HEAR_ABOUT = [
  'Instagram',
  'Google',
  'Friend or family',
  'Existing client',
  'Walk by / Drive by',
  'Other',
]

const labelStyle = {
  fontFamily: "'Raleway', sans-serif",
  fontWeight: 700,
  fontSize: '0.65rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
  color: '#808282',
  display: 'block',
  marginBottom: '0.5rem',
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1px solid #e0e0e0',
  borderRadius: '2px',
  fontSize: '0.88rem',
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 300,
  outline: 'none',
  background: 'white',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1
  const [experience, setExperience] = useState('')
  const [goals, setGoals] = useState<string[]>([])

  // Step 2
  const [healthNotes, setHealthNotes] = useState('')
  const [isPregnant, setIsPregnant] = useState<boolean | null>(null)
  const [hasInjury, setHasInjury] = useState<boolean | null>(null)

  // Step 3
  const [location, setLocation] = useState('')
  const [hearAbout, setHearAbout] = useState('')

  const toggleGoal = (g: string) => {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  const handleFinish = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Build health_conditions array
    const healthConditions: string[] = []
    if (isPregnant) healthConditions.push('prenatal')
    if (hasInjury && healthNotes) healthConditions.push('injury_noted')

    // Polestar traffic light
    const trafficLight = isPregnant || hasInjury ? 'yellow' : 'green'

    // Include health notes in conditions array if provided
    if (hasInjury && healthNotes) healthConditions.push(`note: ${healthNotes}`)

    await supabase.from('profiles').update({
      experience_level: experience,
      goals,
      health_conditions: healthConditions,
      polestar_traffic_light: trafficLight,
      preferred_location: location || null,
      hear_about_us: hearAbout || null,
      intake_completed_at: new Date().toISOString(),
    }).eq('id', user.id)

    router.push('/dashboard')
  }

  const pillBtn = (active: boolean) => ({
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700,
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    padding: '0.55rem 1.1rem',
    borderRadius: '2px',
    border: active ? 'none' : '1px solid #e0e0e0',
    background: active ? '#87CEBF' : 'white',
    color: active ? 'white' : '#808282',
    cursor: 'pointer',
  })

  const yesNoBtn = (val: boolean, current: boolean | null) => ({
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700,
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    padding: '0.65rem 2rem',
    borderRadius: '2px',
    border: current === val ? 'none' : '1px solid #e0e0e0',
    background: current === val ? '#1a1a1a' : 'white',
    color: current === val ? 'white' : '#808282',
    cursor: 'pointer',
  })

  const primaryBtn = {
    background: '#87CEBF',
    color: 'white',
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700,
    fontSize: '0.75rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    padding: '0.875rem 2.5rem',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
  }

  const backBtn = {
    background: 'none',
    color: '#808282',
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 600,
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    padding: '0.875rem 1.5rem',
    border: '1px solid #e0e0e0',
    borderRadius: '2px',
    cursor: 'pointer',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '3rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= step ? '#87CEBF' : '#e0e0e0', transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Step 1 — Experience + Goals */}
        {step === 1 && (
          <div>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#87CEBF', marginBottom: '0.75rem' }}>
              Step 1 of 3
            </p>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1a1a1a', lineHeight: 1.2, marginBottom: '0.5rem' }}>
              Let&apos;s get to know you
            </h2>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#808282', marginBottom: '2.5rem' }}>
              This helps us personalize your experience.
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <label style={labelStyle}>Pilates experience</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[
                  { value: 'new_to_pilates', label: "Brand new" },
                  { value: 'less_than_1yr', label: "< 1 year" },
                  { value: '1_to_3_yrs', label: "1–3 years" },
                  { value: '3_plus_yrs', label: "3+ years" },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setExperience(opt.value)} style={pillBtn(experience === opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <label style={labelStyle}>Your goals (select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {GOALS.map(g => (
                  <button key={g} onClick={() => toggleGoal(g)} style={pillBtn(goals.includes(g))}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!experience || goals.length === 0}
              style={{ ...primaryBtn, opacity: (!experience || goals.length === 0) ? 0.5 : 1, cursor: (!experience || goals.length === 0) ? 'not-allowed' : 'pointer' }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2 — Health */}
        {step === 2 && (
          <div>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#87CEBF', marginBottom: '0.75rem' }}>
              Step 2 of 3
            </p>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1a1a1a', lineHeight: 1.2, marginBottom: '0.5rem' }}>
              Health &amp; safety
            </h2>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#808282', marginBottom: '2.5rem' }}>
              Your instructor reviews this before class. Everything stays private.
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <label style={labelStyle}>Are you currently pregnant or postpartum?</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setIsPregnant(true)} style={yesNoBtn(true, isPregnant)}>Yes</button>
                <button onClick={() => setIsPregnant(false)} style={yesNoBtn(false, isPregnant)}>No</button>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={labelStyle}>Any injuries, surgeries, or health conditions?</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <button onClick={() => setHasInjury(true)} style={yesNoBtn(true, hasInjury)}>Yes</button>
                <button onClick={() => setHasInjury(false)} style={yesNoBtn(false, hasInjury)}>No</button>
              </div>
              {hasInjury && (
                <textarea
                  value={healthNotes}
                  onChange={e => setHealthNotes(e.target.value)}
                  placeholder="Brief description — your instructor will follow up..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => (e.target.style.borderColor = '#87CEBF')}
                  onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setStep(1)} style={backBtn}>Back</button>
              <button
                onClick={() => setStep(3)}
                disabled={isPregnant === null || hasInjury === null}
                style={{ ...primaryBtn, opacity: (isPregnant === null || hasInjury === null) ? 0.5 : 1, cursor: (isPregnant === null || hasInjury === null) ? 'not-allowed' : 'pointer' }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Preferences */}
        {step === 3 && (
          <div>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#87CEBF', marginBottom: '0.75rem' }}>
              Step 3 of 3
            </p>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1a1a1a', lineHeight: 1.2, marginBottom: '0.5rem' }}>
              Almost there
            </h2>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#808282', marginBottom: '2.5rem' }}>
              Last few quick questions.
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <label style={labelStyle}>Preferred studio location</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[
                  { value: 'charlotte_park', label: 'Charlotte Park', note: null },
                  { value: 'green_hills', label: 'Green Hills', note: 'Privates only' },
                  { value: '', label: 'No preference', note: null },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setLocation(opt.value)} style={pillBtn(location === opt.value)}>
                    {opt.label}
                    {opt.note && (
                      <span style={{ display: 'block', fontSize: '0.55rem', letterSpacing: '0.08em', opacity: 0.75, marginTop: '0.1rem' }}>
                        {opt.note}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <label style={labelStyle}>How did you hear about us?</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {HEAR_ABOUT.map(opt => (
                  <button key={opt} onClick={() => setHearAbout(opt)} style={pillBtn(hearAbout === opt)}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setStep(2)} style={backBtn}>Back</button>
              <button
                onClick={handleFinish}
                disabled={saving}
                style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving...' : "Let's go →"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
