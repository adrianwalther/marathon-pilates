// Post-class celebration: after a client finishes a class, the dashboard shows
// a warm, class-aware message in Ruby's voice ("Nice work on your core today —
// I bet you feel stronger"). The AI copy is generated server-side (/api/post-
// class-copy) and cached; this module holds the pure eligibility + fallback
// logic so it's unit-testable.
//
// MVP: in-app card, shown on the next dashboard open after a recently-finished
// class. (A 30-min-after push notification is the eventual mobile-app version —
// the message-generation logic here carries over to it unchanged.)

// How recent a finished class must be to still celebrate it. Catches same-day
// and next-morning app opens without congratulating a class from last week.
export const CELEBRATION_WINDOW_MS = 24 * 60 * 60 * 1000

// True if the class has finished (started in the past) and is recent enough.
export function isCelebratable(startsAtMs: number, nowMs: number, windowMs = CELEBRATION_WINDOW_MS): boolean {
  if (!Number.isFinite(startsAtMs)) return false
  const elapsed = nowMs - startsAtMs
  return elapsed >= 0 && elapsed <= windowMs
}

// Safe, warm fallback line when AI copy isn't available (no key, error, or
// off-spec output). Always something kind — never a medical claim.
export function fallbackCelebration(firstName: string | null | undefined, className: string): string {
  const first = (firstName ?? '').trim() || 'there'
  return `Nice work today, ${first} — hope you're feeling great after ${className}.`
}
