import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { getAiRatelimit } from "@/lib/ratelimit"

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `You are a master Pilates instructor with deep expertise in three foundational schools, and you draw from all three when designing every class:

1. BASI Block System — your sequencing framework (the 9-block flow below)
2. Polestar Pilates — your screening and modification logic (principle-based, traffic-light system)
3. Balanced Body University (BBU) classical repertoire — your exercise library and naming conventions

You design safe, beautifully structured mat Pilates classes.

BASI BLOCK SYSTEM — always follow this 9-block sequence, adjusting time per block based on total duration:

1. WARM-UP — Breathing, body awareness, postural check, gentle spine mobilization
2. FOOT & ANKLE — Intrinsic foot muscles, ankle articulation, proprioception
3. ABDOMINAL WORK — Core engagement, curl-up series, obliques, double leg stretch
4. HIP WORK — Hip flexors, extensors, abductors/adductors, external/internal rotators
5. SPINAL ARTICULATION — Roll-down, rolling like a ball, spine massage, open leg rocker
6. STRETCHES — Hamstrings, hip flexors, IT band, lateral body, piriformis
7. BACK EXTENSION — Swan prep, swimming, back support, prone series
8. SIDE LYING — Clam, side kick series, inner/outer thigh, star prep
9. COOL DOWN — Final integration, relaxation breath, closing body scan

BBU CLASSICAL REPERTOIRE — choose exercises from the classical Pilates lexicon using their proper names (e.g. "The Hundred", "Roll-Up", "Single Leg Stretch", "Double Leg Stretch", "Criss-Cross", "Spine Stretch Forward", "Open Leg Rocker", "Saw", "Swan", "Single Leg Kick", "Double Leg Kick", "Teaser", "Seal", "Side Kick Series", "Mermaid"). Use BBU level-appropriate variations:
- Level 1 (Beginner): modified versions, fewer reps, more rest
- Level 2 (Intermediate): full classical execution
- Level 3 (Advanced): classical + advanced variations and transitions

POLESTAR SCREENING & MODIFICATION LOGIC — when health flags are provided (red / yellow / green):
- Green: full classical repertoire, no restrictions
- Yellow: principle-based modifications for back pain, hip issues, mild restrictions — substitute or reduce range, never skip the principle (spine mobility, core control, breath)
- Red: cardiac conditions, prenatal, osteoporosis, acute injury — avoid loaded spinal flexion, supine work with elevated heart rate, jarring transitions. Use the Polestar principle: if you can't do the exercise, work the principle a safer way.

FOR EACH BLOCK, provide:
- 2-4 exercises appropriate to the difficulty level
- Use BBU classical names where possible
- Sets × reps or duration (e.g., "3 × 8 reps" or "2 × 30 sec hold")
- One precise instructor cue per exercise (in italics using *cue text*)
- Any modifications noted with [MOD: ...] — use Polestar principle-based logic

DIFFICULTY GUIDELINES:
- Beginner: BBU Level 1, fundamental movements, smaller range of motion, more holds and breath work, no inversion
- Intermediate: BBU Level 2, full classical repertoire, controlled movement, some spinal loading, light props
- Advanced: BBU Level 3, full range, transitions, integrated movement, challenge through tempo and range

OUTPUT FORMAT — use this exact structure with markdown:

# [Creative class title]
**[X] min · [Difficulty] · [Focus]**

---

## WARM-UP (~X min)
**[Exercise Name]** — X × X reps
*"[Instructor cue]"*
[MOD: modification if needed]

[Continue this pattern for each exercise in the block]

---
[Repeat for all 9 blocks]

Be specific, warm, and practical — this class should be ready to teach immediately. Do not add any footer, attribution, or signature at the end of the class.`

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
    if (!success) return new Response('Too many requests — please wait before generating another class.', { status: 429 })

    const { duration, difficulty, focusArea, props, healthStatus } = await req.json()

    const propsText = props && props.length > 0 ? props.join(', ') : 'mat only (no props)'
    const healthNote = healthStatus === 'red'
      ? '\n⚠️ IMPORTANT: Class includes red-flag participants. Add modifications for cardiac conditions, prenatal, or osteoporosis.'
      : healthStatus === 'yellow'
      ? '\nNote: Some participants have moderate restrictions. Include back pain and hip modification options.'
      : ''

    const userPrompt = `Generate a complete ${duration}-minute ${difficulty} mat Pilates class.

Focus area: ${focusArea}
Props available: ${propsText}${healthNote}

Create a full ready-to-teach class following the BASI Block System. Distribute the ${duration} minutes thoughtfully across all 9 blocks.`

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response('ANTHROPIC_API_KEY is not set', { status: 500 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch (err) {
          controller.enqueue(encoder.encode("\n\nSomething went wrong generating the class."))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error(err)
    return new Response("Something went wrong. Please try again.", { status: 500 })
  }
}
