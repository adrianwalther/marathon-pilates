'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Logo from '@/components/ui/Logo'

// Landing page for the password-reset email link sent by forgot-password.
// The link (from resetPasswordForEmail with redirectTo=/reset-password) arrives
// with a PKCE `?code=`; the @supabase/ssr browser client auto-detects it, and a
// PASSWORD_RECOVERY auth event establishes a short-lived recovery session. We
// confirm that session exists, then let the user set a new password via
// updateUser(). If the link is missing/expired, we surface a clear message
// instead of a blank form that would fail on submit.
export default function ResetPasswordPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    let resolved = false

    // A recovery session may already be present (auto-detected from the URL),
    // or it may arrive a beat later via the PASSWORD_RECOVERY event. Listen for
    // both so we don't race the client's URL handling.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) {
        resolved = true
        setReady(true)
        setChecking(false)
      }
    })

    // Fallback: check for an existing session directly, in case the event
    // fired before this listener attached.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        resolved = true
        setReady(true)
        setChecking(false)
      } else {
        // Give the client a moment to process the URL code, then give up.
        setTimeout(() => {
          if (!resolved) {
            setChecking(false)
            setError('This reset link is invalid or has expired. Request a new one.')
          }
        }, 1500)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    // Recovery session is now a full session — send them into the app.
    setTimeout(() => router.push('/dashboard'), 1800)
  }

  const headingStyle = {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 100,
    fontSize: '1.8rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-text)',
    marginBottom: '0.5rem',
  }
  const subStyle = {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 300,
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
    lineHeight: 1.7,
    marginBottom: '2.5rem',
  }
  const labelStyle = {
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 600,
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-text-muted)',
    display: 'block',
    marginBottom: '0.4rem',
  }
  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #e0e0e0',
    borderRadius: '2px',
    fontSize: '0.9rem',
    outline: 'none',
    background: 'white',
  }
  const linkStyle = {
    color: 'var(--color-cta)',
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 600,
    fontSize: '0.75rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    textDecoration: 'none',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-8" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-sm w-full">
        <div className="flex justify-center mb-10">
          <Logo />
        </div>

        {checking ? (
          <p style={{ ...subStyle, marginBottom: 0, textAlign: 'center' }}>Verifying your reset link…</p>
        ) : done ? (
          <div className="text-center">
            <h1 style={headingStyle}>Password Updated</h1>
            <p style={{ ...subStyle, marginBottom: 0 }}>
              You're all set. Taking you to your dashboard…
            </p>
          </div>
        ) : ready ? (
          <>
            <h1 style={headingStyle}>Set a New Password</h1>
            <p style={subStyle}>Choose a new password for your account.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label style={labelStyle}>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-cta)')}
                  onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
                />
              </div>

              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-cta)')}
                  onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
                />
              </div>

              {error && <p style={{ fontSize: '0.8rem', color: '#e05555' }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{ background: loading ? 'var(--color-cta-disabled)' : 'var(--color-cta)', color: 'white', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.875rem', border: 'none', borderRadius: '2px', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <h1 style={headingStyle}>Link Expired</h1>
            <p style={subStyle}>{error || 'This reset link is invalid or has expired.'}</p>
            <Link href="/forgot-password" style={linkStyle}>
              Request a New Link
            </Link>
          </div>
        )}

        {!checking && !done && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/login" style={linkStyle}>
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
