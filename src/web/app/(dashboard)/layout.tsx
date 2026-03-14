'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const nav = [
  { href: '/dashboard', label: 'Home', icon: '⊡' },
  { href: '/dashboard/schedule', label: 'Schedule', icon: '◷' },
  { href: '/dashboard/bookings', label: 'My Bookings', icon: '◈' },
  { href: '/dashboard/on-demand', label: 'On Demand', icon: '▷' },
  { href: '/dashboard/membership', label: 'Membership', icon: '◆' },
  { href: '/dashboard/gift-cards', label: 'Gift Cards', icon: '◇' },
  { href: '/dashboard/account', label: 'Account', icon: '○' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string } | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', data.user.id)
        .single()
      if (profile) setUser(profile)
    })
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f9f8f6' }}>
      {/* Sidebar — desktop */}
      <aside
        className="hidden lg:flex flex-col w-64 min-h-screen"
        style={{ background: '#1a1a1a', position: 'fixed', top: 0, left: 0, bottom: 0 }}
      >
        {/* Logo */}
        <div style={{ padding: '2rem 1.75rem 1.5rem' }}>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.3rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'white' }}>
            Marathon
          </span>
          <br />
          <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#87CEBF' }}>
            Pilates
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.5rem 0' }}>
          {nav.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.75rem',
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: active ? '#87CEBF' : '#888',
                  textDecoration: 'none',
                  borderLeft: active ? '2px solid #87CEBF' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '1rem', opacity: 0.8 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        {user && (
          <div style={{ padding: '1.5rem 1.75rem', borderTop: '1px solid #2a2a2a' }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.82rem', color: 'white', marginBottom: '0.15rem' }}>
              {user.first_name} {user.last_name}
            </p>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#555', marginBottom: '0.75rem' }}>
              {user.email}
            </p>
            <button
              onClick={handleSignOut}
              style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4"
        style={{ background: '#1a1a1a' }}
      >
        <div>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.1rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'white' }}>Marathon </span>
          <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#87CEBF' }}>Pilates</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem' }}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 flex flex-col pt-16"
          style={{ background: '#1a1a1a' }}
        >
          <nav style={{ flex: 1, paddingTop: '1rem' }}>
            {nav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: pathname === item.href ? '#87CEBF' : '#888', textDecoration: 'none' }}
              >
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
          </nav>
          <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #2a2a2a' }}>
            <button onClick={handleSignOut} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
