# Spec 19 — Email Marketing (Newsletter + Lifecycle Automations)

**Status:** Planning / parked — revisit closer to launch. Needs Ruby's sign-off (cost + Arketa cancellation) and DNS access.
**Drafted:** 2026-05-30

---

## Context

Marathon Pilates currently pays for **Arketa's marketing package** to send marketing email (newsletter, campaigns, automations). The `@marathonpilates.com` mailboxes themselves run on **Google Workspace** (Arketa does NOT host the inboxes — confirmed 2026-05-30). So:

- Leaving Arketa for the custom platform **never threatens the email addresses** (they're on Google Workspace).
- What needs replacing is the **marketing-email engine** — and folding it into the platform lets us **drop the Arketa marketing fee** and **own the audience data**.
- The platform's **transactional** emails (booking confirm/cancel/waitlist) are already built (`lib/email.ts` + `lib/emails/`) but **dry-run** pending a provider — that's separate from marketing but uses the same provider.

## Current state in the platform

| Piece | State |
|---|---|
| `app/(admin)/admin/marketing/broadcasts` + `broadcasts` table | UI exists; composes/saves a campaign but **does not send** (no dispatch) |
| `app/(admin)/admin/marketing/automations` + `automations` table | UI exists; configure/toggle but **no engine dispatches** them |
| `lib/email.ts` (`sendEmail` via Resend REST) | Built, provider-agnostic, dry-run until `RESEND_API_KEY` set |
| `profiles.marketing_email_opt_in` | Exists — consent flag to gate marketing sends |

So the *shells* exist; the **sending engine + audience + compliance layer** is what's missing.

## Provider recommendation: Resend

Resend does **both** transactional AND marketing (Broadcasts/Audiences) → one provider, one DNS setup, one audience source of truth.

- **Google Workspace SMTP is NOT suitable for bulk marketing** (~2k/day cap, no campaign tooling, wrecks domain sending reputation). It's fine only for low-volume transactional.
- This resolves the parked "Resend vs Google Workspace" decision in Resend's favor *because* marketing is now in scope.

## The two halves

### A. Newsletter (Broadcasts) — monthly "Move + Restore"
- Keep the existing **monthly, ~1st-of-month** cadence.
- Lead with **community/story** content (Puppies + Pilates, instructor spotlights, member wins) — that out-performs promo for this audience. Keep offers ≤20%, story-framed.
- Rotate one **education** beat + one **underused-service** spotlight (sauna/contrast/Neveskin — revenue priority #3).

### B. Lifecycle automations (triggered)
| Automation | Trigger | Goal (maps to business priority) |
|---|---|---|
| Welcome series | New signup / first class | Onboarding |
| Intro → membership | Intro pass purchased / nearing expiry | Convert (priority #2) |
| Wellness cross-sell | Member who's only done Pilates | Grow wellness revenue (priority #3) — mirrors the dashboard nudge engine |
| Win-back | No visit in N days | Re-engage (email arm of the existing staff win-back worklist) |
| Milestone / birthday | Class-count milestone, birthday | Delight (existing `milestones` page) |

**Reuse:** the targeting intelligence already exists — the dashboard **nudge engine** (untried services), the **win-back** lapsed-detection (`lib/winback.ts`), and **milestones**. Email is just another channel for the same logic.

## To build (the real work)
1. **Dispatch engine** — broadcasts: "send now" + schedule; automations: event/cron triggers.
2. **Audience selection** — segments (all / lapsed / members / intro-holders / opt-ins only), gated on `marketing_email_opt_in`.
3. **Unsubscribe + suppression list** — legally required (CAN-SPAM). Non-negotiable, not polish. One-click unsubscribe link + a suppression table the sender always checks.
4. **DNS / deliverability** — DKIM/SPF/DMARC for the sending domain. Google Workspace owns the inbox MX records; add the provider's *sending* records, ideally on a subdomain (e.g. `send.marathonpilates.com`) to protect the primary domain's reputation.
5. **Templates** — brand-voice HTML (reuse the transactional template style in `lib/emails/templates.ts`).

## Cost framework (for the Ruby conversation)

Replacing a paid Arketa package, not adding a new expense. **Verify current pricing at resend.com/pricing** — figures change:

| Tier | ~Cost | ~Volume | Fits |
|---|---|---|---|
| Free | $0 | ~3,000/mo (100/day) | Transactional + small newsletter |
| Pro | ~$20/mo | ~50,000/mo + Broadcasts/Audiences | Newsletter + automations + transactional |

At studio scale, likely **$0–20/mo total** for all email — almost certainly **less than the Arketa marketing add-on**.

**Two numbers to make it apples-to-apples (TODO — get from Adrian/Ruby):**
1. Current Arketa marketing-package monthly cost (baseline to beat).
2. Email contact/subscriber count + rough monthly send volume.

## Phasing
- **Phase 1 — Transactional, now-ish.** Connect Resend, flip the built booking emails live. Low-risk, no compliance complexity. Foundation for everything else.
- **Phase 2 — Marketing engine.** Make broadcasts actually send (audience → Resend → unsubscribe), then wire automations. This is what lets Arketa's marketing package be cancelled.

## Open decisions (Ruby)
- [ ] Approve Resend (cost) as the unified email provider.
- [ ] Provide DNS access for `marathonpilates.com` (DKIM/SPF/DMARC).
- [ ] Confirm the Arketa marketing-package cost + plan the cancellation timing (after Phase 2 is live).
- [ ] Confirm contact-list size / current subscriber count.

## Cross-refs
- `specs/14-launch-plan.md` (launch sequencing)
- Transactional email system: `lib/email.ts`, `lib/emails/`
- Targeting reuse: `lib/nudges.ts`, `lib/winback.ts`, `marketing/milestones`
