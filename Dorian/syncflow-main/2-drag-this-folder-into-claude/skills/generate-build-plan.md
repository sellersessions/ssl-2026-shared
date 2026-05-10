# `generate-build-plan`

**When**
- User says: *"give me the build plan for Module N"* / *"how do I build X"* / *"let's implement <module>"*
- After the roadmap is written and the user wants to act on a specific module
- Called internally by `emit-build-plan-artifact` *(artifact-emission mode — see § Artifact-emission mode below)*
- Always paired with `generate-verification-plan` — never one without the other

**Inputs**
- `<module-id>` or `<module-name>` — which module to plan
- in-context `brain` object — for stack-specific details
- `reference/sim-knowledge-base.md` — for the canonical archetype detail
- The replacement table + architecture map from earlier in the session
- *(artifact-emission mode only)* `<output-mode>` — `"chat"` *(default)* or `"artifact"` *(returns the markdown body for `emit-build-plan-artifact` instead of streaming to chat)*

**Tools**
- `read-brain` — for stack detail
- `reference/simplicity-ladder.md` — read at every phase that names a tool. Cite the rung; if reaching for rung 6 (new SaaS) or rung 7 (custom), justify against the two questions in the file
- `reference/method-principles.md` — apply P5 *(runs unattended)* and P6 *(redeploy the recovered hours)* as audit checks on the final plan
- `reference/tool-catalogue/tier1.md` — when a phase names a Tier 1 tool, cite the section's *Pricing*, *Gotchas*, and *Pairs with* fields. 22 sections, one per tool.
- `reference/scraping-tools-decision-guide.md` — read if any phase needs a scraper; cite the volume tier and verified pricing
- `reference/skills-bible/SKILLS_BIBLE.md` — technical implementation depth (auth flows, rate limits, RDT, SigV4, Vault, SQS, webhooks, multi-marketplace, Brand Registry, etc.). Read this when a Phase needs more than a tool name + a rung — cite specific sections (§1.1 SP-API, §2.2 Webhooks, §4.4 Auth/Security) for concrete implementation details. Drop into the per-topic deep-dive (e.g. `skills-bible/auth-security-patterns.md`) only when the bible's quick-reference isn't enough.
- chat *(default mode)* — output the structured plan to chat
- *(artifact-emission mode)* return the same structured plan as a markdown body string for `emit-build-plan-artifact` to wrap in a `syncflow-build-plan-{n}` artifact — no chat stream
- *(no FS writes — the plan lives in chat OR in an artifact, never on disk via this skill)*

**Outputs**
- *(default)* Structured A→Z build plan, in chat
- *(artifact-emission mode)* Same structured plan returned as a markdown body string for `emit-build-plan-artifact`
- Triggers `generate-verification-plan` automatically *(default mode only — artifact mode bundles verification inline at the bottom of the markdown body)*
- Triggers `generate-cc-prompt` if the user wants a copy-pasteable prompt *(default mode only)*

---

## Plan structure

Every build plan follows the same 5-phase shape. **Don't deviate.** Phases that don't apply collapse to *"N/A — this module doesn't need this phase"* — but the structure itself is locked.

```
Phase 1 — Schema           (week 1)   Tables, fields, RLS, migrations.
Phase 2 — Ingestion        (week 2)   Data into the system. n8n flows + sources.
Phase 3 — Logic            (week 3)   The actual processing. ← FORKS by maintenance_tolerance
Phase 4 — Surface          (week 4)   ClickUp tasks / dashboard / alerts.
Phase 5 — Deploy + monitor (week 5)   Hosting, auth, fail-loud alerts.
```

**Phase 1 + Phase 2 are always shared** — the schema is canonical; ingestion is canonical *(SP-API / Brand Analytics / etc. are the same data sources regardless of where the logic runs)*. **Phase 3 forks** based on `brain.sections.team.maintenance_tolerance`:

| `maintenance_tolerance` | Phase 3 path | Phase 4 surface | Phase 5 deploy |
|---|---|---|---|
| `n8n_self_host` *(default)* | n8n workflow — JSON-friendly node-graph; webhook + cron triggers; Set/Code/HTTP Request/IF/Merge nodes. Steps name nodes by type, not lines of code. | ClickUp via n8n's ClickUp node + native Slack alert webhook. | Self-hosted n8n on Hetzner CX22 (£8/mo); systemd service + n8n's own retry/queue; Slack alert on workflow failure. |
| `claude_code_app` | Small TypeScript scaffold (Next.js API routes or standalone Vercel cron functions) — `src/jobs/<module>.ts` + scheduler config. Steps name files + functions. | Surface via the same Next.js scaffold *(API route writes to ClickUp via REST)* OR directly to Supabase + a Cowork artifact. | Vercel deploy (Hobby tier baseline; Pro at scale); Vercel cron for scheduling; structured logs + Vercel monitoring; alerting via webhook to Slack. |
| `neither` *(or null)* | **Default to n8n_self_host with a footnote on the build plan:** *"You answered 'pick the safest path' on maintenance — we've defaulted to n8n self-host because it's the lowest-floor option for non-engineering teams. Switch to the claude_code_app path before Phase 3 if you'd rather own a TypeScript scaffold."* | n8n path. | n8n path. |

**Why fork (Track F · Sim #7):** v1 hard-coded n8n as the only path. Sim flagged that for delegates with engineers in-house, a TypeScript scaffold deployed to Vercel + Supabase is cleaner than a self-hosted n8n VPS to maintain. The maintenance answer is the one signal that decides; we ask once in `run-interview` Section 2 Batch 3 and fork once here.

For each phase:
- **Goal** — one sentence
- **Steps** — concrete, named files / nodes / tables
- **Time estimate** — in hours
- **Verification** — what gets checked before this phase counts as done *(see `generate-verification-plan`)*
- **Anti-pattern check** — which of the 7 anti-patterns this phase risks *(multi-project, credential repetition, etc.)*

---

## Required reading per phase *(skills-bible)*

Before writing each phase, read the relevant `reference/skills-bible/<topic>.md` deep-dive AND cite specific patterns from it in the Steps. The plan should name concrete things — *"use STS AssumeRole, not direct IAM keys (auth-security-patterns § Multi-Account)"* — not just *"set up auth somehow."*

Default required-reading map *(adjust based on the module's actual stack)*:

| Phase | Always read | Add when stack includes |
|---|---|---|
| **1 · Schema** | `skills-bible/database-best-practices.md`, `skills-bible/supabase.md` | `auth-security-patterns.md` *(if multi-tenant or RLS)* |
| **2 · Ingestion** | `skills-bible/SKILLS_BIBLE.md` § 1 *(Amazon ecosystem index)* | `amazon-sp-api.md` *(SP-API)*, `amazon-advertising-api.md` *(Ads)*, `amazon-brand-apis.md` *(A+ / Brand Store)*, `amazon-brand-registry-advanced.md` *(BR mechanics)*, `amazon-keyword-research.md` *(SQPR / search)*, `multi-marketplace-patterns.md` *(pan-EU / US)*, `rainforest-scrapers.md` *(competitor scrape)*, `webhook-event-driven-patterns.md` *(real-time SQS)* |
| **3 · Logic** | `skills-bible/n8n-skill-research.md` *(if n8n)* OR `skills-bible/claude-code.md` *(if CC routine)* | `auth-security-patterns.md` *(Vault for secrets)*, `image-generation-apis.md` *(creative gen)*, `local-llm-gpu.md` *(if archetype #14)* |
| **4 · Surface** | `skills-bible/vercel-nextjs.md` *(if frontend)*, `skills-bible/clickup-amazon-business.md` *(if ops layer)* | `claude-connectors-cowork-code.md` *(Cowork artifact)*, `email-crm-apis.md` *(comms)*, `whatsapp-api.md` *(WhatsApp outreach)*, `figma-plugin-sdk.md` *(plugin surface)* |
| **5 · Deploy + monitor** | `skills-bible/auth-security-patterns.md` *(production hardening)*, `skills-bible/webhook-event-driven-patterns.md` § DLQ + monitoring | `vercel-nextjs.md` *(prod deploy)*, `project-management-apps-amazon-brands.md` *(if alerts route through PM)* |

**How to cite in the plan:** when a Step names a pattern that comes from the bible, add an inline reference. Example:

> Steps:
> - supabase/migrations/0001_demand_planning.sql:
>     - `skus` table — UUID PK, TIMESTAMPTZ for all timestamps *(database-best-practices § Postgres conventions)*
>     - RLS on `skus`: brand-scoped via `brand_id`; service-role bypass *(supabase § Row-Level Security)*
>     - Indexes: `(sku_id, date)` on `sku_metrics_daily` *(database-best-practices § Composite indexes for time-series queries)*

The reference makes the plan auditable and gives the delegate a path to the source-of-truth instead of just trusting the agent.

If a bible section doesn't exist for what you need, name that explicitly: *"Sim's bible doesn't cover X yet — recommend you cross-check with Anthropic docs / vendor docs at $URL before executing."*

---

## Behaviour

1. **Read the brain** + structured outputs. You need the user's actual stack, not generic advice. If the brain is sparse on the relevant section *(e.g. `recommend-modules` recommended Demand Planning but `stack.md` is missing inventory tools)*, halt and probe before building the plan.

2. **Look up the archetype** in `reference/sim-knowledge-base.md` § 5. Each archetype has source detail. Quote Sim where the case study makes the plan concrete.

3. **Apply the worldview principles** as you write:
   - **Schema-first** *(Database expert default)* — Phase 1 always exists, even for "small" modules. Get tables right before any logic.
   - **n8n is the glue** *(principle #6)* — orchestration in n8n unless there's a specific reason to use code.
   - **Working local doesn't count** *(principle #8)* — Phase 5 always specifies cloud deployment. Vercel for frontend; n8n.cloud or self-hosted-but-monitored for orchestration. Refuse local-only as a deploy story.
   - **The last 20% takes longer than the first 80%** *(principle #11)* — Phase 5 is real, not handwave. Auth, hosting, alerts, monitoring are first-class.
   - **Single-project hygiene** *(anti-pattern #1)* — before Phase 1, scan for existing repos / Vercel projects / Supabase projects. **Refuse to spawn new** if equivalents exist.

3a. **Pull the per-phase bible deep-dives.** Before writing each phase, read the deep-dives from the *Required reading per phase* table above. Cite specific sections inline in the Steps *(see the citation example in that table)*. Don't just open the bible for show — name patterns from it that materially shape the phase.

3b. **Resolve the build path** *(Track F · Sim #7)*. Read `brain.sections.team.maintenance_tolerance`:
   - `n8n_self_host` → use the **n8n path** for Phase 3 + Phase 5. Phase 4 wires through n8n's ClickUp node.
   - `claude_code_app` → use the **TypeScript scaffold path** for Phase 3 + Phase 5. Phase 4 wires through API routes.
   - `neither` or null → default to `n8n_self_host` and emit a one-line footnote on the plan: *"Defaulted to n8n self-host (you answered 'pick the safest'). Switch to TypeScript scaffold before Phase 3 if your team has engineering capacity to maintain it."*

   The fork **only affects Phase 3 + Phase 5** *(and Phase 4 surface wiring)*. Phase 1 and Phase 2 are identical across paths — the schema is the schema, and ingestion pulls from the same SP-API / Brand Analytics / etc. regardless. **This is deliberate** — it keeps the modules portable; a delegate who starts on n8n and outgrows it can replace just Phase 3 + Phase 5 without touching the data layer.

4. **Output the structured plan.** Format:

   ```
   Build plan · Module 02 · Demand Planning
   Estimated total: 16–24 hrs · 5 weeks part-time

   ─────────────────────────────────────────
   PHASE 1 · Schema (week 1, ~4 hrs)

   Goal: Tables and constraints that drive everything downstream.

   Steps:
   - supabase/migrations/0001_demand_planning.sql:
       - skus (id, asin, marketplace, brand_id, category, lead_time_days, safety_stock_units, ...)
       - sku_metrics_daily (sku_id, date, sales, sessions, conversion, search_volume_index, ...)
       - demand_plan_weekly (sku_id, week_start, predicted_units, confidence, generated_at, ...)
       - signals (sku_id, source, payload_json, captured_at, ...)
   - RLS: brand-scoped reads via brand_id; writes from service role only.
   - Indexes: (sku_id, date) on sku_metrics_daily; (sku_id, week_start) on demand_plan_weekly.

   Verification: see verification plan, Check 1.
   Anti-pattern check: single-project hygiene — confirm one Supabase project for this brand. Don't spawn a new one.
   ─────────────────────────────────────────
   PHASE 2 · Ingestion (week 2, ~4 hrs)
   ...
   ─────────────────────────────────────────
   PHASE 3 · Logic (week 3, ~4–8 hrs)
   ...
   ─────────────────────────────────────────
   PHASE 4 · Surface (week 4, ~3 hrs)
   ...
   ─────────────────────────────────────────
   PHASE 5 · Deploy + monitor (week 5, ~2 hrs)
   ...
   ```

5. **End with the handoff.** Always: this plan ships paired with a verification plan AND a copy-pasteable Claude Code prompt. Trigger `generate-verification-plan` automatically. Offer `generate-cc-prompt`:

   > *"Verification plan attached below. Want me to write a Claude Code prompt you can paste into your own session to start Phase 1?"*

---

## Artifact-emission mode

When called by `emit-build-plan-artifact` *(automatic for the recommended-start module at the end of `render-roadmap`, or on demand for any module)*, this skill returns the same structured plan as a **markdown body string** instead of streaming to chat.

**Flag:** `<output-mode>` set to `"artifact"`.

**What changes vs default mode:**

1. **No chat output.** The 5-phase plan + verification + risks is composed as a single markdown string and handed to `emit-build-plan-artifact` for the MCP `create_artifact` / `update_artifact` call.
2. **Verification is bundled inline.** Default mode triggers `generate-verification-plan` as a sibling chat-side message; artifact mode appends a `## Verification plan` section to the markdown body so the artifact is self-contained — a tech lead can drop the markdown file into Claude Code as the per-module PRD without losing the verification checks.
3. **No `generate-cc-prompt` trigger.** The artifact body is the prompt — the markdown reads as a Claude Code system message *(Phase 1 starts at the top of `## PHASE 1 · Schema`)*.
4. **Rung citations and bible references stay inline.** Don't strip them; the artifact lives outside Cowork *(downloaded markdown file → Claude Code)* and the citations are what make the plan auditable in that context.
5. **Header is artifact-tuned.** Top of the markdown body:

   ```markdown
   # Build plan · Module {{n}} · {{name}}

   > **Generated by syncflow** · {{date}} · {{brand_display}}
   > Drop this folder into Claude Code: `cd modules/{{n}}-{{slug}}/ && claude`
   > Phase 1 starts below. Each phase ends with a verification checklist; only advance once it passes.

   **Estimated total:** {{effort_range}} · {{phase_count}} phases · part-time across {{week_count}} weeks
   ```

6. **Footer is artifact-tuned.** Bottom of the markdown body:

   ```markdown
   ---

   ## Status update protocol

   When you complete a phase, paste in your Cowork chat:

   - `Phase 1 done on Module {{n}}`  *(after Phase 1 verification passes)*
   - `Phase 2 done on Module {{n}}`  *(after Phase 2 verification passes)*
   - … etc.

   syncflow's `update-module-status` skill parses these and advances the module's
   lifecycle state in `brain.json` + the roadmap artifact's Project Board.

   ## Where this fits

   - **Brain (source of truth):** `~/syncflow-projects/{{brand_slug}}/brain.json`
   - **This module's folder:** `~/syncflow-projects/{{brand_slug}}/modules/{{n}}-{{slug}}/`
   - **Sibling files:** `CLAUDE.md` *(per-module system prompt)*, `verification-plan.md` *(extracted version of the verification section above)*, `status.json` *(current_phase + history)*, `README.md` *(module overview)*
   ```

**When `emit-build-plan-artifact` is fired but this module's plan body hasn't been derived yet:** synthesise on demand from `brain.recommendations.modules[n]` + `reference/sim-knowledge-base.md`. Same 5-phase shape; same archetype lookup. Don't return placeholders or *"plan to be generated later"* — emit a real plan or halt and surface why *(brain too thin, archetype unknown)*.

**When the user says *"build plan for Module N"* explicitly:** stay in default *(chat)* mode unless they also say *"emit it as an artifact"* / *"give me the build plan as a downloadable artifact"*. The chat stream is still the right primary surface for an in-conversation request; artifact mode is for the auto-emit path or explicit asks.

---

## Per-archetype starting structure

Some archetypes already have decent starting structure (Sim's case studies). Others don't. For an archetype not covered:

> *"This is one of the 15 archetypes Sim mentions in his deck but I don't have a full build playbook for it yet — only Demand Planning has a populated playbook in v0. I'll generate a Phase 1–5 plan from first principles based on your stack, but flag this for review with the syncflow team before you commit to executing it. Some details may need their input."*

This honesty rule is non-negotiable. We don't fake expertise we don't have yet.

---

## Don't

- **Don't skip Phase 5.** Cloud deploy + monitoring + alerts is part of the build, not after the build. *Working local doesn't count.*
- **Don't write the actual code.** The plan tells the user *what* to build; their own Claude Code (with their stack MCPs wired in) writes the code. We're the consultant; we don't ship production.
- **Don't merge phases.** Each phase has its own verification before the next starts. *Plan before execute, principle #2.*
- **Don't hand-wave the anti-patterns.** If Phase 1 needs a new Supabase project but the user already has one, the plan must say *"add tables to existing project `<name>` — do NOT create new"*.
- **Don't promise specific timings if the user's stack is unknown.** Estimates are ranges; if a delegate doesn't have ClickUp set up at all, Phase 4 might be 8 hrs not 3.
- **Don't propose Implementation Mode** ("syncflow will run the migrations for you") — that's v2 (`provision-supabase`, `provision-n8n`, `provision-clickup`). v0 is consultant only.
