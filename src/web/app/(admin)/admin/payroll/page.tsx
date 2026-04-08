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
  period_id: string
  instructor_id: string
  line_type: string
  attendee_count: number | null
  pay_tier: number | null
  hours: number | null
  amount: number
  notes: string | null
  session_id: string | null
  profiles: { first_name: string; last_name: string; trainer_level?: string; private_session_rate?: number; hire_date?: string } | null
  scheduled_sessions: { name: string; starts_at: string; session_type: string } | null
}

type StaffMember = {
  id: string
  first_name: string
  last_name: string
  role: string
  trainer_level: string | null
  private_session_rate: number | null
  hire_date: string | null
}

// ── Pay rate constants ───────────────────────────────────────────────
const GROUP_RATES: Record<number, number> = { 1: 30, 2: 48, 3: 58 }
const GROUP_TIER_LABELS: Record<number, string> = {
  1: '0–4 clients · $30',
  2: '5–7 clients · $48',
  3: '8 clients (full) · $58',
}
const PRIVATE_SOLO_RATES = { under_one_year: 45, one_plus_year: 55 }
const DUET_RATE_PER_PERSON = 40
const TRIO_RATE_PER_PERSON = 35
const EVENT_RATES: Record<string, number> = { event_internal: 75, event_external: 100 }
const FRONT_DESK_RATE = 18
const SOCIAL_CONTENT_RATE = 25
const MANAGER_RATE = 1000

const LINE_TYPE_LABELS: Record<string, string> = {
  group_class: 'Group Class',
  private_solo: 'Solo Private',
  private_duet: 'Duet Private',
  private_trio: 'Trio Private',
  event_internal: 'Internal Event',
  event_external: 'External Event',
  front_desk_hours: 'Front Desk',
  manager_salary: 'Manager Salary',
  social_content: 'Social Content',
}

// ── Seniority helper ─────────────────────────────────────────────────
function getSoloPrivateRate(staff: StaffMember, sessionDate: string): number {
  if (staff.trainer_level === 'master_trainer' && staff.private_session_rate) {
    return staff.private_session_rate
  }
  if (!staff.hire_date) return PRIVATE_SOLO_RATES.under_one_year
  const hired = new Date(staff.hire_date)
  const session = new Date(sessionDate)
  const oneYearAfterHire = new Date(hired)
  oneYearAfterHire.setFullYear(oneYearAfterHire.getFullYear() + 1)
  return session >= oneYearAfterHire ? PRIVATE_SOLO_RATES.one_plus_year : PRIVATE_SOLO_RATES.under_one_year
}

export default function AdminPayrollPage() {
  const [periods, setPeriods] = useState<PayPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<PayPeriod | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [showManualForm, setShowManualForm] = useState<string | null>(null) // period id
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // New period form
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')

  // Manual entry form
  const [manualStaffId, setManualStaffId] = useState('')
  const [manualLineType, setManualLineType] = useState('front_desk_hours')
  const [manualHours, setManualHours] = useState('')
  const [manualAmount, setManualAmount] = useState('')
  const [manualNotes, setManualNotes] = useState('')
  const [addingManual, setAddingManual] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: periodsData }, { data: staffData }] = await Promise.all([
      supabase.from('payroll_periods').select('*').order('period_start', { ascending: false }).limit(12),
      supabase.from('profiles').select('id, first_name, last_name, role, trainer_level, private_session_rate, hire_date').in('role', ['instructor', 'admin', 'front_desk', 'manager']),
    ])

    if (periodsData && periodsData.length > 0) {
      const ids = periodsData.map((p: { id: string }) => p.id)
      const { data: lines } = await supabase.from('payroll_line_items')
        .select('*, profiles(first_name, last_name, trainer_level, private_session_rate, hire_date), scheduled_sessions(name, starts_at, session_type)')
        .in('period_id', ids)

      const linesByPeriod: Record<string, PayLineItem[]> = {}
      lines?.forEach((l: PayLineItem & { period_id: string }) => {
        if (!linesByPeriod[l.period_id]) linesByPeriod[l.period_id] = []
        linesByPeriod[l.period_id].push(l as PayLineItem)
      })

      setPeriods(periodsData.map((p: { id: string }) => ({ ...p, line_items: linesByPeriod[(p as { id: string }).id] ?? [] })) as unknown as PayPeriod[])
    } else {
      setPeriods([])
    }

    setStaff((staffData ?? []) as StaffMember[])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Generate period from scheduled sessions ──────────────────────
  const generatePeriod = async () => {
    if (!periodStart || !periodEnd) { showToast('Select start and end dates', 'error'); return }
    setGenerating(true)
    const supabase = createClient()

    const { data: period, error } = await supabase.from('payroll_periods').insert({
      period_start: periodStart,
      period_end: periodEnd,
    }).select().single()

    if (error || !period) { showToast('Could not create period', 'error'); setGenerating(false); return }

    // Build instructor lookup map
    const staffMap: Record<string, StaffMember> = {}
    staff.forEach(s => { staffMap[s.id] = s })

    // Pull all non-cancelled sessions with instructors
    const { data: sessions } = await supabase.from('scheduled_sessions')
      .select('id, name, session_type, starts_at, instructor_id')
      .gte('starts_at', `${periodStart}T00:00:00`)
      .lte('starts_at', `${periodEnd}T23:59:59`)
      .eq('is_cancelled', false)
      .not('instructor_id', 'is', null)

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map((s: { id: string }) => s.id)
      const { data: bookings } = await supabase.from('bookings')
        .select('session_id')
        .in('session_id', sessionIds)
        .in('status', ['confirmed', 'completed'])

      const countMap: Record<string, number> = {}
      bookings?.forEach((b: { session_id: string }) => {
        countMap[b.session_id] = (countMap[b.session_id] ?? 0) + 1
      })

      const lineItems = sessions.map((s: { id: string; name: string; session_type: string; starts_at: string; instructor_id: string }) => {
        const attendees = countMap[s.id] ?? 0
        const instructorProfile = staffMap[s.instructor_id]
        let lineType = s.session_type
        let amount = 0
        let tier: number | null = null
        let notes = ''

        if (s.session_type === 'group_reformer') {
          lineType = 'group_class'
          tier = attendees <= 4 ? 1 : attendees <= 7 ? 2 : 3
          amount = GROUP_RATES[tier]
          notes = GROUP_TIER_LABELS[tier]

        } else if (s.session_type === 'private_solo') {
          lineType = 'private_solo'
          amount = instructorProfile
            ? getSoloPrivateRate(instructorProfile, s.starts_at)
            : PRIVATE_SOLO_RATES.under_one_year
          const level = instructorProfile?.trainer_level
          notes = level === 'master_trainer'
            ? `Master trainer rate`
            : amount === PRIVATE_SOLO_RATES.one_plus_year ? '1+ year rate' : '< 1 year rate'

        } else if (s.session_type === 'private_duet') {
          lineType = 'private_duet'
          amount = DUET_RATE_PER_PERSON * attendees
          notes = `$${DUET_RATE_PER_PERSON}/person × ${attendees} client${attendees !== 1 ? 's' : ''}`

        } else if (s.session_type === 'private_trio') {
          lineType = 'private_trio'
          amount = TRIO_RATE_PER_PERSON * attendees
          notes = `$${TRIO_RATE_PER_PERSON}/person × ${attendees} client${attendees !== 1 ? 's' : ''}`

        } else if (s.session_type === 'event_internal' || s.session_type === 'event_external') {
          lineType = s.session_type
          amount = EVENT_RATES[s.session_type]
          notes = s.session_type === 'event_internal' ? 'Internal event — flat rate' : 'External event — flat rate'
        }

        return {
          period_id: period.id,
          instructor_id: s.instructor_id,
          session_id: s.id,
          line_type: lineType,
          attendee_count: attendees,
          pay_tier: tier,
          hours: null,
          amount,
          notes,
        }
      }).filter((l: { amount: number }) => l.amount > 0)

      if (lineItems.length > 0) {
        await supabase.from('payroll_line_items').insert(lineItems)
      }
    }

    // Auto-add Susan LeGrand (manager) salary if she's in the staff list
    const susan = staff.find(s => s.role === 'manager')
    if (susan) {
      await supabase.from('payroll_line_items').insert({
        period_id: period.id,
        instructor_id: susan.id,
        session_id: null,
        line_type: 'manager_salary',
        attendee_count: null,
        pay_tier: null,
        hours: null,
        amount: MANAGER_RATE,
        notes: 'Semi-monthly salary',
      })
    }

    showToast('Payroll period generated')
    setShowNewForm(false)
    setPeriodStart('')
    setPeriodEnd('')
    loadData()
    setGenerating(false)
  }

  // ── Add manual line item (front desk, social content, adjustments) ─
  const addManualEntry = async () => {
    if (!manualStaffId || !showManualForm) { showToast('Select a staff member', 'error'); return }
    const isHourly = manualLineType === 'front_desk_hours' || manualLineType === 'social_content'
    const hrs = parseFloat(manualHours)
    const flatAmt = parseFloat(manualAmount)

    let computedAmount = 0
    if (isHourly && !isNaN(hrs)) {
      computedAmount = manualLineType === 'front_desk_hours' ? hrs * FRONT_DESK_RATE : hrs * SOCIAL_CONTENT_RATE
    } else if (!isNaN(flatAmt)) {
      computedAmount = flatAmt
    }

    if (computedAmount <= 0) { showToast('Enter hours or amount', 'error'); return }
    setAddingManual(true)
    const supabase = createClient()
    await supabase.from('payroll_line_items').insert({
      period_id: showManualForm,
      instructor_id: manualStaffId,
      session_id: null,
      line_type: manualLineType,
      attendee_count: null,
      pay_tier: null,
      hours: isHourly ? hrs : null,
      amount: computedAmount,
      notes: manualNotes || null,
    })
    showToast('Entry added')
    setManualStaffId('')
    setManualLineType('front_desk_hours')
    setManualHours('')
    setManualAmount('')
    setManualNotes('')
    setShowManualForm(null)
    loadData()
    setAddingManual(false)
  }

  const markProcessed = async (periodId: string) => {
    const supabase = createClient()
    await supabase.from('payroll_periods').update({ processed_at: new Date().toISOString() }).eq('id', periodId)
    showToast('Marked as processed')
    loadData()
  }

  const deleteLineItem = async (lineId: string) => {
    const supabase = createClient()
    await supabase.from('payroll_line_items').delete().eq('id', lineId)
    showToast('Entry removed')
    loadData()
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const formatDateTime = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  const periodTotal = (p: PayPeriod) => p.line_items.reduce((a, l) => a + l.amount, 0)

  const byEmployee = (lines: PayLineItem[]) => {
    const map: Record<string, { name: string; lines: PayLineItem[]; total: number }> = {}
    lines.forEach(l => {
      const key = l.instructor_id
      if (!map[key]) map[key] = { name: `${l.profiles?.first_name ?? ''} ${l.profiles?.last_name ?? ''}`.trim(), lines: [], total: 0 }
      map[key].lines.push(l)
      map[key].total += l.amount
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }

  const exportCSV = (period: PayPeriod) => {
    const rows = [['Employee', 'Type', 'Session', 'Date', 'Clients', 'Hours', 'Tier', 'Amount', 'Notes']]
    period.line_items.forEach(l => {
      rows.push([
        `${l.profiles?.first_name ?? ''} ${l.profiles?.last_name ?? ''}`.trim(),
        LINE_TYPE_LABELS[l.line_type] ?? l.line_type,
        l.scheduled_sessions?.name ?? '',
        l.scheduled_sessions?.starts_at ? formatDate(l.scheduled_sessions.starts_at) : '',
        l.attendee_count != null ? String(l.attendee_count) : '',
        l.hours != null ? String(l.hours) : '',
        l.pay_tier != null ? String(l.pay_tier) : '',
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

  const inputStyle = {
    padding: '0.65rem 0.9rem',
    border: '1px solid #e0e0e0',
    borderRadius: '2px',
    fontSize: '0.85rem',
    outline: 'none',
    background: 'white',
    fontFamily: "'Poppins', sans-serif",
    width: '100%',
  }

  const LINE_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
    group_class:    { bg: '#e8f7f4', color: '#87CEBF' },
    private_solo:   { bg: '#f0f4ff', color: '#6b88c8' },
    private_duet:   { bg: '#f0f4ff', color: '#6b88c8' },
    private_trio:   { bg: '#f0f4ff', color: '#6b88c8' },
    event_internal: { bg: '#f9f0ff', color: '#9b6bc4' },
    event_external: { bg: '#f9f0ff', color: '#9b6bc4' },
    front_desk_hours: { bg: '#fff8e6', color: '#c8860a' },
    manager_salary:   { bg: '#f5f5f5', color: '#555' },
    social_content:   { bg: '#fff0f5', color: '#c46b8a' },
  }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '1000px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: toast.type === 'success' ? '#1a1a1a' : '#e05555', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2px', fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a' }}>Payroll</h1>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#808282', marginTop: '0.25rem' }}>Semi-monthly · Processed via Gusto</p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.7rem 1.5rem', background: showNewForm ? '#1a1a1a' : '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
        >
          {showNewForm ? '✕ Close' : '+ New Period'}
        </button>
      </div>

      {/* Rate reference */}
      <div style={{ background: '#f9f8f6', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>Pay Rates</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.4rem 2rem' }}>
          {[
            ['Group', '0–4 clients → $30 flat'],
            ['Group', '5–7 clients → $48 flat'],
            ['Group', '8 clients (full) → $58 flat'],
            ['Solo Private', '< 1 yr → $45 · 1+ yr → $55 · Master → custom'],
            ['Duet Private', '$40/person instructor (studio: $85 total)'],
            ['Trio Private', '$35/person instructor (studio: $75 total)'],
            ['Internal Event', '$75 flat'],
            ['External Event', '$100 flat'],
            ['Social Content', '$25/hr'],
            ['Front Desk', '$18/hr · OT $27/hr at 40+ hrs/week'],
            ['Manager (Susan)', '$1,000/period semi-monthly'],
          ].map(([label, val]) => (
            <div key={label + val} style={{ display: 'flex', gap: '0.5rem' }}>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.05em', color: '#1a1a1a', minWidth: '90px' }}>{label}</p>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#555' }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* New period form */}
      {showNewForm && (
        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '2rem', marginBottom: '2rem' }}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '1.25rem' }}>New Pay Period</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#808282', display: 'block', marginBottom: '0.35rem' }}>Period Start</label>
              <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
            </div>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#808282', display: 'block', marginBottom: '0.35rem' }}>Period End</label>
              <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#87CEBF')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
            </div>
            <button
              onClick={generatePeriod}
              disabled={generating}
              style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.68rem 1.5rem', background: generating ? '#b0ddd6' : '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: generating ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
            >
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa', marginTop: '0.75rem' }}>
            Auto-calculates from all sessions in this period. Front desk hours and social content can be added manually after.
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
            const employeeBreakdown = byEmployee(p.line_items)
            const isManualOpen = showManualForm === p.id

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
                    <span style={{ color: '#aaa', fontSize: '0.8rem' }}>{isSelected ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <div style={{ borderTop: '1px solid #eee', padding: '1.5rem' }}>

                    {/* Employee breakdown */}
                    {employeeBreakdown.length === 0 ? (
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#aaa', marginBottom: '1.5rem' }}>No line items yet. Generate from sessions or add entries manually.</p>
                    ) : (
                      <div style={{ marginBottom: '1.5rem' }}>
                        {employeeBreakdown.map(emp => (
                          <div key={emp.name} style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', paddingBottom: '0.4rem', borderBottom: '2px solid #f0f0f0' }}>
                              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1a1a' }}>{emp.name}</p>
                              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.9rem', color: '#87CEBF' }}>${emp.total.toFixed(2)}</p>
                            </div>
                            {emp.lines.map(l => {
                              const chip = LINE_TYPE_COLORS[l.line_type] ?? { bg: '#f5f5f5', color: '#808282' }
                              return (
                                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid #f8f8f8', gap: '1rem' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                      <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.15rem 0.45rem', borderRadius: '2px', background: chip.bg, color: chip.color }}>
                                        {LINE_TYPE_LABELS[l.line_type] ?? l.line_type}
                                      </span>
                                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#555' }}>
                                        {l.scheduled_sessions?.name ?? (l.line_type === 'manager_salary' ? 'Semi-monthly salary' : '')}
                                      </p>
                                    </div>
                                    {l.notes && (
                                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.68rem', color: '#aaa', marginTop: '0.15rem' }}>{l.notes}</p>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.82rem', color: '#1a1a1a', textAlign: 'right', minWidth: '60px' }}>${l.amount.toFixed(2)}</p>
                                    {!p.processed_at && (
                                      <button
                                        onClick={() => deleteLineItem(l.id)}
                                        style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', color: '#ddd', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem' }}
                                        title="Remove entry"
                                      >✕</button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ))}

                        {/* Total row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '2px solid #1a1a1a', marginTop: '0.5rem' }}>
                          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1a1a1a' }}>Total Payroll</p>
                          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '1rem', color: '#1a1a1a' }}>${total.toFixed(2)}</p>
                        </div>
                      </div>
                    )}

                    {/* Manual entry form */}
                    {!p.processed_at && isManualOpen && (
                      <div style={{ background: '#f9f8f6', borderRadius: '2px', padding: '1.25rem', marginBottom: '1rem' }}>
                        <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#808282', marginBottom: '1rem' }}>Add Manual Entry</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div>
                            <label style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#808282', display: 'block', marginBottom: '0.3rem' }}>Employee</label>
                            <select value={manualStaffId} onChange={e => setManualStaffId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                              <option value="">Select...</option>
                              {staff.map(s => (
                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#808282', display: 'block', marginBottom: '0.3rem' }}>Type</label>
                            <select value={manualLineType} onChange={e => setManualLineType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                              <option value="front_desk_hours">Front Desk Hours</option>
                              <option value="social_content">Social Content Hours</option>
                              <option value="manager_salary">Manager Salary</option>
                              <option value="adjustment">Adjustment / Other</option>
                            </select>
                          </div>
                          {(manualLineType === 'front_desk_hours' || manualLineType === 'social_content') ? (
                            <div>
                              <label style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#808282', display: 'block', marginBottom: '0.3rem' }}>
                                Hours · ${manualLineType === 'front_desk_hours' ? FRONT_DESK_RATE : SOCIAL_CONTENT_RATE}/hr
                              </label>
                              <input
                                type="number"
                                step="0.25"
                                placeholder="e.g. 6"
                                value={manualHours}
                                onChange={e => setManualHours(e.target.value)}
                                style={inputStyle}
                                onFocus={e => (e.target.style.borderColor = '#87CEBF')}
                                onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
                              />
                              {manualHours && !isNaN(parseFloat(manualHours)) && (
                                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.68rem', color: '#87CEBF', marginTop: '0.25rem' }}>
                                  = ${(parseFloat(manualHours) * (manualLineType === 'front_desk_hours' ? FRONT_DESK_RATE : SOCIAL_CONTENT_RATE)).toFixed(2)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <label style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#808282', display: 'block', marginBottom: '0.3rem' }}>Amount ($)</label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder={manualLineType === 'manager_salary' ? '1000.00' : '0.00'}
                                value={manualAmount}
                                onChange={e => setManualAmount(e.target.value)}
                                style={inputStyle}
                                onFocus={e => (e.target.style.borderColor = '#87CEBF')}
                                onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
                              />
                            </div>
                          )}
                          <div>
                            <label style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#808282', display: 'block', marginBottom: '0.3rem' }}>Notes (optional)</label>
                            <input
                              type="text"
                              placeholder="e.g. Mar 1–7 shifts"
                              value={manualNotes}
                              onChange={e => setManualNotes(e.target.value)}
                              style={inputStyle}
                              onFocus={e => (e.target.style.borderColor = '#87CEBF')}
                              onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={addManualEntry} disabled={addingManual} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', background: '#87CEBF', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>
                            {addingManual ? 'Adding...' : 'Add Entry'}
                          </button>
                          <button onClick={() => setShowManualForm(null)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', background: 'none', border: '1px solid #ddd', color: '#808282', borderRadius: '2px', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button onClick={() => exportCSV(p)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', border: '1px solid #87CEBF', background: 'white', color: '#87CEBF', borderRadius: '2px', cursor: 'pointer' }}>
                        Export CSV → Gusto
                      </button>
                      {!p.processed_at && (
                        <>
                          <button
                            onClick={() => setShowManualForm(isManualOpen ? null : p.id)}
                            style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', border: '1px solid #e0e0e0', background: 'white', color: '#808282', borderRadius: '2px', cursor: 'pointer' }}
                          >
                            + Manual Entry
                          </button>
                          <button onClick={() => markProcessed(p.id)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>
                            Mark Processed
                          </button>
                        </>
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
