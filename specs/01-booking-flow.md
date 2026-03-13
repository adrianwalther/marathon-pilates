# Spec 01 — Booking Flow
*Marathon Pilates Platform | Created: 2026-03-09*

---

## Overview
The booking flow is the highest-stakes UX in the platform. Every unnecessary step or point of friction directly reduces conversions and frustrates clients. The goal: a new client books their first class in under 60 seconds. A returning member adds sauna to their class in two taps.

---

## User Types

| Type | Description |
|---|---|
| **New visitor** | Never booked at Marathon Pilates. No account. |
| **Returning client** | Has an account, may have active membership or credits |
| **Active member** | Has a recurring membership; credits auto-apply |
| **Staff / Admin** | Booking on behalf of a client; override rules as needed |

---

## Entry Points

Where does a booking start?

1. **Marathon Pilates website** (Wix embedded widget or custom integration)
2. **Marathon Pilates mobile app** (iOS / Android)
3. **Direct link** — deep link to a specific class, service, or intro offer
4. **Staff admin dashboard** — manual booking for walk-ins or phone calls
5. **Email / push notification CTA** — e.g., waitlist spot opened

---

## Flow 1 — New Client: Intro Offer

> Goal: Discovery → first booking → account creation → payment, in under 60 seconds.

```
[1] Land on schedule or intro offer page
        ↓
[2] See intro offer prominently (e.g., "First Class Free" or "3 Classes $49")
        ↓
[3] Tap intro offer → see available class times
        ↓
[4] Select class time + instructor
        ↓
[5] Enter name + email (minimal — no full profile yet)
        ↓
[6] Payment (if paid intro offer) — Stripe checkout, Apple Pay / Google Pay supported
        ↓
[7] Confirm booking — show class details, what to bring, how to prepare
        ↓
[8] Prompt to download the app (optional, not required to complete)
        ↓
[9] Auto-create account — email with password setup sent after
```

**Key rules:**
- Intro offer is locked to first-time clients only (email match check)
- Full profile setup is deferred — don't block the first booking
- Apple Pay / Google Pay must be supported to minimize payment friction
- Confirmation screen shows: class name, instructor, date/time, address, parking notes, what to wear

---

## Flow 2 — Returning Client: Single Class Booking

> Goal: Logged in → book a class → done in 3 taps or fewer.

```
[1] Open app or website → already logged in
        ↓
[2] Browse schedule (calendar or list view, filterable by service type / instructor)
        ↓
[3] Tap class → see class details (instructor, duration, level, spots remaining)
        ↓
[4] Tap "Book" → system checks for applicable credits/membership
        ↓
[5a] If credit available → confirm booking (1 tap, no payment screen)
[5b] If no credit → show purchase options (drop-in, pack, membership)
        ↓
[6] Booking confirmed — push notification + email confirmation
```

**Key rules:**
- Credits auto-apply — client never manually selects which credit to use
- Show "X spots left" when under 5 available
- Show cancel deadline prominently ("Free cancel until [time]")
- If client is already on waitlist for this class, show that status

---

## Flow 3 — Returning Client: Class + Wellness Add-On

> This is the key differentiator — no competitor does this cleanly.

```
[1] Client selects a Pilates class
        ↓
[2] On class detail screen: "Add Recovery Session?"
    [Sauna 30 min] [Cold Plunge 15 min] [Sauna + Cold Plunge Bundle]
        ↓
[3] Client taps an add-on → selects time slot (suggested: after class ends + 10 min buffer)
        ↓
[4] Confirm both in one review screen:
    - Reformer Pilates: 10:00am–11:00am
    - Sauna Session: 11:15am–11:45am
        ↓
[5] Single checkout / single credit deduction (or single payment)
        ↓
[6] One confirmation with full schedule for the visit
```

**Key rules:**
- Suggest add-on time automatically (class end + transition buffer)
- If membership includes amenity credits: show as "Included in your membership"
- If no amenity credit: show pricing inline — no surprise at checkout
- Both services appear on one booking confirmation
- One cancellation affects both — or allow canceling amenity independently (TBD)

---

## Flow 4 — Waitlist

```
[1] Client sees full class → "Join Waitlist" button (not "Class Full")
        ↓
[2] One tap to join — no payment until promoted
        ↓
[3] Spot opens → instant push notification + SMS: "Your spot is ready — confirm in 30 min"
        ↓
[4a] Client confirms → booking created, payment processed
[4b] Client declines / no response within 30 min → next person on waitlist notified
        ↓
[5] Client can see waitlist position at any time in app
```

**Key rules:**
- Waitlist position is visible to client ("You are #2 on the waitlist")
- 30-minute acceptance window (configurable by studio)
- If client is promoted and doesn't respond, they are NOT charged
- If promoted and confirms, standard cancel policy applies from that point

---

## Flow 5 — Staff: Manual Booking (Admin)

```
[1] Admin opens client search in dashboard
        ↓
[2] Find client (by name, email, phone)
        ↓
[3] Select class / service from schedule
        ↓
[4] Override any rule if needed (override capacity, waive late cancel fee, etc.)
        ↓
[5] Confirm booking — choose payment method (charge card on file, apply credit, mark as complimentary)
        ↓
[6] Client receives standard confirmation notification
```

**Key rules:**
- Staff can book into full classes (override capacity)
- Staff can waive fees and apply manual credits
- All manual overrides are logged with staff name + timestamp (audit trail)
- Staff can book for a client without client needing to be present

---

## Booking Cancellation Flow

```
[1] Client taps booking in app → "Cancel Booking"
        ↓
[2] System checks cancel window:
    [2a] Within free cancel window → cancel confirmed, credit returned
    [2b] Past cancel window → show late cancel policy: fee or credit forfeiture
        ↓
[3] Client confirms cancellation
        ↓
[4] Confirmation sent, waitlist auto-promoted if applicable
```

**Key rules:**
- Cancel deadline shown clearly on every booking detail screen
- Late cancel fee is auto-charged to card on file (no manual staff action required)
- First late cancel may be forgiven (configurable "first offense grace" toggle)
- No-shows are auto-tagged after class end time + 15 minutes

---

## Check-In Flow

```
Option A — QR Code (preferred)
[1] Client opens app → sees "Check In" button for today's class
[2] QR code displayed
[3] Staff scans at front desk → client is checked in

Option B — Staff Manual Check-In
[1] Staff opens class roster in dashboard
[2] Taps client name → "Check In"

Option C — Self Check-In Kiosk (future)
[1] Tablet at front desk shows today's classes
[2] Client finds their name, taps to self check-in
```

---

## Service Types & Booking Rules

| Service Type | Booking Type | Capacity | Resource? | Credit Type |
|---|---|---|---|---|
| Group Reformer class | Class (scheduled) | Max N reformers | Room + equipment | Class credit |
| Mat Pilates class | Class (scheduled) | Max N spots | Room | Class credit |
| Private session | Appointment | 1 (or 2 for semi-private) | Instructor + room | Private credit |
| Sauna session | Timed resource | 1–N concurrent | Sauna room | Amenity credit |
| Cold plunge session | Timed resource | 1–N concurrent | Cold plunge unit | Amenity credit |
| Sauna + cold plunge | Bundle | Depends on resources | Both resources | Bundle credit |
| Intro offer | Class (restricted) | Same as class | Same as class | Intro (one-time) |

---

## Resource Management (Sauna / Cold Plunge)

Unlike classes, wellness amenities need:

- **Turnover buffer:** 10–15 min cleaning/reset window between bookings (no one can book the adjacent slot)
- **Session duration options:** Sauna (15 min / 30 min / 45 min), Cold Plunge (10 min / 15 min)
- **Concurrent capacity:** Can multiple people use the sauna simultaneously? (TBD by studio)
- **Membership access rules:** Some membership tiers include amenity access; drop-ins pay per session
- **Dynamic availability:** Real-time slot availability shown to clients

---

## Notifications Summary

| Trigger | Channel | Timing |
|---|---|---|
| Booking confirmed | Email + Push | Immediately |
| Class reminder | Push + SMS | 24hr before + 1hr before |
| Waitlist: spot available | Push + SMS | Immediately when promoted |
| Cancellation confirmed | Email + Push | Immediately |
| Late cancel fee charged | Email | Immediately |
| No-show flagged | Email | ~15 min after class start |
| Waitlist closed (not promoted) | Email | After class fills |

---

## Open Questions / Decisions Needed

- [ ] Can a client cancel their class but keep the amenity booking? (Or must they cancel together?)
- [ ] What is the default late cancel window? (12hr? 24hr? — studio to decide)
- [ ] Does sauna allow simultaneous occupancy (multiple people at once)? *(Session capacity not published on site — needs confirmation)*
- [ ] Should add-on amenity time slots be suggested or client-chosen?
- [ ] First-offense late cancel grace — yes or no?

**Answered from site research:**
- ✅ **Intro offer structure:** New Client Unlimited Month ($149) for group; 3 Privates ($250) for private; 3 Sauna ($90); 3 Contrast ($150)
- ✅ **Current platform:** Arketa (group classes only — privates still booked via email)
- ✅ **Private booking gap:** No online self-booking for privates — this must be solved in Phase 1
- ✅ **Services to support:** Group Reformer, Private (solo/duet/trio), Sauna, Cold Plunge, Contrast Therapy, Neveskin
- ✅ **Two locations:** Charlotte Park + Green Hills — multi-location support required from day one

---

*Next: `02-client-journey.md` — tracking progress, milestones, and the wellness journey*
