# Simplicity Ladder · 7-rung tool selection filter

> **Source:** Sim's huntr-handover · file 03. Cherry-picked into syncflow as the build/buy filter applied during `recommend-modules` and `generate-build-plan`. Goal: start at the lowest rung that genuinely solves the problem before reaching for new SaaS or custom code.

---

## The principle

When proposing a solution to a bottleneck, walk down the ladder and pick the **highest rung that genuinely solves the problem**. Lower rungs are cheaper, faster, more repeatable. Higher rungs are last resorts.

**Default verdict on any recommendation: stay as low as possible on the ladder.** Reverses the AI-startup default of "recommend a new SaaS." Reuse what the founder already pays for first.

## The 7 rungs

### Rung 1 — Already owned, untouched

The delegate already has a tool that solves this. They're not using it for this purpose, or they're using it manually when it has a better feature.

**Examples:**
- They have Helium 10 but aren't using its review request automation
- They have Cowork but use ChatGPT's free tier for document drafting
- They have a Notion workspace but track tasks in a Google Sheet
- They have ClickUp Automations but trigger updates by hand

**Verdict at this rung:** "You already have X. Here's how to switch it on / use it for this. Zero new spend, zero new tools."

### Rung 2 — Already owned, extended

The tool is in their stack. Add a flow, template, plugin, or routine to it.

**Examples:**
- Add a Cowork project for branded document drafting
- Add an n8n workflow on their existing instance
- Add a Figma plugin to their existing Figma workspace
- Add a ClickUp Automation rule to a list they already use
- Build a Claude Code routine that lives in a Claude Code session they already have

**Verdict:** "Extend X you already pay for. New flow/plugin/routine. No new SaaS."

### Rung 3 — Cowork flow

Text/document production work where the input is conversation and the output is a document, message, response, or decision.

**Examples:**
- Customer enquiry response drafting
- Branded document generation (POs, QC reports, supplier comms)
- Review response drafting
- Listing copy variations
- Internal SOP generation

**When this rung wins:** the work is fundamentally about producing well-formed text or documents with judgment, not data orchestration. Non-technical staff can self-serve.

### Rung 4 — n8n workflow

Orchestration across systems. Reactive flows triggered by webhooks, schedules, file drops, emails. Backend-only, no UI.

**Examples:**
- Daily SP-API pull → BSR change detection → Slack alert
- Customer intake email → Cowork draft → reviewer queue
- ASIN listing change webhook → SP-API regeneration → audit log
- Brand mention scrape → review-velocity dashboard
- Returns reason text → Cowork clustering → monthly report

**When this rung wins:** multiple systems need to talk, work needs to run on a schedule, output goes to multiple destinations, the domain expert needs to see and edit the flow later. n8n is the default for orchestration at this level.

### Rung 5 — Claude Code routine

Bespoke logic with state, files, multi-step reasoning, or transformations that don't fit n8n's node model. Run by the delegate (or scheduled if cloud-hosted).

**Examples:**
- Returns analysis with multi-step clustering and threshold logic
- Listing copy generation with brand voice rules and product attribute lookup
- Pre-launch compliance checks across UK/EU/US regulatory frameworks
- Bulk image generation pipeline with quality gates and reroll logic
- Custom data transformations between APIs that don't match cleanly

**When this rung wins:** the work has rich state, requires reasoning across multiple inputs, or has edge cases that node-based tools handle clumsily. Always paired with a verification plan.

### Rung 6 — New SaaS subscription

Bring in a new external tool. Almost always with **pay-as-you-go default** if usage is light. Monthly subscription only if usage is heavy enough to make it cheaper.

**When this rung is justified:**
- Capability that genuinely doesn't exist in their current stack (e.g. they need scraping but own no scraping tool)
- Volume too high for free tiers of existing tools
- Specialised domain (e.g. compliance database, video generation aggregator)

**When NOT to recommend:**
- Capability already exists in their stack (rung 1 or 2)
- Pure document/text work (rung 3)
- Simple orchestration (rung 4)

**Pricing-tier rule:**
- Few uses per month → pay-as-you-go
- Many uses per week → monthly subscription if it lowers per-use cost
- Always include the cost in the recommendation, with the verified date

### Rung 7 — Custom build

Bespoke web app, native plugin, browser extension, or any code with persistent UI and infrastructure. Last resort.

**When this rung is genuinely necessary:**
- Real-time interactive UI for non-technical users (where Cowork can't reach)
- Persistent state across many users (where n8n + Sheets is too brittle)
- Performance demands that exceed what hosted tools deliver
- Strategic moat — the tool is itself a competitive asset

**When you've drifted into this rung wrongly:**
- A Cowork project would have solved 80% of the need
- An n8n workflow with a Notion frontend would have worked
- The "custom" part is just laziness about adapting an existing tool

**Always pair with:** auth strategy, hosting plan, verification plan, deployment routine. AI does the first 50–80% fast; the last 20% (auth, deploy, hosting, edge cases) takes longer than the first 80%.

## The two questions to ask before recommending any rung

1. **"Is this the lowest rung that fully solves the problem?"** If a lower rung *almost* works, name what it's missing and why that gap genuinely needs the higher rung.
2. **"Would this template across other employees and brands?"** Sim's repeatable-beats-clever principle. A bespoke one-off is worse than a parametric solution that templates across employees and brands.

## Cost-tier defaults for rung 6

When a new SaaS is genuinely needed:

| Usage pattern | Default recommendation |
|---|---|
| Few one-off uses per month | Pay-as-you-go (e.g. Apify per-actor pricing, Rainforest credit packs) |
| Continuous monitoring (daily/hourly) | Monthly subscription with rate-limit caps |
| Enterprise-scale, high reliability needed | Vetted enterprise plan with SLAs |
| Free tier exists and covers the volume | Use it, document the upgrade trigger |

Always quote pricing with the verification date — *"verified 2026-05-06"*. Re-fetch at recommendation time when precision matters.

## Examples — how the ladder reads in practice

**Bottleneck:** *"Maya spends 14 hrs/week on Amazon image uploads."*

- Rung 1? Do they own Helium 10 with image management? *No.*
- Rung 2? Extend their Figma — yes, build a plugin that pushes to SP-API. **This is the rung.** Stop here.

**Bottleneck:** *"Sarah spends 15 hrs/week on repetitive customer enquiries."*

- Rung 1? Do they have a CS auto-responder set up? *No.*
- Rung 2? Add a Cowork project — yes. **This is the rung.** Stop here.

**Bottleneck:** *"Brand needs to monitor competitor pricing twice a day."*

- Rung 1? Do they own a scraper? *No.*
- Rung 2? n/a.
- Rung 3? Cowork can't poll. n/a.
- Rung 4? n8n can orchestrate, but needs a scraper. n/a alone.
- Rung 6? Bring in Rainforest API or Apify, paired with n8n on rung 4. **This is the combination.**

**Bottleneck:** *"Brand needs custom listing dashboard for 8 internal users."*

- Rungs 1–5? All evaluated. n8n + Notion would work for 80% of needs but lacks the real-time interactive UI for the rep dashboard.
- Rung 7? Justified. Build with Next.js + Supabase. **Pair with auth strategy, hosting plan, verification plan.**

The ladder doesn't dogmatically reject rung 7 — it forces honest justification when you go there.

---

## How syncflow uses this

- **`skills/recommend-modules.md`** — when sequencing modules, prefer rung 1–2 wins (consolidate into already-owned tools) before rung 5–7 builds.
- **`skills/generate-build-plan.md`** — at each phase that names a tool, state the rung you're on and why. If you reach for rung 6 (new SaaS) or rung 7 (custom), justify against the two questions above.
- **`skills/diagnose-sprawl.md`** — sprawl findings should produce rung-1 wins ("you already pay for X") before recommending replacement.
