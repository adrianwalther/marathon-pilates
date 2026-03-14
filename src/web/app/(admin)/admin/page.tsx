'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Stats = {
  totalClients: number
  classesToday: number
  bookingsToday: number
  activeMembers: number
}

type UpcomingSession = {
  id: string
  name: string
  starts_at: string
  max_capacity: number
  booking_count: number
  locations: { name: string }
  profiles: { first_name: string; last_name: string } | null
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats>({ totalClients: 0, classesToday: 0, bookingsToday: 0, activeMembers: 0 })
  const [upcoming, setUpcoming] = useState<UpcomingSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const todayStart = new Date(); todayStart.setHours(0,0,0,0)
      const todayEnd = new Date(); todayEnd.setHours(23,59,59,999)

      const [
        { count: clientCount },
        { count: memberCount },
        { data: sessions },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
        supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('scheduled_sessions')
          .select('id, name, starts_at, max_capacity, locations(name), profiles(first_name, last_name)')
          .gte('starts_at', new Date().toISOString())
          .eq('is_cancelled', false)
          .order('starts_at', { ascending: true })
          .limit(6),
      ])

      // Booking counts per session
      if (sessions && sessions.length > 0) {
        const ids = sessions.map(s => s.id)
        const { data: bookings } = await supabase.from('bookings').select('session_id').in('session_id', ids).in('status', ['confirmed', 'waitlisted'])
        const countMap: Record<string, number> = {}
        bookings?.forEach(b => { countMap[b.session_id] = (countMap[b.session_id] ?? 0) + 1 })

        // Today bookings
        const todayBookings = bookings?.filter(() => true).length ?? 0

        setUpcoming(sessions.map(s => ({ ...s, booking_count: countMap[s.id] ?? 0, profiles: s.profiles as unknown as UpcomingSession["profiles"] })) as unknown as UpcomingSession[])
        setStats({
          totalClients: clientCount ?? 0,
          classesToday: sessions.filter(s => new Date(s.starts_at) >= todayStart && new Date(s.starts_at) <= todayEnd).length,
          bookingsToday: todayBookings,
          activeMembers: memberCount ?? 0,
        })
      } else {
        setStats({ totalClients: clientCount ?? 0, classesToday: 0, bookingsToday: 0, activeMembers: memberCount ?? 0 })
      }
      setLoading(false)
    }
    load()
  }, [])

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const sectionLabel = { fontFamily: "'Raleway', sans-serif", fontWeight: 700 as const, fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#808282', marginBottom: '1rem' }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a' }}>Overview</h1>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#808282', marginTop: '0.25rem' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        {[
          { label: 'Total Clients', value: stats.totalClients },
          { label: 'Active Members', value: stats.activeMembers },
          { label: "Classes Today", value: stats.classesToday },
          { label: "Bookings Today", value: stats.bookingsToday },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2.2rem', color: '#1a1a1a', lineHeight: 1 }}>{loading ? '—' : s.value}</p>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#808282', marginTop: '0.4rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={sectionLabel}>Quick Actions</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <ActionBtn href="/admin/schedule" label="+ Add Class" primary />
          <ActionBtn href="/admin/clients" label="View Clients" />
          <ActionBtn href="/admin/payroll" label="Run Payroll" />
        </div>
      </div>

      {/* Upcoming classes */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p style={sectionLabel}>Upcoming Classes</p>
          <Link href="/admin/schedule" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#87CEBF', textDecoration: 'none' }}>View all</Link>
        </div>

        {loading ? (
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
        ) : upcoming.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>No upcoming classes scheduled</p>
            <Link href="/admin/schedule" style={{ display: 'inline-block', marginTop: '1rem', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#87CEBF', textDecoration: 'none' }}>Add a class →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {upcoming.map(s => {
              const fillPct = s.max_capacity > 0 ? (s.booking_count / s.max_capacity) * 100 : 0
              const isFull = s.booking_count >= s.max_capacity
              return (
                <div key={s.id} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.88rem', color: '#1a1a1a', marginBottom: '0.2rem' }}>{s.name}</p>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#808282' }}>
                      {formatDate(s.starts_at)} · {formatTime(s.starts_at)} · {s.locations?.name}
                    </p>
                    {s.profiles && (
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', marginTop: '0.1rem' }}>
                        {s.profiles.first_name} {s.profiles.last_name}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '80px' }}>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.88rem', color: isFull ? '#c8860a' : '#1a1a1a' }}>
                      {s.booking_count}/{s.max_capacity}
                    </p>
                    <div style={{ height: '3px', background: '#f0f0f0', borderRadius: '2px', marginTop: '0.3rem', width: '80px' }}>
                      <div style={{ height: '100%', width: `${fillPct}%`, background: isFull ? '#c8860a' : '#87CEBF', borderRadius: '2px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ActionBtn({ href, label, primary }: { href: string; label: string; primary?: boolean }) {
  return (
    <Link href={href} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.65rem 1.25rem', borderRadius: '2px', border: primary ? 'none' : '1px solid #87CEBF', background: primary ? '#87CEBF' : 'transparent', color: primary ? 'white' : '#87CEBF', textDecoration: 'none' }}>
      {label}
    </Link>
  )
}
