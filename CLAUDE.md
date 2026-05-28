# Marathon Pilates Platform

A custom booking, membership, and content platform for Marathon Pilates — built to replace Arketa. Currently in private beta.

**Live URL:** https://marathon-pilates.vercel.app | **Beta password:** `marathon2026beta`
**Supabase project:** `vvqeacukwsvbgixabdef`
**GitHub:** https://github.com/adrianwalther/marathon-pilates

---

## The Studio

- **Owner:** Ruby Ramdhan (CPI, CET)
- **Brand:** "Move + Restore" — inclusive, judgment-free, grounded earth aesthetic
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
| Video | Bunny.net Stream (Library ID: 620844) — expired trial, needs reactivation at launch |
| Rate limiting | Upstash Redis (fails open if unavailable) |
| AI voice | ElevenLabs (Rachel voice) |
| AI text | Anthropic Claude API |
| AI images | OpenAI DALL-E 3 |
| Payroll | Gusto (not yet activated) |

All AI service API keys (Anthropic, OpenAI, ElevenLabs) are configured in Vercel env vars and "Build a Class" is fully functional.

---

## Brand & Design

### Current Brand Guidelines (2026-04, updated)
Brand book lives at `/Users/adrianwalther/Desktop/marathon-pilates/branding/Marathon_Pilates_Brand_Guidelines.pdf`

**Tagline:** Move + Restore
**Aesthetic:** Bright + natural light, organic + minimal, warm earth tones

### Color Tokens (earth palette)

| Token | Hex | Role |
|-------|-----|------|
| `--color-brand` | `#4C5246` | Moss Gray — primary brand, headers |
| `--color-bg-dark` | `#302D27` | Deep Earth — beta gate, login left panel, text primary |
| `--color-cta` | `#A76E58` | Terracotta — primary action buttons |
| `--color-accent` | `#BC9C8E` | Rose Clay — soft accents, streaks, badges |
| `--color-border` | `#DDD1BD` | Sandstone — borders, dividers |
| `--color-bg` | `#FAF7F2` | Warm white — page backgrounds |
| `--color-surface` | `#FFFFFF` | Cards, surfaces |
| `--color-error` | `#C44536` | Earth-toned red — destructive actions |

### Typography
- **Headlines** — Poppins Thin (100), ALL CAPS
- **Subheads** — Raleway Regular, ALL CAPS
- **Body** — Poppins Regular

---

## Role Hierarchy

| Role | Who | UID | Access |
|------|-----|-----|--------|
| `owner` | Ruby, Adrian | Ruby: `3a6cd143-6bae-4ba1-8d21-f67d5a50b957` · Adrian: `63323f3e-3215-4264-ae90-bdb1dc4cd602` | Everything incl. revenue |
| `admin` | Jazz, Susan LeGrand | — | Full operations — schedule, users, payroll, CRM. No revenue. |
| `manager` | Front desk / sales staff | — | Schedule view, client check-ins, CRM, time clock (own hours). No payroll, no instructors. |
| `instructor` | Trainers | — | Own schedule + own payroll view only |
| `client` | Studio members | — | Booking, membership, on-demand |

**Important notes:**
- `front_desk` role is fully retired — removed from codebase 2026-05-27. Use `manager` instead.
- Jazz and Susan are **admin**, not manager. Manager = front desk / sales only.
- `owner` role was added to the `user_role` Postgres enum on 2026-05-27.
- Admin-initiated booking (owner/admin/manager books a client into a session from `/admin/schedule`) **is built and live** ✅ 2026-05-28. See `app/api/admin/bookings/route.ts`.

---

## Beta Plan

- **Beta cohort:** Adrian, Ruby, Jazz only — live Stripe, real bookings, minimal data
- **Beta test client account:** `adrianwalther@me.com` (role: client) — use this to QA client-side flows
- **Strategy:** Validate booking flow on web app first. Build native mobile app as next major phase before public launch.
- **Jazz** still needs to sign up at marathon-pilates.vercel.app

---

## Known Accounts in DB

| Person | Email | Role |
|--------|-------|------|
| Adrian Walther | adrian@marathonpilates.com | owner |
| Ruby Ramdhan | ruby@marathonpilates.com | owner |
| Test client | adrianwalther@me.com | client |

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

## ⚠️ Critical Gotchas (learned the hard way)

### Supabase API keys — NEW format only (legacy JWT keys are DISABLED)
This project has **disabled legacy JWT API keys** (the long `eyJ...` format). You must use the new key format:
- **Publishable** (browser/anon): `sb_publishable_...` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Secret** (server/service-role): `sb_secret_...` → `SUPABASE_SERVICE_ROLE_KEY`

Symptom of a legacy key: API routes fail with `Legacy API keys are disabled`. Vercel (production) already has the new keys; only local `.env.local` is a risk. When editing `.env.local`, do NOT wrap values in quotes from `.env.pulled` carelessly — verify key prefixes.

### The DB has DRIFTED from the migration files — trust the live DB, not `supabase/migrations/`
Verified 2026-05-28 by querying the live database directly:
- **Migration `002_rls_policies.sql` NEVER applied** — it targets a table named `class_sessions`, but the real table is `scheduled_sessions`. It errored/rolled back.
- Therefore the helper functions `is_staff()`, `is_admin()`, `is_instructor()` **do not exist** in the live DB. Do NOT reference them in new policies.
- The ~63 live RLS policies use an inline idiom instead: `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN (...))`. Match this pattern.
- Some functions were edited directly in the Supabase SQL editor and never committed back to the repo (e.g. `book_session` had drifted). **Always verify a function/policy against the live DB before assuming the repo `.sql` is accurate.**

### Booking flow architecture
- All bookings are created by **server API routes using the service-role key** (which bypasses RLS): `app/api/bookings/route.ts` (client self-book, credit/comp), `app/api/admin/bookings/route.ts` (staff books a client), `app/api/webhooks/stripe/route.ts` (paid booking after checkout).
- `book_session(p_session_id, p_client_id, p_amount_paid, p_payment_status, p_stripe_payment_intent_id)` RPC: `SECURITY DEFINER`, params have defaults, **no `auth.uid()` guard** (a previous drifted version had one that broke every server booking — fixed 2026-05-28 via `migrations/fix_book_session_service_role.sql`). EXECUTE is locked to `service_role` only. Inside the function, `status` and `payment_status` must be cast to their enum types (`::booking_status`, `::payment_status`).
- `payment_status` enum includes `credit` (booked via credit/membership) and `included` (complimentary) — added via `migrations/add_payment_status_values.sql`.
- `scheduled_sessions` write policy ("Staff manage sessions", owner+admin) added 2026-05-28 via `migrations/add_scheduled_sessions_write_policy.sql` — without it, staff couldn't add/cancel classes from the UI.

### RESOLVED — owners added to the 25 RLS policies (2026-05-28)
25 live RLS policies gated on role but omitted `'owner'` (tables incl. `bookings`, `payroll_periods`, `payroll_line_items`, `instructor_profiles`, `private_session_requests`, `time_entries`, `waitlist_entries`). Fixed via `migrations/add_owner_to_rls_policies.sql` (23 array-form policies patched by a regex `ALTER POLICY` loop + 2 single-value payroll policies rewritten by hand), verified `still_missing_owner = 0`. **Note:** `profiles.role` is the `user_role` ENUM — when editing role lists use a bare `'owner'` literal (Postgres coerces it) or `'owner'::user_role`, NEVER `::text` (mixing text into a `user_role[]` array errors).

---

## Key Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | All users + roles |
| `scheduled_sessions` | Calendar classes (both locations) |
| `bookings` | Client bookings — foreign key is `client_id` (not `user_id`) |
| `memberships` | Active/past membership records — foreign key is `client_id` |
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
| Build a Class | /dashboard/generate-class |
| Book private | /dashboard/book-private |
| Admin portal | /admin |
| Admin payroll | /admin/payroll |
| Admin CRM | /admin/crm |
| Beta gate | /beta-gate |

---

## Mobile App Specs

| Spec | Audience | Status |
|------|----------|--------|
| `specs/12-mobile-app.md` | Clients | ✅ Fully specced |
| `specs/12b-mobile-trainer-view.md` | Instructors | ✅ Fully specced |
| `specs/12c-mobile-admin-view.md` | Admins/Owners | ✅ Fully specced |

All three views ship as one React Native + Expo app with role-based mode switching. Not yet started — planned for after beta.

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
- [ ] Complete brand color migration to new earth palette (in progress)
- [ ] Jazz to sign up at marathon-pilates.vercel.app + set role to admin

## Completed (for reference)

- [x] Admin-initiated booking (staff books a client into a session) ✅ 2026-05-28
- [x] Recurring weekly schedule generator (`scripts/seed-schedule-recurring.sql`) ✅ 2026-05-28
- [x] Fixed `book_session` RPC (was broken for all server bookings incl. paid Stripe) ✅ 2026-05-28
- [x] Added `scheduled_sessions` write policy so staff can add/cancel classes ✅ 2026-05-28
- [x] Security + script audit completed ✅ 2026-05-28
- [x] Owner role implemented end-to-end ✅ 2026-05-27
- [x] `front_desk` role retired + removed from codebase ✅ 2026-05-27
- [x] Manager permissions tightened (no payroll/instructors/social content) ✅ 2026-05-27
- [x] Ruby + Adrian set to `owner` in DB ✅ 2026-05-27
- [x] Adrian's platform email changed to adrian@marathonpilates.com ✅ 2026-05-27
- [x] Earth-tone rebrand complete — design tokens live in globals.css
- [x] Build a Class works end-to-end (Anthropic + OpenAI + ElevenLabs)

---

## Ownership / Handoff Plan

- Adrian built and owns the platform. Accessible via `adrian@marathonpilates.com`.
- Ruby has a Claude teams account — can collaborate on the platform directly
- Jazz has admin access for studio operations (needs to sign up)
- HANDOFF/ docs are the source of truth for deep context

---

## HANDOFF Docs

```
HANDOFF/
├── 00-PLATFORM-OVERVIEW.md      ← Full context reference
├── 01-ACCOUNT-MIGRATION.md      ← Move services to business accounts
├── 02-SALE-READINESS.md         ← Business sale prep
├── 03-CLAUDE-SETUP.md           ← How to set up Claude Code
├── 04-CONSOLIDATION-CHECKLIST.md← Step-by-step account migration plan
└── 05-BOOTSTRAP-PROMPT.md       ← Copy-paste primer for new Claude sessions
```

---

## Important Rules

- **Never change pricing or payroll rates** without confirming with Ruby first
- **Never push to `main` without testing locally** (`cd src/web && npm run dev`)
- **Stripe is in live mode** — real charges happen
- **On Demand is intentionally offline** until Bunny.net is reactivated at launch
- **To disable the beta gate at launch:** remove `BETA_PASSWORD` from Vercel env vars
- **Brand colors:** always use design tokens, never hardcode hex values
- **DB foreign keys:** bookings and memberships use `client_id`, not `user_id`
- **Supabase keys:** new format only (`sb_publishable_` / `sb_secret_`) — legacy `eyJ...` JWT keys are disabled (see Gotchas)
- **Verify DB objects against the live database** before trusting `supabase/migrations/*.sql` — they have drifted (see Gotchas)
