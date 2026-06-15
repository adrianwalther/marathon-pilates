import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { getAiRatelimit } from "@/lib/ratelimit"

export const runtime = 'nodejs'
export const maxDuration = 60  // gpt-image-1 generation can take 15-30s

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
    if (!success) return new Response('Too many requests', { status: 429 })

    const body = await req.json().catch(() => ({}))
    // Bound user-supplied inputs — they feed a paid image-generation call.
    const focusArea = (typeof body?.focusArea === 'string' ? body.focusArea : 'full body').slice(0, 120)
    const difficulty = (typeof body?.difficulty === 'string' ? body.difficulty : 'intermediate').slice(0, 20)

    if (!process.env.OPENAI_API_KEY) {
      return new Response('OPENAI_API_KEY is not set', { status: 500 })
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Marathon Pilates brand: warm earth tones (moss, terracotta, sandstone, rose clay)
    // Aesthetic: bright + natural light, organic + minimal, "Move + Restore"
    const prompt = `A serene Pilates studio scene for a ${difficulty} class focused on ${focusArea}. Bright, natural morning light streaming through windows. Warm earth-tone palette: moss green, terracotta, sandstone beige, rose clay accents. Organic minimal interior with wood textures and natural textiles. A yoga mat and a few simple props (resistance band, foam roller) arranged with intention. Peaceful, grounded atmosphere. No people. Editorial lifestyle photography style, soft focus, premium wellness brand aesthetic.`

    const response = await client.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1536x1024',
      quality: 'medium',
    })

    const b64 = response.data?.[0]?.b64_json
    if (!b64) {
      console.error('No image returned from OpenAI:', JSON.stringify(response).slice(0, 200))
      return new Response('No image returned', { status: 500 })
    }

    // Return as a data URL so the frontend can use it directly in <img src>
    const dataUrl = `data:image/png;base64,${b64}`
    return new Response(JSON.stringify({ url: dataUrl }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Image generation error:', err)
    return new Response("Something went wrong. Please try again.", { status: 500 })
  }
}
