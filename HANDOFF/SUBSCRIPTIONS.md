# Subscriptions & Services — Cost + Ownership Inventory

> Single source of truth for every external service the platform depends on: what it costs, which env var(s) it maps to, who owns it now, and where it needs to go for the business handoff.
>
> **Step-by-step transfer instructions live in [`01-ACCOUNT-MIGRATION.md`](01-ACCOUNT-MIGRATION.md).** This doc is the *inventory + checklist*; that doc is the *how*.

Last updated: 2026-06-17

> ⚠️ **Pricing is approximate / current-knowledge — verify at signup.** Tiers and prices change. Usage-based costs are rough single-studio estimates that scale with volume.

---

## Launch cost summary

- **Fixed monthly subscriptions:** ~**$80–130/mo** (Supabase + Vercel + Workspace + ElevenLabs + Resend, etc.)
- **Usage-based (pay per use):** Anthropic + OpenAI image gen (~$10–40/mo combined at modest volume) + Bunny streaming.
- **Stripe:** no monthly fee — ~2.9% + $0.30 per charge (a cost *of* revenue, not a subscription).
- This **replaces** the current Arketa booking + marketing-package spend — part of it is a swap, not net-new.

---

## Master inventory

| Service | Purpose | Tier / model | Est. cost/mo | Env var(s) | Current owner | Target owner | Transfer type | Status |
|---|---|---|---|---|---|---|---|---|
| **Supabase** | DB, auth, all data | **Pro** (avoids free-tier auto-pause + adds backups) | ~$25 | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Adrian personal org | Marathon Pilates org | Transfer in place (no downtime, same URL) | ⏳ Holding |
| **Vercel** | App hosting | **Pro** (commercial use) | ~$20/member | — (platform) | `adrianwalthers-projects` | Marathon Pilates team | Transfer project (re-add env vars) | ⏳ Holding |
| **Stripe** | Payments (live) | Per-transaction | ~2.9% + $0.30 | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Ruby / business (confirm) | Marathon Pilates LLC | Confirm entity — don't recreate | ❓ Confirm w/ Ruby |
| **Anthropic (Claude)** | Build-a-Class, nudges, health flags, celebrations | Usage (per token) | ~$5–30 | `ANTHROPIC_API_KEY` | Adrian personal | Studio account | Recreate + new key | ⏳ Holding |
| **OpenAI** | Build-a-Class artwork (image gen) | Usage (per image) | a few $ | `OPENAI_API_KEY` | Adrian personal | Studio account | Recreate + new key | ⏳ Holding |
| **ElevenLabs** | Build-a-Class audio | Starter (~$5) / Creator (~$22) | ~$5–22 | `ELEVENLABS_API_KEY` | Adrian personal | Studio account | Recreate + new key (re-subscribe) | ⏳ Holding |
| **Upstash Redis** | Rate limiting (AI routes fail closed without it) | Free tier likely OK | ~$0–10 | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Adrian personal | Studio account | Recreate + new keys | ⏳ Holding |
| **Resend** | Email — transactional now, newsletter later | Free ≤3k/mo → Pro ~$20 | $0 → ~$20 | `RESEND_API_KEY`, `EMAIL_FROM` | Not set up yet | Studio account | Create fresh + verify DNS | ⏳ Not started |
| **Bunny.net** | On-Demand video hosting | Usage (storage + streaming) | ~$1–10 | `BUNNY_API_KEY`, `BUNNY_LIBRARY_ID` (re-add at launch) | Adrian (assumed) | Studio account | Recreate + re-upload at launch | ⏳ Holding |
| **GitHub** | Code repo | Free (private) | $0 | — | `adrianwalther` personal | `marathon-pilates` org | Transfer repo (keeps history) | ⏳ Holding |
| **Google Workspace** | @marathonpilates.com mailboxes | Business Starter, per user | ~$6 × users | — (`EMAIL_FROM` sender) | Confirm w/ Ruby | Marathon Pilates | Ownership-level | ❓ Confirm |
| **Domain** (marathonpilates.com) | Brand + `app.` subdomain | Annual | ~$15/yr | `NEXT_PUBLIC_APP_URL` | Confirm registrar | Marathon Pilates LLC | Registrar ownership | ❓ Confirm |
| **Gusto** | Payroll | Per-seat (when used) | TBD | — | Not activated | Marathon Pilates LLC | Activate fresh (don't migrate) | ⏳ Activate at first payroll |

Also: `BETA_PASSWORD` (the beta gate) — not a service; **remove from Vercel at launch** to open the site.

---

## Transfer playbook (summary)

Only **GitHub, Vercel, Supabase** support a true *transfer* that keeps data/history. Everything else has no real transfer — the cleanest *and most secure* path is to **recreate under a business account and regenerate the key** (rotating every key during migration severs the personal accounts and invalidates any key that ever touched a laptop or chat).

1. **Create the business email accounts first** (service accounts need them; lock down email recovery before routing anything through it).
2. **Transfer the 3 data services** — GitHub → org, Vercel → team, Supabase → org.
3. **Recreate the API services** (Anthropic, OpenAI, ElevenLabs, Upstash, Resend, Bunny) → **regenerate every key**.
4. **Paste all new keys into Vercel env** → redeploy.
5. **Verify: `GET https://marathon-pilates.vercel.app/api/health`** → every line `"ok": true` confirms the data services + keys are all wired end-to-end.
6. **Revoke the old keys** from the personal accounts.

---

## ⚙️ Production env status (checked 2026-06-17 via `/api/health`)

Currently **incomplete in Vercel** — this is the live launch blocker:

| Check | Status |
|---|---|
| `ai` (Anthropic/OpenAI/ElevenLabs keys) | ✅ set |
| Supabase URL + anon key (client) | ✅ set |
| **`SUPABASE_SERVICE_ROLE_KEY`** | ❌ **missing** → breaks ALL server data ops (booking, fulfillment, admin) |
| **`STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`** | ❌ **missing** → checkout |
| **`UPSTASH_REDIS_REST_URL` / `_TOKEN`** | ❌ **missing** → AI routes fail closed (Build-a-Class 429) |
| `email` (Resend) | dry-run (logged, not sent) — fine pre-launch |

**Action:** set the 5 missing vars in Vercel (service-role key must be the new `sb_secret_` format) + redeploy, then re-check `/api/health`. See the full env list in [`../src/web/.env.example`](../src/web/.env.example).
