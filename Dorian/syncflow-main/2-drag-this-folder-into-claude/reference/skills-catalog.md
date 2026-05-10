# syncflow · Skills Catalogue

Every discrete capability syncflow can invoke. Last refreshed at the close of Phase 4d-pivot (2026-05-05).

## What's a "skill" here

In syncflow's world, a **skill** is a discrete capability the agent can invoke — distributed across two surfaces:

1. **Real skills** *(invokable, file per skill)* — markdown specs the agent loads on demand. Live in `2-drag-this-folder-into-claude/skills/<skill-name>.md`. Each has a clear **when / inputs / tools / outputs / behaviour / don'ts** contract.
2. **Behaviours** *(always-on guardrails)* — encoded directly into `0-paste-this-into-custom-instructions.txt` (the system prompt). Not user-invokable; they fire on every plan / step. Examples: anti-pattern checks, verification-plan enforcement, mission-drift detection, **artifact emission** *(pivot-10)*.

We treat both as "skills" in this catalogue because they're discrete capabilities, even if behaviours don't get their own file.

> **Important: this is NOT Anthropic's `Skills` runtime feature.** Anthropic ships a separate product called Skills *(documented at code.claude.com/docs/en/skills)* that uses `SKILL.md` files with YAML frontmatter and trigger conditions, executed by a runtime. Our `skills/` folder is markdown content in Project Knowledge — semantically similar (one capability per file) but mechanically different. The agent reads ours like reference material; Anthropic's runtime invokes theirs like functions. Don't conflate.
>
> If we ever migrate to Anthropic's runtime *(probably v1.5+)*, the per-skill markdown specs port over largely unchanged — they already have a clean contract shape. The system prompt slot becomes thinner because trigger logic moves to YAML frontmatter. Out of scope for v0.

---

## Status legend

- 🟢 **shipped** — file exists in `bundle/skills/`, dogfooded
- 🟡 **specced** — has a contract here; prompt not yet written
- ⚪ **planned** — listed only; contract not yet pinned
- ⚫ **deferred** — v1.5 / v2 work; out of MVP scope

---

## Architecture *(v0)*

The bundle's runtime architecture, encoded in `bundle/syncflow.md`:

- **Brain lives in conversation context.** Maintained as an in-memory JSON object across messages. Schema locked at 1.0 *(see `templates/brain-schema.json`)*.
- **Tier-0 persistence** *(default)*: brain survives within a conversation.
- **Tier-1 persistence** *(opt-in)*: `brain.json` artifact emitted, dragged into Project Knowledge for next-session restore.
- **Tier-2 persistence** *(power-user)*: filesystem MCP mirrors brain MDs to disk for git tracking / hand-edit / Obsidian.
- **Roadmap delivered as a Claude artifact** rendered from `templates/dashboard-artifact.html` + brain JSON injection.

---

## A · Onboarding & session health

| Skill | Behaviour | Status |
|---|---|---|
| `onboard-delegate` | First-run: explain owned vs rented, the 8 lenses, pushback posture, capture brand name. Auto-fires `health-check` after. | 🟢 |
| `init-brain` | Initialise the in-context brain skeleton. Tier-2 disk skeleton conditional. | 🟢 |
| `restore-brain-from-knowledge` | At conversation start, scan Project Knowledge for `brain*.json`, validate against schema, rehydrate. | 🟢 |
| `health-check` | 8 inside-chat checkpoints: prompt loaded, Knowledge folders, brain state, restored brain, MCP, account tier, skills indexed, templates. Green/yellow/red. | 🟢 |
| `diagnose` | 5 known stuck states with symptom→state probe→fix pattern. | 🟢 |
| `demo-mode` *(Track G2)* | `/demo` triggers load of `templates/brain-sim-ideal-direct.json` → renders 11-page roadmap one-shot at `complete` stage. Workshop-critical entry path. Refuses if a real brain is mid-flight; flags `is_demo:true` to gate disk writes. | 🟢 |

## B · Interview & brain capture

| Skill | Behaviour | Status |
|---|---|---|
| `run-interview` | Top-level: orchestrates the 5 sections (Identity / Goals + capacity / Stack / Pain / Aspirations), transitions, summary. Reads brain before each batch to avoid repeats. Track F revision: 4 sections → 5 + § Consultant asides for opportunistic suggestions like Wispr Flow. | 🟢 |
| `capture-fact` | Append `{key, value, tone}` into the right section of the in-context brain. Tone tags: rented, owned, keep, csv-moment, glue-human, unknown, corrected. | 🟢 |
| `read-brain` | Inspect the in-context brain to avoid repeats; tier-2 reconciliation against disk MDs. System-internal lookup; pair with `inspect-brain` for the user-facing summary. | 🟢 |
| `update-brain` | User says *"actually we don't use SellerApp anymore"* → mutate the captured fact + flag dependent sections. | 🟢 |
| `inspect-brain` *(Track G2)* | User-facing transparency surface: *"show me my brain"* → consultant-style summary of captured facts grouped by section, recommendations status, lifecycle-aware next-step hint. Chat-only, no artifact. | 🟢 |
| `interview-employee` *(Track G3)* | Per-employee time-sink interview, 6-10 min per person. 6 questions: time pattern, top 3 tasks (hours + tedium 1-5), blockers, wished-for, optional Clockify paste. Captures to `brain.team_interviews[]`. Auto-offers `analyse-team-interviews` after sweep close. | 🟢 |
| `analyse-team-interviews` *(Track G3)* | Aggregates `brain.team_interviews[]` into the Page 04 team time-sink map + refines per-module ROI projections from founder view to employee view. Surfaces newly discovered glue-humans into `stack.glue_humans[]` with `source: "team-interview · {name}"` provenance. | 🟢 |

## C · Diagnosis & blueprint

| Skill | Behaviour | Status |
|---|---|---|
| `diagnose-sprawl` | Read `stack` → identify CSV moments, glue-humans, redundant subs, rented dependencies. | 🟢 |
| `design-future-state` | Map current to owned primitives (Supabase / n8n / ClickUp + agents). | 🟢 |
| `derive-replacement-table` | Per current tool: keep / consolidate / retire verdict + monthly cost delta. | 🟢 |
| `recommend-modules` | Pick which Sim archetypes to build, in what order. | 🟢 |

## D · Smart contextual integration recommendations *(v0 surface)*

| Skill | Behaviour | Status |
|---|---|---|
| `recommend-integration` | Fires when stack contains a tool we ship a snippet for. Offers at natural breakpoints. Opt-in, no nag. | 🟢 |

Setup snippets shipped in `bundle/integrations/`:

| Integration | Capability | Status |
|---|---|---|
| ClickUp | Read workspace hierarchy + tasks + time entries | 🟢 |
| Slack | Read channels/threads + search + scoped chat:write | 🟢 |
| Notion | Search/read shared pages + databases | 🟢 |
| Supabase | Schema inspect + read-only SELECTs + type generation; opt-in read-write for migrations | 🟢 |
| n8n | Search nodes, validate workflows, create unpublished | 🟢 |

## E · Sub-agent personas — the 8 lenses

Same consciousness, different vocabulary. Encoded in `prompts/personas.md`. **Track G2 consolidates** what was previously 8 implicit summon-* behaviours into one canonical skill (`summon-persona`) with an explicit summon / hold / drop contract.

| Skill | When | Status |
|---|---|---|
| `summon-persona` *(Track G2)* | Single skill governs all 8 lenses *(api-expert, n8n-expert, data-analyst, database-expert, amazon-expert, engineer, frontend-developer, business-advisor)*. User says *"summon the Amazon expert"* / *"what would Sim do?"* / etc. → reads the persona's section of `prompts/personas.md` + its reference set, holds the voice until *"back to syncflow"* or another summon, auto-drops before artifact emission. Replaces the 8 individual `summon-*` rows. | 🟢 |

## F · Always-on guardrails *(behaviours, not invokable)*

Live in `bundle/syncflow.md`. Fire automatically on every plan / step.

| Behaviour | Trigger | Status |
|---|---|---|
| `check-anti-patterns` | Before approving any build plan; scans against the 7 anti-patterns | 🟢 |
| `enforce-verification-plan` | Refuses to ship a build plan without a verification plan | 🟢 |
| `enforce-must-have-first` | Flags when user reaches for nice-to-haves before basics | 🟢 |
| `check-mission-drift` | Re-states the mission at the top of every major step | 🟢 |
| `challenge-rush` | Stops when user pushes for speed without a plan; cites principles #2 + #4 | 🟢 |
| `flag-credential-repetition` | Refuses to ask for an API key already in the brain | 🟢 |
| `check-single-project-hygiene` | Refuses to scaffold new GitHub / Vercel / Supabase if equivalents exist | 🟢 |

## G · Report rendering & emission

Fills `templates/dashboard-artifact.html` (or `templates/report.html` for the static print path) from the brain.

| Skill | Behaviour | Status |
|---|---|---|
| `render-roadmap` | Top-level: fills the entire 11-page template. Default: `dashboard-artifact.html`. | 🟢 |
| `emit-roadmap-artifact` | Emits filled HTML as a Claude artifact with stable identifier `syncflow-roadmap-<slug>`. | 🟢 |
| `emit-brain-artifact` | Emits `brain.json` artifact with stable identifier `syncflow-brain-<slug>` for tier-1 persistence. | 🟢 |
| `regenerate-section` | Scoped re-derivation + artifact replacement. Section → upstream-deriver map. | 🟢 |

## H · Implementation handoff *(consultant posture — we plan, they build)*

| Skill | Behaviour | Status |
|---|---|---|
| `generate-build-plan` | A→Z plan for a single module: schema, n8n nodes, ClickUp setup, env vars, integration steps. | 🟢 |
| `generate-verification-plan` | Companion to every build plan — 3–5 concrete checks. | 🟢 |
| `generate-cc-prompt` | Two output modes: per-module CLAUDE.md (default — written to `modules/0N-<slug>/CLAUDE.md`) OR one-shot chat-prompt for ad-hoc phase work. | 🟢 |

## I · Implementation phase *(post-roadmap → deployment, with structure)*

| Skill | Behaviour | Status |
|---|---|---|
| `start-implementation` | Entry point for execution mode. Sets module status `recommended → planned`. Generates build-plan + verification + per-module CLAUDE.md + status.json + module folder structure. Offers PM-tool integration on first call per brand. | 🟢 |
| `init-implementation-project` | Tier 2 only. Creates the standard `~/syncflow-projects/<brand>/` layout: brain.json mirror, modules/, _shared/credentials/notes/looms, .gitignore, README. Idempotent. | 🟢 |
| `update-module-status` | The only legitimate path to change a module's status. Validates lifecycle transitions. Writes brain → re-emits artifact → optional PM-tool sync. | 🟢 |
| `read-implementation-status` | Portfolio or single-module view. Read-only. Surfaces "what changed since last session", overdue T+4 audits, suggested next move. | 🟢 |
| `audit-module-t4` | Sim's T+4 audit (method P9). 3 checks: hours saved actual vs target / tool uptime / redeployment. Pass = `audit_t4_passed`; fail rolls back the lifecycle and flags rework. | 🟢 |
| `track-redeployment` | Captures what the recovered hours were used for. Enforces Sim P6: hours redeployed, not just reclaimed. Transitions `deployed → redeployed`. | 🟢 |
| `recommend-pm-integration` | Asks how delegate wants to track; if ClickUp/Notion/Asana detected in stack, offers a mirror (one parent task per module, 5 phase subtasks). Brain stays primary. Opt-in. | 🟢 |
| `summon-sim-mode` | Intensifier persona — opt-in. Channels Sim's voice harder than the default Amazon-expert lens: refuses vague answers, demands specifics, pushes back on hedging. Activates on *"summon Sim"* / *"Sim mode on"*; persists until dismissed. | 🟢 |

## J · Iteration & refinement

| Skill | Behaviour | Status |
|---|---|---|
| `swap-module` | *"Replace Module 03 with X"* — revises plan + dependencies + verification. Surfaces consequences. | 🟢 |
| `explain-module` | *"Tell me more about Module N"* — deep dive without re-rendering. | 🟢 |
| `list-modules` *(Track G2)* | *"What modules can I choose from?"* — scannable catalogue of all 15 Sim archetypes grouped by category *(Creative engine / Operational efficiency / Proprietary stack / SaaS-free infrastructure)*, annotated with *"in your roadmap"* against the in-context brain. Hands off to `swap-module` / `explain-module` / `start-implementation`. | 🟢 |

---

## Knowledge / reference *(read on demand from Project Knowledge)*

Not skills, but documented here for completeness:

- `reference/architecture.md` — worldview principles in full, the Bottleneck Hunt method, the 15-case-study module library
- `reference/sim-knowledge-base.md` — Sim's verbatim voice; channelled when summoning Amazon-expert
- `reference/ideal-direct-operating-patterns.md` — sanitised structural patterns from Ideal Direct's ClickUp OS *(brand-as-OS template, three-stage NPD pipeline, per-role Ad-Hoc Boards, daily-checks, ScaleReady, etc.)*. Cite specific sections by name when recommending ops modules.
- `reference/method-principles.md` — Sim's 8 non-negotiable principles (P1–P8) driving remove/accelerate/tolerate. *Lifted from huntr-handover/02.*
- `reference/simplicity-ladder.md` — 7-rung tool-selection filter applied at every build/buy moment. *Lifted from huntr-handover/03.*
- `reference/universal-amazon-wins.md` — 8 systemic Amazon revenue leaks (UW-01 to UW-08). Cross-checked at the end of `recommend-modules`. *Lifted from huntr-handover/10.*
- `reference/scraping-tools-decision-guide.md` — frequency-pricing tree for scraping recommendations. *Lifted from huntr-handover/06.*
- `reference/role-templates.md` — per-role time-sink shapes + watch-outs (9 roles). *Lifted from huntr-handover/07.*
- `reference/tool-catalogue/_architecture.md` — 3-tier tool curation philosophy + aggregator-first principle. *Lifted from huntr-handover/05a.*
- `reference/tool-catalogue/tier1.md` — 22 vetted Tier 1 tool entries (one section per tool). *Lifted from huntr-handover/05b.*
- `reference/tool-catalogue/tier2.md` — recognition cards for ~50 tools. *Trimmed from huntr-handover/05c (Amazon-relevant only).*
- `reference/skills-bible/SKILLS_BIBLE.md` — unified technical-implementation reference: SP-API auth + rate limits, Advertising API, Brand APIs, Brand Registry, Keyword Research, Multi-Marketplace, Rainforest, n8n, Webhooks/SQS, ClickUp, Claude Code, Connectors, Supabase, Vercel, Database, Auth/Security, Local LLM, Email/CRM, WhatsApp, Image Gen, Figma SDK, PM apps. *Used by `generate-build-plan` for technical depth.*
- `reference/skills-bible/<topic>.md` — 22 per-topic deep-dives keyed off the bible's table of contents. Read on demand when the bible's quick-reference isn't enough.
- `reference/implementation-phase.md` — architecture doc for the post-roadmap phase: 4 principles (single source of truth = brain.json; standard filesystem layout at `~/syncflow-projects/<brand>/`; per-module CLAUDE.md is the integration point; explicit status lifecycle). Read before invoking implementation-phase skills.
- `reference/implementation-anti-patterns.md` — 13 explicit anti-patterns the implementation phase prevents. Read when something feels messy to identify which principle is being violated.
- `reference/per-module-claude-md-template.md` — the template `generate-cc-prompt` substitutes when producing per-module CLAUDE.md files for the delegate's local Claude Code sessions.
- `reference/skills-catalog.md` — this file, copied at bundle build
- `prompts/personas.md` — the 8 lenses
- `templates/_placeholders.md` — the contract for filling both templates
- `templates/brain-schema.json` — JSON Schema locking the brain at 1.0
- `integrations/<name>.md` — MCP setup snippets

---

## Deferred *(out of v0 scope)*

| Capability | Phase | Why |
|---|---|---|
| Scheduling / cron / background tasks | v1.5+ | Consultant-not-orchestrator; v0 is interactive only |
| `provision-supabase` / `provision-n8n` / `provision-clickup` | v2 | Implementation Mode is consultant + builder; v0 is consultant-only |
| `register-on-frontend` / `pull-from-frontend` | v1.5 | Hosted `app.syncflow.dev (planned v1.5)` is post-event |
| `notion-sync` *(roadmap auto-mirror)* | v1.5 | Manual Notion mirror via the integration is enough for v0 |
| Co-Work module *(`cowork-*`)* | v1.5 | Per-team-member workflows, separate spec in PR #2 |
| Multi-brand switching *(agency users)* | v1.5 | Single Project per brand is enough for v0 |
| Windows / Linux setup parity | v0.5 | macOS-only for the event |

---

## Counts *(reality, not aspiration)*

| Bucket | Count |
|---|---|
| Shipped real skills *(files in `bundle/skills/`)* | 23 |
| Shipped guardrails *(behaviours in `syncflow.md`)* | 7 |
| Shipped persona lenses *(in `prompts/personas.md`)* | 8 |
| Integration setup snippets *(in `bundle/integrations/`)* | 5 |
| Total v0 surface area | **43** |

Compare to the original catalogue's 70 entries: the trim was deliberate. Many "skills" were really sub-prompts of `run-interview` *(per-section interview skills collapsed)* or per-page render skills *(consolidated into one `render-roadmap`)*. The point of v0 was to ship a working bundle, not a complete catalogue.

---

## How to add a skill

Each new skill ships as `bundle/skills/<skill-name>.md` with this shape:

```md
# `<skill-name>`

**When**
- <user phrase / system state that triggers it>

**Inputs**
- <brain fields / reference files>

**Tools**
- <MCP / artifact / chat>

**Outputs**
- <chat / artifact / brain mutation>

---

## Why this skill exists

<one paragraph; consultant frame>

## Behaviour

1. ...
2. ...

## Don't

- <anti-patterns specific to this skill>
```

When adding, also update:

1. `bundle/syncflow.md` → trigger phrase table
2. This catalogue → status flag + row in the relevant section
3. If it's a behaviour, add it to syncflow.md's "Always-on guardrails" section, NOT a separate file
