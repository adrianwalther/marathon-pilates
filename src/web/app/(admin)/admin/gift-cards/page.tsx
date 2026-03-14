'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

type GiftCard = {
  id: string
  code: string
  initial_balance: number
  current_balance: number
  is_physical: boolean
  recipient_email: string | null
  recipient_name: string | null
  message: string | null
  redeemed_at: string | null
  created_at: string
  purchaser: { first_name: string; last_name: string } | null
}

const sectionLabel = { fontFamily: "'Raleway', sans-serif" as const, fontWeight: 700 as const, fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#808282', display: 'block', marginBottom: '1rem' }

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}

export default function AdminGiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'redeemed' | 'physical'>('all')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newAmount, setNewAmount] = useState('50')
  const [newRecipient, setNewRecipient] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhysical, setNewPhysical] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const loadCards = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('gift_cards')
      .select('*, purchaser:purchaser_id(first_name, last_name)')
      .order('created_at', { ascending: false })
    setCards((data ?? []) as GiftCard[])
    setLoading(false)
  }, [])

  useEffect(() => { loadCards() }, [loadCards])

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return `${seg()}-${seg()}-${seg()}`
  }

  const createCard = async () => {
    if (!newAmount || parseFloat(newAmount) <= 0) return
    setSaving(true)
    const supabase = createClient()
    const code = newCode || generateCode()
    const amount = parseFloat(newAmount)
    const { error } = await supabase.from('gift_cards').insert({
      code,
      initial_balance: amount,
      current_balance: amount,
      recipient_name: newRecipient || null,
      recipient_email: newEmail || null,
      is_physical: newPhysical,
    })
    if (error) {
      showToast('Error creating card')
    } else {
      showToast(`Gift card ${code} created`)
      setCreating(false)
      setNewCode(''); setNewAmount('50'); setNewRecipient(''); setNewEmail(''); setNewPhysical(false)
      loadCards()
    }
    setSaving(false)
  }

  const filtered = cards.filter(c => {
    if (filter === 'active' && c.redeemed_at) return false
    if (filter === 'redeemed' && !c.redeemed_at) return false
    if (filter === 'physical' && !c.is_physical) return false
    if (search && !c.code.includes(search.toUpperCase()) && !(c.recipient_name ?? '').toLowerCase().includes(search.toLowerCase()) && !(c.recipient_email ?? '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const stats = {
    total: cards.length,
    active: cards.filter(c => !c.redeemed_at).length,
    outstandingValue: cards.filter(c => !c.redeemed_at).reduce((sum, c) => sum + c.current_balance, 0),
    issuedValue: cards.reduce((sum, c) => sum + c.initial_balance, 0),
  }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '900px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: '#1a1a1a', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a' }}>Gift Cards</h1>
        <button onClick={() => setCreating(true)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.65rem 1.25rem', borderRadius: '2px', background: '#87CEBF', color: 'white', border: 'none', cursor: 'pointer' }}>
          + Issue Card
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Total Issued', value: stats.total },
          { label: 'Active Cards', value: stats.active },
          { label: 'Outstanding Value', value: formatCurrency(stats.outstandingValue) },
          { label: 'Total Issued Value', value: formatCurrency(stats.issuedValue) },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.8rem', color: '#1a1a1a', lineHeight: 1 }}>{loading ? '—' : s.value}</p>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#808282', marginTop: '0.4rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '2px', overflow: 'hidden' }}>
          {(['all', 'active', 'redeemed', 'physical'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 0.9rem', border: 'none', background: filter === f ? '#1a1a1a' : 'white', color: filter === f ? 'white' : '#808282', cursor: 'pointer' }}>
              {f}
            </button>
          ))}
        </div>
        <input
          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', padding: '0.5rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '2px', outline: 'none', flex: 1, minWidth: '180px' }}
          placeholder="Search code, name, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Cards list */}
      {loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ccc' }}>No gift cards found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px 80px 80px', gap: '1rem', padding: '0.5rem 1.25rem' }}>
            {['Code', 'Recipient', 'Initial', 'Balance', 'Type', 'Status'].map(h => (
              <span key={h} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa' }}>{h}</span>
            ))}
          </div>
          {filtered.map(c => (
            <div key={c.id} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px 80px 80px', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.82rem', color: '#1a1a1a', letterSpacing: '0.08em' }}>{c.code}</span>
              <div>
                {c.recipient_name && <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.82rem', color: '#1a1a1a' }}>{c.recipient_name}</p>}
                {c.recipient_email && <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#808282' }}>{c.recipient_email}</p>}
                {!c.recipient_name && !c.recipient_email && <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#ccc' }}>—</span>}
              </div>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#1a1a1a' }}>{formatCurrency(c.initial_balance)}</span>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: c.current_balance < c.initial_balance ? 400 : 300, fontSize: '0.82rem', color: c.current_balance === 0 ? '#aaa' : '#1a1a1a' }}>{formatCurrency(c.current_balance)}</span>
              <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.15rem 0.4rem', borderRadius: '2px', background: c.is_physical ? '#f9f8f6' : '#e8f7f4', color: c.is_physical ? '#808282' : '#87CEBF', width: 'fit-content' }}>
                {c.is_physical ? 'Physical' : 'Digital'}
              </span>
              <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.15rem 0.4rem', borderRadius: '2px', background: c.redeemed_at ? '#f5f5f5' : '#e8f7f4', color: c.redeemed_at ? '#aaa' : '#87CEBF', width: 'fit-content' }}>
                {c.redeemed_at ? 'Redeemed' : 'Active'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {creating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '2px', padding: '2.5rem', width: '100%', maxWidth: '480px' }}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '2rem' }}>Issue Gift Card</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              <div>
                <span style={sectionLabel}>Amount</span>
                <input style={{ width: '100%', fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.88rem', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.7rem 0.9rem', outline: 'none', boxSizing: 'border-box' as const }} type="number" placeholder="50" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
              </div>
              <div>
                <span style={sectionLabel}>Code (auto-generated if blank)</span>
                <input style={{ width: '100%', fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.88rem', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.7rem 0.9rem', outline: 'none', boxSizing: 'border-box' as const, letterSpacing: '0.08em' }} placeholder="XXXX-XXXX-XXXX" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} />
              </div>
              <div>
                <span style={sectionLabel}>Recipient Name (optional)</span>
                <input style={{ width: '100%', fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.88rem', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.7rem 0.9rem', outline: 'none', boxSizing: 'border-box' as const }} placeholder="Name" value={newRecipient} onChange={e => setNewRecipient(e.target.value)} />
              </div>
              <div>
                <span style={sectionLabel}>Recipient Email (optional)</span>
                <input style={{ width: '100%', fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.88rem', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.7rem 0.9rem', outline: 'none', boxSizing: 'border-box' as const }} type="email" placeholder="email@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[{ v: false, label: 'Digital' }, { v: true, label: 'Physical' }].map(opt => (
                  <button key={String(opt.v)} onClick={() => setNewPhysical(opt.v)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '0.55rem 1.25rem', borderRadius: '2px', border: `1px solid ${newPhysical === opt.v ? '#1a1a1a' : '#e0e0e0'}`, background: newPhysical === opt.v ? '#1a1a1a' : 'white', color: newPhysical === opt.v ? 'white' : '#808282', cursor: 'pointer' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setCreating(false)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '0.65rem 1.25rem', border: '1px solid #e0e0e0', borderRadius: '2px', background: 'white', color: '#808282', cursor: 'pointer' }}>Cancel</button>
              <button onClick={createCard} disabled={saving} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '0.65rem 1.25rem', border: 'none', borderRadius: '2px', background: '#87CEBF', color: 'white', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Issue Card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
