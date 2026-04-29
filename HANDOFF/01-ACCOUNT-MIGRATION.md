# Account Migration — Personal → Marathon Pilates Business

> **Goal:** Every service used to build and run this platform should live under a Marathon Pilates business account, not Adrian's personal accounts. This is required for a clean business handoff and is critical if the business is ever sold.

Last updated: 2026-04-29

---

## Summary Table

| Service | Current Owner | Target Owner | Priority | Complexity |
|---------|--------------|--------------|----------|------------|
| GitHub | `adrianwalther` (personal) | `marathon-pilates` org | 🔴 High | Easy |
| Vercel | `adrianwalthers-projects` team | Marathon Pilates team | 🔴 High | Easy |
| Supabase | Adrian's personal org | Marathon Pilates org | 🔴 High | Medium |
| Stripe | Ruby's account (confirm) | Marathon Pilates LLC | 🔴 High | Confirm |
| Bunny.net | Adrian's account (assumed) | Marathon Pilates account | 🟡 Medium | Easy |
| ElevenLabs | Adrian's account | Marathon Pilates account | 🟡 Medium | Easy |
| Anthropic (Claude API) | Adrian's account | Marathon Pilates account | 🟡 Medium | Easy |
| OpenAI (DALL-E 3) | Adrian's account | Marathon Pilates account | 🟡 Medium | Easy |
| Upstash Redis | Adrian's account | Marathon Pilates account | 🟡 Medium | Easy |
| Gusto | Not yet activated | Marathon Pilates LLC | 🔴 High | Activate fresh |
| Domain (marathonpilates.com) | Confirm registrar | Marathon Pilates LLC | 🔴 High | Confirm |
| Google Workspace / Email | Ruby's personal Gmail? | studio@marathonpilates.com | 🟡 Medium | Confirm |

---

## Step-by-Step Migration Instructions

### 1. GitHub — Transfer repo to a Marathon Pilates org

**Current:** `https://github.com/adrianwalther/marathon-pilates`  
**Target:** `https://github.com/marathon-pilates/marathon-pilates` (or similar org name)

**Steps:**
1. Adrian creates a new GitHub organization: `marathon-pilates` at github.com/organizations/new
2. Go to repo Settings → Danger Zone → Transfer Repository → type `marathon-pilates`
3. Invite Jazz (and Ruby if desired) as org members with appropriate roles
4. Update Vercel's GitHub integration to point to the new org/repo
5. The git remote URL on Adrian's local machine changes — update with:
   ```bash
   git remote set-url origin https://github.com/marathon-pilates/marathon-pilates.git
   ```

> ⚠️ After transfer, the old URL `adrianwalther/marathon-pilates` auto-redirects for a while, but don't rely on this long-term.

---

### 2. Vercel — Transfer project to Marathon Pilates team

**Current:** Under `adrianwalthers-projects` Vercel team  
**Target:** A new `Marathon Pilates` Vercel team

**Steps:**
1. Create a new Vercel team: vercel.com/teams (use marathon-pilates@[domain] account)
2. Go to project Settings → Transfer Project → select new team
3. Re-add all environment variables in the new team's project (they don't transfer)
4. Update the GitHub integration to the new org/repo (step 1 first)
5. Re-configure the custom domain (app.marathonpilates.com) in the new team

> ⚠️ The `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and all other env vars need to be manually re-added after transfer — keep SUBSCRIPTIONS.md updated with what keys exist.

---

### 3. Supabase — Transfer project to a Marathon Pilates organization

**Current:** Adrian's personal Supabase org  
**Project ID:** `vvqeacukwsvbgixabdef`

**Steps:**
1. Create a Supabase organization: supabase.com → New Organization → "Marathon Pilates"
2. Go to Project Settings → General → Transfer Project → select new org
3. Invite Jazz as an org member (Owner or Admin role)
4. No downtime — the project URL stays the same after transfer

---

### 4. Stripe — Confirm business account

**Questions to confirm with Ruby:**
- Is the Stripe account registered to Marathon Pilates LLC, or to Ruby personally?
- Is the bank account linked a business checking account?
- Who has access to the Stripe dashboard? (Should be Ruby + Jazz)

**If it's under a personal account:**
- Stripe supports transferring connected accounts — contact Stripe support
- Alternatively, create a new Stripe account under the business entity and update the Stripe keys in Vercel

> ⚠️ Stripe keys are already in Vercel env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`). Any account change requires updating both.

---

### 5. Bunny.net — Move to business account

**Steps:**
1. Create a new Bunny.net account with a Marathon Pilates email
2. Before re-uploading videos (which must happen pre-launch anyway — see SUBSCRIPTIONS.md), upload directly to the new account
3. Note the new Library ID and update the `BUNNY_LIBRARY_ID` constant in:
   - `src/web/app/(dashboard)/dashboard/on-demand/page.tsx` (line ~10)
4. Update `BUNNY_API_KEY` in Vercel env vars

---

### 6. ElevenLabs — Move to business account

1. Create ElevenLabs account with studio email
2. Re-subscribe to Starter plan ($5.49/mo)
3. The "Rachel" voice is a default voice — no re-cloning needed
4. Generate new API key → update `ELEVENLABS_API_KEY` in Vercel

---

### 7. Anthropic + OpenAI — Move to business accounts

Both are pay-as-you-go with no active subscriptions — easy to move.

**Anthropic:**
1. Create account at console.anthropic.com with studio email
2. Generate new API key → update `ANTHROPIC_API_KEY` in Vercel

**OpenAI:**
1. Create account at platform.openai.com with studio email
2. Generate new API key → update `OPENAI_API_KEY` in Vercel

---

### 8. Upstash Redis — Move to business account

1. Create account at console.upstash.com with studio email
2. Create new Redis database (free tier is fine for launch)
3. Copy new REST URL and token → update in Vercel:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

### 9. Gusto — Activate fresh under business

Gusto hasn't been activated yet — activate it directly under the Marathon Pilates LLC entity. Don't migrate; set up fresh.

---

### 10. Domain — marathonpilates.com

**Confirm:**
- Who is the registrar? (GoDaddy, Namecheap, Google Domains, etc.)
- Is it registered to Ruby personally or to the business?
- Whoever holds the domain controls the brand — it must be in the business's name for a clean sale

**For the app subdomain** (app.marathonpilates.com):
- Add a CNAME record in the domain registrar pointing to `cname.vercel-dns.com`
- Then add the custom domain in Vercel project settings

---

## Email Accounts to Create

For a professional setup, all service accounts should use:

| Account | Email |
|---------|-------|
| Primary studio | ruby@marathonpilates.com |
| Studio manager | jazz@marathonpilates.com |
| Platform/tech | tech@marathonpilates.com (for service accounts) |
| General | info@marathonpilates.com |

All of these require Google Workspace ($6/user/mo) or similar.

---

## Migration Priority Order

Do these in this order to minimize disruption:

1. **GitHub org** (free, fast, no downtime)
2. **Supabase org transfer** (free, fast, no downtime)
3. **Create all business email accounts first** (needed for service accounts)
4. **Register new service accounts** (Bunny, ElevenLabs, Anthropic, OpenAI, Upstash) — these happen at launch anyway when you reactivate Bunny
5. **Vercel transfer** — coordinate with GitHub transfer, update all env vars at same time
6. **Stripe** — confirm with Ruby, low urgency until launch
7. **Domain ownership** — confirm and fix with Ruby's registrar
