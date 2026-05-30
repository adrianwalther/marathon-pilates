import { describe, it, expect } from 'vitest'
import { bookingConfirmed, bookingCancelled, waitlistPromoted, type BookingCtx } from './templates'

const base: BookingCtx = {
  firstName: 'Amy',
  className: 'Reformer Flow',
  startsAt: '2026-06-02T11:30:00Z', // 6:30 AM America/Chicago (CDT)
  locationName: 'Charlotte Park',
}

describe('bookingConfirmed', () => {
  it('confirmed: warm "booked" wording with name, class, and reminders', () => {
    const m = bookingConfirmed({ ...base, waitlisted: false })
    expect(m.subject).toBe("You're booked — Reformer Flow")
    expect(m.html).toContain('Amy')
    expect(m.html).toContain('Reformer Flow')
    expect(m.html).toContain('grippy socks')
    expect(m.text).toContain('Amy')
    expect(m.text).toContain('grippy socks')
  })

  it('waitlisted: waitlist wording instead of booked', () => {
    const m = bookingConfirmed({ ...base, waitlisted: true })
    expect(m.subject).toBe("You're on the waitlist — Reformer Flow")
    expect(m.html).toContain('added you to the waitlist')
    expect(m.text).toContain('waitlist')
    expect(m.html).not.toContain("You're all set")
  })

  it('renders the class time in studio (Chicago) timezone', () => {
    const m = bookingConfirmed({ ...base, waitlisted: false })
    expect(m.html).toContain('June 2')
    expect(m.html).toContain('6:30')
    expect(m.html).toContain('Charlotte Park')
    expect(m.text).toContain('June 2')
  })

  it('gracefully omits the time/detail when startsAt is missing', () => {
    const m = bookingConfirmed({ firstName: 'Amy', className: 'Reformer Flow', waitlisted: false })
    expect(m.subject).toBe("You're booked — Reformer Flow")
    expect(m.html).toContain('Reformer Flow') // class still shown
    // no rendered date/time when there's no startsAt (footer's "·" is unrelated)
    expect(m.html).not.toMatch(/\bat \d/)
    expect(m.html).not.toContain('June')
  })
})

describe('bookingCancelled — wording branches', () => {
  it('late cancel: states the credit was NOT returned (forfeit)', () => {
    const m = bookingCancelled({ ...base, lateCancel: true, refunded: false })
    expect(m.subject).toBe('Cancelled — Reformer Flow')
    expect(m.html).toMatch(/wasn't returned/)
    expect(m.text).toMatch(/wasn't returned/)
    expect(m.html).not.toMatch(/added back/)
  })

  it('refunded (not late): states the credit was added back', () => {
    const m = bookingCancelled({ ...base, lateCancel: false, refunded: true })
    expect(m.html).toMatch(/added back/)
    expect(m.text).toMatch(/added back/)
    expect(m.html).not.toMatch(/wasn't returned/)
  })

  it('neither: neutral "nothing further needed" note', () => {
    const m = bookingCancelled({ ...base, lateCancel: false, refunded: false })
    expect(m.html).toMatch(/nothing further needed/)
    expect(m.html).not.toMatch(/added back/)
    expect(m.html).not.toMatch(/wasn't returned/)
  })

  it('late cancel takes precedence over refunded (never promises a refund on a forfeit)', () => {
    const m = bookingCancelled({ ...base, lateCancel: true, refunded: true })
    expect(m.html).toMatch(/wasn't returned/)
    expect(m.html).not.toMatch(/added back/)
  })
})

describe('waitlistPromoted', () => {
  it('tells the client they moved off the waitlist and are confirmed', () => {
    const m = waitlistPromoted(base)
    expect(m.subject).toContain("you're in")
    expect(m.html).toContain('Amy')
    expect(m.html).toContain('moved you off the waitlist')
    expect(m.text).toContain('moved you off the waitlist')
  })
})

describe('all templates', () => {
  it('return non-empty subject/html/text and carry the brand footer', () => {
    const all = [
      bookingConfirmed({ ...base, waitlisted: false }),
      bookingConfirmed({ ...base, waitlisted: true }),
      bookingCancelled({ ...base, lateCancel: false, refunded: true }),
      waitlistPromoted(base),
    ]
    for (const m of all) {
      expect(m.subject.length).toBeGreaterThan(0)
      expect(m.html).toContain('Move + Restore')
      expect(m.html).toContain('marathonpilates.com')
      expect(m.text).toContain('Move + Restore')
    }
  })
})
