# Implementation Phase · architecture doc

> The contract for how syncflow guides a delegate from a finished roadmap through to a deployed, audited, redeployed module — without their filesystem, their Claude Code projects, or their team becoming messy. Read this before invoking any of the implementation-phase skills.

---

## Why this exists

syncflow's first half is great: the interview, the brain, the 11-page artifact, the recommended modules. The second half — *building* the modules over weeks, *deploying* them, *verifying* they actually saved time — was previously underspecified. Sim's pre-SSL test-run feedback nailed it: *"it's just a fancy PDF, now what?"*

The implementation phase fills that gap. It guides the delegate from `recommended` through `planned → in_progress → built_v1 → deployed → redeployed → audit_t4_passed`, with one source of truth, one filesystem layout, and one integration model with their existing Claude Code world.

The opposite of what we're building is **chaos**: build plans regenerated three times, files scattered across the Mac, brain state forked across a dozen notes, the delegate forgetting which module they were on. Every design decision below is anti-chaos.

---

## The four principles

### Principle 1 · Single source of truth = `brain.json`

`brain.recommendations.modules[]` is the canonical state. The roadmap artifact is **derived** from it. The disk mirror *(when filesystem MCP is enabled)* is **derived** from it. Optional ClickUp / Notion / Asana tasks are **derived** from it. Every status change flows through `update-module-status`, which writes the brain *first*, then propagates downstream.

> If two views of state disagree, the brain wins. If you find yourself maintaining state in two places, stop and ask: which is canonical?

### Principle 2 · Standard filesystem layout per brand

When implementation kicks off for a brand, the delegate gets *(or builds, manually if no filesystem MCP)* this layout at `~/syncflow-projects/<brand-slug>/`:

```
~/syncflow-projects/<brand-slug>/
├── brain.json                   # mirror of Cowork's brain
├── README.md                    # delegate-facing index
├── modules/
│   ├── 01-control-plane/
│   │   ├── CLAUDE.md            # syncflow-emitted Claude Code instructions for THIS module
│   │   ├── build-plan.md        # from generate-build-plan
│   │   ├── verification-plan.md # from generate-verification-plan
│   │   ├── status.json          # current state — read by syncflow on next session
│   │   ├── README.md            # purpose, current phase, where things live
│   │   ├── implementation/      # actual code (delegate's CC writes here)
│   │   ├── n8n/                 # flow exports
│   │   ├── supabase/            # migrations
│   │   └── clickup/             # config dumps / IDs
│   ├── 02-demand-planning/
│   └── ...
└── _shared/
    ├── credentials/             # gitignored — secrets via Vault / .env
    ├── notes/                   # delegate's own running notes
    └── looms/                   # screen recordings, walkthroughs
```

Module folders are named `0N-<slug>` where `N` matches `brain.recommendations.modules[].n`. Predictable. Indexable. No scatter.

`init-implementation-project` creates this on first implementation. Without filesystem MCP, the same layout is documented as a convention — delegate creates folders manually.

### Principle 3 · Per-module `CLAUDE.md` is the CC integration point

The delegate's machine likely has many other Claude Code projects: personal stuff, other brands, client work. **Each has its own root `CLAUDE.md`.** We don't touch any of them.

Instead: **`modules/0N-<slug>/CLAUDE.md` is the per-module Claude Code instruction set.** When the delegate `cd`s into that folder and runs `claude`, their Claude Code reads *that* CLAUDE.md and knows it's working on a specific module:

- **Identity**: I am Module 0N — `<name>`. Archetype `<archetype>`. Brand `<brand>`.
- **Context**: build plan + verification plan inlined.
- **Current state**: read `status.json` for current phase, what's done, what's next.
- **Single-project hygiene** *(non-negotiable)*: don't spawn new Supabase / Vercel / ClickUp / GitHub projects. Use the ones already in the delegate's stack.
- **Phase protocol**: when a phase passes verification, write the milestone to `status.json`, run a final check, and tell the delegate to come back to Cowork to record the status update with syncflow.
- **Pointer back**: `../../../brain.json` is the source of truth for the broader context.

The delegate's other CC projects with their own root CLAUDE.md's are completely untouched. **Folder = scope.**

### Principle 4 · Status lifecycle is explicit and gated

Every module moves through a defined state machine:

```
recommended
   → planned             (build plan, verification plan, CC prompt, per-module CLAUDE.md, module folder
                          all generated; module status set to planned)
   → in_progress         (delegate confirms they've started a CC session for this module)
   → phase_1_complete    (Phase 1 verification passed)
   → phase_2_complete
   → phase_3_complete
   → phase_4_complete
   → phase_5_complete
   → built_v1            (all 5 phases done, full verification plan green)
   → deployed            (running unattended — Sim P5 satisfied: cloud + scheduled + monitored)
   → redeployed          (recovered hours moved to higher-value work — Sim P6 satisfied)
   → audit_t4_passed     (T+4 weeks audit passed: hours actually saved AND redeployed AND tool still up)
   ← tolerated           (terminal — Sim's three-option C: build cost > saving; document and revisit)
```

**Rules:**
- Updates go through `update-module-status` skill, never ad-hoc edits to brain.json or status.json
- Each transition triggers a brain re-emission *(Page 07 module-card status pills update)*
- Each transition optionally syncs to PM tool *(ClickUp / Notion / Asana)* if a mirror is configured
- Backwards transitions are allowed *(e.g. `verified` → `built_v1` if a regression is discovered)* — but require a `note` field
- `tolerated` is terminal — modules don't come back from it without a fresh recommend cycle

---

## How the pieces fit together

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Cowork project (per brand)                          │
│  ┌────────────────────────┐                                              │
│  │  syncflow (consultant)  │                                              │
│  │   + brain.json         │ ◄────── source of truth ──────────┐         │
│  │   + roadmap artifact   │                                    │         │
│  └─────────┬──────────────┘                                    │         │
│            │ start-implementation                              │         │
│            │ update-module-status                              │         │
│            │ read-implementation-status                        │         │
│            │ audit-module-t4 / track-redeployment              │         │
└────────────┼──────────────────────────────────────────────────┼─────────┘
             │ (filesystem MCP, tier 2)                          │
             ▼                                                   │
┌─────────────────────────────────────────────────────────────────────────┐
│                   ~/syncflow-projects/<brand>/                          │
│   brain.json (mirror)  ◄───────── disk-synced ────────────┐             │
│   modules/                                                 │             │
│     01-control-plane/                                      │             │
│        CLAUDE.md          ◄── delegate's CC reads this    │             │
│        build-plan.md                                      │             │
│        status.json        ──────── status writes ────────►┘             │
│        implementation/    ◄── delegate's CC writes code here            │
│        n8n/ supabase/ clickup/                                          │
│     02-...                                                              │
└────────────┬────────────────────────────────────────────────────────────┘
             │ delegate `cd modules/01-control-plane && claude`
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│           Delegate's Claude Code (CLI, on their machine)                 │
│   reads modules/0N/CLAUDE.md                                            │
│   writes implementation/                                                │
│   writes status.json on phase milestones                                │
│   uses delegate's MCPs: ClickUp, Slack, Supabase, n8n, GitHub, etc.     │
└─────────────────────────────────────────────────────────────────────────┘
```

**The sync points:**

1. **syncflow → disk:** `start-implementation` writes the module folder structure + initial files. `emit-brain-artifact` mirrors brain.json. Both via filesystem MCP.
2. **CC → disk:** delegate's CC writes implementation code + updates status.json on phase milestones.
3. **disk → syncflow:** on next Cowork session, `restore-brain-from-knowledge` reads any status.json files and reconciles brain.json. Surfaces a "what changed since last session" greeting.
4. **brain → optional PM tool:** `update-module-status` syncs to ClickUp / Notion / Asana if mirror is configured *(via `recommend-pm-integration`)*.

---

## What if filesystem MCP isn't enabled? *(tier 1 only)*

Same conventions, manual execution:

- syncflow emits build-plan / verification / per-module CLAUDE.md as **chat content** the delegate copies into the layout themselves
- delegate creates `~/syncflow-projects/<brand>/modules/0N-<slug>/` manually
- delegate manually pastes files
- status updates happen via chat: delegate types *"Phase 1 complete on Module 02"* → `update-module-status` updates brain
- delegate's CC reads CLAUDE.md once it's in the right folder; the layout convention still holds, just operated by hand

The tier-1 path is supported throughout. Tier-2 with filesystem MCP is the smoother path. Tier-2 isn't required.

---

## How each implementation-phase skill fits in

| Skill | Fires when | What it does |
|---|---|---|
| `start-implementation` | User says *"start Module 0N"* / *"plan it"* / *"let's build Module 0N"* | Generates build-plan + verification-plan + per-module CLAUDE.md + status.json + module folder structure. Sets module status to `planned`. Offers PM-tool integration if delegate has one. Outputs explicit terminal kickoff. |
| `init-implementation-project` | First implementation kickoff for a brand *(tier 2 only)* | Creates `~/syncflow-projects/<brand>/` structure on disk. Idempotent. |
| `update-module-status` | User says *"Phase 1 done on Module 02"* / *"Module 03 deployed"* / etc. | Validates the transition. Updates brain.json. Re-emits artifact. Optionally syncs PM tool. |
| `read-implementation-status` | User says *"where am I?"* / *"status"* / *"what's next?"* | Returns structured per-module status: phase, blockers, next action. |
| `audit-module-t4` | T+4 weeks after a module hits `deployed`, OR user says *"audit Module 0N"* | Sim's T+4 audit. Prompts for actual hours saved, redeployment outcome, tool uptime. Updates brain. Sets `audit_t4_passed` or sends back for rework. |
| `track-redeployment` | After module hits `deployed` | Captures what the recovered hours were used for. Sets status `redeployed`. Enforces Sim P6: hours saved must be redeployed, not just reclaimed. |
| `recommend-pm-integration` | First `start-implementation` call for a brand, if PM tool detected in `brain.sections.stack.tools` | Offers PM mirror: *"You use ClickUp. Want syncflow to mirror module phase status as ClickUp tasks?"* Opt-in. |

Plus updates to existing skills:

| Skill | What changed |
|---|---|
| `emit-roadmap-artifact` | Handoff CTA mentions both *"plan it"* AND *"start Module 0N"*. Lists implementation status if any modules are past `recommended`. |
| `restore-brain-from-knowledge` | Reads disk status.json files; reconciles brain; surfaces "what changed since last session" greeting. |
| `generate-cc-prompt` | Extended to also produce the per-module CLAUDE.md *(richer than the one-shot prompt it used to emit)*. |
| `emit-brain-artifact` | Disk-mirrors to `~/syncflow-projects/<brand>/brain.json` if filesystem MCP enabled. |

---

## How this prevents specific kinds of mess

| Risk | Prevention |
|---|---|
| Files scattered across delegate's Mac | Standard layout enforced *(or strongly recommended)* via `init-implementation-project` |
| Multiple brain.json copies disagreeing | Brain.json on Cowork is canonical; disk mirror is read-only as far as delegate is concerned *(only `emit-brain-artifact` writes it)* |
| Status updates lost between sessions | `status.json` files + filesystem MCP read at session restore reconcile state automatically |
| Delegate's existing CC projects polluted | Per-module CLAUDE.md scoped to the module folder. Their other projects' CLAUDE.md's untouched. Folder = scope. |
| Roadmap artifact goes stale once "done" | Module-status pills on Page 07 update on every status change |
| T+4 audit forgotten | `audit_t4.scheduled_for` in brain + `audit-module-t4` skill surfaces it on the right session |
| Recovered hours not redeployed | `track-redeployment` skill enforces Sim P6 explicitly |
| Build plans regenerated on every prompt | `start-implementation` is idempotent; subsequent calls update existing files in place |
| Module folders multiply | One per module, indexed by `n`, naming convention `0N-<slug>`. New modules create new folders; existing modules reuse |
| PM tool integration lock-in | `recommend-pm-integration` is opt-in; brain stays primary regardless |
| Cross-brand context bleeding | One filesystem subfolder per brand at `~/syncflow-projects/<brand>/`; one Cowork project per brand. Strict separation. |

---

## Read also

- **`reference/implementation-anti-patterns.md`** — explicit list of patterns to avoid, paired with prevention rules
- **`reference/per-module-claude-md-template.md`** — the template `generate-cc-prompt` uses for per-module CLAUDE.md generation
- **`reference/method-principles.md`** — Sim's P1–P8; especially P5 *(runs unattended)* and P6 *(redeploy the hours)* which the lifecycle states map to
- **`reference/simplicity-ladder.md`** — the rung context that travels into each module's build plan via the rung pill on Page 07
- **`templates/brain-schema.json`** — module fields that drive the lifecycle: `status`, `current_phase`, `started_at`, `status_history`, `deliverables`, `audit_t4`, `pm_tracking`

---

## The one-sentence version

`brain.json` is the source of truth; `~/syncflow-projects/<brand>/modules/0N-<slug>/` is the standard filesystem layout; `CLAUDE.md` per module is the Claude Code integration point; `status.json` per module is how the delegate's CC and syncflow's brain stay in sync; the lifecycle moves through `recommended → planned → in_progress → phase_N_complete → built_v1 → deployed → redeployed → audit_t4_passed` via the `update-module-status` skill — and all the implementation-phase skills exist to make those transitions structured, auditable, and free of mess.
