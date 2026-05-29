// Brand-voice transactional email templates for Marathon Pilates.
//
// Each function returns { subject, html, text }. Voice: warm, grounded,
// community-first ("Move + Restore", #itsamarathon) — never salesy or clinical.
// HTML uses inline styles + the earth palette so it renders in every client.

// Earth palette (mirrors globals.css design tokens).
const MOSS = '#4C5246' // primary brand
const CTA = '#A76E58' // terracotta
const BG = '#FAF7F2' // warm white
const INK = '#302D27' // deep earth (text)
const BORDER = '#DDD1BD' // sandstone

export type BookingCtx = {
  firstName: string
  className: string
  startsAt?: string | null
  locationName?: string | null
}

// Format a timestamp in the studio's timezone, e.g. "Monday, June 2 at 6:30 AM".
function formatWhen(startsAt?: string | null): string {
  if (!startsAt) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(startsAt))
  } catch {
    return ''
  }
}

// One detail line: "Monday, June 2 at 6:30 AM · Charlotte Park"
function whenWhere(ctx: BookingCtx): string {
  const when = formatWhen(ctx.startsAt)
  const parts = [when, ctx.locationName ?? ''].filter(Boolean)
  return parts.join(' · ')
}

// Shared HTML shell. `accent` tints the header bar + class card.
function layout(opts: {
  preheader: string
  heading: string
  bodyHtml: string
  accent?: string
}): string {
  const accent = opts.accent ?? MOSS
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Arial,sans-serif;color:${INK};">
    <span style="display:none!important;opacity:0;color:${BG};">${opts.preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:${accent};padding:22px 28px;">
                <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#FFFFFF;opacity:0.85;">Marathon Pilates</div>
                <div style="font-size:20px;letter-spacing:0.06em;text-transform:uppercase;color:#FFFFFF;margin-top:4px;font-weight:300;">${opts.heading}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.6;">
                ${opts.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid ${BORDER};font-size:12px;line-height:1.5;color:#8a8378;">
                Move + Restore · #itsamarathon<br/>
                <a href="https://marathonpilates.com" style="color:${CTA};text-decoration:none;">marathonpilates.com</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

// A highlighted class detail card for the HTML body.
function classCard(ctx: BookingCtx, accent: string): string {
  const detail = whenWhere(ctx)
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;background:${BG};border-left:3px solid ${accent};border-radius:8px;">
    <tr><td style="padding:14px 18px;">
      <div style="font-size:16px;font-weight:600;color:${INK};">${ctx.className}</div>
      ${detail ? `<div style="font-size:14px;color:#6b655c;margin-top:4px;">${detail}</div>` : ''}
    </td></tr>
  </table>`
}

// ── Booking confirmed / waitlisted ───────────────────────────────────────────
export function bookingConfirmed(ctx: BookingCtx & { waitlisted: boolean }) {
  const detail = whenWhere(ctx)
  if (ctx.waitlisted) {
    const subject = `You're on the waitlist — ${ctx.className}`
    const intro = `Hi ${ctx.firstName}, ${ctx.className} is full right now, so we've added you to the waitlist. The moment a spot opens, we'll move you in automatically and email you right away.`
    return {
      subject,
      html: layout({
        preheader: `You're on the waitlist for ${ctx.className}.`,
        heading: "You're on the waitlist",
        accent: CTA,
        bodyHtml: `<p style="margin:0 0 6px;">${intro}</p>${classCard(ctx, CTA)}<p style="margin:14px 0 0;color:#6b655c;font-size:14px;">No need to do anything — just keep an eye on your inbox. See you soon!</p>`,
      }),
      text: `Hi ${ctx.firstName},\n\n${ctx.className} is full right now, so we've added you to the waitlist.${detail ? `\n\n${detail}` : ''}\n\nThe moment a spot opens we'll move you in automatically and email you right away. No need to do anything.\n\nMove + Restore · #itsamarathon\nmarathonpilates.com`,
    }
  }
  const subject = `You're booked — ${ctx.className}`
  const intro = `You're all set, ${ctx.firstName}! We've got your spot saved and we can't wait to move with you.`
  return {
    subject,
    html: layout({
      preheader: `You're booked for ${ctx.className}.`,
      heading: "You're booked",
      accent: MOSS,
      bodyHtml: `<p style="margin:0 0 6px;">${intro}</p>${classCard(ctx, MOSS)}<p style="margin:14px 0 0;color:#6b655c;font-size:14px;">A few reminders: grippy socks are required, and please arrive a few minutes early to settle in. Need to make a change? You can manage this booking anytime from your dashboard.</p>`,
    }),
    text: `You're all set, ${ctx.firstName}!${detail ? `\n\n${ctx.className}\n${detail}` : `\n\n${ctx.className}`}\n\nReminders: grippy socks are required, and please arrive a few minutes early. Manage this booking anytime from your dashboard.\n\nMove + Restore · #itsamarathon\nmarathonpilates.com`,
  }
}

// ── Booking cancelled ─────────────────────────────────────────────────────────
export function bookingCancelled(ctx: BookingCtx & { refunded: boolean; lateCancel: boolean }) {
  const detail = whenWhere(ctx)
  const subject = `Cancelled — ${ctx.className}`
  let note: string
  let noteText: string
  if (ctx.lateCancel) {
    note = `Because this was within 24 hours of class, the credit wasn't returned, in line with our cancellation policy. If something came up, just reply and we'll take care of you.`
    noteText = `Because this was within 24 hours of class, the credit wasn't returned, in line with our cancellation policy. If something came up, just reply and we'll take care of you.`
  } else if (ctx.refunded) {
    note = `Your credit has been added back to your account, ready whenever you'd like to rebook.`
    noteText = `Your credit has been added back to your account, ready whenever you'd like to rebook.`
  } else {
    note = `You're all set — nothing further needed on your end.`
    noteText = `You're all set — nothing further needed on your end.`
  }
  return {
    subject,
    html: layout({
      preheader: `Your booking for ${ctx.className} is cancelled.`,
      heading: 'Booking cancelled',
      accent: MOSS,
      bodyHtml: `<p style="margin:0 0 6px;">Hi ${ctx.firstName}, this confirms your booking is cancelled:</p>${classCard(ctx, BORDER)}<p style="margin:14px 0 0;color:#6b655c;font-size:14px;">${note}</p><p style="margin:14px 0 0;">Hope to see you back on the reformer soon.</p>`,
    }),
    text: `Hi ${ctx.firstName},\n\nThis confirms your booking is cancelled:\n\n${ctx.className}${detail ? `\n${detail}` : ''}\n\n${noteText}\n\nHope to see you back on the reformer soon.\n\nMove + Restore · #itsamarathon\nmarathonpilates.com`,
  }
}

// ── Promoted off the waitlist ─────────────────────────────────────────────────
export function waitlistPromoted(ctx: BookingCtx) {
  const detail = whenWhere(ctx)
  const subject = `A spot opened — you're in! ${ctx.className}`
  return {
    subject,
    html: layout({
      preheader: `Good news — you're off the waitlist and confirmed for ${ctx.className}.`,
      heading: "You're in!",
      accent: CTA,
      bodyHtml: `<p style="margin:0 0 6px;">Great news, ${ctx.firstName} — a spot just opened up and we've moved you off the waitlist. You're confirmed!</p>${classCard(ctx, CTA)}<p style="margin:14px 0 0;color:#6b655c;font-size:14px;">Grippy socks required, and please arrive a few minutes early. If this no longer works for you, please cancel from your dashboard so the spot can go to the next person.</p>`,
    }),
    text: `Great news, ${ctx.firstName} — a spot just opened up and we've moved you off the waitlist. You're confirmed!\n\n${ctx.className}${detail ? `\n${detail}` : ''}\n\nGrippy socks required, and please arrive a few minutes early. If this no longer works, please cancel from your dashboard so the spot can go to the next person.\n\nMove + Restore · #itsamarathon\nmarathonpilates.com`,
  }
}
