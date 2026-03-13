# Spec 04 — Private Session Booking
*Marathon Pilates Platform | Created: 2026-03-09*

---

## The Problem Today

Private sessions at Marathon Pilates are booked via **email** (marathon@marathonpilates.com).

This means:
- Client emails to request a session
- Staff reads email, checks instructor availability manually, replies with options
- Client replies to confirm
- Staff manually enters the booking
- If instructor changes availability, the whole chain repeats

**Impact:**
- Clients wait hours (or days) to get a confirmed booking
- Staff spend significant time on email back-and-forth
- No 24/7 self-service — clients can't book at 10pm when they think of it
- Revenue is lost when clients give up and don't follow through
- No automated reminders, no cancel policy enforcement, no credit tracking

**This is a Phase 1 fix.** Private session self-booking should launch at the same time as the rest of the platform.

---

## Session Types

| Type | Format | Price |
|---|---|---|
| Solo Private | 1 client + 1 instructor | $110/session |
| Duet | 2 clients + 1 instructor | $85/person |
| Trio | 3 clients + 1 instructor | $75/person |

### Packs (Solo)

| Pack | Price | Expiration |
|---|---|---|
| Intro — 3 sessions (new clients only) | $250 | TBD |
| 5-pack | $480 | 3 months |
| 10-pack | $920 | 6 months |

---

## How It's Different from Group Class Booking

Group classes have a fixed schedule — the client just picks a slot. Privates are different:

- **Instructor-specific** — client may want a particular instructor
- **Time is flexible** — not a fixed schedule, based on instructor availability
- **Room/equipment is reserved** — reformer and room must be blocked
- **Duet/trio requires coordination** — multiple clients must book the same slot
- **Cancellation is higher stakes** — instructor time is fully reserved; short-notice cancels hurt more

---

## Flow 1 — Solo Private Booking

```
[1] Client navigates to "Private Sessions" page
        ↓
[2] Selects session type: Solo / Duet / Trio
        ↓
[3] (Optional) Selects preferred instructor
    — If no preference, shows "First Available"
        ↓
[4] Calendar view shows instructor's available slots
    — Real-time availability (no double-booking)
    — Shows only slots where instructor + room are both free
        ↓
[5] Client selects date + time
        ↓
[6] Checkout:
    [6a] Has a private pack → credit auto-applied, confirm in 1 tap
    [6b] No credits → select purchase option (single / pack) → Stripe checkout
    [6c] New client → intro 3-pack shown prominently
        ↓
[7] Booking confirmed:
    — Client confirmation (email + push)
    — Instructor notification
    — Calendar invite (.ics) attached to email
    — Cancel deadline shown clearly
```

---

## Flow 2 — Duet Booking

Duet/trio adds coordination complexity — two clients need the same slot.

### Option A — Organizer Flow (Recommended for v1)

```
[1] Client A selects "Duet" → picks instructor + time slot
        ↓
[2] System shows price: "$85/person — invite your partner"
        ↓
[3] Client A completes their own booking + payment
        ↓
[4] System generates a shareable invite link:
    "You've booked a duet! Share this link with your partner to join."
        ↓
[5] Client B opens link → sees the reserved slot → pays their $85
        ↓
[6] Both clients confirmed → instructor notified → session locked
        ↓
[7] If Client B doesn't book within 24 hours:
    — Reminder sent to Client B
    — After 48 hours: Client A notified, slot may open to others
    — Studio admin can manually fill the second spot
```

### Option B — Group Code (Future)
Studio creates a duet session code, shares it with both clients independently. Both book using the code. Simpler but less guided.

---

## Flow 3 — Instructor Self-Scheduling (Admin)

Instructors should be able to set and manage their own availability:

```
[1] Instructor logs into their dashboard
        ↓
[2] Sets weekly availability blocks:
    e.g., "Available Mon/Wed/Fri 7am–12pm, Tue/Thu 2pm–6pm"
        ↓
[3] Can block specific dates/times (vacation, sick, etc.)
        ↓
[4] Availability immediately reflected in client-facing booking calendar
        ↓
[5] Instructor sees their upcoming private sessions in a daily/weekly view
        ↓
[6] If they need to cancel, they flag the session:
    — System notifies client immediately
    — Credit is returned to client
    — Cancellation logged (for studio visibility)
```

---

## Flow 4 — Staff: Manual Private Booking

Same as group class manual booking, but with extra fields:

```
[1] Admin searches for client
        ↓
[2] Selects "Book Private" → picks session type (solo/duet/trio)
        ↓
[3] Selects instructor + time slot (sees instructor availability)
        ↓
[4] Choose payment: charge card on file, apply credit, mark complimentary
        ↓
[5] Client and instructor both notified
```

---

## Cancellation Policy for Privates

Private cancellation windows should be stricter than group classes — instructor time is fully reserved.

**Recommended policy (studio to confirm):**
- **24+ hours before:** Free cancel, credit returned
- **12–24 hours before:** 50% credit returned (or studio discretion)
- **Under 12 hours / no-show:** Full session charged / credit forfeited

Staff can always override with full refund if circumstances warrant (instructor illness, studio error, etc.).

All overrides logged with staff name and reason.

---

## Instructor Profile (Booking-Facing)

When a client is choosing an instructor for their private, they see:

```
┌──────────────────────────────────────┐
│  [Photo]  Anissa Pollard             │
│           Senior Trainer             │
│           CPI · Franklin Method      │
│                                      │
│  Specialties: Rehabilitation,        │
│  Core Strength, Prenatal             │
│                                      │
│  ⭐ 4.9  ·  143 sessions             │
│                                      │
│  [View Availability]                 │
└──────────────────────────────────────┘
```

Each instructor card shows:
- Name, role, certifications
- Specialties (admin-set)
- Rating (if review system enabled — future)
- Session count (social proof)
- Available slots (next 7 days preview)

---

## Availability Rules

The system must enforce these constraints to show a slot as bookable:

1. **Instructor is available** (within their set availability window)
2. **Instructor has no other booking** at that time
3. **Room / reformer is free** (no group class running, no other private)
4. **Within booking window** (e.g., can only book 24hrs–30 days in advance — studio configurable)
5. **Location match** — instructor is assigned to a location; slot only shows for that location

---

## Notifications

| Trigger | Recipient | Channel | Timing |
|---|---|---|---|
| Private booked | Client | Email + Push | Immediately |
| Private booked | Instructor | Email + Push | Immediately |
| Session reminder | Client | Email + Push | 24hr before + 2hr before |
| Session reminder | Instructor | Push | 1hr before |
| Duet invite sent | Client B | Email + SMS | Immediately |
| Duet invite expiring | Client B | SMS | 24hr before expiry |
| Instructor cancels | Client | Email + SMS | Immediately |
| Client late cancel | Instructor | Push | Immediately |
| Client no-show | Admin | Dashboard alert | 15min after session start |

---

## Admin Dashboard — Private Session View

Studio admin needs:

- **Upcoming private sessions** — by instructor, by date, by location
- **Empty slots** — where instructor is available but not booked (revenue opportunity)
- **Duet sessions with unfilled spots** — follow up to fill the second slot
- **No-shows and late cancels** — this week's list
- **Private session revenue** — by instructor, by period
- **Pack expiration alerts** — clients with expiring packs who haven't booked

---

## Integration with Credit System

Private credits are separate from group class credits:

| Credit Type | Used For |
|---|---|
| Group class credit | Group reformer classes only |
| Private credit | Solo private sessions |
| Duet credit | Duet sessions (per person) |
| Trio credit | Trio sessions (per person) |
| Amenity credit | Sauna / cold plunge |
| Bundle credit | Contrast therapy |

Credits are clearly labeled in the client's account. At checkout, the system auto-selects the right credit type — client never has to figure it out.

---

## Open Questions / Decisions Needed

- [ ] **Duet/Trio v1 scope:** Build the organizer flow (Option A) in Phase 1, or simplify to staff-only duet booking initially?
- [ ] **Instructor selection:** Can clients always choose instructor, or should "first available" be the default with instructor preference as optional?
- [ ] **Cancellation policy thresholds:** Confirm 24hr free / 12–24hr partial / under 12hr full charge — or different windows?
- [ ] **Instructor availability:** Do instructors set their own availability in the system, or does admin manage it?
- [ ] **Review/rating system:** Include instructor ratings from day one or defer to a later phase?
- [ ] **Pack expiration grace:** If a 5-pack expires while a client is mid-booking, what happens?
- [ ] **Neveskin booking:** Similar flow to private sessions (appointment-based)? Should it share this infrastructure?

---

*Next: `05-membership-and-credits.md` — the unified credit and membership system*
