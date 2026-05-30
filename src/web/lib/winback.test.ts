import { describe, it, expect } from 'vitest'
import { aggregateActivity, lapsedClientIds, type WinBackBooking } from './winback'

const NOW = 1_000_000_000_000 // fixed "now" for deterministic tests
const DAY = 86_400_000
const daysAgo = (n: number) => NOW - n * DAY
const daysAhead = (n: number) => NOW + n * DAY

describe('aggregateActivity', () => {
  it('counts past visits and tracks the most recent', () => {
    const bookings: WinBackBooking[] = [
      { clientId: 'a', status: 'completed', startsAtMs: daysAgo(40) },
      { clientId: 'a', status: 'confirmed', startsAtMs: daysAgo(10) },
    ]
    const agg = aggregateActivity(bookings, NOW)
    expect(agg.a.visits).toBe(2)
    expect(agg.a.lastVisit).toBe(daysAgo(10))
    expect(agg.a.upcoming).toBe(0)
  })

  it('counts upcoming confirmed/waitlisted sessions separately', () => {
    const agg = aggregateActivity(
      [
        { clientId: 'a', status: 'confirmed', startsAtMs: daysAhead(3) },
        { clientId: 'a', status: 'waitlisted', startsAtMs: daysAhead(5) },
      ],
      NOW,
    )
    expect(agg.a.upcoming).toBe(2)
    expect(agg.a.visits).toBe(0)
  })

  it('does NOT count cancelled / no_show past rows as visits', () => {
    const agg = aggregateActivity(
      [
        { clientId: 'a', status: 'cancelled', startsAtMs: daysAgo(20) },
        { clientId: 'a', status: 'no_show', startsAtMs: daysAgo(15) },
      ],
      NOW,
    )
    expect(agg.a?.visits ?? 0).toBe(0)
    expect(agg.a?.lastVisit ?? 0).toBe(0)
  })

  it('ignores rows with no client or no start time', () => {
    const agg = aggregateActivity(
      [
        { clientId: '', status: 'completed', startsAtMs: daysAgo(5) },
        { clientId: 'a', status: 'completed', startsAtMs: null },
      ],
      NOW,
    )
    expect(Object.keys(agg)).toHaveLength(0)
  })
})

describe('lapsedClientIds', () => {
  const cutoff = daysAgo(30) // quiet ≥30 days

  it('flags a client whose last visit predates the cutoff with nothing upcoming', () => {
    const agg = aggregateActivity([{ clientId: 'a', status: 'completed', startsAtMs: daysAgo(45) }], NOW)
    expect(lapsedClientIds(agg, cutoff)).toEqual(['a'])
  })

  it('does NOT flag a client with an upcoming booking', () => {
    const agg = aggregateActivity(
      [
        { clientId: 'a', status: 'completed', startsAtMs: daysAgo(45) },
        { clientId: 'a', status: 'confirmed', startsAtMs: daysAhead(2) },
      ],
      NOW,
    )
    expect(lapsedClientIds(agg, cutoff)).toEqual([])
  })

  it('does NOT flag a recently-active client', () => {
    const agg = aggregateActivity([{ clientId: 'a', status: 'completed', startsAtMs: daysAgo(10) }], NOW)
    expect(lapsedClientIds(agg, cutoff)).toEqual([])
  })

  it('does NOT flag a never-visited client (e.g. only cancellations)', () => {
    const agg = aggregateActivity([{ clientId: 'a', status: 'cancelled', startsAtMs: daysAgo(60) }], NOW)
    expect(lapsedClientIds(agg, cutoff)).toEqual([])
  })

  it('separates multiple clients correctly', () => {
    const agg = aggregateActivity(
      [
        { clientId: 'lapsed', status: 'completed', startsAtMs: daysAgo(50) },
        { clientId: 'active', status: 'completed', startsAtMs: daysAgo(50) },
        { clientId: 'active', status: 'confirmed', startsAtMs: daysAhead(1) },
        { clientId: 'recent', status: 'completed', startsAtMs: daysAgo(5) },
      ],
      NOW,
    )
    expect(lapsedClientIds(agg, cutoff)).toEqual(['lapsed'])
  })
})
