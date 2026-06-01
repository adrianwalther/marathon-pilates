import { describe, it, expect } from 'vitest'
import { isCelebratable, fallbackCelebration, classMilestones, CELEBRATION_WINDOW_MS } from './postClass'

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

describe('classMilestones', () => {
  const celebrated = { sessionType: 'group_reformer', startsAtMs: NOW }

  it('first class ever → both flags true', () => {
    const m = classMilestones([{ sessionType: 'group_reformer', startsAtMs: NOW }], celebrated)
    expect(m).toEqual({ isFirstEver: true, isFirstOfService: true })
  })

  it('returning client, first time of THIS service → firstEver false, firstOfService true', () => {
    const m = classMilestones(
      [
        { sessionType: 'sauna', startsAtMs: NOW - 5 * 86400000 },
        { sessionType: 'group_reformer', startsAtMs: NOW },
      ],
      celebrated,
    )
    expect(m).toEqual({ isFirstEver: false, isFirstOfService: true })
  })

  it('done this service before → both false', () => {
    const m = classMilestones(
      [
        { sessionType: 'group_reformer', startsAtMs: NOW - 7 * 86400000 },
        { sessionType: 'group_reformer', startsAtMs: NOW },
      ],
      celebrated,
    )
    expect(m).toEqual({ isFirstEver: false, isFirstOfService: false })
  })

  it('ignores classes booked AFTER the celebrated one (future bookings)', () => {
    const m = classMilestones(
      [
        { sessionType: 'group_reformer', startsAtMs: NOW },
        { sessionType: 'group_reformer', startsAtMs: NOW + 3 * 86400000 }, // upcoming
      ],
      celebrated,
    )
    expect(m).toEqual({ isFirstEver: true, isFirstOfService: true })
  })
})
