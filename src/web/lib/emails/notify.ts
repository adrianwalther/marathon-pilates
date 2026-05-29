// High-level notification helpers. Routes call these; they load the recipient +
// class context from the DB and send the matching template.
//
// EVERY function here is best-effort and NEVER throws — a failed email must not
// break a booking or cancellation. Failures are logged and swallowed.

import type { SupabaseClient } from '@supabase/supabase-js'
import { sendEmail } from '../email'
import { bookingConfirmed, bookingCancelled, waitlistPromoted, type BookingCtx } from './templates'

type Recipient = BookingCtx & { email: string }

// Supabase returns an embedded to-one relation as an object, but the generated
// types sometimes widen it to an array — handle both.
function relName(rel: unknown): string | null {
  if (!rel) return null
  const obj = Array.isArray(rel) ? rel[0] : rel
  return (obj as { name?: string } | undefined)?.name ?? null
}

async function loadRecipient(
  supabase: SupabaseClient,
  clientId: string,
  sessionId: string
): Promise<Recipient | null> {
  const [{ data: profile }, { data: session }] = await Promise.all([
    supabase.from('profiles').select('first_name, email').eq('id', clientId).single(),
    supabase
      .from('scheduled_sessions')
      .select('name, starts_at, locations(name)')
      .eq('id', sessionId)
      .single(),
  ])

  if (!profile?.email) return null

  return {
    email: profile.email as string,
    firstName: (profile.first_name as string | null) ?? 'there',
    className: (session?.name as string | null) ?? 'your class',
    startsAt: (session?.starts_at as string | null) ?? null,
    locationName: relName(session?.locations),
  }
}

export async function notifyBookingConfirmed(
  supabase: SupabaseClient,
  args: { clientId: string; sessionId: string; waitlisted: boolean }
): Promise<void> {
  try {
    const r = await loadRecipient(supabase, args.clientId, args.sessionId)
    if (!r) return
    const tpl = bookingConfirmed({ ...r, waitlisted: args.waitlisted })
    await sendEmail({ to: r.email, ...tpl })
  } catch (err) {
    console.error('notifyBookingConfirmed failed (non-fatal):', err)
  }
}

export async function notifyBookingCancelled(
  supabase: SupabaseClient,
  args: { clientId: string; sessionId: string; refunded: boolean; lateCancel: boolean }
): Promise<void> {
  try {
    const r = await loadRecipient(supabase, args.clientId, args.sessionId)
    if (!r) return
    const tpl = bookingCancelled({ ...r, refunded: args.refunded, lateCancel: args.lateCancel })
    await sendEmail({ to: r.email, ...tpl })
  } catch (err) {
    console.error('notifyBookingCancelled failed (non-fatal):', err)
  }
}

export async function notifyWaitlistPromoted(
  supabase: SupabaseClient,
  args: { bookingId: string }
): Promise<void> {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('client_id, session_id')
      .eq('id', args.bookingId)
      .single()
    if (!booking) return
    const r = await loadRecipient(
      supabase,
      booking.client_id as string,
      booking.session_id as string
    )
    if (!r) return
    const tpl = waitlistPromoted(r)
    await sendEmail({ to: r.email, ...tpl })
  } catch (err) {
    console.error('notifyWaitlistPromoted failed (non-fatal):', err)
  }
}
