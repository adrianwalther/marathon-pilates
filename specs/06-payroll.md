# Spec 06 — Payroll
*Marathon Pilates Platform | Created: 2026-03-09*

---

## Overview

The platform tracks every class taught, every private session, every check-in, and every front desk shift — making it the natural source of truth for payroll calculations. Instead of manually counting class rosters or tracking hours in a spreadsheet, the system generates payroll automatically based on real activity data.

Payroll is calculated in the platform and exported to whatever payroll processor the studio uses (e.g., Gusto, ADP, QuickBooks). The platform handles the math — the payroll processor handles the actual disbursement.

---

## Employee Types

| Type | Pay Structure |
|---|---|
| **Instructor / Trainer** | Tiered flat rate by headcount (group); flat rate by seniority (private) |
| **Front Desk** | Hourly — $18/hr |
| **Manager (Susan LeGrand)** | Semi-monthly salary — $1,000/period ($2,000/mo) |

---

## Instructor Pay — Group Classes

Group classes use a **tiered flat rate** based on how many clients check in. The more clients, the higher the flat rate — no per-head bonus calculation needed.

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

### Example Calculation
```
Class: Tuesday 7am Reformer Flow
Instructor: Anissa Pollard
Check-ins: 8 students (full class)

Pay = $58 for that class
```

```
Class: Wednesday 10am Reformer Fundamentals
Instructor: Sirkka Wood
Check-ins: 6 students

Pay = $48 for that class
```

### Substitutions
- If an instructor subs a class, they are paid for that class at their rate
- The original instructor is not paid for a class they didn't teach
- Subs are tracked in the system — pay follows the instructor who actually taught

---

## Instructor Pay — Private Sessions

Private sessions are paid as a **flat rate per session**, tiered by instructor seniority. ✅ Confirmed

### Rate Table

| Instructor level | Rate per private session |
|---|---|
| Standard (< 1 year) | $45 |
| Standard (1+ year) | $55 |
| Master Trainer | Individually negotiated (typically $60–$65) ✅ |

Master trainer rates are set per instructor based on their individual agreement with Ruby. The platform stores a **custom private rate** on each instructor profile — no fixed tier lookup needed at that level.

### How Seniority Is Tracked
- Each instructor profile has a **hire date**, **trainer level** (Standard / Master Trainer), and **private session rate** field
- The platform automatically applies the $55 rate once an instructor's hire date is 1+ year prior to the session date
- Master trainer rate is manually set by admin and overrides the seniority-based rate
- All rate changes take effect at the start of the next pay period and are logged with a timestamp

### Intro Sessions
- Intro-priced private packs (3 sessions for $250) — instructor earns their standard session rate regardless of the discounted client price. ✅ Confirmed.

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

### Break Tracking (Optional)
- Staff can log unpaid breaks
- Platform deducts break time from hours worked

---

## Pay Periods

- **Semi-monthly** — twice per month ($2,000/mo for Susan = $1,000/period) ✅ Confirmed
- Typical schedule: 1st–15th and 16th–end of month
- Pay period start/end dates set by admin — configurable
- At the end of each pay period, the system auto-generates a payroll summary

---

## Payroll Summary Report

At the end of each pay period, admin sees a full breakdown:

```
Pay Period: Mar 1 – Mar 15, 2026
Location: All Locations
─────────────────────────────────────────────────────
INSTRUCTORS

Anissa Pollard  (Master Trainer)
  Group classes taught:    8
    2 classes × $30 (0-4 clients)   =  $60.00
    3 classes × $48 (5-7 clients)   = $144.00
    3 classes × $58 (full class)    = $174.00
  Group subtotal:                     $378.00
  Private sessions:        3 × $60  = $180.00
  ─────────────────────────────────────────────
  Subtotal:                           $558.00

Sirkka Wood  (Master Trainer)
  Group classes taught:    6
    1 class  × $30 (0-4 clients)    =  $30.00
    3 classes × $48 (5-7 clients)   = $144.00
    2 classes × $58 (full class)    = $116.00
  Group subtotal:                     $290.00
  Private sessions:        5 × $60  = $300.00
  ─────────────────────────────────────────────
  Subtotal:                           $590.00

[... all instructors ...]

─────────────────────────────────────────────────────
MANAGER

Susan LeGrand
  Pay type:                Semi-monthly salary
  ─────────────────────────────────────────────
  Subtotal:                         $1,000.00

─────────────────────────────────────────────────────
FRONT DESK

Bobby Douangkesone
  Hours worked:            36 hrs (6 shifts × 6 hrs)
  Hourly rate:             $18.00/hr
  Regular pay:             $648.00
  Overtime:                $0.00
  ─────────────────────────────────────────────
  Subtotal:                           $648.00

[... all front desk ...]

─────────────────────────────────────────────────────
TOTAL PAYROLL THIS PERIOD:         $X,XXX.00
─────────────────────────────────────────────────────
[Export CSV]  [Export PDF]  [Mark as Processed]
```

---

## Instructor Complimentary Classes

Instructors may attend classes for free when attendance is low. If a class is filling up, they're expected to give their spot to paying clients. ✅ Confirmed.

### How the Platform Handles It

- Instructors book through the client mode of the app as normal
- Their booking is automatically flagged as **"Staff — Complimentary"** in the roster — no charge, no credit deducted
- The booking appears in the class roster so the teaching instructor knows a colleague is attending
- **Soft warning:** If an instructor tries to book a class that is 75%+ full (6+ of 8 spots taken), the app shows a gentle notice: *"This class is filling up — please consider leaving this spot for a paying client."* They can still proceed — it's a reminder, not a hard block
- **Complimentary attendees count toward the teaching instructor's pay tier.** If 7 paying clients + 1 staff attendee check in = 8 total, the teaching instructor earns $58 (full class rate). ✅ Confirmed.
- Admin can see all complimentary bookings in the class roster and payroll reports (for visibility, not billing)

---

## Pay Rate Management (Admin)

Ruby or admin can set and update pay rates per employee without a developer:

- Each employee profile has a **pay structure** field
- Instructor: base rate per class, per-head bonus threshold, bonus rate, private rate
- Front desk: hourly rate
- Changes take effect from the next pay period (not retroactively)
- All rate changes are logged with timestamp and who made the change

---

## Multi-Location Payroll

- Classes and sessions are tied to a location
- Payroll report can be filtered by location (Charlotte Park / Green Hills / All)
- Some instructors may work at both locations — their pay rolls up across both
- Useful for understanding labor cost per location separately

---

## Payroll Export & Integration

The platform generates a payroll export that can be imported into:
- **Gusto** (recommended — widely used by small businesses, clean CSV import)
- **QuickBooks**
- **ADP**
- Generic CSV for any other processor

The export includes: employee name, employee ID, pay type, gross pay, hours (for hourly), pay period dates.

The studio's payroll processor handles: tax withholding, direct deposit, year-end W-2s.

---

## Individual Pay Stubs (Employee View)

Each employee can log into their own dashboard and see:

```
Your Pay — Mar 1–15, 2026

GROUP CLASSES
  2 classes (0–4 clients) × $30   =  $60.00
  3 classes (5–7 clients) × $48   = $144.00
  3 classes (full, 8)    × $58    = $174.00
  ───────────────────────────────────────
  Group total:                      $378.00

PRIVATE SESSIONS
  3 sessions × $60 (master trainer) = $180.00

──────────────────────────────────────────
Gross pay this period:               $558.00

[View pay history]
```

- Read-only — employees can see their own pay breakdown but cannot edit
- Historical pay periods accessible
- Useful for instructor transparency — they can see exactly how their pay was calculated

---

## Notifications

| Trigger | Recipient | Timing |
|---|---|---|
| Pay period closing in 2 days | Admin | 2 days before close |
| Payroll summary ready | Admin | At pay period end |
| Instructor approaching 0 classes this period | Admin | Midpoint of pay period |
| Front desk staff approaching overtime | Admin | When 35+ hrs logged in a week |
| Pay stub available | Employee | At pay period close |

---

## Open Questions / Decisions Needed

- [x] **Group class pay structure:** Tiered flat rate — $30 (0-4 clients) / $48 (5-7) / $58 (8, full). ✅ Confirmed
- [x] **Private session pay:** Flat rate by seniority — $45 (< 1yr) / $55 (1+ yr) / $60–$65 (master trainer). ✅ Confirmed
- [x] **Front desk hourly rate:** $18/hr, typical 6-hour shifts. ✅ Confirmed
- [x] **Manager pay:** Susan LeGrand — $1,000/period, semi-monthly ($2,000/mo). ✅ Confirmed
- [x] **Pay period:** Semi-monthly. ✅ Confirmed
- [x] **Payroll processor:** Gusto. ✅ Confirmed
- [x] **Master trainer private rate:** Individually negotiated per trainer. Platform stores a custom rate per instructor profile. ✅ Confirmed
- [x] **Intro session pay:** Instructors earn their standard rate regardless of client's discounted intro price. ✅ Confirmed
- [ ] **Sub instructor pay:** Confirmed — sub gets paid, original does not. Any exceptions?
- [ ] **Tips:** Does Marathon Pilates handle tips? If so, does the platform need to track them?
- [x] **Instructor complimentary classes:** Instructors attend free when attendance is low. If a class is filling up, they're asked to give their spot to paying clients. ✅ Confirmed. See implementation note below.

---

*Next: `07-admin-dashboard.md` — what Ruby and staff see and manage day-to-day*
