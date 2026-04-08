# Marathon Pilates — Booking Platform Ideas & Requirements
> Living document — keep adding ideas here as they come

---

## Vision
A custom booking platform that serves as the operational backbone of Marathon Pilates — covering classes, private sessions, and wellness amenities (sauna, cold plunge). Seamlessly integrated with the Marathon Pilates website and a companion mobile app.

---

## Core Goals
- [ ] Replace or outperform platforms like Mindbody / Arketa
- [ ] Full client journey tracking and progress visibility
- [ ] Multi-service booking: Pilates classes, private sessions, sauna, cold plunge
- [ ] Seamless website integration (Marathon Pilates site)
- [ ] Companion mobile app (iOS + Android)
- [ ] Wellness-as-a-whole experience — not just a scheduler

---

## Services to Support
- Group Pilates classes (Reformer, Mat, etc.)
- Private / semi-private Pilates sessions
- Sauna sessions
- Cold plunge sessions
- Bundled wellness packages (e.g., class + sauna + cold plunge)
- On-demand video library (included with any active membership)

---

## Client Journey & Progress Tracking Ideas
- Onboarding intake form (fitness level, goals, health history)
- Milestone tracking (classes attended, streaks, personal records)
- Progress notes (instructor-facing, per client)
- Goal setting + check-ins
- "Wellness journey" timeline visible to client in app
- Instructor can leave session notes tied to client profile
- Body measurement / composition tracking (optional)
- Before/after progress photos (opt-in)

---

## Booking & Scheduling
- Class calendar with real-time availability
- Waitlist management with auto-promotion
- Early booking for members vs. drop-ins
- Recurring appointment booking (e.g., every Tuesday 9am)
- Cancellation policy enforcement (late cancel / no-show fees)
- Room / equipment assignment (which Reformer, which sauna room)
- Multi-service booking in one flow (e.g., book class + sauna in one session)

---

## Membership & Pricing
- Class packs (5, 10, 20 classes)
- Monthly memberships (unlimited, limited)
- Wellness bundles (Pilates + Sauna + Cold Plunge packages)
- Drop-in rates
- Intro offers (first class free, intro month discount)
- Pause / freeze membership option
- Auto-renewal with billing management

---

## App Features (Client-Facing)
- Book / cancel / waitlist from app
- View upcoming and past sessions
- Progress dashboard (streaks, milestones, journey timeline)
- Push notifications (class reminders, waitlist openings, promotions)
- In-app messaging with studio
- Membership & billing management
- Instructor profiles / bios
- Class descriptions and what to bring
- Sauna / cold plunge tips and protocols

---

## Website Integration
- Embedded booking widget on Marathon Pilates site
- Schedule page with live availability
- Class descriptions pulling from platform database
- Member login portal on site
- Consistent branding (fonts, colors matching Marathon Pilates brand)

---

## Staff / Admin Tools
- Instructor scheduling and sub requests
- Client roster per class
- Check-in (QR code or manual)
- Client notes and history
- Revenue reporting and analytics
- Membership management dashboard
- Automated waitlist management
- Communication tools (email, SMS to clients)

---

## Competitive Research (In Progress)
- [ ] Mindbody — research agent running
- [ ] Arketa — research agent running
- [ ] Other platforms to investigate: Pike13, Glofox, WellnessLiving, Zen Planner

---

## Integration Ideas
- Payment: Stripe
- Email/SMS: Twilio / SendGrid
- CRM: potential HubSpot or custom
- Wearables: Apple Health / Google Fit (optional, future)
- Wix site integration (current Marathon Pilates site is on Wix)

---

## Open Questions
- Build from scratch vs. white-label an existing platform?
- Native app vs. React Native / cross-platform?
- Self-hosted vs. SaaS?
- How much customization does the Wix site need to support embedding?
- What data should instructors see vs. clients?

---

## Ideas Parking Lot (Add anything here)
- Referral program (client brings a friend)
- Community feed or social element within app
- Educational content / video library for at-home practice
- Loyalty points / rewards system
- Wellness challenges (30-day streaks, etc.)
- NFC check-in at the door
- Automated "we miss you" outreach after X days of inactivity

---

## Research Findings
*(Will be populated once agents complete)*

### Mindbody
**Pricing:** ~$129–$599+/month base, real-world spend often $400–$800/month with add-ons. Annual contracts. Payment processing 2.75–3.5%+.

**Strengths:**
- Large consumer network (clients already have Mindbody accounts)
- Mature booking engine for classes + appointments
- Comprehensive membership/pack management
- Multi-location support

**Critical Gaps (our opportunities):**

| Gap | What We Build Instead |
|---|---|
| No wellness amenity booking (sauna/cold plunge is a hack) | Native amenity booking with clean UX |
| Zero client progress tracking | Pilates progress dashboard, milestone tracking |
| No cross-service bundles in one checkout | Class + sauna in one booking flow |
| Generic, unbranded client app | Fully branded Marathon Pilates app |
| Dated, complex admin UI | Modern, intuitive admin |
| Expensive + hard to leave (data lock-in) | Fair pricing, clean data portability |
| No in-app client↔instructor messaging | Two-way messaging |
| Widget customization is very limited | Pixel-perfect Wix site integration |
| No milestone/loyalty features | Streaks, milestones, rewards |

**Key Pain Points from Studios:**
- $400–$800/mo real cost once add-ons stack up
- Steep learning curve for staff
- Data lock-in — hard to migrate away
- API access now costs $150–$500+/mo extra
- Forces their own payment processor
- Support is notoriously poor

**Key Pain Points from Clients:**
- Consumer app feels cluttered/generic
- Duplicate account issues
- No sense of the studio's brand

### Arketa
**Pricing:** ~$150–$800+/month depending on tier. Stripe processing (standard rates — no lock-in).

**Key differentiator vs. Mindbody:** Modern UX, branded mobile app included, on-demand video, faster onboarding.

**Strengths:**
- Genuinely modern, consumer-grade booking UX
- Branded iOS + Android app (studio's name in App Store)
- On-demand video library for members
- Stripe payment processing (no proprietary lock-in)
- Faster to set up than Mindbody

**Critical Gaps (our opportunities):**

| Gap | What We Build Instead |
|---|---|
| No "class + amenity" bundle checkout | Single-transaction Pilates + recovery add-on |
| No resource cleaning/turnover buffers | True resource management with buffer windows |
| Limited UX customization (still Arketa's UX) | Fully custom frontend for Marathon Pilates brand |
| SMS requires third-party | Native SMS from day one |
| No API for custom frontend builds | Headless-ready or fully custom |
| App updates pushed without studio control | Full control over release cadence |
| Basic reporting | Amenity utilization + client wellness dashboards |

**Key Pain Points:**
- Branded app tier steep for smaller studios
- No discovery network (unlike Mindbody's marketplace)
- Support slow for non-enterprise plans
- Amenity booking lacks depth (no cleaning buffers, no dynamic pricing)

---

## Key Insight: The Opportunity
Neither Mindbody nor Arketa does any of these well:
1. **Class + wellness amenity in one checkout** (book Pilates + reserve sauna = one transaction)
2. **Client progress tracking** beyond attendance counts
3. **Resource management for amenities** (turnover buffers, capacity analytics)
4. **Fully custom branded experience** on both web and app

These are exactly Marathon Pilates's use case — a custom build wins here.

See full research in:
- `research/mindbody.md`
- `research/arketa.md`

---

---

## AI Class Generator — Future Vision (Phase 4+)

### AI Voice Cues (Priority Feature)
- The class generator already produces instructor cues (italic lines per exercise)
- Feed those cues to **ElevenLabs** voice API, which can clone Ruby's voice from ~10 min of audio
- Every AI-generated class plays back in Ruby's actual voice — hands-free, eyes-free for the client
- Cues fire at the right moment as the client moves through each block
- Optional: visual timer or exercise name on screen so client knows where they are
- **This is a killer differentiator** — infinite classes in the instructor's real voice

### AI Movement Visuals
- **Confirmed direction:** AI-generated images per exercise block — Ruby prefers not to be on camera
- Style: editorial, artistic, on-brand with Marathon Pilates aesthetic — a serene figure in motion
- One image generated per class (or per block) using focus area + difficulty as the prompt
- Tools: DALL-E 3 (OpenAI API, easiest), Stability AI (more style control), Midjourney (best quality, no API yet)
- Image appears at top of generated class card — immediate visual impact
- Future: one image per exercise block, displayed as client moves through the class alongside voice cues

### AI Instructor Video (Ultimate Vision)
- **HeyGen** or **Synthesia** API — generate a realistic AI instructor video from the class script
- Create a custom Marathon Pilates AI avatar (brand character, not Ruby — she prefers not to be on camera)
- Feed the generated cues as a script → HeyGen renders a full instructor video automatically
- Instructor demonstrates and cues simultaneously — client just hits play
- Caveat: video generation takes 5-10 min, so either pre-generate a library or notify client when ready
- This puts Marathon Pilates ahead of the curve — no other boutique studio is doing this

### Full AI Class Experience (end state)
1. Client configures class (duration / difficulty / focus / props) ✅ built
2. Claude generates the full BASI Block class plan ✅ built
3. AI instructor video generated via HeyGen (custom Marathon Pilates avatar)
4. ElevenLabs narrates each cue in the avatar's voice as client moves through the class
5. Client hits Play — no screen-watching, no thinking, just move
6. Timer counts down each block automatically
7. Props shop surfaced at end of class with affiliate links (Balanced Body)

*Last updated: 2026-03-17*
