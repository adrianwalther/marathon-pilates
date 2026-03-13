# Spec 08 — Admin Dashboard
*Marathon Pilates Platform | Created: 2026-03-09*

---

## Overview

The admin dashboard is the operational nerve center for Marathon Pilates. Ruby, Susan LeGrand, instructors, and front desk staff each have a tailored view — they see exactly what they need for their role and nothing they don't.

**Access levels:**

| Role | Access |
|---|---|
| **Owner (Ruby)** | Full access — all locations, all data, all settings |
| **Manager (Susan LeGrand)** | Full operational access — no billing/payroll rate changes |
| **Instructor** | Their own schedule, client rosters, private availability, their own pay stubs |
| **Front Desk** | Check-in, bookings, client lookup, clock in/out |

---

## Role-Based Permissions Matrix

All sensitive financial and business data is **Ruby-only by default**. The table below defines exactly what each role can see and do.

### 🔴 Ruby Only (Owner)

These data points are **never visible** to any other role, regardless of how they access the system:

| Sensitive Data | Why Ruby-Only |
|---|---|
| Revenue reports (daily, period, annual) | Core business financials |
| Total payroll amounts and summaries | Staff compensation is confidential |
| Individual staff pay rates | HR-sensitive |
| Credit liability report | Strategic financial exposure |
| Stripe account / payout settings | Financial account access |
| Membership pricing and margin settings | Business pricing strategy |
| Business analytics (retention, churn, conversion) | Strategic metrics |
| Platform settings (policies, booking rules) | Business configuration |
| Integration API keys | Security credentials |

Ruby's dashboard home shows: revenue KPI card, payroll status, retention metrics, full analytics.

---

### 🟡 Manager (Susan LeGrand)

Susan sees everything **operational** but no financial figures:

| Data | Susan Can See | Susan Cannot See |
|---|---|---|
| Today's schedule & class fill rates | ✅ (counts only, e.g., "6/8") | ❌ Revenue generated |
| Client profiles | ✅ Name, membership status, credits | ❌ Client billing history, Stripe data |
| Failed payment alerts | ✅ Client name flagged | ❌ Payment amounts |
| Payroll | ❌ Not visible | ❌ Pay rates, totals |
| Staff profiles | ✅ Name, role, certifications | ❌ Pay rate fields |
| Bookings & check-in | ✅ Full access | — |
| Credit adjustments | ✅ Can add/remove with reason | ❌ Cannot change pricing |
| Gift cards | ✅ Can issue | ❌ Cannot set denominations |
| Class management | ✅ Add, edit, cancel classes | ❌ Cannot change prices |
| Notifications | ✅ Can send | — |

Susan's dashboard home shows: today's schedule, fill rates, alerts (no revenue card).

---

### 🟢 Instructor

Instructors see only their own data:

| Data | Instructor Can See | Instructor Cannot See |
|---|---|---|
| Schedule | ✅ Their own classes and privates only | ❌ Other instructors' schedules |
| Class roster | ✅ Client names + membership type | ❌ Client payment info, phone, email |
| Client notes | ✅ Can add/view instructor notes | ❌ Client billing or Stripe data |
| Pay | ✅ Their own pay breakdown (read-only) | ❌ Other staff pay or rates |
| Availability | ✅ Can set their own (if enabled) | — |
| Check-in | ✅ Can check in their own class | ❌ Cannot process payments |
| Revenue | ❌ Not visible | — |
| Admin settings | ❌ Not visible | — |

---

### ⚪ Front Desk

Front desk sees only what's needed to run the door:

| Data | Front Desk Can See | Front Desk Cannot See |
|---|---|---|
| Today's schedule | ✅ Class names, times, instructor | ❌ Fill rate revenue value |
| Roster | ✅ Client names, check-in status | ❌ Client payment info |
| Client lookup | ✅ Name, membership status, credit balance | ❌ Billing history, Stripe, amounts paid |
| Walk-in booking | ✅ Can book and charge card on file | ❌ Cannot see card details |
| Payroll | ❌ Not visible | — |
| Revenue | ❌ Not visible | — |
| Settings | ❌ Not visible | — |
| Other staff data | ❌ Not visible | — |

---

### Implementation Notes

- **Role is set at account creation** — assigned by Ruby in Settings → Staff
- **No role can self-elevate** — role changes require Owner authentication
- **Supabase Row Level Security (RLS)** enforces permissions at the database level — the UI hiding data is a UX convenience, not the security layer. Even direct API calls return only data the role is authorized to see
- **Audit log** — all data access by non-Owner roles is logged (who viewed what, when)
- **Session tokens are role-scoped** — a manager logging in gets a manager token; switching roles requires re-authentication
- **Revenue figures are never included in email notifications** sent to non-Owner roles — e.g., a "class summary" email to Susan shows headcount, not revenue

---

## Owner / Manager Dashboard — Home Screen

```
┌─────────────────────────────────────────────────────────────┐
│  MARATHON PILATES              📍 All Locations  ▾  Today ▾ │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TODAY AT A GLANCE                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Classes │ │  Clients │ │  Revenue │ │  Waitlist│      │
│  │    8     │ │    64    │ │  $1,240  │ │    5     │      │
│  │ scheduled│ │  booked  │ │  today   │ │ waiting  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  UPCOMING CLASSES — TODAY                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  7:00am  Reformer Flow · Anissa · 12/14 · CP       │   │
│  │  8:00am  Mat Pilates · Sirkka · 8/10 · GH          │   │
│  │  9:00am  Reformer Fundamentals · Anissa · 5/14 · CP│   │
│  │  10:00am Stretch + Restore · Sirkka · 11/14 · GH   │   │
│  │  ...                                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ALERTS                                                     │
│  ⚠️  2 clients on waitlist for 9am class (2 spots open)    │
│  ⚠️  Anissa has a private session with no credit on file   │
│  ℹ️  3 memberships past due — payment retry pending        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Location Toggle
- **All Locations** — combined view
- **Charlotte Park** — filtered to CP only
- **Green Hills** — filtered to GH only
- Most reports and views support per-location filtering

---

## Schedule Management

### Class Schedule View

```
Admin → Schedule
  ├── Week view (default)
  ├── Day view
  └── List view
```

Each class block shows:
- Class name, instructor, time
- Location + room
- Enrollment count / capacity (e.g., 9/14)
- Status: Scheduled | Cancelled | In Progress | Completed

### Adding / Editing a Class

Admin can create a one-off class or a recurring series:

```
New Class
  ├── Class name (select from service list or create custom)
  ├── Instructor (dropdown — filters by location)
  ├── Location + room
  ├── Date + time
  ├── Duration
  ├── Max capacity
  ├── Recurrence: None / Daily / Weekly / Custom
  └── Notes (internal — not client-facing)
```

### Cancelling a Class

```
[1] Admin selects class → "Cancel Class"
      ↓
[2] Reason field (internal note)
      ↓
[3] System auto-notifies all enrolled clients:
    — Email + push: "Class cancelled — credit returned"
      ↓
[4] All credits released, all bookings voided
      ↓
[5] Waitlist clients notified: "Class was cancelled"
```

### Substitute Instructor Assignment

```
[1] Class block → "Assign Sub"
      ↓
[2] Select sub instructor (must be same location or confirmed remote)
      ↓
[3] Original instructor removed from class record
      ↓
[4] Sub instructor added — their rate applies for payroll
      ↓
[5] Clients notified: "Your class instructor has changed"
```

Sub assignments are logged — original instructor is NOT paid; sub instructor IS paid.

---

## Class Roster & Check-In (Admin / Front Desk)

### Roster View

```
Admin → Schedule → [Select Class] → Roster

  Reformer Flow — 7:00am — Charlotte Park
  Instructor: Anissa Pollard
  ─────────────────────────────────────────
  CHECKED IN (5)
  ✅  Sarah K.       Member — Unlimited
  ✅  James M.       10-pack  (6 remaining)
  ✅  Priya L.       Member — Core
  ✅  Dana R.        New client intro
  ✅  Tom W.         Drop-in

  NOT YET (7)
  ○   Michelle B.    Member — Unlimited
  ○   Kevin T.       5-pack (2 remaining)
  ...

  WAITLIST (2)
  🕐  Chloe P.       Member — Unlimited
  🕐  Ravi S.        Drop-in

  [Check In All Present]  [Mark No-Show]  [Add Walk-In]
```

### Front Desk Check-In Flow

```
[1] Client arrives → Front desk opens roster for the class
      ↓
[2] Tap client name → "Check In"
      — Credit consumed at this moment
      — Confirmation shows credit balance remaining
      ↓
[3] Walk-in (not pre-booked):
      — "Add Walk-In" → search client
      — If spots available: books + checks in simultaneously
      — If no credits: prompt for payment (card on file or new charge)
```

### No-Show Handling

- After class start + configurable window (e.g., 15 min): admin can mark remaining attendees as no-show
- No-show: credit consumed, late cancel policy applies
- Admin can override — full credit return with logged reason

---

## Client Management

### Client List

```
Admin → Clients

  [Search by name, email, phone]
  [Filter: All | Active Member | Pack Only | Lapsed | New This Month]
  [Sort: Last Visit | Name | Join Date]
  [Location: All | CP | GH]

  ┌────────────────────────────────────────────────────────────┐
  │ Sarah K.         Active Member    Last visit: Today        │
  │ James M.         10-pack (6 left) Last visit: 3 days ago   │
  │ Priya L.         Active Member    Last visit: 1 week ago   │
  │ Dana R.          Intro offer      Joined: 2 days ago       │
  └────────────────────────────────────────────────────────────┘
```

### Client Profile (Admin View)

```
CLIENT PROFILE — Sarah Kim
──────────────────────────────────────────────────────────────
  📧 sarah@email.com  📱 (615) 555-1234
  📍 Charlotte Park (primary)  |  Member since: Jan 2025

  MEMBERSHIP
  Plan: Unlimited Group + Sauna 4/mo
  Status: Active  |  Renews: Mar 18  |  Stripe: ●●●● 4242

  CREDITS
  Group Classes:   Unlimited (membership)
  Sauna:           3 of 4 this month  ·  resets Mar 18
  Cold Plunge:     2 sessions         ·  expires Jun 1
  Privates:        1 session          ·  expires Apr 15

  UPCOMING BOOKINGS
  → Tue Mar 10 · 7:00am · Reformer Flow · CP
  → Wed Mar 11 · 2:00pm · Sauna · CP

  STATS
  Total sessions: 47  |  On-demand: 12  |  Member 14 months

  NOTES (Staff Only)
  "Prenatal modifications needed — due May 2026"
  Added by: Anissa P.  ·  Mar 5, 2026

  ACTIONS
  [Add Credit]  [Remove Credit]  [Pause Membership]
  [Book for Client]  [Send Message]  [View Full History]
──────────────────────────────────────────────────────────────
```

### Manual Credit Adjustment

Admin can add or remove credits at any time:

```
Add Credit
  ├── Credit type (dropdown: Group / Private / Sauna / etc.)
  ├── Quantity
  ├── Expiration date (optional)
  ├── Reason (required — logged) e.g., "Complimentary — instructor cancellation"
  └── [Confirm]
```

All adjustments logged with: admin name, timestamp, reason. Full audit trail.

---

## Booking Management

### View All Bookings

```
Admin → Bookings
  ├── Filter by: Date range | Location | Class type | Instructor | Status
  ├── Status: Confirmed | Waitlisted | Cancelled | No-Show
  └── Export to CSV
```

### Manual Booking (Admin)

Admin can book any client into any class or private:

```
[1] Search client → select
[2] Select class / private session / amenity slot
[3] Apply payment:
    — Use existing credit
    — Charge card on file
    — Mark as complimentary (with reason)
[4] Client notified automatically
```

### Waitlist Management

- Waitlist queue shown per class
- When a spot opens: system auto-notifies the next person on the waitlist
- Admin can manually move someone up the waitlist or remove them
- Admin can see which waitlisted clients have been notified and whether they've acted

---

## Private Session Management

### Private Session Board

```
Admin → Private Sessions

  [Upcoming]  [Empty Slots]  [Unfilled Duets]  [Past]

  UPCOMING THIS WEEK
  ─────────────────────────────────────────────────────────
  Mon Mar 10 · 11:00am  Solo Private · Anissa · Sarah K. · CP
  Mon Mar 10 · 2:00pm   Solo Private · Sirkka · (OPEN)   · GH  ⚠️
  Tue Mar 11 · 9:00am   Duet · Anissa · Dana R. + (OPEN) · CP  ⚠️
  Wed Mar 12 · 10:00am  Solo Private · Anissa · James M.  · CP
  ─────────────────────────────────────────────────────────
```

**Empty Slots** tab — instructor is available but unbookt → revenue opportunity
**Unfilled Duets** tab — one person booked, partner slot still open → follow-up needed

### Instructor Availability Management

Admin can manage any instructor's availability (or instructors can manage their own):

```
Admin → Staff → [Instructor] → Availability

  Weekly schedule:
  Mon: 7:00am – 12:00pm  ✅
  Tue: 2:00pm – 6:00pm   ✅
  Wed: 7:00am – 12:00pm  ✅
  Thu: Off
  Fri: 7:00am – 1:00pm   ✅

  Blocked dates:
  Mar 15–17: Vacation

  [Edit]  [Add Block]
```

---

## Amenity Management

### Sauna / Cold Plunge Slots

```
Admin → Amenities → [Date]

  SAUNA — Charlotte Park
  ─────────────────────────────────────
  9:00am   Sarah K. + [guest: Lena R.]  ✅ Checked in
  9:45am   James M.                     ○ Upcoming
  10:30am  OPEN
  11:15am  Priya L.                     ○ Upcoming
  ...

  COLD PLUNGE — Charlotte Park
  ─────────────────────────────────────
  9:00am   Dana R.                      ✅ Checked in
  9:30am   Tom W.                       ○ Upcoming
  ...

  [Add Walk-In]  [Block Slot]  [Edit Capacity]
```

- **Block Slot** — mark a slot as unavailable (cleaning, maintenance)
- Turnover buffer is enforced automatically — admin cannot book within the buffer window
- Guest bookings shown with guest name under member's booking

---

## Staff Management

### Staff List

```
Admin → Staff

  Name               Role          Location    Status
  ─────────────────────────────────────────────────────────
  Ruby Ramdhan       Owner         All         Active
  Susan LeGrand      Manager       All         Active
  Anissa Pollard     Instructor    CP          Active
  Sirkka Wood        Instructor    GH          Active
  Bobby Douangkesone Front Desk    CP          Active
  ...
```

### Staff Profile

```
STAFF PROFILE — Anissa Pollard
──────────────────────────────────────────────────────────────
  Role: Instructor
  Location: Charlotte Park (primary)
  Certifications: CPI, Franklin Method
  Specialties: Rehabilitation, Core Strength, Prenatal

  PAY STRUCTURE
  Group base rate:    $XX/class
  Per-head bonus:     $X above X students
  Private rate:       $XX/session (solo)  |  $XX (duet/trio)

  This pay period:
  Classes taught: 8  |  Privates: 3  |  Est. pay: $XXX

  AVAILABILITY
  Mon/Wed/Fri 7am–12pm · Tue/Thu 2pm–6pm

  [Edit Profile]  [Edit Pay Rate]  [Edit Availability]
  [View Pay History]  [Deactivate]
──────────────────────────────────────────────────────────────
```

---

## Payroll

See `06-payroll.md` for full payroll spec. Admin dashboard entry point:

```
Admin → Payroll

  Current Pay Period: Mar 1 – Mar 14, 2026
  Status: In Progress

  [View Summary]  [Export CSV]  [Mark as Processed]

  ─────────────────────────────────────────────────────────
  NAME                  ROLE        EST. PAY
  Anissa Pollard        Instructor  $449.00
  Sirkka Wood           Instructor  $423.00
  Bobby Douangkesone    Front Desk  $XXX.00
  ...
  ─────────────────────────────────────────────────────────
  TOTAL THIS PERIOD:    $X,XXX.00
```

---

## Reports & Analytics

### Revenue Reports

```
Admin → Reports → Revenue

  Date range: [Mar 1 – Mar 14]   Location: [All]

  Revenue by Type
  ───────────────────────────────────────────
  Group class bookings     $X,XXX
  Private sessions         $XXX
  Sauna                    $XXX
  Cold Plunge              $XXX
  Contrast Therapy         $XXX
  Membership renewals      $X,XXX
  Pack purchases           $XXX
  Neveskin                 $XXX
  ───────────────────────────────────────────
  TOTAL                    $XX,XXX

  [Export CSV]
```

### Attendance Reports

- Class fill rate by instructor, class type, time slot
- No-show and late cancel rates
- Peak days/times
- Location comparison

### Membership Reports

- Active members by plan
- New members this period
- Cancellations / churn
- Paused memberships
- Past-due accounts

### Credit Liability Report

Outstanding unused credits across all clients — helps Ruby understand what's owed:

```
CREDIT LIABILITY SNAPSHOT — Mar 9, 2026

  Group class credits (active):    342 credits  ~  $13,680 in liability
  Sauna credits (this period):      87 credits  ~   $4,350
  Cold Plunge credits:              54 credits  ~   $1,620
  Private credits:                  29 credits  ~   $3,190
  ─────────────────────────────────────────────────────────
  TOTAL OUTSTANDING LIABILITY:     ~  $22,840
```

### On-Demand Analytics

- Most watched videos (top 10)
- Completion rates per video
- Watch time by instructor
- Members using on-demand vs. not
- Drop-off points (pulled from Mux Data)

### Retention Dashboard

- 30/60/90 day retention rates
- Clients at risk (haven't visited in 14+ days)
- New client conversion (intro offer → membership)
- Lapsed client counts

---

## Notifications & Alerts Center

Admin sees a consolidated alert feed:

```
Admin → Alerts

  ⚠️  Today
  ─────────────────────────────────────────────────────────
  3 memberships past due — retry scheduled
  Anissa's 9am class: 5 spots open with 2 on waitlist
  Duet session (Mar 11, Anissa): 1 spot still unfilled

  ℹ️  This Week
  ─────────────────────────────────────────────────────────
  Pay period closes in 5 days
  8 clients have wellness credits expiring this period
  Sarah K. has been a member for 1 year 🎉
```

---

## Settings

Ruby (owner) can configure all platform behavior without a developer:

### Studio Settings
- Studio name, logo, address (per location)
- Timezone
- Business hours (for each location)
- Contact email / phone

### Booking Rules
- Cancellation window (group classes)
- Cancellation window (private sessions)
- Late cancel penalty (credit forfeited vs. partial)
- No-show policy
- Max advance booking window (e.g., 30 days)
- Min advance booking window (e.g., 1 hour)
- Waitlist auto-notify (on/off, and how long client has to accept)

### Membership & Pricing
- Create / edit / archive membership plans
- Create / edit pack products
- Create / edit intro offers
- Set intro offer restrictions (new clients only, etc.)
- Gift card denominations

### Amenity Settings (per resource)
- Sauna max concurrent occupancy
- Cold plunge max concurrent occupancy
- Turnover buffer duration (per resource)
- Slot length

### Staff & Permissions
- Add / deactivate staff accounts
- Assign roles and locations
- Set pay rates per employee
- Manage instructor availability (or allow self-manage)

### Notifications
- Configure which notifications are sent (on/off per trigger)
- Email sender name / reply-to
- SMS opt-in defaults
- Push notification opt-in defaults

### Integrations
- Stripe: connected account, payout settings
- Mux: API key status
- Gusto: export format settings
- Twilio: SMS sender

---

## Instructor Dashboard

Instructors log in and see their own focused view:

```
INSTRUCTOR DASHBOARD — Anissa Pollard

  TODAY
  ─────────────────────────────────────────────────────────
  7:00am  Reformer Flow  ·  14/14 full  ·  Charlotte Park
  9:00am  Reformer Fundamentals  ·  5/14  ·  Charlotte Park
  11:00am Solo Private  ·  Sarah K.  ·  Charlotte Park

  THIS WEEK
  ─────────────────────────────────────────────────────────
  Mon:  2 classes · 1 private
  Tue:  1 class
  Wed:  2 classes · 2 privates
  Thu:  Off
  Fri:  2 classes

  MY PAY (Mar 1–14)
  ─────────────────────────────────────────────────────────
  Classes taught: 8  ·  Students: 87
  Base pay: $280  ·  Bonuses: $64  ·  Privates: $105
  Est. gross: $449.00

  [View Roster]  [Set Availability]  [View Pay History]
```

Instructors can:
- View their upcoming class rosters (student names, membership type)
- Check in students themselves (if no front desk present)
- Add notes to a client's profile (instructor notes — visible to staff, not clients)
- Set their own availability (if admin has enabled self-manage)
- Flag a private session for cancellation
- View their own pay breakdowns — read-only

Instructors **cannot:**
- See other instructors' rosters or pay
- Change pricing, memberships, or settings
- Access client payment info

---

## Front Desk Dashboard

Front desk staff log in and see a streamlined, fast check-in view:

```
FRONT DESK — Charlotte Park
──────────────────────────────────────────────────────────
  NEXT CLASS: Reformer Flow · 7:00am · Anissa
  12 booked · 2 spots open · 2 on waitlist

  [Open Roster]  [Add Walk-In]  [Search Client]

  CLOCK IN / OUT
  ──────────────────────────────────────────────────────────
  Clocked in: 6:45am  (3h 15m)
  [Clock Out]  [Log Break]
```

Front desk can:
- Open roster for any current or upcoming class
- Check in clients (tap name)
- Add walk-ins
- Search any client (view profile, credits, upcoming bookings)
- Book clients into available classes or amenities
- Process payments (charge card on file, manual payment)
- Clock in/out and log breaks
- Flag issues for manager review

Front desk **cannot:**
- Change membership plans or pricing
- Edit pay rates
- Access payroll reports
- Modify settings

---

## Mobile Admin Experience

The full dashboard is responsive and works on tablet and phone — Ruby and Susan can manage on the go.

Key mobile actions:
- View today's schedule at a glance
- Check fill rates and waitlists
- Look up a client
- Check in a walk-in
- Approve a credit adjustment
- Receive and dismiss alerts

The admin dashboard is not a separate app — it's the same web app, responsive. No second codebase to maintain.

---

## Open Questions / Decisions Needed

- [ ] **Susan LeGrand's exact role:** Does she have full admin access or a restricted manager role? Any payroll rate access?
- [ ] **Instructor self-service availability:** Do instructors manage their own availability, or does admin manage it on their behalf?
- [ ] **Instructor notes visibility:** Can instructors see notes left by other instructors, or only their own? Can front desk see instructor notes?
- [ ] **Alert preferences:** What alerts does Ruby want to receive by push/email vs. just in-dashboard?
- [ ] **Revenue reporting cycle:** Weekly? Monthly? Or always on-demand?
- [ ] **Multi-location defaults:** When Ruby logs in, does she see All Locations by default, or her primary location?
- [ ] **Guest check-in tracking:** When a member brings a guest to sauna, does the guest show up separately in the headcount for the resource slot?
- [ ] **Staff clock-in location:** Is clock-in location-verified (e.g., must be on studio WiFi), or open?

---

*Next: `09-notifications.md` — the full notification system across email, SMS, and push*
