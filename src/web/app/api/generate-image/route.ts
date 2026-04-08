import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { getAiRatelimit } from "@/lib/ratelimit"

export const runtime = 'nodejs'

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

    const { focusArea, difficulty } = await req.json()

    if (!process.env.OPENAI_API_KEY) {
      return new Response('OPENAI_API_KEY is not set', { status: 500 })
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const prompt = `A serene wellness studio scene for a ${difficulty} Pilates class focused on ${focusArea}. Minimal, modern interior. Soft natural light, neutral tones, clean lines. A yoga mat, props, and peaceful atmosphere. No people. Editorial lifestyle photography style. Premium wellness brand aesthetic.`

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) {
      return new Response('No image returned', { status: 500 })
    }

    return new Response(JSON.stringify({ url: imageUrl }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response("Something went wrong. Please try again.", { status: 500 })
  }
}
