'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

type PayPeriod = {
  id: string
  period_start: string
  period_end: string
  processed_at: string | null
  gusto_sync_at: string | null
  created_at: string
  line_items: PayLineItem[]
}

type PayLineItem = {
  id: string
  instructor_id: string
  line_type: string
  attendee_count: number | null
  pay_tier: number | null
  amount: number
  notes: string | null
  session_id: string | null
  profiles: { first_name: string; last_name: string } | null
  scheduled_sessions: { name: string; starts_at: string } | null
}

type Instructor = { id: string; first_name: string; last_name: string }

// Payroll rate constants
const GROUP_RATES = { 1: 30, 2: 48, 3: 58 } // tier -> rate
const PRIVATE_RATES = { under_one_year: 45, one_plus_year: 55 }

const PAY_TIER_LABELS: Record<number, string> = {
  1: '$30 · 0–4 clients',
  2: '$48 · 5–7 clients',
  3: '$58 · 8 clients (full)',
}

export default function AdminPayrollPage() {
  const [periods, setPeriods] = useState<PayPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<PayPeriod | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // New period form
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: periodsData }, { data: instructorData }] = await Promise.all([
      supabase.from('payroll_periods').select('*').order('period_start', { ascending: false }).limit(10),
      supabase.from('profiles').select('id, first_name, last_name').in('role', ['instructor', 'admin']),
    ])

    if (periodsData && periodsData.length > 0) {
      // Load line items for each period
      const ids = periodsData.map(p => p.id)
      const { data: lines } = await supabase.from('payroll_line_items')
        .select('*, profiles(first_name, last_name), scheduled_sessions(name, starts_at)')
        .in('period_id', ids)

      const linesByPeriod: Record<string, PayLineItem[]> = {}
      lines?.forEach(l => {
        if (!linesByPeriod[l.period_id]) linesByPeriod[l.period_id] = []
        linesByPeriod[l.period_id].push(l as PayLineItem)
      })

      setPeriods(periodsData.map(p => ({ ...p, line_items: linesByPeriod[p.id] ?? [] })))
    } else {
      setPeriods([])
    }

    setInstructors((instructorData ?? []) as Instructor[])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const generatePeriod = async () => {
    if (!periodStart || !periodEnd) { showToast('Select start and end dates', 'error'); return }
    setGenerating(true)
    const supabase = createClient()

    // Create period
    const { data: period, error } = await supabase.from('payroll_periods').insert({
      period_start: periodStart,
      period_end: periodEnd,
    }).select().single()

    if (error || !period) { showToast('Could not create period', 'error'); setGenerating(false); return }

    // Pull all completed sessions in this period and auto-generate line items
    const { data: sessions } = await supabase.from('scheduled_sessions')
      .select('id, name, session_type, starts_at, instructor_id')
      .gte('starts_at', `${periodStart}T00:00:00`)
      .lte('starts_at', `${periodEnd}T23:59:59`)
      .eq('is_cancelled', false)
      .not('instructor_id', 'is', null)

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id)
      const { data: bookings } = await supabase.from('bookings').select('session_id').in('session_id', sessionIds).in('status', ['confirmed', 'completed'])

      const countMap: Record<string, number> = {}
      bookings?.forEach(b => { countMap[b.session_id] = (countMap[b.session_id] ?? 0) + 1 })

      const lineItems = sessions.map(s => {
        const attendees = countMap[s.id] ?? 0
        const isGroup = s.session_type === 'group_reformer'
        let tier = 1
        let amount = 0
        if (isGroup) {
          tier = attendees <= 4 ? 1 : attendees <= 7 ? 2 : 3
          amount = GROUP_RATES[tier as keyof typeof GROUP_RATES]
        } else if (s.session_type.startsWith('private')) {
          amount = PRIVATE_RATES.under_one_year // default; master trainer negotiated separately
        }
        return {
          period_id: period.id,
          instructor_id: s.instructor_id,
          session_id: s.id,
          line_type: isGroup ? 'group_class' : 'private_session',
          attendee_count: attendees,
          pay_tier: isGroup ? tier : null,
          amount,
          notes: isGroup ? PAY_TIER_LABELS[tier] : 'Private session rate',
        }
      }).filter(l => l.amount > 0)

      if (lineItems.length > 0) {
        await supabase.from('payroll_line_items').insert(lineItems)
      }
    }

    showToast('Payroll period created')
    setShowNewForm(false)
    setPeriodStart('')
    setPeriodEnd('')
    loadData()
    setGenerating(false)
  }

  const markProcessed = async (periodId: string) => {
    const supabase = createClient()
    await supabase.from('payroll_periods').update({ processed_at: new Date().toISOString() }).eq('id', periodId)
    showToast('Marked as processed')
    loadData()
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const formatDateTime = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  const periodTotal = (p: PayPeriod) => p.line_items.reduce((a, l) => a + l.amount, 0)

  const byInstructor = (lines: PayLineItem[]) => {
    const map: Record<string, { name: string; lines: PayLineItem[]; total: number }> = {}
    lines.forEach(l => {
      const key = l.instructor_id
      if (!map[key]) map[key] = { name: `${l.profiles?.first_name} ${l.profiles?.last_name}`, lines: [], total: 0 }
      map[key].lines.push(l)
      map[key].total += l.amount
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }

  const exportCSV = (period: PayPeriod) => {
    const rows = [['Instructor', 'Type', 'Session', 'Date', 'Attendees', 'Tier', 'Amount', 'Notes']]
    period.line_items.forEach(l => {
      rows.push([
        `${l.profiles?.first_name} ${l.profiles?.last_name}`,
        l.line_type,
        l.scheduled_sessions?.name ?? '',
        l.scheduled_sessions?.starts_at ? formatDate(l.scheduled_sessions.starts_at) : '',
        String(l.attendee_count ?? ''),
        String(l.pay_tier ?? ''),
        `$${l.amount.toFixed(2)}`,
        l.notes ?? '',
      ])
    })
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `payroll-${period.period_start}-${period.period_end}.csv`
    a.click()
  }

  const inputStyle = { padding: '0.65rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '2px', fontSize: '0.85rem', outline: 'none', background: 'white', fontFamily: "'Poppins', sans-serif" }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '1000px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: toast.type === 'success' ? '#1a1a1a' : '#e05555', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a' }}>Payroll</h1>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#808282', marginTop: '0.25rem' }}>Semi-monthly · Processed via Gusto</p>
        </div>
        <button onClick={() => setShowNewForm(!showNewForm)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.7rem 1.5rem', background: showNewForm ? '#1a1a1a' : '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>
          {showNewForm ? '✕ Close' : '+ New Period'}
        </button>
      </div>

      {/* Rate reference */}
      <div style={{ background: '#f9f8f6', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>Pay Rates</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {[
            'Group: $30 (0–4 clients)',
            'Group: $48 (5–7 clients)',
            'Group: $58 (8 clients)',
            'Private: $45 (< 1 yr)',
            'Private: $55 (1+ yr)',
            'Front desk: $18/hr',
          ].map(r => (
            <p key={r} style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#555' }}>· {r}</p>
          ))}
        </div>
      </div>

      {/* New period form */}
      {showNewForm && (
        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '2rem', marginBottom: '2rem' }}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '1.25rem' }}>New Pay Period</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#808282', display: 'block', marginBottom: '0.35rem' }}>Period Start</label>
              <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
            </div>
            <div>
              <label style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#808282', display: 'block', marginBottom: '0.35rem' }}>Period End</label>
              <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
            </div>
            <button onClick={generatePeriod} disabled={generating} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.68rem 1.5rem', background: generating ? '#b0ddd6' : '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: generating ? 'not-allowed' : 'pointer' }}>
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa', marginTop: '0.75rem' }}>
            Auto-calculates pay from all sessions in this period using confirmed rates.
          </p>
        </div>
      )}

      {/* Periods list */}
      {loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : periods.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ccc' }}>No pay periods yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {periods.map(p => {
            const total = periodTotal(p)
            const isSelected = selectedPeriod?.id === p.id
            const instructorBreakdown = byInstructor(p.line_items)
            return (
              <div key={p.id} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', overflow: 'hidden' }}>
                {/* Period header */}
                <div
                  onClick={() => setSelectedPeriod(isSelected ? null : p)}
                  style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '1rem' }}
                >
                  <div>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.9rem', color: '#1a1a1a', marginBottom: '0.2rem' }}>
                      {formatDate(p.period_start)} – {formatDate(p.period_end)}
                    </p>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa' }}>
                      {p.line_items.length} line item{p.line_items.length !== 1 ? 's' : ''}
                      {p.processed_at ? ` · Processed ${formatDateTime(p.processed_at)}` : ' · Pending'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.4rem', color: '#1a1a1a', lineHeight: 1 }}>${total.toFixed(2)}</p>
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa' }}>total</p>
                    </div>
                    <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.25rem 0.6rem', borderRadius: '2px', background: p.processed_at ? '#e8f7f4' : '#fff8e6', color: p.processed_at ? '#87CEBF' : '#c8860a' }}>
                      {p.processed_at ? 'Processed' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <div style={{ borderTop: '1px solid #eee', padding: '1.5rem' }}>
                    {/* By instructor */}
                    {instructorBreakdown.map(inst => (
                      <div key={inst.name} style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1a1a' }}>{inst.name}</p>
                          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.9rem', color: '#87CEBF' }}>${inst.total.toFixed(2)}</p>
                        </div>
                        {inst.lines.map(l => (
                          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f5f5f5' }}>
                            <div>
                              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#555' }}>{l.scheduled_sessions?.name ?? l.line_type}</p>
                              {l.notes && <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa' }}>{l.notes}</p>}
                            </div>
                            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.82rem', color: '#1a1a1a' }}>${l.amount.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    ))}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      <button onClick={() => exportCSV(p)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', border: '1px solid #87CEBF', background: 'white', color: '#87CEBF', borderRadius: '2px', cursor: 'pointer' }}>
                        Export CSV
                      </button>
                      {!p.processed_at && (
                        <button onClick={() => markProcessed(p.id)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', background: '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>
                          Mark Processed
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
