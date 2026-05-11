# Tool Catalogue · architecture and curation principles

> **Source:** Sim's huntr-handover · file 05a. Cherry-picked into syncflow to make tool-curation philosophy explicit. The catalogue is **graceful coverage of the 90% case** + **on-demand discovery for the rest** — not a static "complete" list that goes stale.

---

## The completeness problem

There are thousands of tools relevant to Amazon/ecommerce ops. New ones launch monthly. Existing ones rebrand, change pricing, get acquired, die. **A static "complete" catalogue is a maintenance trap that goes stale within weeks.**

The catalogue is designed around three tiers: deeply-known tools that get cited proactively, recognised tools that get acknowledged when mentioned, and unknown tools handled at the moment they come up.

## The three tiers

### Tier 1 — Recommended (syncflow proactively suggests)

The ~22 tools (Sim has delivered) plus future additions that syncflow proactively recommends when proposing solutions. Full structured entries (~200 words each). One file per tool in `tier1/<tool-slug>.md`.

**Selection criteria:**
- Used in Sim's 15 case studies (the archetypes in `architecture.md`)
- Common across Amazon ops (Helium 10, SellerApp, Rainforest, Keepa)
- In the existing IDL stack (already vetted — Cowork, Claude Code, n8n, ClickUp, Figma, Slack, Vercel, Supabase, Anthropic API)
- Aggregators that unlock multiple downstream models (OpenRouter, Kie AI, fal.ai)

### Tier 2 — Recognised (syncflow knows about, integrates if mentioned)

~80 tools syncflow recognises but doesn't typically lead with. Short cards (~50 words). Single consolidated file `tier2.md`.

**Purpose:** when the delegate mentions a tool syncflow recognises but isn't a top-recommend, the entry confirms awareness, places it on the Simplicity Ladder, and flags any gotchas. No deep API documentation — that lives at the source-of-truth (vendor docs).

### Tier 3 — Unknown / investigated on demand

Anything not in Tier 1 or Tier 2. When the delegate names a tool syncflow doesn't recognise, ask them to describe it briefly *(category, what it does, what it costs)*; place it on the Simplicity Ladder live; recommend whether to keep, replace, or extend it.

Don't fake recognition. *"I haven't catalogued [X] — describe it in two lines and I'll place it"* is better than confidently inventing a verdict.

---

## The aggregator-first principle

For imagery, video, and LLM access, the right pattern in 2026 is **aggregator-first**: recommend the multi-model API gateway over direct integrations.

**Why:**
- One auth token, one billing relationship, one SDK
- Model swapping is config change, not rewrite
- New models drop weekly; aggregators add them faster than you can integrate directly
- Cost visibility consolidated in one dashboard

**Recommended aggregators (Tier 1):**

| Aggregator | Covers | When to use |
|---|---|---|
| **OpenRouter** | LLMs (Claude, GPT, Gemini, open-source) | Default for any LLM work where the choice of model matters less than reliability + cost flexibility |
| **Kie AI** | Image + video gen (ChatGPT Image, Seedance 2, Veo 3, Midjourney) | Default for creative gen where you want to swap models freely |
| **fal.ai** | Open-source models (Flux, Hyper3D Rodin, image-to-3D, audio) | Default for open-source model hosting |
| **Replicate** | Open-source models (similar coverage to fal.ai) | Alternative if fal.ai pricing or availability is an issue |

**When NOT aggregator-first:**
- Mature direct integrations are already in place (e.g. Anthropic API direct for Claude — fine)
- Specific feature only available direct (e.g. Anthropic's prompt caching is direct-only)
- Compliance/data residency forces specific vendor

---

## Tier 1 entry template

For consistency, every Tier 1 file follows this shape:

```markdown
# [Tool Name]

**Category:** [orchestration / amazon-api / scraping / creative / data / comms / ops / hosting / aggregator]
**Simplicity rung:** [1–7] — where it sits on the Simplicity Ladder
**Cost tier:** [free / freemium / pay-go / sub / enterprise]
**Auth:** [API key / OAuth / SSO / public]
**Status:** ✅ Vetted / 🟡 Used at IDL / 🔬 Tier 2 (investigated)

## Purpose
One sentence — what this tool fundamentally does.

## When to use
- Specific scenarios where this tool wins
- 2–4 bullets

## When NOT to use
- 1–2 bullets — anti-patterns

## Pairs with
- [Other tools this complements]

## Common patterns
- [Archetypes (from `architecture.md`) or universal-wins (UW-XX from `universal-amazon-wins.md`) that use this tool]

## Live docs
- Primary: [URL]
- Quick start: [URL]

## Pricing
- Free tier: [what's included]
- Paid tiers: [list with rough $]
- **Last verified:** [YYYY-MM-DD]

## Gotchas
- 1–3 things that trip up first-timers
```

---

## Tier 2 short card format

In `tier2.md`, one section per tool, ~50 words:

```markdown
### [Tool Name]
**Category:** [...] · **Rung:** [...] · **Cost:** [...]

[1–2 sentences on what it is, where it sits, when it'd come up.]

**syncflow's verdict:** [Tier 1 alternative if any | "OK if owned" | "Avoid"]
```

---

## How syncflow decides which tier to use

```
Delegate mentions or syncflow proposes a tool:
  ↓
Is it in tier1/?
  Yes → use the Tier 1 entry (full context)
  No  ↓
Is it in tier2.md?
  Yes → use the Tier 2 card (quick reference)
  No  ↓
Ask the delegate to describe it (one or two lines) → place on Simplicity Ladder live → recommend keep/replace/extend
```

---

## How syncflow uses this

- **`skills/recommend-integration.md`** — when the delegate's stack contains a Tier 1 tool, the corresponding `tier1/<slug>.md` entry has the integration logic.
- **`skills/recommend-modules.md`** — when proposing a module that needs a tool, check Tier 1 first; cite the entry. Drop to Tier 2 if it's a recognised-but-not-recommended tool the delegate already owns.
- **`skills/diagnose-sprawl.md`** — Tier 2 cards often flag *"OK if owned"* — useful when the delegate has more SaaS than they need. Pair with the Simplicity Ladder.

## Archive and promotion (future)

- Tier 3 → Tier 2: investigated in 2+ delegate sessions
- Tier 2 → Tier 1: recommended in a delegate's roadmap OR investigated in 5+ sessions AND fits Sim's worldview

The catalogue grows from real usage data, not speculation. Sim/Dorian periodic review.
