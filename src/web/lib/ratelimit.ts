import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type Limiter = { limit: (_id: string) => Promise<{ success: boolean }> }

// Used when Redis isn't configured. ALLOW = let requests through (core flows
// shouldn't break if the limiter backend blips). DENY = block (used for the
// expensive AI routes, so a missing/misconfigured backend can't silently open a
// real-money cost-abuse window).
const ALLOW: Limiter = { limit: async (_id: string) => ({ success: true }) }
const DENY: Limiter = { limit: async (_id: string) => ({ success: false }) }

const IS_PROD = process.env.NODE_ENV === 'production'

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

// failClosed: in production, if Redis is unavailable, DENY instead of ALLOW.
// Set for endpoints where unthrottled abuse costs real money (AI generation).
function makeRatelimit(prefix: string, limiter: Ratelimit['limiter'], failClosed = false) {
  const redis = getRedis()
  if (!redis) {
    if (IS_PROD) {
      console.error(
        `[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set — '${prefix}' limiter is ` +
        `${failClosed ? 'FAILING CLOSED (requests denied)' : 'DISABLED (requests allowed)'}. ` +
        `Configure Upstash in production.`
      )
    }
    return failClosed && IS_PROD ? DENY : ALLOW
  }
  return new Ratelimit({ redis, limiter, prefix })
}

// AI generation — 10 requests per user per hour. Fails CLOSED in prod: these
// calls cost real money (Anthropic/OpenAI/ElevenLabs), so no silent open window.
export function getAiRatelimit() {
  return makeRatelimit('rl:ai', Ratelimit.slidingWindow(10, '1 h'), true)
}

// Checkout — 20 requests per user per hour
export function getCheckoutRatelimit() {
  return makeRatelimit('rl:checkout', Ratelimit.slidingWindow(20, '1 h'))
}

// Bookings — 60 requests per user per hour
export function getBookingRatelimit() {
  return makeRatelimit('rl:booking', Ratelimit.slidingWindow(60, '1 h'))
}

// Behavioral telemetry — generous (a normal session emits a few dozen events);
// this only catches pathological spam, and a dropped event is harmless.
export function getEventsRatelimit() {
  return makeRatelimit('rl:events', Ratelimit.slidingWindow(200, '1 h'))
}
