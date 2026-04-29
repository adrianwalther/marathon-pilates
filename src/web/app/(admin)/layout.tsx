'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export type StaffRole = 'admin' | 'manager' | 'instructor' | 'front_desk'

// Role hierarchy (confirmed):
//   owner   → Ruby, Adrian    — full access incl. revenue (not yet implemented, uses 'admin' for now)
//   admin   → Jazz, Susan     — full operations, no raw revenue
//   manager → Front desk + sales staff — schedule view, client check-ins, bookings, CRM. No payroll. No revenue.
//   instructor → Trainers     — own schedule + own payroll view only
//   client  → Studio members  — dashboard only (handled by dashboard layout, not here)
//   (front_desk role retired — manager covers that function)

// What each role can access
export const ROLE_PERMISSIONS: Record<StaffRole, {
  overview: boolean
  schedule_view: boolean
  schedule_edit: boolean
  clients: boolean
  payroll_view: boolean
  payroll_edit: boolean
  revenue: boolean
}> = {
  admin: {
    overview: true,
    schedule_view: true,
    schedule_edit: true,
    clients: true,
    payroll_view: true,
    payroll_edit: true,
    revenue: false,  // revenue reserved for 'owner' role only (Ruby, Adrian)
  },
  // Front desk + sales staff: schedule view, client bookings & check-ins, CRM/leads, own payroll view
  // No payroll editing, no revenue data
  manager: {
    overview: true,
    schedule_view: true,
    schedule_edit: false,  // view only — can't add/remove sessions from calendar
    clients: true,         // bookings, check-ins, CRM leads
    payroll_view: true,    // own hours/pay only
    payroll_edit: false,
    revenue: false,
  },
  instructor: {
    overview: false,
    schedule_view: true,   // own classes only
    schedule_edit: false,
    clients: false,        // own class rosters only
    payroll_view: true,    // own pay records only
    payroll_edit: false,
    revenue: false,
  },
  front_desk: {            // retired — use 'manager' instead
    overview: true,
    schedule_view: true,
    schedule_edit: false,
    clients: true,
    payroll_view: false,
    payroll_edit: false,
    revenue: false,
  },
}

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  instructor: 'Instructor',
  front_desk: 'Front Desk',
}

const ROLE_COLORS: Record<StaffRole, string> = {
  admin: '#87CEBF',
  manager: '#6b9fd4',
  instructor: '#c8860a',
  front_desk: '#808282',
}

const ALLOWED_ROLES: StaffRole[] = ['admin', 'manager', 'instructor', 'front_desk']

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<{ first_name: string; role: StaffRole } | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: prof } = await supabase
        .from('profiles')
        .select('first_name, role')
        .eq('id', data.user.id)
        .single()
      if (!prof || !ALLOWED_ROLES.includes(prof.role as StaffRole)) {
        router.push('/dashboard')
        return
      }
      setProfile({ first_name: prof.first_name, role: prof.role as StaffRole })
      setChecking(false)
    })
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (checking) return null

  const role = profile!.role
  const perms = ROLE_PERMISSIONS[role]
  const roleColor = ROLE_COLORS[role]

  const nav = [
    { href: '/admin', label: 'Overview', icon: '⊡', show: perms.overview },
    { href: '/admin/my-classes', label: 'My Classes', icon: '◷', show: role === 'instructor' },
    { href: '/admin/schedule', label: 'Schedule', icon: '◷', show: perms.schedule_view && role !== 'instructor' },
    { href: '/admin/private-requests', label: 'Private Requests', icon: '◐', show: perms.schedule_edit },
    { href: '/admin/clients', label: 'Clients', icon: '◈', show: perms.clients },
    { href: '/admin/instructors', label: 'Instructors', icon: '◉', show: perms.payroll_view },
    { href: '/admin/payroll', label: 'Payroll', icon: '◆', show: perms.payroll_view },
    { href: '/admin/social-content', label: 'Social Content', icon: '◎', show: perms.payroll_view || role === 'instructor' },
    { href: '/admin/timeclock', label: 'Time Clock', icon: '◷', show: perms.payroll_view || role === 'front_desk' },
    { href: '/admin/gift-cards', label: 'Gift Cards', icon: '◇', show: perms.clients },
    { href: null, label: 'MARKETING', icon: '', show: perms.overview, divider: true },
    { href: '/admin/marketing/leads', label: 'Leads', icon: '◉', show: perms.clients },
    { href: '/admin/marketing/automations', label: 'Automations', icon: '⟳', show: perms.clients },
    { href: '/admin/marketing/broadcasts', label: 'Broadcasts', icon: '◎', show: perms.clients },
    { href: '/admin/marketing/referrals', label: 'Referrals', icon: '◑', show: perms.clients },
    { href: '/admin/marketing/testimonials', label: 'Testimonials', icon: '★', show: perms.clients },
    { href: '/admin/marketing/milestones', label: 'Milestones', icon: '◈', show: perms.clients },
    { href: '/admin/chat', label: 'Chat', icon: '◻', show: perms.clients },
  ].filter(n => n.show)

  return (
    <div className="min-h-screen flex" style={{ background: '#f9f8f6' }}>
      <aside className="hidden lg:flex flex-col w-64 min-h-screen" style={{ background: '#1a1a1a', position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: '2rem 1.75rem 1rem' }}>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.3rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'white' }}>Marathon</span>
          <br />
          <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#87CEBF' }}>Pilates</span>
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '2px', background: roleColor, color: 'white' }}>
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0.5rem 0', overflowY: 'auto' }}>
          {nav.map((item, i) => {
            if (item.divider) {
              return (
                <div key={`divider-${i}`}>
                  <div style={{ margin: '0.75rem 1.75rem', borderTop: '1px solid #2a2a2a' }} />
                  <p style={{ padding: '0.25rem 1.75rem', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.2em', color: '#444' }}>{item.label}</p>
                </div>
              )
            }
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href!} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1.75rem', fontFamily: "'Raleway', sans-serif", fontWeight: active ? 700 : 500, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? '#87CEBF' : '#888', textDecoration: 'none', borderLeft: active ? '2px solid #87CEBF' : '2px solid transparent' }}>
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
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.82rem', color: 'white', marginBottom: '0.15rem' }}>{profile?.first_name}</p>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#555', marginBottom: '0.6rem' }}>{ROLE_LABELS[role]}</p>
          <button onClick={handleSignOut} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64">{children}</main>
    </div>
  )
}
