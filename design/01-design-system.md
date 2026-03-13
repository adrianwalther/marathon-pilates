# Design System — Marathon Pilates Platform
*Sourced directly from Marathon Pilates Brand Guidelines v.1 | 2026-03-10*

---

## Brand Foundation

**Tagline:** Move + Restore
**Brand personality:** Warm + Welcoming · Grounded + Trustworthy · Empowering + Supportive · Holistic + Intentional · Joyful + Uplifting
**Tone:** Encouraging, knowledgeable, kind-hearted. Conversational but confident.

---

## Color Palette

Sourced directly from official brand guidelines.

### Primary Colors

| Name | Hex | Usage |
|---|---|---|
| **Moss Gray** | `#4C5246` | Primary CTAs, buttons, nav active states, key UI actions |
| **Deep Earth** | `#302D27` | Dark text, heavy headings, dark backgrounds, footers |

### Secondary Colors

| Name | Hex | Usage |
|---|---|---|
| **Terracotta** | `#A76E58` | Accent CTAs, milestones, streaks, badges, highlights |
| **Rose Clay** | `#BC9C8E` | Soft accents, avatar borders, subtle tags, dividers |
| **Sandstone** | `#DDD1BD` | Card backgrounds, section fills, linen-toned surfaces |

### Neutral / System Colors

| Name | Hex | Usage |
|---|---|---|
| **White** | `#FFFFFF` | Main page/screen background |
| **Off-white** | `#F7F5F2` | Subtle card lift, input backgrounds |
| **Light warm gray** | `#E8E3DC` | Borders, separators, skeleton loaders |
| **Muted text** | `#7A7570` | Secondary labels, placeholders, timestamps |
| **Deep Earth** | `#302D27` | Primary body text |

### Semantic Colors (functional, not brand)

| Purpose | Color | Notes |
|---|---|---|
| Success / confirmed | `#4C5246` (Moss) | Booking confirmed, check-in, payment success |
| Warning | `#A76E58` (Terracotta) | Credit low, class nearly full |
| Error | `#C0392B` | Form errors, payment failed — warm red, not harsh |
| Info | `#BC9C8E` (Rose Clay) | Informational banners |

### Tailwind / NativeWind Token Map

```js
// tailwind.config.js
colors: {
  brand: {
    moss:       '#4C5246',  // primary
    earth:      '#302D27',  // dark
    terracotta: '#A76E58',  // accent
    roseclay:   '#BC9C8E',  // soft accent
    sandstone:  '#DDD1BD',  // warm neutral
  },
  surface: {
    white:      '#FFFFFF',
    offwhite:   '#F7F5F2',
    warm:       '#E8E3DC',
  },
  text: {
    primary:    '#302D27',
    secondary:  '#7A7570',
    inverse:    '#FFFFFF',
  }
}
```

---

## Typography

Three typefaces are specified in the brand guidelines. Each has a distinct role — do not swap them.

### Font Roles

| Font | Weight | Role | Case |
|---|---|---|---|
| **Poppins Thin** | 100 | Headlines, hero text, large callouts | ALL CAPS only |
| **Raleway Regular** | 400 | Sub headlines, section labels, captions | ALL CAPS only |
| **Poppins Regular** | 400 | All body copy, descriptions, paragraphs | Sentence case |
| **Poppins Bold** | 700 | Emphasis within body copy, prices, key data | Sentence case |
| **Poppins Medium** | 500 | Buttons, labels, nav items | Title case or ALL CAPS |

### Type Scale (Mobile — React Native / NativeWind)

| Level | Font | Size | Weight | Usage |
|---|---|---|---|---|
| `display` | Poppins Thin | 32px | 100 | Hero screens, milestone celebration |
| `h1` | Poppins Thin | 24px | 100 | Page titles (ALL CAPS) |
| `h2` | Raleway Regular | 14px | 400 | Section labels (ALL CAPS, letter-spaced) |
| `h3` | Poppins Medium | 18px | 500 | Card titles, class names |
| `body` | Poppins Regular | 15px | 400 | Descriptions, copy |
| `small` | Poppins Regular | 13px | 400 | Timestamps, metadata |
| `label` | Poppins Medium | 12px | 500 | Tags, pills, badge text |
| `button` | Poppins Medium | 15px | 500 | Button labels |

### Type Scale (Web — Next.js / Tailwind)

| Level | Font | Size | Weight | Usage |
|---|---|---|---|---|
| `display` | Poppins Thin | 56px | 100 | Hero headline (ALL CAPS) |
| `h1` | Poppins Thin | 40px | 100 | Page title (ALL CAPS) |
| `h2` | Raleway Regular | 13px | 400 | Section eyebrow (ALL CAPS, tracked wide) |
| `h3` | Poppins Medium | 24px | 500 | Section title |
| `h4` | Poppins Medium | 18px | 500 | Card title, subsection |
| `body` | Poppins Regular | 16px | 400 | Body copy |
| `small` | Poppins Regular | 14px | 400 | Captions, metadata |
| `label` | Poppins Medium | 12px | 500 | Tags, pills |
| `button` | Poppins Medium | 15px | 500 | Button labels |

### Loading Fonts

```css
/* Google Fonts import */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@100;400;500;700&family=Raleway:wght@400&display=swap');
```

---

## Button Styles

Buttons are **rectangular** — minimal border-radius (4px max). Never pill-shaped.

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| **Primary** | `#4C5246` Moss | White | None | Book, Confirm, Submit |
| **Accent** | `#A76E58` Terracotta | White | None | Specials, highlights, upsells |
| **Secondary** | `#DDD1BD` Sandstone | `#302D27` | None | Secondary actions |
| **Ghost** | Transparent | White | 1px White | On photo/dark backgrounds |
| **Ghost dark** | Transparent | `#4C5246` | 1px Moss | On light backgrounds |
| **Destructive** | `#C0392B` | White | None | Cancel booking, remove |

```
Button anatomy:
  Padding: 14px vertical · 24px horizontal
  Font: Poppins Medium 15px
  Border-radius: 4px
  Min-width: 120px
  Height: 48px (mobile) · 44px (web)
```

---

## Spacing System

Based on a 4px base unit.

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Tight — between icon and label |
| `space-2` | 8px | Small — within components |
| `space-3` | 12px | Default — padding inside cards |
| `space-4` | 16px | Standard — between elements |
| `space-5` | 20px | Medium — section padding |
| `space-6` | 24px | Large — between card groups |
| `space-8` | 32px | XL — major section gaps |
| `space-10` | 40px | XXL — screen padding top/bottom |

Screen edge padding: **20px** (mobile) · **24px** (tablet) · content max-width: **1200px** (web)

---

## Component Library

### Cards

```
┌─────────────────────────────┐
│  [Photo — warm, natural]    │  ← aspect ratio 3:2
│                             │
├─────────────────────────────┤
│  RALEWAY LABEL · ALL CAPS   │  ← #7A7570, 12px, letter-spaced
│  Poppins Medium title       │  ← #302D27, 18px
│  Poppins Regular body text  │  ← #7A7570, 14px
│                             │
│  [Primary Button]           │
└─────────────────────────────┘

Background: #FFFFFF or #F7F5F2
Border: none (use shadow: 0 1px 4px rgba(48,45,39,0.08))
Border-radius: 8px
```

### Class Cards (Schedule)

```
┌─────────────────────────────┐
│  7:00am                Tue  │  ← Poppins Medium, Moss
│  Reformer Flow              │  ← Poppins Bold, Deep Earth
│  Anissa · 50 min            │  ← Poppins Regular, muted
│  ████░░░  6 of 8 spots      │  ← Sandstone bar, Moss fill
│  [Book — 1 Credit]          │  ← Primary button
└─────────────────────────────┘
```

### Intake / Profile Tags

```
  [marathon training]  [hip focus]  [intermediate]

  Background: #DDD1BD (Sandstone)
  Text: #302D27 (Deep Earth)
  Font: Poppins Medium 12px
  Border-radius: 4px
  Padding: 4px 10px
```

### Milestone Badge

```
      🏅
  25 CLASSES

  Background: #A76E58 (Terracotta) — warm, celebratory
  Text: White
  Font: Poppins Thin (number) + Raleway Regular (label, ALL CAPS)
```

### Streak Indicator

```
  🔥 7-Day Streak
  ●  ●  ●  ●  ●  ●  ○
  Mo Tu We Th Fr Sa Su

  Active dot: #A76E58 (Terracotta)
  Inactive dot: #DDD1BD (Sandstone)
```

### Progress Bar

```
  ████████░░░░

  Fill: #4C5246 (Moss)
  Track: #DDD1BD (Sandstone)
  Height: 6px
  Border-radius: 3px
```

### Navigation (Mobile Tab Bar)

```
  Background: #FFFFFF
  Border-top: 1px #E8E3DC
  Active icon + label: #4C5246 (Moss)
  Inactive icon + label: #BC9C8E (Rose Clay)
  Font: Poppins Medium 11px
```

### Input Fields

```
  Border: 1px #E8E3DC
  Border (focused): 1px #4C5246 (Moss)
  Background: #F7F5F2
  Text: #302D27
  Placeholder: #7A7570
  Border-radius: 6px
  Height: 48px
  Font: Poppins Regular 15px
```

---

## Photography Guidelines

Sourced from brand guidelines:

- **Lighting:** Bright, natural, airy. Morning sun, open windows. Warm and uplifting — never harsh or over-lit.
- **Backgrounds:** Organic, minimal. Let subjects shine. Natural textures — wood, plants, soft textiles.
- **Subjects:** Community-focused — group classes, post-class moments, instructor guidance. Real smiles, eye contact, connection.
- **Movement:** Fluid Pilates moments — elongation, control, breath. Reformers, chairs, magic circles. Include beginners and modifications.
- **Lifestyle:** Candid wellness moments — sauna sessions, contrast therapy, journaling, retail. "Wellness as a lifestyle."
- **Instructors:** Candid or lightly posed, teaching or laughing with clients. Personality-driven.
- **Diversity:** Represent a range of ages, body types, and backgrounds — always.

**In the app, photography appears in:**
- Hero / splash screen
- Instructor profile photos (cards + detail screens)
- Class detail screens (background)
- On-demand video thumbnails
- Milestone celebration screens
- Empty state illustrations (can use brand photography cropped)

---

## Voice & Tone — App Copy

Sourced directly from brand guidelines. All UI copy, push notifications, emails, and in-app messages follow these rules.

### Do
- Friendly, real, inclusive language
- Celebrate small wins and milestones
- Highlight the experience and benefits, not just the service
- Emphasize community and connection
- Invite curiosity and exploration

### Don't
- Overly formal, clinical, or salesy
- Guilt-trip or shame ("No excuses!")
- Focus too much on pricing or promotions
- Use language that feels exclusive or intimidating
- Assume expertise or use too much jargon

### Voice Traits in Practice

| Trait | Example in app |
|---|---|
| Empowering | "You don't need to be flexible to start — just open to the process." |
| Grounded | "Real movement. Real community. Real results." |
| Warm | "First class? We got you. You'll feel right at home." |
| Joyful | "Because movement should feel good." |
| Clear + calm | "This is your time to move, breathe, reset." |

### Notification Copy Examples

```
Booking confirmed:
"You're on the reformer. See you Tuesday at 7am ✓"

Waitlist spot:
"A spot just opened in Reformer Flow. Claim it before it's gone."

Streak:
"7 days strong. Keep the momentum going."

Milestone:
"25 classes. That's something to celebrate, Sarah."

Credit low:
"You have 1 credit left. Ready to restock?"
```

---

## Dark Mode

The platform launches **light mode only**. The warm, earthy palette is designed for light backgrounds and doesn't have an official dark mode in the brand guidelines.

Dark mode can be considered for a future version if client demand is there — the `Deep Earth (#302D27)` color works well as a dark background base.

---

## Accessibility

- **Color contrast:** All text/button combinations must meet WCAG AA (4.5:1 for body, 3:1 for large text)
  - Moss on White: ✅ passes
  - White on Moss: ✅ passes
  - White on Terracotta: ✅ passes
  - Deep Earth on White: ✅ passes
- **Touch targets:** Minimum 44×44px on mobile
- **Font sizes:** Minimum 12px labels, 15px body — no smaller
- **Focus states:** Moss `#4C5246` outline on all interactive elements (web)

---

## Design Summary — One Paragraph

> The Marathon Pilates app is warm, grounded, and human — never cold or clinical. It uses a rich earth-tone palette (moss green, terracotta, sandstone, rose clay) on clean white backgrounds with generous space. Typography pairs Poppins Thin headlines in all caps with Raleway subheadings and Poppins Regular body copy. Buttons are rectangular and confident. Photography is natural, community-centered, and bright. Every piece of UI copy is encouraging, direct, and joyful — like a great instructor.

---

*Reference: Marathon Pilates Brand Guidelines v.1*
*Next: `design/02-screen-designs.md` — key screen mockups for web and mobile*
