'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Profile = {
  first_name: string
  last_name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  preferred_location: string | null
  health_conditions: string[] | null
  polestar_traffic_light: string
  intake_completed_at: string | null
}

const HEALTH_CONDITIONS = [
  { key: 'osteoporosis', label: 'Osteoporosis / Low bone density' },
  { key: 'prenatal', label: 'Pregnant / Prenatal' },
  { key: 'postnatal', label: 'Postnatal (within 6 months)' },
  { key: 'back_pain', label: 'Back pain / Herniated disc' },
  { key: 'knee', label: 'Knee injury or surgery' },
  { key: 'shoulder', label: 'Shoulder injury or surgery' },
  { key: 'hip', label: 'Hip injury or replacement' },
  { key: 'scoliosis', label: 'Scoliosis' },
  { key: 'hypertension', label: 'High blood pressure' },
  { key: 'cardiac', label: 'Cardiac condition' },
  { key: 'vertigo', label: 'Vertigo / Dizziness' },
  { key: 'fibromyalgia', label: 'Fibromyalgia / Chronic pain' },
]

const HIGH_RISK = ['cardiac', 'prenatal', 'osteoporosis']
const MODERATE_RISK = ['back_pain', 'hip', 'hypertension', 'vertigo']

function getTrafficLight(conditions: string[]): string {
  if (conditions.some(c => HIGH_RISK.includes(c))) return 'red'
  if (conditions.some(c => MODERATE_RISK.includes(c))) return 'yellow'
  return 'green'
}

const TRAFFIC_COLORS = {
  green:  { bg: '#e8f7f4', color: '#87CEBF', label: 'No restrictions noted' },
  yellow: { bg: '#fff8e6', color: '#c8860a', label: 'Modifications may apply' },
  red:    { bg: '#fef0f0', color: '#e05555', label: 'Instructor review recommended' },
}

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<'profile' | 'health' | 'preferences' | 'password'>('profile')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      if (prof) {
        setProfile(prof)
        setFirstName(prof.first_name ?? '')
        setLastName(prof.last_name ?? '')
        setPhone(prof.phone ?? '')
        setDob(prof.date_of_birth ?? '')
        setEmergencyName(prof.emergency_contact_name ?? '')
        setEmergencyPhone(prof.emergency_contact_phone ?? '')
        setPreferredLocation(prof.preferred_location ?? '')
        setSelectedConditions(prof.health_conditions ?? [])
        setExperienceLevel((prof as unknown as Record<string, string>).experience_level ?? '')
        setSelectedGoals((prof as unknown as Record<string, string[]>).goals ?? [])
      }
      setLoading(false)
    })
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles').update({
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      date_of_birth: dob || null,
      emergency_contact_name: emergencyName || null,
      emergency_contact_phone: emergencyPhone || null,
      preferred_location: preferredLocation || null,
    }).eq('id', user.id)

    if (error) showToast('Could not save changes', 'error')
    else showToast('Profile updated')
    setSaving(false)
  }

  const saveHealth = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const trafficLight = getTrafficLight(selectedConditions)
    const { error } = await supabase.from('profiles').update({
      health_conditions: selectedConditions,
      polestar_traffic_light: trafficLight,
      intake_completed_at: new Date().toISOString(),
    }).eq('id', user.id)

    if (error) showToast('Could not save health info', 'error')
    else showToast('Health information saved')
    setSaving(false)
  }

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { showToast('Passwords do not match', 'error'); return }
    if (newPassword.length < 8) { showToast('Password must be at least 8 characters', 'error'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) showToast(error.message, 'error')
    else { showToast('Password updated'); setNewPassword(''); setConfirmPassword('') }
    setSaving(false)
  }

  const savePreferences = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({
      experience_level: experienceLevel || null,
      goals: selectedGoals.length > 0 ? selectedGoals : null,
    } as unknown as Record<string, unknown>).eq('id', user.id)
    if (error) showToast('Could not save preferences', 'error')
    else showToast('Preferences saved')
    setSaving(false)
  }

  const toggleGoal = (g: string) => setSelectedGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  const toggleCondition = (key: string) => {
    setSelectedConditions(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    )
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #e0e0e0',
    borderRadius: '2px',
    fontSize: '0.88rem',
    outline: 'none',
    background: 'white',
    fontFamily: "'Poppins', sans-serif",
  }

  const labelStyle = {
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 600 as const,
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#808282',
    display: 'block',
    marginBottom: '0.4rem',
  }

  const sectionTabStyle = (active: boolean) => ({
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700 as const,
    fontSize: '0.7rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    padding: '0.6rem 1.25rem',
    borderRadius: '2px',
    border: 'none',
    background: active ? '#1a1a1a' : 'white',
    color: active ? 'white' : '#808282',
    cursor: 'pointer',
  })

  const trafficLight = profile ? TRAFFIC_COLORS[profile.polestar_traffic_light as keyof typeof TRAFFIC_COLORS] : TRAFFIC_COLORS.green

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '700px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: toast.type === 'success' ? '#1a1a1a' : '#e05555', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          {toast.msg}
        </div>
      )}

      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '2rem' }}>
        Account
      </h1>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveSection('profile')} style={sectionTabStyle(activeSection === 'profile')}>Profile</button>
        <button onClick={() => setActiveSection('health')} style={sectionTabStyle(activeSection === 'health')}>Health Info</button>
        <button onClick={() => setActiveSection('preferences')} style={sectionTabStyle(activeSection === 'preferences')}>Goals</button>
        <button onClick={() => setActiveSection('password')} style={sectionTabStyle(activeSection === 'password')}>Password</button>
      </div>

      {/* PROFILE */}
      {activeSection === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input value={profile?.email ?? ''} disabled style={{ ...inputStyle, background: '#f5f5f5', color: '#aaa' }} />
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', marginTop: '0.3rem' }}>Contact us to change your email</p>
          </div>

          <div>
            <label style={labelStyle}>Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(615) 555-0123" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
          </div>

          <div>
            <label style={labelStyle}>Date of Birth</label>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
          </div>

          <div>
            <label style={labelStyle}>Preferred Studio</label>
            <select value={preferredLocation} onChange={e => setPreferredLocation(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">No preference</option>
              <option value="charlotte_park">Charlotte Park</option>
              <option value="green_hills">Green Hills</option>
            </select>
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '1.25rem' }}>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#808282', marginBottom: '1rem' }}>
              Emergency Contact
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input value={emergencyName} onChange={e => setEmergencyName(e.target.value)} placeholder="Full name" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} placeholder="(615) 555-0123" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
              </div>
            </div>
          </div>

          <button onClick={saveProfile} disabled={saving} style={{ alignSelf: 'flex-start', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.75rem 2rem', background: saving ? '#b0ddd6' : '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* HEALTH */}
      {activeSection === 'health' && (
        <div>
          {/* Traffic light status */}
          <div style={{ background: trafficLight.bg, borderRadius: '2px', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: trafficLight.color }}>
                Health Status
              </p>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.8rem', color: '#808282', marginTop: '0.2rem' }}>
                {trafficLight.label}
              </p>
            </div>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: trafficLight.color, display: 'block' }} />
          </div>

          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#808282', marginBottom: '1.5rem', lineHeight: 1.7 }}>
            Select any conditions that apply. This helps your instructor provide safe, appropriate modifications.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
            {HEALTH_CONDITIONS.map(c => (
              <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: selectedConditions.includes(c.key) ? '#e8f7f4' : 'white', border: `1px solid ${selectedConditions.includes(c.key) ? '#87CEBF' : '#eee'}`, borderRadius: '2px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedConditions.includes(c.key)}
                  onChange={() => toggleCondition(c.key)}
                  style={{ accentColor: '#87CEBF', width: '16px', height: '16px' }}
                />
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#1a1a1a' }}>
                  {c.label}
                </span>
              </label>
            ))}
          </div>

          <button onClick={saveHealth} disabled={saving} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.75rem 2rem', background: saving ? '#b0ddd6' : '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : 'Save Health Info'}
          </button>

          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', marginTop: '1rem', lineHeight: 1.6 }}>
            This information is private and only shared with your instructor to ensure your safety.
          </p>
        </div>
      )}

      {/* PREFERENCES */}
      {activeSection === 'preferences' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>Pilates Experience</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[{ value: 'new_to_pilates', label: 'Brand new' }, { value: 'less_than_1yr', label: '< 1 year' }, { value: '1_to_3_yrs', label: '1–3 years' }, { value: '3_plus_yrs', label: '3+ years' }].map(opt => (
                <button key={opt.value} onClick={() => setExperienceLevel(opt.value)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 1.1rem', borderRadius: '2px', border: experienceLevel === opt.value ? 'none' : '1px solid #e0e0e0', background: experienceLevel === opt.value ? '#87CEBF' : 'white', color: experienceLevel === opt.value ? 'white' : '#808282', cursor: 'pointer' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>Your Goals</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Build strength', 'Improve flexibility', 'Recovery & rehab', 'Stress relief', 'Posture & alignment', 'Weight management', 'Athletic performance'].map(g => (
                <button key={g} onClick={() => toggleGoal(g)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 1.1rem', borderRadius: '2px', border: selectedGoals.includes(g) ? 'none' : '1px solid #e0e0e0', background: selectedGoals.includes(g) ? '#87CEBF' : 'white', color: selectedGoals.includes(g) ? 'white' : '#808282', cursor: 'pointer' }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button onClick={savePreferences} disabled={saving} style={{ alignSelf: 'flex-start', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.75rem 2rem', background: saving ? '#b0ddd6' : '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      )}

      {/* PASSWORD */}
      {activeSection === 'password' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '400px' }}>
          <div>
            <label style={labelStyle}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
          </div>
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
          </div>
          <button onClick={changePassword} disabled={saving} style={{ alignSelf: 'flex-start', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.75rem 2rem', background: saving ? '#b0ddd6' : '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      )}
    </div>
  )
}
