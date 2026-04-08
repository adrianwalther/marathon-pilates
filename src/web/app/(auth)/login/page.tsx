'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Logo from '@/components/ui/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f9f8f6' }}>
      {/* Left panel — looping hero video */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-16">
        {/*
          Replace the src below with actual studio footage from Ruby.
          Recommended: 30–60s loop, 1080p, shot at Charlotte Park or Green Hills.
          Encode as MP4 (H.264) + WebM for best browser compatibility.
        */}
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        >
          {/* TODO: Replace with real studio footage */}
          <source src="/videos/hero-loop.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay — keeps text legible over any footage */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.65) 100%)',
            zIndex: 1,
          }}
        />

        {/* Content sits above video + overlay */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Logo />
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 100,
              fontSize: '2.8rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'white',
              lineHeight: 1.2,
            }}
          >
            Move +<br />Restore
          </p>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 300,
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.6)',
              marginTop: '1rem',
              letterSpacing: '0.04em',
            }}
          >
            Charlotte Park · Green Hills
          </p>
        </div>
        <p
          style={{
            position: 'relative',
            zIndex: 2,
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 300,
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.04em',
          }}
        >
          Nashville, TN
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="max-w-sm w-full mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 flex justify-center">
            <Logo />
          </div>

          <h1
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 100,
              fontSize: '1.8rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#1a1a1a',
              marginBottom: '0.5rem',
            }}
          >
            Welcome Back
          </h1>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 300,
              fontSize: '0.85rem',
              color: '#808282',
              marginBottom: '2.5rem',
              letterSpacing: '0.02em',
            }}
          >
            Sign in to your account
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#808282',
                  display: 'block',
                  marginBottom: '0.4rem',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '2px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: 'white',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#87CEBF')}
                onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
              />
            </div>

            <div>
              <label
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#808282',
                  display: 'block',
                  marginBottom: '0.4rem',
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '2px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: 'white',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#87CEBF')}
                onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
              />
            </div>

            <div style={{ textAlign: 'right' }}>
              <Link
                href="/forgot-password"
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  letterSpacing: '0.08em',
                  color: '#87CEBF',
                  textDecoration: 'none',
                }}
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#e05555',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 300,
                }}
              >
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 300,
              fontSize: '0.82rem',
              color: '#808282',
              marginTop: '2rem',
              textAlign: 'center',
            }}
          >
            New to Marathon Pilates?{' '}
            <Link
              href="/signup"
              style={{
                color: '#87CEBF',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
