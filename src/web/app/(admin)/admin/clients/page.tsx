'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Client = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  total_classes_completed: number
  polestar_traffic_light: string
  preferred_location: string | null
  created_at: string
  memberships: { membership_type: string; status: string }[]
}

const TRAFFIC_COLORS = {
  green:  { bg: '#e8f7f4', color: '#87CEBF' },
  yellow: { bg: '#fff8e6', color: '#c8860a' },
  red:    { bg: '#fef0f0', color: '#e05555' },
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Client | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('profiles')
      .select('id, first_name, last_name, email, phone, total_classes_completed, polestar_traffic_light, preferred_location, created_at, memberships(membership_type, status)')
      .eq('role', 'client')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setClients((data ?? []) as Client[])
        setLoading(false)
      })
  }, [])

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const activeMembership = (c: Client) => c.memberships?.find(m => m.status === 'active')

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '1000px' }}>
      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '2rem' }}>
        Clients
      </h1>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          style={{ width: '100%', maxWidth: '400px', padding: '0.75rem 1rem', border: '1px solid #e0e0e0', borderRadius: '2px', fontSize: '0.88rem', outline: 'none', fontFamily: "'Poppins', sans-serif" }}
          onFocus={e => (e.target.style.borderColor = '#87CEBF')}
          onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
        />
      </div>

      {loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {/* List */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.25rem' }}>
              {filtered.length} client{filtered.length !== 1 ? 's' : ''}
            </p>
            {filtered.map(c => {
              const tl = TRAFFIC_COLORS[c.polestar_traffic_light as keyof typeof TRAFFIC_COLORS] ?? TRAFFIC_COLORS.green
              const mem = activeMembership(c)
              const isSelected = selected?.id === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => setSelected(isSelected ? null : c)}
                  style={{ background: isSelected ? '#f0faf8' : 'white', border: `1px solid ${isSelected ? '#87CEBF' : '#eee'}`, borderRadius: '2px', padding: '0.9rem 1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}
                >
                  <div>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.88rem', color: '#1a1a1a', marginBottom: '0.15rem' }}>
                      {c.first_name} {c.last_name}
                    </p>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa' }}>{c.email}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {mem && (
                      <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '2px', background: '#e8f7f4', color: '#87CEBF' }}>
                        {mem.membership_type.replace('_', ' ')}
                      </span>
                    )}
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: tl.color, display: 'block', flexShrink: 0 }} />
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa', padding: '2rem 0', textAlign: 'center' }}>No clients found</p>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ width: '280px', flexShrink: 0 }}>
              <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.5rem', position: 'sticky', top: '2rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '1rem', color: '#1a1a1a', marginBottom: '0.15rem' }}>
                    {selected.first_name} {selected.last_name}
                  </p>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#aaa' }}>{selected.email}</p>
                  {selected.phone && <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#aaa' }}>{selected.phone}</p>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Row label="Member since" value={formatDate(selected.created_at)} />
                  <Row label="Classes done" value={String(selected.total_classes_completed)} />
                  <Row label="Preferred studio" value={selected.preferred_location?.replace('_', ' ') ?? 'None set'} />
                  <Row label="Membership" value={activeMembership(selected)?.membership_type.replace(/_/g, ' ') ?? 'None'} />
                </div>

                {/* Health status */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #eee' }}>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.5rem' }}>Health Status</p>
                  {(() => {
                    const tl = TRAFFIC_COLORS[selected.polestar_traffic_light as keyof typeof TRAFFIC_COLORS] ?? TRAFFIC_COLORS.green
                    return (
                      <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.25rem 0.6rem', borderRadius: '2px', background: tl.bg, color: tl.color }}>
                        {selected.polestar_traffic_light}
                      </span>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.1rem' }}>{label}</p>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.8rem', color: '#1a1a1a', textTransform: 'capitalize' }}>{value}</p>
    </div>
  )
}
