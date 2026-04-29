# Marathon Pilates Platform — Full Context for Jazz

> **For Jazz (studio manager):** This document gives you complete context to continue building and managing this platform. Read it top to bottom once, then use it as a reference. When working with Claude, paste the relevant sections into your conversation to restore context instantly.

Last updated: 2026-04-29

---

## What We Built

A custom booking, membership, and content platform for Marathon Pilates — built to replace Arketa and create a fully owned, studio-branded digital experience.

**Live URL:** https://marathon-pilates.vercel.app  
**Beta password:** `marathon2026beta` (change this before you share with clients)  
**GitHub repo:** https://github.com/adrianwalther/marathon-pilates  
**Supabase project:** vvqeacukwsvbgixabdef.supabase.co

The platform is **not yet live to the public.** It's locked behind a password gate for beta testing. No real client data has been imported yet.

---

## The Studio (Context for Claude)

- **Owner:** Ruby Ramdhan (CPI, CET)
- **Brand:** "Move + Restore" — inclusive, judgment-free
- **Two Nashville locations:**
  - Charlotte Park — group reformer + private sessions
  - Green Hills — **private and duets only** (no group reformer)
- **Services:** Group Reformer, Private (solo/duet/trio), Sauna (Sunlighten mPulse), Cold Plunge (Plunge brand), Contrast Therapy, Neveskin, Teacher Training, On-Demand
- **Current booking system:** Arketa (group classes) — to be replaced by this platform
- **Payment:** Stripe (live mode — real charges)
- **HSA/FSA accepted**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, React |
| Database | Supabase (Postgres + Auth + RLS) |
| Hosting | Vercel (auto-deploys from GitHub `main` branch) |
| Payments | Stripe (live mode) |
| Video streaming | Bunny.net Stream (Library ID: 620844) — currently expired trial, needs reactivation |
| Rate limiting | Upstash Redis |
| Voice (Build a Class) | ElevenLabs (Rachel voice, Starter plan) |
| AI text (Build a Class) | Anthropic Claude API |
| AI images (Build a Class) | OpenAI DALL-E 3 |
| Payroll | Gusto (not yet activated) |

---

## How to Deploy

1. Push code to `main` branch on GitHub
2. Vercel auto-builds and deploys — usually takes 60–90 seconds
3. Check https://vercel.com/adrianwalthers-projects/marathon-pilates for build status

**Never push directly to production** without testing locally first:
```bash
cd src/web
npm run dev   # runs at localhost:3000
```

---

## Key Pages

| Page | URL | Notes |
|------|-----|-------|
| Login | /login | Has looping video placeholder (left panel) |
| Client dashboard | /dashboard | Main client hub |
| Schedule | /dashboard/schedule | Book group + amenity sessions |
| Membership | /dashboard/membership | Buy/manage memberships & packs |
| On Demand | /dashboard/on-demand | Video library + "Build a Class" AI generator |
| Book private | /dashboard/book-private | Request private/duet/trio session |
| Admin | /admin | Studio staff only — role-gated |
| Admin payroll | /admin/payroll | Instructor pay calculation |
| Admin CRM | /admin/crm | Leads, automations, broadcasts |
| Beta gate | /beta-gate | Password screen — shown to everyone until launched |

---

## Pricing (Confirmed with Ruby)

### Memberships (monthly subscriptions)
| Plan | Price |
|------|-------|
| Unlimited | $289/mo |
| 8-Class Monthly | $224/mo |
| 4-Class Monthly | $128/mo |
| On Demand | $10/mo |

### Class Packs (one-time)
| Pack | Price |
|------|-------|
| Drop-in | $40 |
| 5-Class Pack | $175 |
| 10-Class Pack | $330 |

### Amenity Packs (prices TBD — confirm with Ruby before launch)
Sauna single, Sauna 5-pack, Cold Plunge single, Cold Plunge 5-pack, Contrast single

---

## Payroll Rates (Confirmed)

| Type | Rate |
|------|------|
| Group class — 0–4 clients | $30 flat |
| Group class — 5–7 clients | $48 flat |
| Group class — 8 clients (full) | $58 flat |
| Solo private | $45–$65 (varies by seniority) |
| Duet private | $40/person ($80 total) |
| Trio private | $35/person ($105 total) |
| Internal event (in-house) | $75 flat |
| External event (off-site) | $100 flat |
| Social content creation | $25/hr |
| Front desk | $18/hr |
| Susan LeGrand | $1,000/period, semi-monthly |

---

## Role Hierarchy (Confirmed)

| Role | Who | Access |
|------|-----|--------|
| `owner` | Ruby, Adrian | Everything — revenue, MRR, Stripe payouts, full business metrics |
| `admin` | Jazz, Susan LeGrand | Full operations — schedule, users, payroll, CRM. No raw revenue. |
| `manager` | Front desk + sales staff | Schedule view, client check-ins, booking management, CRM (leads/contacts). No payroll. No revenue. |
| `instructor` | All trainers | Their own schedule + payroll view |
| `client` | Studio members | Booking, membership, on-demand |

> ⚠️ **`owner` role is not yet implemented in code** — planned for a future sprint. Currently Ruby and Adrian are set to `admin`.
> ⚠️ **`manager` permissions need updating** — currently has `payroll_edit: true` which is wrong for front desk/sales. Needs to be updated to check-in, booking management, and CRM access only.
> The `front_desk` role is retired — `manager` covers that function.

---

## Database Tables (Key Ones)

| Table | What It Stores |
|-------|---------------|
| `profiles` | All users — role field determines access (`admin`, `manager`, `instructor`, `front_desk`, `client`) |
| `scheduled_sessions` | Classes on the calendar (both locations) |
| `bookings` | Client bookings for sessions |
| `memberships` | Active/past membership records |
| `credits` | Group + amenity credit balances |
| `on_demand_classes` | Video library entries |
| `instructor_payroll` | Pay records per session |

---

## Pending Before Launch

### Must-do
- [ ] Re-activate Bunny.net with paid plan + re-upload 23 videos + re-seed URLs in DB
- [ ] Activate Gusto for payroll
- [ ] Set Ruby's Supabase account to `admin` role  
  - Her UID: `3a6cd143-6bae-4ba1-8d21-f67d5a50b957`
  - SQL: `UPDATE profiles SET role = 'admin' WHERE id = '3a6cd143-6bae-4ba1-8d21-f67d5a50b957';`
- [ ] Confirm amenity pricing with Ruby (sauna, cold plunge, contrast)
- [ ] Set up email notifications (Ruby to choose: Google Workspace or Resend)
- [ ] Point app.marathonpilates.com → Vercel

### Waiting on Ruby
- [ ] Hero video footage (for login page left panel)
- [ ] Email provider decision
- [ ] Beta client list
- [ ] Two-location Stripe account decision

### Waiting on Susan LeGrand
- [ ] Data migration from Arketa (active subscriptions, credits, booking history)
- [ ] Availability: ~2–3 weeks before launch

### Security (do on launch day)
- [ ] Rotate all API keys and secrets (Stripe, Supabase, Stripe webhook, Anthropic, Bunny, Upstash)
- [ ] Mark all Vercel env vars as Sensitive
- [ ] Enable 2FA on all service accounts

---

## How to Use Claude for This Project

1. Open a new Claude conversation (claude.ai or Claude desktop app)
2. Start with: *"I'm Jazz, studio manager at Marathon Pilates. I'm continuing the build of our custom booking platform. Here's the context:"* — then paste this document
3. For Pilates methodology questions, use the `/pilates-expert` skill
4. Claude has MCP integrations for Supabase, Vercel, and GitHub — these allow it to query the DB, trigger deploys, and read code directly

**Key things Claude knows about this project:**
- Full tech stack and architecture
- All pricing and payroll rates
- Security decisions and why they were made
- The SUBSCRIPTIONS.md file tracks all service costs and the pre-launch upgrade checklist

---

## Files to Know

```
Marathon Pilates Platform/
├── SUBSCRIPTIONS.md        ← All service costs + Pre-Launch Upgrade Checklist
├── HANDOFF/                ← You are here
│   ├── 00-PLATFORM-OVERVIEW.md   ← This file
│   ├── 01-ACCOUNT-MIGRATION.md   ← Move accounts to business ownership
│   └── 02-SALE-READINESS.md      ← What's needed to sell the business/platform
├── specs/                  ← 17 detailed feature specs
├── src/web/                ← All Next.js source code
│   ├── app/                ← Pages and API routes
│   ├── supabase/migrations/← Database schema history
│   └── middleware.ts       ← Auth + beta gate
└── design/                 ← Brand guidelines, prototypes, assets
```
