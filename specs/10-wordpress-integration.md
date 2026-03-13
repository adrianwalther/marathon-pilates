# Spec 10 — WordPress Integration
*Marathon Pilates Platform | Created: 2026-03-10*

---

## Overview

The Marathon Pilates website (marathonpilates.com) runs on WordPress. The new booking platform is a separate custom application. This spec defines how the two systems connect — so clients move seamlessly from the marketing site to booking without friction, and so Ruby doesn't have to manage two completely separate systems.

**The model:** WordPress stays as the public-facing marketing site. The new platform lives at `app.marathonpilates.com`. Clients discover Marathon Pilates through the WordPress site and book through the new platform.

---

## URL Structure

| Property | URL |
|---|---|
| Marketing site (WordPress) | `marathonpilates.com` |
| Booking platform | `app.marathonpilates.com` |
| Client login | `app.marathonpilates.com/login` |
| Class schedule | `app.marathonpilates.com/schedule` |
| Memberships | `app.marathonpilates.com/memberships` |
| On-demand | `app.marathonpilates.com/on-demand` |

The subdomain is a DNS record change — nothing about the WordPress site itself needs to change to set this up.

---

## "Book Now" Integration Points

Every place on the WordPress site that currently leads to Arketa should instead link to the new platform. No code change to WordPress required — these are plain links.

### Pages to Update on WordPress

| WordPress Page | Current CTA | Updated Link |
|---|---|---|
| Homepage | "Book a Class" button | `app.marathonpilates.com/schedule` |
| Pricing page | "Get Started" / membership CTAs | `app.marathonpilates.com/memberships` |
| Services pages (Reformer, Private, Sauna, etc.) | "Book" buttons | `app.marathonpilates.com/schedule?service=[type]` |
| About / Team page | "Book with [Instructor]" links | `app.marathonpilates.com/schedule?instructor=[id]` |
| On-demand page | "Access On-Demand" | `app.marathonpilates.com/on-demand` |
| Navigation | "Book" / "Schedule" nav link | `app.marathonpilates.com/schedule` |
| Footer | Booking link | `app.marathonpilates.com` |

Deep links (e.g., `?service=sauna` or `?instructor=anissa`) let the booking platform pre-filter the schedule to the right context — clicking "Book Sauna" on the WordPress sauna page opens the amenity booking flow directly.

---

## Embedded Schedule Widget (Optional)

As an alternative to pure linking, a lightweight schedule widget can be embedded directly on the WordPress schedule page — clients see upcoming classes without leaving marathonpilates.com.

```
WordPress page: marathonpilates.com/schedule

  [Embedded schedule widget — iFrame or JavaScript embed]
  ┌─────────────────────────────────────────────────────┐
  │  THIS WEEK AT MARATHON PILATES                      │
  │                                                     │
  │  Mon  7:00am  Reformer Flow · Anissa · CP  [Book]  │
  │  Mon  8:30am  Mat Pilates  · Sirkka  · GH  [Book]  │
  │  Tue  9:00am  Reformer Fund.· Anissa· CP   [Book]  │
  │  ...                                                │
  │                          [View Full Schedule →]     │
  └─────────────────────────────────────────────────────┘
```

[Book] buttons open `app.marathonpilates.com` for the actual booking flow (login / checkout happens on the platform, not WordPress).

**Trade-off:**
- Embed approach: more seamless, client stays on the WordPress site longer
- Link approach: simpler, no cross-origin complexity, easier to maintain

**Decision:** Links only — no embedded widget. Keeps the WordPress site clean and uncluttered. ✅ Confirmed.

---

## Account Continuity

Clients who come from the WordPress site to the booking platform should have a smooth account experience:

- New clients: click "Book Now" → land on `app.marathonpilates.com` → create account → complete intake questionnaire → book
- Returning clients: click "Book Now" → land on `app.marathonpilates.com` → already logged in (session persists) → book immediately
- Session tokens are stored in the browser — returning clients don't have to log in every time

No single sign-on (SSO) between WordPress and the booking platform is needed — they're separate systems with separate accounts. WordPress doesn't have client accounts; it's a public marketing site.

---

## Analytics & Tracking

Both WordPress and the booking platform should feed into a unified analytics picture:

### Google Analytics (GA4)

- Same GA4 property used on both `marathonpilates.com` and `app.marathonpilates.com`
- Enables cross-domain tracking — Ruby can see the full funnel: site visit → schedule view → booking conversion
- Key events to track on the booking platform:
  - `sign_up` — new account created
  - `booking_completed` — class/private/amenity booked
  - `membership_purchased` — membership or pack bought
  - `intake_completed` — questionnaire finished

### Meta Pixel (Facebook/Instagram)

- If Marathon Pilates runs Meta ads, the pixel should fire on both domains
- Booking conversion events (account created, membership purchased) should be passed to Meta for ad optimization

### Google Tag Manager

- Recommended approach: manage all tags (GA4, Meta Pixel, etc.) through a single GTM container
- Same container can be installed on WordPress and the booking platform
- Ruby or Susan can add/modify tracking tags without developer help

---

## SEO Considerations

The WordPress site handles all SEO — class descriptions, location pages, instructor bios, blog content, etc. The booking platform (`app.marathonpilates.com`) does NOT need to rank in search.

- Add `<meta name="robots" content="noindex">` to the booking platform to prevent it from appearing in search results
- All public-facing content (class descriptions, pricing, etc.) should live on WordPress, not on the booking platform
- The booking platform is a tool, not a marketing surface

---

## Visual Consistency

The booking platform should look like it belongs to the same brand as the WordPress site. Clients shouldn't feel like they've left the studio when they open the app.

Brand elements to match:
- Logo (same file, same placement)
- Primary and secondary colors
- Typography (same fonts if possible, or visually compatible)
- Photography style and tone
- Button and UI language ("Book", "Reserve", etc.)

The booking platform uses its own design system (Tailwind CSS + shadcn/ui) — the goal is to match the visual feel, not copy the WordPress theme code.

---

## WordPress Maintenance

No ongoing WordPress changes are required to maintain the integration. The only WordPress touchpoints are:

1. **Update CTA links** — one-time change when platform launches (links point to new platform instead of Arketa)
2. **Embed widget** — optional, added later if desired
3. **Analytics tags** — one-time GTM setup

Ruby and Susan do not need to do anything in WordPress to maintain the booking platform after launch.

---

## Launch Transition Plan

When the new platform is ready to go live:

```
[1] Update DNS — point app.marathonpilates.com to new platform hosting
[2] Update all "Book Now" links on WordPress to new URLs
[3] Update GTM/GA4 to include new domain
[4] Turn off Arketa booking links on WordPress
[5] Post announcement to clients (email + social): "New booking experience is live"
[6] Keep Arketa read-only for 30 days for historical reference (see data migration spec)
```

---

## Open Questions / Decisions Needed

- [x] **Schedule page embed:** Links only — no embed widget. ✅ Confirmed.
- [ ] **Deep links by service:** Should clicking "Book Sauna" on the WordPress sauna page pre-filter to sauna booking, or just go to the general schedule?
- [ ] **Meta ads:** Is Marathon Pilates running paid social ads? If so, the Meta Pixel setup becomes a priority.
- [ ] **WordPress admin:** Who manages the WordPress site day-to-day? (For coordinating the link update at launch)

---

*Next: `11-gift-cards.md` — purchasing, delivery, and redemption*
