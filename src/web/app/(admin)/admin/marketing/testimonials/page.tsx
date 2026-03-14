'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const TEAL = '#87CEBF'

type Testimonial = {
  id: string
  client_id: string | null
  client_name: string
  content: string
  rating: number
  service_type: string
  status: 'pending' | 'approved' | 'published' | 'rejected'
  published_at: string | null
  show_on_website: boolean
  source: 'in_app' | 'google' | 'yelp' | 'manual'
  created_at: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#fef9c3', text: '#854d0e' },
  approved: { bg: '#dbeafe', text: '#1d4ed8' },
  published: { bg: '#d1fae5', text: '#065f46' },
  rejected: { bg: '#fee2e2', text: '#991b1b' },
}

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  in_app: { bg: '#f0fdf4', text: '#15803d' },
  google: { bg: '#eff6ff', text: '#1d4ed8' },
  yelp: { bg: '#fff1f2', text: '#be123c' },
  manual: { bg: '#f3f4f6', text: '#4b5563' },
}

const SERVICE_LABELS: Record<string, string> = {
  group_reformer: 'Group Reformer',
  private: 'Private',
  sauna: 'Sauna',
  cold_plunge: 'Cold Plunge',
  contrast_therapy: 'Contrast Therapy',
}

type Filter = 'all' | 'pending' | 'approved' | 'published' | 'rejected'

export default function TestimonialsPage() {
  const supabase = createClient()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    client_name: '',
    content: '',
    rating: 5,
    service_type: 'group_reformer',
    source: 'manual' as 'in_app' | 'google' | 'yelp' | 'manual',
  })

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false })
    setTestimonials((data as Testimonial[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function approve(id: string) {
    await supabase.from('testimonials').update({ status: 'approved' }).eq('id', id)
    load()
  }

  async function reject(id: string) {
    await supabase.from('testimonials').update({ status: 'rejected' }).eq('id', id)
    load()
  }

  async function publish(id: string) {
    await supabase.from('testimonials').update({ status: 'published', show_on_website: true, published_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  async function unpublish(id: string) {
    await supabase.from('testimonials').update({ status: 'approved', show_on_website: false }).eq('id', id)
    load()
  }

  async function submitTestimonial() {
    if (!form.client_name || !form.content) return
    setSaving(true)
    await supabase.from('testimonials').insert({ ...form, status: 'pending' })
    setSaving(false)
    setShowModal(false)
    setForm({ client_name: '', content: '', rating: 5, service_type: 'group_reformer', source: 'manual' })
    load()
  }

  const pending = testimonials.filter(t => t.status === 'pending').length
  const published = testimonials.filter(t => t.status === 'published').length

  const filtered = filter === 'all' ? testimonials : testimonials.filter(t => t.status === filter)

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', padding: '2rem', background: '#f9f8f6', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase', margin: 0 }}>MARKETING</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#1a1a1a', margin: '0.25rem 0 0' }}>Testimonials</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 2, padding: '0.6rem 1.2rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          + Add Testimonial
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'TOTAL', value: testimonials.length },
          { label: 'PENDING REVIEW', value: pending },
          { label: 'PUBLISHED', value: published },
          { label: 'AVG RATING', value: testimonials.length > 0 ? (testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length).toFixed(1) : '—' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 2, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>{s.label}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 300, color: '#1a1a1a', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: '#fff', padding: '0.25rem', borderRadius: 2, width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {(['all', 'pending', 'approved', 'published', 'rejected'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? TEAL : 'transparent',
              color: filter === f ? '#fff' : '#6b7280',
              border: 'none',
              borderRadius: 2,
              padding: '0.4rem 0.875rem',
              fontSize: '0.75rem',
              fontFamily: 'Raleway, sans-serif',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pending > 0 && (
              <span style={{ background: filter === 'pending' ? 'rgba(255,255,255,0.3)' : '#ef4444', color: filter === 'pending' ? '#fff' : '#fff', borderRadius: '999px', fontSize: '0.65rem', padding: '0 0.375rem', lineHeight: '1.4' }}>{pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Testimonials grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>No testimonials in this category.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filtered.map(t => (
            <div key={t.id} style={{ background: '#fff', borderRadius: 2, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1a1a1a', margin: 0 }}>{t.client_name}</p>
                  <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ color: i < t.rating ? '#f59e0b' : '#e5e7eb', fontSize: '0.75rem' }}>★</span>
                    ))}
                  </div>
                </div>
                <span style={{ background: STATUS_COLORS[t.status].bg, color: STATUS_COLORS[t.status].text, padding: '0.2rem 0.6rem', borderRadius: 2, fontSize: '0.65rem', fontFamily: 'Raleway, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {t.status}
                </span>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                "{t.content}"
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.15rem 0.5rem', borderRadius: 2, fontSize: '0.65rem', fontFamily: 'Raleway, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {SERVICE_LABELS[t.service_type] || t.service_type}
                </span>
                <span style={{ background: SOURCE_COLORS[t.source].bg, color: SOURCE_COLORS[t.source].text, padding: '0.15rem 0.5rem', borderRadius: 2, fontSize: '0.65rem', fontFamily: 'Raleway, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {t.source}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.25rem', borderTop: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
                {t.status === 'pending' && (
                  <>
                    <button onClick={() => approve(t.id)} style={{ background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: 2, padding: '0.3rem 0.75rem', fontSize: '0.7rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase', cursor: 'pointer' }}>Approve</button>
                    <button onClick={() => reject(t.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 2, padding: '0.3rem 0.75rem', fontSize: '0.7rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase', cursor: 'pointer' }}>Reject</button>
                  </>
                )}
                {t.status === 'approved' && (
                  <button onClick={() => publish(t.id)} style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 2, padding: '0.3rem 0.875rem', fontSize: '0.7rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase', cursor: 'pointer' }}>Publish to Website</button>
                )}
                {t.status === 'published' && (
                  <button onClick={() => unpublish(t.id)} style={{ background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 2, padding: '0.3rem 0.75rem', fontSize: '0.7rem', fontFamily: 'Raleway, sans-serif', textTransform: 'uppercase', cursor: 'pointer' }}>Unpublish</button>
                )}
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#9ca3af', alignSelf: 'center' }}>
                  {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 2, padding: '2rem', width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 400, color: '#1a1a1a', margin: '0 0 1.5rem' }}>Add Testimonial</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Client Name</label>
                <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Review</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Rating</label>
                  <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}>
                    {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} stars</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Service</label>
                  <select value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}>
                    <option value='group_reformer'>Group Reformer</option>
                    <option value='private'>Private</option>
                    <option value='sauna'>Sauna</option>
                    <option value='cold_plunge'>Cold Plunge</option>
                    <option value='contrast_therapy'>Contrast Therapy</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 4 }}>Source</label>
                  <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as 'in_app' | 'google' | 'yelp' | 'manual' }))} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}>
                    <option value='manual'>Manual</option>
                    <option value='in_app'>In-App</option>
                    <option value='google'>Google</option>
                    <option value='yelp'>Yelp</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer', color: '#6b7280' }}>Cancel</button>
              <button onClick={submitTestimonial} disabled={saving} style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 2, padding: '0.5rem 1.25rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Add Testimonial'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
