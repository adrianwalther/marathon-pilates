'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const nav = [
  { href: '/admin', label: 'Overview', icon: '⊡' },
  { href: '/admin/schedule', label: 'Schedule', icon: '◷' },
  { href: '/admin/clients', label: 'Clients', icon: '◈' },
  { href: '/admin/payroll', label: 'Payroll', icon: '◆' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [adminName, setAdminName] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, role')
        .eq('id', data.user.id)
        .single()
      if (!profile || !['admin', 'instructor'].includes(profile.role)) {
        router.push('/dashboard')
        return
      }
      setAdminName(profile.first_name)
      setChecking(false)
    })
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (checking) return null

  return (
    <div className="min-h-screen flex" style={{ background: '#f9f8f6' }}>
      <aside className="hidden lg:flex flex-col w-64 min-h-screen" style={{ background: '#1a1a1a', position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: '2rem 1.75rem 1rem' }}>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.3rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'white' }}>Marathon</span>
          <br />
          <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#87CEBF' }}>Pilates</span>
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '2px', background: '#87CEBF', color: 'white' }}>Admin</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0.5rem 0' }}>
          {nav.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.75rem', fontFamily: "'Raleway', sans-serif", fontWeight: active ? 700 : 500, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? '#87CEBF' : '#888', textDecoration: 'none', borderLeft: active ? '2px solid #87CEBF' : '2px solid transparent' }}>
                <span style={{ fontSize: '1rem', opacity: 0.8 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
          <div style={{ margin: '1rem 1.75rem', borderTop: '1px solid #2a2a2a' }} />
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.75rem', fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', textDecoration: 'none' }}>
            ← Client View
          </Link>
        </nav>

        <div style={{ padding: '1.5rem 1.75rem', borderTop: '1px solid #2a2a2a' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.82rem', color: 'white', marginBottom: '0.5rem' }}>{adminName}</p>
          <button onClick={handleSignOut} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64">{children}</main>
    </div>
  )
}
