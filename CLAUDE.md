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
| Tests | Vitest — `npm test` (run) / `npm run test:watch`. Unit tests colocated as `lib/*.test.ts` |

All AI service API keys (Anthropic, OpenAI, ElevenLabs) are configured in Vercel env vars and "Build a Class" is fully functional.

**Tests:** pure logic is unit-tested with Vitest (`cd src/web && npm test`) — `lib/nudges` (ranker), `lib/validation` (isUuid), `lib/healthFlags` (the safety guardrail), `lib/winback` (lapsed-detection), `lib/credits` (credit-type + usable-credit picking), `lib/emails/templates` (transactional copy/wording branches), `lib/postClass` (celebration eligibility + fallback + milestones). 71 tests. **CI** (`.github/workflows/ci.yml`) runs `tsc --noEmit` + the suite on every push/PR to `main`. When extracting logic from a route, prefer a pure `lib/*.ts` helper so it's testable.

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
- **Staff accounts are live** (verified against auth.users 2026-07-02): Ruby (owner) and Jazz (admin, jazzgodard@gmail.com, created 2026-05-13) both signed in as recently as 2026-06-23. Still pending: **client-side test accounts** for Ruby (rubyramdhan@yahoo.com) and Jazz (personal email) — each self-signs-up, then seed test credits. Details in Brain `04_Platform/beta-status.md`.
- **Beta testing has NOT actually started** (as of 2026-07-02) — accounts exist but no test rounds run yet.
- **Prod env-var status per `GET /api/health` (2026-07-02):** database ✓ · AI ✓ · email dry-run (RESEND_API_KEY unset) · **STRIPE_SECRET_KEY missing** · **UPSTASH_* missing**. Paid checkout and AI-generation routes will fail until those are set in Vercel. (Credit-based booking should work — DB/service-role is healthy.) Note: `/api/health` sits behind the beta gate — curl needs `-H "Cookie: mp_beta=<beta password>"`.

---

## Product Direction — Beta Feedback (2026-06-18)

> From Ruby's first beta feedback. **Concept stage — mockups only (Claude design), nothing built yet; paused until more direction.**

### Personalized "learns & grows with you" client home
The dashboard home should recommend classes + content from the intake questionnaire **+** behavior (e.g., a new mom → surface a "Mommy & Me" program). **Key principle: show the WHY on each recommendation** ("Gentle for your fourth trimester") — makes the learning visible + builds trust.
- **Foundation already exists:** intake questionnaire, `client_events` behavior log, `lib/nudges.ts` ranker, AI health-flags.
- **To build:** (1) capture life-stage/interest tags at intake (or AI-infer from the health/goals free-text); (2) admin UI for Ruby to define programs + their target tags; (3) extend the ranker to recommend programs (not just untried services); (4) surface the "why." Scales to any life stage (prenatal, seniors, injury recovery, athletes).

### Home mirrors the brand — "Move + Restore"
A **Move** section (class recs) + a **Restore** section (guided breath-work / meditative audio tiles, tap-to-play).
- **Restore audio = OUR OWN content** via the existing **ElevenLabs** engine (calm voiced guided breath work). Build nuance: **pacing** — timed inhale/hold/exhale pauses via SSML `<break>` or stitching is the real work; voice gen is easy. Optionally a **licensed** background bed.
- **Spotify = a small OPTIONAL element inside the Restore box only** — a tap-to-play embed of Spotify's *own* curated meditation playlist (zero maintenance), as a "want more vibe?" extra. NOT the core, NOT autoplay (browser-blocked), NOT a standalone feature. Caveat: embed = full tracks for Premium/logged-in, ~30s previews for free → own-hosted audio is the dependable core. **Never mix Spotify audio under our voice (their terms forbid it.)**
- **Licensing:** breath *techniques* aren't copyrightable (write our own scripts); need ElevenLabs commercial-tier rights + licensed music for any bed + a wellness/"not medical advice" disclaimer.

### Warmer voice + visual direction (Ruby wants warmer/more inviting)
- **Sentence case > ALL CAPS.** Say the **feeling**, not the category ("fourth trimester" not "postpartum"; "at your pace" not "recovery goal"). **Invite, don't instruct** ("Save my spot" not "BOOK").
- Lead with the **warm half of the palette** (Sandstone `#BC9C8E` / Rose Clay `#DDD1BD` / Terracotta `#A76E58` over moss/charcoal); softer corners; a heart, not a gear.
- Apply to **all copy, incl. AI-generated** (nudges, post-class celebrations). Consider a 1-page warm-voice mini-guide extending the brand guide.

---

## Known Accounts in DB

| Person | Email | Role |
|--------|-------|------|
| Adrian Walther | adrian@marathonpilates.com | owner |
| Ruby Ramdhan | ruby@marathonpilates.com | owner |
| Jazz Godard | jazzgodard@gmail.com | admin |
| Test client | adrianwalther@me.com | client |

Note: `profiles` also has a second, inert `jazzgodard@gmail.com` row (2026-04-08, no auth user) — an Arketa double-import duplicate; `dedup_profiles_full.sql` will clear it.

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

### Ordering/filtering bookings by the session date — use `!inner` + `referencedTable`
When a query embeds `scheduled_sessions` and needs to **order or filter by `starts_at`** (e.g. upcoming/past bookings):
- ❌ `.order('scheduled_sessions.starts_at', ...)` — the dotted embedded-column string makes PostgREST throw **"failed to parse order"**, the whole query errors, `data` is null, and the UI silently shows nothing.
- ❌ a plain (non-inner) embed — a `.gte('scheduled_sessions.starts_at', …)` filter then doesn't actually constrain the parent rows.
- ✅ Embed as `scheduled_sessions!inner(...)` AND order with `.order('starts_at', { referencedTable: 'scheduled_sessions', ascending })`.

This bug hid every client's upcoming/past bookings until caught in live verification (commit c11a727). Type-checks and unit tests can't catch it — it's a query-builder/PostgREST runtime issue; verify booking-list screens live.

### `.single()` vs `.maybeSingle()` — use maybeSingle when 0 rows is normal
`.single()` returns an **error** (PGRST116) when the query matches 0 (or >1) rows. Use it only when the row is guaranteed to exist (e.g. a profile/role lookup by the authed user's id). For anything where "no row" is a normal outcome — looking up a user-entered code, an optional membership, or an idempotency "does this already exist?" check — use **`.maybeSingle()`** (returns `data: null, error: null`). Audited 2026-05-30: the gift-card redeem, membership lookup, and the membership-confirm / gift-card-create / stripe-webhook idempotency checks were converted (commit 21fe0e7). They worked before (they only read `data`), but `.single()` there would silently break the happy path if error-handling were ever added.

### `total_classes_completed` is trigger-maintained — never hand-write it
`profiles.total_classes_completed` (feeds "Classes Done", the milestone progress bar, and the "new client" badge at `< 3`) is kept in sync by the DB trigger **`trg_sync_classes_completed`** (migration `sync_classes_completed.sql`, applied 2026-06-01). It **recomputes** `count(bookings where status='completed')` for the affected client on every `bookings` insert/delete/status-change, so it can't drift. Attendance marking (instructor roster + schedule page) sets `status='completed'`, which fires it. Don't write the counter from app code, and don't assume a past `confirmed` booking counts — only `completed` (i.e. attendance actually marked) does. Before this trigger the counter was dead (frozen at signup).

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
- All bookings are created by **server API routes using the service-role key** (which bypasses RLS): `app/api/bookings/route.ts` (client self-book, credit/comp), `app/api/admin/bookings/route.ts` (staff books a client), `app/api/webhooks/stripe/route.ts` (paid booking after checkout). Cancellation goes through `app/api/bookings/cancel/route.ts`.
- `book_session(p_session_id, p_client_id, p_amount_paid, p_payment_status, p_stripe_payment_intent_id, p_credit_id)` RPC: `SECURITY DEFINER`, params have defaults, **no `auth.uid()` guard** (a previous drifted version had one that broke every server booking — fixed 2026-05-28 via `migrations/fix_book_session_service_role.sql`). EXECUTE is locked to `service_role` only. Inside the function, `status` and `payment_status` must be cast to their enum types (`::booking_status`, `::payment_status`).
  - **Credit deduction is atomic inside the RPC** (added 2026-05-28, `migrations/add_credit_deduction_to_book_session.sql`): pass `p_credit_id` and the RPC locks the credit row `FOR UPDATE`, validates ownership + balance, inserts the booking, records `bookings.credit_used = p_credit_id`, and decrements `credits.used_credits` — all in ONE transaction, so a credit can never be double-spent or left un-deducted. Both `api/bookings` and `api/admin/bookings` call the RPC (admin no longer inlines its own insert). The old 5-arg overload was DROPped. Expiry is intentionally NOT enforced inside the RPC (parity with the client-side credit lookup).
- `cancel_booking(p_session_id, p_client_id)` RPC (added 2026-05-28, `migrations/add_cancel_booking_refund.sql`): `SECURITY DEFINER`, `service_role` only. In one transaction it locks the booking, decides late-cancel, flips status to `cancelled`, conditionally refunds the credit, and promotes the earliest waitlisted booking. See **Cancellation policy** below.
- `payment_status` enum includes `credit` (booked via credit/membership) and `included` (complimentary) — added via `migrations/add_payment_status_values.sql`.
- `scheduled_sessions` write policy ("Staff manage sessions", owner+admin) added 2026-05-28 via `migrations/add_scheduled_sessions_write_policy.sql` — without it, staff couldn't add/cancel classes from the UI.
- **Rebook after cancel works** (fixed 2026-05-28, `migrations/fix_rebook_after_cancel.sql`): the table-level `UNIQUE(client_id, session_id)` was swapped for a PARTIAL unique index `bookings_active_client_session_uidx` covering only `status IN ('confirmed','waitlisted')`. Cancelled rows are kept for history and never block a rebook; both API dup-checks filter to active statuses.

### Transactional email (added 2026-05-28 — currently in DRY-RUN until a provider is connected)
All booking touchpoints now send brand-voice emails. Three new files:
- `lib/email.ts` — provider-agnostic `sendEmail()`. Sends via **Resend's REST API** (`fetch`, no SDK dependency). **If `RESEND_API_KEY` is unset → DRY-RUN**: it `console.log`s a `[email:dry-run]` line instead of sending, so flows never break and templates stay inspectable locally. Env vars to go live: `RESEND_API_KEY` + `EMAIL_FROM` (default `Marathon Pilates <hello@marathonpilates.com>`). To switch to Google Workspace SMTP instead, replace ONLY the `fetch` block with a nodemailer transport — nothing else changes.
- `lib/emails/templates.ts` — four templates (HTML + plain text, earth palette, "Move + Restore"/#itsamarathon): booking **confirmed**, **waitlisted**, **cancelled** (3 wordings: refunded / late-cancel forfeit / neutral), **promoted-off-waitlist**. Times formatted in `America/Chicago`.
- `lib/emails/notify.ts` — best-effort orchestration (`notifyBookingConfirmed` / `notifyBookingCancelled` / `notifyWaitlistPromoted`). Loads recipient + class context from the DB and sends. **Never throws** — a failed email can't break a booking/cancel.
- Wired into: `api/bookings` (self-book), `api/admin/bookings` (staff books client), `api/bookings/cancel` (receipt + the promoted-off-waitlist email — closes the gap where auto-promoted clients were never told), `api/webhooks/stripe` (paid booking). Verified 2026-05-28: all 5 emails render correctly through the real `sendEmail` dry-run path.
- **Provider choice is the only launch to-do** (Ruby: Google Workspace vs Resend) — isolated to `lib/email.ts` + two env vars.

### Cancellation policy (📌 PINNED — placeholder, REVISIT with Ruby)
Shipped behavior, all in the `cancel_booking` RPC: **24-hour window. Cancelling 24h+ before start REFUNDS the credit. Cancelling inside 24h on a CONFIRMED booking = LATE cancel → credit is FORFEITED** (the lost credit is the penalty; any $15 cash fee is handled separately). Waitlisted bookings always refund (they never held a confirmed spot). Two knobs, both marked with `>>> POLICY KNOB <<<` comments in the migration: (1) the window — `interval '24 hours'`; (2) forfeit-vs-refund — the `AND NOT v_is_late` guard. Treat as a placeholder we can redo. **Caveat:** bookings created *before* this migration have `credit_used = NULL`, so cancelling them can't auto-refund (we don't know which credit). Verified end-to-end 2026-05-28: both the late-cancel forfeit path and the >24h refund path (`used_credits` round-trips).

### RESOLVED — owners added to the 25 RLS policies (2026-05-28)
25 live RLS policies gated on role but omitted `'owner'` (tables incl. `bookings`, `payroll_periods`, `payroll_line_items`, `instructor_profiles`, `private_session_requests`, `time_entries`, `waitlist_entries`). Fixed via `migrations/add_owner_to_rls_policies.sql` (23 array-form policies patched by a regex `ALTER POLICY` loop + 2 single-value payroll policies rewritten by hand), verified `still_missing_owner = 0`. **Note:** `profiles.role` is the `user_role` ENUM — when editing role lists use a bare `'owner'` literal (Postgres coerces it) or `'owner'::user_role`, NEVER `::text` (mixing text into a `user_role[]` array errors).

---

## Key Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | All users + roles |
| `scheduled_sessions` | Calendar classes (both locations) |
| `bookings` | Client bookings — FK is `client_id` (not `user_id`). `credit_used` links the credit spent (for refund on cancel); `late_cancel`/`cancelled_at` track cancellation. Cancelled rows are KEPT for history. |
| `memberships` | Active/past membership records — foreign key is `client_id` |
| `credits` | Group + amenity credit balances |
| `on_demand_classes` | Video library |
| `instructor_payroll` | Pay records per session |
| `client_events` | Append-only behavioral log (service views, nudge shown/clicked/dismissed) powering the "ever-learning" dashboard. Writes ONLY via service-role route `/api/events` (forces `client_id`); no client INSERT policy. Added 2026-05-29. |
| `nudge_copy` | Cache of AI-generated dashboard nudge lines, one per (`client_id`, `service_key`). Service-role writes only; regenerates after 30 days. Added 2026-05-29. |
| `profiles.health_flags` (column) | AI-structured trainer flags (text[]) derived from the client's intake health note; shown on the My Classes roster. `health_conditions` remains the raw source of truth. Added 2026-05-29. |

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
| Forgot / reset password | /forgot-password · /reset-password |
| Engagement analytics (staff) | /admin/marketing/engagement |
| Win-Back worklist (staff) | /admin/marketing/win-back |

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

- [ ] 🔴 **Run `dedup_profiles_full.sql`** (owner-run) — removes 8,848 inert Arketa double-import duplicates + adds `UNIQUE(lower(email))`. See Security Audit 2026-06-02.
- [ ] 🔒 **Set `UPSTASH_REDIS_REST_URL`/`TOKEN` in Vercel** (else AI features fail closed in prod) + **enable Auth "leaked password protection"** (Supabase dashboard).
- [ ] Reactivate Bunny.net + re-upload 23 videos + re-seed `video_url` in DB
- [ ] Activate Gusto for payroll
- [ ] Confirm amenity pricing with Ruby (sauna, cold plunge, contrast)
- [ ] **Email — Phase 1 (transactional):** connect **Resend** + set `RESEND_API_KEY`/`EMAIL_FROM` to flip the built (dry-run) booking emails live. Provider decision is now **Resend** (does transactional + marketing in one) — see `specs/19-email-marketing.md`. Needs DNS (DKIM/SPF/DMARC, likely a `send.` subdomain) + Ruby's cost sign-off.
- [ ] 📌 **Email — Phase 2 (marketing engine), REVISIT CLOSER TO LAUNCH:** build newsletter (Broadcasts) + lifecycle automations sending to replace the paid **Arketa marketing package** (mailboxes stay on Google Workspace). Scaffolding exists (broadcasts/automations pages + tables) but doesn't send yet; needs dispatch + audience selection + **unsubscribe/suppression** (legal) + templates. Full plan + cost framework in `specs/19-email-marketing.md`. Get from Ruby: Arketa marketing cost (baseline), subscriber count, DNS access, cancellation timing.
- [ ] Point app.marathonpilates.com → Vercel
- [ ] Hero video footage from Ruby (login page left panel)
- [ ] Data migration from Arketa (Susan LeGrand)
- [ ] Rotate all API keys + enable 2FA on launch day
- [ ] Migrate all service accounts to Marathon Pilates business accounts (see HANDOFF/01-ACCOUNT-MIGRATION.md)
- [ ] Finish brand color migration — DONE so far (2026-05-28): (a) exact-match brand hexes (176 across 37 files) → `var(--color-*)` tokens, pixel-identical; (b) off-black `#1A1A1A` (188 across 33 files) → `var(--color-text)` (Deep Earth `#302D27`) — this is a deliberate VISIBLE change (harsh pure-black → warm brand dark). REMAINING (~594): non-brand grays (`#E0E0E0`), Tailwind defaults (`#6B7280` etc.), status-badge tints (red/green/amber), and a few stray darks (`#2A2A2A`, `#333`) — these need design decisions, not a mechanical swap. Note: email templates in `lib/emails/` intentionally keep literal hex (email clients can't read CSS vars).
- [x] Jazz signed up + role set to admin ✅ (verified in DB 2026-07-02; account since 2026-05-13)
- [x] **`add_waiver_consent.sql` applied** — verified live 2026-06-02 (waiver_signed_at / waiver_version / waiver_signature columns present; consent detail saves).
- [ ] 📌 **WAIVER — proofread verbatim (with Ruby) before launch.** The waiver in `lib/waiver.ts` was transcribed from screenshots of the Arketa copy — needs human confirmation it's word-for-word. Specific item: §1 bullet 3 reads "Company' sole discretion" (apostrophe kept exactly as original) — confirm leave verbatim vs. clean to "Company's".
- [ ] 📌 **WAIVER — COVID-19 language refresh (with Ruby).** §1 references COVID-19 / facemasks (the studio's current Arketa wording, kept verbatim). Ruby may want to update/remove it. When the text changes, bump `WAIVER_VERSION` in `lib/waiver.ts` so consent records stay unambiguous.

## 🔒 Security Audit — 2026-06-02 (pre-beta)

Full 5-dimension audit (auth, payments, booking/credits, data/RLS, reliability). Found and **fixed + verified live** four CRITICALs and several HIGHs. The fixes encode invariants — **do not regress them**.

### Fixed (live + committed)
- **CRITICAL · PII/health exposure.** `profiles` "Admins can view all profiles" SELECT policy was `USING(true)` — every authenticated user could read all ~18.7k clients' health/DOB/emergency/PII. Now gated via `is_staff()` (SECURITY DEFINER, search_path pinned) + own-row read. (`security_fix_profiles_rls.sql`)
- **CRITICAL · privilege escalation.** authenticated/anon had UPDATE on `profiles.role`; a client could self-promote to owner. `trg_guard_profile_role` BEFORE-UPDATE trigger preserves role for client-facing roles. **Role changes only via service_role.**
- **CRITICAL · free bookings / RPC bypass.** Clients had direct INSERT/UPDATE on `bookings`, and `dashboard/schedule` inserted a confirmed booking client-side on Stripe return → anyone could mint a free booking for any class. Dropped client write policies; removed the client insert. (`security_fix_bookings_rls.sql`) **Bonus: this repaired attendance marking**, which had been silently RLS-denied (0 bookings ever reached `completed`) — staff now have a dedicated UPDATE policy.
- **CRITICAL · pay-and-get-nothing.** The signed Stripe webhook only fulfilled CLASS bookings; memberships/packs/gift-cards relied on the client hitting a success-URL endpoint (close the tab = paid, got nothing, no record). **Webhook is now the single source of truth** for all fulfillment via `lib/fulfillment.ts`; idempotent (`stripe_events` ledger + unique indexes on `memberships`/`credits.stripe_session_id`, `gift_cards.stripe_payment_intent_id`); returns 500 on failure so Stripe retries.
- **HIGH** · `membership/confirm` was UNAUTHENTICATED → added auth + `user.id===metadata.user_id`. `gift-card/create` → added ownership check. Both now best-effort wrappers over the shared idempotent fulfillment.
- **HIGH** · instructor pay was publicly readable (`scheduled_sessions.instructor_pay_amount/tier` under the public read policy) → column SELECT revoked from anon/authenticated.
- **HIGH** · AI rate limiter failed OPEN if Upstash env unset → `getAiRatelimit()` now **fails closed in prod**; `generate-class`/`generate-image` inputs are now length-capped.
- Locked down `sync_classes_completed()` (was RPC-callable); added `bookings.credit_used → credits(id)` FK.

### Security invariants (keep these true)
- **`bookings`: clients have NO direct write.** All writes go through the service-role RPCs (`book_session`/`cancel_booking`) or the staff UPDATE policy (attendance). Never re-add a client INSERT/UPDATE policy.
- **`profiles` reads** are own-row OR `is_staff()`. Never use `USING(true)` on a table with PII. Test RLS by impersonating: `set local role authenticated; select set_config('request.jwt.claims','{"sub":"<uuid>","role":"authenticated"}',true);`.
- **All paid fulfillment lives in `lib/fulfillment.ts`** and is idempotent. The webhook is the source of truth; the `confirm`/`create` endpoints are best-effort instant-UI only and must verify ownership.

### Still open (post-audit)
- 🔴 **Run `dedup_profiles_full.sql`** (owner-run, destructive) — Arketa import ran twice → 8,848 emails duplicated exactly twice (17,696 inert rows, 0 with activity). Script keeps one per email + adds `UNIQUE(lower(email))`. → ~9,900 real clients. **Until run, the email-unique guard isn't in place.**
- 🟡 **Set `UPSTASH_REDIS_REST_URL`/`TOKEN` in Vercel** — else AI features fail closed (fall back) in prod.
- 🟡 **Enable Auth "leaked password protection"** (Supabase dashboard, 1 click).
- 🟡 Beta-gate hardening (H4: hardcoded pw fallback + cookie value == pw) and gift-card **redemption** (H7: cards can be bought but `current_balance` is never decremented — needs an atomic FOR UPDATE RPC) — both optional for beta.
- 🟡 Needs Ruby: cancellation fees ($15 late / $20 no-show are NOT implemented) + amenity pricing mismatch.
- Test gap: `book_session`/`cancel_booking` RPCs and the webhook fulfillment have no automated coverage.

## Completed (for reference)

- [x] **Post-class celebration card (Ruby's request)** — after a client finishes a class, the dashboard shows a warm, class-aware AI message in Ruby's voice ("Nice work on your core today…"). `lib/postClass.ts` + `/api/post-class-copy` (guardrailed: warm/aspirational only, no medical/results claims) + `post_class_copy` cache table. In-app MVP; 30-min-after push is the eventual mobile-app delivery ✅ 2026-05-30
- [x] **Live verification pass (production)** — confirmed the whole retention suite end-to-end on the deployed site: dashboard AI nudge card, rebook modal, cancel→refund→rebook→late-forfeit (all per policy), engagement analytics (incl. rebook telemetry), win-back, and trainer health-flag chips ✅ 2026-05-30
- [x] **Fixed: upcoming/past bookings never displayed** — the dashboard "Upcoming" list + all My Bookings tabs returned nothing because the query used `.order('scheduled_sessions.starts_at')` (PostgREST rejects the dotted embedded-column string → "failed to parse order" → query errored → empty UI). Fix: `scheduled_sessions!inner(...)` embed + `.order('starts_at', { referencedTable: 'scheduled_sessions' })`. Caught during live verification (commit c11a727) ✅ 2026-05-30
- [x] **App-wide modal accessibility** — `lib/useModalDismiss(isOpen, onClose)` (Escape-to-close + background scroll-lock) applied to every modal + `role=dialog`/`aria-modal`/`aria-label`: rebook modal + admin gift-cards/broadcasts/testimonials/referrals/leads/schedule-roster (commits 9db70fb, b6d0c0b) ✅ 2026-05-30
- [x] Password reset completed end-to-end — built the missing `/reset-password` page (forgot-password link was a 404) ✅ 2026-05-29
- [x] "Ever-learning" dashboard nudge engine — surfaces a service the client hasn't tried yet (recovery amenities prioritized), in Ruby's brand voice. `lib/nudges.ts` (pure ranker), warm "For You" card on /dashboard ✅ 2026-05-29
- [x] Behavioral learning layer — `client_events` log + `/api/events` route + `lib/events.ts`; nudge ranker boosts services a client keeps viewing (intent) and suppresses dismissed ones ✅ 2026-05-29
- [x] AI nudge copy in Ruby's voice — `/api/nudge-copy` (claude-sonnet-4-6, guardrailed, cached in `nudge_copy`); dashboard renders the static template instantly then swaps to the AI line. Falls back to template on any error/off-spec output ✅ 2026-05-29
- [x] Staff engagement analytics — `/admin/marketing/engagement`: nudge funnel (shown/clicked/dismissed/CTR) per service + recent activity, over `client_events` ✅ 2026-05-29
- [x] Post-cancel rebook modal (retention) — when a client cancels, `components/RebookModal.tsx` offers other upcoming same-type sessions for one-tap rebooking. Books via shared `lib/bookClass.ts`. Logs `rebook_offered`/`rebook_booked` ✅ 2026-05-29
- [x] Fixed "My Bookings" cancel — was a bare status update (no credit refund, no waitlist promotion, no email, wrong 12h window); now uses the `/api/bookings/cancel` RPC like the schedule page (refund + promote + email + 24h) ✅ 2026-05-29
- [x] AI health flags — `/api/health-flags` structures a client's free-text intake note into clean trainer-facing flags (`profiles.health_flags`); My Classes roster shows them as chips. Guardrailed to restate, never advise ✅ 2026-05-29
- [x] Emergency contact added to intake (required name + phone, Step 2) ✅ 2026-05-29
- [x] Liability waiver acknowledgment at intake — full waiver in `lib/waiver.ts` (versioned); Step 3 checkbox + typed signature; records `liability_waiver_signed` + `waiver_signed_at`/`waiver_version`/`waiver_signature` ✅ 2026-05-30
- [x] Lapsed-client win-back worklist — `/admin/marketing/win-back` + `/api/admin/win-back` (staff-auth → service-role aggregate of bookings; lapsed = past visit, none upcoming, quiet N days; enriched w/ membership + unused credits) ✅ 2026-05-30
- [x] Admin-initiated booking (staff books a client into a session) ✅ 2026-05-28
- [x] Recurring weekly schedule generator (`scripts/seed-schedule-recurring.sql`) — DELETE now guarded (future + unbooked only), safe to re-run ✅ 2026-05-28
- [x] Owner added to the 25 RLS policies that omitted it (verified `still_missing_owner = 0`) ✅ 2026-05-28
- [x] Credit deduction folded into `book_session` (atomic — no double-spend / un-deducted credits) ✅ 2026-05-28
- [x] Credit refund on cancel via `cancel_booking` RPC (24h late-cancel forfeit, waitlist promotion) ✅ 2026-05-28
- [x] Rebook-after-cancel fixed (partial unique index on active bookings) ✅ 2026-05-28
- [x] Transactional email system built + wired into all booking touchpoints (dry-run until provider connected) ✅ 2026-05-28
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
- Jazz has admin access for studio operations (jazzgodard@gmail.com, active)
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
- **Clients never write `bookings` directly** — only the service-role RPCs (`book_session`/`cancel_booking`) or staff (attendance). Don't add a client INSERT/UPDATE policy (see Security Audit).
- **Never put `USING(true)` on a PII table** (profiles etc.) — gate reads with `is_staff()`. `profiles.role` changes only via service_role.
- **Paid fulfillment = `lib/fulfillment.ts` + the signed webhook** (source of truth, idempotent). `confirm`/`create` endpoints are best-effort and must check ownership.
- **Supabase keys:** new format only (`sb_publishable_` / `sb_secret_`) — legacy `eyJ...` JWT keys are disabled (see Gotchas)
- **Verify DB objects against the live database** before trusting `supabase/migrations/*.sql` — they have drifted (see Gotchas)
- **Breadcrumb business-facing changes to the Brain.** When a session changes something
  business-relevant (launch timing, beta status, pricing/policy decisions, new blockers),
  also append one line to `/Users/adrianwalther/Marathon Pilates Brain/00_Start-Here/decisions-log.md`
  (format: `YYYY-MM-DD — Decision — short why`). Engineering detail stays in this file;
  the Brain (Adrian's ops knowledge base) just needs to know *that* something changed and
  where to look. Beta logistics live in the Brain at `04_Platform/beta-status.md` — update
  it there if tester accounts/limits change.
