import { describe, it, expect } from 'vitest'
import { isUuid } from './validation'

describe('isUuid', () => {
  it('accepts canonical UUIDs (any version), case-insensitive', () => {
    expect(isUuid('da8f2e10-8c26-421c-89e9-d8c44771c513')).toBe(true)
    expect(isUuid('DA8F2E10-8C26-421C-89E9-D8C44771C513')).toBe(true)
    expect(isUuid('00000000-0000-0000-0000-000000000000')).toBe(true)
  })
  it('rejects malformed / truncated / wrong-shape strings', () => {
    expect(isUuid('not-a-uuid')).toBe(false)
    expect(isUuid('da8f2e10-8c26-421c-89e9-d8c44771c51')).toBe(false) // 11 in last group
    expect(isUuid('da8f2e10-8c26-421c-89e9-d8c44771c5133')).toBe(false) // 13 in last group
    expect(isUuid('da8f2e108c26421c89e9d8c44771c513')).toBe(false) // no dashes
    expect(isUuid('')).toBe(false)
  })
  it('rejects injection-y / non-string input', () => {
    expect(isUuid("'; DROP TABLE bookings;--")).toBe(false)
    expect(isUuid(null)).toBe(false)
    expect(isUuid(undefined)).toBe(false)
    expect(isUuid(12345)).toBe(false)
    expect(isUuid({})).toBe(false)
  })
})
