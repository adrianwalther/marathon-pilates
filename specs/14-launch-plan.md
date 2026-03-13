# Spec 14 — Launch Plan
*Marathon Pilates Platform | Created: 2026-03-10*

---

## Overview

This spec covers how the new platform goes from built to live — phased development, beta testing with real clients, the cutover from Arketa, and what "done" looks like on launch day.

The goal is a smooth transition that clients barely notice — except that everything is easier.

---

## Guiding Principles

- **No big bang launch.** Roll out in phases so problems surface early, with a small group, before all clients are affected.
- **Arketa stays live until we're confident.** No hard cutover until the new platform has been tested under real conditions.
- **Clients first.** Every phase gate asks: is this ready for a real client to use without help?
- **Ruby and Susan approve each phase before advancing.** They know the studio; they catch what specs miss.

---

## Phase Overview

```
Phase 0 — Foundation (internal only)
  ↓
Phase 1 — Core Booking (private beta — staff + select clients)
  ↓
Phase 2 — Full Feature Beta (wider beta — ~20–30 clients)
  ↓
Phase 3 — Soft Launch (all clients, Arketa still available)
  ↓
Phase 4 — Full Launch (Arketa retired)
```

---

## Phase 0 — Foundation

**Who:** Development team only. No clients.

**Goal:** Core infrastructure working end-to-end before any real users touch it.

### Milestones

- [ ] Supabase database provisioned + schema deployed
- [ ] Clerk auth working (sign up, log in, roles)
- [ ] Stripe connected (test mode — memberships, packs, drop-ins)
- [ ] Vercel deployment live at `app.marathonpilates.com` (staging)
- [ ] Basic class schedule rendering from database
- [ ] Booking flow working end-to-end (test cards only)
- [ ] Email sending working (Resend + React Email templates)
- [ ] SMS sending working (Twilio)
- [ ] Admin dashboard accessible (Ruby + Susan logins)
- [ ] Expo app building and running on real devices (iOS + Android)

**Exit gate:** Ruby and Susan can log into the admin dashboard, create a class, and book it themselves as test clients — end to end, on real devices.

---

## Phase 1 — Core Booking Beta

**Who:** Staff only — Ruby, Susan, all instructors, front desk.

**Goal:** The studio team uses the platform for their own real workflows before any clients are involved.

### What's Live

- Client sign-up and login
- Class schedule (both locations)
- Class booking + cancellation
- Waitlist
- Memberships + credit packs (Stripe live mode)
- Basic admin dashboard (schedule management, client roster)
- Booking confirmation emails
- Class reminders (email + SMS)
- Instructor mode (roster, check-in, private session requests)

### What's Not Yet Live

- On-demand video
- Gift cards
- Behavioral personalization / "For You"
- Full journey / milestone system
- Mobile app on App Store (TestFlight / internal testing only)

### Staff Testing Tasks

Each staff member has specific things to test:

**Ruby:**
- Create and edit a class
- View the admin dashboard home screen
- Look up a client
- Issue a manual credit
- Review a pay period summary

**Susan:**
- Check in a class roster
- Add a walk-in client
- Cancel a class and verify credits returned
- View the notification log

**Each instructor:**
- Log into instructor mode
- Review their teaching schedule
- Open a class roster and check in attendees
- Accept a private session request
- Toggle to client mode and book a class

**Front desk:**
- Check in clients for a class
- Add a walk-in
- Look up a client account

### Exit Gate

- Zero critical booking bugs after 1 full week of staff use
- Ruby and Susan sign off: "We'd be comfortable letting clients in"

---

## Phase 2 — Client Beta

**Who:** ~20–30 hand-picked clients. Ideally a mix of:
- Long-time regulars (know the studio well, forgiving of rough edges)
- Tech-comfortable clients (can give useful feedback)
- New-ish clients (haven't formed deep Arketa habits)

**Goal:** Real clients booking real classes through the new platform, with Arketa still available as a fallback.

### How to Recruit Beta Clients

```
Email subject: "Want to try something new?"

"Hi [Name],

We're building a new booking experience for Marathon Pilates —
and we'd love your help testing it before we launch it to everyone.

You'll get early access to some new features (including online
private session booking — finally!), and your feedback will
directly shape how the platform works.

Interested? Reply to this email and we'll send you an invite.

— Ruby"
```

Beta clients get a personal onboarding: a short email walkthrough + a direct line to report anything broken (Ruby's or Susan's email, not a support ticket system).

### What's Live in Phase 2

Everything from Phase 1, plus:
- Intake questionnaire
- "For You" personalized recommendations (basic version)
- Journey tab (milestones, streaks)
- Gift cards (purchase + redemption)
- On-demand video (if Mux content is ready)
- Mobile app via TestFlight (iOS) and internal track (Android)

### Feedback Collection

- Weekly check-in email to beta clients: "Anything broken? Anything confusing?"
- Ruby or Susan does a 10-min check-in call with 3–4 beta clients per week
- In-app feedback button (simple: "Something's wrong" → text field → goes to admin inbox)

### Exit Gate

- No critical bugs reported in the last 5 days
- Booking completion rate ≥ 90% (clients start a booking and finish it)
- At least 10 beta clients have used it for 2+ weeks without issues
- Ruby and Susan sign off: "Ready for everyone"

---

## Phase 3 — Soft Launch

**Who:** All clients. Arketa still available.

**Goal:** Full client base migrated to the new platform, with Arketa as a safety net.

### Launch Day Checklist

**Technical:**
- [ ] `app.marathonpilates.com` pointing to production (not staging)
- [ ] Stripe in live mode — confirmed
- [ ] All email templates tested and rendering correctly
- [ ] SMS sending confirmed (real phone numbers)
- [ ] Push notifications firing correctly on iOS + Android
- [ ] App Store listing live (iOS App Store + Google Play)
- [ ] Admin dashboard accessible from both locations
- [ ] Stripe Terminal readers set up at front desk (if applicable)
- [ ] WordPress "Book Now" links updated to new platform URLs
- [ ] GTM / GA4 tracking confirmed on new domain

**Communications:**
- [ ] Client announcement email sent (see below)
- [ ] Instagram / social post published
- [ ] Staff briefed: "If a client has trouble, here's what to say"
- [ ] Front desk has a one-page quick-reference guide

### Client Announcement Email

```
Subject: A better way to book — new platform is live

Hi [Name],

We've been working on something we're really excited about —
a new booking experience built just for Marathon Pilates.

Here's what's new:
✓ Book private sessions online (no more email back-and-forth)
✓ Add sauna or cold plunge right when you book your class
✓ Track your progress and streaks
✓ A Marathon Pilates app — your schedule, always in your pocket

[Download the App] [Book a Class]

Your account, credits, and membership have all been moved over.
Everything is exactly as you left it.

If anything looks off, reply to this email — we're here.

— Ruby & the Marathon Pilates team
```

### During Soft Launch

- Arketa remains live for 30 days as a read-only fallback
- Ruby and Susan monitor the admin dashboard daily
- Any booking issues resolved within 2 hours during studio hours
- Daily bug triage for the first 2 weeks

### Exit Gate

- 80%+ of active clients have logged into the new platform
- No critical issues in the past 7 days
- Ruby confident: "We don't need Arketa anymore"

---

## Phase 4 — Full Launch

**Who:** Everyone. Arketa retired.

### Arketa Retirement

```
[1] Export final data snapshot from Arketa (CSV backup — keep forever)
[2] Cancel Arketa subscription
[3] Remove any remaining Arketa links from WordPress
[4] Set up Arketa redirect (if possible): old Arketa booking URL → app.marathonpilates.com
[5] Keep login credentials on file in case historical data is ever needed
```

### Ongoing After Launch

- Weekly: Ruby reviews admin dashboard metrics (bookings, revenue, fill rates)
- Monthly: Review notification performance (open rates, SMS delivery)
- Quarterly: Review Mux usage and adjust plan if needed
- As needed: Push app updates via Expo EAS (no App Store re-submission required for most updates)

---

## Data Migration

Client data needs to move from Arketa to the new platform before Phase 3. This is a separate workstream — see `15-data-migration.md` (pending Susan's involvement).

At minimum, the migration must include:
- Client names, emails, phone numbers
- Active membership status and billing cycle
- Current credit balances
- Booking history (for milestone calculations — class counts)
- Gift card balances (if any outstanding)

Passwords cannot be migrated (Arketa doesn't expose them). Every client gets a "set your password" email when they first access the new platform.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Client confusion during cutover | Medium | Medium | Clear email, staff briefed, 30-day Arketa overlap |
| Stripe going live with errors | Low | High | Full test-mode coverage before Phase 1; live-mode test with staff in Phase 1 |
| App Store review delay (iOS) | Medium | Medium | Submit app at least 2 weeks before soft launch target |
| Low beta signup rate | Low | Low | Ruby's personal outreach — clients trust her |
| Data migration errors (credits, memberships) | Medium | High | Manual verification of top 20 accounts post-migration; rollback plan |
| Mux content not ready at launch | Medium | Low | On-demand is Phase 2 — not a launch blocker |
| Instructor app issues on older devices | Low | Medium | TestFlight beta with all instructors in Phase 1 |

---

## What "Done" Looks Like

Launch is successful when:

- Every client can book any service — class, private, amenity — without staff help
- Ruby can run the studio for a full week without opening Arketa
- Instructors are checking in classes from their phones
- Private session requests are coming in through the app, not email
- Ruby has visibility into revenue, fill rates, and client activity from her phone
- The studio is running on a platform they own and control

---

## Open Questions / Decisions Needed

- [ ] **Beta client list:** Who does Ruby want to invite for Phase 2? (Recommend she picks 10–15 regulars she trusts)
- [ ] **Launch date target:** Is there a target month or milestone (e.g., before summer, before a specific promotion)?
- [ ] **Data migration:** When is Susan available to work through this? (Drives Phase 3 timing)
- [ ] **App Store assets:** App icon, screenshots, and store description needed — who owns this?
- [ ] **Stripe Terminal:** How many card readers does Ruby want at each location?
- [ ] **Arketa contract:** When does the current Arketa contract renew? (Informs timing pressure)

---

*Next: `15-data-migration.md` — moving client data from Arketa to the new platform*
