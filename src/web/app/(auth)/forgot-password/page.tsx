'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Logo from '@/components/ui/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-8" style={{ background: '#f9f8f6' }}>
      <div className="max-w-sm w-full">
        <div className="flex justify-center mb-10">
          <Logo />
        </div>

        {sent ? (
          <div className="text-center">
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Email Sent
            </h1>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#808282', lineHeight: 1.7 }}>
              Check your inbox for a password reset link.
            </p>
            <Link href="/login" style={{ display: 'inline-block', marginTop: '2rem', color: '#87CEBF', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none' }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '0.5rem' }}>
              Reset Password
            </h1>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#808282', marginBottom: '2.5rem' }}>
              Enter your email and we'll send a reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#808282', display: 'block', marginBottom: '0.4rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e0e0e0', borderRadius: '2px', fontSize: '0.9rem', outline: 'none', background: 'white' }}
                  onFocus={e => (e.target.style.borderColor = '#87CEBF')}
                  onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
                />
              </div>

              {error && <p style={{ fontSize: '0.8rem', color: '#e05555' }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{ background: loading ? '#b0ddd6' : '#87CEBF', color: 'white', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.875rem', border: 'none', borderRadius: '2px', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link href="/login" style={{ color: '#87CEBF', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
