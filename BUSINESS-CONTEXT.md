# CLAUDE.md — Marathon Pilates: Booking Platform & Cross-System Operations

_Last updated: 2026-06-30_

## What this file is (and isn't)

This is the shared context file for the **booking platform codebase** (the
replacement for Arketa, built via Claude Code) and for how it relates to the
rest of Marathon Pilates' digital operations. Read this if you're Claude Code
working in this repo, or anyone trying to understand how the pieces fit
together.

**This is NOT the WordPress site manual.** That's a separate file — also named
`CLAUDE.md`, currently **rev 4 (2026-06-25)** — documenting marathonpilates.com
(WordPress/Elementor/Rank Math) in granular detail: page IDs, team-grid
playbooks, nav-menu mechanics, photo-upload quirks, etc. It lives wherever
Adrian keeps it; this file doesn't duplicate it. If you're working on
WordPress-specific tasks and don't have that file in context, ask for it
rather than guessing at WordPress internals from here.

## Working principles (carry these into this codebase too)

These are Adrian's standing preferences, established for AI assistance on this
business generally — they apply here just as much as on the WordPress side:

- If something isn't known, say so. Don't fabricate facts, sources, library
  features, or steps for tools.
- State confidence on numbers and stats; flag guesses explicitly.
- Flag anything that may be outdated rather than presenting it as current.
- Prefer reversible actions; confirm before anything that touches production
  or goes live.
- Ask one quick clarifying question rather than guessing when something is
  genuinely ambiguous.

## The business, in brief

- **Marathon Pilates** — a wellness studio in Nashville, TN, two locations:
  Charlotte Park / West Nashville and Green Hills. Owner: Ruby.
- **Adrian** — co-owner and technical lead. Owns the website, SEO/AEO/GEO
  strategy, and the marketing pipeline; building this booking platform.
- **Brand quick-reference** (a subset — fuller guidelines exist in a separate
  brand/marketing context from the ad-campaign project; treat this as a
  convenience copy, not the source of truth):
  - Colors: Moss Gray `#4C5246` · Sandstone `#BC9C8E` · Rose Clay `#DDD1BD` ·
    Deep Earth `#302D27` · Terracotta `#A76E58`
  - Fonts: Poppins Thin (headlines, ALL CAPS) · Raleway Regular (sub-heads) ·
    Poppins Regular (body)

## The systems

**marathonpilates.com** — WordPress + Elementor + Rank Math SEO. Public site,
blog, SEO/AEO/GEO surface. Maintained via Claude in Chrome through Claude
Cowork (browser-driven, judgment-heavy edits). Full detail: the other
CLAUDE.md, rev 4.

**This booking platform** — replacing Arketa as the source of truth for
classes, schedule, and pricing. Built via Claude Code.
> ⚠️ **Placeholder, not fact:** stack, repo layout, and deploy target aren't
> documented here yet. Supabase and Vercel are connected to Adrian's Claude
> account, which *might* mean this runs on them — that's a guess, not a
> confirmed fact, and shouldn't be treated as one until verified. Fill in this
> section with the real architecture once it's settled (ideally by a Claude
> Code session that can actually inspect the repo, not by guessing here).

**How they relate:** once live, this platform is the source of truth for
classes/schedule/pricing. marathonpilates.com will need to reflect that data —
manually for now, automated later (see backlog below). Arketa is being phased
out; no Arketa integration is needed going forward.

## Operating model: Code vs. Cowork

Agreed 2026-06-30:

- **Claude Code** handles anything that runs without a human clicking through
  a UI — scripts and scheduled jobs hitting WordPress's REST API (this is
  blocked in the Cowork/Chrome browser session specifically, but available
  with proper credentials in a code environment), data sync, recurring
  technical checks. Recurring jobs can run as Claude Code **Routines**
  (scheduled triggers) instead of being kicked off by hand.
- **Claude Cowork** (via Claude in Chrome) handles anything needing a person's
  eyes inside the WordPress admin — Elementor layout edits, nav changes,
  reviewing how an image actually looks before publishing. Also the home for
  SEO/AEO/GEO *strategy and writing* — briefs, competitor research, drafting —
  even once the mechanical "push this meta tag" part moves to Code.
- **No direct Code ↔ Cowork connection exists** (unconfirmed either way by
  Anthropic docs as of this writing — if a feature like this ships, update
  this section). The bridge is shared files like this one, plus a visible log
  of what automation does (e.g. a Supabase table or an Asana board) so either
  side can see what happened without digging through terminal output.

## Automation backlog (NOT yet prioritized)

Candidates raised 2026-06-30 — Adrian has not ranked these yet, so treat the
order below as arbitrary, not a roadmap:

- **SEO/technical health checks** — recurring Rank Math schema/meta checks,
  sitemap and broken-link scans.
- **Photo/upload processing** — auto-crop to square, strip EXIF, optimize.
  Concrete, recurring pain point: every team-photo add documented in the
  WordPress CLAUDE.md (Jazz, Rachel) needed manual cropping/EXIF-stripping
  before upload. There's already a working pattern for this kind of script:
  `produce_ads.py`, built for the Meta ad campaign work.
- **Booking ↔ WordPress sync** — getting class/schedule/pricing data from this
  platform reflected on the WordPress site.
- **Content publishing pipeline** — queue → draft → review → publish.

Add to this list as new ideas come up rather than letting them live only in
conversation — that's the point of this file existing.

## Open questions (confirm, don't assume)

- The booking platform's actual stack — don't assume Supabase/Vercel.
- Whether Claude Cowork supports its own unattended/scheduled runs the way
  Claude Code's Routines do — unverified; check support.claude.com before
  relying on it for anything recurring.
- Where automation should write logs/output so both Code and Cowork (and
  Adrian) can see it — not yet decided.
