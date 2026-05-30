import { describe, it, expect } from 'vitest'
import { creditTypeFor } from './credits'

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
