import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { getAiRatelimit } from "@/lib/ratelimit"

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `You are a master Pilates instructor with deep expertise in the BASI Block System, Polestar methodology, and BBU classical repertoire. You design safe, beautifully structured mat Pilates classes.

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

FOR EACH BLOCK, provide:
- 2-4 exercises appropriate to the difficulty level
- Sets × reps or duration (e.g., "3 × 8 reps" or "2 × 30 sec hold")
- One precise instructor cue per exercise (in italics using *cue text*)
- Any modifications noted with [MOD: ...]

DIFFICULTY GUIDELINES:
- Beginner: fundamental movements, smaller range of motion, more holds and breath work, no inversion
- Intermediate: full classical repertoire, controlled movement, some spinal loading, light props
- Advanced: full range, transitions, integrated movement, challenge through tempo and range

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

---
*Class designed with BASI Block System · Marathon Pilates*

Be specific, warm, and practical — this class should be ready to teach immediately.`

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
