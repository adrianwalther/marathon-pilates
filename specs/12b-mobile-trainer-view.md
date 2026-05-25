# Spec 12b — Mobile App: Trainer View
*Marathon Pilates Platform | Created: 2026-05-07*

---

## Overview

The trainer view is the instructor experience within the Marathon Pilates mobile app. It is not a separate app — instructors log in with their existing credentials, and the app detects the `instructor` role and renders the instructor tab navigator automatically.

Instructors who are also clients (common at Marathon Pilates) see a mode toggle at the top of the screen and can switch to full client mode at any time without re-authenticating. Spec 13 covers role detection and the client-mode toggle in detail.

**Design principle:** The trainer view is built for use five minutes before class starts. It should be fast, glanceable, and zero-friction. No learning curve.

---

## Navigation

```
Tab bar (trainer mode):
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  Today   │ Schedule │ Privates │   Pay    │ Account  │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

Mode toggle (top of screen — instructors with dual role only):

```
┌─────────────────────────────────┐
│  ● Teaching Mode  · Client Mode │  ← tap to switch
└─────────────────────────────────┘
```

---

## Today Tab

The Today tab is what an instructor sees the moment they open the app. It answers: "What do I have today, and who is coming?"

```
┌─────────────────────────────────┐
│  Today · Mon May 25             │
│  ◎ Charlotte Park               │
├─────────────────────────────────┤
│                                 │
│  NEXT UP                        │
│  ┌───────────────────────────┐  │
│  │  7:00am — Reformer Flow   │  │
│  │  Starts in 22 min         │  │
│  │  10 enrolled · 2 waitlist │  │
│  │  [View Roster →]          │  │
│  └───────────────────────────┘  │
│                                 │
│  LATER TODAY                    │
│                                 │
│  10:00am — Reformer Fund.       │
│  8 enrolled · 0 waitlist        │
│  [View Roster]                  │
│                                 │
│  2:00pm — Mat Pilates           │
│  Green Hills                    │
│  5 enrolled · 1 waitlist        │
│  [View Roster]                  │
│                                 │
│  ─────────────────────          │
│  No more classes today ✓        │
│                                 │
└─────────────────────────────────┘
```

### Rules

- "Next Up" card highlights the chronologically next class. If a class is within 30 minutes, the countdown shows minutes remaining. Otherwise it shows the time.
- Classes at different locations are labeled inline (Green Hills shown above). Charlotte Park is the default and unlabeled.
- If the instructor has no classes today, the screen shows: "No classes today. Enjoy your day off."

---

## Class Roster Screen

Tapping any class in Today or My Schedule opens the full class roster.

```
┌─────────────────────────────────┐
│ ← Back          Reformer Flow   │
│  Mon May 25 · 7:00am            │
│  Charlotte Park                 │
│  10 enrolled · 2 on waitlist    │
├─────────────────────────────────┤
│  [Check In All]   [Add Walk-In] │
├─────────────────────────────────┤
│                                 │
│  ○  Sarah Kim                   │
│     🏃 marathon · hip focus      │
│     42 classes · Regular        │
│                                 │
│  ○  James Morales               │
│     🆕 FIRST TIME               │
│     0 classes · New client      │
│                                 │
│  ○  Dana Reeves                 │
│     🏅 Next class = #50!         │
│     49 classes · Regular        │
│                                 │
│  ○  Priya Lopez                 │
│     🤰 prenatal · low impact    │
│     8 classes · Regular         │
│                                 │
│  ○  Tom Walsh                   │
│     💼 desk work · back focus   │
│     ⚠️ right knee (no deep flex) │
│     15 classes · Regular        │
│                                 │
│  ○  [6 more clients]            │
│                                 │
├─────────────────────────────────┤
│  WAITLIST (2)                   │
│  1. Chris Barton                │
│  2. Mia Kwan                    │
└─────────────────────────────────┘
```

### Client Tags

Tags come from the client's intake questionnaire and are curated for instructor relevance. The instructor cannot edit them.

| Tag type | Display | Purpose |
|---|---|---|
| Athletic goal | 🏃 marathon training | Suggest relevant cues |
| Body focus | hip focus · back focus | Adjust exercises |
| Life stage | 🤰 prenatal · postpartum | Safety modifications |
| Experience | Beginner · Intermediate | Pacing |
| Injury/flag | ⚠️ right knee (no deep flex) | Contraindications |
| Milestone | 🏅 Next class = #50! | Celebrate in class |
| First timer | 🆕 FIRST TIME | Extra welcome |

Tags are derived from `profiles.intake_responses` — read-only from the trainer's perspective.

### Check-In Actions

Tap any client name to reveal inline action buttons:

```
  ○  Sarah Kim
     🏃 marathon · hip focus
     42 classes · Regular
     ────────────────────────
     [✓ Check In]   [✗ No-Show]   [↩ Late Cancel]
```

Or use **[Check In All]** to mark everyone present, then tap individual names to mark no-shows.

All check-in changes sync to Supabase in real time. The admin dashboard reflects the same roster state immediately.

### Walk-In Flow

```
[Add Walk-In]
  ↓
Search: [Name or email...]
  ↓
Result: James Morales — Unlimited member · 3 credits remaining
  ↓
  [Check In — use 1 credit]
  — or —
  ⚠️ No credits available — Flag for front desk
```

If the client has no valid credit or membership, the instructor sees a soft warning. The instructor can still flag the client as present — payment is resolved by front desk or admin after class. The instructor is not responsible for collecting payment.

---

## Client Profile (Read-Only)

Tapping a client's name on the roster opens their condensed profile. This is a read-only view — instructors can see what they need to teach well but cannot modify any client data.

```
┌─────────────────────────────────┐
│ ← Back            Sarah Kim     │
├─────────────────────────────────┤
│                                 │
│  Sarah Kim                      │
│  Member since Jan 2026          │
│  Reformer Unlimited             │
│                                 │
│  INTAKE FLAGS                   │
│  Goal:        Marathon training │
│  Focus:       Hip flexors       │
│  Level:       Intermediate      │
│  Life stage:  None flagged      │
│  Notes:       "Also doing long  │
│               runs 4× per week" │
│                                 │
│  HEALTH FLAGS                   │
│  None flagged ✓                 │
│                                 │
│  PROGRESS                       │
│  Total classes:    42           │
│  This month:       6            │
│  Current streak:   7 days       │
│  Milestones:       25 classes   │
│                                 │
│  RECENT CLASSES                 │
│  May 24  Reformer Flow           │
│  May 22  Mat Pilates             │
│  May 20  Reformer Flow           │
│  May 19  Sauna · 45 min          │
│  May 17  Reformer Fund.          │
│                                 │
│  PRIVATE SESSIONS               │
│  Last: May 10 · Solo · hip work │
│  Total: 3 private sessions      │
│                                 │
└─────────────────────────────────┘
```

### What Instructors See vs. Don't See

| Data | Trainer sees | Trainer does not see |
|---|---|---|
| Name, class count, milestone progress | Yes | — |
| Intake tags and health flags | Yes | Full intake text responses |
| Recent class history | Yes (class names, dates) | Payment or credit info |
| Private session history | Yes (dates, type, high-level note) | Detailed notes from other instructors |
| Membership type | Yes (tier name only) | Billing dates, amounts, card info |
| Contact info | No | Email, phone — admin only |

---

## My Schedule Tab

The instructor's upcoming teaching schedule — their classes only, not the full studio schedule.

```
┌─────────────────────────────────┐
│  My Schedule                    │
├─────────────────────────────────┤
│  ← This Week  May 25–31  →      │
├─────────────────────────────────┤
│                                 │
│  MON May 25                     │
│  7:00am   Reformer Flow         │
│           Charlotte Park        │
│           10 enrolled           │
│                                 │
│  10:00am  Reformer Fund.        │
│           Charlotte Park        │
│           8 enrolled            │
│                                 │
│  2:00pm   Mat Pilates           │
│           Green Hills           │
│           5 enrolled            │
│                                 │
│  TUE May 26                     │
│  9:00am   Reformer Flow         │
│           Green Hills           │
│           6 enrolled            │
│                                 │
│  WED–SUN  No classes scheduled  │
│                                 │
│  [View Next Week →]             │
│                                 │
└─────────────────────────────────┘
```

### Notes on My Schedule

- Instructors see their own classes only. Other instructors' classes are not visible.
- Fill counts are shown as enrolled headcount — not as a percentage or capacity bar — because instructors need to know the number, not a ratio.
- Instructors cannot edit the schedule. If they need a change (sub, cancellation), they contact Ruby or Susan directly. Sub request flow is a Phase 2 feature.
- Tapping any class row opens the Class Roster screen for that session.

---

## Privates Tab

Incoming and upcoming private session requests. This tab is the instructor's inbox for private work.

```
┌─────────────────────────────────┐
│  Private Sessions               │
├─────────────────────────────────┤
│  PENDING (2)                    │
│                                 │
│  Sarah Kim                      │
│  Solo · any morning             │
│  Requested: May 27–30           │
│  "Hip flexor work — marathon    │
│  training focus"                │
│  [Confirm]  [Decline]           │
│                                 │
│  James Morales + guest          │
│  Duet · preferred Wed 6pm       │
│  Requested: May 28              │
│  "First-time duet session"      │
│  [Confirm]  [Decline]           │
│                                 │
├─────────────────────────────────┤
│  UPCOMING (3)                   │
│                                 │
│  Priya Lopez — Solo             │
│  Wed May 28 · 10:00am           │
│  Charlotte Park                 │
│  "Prenatal — second trimester"  │
│  [View Details]                 │
│                                 │
│  Dana Reeves — Solo             │
│  Thu May 29 · 11:00am           │
│  Green Hills                    │
│  [View Details]                 │
│                                 │
│  [1 more...]                    │
│                                 │
├─────────────────────────────────┤
│  PAST                           │
│  [View history →]               │
└─────────────────────────────────┘
```

### Confirm Flow

```
Confirm: Sarah Kim — Solo
"Hip flexor work — marathon training focus"

  Select time:
  ○ Tue May 27 · 9:00am
  ○ Wed May 28 · 9:00am
  ○ Thu May 29 · 10:00am
  ○ Other: [Date + time picker]

  Location:
  ● Charlotte Park  ○ Green Hills

  [Confirm Session]
```

Client receives email + push confirmation immediately. Session appears on both the client's schedule and the instructor's My Schedule tab.

### Decline Flow

```
Decline request?

  Reason (shown to client):
  ○ Scheduling conflict
  ○ Not available those dates
  ○ Please reach out to the studio
  ○ Other: [Text field...]

  [Send Decline]
```

Client is notified with the reason and can submit a new request.

---

## My Pay Tab

The instructor's own pay records for the current and past pay periods. No other instructor's data is accessible from this view.

```
┌─────────────────────────────────┐
│  My Pay                         │
├─────────────────────────────────┤
│  CURRENT PAY PERIOD             │
│  May 1 – May 15                 │
│                                 │
│  Group classes:        6        │
│  Total students:       52       │
│  Private sessions:     3        │
│    Solo (2) · Duet (1)          │
│                                 │
│  Estimated earnings: $___.__    │
│  Finalizes May 16               │
│                                 │
├─────────────────────────────────┤
│  PREVIOUS PAY STUBS             │
│                                 │
│  Apr 16 – Apr 30   $___.__  →   │
│  Apr 1  – Apr 15   $___.__  →   │
│  Mar 16 – Mar 31   $___.__  →   │
│  [View all →]                   │
│                                 │
└─────────────────────────────────┘
```

### Pay Stub Detail

Tapping any pay stub opens the full line-item breakdown:

```
┌─────────────────────────────────┐
│ ← Back      Pay: May 1–15       │
├─────────────────────────────────┤
│                                 │
│  GROUP CLASSES                  │
│  ─────────────────────          │
│  May 1   Reformer Flow          │
│          10 students            │
│          $58 (full class)       │
│                                 │
│  May 3   Reformer Fund.         │
│          8 students             │
│          $58 (full class)       │
│                                 │
│  May 5   Mat Pilates            │
│          4 students             │
│          $30 (0–4 tier)         │
│                                 │
│  May 8   Reformer Flow          │
│          6 students             │
│          $48 (5–7 tier)         │
│                                 │
│  Group total:       $194.00     │
│                                 │
│  PRIVATE SESSIONS               │
│  ─────────────────────          │
│  May 6   Sarah K. — Solo        │
│          $55 (1+ yr rate)       │
│                                 │
│  May 10  Priya L. — Solo        │
│          $55 (1+ yr rate)       │
│                                 │
│  May 14  James M. — Duet        │
│          2 clients × $40 = $80  │
│                                 │
│  Private total:     $190.00     │
│                                 │
│  ─────────────────────          │
│  GROSS THIS PERIOD  $384.00     │
│  Paid via Gusto: May 16         │
│                                 │
└─────────────────────────────────┘
```

Pay is displayed as calculated by the platform — the same figures that flow into the Gusto export. If a discrepancy is noticed, the instructor contacts Ruby or Susan.

### What Instructors See vs. Don't See in Pay

| Data | Instructor sees | Does not see |
|---|---|---|
| Their own class-by-class pay breakdown | Yes | — |
| Their own private session pay | Yes | — |
| Their own tier rate applied | Yes (rate shown per class) | Other instructors' rates |
| Studio revenue or payroll totals | No | — |
| Other instructors' pay | No | — |

---

## Account Tab

Profile settings, notification preferences, and app configuration.

```
┌─────────────────────────────────┐
│  Anissa Mitchell                │
│  Instructor · Charlotte Park    │
│  [Edit Profile]                 │
├─────────────────────────────────┤
│  MY PROFILE                     │
│  Bio                    →       │
│  Photo                  →       │
│  Certifications         →       │
├─────────────────────────────────┤
│  SETTINGS                       │
│  Notifications          →       │
│  Help & Support         →       │
│  Log Out                        │
└─────────────────────────────────┘
```

### Bio and Photo

Instructors can edit their own bio and profile photo directly from the app. These appear on the client-facing class detail screen (the "Instructor" card clients see when browsing classes).

Bio changes and photo updates go live immediately — no admin approval required. Admin can override via the admin panel if needed.

### Notification Preferences

```
  Notifications

  PRIVATE SESSIONS
  ✅  New request                Push + Email
  ✅  Cancellation               Push + Email
  ✅  Confirmed (by client)      Push + Email

  MY CLASSES
  ✅  New booking in my class    Push
  ✅  Cancellation in my class   Push
  ✅  Class fill < 50% (24hr)    Push
  ✅  Waitlist movement          Push

  ROSTER ALERTS (in-app only — no push)
  ✅  First-timer flag            In roster
  ✅  Milestone alert             In roster

  PAY
  ✅  Pay stub ready              Email
```

Roster alerts are surfaced in the class roster screen at class time — not as disruptive push notifications. This keeps the instructor's notification feed clean.

---

## Push Notifications — Trainer-Specific

| Trigger | Channel | Timing |
|---|---|---|
| New private session request | Push + Email | Immediately |
| Private session cancelled by client | Push + Email | Immediately |
| Private session confirmed | Push | Immediately |
| New booking in instructor's class | Push | Immediately |
| Cancellation in instructor's class | Push | Immediately |
| Class fill below 50% (24hr before) | Push | 24hr before class |
| Pay stub ready | Email | On pay period close |

First-timer flags and milestone alerts are shown in the roster view at class time — not as push notifications.

**Deep-link targets:**

| Notification | Opens |
|---|---|
| New private request | Privates tab → pending request |
| Cancellation in my class | Roster for that class |
| Fill rate alert | Roster for that class |
| Pay stub ready | My Pay → current stub |

---

## App State Details

### Location Context

- Charlotte Park is the default location on Today and My Schedule.
- If an instructor teaches at both locations, they see all their classes in both tabs sorted chronologically with location labeled inline.
- There is no location filter toggle — instructors see all of their classes regardless of location.

### Offline Behavior

| Feature | Offline behavior |
|---|---|
| Today tab | Shows cached roster; check-ins queue locally and sync when online |
| My Schedule | Shows cached schedule with "last updated" timestamp |
| Client profile | Reads from local cache |
| Privates tab | Reads from cache; confirm/decline requires connection |
| My Pay | Reads from cache |

Check-in is the most time-critical action. Cached check-ins sync automatically on reconnect and are timestamped with the original action time.

---

## Phase 1 vs. Phase 2

### Phase 1 (Launch)
- Today tab with roster, client tags, check-in
- Class Roster with walk-in support
- Client Profile (read-only)
- My Schedule (weekly view)
- Privates tab (pending + upcoming)
- My Pay tab (current period + pay history)
- Account tab with bio/photo editing
- Instructor push notifications
- Client mode toggle (dual-role users)

### Phase 2 (Post-Launch)
- **Sub request flow** — instructor requests a sub; manager approves in admin dashboard
- **Post-class notes** — brief field for instructor to log modifications used, notable moments
- **Availability management** — instructor sets available windows; admin uses this when scheduling privates
- **Direct client message** — send a follow-up note to a client from the roster (e.g., after their first class)

---

## Open Questions / Decisions Needed

- [ ] **Staff complimentary classes:** When an instructor books a class as a client (low-attendance freebie), does that class appear in their client Journey stats? Or is it excluded since it's a staff booking? (Affects dual-mode users only)
- [ ] **Photo moderation:** Bio and photo updates go live immediately by default — confirm Ruby is comfortable with this or if she wants an admin-review step
- [ ] **Pay visibility during current period:** Should estimated pay during an open period show a running dollar total, or just session counts? (Showing a number before the period closes could cause confusion if admin adjusts anything)
- [ ] **Private session notes:** How much detail should the instructor see from previous private sessions with a client? Only their own notes, or a shared log across all instructors who've worked with that client?
- [ ] **Instructor count across both locations:** Final roster of instructors needed to validate scale assumptions for roster screen

---

*Related specs: 06-payroll.md · 12-mobile-app.md · 13-instructor-mode.md · 12c-mobile-admin-view.md*
