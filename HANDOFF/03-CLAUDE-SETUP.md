# Claude Code Setup — For Jazz

> **Goal:** Get Claude Code running on your machine so you can continue building and managing the Marathon Pilates platform. This should take about 20–30 minutes.

Last updated: 2026-05-07

---

## Step 1 — Install Claude Code

1. Download the Claude desktop app from claude.ai/download
2. Open it and log in with your Marathon Pilates Claude account

That's it — no Terminal needed.

---

## Step 2 — Clone the GitHub Repo

This puts the platform code on your machine.

```bash
git clone https://github.com/adrianwalther/marathon-pilates.git
cd marathon-pilates
```

> ⚠️ Once the GitHub repo is transferred to a Marathon Pilates org (see `01-ACCOUNT-MIGRATION.md`), the URL will change. Adrian will update this doc when that happens.

---

## Step 3 — Connect MCP Integrations

MCPs let Claude talk directly to Supabase, Vercel, and GitHub without you having to copy/paste anything. This is what makes Claude Code powerful for this project.

Open Claude Code settings and add the following MCP servers:

### Supabase
Connects Claude to the live database — lets it run queries, check data, apply migrations.
- Follow the setup at: https://supabase.com/docs/guides/getting-started/mcp
- Project ID: `vvqeacukwsvbgixabdef`

### Vercel
Connects Claude to your hosting — lets it check deployments, view logs, manage env vars.
- Follow the setup at: https://vercel.com/docs/mcp
- Project: `marathon-pilates`
- Team: `marathon-pilates` (once migrated — currently `adrianwalthers-projects`)

### GitHub
Connects Claude to the code repo — lets it read files, review changes, and more.
- Follow the setup at: https://github.com/modelcontextprotocol/servers/tree/main/src/github
- Repo: `adrianwalther/marathon-pilates` (will change after migration)

---

## Step 4 — Install the Pilates Expert Skill

This skill grounds Claude as a Pilates methodology expert — useful for class design, cueing language, and contraindication checks.

In Claude Code, run:
```
/install-skill pilates-expert
```

Or ask Adrian to share the skill file directly.

---

## Step 5 — Start Your First Session

Every time you open a new Claude conversation for this project:

1. Open the Claude desktop app
2. Start a new conversation
3. Paste the contents of `HANDOFF/00-PLATFORM-OVERVIEW.md` into the chat

That's it — Claude is now fully up to speed on the entire platform and ready to help.

---

## How to Work With Claude on This Project

**Making changes:**
> "The schedule page isn't showing Green Hills sessions. Can you investigate and fix it?"

**Checking the database:**
> "How many active memberships do we have right now?"

**Deploying:**
> "Deploy the latest changes to production" — Claude handles it, no Terminal needed.

**When something breaks:**
> "There's an error on the booking page — can you check the Vercel logs?"

---

## Key Things to Know

- **Never push untested code to `main`** — test locally first with `npm run dev` from `src/web/`
- **The beta password is `marathon2026beta`** — change this before inviting real clients
- **On Demand videos are offline** until Bunny.net is reactivated at launch — this is normal
- **All pricing and payroll rates** are in `HANDOFF/00-PLATFORM-OVERVIEW.md` — don't change them without checking with Ruby first

---

## Need Help?

If you get stuck on any of this, open Claude Code and ask:
> *"I'm Jazz, studio manager at Marathon Pilates. I'm setting up Claude Code for the first time to manage our platform. Here's my context:"* — then paste `00-PLATFORM-OVERVIEW.md`

Claude will walk you through whatever you need.
