# Arketa — Competitive Research
*Research date: 2026-03-09 | Knowledge base through August 2025*

---

## Pricing (Estimated — sales-led, not publicly listed)
| Tier | Approx. Monthly | Key Inclusions |
|---|---|---|
| Starter/Core | ~$150–$250/mo | Scheduling, booking, memberships, website widget, Stripe |
| Growth | ~$300–$500/mo | + Email marketing, on-demand video, enhanced reporting |
| Pro/Scale | ~$500–$800+/mo | + Branded mobile app (iOS + Android), priority support |
| Enterprise | Custom | Multi-location, custom features, dedicated support |

- **Payment processing:** Standard Stripe rates — no proprietary lock-in
- **vs. Mindbody:** Similar or slightly lower price for comparable features; more modern UX

## How Arketa Differs from Mindbody
| Dimension | Arketa | Mindbody |
|---|---|---|
| Founded | ~2020, mobile-first | 2001, desktop-first |
| UI/UX | Modern, Shopify-like | Dated, clunky |
| Branded app | Yes (higher tiers) | No — clients use Mindbody's app |
| Consumer discovery network | None | Yes — Mindbody Marketplace |
| On-demand video | Native | Third-party only |
| Email marketing | Basic, native | Requires integration |
| API access | Very limited | More mature (but expensive) |
| Payment processor | Stripe (standard rates) | Mindbody Payments (higher rates) |
| Setup complexity | Faster onboarding | Steep learning curve |

## Core Feature Summary

### Booking
- Modern, consumer-grade flow (feels closer to SoulCycle than Mindbody)
- Class schedule, appointment booking, waitlists, late cancel enforcement
- Guest checkout option
- Pre-class intake forms per service type
- Smart booking rules (windows, capacity, instructor overrides)

### Client Journey & Progress
- Full attendance history (staff + client view)
- **Class streak tracking and milestone alerts** (e.g., "50th class!")
- Re-engagement triggers for lapsed clients
- Tags/segments for marketing
- **Limitation:** Attendance-only — no body composition, movement assessment, or performance tracking

### Memberships & Pricing
- Drop-ins, class packs, recurring memberships, trials, intro offers, punch cards
- Membership pause/freeze
- Tiered memberships with different access levels
- Stripe-powered autopay with retry logic
- Bundle checkout (class + amenity in one transaction) = **known gap**

### Multi-Service / Amenities
- Sauna/cold plunge bookable as timed appointments tied to a room resource
- Resource blocking prevents double-booking
- **Gaps:** No dynamic pricing, no turnover/cleaning buffer as first-class feature, no amenity utilization analytics

### App (Key Differentiator vs. Mindbody)
- Fully branded iOS + Android app (studio's name, logo, colors in App Store)
- Push notifications, booking, membership management, client history
- On-demand video library (membership-gated)
- **Limitation:** Not truly customizable UX — it's a skinned Arketa experience; platform updates push without studio control

### Website Integration
- Embeddable widget (iframe or JS) with color customization
- Hosted booking page via CNAME
- "Book now" deep-link buttons
- **No public API** for custom frontend builds (major limitation for full control)

### Admin Tools
- Drag-and-drop class calendar, bulk scheduling, recurring templates
- Sub/cover instructor management
- Multi-location support
- Attendance, revenue, retention/churn reporting
- Client CRM with notes, credit adjustments, bulk messaging
- Role-based permissions (admin, instructor, front desk)
- Basic POS via Stripe (less robust than Mindbody for retail-heavy studios)

### Communications
- Full automated transactional notifications (confirmation, reminders, waitlist, failed payment)
- Built-in email marketing (basic — not Klaviyo-level)
- Re-engagement and milestone email triggers
- Push notifications via branded app
- SMS = requires third-party (Twilio etc.)
- Integrations: Mailchimp, Klaviyo, Zapier, Facebook Pixel, Google Analytics

## Key Pain Points

**From Studios:**
- Branded app tier pricing steep for smaller studios
- No API = no path to custom frontend when you outgrow Arketa
- Amenity/resource booking lacks depth (no cleaning buffers, no dynamic pricing)
- Reporting adequate but not deep enough for serious financial modeling
- App updates pushed by Arketa without studio control — can surprise clients
- Support response times slow for non-enterprise plans
- SMS marketing requires separate tool

**From Clients:**
- Each studio has a different "branded" app — confusing for multi-studio attendees
- Embedded widget on websites less polished than native app on mobile
- No Mindbody-style discovery network

## Best Practices Identified (from Arketa research)

1. **Unified credit system** — one membership that covers both Pilates + amenity access
2. **Resource buffering** — sauna/cold plunge needs cleaning window between bookings
3. **Journey-aware comms** — different messaging based on client lifecycle stage
4. **Frictionless first booking** — intro offer to checkout under 60 seconds
5. **Smart waitlist** — instant push on promotion, short acceptance window (30 min)
6. **Instructor profiles** — bios + specialties improve booking confidence for new clients
7. **"Book class + add recovery" flow** — no platform does this perfectly yet = our opportunity
8. **Clear cancel policies** — show deadline at booking, remind 24hr before, auto-enforce
9. **Simple admin override** — staff must be able to bypass rules with one action
10. **Data portability** — studios must own their data; confirm terms before committing to any platform

## Opportunity Gap Table

| Arketa Gap | What We Build Instead |
|---|---|
| No "class + amenity" bundle checkout | Single-transaction Pilates + recovery add-on |
| No resource cleaning/turnover buffers | True resource management with buffer windows |
| Limited branded UX customization | Fully custom frontend for Marathon Pilates brand |
| Basic reporting | Studio-specific dashboards (amenity utilization, recovery revenue) |
| No discovery network | Own the client relationship; compensate with SEO + CRM |
| SMS requires third-party | Native SMS from day one |
| Attendance-only progress tracking | Optional wellness journal, instructor session notes |
| App updates outside studio control | Full control over release cadence |
