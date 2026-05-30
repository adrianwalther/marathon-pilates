import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { getAiRatelimit } from '@/lib/ratelimit'
import { composeHealthFlags } from '@/lib/healthFlags'

// Turns a client's free-text health note into short, neutral flags a Pilates
// instructor can scan on the roster (e.g. "Lower back", "Right knee"). Stored on
// the client's profile (health_flags). The client calls this at intake; a
// service-role backfill can call the same generation for existing clients.
//
// SAFETY GUARDRAIL: the model ONLY restates what the client wrote, as neutral
// noun-phrase flags. It must NOT add advice, restrictions, diagnoses, or
// anything the client didn't say — the studio is not giving medical guidance.

const SYSTEM_PROMPT = `You convert a Pilates client's self-reported health note into a short list of flags an instructor can scan before class.

OUTPUT: a JSON array of 1–6 short strings. Nothing else.

RULES (strict):
- Each flag is a neutral noun phrase of 1–4 words naming a body area or condition the client MENTIONED (e.g. "Lower back", "Right knee", "Shoulder", "Recent C-section", "Wrist").
- ONLY restate what the client wrote. Do NOT add advice, movement restrictions, diagnoses, severity, or anything they didn't say. No phrases like "avoid", "no flexion", "be careful".
- Title Case. No punctuation, no emojis, no sentences.
- If the note is empty or has no health content, return [].
- Never invent. When unsure, leave it out.`

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    // Cap the client-supplied note before it reaches the model (cost/abuse guard).
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 2000) : ''
    const prenatal = body?.prenatal === true

    // Authenticate the caller; flags are written to THEIR profile only.
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return Response.json({ flags: null }, { status: 401 })

    // Rate-limit the model call (uncached → real cost). Graceful: on limit we
    // return null and the caller keeps whatever flags already exist.
    const { success } = await getAiRatelimit().limit(`health:${user.id}`)
    if (!success) return Response.json({ flags: null })

    // Prenatal is set directly; the note is structured by the model. The
    // model's raw output is sanitized by composeHealthFlags (the guardrail).
    let parsed: unknown = []
    if (note && process.env.ANTHROPIC_API_KEY) {
      try {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        const resp = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 200,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `Client note:\n"${note}"` }],
        })
        const raw = resp.content.find(b => b.type === 'text')
        const text = raw && raw.type === 'text' ? raw.text.trim() : '[]'
        parsed = JSON.parse(text)
      } catch {
        // Model/parse failure → a single generic flag so the trainer still
        // knows there's a note to review.
        parsed = ['Health note — review']
      }
    }

    const flags = composeHealthFlags(prenatal, parsed)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabase
      .from('profiles')
      .update({ health_flags: flags, health_flags_at: new Date().toISOString() })
      .eq('id', user.id)

    return Response.json({ flags })
  } catch (err) {
    console.error('Health-flags error:', err)
    return Response.json({ flags: null })
  }
}
