'use client'

import { pageStyle } from '@/lib/pageStyle'
import { useState } from 'react'

export default function BookNeveskinPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [preferred, setPreferred] = useState('')
  const [notes, setNotes] = useState('')
  const [sent, setSent] = useState(false)

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #e0e0e0',
    borderRadius: '2px',
    fontSize: '0.88rem',
    fontFamily: "'Poppins', sans-serif",
    background: 'white',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block' as const,
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700 as const,
    fontSize: '0.6rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-text-muted)',
    marginBottom: '0.4rem',
  }

  const handleSubmit = () => {
    const subject = encodeURIComponent('Neveskin Appointment Request')
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nPreferred time: ${preferred}\n\nNotes:\n${notes}`
    )
    window.location.href = `mailto:ruby@marathonpilates.com?subject=${subject}&body=${body}`
    setSent(true)
  }

  const labelStr = {
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700 as const,
    fontSize: '0.6rem',
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-text-muted)',
  }

  if (sent) {
    return (
      <div style={{ ...pageStyle(500), textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text)', marginBottom: '0.5rem' }}>
          Request sent.
        </h1>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          Ruby will reach out within 24 hours to confirm your Neveskin appointment.
        </p>
      </div>
    )
  }

  return (
    <div style={pageStyle(600)}>
      <p style={labelStr}>Request an Appointment</p>
      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text)', margin: '0.4rem 0 0.6rem' }}>
        Neveskin
      </h1>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.75, marginBottom: '2rem', maxWidth: '480px' }}>
        Non-invasive body contouring with a temperature-controlled massage wand. 30-minute sessions, no downtime, results visible from session one.
        Ruby will personally reach out to schedule your appointment.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={labelStyle}>Your Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-cta)')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--color-cta)')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(615) 555-0123" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--color-cta)')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Preferred Date & Time</label>
          <input value={preferred} onChange={e => setPreferred(e.target.value)} placeholder="e.g. Tuesdays after 2pm, any morning this week" style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-cta)')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
        </div>
        <div>
          <label style={labelStyle}>Notes <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Areas of focus, questions, anything else..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={e => (e.target.style.borderColor = 'var(--color-cta)')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name || !email}
          style={{ alignSelf: 'flex-start', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.85rem 2.5rem', background: !name || !email ? '#ccc' : 'var(--color-cta)', color: 'white', border: 'none', borderRadius: '2px', cursor: !name || !email ? 'not-allowed' : 'pointer' }}>
          Send Request →
        </button>

        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', lineHeight: 1.6 }}>
          Your request goes directly to Ruby. She&rsquo;ll confirm your appointment within 24 hours.
        </p>
      </div>
    </div>
  )
}
