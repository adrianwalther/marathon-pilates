# Spec 18 — AI Instructor Video

> Status: Future (Phase 3–4)
> Last updated: 2026-03-17

---

## Vision

A client opens the app, picks a class, hits Play — and a realistic AI Pilates instructor guides them through every movement and cue. No screen-watching required. No Ruby on camera. Infinite classes, always available.

This is the convergence of everything the platform is building:
- Claude generates the class plan
- HeyGen renders an AI instructor video from the script
- ElevenLabs voices the cues
- The client just moves

---

## The AI Instructor Avatar

- Custom Marathon Pilates brand avatar — not Ruby (she prefers not to be on camera)
- Created once in HeyGen as a licensed custom avatar
- Consistent look and feel across all generated classes
- Dressed in Marathon Pilates brand colors / aesthetic
- Demonstrates movements clearly, cues verbally in sync

---

## Phased Rollout

### Phase 1 — Pre-Generated Library (Launch)

Generate a curated set of "hero" classes covering the most common combinations:

| Duration | Difficulty | Focus Areas |
|---|---|---|
| 30 min | Beginner | Full Body, Core & Abs, Hip Mobility, Spinal Health |
| 45 min | Beginner | Full Body, Core & Abs, Hip Mobility, Spinal Health |
| 45 min | Intermediate | Full Body, Core & Abs, Hip Mobility, Strength |
| 60 min | Intermediate | Full Body, Core & Abs, Spinal Health, Strength |
| 60 min | Advanced | Full Body, Core & Abs, Strength, Flexibility |

**Total: ~36–40 pre-generated classes**

**How it works:**
1. Claude generates each class plan using the BASI Block System
2. Script is formatted for HeyGen (cues timed per block)
3. HeyGen renders the AI instructor video (~5–10 min per class)
4. Videos reviewed by Ruby / instructors before going live
5. Uploaded to platform video library
6. Available to all members immediately — no wait time

**Benefits:**
- Polished, quality-checked content from day one
- No wait time for clients
- Feels like a real on-demand library
- Lets us validate the AI instructor format before opening customization

---

### Phase 2 — Custom Generation (Post-Launch)

Client picks their exact settings → unique class generated on demand.

**Flow:**
1. Client configures class (duration / difficulty / focus / props)
2. Claude generates the class plan (instant) ✅
3. Script sent to HeyGen API automatically
4. Client sees: *"Your class is being prepared — we'll notify you when it's ready (usually 5–10 min)"*
5. Push notification / email when video is ready
6. Class saved to their personal library permanently
7. Can be regenerated with different settings anytime

**Personal library:**
- Every custom class a client generates is saved to their profile
- Can favorite, download, or share
- History shows their class preferences over time (feeds personalization)

---

### Phase 3 — Adaptive Personalization (Future)

Classes automatically adapt based on:

- **Health history** — intake questionnaire drives modifications (Polestar traffic light)
- **Props owned** — client marks what they have, class uses only those
- **Difficulty progression** — platform tracks sessions completed, suggests level-ups
- **Focus preferences** — learns what areas they return to most
- **Language** — voice cues in client's preferred language (ElevenLabs supports 29 languages)
- **Duration preference** — suggests class length based on past behavior

---

## Technical Architecture

### Video Generation Pipeline

```
Claude API → Class Plan + Cues
     ↓
Script Formatter → Timed cue script (per block)
     ↓
HeyGen API → AI instructor video (MP4)
     ↓
Video Storage (Supabase Storage or Cloudflare R2)
     ↓
Client Video Player (in-app)
```

### Tools

| Tool | Purpose | Pricing (approx) |
|---|---|---|
| Claude API | Class plan generation | ~$0.05–0.15 per class |
| HeyGen API | AI instructor video | ~$0.30–1.00 per minute of video |
| ElevenLabs | Voice cues (Ruby's voice clone or avatar voice) | ~$0.10–0.30 per class |
| Supabase Storage | Video hosting | ~$0.02/GB/month |
| Cloudflare R2 | Alternative video hosting (no egress fees) | ~$0.015/GB/month |

**Estimated cost per custom class (45 min video):** ~$15–25
**Pre-generated library (40 classes):** ~$600–1,000 one-time

---

## Playback Experience

**Client-facing player:**
- Full-screen video of AI instructor
- Block name + timer overlay (so client knows where they are)
- Voice cues play automatically — no need to watch screen
- Pause / resume
- Skip block (jumps to next BASI block)
- Replay cue (repeats last voice prompt)
- Download class plan as PDF

**No screen-watching needed:**
- Voice handles all cueing
- Timer counts down each block
- Client can close eyes and just move

---

## Quality Control

Before any video goes live (pre-generated or custom):
- Ruby / lead instructor reviews script for safety and accuracy
- Polestar traffic light applied — any red-flag exercises flagged for modification
- Video reviewed for movement accuracy
- Approved → published to library

For custom generation, an async review queue is an option, or trust is granted after Ruby approves the generation prompts.

---

## Open Questions

- [ ] Which HeyGen avatar tier? (Standard vs. custom licensed avatar)
- [ ] Who voices the avatar — ElevenLabs stock voice or custom Marathon Pilates voice?
- [ ] Review workflow for custom-generated classes — async queue or auto-publish?
- [ ] Video hosting — Supabase Storage vs. Cloudflare R2 vs. Mux (best for video streaming)
- [ ] Offline download for mobile — allow clients to download classes for travel?
- [ ] Multilingual — which languages to support first?

---

## Why This Wins

No boutique Pilates studio is doing this. The combination of:
- Infinite personalized classes
- AI instructor that looks and sounds real
- No instructor scheduling or recording burden on Ruby
- Adaptive to each client's health, goals, and equipment

...creates a product that can't be replicated by Mindbody, Arketa, or any existing platform. It becomes a core membership retention feature — clients stay because no other studio can offer this.
