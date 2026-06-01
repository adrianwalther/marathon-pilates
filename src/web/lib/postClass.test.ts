import { describe, it, expect } from 'vitest'
import { isCelebratable, fallbackCelebration, CELEBRATION_WINDOW_MS } from './postClass'

const NOW = 1_000_000_000_000

describe('isCelebratable', () => {
  it('celebrates a class that just finished', () => {
    expect(isCelebratable(NOW - 60_000, NOW)).toBe(true) // 1 min ago
  })
  it('celebrates up to the window edge', () => {
    expect(isCelebratable(NOW - CELEBRATION_WINDOW_MS, NOW)).toBe(true)
  })
  it('does NOT celebrate a class older than the window', () => {
    expect(isCelebratable(NOW - CELEBRATION_WINDOW_MS - 1, NOW)).toBe(false)
  })
  it('does NOT celebrate a future (not-yet-finished) class', () => {
    expect(isCelebratable(NOW + 60_000, NOW)).toBe(false)
  })
  it('handles invalid timestamps safely', () => {
    expect(isCelebratable(NaN, NOW)).toBe(false)
  })
})

describe('fallbackCelebration', () => {
  it('includes the name and class', () => {
    const msg = fallbackCelebration('Amy', 'Core, Arms + Glutes')
    expect(msg).toContain('Amy')
    expect(msg).toContain('Core, Arms + Glutes')
  })
  it('falls back to "there" without a name', () => {
    expect(fallbackCelebration(null, 'Reformer Flow')).toContain('there')
  })
})
