import Stripe from 'stripe'

// Central registry of required server environment variables + helpers that make
// a missing one OBVIOUS instead of a cryptic runtime crash.
//
// - instrumentation.ts calls getMissingEnv() once at server boot and logs any
//   gaps loudly (so a misconfigured deploy is caught immediately).
// - Feature guards (getStripe) throw a clear, named error; routes catch it and
//   return a friendly message instead of a 500 stack trace.

export const REQUIRED_ENV: Record<string, string[]> = {
  core:      ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  payments:  ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
  rateLimit: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
  ai:        ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'ELEVENLABS_API_KEY'],
}

// Returns the missing required vars grouped by concern (empty object = all set).
export function getMissingEnv(): Record<string, string[]> {
  const missing: Record<string, string[]> = {}
  for (const [group, vars] of Object.entries(REQUIRED_ENV)) {
    const m = vars.filter(v => !process.env[v])
    if (m.length) missing[group] = m
  }
  return missing
}

// Stripe client, or a clear error if STRIPE_SECRET_KEY isn't set. Cached per
// warm serverless instance.
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  if (!_stripe) _stripe = new Stripe(key)
  return _stripe
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

// Friendly 503 for user-facing checkout routes when payments aren't configured.
export function stripeNotConfiguredResponse() {
  return Response.json(
    { error: "Payments aren't set up yet — please contact the studio." },
    { status: 503 },
  )
}
