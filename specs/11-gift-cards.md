# Spec 11 — Gift Cards
*Marathon Pilates Platform | Created: 2026-03-10*

---

## Overview

Gift cards are a meaningful revenue driver — especially around holidays, birthdays, and Mother's Day — and a low-friction way to introduce new clients to the studio. Marathon Pilates already offers gift cards; this spec defines how they work in the new platform.

Gift cards are **stored value** — a unique code tied to a dollar balance, redeemable against any purchase on the platform.

---

## Purchase Flow (Buyer)

### Online Purchase

```
[1] Buyer visits: app.marathonpilates.com/gift-cards
      ↓
[2] Select amount:
    ○ $25   ○ $50   ○ $75   ○ $100   ○ $150   ○ $200
    ○ Custom amount (min $10)
      ↓
[3] Personalize:
    To: [Recipient name]
    From: [Buyer name]
    Message: [Optional personal note — up to 200 chars]
      ↓
[4] Delivery:
    ● Send to recipient's email: [email field]
    ○ Send to my email (I'll forward it myself)
      ↓
[5] Schedule delivery:
    ● Send now
    ○ Send on a specific date: [date picker]
      ↓
[6] Payment (Stripe):
    Card on file or enter new card
      ↓
[7] Confirmation:
    Buyer receives receipt
    Recipient receives gift card email (immediately or on scheduled date)
```

### In-Studio Purchase

Front desk can issue a gift card manually:

```
Admin → Gift Cards → Issue New Gift Card

  Amount: [$______]
  Recipient name: [______]
  Recipient email (optional — for digital delivery): [______]
  Payment: Card on file | Cash | Card present (Stripe Terminal)

  [Issue Gift Card]
```

A unique code is generated and either emailed or printed (if no email provided).

---

## Gift Card Email (Recipient)

A branded, warm email delivered to the recipient:

```
Subject: You've got a Marathon Pilates gift card 🎁

  [Marathon Pilates logo]

  [Recipient name], [Buyer name] sent you a gift!

  "[Personal message from buyer]"

  ┌──────────────────────────────────┐
  │  YOUR GIFT CARD                  │
  │                                  │
  │  Balance: $100.00                │
  │  Code: MP-XXXX-XXXX-XXXX        │
  │                                  │
  │  [Book a Class]                  │
  └──────────────────────────────────┘

  Redeem at app.marathonpilates.com
  No expiration · Valid for any service
```

The code is clearly visible and copyable. Button links directly to the booking platform with the code pre-filled if possible.

---

## Redemption Flow (Recipient)

### At Checkout

```
[1] Recipient goes to book a class, membership, or amenity
      ↓
[2] At payment step, sees: "Have a gift card? Enter code"
      ↓
[3] Enters code → balance shown: "Gift card: $100.00 available"
      ↓
[4] If order total ≤ balance:
    — Full amount covered by gift card
    — Remaining balance stays on card for future use
      ↓
    If order total > balance:
    — Gift card covers partial amount
    — Remaining balance charged to card on file or new card
      ↓
[5] Confirmation shows how gift card was applied
```

### Partial Redemption Example

```
Order: 5-class pack — $85.00
Gift card balance: $100.00

Applied:   Gift card  -$85.00
Remaining: Gift card balance  $15.00

[Confirm Purchase]
```

Remaining balance is always accessible — the code stays active until the balance reaches $0.

### Multiple Gift Cards

Clients can apply multiple gift card codes to a single order (e.g., stacking two $50 cards toward a membership).

---

## Gift Card Data Model

```
GiftCard
  id
  code                  — Unique, e.g. "MP-A4BK-7XQJ-9WR2"
  initial_balance       — Original purchase amount (in cents)
  current_balance       — Remaining balance (in cents)
  purchased_by          — Buyer's client ID (or null if in-studio)
  purchased_for_name    — Recipient name
  purchased_for_email   — Recipient email (optional)
  personal_message      — Buyer's note
  issued_by_staff_id    — If issued manually by staff
  stripe_payment_id     — Stripe charge reference
  scheduled_send_at     — Null = send immediately
  sent_at               — Timestamp when email was delivered
  created_at
  updated_at

GiftCardTransaction
  id
  gift_card_id
  order_id              — What was purchased
  amount                — Amount applied (in cents)
  balance_before
  balance_after
  created_at
```

---

## Balance Checking

Recipients can check their balance at any time:

```
app.marathonpilates.com/gift-cards/check-balance

  Enter your code: [MP-____-____-____]
  [Check Balance]

  ─────────────────────────────────────────────
  Gift Card MP-A4BK-7XQJ-9WR2
  Current balance: $15.00
  Originally purchased: $100.00
  Last used: Mar 8, 2026 — 5-class pack ($85.00)
  ─────────────────────────────────────────────
```

---

## Admin Gift Card Management

```
Admin → Gift Cards

  [Search by code or recipient name]
  [Filter: Active | Fully Redeemed | Scheduled | All]

  ─────────────────────────────────────────────────────────────
  Code             Balance    Recipient       Issued       Status
  MP-A4BK-7XQJ    $15.00     Sarah K.        Mar 1        Active
  MP-B9QX-2MNR    $100.00    James M.        Mar 5        Active
  MP-C3TR-8WKP    $0.00      Dana R.         Feb 14       Redeemed
  MP-D7ZX-4LVF    $50.00     (Scheduled)     Sends Mar 15 Pending
  ─────────────────────────────────────────────────────────────

  [Issue New Gift Card]  [Export CSV]
```

### Admin Actions per Gift Card

- **View transaction history** — see every redemption and what was purchased
- **Resend email** — resend the gift card email to the recipient
- **Adjust balance** — manually add or remove balance (with logged reason)
- **Void** — cancel an unused gift card (e.g., fraud, customer request)
- **Refund** — initiate a refund to the original buyer's card (via Stripe)

---

## Gift Card Liability Report

Gift cards represent outstanding liability — money collected but not yet "earned" as revenue. Ruby can see this at any time:

```
Admin → Reports → Gift Card Liability

  Active gift cards: 47
  Total outstanding balance: $3,240.00

  Issued this month: 12  ($850.00)
  Redeemed this month: 8  ($420.00)
  Net liability change: +$430.00
```

This is useful for accounting and understanding true cash flow.

---

## Revenue Recognition Note

When a gift card is **purchased**, the money is received but not yet recognized as revenue — it's a liability (you owe a service).

When a gift card is **redeemed**, that portion converts to revenue.

The platform tracks both events separately so Ruby's bookkeeper or accountant has clean data. The gift card transaction log shows exactly when revenue was earned vs. when cash was received.

---

## Expiration Policy

**Recommendation: No expiration.** Tennessee does not require gift cards to expire, and removing expiration:
- Creates goodwill with clients
- Eliminates "breakage" disputes
- Keeps the platform simpler (no expiration-date logic to manage)

If Ruby ever wants to add expiration (e.g., 2 years), the platform can support it — but default is no expiration. ✅

---

## Denominations

**Recommended default amounts:** $25, $50, $75, $100, $150, $200 + custom

These cover:
- $25: single drop-in class
- $50: 2-3 classes or sauna sessions
- $75–$100: small pack or intro offer
- $150–$200: larger pack or membership contribution

Ruby can adjust these in Settings at any time.

---

## What Gift Cards Cannot Be Used For

- Gift cards cannot be used to purchase other gift cards
- Gift cards cannot be refunded for cash (only store credit / balance remains)
- Gift cards are non-transferable (the code is the only access mechanism — whoever has the code can use it)

---

## Physical Gift Cards

Ruby wants physical/printed gift cards available for in-studio purchase and gifting. ✅ Confirmed.

**Implementation options:**

1. **Pre-printed cards with unique codes** — cards are printed in advance with a scratch-off or revealed code. Front desk scans or enters the code at point of sale to activate the card and set the balance. Lower upfront cost; codes must be kept secure.

2. **Blank cards + code printed at point of sale** — front desk issues a digital gift card and prints the code + balance on a receipt-style slip tucked into a branded card sleeve.

**Recommended approach:** Branded card sleeves with printed-at-sale code slips. Keeps inventory simple (no pre-printed codes to manage), works with any standard receipt printer, and looks professional.

The admin gift card issuance flow (Admin → Gift Cards → Issue New Gift Card) already supports this — the unique code is generated at time of issuance and can be printed if no email is provided.

---

## Open Questions / Decisions Needed

- [x] **Expiration:** No expiration. ✅ Recommended and noted.
- [x] **Physical gift cards:** Ruby wants physical cards for in-studio use. ✅ Confirmed. Recommended approach: branded card sleeves + printed code at sale.
- [ ] **Gift card denominations:** Confirm the $25–$200 range works, or adjust
- [ ] **Holiday promotion:** Does Ruby want to offer bonus value during holidays? (e.g., "Buy a $100 gift card, get $110 in value") — configurable if desired
- [ ] **HSA/FSA:** Gift cards are typically not eligible for HSA/FSA payment — confirm this is understood and communicated

---

*Next: `12-mobile-app.md` — the full client-facing app experience*
