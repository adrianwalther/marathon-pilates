'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function BetaGateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/beta-gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push(next)
    } else {
      setError('Incorrect password. Contact the studio for access.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Poppins', sans-serif",
      padding: '24px',
    }}>
      {/* Logo mark */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #87CEBF 0%, #6ab8a8 100%)',
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4"/>
          </svg>
        </div>
        <p style={{ color: '#87CEBF', fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0 }}>
          Marathon Pilates
        </p>
        <p style={{ color: '#555', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '6px 0 0' }}>
          Beta Access
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: '#141414',
        border: '1px solid #222',
        borderRadius: 16,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 380,
      }}>
        <h1 style={{
          color: '#fff',
          fontSize: 20,
          fontWeight: 300,
          letterSpacing: '0.05em',
          margin: '0 0 8px',
          textTransform: 'uppercase',
        }}>
          Coming Soon
        </h1>
        <p style={{ color: '#666', fontSize: 13, margin: '0 0 28px', lineHeight: 1.6 }}>
          This platform is in private beta. Enter the access password to continue.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Beta password"
            required
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#0a0a0a',
              border: `1px solid ${error ? '#e53e3e' : '#333'}`,
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: error ? 8 : 20,
            }}
          />
          {error && (
            <p style={{ color: '#e53e3e', fontSize: 12, margin: '0 0 16px' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              padding: '13px',
              background: password && !loading ? '#87CEBF' : '#333',
              color: password && !loading ? '#0a0a0a' : '#666',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: password && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Verifying…' : 'Enter'}
          </button>
        </form>
      </div>

      <p style={{ color: '#333', fontSize: 11, marginTop: 32, letterSpacing: '0.1em' }}>
        MOVE + RESTORE
      </p>
    </div>
  )
}

export default function BetaGatePage() {
  return (
    <Suspense fallback={null}>
      <BetaGateForm />
    </Suspense>
  )
}
