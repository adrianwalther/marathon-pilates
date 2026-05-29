'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { pickNudge, type Nudge } from '@/lib/nudges'
import { logEvent } from '@/lib/events'

type Profile = {
  first_name: string
  total_classes_completed: number
  polestar_traffic_light: string
  preferred_location: string | null
}

type Booking = {
  id: string
  status: string
  scheduled_sessions: {
    name: string
    starts_at: string
    ends_at: string
    duration_minutes: number
    location_id: string
    locations: { name: string }
  }
}

type Credit = {
  credit_type: string
  total_credits: number
  used_credits: number
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [credits, setCredits] = useState<Credit[]>([])
  const [nudge, setNudge] = useState<Nudge | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: bookings }, { data: creds }, { data: tried }, { data: events }] = await Promise.all([
        supabase.from('profiles').select('first_name, total_classes_completed, polestar_traffic_light, preferred_location').eq('id', user.id).single(),
        supabase.from('bookings')
          .select('id, status, scheduled_sessions(name, starts_at, ends_at, duration_minutes, location_id, locations(name))')
          .eq('client_id', user.id)
          .in('status', ['confirmed', 'waitlisted'])
          .gte('scheduled_sessions.starts_at', new Date().toISOString())
          .order('scheduled_sessions.starts_at', { ascending: true })
          .limit(3),
        supabase.from('credits').select('credit_type, total_credits, used_credits').eq('client_id', user.id),
        // Every service this client has ever engaged with (any non-cancelled
        // booking) — feeds the "haven't tried yet" nudge.
        supabase.from('bookings')
          .select('scheduled_sessions(session_type)')
          .eq('client_id', user.id)
          .neq('status', 'cancelled'),
        // Behavioral signals for the nudge ranker. Degrades gracefully: if the
        // client_events table isn't deployed yet, this errors → data is null →
        // the nudge still works off booking history alone.
        supabase.from('client_events')
          .select('event_type, service_key')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200),
      ])

      if (prof) setProfile(prof)
      if (bookings) setUpcomingBookings(bookings as unknown as Booking[])
      if (creds) setCredits(creds)

      // Build the nudge from the client's tried services. Supabase returns the
      // joined row as an object (or array, defensively) — normalize to a flat
      // list of session_type strings.
      const triedTypes = ((tried ?? []) as Array<{ scheduled_sessions: { session_type: string } | { session_type: string }[] | null }>)
        .flatMap(r => {
          const s = r.scheduled_sessions
          if (!s) return []
          return Array.isArray(s) ? s.map(x => x.session_type) : [s.session_type]
        })

      // Turn the raw event log into nudge signals: count service views (intent)
      // and collect dismissals (suppress).
      const viewed: Record<string, number> = {}
      const dismissed: string[] = []
      for (const e of (events ?? []) as Array<{ event_type: string; service_key: string | null }>) {
        if (!e.service_key) continue
        if (e.event_type === 'service_view') {
          viewed[e.service_key] = (viewed[e.service_key] ?? 0) + 1
        } else if (e.event_type === 'nudge_dismissed' && !dismissed.includes(e.service_key)) {
          dismissed.push(e.service_key)
        }
      }
      const picked = pickNudge(prof?.first_name, triedTypes, { viewed, dismissed })
      setNudge(picked)

      setLoading(false)

      // Progressive enhancement: render the template immediately (above), then
      // quietly upgrade to an AI-written line in Ruby's voice when it arrives.
      // Fire-and-forget — any failure leaves the safe template in place.
      if (picked) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          fetch('/api/nudge-copy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ service_key: picked.service.key }),
          })
            .then(r => (r.ok ? r.json() : null))
            .then(d => {
              if (d?.message) setNudge(n => (n && n.service.key === picked.service.key ? { ...n, message: d.message } : n))
            })
            .catch(() => {})
        }
      }
    }
    load()
  }, [])

  const groupCredits = credits.filter(c => c.credit_type === 'group').reduce((a, c) => a + c.total_credits - c.used_credits, 0)
  const privateCredits = credits.filter(c => c.credit_type === 'private').reduce((a, c) => a + c.total_credits - c.used_credits, 0)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const sectionLabel = {
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700,
    fontSize: '0.65rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-text-muted)',
    marginBottom: '1rem',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '900px' }}>
      {/* Greeting */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2.2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text)', lineHeight: 1.1 }}>
          Hello,<br />{profile?.first_name ?? 'there'}
        </h1>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', letterSpacing: '0.02em' }}>
          {profile?.total_classes_completed
            ? `${profile.total_classes_completed} class${profile.total_classes_completed !== 1 ? 'es' : ''} completed`
            : 'Ready to move + restore?'}
        </p>
      </div>

      {/* Personalized nudge — surfaces a service the client hasn't tried yet */}
      {nudge && <NudgeCard nudge={nudge} />}

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        <StatCard label="Group Credits" value={groupCredits} />
        <StatCard label="Private Credits" value={privateCredits} />
        <StatCard label="Classes Done" value={profile?.total_classes_completed ?? 0} />
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={sectionLabel}>Book a Class</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <QuickBookBtn href="/dashboard/schedule?type=group_reformer" label="Group Reformer" />
          <QuickBookBtn href="/dashboard/schedule?type=private" label="Private Session" />
          <QuickBookBtn href="/dashboard/schedule?type=sauna" label="Sauna" ghost />
          <QuickBookBtn href="/dashboard/schedule?type=cold_plunge" label="Cold Plunge" ghost />
        </div>
      </div>

      {/* Upcoming bookings */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p style={sectionLabel}>Upcoming</p>
          <Link href="/dashboard/bookings" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-cta)', textDecoration: 'none' }}>
            View all
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '2px', padding: '2rem', textAlign: 'center', border: '1px solid #eee' }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>No upcoming classes</p>
            <Link href="/dashboard/schedule" style={{ display: 'inline-block', marginTop: '1rem', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-cta)', textDecoration: 'none' }}>
              Browse Schedule →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcomingBookings.map(b => (
              <div key={b.id} style={{ background: 'white', borderRadius: '2px', padding: '1.25rem 1.5rem', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.88rem', color: 'var(--color-text)', marginBottom: '0.2rem' }}>
                    {b.scheduled_sessions?.name}
                  </p>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {b.scheduled_sessions ? `${formatDate(b.scheduled_sessions.starts_at)} · ${formatTime(b.scheduled_sessions.starts_at)}` : ''}
                    {b.scheduled_sessions?.duration_minutes ? ` · ${b.scheduled_sessions.duration_minutes} min` : ''}
                  </p>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', marginTop: '0.15rem' }}>
                    {b.scheduled_sessions?.locations?.name}
                  </p>
                </div>
                <span style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.6rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '2px',
                  background: b.status === 'waitlisted' ? '#fff8e6' : '#f5ece6',
                  color: b.status === 'waitlisted' ? '#c8860a' : 'var(--color-cta)',
                }}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Milestone progress */}
      {(() => {
        const done = profile?.total_classes_completed ?? 0
        const milestones = [1, 5, 10, 25, 50, 100]
        const next = milestones.find(m => m > done)
        const prev = milestones.filter(m => m <= done).pop() ?? 0
        if (!next) return null
        const pct = next === 1 ? (done > 0 ? 100 : 0) : Math.round(((done - prev) / (next - prev)) * 100)
        return (
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <p style={sectionLabel}>Milestone</p>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#aaa' }}>
                {done}/{next} classes
              </p>
            </div>
            <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.88rem', color: 'var(--color-text)', marginBottom: '0.75rem' }}>
                {next - done} more class{next - done !== 1 ? 'es' : ''} to your <strong>{next}-class milestone</strong>
              </p>
              <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-cta)', borderRadius: '2px', transition: 'width 0.5s' }} />
              </div>
            </div>
          </div>
        )
      })()}

      {/* Build a Class */}
      <BuildAClassCard />

      {/* Locations */}
      <div>
        <p style={sectionLabel}>Our Studios</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <LocationCard name="Charlotte Park" address="4701 Charlotte Ave" />
          <LocationCard name="Green Hills" address="2222 Bandywood Dr" />
        </div>
      </div>
    </div>
  )
}

function NudgeCard({ nudge }: { nudge: Nudge }) {
  const [hovered, setHovered] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Log that this nudge was shown — once per service surfaced. Pairs with
  // nudge_clicked / nudge_dismissed to measure what actually resonates.
  useEffect(() => {
    logEvent('nudge_shown', { serviceKey: nudge.service.key })
  }, [nudge.service.key])

  if (dismissed) return null

  return (
    <div style={{ marginBottom: '3rem' }}>
      <div
        style={{
          position: 'relative',
          background: '#f5ece6',
          border: '1px solid var(--color-accent-light)',
          borderRadius: '2px',
          padding: '1.75rem',
        }}
      >
        <button
          onClick={() => {
            logEvent('nudge_dismissed', { serviceKey: nudge.service.key })
            setDismissed(true)
          }}
          aria-label="Dismiss"
          style={{ position: 'absolute', top: '0.75rem', right: '0.9rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, color: 'var(--color-text-muted)', padding: '0.25rem' }}
        >
          ×
        </button>
        <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-cta)', marginBottom: '0.75rem' }}>
          For You
        </p>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          {nudge.message}
        </p>
        <Link
          href={nudge.service.href}
          onClick={() => logEvent('nudge_clicked', { serviceKey: nudge.service.key })}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'inline-block',
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 700,
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '0.65rem 1.5rem',
            borderRadius: '2px',
            background: 'var(--color-cta)',
            color: 'white',
            textDecoration: 'none',
            transition: 'transform 0.15s',
            transform: hovered ? 'translateX(3px)' : 'translateX(0)',
          }}
        >
          Book {nudge.service.label} →
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: 'white', borderRadius: '2px', padding: '1.25rem 1.5rem', border: '1px solid #eee' }}>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', color: 'var(--color-text)', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
        {label}
      </p>
    </div>
  )
}

function QuickBookBtn({ href, label, ghost }: { href: string; label: string; ghost?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: "'Raleway', sans-serif",
        fontWeight: 700,
        fontSize: '0.7rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '0.65rem 1.25rem',
        borderRadius: '2px',
        border: ghost ? '1px solid var(--color-cta)' : 'none',
        background: ghost ? 'transparent' : 'var(--color-cta)',
        color: ghost ? 'var(--color-cta)' : 'white',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </Link>
  )
}

function BuildAClassCard() {
  const [hovered, setHovered] = useState(false)
  const sectionLabel = {
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700,
    fontSize: '0.65rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-text-muted)',
    marginBottom: '1rem',
  }
  return (
    <div style={{ marginBottom: '3rem' }}>
      <p style={sectionLabel}>On Demand</p>
      <Link href="/dashboard/generate-class" style={{ textDecoration: 'none', display: 'block' }}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            padding: '1.5rem',
            border: `1px solid ${hovered ? 'var(--color-cta)' : '#e8e8e8'}`,
            borderRadius: '2px',
            background: hovered ? '#f7fcfb' : 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text)', lineHeight: 1.1, marginBottom: '0.5rem' }}>
              Build a Class
            </h2>
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-cta)', marginTop: '0.4rem', transition: 'transform 0.2s', display: 'inline-block', transform: hovered ? 'translateX(4px)' : 'translateX(0)' }}>
              Begin →
            </span>
          </div>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: 'var(--color-text-muted)', letterSpacing: '0.02em' }}>
            Personalized mat Pilates · voice cues · music
          </p>
        </div>
      </Link>
    </div>
  )
}

function LocationCard({ name, address }: { name: string; address: string }) {
  return (
    <div style={{ background: 'white', borderRadius: '2px', padding: '1.25rem 1.5rem', border: '1px solid #eee' }}>
      <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-cta)', marginBottom: '0.3rem' }}>
        {name}
      </p>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        {address}
      </p>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#aaa' }}>
        Nashville, TN
      </p>
    </div>
  )
}
