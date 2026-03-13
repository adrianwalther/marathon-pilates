# Spec 02 — Client Journey & Progress Tracking
*Marathon Pilates Platform | Created: 2026-03-09*

---

## Overview
This is what separates Marathon Pilates from every other booking platform. Mindbody and Arketa track attendance. We track the whole person — their goals, their progress, their milestones, and their relationship with the studio. The client should feel seen, not just scheduled.

---

## Journey Phases

Every client moves through predictable phases. The platform should behave differently at each one.

```
Phase 1: Discovery        → First visit to the site or app, no account
Phase 2: Intro            → First 1–3 visits, forming habits
Phase 3: Regular          → Consistent attendance, building routine
Phase 4: Committed        → Active membership, community feeling
Phase 5: Milestone        → Long-term client, ambassador potential
Phase 6: At Risk          → Attendance dropping, needs re-engagement
Phase 7: Lapsed           → No visits in 30+ days
```

The platform detects phase automatically and adjusts:
- What the client sees in their app dashboard
- What automated messages they receive
- What the instructor sees when the client checks in

---

## Client Profile

### What the Client Sees (App Dashboard)

```
┌─────────────────────────────────────┐
│  👋 Welcome back, Sarah             │
│                                     │
│  🔥 14-day streak                   │
│  🎯 Goal: 3x/week                   │
│                                     │
│  This week: ████░░░ 2 of 3 sessions │
│  This month: 9 sessions             │
│  All time: 47 sessions 🌟           │
│                                     │
│  Next class: Tomorrow, 9am          │
│  + Sauna reserved: 10:15am          │
│                                     │
│  [Book a Class]  [Add Recovery]     │
└─────────────────────────────────────┘
```

### Client Profile Fields (Self-Entered at Onboarding)
- Name, email, phone, emergency contact
- Fitness experience level (Beginner / Some experience / Advanced)
- Pilates experience specifically (Never / Some / Regular practitioner)
- Primary goals (select all that apply):
  - Build core strength
  - Improve flexibility
  - Recover from injury
  - Stress relief / mental wellness
  - Athletic cross-training
  - Weight management
  - General fitness
- Any injuries or physical limitations (free text)
- How they heard about Marathon Pilates
- Preferred class times (morning / midday / evening / weekend)
- Preferred instructors (optional)

---

## Smart Intake Questionnaire

At sign-up, before a client ever books their first class, the platform walks them through a short conversational intake — not a form, a conversation. This data powers personalized recommendations throughout their entire time at the studio.

### Design Principle

This should feel like a knowledgeable friend asking you questions, not a medical intake form. Warm, concise, one question at a time. 5–7 screens max. Client can skip any question.

### The Questionnaire Flow

```
Screen 1 — The Big Goal
─────────────────────────────────────────────
  "What brings you to Marathon Pilates?"
  (pick the one that fits best)

  ○  I want to get stronger and build core stability
  ○  I'm recovering from an injury or surgery
  ○  I'm training for a sport or event
  ○  I need to move more and reduce stress
  ○  I want to add flexibility and mobility work
  ○  I'm curious and just want to try it
─────────────────────────────────────────────

Screen 2 — Sports & Events (conditional — shows if "training for sport/event")
─────────────────────────────────────────────
  "What are you training for?"
  (select all that apply)

  ○  Running (marathon, half, 5K)
  ○  Cycling or triathlon
  ○  Swimming
  ○  Team sports (soccer, tennis, basketball, etc.)
  ○  Golf
  ○  Dance or performing arts
  ○  Weightlifting / CrossFit
  ○  Other / general athletics
─────────────────────────────────────────────

Screen 3 — Body Check-In
─────────────────────────────────────────────
  "Any areas we should know about?"
  (select all that apply — or skip)

  ○  Knee (pain, surgery, or instability)
  ○  Lower back
  ○  Hip or pelvis
  ○  Shoulder
  ○  Neck
  ○  Ankle or foot
  ○  Core / abdominal (post-surgery, diastasis, etc.)
  ○  Wrists or hands
  ○  Nothing — feeling good!

  [Tell us more (optional free text)]
─────────────────────────────────────────────

Screen 4 — Life Stage
─────────────────────────────────────────────
  "Anything about your current life stage we should know?"
  (select any that apply — or skip)

  ○  I'm pregnant
  ○  I'm postpartum (within the last 12 months)
  ○  I'm going through menopause or perimenopause
  ○  I'm managing a chronic condition (diabetes, arthritis, etc.)
  ○  None of the above
─────────────────────────────────────────────

Screen 5 — Experience Level
─────────────────────────────────────────────
  "How familiar are you with Pilates?"

  ○  Complete beginner — never tried it
  ○  A little — took a few classes before
  ○  Some experience — I know the basics
  ○  Regular practitioner — I've been doing it a while
─────────────────────────────────────────────

Screen 6 — Recovery Interest
─────────────────────────────────────────────
  "We have a sauna and cold plunge available. Any interest?"

  ○  Yes — I'd love to use them
  ○  I'm open to it — tell me more
  ○  Not really my thing — just classes for me
─────────────────────────────────────────────

Screen 7 — Weekly Rhythm
─────────────────────────────────────────────
  "How often are you hoping to come in?"

  ○  Once a week is plenty
  ○  2x a week is my goal
  ○  3x a week — I'm committed
  ○  4+ times — I'm all in
─────────────────────────────────────────────
```

### Profile Tags (Generated from Answers)

Answers are stored and converted into **profile tags** — structured labels that drive everything else in the system. Client never sees the raw tags; they just experience personalized content.

**Athletic tags:**
`runner` `cyclist` `triathlete` `swimmer` `golfer` `dancer` `weightlifter` `team-sport`

**Body tags:**
`knee-concern` `lower-back` `hip-concern` `shoulder-concern` `neck-concern` `ankle-concern` `core-concern` `wrist-concern`

**Life stage tags:**
`prenatal` `postpartum` `perimenopause` `chronic-condition`

**Goal tags:**
`core-strength` `flexibility` `injury-recovery` `stress-relief` `athletic-performance` `weight-management` `general-fitness`

**Experience tags:**
`pilates-beginner` `pilates-some` `pilates-experienced`

**Wellness interest tags:**
`wellness-interested` `wellness-open` `wellness-not-interested`

**Frequency tags:**
`frequency-1x` `frequency-2x` `frequency-3x` `frequency-4x`

---

## Personalization Engine

Tags drive what each client sees and receives. The logic is configured by admin (Ruby) — no code changes needed to adjust recommendations.

### Class Recommendations

| Tag | Recommended Classes | Reasoning |
|---|---|---|
| `runner` | Stretch + Restore, Reformer Flow | Hip flexors, IT band, posterior chain |
| `cyclist` | Stretch + Restore, Mat Pilates | Hip flexors, upper back posture |
| `golfer` | Reformer Flow, Core Focus | Rotational strength, spinal mobility |
| `pilates-beginner` | Reformer Fundamentals | Start here — always |
| `knee-concern` | Reformer Fundamentals, Private | Low-impact, instructor attention |
| `lower-back` | Reformer Fundamentals, Mat Pilates | Core stabilization, spinal decompression |
| `prenatal` | Private Session | Instructor-guided only |
| `postpartum` | Private Session, Reformer Fundamentals | Core rebuilding with attention |
| `stress-relief` | Stretch + Restore, Sauna | Recovery and nervous system |
| `athletic-performance` | Reformer Flow, Private | Performance-focused work |

### On-Demand Recommendations

The "For You" section of the on-demand library surfaces videos matching the client's tags:

| Tag | Surfaces |
|---|---|
| `runner` | "Pilates for Runners" series, hip opener videos, IT band stretches |
| `lower-back` | "Back Relief" series, core stabilization fundamentals |
| `knee-concern` | Low-impact modifications, quad/hamstring balance videos |
| `shoulder-concern` | Shoulder mobility, posture correction videos |
| `prenatal` | Prenatal Pilates playlist (if available) |
| `stress-relief` | Breathing + restoration videos, gentle flow |
| `perimenopause` | Bone density, strength-focused, low-impact |
| `wellness-interested` | Sauna + cold plunge how-to content, contrast therapy guide |

### Personalized Tips (In-App + Email)

These are contextual nudges that feel tailored, not automated. They show in the app's home screen and are delivered via email/push at the right moments.

**Examples by tag:**

```
runner:
  "You're a runner — your hip flexors are working overtime.
   Stretch + Restore on Thursdays is exactly what your body needs
   the day before a long run."

  "3 weeks into marathon training? This is the time most runners
   start to feel tightness through the IT band. We've got you."

knee-concern:
  "With your knee, the reformer's spring resistance is actually
   your friend — it allows full range of motion without joint load.
   Reformer Fundamentals is a great place to start."

lower-back:
  "Lower back tension often comes from a weak core, not a
   tight back. Pilates was literally invented for this.
   You're in the right place."

golfer:
  "Rotational power in your golf swing starts at your core.
   Reformer work builds that foundation — and your lumbar
   spine will thank you."

prenatal:
  "Prenatal Pilates can be incredible during pregnancy —
   but we want to make sure every session is right for where
   you are. We recommend starting with a private session
   so your instructor can build a plan just for you."

pilates-beginner:
  "Everyone starts at zero. Reformer Fundamentals is exactly
   where you should begin — no experience needed, no judgment,
   just good foundations."

wellness-interested:
  "Your sauna session works best after class — your muscles
   are already warm and the heat helps lock in your recovery.
   Book them back-to-back."
```

### Tip Timing Rules

- **At sign-up confirmation:** 1 personalized tip based on primary goal tag
- **Before first class (24hr):** 1 relevant "what to know" tip based on their body tags
- **After first class (2hr):** 1 tip about what to try next, based on their goal
- **Weekly:** 1 rotating tip relevant to their tag set (not repetitive — rotates through library)
- **Seasonal:** e.g., "Spring marathon season — runners, this one's for you"

Tips are admin-configurable — Ruby or Susan can write new tip content and assign it to tags without code changes.

---

## Behavioral Learning Layer

The intake questionnaire gives us a starting point. But what a client *does* over time tells us far more than what they *said* at sign-up. The platform continuously refines its understanding of each client based on real behavior.

### Behavioral Signals Tracked

| Signal | What it tells us |
|---|---|
| Classes actually attended (vs. booked) | Real preferences vs. intentions |
| Class types chosen over time | What format they gravitate toward |
| Time of day / day of week patterns | Their natural schedule |
| On-demand videos watched + completion % | Content that genuinely resonates |
| Videos started but abandoned | Content that doesn't land |
| Amenity usage after class | Recovery habits |
| Response to recommendations | Did they book what we suggested? |
| Rebok rate for a given instructor | Instructor fit |
| Streak patterns and drop-off points | What sustains them vs. what loses them |

### How the System Adapts

**Class recommendations sharpen over time:**
```
Week 1 (tag-driven):
  "Try Reformer Fundamentals — good for beginners"

Month 2 (behavior-adjusted):
  "You've attended Reformer Flow 6 times — have you tried
   the 7am Friday class? Anissa teaches it and clients
   with your history tend to love it."

Month 6 (fully learned):
  "Your Tuesday 9am spot is open — you've booked it
   3 of the last 4 weeks. Want to lock it in?"
```

**On-demand preferences update automatically:**
- Watches 5 hip-focused videos → surface more hip content, deprioritize unrelated
- Completes every video under 15 min → surface shorter content first
- Consistently drops off at 8 min in 20-min videos → note this in content analytics for Ruby
- Never opens breathing/restoration content → stop surfacing it (not their thing)

**Tag evolution:**
Tags from the intake questionnaire aren't locked in forever. Behavior can update them:

| Original tag | Behavior signal | Updated state |
|---|---|---|
| `pilates-beginner` | 20 classes completed | → graduates to `pilates-some` |
| `knee-concern` | 30 reformer classes, no modifications flagged | → concern flag softened |
| `wellness-not-interested` | Booked sauna twice | → updated to `wellness-open` |
| `frequency-2x` | Averaging 3x/week for 8 weeks | → updated to `frequency-3x` |

### Recommendation Confidence Score (Internal)

Each recommendation carries an internal confidence score — not shown to the client, but used to decide what to surface:

- **Low confidence** (early, tag-driven): Show broader suggestions
- **Medium confidence** (some behavioral data): More specific suggestions
- **High confidence** (6+ months of behavior): Highly personalized, almost predictive

Example: "You always come in Monday and Thursday — you haven't booked Thursday yet this week. Want to grab the 9am?"

### What This Is (and Isn't)

This is **pattern recognition + rule-based logic** — not a black-box AI model. It's transparent, predictable, and Ruby can see exactly why a recommendation was made. No third-party ML dependency required for Phase 1.

In a later phase, if the on-demand library grows large enough, a proper similarity model (e.g., "clients like you also loved...") can be layered in — similar to how Spotify or Netflix works, but tuned for a boutique studio context.

### Admin Visibility

Ruby and Susan can see what the system is learning:

```
Admin → Clients → [Client Profile] → Insights

  BEHAVIORAL SUMMARY — Sarah Kim
  ─────────────────────────────────────────────
  Preferred format: Reformer Flow (attended 18x)
  Preferred time: Mon/Thu 7am–9am
  Preferred instructor: Anissa Pollard (11 of 18 sessions)
  On-demand style: Short videos <15 min, hip + mobility content
  Recovery pattern: Books sauna after ~60% of classes
  Recommendation acceptance: 4 of last 6 suggestions acted on
  Current confidence: High ●●●●○
  ─────────────────────────────────────────────
```

This turns the admin into a well-briefed team — even a new front desk hire would know exactly how to talk to a returning client.

---

## Updated App Home Screen (Personalized)

```
┌─────────────────────────────────────────────┐
│  👋 Welcome back, Sarah                      │
│                                             │
│  🔥 14-day streak  ·  Next: Tomorrow 9am    │
│                                             │
│  FOR YOU                                    │
│  ─────────────────────────────────────────  │
│  🏃  "You're a runner — your hips need      │
│       this." → Stretch + Restore, Sat 8am   │
│       [Book Now]                            │
│                                             │
│  📺  New on demand: Pilates for Runners     │
│       Hip flexor reset · 12 min             │
│       [Watch]                               │
│                                             │
│  🧖  Sauna available after your class       │
│       Tomorrow 9:45am · 1 spot open         │
│       [Add to booking]                      │
│  ─────────────────────────────────────────  │
│                                             │
│  [Book a Class]  [Browse On-Demand]         │
└─────────────────────────────────────────────┘
```

The "For You" section is dynamic — it changes based on the client's tags, upcoming schedule, season, and behavior patterns.

---

## Instructor View — Intake Tags at Class Start

When the roster loads, instructors now see the client's relevant tags at a glance:

```
Sarah M.
📅 47 total sessions | 🔥 14-day streak
🏃 Runner — hip mobility | ⚠️ Right shoulder sensitivity
🎯 Goal: Athletic performance + flexibility
🌟 Milestone coming: 50 sessions (3 away!)
```

Tags shown to instructor: athletic context, body concerns, goal. Not life stage (too sensitive to broadcast in a group class context — prenatal/postpartum shown to instructor but not displayed in group roster alongside other clients).

---

### Health & Waiver
- Digital waiver signed at onboarding (timestamped, stored)
- Medical notes field (instructor-visible, optional)
- Pregnancy / postpartum flag (unlocks instructor alert at check-in)

---

## Progress Tracking

### Attendance Metrics (Auto-tracked)
- Total sessions (all time)
- Sessions this week / month / year
- Current streak (consecutive weeks with at least 1 visit)
- Longest streak ever
- Favorite class type (auto-calculated)
- Favorite instructor (auto-calculated)
- Average sessions per week (rolling 8 weeks)
- Amenity sessions: sauna count, cold plunge count

### Milestone System
Milestones are auto-triggered and celebrated in the app + via notification.

| Milestone | Trigger | Celebration |
|---|---|---|
| First class | Complete first booking check-in | In-app card + welcome email |
| First reformer | First reformer class checked in | In-app card |
| 5 classes | 5 total check-ins | In-app badge |
| 10 classes | 10 total check-ins | In-app badge + instructor notified |
| 25 classes | 25 total | In-app badge + email from studio |
| 50 classes | 50 total | Special badge + personal note from instructor |
| 100 classes | 100 total | "Century Club" badge + card from studio + personal message from Ruby (gift TBD for future) |
| 200 classes | 200 total | "Legend" badge + card from studio + personal message from Ruby (gift TBD for future) |
| 1-week streak | 7 consecutive days with a session | In-app card |
| 1-month streak | 4 consecutive weeks | In-app badge |
| First sauna | First sauna check-in | In-app card with tips |
| First cold plunge | First cold plunge check-in | In-app card with protocol guidance |
| Full recovery day | Sauna + cold plunge on same day | "Recovery Pro" in-app card |
| Birthday | Client's birthday | Warm message from the studio + optional gift (e.g., complimentary class or credit — configurable) |
| 1-year anniversary | Account creation anniversary | Personal email from studio |

All milestones are visible in the client's "Journey" tab in the app.

### Goal Tracking
- Client sets a weekly session goal (1x, 2x, 3x, 4x+ per week)
- App shows progress toward goal each week
- Streak resets weekly; goal progress resets weekly
- If client misses goal week, app shows encouragement, not shame

### Wellness Journal (Optional — client opt-in)
A simple, low-friction self-log. Not a workout app — just awareness.

- After each session, optional 1-tap mood check-in: 😴 / 😊 / 💪 / 🔥
- Optional 1-line note ("Felt strong today" / "Low energy but glad I came")
- Instructors cannot see journal entries (client-private)
- Client can view their mood history over time

---

## Instructor-Facing Tools

### What Instructors See at Class Start

When the roster loads for a class, each client shows:

```
Sarah M.
📅 47 total sessions | 🔥 14-day streak
🎯 Goal: Core strength, stress relief
⚠️  Note: Right shoulder sensitivity — avoid overhead
🌟 Milestone coming: 50 sessions (3 away!)
```

- Total sessions and streak at a glance
- Client goals (from onboarding)
- Injury/limitation flag (if any)
- Upcoming milestone alert — instructor can give a personal shoutout

### Instructor Session Notes
After each private session (and optionally after group classes), instructors can log:

- Exercises introduced / progressed
- Client response / energy level
- Modifications used
- Goals discussed
- Follow-up for next session

Notes are visible to:
- The instructor who wrote them
- Studio admin
- Other instructors working with that client (with client consent — TBD on privacy approach)
- **NOT visible to the client** (instructor workspace)

### Client Flag System
Instructors or admin can flag a client:

| Flag | Meaning | Who Sees It |
|---|---|---|
| New client | First 3 visits | All instructors |
| Injury / limitation | Has a physical note | All instructors |
| At risk | Dropping attendance | Admin only |
| VIP | Long-term loyal client | All instructors |
| Pregnancy / postpartum | For safety modifications | All instructors |

---

## Automated Lifecycle Communications

The platform sends different messages based on where a client is in their journey. These are not mass blasts — they are behavior-triggered.

### Phase 1–2: Onboarding (New Client)

| Trigger | Message | Channel | Timing |
|---|---|---|---|
| Account created | Welcome + what to expect for first class | Email | Immediately |
| 24hr before first class | "What to bring" prep guide | Email + Push | 24hr before |
| 2hr after first class | "How was your first class?" | Email | 2hr after |
| 3 days after first class | "Book your next class" with schedule link | Email + Push | Day 3 |
| 7 days after first class, no booking | "We'd love to see you again" | Email | Day 7 |

### Phase 3–4: Regular / Committed

| Trigger | Message | Channel | Timing |
|---|---|---|---|
| Goal met for the week | "You hit your goal this week!" | Push | End of week |
| Streak milestone | Milestone celebration | Push + Email | At milestone |
| Class anniversary (1 month) | "One month in — you're building something real" | Email | Day 30 |
| Credit pack running low (1 remaining) | "Your pack is almost up — renew to keep your streak" | Push + Email | When 1 credit remains |
| Membership renewal upcoming | "Your membership renews in 7 days" | Email | 7 days before |

### Phase 6–7: Re-engagement

| Trigger | Message | Channel | Timing |
|---|---|---|---|
| No visit in 14 days | "Haven't seen you in a while — what's getting in the way?" | Email | Day 14 |
| No visit in 21 days | Offer: comeback class or promo | Email + SMS | Day 21 |
| No visit in 30 days | Personal-feeling message from studio | Email | Day 30 |
| No visit in 60 days | Final check-in before archiving | Email | Day 60 |

### Wellness-Specific Messages

| Trigger | Message |
|---|---|
| First sauna booking | "Sauna tips: what to expect and how to get the most out of it" |
| First cold plunge | "Cold plunge protocol — what to know before you go in" |
| Booked class + sauna same day | "You've got a great recovery day ahead — here's how to sequence it" |
| 5 sauna sessions | "You're a regular in the sauna — have you tried adding the cold plunge?" |

---

## The Journey Tab (Client App)

A dedicated screen in the app showing the client's full story at Marathon Pilates.

```
┌──────────────────────────────────────┐
│  YOUR JOURNEY                        │
│                                      │
│  🏅 47 Classes  |  🧖 8 Sauna  |  🧊 3 CP │
│                                      │
│  ── Milestones ──────────────────    │
│  🌟 50 Classes  (3 away!)            │
│  ✅ 25 Classes  — Feb 14             │
│  ✅ 10 Classes  — Jan 3              │
│  ✅ First Class — Dec 12             │
│                                      │
│  ── This Month ─────────────────     │
│  ████████░░  9 sessions              │
│  Goal: 12/month  75% there           │
│                                      │
│  ── Mood History ───────────────     │
│  [show last 8 sessions mood dots]    │
│                                      │
│  ── Instructor Notes ───────────     │
│  [visible only if client opts in]    │
└──────────────────────────────────────┘
```

---

## Privacy Considerations

- Instructor session notes: default NOT visible to client. Studio can enable "shared notes" per instructor.
- Wellness journal: always client-private.
- Health/injury info: visible to instructors and admin only.
- Client can download all their own data at any time (GDPR/CCPA compliance).
- Client can delete their account and data.

---

## Open Questions / Decisions Needed

- [ ] Should instructor notes ever be shared with clients? (Opt-in toggle per instructor?)
- [ ] Wellness journal: keep it mood-only, or allow free text notes?
- [ ] Should clients be able to see each other's milestones? (Community / social layer?)
- [ ] What physical progress fields to optionally track? (Weight, flexibility, measurements — all very sensitive)
- [ ] Century Club (100 classes): what's the studio's preferred reward?
- [ ] Should the "at risk" flag trigger an automated message or a manual staff to-do?
- [ ] How do we handle clients who don't want any tracking / prefer a minimal profile?

---

*Next: `03-tech-stack.md` — what we build on*
