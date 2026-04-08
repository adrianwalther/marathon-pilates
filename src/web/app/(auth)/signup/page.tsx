'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Logo from '@/components/ui/Logo'

export default function SignupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Insert profile row
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        role: 'client',
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #e0e0e0',
    borderRadius: '2px',
    fontSize: '0.9rem',
    outline: 'none',
    background: 'white',
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 600,
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#808282',
    display: 'block',
    marginBottom: '0.4rem',
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9f8f6' }}>
        <div className="text-center max-w-sm px-8">
          <Logo className="mx-auto mb-8" />
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Check Your Email
          </h1>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#808282', lineHeight: 1.7 }}>
            We sent a confirmation link to <strong style={{ color: '#1a1a1a' }}>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/login" style={{ display: 'inline-block', marginTop: '2rem', color: '#87CEBF', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f9f8f6' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16" style={{ background: '#1a1a1a' }}>
        <Logo />
        <div>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2.8rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'white', lineHeight: 1.2 }}>
            Your journey<br />starts here
          </p>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#808282', marginTop: '1rem', letterSpacing: '0.04em' }}>
            HSA & FSA accepted
          </p>
        </div>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#555', letterSpacing: '0.04em' }}>
          Nashville, TN
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="max-w-sm w-full mx-auto">
          <div className="lg:hidden mb-10 flex justify-center">
            <Logo />
          </div>

          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '0.5rem' }}>
            Create Account
          </h1>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#808282', marginBottom: '2.5rem', letterSpacing: '0.02em' }}>
            Join Marathon Pilates
          </p>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label style={labelStyle}>First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  placeholder="Ruby"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#87CEBF')}
                  onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
                />
              </div>
              <div className="flex-1">
                <label style={labelStyle}>Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                  placeholder="Ramdhan"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#87CEBF')}
                  onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#87CEBF')}
                onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#87CEBF')}
                onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
              />
            </div>

            {error && (
              <p style={{ fontSize: '0.8rem', color: '#e05555', fontFamily: "'Poppins', sans-serif", fontWeight: 300 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#b0ddd6' : '#87CEBF',
                color: 'white',
                fontFamily: "'Raleway', sans-serif",
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '0.875rem',
                border: 'none',
                borderRadius: '2px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                marginTop: '0.5rem',
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#aaa', marginTop: '1.5rem', lineHeight: 1.6 }}>
            By creating an account you agree to our{' '}
            <Link href="/terms" style={{ color: '#87CEBF', textDecoration: 'none' }}>Terms</Link>{' '}
            and{' '}
            <Link href="/privacy" style={{ color: '#87CEBF', textDecoration: 'none' }}>Privacy Policy</Link>.
          </p>

          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#808282', marginTop: '2rem', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#87CEBF', fontWeight: 500, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
