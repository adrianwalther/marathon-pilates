// Provider-agnostic transactional email sender.
//
// The rest of the app only ever calls sendEmail() — the provider lives here, so
// swapping it later is a one-file change.
//
// Provider: Resend, called via its REST API with fetch (no SDK dependency).
//   - Set RESEND_API_KEY to enable real sends.
//   - Set EMAIL_FROM to control the From header
//     (default: "Marathon Pilates <hello@marathonpilates.com>").
//
// NO key configured (e.g. local dev, or before Ruby picks a provider)? sendEmail
// logs a "[email:dry-run]" line and returns ok — so booking/cancel flows never
// break and templates stay inspectable in the dev console.
//
// To switch to Google Workspace SMTP instead of Resend: replace the fetch block
// below with a nodemailer transport. Nothing else in the app needs to change.

export type EmailMessage = {
  to: string
  subject: string
  html: string
  text: string
}

export type SendResult = { ok: boolean; id?: string; error?: string; dryRun?: boolean }

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'Marathon Pilates <hello@marathonpilates.com>'

  // No provider configured → dry-run. Never block the calling flow.
  if (!apiKey) {
    console.log(
      `[email:dry-run] → ${msg.to}\n  subject: ${msg.subject}\n  ${msg.text.replace(/\n/g, '\n  ')}`
    )
    return { ok: true, dryRun: true }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[email] Resend responded ${res.status}: ${detail}`)
      return { ok: false, error: `Resend ${res.status}` }
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string }
    return { ok: true, id: data.id }
  } catch (err) {
    console.error('[email] send failed:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' }
  }
}
