# Marathon Pilates Platform

A custom booking, membership, and content platform for Marathon Pilates — built to replace Arketa. Currently in private beta.

**Live URL:** https://marathon-pilates.vercel.app | **Beta password:** `marathon2026beta`
**Supabase project:** `vvqeacukwsvbgixabdef`

---

## The Studio

- **Owner:** Ruby Ramdhan (CPI, CET)
- **Brand:** "Move + Restore" — inclusive, judgment-free
- **Two Nashville locations:**
  - Charlotte Park — group reformer + private sessions
  - Green Hills — **private and duets only** (no group reformer)
- **Services:** Group Reformer, Private (solo/duet/trio), Sauna, Cold Plunge, Contrast Therapy, Neveskin, Teacher Training, On-Demand
- **Payments:** Stripe (live mode — real charges). HSA/FSA accepted.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, React |
| Database | Supabase (Postgres + Auth + RLS) |
| Hosting | Vercel — auto-deploys from `main` branch |
| Payments | Stripe (live mode) |
| Video | Bunny.net Stream (Library ID: 620844) — **expired, needs reactivation at launch** |
| Rate limiting | Upstash Redis |
| AI voice | ElevenLabs (Rachel voice) |
| AI text | Anthropic Claude API |
| AI images | OpenAI DALL-E 3 |
| Payroll | Gusto (not yet activated) |

---

## Role Hierarchy

| Role | Who | Access |
|------|-----|--------|
| `owner` | Ruby, Adrian | Everything incl. revenue *(not yet built — uses admin for now)* |
| `admin` | Jazz, Susan LeGrand | Full operations — schedule, users, payroll, CRM. No revenue. |
| `manager` | Front desk + sales | Schedule view, client check-ins, CRM, own payroll view. No editing. |
| `instructor` | Trainers | Own schedule + own payroll view only |
| `client` | Studio members | Booking, membership, on-demand |

---

## Pricing (Confirmed with Ruby)

| Plan | Price |
|------|-------|
| Unlimited membership | $289/mo |
| 8-Class Monthly | $224/mo |
| 4-Class Monthly | $128/mo |
| On Demand | $10/mo |
| Drop-in | $40 |
| 5-Class Pack | $175 |
| 10-Class Pack | $330 |

---

## Payroll Rates (Confirmed)

| Type | Rate |
|------|------|
| Group class — 0–4 clients | $30 flat |
| Group class — 5–7 clients | $48 flat |
| Group class — 8 clients (full) | $58 flat |
| Solo private | $45–$65 (varies by seniority) |
| Duet private | $40/person |
| Trio private | $35/person |
| Internal event | $75 flat |
| External event | $100 flat |
| Social content | $25/hr |
| Front desk | $18/hr |
| Susan LeGrand | $1,000/period, semi-monthly |

---

## Key Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | All users + roles |
| `scheduled_sessions` | Calendar classes (both locations) |
| `bookings` | Client bookings |
| `memberships` | Active/past membership records |
| `credits` | Group + amenity credit balances |
| `on_demand_classes` | Video library |
| `instructor_payroll` | Pay records per session |

---

## Key Pages

| Page | URL |
|------|-----|
| Client dashboard | /dashboard |
| Schedule | /dashboard/schedule |
| Membership | /dashboard/membership |
| On Demand + Build a Class | /dashboard/on-demand |
| Book private | /dashboard/book-private |
| Admin portal | /admin |
| Admin payroll | /admin/payroll |
| Admin CRM | /admin/crm |

---

## Pending Before Launch

- [ ] Reactivate Bunny.net + re-upload 23 videos + re-seed `video_url` in DB
- [ ] Activate Gusto for payroll
- [ ] Confirm amenity pricing with Ruby (sauna, cold plunge, contrast)
- [ ] Set up email notifications (Ruby to decide: Google Workspace or Resend)
- [ ] Point app.marathonpilates.com → Vercel
- [ ] Hero video footage from Ruby (login page left panel)
- [ ] Data migration from Arketa (Susan LeGrand)
- [ ] Rotate all API keys + enable 2FA on launch day
- [ ] Migrate all service accounts to Marathon Pilates business accounts (see HANDOFF/01-ACCOUNT-MIGRATION.md)

---

## HANDOFF Docs

```
HANDOFF/
├── 00-PLATFORM-OVERVIEW.md   ← Full context reference
├── 01-ACCOUNT-MIGRATION.md   ← Move services to business accounts
├── 02-SALE-READINESS.md      ← Business sale prep
└── 03-CLAUDE-SETUP.md        ← How to set up Claude Code (for Jazz)
```

---

## Important Rules

- **Never change pricing or payroll rates** without confirming with Ruby first
- **Never push to `main` without testing locally** (`cd src/web && npm run dev`)
- **Stripe is in live mode** — real charges happen
- **On Demand is intentionally offline** until Bunny.net is reactivated at launch
- **To disable the beta gate at launch:** remove `BETA_PASSWORD` from Vercel env vars
