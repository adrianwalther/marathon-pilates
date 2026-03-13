# Spec 13 — Instructor Mode
*Marathon Pilates Platform | Created: 2026-03-10*

---

## Overview

Instructors use the same mobile app as clients — no separate download. When an instructor logs in, the app detects their role and switches to instructor mode automatically. Instructors who also take classes (which is common) can toggle between instructor mode and client mode at any time.

This keeps the footprint small: one app, one login, one codebase.

---

## Role Detection

Every user has a `role` field set in the backend:

```
client
instructor
front_desk
manager
owner
```

When the app loads, the JWT token includes the user's role. Expo Router's layout system renders the appropriate tab navigator based on that role. An instructor never sees the full admin dashboard — only what's relevant to their work.

A user can have **multiple roles** (e.g., an instructor who is also a client). In that case, the app defaults to instructor mode on login and provides a toggle to switch.

---

## Instructor Navigation

```
Tab bar (instructor mode):
┌──────────┬──────────┬──────────┬──────────┐
│  Today   │ Schedule │ Privates │  Account │
│ (roster) │(teaching)│(requests)│  & Pay   │
└──────────┴──────────┴──────────┴──────────┘
```

Mode toggle (top of screen, instructors with dual role only):

```
┌─────────────────────────────────┐
│  [Teaching Mode] · Client Mode  │  ← tap to switch
└─────────────────────────────────┘
```

---

## Today Tab

The first thing an instructor sees when they open the app.

```
┌─────────────────────────────────┐
│  Today  ·  Tue Mar 10           │
│  ◎ Charlotte Park               │
├─────────────────────────────────┤
│                                 │
│  7:00am — Reformer Flow         │
│  12 enrolled · 3 on waitlist    │
│  Starts in 45 min               │
│  [View Roster]                  │
│                                 │
│  10:00am — Reformer Fund.       │
│  8 enrolled · 0 on waitlist     │
│  [View Roster]                  │
│                                 │
│  No more classes today ✓        │
│                                 │
└─────────────────────────────────┘
```

### Class Roster Screen

Tapping a class opens the full roster for that session:

```
┌─────────────────────────────────┐
│ ← Today     Reformer Flow       │
│  7:00am · Charlotte Park        │
│  12 enrolled · 3 on waitlist    │
├─────────────────────────────────┤
│  [Check In All]  [Mark No-Show] │
├─────────────────────────────────┤
│                                 │
│  ○  Sarah Kim                   │
│     🏃 marathon · hip focus      │  ← intake tags
│     42 classes · Regular        │
│                                 │
│  ○  James Morales               │
│     🆕 FIRST TIME               │  ← first-timer flag
│     New client · Beginner       │
│                                 │
│  ○  Dana Reeves                 │
│     🏅 Next class = #50!         │  ← milestone alert
│     49 classes · Regular        │
│                                 │
│  ○  Priya Lopez                 │
│     🤰 prenatal · low impact    │
│     8 classes · Regular         │
│                                 │
│  ○  Tom Walsh                   │
│     💼 desk work · back focus   │
│     15 classes · Regular        │
│                                 │
│  [+ more clients]               │
│                                 │
├─────────────────────────────────┤
│  WAITLIST (3)                   │
│  1. Chris B.                    │
│  2. Mia K.                      │
│  3. Ben L.                      │
└─────────────────────────────────┘
```

### Client Tags Shown to Instructor

Instructors see a curated subset of intake tags — enough to teach well, not overwhelming:

| Tag type | Example shown | Purpose |
|---|---|---|
| Athletic goal | 🏃 marathon training | Suggest relevant cues |
| Body focus | hip focus · back focus | Adjust exercises or offer modifications |
| Life stage | 🤰 prenatal · postpartum | Safety modifications |
| Experience | Beginner · Intermediate | Pacing and cueing level |
| Special note | ⚠️ right knee (no deep flexion) | Avoid injury |
| Milestone | 🏅 Next class = #50! | Celebrate in class |
| First timer | 🆕 FIRST TIME | Extra welcome, extra attention |

Tags are set by the client during intake and updated over time. Instructors **cannot edit tags** — that's admin-only.

### Check-In Flow

Instructor marks attendance directly from the roster:

```
Tap client name → options:
  ✓  Check in
  ✗  No-show
  ↩  Late cancel (if within window)
```

Or: **[Check In All]** marks everyone present — instructor can then individually mark no-shows.

Check-in updates in real-time. Admin dashboard reflects the same data immediately.

Walk-ins (clients who show up without booking):

```
[+ Add Walk-In]
  Search by name or email
  Confirm they have credits / membership
  [Check In]
```

If the client doesn't have a credit or valid membership, the instructor sees a warning — front desk resolves payment.

---

## Schedule Tab (Teaching Schedule)

Shows the instructor's upcoming teaching assignments, not the general class schedule.

```
┌─────────────────────────────────┐
│  My Schedule                    │
├─────────────────────────────────┤
│  ← This Week  Mar 10–16  →      │
├─────────────────────────────────┤
│  MON Mar 10                     │
│  7:00am   Reformer Flow         │
│           Charlotte Park        │
│           12 enrolled           │
│                                 │
│  10:00am  Reformer Fund.        │
│           Charlotte Park        │
│           8 enrolled            │
│                                 │
│  TUE Mar 11                     │
│  9:00am   Mat Pilates           │
│           Green Hills           │
│           6 enrolled            │
│                                 │
│  WED–SUN  No classes scheduled  │
│                                 │
│  [View Next Week →]             │
└─────────────────────────────────┘
```

Instructor can see fill rate for each upcoming class — useful to know if a class is likely to run.

Instructors **cannot edit the schedule** — that's admin. If they need a change (sub, cancellation), they contact Ruby or Susan directly (for now; could be a swap request feature in Phase 2).

---

## Privates Tab (Private Session Requests)

All incoming private session requests land here for review and confirmation.

```
┌─────────────────────────────────┐
│  Private Sessions               │
├─────────────────────────────────┤
│  PENDING (2)                    │
│                                 │
│  Sarah Kim                      │
│  Solo · any morning             │
│  Requested: Mar 12–15           │
│  Note: "Hip flexor work,        │
│  training for marathon"         │
│  [Confirm]  [Decline]           │
│                                 │
│  James Morales + guest          │
│  Duet · preferred: Wed 6pm      │
│  Requested: Mar 13              │
│  Note: "First-time duet"        │
│  [Confirm]  [Decline]           │
│                                 │
├─────────────────────────────────┤
│  UPCOMING (3)                   │
│                                 │
│  Priya Lopez — Solo             │
│  Wed Mar 12 · 10:00am           │
│  Charlotte Park                 │
│  [View Details]                 │
│                                 │
│  [more...]                      │
│                                 │
├─────────────────────────────────┤
│  PAST                           │
│  [View history →]               │
└─────────────────────────────────┘
```

### Confirm Flow

Tapping [Confirm] opens a slot picker:

```
  Confirm: Sarah Kim — Solo
  Hip flexor work / marathon training

  Select time:
  ○ Mon Mar 11 · 9:00am
  ○ Tue Mar 12 · 9:00am
  ○ Wed Mar 13 · 10:00am
  ○ Other: [date/time picker]

  Location:
  ● Charlotte Park  ○ Green Hills

  [Confirm Session]
```

Client is notified immediately by email + push. Session appears on both calendars.

### Decline Flow

```
  Decline request?

  Reason (shown to client):
  ○ Scheduling conflict
  ○ Not available those dates
  ○ Other: [text field]

  [Send Decline]
```

Client is notified with the reason. They can submit a new request with different dates.

---

## Account & Pay Tab

### Pay Summary

```
┌─────────────────────────────────┐
│  Anissa Mitchell                │
│  Instructor · Charlotte Park    │
├─────────────────────────────────┤
│  CURRENT PAY PERIOD             │
│  Mar 1 – Mar 15                 │
│                                 │
│  Group classes taught:   8      │
│  Total students:         74     │
│  Per-head bonuses:       3      │
│                                 │
│  Private sessions:       4      │
│  Solo (3) · Duet (1)            │
│                                 │
│  Estimated earnings:  $___.__   │
│  (Final on Mar 16)              │
│                                 │
├─────────────────────────────────┤
│  PREVIOUS PAY STUBS             │
│                                 │
│  Feb 16 – Feb 28    $___.__  →  │
│  Feb 1  – Feb 15    $___.__  →  │
│  Jan 16 – Jan 31    $___.__  →  │
│  [View all →]                   │
│                                 │
└─────────────────────────────────┘
```

Exact dollar amounts visible once Ruby finalizes the pay model. The structure (base rate + per-head bonus + private rate) is defined in Spec 06.

### Pay Stub Detail

```
  Pay Stub: Mar 1 – Mar 15

  GROUP CLASSES
  ─────────────────────────────
  Mar 1   Reformer Flow  · 10 students
          Base: $___  Bonus: $___
  Mar 3   Reformer Fund · 8 students
          Base: $___  Bonus: $___
  ...

  PRIVATE SESSIONS
  ─────────────────────────────
  Mar 5   Sarah K.  Solo    $___.__
  Mar 8   Priya L.  Solo    $___.__
  Mar 12  James M.  Duet    $___.__

  ─────────────────────────────
  TOTAL                   $___.__
  Paid via Gusto: Mar 16
```

Instructors see a clean breakdown — class by class, student counts, and private session earnings. No other instructor's data is visible.

### Profile & Settings

```
  My Profile

  Name:          Anissa Mitchell
  Email:         anissa@marathonpilates.com
  Bio:           [Instructor bio — editable]
  Photo:         [Profile photo — editable]
  Certifications:[Displayed on class detail pages]

  Notifications  →
  Help           →
  Log Out
```

Instructors can update their own bio and photo — these appear on the public class detail screen clients see when booking.

---

## Instructor Push Notifications

Instructors receive a separate set of push notifications relevant to their work:

| Trigger | Channel | Timing |
|---|---|---|
| New private session request | Push + Email | Immediately |
| Private session cancelled by client | Push + Email | Immediately |
| Client milestone alert | In-app (roster) | At class time |
| First-time client in upcoming class | In-app (roster) | Day of class |
| Pay stub ready | Email | On pay period close |
| Class fill rate low (< 50%, 24hr out) | Push | 24hr before |

Milestone and first-timer alerts are surfaced **in the roster**, not as disruptive push notifications — the instructor sees them when they open the class before it starts.

---

## Client Mode Toggle

Instructors who are also clients can switch modes at any time:

```
Top of screen (instructor mode):
  ┌───────────────────────────────┐
  │  ● Teaching Mode  Client Mode │
  └───────────────────────────────┘

Tap "Client Mode" →
  Full client app loads:
  Home · Schedule · On-Demand · Journey · Account
  (same tabs as any client)

Tap "Teaching Mode" →
  Instructor mode restores
```

In client mode, the instructor can:
- Book classes (they pay like any client, or have a staff membership)
- Track their own journey and milestones
- Watch on-demand content
- Manage their own membership and payment

Their client data and instructor data are entirely separate — Journey tab shows their **client** class attendance, not the classes they taught.

---

## What Instructors Cannot Do

Instructor mode is purposefully limited. The following require manager or owner access:

- View or edit other instructors' schedules or pay
- Edit class templates or create new class types
- Access studio-wide revenue or financial reports
- Manage client memberships (beyond what's needed for check-in)
- Modify any client's intake profile or tags
- Issue refunds or credits
- Change any studio settings

If an instructor needs something outside their permissions, they contact Ruby or Susan directly.

---

## Data Model — Role Assignment

```
User
  id
  email
  name
  role                — enum: client | instructor | front_desk | manager | owner
  roles[]             — array for multi-role users (e.g., instructor + client)
  primary_role        — which mode to default to on login
  location_id[]       — which locations this instructor teaches at
  created_at
  updated_at

InstructorProfile
  user_id
  bio
  photo_url
  certifications[]
  is_active
  created_at
  updated_at
```

Multi-role users have `roles: ["instructor", "client"]` and `primary_role: "instructor"`. The toggle switches the active role in local state — no re-authentication needed.

---

## Phase 1 vs. Phase 2

### Phase 1 (Launch)

- Today tab with roster and check-in
- Client tags visible in roster
- Private session request management (confirm / decline)
- Teaching schedule view
- Pay stub view (read-only)
- Client mode toggle (for dual-role users)
- Instructor push notifications

### Phase 2 (Post-Launch)

- **Sub request flow** — instructor can request a sub for a class; manager approves
- **Class notes** — instructor can add post-class notes (attendance quality, modifications used)
- **Client communication** — message a client directly from roster (e.g., follow-up after first class)
- **Availability management** — instructor sets their available windows; scheduling adapts

---

## Open Questions / Decisions Needed

- [ ] **Staff membership:** Do instructors get a complimentary membership for their own class attendance? If so, which tier? This affects how the client mode toggle handles their billing.
- [ ] **Photo/bio editing:** Should instructor bio and photo updates go live immediately, or require admin approval first?
- [ ] **Sirkka and other instructors:** How many instructors are there across both locations? (Affects roster scale assumptions)
- [x] **Front desk role:** Front desk works from the web-based admin dashboard only — no mobile mode at launch. ✅ Confirmed. The `front_desk` role is already in the data model, so a front desk app mode can be added later without architectural changes if Ruby decides to expand it.

---

*Next: `14-launch-plan.md` — phased rollout, beta testing, and go-live checklist*
