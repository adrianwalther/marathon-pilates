import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

// AI generation — 10 requests per user per hour
export function getAiRatelimit() {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    prefix: 'rl:ai',
  })
}

// Checkout — 20 requests per user per hour
export function getCheckoutRatelimit() {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    prefix: 'rl:checkout',
  })
}

// Bookings — 60 requests per user per hour
export function getBookingRatelimit() {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(60, '1 h'),
    prefix: 'rl:booking',
  })
}
