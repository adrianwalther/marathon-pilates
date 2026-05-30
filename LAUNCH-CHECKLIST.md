# Launch Checklist — Marathon Pilates Platform

> Quick, checkable list of what's left before going live. For the phased rollout strategy (Phase 0→4, beta gates, Arketa cutover), see `specs/14-launch-plan.md`. Detailed context for each item lives in `CLAUDE.md` → "Pending Before Launch".
>
> **Owner key:** 🛠️ Adrian/dev · 🟣 Ruby (business/legal) · 👥 Jazz / Susan
>
> _Last updated: 2026-05-30_

---

## 🔐 Accounts & Security
- [ ] 🛠️ **Fix `adrian@marathonpilates.com` recovery** — remove the former person's phone from recovery + 2-step verification (**do this first** — everything hangs off this email)
- [ ] 🟣 Confirm who admins the **Google Workspace** and **Claude Team** for the business
- [ ] 🛠️ **Migrate service accounts to business orgs** (GitHub, Vercel, Supabase) under `adrian@marathonpilates.com`, and **add a 2nd owner** (Jazz/Ruby) to each — see `HANDOFF/01-ACCOUNT-MIGRATION.md`
- [ ] 🛠️ Rotate all API keys + enable 2FA on launch day

## 📧 Email
- [ ] 🛠️🟣 **Phase 1 — transactional:** connect **Resend**, set `RESEND_API_KEY` / `EMAIL_FROM`, flip the (built, dry-run) booking emails live _(Ruby: cost approval)_
- [ ] 🛠️ Email **DNS** — DKIM/SPF/DMARC (likely a `send.marathonpilates.com` subdomain)
- [ ] 🛠️🟣 **Phase 2 — marketing engine** (newsletter + automations) to replace the paid Arketa marketing package — see `specs/19-email-marketing.md`

## ⚖️ Legal / Business decisions — 🟣 Ruby
- [ ] **Proofread the liability waiver** verbatim (incl. the "Company'" apostrophe) + decide on the COVID-19 / facemask language _(bump `WAIVER_VERSION` if changed)_
- [ ] Confirm **amenity pricing** (sauna, cold plunge, contrast)
- [ ] Settle the **cancellation policy** — 24h window? forfeit vs. refund + $15 fee? no-show ($20) flow?

## 🎬 Content & Media
- [ ] 🛠️ Reactivate **Bunny.net** + re-upload videos + re-seed `video_url` (On Demand is offline until then)
- [ ] 🟣 **Hero video** footage for the login page

## 🗄️ Data & People
- [ ] 👥 **Arketa data migration** (Susan) — clients, memberships, history
- [ ] 👥 **Jazz** signs up at the platform + gets set to `admin`

## 🚀 Launch-day technical — 🛠️
- [ ] Point **`app.marathonpilates.com` → Vercel** (DNS)
- [ ] Confirm **Stripe** (live keys) + **Anthropic** keys are set in Vercel env
- [ ] Remove the **beta gate** (delete `BETA_PASSWORD` from Vercel env)
- [ ] Run **`add_waiver_consent.sql`** in the Supabase SQL editor

---

## ✅ Done (no action)
Core booking · cancel/refund + waitlist · credits · admin schedule/roster/attendance · gift cards · Build-a-Class · owner role · earth-tone rebrand · password reset · **retention suite** (nudges + learning + AI copy + rebook + win-back) · **AI health flags** for trainers · **intake + emergency contact + liability waiver** · **55 unit tests + CI** on every push
