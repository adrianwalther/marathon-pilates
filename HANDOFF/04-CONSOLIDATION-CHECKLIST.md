# Consolidation Checklist — Move Everything Under Marathon Pilates

> **Goal:** Move every service the platform depends on off Adrian's personal accounts and onto the Marathon Pilates business identity (`adrian@marathonpilates.com`). This is the actual execution checklist — work through it top to bottom.

Last updated: 2026-05-27
Owner: Adrian (executing) / Marathon Pilates (destination)

---

## Pre-Flight (do this first)

- [ ] Confirm `adrian@marathonpilates.com` mailbox is working — you'll receive a lot of verification emails
- [ ] Make sure you can receive 2FA codes (SMS, authenticator app)
- [ ] Set aside ~2 hours of uninterrupted time. Don't do this piecemeal.
- [ ] Confirm Ruby is OK with platform being unavailable for ~5 minutes during the Vercel transfer (no actual downtime, but DNS may flicker)

---

## Step 1 — Backup Everything (before touching anything)

### 1a. Mirror-clone the GitHub repo

```bash
cd ~/Desktop
git clone --mirror https://github.com/adrianwalther/marathon-pilates.git marathon-pilates-backup.git
```

This captures everything — branches, tags, refs, history. If anything goes wrong with the transfer, you can push from this mirror.

### 1b. Backup the Supabase database

```bash
# Replace <password> with your Supabase DB password (Settings → Database)
pg_dump "postgresql://postgres.vvqeacukwsvbgixabdef:<password>@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  > ~/Desktop/marathon-pilates-db-backup-$(date +%Y%m%d).sql
```

Verify it worked:
```bash
ls -lh ~/Desktop/marathon-pilates-db-backup-*.sql   # should be at least a few MB
```

### 1c. Export Vercel env vars

```bash
cd "/Users/adrianwalther/Desktop/_Projects/Marathon Pilates/Marathon Pilates Platform/src/web"
vercel env pull .env.backup.local
```

Move that file somewhere safe (NOT into git). You'll need these values when re-creating env vars on the new Vercel team.

---

## Step 2 — Create New Business Accounts

Sign up for each service using `adrian@marathonpilates.com`. Enable 2FA on every one.

- [ ] **GitHub** → github.com/organizations/new → create org `marathon-pilates` (or similar). Use the same `adrian@marathonpilates.com` email
- [ ] **Vercel** → vercel.com/teams/create → new team, name `Marathon Pilates`
- [ ] **Supabase** → supabase.com → New Organization → "Marathon Pilates"
- [ ] **Bunny.net** → new account (skip if not reactivating today)
- [ ] **ElevenLabs** → new account → re-subscribe Starter plan ($5.49/mo)
- [ ] **Anthropic** → console.anthropic.com → new account
- [ ] **OpenAI** → platform.openai.com → new account
- [ ] **Upstash** → console.upstash.com → new account

> 💡 Same email can be used everywhere — these are all separate companies, no conflicts.

---

## Step 3 — Transfer GitHub

Do this first. Vercel re-points to the new repo automatically once the transfer completes.

1. Go to https://github.com/adrianwalther/marathon-pilates/settings
2. Scroll to **Danger Zone** → **Transfer Repository**
3. Type `marathon-pilates/marathon-pilates` (or whatever you named the org)
4. Confirm — GitHub sends a notification to the destination org
5. Accept the transfer from the new org's notifications
6. Once accepted, the repo lives at `github.com/marathon-pilates/marathon-pilates`

**Update your local git remote:**
```bash
cd "/Users/adrianwalther/Desktop/_Projects/Marathon Pilates/Marathon Pilates Platform"
git remote set-url origin https://github.com/marathon-pilates/marathon-pilates.git
git remote -v   # confirm
```

> ⚠️ Old URL `adrianwalther/marathon-pilates` will redirect for ~90 days, but don't rely on this long-term.

---

## Step 4 — Transfer Vercel

1. Go to https://vercel.com/adrianwalthers-projects/marathon-pilates/settings
2. Scroll to **Transfer Project**
3. Pick the new `Marathon Pilates` team
4. Confirm

**Re-add all env vars on the new team:**

Open `.env.backup.local` (from Step 1c) and re-create each variable on the new project's Settings → Environment Variables. Critical ones:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_PUBLISHABLE_KEY` *(NEXT_PUBLIC_)*
- [ ] `ANTHROPIC_API_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `ELEVENLABS_API_KEY`
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `BUNNY_API_KEY`
- [ ] `BUNNY_LIBRARY_ID`
- [ ] `BETA_PASSWORD`

> 💡 **Mark each as "Sensitive"** when adding — this hides the value in logs.
> 💡 If you're already rotating keys (Step 7), use the NEW values here, not the old ones.

**Re-connect GitHub integration:**
- Settings → Git → Connect to the new `marathon-pilates/marathon-pilates` repo
- Verify auto-deploys work by pushing a small commit

**Re-configure custom domain:**
- Currently using `marathon-pilates.vercel.app` (no custom domain yet)
- If you add `app.marathonpilates.com` later, do it on the new team

---

## Step 5 — Transfer Supabase

1. Log into supabase.com with Adrian's personal account
2. Go to Project Settings → General → **Transfer Project**
3. Select the new Marathon Pilates org
4. Confirm

**No downtime, no URL change.** Project ID stays `vvqeacukwsvbgixabdef`.

**Update the project's settings:**
- Invite `adrian@marathonpilates.com` (your new email) as Owner on the new org
- Remove personal email if desired

---

## Step 6 — Migrate API Service Accounts

These all need fresh API keys on the business accounts. Update Vercel env vars as you go.

- [ ] **Bunny.net** — when reactivating videos pre-launch, upload directly to new account. Update `BUNNY_LIBRARY_ID` and `BUNNY_API_KEY`.
- [ ] **ElevenLabs** — new account, re-subscribe Starter. Generate new API key. Update `ELEVENLABS_API_KEY`.
- [ ] **Anthropic** — new account. Generate new API key. Update `ANTHROPIC_API_KEY`.
- [ ] **OpenAI** — new account. Generate new API key. Update `OPENAI_API_KEY`.
- [ ] **Upstash Redis** — new account, new database. Update `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

---

## Step 7 — Security Hardening (post-transfer)

- [ ] Rotate Stripe keys (only if Stripe account migrates — confirm with Ruby first)
- [ ] Rotate Supabase service role key (Dashboard → Settings → API → Reveal & rotate)
- [ ] Rotate Stripe webhook secret
- [ ] Mark all Vercel env vars as **Sensitive**
- [ ] Enable 2FA on every service account (Vercel, Supabase, GitHub, Anthropic, OpenAI, ElevenLabs, Stripe, Bunny, Upstash)
- [ ] Delete old API keys from personal accounts (after confirming new ones work)

---

## Step 8 — Update Documentation

Once everything's moved:

- [ ] Update `CLAUDE.md` — change repo URL, Vercel project URL
- [ ] Update `HANDOFF/00-PLATFORM-OVERVIEW.md` — same
- [ ] Update `HANDOFF/03-CLAUDE-SETUP.md` — new GitHub URL
- [ ] Update `HANDOFF/01-ACCOUNT-MIGRATION.md` — mark services as ✅ Done with dates
- [ ] Update `SUBSCRIPTIONS.md` — owner column to Marathon Pilates

---

## Step 9 — Verify

- [ ] Push a small commit, confirm Vercel auto-deploys
- [ ] Log into the platform with your normal account — confirm it works
- [ ] Try Build a Class — confirm AI services still work (Anthropic + OpenAI + ElevenLabs)
- [ ] Check admin portal loads
- [ ] Test a Stripe webhook event (Stripe Dashboard → Webhooks → Send test event)

---

## Rollback Plan

If anything breaks:
- **GitHub:** transfer back to your personal account from the new org's Settings → Danger Zone
- **Vercel:** transfer project back via the same flow
- **Supabase:** transfer org back, or restore from your `.sql` backup
- **API services:** old keys still work until you delete them — re-add to Vercel env vars

Keep your backups (`Step 1`) for at least 30 days after everything's verified working.

---

## Time Estimate

| Phase | Time |
|-------|------|
| Backup (Step 1) | 15 min |
| Account creation (Step 2) | 30 min |
| GitHub + Vercel transfer (Steps 3–4) | 30 min |
| Supabase transfer (Step 5) | 5 min |
| API account migration (Step 6) | 30 min |
| Security hardening (Step 7) | 20 min |
| Doc updates + verify (Steps 8–9) | 20 min |
| **Total** | **~2.5 hours** |

Block off a Saturday morning, knock it out in one sitting.
