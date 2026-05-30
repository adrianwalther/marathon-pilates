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
