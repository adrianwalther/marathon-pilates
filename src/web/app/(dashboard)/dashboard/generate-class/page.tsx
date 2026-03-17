'use client'

import { useState } from 'react'

const DURATIONS = [30, 45, 60]
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
const FOCUS_AREAS = [
  'Full Body',
  'Core & Abs',
  'Hip Mobility',
  'Spinal Health',
  'Strength',
  'Flexibility',
  'Back Care',
  'Posture',
]
const PROPS = [
  'Magic Circle',
  'Resistance Band',
  'Foam Roller',
  'Small Ball',
  'Theraband',
  'Yoga Block',
]

const DIFFICULTY_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  beginner:     { border: '#87CEBF', bg: '#e8f7f4', text: '#87CEBF' },
  intermediate: { border: '#c8860a', bg: '#fff8e6', text: '#c8860a' },
  advanced:     { border: '#e05555', bg: '#fef0f0', text: '#e05555' },
}

function renderLine(line: string, idx: number) {
  // H1 — class title
  if (line.startsWith('# ')) {
    return (
      <h2 key={idx} style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', margin: '0 0 0.25rem' }}>
        {line.slice(2)}
      </h2>
    )
  }
  // H2 — block headers
  if (line.startsWith('## ')) {
    return (
      <div key={idx} style={{ marginTop: '2rem', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid #e8e8e8' }}>
        <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#87CEBF' }}>
          {line.slice(3)}
        </span>
      </div>
    )
  }
  // Bold meta line (duration · difficulty · focus)
  if (line.startsWith('**') && line.endsWith('**')) {
    return (
      <p key={idx} style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.8rem', color: '#808282', marginBottom: '1rem' }}>
        {line.slice(2, -2)}
      </p>
    )
  }
  // HR divider
  if (line === '---') {
    return <div key={idx} style={{ borderTop: '1px solid #f0f0f0', margin: '0.5rem 0' }} />
  }
  // Bold exercise name
  if (line.startsWith('**') && line.includes('**')) {
    const stripped = line.replace(/\*\*/g, '')
    return (
      <p key={idx} style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.88rem', color: '#1a1a1a', margin: '0.85rem 0 0.15rem' }}>
        {stripped}
      </p>
    )
  }
  // Italic cue lines
  if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
    return (
      <p key={idx} style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontStyle: 'italic', fontSize: '0.82rem', color: '#87CEBF', margin: '0.1rem 0 0.1rem 1rem' }}>
        {line.slice(1, -1)}
      </p>
    )
  }
  // MOD lines
  if (line.includes('[MOD:')) {
    return (
      <p key={idx} style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#c8860a', margin: '0.1rem 0 0.1rem 1rem' }}>
        {line}
      </p>
    )
  }
  // Empty lines
  if (!line.trim()) return <div key={idx} style={{ height: '0.25rem' }} />
  // Default body text
  return (
    <p key={idx} style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#555', margin: '0.1rem 0', lineHeight: 1.6 }}>
      {line}
    </p>
  )
}

export default function GenerateClassPage() {
  const [duration, setDuration] = useState(45)
  const [difficulty, setDifficulty] = useState('intermediate')
  const [focusArea, setFocusArea] = useState('Full Body')
  const [selectedProps, setSelectedProps] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const toggleProp = (prop: string) => {
    setSelectedProps(prev => prev.includes(prop) ? prev.filter(p => p !== prop) : [...prev, prop])
  }

  const generateClass = async () => {
    setGenerating(true)
    setOutput('')
    setError(null)

    try {
      const res = await fetch('/api/generate-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration, difficulty, focusArea, props: selectedProps, healthStatus: 'green' }),
      })

      if (!res.ok) {
        const text = await res.text()
        if (text.includes('ANTHROPIC_API_KEY')) {
          setError('API key not configured. Add ANTHROPIC_API_KEY to your .env.local file.')
        } else {
          setError(`Error generating class (${res.status})`)
        }
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setOutput(prev => prev + decoder.decode(value, { stream: true }))
      }
    } catch {
      setError('Could not connect to the generator. Check your API key.')
    } finally {
      setGenerating(false)
    }
  }

  const diffColors = DIFFICULTY_COLORS[difficulty]
  const lines = output.split('\n')

  const pillStyle = (active: boolean) => ({
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 700,
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

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '860px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '0.4rem' }}>
          AI Class Generator
        </h1>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#808282' }}>
          BASI Block System · Polestar Methodology · Infinite unique classes
        </p>
      </div>

      {/* Controls */}
      <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '2rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* Duration */}
        <div>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>Duration</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {DURATIONS.map(d => (
              <button key={d} onClick={() => setDuration(d)} style={pillStyle(duration === d)}>
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>Difficulty</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {DIFFICULTIES.map(d => {
              const c = DIFFICULTY_COLORS[d]
              const active = difficulty === d
              return (
                <button key={d} onClick={() => setDifficulty(d)} style={{
                  fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.4rem 1rem', borderRadius: '2px', cursor: 'pointer',
                  border: `1px solid ${active ? c.border : '#e0e0e0'}`,
                  background: active ? c.bg : 'white',
                  color: active ? c.text : '#808282',
                }}>
                  {d}
                </button>
              )
            })}
          </div>
        </div>

        {/* Focus area */}
        <div>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>Focus Area</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {FOCUS_AREAS.map(f => (
              <button key={f} onClick={() => setFocusArea(f)} style={pillStyle(focusArea === f)}>{f}</button>
            ))}
          </div>
        </div>

        {/* Props */}
        <div>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.75rem' }}>
            Props Available <span style={{ fontWeight: 400, letterSpacing: '0.05em', textTransform: 'none', color: '#aaa' }}>— optional</span>
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {PROPS.map(p => (
              <button key={p} onClick={() => toggleProp(p)} style={pillStyle(selectedProps.includes(p))}>{p}</button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generateClass}
          disabled={generating}
          style={{
            alignSelf: 'flex-start',
            fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase',
            padding: '0.85rem 2.5rem', borderRadius: '2px', border: 'none',
            background: generating ? '#b0ddd6' : '#87CEBF', color: 'white',
            cursor: generating ? 'not-allowed' : 'pointer',
          }}
        >
          {generating ? 'Generating class...' : 'Generate Class'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fef0f0', border: '1px solid #e05555', borderRadius: '2px', padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.85rem', color: '#e05555' }}>{error}</p>
          {error.includes('API key') && (
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#808282', marginTop: '0.5rem' }}>
              Add <code style={{ background: '#f5f5f5', padding: '0.1rem 0.4rem', borderRadius: '2px', fontSize: '0.82rem' }}>ANTHROPIC_API_KEY=sk-ant-...</code> to <code style={{ background: '#f5f5f5', padding: '0.1rem 0.4rem', borderRadius: '2px', fontSize: '0.82rem' }}>.env.local</code>
            </p>
          )}
        </div>
      )}

      {/* Output */}
      {(output || generating) && (
        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '2rem 2.5rem', position: 'relative' }}>

          {/* Difficulty badge */}
          {output && (
            <span style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.3rem 0.7rem', borderRadius: '2px', background: diffColors.bg, color: diffColors.text }}>
              {difficulty}
            </span>
          )}

          {/* Streaming placeholder */}
          {generating && !output && (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#87CEBF', animation: 'pulse 1s infinite' }} />
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#aaa' }}>Designing your class...</p>
            </div>
          )}

          {/* Rendered output */}
          <div style={{ lineHeight: 1.7 }}>
            {lines.map((line, i) => renderLine(line, i))}
            {generating && output && (
              <span style={{ display: 'inline-block', width: '2px', height: '1em', background: '#87CEBF', verticalAlign: 'text-bottom', animation: 'blink 0.8s infinite' }} />
            )}
          </div>

          {/* Actions */}
          {!generating && output && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f0f0f0' }}>
              <button
                onClick={generateClass}
                style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.25rem', border: 'none', borderRadius: '2px', background: '#87CEBF', color: 'white', cursor: 'pointer' }}>
                Regenerate
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([output], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url; a.download = `pilates-class-${duration}min-${difficulty}.txt`; a.click()
                  URL.revokeObjectURL(url)
                }}
                style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.25rem', border: '1px solid #e0e0e0', borderRadius: '2px', background: 'white', color: '#808282', cursor: 'pointer' }}>
                Download
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:1 } }
      `}</style>
    </div>
  )
}
