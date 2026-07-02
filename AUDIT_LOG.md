# Marathon Pilates Platform — Audit Log

---

## Audit Run: 2026-05-11T09:40 UTC

**Auditor:** Automated scheduled task (Claude Opus 4.7, 1M context)
**Scope:** Security + Stability — full 10-point checklist
**Risk profile:** PRODUCTION — live Stripe, PII, HSA/FSA, admin role-based access
**Project path:** `/Users/adrianwalther/Desktop/_Projects/Marathon Pilates/Marathon Pilates Platform/`
**Note:** Scheduled-task SKILL.md still references stale `~/Desktop/Marathon Pilates Platform/` path — task definition needs updating. Findings below are mostly carryovers from 2026-05-06 audit that have not yet been remediated.

### Summary
- 1 × **P1 Critical** (carryover from 2026-05-06)
- 1 × **P2 High** (carryover — partially mitigated: anon SELECT reduced from 28 → 3 tables)
- 3 × **P3 Medium** (carryovers)
- 2 × **P4 Low**
- Vercel runtime errors (last 24h, production): **0 errors / 0 fatals**
- TypeScript `tsc --noEmit`: **clean**
- Git history secret scan: **clean** (one historical AUDIT_LOG.md mention is a finding reference, not a real key)
- npm audit High/Critical: 2 (transitive, dev-only, fix available)

### P1 — CRITICAL: `book_session` RPC still executable by `authenticated` role
- **File:** `src/web/supabase/migrations/book_session_rpc.sql:7`
- **Source:** Supabase advisor `authenticated_security_definer_function_executable` (still present)
- **Status:** anon EXECUTE was revoked (good — `anon_security_definer_function_executable` is gone), but `authenticated` EXECUTE remains.
- **Exploit:** Any signed-in user (free signup is open) can call `POST /rest/v1/rpc/book_session` directly with arbitrary `p_session_id`, `p_client_id`, `p_amount_paid=0`, `p_payment_status='paid'` and create a confirmed-paid booking. Stripe is fully bypassed. The function runs as `SECURITY DEFINER` and does not verify the caller's identity matches `p_client_id`.
- **Impact:** Direct revenue loss; capacity sabotage (free junk bookings can fill classes).
- **Fix (immediate, SQL editor):**
  ```sql
  REVOKE EXECUTE ON FUNCTION public.book_session(uuid, uuid, numeric, text, text) FROM authenticated, public;
  -- service_role retains EXECUTE by default; legitimate server routes
  -- (app/api/bookings/route.ts, app/api/webhooks/stripe/route.ts) already
  -- use SUPABASE_SERVICE_ROLE_KEY, so this revoke does not break flows.
  ```

### P2 — HIGH: `authenticated` role has SELECT on 28 tables including financial PII (carryover, defense-in-depth)
- **Source:** Supabase advisor `pg_graphql_authenticated_table_exposed` × 28
- **Tables include:** `profiles`, `bookings`, `memberships`, `credits`, `gift_cards`, `payroll_line_items`, `payroll_periods`, `time_entries`, `leads`, `lead_tasks`, `referrals`, `broadcasts`, `automations`, `automation_logs`, `chat_conversations`, `chat_messages`, `private_session_requests`, `client_milestones`, `instructor_profiles`, `waitlist_entries`, `notifications`, plus others.
- **Caveat:** Exposure depends on each table's RLS row-level policies. Anon SELECT was already reduced from 28 → 3 (`locations`, `scheduled_sessions`, `session_templates` — likely intentional public catalog data).
- **Highest-risk if RLS slips:** `payroll_line_items`, `payroll_periods`, `time_entries` (instructor pay), `profiles`, `leads`, `referrals`.
- **Recommended fix:** `REVOKE SELECT ON public.<table> FROM authenticated` for tables that should never be readable by a random signed-in user. RLS is the primary defense; revoking GRANT is belt-and-suspenders.
- **Verification step before launch:** Run as anon and as an unrelated `authenticated` user (newly signed up account that owns no rows): `SELECT * FROM payroll_line_items LIMIT 1` — confirm 0 rows or denied.

### P3 — Hardcoded fallback password in beta-gate (carryover)
- **File:** `src/web/app/api/beta-gate/route.ts:3` and `src/web/middleware.ts:9`
- **Issue:** `const BETA_PASSWORD = process.env.BETA_PASSWORD ?? 'marathon2026beta'` — if env var is unset (rollback, fresh env, misconfig), the literal grants access. Also visible in tracked source.
- **Fix:** Drop the fallback; throw at boot. `const BETA_PASSWORD = process.env.BETA_PASSWORD; if (!BETA_PASSWORD) throw new Error('BETA_PASSWORD required')`.

### P3 — Beta-gate route has no rate limit (carryover)
- **File:** `src/web/app/api/beta-gate/route.ts` — no `getCheckoutRatelimit`/equivalent.
- **Impact:** Brute-forceable, especially with the known fallback password.
- **Fix:** Add per-IP rate limiter (e.g. 5/min) before the password compare.

### P3 — Supabase `auth_leaked_password_protection` disabled (carryover)
- Already tracked in PRE-LAUNCH BLOCKERS. Requires Supabase Pro upgrade to enable HIBP check.

### P4 — Non-atomic credit decrement (carryover)
- **File:** `src/web/app/api/bookings/route.ts:54-66`
- **Detail:** Read–increment–write on `credits.used_credits` is not atomic. Two concurrent bookings using the same credit row could each grant a free booking. Stability bug, not externally exploitable.
- **Fix:** `UPDATE credits SET used_credits = used_credits + 1 WHERE id = $1 AND used_credits < total_credits RETURNING used_credits` and reject if 0 rows affected.

### P4 — npm High-severity transitive deps
- `flatted ≤3.4.1` (prototype pollution via parse) — via eslint deps, dev-only.
- `picomatch <2.3.2` and `4.0.0–4.0.3` (ReDoS via extglob) — via micromatch chain, dev-only.
- Both `fixAvailable: true`. Run `npm audit fix` at next convenience.

### Clean checks
- ✅ **Secrets in tracked files:** no `sk_live_`, `sk_test_`, `whsec_`, `service_role`, `sk-ant-api03-`, `sk-proj-`, or private keys in tracked source. AUDIT_LOG.md mentions of `sk_live_` are finding references, not real keys.
- ✅ **Git history secrets:** clean across all branches.
- ✅ **API route auth + rate limits:** `bookings`, `bookings/cancel`, `checkout`, `checkout/membership`, `checkout/gift-card`, `gift-card/create`, `generate-class`, `generate-audio`, `generate-image` all have `supabase.auth.getUser()` checks and ratelimit imports (`getBookingRatelimit` / `getCheckoutRatelimit` / `getAiRatelimit`). All catch blocks return generic 500 messages (no `err.message` leak).
- ✅ **Stripe security:** `STRIPE_SECRET_KEY` referenced only inside `app/api/` (never in `app/` pages or `components/`). Webhook (`app/api/webhooks/stripe/route.ts:16`) verifies `STRIPE_WEBHOOK_SECRET` signature; membership confirm uses `(stripe_session_id, client_id)` idempotency on upsert.
- ✅ **Middleware:** Beta gate + `/admin` role check (`admin/manager/instructor/front_desk`) + `/dashboard` auth gate.
- ✅ **Error boundaries:** `app/error.tsx`, `app/(dashboard)/error.tsx`, `app/(admin)/error.tsx` all present.
- ✅ **TypeScript:** `tsc --noEmit` clean.
- ✅ **Vercel runtime logs (24h, production, error+fatal):** 0 entries.
- ✅ **PII handling:** no `console.log`/`console.error` printing emails, phones, full user objects, or HSA tokens in `app/`, `components/`, `lib/`.
- ✅ **HSA/FSA labelling:** present on membership, gift-cards, signup pages — itemized receipt still pending (already tracked in PRE-LAUNCH BLOCKERS).

### Action priority
1. **TODAY:** Revoke `EXECUTE` on `book_session` from `authenticated` (P1).
2. **THIS WEEK:** Verify RLS row reads from a fresh anon + fresh authenticated session on payroll/PII tables; revoke `SELECT` from `authenticated` on tables with no legitimate cross-user read.
3. **BEFORE LAUNCH:** Remove hardcoded beta password fallback; rate-limit beta-gate.
4. **HOUSEKEEPING:** `npm audit fix`; convert credit decrement to atomic SQL `UPDATE ... RETURNING`.

---

## PRE-LAUNCH BLOCKERS (updated 2026-04-19)

These security items must be resolved before going live with real clients:

- [ ] **Upgrade Supabase to Pro plan** — required to enable "Prevent use of leaked passwords" (HaveIBeenPwned check). Currently on Nano plan; feature is locked.
- [ ] **HSA/FSA receipt itemization** — advertised as HSA/FSA eligible but no itemized receipt is generated per transaction. Needed for client reimbursement documentation (P3-5 from audit).
- [ ] **Enable email notifications** — waiting on Ruby's provider decision (Google Workspace or Resend).
- [ ] **WordPress subdomain** — point app.marathonpilates.com → Vercel before launch.
- [ ] **Data migration from Arketa** — waiting on Susan LeGrand availability.

Already resolved before launch ✅:
- Next.js upgraded to 16.2.4 (CSRF + HTTP smuggling CVEs patched)
- gift_cards RLS policies applied
- Rate limiting on all booking + AI + checkout routes
- Mutable search_path fixed on DB functions
- Error boundaries added to all route groups
- Minimum password length bumped to 8 characters

---

## Audit Run: 2026-04-19T20:12 UTC

**Auditor:** Automated scheduled task (Claude Sonnet 4.6)
**Scope:** Security + Stability — full 10-point checklist
**Risk profile:** PRODUCTION — live Stripe payments, client PII, HSA/FSA flows

---

### P2 / HIGH

**P2-1 — Next.js 16.1.6 CVE: CSRF bypass via null Origin (GHSA-mq59-m269-xvcx)**
- Impact: Attacker can invoke Server Actions from any origin by sending a `null` Origin header, bypassing CSRF protection.
- Fix: `npm install next@16.2.4` (non-breaking minor update)

**P2-2 — Next.js 16.1.6 CVE: HTTP request smuggling in rewrites (GHSA-ggv3-7p47-pfv8)**
- Impact: Rewrites rules may allow header smuggling in upstream proxies.
- Fix: same — upgrade to `next@16.2.4`

**P2-3 — Supabase: `gift_cards` table has RLS enabled but zero policies**
- Impact: RLS enabled but no ALLOW policies means all authenticated service-role queries succeed, while anon/client queries fail silently — but more critically, any future policy-less client query could expose all gift card codes and balances.
- File: Supabase security advisor `rls_enabled_no_policy` on `public.gift_cards`
- Fix: Add RLS policies (INSERT for purchaser, SELECT for purchaser + recipient + admin).
- Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

**P2-4 — `/api/bookings/route.ts:72` — raw `err.message` returned to client**
- Impact: Database/Supabase error messages (table names, constraint names, query fragments) exposed in HTTP 500 responses to clients.
- Fix: Replace `return Response.json({ error: message }, { status: 500 })` with `return Response.json({ error: 'Failed to book session' }, { status: 500 })` (same pattern already used in cancel route).

**P2-5 — `/api/bookings/route.ts` and `/api/bookings/cancel/route.ts` — no rate limiting**
- Impact: Authenticated users can spam booking/cancellation requests, potentially causing DB load spikes or gaming waitlist promotion logic.
- Fix: Import `getCheckoutRatelimit` (or create a dedicated `getBookingRatelimit`) from `@/lib/ratelimit` and apply as done in checkout routes.

---

### P3 / MEDIUM

**P3-1 — `/api/gift-card/create/route.ts` — no user auth check**
- Impact: Any caller who knows a valid Stripe session ID can trigger gift card creation. Mitigated by Stripe payment verification, but a stolen session ID could be replayed.
- Fix: Add `supabase.auth.getUser()` check (same pattern as bookings/cancel routes). The route already has idempotency protection.

**P3-2 — Error boundaries missing in all three route groups**
- Impact: Unhandled React rendering errors in `/app`, `/dashboard`, and `/admin` will show a generic Next.js crash page with no graceful recovery.
- Fix: Create `error.tsx` in `app/`, `app/(dashboard)/dashboard/`, `app/(admin)/admin/` (or wherever dashboard/admin route groups live).

**P3-3 — Supabase: `book_session` and `update_updated_at` functions — mutable search_path**
- Impact: A privileged user could manipulate `search_path` to shadow system functions, creating a SQL injection vector in the booking RPC.
- Fix: Add `SET search_path = public` to each function definition, or use `ALTER FUNCTION ... SET search_path = public`.
- Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

**P3-4 — Supabase Auth: Leaked password protection disabled**
- Impact: Clients can register/set passwords that appear in HaveIBeenPwned breach databases.
- Fix: Enable in Supabase dashboard → Auth → Security → "Check for exposed passwords".
- Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

**P3-5 — HSA/FSA receipts not itemized in code**
- Impact: HSA/FSA is advertised and accepted but no receipt generation code itemizes eligible services (required for member reimbursement documentation).
- Fix: Ensure Stripe receipts or a dedicated receipt page include service name + eligible amount + date per transaction.

**P3-6 — RLS performance: 56 `auth_rls_initplan` warnings across 25 tables**
- Impact: RLS policies calling `auth.uid()` directly are re-evaluated on every row scan. At scale this causes significant query slowdowns.
- Fix: Wrap in a subquery: `(select auth.uid())` instead of `auth.uid()` in all RLS policy conditions.
- Affected tables: automation_logs, automations, bookings, broadcasts, chat_conversations, chat_messages, client_milestones, content_sessions, credits, generated_classes, instructor_profiles, lead_tasks, leads, memberships, notifications, on_demand_classes, payroll_line_items, payroll_periods, private_session_requests, profiles, referrals, session_templates, testimonials, time_entries, waitlist_entries

**P3-7 — RLS performance: 98 `multiple_permissive_policies` warnings across 16 tables**
- Impact: Multiple permissive policies for the same role+action are OR'd together, causing each to be evaluated separately per query — significant overhead.
- Fix: Consolidate permissive policies per role+action on bookings, profiles, memberships and other high-traffic tables.
- Affected tables: bookings, chat_conversations, chat_messages, client_milestones, content_sessions, instructor_profiles, on_demand_classes, payroll_line_items, payroll_periods, private_session_requests, profiles, referrals, session_templates, testimonials, time_entries, waitlist_entries

---

### P4 / LOW

**P4-1 — Next.js DoS CVEs (GHSA-h27x-g6w4-24gq, GHSA-3x4c-7xq6-9pq8, GHSA-q4gf-8mx6-v5v3)**
- Unbounded postpone buffer, image disk cache, server components DoS. All fixed in 16.2.4.

**P4-2 — `flatted` HIGH CVE (GHSA-rf6f-7fwh-wjgh)**
- Prototype Pollution in `flatted.parse()`. This is a Next.js dev dependency, not directly exposed in production request handling.

**P4-3 — `picomatch` HIGH CVEs (GHSA-3v7f-55p6-f55p, GHSA-c2c7-rcm5-vvqj)**
- ReDoS and method injection. Dev dependency; not reachable from production request paths.

**P4-4 — `console.error(err)` dumps full error objects to server logs**
- Server-side only (Vercel function logs). Not client-visible. But Stripe/Supabase error objects can include query metadata.
- Files: generate-class/route.ts:122, generate-image/route.ts:48, and others.

**P4-5 — 26 unindexed foreign keys across 19 tables (INFO)**
- Performance only. Add covering indexes on high-traffic FK columns (credits.client_id, bookings.session_id, etc.).

**P4-6 — 20 unused indexes across 13 tables (INFO)**
- Dead weight. Review and drop to reduce write overhead.

---

### CLEAN CHECKS (no findings)

- ✅ Secrets: No hardcoded secrets in tracked source files. `.env` files not committed.
- ✅ Git history: No leaked keys in commit history.
- ✅ Stripe webhook: Signature validated with `STRIPE_WEBHOOK_SECRET`. Idempotency on membership confirm.
- ✅ Stripe keys: `sk_live_` not present in client bundles (app/, components/).
- ✅ Middleware: `/admin` and `/dashboard` both protected. Role check on admin routes.
- ✅ Auth on existing routes: generate-class, generate-audio, generate-image, checkout, checkout/membership, checkout/gift-card all confirmed protected (known-fixed).
- ✅ TypeScript: `tsc --noEmit` exits 0 — no type errors.
- ✅ Vercel runtime errors: Zero error logs in past 24h.
- ✅ New API route auth (bookings, cancel): Both have `supabase.auth.getUser()` checks.

---

*End of audit — 2026-04-19*

---

## Audit Run: 2026-05-01T09:30 UTC

**Auditor:** Automated scheduled task (`audit-marathon-pilates`, Claude Opus 4.7)
**Scope:** Security + Stability — full 10-point checklist
**Risk profile:** PRODUCTION — live Stripe payments, client PII, HSA/FSA flows
**Project location note:** Actual project tree is at `/Users/adrianwalther/Desktop/_Projects/Marathon Pilates/Marathon Pilates Platform/`. The path in the task spec (`/Users/adrianwalther/Desktop/Marathon Pilates Platform/`) now contains only the AUDIT_LOG.md from a prior copy and an empty `src/web/`. Task spec should be updated.

---

### P1 / CRITICAL — NEW

**P1-1 — `book_session` RPC is `SECURITY DEFINER`, exposed to `anon` + `authenticated`, with no `auth.uid()` check**
- File: Postgres function `public.book_session(uuid, uuid, numeric, text, text)` — verified live via `pg_get_functiondef`.
- Impact: ANY caller with the public anon key (which is in every client bundle by design) can POST to `/rest/v1/rpc/book_session` and pass an arbitrary `p_client_id`. The function uses `SECURITY DEFINER`, so it bypasses RLS on `bookings` and inserts unconditionally.
  - Default args make `p_amount_paid=0`, `p_payment_status='included'` — attacker confirms bookings without paying or consuming credits.
  - Attacker can fill any session to capacity (DoS the booking page) by inserting fake bookings under known client UUIDs OR their own.
  - The credit-deduction logic in `app/api/bookings/route.ts:51` is bypassed entirely when the RPC is called directly.
- Sources:
  - Supabase advisor: `anon_security_definer_function_executable` + `authenticated_security_definer_function_executable` (https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
  - Verified function body has no `auth.uid()` guard.
- Recommended fix (SQL, in `apply_migration`):
  ```sql
  -- Option A: lock down execution to service role only
  REVOKE EXECUTE ON FUNCTION public.book_session(uuid, uuid, numeric, text, text) FROM anon, authenticated;
  -- Option B (if anon/authenticated must call it): add a guard at top of function
  --   IF auth.uid() IS NULL OR auth.uid() <> p_client_id THEN
  --     RAISE EXCEPTION 'Unauthorized booking attempt';
  --   END IF;
  ```
  Option A is preferred — the API route already uses the service role key, so revoking from anon/authenticated has no impact on the legitimate code path.

---

### P2 / HIGH — NEW

**P2-1 — Beta-gate cookie value IS the password (plaintext shared secret on every client)**
- Files: `src/web/middleware.ts:9` and `src/web/app/api/beta-gate/route.ts:3,16`.
- Impact: After a successful gate unlock, the cookie `mp_beta` is set to the literal `BETA_PASSWORD` value. Anyone past the gate can read their own cookie via JS or DevTools and recover the shared password (or any cookie-thieving XSS could leak it). Also, the hardcoded fallback `'marathon2026beta'` is shipped in the build if `BETA_PASSWORD` env var is unset — it appears in source and tracked git history.
- Recommended fix:
  - Set the cookie to a random server-side token (HMAC-signed or stored in a tiny KV) instead of the password itself.
  - Remove the hardcoded fallback; refuse all requests if `BETA_PASSWORD` is unset (fail closed).
  - At launch, drop the env var and ship a middleware change to no-op the gate.

**P2-2 — Stripe webhook lacks event-level idempotency**
- File: `src/web/app/api/webhooks/stripe/route.ts`.
- Impact: Signature is verified ✓ but processed `event.id`s are not stored. Stripe retries on any non-2xx and occasionally delivers duplicates (documented at-least-once). The current "is there an existing booking?" check protects against duplicate booking inserts, but nothing prevents re-processing of a `checkout.session.completed` event for a flow that doesn't have its own dedupe (e.g., future event types added here will inherit the gap).
- Recommended fix: Add a `webhook_events` table with `event_id PRIMARY KEY` and INSERT before processing; if INSERT conflicts, return 200 immediately. Single-line guard at top of handler.

---

### P3 / MEDIUM — NEW

**P3-1 — `gift-card/create/route.ts:33` trusts `purchaser_id` from Stripe metadata, not `user.id`**
- The route DOES authenticate the caller (`user.id` from `auth.getUser()`), but writes the `purchaser_id` field from `session.metadata.purchaser_id` to the DB. An authenticated attacker who learned another user's `stripe_session_id` could call this and have a gift card attributed to a different `purchaser_id`. Idempotency limits exploit to one card per session, but the trust boundary is wrong.
- Fix: Replace `purchaser_id: purchaser_id ?? null` with `purchaser_id: user.id` (drop the metadata field entirely).

**P3-2 — `checkout/membership/confirm/route.ts` — no caller-vs-metadata user_id check**
- The route trusts `user_id` from Stripe session metadata without verifying the authenticated caller matches. A bad actor with a leaked `stripe_session_id` could trigger membership + credit creation on someone else's account (or, if they know their own session ID, replay arbitrarily — though idempotency stops the replay).
- Fix: Require `Authorization` header, call `auth.getUser()`, and return 403 if `user.id !== session.metadata.user_id`.

**P3-3 — HSA/FSA receipt itemization still missing** (carry-over from 2026-04-19 P3-5)
- HSA/FSA still advertised in signup, gift-cards, membership pages with no per-service eligibility tagging or itemized receipt code path. Open in PRE-LAUNCH BLOCKERS.

---

### P4 / LOW

**P4-1 — npm audit: 6 vulns (4 moderate, 2 high)**
- `picomatch` HIGH (ReDoS, GHSA-c2c7-rcm5-vvqj + method injection GHSA-3v7f-55p6-f55p) — transitive via tinyglobby; not in production request path.
- `flatted` (transitive); `brace-expansion` (transitive); `postcss` MODERATE (XSS via unescaped `</style>`, GHSA-qx2v-qp2m-jg93) — pulled by Next.js, not exploitable in current usage.
- `@anthropic-ai/sdk` flagged for upgrade (no specific advisory listed — fix available).
- Action: `npm audit fix` covers picomatch/flatted/brace-expansion non-breakingly; postcss requires `--force` (Next.js major). Defer the breaking fix; non-breaking fixes are safe.

**P4-2 — 28 public tables visible in GraphQL schema to `anon` role**
- All have RLS enabled with policies (verified), so this is discoverability only — the schema lists table names but data is not readable. Still: revoke SELECT from `anon` on tables that should not be discoverable pre-signin (especially `instructor_profiles`, `payroll_*`, `time_entries`).

**P4-3 — Supabase Auth: leaked password protection still disabled** (PRE-LAUNCH BLOCKER, carry-over)
- Requires Supabase Pro plan. Already tracked.

**P4-4 — RLS performance carry-overs**
- 56 `auth_rls_initplan` warnings + 103 `multiple_permissive_policies` warnings. Performance tuning, not security. Carry-over from prior audit.

---

### CLEAN CHECKS

- ✅ Secrets scan: no live keys in tracked files. `.env.local` is empty (`wc -c` = 0). Git log clean for `sk_live_/whsec_/service_role`.
- ✅ Stripe webhook signature validation present.
- ✅ Stripe `sk_live_` not present in `app/` or `components/` bundles; only used inside route handlers via `process.env.STRIPE_SECRET_KEY`.
- ✅ Middleware: `/admin` requires user + role in `ALLOWED_ROLES`; `/dashboard` requires user.
- ✅ Vercel runtime errors: zero `error|fatal` logs in past 24h; zero status-500 responses in past 7 days.
- ✅ TypeScript: `npx tsc --noEmit` exits 0.
- ✅ Error boundaries: `app/error.tsx`, `app/(dashboard)/error.tsx`, `app/(admin)/error.tsx` all present.
- ✅ PII in logs: only generic `console.error('… error:', err)` strings — no full user objects, no emails/phones/HSA fields.
- ✅ Body size limit: `bodySizeLimit: '1mb'` in `next.config.ts`.
- ✅ `bookings/route.ts` + `bookings/cancel/route.ts` both have `auth.getUser()` + `getBookingRatelimit()` (prior P2-5 fixed).
- ✅ `gift-card/create/route.ts` has auth check (prior P3-1 fixed).
- ✅ `bookings/route.ts` returns generic error (prior P2-4 fixed).
- ✅ Membership confirm: strong idempotency (`stripe_session_id` + `user_id`).

---

*End of audit — 2026-05-01*

---

## 2026-05-02 — Marathon Pilates Auditor (scheduled run)

**Stack scanned:** Next.js (src/web) + Supabase (vvqeacukwsvbgixabdef) + Stripe (live) + Bunny.net (Library 620844)
**Note:** project root has migrated to `/Users/adrianwalther/Desktop/_Projects/Marathon Pilates/Marathon Pilates Platform/` (old path empty). Audit ran against new path.

### P2 — High

1. **`app/api/beta-gate/route.ts:14` — beta-gate cookie stores plaintext password**
   - The middleware (`middleware.ts:21–24`) compares `cookies.get('mp_beta').value === BETA_PASSWORD` and the API sets `res.cookies.set('mp_beta', BETA_PASSWORD, …)`. Anyone with cookie read access (XSS-mitigated by httpOnly, but still readable in any browser dev-tools by the user themselves and recoverable from logs/proxies) sees the literal gate password. Recommend: store an HMAC of a server-side secret + timestamp, or a signed JWT, not the password itself.
   - **No rate limiting** on POST `/api/beta-gate` — allows brute-force the gate password unrestricted.
   - Hardcoded fallback `'marathon2026beta'` (`route.ts:3` + `middleware.ts:9`) means if `BETA_PASSWORD` env is ever unset/missing, the gate silently uses a known-public default.
   - **Fix:** import `getCheckoutRatelimit` (or a dedicated gate limiter), refuse to start when `BETA_PASSWORD` env is unset, and use a signed token for the cookie.

2. **`app/api/checkout/membership/confirm/route.ts` — confirm route has no auth & no rate limit**
   - Endpoint accepts `stripe_session_id`, retrieves the Stripe session, and creates a `memberships` row + grants credits using `session.metadata.user_id` as authoritative. No `supabase.auth.getUser()` check; no ratelimit import. Anyone in possession of a paid Stripe session ID can call this and trigger a (race-protected, idempotent) row creation, which limits damage but is still an unauthenticated state-changing endpoint that issues credits worth real money.
   - **Fix:** verify `(await authSupabase.auth.getUser()).id === session.metadata.user_id` before insert; add `getCheckoutRatelimit()` keyed by user_id or stripe_session_id.

3. **`app/api/gift-card/create/route.ts` — gift-card create lacks rate limit & purchaser check**
   - Auth check present (route.ts:23) but no `getCheckoutRatelimit()`. Also does not verify `user.id === session.metadata.purchaser_id` — any authenticated client can race to "finalize" an unfinished gift-card creation for any paid Stripe session ID.
   - **Fix:** add rate limiter; verify purchaser_id matches.

### P3 — Medium

4. **Supabase security advisors — 28 tables exposed to `anon` GraphQL role**
   - `pg_graphql_anon_table_exposed` × 28 — tables incl. `automation_logs`, `automations`, others readable by anon key without sign-in. `pg_graphql_authenticated_table_exposed` × 28 mirrors this for signed-in users.
   - `anon_security_definer_function_executable` × 1 and `authenticated_security_definer_function_executable` × 1 — security-definer functions executable by lower privileges.
   - `auth_leaked_password_protection` disabled — Supabase HIBP check is off.
   - **Fix:** revoke `SELECT` from `anon`/`authenticated` on internal tables; `REVOKE EXECUTE … FROM anon, authenticated` on the SECURITY DEFINER functions; enable leaked-password protection in Auth settings.

5. **`npm audit` — 6 vulns (high: `flatted` ≤3.4.1 prototype pollution; moderate: `picomatch` <2.3.2)**
   - All transitive. Run `npm audit fix` or bump parents (`flatted` is via eslint deps; `picomatch` via micromatch chain).

### P4 — Low

6. **Performance advisors** — 103 `multiple_permissive_policies` + 56 `auth_rls_initplan`. Not security; row-level perf at scale. Consider consolidating duplicate RLS policies and wrapping `auth.uid()` calls in subqueries (`(select auth.uid())`) to avoid per-row re-evaluation.

7. **`bookings/route.ts:71–74`** — uses `err.message` to detect duplicate-key errors. Functional but a brittle string check; switch to PG error code `23505`.

### Clean checks

- ✅ Secrets exposure: no `sk_live_`/`sk_test_`/`whsec_`/service_role/private keys in tracked source. The single `sk-ant-` hit is a placeholder string in setup help UI (`app/(dashboard)/dashboard/generate-class/page.tsx`), not a real key.
- ✅ Stripe webhook (`app/api/webhooks/stripe/route.ts:16`) verifies signature with `STRIPE_WEBHOOK_SECRET`; only handles `checkout.session.completed` and uses atomic RPC `book_session`.
- ✅ Middleware protects `/admin` (with role-allow-list) and `/dashboard`.
- ✅ Error boundaries: `app/error.tsx`, `app/(dashboard)/error.tsx`, `app/(admin)/error.tsx` present.
- ✅ TypeScript: `tsc --noEmit` clean (0 errors).
- ✅ Vercel runtime logs: no errors in last 24h on production.
- ✅ PII handling: no `console.log`/error printing full user objects, emails, phones, or HSA data.
- ✅ Supabase advisors: 0 ERROR-level findings (only WARN/INFO).
- ✅ Already-fixed routes (generate-class/audio/image, checkout, checkout/membership, checkout/gift-card, bookings, bookings/cancel) all have auth + ratelimit + generic error responses.

---

## Audit Run: 2026-05-06T08:57 UTC

**Auditor:** Automated scheduled task (Claude Opus 4.7)
**Scope:** Security + Stability — full 10-point checklist
**Risk profile:** PRODUCTION — live Stripe, PII, HSA/FSA, admin role-based access
**Path note:** project relocated to `/Users/adrianwalther/Desktop/_Projects/Marathon Pilates/Marathon Pilates Platform/`. Scheduled-task SKILL.md still references old `~/Desktop/Marathon Pilates Platform/` — update task definition.

### Summary
- 1 × **P1 Critical**
- 1 × **P2 High** (with caveat — depends on RLS posture)
- 3 × **P3 Medium**
- 1 × **P4 Low**
- Vercel runtime errors last 24h: 0
- TypeScript: clean
- Git history secret scan: clean
- npm audit High/Critical: 2 (dev-only transitive, fixAvailable)

### P1 — CRITICAL: `book_session` RPC is callable by `anon` and `authenticated` roles, allowing free bookings
- **File:** `supabase/migrations/book_session_rpc.sql:7-54`
- **Detail:** Function is `SECURITY DEFINER` and bypasses RLS. The Supabase advisor confirms `EXECUTE` is granted to both `anon` and `authenticated`. Function inserts a `bookings` row with caller-supplied `client_id`, `amount_paid`, and `payment_status` — **no caller validation**.
- **Exploit:** Any visitor with the public anon key (which is in the browser bundle by design) can `POST /rest/v1/rpc/book_session` with arbitrary parameters and create confirmed bookings without paying. Stripe is fully bypassed. Trivially scriptable.
- **Impact:** Direct revenue loss + capacity sabotage (could fill all classes with junk bookings).
- **Fix (run in SQL editor, immediate):**
  ```sql
  REVOKE EXECUTE ON FUNCTION public.book_session(uuid, uuid, numeric, text, text) FROM anon, authenticated, public;
  GRANT EXECUTE ON FUNCTION public.book_session(uuid, uuid, numeric, text, text) TO service_role;
  ```
  Then re-run advisor to confirm both `anon_security_definer_function_executable` and `authenticated_security_definer_function_executable` lints clear. Server routes (`app/api/bookings/route.ts`, `app/api/webhooks/stripe/route.ts`) already use `SUPABASE_SERVICE_ROLE_KEY`, so this revoke does not break legitimate flows.

### P2 — HIGH: `anon` role has SELECT on 28 tables (including PII / payroll / financials)
- **Source:** Supabase security advisor (`pg_graphql_anon_table_exposed` × 28)
- **Tables:** profiles, bookings, memberships, credits, gift_cards, payroll_line_items, payroll_periods, time_entries, leads, lead_tasks, referrals, broadcasts, automations, automation_logs, chat_conversations, chat_messages, generated_classes, instructor_profiles, content_sessions, on_demand_classes, scheduled_sessions, session_templates, private_session_requests, client_milestones, testimonials, waitlist_entries, locations, notifications.
- **Caveat:** Whether actual rows leak depends on each table's RLS row filters. The advisor only flags table-level GRANT SELECT to `anon`. RLS may already restrict reads, but a misconfigured or missing policy on any one of these would expose the whole table to unauthenticated queries via `/rest/v1/<table>?select=*`.
- **Highest-risk if RLS missing:** payroll_line_items, payroll_periods, time_entries (instructor pay — financial PII), leads, profiles, referrals.
- **Recommended fix:** For each table that has no business being readable pre-login, `REVOKE SELECT ON public.<table> FROM anon;` Defense in depth so that an RLS slip doesn't become a public dump. Even tables that should be public (e.g. on_demand_classes preview list) should expose only a view with the safe column subset.
- **Verification:** Manually `SELECT FROM payroll_line_items LIMIT 1` using only the anon key from a clean session and confirm RLS denies. If it returns rows, this is P1.

### P3 — Hardcoded fallback password in `beta-gate` route
- **File:** `app/api/beta-gate/route.ts:3` — `const BETA_PASSWORD = process.env.BETA_PASSWORD ?? 'marathon2026beta'`
- **Impact:** If `BETA_PASSWORD` env var is ever unset (rollback, new env, misconfig), the literal string `marathon2026beta` grants beta-gate access. The fallback is also visible to anyone with repo read access.
- **Fix:** Remove the fallback; throw at boot if unset. `const BETA_PASSWORD = process.env.BETA_PASSWORD; if (!BETA_PASSWORD) throw new Error('BETA_PASSWORD required')`.

### P3 — `beta-gate` route has no rate limiting
- **File:** `app/api/beta-gate/route.ts` — no `getCheckoutRatelimit`/`getAiRatelimit`/equivalent.
- **Impact:** Endpoint is brute-forceable. With short or guessable beta password (and the known fallback), attackers can script attempts.
- **Fix:** Add a per-IP rate limiter (e.g. 5/min) before the password compare.

### P3 — Supabase: `auth_leaked_password_protection` not enabled
- **Source:** Supabase security advisor.
- **Detail:** HaveIBeenPwned compromised-password check disabled. Already tracked in PRE-LAUNCH BLOCKERS (requires Supabase Pro plan upgrade).

### P4 — Non-atomic credit decrement in `app/api/bookings/route.ts:54-66`
- **Detail:** Pattern is read `used_credits` → increment in app code → write. Two concurrent bookings using the same credit row could each see the same `used_credits`, both increment to N+1, and effectively grant a free booking. Not exploitable by an external attacker, but a stability bug.
- **Fix:** Use SQL atomic update — `UPDATE credits SET used_credits = used_credits + 1 WHERE id = $1 AND used_credits < total_credits RETURNING used_credits`. Reject the booking if the update affected 0 rows.

### Other checklist results (no findings)
- **Secrets in tracked files:** clean (only placeholder `sk-ant-...` UI text in generate-class page).
- **Git history secrets:** clean.
- **Stripe security:** webhook validates `STRIPE_WEBHOOK_SECRET` signature (`app/api/webhooks/stripe/route.ts:16`) and uses RPC for atomic capacity-checked insert. `STRIPE_SECRET_KEY` only referenced in `app/api/` (server-only). Membership confirm has strong `(stripe_session_id, client_id)` idempotency check.
- **Vercel runtime errors (24h):** 0 errors / 0 fatals in production.
- **TypeScript `tsc --noEmit`:** clean.
- **Error boundaries:** present at `app/error.tsx`, `app/(dashboard)/error.tsx`, `app/(admin)/error.tsx`.
- **PII in logs:** clean — no `console.log`/`console.error` printing emails, phones, profile objects, or HSA tokens.
- **npm audit High/Critical:** `flatted` (high), `picomatch` (high) — both are dev-only transitive (no downstream effects), `fixAvailable: true`. Run `npm audit fix` at convenience.
- **HSA/FSA:** still tracked in PRE-LAUNCH BLOCKERS (receipt itemization), no regression.

### Action priority
1. **TODAY:** Revoke `EXECUTE` on `book_session` from `anon`/`authenticated` (P1).
2. **THIS WEEK:** Verify RLS row-level reads on `payroll_*`, `profiles`, `leads`, `referrals`, `time_entries` tables using a clean anon key session. Revoke anon `SELECT` on tables with no public-facing read use case.
3. **BEFORE LAUNCH:** Remove hardcoded beta password fallback; add rate limiter to beta-gate.
4. **HOUSEKEEPING:** `npm audit fix`; convert credit decrement to atomic SQL.


---
## 2026-05-19 — Scheduled audit

**Scope checks completed:** secrets-scan, npm audit, Supabase advisors (security), Vercel runtime logs (24h prod), tsc, API route auth/rate-limit, Stripe webhook, error boundaries, PII logs, git history. Performance advisors output truncated (>176KB) — security advisors fetched in full.

### P1 / Critical
- **book_session RPC privilege escalation** — `src/web/supabase/migrations/book_session_rpc.sql:7-54` declares `SECURITY DEFINER` with EXECUTE granted to `authenticated`. Supabase advisor 0029 confirms `/rest/v1/rpc/book_session` is callable by any signed-in user. Function performs no `auth.uid() = p_client_id` check, so an attacker with any user account can POST `{p_session_id, p_client_id: <victim>, p_payment_status:"paid"}` directly to Supabase REST and create free paid bookings for arbitrary users, bypassing Stripe and RLS. Both legit callers (`app/api/bookings/route.ts:42`, `app/api/webhooks/stripe/route.ts:59`) use the service-role key, so revoking from authenticated does not break the app. Fix: `REVOKE EXECUTE ON FUNCTION public.book_session(uuid,uuid,numeric,text,text) FROM anon, authenticated;`

### P2 / High
- **next@16.2.4 middleware/proxy bypass** — GHSA-26hh-7cqf-hhc6 (CVSS 7.5). `middleware.ts` is the sole gate for `/admin` and `/dashboard`; segment-prefetch routes can sidestep it. Fix: bump to `next@^16.2.6`.
- **next@16.2.4 DoS via Server Components** — GHSA-8h8q-6873-q5fj (CVSS 7.5). Same upgrade.
- **flatted ≤3.4.1 prototype pollution** — GHSA-rf6f-7fwh-wjgh (HIGH, transitive). `npm audit fix`.
- **Credit drain via missing client_id filter** — `app/api/bookings/route.ts:55-66` reads & updates `credits` by `id` only, using the service-role client. An authenticated user can POST `{session_id, credit_id:<victim's credit>}` and book themselves while burning the victim's credit. Fix: add `.eq('client_id', user.id)` to both the SELECT and UPDATE, and reject if no row matches.

### P3 / Medium
- **@anthropic-ai/sdk@0.90.0** insecure default file perms — GHSA-p7fg-763f-g4gf. Upgrade to ≥0.91.1 (SemVer-major).
- **next XSS via CSP nonces** — GHSA-ffhc-5mcf-pf4q (moderate). Same Next upgrade.
- **Missing error boundaries** — only `app/error.tsx` exists. Add `app/dashboard/error.tsx`, `app/admin/error.tsx`, `app/global-error.tsx` so segment-level errors don't unmount the entire shell.
- **Credit decrement race** — `bookings/route.ts:55-66` SELECT-then-UPDATE on `credits.used_credits`. Replace with single `UPDATE credits SET used_credits = used_credits + 1 WHERE id = ? AND client_id = ? RETURNING used_credits`.
- **Supabase Auth: leaked-password protection disabled** — advisor `auth_leaked_password_protection`. Enable HaveIBeenPwned check in Auth → Policies.

### P4 / Low
- **brace-expansion DoS** (moderate, transitive devDep) — `npm audit fix`.
- **next cache-poisoning on middleware redirects** — GHSA-3g8h-86w9-wvmq (low). Same Next upgrade.
- **BETA_PASSWORD cookie value = the password itself** — `middleware.ts:9`, `app/api/beta-gate/route.ts:14`. Cookie is httpOnly+secure so XSS doesn't reach it, but the password lands verbatim in any log/screenshot/devtools capture. Store an HMAC of the password instead, or rotate to a random token.

### Clean
- Secrets scan in tracked files: no `sk_live_`, `whsec_`, `sk-ant-api`, `sk-proj-`, or JWT patterns found outside of references in markdown describing what's in env vars.
- Stripe webhook signature validation present (`app/api/webhooks/stripe/route.ts:16`); booking lookup makes the handler effectively idempotent for `checkout.session.completed`.
- All API routes (beta-gate, bookings, bookings/cancel, checkout/*, gift-card/create, generate-*) have `supabase.auth.getUser()` guards; AI + checkout routes have rate limiting via `@/lib/ratelimit`.
- `tsc --noEmit`: exit 0, no errors.
- Vercel runtime logs (production, level=error, 24h): zero entries.
- No PII (`email`/`phone`/`password`/`profile`/`user`) printed via `console.log`.
- Git history: no `sk_live_`/`whsec_`/`sk-ant-api` in last 30 days of commits.

---
## 2026-05-25 — Scheduled audit

**Auditor:** Automated scheduled task (Claude Opus 4.7, 1M context)
**Scope:** full 10-point checklist
**Project path:** `/Users/adrianwalther/Desktop/_Projects/Marathon Pilates/Marathon Pilates Platform/` (note: task SKILL.md still references stale `~/Desktop/Marathon Pilates Platform/` — update needed)

### Summary
- **1 × P1 Critical** — carryover, still unfixed
- **3 × P2 High** — 2 carryovers + 1 still-present credit-drain
- **3 × P3 Medium** — carryovers
- **2 × P4 Low** — carryovers
- Vercel runtime logs (24h production, level=error|fatal): **0 entries**
- `tsc --noEmit`: exit 0, clean
- Secrets scan in tracked files: clean (the only `sk-ant-` hit is documentation `<code>` in `generate-class/page.tsx:427`, not an actual key)
- Git history secret scan: clean

### P1 / Critical (UNCHANGED — still exploitable)
- **book_session RPC privilege escalation** — `src/web/supabase/migrations/book_session_rpc.sql:7-54`. Advisor `authenticated_security_definer_function_executable` still present today. EXECUTE granted to `authenticated` role; function is `SECURITY DEFINER` with no `auth.uid() = p_client_id` check. Any signed-in user can POST `/rest/v1/rpc/book_session` with arbitrary `p_client_id`, `p_amount_paid=0`, `p_payment_status='paid'` to create free confirmed bookings or assign bookings to other users. Both legitimate callers (`app/api/bookings/route.ts:42`, `app/api/webhooks/stripe/route.ts:59`) use the service-role key — revoking from authenticated does NOT break the app.
- **Fix:** `REVOKE EXECUTE ON FUNCTION public.book_session(uuid,uuid,numeric,text,text) FROM anon, authenticated;` (one-line SQL in Supabase editor)

### P2 / High
- **Credit drain via missing client_id filter** — `app/api/bookings/route.ts:55-66`. SELECT + UPDATE of `credits` row by `id` only, via service-role client. Authenticated user can pass `credit_id: <victim's UUID>` and burn another user's credit while booking themselves. **Fix:** add `.eq('client_id', user.id)` to both SELECT and UPDATE; reject if no row.
- **next@16.2.4** — still installed (package.json:`"next": "^16.2.4"`). Vulnerabilities GHSA-26hh-7cqf-hhc6 (middleware/proxy bypass, CVSS 7.5) and GHSA-8h8q-6873-q5fj (DoS, CVSS 7.5). `middleware.ts` is the sole gate on `/admin` + `/dashboard`. **Fix:** `npm install next@^16.2.6` (or latest 16.x).
- **flatted ≤3.4.1 prototype pollution** (HIGH, transitive). `npm audit fix`.

### P3 / Medium
- **picomatch high CVE** (transitive dev dep). `npm audit fix`.
- **@anthropic-ai/sdk@0.90.0** insecure default file perms (GHSA-p7fg-763f-g4gf). Upgrade to ≥0.91.1.
- **Credit decrement race** — `bookings/route.ts:55-66` SELECT-then-UPDATE on `credits.used_credits`. Replace with `UPDATE credits SET used_credits = used_credits + 1 WHERE id = ? AND client_id = ? RETURNING used_credits` (single atomic SQL — also addresses the P2 above if combined).
- **bookings/route.ts:71** — leaks raw `err.message` to client via `if (message.includes(...))`. The branch only returns `'Already booked'`, but a thrown PG error with sensitive substring could still alter the user-visible status code. Low blast radius but worth wrapping.
- **Supabase Auth: leaked-password protection disabled** (advisor `auth_leaked_password_protection`). Enable HaveIBeenPwned check in Auth → Policies.

### P4 / Low
- **BETA_PASSWORD = literal cookie value** — `middleware.ts:9`, `app/api/beta-gate/route.ts:14`. Hardcoded fallback `'marathon2026beta'` AND the password itself is stored in the cookie. httpOnly+secure mitigates XSS exfil, but the literal lands in any log/screenshot/devtools capture. Also: no rate-limiter on `/api/beta-gate` — brute-forceable. **Fix:** drop the fallback (require env), set the cookie value to an HMAC, add `getCheckoutRatelimit()` style limiter.
- **31 `pg_graphql_authenticated_table_exposed` advisor entries** — `profiles, leads, payroll_*, time_entries, gift_cards, referrals, …` are all visible to the `authenticated` role via PostgREST/GraphQL. Functionally moot IF RLS row policies are correctly scoped to `auth.uid()`, but worth re-verifying with a clean session that a non-admin user cannot read other users' rows from these tables.

### Performance advisors (informational)
- 198 lints (159 WARN / 39 INFO / 0 ERROR). Breakdown: `multiple_permissive_policies` ×103, `auth_rls_initplan` ×56, `unindexed_foreign_keys` ×26, `unused_index` ×13. Pre-launch the indexing and RLS-initplan rewrites are worth a sweep; not blocking.

### Clean
- Stripe webhook signature validation present (`app/api/webhooks/stripe/route.ts:16`); idempotent via existing-booking lookup before insert.
- `STRIPE_SECRET_KEY` only used in `app/api/**` (server-only) — never imported in `app/(*)` client pages or `components/`.
- All AI + checkout + booking API routes have `supabase.auth.getUser()` + ratelimit guards.
- Error boundaries: `app/error.tsx`, `app/(dashboard)/error.tsx`, `app/(admin)/error.tsx` all present.
- No PII printed via console (`user.email`/`phone`/`hsa`/`ssn` patterns clean).
- `tsc --noEmit`: clean.
- Vercel production runtime errors (24h): 0.
- Git history: no committed `sk_live_`/`whsec_`/`sk-ant-api` keys.

### Repeat-offender action priority
1. **TODAY (P1):** Run the one-line REVOKE on `book_session`. Quoted in finding above. Three audits in a row have flagged this.
2. **TODAY (P2):** Add `.eq('client_id', user.id)` filter to credit SELECT/UPDATE in `bookings/route.ts`.
3. **THIS WEEK (P2):** `npm install next@^16.2.6 && npm audit fix`.
4. **BEFORE LAUNCH:** Remove BETA_PASSWORD fallback + rate-limit `/api/beta-gate`; enable Supabase leaked-password protection; verify RLS row reads on PII tables with a non-admin session.
