# Spec 05 — Membership & Credits (Technical)
*Marathon Pilates Platform | Created: 2026-03-09*

---

## Principle

**The platform supports Marathon Pilates's existing pricing and membership structure exactly as Ruby and the team have defined it.** This spec describes how to model and implement that structure technically — not to propose changes to it.

Pricing, tier names, and credit allotments are set by studio admin and can be adjusted at any time without a developer. The platform is the engine; the studio drives.

---

## Current Structure (From marathonpilates.com)

### Group Class Pricing
| Option | Price | Expiration |
|---|---|---|
| Drop-in | $40 | Single use |
| 5-pack | $175 | TBD |
| 10-pack | $330 | TBD |
| New Client Unlimited Month | $149 | 1 month, new clients only |
| Monthly membership | $120–$259/mo | Recurring |

### Private Session Pricing
| Option | Price | Expiration |
|---|---|---|
| Single session | $110 | Single use |
| Intro 3-pack (new clients) | $250 | TBD |
| 5-pack | $480 | 3 months |
| 10-pack | $920 | 6 months |
| Duet (per person) | $85 | Single use |
| Trio (per person) | $75 | Single use |

### Sauna Pricing
| Option | Price |
|---|---|
| Single session | $50 |
| 5-pack | $195 |
| 10-pack | $280 |
| Membership 4/month | $120/mo |
| Membership 8/month | $216/mo |

### Cold Plunge Pricing
| Option | Price |
|---|---|
| Single session | $30 |
| 5-pack | $135 |
| 10-pack | $250 |

### Contrast Therapy (Sauna + Cold Plunge)
| Option | Price |
|---|---|
| Single session | $75 |
| 5-pack | $350 |
| 10-pack | $650 |
| Membership 4/month | $200/mo |
| Membership 8/month | $380/mo |

### Intro Offers
| Offer | Price | Restriction |
|---|---|---|
| New Client Unlimited Month | $149 | New clients only |
| 3 Private Sessions | $250 | New clients only |
| 3 Sauna Sessions | $90 | New clients only |
| 3 Contrast Therapy Sessions | $150 | New clients only |

### Neveskin
| Option | Price |
|---|---|
| Single Face Treatment | $125 |
| Single Body Treatment | $249 |

---

## Technical Architecture

### Credit Types

The system maintains separate credit buckets per client. Credits only apply to the service type they were purchased for.

```
ClientAccount
  ├── GroupClassCredits      (from packs or membership allotment)
  ├── PrivateCredits         (solo, or duet/trio priced per person)
  ├── SaunaCredits           (from sauna pack or sauna membership)
  ├── ColdPlungeCredits      (from cold plunge pack)
  ├── ContrastCredits        (from contrast pack or contrast membership)
  └── NeveskinCredits        (single-use purchases)
```

Each credit has:
- `serviceType` — what it can be redeemed for
- `expiresAt` — null for unlimited/membership, date for packs
- `source` — which purchase created it
- `usedAt` — when it was redeemed (null if unused)
- `status` — active | used | expired

### Membership Object

```
Membership
  ├── clientId
  ├── planId           → references a MembershipPlan
  ├── status           → active | paused | cancelled | past_due
  ├── billingCycle     → monthly
  ├── currentPeriodStart
  ├── currentPeriodEnd
  ├── stripeSubscriptionId
  └── creditAllocations[]  → credits issued each billing cycle
```

### MembershipPlan (Admin-Configurable)

Plans are defined by admin — no code changes needed to add/edit a plan.

```
MembershipPlan
  ├── name             → e.g., "Sauna Membership — 4/month"
  ├── price            → e.g., 120.00
  ├── billingCycle     → monthly
  ├── creditGrants[]
  │     ├── creditType → SaunaCredits
  │     └── quantity   → 4
  └── restrictions
        └── locationId (optional — location-specific plans)
```

This means Ruby or her team can create a new plan (e.g., a seasonal promo or a bundled tier if she ever wants one) entirely from the admin dashboard. No developer needed.

### Credit Issuance — Memberships

On each billing cycle renewal:
1. Stripe webhook fires confirming successful charge
2. System issues new credits per the plan's `creditGrants`
3. Previous unused wellness credits (Sauna, Contrast Therapy): **expire at period end — no rollover**
4. Client notified of credit refresh

### Credit Issuance — Pack Purchases

1. Client purchases a pack (e.g., 10-pack group classes)
2. Stripe payment confirmed
3. System creates N credits with the pack's expiration date
4. Credits immediately available for booking

### Credit Consumption — Booking

At booking checkout:
1. System identifies the service type being booked
2. Checks client's credit balance for that type
3. If credit available: reserves it (held, not yet consumed)
4. Credit marked as consumed when the session is checked in (or at class start time for no-shows)
5. If booking is cancelled within the free window: credit released back

### Auto-Apply Logic

The system always selects credits in this order:
1. Credits expiring soonest (use oldest first)
2. Credits from the matching service type exactly
3. If multiple packs exist, consume from the one expiring first

Client never has to pick which credit to use.

---

## Wellness Credit Rules (Confirmed by Ruby)

### No Rollover
Unused Sauna and Contrast Therapy membership credits **expire at the end of each billing period**. They do not carry forward to the next month.

- On billing renewal: unused wellness credits from the previous period are marked `expired`
- New credits for the fresh period are issued simultaneously
- Client is notified 3 days before period end if they have unused wellness credits — nudge to use them

### Guest Booking
A member can apply one of their own wellness credits toward a **guest's session** during the same billing period.

**How it works:**
```
[1] Member taps "Book for a Guest" on a sauna/contrast session
        ↓
[2] Enters guest name + email (guest does not need an account)
        ↓
[3] Member's own wellness credit is consumed
        ↓
[4] Guest receives a confirmation email with session details
        ↓
[5] At check-in: guest name appears on the roster under the member's booking
```

**Rules:**
- Guest **must attend the same session as the member** — a credit cannot be used to send a guest solo
- One guest per credit — a single credit covers one person
- Guest usage is logged on the member's account for studio visibility
- No discounted or free guest passes beyond what the credit covers — guest cannot purchase separately using the member's credit

---

## Pack Expiration Handling

| Scenario | System Behavior |
|---|---|
| Pack expires with unused credits | Credits marked expired; client notified 7 days before |
| Client books on the day of expiration | Credits still valid through end of day |
| Client mid-booking when pack expires | Booking completes; grace period (24hr) before enforcement |
| Expired credits | Admin can manually reinstate on a case-by-case basis |

---

## Membership Pause / Freeze

- Client can pause a membership for a defined window (e.g., travel, injury)
- Minimum active time before pause allowed: studio-configurable (e.g., must be active 1 month first)
- During pause: no billing, no new credits issued
- Credits earned before pause remain available during pause
- Pause re-activates automatically on the set return date

---

## Intro Offer Enforcement

- Intro offers are marked `newClientsOnly: true` in the system
- At checkout, the system checks if the client's email has any prior purchases
- If yes: intro offer blocked at checkout with a friendly message
- Staff can override manually if circumstances warrant (e.g., a returning client after a long gap)

---

## Admin Controls

Ruby or studio admin can manage all of the following **without a developer**:

- Create / edit / archive membership plans
- Adjust plan pricing, credit allotments, billing cycle
- Create / edit intro offers and their restrictions
- Set pack expiration windows per pack type
- Manually add or remove credits from a client's account (with a note/reason logged)
- Issue complimentary credits ("comp'd" sessions)
- View all credit activity per client (issued, used, expired)
- Run reports: revenue by service type, credit liability (outstanding unused credits), expiring packs

---

## Client-Facing Credit View (App)

Clients see a clear, simple summary. No confusion about which credits they have.

```
Your Credits
────────────────────────────────
  Group Classes     Unlimited (membership)
  Sauna             3 of 4 this month  · resets Mar 18
  Contrast          2 of 4 this month  · resets Mar 18
  Cold Plunge       2 sessions         · expires Jun 1
  Privates          1 session          · expires Apr 15
────────────────────────────────
  [Buy More]   [Book for a Guest]
```

Wellness membership credits show **reset date** (not expiry) — language that feels like a fresh start, not a penalty.

---

## Stripe Integration

- All recurring memberships managed as Stripe Subscriptions
- Pack purchases are one-time Stripe PaymentIntents
- Failed payments trigger Stripe's built-in dunning (retry logic)
- Failed payment → membership moves to `past_due` → client notified
- After configurable grace period (e.g., 3 days): membership paused, booking blocked
- When payment resolves: membership reactivated, credits issued for current period

---

## Open Questions / Decisions Needed

**Answered by Ruby:**
- ✅ **Wellness credit rollover:** Sauna + Contrast Therapy membership credits do NOT roll over — expire at end of billing period
- ✅ **Guest booking:** Members CAN use a wellness credit to bring a guest during the same billing period

- [ ] **Pack expiration for group classes:** The site shows expiration for private packs (3mo/6mo) but not for group packs — confirm with Ruby
- [ ] **Cold plunge membership:** Currently only packs listed on site, no cold plunge membership — intentional? Or should one exist?
- [ ] **Duet/trio credit mechanics:** Does a duet purchase create one credit for each person, or is it handled differently?
- [ ] **Neveskin — recurring?** Currently single-session only. Any plans for Neveskin memberships or packs?
- [ ] **Location restrictions:** Are any memberships or packs limited to one location, or all-access across both?
- [ ] **Gift cards:** Currently offered — how should gift card value be applied at checkout? (As a payment method, not a credit type)

---

*Next: `06-admin-dashboard.md` — what Ruby and staff see and manage day-to-day*
