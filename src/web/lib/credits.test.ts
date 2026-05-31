import { describe, it, expect } from 'vitest'
import { creditTypeFor, pickUsableCredit } from './credits'

describe('creditTypeFor', () => {
  it('maps group reformer to the group bucket', () => {
    expect(creditTypeFor('group_reformer')).toBe('group')
  })

  it('maps every private variant to the private bucket', () => {
    expect(creditTypeFor('private_solo')).toBe('private')
    expect(creditTypeFor('private_duet')).toBe('private')
    expect(creditTypeFor('private_trio')).toBe('private')
  })

  it('maps every amenity to the amenity bucket', () => {
    expect(creditTypeFor('sauna')).toBe('amenity')
    expect(creditTypeFor('cold_plunge')).toBe('amenity')
    expect(creditTypeFor('contrast_therapy')).toBe('amenity')
    expect(creditTypeFor('neveskin')).toBe('amenity')
  })

  it('returns null for unknown / empty session types (booked complimentary, not mischarged)', () => {
    expect(creditTypeFor('mystery')).toBeNull()
    expect(creditTypeFor('')).toBeNull()
  })

  it('covers every session_type in the enum (no type silently falls through)', () => {
    // Mirror of the session_type enum in 001_initial_schema.sql — if a new type
    // is added there, add it here so this test forces a creditTypeFor decision.
    const ALL = [
      'group_reformer',
      'private_solo', 'private_duet', 'private_trio',
      'sauna', 'cold_plunge', 'contrast_therapy', 'neveskin',
    ]
    for (const t of ALL) {
      expect(creditTypeFor(t), `${t} should map to a credit bucket`).not.toBeNull()
    }
  })
})

describe('pickUsableCredit', () => {
  const c = (id: string, total: number, used: number) => ({ id, total_credits: total, used_credits: used })

  it('returns the first credit with a remaining balance (spend soonest-expiring first)', () => {
    // caller pre-orders by expiry, so "first usable" = soonest-expiring usable
    const out = pickUsableCredit([c('a', 5, 5), c('b', 10, 3), c('c', 2, 0)])
    expect(out?.id).toBe('b')
  })

  it('skips fully-used and over-used credits', () => {
    const out = pickUsableCredit([c('a', 5, 5), c('b', 3, 4)]) // both have <=0 remaining
    expect(out).toBeNull()
  })

  it('returns null for empty / null / undefined', () => {
    expect(pickUsableCredit([])).toBeNull()
    expect(pickUsableCredit(null)).toBeNull()
    expect(pickUsableCredit(undefined)).toBeNull()
  })

  it('returns the single usable credit', () => {
    expect(pickUsableCredit([c('only', 1, 0)])?.id).toBe('only')
  })

  it('preserves the full row (callers need .id)', () => {
    const out = pickUsableCredit([c('x', 4, 1)])
    expect(out).toEqual({ id: 'x', total_credits: 4, used_credits: 1 })
  })
})
