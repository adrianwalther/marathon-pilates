import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { getAiRatelimit } from "@/lib/ratelimit"

export const runtime = 'nodejs'

// Extract exercise names paired with cues for the visual display
function extractCueBlocks(classText: string): { block: string; exercise: string; cue: string }[] {
  const blocks: { block: string; exercise: string; cue: string }[] = []
  const lines = classText.split('\n')

  let currentBlock = ''
  let currentExercise = ''

  for (const line of lines) {
    const trimmed = line.trim()

    // Block header: ## WARM-UP (~5 min)
    if (trimmed.startsWith('## ')) {
      currentBlock = trimmed.slice(3).replace(/\(.*?\)/, '').trim()
      continue
    }

    // Exercise name: **Name** — 3 × 8 reps
    if (/^\*\*[^*]/.test(trimmed)) {
      const exercise = trimmed.replace(/\*\*/g, '').split(/[—–\-]/)[0].trim()
      if (exercise.length > 3) currentExercise = exercise
      continue
    }

    // Italic cue line — handles *text*, *"text"*, *\u201Ctext\u201D*
    // Matches: opening *, optional quote, content, optional quote, closing *
    const italicMatch = trimmed.match(/^\*["'\u201C\u2018]?(.+?)["'\u201D\u2019]?\*$/)
    if (italicMatch && !trimmed.startsWith('**')) {
      const cue = italicMatch[1].trim()
      if (cue.length > 5 && cue.length < 300) {
        blocks.push({ block: currentBlock, exercise: currentExercise, cue })
      }
    }
  }

  return blocks.slice(0, 20)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { success } = await getAiRatelimit().limit(user.id)
    if (!success) return new Response('Too many requests — please wait before generating audio.', { status: 429 })

    const { classText } = await req.json()
    if (!classText || classText.length > 50000) {
      return new Response('Invalid classText', { status: 400 })
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return new Response('ELEVENLABS_API_KEY is not set', { status: 500 })
    }

    const cueBlocks = extractCueBlocks(classText)
    const cues = cueBlocks.map(b => b.cue)

    if (cues.length === 0) {
      console.error('No cues found in class text. Sample:', classText.slice(0, 500))
      return new Response('Could not parse class cues. Please try generating the class again.', { status: 400 })
    }

    // Extract class title and meta
    const titleMatch = classText.match(/^# (.+)$/m)
    const metaMatch = classText.match(/^\*\*(.+)\*\*$/m)
    const title = titleMatch ? titleMatch[1] : 'your Pilates class'
    const meta = metaMatch ? metaMatch[1] : ''
    const parts = meta.split('·').map((s: string) => s.trim())
    const duration = parts[0] || ''
    const difficulty = parts[1] || ''
    const focus = parts[2] || ''

    const durationSpoken = duration.replace(/(\d+)\s*min.*/, '$1 minute')
    const introText = `Welcome to Marathon Pilates. Today's class is ${title}. ${durationSpoken ? `This is a ${durationSpoken}` : ''} ${difficulty ? difficulty.toLowerCase() : ''} Pilates class${focus ? `, focused on ${focus}` : ''}. Find a comfortable space, grab your mat, and take a moment to arrive. Close your eyes... take a full breath in... and when you're ready... we begin.`

    const script = introText + ' ................................ ' + cues.join(' .... ')

    // Use ElevenLabs with timestamps
    const voiceId = '21m00Tcm4TlvDq8ikWAM' // Rachel — calm, warm, meditation/wellness
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.80,
          similarity_boost: 0.75,
          style: 0.10,
          use_speaker_boost: false,
        },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('ElevenLabs error:', err)
      return new Response('Audio generation failed. Please try again.', { status: 500 })
    }

    const data = await response.json()

    const audioBase64: string = data.audio_base64
    const alignment = data.alignment // { characters, character_start_times_seconds, character_end_times_seconds }

    // Map each cue to its start time in the audio
    const cueTimings: { block: string; exercise: string; cue: string; startTime: number }[] = []

    if (alignment) {
      const chars: string[] = alignment.characters
      const startTimes: number[] = alignment.character_start_times_seconds

      let searchFrom = introText.length + 5 // skip past intro

      for (const block of cueBlocks) {
        const cueIdx = script.indexOf(block.cue, searchFrom)
        if (cueIdx >= 0 && cueIdx < chars.length) {
          cueTimings.push({
            ...block,
            startTime: startTimes[cueIdx] ?? 0,
          })
          searchFrom = cueIdx + block.cue.length
        }
      }
    } else {
      // Fallback: estimate timing based on position in script
      cueBlocks.forEach((block, i) => {
        cueTimings.push({ ...block, startTime: i * 8 })
      })
    }

    return new Response(JSON.stringify({
      audioBase64,
      cueTimings,
      title,
      meta,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error(err)
    return new Response("Something went wrong. Please try again.", { status: 500 })
  }
}
