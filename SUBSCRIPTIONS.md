# Marathon Pilates Platform — Subscriptions & Tools

Last updated: 2026-03-19

---

## Hosting & Deployment

| Service | Purpose | Plan | Est. Cost |
|---------|---------|------|-----------|
| **Vercel** | Web app hosting (marathon-pilates.vercel.app) | Hobby (free) | $0/mo |
| **GitHub** | Code repository (adrianwalther/marathon-pilates) | Free | $0/mo |

---

## Database & Backend

| Service | Purpose | Plan | Est. Cost |
|---------|---------|------|-----------|
| **Supabase** | Database, auth, storage (vvqeacukwsvbgixabdef) | Free | $0/mo |

---

## Payments

| Service | Purpose | Plan | Est. Cost |
|---------|---------|------|-----------|
| **Stripe** | Payment processing — class bookings, gift cards, memberships | Pay-as-you-go | 2.9% + 30¢ per transaction |

---

## Video Streaming

| Service | Purpose | Plan | Est. Cost |
|---------|---------|------|-----------|
| **Bunny.net Stream** | On-demand video hosting & streaming (Library ID: 620844) | ⚠️ **EXPIRED** — trial ended 2026-04-20, files delete ~2026-04-22. Will reactivate before launch with fresh paid plan. Source MP4s backed up (Google Drive + local). | Expected ~$10–25/mo when restored |

---

## AI & Content Generation

| Service | Purpose | Plan | Est. Cost |
|---------|---------|------|-----------|
| **Anthropic (Claude)** | Build a Class — class structure & text generation | API pay-as-you-go | Per token |
| **OpenAI (DALL-E 3)** | Build a Class — studio scene image generation | API pay-as-you-go | ~$0.04/image |
| **ElevenLabs** | Build a Class — voice cues (Rachel voice) | Starter or higher | ~$5–22/mo |

---

## Payroll

| Service | Purpose | Plan | Est. Cost |
|---------|---------|------|-----------|
| **Gusto** | Instructor & staff payroll processing | Core or higher | ~$40+/mo base |

---

## Pre-Launch Upgrade Checklist

Services currently on free/expired tiers that **must be upgraded before going live**. Do not upgrade early — wait until launch week to avoid paying for idle time.

| Service | Current State | Action Required | Est. Cost | Priority |
|---------|--------------|-----------------|-----------|----------|
| **Bunny.net Stream** | ⚠️ Trial expired (2026-04-20) | Reactivate with paid plan; re-upload 23 on-demand videos; re-seed `video_url` in DB | ~$10–25/mo | 🔴 Launch blocker |
| **Supabase** | Free (500MB DB / 1GB storage) | Upgrade to Pro when approaching limits, or proactively before launch | $25/mo | 🟡 Upgrade when DB > 400MB |
| **Vercel** | Hobby (free) | Upgrade to Pro for Vercel Password Protection (built-in, no middleware needed) — current beta gate middleware is free alternative | $20/mo | 🟢 Optional |
| **ElevenLabs** | Starter ($5.49/mo, active) | Move to Creator or higher if voice cue volume increases | $22/mo | 🟢 Scale as needed |
| **Gusto** | Not yet activated | Activate before first payroll run | ~$40+/mo | 🔴 Before first pay period |

### To disable the beta gate at launch:
Remove the `BETA_PASSWORD` environment variable from Vercel — the gate turns off automatically. No code change needed.

---

## Notes
- Stripe fees apply to every transaction — factor into pricing decisions
- Bunny.net costs scale with usage; very low at launch
- Supabase free tier has limits (500MB DB, 1GB storage) — upgrade to Pro (~$25/mo) when approaching limits
- Membership pricing TBD — needed from Ruby before Stripe subscription billing can be activated

---

## Expense Log

Actual charges to the Marathon Pilates business accounts.

| Date | Service | Amount | Category | Notes |
|------|---------|--------|----------|-------|
| 2026-04-17 | ElevenLabs | $5.49 | AI / Content | Starter plan — voice cues for Build a Class (Rachel voice) |
