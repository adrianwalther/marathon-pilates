# Spec 12 — Mobile App (Client-Facing)
*Marathon Pilates Platform | Created: 2026-03-10*

---

## Overview

The Marathon Pilates mobile app is the primary way most clients interact with the platform. It handles everything a client needs — booking classes, managing their membership, tracking progress, watching on-demand content, and staying connected to the studio.

The app is built with **React Native + Expo + Expo Router** and runs on both iOS and Android. The web booking platform (`app.marathonpilates.com`) mirrors the core booking functionality for clients who prefer a browser.

**Design principle:** The app should feel like a personal studio companion — warm, fast, and genuinely useful. Not a generic SaaS product.

---

## App Architecture

### Tech

| Layer | Tool |
|---|---|
| Framework | React Native + Expo (managed workflow) |
| Router | Expo Router (file-based routing) |
| Styling | NativeWind (Tailwind for RN) |
| State | Zustand (local) + React Query (server) |
| Auth | Clerk (JWT — shared with web platform) |
| Push notifications | Expo Push (APNs + FCM) |
| Video | Mux Player (React Native SDK) |
| Payments | Stripe React Native SDK |
| Analytics | PostHog (events) + Expo Updates (OTA) |

### Navigation Structure

```
App
├── (auth)                  ← Unauthenticated screens
│   ├── welcome             ← Landing / "Get Started" + "Log In"
│   ├── sign-up             ← Email + password
│   ├── log-in              ← Email + password
│   └── forgot-password
│
├── (onboarding)            ← First-time flow after sign-up
│   ├── intake/[step]       ← 7-step intake questionnaire
│   └── done                ← "You're all set" transition screen
│
└── (app)                   ← Authenticated tab navigator
    ├── home                ← Personalized home feed
    ├── schedule            ← Class + amenity booking
    ├── on-demand           ← Video library
    ├── journey             ← Progress, milestones, streaks
    └── account             ← Profile, membership, settings
```

---

## Onboarding Flow

### Welcome Screen

```
┌─────────────────────────────────┐
│                                 │
│   [Marathon Pilates Logo]       │
│                                 │
│   Move. Restore. Transform.     │
│                                 │
│   [Get Started]                 │
│   [Log In]                      │
│                                 │
│   Already have an account?      │
│   Sign in →                     │
└─────────────────────────────────┘
```

### Sign-Up Screen

```
  Create your account

  First name   [____________]
  Last name    [____________]
  Email        [____________]
  Password     [____________]

  [Create Account]

  By signing up, you agree to our
  Terms of Service and Privacy Policy.
```

After account creation → Intake Questionnaire (7 steps — see Spec 02).

### Intake Questionnaire

The 7-step intake questionnaire runs immediately after sign-up. Each screen is conversational, warm, and single-focus:

```
Screen 1: What's your big goal?
Screen 2: Are you training for something specific? (athletic)
Screen 3: Any areas to work around?
Screen 4: What's your life stage right now?
Screen 5: How familiar are you with Pilates?
Screen 6: Are you interested in recovery?
Screen 7: How often do you want to come in?
```

Progress indicator visible at top. "Skip for now" available on every screen (profile tags filled in with defaults; can be updated later in Settings).

After completion → **"You're all set" transition screen** → Home tab.

---

## Home Tab

The home tab is the heart of the app — personalized to each client.

```
┌─────────────────────────────────┐
│ ◎ Charlotte Park ▾    👤 Sarah  │  ← Location selector + avatar
├─────────────────────────────────┤
│                                 │
│  Good morning, Sarah 👋          │
│  Your next class is tomorrow    │
│  7:00am Reformer Flow · Anissa  │
│  [View Details]                 │
│                                 │
├─────────────────────────────────┤
│  FOR YOU                        │
│  Based on your profile          │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │ Tue 9am  │  │ Wed 8am  │    │
│  │ Reformer │  │ Sauna    │    │
│  │ Anissa   │  │ 45 min   │    │
│  │ 3 spots  │  │ Open     │    │
│  │ [Book]   │  │ [Book]   │    │
│  └──────────┘  └──────────┘    │
│                                 │
├─────────────────────────────────┤
│  CONTINUE WATCHING              │
│  ┌──────────────────────────┐  │
│  │ 🎬 Core Fundamentals Ep3 │  │
│  │ ████░░░░░  42% watched   │  │
│  │ [Resume]                 │  │
│  └──────────────────────────┘  │
│                                 │
├─────────────────────────────────┤
│  YOUR STREAK  🔥 7 days         │
│  ████████░░  Keep it going →   │
│                                 │
├─────────────────────────────────┤
│  TIP FOR YOU                    │
│  "Since you're training for a  │
│   marathon: try our Reformer    │
│   Fundamentals to build hip    │
│   stability before your long   │
│   runs."                        │
│                                 │
└─────────────────────────────────┘
```

### Home Screen Components

| Component | Logic |
|---|---|
| **Next class banner** | Shows next upcoming booked class; dismissed after class |
| **For You** | 2–3 class cards personalized from profile tags + behavior |
| **Continue watching** | Last partially watched on-demand video |
| **Streak** | Current streak + visual progress bar |
| **Tip** | Weekly rotating personalized tip from tip library |
| **Membership status** | If credits low or expiring, shown here as a soft alert |

**Location selector** (top-left): Charlotte Park or Green Hills. Remembers last used. Affects which classes appear in "For You" and in the Schedule tab by default.

---

## Schedule Tab

### Class Schedule View

```
┌─────────────────────────────────┐
│  Schedule                       │
│  ◎ Charlotte Park ▾             │
├─────────────────────────────────┤
│  [Week] [Day] [List]    Filter ▾│
├─────────────────────────────────┤
│  ← Mon Mar 9  │ Tue Mar 10 → →  │
├─────────────────────────────────┤
│  7:00am                         │
│  Reformer Flow                  │
│  Anissa · 50 min · 3 spots left │
│  [Book]                         │
│                                 │
│  8:30am                         │
│  Mat Pilates                    │
│  Sirkka · 45 min · Full         │
│  [Waitlist]                     │
│                                 │
│  10:00am                        │
│  Reformer Fundamentals          │
│  Anissa · 50 min · 6 spots      │
│  [Book]                         │
│                                 │
│  ─── AMENITIES ───              │
│                                 │
│  Sauna · Sunlighten mPulse      │
│  30 / 45 / 60 min · Open        │
│  [Book]                         │
│                                 │
│  Cold Plunge                    │
│  15 min slots · Open            │
│  [Book]                         │
└─────────────────────────────────┘
```

**Filter options:**
- Service type (Reformer, Mat, Sauna, Cold Plunge, etc.)
- Instructor
- Time of day (Morning / Midday / Evening)
- Location

**View modes:**
- **Week** — horizontal day scroll with class blocks
- **Day** — single day, full class list
- **List** — upcoming classes in chronological order (default for new clients)

### Class Detail Screen

```
┌─────────────────────────────────┐
│ ← Back              Share ⬆    │
│                                 │
│  Reformer Flow                  │
│  Tuesday, Mar 10 · 7:00am       │
│  Charlotte Park                 │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [Instructor photo]         │  │
│  │ Anissa Mitchell            │  │
│  │ ★ 4.9 · 142 classes        │  │
│  └───────────────────────────┘  │
│                                 │
│  3 of 12 spots remaining        │
│  ████████░░░░  25% full         │
│                                 │
│  50 minutes                     │
│  All levels welcome             │
│                                 │
│  "Full-body Reformer class      │
│  focusing on flow and breath    │
│  connection..."                 │
│                                 │
│  WHAT TO BRING                  │
│  • Grip socks (required)        │
│  • Water bottle                 │
│  • Comfortable workout clothes  │
│                                 │
│  [Book This Class — 1 Credit]   │
│                                 │
│  Or: Add sauna after class      │
│  30 min · $25 or 1 wellness     │
│  credit · [Add to Booking]      │
└─────────────────────────────────┘
```

Bundle prompt appears on class detail for clients with a wellness membership or available sauna credits.

### Booking Confirmation Screen

```
┌─────────────────────────────────┐
│                                 │
│          ✓                      │
│   You're booked!                │
│                                 │
│   Reformer Flow                 │
│   Tue Mar 10 · 7:00am           │
│   Charlotte Park · Anissa       │
│                                 │
│   1 credit used                 │
│   Credits remaining: 4          │
│                                 │
│   ─────────────────────         │
│   Want to add recovery?         │
│   Sauna · 30 min · $25          │
│   [Add Sauna]  [No thanks]      │
│                                 │
│   [View My Schedule]            │
│   [Done]                        │
│                                 │
└─────────────────────────────────┘
```

### Waitlist Flow

```
Class full → [Join Waitlist]
  → "You're #2 on the waitlist"
  → Push + SMS when spot opens
  → 30-minute window to claim
  → Tap notification → Claim screen → Booked ✓
```

---

## Private Session Booking

Accessed from Schedule tab → "Book Private":

```
┌─────────────────────────────────┐
│  Book a Private Session         │
├─────────────────────────────────┤
│                                 │
│  Session type:                  │
│  ● Solo     ○ Duet   ○ Trio     │
│                                 │
│  Preferred instructor:          │
│  ○ Any available                │
│  ○ Anissa Mitchell              │
│  ○ Sirkka Lyytinen              │
│  ○ [other instructors]          │
│                                 │
│  Request time:                  │
│  [Select preferred times →]     │
│  (morning / midday / evening)   │
│  + specific dates optional      │
│                                 │
│  Notes (optional):              │
│  [Any focus areas, injuries,    │
│   goals for this session...]    │
│                                 │
│  [Submit Request]               │
│                                 │
│  Instructor will confirm        │
│  within 24 hours.               │
└─────────────────────────────────┘
```

After submission → confirmation screen + email. Instructor notified immediately.

---

## On-Demand Tab

```
┌─────────────────────────────────┐
│  On-Demand                      │
├─────────────────────────────────┤
│  [Search videos...]        🔍   │
│                                 │
│  CONTINUE WATCHING              │
│  ┌──────────────────────────┐  │
│  │ 🎬 Core Fund. Ep 3       │  │
│  │ ████░░░░░  42%  [Resume] │  │
│  └──────────────────────────┘  │
│                                 │
│  FOR YOU                        │
│  Based on your marathon training│
│  ┌────────┐ ┌────────┐         │
│  │🎬      │ │🎬      │         │
│  │Hip     │ │Runner's│         │
│  │Mobility│ │Core    │         │
│  │18 min  │ │22 min  │         │
│  └────────┘ └────────┘         │
│                                 │
│  SERIES                         │
│  ┌──────────────────────────┐  │
│  │ 📚 Reformer Fundamentals  │  │
│  │ 8 episodes · 6 complete  │  │
│  │ ████████░░  75%          │  │
│  └──────────────────────────┘  │
│                                 │
│  BROWSE BY CATEGORY             │
│  [Reformer] [Mat] [Stretching]  │
│  [Mobility] [Strength] [Sauna]  │
│                                 │
│  RECENTLY ADDED                 │
│  ┌────────┐ ┌────────┐         │
│  │🎬      │ │🎬      │         │
│  │New!    │ │New!    │         │
│  └────────┘ └────────┘         │
└─────────────────────────────────┘
```

### Video Player Screen

```
┌─────────────────────────────────┐
│  [Full-screen video player]     │
│                                 │
│  ← Back    Hip Mobility Flow    │
│                                 │
│  [▶ / ⏸]  ━━━━━━━━━○────  18:22│
│  [⏪ 10s]  [⏩ 10s]  [⚙️ Quality]│
│  [🔒 Lock controls]             │
│                                 │
├─────────────────────────────────┤
│  Hip Mobility for Runners       │
│  Anissa Mitchell · 18 min       │
│                                 │
│  Perfect for marathon training. │
│  Targets hip flexors, IT band,  │
│  and glutes...                  │
│                                 │
│  Tags: [mobility] [runners]     │
│        [hip] [intermediate]     │
│                                 │
│  ★ Rate this video              │
│  [👎] [👍]                       │
└─────────────────────────────────┘
```

Progress auto-saves. Resumes from last position on re-open.

---

## Journey Tab

The Journey tab is where clients see their progress, milestones, and studio history.

```
┌─────────────────────────────────┐
│  Your Journey                   │
├─────────────────────────────────┤
│                                 │
│  🔥 7-Day Streak                │
│  Mon Tue Wed Thu Fri Sat Sun    │
│   ✓   ✓   ✓   ✓   ✓  ✓   ✓    │
│                                 │
│  LIFETIME STATS                 │
│  Classes attended:    42        │
│  On-demand watched:   18        │
│  Sauna sessions:      6         │
│  Member since:        Jan 2026  │
│                                 │
│  THIS WEEK                      │
│  Goal: 3 classes                │
│  ██░░  2 of 3 completed         │
│                                 │
│  MILESTONES                     │
│  ✓  First class          Jan 5  │
│  ✓  5 classes            Jan 20 │
│  ✓  10 classes           Feb 8  │
│  ✓  25 classes           Mar 1  │
│  ○  50 classes      ████░░ 42/50│
│  ○  100 classes     Century Club│
│                                 │
│  BADGES                         │
│  🏅 First Class                 │
│  🏅 5-Class Club                │
│  🏅 10-Class Club               │
│  🏅 25-Class Club               │
│  🔒 50 Classes (locked)         │
│  🔒 Century Club (locked)       │
│                                 │
│  RECENT ACTIVITY                │
│  Mar 10  Reformer Flow · Anissa │
│  Mar 9   Sauna · 45 min         │
│  Mar 7   Mat Pilates · Sirkka   │
│  Mar 5   Reformer Flow · Anissa │
│  [See all activity →]           │
│                                 │
└─────────────────────────────────┘
```

### Milestone Celebration Screen

Triggered when a milestone is hit — shown as a full-screen overlay after class check-in:

```
┌─────────────────────────────────┐
│                                 │
│          🏅                     │
│                                 │
│   25 Classes!                   │
│                                 │
│   You've been on the            │
│   Reformer 25 times, Sarah.     │
│   That's something to           │
│   celebrate.                    │
│                                 │
│   — Ruby & the team             │
│                                 │
│   [Share]   [Done]              │
│                                 │
└─────────────────────────────────┘
```

Shareable card generated for Instagram/social (branded image with milestone).

---

## Account Tab

```
┌─────────────────────────────────┐
│  Sarah Kim                      │
│  Member since Jan 2026          │
│  [Edit Profile]                 │
├─────────────────────────────────┤
│  MY MEMBERSHIP                  │
│  Reformer Unlimited             │
│  Renews Apr 1 · $199/mo         │
│  Credits: 4 remaining           │
│  Wellness credits: 3 remaining  │
│  [Manage Membership →]          │
├─────────────────────────────────┤
│  MY SCHEDULE                    │
│  Upcoming classes (2)    →      │
│  Past classes            →      │
│  Private sessions        →      │
├─────────────────────────────────┤
│  GIFT CARDS                     │
│  MP-A4BK-7XQJ   $15.00  →       │
│  [Redeem a Gift Card]           │
├─────────────────────────────────┤
│  PAYMENT                        │
│  Visa ending 4242        →      │
│  Billing history         →      │
├─────────────────────────────────┤
│  SETTINGS                       │
│  Notifications           →      │
│  My Profile & Goals      →      │
│  Intake questionnaire    →      │
│  Privacy                 →      │
│  Help & Support          →      │
│  Log Out                        │
└─────────────────────────────────┘
```

### My Schedule (Upcoming)

```
  Upcoming

  Tue Mar 10 · 7:00am
  Reformer Flow · Charlotte Park
  Anissa Mitchell
  [View Details]  [Cancel]

  Wed Mar 11 · 6:00pm
  Sauna · Green Hills
  45 min
  [View Details]  [Cancel]
```

Cancel button triggers cancellation policy check — if within late cancel window, shows warning before confirming.

### Membership Management Screen

```
  Reformer Unlimited
  $199 / month

  Next billing date: Apr 1, 2026
  Payment: Visa ending 4242

  Class credits:     4 remaining
  Wellness credits:  3 remaining
  Reset date:        Apr 1

  ─────────────────────────────
  [Pause Membership]
  [Cancel Membership]
  ─────────────────────────────

  BILLING HISTORY
  Mar 1  Reformer Unlimited    $199.00
  Feb 1  Reformer Unlimited    $199.00
  Jan 1  Reformer Unlimited    $199.00
  [View all →]
```

### Gift Cards

Clients can view their gift card balances and redeem codes:

```
  My Gift Cards

  ┌──────────────────────────┐
  │  Gift Card               │
  │  MP-A4BK-7XQJ-9WR2      │
  │  Balance: $15.00         │
  │  Originally: $100.00     │
  └──────────────────────────┘

  [Redeem a Gift Card]
  Enter code: [MP-____-____-____]
  [Apply]
```

Gift card balance is automatically available at checkout — no manual entry needed once applied to account.

### Notification Settings

```
  Notifications

  BOOKING (required)
  ✅  Booking confirmations      Email
  ✅  Cancellations              Email
  ✅  Payment receipts           Email
  ✅  Waitlist updates           Email + SMS ●

  REMINDERS (customize timing)
  ✅  Class reminders            Email + SMS ●

  ENGAGEMENT (optional)
  ✅  Streaks & milestones       Push + Email
  ✅  Personalized tips          Email + Push
  ✅  New on-demand content      Push + Email
  ☐   Weekly goal summary       Push + Email
```

---

## Checkout / Payment Flow

Used across booking, membership purchase, pack purchase, and gift cards.

```
┌─────────────────────────────────┐
│  Payment                        │
├─────────────────────────────────┤
│  Reformer Flow                  │
│  Tue Mar 10 · 7:00am            │
│                                 │
│  1 class credit applied         │
│  Total: $0.00                   │
│                                 │
│  ─────────────────────          │
│  Have a gift card?              │
│  [Enter code]                   │
│                                 │
│  PAYMENT METHOD                 │
│  ● Visa ending 4242             │
│  ○ Add new card                 │
│                                 │
│  [Confirm Booking]              │
└─────────────────────────────────┘
```

If credit covers the full amount, card is not charged — confirm screen skips payment entry.

Stripe SDK handles all card input. Apple Pay / Google Pay supported where available.

---

## Push Notifications (In-App Behavior)

When a push notification arrives:

- **While app is open:** In-app alert slides in from top (custom component, not OS notification)
- **While app is in background:** Standard OS push notification
- **Tap behavior:** Deep-links to the relevant screen

| Notification type | Tap destination |
|---|---|
| Class reminder | Class detail screen |
| Waitlist spot opened | Claim spot screen |
| Membership renewal | Billing screen |
| Streak milestone | Journey tab |
| New on-demand video | Video player |
| Credit balance low | Membership screen |

**Notification inbox:** In-app bell icon (top-right of home) shows recent unread notifications with timestamps. Clears on read.

---

## In-App Alert Feed

Separate from push — a persistent in-app feed accessible from the home screen:

```
  Notifications (3 unread)

  Today
  🔥 7-day streak! You've been consistent
     all week. → Journey

  Mar 9
  ✓ Waitlist spot claimed — Reformer Flow
     Tuesday 7am is confirmed. → Schedule

  Mar 8
  💳 Your credits reset for the month.
     4 class + 3 wellness ready. → Account
```

---

## Location Experience

The app supports both Marathon Pilates locations:

- **Location selector** persists across sessions (top of Home + Schedule)
- Schedule filters to selected location by default
- Client can switch locations mid-browse — schedule updates instantly
- Amenity availability is location-specific (sauna + cold plunge not at both locations — confirmed per service availability)
- Private session requests specify preferred location

---

## Offline Behavior

The app handles poor connectivity gracefully:

| Feature | Offline behavior |
|---|---|
| Schedule view | Shows cached schedule (last fetch) with "last updated" timestamp |
| Video playback | Previously started videos buffer; new videos require connection |
| Booking | Requires connection — shows friendly error if offline |
| Journey tab | Reads from local cache |
| Account tab | Reads from local cache; payment changes require connection |

---

## App Performance Standards

- **App launch to home screen:** < 2 seconds (cold start)
- **Schedule tab load:** < 1 second
- **Video start (on-demand):** < 3 seconds on LTE
- **Booking confirmation:** < 2 seconds end-to-end
- **Push delivery latency:** < 5 seconds for time-sensitive (waitlist)

---

## App Store Presence

### iOS (App Store)
- App name: **Marathon Pilates**
- Category: Health & Fitness
- Subtitle: "Book · Stream · Transform"
- Screenshots: Home, Schedule, Journey, On-Demand, Milestone celebration
- Privacy: Collects name, email, fitness data (class attendance, goals), payment info

### Android (Google Play)
- Same app via Expo EAS Build
- Same store listing content

### App Icon
- Marathon Pilates logo mark on brand background
- Consistent with studio branding (see design system)

---

## First-Time Client Experience Summary

```
Download app
  ↓
Welcome screen — "Get Started"
  ↓
Create account (name, email, password)
  ↓
Intake questionnaire (7 steps, skippable)
  ↓
"You're all set" screen
  ↓
Home tab — personalized, with "Book Your First Class" prompt
  ↓
Book class → Checkout → Confirmation
  ↓
24hr before: reminder email + push
  ↓
2hr after: "How was your first class?" email
  ↓
Day 3: nudge to book again (if not already booked)
```

---

## Open Questions / Decisions Needed

- [ ] **Instructor mode:** Do instructors use the same client app with an elevated "instructor mode," or a separate staff app? (Affects Phase 1 scope significantly)
- [ ] **Apple Pay / Google Pay:** Confirm Stripe configuration supports these at launch
- [ ] **App icon / splash screen:** Final design assets needed from brand/design
- [ ] **Shareable milestone cards:** Branded social share cards — design needed for each milestone level
- [ ] **On-demand access gating:** Which membership tiers include on-demand? Is it an add-on or always included? (See Spec 07)
- [ ] **Contrast Therapy / Neveskin booking:** Are these bookable via the app at launch, or Phase 2?

---

*Next: `13-launch-plan.md` — phased rollout, beta testing, and go-live checklist*
