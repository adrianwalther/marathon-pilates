# Marathon Pilates Platform — Audit Log

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
