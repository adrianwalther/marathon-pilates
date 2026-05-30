import { createClient } from './supabase'
import { creditTypeFor } from './credits'

// Shared client-side booking action used by the schedule page and the rebook
// modal, so both behave identically: pick a usable credit for the session's
// type, fall back to Stripe checkout for a drop-in when there's no credit,
// otherwise book through the atomic /api/bookings route.

export type BookableSession = {
  id: string
  session_type: string
  drop_in_price?: number | null
}

export type BookOutcome =
  | { outcome: 'confirmed' | 'waitlisted'; message: string }
  | { outcome: 'checkout' } // redirected to Stripe — caller should stop
  | { outcome: 'error'; message: string }

export async function bookClass(session: BookableSession): Promise<BookOutcome> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { outcome: 'error', message: 'Please sign in again.' }

  // Find a usable, soonest-expiring credit for this session's type.
  const creditType = creditTypeFor(session.session_type)
  let creditId: string | null = null
  if (creditType) {
    const { data: credits } = await supabase
      .from('credits')
      .select('id, total_credits, used_credits')
      .eq('client_id', user.id)
      .eq('credit_type', creditType)
      .order('expires_at', { ascending: true, nullsFirst: false })
    const usable = credits?.find(c => c.total_credits - c.used_credits > 0)
    if (usable) creditId = usable.id
  }

  const { data: { session: authSession } } = await supabase.auth.getSession()
  const auth = authSession ? `Bearer ${authSession.access_token}` : ''

  // No credit but the class has a drop-in price → Stripe Checkout.
  if (!creditId && session.drop_in_price) {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ session_id: session.id, user_id: user.id }),
    })
    const { url, error } = await res.json().catch(() => ({}))
    if (error || !url) return { outcome: 'error', message: 'Could not start checkout' }
    window.location.href = url
    return { outcome: 'checkout' }
  }

  // Atomic capacity-check + insert + credit deduction.
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({ session_id: session.id, credit_id: creditId }),
  })
  const result = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { outcome: 'error', message: result.error === 'Already booked' ? 'Already booked' : (result.error || 'Could not book') }
  }
  return result.status === 'waitlisted'
    ? { outcome: 'waitlisted', message: 'Added to waitlist' }
    : { outcome: 'confirmed', message: 'Booking confirmed!' }
}
