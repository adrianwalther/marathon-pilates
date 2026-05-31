// Maps a session's type to the credit bucket a booking should draw from.
// Single source of truth — used by both the client booking helper (lib/bookClass)
// and the admin booking route. Getting this wrong means a booking spends the
// wrong credit, so it's deduped here and unit-tested.

export type CreditType = 'group' | 'private' | 'amenity'

export function creditTypeFor(sessionType: string): CreditType | null {
  if (sessionType === 'group_reformer') return 'group'
  if (['private_solo', 'private_duet', 'private_trio'].includes(sessionType)) return 'private'
  if (['sauna', 'cold_plunge', 'contrast_therapy', 'neveskin'].includes(sessionType)) return 'amenity'
  return null
}

export type CreditRow = { id: string; total_credits: number; used_credits: number }

// From an already type-filtered, expiry-ordered list, pick the first credit
// that still has a balance (so a booking spends the soonest-expiring usable
// credit). Returns null if none are usable. Used by the client + admin booking
// flows — getting this wrong spends/leaks the wrong credit.
export function pickUsableCredit<T extends CreditRow>(credits: T[] | null | undefined): T | null {
  return credits?.find(c => c.total_credits - c.used_credits > 0) ?? null
}
