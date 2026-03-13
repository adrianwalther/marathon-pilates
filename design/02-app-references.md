# Design References — App Inspiration

> Ruby's four app references analyzed for design patterns to borrow.
> Cross-referenced against Marathon Pilates brand system in `01-design-system.md`.
> **MP positioning note:** Health and wellness focused — not fashion-forward or high-energy.

---

## 1. Pvolve Streaming (`app.pvolve.com`)

### Why It's Relevant
Pvolve is the closest comparable product to what Marathon Pilates is building: a premium boutique fitness brand with a streaming/on-demand layer. The visual language is strikingly similar to MP's own brand guidelines — warm neutrals, earthy tones, clean photography.

### Design Language
- **Background:** Warm off-white/linen (`~#F5F1EC`) — nearly identical to MP's Sandstone `#DDD1BD`
- **Accent color:** Rust/terracotta for active states, CTAs, and highlights — maps directly to MP's Terracotta `#A76E58`
- **Typography:** Clean sans-serif, mixed case in UI (NOT all caps) — calm, editorial tone
- **Overall feel:** Premium, calm, content-forward — exactly "Move + Restore"

### Key UI Patterns to Borrow

#### Navigation
```
[ For You ] [ Classes ] [ Live ] [ Series ] [ Calendars ]
             ^^^^^^^^^^^
             Active: terracotta underline, no background fill
```
- 5-item horizontal nav, text weight differentiates active vs inactive
- Secondary utility row above nav (Find a Studio | Shop)
- Right side: search icon + history icon + account avatar

**→ Apply to MP:** Main nav tabs (Classes / Book / On-Demand / Progress / Account), terracotta underline active state

---

#### Filter Pills
```
[ All Classes ●filled ]  [ Beginner ]  [ Sculpt ]  [ Weight Training ]
```
- Active pill: **filled terracotta** background, white text
- Inactive pill: **outlined**, dark text, no fill
- Shape: rounded pill (not rectangular — this is filters only, not primary buttons)
- Scrollable horizontal row

**→ Apply to MP:** Class type filters (All / Reformer / Private / Sauna / Cold Plunge), instructor filters, duration filters

---

#### Class Card
```
┌─────────────────────────────────┐
│  [Photo thumbnail — 16:9]       │
│  ┌──────────────────────────┐   │
│  │ NEW         [🔒]         │   │  ← badges top corners
│  │                          │   │
│  │ Mar 09, 2026 · Ebbs & Flows  │  ← metadata overlay
│  │ Full Body Sculpt    36MIN│   │  ← title + duration badge
│  └──────────────────────────┘   │
├─────────────────────────────────┤
│ [avatar] Antonietta Vacario      │  ← instructor
│          heavy ankle band,       │  ← equipment/details
│          p.band                  │
│  ⓘ More info    ▷ Preview class │  ← inline actions
└─────────────────────────────────┘
```
- Photo is the hero — takes ~70% of card height
- Text overlay at bottom: small metadata line (date + category) above bold title
- Duration badge: white rectangular badge, bottom-right of photo
- "NEW" badge: black pill, top-left
- Lock icon: top-right (members-only indicator)
- Below-card: instructor avatar + name + equipment/notes + quick actions
- 3-column grid on desktop

**→ Apply to MP:** On-demand class cards, group class cards in schedule view

---

#### Auth / Login Screen
```
┌──────────────────┬─────────────────────────────┐
│                  │                              │
│  PVOLVE          │  [App screenshot collage]    │
│                  │                              │
│  A stronger      │  The ultimate at home        │
│  you is waiting  │  streaming experience        │
│                  │  ✓ 1,500+ on-demand workouts │
│  Email _________ │  ✓ Live classes 7 days/week  │
│  Password _______ │  ✓ Series & calendars       │
│                  │                              │
│  [LOG IN]        │  ★★★★★ 4.9 · 6.4K reviews  │
│                  │                              │
│  No account?     │  [testimonial cards]         │
│  Sign up         │                              │
└──────────────────┴─────────────────────────────┘
```
- Split layout: form left (~40%), marketing right (~60%)
- Warm linen background throughout
- Accent word in the headline uses terracotta color
- "LOG IN" button: dark/black fill, ALL CAPS, full width
- Clean minimal inputs, subtle border

**→ Apply to MP:** Login/signup screen on web and mobile

---

#### Pricing / Subscription Gate
- Lock icon (🔒) on class cards signals premium content without being aggressive
- Soft upsell — no popups, no modals until the user actually tries to play

**→ Apply to MP:** Lock icon on on-demand classes for non-members; no aggressive paywall overlays

---

## 2. Jillian Michaels: The Fitness App (`jillianmichaels.com`)

### Why It's Relevant
A highly polished, content-rich fitness app with excellent visual content organization. The category-tile system and section-based layout are patterns Ruby clearly values — this is how you navigate a large library without feeling overwhelmed.

### Design Language
- **Background:** White / light gray sections, high contrast
- **Accent color:** Bold red/coral (`~#E8372A`) for primary CTAs
- **Typography:** Heavy serif-ish / bold sans-serif for headlines; clean sans for body; **ALL CAPS** used extensively on category tiles and button text
- **Overall feel:** Bold, aspirational, high-energy — less directly applicable than Pvolve, but the *organizational patterns* are excellent

### Key UI Patterns to Borrow

#### Category Photo Tiles
```
┌────────────┐  ┌────────────┐  ┌────────────┐
│            │  │            │  │            │
│  [photo]   │  │  [photo]   │  │  [photo]   │
│            │  │            │  │            │
│  STRENGTH  │  │    YOGA    │  │  BOOTCAMP  │
└────────────┘  └────────────┘  └────────────┘
```
- Full-bleed photo with white ALL CAPS text centered over dark overlay
- Square or near-square aspect ratio
- 3–4 column grid, or horizontal scroll on mobile
- No borders, no card shadows — photo bleeds edge to edge

**→ Apply to MP:** Service category tiles on home screen: REFORMER / PRIVATE / SAUNA / COLD PLUNGE / CONTRAST THERAPY / ON-DEMAND

---

#### Section-Based Content Organization
The app breaks content into clearly labeled horizontal sections:
- "Just Added"
- "Interactive Programs"
- "Sleep / Breathwork / Meditation"
- "Tracking / Community / Music"

Each section has a bold header, then a scrollable horizontal row or grid of cards below.

**→ Apply to MP:** On-demand home screen organized by:
- "Recently Added"
- "Continue Watching" (in-progress)
- "Reformer Classes"
- "Recovery & Restore"
- "Teacher Favorites"

---

#### App Mobile Screen Layout (from mockup)
```
Workouts                              🔍
────────────────────────────────────────
[ For You ●red ] [ Browse ] [ Continue ]

┌──────────────────────────────────────┐
│  INVITE FRIENDS  →  referral banner  │
└──────────────────────────────────────┘

Just Added
┌────────┐  ┌────────┐
│ photo  │  │ photo  │
│ title  │  │ title  │
└────────┘  └────────┘

Interactive Programs
┌────────┐  ┌────────┐
│ photo  │  │ photo  │
└────────┘  └────────┘

─────────────────────────────────────────
[🏠 Workouts] [🍽 Meals] [👤 Me] [💬 Community]
```
- Top: screen title + search icon
- Three-tab sub-nav with colored active indicator
- Content organized in horizontal scrolling sections
- Bottom tab bar: 4 items, icon + label

**→ Apply to MP:** Mobile bottom tab bar structure; sub-nav tabs within screens (e.g., Booking screen: `[Group] [Private] [Amenities]`)

---

#### Button Hierarchy
| Level | JM Style | Notes |
|-------|----------|-------|
| Primary CTA | Filled red, ALL CAPS, full-width | High energy |
| Secondary | Outlined white/dark, ALL CAPS | |
| Tertiary | Text link | |
| Nav CTA pair | `LOGIN` (outline) + `START FREE TRIAL` (filled) | |

**→ Apply to MP:** Use MP's brand colors (Earth `#302D27` = "dark", Terracotta `#A76E58` = "accent") in same button hierarchy. Keep ALL CAPS on primary buttons per brand guidelines.

---

## 3. Yoga Joint (`yogajoint.com`)

### Why It's Relevant
Ruby specifically called out Yoga Joint for how it **involves the community**. The referral and friend-invite system is the standout feature — it's baked directly into the booking flow, not bolted on as an afterthought.

> **Note:** Yoga Joint's visual aesthetic (dark/black background, yellow/gold accents, neon lights) is NOT a fit for MP's warm, wellness-focused brand. Borrow the *mechanics*, not the look.

### Key Community Features to Borrow

#### 1. Bring-a-Friend Booking
The single best pattern on the site. When you book a class, you're immediately offered the option to invite a contact to join you in the same session.

```
Booking Confirmation Screen
─────────────────────────────
  ✓ You're booked for Tuesday 9AM Reformer

  ┌─────────────────────────────────────┐
  │  Bring a friend?                    │
  │  Invite someone to join you — their │
  │  first class is free.               │
  │                                     │
  │  [Choose from contacts]             │
  │  [Share via SMS / WhatsApp]         │
  └─────────────────────────────────────┘
```
- Offer appears on the booking confirmation screen (not a separate flow)
- System tries to seat invited friend next to the referrer on the reformer
- Friend gets their first class free — zero friction to accept

**→ Apply to MP:** Post-booking confirmation screen should include a "Bring someone" prompt. Pre-fill a shareable link tied to the inviter's account for tracking. First-class-free offer for the invited friend.

---

#### 2. Nudge Mechanic
If the referred friend hasn't confirmed, the referrer gets a notification and a one-tap "Give them a nudge" prompt — a friendly SMS/WhatsApp follow-up is sent automatically.

**→ Apply to MP:** 24h after invite sent without confirmation → push/SMS to referrer: "Your invite to [Name] is still pending — want to send a reminder?"

---

#### 3. Referral Credit System
- Referrer earns studio credit ($100 in YJ's case) when referred friend completes a paid booking
- Credit is flexible: usable toward membership dues, class packs, retail, workshops, retreats

**→ Apply to MP:** Referral credit redeemable against classes, membership dues, or retail (gift cards, sauna sessions). Credit accumulates in-app wallet visible on client profile.

---

#### 4. Schedule Page Design Pattern
While the dark aesthetic doesn't fit MP, the **schedule layout itself is excellent**:

```
[ Classes ]  [ Workshops ]
─────────────────────────────────────────────
Charlotte Park  |  Green Hills          ← location tabs

Tuesday, March 10th

┌──────────────────────┐  ┌──────────────────────┐
│  [full-bleed photo]  │  │  [full-bleed photo]   │
│  Tue Mar 10 · 9:00AM │  │  Tue Mar 10 · 10:30AM │
│                      │  │                       │
│  GROUP REFORMER      │  │  PRIVATE SESSION      │
│  Kelli Kreuser       │  │  Ruby Ramdhan         │
│         [BOOK CLASS] │  │          [BOOK CLASS] │
└──────────────────────┘  └──────────────────────┘

Wednesday, March 11th
...
```
- Date as section header, then cards grouped below
- 2-column grid on desktop, single column on mobile
- Full-bleed photo card with time, class type (ALL CAPS), instructor, and inline book button
- "BOOK CLASS" button inside the card — no navigating away

**→ Apply to MP:** Use this exact schedule layout pattern. Swap dark background for MP's warm linen. Replace yellow CTA with MP Terracotta. Class type in MP's Poppins Thin ALL CAPS headline style.

---

## 4. New York Pilates (`newyorkpilates.com`)

### Why It's Relevant
The most direct competitor analog — reformer Pilates studio, multi-location, premium market. Strong on social proof mechanics and location-toggling.

> **Note:** NYP leans fashion-forward and edgy (chrome Y2K logo, tattooed models, bold purple brand, NYC vibe). Marathon Pilates is **health and wellness focused** — warmer, more inclusive, less aspirational-trendy. Borrow the *UX patterns*, not the visual tone.

### Key Patterns to Borrow

#### 1. Real-Time Social Proof Toasts
NYP displays live activity notifications in the bottom-left corner as you browse — cycling through different types:

```
┌────────────────────────────────────────────┐
│ [avatar] Sidney signed in to a class with  │
│          Marigel Fernandez at Flatiron     │
│          about 47 seconds ago              │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ 🏷  3,243 students have booked at          │
│     New York Pilates today!                │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ [photo] Emily purchased Intro Offer!       │
│         Hamptons Reformer · $149           │
│         about 1 minute ago                 │
└────────────────────────────────────────────┘
```
Three toast types:
- **Individual sign-in:** "[Name] signed in to [class] with [instructor] at [location]"
- **Social aggregate:** "X students have booked today"
- **Purchase activity:** "[Name] purchased [offer] — [time] ago"

**→ Apply to MP:** Use sparingly — MP is a small studio, so aggregate counts ("12 people booked this week") are more honest than artificially frequent individual toasts. Show on homepage and booking flow only.

---

#### 2. Location Toggle on Pricing + Schedule
NYP uses a clean two-option toggle to switch between their NYC and Hamptons locations:

```
[ Charlotte Park ●]  [ Green Hills ]
```
- Compact, inline — no full page reload
- Pricing, schedule, and availability all update in place

**→ Apply to MP:** Location toggle on schedule, booking, and any location-specific content. Charlotte Park / Green Hills persistent across screens, saved to user profile.

---

#### 3. Scarcity on Membership Cards
NYP displays live inventory counts on limited membership offers:

```
┌──────────────────────────────┐
│  Annual Unlimited            │
│  $199/mo billed annually     │
│                              │
│  0 Memberships Left today    │  ← live scarcity counter
│  [BUY NOW]                   │
└──────────────────────────────┘
```

**→ Apply to MP:** If MP ever runs limited intro offers or promo pricing, show "X spots remaining" on the offer card. Keep honest — only show when genuinely limited.

---

#### 4. Instructor Credentialing Copy
NYP leads with instructor quality as a trust signal: "400+ hours certified | Chosen by 180,000+ New Yorkers." Instructor credentials are prominent, not buried.

**→ Apply to MP:** Each instructor card should surface their CPI/CET credentials and years of experience. Ruby's "CPI, CET" should be prominent in her profile. On the booking flow, show the instructor's cert level next to their name.

---

#### 5. Two-CTA Button Pair in Nav
NYP's nav has both "BUY CLASSES" and "BOOK CLASS" as separate top-right buttons — distinguishing the purchase path from the booking path.

```
Nav: [EXPLORE ☰]   [NYP logo]   [BUY CLASSES]  [BOOK CLASS]
```

**→ Apply to MP:** Consider "BUY CREDITS" and "BOOK CLASS" as separate nav CTAs, especially for non-members who need to buy before they can book.

---

## 5. Synthesis — What to Build

### Dominant Aesthetic: Pvolve
The Marathon Pilates brand already *is* Pvolve's color language. Apply Pvolve's visual system as the base:
- Warm linen/sandstone backgrounds
- Terracotta active states + CTAs
- Clean, editorial typography (mixed case in UI)
- Content-first, photo-forward cards
- Generous whitespace

### Organizational Structure: Jillian Michaels
Borrow JM's *how to organize a lot of content* playbook:
- Category tiles for service entry points (Reformer / Private / Sauna / Cold Plunge)
- Section-based homepage with "Just Added", "Continue Watching", curated shelves
- 3-tab sub-nav inside content screens

### Community Mechanics: Yoga Joint
Borrow YJ's *bring-a-friend-to-class* loop:
- Post-booking friend invite with free first class
- Referral credit wallet visible in client profile
- Nudge notifications for pending invites
- Schedule laid out as date-grouped full-bleed photo cards

### Social Proof + UX Patterns: New York Pilates
Borrow NYP's *trust and conversion* patterns (adapted for smaller studio scale):
- Real-time booking toasts (aggregate counts, not spammy individual alerts)
- Location toggle (Charlotte Park / Green Hills) persistent across all screens
- Instructor credentials surfaced in booking flow
- Dual nav CTAs: "BUY CREDITS" + "BOOK CLASS"

---

## 6. What NOT to Borrow

| Pattern | Source | Reason to Skip |
|---------|--------|----------------|
| Dark/black backgrounds | Yoga Joint | Opposite of MP's warm wellness aesthetic |
| Yellow/neon accent colors | Yoga Joint | Clashes entirely with MP palette |
| Bold red accent | JM | Clashes with MP brand palette |
| High-energy hero + dark overlays | JM | Too intense for "Move + Restore" positioning |
| ALL CAPS throughout UI | JM | MP brand uses ALL CAPS for headlines only |
| Pill-shaped primary buttons | — | MP brand spec: rectangular, max 4px radius |
| Fashion-forward / edgy editorial | NYP | MP is health & wellness, not NYC fashion scene |
| Chrome Y2K logo / trendy type | NYP | MP brand is grounded, natural, earthy |
| Aggressive popup cadence | NYP | NYP fires 3+ popups per visit — too disruptive |

---

## 8. Side-by-Side Color Alignment

| Pvolve Color | Role | Marathon Pilates Match |
|--------------|------|------------------------|
| Warm off-white `~#F5F1EC` | Background | Sandstone `#DDD1BD` / surface-offwhite |
| Rust/terracotta active | Accent | Terracotta `#A76E58` ✅ |
| Near-black `#1A1A1A` | Text | Deep Earth `#302D27` ✅ |
| Medium gray | Secondary text | `#7A7570` (text-secondary token) |

The brand palettes are nearly identical in intent — this makes Pvolve the strongest single reference for the Marathon Pilates platform.
