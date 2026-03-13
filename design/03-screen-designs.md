# Screen Designs — Marathon Pilates Platform

> Annotated layout descriptions for key screens across web and mobile.
> Pull from `01-design-system.md` for tokens. Pull from `02-app-references.md` for patterns.
> These are design briefs — specific enough to hand to a designer or developer.

---

## Screen Index

| # | Screen | Platform | Phase |
|---|--------|----------|-------|
| 01 | Login / Sign Up | Web + Mobile | 1 |
| 02 | Mobile Home (Dashboard) | Mobile | 1 |
| 03 | Schedule | Web + Mobile | 1 |
| 04 | Class Detail + Booking Flow | Web + Mobile | 1 |
| 05 | Booking Confirmation + Invite Friend | Mobile | 1 |
| 06 | Private Session Booking | Web + Mobile | 1 |
| 07 | Client Profile + Progress | Mobile | 1 |
| 08 | Membership & Credits | Web + Mobile | 1 |
| 09 | On-Demand Library | Web + Mobile | 2 |
| 10 | Video Player | Mobile + Web | 2 |

---

## 01 — Login / Sign Up

**Platform:** Web + Mobile
**Reference:** Pvolve split login
**Phase:** 1

### Web Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌───────────────────────┐  ┌──────────────────────────────┐   │
│  │                       │  │                              │   │
│  │  [MP logo]            │  │  [studio photo — full bleed] │   │
│  │                       │  │                              │   │
│  │  Welcome back.        │  │  Move. Restore. Repeat.      │   │
│  │                       │  │                              │   │
│  │  Email ____________   │  │  ✓ Book group + private      │   │
│  │  Password __________  │  │  ✓ Track your progress       │   │
│  │                       │  │  ✓ Sauna & cold plunge       │   │
│  │  [  LOG IN  ]         │  │  ✓ On-demand classes         │   │
│  │                       │  │                              │   │
│  │  Forgot password?     │  │  ★★★★★  Nashville's          │   │
│  │                       │  │  favorite Pilates studio     │   │
│  │  ─── or ───           │  │                              │   │
│  │  [Continue with Apple]│  │                              │   │
│  │  [Continue with Google│  │                              │   │
│  │                       │  │                              │   │
│  │  No account? Sign up  │  │                              │   │
│  │                       │  │                              │   │
│  └───────────────────────┘  └──────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Tokens:**
- Background: `surface-offwhite` (#F7F5F2) on form side, full-bleed photo on right
- Logo: Deep Earth `#302D27`
- "Welcome back." — Poppins Thin, ALL CAPS, text-primary
- Input fields: 1px border `#DDD1BD`, 8px radius, Poppins Regular body
- "LOG IN" button: Deep Earth `#302D27` fill, white text, Poppins Regular ALL CAPS, rectangular (4px radius)
- "Continue with Apple/Google" — outlined, same shape as primary, smaller
- Right panel text — white on photo overlay, Raleway Regular subheadings

---

### Mobile Layout (Sign Up flow)

```
┌─────────────────────┐
│  [MP logo centered] │
│                     │
│  Create your        │
│  account.           │
│                     │
│  First name  ______ │
│  Last name   ______ │
│  Email       ______ │
│  Phone       ______ │
│  Password    ______ │
│                     │
│  Preferred location:│
│  ○ Charlotte Park   │
│  ○ Green Hills      │
│                     │
│  [  CREATE ACCOUNT ]│
│                     │
│  ─── or ───         │
│  [  Apple  ]        │
│  [  Google ]        │
│                     │
│  Already a member?  │
│  Log in             │
└─────────────────────┘
```

**Notes:**
- Location preference captured at sign-up — drives default schedule view
- Phone required for SMS notifications + booking reminders
- Clerk handles auth; this is the face on top of it

---

## 02 — Mobile Home (Dashboard)

**Platform:** Mobile only
**Reference:** JM section layout + Pvolve aesthetic
**Phase:** 1

```
┌─────────────────────────────┐
│  Good morning, Sarah  👋    │  ← personalized greeting
│  Charlotte Park             │  ← active location (tappable)
│                             │
│ ┌─────────────────────────┐ │
│ │  YOUR NEXT CLASS        │ │  ← upcoming booking card
│ │  Tomorrow · 9:00 AM     │ │
│ │  Group Reformer         │ │
│ │  with Ruby Ramdhan      │ │
│ │  Charlotte Park         │ │
│ │  [View Details]         │ │
│ └─────────────────────────┘ │
│                             │
│  Quick Book                 │  ← section header (Raleway ALL CAPS)
│  ┌──────┐┌──────┐┌──────┐  │
│  │[img] ││[img] ││[img] │  │  ← service category tiles (JM pattern)
│  │GROUP ││PRIVAT││SAUNA │  │
│  │REFOR.││E     ││      │  │
│  └──────┘└──────┘└──────┘  │
│                             │
│  This Week at MP            │  ← social proof (NYP pattern, subtle)
│  "14 members booked         │
│   classes this week"        │
│                             │
│  Your Progress              │  ← milestone / streak
│  🔥 7-day streak            │
│  ████████░░  18 / 25 classes│  ← progress toward milestone
│  toward your Bronze badge   │
│  [View Progress]            │
│                             │
│  On Demand — New This Week  │  ← Phase 2, still shown Phase 1 as teaser
│  ┌───────────┐┌───────────┐ │
│  │[thumbnail]││[thumbnail]│ │
│  │ 30 MIN    ││ 20 MIN    │ │
│  └───────────┘└───────────┘ │
│                             │
└─────────────────────────────┘

Bottom tab bar:
[ 🏠 Home ] [ 📅 Book ] [ 📺 On-Demand ] [ 👤 Profile ]
              active
```

**Tokens:**
- Page background: `surface-offwhite`
- Section headers: Raleway Regular, ALL CAPS, `text-secondary`
- Upcoming class card: `surface-warm` background, Terracotta left border accent
- Category tiles: Deep Earth overlay, Poppins Thin ALL CAPS label
- Progress bar: Terracotta fill on `surface-warm` track
- Bottom tab bar: white bg, Deep Earth active icon, gray inactive

**Notes:**
- Location label at top is tappable — swaps to other location's content
- "Next class" card only shows if they have an upcoming booking; otherwise shows "Book your next class →"
- On-demand section shows as teaser in Phase 1, unlocks in Phase 2

---

## 03 — Schedule

**Platform:** Web + Mobile
**Reference:** Yoga Joint date-grouped cards + NYP location toggle
**Phase:** 1

### Mobile

```
┌─────────────────────────────┐
│  Schedule                   │
│                             │
│  [ Charlotte Park ● ] [ Green Hills ]   ← location toggle
│                             │
│  [ Group ] [ Private ] [ Amenities ]    ← type filter tabs
│                             │
│  ← Mon 10  Tue 11  Wed 12 → ← date strip, swipeable
│              ●                          ← today indicator
│                             │
│  Tuesday, March 11          │  ← date group header
│                             │
│  ┌─────────────────────────┐│
│  │ [reformer photo]        ││  ← class card
│  │ 6:00 AM                 ││
│  │ GROUP REFORMER          ││
│  │ Ruby Ramdhan            ││
│  │ 3 spots left  [BOOK]    ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ [reformer photo]        ││
│  │ 9:00 AM                 ││
│  │ GROUP REFORMER          ││
│  │ Kelli Ramdhan           ││
│  │ Full  [Join Waitlist]   ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ [sauna photo]           ││
│  │ 10:00 AM – 12:00 PM     ││
│  │ SAUNA AVAILABILITY      ││
│  │ 45-min slots open       ││
│  │              [BOOK]     ││
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
```

### Web Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [ Charlotte Park ●──── ]  [ Green Hills ]        This Week ▾│
│                                                              │
│  [ All ] [ Group Reformer ] [ Private ] [ Sauna ] [ Plunge ] │
│                                                              │
│  ← March 10–16, 2026 →                                      │
│  Mon 10  Tue 11  Wed 12  Thu 13  Fri 14  Sat 15  Sun 16     │
│                                                              │
│  Tuesday, March 11                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ [photo]         │  │ [photo]         │  │ [photo]     │ │
│  │ 6:00 AM         │  │ 9:00 AM         │  │ 10:30 AM    │ │
│  │ GROUP REFORMER  │  │ GROUP REFORMER  │  │ PRIVATE     │ │
│  │ Ruby Ramdhan    │  │ Kelli Ramdhan   │  │ SESSION     │ │
│  │ 2 spots left    │  │ ● FULL          │  │ Ruby Ramdhan│ │
│  │ [BOOK CLASS]    │  │ [JOIN WAITLIST] │  │ [BOOK]      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                              │
│  Wednesday, March 12                                         │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ ...             │  │ ...             │                   │
└──────────────────────────────────────────────────────────────┘
```

**Tokens:**
- Location toggle: active = Deep Earth pill fill, inactive = outlined
- Filter tabs: active = Terracotta underline, inactive = text-secondary
- Class card: `surface-white` card, Terracotta `[BOOK]` button
- "Full" state: muted gray card, `[JOIN WAITLIST]` outlined button
- "X spots left" — Terracotta text when ≤ 3 spots remaining
- Date strip: today = Terracotta dot indicator

**Notes:**
- Group and Amenity classes (Sauna/Cold Plunge) share the same schedule view
- Private sessions on schedule show as blocks (time ranges), not specific times
- "Join Waitlist" auto-notifies when a spot opens

---

## 04 — Class Detail + Booking Flow

**Platform:** Web + Mobile
**Phase:** 1

### Class Detail Sheet (mobile bottom sheet / web modal)

```
┌─────────────────────────────┐
│ ╲                           │  ← drag handle / close
│                             │
│  [full-bleed class photo]   │
│                             │
│  GROUP REFORMER             │  ← Poppins Thin ALL CAPS
│  Tuesday, March 11 · 9AM   │  ← Raleway subheading
│  Charlotte Park             │
│                             │
│  ┌────────┐ ┌────────────┐  │
│  │ Ruby   │ │45 MIN      │  │  ← instructor chip + duration chip
│  │Ramdhan │ │            │  │
│  └────────┘ └────────────┘  │
│                             │
│  CPI, CET · 5 years         │  ← instructor credentials
│                             │
│  About this class           │
│  Full-body reformer workout │
│  focusing on core stability │
│  and lengthening. All       │
│  levels welcome.            │
│                             │
│  ┌─────────────────────────┐│
│  │  👥 8 spots total       ││  ← availability
│  │  ⚡ 2 spots remaining   ││  ← Terracotta when ≤ 3
│  └─────────────────────────┘│
│                             │
│  What to bring              │
│  Grip socks (available in   │
│  studio), water bottle      │
│                             │
│  [   BOOK THIS CLASS   ]    │  ← primary CTA
│  [   Join Waitlist     ]    │  ← secondary (if full)
│                             │
└─────────────────────────────┘
```

### Booking Step — Select Credits / Payment

```
┌─────────────────────────────┐
│ ← Group Reformer · Tue 9AM  │
│                             │
│  How would you like to pay? │
│                             │
│  ┌─────────────────────────┐│
│  │ ✓ Your Credits          ││  ← if they have credits
│  │   4 classes remaining   ││
│  │   Use 1 credit          ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │   Membership            ││
│  │   Unlimited · Active    ││
│  │   Included              ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │   Buy a class pack  →   ││  ← upsell if no credits
│  └─────────────────────────┘│
│                             │
│  [   CONFIRM BOOKING   ]    │
│                             │
└─────────────────────────────┘
```

---

## 05 — Booking Confirmation + Invite Friend

**Platform:** Mobile (same flow on web, condensed)
**Reference:** Yoga Joint bring-a-friend mechanic
**Phase:** 1

```
┌─────────────────────────────┐
│                             │
│         ✓                   │  ← large check, Terracotta
│                             │
│  You're booked!             │  ← Poppins Thin, large
│                             │
│  Group Reformer             │
│  Tuesday, March 11          │
│  9:00 AM · Charlotte Park   │
│  with Ruby Ramdhan          │
│                             │
│  Add to calendar   →        │
│                             │
│  ─────────────────────────  │
│                             │
│  Bring a friend?            │  ← Yoga Joint pattern
│  Invite someone to join     │
│  you — their first class    │
│  is on us.                  │
│                             │
│  ┌─────────────────────────┐│
│  │  👤 Choose a contact    ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │  💬 Share via SMS       ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │  Share link             ││
│  └─────────────────────────┘│
│                             │
│  Skip for now               │  ← text link
│                             │
└─────────────────────────────┘
```

**Notes:**
- Invite link is pre-filled with referrer's account ID for credit tracking
- If friend books a paid class, referrer earns studio credit (amount TBD with Ruby)
- "Add to calendar" uses native calendar API
- 24h before class — nudge notification if friend hasn't confirmed

---

## 06 — Private Session Booking

**Platform:** Web + Mobile
**Reference:** Spec 04-private-session-booking.md
**Phase:** 1 (priority — fixes the email pain point)

### Step 1: Select Session Type

```
┌─────────────────────────────┐
│ ← Book                      │
│                             │
│  PRIVATE SESSIONS           │
│                             │
│  ┌─────────────────────────┐│
│  │  SOLO                   ││  ← option card
│  │  Just you + instructor  ││
│  │  60 minutes             ││
│  │  from $45               ││  ← shows rate for their tier
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  DUET                   ││
│  │  You + 1 friend         ││
│  │  60 minutes             ││
│  │  from $45/person        ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  TRIO                   ││
│  │  You + 2 friends        ││
│  │  60 minutes             ││
│  │  from $40/person        ││
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
```

### Step 2: Choose Instructor

```
┌─────────────────────────────┐
│ ← Solo Private              │
│                             │
│  Choose your instructor     │
│                             │
│  ┌─────────────────────────┐│
│  │ [photo]  Ruby Ramdhan   ││
│  │          CPI, CET       ││
│  │          Owner          ││
│  │          ★ 5.0 (48)     ││
│  │          [Select]       ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ [photo]  Kelli Ramdhan  ││
│  │          CPI            ││
│  │          ★ 4.9 (31)     ││
│  │          [Select]       ││
│  └─────────────────────────┘│
│                             │
│  ○ No preference            │
│    Match me with whoever    │
│    is available             │
│                             │
└─────────────────────────────┘
```

### Step 3: Choose Date + Time

```
┌─────────────────────────────┐
│ ← Ruby Ramdhan              │
│                             │
│  [ Charlotte Park ] [ Green Hills ]
│                             │
│  ◀  March 2026  ▶           │
│  Mo Tu We Th Fr Sa Su       │
│  10 11 12 13 14 15 16       │
│        ●     ●              │  ← available days highlighted
│  17 18 19 20 21 22 23       │
│     ●        ●  ●           │
│                             │
│  Available times — Wed 12   │
│  ┌────────┐┌────────┐       │
│  │ 10 AM  ││ 2 PM   │       │  ← available slot pills
│  └────────┘└────────┘       │
│                             │
│  ← No times on this day     │  ← shown when day has no slots
│    Try another date         │
│                             │
└─────────────────────────────┘
```

### Step 4: Confirm + Notes

```
┌─────────────────────────────┐
│ ← Wednesday, March 12       │
│                             │
│  BOOKING SUMMARY            │
│                             │
│  Solo Private Session       │
│  Wednesday, March 12        │
│  10:00 AM · 60 min          │
│  Ruby Ramdhan               │
│  Charlotte Park             │
│                             │
│  Anything to share?         │  ← intake notes
│  ┌─────────────────────────┐│
│  │ e.g. injuries, goals,   ││
│  │ areas to focus on...    ││
│  └─────────────────────────┘│
│                             │
│  Payment                    │
│  ○ Use 1 private credit     │
│  ○ Pay $45                  │
│                             │
│  [  CONFIRM BOOKING  ]      │
│                             │
└─────────────────────────────┘
```

---

## 07 — Client Profile + Progress

**Platform:** Mobile
**Reference:** Spec 02-client-journey.md (milestone system)
**Phase:** 1

```
┌─────────────────────────────┐
│  [avatar]  Sarah Johnson    │
│            Member since Jan │
│            Charlotte Park   │
│                             │
│  ─── Your Journey ──────    │
│                             │
│  🔥 Current streak: 7 days  │
│                             │
│  Classes this month: 8      │
│  Classes all time: 47       │
│                             │
│  MILESTONES                 │
│  ┌──────┐┌──────┐┌──────┐  │
│  │  🥉  ││  🥈  ││  🥇  │  │
│  │BRONZE││SILVER││ GOLD │  │
│  │ 25   ││  50  ││ 100  │  │
│  │ ✓    ││ ✓    ││ 47/  │  │
│  │      ││      ││ 100  │  │
│  └──────┘└──────┘└──────┘  │
│  ████████████░░░░  47/100   │
│                             │
│  CREDITS & MEMBERSHIP       │
│  Membership: Unlimited ✓    │
│  Class credits: 0           │
│  Studio credit: $25.00      │  ← referral credit
│                             │
│  [ Buy Class Pack ]         │
│                             │
│  UPCOMING                   │
│  → Tue Mar 11 · 9AM        │
│    Group Reformer · Ruby    │
│                             │
│  HISTORY                    │
│  ✓ Sat Mar 8 · Group Ref.  │
│  ✓ Tue Mar 5 · Private     │
│  ✓ Sat Mar 1 · Group Ref.  │
│  [ See all ]                │
│                             │
│  SETTINGS                   │
│  Notifications →            │
│  Payment methods →          │
│  Location preference →      │
│  Log out                    │
│                             │
└─────────────────────────────┘
```

**Tokens:**
- Section headers: Raleway Regular, ALL CAPS, text-secondary
- Milestone badges: circular, size 56px, Terracotta fill (earned) / `surface-warm` (locked)
- Progress bar: Terracotta fill
- Streak: Terracotta fire icon, Deep Earth number

---

## 08 — Membership & Credits

**Platform:** Web + Mobile
**Reference:** NYP location toggle + pricing cards
**Phase:** 1

```
┌─────────────────────────────┐
│  MEMBERSHIP & PRICING       │
│                             │
│  [ Charlotte Park ● ] [ Green Hills ]
│                             │
│  ┌─────────────────────────┐│
│  │  UNLIMITED MEMBERSHIP   ││  ← featured card
│  │                         ││
│  │  $XXX / month           ││
│  │  Auto-renews monthly    ││
│  │                         ││
│  │  ✓ Unlimited group      ││
│  │    reformer classes     ││
│  │  ✓ Early booking access ││
│  │  ✓ 10% off privates     ││
│  │                         ││
│  │  [  GET MEMBERSHIP  ]   ││
│  └─────────────────────────┘│
│                             │
│  Class Packs                │
│                             │
│  ┌──────────┐┌──────────┐  │
│  │ 5 CLASSES││10 CLASSES│  │
│  │          ││          │  │
│  │  $XXX    ││  $XXX    │  │
│  │          ││ Best     │  │  ← "Best Value" tag
│  │ [BUY]    ││ [BUY]    │  │
│  └──────────┘└──────────┘  │
│                             │
│  Private Session Credits    │
│                             │
│  ┌──────────┐┌──────────┐  │
│  │ 1 PRIVATE││ 5 PRIVATE│  │
│  │ SESSION  ││ SESSIONS │  │
│  │  $XX     ││  $XXX    │  │
│  │ [BUY]    ││ [BUY]    │  │
│  └──────────┘└──────────┘  │
│                             │
│  HSA/FSA accepted ✓         │
│  Gift cards available →     │
│                             │
└─────────────────────────────┘
```

**Notes:**
- Prices intentionally left as `$XXX` — not redesigning Ruby's pricing (per project rules)
- Location toggle matters here if pricing differs by location
- HSA/FSA badge is important trust signal — show prominently

---

## 09 — On-Demand Library

**Platform:** Web + Mobile
**Reference:** Pvolve class grid
**Phase:** 2

### Mobile

```
┌─────────────────────────────┐
│  ON DEMAND                  │
│                             │
│  [ All ] [ Reformer ] [ Recovery ] [ Short ]
│                             │
│  Continue Watching          │  ← section header
│  ┌─────────────────────────┐│
│  │[thumbnail]  Full Body   ││
│  │             Reformer    ││
│  │             ▓▓▓░░ 12min ││  ← progress bar + time left
│  └─────────────────────────┘│
│                             │
│  New This Week              │
│  ┌──────────┐┌──────────┐  │
│  │[thumbnail││[thumbnail│  │
│  │ NEW      ││ NEW      │  │
│  │ 30 MIN   ││ 20 MIN   │  │
│  └──────────┘└──────────┘  │
│                             │
│  All Classes                │
│  Sort: Newest ▾             │
│                             │
│  ┌──────────────────────── ┐│
│  │ [photo]                 ││
│  │ Mar 09 · Full Body      ││
│  │ Ruby Ramdhan  · 36 MIN  ││
│  │ mat, resistance band    ││
│  │ ⓘ Info   ▷ Play        ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ ...                     ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

**Tokens:**
- Filter pills: active = Terracotta filled, inactive = outlined
- "NEW" badge: Deep Earth pill, white text
- Progress bar (in-progress classes): Terracotta
- Duration badge: `surface-warm` pill, text-primary

---

## 10 — Video Player

**Platform:** Mobile + Web
**Phase:** 2

```
┌─────────────────────────────┐
│  ← Full Body Reformer       │  ← back nav (fades on play)
│                             │
│  ┌─────────────────────────┐│
│  │                         ││
│  │    [video fullscreen]   ││
│  │                         ││
│  │  ▶  ────────●────────   ││  ← scrubber
│  │  12:34  /  36:00        ││
│  │                         ││
│  │  [⏮ 10s] [▶] [10s ⏭]  ││
│  │  [CC]  [1x]  [⬆ AirPlay]││
│  └─────────────────────────┘│
│                             │
│  Full Body Reformer         │  ← metadata (visible when paused)
│  Ruby Ramdhan · 36 MIN      │
│                             │
│  Equipment                  │
│  Mat, resistance band       │
│                             │
│  About this class           │
│  A full-body reformer       │
│  workout...                 │
│                             │
└─────────────────────────────┘
```

**Notes:**
- Video served via Mux
- Landscape lock on mobile when playing
- Progress synced to profile (resumes where left off)
- AirPlay + Chromecast support

---

## Global Components (reference)

### Toast Notification (social proof — NYP pattern, adapted)
```
┌───────────────────────────┐
│  14 members booked this   │  ← aggregate only, no individual names
│  week at Charlotte Park   │
└───────────────────────────┘
```
- Surface: `surface-warm`, 8px radius, subtle shadow
- Text: Poppins Regular, text-secondary
- Auto-dismisses after 5s
- Show on: homepage + booking flow only

---

### Class Status Pills
| State | Color | Text |
|-------|-------|------|
| Available | Terracotta `#A76E58` | "Book" |
| Few spots | Terracotta text | "2 spots left" |
| Full | `text-secondary` gray | "Full · Join Waitlist" |
| Cancelled | Rose Clay `#BC9C8E` | "Cancelled" |
| Booked (yours) | Deep Earth `#302D27` | "Booked ✓" |

---

### Location Toggle
```
[ Charlotte Park ●────]  [ Green Hills ]
```
- Active: Deep Earth fill, white text
- Inactive: outlined, text-primary
- 4px border radius (rectangular, per brand spec)
- Saves to user profile on tap
