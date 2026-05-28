# Marathon Pilates — Pending Items for Adrian

## 🔑 Credentials Needed
- [ ] **Resend API key** — resend.com → sign up → API Keys → create key → paste to Claude
- [ ] **Stripe keys** — Ruby needs to create/share Stripe account (pk_test + sk_test keys)
  - Should be under Ruby's business name/email, not Adrian's

## 👥 People to Check With
- [ ] **Susan LeGrand** — confirm her role level (admin vs. manager)
  - Susan + Jazz = admin. Manager = front desk / sales staff only.
- [ ] **Ruby** — does she have an existing Stripe account?
- [ ] **Ruby** — Arketa contract renewal date (affects launch timing)
- [ ] **Ruby** — beta client list for Phase 2 testing
  - Beta cohort confirmed: Adrian, Ruby, Jazz only. Live Stripe, real bookings, minimal data.
  - Beta test client account: adrianwalther@me.com (client role — use for QA)

## 🔜 Build After Beta Feedback
- [ ] **Admin-initiated booking** — "Book a Client" button on schedule roster. Front desk picks client + session, checks credits, creates booking. Defer until beta testing reveals real workflow needs.

## ⏳ On Hold
- [ ] **15-data-migration.md** — waiting on Susan LeGrand availability
- [ ] **Payroll details** — any remaining instructor rates to confirm

## ✅ Done (for reference)
- Supabase project live: vvqeacukwsvbgixabdef.supabase.co
- Vercel deployed: marathon-pilates.vercel.app
- GitHub: github.com/adrianwalther/marathon-pilates
- All client pages built (login, dashboard, schedule, bookings, membership, on-demand, account)
- Admin panel built (overview, schedule builder, clients, payroll, instructor view)
- Role-based access: owner / admin / manager / instructor (front_desk retired)
- Owner role fully implemented — Ruby + Adrian set to owner in DB
