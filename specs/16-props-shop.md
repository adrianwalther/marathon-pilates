# Spec 16 — Props Shop (Affiliate Model)

## Overview
A lightweight "Shop this class" feature embedded in the on-demand experience. When a client watches a class that uses specific props, they see a contextual product panel linking to those items on Balanced Body via affiliate links. Marathon Pilates earns a commission on purchases with zero fulfillment overhead.

---

## Phase
Phase 2 — ships alongside or shortly after on-demand video library.

---

## Goals
- Create a passive revenue stream tied to on-demand content
- Reduce friction for clients who want to practice at home but don't have equipment
- Position Marathon Pilates as a full home-practice resource, not just an in-studio experience
- Keep logistics zero — no stocking, no shipping, no returns

---

## Props Catalog (v1)

| Item | Notes |
|------|-------|
| Pilates mat | Balanced Body Pilates Mat or equivalent |
| Resistance bands | Light / medium / heavy options |
| Magic circle | Standard 14" ring |
| Yoga blocks | Set of 2 |
| Small ball | 9" or 10" fitness ball |
| Pinky ball | Therapy/massage ball |

---

## Affiliate Setup

### Balanced Body Affiliate Program
- Apply at balancedbody.com/affiliate (Impact Radius network)
- Typical commission: 8–10% per sale
- Cookie window: 30 days
- All affiliate links tagged with Marathon Pilates UTM parameters for tracking

### Fallback
If Balanced Body affiliate approval is delayed at launch, use Amazon Associates as a temporary bridge (lower commission ~4%, but instant approval).

---

## User Flow

```
Client opens on-demand class
    ↓
Below video player: "Props used in this class" panel
    ↓
Each prop shown with image, name, price range
    ↓
"Shop on Balanced Body" button → opens affiliate link in new tab
    ↓
Client purchases on Balanced Body's site
    ↓
Marathon Pilates earns commission (tracked via affiliate dashboard)
```

---

## UI Placement

### Mobile App
- Collapsible "Props" section below the video player
- Tap to expand — shows prop cards with thumbnail, name, and "Shop" CTA
- Appears only when the class has props tagged

### Web App
- Sidebar panel alongside the video player (desktop)
- Below video on mobile web
- Same prop cards with "Shop on Balanced Body" button

---

## Admin: Tagging Props to Classes

In the admin dashboard (spec 08), when creating/editing an on-demand class:
- Multi-select field: "Props used in this class"
- Each prop has a stored affiliate URL
- Selecting a prop auto-populates the shop panel for that class

---

## Data Model

```sql
-- Props catalog
props (
  id uuid PRIMARY KEY,
  name text,
  description text,
  image_url text,
  affiliate_url text,        -- Balanced Body affiliate link
  fallback_url text,         -- Amazon Associates fallback
  active boolean DEFAULT true
)

-- Junction: which props belong to which on-demand class
class_props (
  class_id uuid REFERENCES on_demand_classes(id),
  prop_id uuid REFERENCES props(id),
  PRIMARY KEY (class_id, prop_id)
)
```

---

## Analytics

Track per affiliate link:
- Click-throughs (client tapped "Shop")
- Estimated conversions (via Balanced Body affiliate dashboard)
- Top-performing classes by prop click rate

Report available in admin dashboard → Revenue → Affiliate.

---

## Future: Option 1 (Stock & Sell)

If affiliate volume justifies it, upgrade path:
- Apply for Balanced Body wholesale account
- Add Stripe-based checkout to the platform
- Fulfill from studio or third-party logistics (3PL)
- Higher margin (~40–50% vs ~10% affiliate)
- Requires inventory management module (spec TBD)

Not in scope for Phase 2 — revisit after 6 months of affiliate data.

---

## Open Questions for Ruby
- Does Marathon Pilates already have a relationship with Balanced Body (wholesale account)? Could accelerate affiliate approval.
- Any props to exclude from v1 (e.g. reformer accessories — out of scope for mat classes)?
- Branded Marathon Pilates props (custom logo mat, etc.) — future opportunity?
