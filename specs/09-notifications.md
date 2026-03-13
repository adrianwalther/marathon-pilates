# Spec 09 — Notifications
*Marathon Pilates Platform | Created: 2026-03-10*

---

## Overview

Every message the platform sends should feel like it came from a person who knows you — not a software system. This spec covers every notification trigger, every channel, and the rules that keep clients informed without overwhelming them.

---

## Channels

| Channel | Tool | Best For |
|---|---|---|
| **Email** | Resend + React Email | Receipts, confirmations, rich content, tips |
| **SMS** | Twilio | Time-sensitive alerts, waitlist spots, 2hr reminders |
| **Push (app)** | Expo Push (APNs + FCM) | Milestones, streaks, nudges, quick updates |
| **In-App** | Native alert feed | Non-urgent updates visible when client opens app |

---

## Notification Categories

There are two types of notifications — and the distinction matters legally and experientially:

**Transactional** — tied to an action the client took or something affecting their account. Cannot be fully opted out of (can be reduced to email-only). Examples: booking confirmation, payment receipt, cancellation.

**Marketing / Engagement** — tips, recommendations, re-engagement messages. Client can fully opt out. Examples: weekly tip, personalized class suggestion, streak encouragement.

---

## Client Notification Preferences

Clients control their preferences in the app:

```
Settings → Notifications

  TRANSACTIONAL (required)
  ✅  Booking confirmations          Email always
  ✅  Cancellations                  Email always
  ✅  Payment receipts               Email always
  ✅  Waitlist updates               Email + SMS (opt SMS off)
  ✅  Class reminders                Email (opt in SMS / push)

  ENGAGEMENT (optional)
  ✅  Streak & milestone alerts      Push + Email
  ✅  Personalized tips              Email + Push
  ✅  Re-engagement messages         Email
  ✅  New on-demand content          Push + Email
  ☐   Weekly goal summary           Push + Email
```

---

## Full Notification Trigger Map

---

### Booking & Check-In

| Trigger | Who | Channel | Timing | Notes |
|---|---|---|---|---|
| Class booked | Client | Email | Immediately | Confirmation + class details |
| Class booked | Client | Push | Immediately | Short confirmation |
| Class reminder | Client | Email + Push | 24hr before | Class details, what to bring |
| Class reminder | Client | SMS | 2hr before | Location, time, instructor |
| Class cancelled (by studio) | Client | Email + Push + SMS | Immediately | Credit automatically returned |
| Client cancels class | Client | Email | Immediately | Confirmation + credit returned |
| Late cancel penalty applied | Client | Email | At trigger | Explain why credit was forfeited |
| No-show recorded | Client | Email | After class | Credit forfeited notice |
| Check-in confirmed | Client | Push | At check-in | Optional — light confirmation |
| Walk-in booked by staff | Client | Email | Immediately | Booking confirmation |

---

### Waitlist

| Trigger | Who | Channel | Timing | Notes |
|---|---|---|---|---|
| Added to waitlist | Client | Email + Push | Immediately | Position in queue |
| Spot opened — you're next | Client | Push + SMS | Immediately | 30-min window to claim |
| Spot claimed — booked | Client | Email + Push | At claim | Full booking confirmation |
| Spot expired — next person | Client | Push | At expiry | "We gave your spot to the next person" |
| Waitlist — class cancelled | Client | Email + Push | Immediately | No spot — class cancelled |

**Waitlist acceptance window:** 30 min (configurable in Settings). If no action, next person in queue is notified automatically.

---

### Private Sessions

| Trigger | Who | Channel | Timing | Notes |
|---|---|---|---|---|
| Private session requested | Instructor | Email + Push | Immediately | Client name, type, requested time |
| Private session confirmed | Client | Email + Push | Immediately | Instructor, time, location |
| Private session confirmed | Instructor | Push | Immediately | Reminder on their calendar |
| Private reminder | Client | Email + Push | 24hr before | Who, where, what to expect |
| Private reminder | Client | SMS | 2hr before | Quick reminder |
| Private cancelled by client | Instructor | Push + Email | Immediately | Slot reopened |
| Private cancelled by studio | Client | Email + Push | Immediately | Credit returned |
| Duet — partner spot filled | Client | Push + Email | When filled | "Your duet partner has been added" |
| Duet — partner spot open | Client (original) | Push | 48hr after booking | "Share with a friend — split the cost" |

---

### Amenity Bookings

| Trigger | Who | Channel | Timing | Notes |
|---|---|---|---|---|
| Sauna booked | Client | Email | Immediately | Time, location, duration |
| Cold plunge booked | Client | Email | Immediately | Time, location |
| Amenity reminder | Client | Push + SMS | 1hr before | Quick reminder |
| First sauna booking | Client | Email | Immediately | Sauna tips + what to expect |
| First cold plunge booking | Client | Email | Immediately | Cold plunge protocol |
| Amenity booking cancelled | Client | Email | Immediately | Credit returned |

---

### Memberships & Payments

| Trigger | Who | Channel | Timing | Notes |
|---|---|---|---|---|
| Membership activated | Client | Email | Immediately | Welcome + full membership details |
| Renewal reminder | Client | Email | 7 days before renewal | Plan, price, next bill date |
| Renewal successful | Client | Email | On renewal | Receipt + next period start |
| Renewal failed — retry pending | Client | Email + Push | On failure | "Update your payment method" |
| Renewal failed — final | Client | Email | After retries exhausted | Membership paused or cancelled |
| Membership paused | Client | Email | Immediately | Pause duration, resume date |
| Membership cancelled | Client | Email | Immediately | Access end date, offboarding |
| Credit pack purchased | Client | Email | Immediately | Pack size, expiration date |
| Credits low (1 remaining) | Client | Push + Email | When 1 credit remains | "Time to renew your pack" |
| Credit expiring (3 days) | Client | Push + Email | 3 days before expiry | "Don't lose your credits" |
| Wellness credits reset | Client | Push | On reset date | "Your sauna credits just refreshed!" |
| Payment method expiring | Client | Email | 30 days before card expiry | "Update your card to avoid interruption" |

---

### Client Journey & Engagement

| Trigger | Who | Channel | Timing | Notes |
|---|---|---|---|---|
| Account created | Client | Email | Immediately | Welcome + intake questionnaire CTA |
| Intake questionnaire completed | Client | Email | Immediately | Personalized first-class tips |
| First class booked | Client | Email | Immediately | "What to bring" + what to expect |
| 24hr before first ever class | Client | Email + Push | 24hr before | First-timer prep guide |
| 2hr after first class | Client | Email | 2hr post | "How was your first class?" |
| Day 3 — no second booking | Client | Email | Day 3 after first visit | "Ready to come back?" + schedule link |
| Day 7 — no second booking | Client | Email | Day 7 after first visit | Softer re-engagement |
| Weekly goal met | Client | Push | End of goal week | "You hit your goal this week!" |
| Weekly goal missed | Client | Push | End of goal week | Encouragement, not shame |
| Streak milestone | Client | Push + Email | At milestone | Celebrate the streak |
| Class milestone (5, 10, 25, 50, 100, 200) | Client | Push + Email | At milestone | Milestone card + badge |
| Birthday | Client | Email + Push | Day of birthday | Warm message from the studio |
| 1-year anniversary | Client | Email | On anniversary | Personal note from Ruby / studio |
| Personalized tip (weekly) | Client | Email or Push | Weekly | Rotates through tip library |

**Re-engagement messages:** TBD — pending Ruby's input on approach, timing, and whether to include promo offers.

---

### On-Demand

| Trigger | Who | Channel | Timing | Notes |
|---|---|---|---|---|
| New video published (relevant tag) | Client | Push + Email | On publish | Only sent to clients with matching tags |
| Resume watching | Client | Push | 3 days after partial watch | "Pick up where you left off" |
| Series completion | Client | Push | On completion | "You finished the series!" |

---

### Staff Notifications

| Trigger | Who | Channel | Timing | Notes |
|---|---|---|---|---|
| New private session request | Instructor | Email + Push | Immediately | Client name, type, requested slots |
| Private session cancelled | Instructor | Push + Email | Immediately | Slot freed |
| Client milestone alert | Instructor | In-app | At class start | "Sarah is 3 sessions from her 50th!" |
| Client first visit | Instructor | In-app | At class start | "New client — first time ever" flag |
| Pay stub ready | Staff | Email | On pay period close | Link to pay breakdown |
| Pay period closing soon | Manager / Owner | In-app | 2 days before | Reminder to review |
| Class fill rate alert (< 50%, 24hr out) | Manager / Owner | Push + Email | 24hr before class | Option to promote or cancel |
| Membership payment failed | Manager / Owner | In-app | On failure | Client name, amount, retry status |
| Waitlist with open spots | Manager / Owner | In-app | Real-time | "2 spots open, 3 on waitlist" |

---

## Frequency Caps

No client should receive more than:

- **3 push notifications per day**
- **1 SMS per day** (except time-sensitive: waitlist spot, class cancellation)
- **2 marketing emails per week** (transactional emails are uncapped)

If multiple triggers fire simultaneously, the platform batches or prioritizes:
1. Transactional first (booking confirmation, payment failure)
2. Time-sensitive second (class cancelled, waitlist spot)
3. Engagement last (tips, milestone)

---

## Email Design Standards

All emails use **React Email** components with a shared design system:

- Marathon Pilates logo + brand colors header
- Clean, single-column layout — reads well on mobile
- One primary CTA per email (max two)
- Footer: manage preferences | unsubscribe | studio address
- Sent from: `hello@marathonpilates.com` or `noreply@marathonpilates.com`
- Reply-to: `hello@marathonpilates.com` (real inbox — clients can reply)

**Tone:** Warm, direct, human. No corporate language. Write like Ruby would talk to a client she knows.

**Subject line rules:**
- Under 50 characters
- No all-caps
- No "!" overuse
- Personalized when possible ("Your 9am class tomorrow, Sarah")

---

## SMS Standards

- Sent from a dedicated Marathon Pilates number (Twilio long code or short code)
- Always under 160 characters (1 SMS credit)
- Always include opt-out: "Reply STOP to unsubscribe"
- Never send SMS between 8pm–8am local time
- Conversational, not robotic: "Heads up — your Reformer class is in 2 hours! See you at Charlotte Park."

---

## Push Notification Standards

- Title: short (< 40 characters)
- Body: under 100 characters
- Always actionable — tap goes somewhere meaningful (booking screen, video, journey tab)
- Badge counts: show number of unread in-app alerts
- No push between 9pm–7am (respect quiet hours)

**Examples:**

```
Title: "🔥 14-day streak!"
Body: "You've been consistent all month. Keep it going."
Tap → Journey tab

Title: "Spot just opened"
Body: "A spot opened in tomorrow's 7am Reformer. Grab it?"
Tap → Booking screen for that class

Title: "Your sauna credits just reset"
Body: "4 sessions ready to use this month."
Tap → Amenity booking
```

---

## Admin Notification Configuration

Ruby and Susan can configure notification behavior without code changes:

```
Admin → Settings → Notifications

  Reminder timing:
    Class reminder — email:    [24hr] before  ▾
    Class reminder — SMS:      [2hr]  before  ▾
    Private reminder — email:  [24hr] before  ▾
    Private reminder — SMS:    [2hr]  before  ▾

  Waitlist spot window:        [30] minutes  ▾

  Re-engagement triggers:
    First nudge:               [14] days no visit  ▾
    Second nudge:              [21] days no visit  ▾
    Final check-in:            [60] days no visit  ▾

  Credit expiry warning:       [3] days before expiry  ▾
  Renewal reminder:            [7] days before renewal  ▾

  Fill rate alert threshold:   [50]% with [24hr] to go  ▾

  Quiet hours (push + SMS):    9:00pm – 7:00am  ▾
```

---

## Notification Log (Admin)

Every notification sent is logged:

```
Admin → Reports → Notification Log

  Filter: Client | Type | Channel | Date range | Status

  ─────────────────────────────────────────────────────────────
  Mar 10 · 6:45am  Sarah K.     Push   "Class reminder"   Delivered
  Mar 10 · 6:45am  James M.     SMS    "Class reminder"   Delivered
  Mar 10 · 6:30am  Priya L.     Email  "Renewal reminder" Opened
  Mar 9  · 5:00pm  Dana R.      Push   "Waitlist spot"    Delivered (claimed)
  Mar 9  · 4:00pm  Tom W.       Email  "No-show notice"   Delivered
  ─────────────────────────────────────────────────────────────
```

Admin can resend a notification or view its exact content from the log. Useful for troubleshooting ("Did the client get that cancellation email?").

---

## Open Questions / Decisions Needed

- [ ] **Re-engagement:** Full strategy TBD — pending Ruby's input (timing, tone, whether to include offers)
- [ ] **Birthday message:** Warm message confirmed. Gift (credit, class, etc.) deferred — TBD if/when Ruby wants to add one.
- [ ] **100 / 200 class reward:** Card from studio is current practice. Platform will support adding a gift/credit later if Ruby decides to expand it.
- [ ] **Instructor push setup:** Do instructors use the same client app with an instructor mode, or a separate admin app? (Affects push channel for staff notifications)
- [ ] **Class fill rate alerts:** Does Ruby want proactive alerts when a class is underbooked? Or is she checking the dashboard herself?
- [x] **SMS sender:** One shared number for both locations. ✅ Confirmed.
- [ ] **Unsubscribe handling:** If a client unsubscribes from all marketing, do we still send the weekly personalized tip, or is that considered marketing?

---

*Next: `10-data-migration.md` — moving from Arketa to the new platform*
