# Spec 06 — Payroll
*Marathon Pilates Platform | Created: 2026-03-09 | Updated: 2026-03-14*

---

## Overview

The platform tracks every class taught, every private session, every check-in, and every front desk shift — making it the natural source of truth for payroll calculations. Instead of manually counting class rosters or tracking hours in a spreadsheet, the system generates payroll automatically based on real activity data.

Payroll is calculated in the platform and exported to Gusto (primary payroll processor). ✅ Confirmed.

---

## Employee Types

| Type | Pay Structure |
|---|---|
| **Instructor / Trainer** | Tiered flat rate by headcount (group); per-person rate (private duet/trio); flat rate (solo private, events); hourly (social content) |
| **Front Desk** | Hourly — $18/hr |
| **Manager (Susan LeGrand)** | Semi-monthly salary — $1,000/period ($2,000/mo) |

---

## Instructor Pay — Group Classes

Group classes use a **tiered flat rate** based on how many clients check in.

### Rate Table ✅ Confirmed

| Clients checked in | Instructor pay |
|---|---|
| 0 – 4 | $30 flat |
| 5 – 7 | $48 flat |
| 8 (full class) | $58 flat |

### How the Platform Calculates It

For each class an instructor teaches:
1. Pull the confirmed check-in count from the session roster
2. Apply the matching tier rate
3. Sum all sessions in the pay period

### Example
```
Class: Tuesday 7am Reformer Flow
Instructor: Anissa Pollard
Check-ins: 8 students (full class)
Pay = $58
```

### Substitutions
- If an instructor subs a class, they are paid for that class at their rate
- The original instructor is not paid for a class they didn't teach
- Subs are tracked in the system — pay follows the instructor who actually taught

---

## Instructor Pay — Private Sessions

### Solo Private ✅ Confirmed

Flat rate per session, tiered by seniority.

| Instructor level | Rate per session |
|---|---|
| Standard (< 1 year) | $45 |
| Standard (1+ year) | $55 |
| Master Trainer | Individually negotiated (~$60–$65) |

Master trainer rates are stored as a custom field per instructor profile — no fixed tier lookup.

### Duet Private ✅ Confirmed

**Per-person rate** — instructor earns $40 per client in the session.

| Clients | Instructor pay |
|---|---|
| 2 (duet) | $40 × 2 = **$80 total** |

*Studio charges: $85 total (session rate)*

### Trio Private ✅ Confirmed

**Per-person rate** — instructor earns $35 per client in the session.

| Clients | Instructor pay |
|---|---|
| 3 (trio) | $35 × 3 = **$105 total** |

*Studio charges: $75 total (session rate)*

### How Seniority Is Tracked (Solo)
- Each instructor profile has a **hire date**, **trainer level** (Standard / Master Trainer), and **private session rate** field
- The platform automatically applies the $55 rate once an instructor's hire date is 1+ year prior to the session date
- Master trainer rate is manually set by admin and overrides the seniority-based rate
- All rate changes take effect at the start of the next pay period and are logged with a timestamp

### Intro Sessions
- Intro-priced private packs (3 sessions for $250) — instructor earns their standard session rate regardless of the discounted client price. ✅ Confirmed.

---

## Instructor Pay — Events ✅ Confirmed

Events are a flat rate per event, regardless of attendee count.

| Event type | Instructor pay |
|---|---|
| Internal event (in-house) | $75 flat |
| External event (off-site) | $100 flat |

**Internal event** = studio-hosted workshops, pop-ups, special classes held at Charlotte Park or Green Hills.
**External event** = instructor represents Marathon Pilates at a venue outside the studio.

Events are created as a separate session type (`event_internal` / `event_external`) in the schedule — the payroll engine applies the flat rate automatically.

---

## Instructor Pay — Social Content ✅ Confirmed

When an instructor creates content for Marathon Pilates (video, photo, reels, etc.):

| Content type | Rate |
|---|---|
| Social/marketing content creation | $25/hour |

- Tracked via a **content session** log in the admin panel (instructor submits hours, admin approves)
- Not tied to a scheduled class — separate time entry
- Rounds to nearest 15 minutes
- Goes into the same payroll period as the logged date

---

## Complete Pay Rate Summary

| Session Type | Instructor Pay | Studio Price |
|---|---|---|
| Group (0–4 clients) | $30 flat | — |
| Group (5–7 clients) | $48 flat | — |
| Group (8 clients) | $58 flat | — |
| Solo Private (< 1yr) | $45 | — |
| Solo Private (1+ yr) | $55 | — |
| Solo Private (master) | $60–$65 (custom) | — |
| Duet Private | $40/person → $80 total | $85 total |
| Trio Private | $35/person → $105 total | $75 total |
| Internal Event | $75 flat | — |
| External Event | $100 flat | — |
| Social Content | $25/hr | — |
| Front Desk | $18/hr | — |
| Manager (Susan) | $1,000/period | — |

---

## Front Desk Pay — Hourly

Front desk staff are paid **$18/hour**. ✅ Confirmed. Typical shift is **6 hours** ($108/shift).

Front desk staff clock in and out through the platform.

### Clock In / Clock Out
```
[1] Staff member opens admin dashboard → clicks "Clock In"
[2] System records timestamp + location
[3] At end of shift → clicks "Clock Out"
[4] Hours logged automatically for the pay period
```

### Overtime
- Standard: 40hr/week threshold for overtime (1.5× rate = $27/hr)
- System flags automatically when a staff member approaches or exceeds 40hrs in a week

---

## Pay Periods

- **Semi-monthly** — twice per month ✅ Confirmed
- Typical schedule: 1st–15th and 16th–end of month
- Pay period start/end dates set by admin — configurable

---

## Payroll Summary Report

At the end of each pay period, admin sees a full breakdown:

```
Pay Period: Mar 1 – Mar 15, 2026
─────────────────────────────────────────────────────
INSTRUCTORS

Anissa Pollard  (Master Trainer)
  Group classes:
    2 classes × $30 (0-4 clients)     =  $60.00
    3 classes × $48 (5-7 clients)     = $144.00
    3 classes × $58 (full class)      = $174.00
    Group subtotal:                     $378.00
  Private sessions:
    2 solo × $60 (master trainer)     = $120.00
    1 duet (2 clients × $40)          =  $80.00
    1 trio (3 clients × $35)          = $105.00
    Private subtotal:                   $305.00
  Events:
    1 internal event × $75            =  $75.00
  ─────────────────────────────────────────────
  Subtotal:                             $758.00

─────────────────────────────────────────────────────
MANAGER

Susan LeGrand
  Pay type: Semi-monthly salary       $1,000.00

─────────────────────────────────────────────────────
FRONT DESK

Bobby Douangkesone
  Hours: 36 hrs × $18.00/hr          =  $648.00

─────────────────────────────────────────────────────
TOTAL PAYROLL THIS PERIOD:            $X,XXX.00
─────────────────────────────────────────────────────
[Export to Gusto CSV]  [Export PDF]  [Mark as Processed]
```

---

## Instructor Complimentary Classes

Instructors may attend classes for free when attendance is low. ✅ Confirmed.

- Their booking is flagged **"Staff — Complimentary"** — no charge, no credit deducted
- **Complimentary attendees count toward the teaching instructor's pay tier.** If 7 paying + 1 staff = 8 total, teaching instructor earns $58. ✅ Confirmed.
- Soft warning at 75%+ full capacity

---

## Individual Pay Stubs (Employee View)

Each employee can log in and see a read-only breakdown:

```
Your Pay — Mar 1–15, 2026

GROUP CLASSES
  2 classes (0–4 clients) × $30     =  $60.00
  3 classes (5–7 clients) × $48     = $144.00
  3 classes (full, 8)    × $58      = $174.00
  Group total:                        $378.00

PRIVATE SESSIONS
  2 solo × $60 (master trainer)     = $120.00
  1 duet (2 × $40)                  =  $80.00
  1 trio (3 × $35)                  = $105.00
  Private total:                      $305.00

EVENTS
  1 internal × $75                  =  $75.00

──────────────────────────────────────────────
Gross pay this period:               $758.00

[View pay history]
```

---

## Open Questions / Decisions Needed

- [x] **Group class pay:** $30 / $48 / $58 tiered. ✅
- [x] **Solo private pay:** $45 / $55 / $60–$65. ✅
- [x] **Duet private pay:** $40/person instructor, $85 total (studio). ✅
- [x] **Trio private pay:** $35/person instructor, $75 total (studio). ✅
- [x] **Internal event pay:** $75 flat. ✅
- [x] **External event pay:** $100 flat. ✅
- [x] **Social content pay:** $25/hr. ✅
- [x] **Front desk:** $18/hr, 6-hr shifts. ✅
- [x] **Manager:** Susan LeGrand $1,000/period semi-monthly. ✅
- [x] **Payroll processor:** Gusto. ✅
- [x] **Instructor complimentary classes:** Free when low attendance; count toward teaching instructor's tier. ✅
- [ ] **Sub instructor pay:** Sub gets paid, original does not — any exceptions?
- [ ] **Tips:** Does Marathon Pilates handle tips? Platform tracking needed?

---

*Last updated: 2026-03-14*
