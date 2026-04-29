# Sale Readiness — Marathon Pilates Platform

> **Purpose:** If Marathon Pilates (the studio business) or the platform itself is ever sold, this document tracks what's done, what's missing, and what a buyer will look for. Think of it as building a data room.

Last updated: 2026-04-29

---

## What You're Potentially Selling

There are two distinct assets here — important to keep them clear:

### Asset A: The Studio Business
The operating business — clients, instructors, brand, two locations, Arketa client history, Ruby's reputation, class schedule, ongoing revenue.

### Asset B: The Platform (SaaS)
The custom booking software we built — could be sold as-is to a buyer of the whole business, **or licensed to other Pilates/fitness studios as a white-label SaaS product**. This is a significant value multiplier worth exploring.

> 💡 The platform is built generically enough (credits, memberships, multi-location, amenities, on-demand video, AI class generator) that it could serve any Pilates studio with minimal customization. This creates licensing / SaaS revenue potential beyond Marathon Pilates itself.

---

## What's Already in Good Shape ✅

- **Clean codebase** — TypeScript, well-organized, no major tech debt
- **Security** — RLS on all 28 DB tables, auth-gated routes, rate limiting
- **Stripe integration** — live payment processing, webhooks, idempotency
- **Multi-location support** — Charlotte Park + Green Hills baked in
- **Payroll system** — all rates confirmed with Ruby, calculable in-app
- **On-demand video** — 23 videos (needs Bunny reactivation)
- **AI class generator** — differentiator feature ("Build a Class")
- **Design system** — brand guidelines documented, typography tokens in code
- **Specs** — 17 feature specs written documenting every decision

---

## Gaps to Close Before a Sale

### Legal & IP
- [ ] **Formal IP assignment** — written agreement confirming all platform code is owned by Marathon Pilates LLC (not Adrian personally). This is essential for a clean sale. An IP assignment agreement or work-for-hire contract covers this.
- [ ] **Terms of Service** — the platform has no ToS page. Required for any business with paying clients.
- [ ] **Privacy Policy** — required by law (CCPA in California applies, Tennessee has emerging requirements). Needed before any client data is collected.
- [ ] **LLC status** — confirm Marathon Pilates is properly incorporated and Ruby/business owns the relevant IP

### Financial Records
- [ ] **Stripe revenue history** — start tracking MRR (monthly recurring revenue) and ARR the moment clients start paying. Screenshot/export monthly.
- [ ] **Platform P&L** — track platform costs (Vercel, Supabase, Bunny, ElevenLabs) vs. revenue generated
- [ ] **Membership churn rate** — measure once launched. Buyers pay multiples on recurring revenue.
- [ ] **Client LTV** — average revenue per client lifetime

### Documentation
- [ ] **README.md** in GitHub repo — technical overview a buyer's dev team can read
- [ ] **API documentation** — document internal API routes (could use Swagger/Postman)
- [ ] **Deployment runbook** — step-by-step for deploying from scratch (for a new owner)
- [ ] **Database schema docs** — export the ERD (entity-relationship diagram) from Supabase

### Operations
- [ ] **All accounts in business name** (see `01-ACCOUNT-MIGRATION.md`)
- [ ] **Runbook for Jazz** — document how to do weekly/monthly operational tasks (add sessions, process payroll, manage users)
- [ ] **SLA / uptime** — document system reliability once live
- [ ] **Backup strategy** — Supabase has automatic backups on Pro tier; document this

### Client-Facing
- [ ] **Client base size** — number of active members at time of sale is a key valuation metric
- [ ] **NPS / satisfaction data** — start collecting once launched
- [ ] **Arketa migration** — imported client history shows business continuity

---

## What a Buyer Will Ask For (Due Diligence Checklist)

When a potential buyer appears, they will want a "data room" — a secure folder with:

| Document | Status |
|---------|--------|
| Business formation documents (LLC, EIN) | Confirm with Ruby |
| IP ownership / work-for-hire agreement | ❌ Not done |
| Terms of Service | ❌ Not done |
| Privacy Policy | ❌ Not done |
| Last 12 months P&L | ❌ Not started (platform not live yet) |
| MRR / ARR metrics | ❌ Not started |
| Client count + churn rate | ❌ Not started |
| Active contracts (Arketa, Gusto, etc.) | Partial |
| All service accounts transferred to business | ❌ In progress |
| GitHub repo ownership | ❌ Personal (Adrian) |
| Platform technical documentation | Partial (specs written, README needed) |
| Staff agreements / contractor agreements | Confirm with Ruby |
| Lease agreements (Charlotte Park + Green Hills) | Confirm with Ruby |
| Trademark (marathonpilates.com, brand) | Confirm with Ruby |

---

## Valuation Factors

### For the Studio Business
- Monthly recurring membership revenue × industry multiple (typically 2–4×ARR for small fitness businesses)
- Client retention / churn
- Location lease terms
- Instructor stability

### For the Platform (if sold separately or licensed)
- The platform eliminates the biggest pain point in boutique fitness (custom booking + payments + on-demand + AI)
- Replacement cost: A studio hiring a dev team to build this from scratch would cost $80,000–$150,000+
- SaaS licensing model: charge $200–500/mo per studio location
  - 10 studios × $300/mo = $3,600 MRR ($43,200 ARR)
  - At a 5× ARR SaaS multiple = $216,000 in platform value alone
- **Recommendation:** Document the platform as a licensable product even if the intention is to sell the whole business — it strengthens the valuation story significantly

---

## Immediate Next Steps (Prioritized)

1. **Draft an IP assignment agreement** — Adrian assigns all code and platform IP to Marathon Pilates LLC. A simple one-page agreement signed by both parties. Consult a business attorney (or Ruby's attorney if she has one).
2. **Create a Terms of Service + Privacy Policy** — these can be generated from a template service (Termly, iubenda) and customized. Needed before launching to the public.
3. **Transfer GitHub to a Marathon Pilates org** — fastest win, free, takes 5 minutes.
4. **Start tracking financial metrics from day 1** — even a simple Google Sheet with monthly MRR is valuable.
5. **Create a `README.md`** in the GitHub repo with a high-level platform overview for future developers/buyers.

---

## SaaS Licensing — A Note for Ruby

If Ruby is open to it, the platform has real potential as a product sold to other boutique Pilates/fitness studios. The core features (booking, memberships, credits, amenities, on-demand, payroll) solve universal problems in the space.

**Questions to discuss with Ruby:**
- Is she open to licensing the platform to other studios? (White-label, no Marathon branding)
- Would she want to be involved operationally in a SaaS business, or just sell the IP?
- If the plan is to sell the whole business, this angle increases valuation — even just by demonstrating the TAM (total addressable market)
