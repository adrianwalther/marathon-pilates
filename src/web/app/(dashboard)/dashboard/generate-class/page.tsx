'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

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
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [cueTimings, setCueTimings] = useState<{ block: string; exercise: string; cue: string; startTime: number }[]>([])
  const [currentCueIndex, setCurrentCueIndex] = useState(-1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedClasses, setSavedClasses] = useState<{ id: string; title: string | null; difficulty: string | null; focus_area: string | null; duration: number | null; created_at: string }[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)
  const musicRef = useRef<HTMLAudioElement>(null)

  const handleTimeUpdate = useCallback(() => {
    const el = audioRef.current
    if (!el || cueTimings.length === 0) return
    const t = el.currentTime
    // Find the last cue whose startTime has passed
    let idx = -1
    for (let i = 0; i < cueTimings.length; i++) {
      if (cueTimings[i].startTime <= t) idx = i
    }
    setCurrentCueIndex(idx)
  }, [cueTimings])

  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlayPause = useCallback(() => {
    const music = musicRef.current
    const voice = audioRef.current
    if (!voice) return

    if (isPlaying) {
      voice.pause()
      music?.pause()
      setIsPlaying(false)
    } else {
      // Start music first, then voice after 2.5s
      if (music) { music.volume = 0.10; music.play().catch(() => {}) }
      setTimeout(() => { voice.play().catch(() => {}) }, 2500)
      setIsPlaying(true)
    }
  }, [isPlaying])

  const handlePlay = useCallback(() => {}, [])

  const handleEnded2 = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handlePause = useCallback(() => {
    musicRef.current?.pause()
  }, [])

  const handleEnded = useCallback(() => {
    setCurrentCueIndex(-1)
    musicRef.current?.pause()
    if (musicRef.current) musicRef.current.currentTime = 0
  }, [])

  // Load saved classes on mount
  useEffect(() => {
    const loadSaved = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('generated_classes')
        .select('id, title, difficulty, focus_area, duration, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setSavedClasses(data)
    }
    loadSaved()
  }, [saved])

  const saveClass = async () => {
    if (!output || saving) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    // Extract title from first # line
    const titleLine = output.split('\n').find(l => l.startsWith('# '))
    const title = titleLine ? titleLine.slice(2).trim() : null
    const { error: saveError } = await supabase.from('generated_classes').insert({
      user_id: user?.id ?? null,
      title,
      duration,
      difficulty,
      focus_area: focusArea,
      props: selectedProps,
      class_text: output,
      image_url: imageUrl,
    })
    setSaving(false)
    if (!saveError) setSaved(true)
  }

  const generateAudio = async (classText: string) => {
    setAudioLoading(true)
    setAudioUrl(null)
    setCueTimings([])
    setCurrentCueIndex(-1)
    try {
      const supabaseAudio = createClient()
      const { data: { session: audioSession } } = await supabaseAudio.auth.getSession()
      const audioAuthHeader = audioSession ? `Bearer ${audioSession.access_token}` : ''
      const res = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': audioAuthHeader },
        body: JSON.stringify({ classText }),
      })
      if (res.ok) {
        const data = await res.json()
        // Convert base64 audio to a blob URL
        const byteChars = atob(data.audioBase64)
        const byteNums = new Uint8Array(byteChars.length)
        for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i)
        const blob = new Blob([byteNums], { type: 'audio/mpeg' })
        setAudioUrl(URL.createObjectURL(blob))
        setCueTimings(data.cueTimings ?? [])
      } else {
        const text = await res.text()
        setError('Audio error: ' + text)
      }
    } catch (err) {
      setError('Audio error: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setAudioLoading(false)
    }
  }

  const toggleProp = (prop: string) => {
    setSelectedProps(prev => prev.includes(prop) ? prev.filter(p => p !== prop) : [...prev, prop])
  }

  const generateClass = async () => {
    setGenerating(true)
    setOutput('')
    setError(null)
    setImageUrl(null)
    // Get auth token for protected API routes
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const authHeader = session ? `Bearer ${session.access_token}` : ''
    setImageLoading(true)
    setAudioUrl(null)
    setCueTimings([])
    setCurrentCueIndex(-1)
    setSaved(false)

    // Generate image in parallel
    fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      body: JSON.stringify({ focusArea, difficulty }),
    })
      .then(async r => {
        const text = await r.text()
        try {
          const data = JSON.parse(text)
          if (data.url) setImageUrl(data.url)
          else setError('Image error: ' + (data.error || text))
        } catch {
          setError('Image error: ' + text)
        }
      })
      .catch(err => setError('Image fetch failed: ' + err.message))
      .finally(() => setImageLoading(false))

    try {
      const res = await fetch('/api/generate-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
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
      if (!reader) {
        console.log('reader is null — body:', res.body)
        return
      }

      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setOutput(prev => prev + chunk)
      }
      // Only generate audio if the class text looks valid (not an API error)
      if (fullText.length > 200 && !fullText.includes('"type":"error"') && !fullText.startsWith('Error:')) {
        generateAudio(fullText)
      } else if (fullText.includes('"type":"error"') || fullText.startsWith('Error:')) {
        setError('Class generation failed — please try again.')
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

          {/* AI Image */}
          {(imageLoading || imageUrl) && (
            <div style={{ marginBottom: '2rem', borderRadius: '2px', overflow: 'hidden', background: '#f5f5f5', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {imageLoading && !imageUrl && (
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#aaa' }}>Generating image...</p>
              )}
              {imageUrl && (
                <img src={imageUrl} alt="AI generated Pilates" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
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
            <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f0f0f0' }}>
              {/* Audio player */}
              {(audioLoading || audioUrl) && (
                <div style={{ marginBottom: '1.25rem' }}>
                  {audioLoading && (
                    <div style={{ background: '#f9f8f6', borderRadius: '2px', padding: '1rem 1.25rem' }}>
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#aaa', margin: 0 }}>
                        Preparing voice cues...
                      </p>
                    </div>
                  )}
                  {audioUrl && (
                    <div>
                      {/* Label */}
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#87CEBF', marginBottom: '0.75rem' }}>
                        Voice Cues — Press play, put your phone down, and move
                      </p>

                      {/* Synced cue display */}
                      {cueTimings.length > 0 && (
                        <div style={{ background: '#f9f8f6', borderRadius: '2px', padding: '1.25rem 1.5rem', marginBottom: '0.75rem', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          {currentCueIndex < 0 ? (
                            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#bbb', margin: 0, fontStyle: 'italic' }}>
                              Press play to begin your class
                            </p>
                          ) : (
                            <>
                              {/* Block + exercise */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {cueTimings[currentCueIndex].block && (
                                  <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'white', background: '#87CEBF', padding: '0.2rem 0.6rem', borderRadius: '2px' }}>
                                    {cueTimings[currentCueIndex].block}
                                  </span>
                                )}
                                {cueTimings[currentCueIndex].exercise && (
                                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.78rem', color: '#1a1a1a' }}>
                                    {cueTimings[currentCueIndex].exercise}
                                  </span>
                                )}
                              </div>
                              {/* Cue text */}
                              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontStyle: 'italic', fontSize: '0.88rem', color: '#555', margin: 0, lineHeight: 1.5 }}>
                                {cueTimings[currentCueIndex].cue}
                              </p>
                              {/* Progress dots */}
                              <div style={{ display: 'flex', gap: '4px', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                {cueTimings.map((_, i) => (
                                  <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: i <= currentCueIndex ? '#87CEBF' : '#e0e0e0', transition: 'background 0.3s' }} />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Hidden music track */}
                      <audio
                        ref={musicRef}
                        src="/music/stillness.m4a"
                        loop
                        preload="auto"
                      />

                      {/* Hidden voice audio */}
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={() => { handleEnded(); handleEnded2(); }}
                      />

                      {/* Custom play/pause button */}
                      <button
                        onClick={handlePlayPause}
                        style={{
                          width: '100%', padding: '0.75rem',
                          background: isPlaying ? '#1a1a1a' : '#87CEBF',
                          border: 'none', borderRadius: '2px', cursor: 'pointer',
                          fontFamily: "'Raleway', sans-serif", fontWeight: 700,
                          fontSize: '0.65rem', letterSpacing: '0.14em',
                          textTransform: 'uppercase', color: 'white',
                        }}
                      >
                        {isPlaying ? '⏸ Pause' : '▶ Play Class'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={generateClass}
                  style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.25rem', border: 'none', borderRadius: '2px', background: '#87CEBF', color: 'white', cursor: 'pointer' }}>
                  Regenerate
                </button>
                <button
                  onClick={saveClass}
                  disabled={saving || saved}
                  style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.25rem', border: 'none', borderRadius: '2px', background: saved ? '#e8f7f4' : '#1a1a1a', color: saved ? '#87CEBF' : 'white', cursor: saved ? 'default' : 'pointer' }}>
                  {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Class'}
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
            </div>
          )}
        </div>
      )}

      {/* Saved classes */}
      {savedClasses.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#808282', marginBottom: '1rem' }}>
            Your Saved Classes
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {savedClasses.map(c => (
              <div key={c.id} style={{ background: 'white', border: '1px solid #eee', borderRadius: '2px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '0.85rem', color: '#1a1a1a', margin: '0 0 0.2rem' }}>
                    {c.title ?? 'Untitled Class'}
                  </p>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa', margin: 0 }}>
                    {c.duration}min · {c.difficulty} · {c.focus_area} · {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:1 } }
      `}</style>
    </div>
  )
}
