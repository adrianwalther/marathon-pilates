'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type OnDemandClass = {
  id: string
  title: string
  description: string | null
  duration_minutes: number
  difficulty_level: string | null
  focus_area: string[] | null
  props_required: string[] | null
  video_url: string | null
  thumbnail_url: string | null
  is_ai_generated: boolean
  view_count: number
  profiles: { first_name: string; last_name: string } | null
}

const DIFFICULTY_COLORS: Record<string, { bg: string; color: string }> = {
  beginner:     { bg: '#e8f7f4', color: '#87CEBF' },
  intermediate: { bg: '#fff8e6', color: '#c8860a' },
  advanced:     { bg: '#fef0f0', color: '#e05555' },
}

const FILTERS = ['All', 'Beginner', 'Intermediate', 'Advanced', 'AI Generated']

const PROPS_SHOP: Record<string, { name: string; url: string }> = {
  'resistance band': { name: 'Resistance Band', url: 'https://www.balancedbody.com/products/resistance-band' },
  'foam roller':     { name: 'Foam Roller', url: 'https://www.balancedbody.com/products/foam-roller' },
  'magic circle':    { name: 'Magic Circle', url: 'https://www.balancedbody.com/products/magic-circle' },
  'theraband':       { name: 'Theraband', url: 'https://www.balancedbody.com/products/theraband' },
  'small ball':      { name: 'Small Ball', url: 'https://www.balancedbody.com/products/small-ball' },
  'yoga block':      { name: 'Yoga Block', url: 'https://www.balancedbody.com/products/yoga-block' },
}

export default function OnDemandPage() {
  const [classes, setClasses] = useState<OnDemandClass[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState<OnDemandClass | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      let query = supabase
        .from('on_demand_classes')
        .select('id, title, description, duration_minutes, difficulty_level, focus_area, props_required, video_url, thumbnail_url, is_ai_generated, view_count, profiles(first_name, last_name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (filter === 'AI Generated') query = query.eq('is_ai_generated', true)
      else if (filter !== 'All') query = query.eq('difficulty_level', filter.toLowerCase())

      const { data } = await query
      setClasses((data ?? []) as unknown as OnDemandClass[])
      setLoading(false)
    }
    load()
  }, [filter])

  const pillStyle = (active: boolean) => ({
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700 as const,
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    padding: '0.4rem 1rem',
    borderRadius: '2px',
    border: active ? 'none' : '1px solid #e0e0e0',
    background: active ? '#87CEBF' : 'white',
    color: active ? 'white' : '#808282',
    cursor: 'pointer',
  })

  if (selected) {
    return <ClassDetail cls={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '0.5rem' }}>
          On Demand
        </h1>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#808282' }}>
          Mat Pilates classes — anytime, anywhere
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={pillStyle(filter === f)}>{f}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p>
      ) : classes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ccc', marginBottom: '0.75rem' }}>
            Classes Coming Soon
          </p>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#aaa' }}>
            Ruby and the team are building your on-demand library.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {classes.map(c => <ClassCard key={c.id} cls={c} onClick={() => setSelected(c)} />)}
        </div>
      )}
    </div>
  )
}

function ClassCard({ cls, onClick }: { cls: OnDemandClass; onClick: () => void }) {
  const diff = cls.difficulty_level ? DIFFICULTY_COLORS[cls.difficulty_level] : { bg: '#f0f0f0', color: '#808282' }

  return (
    <div
      onClick={onClick}
      style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', cursor: 'pointer', overflow: 'hidden', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Thumbnail */}
      <div style={{ height: '140px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {cls.thumbnail_url ? (
          <img src={cls.thumbnail_url} alt={cls.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', color: '#ccc' }}>▷</span>
        )}
        <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', color: 'white', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.08em', padding: '0.2rem 0.5rem', borderRadius: '2px' }}>
          {cls.duration_minutes} MIN
        </div>
        {cls.is_ai_generated && (
          <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: '#87CEBF', color: 'white', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '2px' }}>
            AI
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '1rem' }}>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.88rem', color: '#1a1a1a', marginBottom: '0.3rem', lineHeight: 1.3 }}>
          {cls.title}
        </p>
        {cls.profiles && (
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa', marginBottom: '0.5rem' }}>
            {cls.profiles.first_name} {cls.profiles.last_name}
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {cls.difficulty_level && (
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '2px', background: diff.bg, color: diff.color }}>
              {cls.difficulty_level}
            </span>
          )}
          {cls.focus_area?.slice(0, 2).map(f => (
            <span key={f} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.55rem', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '2px', background: '#f5f5f5', color: '#808282' }}>
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ClassDetail({ cls, onBack }: { cls: OnDemandClass; onBack: () => void }) {
  const diff = cls.difficulty_level ? DIFFICULTY_COLORS[cls.difficulty_level] : { bg: '#f0f0f0', color: '#808282' }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '800px' }}>
      <button onClick={onBack} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#808282', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '2rem', padding: 0 }}>
        ← Back
      </button>

      {/* Video player */}
      <div style={{ background: '#1a1a1a', borderRadius: '2px', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
        {cls.video_url ? (
          <video src={cls.video_url} controls style={{ width: '100%', height: '100%', borderRadius: '2px' }} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '3rem', color: '#333' }}>▷</p>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.8rem', color: '#555' }}>Video coming soon</p>
          </div>
        )}
      </div>

      {/* Title + meta */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', margin: 0 }}>
            {cls.title}
          </h1>
          {cls.is_ai_generated && (
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.25rem 0.6rem', borderRadius: '2px', background: '#87CEBF', color: 'white' }}>
              AI Generated
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#808282' }}>{cls.duration_minutes} min</span>
          {cls.difficulty_level && (
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '2px', background: diff.bg, color: diff.color }}>
              {cls.difficulty_level}
            </span>
          )}
          {cls.profiles && (
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#808282' }}>
              with {cls.profiles.first_name} {cls.profiles.last_name}
            </span>
          )}
        </div>
      </div>

      {cls.description && (
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#555', lineHeight: 1.8, marginBottom: '2rem' }}>
          {cls.description}
        </p>
      )}

      {/* Focus areas */}
      {cls.focus_area && cls.focus_area.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.6rem' }}>Focus Areas</p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {cls.focus_area.map(f => (
              <span key={f} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.35rem 0.75rem', borderRadius: '2px', background: '#f5f5f5', color: '#555' }}>{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Props shop */}
      {cls.props_required && cls.props_required.length > 0 && (
        <div style={{ background: '#f9f8f6', border: '1px solid #eee', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>
            Props for This Class
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {cls.props_required.map(prop => {
              const shop = PROPS_SHOP[prop.toLowerCase()]
              return (
                <div key={prop} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#1a1a1a' }}>{prop}</span>
                  {shop && (
                    <a href={shop.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#87CEBF', textDecoration: 'none' }}>
                      Shop →
                    </a>
                  )}
                </div>
              )
            })}
          </div>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#aaa', marginTop: '0.75rem' }}>
            Balanced Body affiliate links — same price, supports the studio.
          </p>
        </div>
      )}
    </div>
  )
}
