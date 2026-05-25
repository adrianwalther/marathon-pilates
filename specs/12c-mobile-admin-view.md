# Spec 12c — Mobile App: Admin View
*Marathon Pilates Platform | Created: 2026-05-07*

---

## Overview

The admin view is what Jazz (studio manager) and Ruby (owner) see when they log into the Marathon Pilates app. Like the trainer view, it lives in the same app — role is detected at login and the appropriate tab navigator is rendered automatically.

The admin view is designed for studio operations on the go: checking class fill rates before walking in, manually checking clients in, managing the schedule, reviewing the CRM, and monitoring payroll. It is not a replacement for the full web-based admin dashboard — that remains the primary tool for deep reporting, data management, and configuration. The mobile admin view is the "I'm in the studio and need this now" layer.

**Role access within the admin view:**

| Role | Mobile admin access |
|---|---|
| `owner` (Ruby, Adrian) | Full access — all tabs including revenue metrics |
| `admin` / `manager` (Jazz, Susan) | Dashboard, Schedule, Check-In, CRM, Payroll summary (no revenue figures) |

Jazz is the `manager` role. Per the permissions model in Spec 08: managers see operational data and fill counts but no revenue, pay rates, or financial totals.

**Design principle:** Operations first. The dashboard should answer "What's happening in the studio right now?" in under three taps.

---

## Navigation

```
Tab bar (admin mode):
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│Dashboard │ Schedule │ Check-In │   CRM    │ More     │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

"More" expands to: Payroll, Metrics (owner only), Account.

Mode toggle (top of screen — admin users who are also clients):

```
┌─────────────────────────────────┐
│  ● Admin Mode  · Client Mode    │  ← tap to switch
└─────────────────────────────────┘
```

---

## Dashboard Tab

The studio snapshot for right now. The first thing Jazz or Ruby sees when they open the app.

```
┌─────────────────────────────────┐
│  Marathon Pilates               │
│  Mon May 25                     │
│  ◎ Both Locations ▾             │
├─────────────────────────────────┤
│                                 │
│  TODAY'S CLASSES                │
│                                 │
│  7:00am  Reformer Flow     CP   │
│  Anissa · 10/12 · 2 checked in  │
│  [Roster →]                     │
│                                 │
│  9:00am  Reformer Flow     GH   │
│  Sirkka · 8/8 · Not started     │
│  [Roster →]                     │
│                                 │
│  10:00am  Reformer Fund.   CP   │
│  Anissa · 6/12 · Not started    │
│  [Roster →]                     │
│                                 │
│  2:00pm  Mat Pilates       CP   │
│  Jazz · 4/12 · Not started      │
│  [Roster →]                     │
│                                 │
│  6:00pm  Reformer Flow     CP   │
│  Sirkka · 12/12 · Full · 3 wait │
│  [Roster →]                     │
│                                 │
├─────────────────────────────────┤
│  ALERTS                         │
│                                 │
│  ⚠️  Dana Reeves — no valid      │
│     membership (7:00am class)   │
│  [Resolve →]                    │
│                                 │
│  ℹ️  Sarah Kim — milestone #50   │
│     in today's 7:00am class     │
│                                 │
├─────────────────────────────────┤
│  AMENITIES TODAY                │
│  Sauna:      3 bookings         │
│  Cold Plunge: 1 booking         │
│  [View all →]                   │
│                                 │
└─────────────────────────────────┘
```

### Dashboard Components

| Component | Logic |
|---|---|
| Today's Classes | All sessions for today at the selected location(s), sorted chronologically. Shows instructor, fill count (enrolled/capacity), check-in count during active class windows. CP = Charlotte Park, GH = Green Hills. |
| Alerts | Flagged issues: failed payments, clients with expired memberships trying to book, walk-ins with no credits. Cleared when resolved. |
| Milestones | Clients hitting a class milestone today — surfaced so Jazz or Ruby can acknowledge it in person. |
| Amenities | Today's sauna and cold plunge booking count at a glance. |

### Location Selector

```
◎ Both Locations ▾
  ○ Both
  ● Charlotte Park
  ○ Green Hills
```

Persists across sessions. "Both" is the default for admin users — they need the full picture.

### Class Row States

| State | Display |
|---|---|
| Not yet started | "Not started" — fill count only |
| Active (within class window) | Check-in count updates in real time |
| Completed | Check-in count, no-show count |
| Cancelled | Strikethrough, "Cancelled" label |

---

## Schedule Management Tab

View and manage the full studio schedule. This is where Jazz or Ruby adds sessions, edits details, and cancels classes.

```
┌─────────────────────────────────┐
│  Schedule                       │
│  ◎ Charlotte Park ▾             │
├─────────────────────────────────┤
│  [Week] [Day] [List]   [+ Add]  │
├─────────────────────────────────┤
│  ← This Week  May 25–31  →      │
├─────────────────────────────────┤
│                                 │
│  MON May 25                     │
│  7:00am   Reformer Flow         │
│           Anissa · 10/12        │
│                                 │
│  10:00am  Reformer Fund.        │
│           Anissa · 6/12         │
│                                 │
│  2:00pm   Mat Pilates           │
│           Jazz · 4/12           │
│                                 │
│  6:00pm   Reformer Flow         │
│           Sirkka · 12/12 FULL   │
│                                 │
│  TUE May 26                     │
│  9:00am   Reformer Flow         │
│           Sirkka · 5/8          │
│           Green Hills           │
│                                 │
│  [more days...]                 │
│                                 │
└─────────────────────────────────┘
```

### Add Session

Tap [+ Add] to create a new session:

```
┌─────────────────────────────────┐
│ ← Cancel      Add Session       │
├─────────────────────────────────┤
│                                 │
│  Class type:                    │
│  [Reformer Flow           ▾]    │
│                                 │
│  Date:        [May 28, 2026]    │
│  Start time:  [7:00 AM]         │
│  Duration:    [50 min]          │
│                                 │
│  Instructor:  [Anissa M.    ▾]  │
│  Location:    [Charlotte Park▾] │
│  Capacity:    [12]              │
│                                 │
│  Recurring?                     │
│  ● One time                     │
│  ○ Weekly (every Thu)           │
│  ○ Custom...                    │
│                                 │
│  [Create Session]               │
│                                 │
└─────────────────────────────────┘
```

### Edit Session

Tap any existing class row → options slide up:

```
  Reformer Flow · Mon May 25 · 7:00am

  [Edit Details]
  [Change Instructor]
  [Cancel This Class]
  [Cancel All Future (recurring)]
  [Cancel]
```

**Edit Details** opens the same form as Add Session with current values pre-filled.

**Cancel This Class** flow:

```
Cancel class?
  Reformer Flow · Mon May 25 · 7:00am
  10 clients enrolled

  Notify clients?
  ● Yes — send cancellation email + push
  ○ No

  Message to clients (optional):
  [e.g., "Instructor out sick — apologies
   for the short notice. Credits returned."]

  [Confirm Cancellation]
```

Credits are returned automatically to all enrolled clients upon cancellation. Waitlisted clients receive a "class was cancelled" notification — no hold is placed.

---

## Check-In Tab

A dedicated screen for manually checking clients into any class that is currently in progress or starting within the next 30 minutes.

```
┌─────────────────────────────────┐
│  Check-In                       │
│  Mon May 25                     │
├─────────────────────────────────┤
│  ACTIVE CLASSES                 │
│                                 │
│  ● 7:00am Reformer Flow    CP   │
│    Anissa · 10 enrolled         │
│    8 checked in · 2 pending     │
│                                 │
│  Starting soon:                 │
│  9:00am Reformer Flow      GH   │
│  8 enrolled                     │
│                                 │
├─────────────────────────────────┤
│  [Open Roster: 7:00am →]        │
│  [Open Roster: 9:00am →]        │
└─────────────────────────────────┘
```

Opening a class from this tab opens the same full-roster view instructors use — admin can check clients in, mark no-shows, and add walk-ins from the same interface.

### Manual Check-In (Quick Search)

If an admin is at the front desk and needs to check someone in fast:

```
┌─────────────────────────────────┐
│  Quick Check-In                 │
├─────────────────────────────────┤
│  [Search client name or email]  │
│                                 │
│  Sarah Kim                      │
│  Reformer Flow · 7:00am         │
│  Unlimited · 3 credits remain   │
│  [Check In ✓]                   │
│                                 │
│  — or —                         │
│  [Enroll in different class]    │
│                                 │
└─────────────────────────────────┘
```

---

## CRM Tab

Client and lead management. The CRM tab is for understanding the studio's client base, tracking membership health, and identifying at-risk members.

```
┌─────────────────────────────────┐
│  CRM                            │
├─────────────────────────────────┤
│  [Search clients...]        🔍  │
├─────────────────────────────────┤
│  FILTERS                        │
│  [All] [Active] [Lapsing]       │
│  [Paused] [Leads] [VIP]         │
├─────────────────────────────────┤
│  ACTIVE MEMBERS (128)           │
│                                 │
│  Sarah Kim                      │
│  Unlimited · Since Jan 2026     │
│  42 classes · Last: today       │
│  [View →]                       │
│                                 │
│  Dana Reeves                    │
│  8-Class Pack · 2 remaining     │
│  49 classes · Last: May 22      │
│  ⚠️ Pack expiring in 5 days      │
│  [View →]                       │
│                                 │
│  Tom Walsh                      │
│  Reformer Unlimited             │
│  15 classes · Last: May 18      │
│  [View →]                       │
│                                 │
│  [More...]                      │
│                                 │
└─────────────────────────────────┘
```

### Filter States

| Filter | Shows |
|---|---|
| All | Every client in the system |
| Active | Clients with a valid membership or unused credits |
| Lapsing | Clients who haven't booked in 14+ days, or whose membership/pack is expiring within 7 days |
| Paused | Clients with a paused membership |
| Leads | Prospective clients (intake form submitted, no purchase yet) |
| VIP | Milestone 50+ (Charlotte Park loyalists) |

The "Lapsing" filter is the most action-oriented — it surfaces members who are at risk of churning before they actually cancel.

### Client Detail (Admin View)

Tapping a client opens their full admin profile — more detail than the instructor's read-only view.

```
┌─────────────────────────────────┐
│ ← Back         Sarah Kim        │
├─────────────────────────────────┤
│  Sarah Kim                      │
│  sarah.kim@email.com            │
│  (615) 555-0192                 │
│  Member since Jan 2026          │
├─────────────────────────────────┤
│  MEMBERSHIP                     │
│  Reformer Unlimited             │
│  Renews Jun 1 · Auto-billed     │
│  Class credits: 3 remaining     │
│  Wellness credits: 2 remaining  │
│  [Adjust Credits]               │
│  [Pause Membership]             │
│  [Cancel Membership]            │
├─────────────────────────────────┤
│  ATTENDANCE                     │
│  Total classes:  42             │
│  This month:     6              │
│  Last class:     May 25         │
│  Milestones:     25 classes ✅   │
│                                 │
│  RECENT ACTIVITY                │
│  May 25  Reformer Flow · Anissa │
│  May 22  Mat Pilates · Jazz     │
│  May 20  Sauna · 45 min         │
│  [See all →]                    │
├─────────────────────────────────┤
│  PAYMENT                        │
│  Visa ending 4242               │
│  Last charge: May 1 · $289.00   │
│  [Billing history →]            │
│                                 │
│  [Issue Refund]                 │
│  [Add Manual Credit]            │
│                                 │
└─────────────────────────────────┘
```

### Credit Adjustment Flow

```
Adjust Credits: Sarah Kim

  Class credits
  Current: 3
  Adjust:  [+1]  [+3]  [+5]  [Custom]

  Reason (required):
  ○ Makeup for cancelled class
  ○ Studio goodwill
  ○ Error correction
  ○ Other: [text field]

  [Apply Adjustment]
```

All credit adjustments are logged with admin ID, timestamp, and reason. Audit trail is accessible in the web admin.

---

## Payroll Tab

Current pay period summary for all instructors. Accessible from "More" in the tab bar.

Jazz (manager role) sees the payroll tab but with pay amounts hidden — she sees session counts only. Ruby sees full dollar figures.

### Manager View

```
┌─────────────────────────────────┐
│  Payroll                        │
│  May 1 – May 15                 │
├─────────────────────────────────┤
│  STATUS                         │
│  Open · Closes May 16           │
├─────────────────────────────────┤
│                                 │
│  INSTRUCTORS                    │
│                                 │
│  Anissa Mitchell                │
│  6 classes · 52 students        │
│  3 private sessions             │
│  Earnings: ——                   │
│                                 │
│  Sirkka Lyytinen                │
│  4 classes · 38 students        │
│  1 private session              │
│  Earnings: ——                   │
│                                 │
│  Jazz (if teaching)             │
│  2 classes · 10 students        │
│  Earnings: ——                   │
│                                 │
│  FRONT DESK                     │
│  Bobby D.  18 hrs this period   │
│  Earnings: ——                   │
│                                 │
│  MANAGER                        │
│  Susan LeGrand  Semi-monthly    │
│  Earnings: ——                   │
│                                 │
│  [Full details on web →]        │
│                                 │
└─────────────────────────────────┘
```

### Owner View (Ruby)

Same layout, with earnings shown:

```
  Anissa Mitchell
  6 classes · 52 students
  3 private sessions
  Earnings: $384.00

  [Period total: $X,XXX.XX]
  [Export to Gusto →]
```

The Gusto export is also available directly from the mobile payroll view for Ruby — she can initiate a pay run from her phone once the period closes.

### Pay Period Status

| Status | Meaning |
|---|---|
| Open | Current period, accumulating |
| Pending review | Period ended, not yet exported |
| Exported | Sent to Gusto |
| Processed | Gusto confirms payroll run complete |

---

## Metrics Tab (Owner Only)

Studio-level analytics. Visible only to `owner` role. Jazz cannot access this tab.

```
┌─────────────────────────────────┐
│  Metrics                        │
│  ◎ Both Locations ▾             │
├─────────────────────────────────┤
│  [This Month] [Last Month]      │
│  [Last 90 Days] [Custom]        │
├─────────────────────────────────┤
│                                 │
│  MEMBERSHIP                     │
│  Active members:    128         │
│  New this month:    12          │
│  Paused:            4           │
│  Cancelled:         3           │
│  Net change:        +9          │
│                                 │
│  ATTENDANCE                     │
│  Classes taught:    42          │
│  Total check-ins:   378         │
│  Avg fill rate:     74%         │
│  Top class:         Reformer    │
│                                 │
│  REVENUE (This Month)           │
│  Memberships:       $X,XXX      │
│  Drop-ins/Packs:    $XXX        │
│  Private sessions:  $XXX        │
│  Amenities:         $XXX        │
│  On-Demand:         $XXX        │
│  Total:             $X,XXX      │
│                                 │
│  FILL RATES BY CLASS            │
│  Reformer Flow      88%  ██████ │
│  Reformer Fund.     71%  █████░ │
│  Mat Pilates        55%  ████░░ │
│  Sauna              64%  ████░░ │
│                                 │
│  [Full report on web →]         │
│                                 │
└─────────────────────────────────┘
```

The mobile metrics tab shows summary KPIs. The full web admin dashboard has deep drill-downs, comparison charts, and export functionality. The mobile view is for a quick pulse-check, not analysis.

---

## Account Tab

Admin-specific profile settings and app config.

```
┌─────────────────────────────────┐
│  Ruby Ramdhan                   │
│  Owner                          │
│  ruby@marathonpilates.com       │
├─────────────────────────────────┤
│  SETTINGS                       │
│  Notification Preferences  →   │
│  Studio Settings (web only) →  │
│  Help & Support            →   │
│  Log Out                        │
└─────────────────────────────────┘
```

Studio settings (booking policies, cancellation windows, pricing) are web-only — not editable from the mobile admin view.

### Admin Notification Preferences

```
  Notifications

  STUDIO ALERTS
  ✅  Failed payment (client)         Push + Email
  ✅  Membership expiring (client)    Email
  ✅  Class cancelled (any)           Push
  ✅  Low class fill (<50%, 24hr)     Push

  OPERATIONS (manager only)
  ✅  New private session request     Push
  ✅  Instructor no-show flag         Push + Email

  BUSINESS (owner only)
  ✅  Daily revenue summary           Email
  ✅  Weekly metrics summary          Email
  ✅  Payroll period open/close       Email
```

---

## Role-Based Access Summary (Mobile Admin)

| Feature | Manager (Jazz, Susan) | Owner (Ruby) |
|---|---|---|
| Dashboard — class fill counts | Yes | Yes |
| Dashboard — check-in counts | Yes | Yes |
| Dashboard — alerts | Yes | Yes |
| Schedule — view | Yes | Yes |
| Schedule — add/edit/cancel | Yes | Yes |
| Check-In tab | Yes | Yes |
| CRM — member list | Yes | Yes |
| CRM — client detail (no billing) | Yes | Yes |
| CRM — client billing history | No | Yes |
| CRM — issue refund | No | Yes |
| Payroll — session counts | Yes | Yes |
| Payroll — earnings figures | No | Yes |
| Payroll — Gusto export | No | Yes |
| Metrics tab | No | Yes |

This mirrors the permissions matrix in Spec 08, applied to the mobile view.

---

## Push Notifications — Admin-Specific

| Trigger | Roles | Channel | Timing |
|---|---|---|---|
| Client failed payment | Both | Push + Email | Immediately |
| Class cancelled by instructor | Both | Push | Immediately |
| Class fill below 50% (24hr before) | Both | Push | 24hr before |
| Private session request (unassigned) | Both | Push + Email | Immediately |
| Waitlist cleared (class full) | Both | Push | Immediately |
| Daily revenue summary | Owner only | Email | 8am daily |
| Weekly metrics summary | Owner only | Email | Mon 8am |
| Pay period open | Owner only | Email | On period open |
| Pay period ready to export | Owner only | Push + Email | On period close |

---

## Offline Behavior

| Feature | Offline behavior |
|---|---|
| Dashboard | Shows cached state; "last updated X min ago" |
| Schedule view | Reads from cache; edits require connection |
| Check-In | Check-ins queue locally, sync on reconnect |
| CRM | Reads from cache; adjustments require connection |
| Payroll | Reads from cache; export requires connection |
| Metrics | Reads from cache |

---

## Phase 1 vs. Phase 2

### Phase 1 (Launch)
- Dashboard with today's classes, fill counts, alerts
- Schedule management (add/edit/cancel sessions)
- Check-In tab with quick search
- CRM — member list, filter, client detail
- Credit adjustments with reason logging
- Payroll tab (session counts for manager; earnings for owner)
- Metrics tab (owner only)
- Admin push notifications
- Role-based access enforcement throughout

### Phase 2 (Post-Launch)
- **Sub request management** — admin approves instructor sub requests from the app
- **Broadcast messaging** — send push/email to a filtered member segment (e.g., lapsing members) directly from CRM tab
- **Waitlist management** — manually move clients from waitlist to enrolled from admin view
- **Clock in/out for front desk** — admin can view clock-in log on mobile (front desk still clocks in from web)
- **Class notes from instructors** — admin can read post-class notes left by instructors

---

## Open Questions / Decisions Needed

- [ ] **Jazz's role:** Jazz is currently listed in MEMORY as "studio manager" — confirm whether she should be `admin` or `manager` in the roles enum. This determines whether she sees pay figures on the Payroll tab.
- [ ] **Susan on mobile:** Susan LeGrand is the operations manager — does she use the mobile admin view, or is she web-only? Her $1,000/period salary means she's less likely to be on the floor, but confirm.
- [ ] **Instructor sub requests (Phase 1):** For Phase 1, the spec says instructors contact Ruby/Susan directly. Should the mobile admin view at least surface a "pending sub requests" section on the dashboard, or is that Phase 2 entirely?
- [ ] **Broadcast from mobile:** Sending a studio-wide push or email (e.g., "Studio closed tomorrow") from the mobile app would be valuable for emergencies — should this be a fast-action button on the dashboard even in Phase 1?
- [ ] **Location-specific admin access:** If Jazz manages Charlotte Park specifically, should her dashboard default to Charlotte Park only with an explicit toggle required to see Green Hills?

---

*Related specs: 06-payroll.md · 08-admin-dashboard.md · 09-notifications.md · 12-mobile-app.md · 12b-mobile-trainer-view.md*
