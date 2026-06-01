import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { getAiRatelimit } from '@/lib/ratelimit'
import { isUuid } from '@/lib/validation'

// AI-generated post-class celebration line in Ruby's voice, keyed to the class
// the client just finished. Strictly additive: any failure returns
// { message: null } and the dashboard falls back to a static warm line.
//
// SAFETY: warm + aspirational only — never a medical/health claim, results
// promise, or numbers (calories/stats). Guarded by prompt + a regex check.

const SYSTEM_PROMPT = `You write ONE short, warm celebration line for the client dashboard of Marathon Pilates (a warm, inclusive Pilates + wellness studio; brand promise "Move + Restore"), shown right after a client finishes a class.

OUTPUT: only the line. No preamble, quotes, label, or sign-off.

RULES (strict):
- 1 to 2 sentences, ~30 words max. Address the client by first name exactly once.
- Reference what the class worked on, inferred from its name (e.g. core, arms, glutes, upper body, full body, recovery/restorative).
- Be encouraging about how they might FEEL afterward (stronger, energized, restored, accomplished) — aspirational and kind.
- NEVER promise results or improvements, cite numbers/stats/calories, make any medical or health claim, diagnose, or mention prices. No hype, no emojis.
- Warm, grounded, conversational. Plain text, one paragraph.`

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const sessionId = body?.session_id
    if (!isUuid(sessionId)) return Response.json({ message: null }, { status: 400 })

    // Authenticate the caller.
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

    // 1) Serve from cache.
    const { data: cached } = await supabase
      .from('post_class_copy')
      .select('message')
      .eq('client_id', user.id)
      .eq('session_id', sessionId)
      .maybeSingle()
    if (cached?.message) return Response.json({ message: cached.message, cached: true })

    // 2) Confirm the client actually has a (non-cancelled) booking for this
    // class — only celebrate something they did.
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, scheduled_sessions!inner(name, session_type)')
      .eq('client_id', user.id)
      .eq('session_id', sessionId)
      .in('status', ['confirmed', 'completed'])
      .maybeSingle()
    if (!booking) return Response.json({ message: null })

    const rel = (booking as { scheduled_sessions: { name?: string; session_type?: string } | { name?: string; session_type?: string }[] }).scheduled_sessions
    const sess = Array.isArray(rel) ? rel[0] : rel
    const className = sess?.name ?? 'your class'
    const sessionType = sess?.session_type ?? ''

    if (!process.env.ANTHROPIC_API_KEY) return Response.json({ message: null })

    const { success } = await getAiRatelimit().limit(`postclass:${user.id}`)
    if (!success) return Response.json({ message: null })

    const { data: profile } = await supabase
      .from('profiles').select('first_name').eq('id', user.id).single()
    const firstName = (profile?.first_name ?? '').trim() || 'there'

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Write the celebration line for ${firstName}, who just finished the class "${className}" (type: ${sessionType}). Reference what that class works on.` }],
    })
    const raw = resp.content.find(b => b.type === 'text')
    let message = raw && raw.type === 'text' ? raw.text.trim() : ''
    message = message.replace(/^["'“”]+|["'“”]+$/g, '').trim()

    // Guardrails — reject off-spec output and fall back to the static line.
    const ok =
      message.length > 0 &&
      message.length <= 280 &&
      !message.includes('$') &&
      !/\d/.test(message) && // no numbers/stats/calorie claims
      !message.includes('\n\n')
    if (!ok) return Response.json({ message: null })

    await supabase.from('post_class_copy').upsert({
      client_id: user.id,
      session_id: sessionId,
      message,
      model: 'claude-sonnet-4-6',
      created_at: new Date().toISOString(),
    })

    return Response.json({ message })
  } catch (err) {
    console.error('Post-class-copy error:', err)
    return Response.json({ message: null })
  }
}
