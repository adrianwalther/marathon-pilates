# Spec 03 — Tech Stack
*Marathon Pilates Platform | Created: 2026-03-09*

---

## Guiding Principles

1. **Move fast, don't over-engineer early** — pick proven tools, not bleeding-edge
2. **One codebase where possible** — reduces maintenance burden
3. **Own the data** — no lock-in to platforms that hold your client records hostage
4. **Mobile-first** — the app is a first-class citizen, not an afterthought
5. **Stripe for payments** — best developer experience, standard rates, no lock-in

---

## Recommended Stack

### Frontend — Web (Booking Widget + Admin Dashboard)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js** (React) | Industry standard, great SEO, API routes built in, huge ecosystem |
| Language | **TypeScript** | Catches errors early, scales well for a growing codebase |
| Styling | **Tailwind CSS** | Fast to build, easy to match Marathon Pilates brand |
| Component library | **shadcn/ui** | Modern, accessible, customizable, not opinionated |
| State management | **Zustand** or React Query | Lightweight, avoids Redux complexity |

**Why Next.js:** It handles the booking widget (embedded on Wix site), the client-facing booking pages, and the admin dashboard — all in one repo. Server-side rendering means the schedule is SEO-friendly and loads fast.

### Mobile App

| Layer | Choice | Why |
|---|---|---|
| Framework | **React Native + Expo** | One codebase → iOS + Android. Expo handles builds, OTA updates, push notifications |
| Language | **TypeScript** (same as web) | Shared types and logic between web and mobile |
| Navigation | **Expo Router** | File-based routing, pairs well with Next.js conventions |
| UI | **NativeWind** (Tailwind for RN) | Same design system as the web app |

**Why React Native/Expo:** The team (eventually) knows one language. Logic for booking, client profiles, and notifications can be shared between web and mobile. Expo handles the hardest parts: push notifications, app store submissions, over-the-air updates.

**Why NOT a native Swift/Kotlin app:** Double the codebase, double the developers, no real UX benefit for this use case.

### Backend / API

| Layer | Choice | Why |
|---|---|---|
| Runtime | **Node.js** | Same language as frontend — one team, one language |
| Framework | **Hono** (or Express) | Lightweight, fast, TypeScript-native |
| API style | **REST** (with potential GraphQL later) | Simpler to start, easier to integrate with Wix and third parties |
| Auth | **Clerk** or **Auth.js** | Handles magic links, social login, session management — don't build auth from scratch |

### Database

| Layer | Choice | Why |
|---|---|---|
| Primary DB | **PostgreSQL** (via Supabase or Railway) | Relational, mature, great for complex queries (bookings, schedules, memberships) |
| ORM | **Prisma** | Type-safe, great migrations, pairs perfectly with TypeScript |
| Real-time | **Supabase Realtime** or Pusher | For live availability updates (spots remaining, waitlist changes) |
| File storage | **Supabase Storage** or AWS S3 | Profile photos, waiver documents |

**Why PostgreSQL:** Booking systems are inherently relational — classes, clients, bookings, credits, memberships all have complex relationships. A relational DB handles this naturally. NoSQL would create headaches for this domain.

**Why Supabase:** Gives you PostgreSQL + auth + storage + real-time + a dashboard — hosted, no DevOps required early on. Can migrate to raw Postgres on AWS later if needed.

### Payments

| Layer | Choice | Why |
|---|---|---|
| Payment processor | **Stripe** | Best API in the industry, handles memberships/subscriptions, Apple Pay/Google Pay built in, standard rates |
| Subscription billing | **Stripe Billing** | Recurring memberships, failed payment retry, dunning |
| In-person (front desk) | **Stripe Terminal** | Card reader for walk-ins |

### Communications

| Layer | Choice | Why |
|---|---|---|
| Email | **Resend** (or SendGrid) | Modern email API, great deliverability, React Email for templates |
| SMS | **Twilio** | Industry standard, reliable, good webhook support |
| Push notifications | **Expo Push** (wraps APNs + FCM) | Handles iOS + Android in one call |
| Email templates | **React Email** | Design email templates in React — consistent with the rest of the stack |

### Wix Integration

The Marathon Pilates site is on Wix. Options for embedding the booking experience:

| Approach | Pros | Cons |
|---|---|---|
| **iFrame embed** (v1) | Fast to ship, works on any site | Limited brand control, scroll issues |
| **Wix Velo + API** (v2) | Native Wix feel, more control | Requires Wix Velo development |
| **Custom Next.js page on subdomain** (recommended) | Full control, fast, SEO-friendly | Requires `book.marathonpilates.com` subdomain |

**Recommendation:** Start with a subdomain (`book.marathonpilates.com`) that is fully branded to match the site. Link from the Wix site with "Book Now" buttons. This gives complete UX control without being constrained by Wix's embedding limitations.

### Infrastructure / Hosting

| Service | Choice | Why |
|---|---|---|
| Web hosting | **Vercel** | Optimized for Next.js, global CDN, zero-config deploys |
| Backend / DB | **Supabase** | Managed Postgres + auth + storage |
| Mobile builds | **Expo EAS** | Managed iOS/Android builds, OTA updates |
| Domain | `marathonpilates.com` (existing) + `book.marathonpilates.com` | |
| CI/CD | **GitHub Actions** | Free, integrates with Vercel and Supabase |

### Video (On-Demand)

| Layer | Choice | Why |
|---|---|---|
| Video hosting & delivery | **Mux** | Adaptive streaming, per-minute pricing, native analytics (watch time, drop-off), clean API for Next.js + React Native |
| Upload flow | Mux Direct Uploads | Videos uploaded via admin dashboard go straight to Mux — no intermediate storage needed |
| Playback (web) | **Mux Player** (React component) | Drop-in player, handles adaptive bitrate, resume position, chapters |
| Playback (mobile) | **Mux Player React Native** | Same player, consistent experience across app |
| Offline downloads | Expo FileSystem + Mux download URLs | Members can save videos to device for offline use |

**How Mux fits into the stack:**
- Admin uploads a video file via the dashboard → goes directly to Mux via a secure upload URL
- Mux processes it (transcodes to multiple quality levels for adaptive streaming)
- The platform stores the Mux `playbackId` in the database — not the video file itself
- When a member plays a video, the player fetches the stream directly from Mux's CDN
- No video files ever touch Supabase storage or Vercel — keeps infrastructure clean and costs predictable

**Cost:** ~$0.015/min stored + ~$0.005/min delivered. A 100-video library averaging 30 min = ~$45/mo storage. Delivery cost scales with how many members are watching — roughly $0.30 per member per full video watched.

### Monitoring & Analytics

| Tool | Use |
|---|---|
| **Sentry** | Error tracking (web + mobile) |
| **PostHog** | Product analytics (booking funnel, feature usage) |
| **Vercel Analytics** | Web performance |
| **Mux Data** | Video analytics (plays, watch time, completion rate, drop-off points) |

---

## Data Model (High-Level)

```
User (client)
  ├── Profile (goals, health notes, preferences)
  ├── Memberships[]
  ├── Credits[]
  ├── Bookings[]
  ├── CheckIns[]
  ├── Milestones[]
  ├── JournalEntries[]
  └── Notifications[]

Service
  ├── Group Class | Private Session | Amenity Session
  ├── ServiceType (reformer, mat, sauna, cold plunge)
  └── Instructor (for classes/privates) | Resource (for amenities)

ScheduledClass
  ├── Service
  ├── Instructor
  ├── Room / Resource
  ├── StartTime, EndTime
  ├── MaxCapacity
  └── Bookings[]

Booking
  ├── User
  ├── ScheduledClass (or multiple — for bundles)
  ├── Status (confirmed | waitlisted | cancelled | no-show)
  ├── CreditUsed | PaymentIntent
  └── CancelledAt, LateCancel flag

Resource (Sauna, Cold Plunge unit)
  ├── Name, Type
  ├── MaxConcurrentOccupancy
  ├── TurnoverBufferMinutes
  └── AvailabilitySlots[]

Membership
  ├── User
  ├── Plan (name, credits per period, amenity access)
  ├── BillingCycle
  ├── Status (active | paused | cancelled)
  └── StripeSubscriptionId

OnDemandVideo
  ├── title, description, tags
  ├── instructorId
  ├── classType, level, durationSeconds
  ├── muxPlaybackId        → used by the player to stream the video
  ├── muxAssetId           → used by admin to manage the video in Mux
  ├── thumbnailUrl
  ├── status (draft | published | archived)
  └── publishedAt

VideoWatchEvent
  ├── userId
  ├── videoId
  ├── watchedSeconds
  ├── completed (boolean)
  └── lastWatchedAt        → used for "continue watching"
```

---

## Development Phases

### Phase 1 — Core (MVP)
- Client auth (sign up, login, magic link)
- Class schedule + booking (group classes)
- Credit / membership purchase via Stripe
- Admin dashboard: class management, client roster, check-in
- Email notifications (confirmation, reminders)
- Wix integration (subdomain or embed)

### Phase 2 — Wellness Layer
- Amenity (sauna / cold plunge) booking with resource management
- Turnover buffer logic
- Class + amenity bundle checkout
- Membership tiers with amenity access

### Phase 3 — Client Journey
- Milestone system
- Progress dashboard (client app)
- Instructor notes
- Automated lifecycle messaging (SMS + email)
- Wellness journal

### Phase 4 — Mobile App
- React Native / Expo app
- Push notifications
- QR code check-in
- App Store + Google Play submission

### Phase 5 — Polish & Growth
- On-demand video library (Mux integration, admin upload, member playback)
- Referral program
- Loyalty / rewards
- Advanced analytics dashboard
- Review collection

---

## Open Questions / Decisions Needed

- [ ] **Build vs. buy the backend:** Full custom Node backend vs. Supabase Edge Functions + database only?
- [ ] **Auth approach:** Clerk (easier) vs. Auth.js (more control) vs. Supabase Auth (already in stack)?
- [ ] **Wix integration v1:** iFrame embed or subdomain? (Affects Phase 1 timeline)
- [ ] **Mobile timeline:** Does the app ship with Phase 1, or is web-first and app comes in Phase 4?
- [ ] **Who is developing this?** Solo dev? Agency? Internal team? (Affects stack complexity decisions)
- [ ] **Budget range for infrastructure?** (Supabase + Vercel + Expo is ~$50–200/mo to start; scales with usage)

**Answered from site research:**
- ✅ **Current platform:** Arketa — so this is a migration, not a greenfield launch. Client data exists in Arketa and needs to be migrated.
- ✅ **Multi-location:** Required from day 1 — Charlotte Park + Green Hills (Nashville)
- ✅ **Private booking is email-based today** — high-priority fix; online private session self-booking is Phase 1, not Phase 2
- ✅ **Neveskin** is a service type that needs to be supported (aesthetic treatments — different booking flow from Pilates/wellness)

---

## Cost Estimate (Monthly, at Launch)

| Service | Cost |
|---|---|
| Vercel (Pro) | $20/mo |
| Supabase (Pro) | $25/mo |
| Twilio (SMS) | ~$20–50/mo depending on volume |
| Resend (email) | ~$20/mo |
| Expo EAS (mobile builds) | $29/mo |
| Sentry | Free tier to start |
| Mux (video) | ~$45–80/mo (storage + delivery, scales with usage) |
| **Total infrastructure** | **~$160–225/mo** |
| Stripe processing | 2.9% + $0.30 per transaction (standard) |

Compare: Mindbody costs $400–800/mo + 2.75–3.5% processing. A custom build pays for itself.

*Mux costs scale with video library size and member viewing volume — budget estimate assumes ~100 videos and moderate usage.*

---

*This is a living document. Stack decisions should be confirmed before development begins.*
