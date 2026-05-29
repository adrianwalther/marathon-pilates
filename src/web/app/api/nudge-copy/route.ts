import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { CATALOG_BY_KEY, type ServiceKey } from '@/lib/nudges'

// AI-generated nudge copy in Ruby's brand voice. Strictly additive: the client
// already has a safe static template, so any failure here (no API key, model
// error, off-brand output) returns { message: null } and the UI keeps the
// template. This route never degrades the dashboard.

const SERVICE_KEYS = new Set<ServiceKey>([
  'group_reformer', 'private', 'sauna', 'cold_plunge', 'contrast_therapy', 'neveskin',
])

// Regenerate at most this often — copy is evergreen, so we mostly reuse.
const CACHE_TTL_DAYS = 30

const SYSTEM_PROMPT = `You write a single short nudge line for the client dashboard of Marathon Pilates, a warm, inclusive Pilates + wellness studio in Nashville owned by Ruby Ramdhan. Brand promise: "Move + Restore."

VOICE (match it exactly):
- Warm, encouraging, grounded, kind-hearted. Conversational but confident.
- Inclusive and welcoming — "come as you are," never intimidating.
- Celebrate the experience and how it feels, not the transaction.

HARD RULES (a violation makes the line unusable):
- Output ONLY the nudge line. No preamble, quotes, label, or sign-off.
- 1 to 2 sentences, ~30 words max.
- Address the client by their first name exactly once, naturally.
- NEVER mention prices, numbers, discounts, percentages, or stats.
- NEVER invent facts, results, or claims. No medical promises.
- Not salesy, no guilt-trips, no "no excuses," no hype. No emojis.
- Plain text only, one paragraph.`

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const serviceKey = body?.service_key
    if (typeof serviceKey !== 'string' || !SERVICE_KEYS.has(serviceKey as ServiceKey)) {
      return Response.json({ message: null }, { status: 400 })
    }
    const service = CATALOG_BY_KEY[serviceKey as ServiceKey]

    // Authenticate the caller (Bearer pattern, matches the other routes).
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return Response.json({ message: null }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1) Serve from cache when fresh.
    const { data: cached } = await supabase
      .from('nudge_copy')
      .select('message, created_at')
      .eq('client_id', user.id)
      .eq('service_key', serviceKey)
      .maybeSingle()

    if (cached?.message) {
      const ageMs = Date.now() - new Date(cached.created_at).getTime()
      if (ageMs < CACHE_TTL_DAYS * 86_400_000) {
        return Response.json({ message: cached.message, cached: true })
      }
    }

    // 2) No usable cache → generate. Bail to fallback if the key isn't set.
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ message: null })
    }

    // Pull the client's first name server-side (don't trust the client to send it).
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .single()
    const firstName = (profile?.first_name ?? '').trim() || 'there'

    const userPrompt = `Write the nudge line inviting ${firstName} to try our ${service.label}.

Here is our house example for this service — match its spirit and warmth, but write something fresh (do not copy it):
"${service.nudge.replace('{first}', firstName)}"`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = resp.content.find(b => b.type === 'text')
    let message = raw && raw.type === 'text' ? raw.text.trim() : ''
    // Strip wrapping quotes the model sometimes adds.
    message = message.replace(/^["'""]+|["'""]+$/g, '').trim()

    // Guardrails: reject off-spec output and fall back to the template.
    const ok =
      message.length > 0 &&
      message.length <= 280 &&
      !message.includes('$') &&
      !/\d/.test(message) && // no prices/stats/numbers
      !message.includes('\n\n') // single paragraph
    if (!ok) {
      return Response.json({ message: null })
    }

    // 3) Cache it (upsert on the (client_id, service_key) PK).
    await supabase.from('nudge_copy').upsert({
      client_id: user.id,
      service_key: serviceKey,
      message,
      model: 'claude-sonnet-4-6',
      created_at: new Date().toISOString(),
    })

    return Response.json({ message })
  } catch (err) {
    console.error('Nudge-copy error:', err)
    // Never hard-fail — the UI falls back to the static template.
    return Response.json({ message: null })
  }
}
