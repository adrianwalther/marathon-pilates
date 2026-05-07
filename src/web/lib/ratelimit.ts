import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Fallback no-op limiter used when Redis is unavailable — always allows requests
const ALLOW: { limit: (_id: string) => Promise<{ success: boolean }> } = {
  limit: async (_id: string) => ({ success: true }),
}

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

function makeRatelimit(prefix: string, limiter: Ratelimit['limiter']) {
  const redis = getRedis()
  if (!redis) return ALLOW
  return new Ratelimit({ redis, limiter, prefix })
}

// AI generation — 10 requests per user per hour
export function getAiRatelimit() {
  return makeRatelimit('rl:ai', Ratelimit.slidingWindow(10, '1 h'))
}

// Checkout — 20 requests per user per hour
export function getCheckoutRatelimit() {
  return makeRatelimit('rl:checkout', Ratelimit.slidingWindow(20, '1 h'))
}

// Bookings — 60 requests per user per hour
export function getBookingRatelimit() {
  return makeRatelimit('rl:booking', Ratelimit.slidingWindow(60, '1 h'))
}
