# Spec 07 — On-Demand Classes
*Marathon Pilates Platform | Created: 2026-03-09*

---

## Overview

Marathon Pilates offers on-demand classes — recorded sessions clients can access anytime, anywhere. On-demand is included with any active membership, making it a built-in retention tool: members get value from the platform even on days they can't make it into the studio.

---

## Access Rules

| Client Type | On-Demand Access |
|---|---|
| Active membership (any tier) | ✅ Full library included |
| Class pack (no membership) | ❌ No access |
| Drop-in / single purchase | ❌ No access |
| Intro offer (first month) | ✅ Included |
| Paused membership | ❌ Access suspended during pause |
| Expired / cancelled membership | ❌ Access revoked |

Access is checked in real time — if a membership lapses, library access is immediately gated. When they renew, access is immediately restored.

---

## Client Experience — Library View

```
┌─────────────────────────────────────────┐
│  ON DEMAND                              │
│                                         │
│  [All]  [Reformer]  [Mat]  [Stretch]   │
│  [Beginner]  [Intermediate]  [Advanced] │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │  [thumb] │  │  [thumb] │            │
│  │          │  │          │            │
│  │ Core     │  │ Full Body│            │
│  │ Burn     │  │ Flow     │            │
│  │ 30 min   │  │ 45 min   │            │
│  │ Anissa   │  │ Sirkka   │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  Continue watching →                    │
│  ┌──────────────────────────────────┐  │
│  │ Full Body Reformer · 18 min left │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Filter & Sort Options
- **Class type:** Reformer, Mat, Stretch, Wellness
- **Level:** Beginner, Intermediate, Advanced, All Levels
- **Duration:** Under 20 min, 20–40 min, 40+ min
- **Instructor:** Filter by specific instructor
- **Sort by:** Newest, Most Popular, Shortest, Longest

### Search
- Full text search by class name, instructor, or keyword (e.g., "core," "hip flexors," "cool down")

---

## Video Player

- Clean, full-screen player optimized for phone, tablet, and desktop
- **Resume where you left off** — if a client exits mid-class, it resumes from that point
- **Playback speed control** — 0.75x, 1x, 1.25x, 1.5x
- **Chapters/timestamps** — if the video has sections (warm-up, main sequence, cool-down), clients can jump to them
- **Offline download** — mobile app only; members can download videos for use without internet (e.g., travel)
- **Chromecast / AirPlay support** — cast to TV from the app

---

## Video Metadata (Per Video)

Each video in the library has:
- Title
- Instructor
- Class type (Reformer / Mat / Stretch / Wellness)
- Level (Beginner / Intermediate / Advanced / All Levels)
- Duration
- Equipment needed (e.g., "Reformer," "Mat only," "Light weights optional")
- Short description
- Thumbnail image
- Date published
- Tags (e.g., "core," "hip flexors," "prenatal-friendly," "low impact")

---

## Progress Tracking — On-Demand

Watching on-demand is part of the client's overall journey.

- **Watch history** — visible in the client's Journey tab in the app
- **Completion tracking** — a video is "completed" when 90%+ watched
- **Milestones** — e.g., "You've completed 10 on-demand classes" feeds into the same milestone system as in-studio sessions
- **Continue watching** — shows the most recently partially-watched video at the top of the library
- **"Watch again" flag** — completed videos show a checkmark; clients can rewatch anytime

On-demand completions count toward the client's overall session total on their profile (instructors and admin can see this).

---

## Content Management (Admin / Instructor)

Ruby or designated admin can manage the library without a developer:

```
Admin → On Demand → Upload New Video
  ├── Upload video file (or paste Vimeo/YouTube link)
  ├── Title, description, tags
  ├── Assign instructor
  ├── Set class type, level, duration
  ├── Set thumbnail
  ├── Set visibility: Published / Draft / Scheduled
  └── Publish
```

### Visibility Options
- **Published** — live in the library, all active members can watch
- **Draft** — saved but not visible to members
- **Scheduled** — goes live automatically at a set date/time (useful for content drops)
- **Archived** — hidden from library but not deleted; data preserved

### Collections / Playlists (Optional)
Admin can group videos into curated collections:
- e.g., "30-Day Beginner Series," "Core Focus Week," "Post-Run Recovery"
- Clients can follow a collection and see their progress through it

---

## Video Hosting

Video files should not be stored on the platform's own servers — use a dedicated video host:

**✅ Confirmed: Mux**

Mux is the standard for modern video platforms — used by Peloton, Future, and most fitness apps. Handles adaptive bitrate streaming (quality adjusts automatically to connection speed), provides per-video analytics (plays, watch time, drop-off points), and has a clean API for Next.js and React Native.

- Videos are uploaded via the admin dashboard → go directly to Mux
- The platform stores only the Mux `playbackId` — no video files on our servers
- Players on web and mobile stream directly from Mux's global CDN
- Cost: ~$0.015/min stored + ~$0.005/min delivered (~$45–80/mo at launch scale)

---

## Analytics (Admin)

Ruby can see how the on-demand library is performing:

- **Most watched videos** — top 10 by total plays
- **Completion rates** — which videos get watched all the way through vs. abandoned
- **Watch time by instructor** — useful for instructor engagement insights
- **Library usage by member** — which members are using on-demand, which aren't
- **Drop-off points** — where in a video do people stop watching (Mux provides this natively)

---

## Notifications

| Trigger | Message | Channel |
|---|---|---|
| New video published | "New class available: [Title] with [Instructor]" | Push + Email |
| New collection published | "New series: [Collection Name]" | Push + Email |
| Member hasn't watched in 14 days | "Your library is waiting — try [recommended video]" | Push |
| Milestone: 10 on-demand completions | Milestone celebration | Push + in-app |

---

## Open Questions / Decisions Needed

- [ ] **Content cadence:** How often does Marathon Pilates plan to publish new on-demand videos? (Weekly? Monthly? As recorded?)
- [ ] **Existing content:** Is there an existing library of recorded classes to migrate in at launch, or starting from zero?
- [ ] **Instructor consent:** Are instructors compensated additionally for on-demand recordings, or is it included in their role?
- [ ] **Wellness content:** Should on-demand include non-class content — e.g., sauna protocols, breathwork guides, recovery tips?
- [ ] **Collections/series:** Does Ruby want to launch with curated series (e.g., "30-Day Beginner Program"), or keep it as a flat library initially?
- [ ] **Download for offline:** Include offline download at launch, or defer to a later phase?
- [ ] **Chromecast / AirPlay:** Include at launch or Phase 2?

---

*Next: `08-admin-dashboard.md` — what Ruby and staff see and manage day-to-day*
