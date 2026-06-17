import { createClient } from '@supabase/supabase-js'

// Integration health check. Hit GET /api/health after any deploy to see, at a
// glance, whether every external dependency is actually wired up. The database
// check ACTUALLY QUERIES with the service-role key, so a missing OR wrong/legacy
// key is caught here (that's the class of bug that silently 500s booking). The
// rest are presence checks. No secret values are ever returned.
//
// 200 = all green. 503 = at least one dependency is down/unconfigured.

export const dynamic = 'force-dynamic'

type Check = { ok: boolean; detail?: string }

export async function GET() {
  const checks: Record<string, Check> = {}

  // Database via the SERVICE-ROLE key — a real query so a wrong/missing/legacy
  // key fails here instead of as an opaque 500 inside booking/checkout.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    checks.database = { ok: false, detail: 'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set' }
  } else {
    try {
      const supabase = createClient(url, serviceKey)
      const { error } = await supabase.from('locations').select('id', { count: 'exact', head: true })
      checks.database = error
        ? { ok: false, detail: `service-role query failed (check SUPABASE_SERVICE_ROLE_KEY is the new sb_secret_ key): ${error.message}` }
        : { ok: true }
    } catch (e) {
      checks.database = { ok: false, detail: e instanceof Error ? e.message : 'unknown error' }
    }
  }

  // Presence checks (booleans only — never expose values).
  checks.payments = {
    ok: !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET,
    detail: !process.env.STRIPE_SECRET_KEY ? 'STRIPE_SECRET_KEY missing'
      : !process.env.STRIPE_WEBHOOK_SECRET ? 'STRIPE_WEBHOOK_SECRET missing' : undefined,
  }
  checks.rateLimit = {
    ok: !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN,
    detail: (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)
      ? 'UPSTASH_* missing — AI generation routes fail closed in production' : undefined,
  }
  checks.ai = {
    ok: !!process.env.ANTHROPIC_API_KEY && !!process.env.OPENAI_API_KEY && !!process.env.ELEVENLABS_API_KEY,
    detail: [
      !process.env.ANTHROPIC_API_KEY && 'ANTHROPIC_API_KEY',
      !process.env.OPENAI_API_KEY && 'OPENAI_API_KEY',
      !process.env.ELEVENLABS_API_KEY && 'ELEVENLABS_API_KEY',
    ].filter(Boolean).join(', ') || undefined,
  }
  checks.email = {
    ok: true, // dry-run is a valid state pre-launch, so this never fails the check
    detail: process.env.RESEND_API_KEY ? 'live' : 'dry-run (RESEND_API_KEY not set — emails logged, not sent)',
  }

  const ok = Object.values(checks).every(c => c.ok)
  return Response.json({ ok, checks }, { status: ok ? 200 : 503 })
}
