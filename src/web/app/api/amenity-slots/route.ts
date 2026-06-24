import { createClient } from '@supabase/supabase-js'

// GET /api/amenity-slots?type=sauna&date=2026-06-25
// Returns available time slots for a given amenity type on a given date.
// Slots are generated from the amenity_rules config, then filtered against
// existing bookings to show remaining capacity.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const date = searchParams.get('date') // YYYY-MM-DD

  if (!type || !date) {
    return Response.json({ error: 'Missing type or date' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Load the rule for this amenity type
  const { data: rule, error: ruleError } = await supabase
    .from('amenity_rules')
    .select('*')
    .eq('session_type', type)
    .eq('is_active', true)
    .single()

  if (ruleError || !rule) {
    return Response.json({ error: 'Amenity type not found or inactive' }, { status: 404 })
  }

  const [year, month, day] = date.split('-').map(Number)

  // The studio is in Nashville (America/Chicago). The server runs in UTC.
  // Determine Nashville's UTC offset for this date so that "7:00 AM Nashville"
  // becomes the correct UTC timestamp (CDT = UTC-5, CST = UTC-6).
  function getNashvilleUtcOffsetHours(y: number, m: number, d: number): number {
    // Use 12:00 noon UTC as a stable reference — safely mid-day for any timezone
    const noonUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
    const nashvilleHour = parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: '2-digit', hour12: false }).format(noonUtc),
      10
    )
    return 12 - nashvilleHour // e.g. 12 - 7 = 5 for CDT, 12 - 6 = 6 for CST
  }
  const utcOffsetHours = getNashvilleUtcOffsetHours(year, month, day)

  // Generate all possible slots for the day
  const [openHour, openMin] = rule.open_time.split(':').map(Number)
  const [closeHour, closeMin] = rule.close_time.split(':').map(Number)

  const openMinutes = openHour * 60 + openMin
  const closeMinutes = closeHour * 60 + closeMin
  const slotDuration = rule.slot_duration_minutes

  const slots: { starts_at: string; ends_at: string; capacity: number; booked: number }[] = []

  for (let start = openMinutes; start + slotDuration <= closeMinutes; start += slotDuration) {
    const localHour = Math.floor(start / 60)
    const localMin = start % 60
    // Convert Nashville local time → UTC
    const startDate = new Date(Date.UTC(year, month - 1, day, localHour + utcOffsetHours, localMin, 0, 0))
    const endDate = new Date(startDate.getTime() + rule.session_duration_minutes * 60 * 1000)

    slots.push({
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
      capacity: rule.max_capacity,
      booked: 0,
    })
  }

  if (slots.length === 0) return Response.json({ slots: [] })

  // Find existing bookings that overlap any of these slots
  const dayStart = new Date(Date.UTC(year, month - 1, day, utcOffsetHours, 0, 0)).toISOString()
  const dayEnd = new Date(Date.UTC(year, month - 1, day, utcOffsetHours + 23, 59, 59)).toISOString()

  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('scheduled_sessions!inner(starts_at, session_type)')
    .eq('scheduled_sessions.session_type', type)
    .in('status', ['confirmed', 'waitlisted'])
    .gte('scheduled_sessions.starts_at', dayStart)
    .lte('scheduled_sessions.starts_at', dayEnd)

  // Count bookings per slot start time
  const bookingCounts: Record<string, number> = {}
  for (const b of (existingBookings ?? [])) {
    const ss = b.scheduled_sessions as unknown as { starts_at: string }
    if (ss?.starts_at) {
      const key = new Date(ss.starts_at).toISOString()
      bookingCounts[key] = (bookingCounts[key] ?? 0) + 1
    }
  }

  // Apply booking counts + 24-hour cutoff
  const cutoffTime = Date.now() + rule.advance_cutoff_hours * 60 * 60 * 1000

  const availableSlots = slots
    .map(slot => ({
      ...slot,
      booked: bookingCounts[slot.starts_at] ?? 0,
    }))
    .filter(slot => {
      const slotTime = new Date(slot.starts_at).getTime()
      return slotTime > cutoffTime && slot.booked < slot.capacity
    })

  return Response.json({
    slots: availableSlots,
    rule: {
      session_type: rule.session_type,
      display_name: rule.display_name,
      slot_duration_minutes: rule.slot_duration_minutes,
      session_duration_minutes: rule.session_duration_minutes,
      max_capacity: rule.max_capacity,
    },
  })
}
