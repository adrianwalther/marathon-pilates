import { describe, it, expect } from 'vitest'
import { composeHealthFlags, MAX_FLAGS } from './healthFlags'

describe('composeHealthFlags — safety guardrail', () => {
  it('keeps neutral body-area / condition flags', () => {
    expect(composeHealthFlags(false, ['Right Knee Surgery', 'Lower Back Pain'])).toEqual([
      'Right Knee Surgery',
      'Lower Back Pain',
    ])
  })

  it('DROPS advice / restriction phrasing (no medical guidance surfaced)', () => {
    const out = composeHealthFlags(false, [
      'Lower Back Pain',
      'Avoid deep twisting',
      'No heavy loading',
      'Should rest the knee',
      'Limit flexion',
      'Be careful with the shoulder',
      "Don't lift overhead",
    ])
    expect(out).toEqual(['Lower Back Pain'])
  })

  it('prepends Prenatal when flagged', () => {
    expect(composeHealthFlags(true, ['Wrist'])).toEqual(['Prenatal', 'Wrist'])
  })

  it('returns just Prenatal when there is no note output', () => {
    expect(composeHealthFlags(true, [])).toEqual(['Prenatal'])
  })

  it('returns empty when nothing applies', () => {
    expect(composeHealthFlags(false, [])).toEqual([])
  })

  it('drops empty, over-long, and non-string entries', () => {
    const longFlag = 'A'.repeat(41)
    const out = composeHealthFlags(false, ['Shoulder', '', '   ', longFlag, 42, null, { x: 1 }] as unknown[])
    expect(out).toEqual(['Shoulder'])
  })

  it('dedupes repeated flags', () => {
    expect(composeHealthFlags(false, ['Hip', 'Hip', 'Hip'])).toEqual(['Hip'])
  })

  it('handles non-array model output gracefully', () => {
    expect(composeHealthFlags(false, null)).toEqual([])
    expect(composeHealthFlags(false, 'Right Knee')).toEqual([])
    expect(composeHealthFlags(true, undefined)).toEqual(['Prenatal'])
  })

  it(`caps at ${MAX_FLAGS} flags`, () => {
    const many = ['Neck', 'Shoulder', 'Elbow', 'Wrist', 'Hip', 'Knee', 'Ankle', 'Foot']
    const out = composeHealthFlags(true, many)
    expect(out).toHaveLength(MAX_FLAGS)
    expect(out[0]).toBe('Prenatal')
  })
})
