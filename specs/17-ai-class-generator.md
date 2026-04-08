# Spec 17 — AI Class Generator (Generative Mat Pilates)

## Overview
An AI-powered mat Pilates class generator that produces personalized, methodologically sound class sequences on demand. Clients input their preferences and any physical limitations; the system generates a complete class following Balanced Body/BASI methodology. Marathon Pilates instructors curate and approve the exercise library that the AI draws from — ensuring every generated class stays within the studio's standards.

---

## Phase
Phase 3 — ships after core on-demand library (spec 07) is live.

---

## Goals
- Extend the on-demand offering beyond pre-recorded classes to infinite personalized sessions
- Differentiate Marathon Pilates from every other boutique studio (no one has this yet)
- Keep clients engaged between studio visits with safe, structured home practice
- Maintain methodological integrity — every generated class is grounded in BASI Block System sequencing

---

## Methodology Foundation

All class generation follows the **Unified Pilates Methodology** — synthesized from BBU (Balanced Body University), BASI (Body Arts and Science International), and Polestar Pilates. Full methodology document: `research/unified-pilates-methodology.md`.

The **BASI Block System** is the structural skeleton. Polestar's developmental progression (supine → standing) informs sequencing within blocks. BBU provides the classical exercise vocabulary.

### The 9 Blocks:

| Block | Content | Required? |
|---|---|---|
| 1. Warm-Up | Breathing, pelvic placement, spine articulation | Always |
| 2. Foundation | Proximal stability, core connection | Always |
| 3. Abdominal Work | Hundred, Roll-Up, Leg Circles, Ab Series | Always |
| 4. Hip Work | Side-lying series, leg circles | Level 2+ |
| 5. Spinal Articulation | Rolling Like a Ball, Seal | Level 1+ |
| 6. Lateral Flexion / Rotation | Saw, Spine Twist, Side Bend | Level 2+ |
| 7. Back Extension | Swan, Swimming, Leg Kicks | Always |
| 8. Stretches | Spine Stretch Forward, hip flexor, hamstring | Always |
| 9. Full Body Integration | Teaser, Push-Up Series, advanced combos | Level 3 only |

**Sequencing rules (hard constraints):**
- Every class must contain both flexion (Block 3) and extension (Block 7) — anterior/posterior balance is non-negotiable
- Proximal stability before distal movement
- Bilateral exercises before unilateral
- Short lever before long lever within any loading block
- Controlled tempo before dynamic movement
- Developmental progression within blocks: supine → sidelying → prone → quadruped → seated → standing (Polestar)
- Duration caps: 30-min classes ~12 exercises; 55-min ~22 exercises
- 30-min classes: choose ONE focus — do not attempt all blocks

**Universal movement principles (encoded in every cue):**
- Breath leads movement — exhale on effort, inhale to prepare
- Axial elongation before any exercise begins
- Modification trigger = principle failure (not pain alone) — if client cannot maintain breath or elongation, reduce the challenge

---

## Client Input: Class Configuration

Before generating, the client answers:

### Required
1. **Duration** — 20 min / 30 min / 50 min
2. **Level** — Beginner / Intermediate / Advanced
3. **Focus** — Full body / Core / Flexibility / Strength / Recovery

### Optional (from intake questionnaire — spec 02)
4. **Physical limitations** (pre-filled from profile if set):
   - Lower back issues
   - Knee sensitivity
   - Shoulder impingement
   - Osteoporosis / Osteopenia
   - Pregnancy (trimester)
   - Recent surgery (type + weeks since)
   - SI joint issues
   - Cervical disc issues

5. **Props available** (drives prop-linked shop panel — spec 16):
   - Mat only
   - + Resistance band
   - + Small ball
   - + Magic circle
   - + Pinky ball

---

## Contraindication Engine

The system uses Polestar's Traffic Light framework before generating any class:
- 🟢 Green — proceed, standard programming
- 🟡 Yellow — proceed with modifications; flag for instructor review
- 🔴 Red — do not generate; prompt client to consult their healthcare provider

Before generating, the system applies hard blocks based on flagged conditions:

| Condition | Blocked Exercises |
|---|---|
| Osteoporosis/Osteopenia | Roll-Up, Roll-Over, Neck Pull, Corkscrew, deep spinal flexion |
| Lumbar herniated disc | Roll-Up, Double Leg Stretch at low angle, Teaser, Jackknife |
| Cervical disc issues | Hundred (full), Neck Pull, Shoulder Bridge with neck loading |
| Pregnancy (2nd/3rd trimester) | All supine work beyond 20 weeks, prone work, Teaser |
| Recent abdominal surgery | All abdominal flexion (<8 weeks) |
| SI joint dysfunction | Rolling exercises, asymmetrical side-kick loading |
| Shoulder impingement | Push-Up Series, Side Bend (full arm balance), Leg Pull Front |

When an exercise is blocked, the generator substitutes the next-best exercise in the same block that serves the same movement intent.

---

## Exercise Library (Admin-Curated)

Ruby's instructors maintain the approved exercise library in the admin dashboard (spec 08). Each exercise entry contains:

```json
{
  "id": "single-leg-stretch",
  "name": "Single Leg Stretch",
  "level": 2,
  "block": "abdominal",
  "duration_seconds": 90,
  "breath": "Exhale to draw knee in; inhale to switch",
  "primary_cue": "Gently draw the lower abdomen in and up. Keep your box square as you alternate.",
  "common_errors": ["Losing neutral pelvis", "Pulling on the neck", "Collapsing the chest"],
  "modifications": {
    "level_down": "Keep head down, reduce range of motion",
    "level_up": "Extend both legs simultaneously, lower to 45°",
    "support": "Use a small ball under the sacrum for lumbar support"
  },
  "contraindications": ["lumbar_disc", "recent_abdominal_surgery"],
  "props_required": [],
  "props_optional": []
}
```

---

## Generation Engine

### How It Works

The generator is a Claude API call (claude-sonnet or claude-haiku for speed) with:
- A system prompt embedding the full BASI methodology, the approved exercise library, and the client's profile/flags
- A user prompt containing the class configuration (duration, level, focus, limitations, props)
- Structured output format (JSON) for reliable parsing

### System Prompt Components
1. Unified Pilates Methodology (BBU + BASI + Polestar)
2. BASI Block System rules and sequencing logic
3. Polestar developmental progression and principle-failure modification logic
4. Full exercise library (filtered to available props + non-contraindicated exercises)
5. Duration template (exercise count cap per block per duration)
6. Unified cueing language library (methodology-aligned phrases)
7. Output schema (see below)

### Output Schema

```json
{
  "class_id": "generated-uuid",
  "generated_at": "ISO timestamp",
  "config": {
    "duration_minutes": 30,
    "level": "intermediate",
    "focus": "core",
    "contraindications": ["lower_back"],
    "props": ["mat", "small_ball"]
  },
  "exercises": [
    {
      "order": 1,
      "block": "warm_up",
      "exercise_id": "pelvic-curl",
      "name": "Pelvic Curl",
      "reps_or_duration": "8 repetitions",
      "breath_cue": "Inhale to prepare; exhale to peel the spine up; inhale at the top; exhale to roll down",
      "setup_cue": "Lie on your back, knees bent, feet hip-width apart in neutral spine.",
      "movement_cue": "Gently draw the lower abdomen in and up. Begin to peel your spine from the mat one vertebra at a time.",
      "modification_note": null,
      "props_used": []
    }
  ],
  "total_exercises": 12,
  "estimated_duration_minutes": 30,
  "props_used_in_class": ["mat", "small_ball"],
  "shop_props": ["small_ball"]
}
```

---

## Class Playback UI

### Mobile (spec 12)

```
┌─────────────────────────────┐
│  YOUR CLASS  •  30 MIN       │
│  Intermediate • Core Focus   │
├─────────────────────────────┤
│                              │
│  Exercise 3 of 12            │
│                              │
│  SINGLE LEG STRETCH          │
│  Abdominal Series            │
│                              │
│  8 reps each side            │
│                              │
│  "Exhale to draw knee in;    │
│   inhale to switch"          │
│                              │
│  ──────────────── 45s        │
│                              │
│  [  PREVIOUS  ]  [  NEXT  ] │
├─────────────────────────────┤
│  ● Modification available    │
│  ● Shop: Small Ball →        │
└─────────────────────────────┘
```

**Features:**
- Exercise name + block label
- Reps or duration
- Primary cue displayed large
- Breath cue on tap
- Modification toggle (shows level-down option)
- Progress bar
- Auto-advance timer (optional — client can set)
- "Shop this prop" link if prop used (spec 16)

### Audio Mode (Phase 4)
Text-to-speech reads cues aloud for eyes-free practice. Client taps to advance or uses auto-advance timer.

---

## Saving & Replaying Classes

- Every generated class is saved to the client's profile automatically
- Client can rate the class (1–5 stars) + add notes
- "Regenerate" button creates a new class with same config but different exercise selection
- "Favorite" saves the exact sequence for repeat use
- Admin can see aggregate data: most-generated configs, exercise frequency, average ratings

---

## Ruby/Instructor Controls (Admin)

In the admin dashboard → AI Classes:

- **Approve / suspend exercises** — flag any exercise to remove from the generator pool
- **Set level overrides** — move an exercise up or down a difficulty level
- **Add new exercises** — expand the library as the studio's teaching evolves
- **View generated class log** — see all classes generated, by client, with ratings
- **Quality flag** — if a client reports a bad sequence, instructors can review and refine the library

---

## Pricing & Access

| Tier | Access |
|---|---|
| Free / Drop-in | No AI generator access |
| On-Demand subscription | Unlimited AI-generated classes |
| Membership (any tier) | Unlimited AI-generated classes included |

---

## Data Model

```sql
-- Exercise library (admin-curated)
exercises (
  id uuid PRIMARY KEY,
  name text,
  level int,               -- 1, 2, or 3
  block text,              -- warm_up, abdominal, hip, etc.
  duration_seconds int,
  breath_cue text,
  primary_cue text,
  common_errors jsonb,
  modifications jsonb,
  contraindications text[],
  props_required text[],
  props_optional text[],
  active boolean DEFAULT true,
  created_by uuid REFERENCES instructors(id),
  updated_at timestamptz
)

-- Generated classes
generated_classes (
  id uuid PRIMARY KEY,
  client_id uuid REFERENCES clients(id),
  config jsonb,
  exercises jsonb,           -- full ordered exercise list
  generated_at timestamptz,
  completed_at timestamptz,
  rating int,                -- 1–5
  notes text,
  favorited boolean DEFAULT false
)
```

---

## Open Questions for Ruby
- Should instructors be able to record short demo videos per exercise for playback during AI classes? (Significant content production effort but high value)
- Should AI classes count toward client milestone tracking (spec 02)?
- Pricing: include AI classes in all memberships, or as a separate add-on tier?
- Does Ruby want to review and approve the initial exercise library before it goes live, or delegate to senior instructors?
/clear