import { describe, it, expect } from 'vitest'
import { pickNudge, untriedServices, serviceKeyFromType, SERVICE_CATALOG } from './nudges'

describe('serviceKeyFromType', () => {
  it('maps the collapsed private filter', () => {
    expect(serviceKeyFromType('private')).toBe('private')
  })
  it('maps each private_* session_type to private', () => {
    expect(serviceKeyFromType('private_solo')).toBe('private')
    expect(serviceKeyFromType('private_duet')).toBe('private')
    expect(serviceKeyFromType('private_trio')).toBe('private')
  })
  it('maps amenity + group session types directly', () => {
    expect(serviceKeyFromType('sauna')).toBe('sauna')
    expect(serviceKeyFromType('group_reformer')).toBe('group_reformer')
  })
  it('returns null for unknown types', () => {
    expect(serviceKeyFromType('mystery')).toBeNull()
    expect(serviceKeyFromType('')).toBeNull()
  })
})

describe('untriedServices', () => {
  it('returns the full catalog (priority order) when nothing tried', () => {
    const out = untriedServices([])
    expect(out).toHaveLength(SERVICE_CATALOG.length)
    expect(out[0].key).toBe('contrast_therapy') // priority 1
  })
  it('excludes tried services and collapses private variants', () => {
    const out = untriedServices(['private_duet'])
    expect(out.some(s => s.key === 'private')).toBe(false)
  })
  it('ignores unknown session types', () => {
    const out = untriedServices(['nonsense'])
    expect(out).toHaveLength(SERVICE_CATALOG.length)
  })
  it('is sorted by ascending priority', () => {
    const out = untriedServices([])
    const priorities = out.map(s => s.priority)
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b))
  })
})

describe('pickNudge — base behavior', () => {
  it('returns null for a client with no bookings', () => {
    expect(pickNudge('Amy', [])).toBeNull()
  })
  it('returns null when every service has been tried', () => {
    const all = ['group_reformer', 'private_solo', 'sauna', 'cold_plunge', 'contrast_therapy', 'neveskin']
    expect(pickNudge('Amy', all)).toBeNull()
  })
  it('surfaces the top business-priority untried service (contrast first)', () => {
    const n = pickNudge('Amy', ['group_reformer'])
    expect(n?.service.key).toBe('contrast_therapy')
  })
  it('interpolates the first name into the copy', () => {
    const n = pickNudge('Amy', ['group_reformer'])
    expect(n?.message).toContain('Amy')
    expect(n?.message).not.toContain('{first}')
  })
  it('falls back to "there" when name is missing', () => {
    const n = pickNudge(null, ['group_reformer'])
    expect(n?.message).toContain('there')
  })
})

describe('pickNudge — behavioral signals', () => {
  it('boosts a viewed-but-unbooked service above business priority', () => {
    const n = pickNudge('Amy', ['group_reformer'], { viewed: { sauna: 3 } })
    expect(n?.service.key).toBe('sauna') // beats contrast (priority 1) on intent
  })
  it('ranks the most-viewed service first', () => {
    const n = pickNudge('Amy', ['group_reformer'], { viewed: { sauna: 1, neveskin: 5 } })
    expect(n?.service.key).toBe('neveskin')
  })
  it('suppresses a dismissed service, falling through to the next', () => {
    const n = pickNudge('Amy', ['group_reformer'], { dismissed: ['contrast_therapy'] })
    expect(n?.service.key).toBe('sauna')
  })
  it('lets a dismissal override even strong view intent', () => {
    const n = pickNudge('Amy', ['group_reformer'], { viewed: { contrast_therapy: 9 }, dismissed: ['contrast_therapy'] })
    expect(n?.service.key).not.toBe('contrast_therapy')
  })
  it('returns null when all remaining untried services are dismissed', () => {
    const n = pickNudge('Amy', ['group_reformer', 'private_solo'], {
      dismissed: ['sauna', 'cold_plunge', 'contrast_therapy', 'neveskin'],
    })
    expect(n).toBeNull()
  })
  it('no signals = unchanged base behavior', () => {
    expect(pickNudge('Amy', ['group_reformer'])?.service.key).toBe('contrast_therapy')
  })
})
