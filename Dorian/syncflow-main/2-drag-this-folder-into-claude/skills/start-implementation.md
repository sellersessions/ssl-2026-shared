# `start-implementation`

> The single entry point that takes a module from `recommended` to `planned` and produces every deliverable the delegate needs to begin Phase 1 in their own Claude Code session. Replaces the historical *"type 'plan it' to get a build plan"* path with a complete, structured kickoff.

**When**
- User says: *"start Module 0N"* / *"plan it"* *(after roadmap emission, defaults to recommended-start)* / *"let's build Module 0N"* / *"kick off Module 0N"*
- User clicks the per-module **"Hand off →"** pill on Page 07 *(Track F · Sim #22 — pill copies `start Module 0N` to clipboard; delegate pastes; this skill fires)*
- User passes an explicit `--path={n8n|claude_code_app}` flag overriding the brain's `team.maintenance_tolerance` *(Track F · Sim #7)*
- After `emit-roadmap-artifact`'s handoff has been shown and the delegate confirms a starting move

**Inputs**
- `<module-n>` — which module *(default: the one tagged `recommended start`)*
- `--path={n8n|claude_code_app}` *(optional override — Track F · Sim #7)*. Resolves to `brain.sections.team.maintenance_tolerance` when absent. `neither`/`null` defaults to `n8n_self_host` with a build-plan footnote.
- in-context `brain` — for stack-specific detail
- `reference/implementation-phase.md` — the architecture
- `reference/per-module-claude-md-template.md` — the CLAUDE.md template
- `reference/simplicity-ladder.md`, `reference/skills-bible/SKILLS_BIBLE.md` — for build-plan depth
- `reference/sim-knowledge-base.md` — for archetype detail

**Tools**
- `read-brain` — fetch module + stack details
- `generate-build-plan` *(internal call)* — produce the 5-phase plan
- `generate-verification-plan` *(internal call)* — produce verification per phase
- `generate-cc-prompt` *(internal call, extended)* — produce the per-module CLAUDE.md
- `init-implementation-project` *(internal call, tier-2 only)* — ensure `~/syncflow-projects/<brand>/` exists
- `update-module-status` *(internal call)* — transition to `planned`
- `recommend-pm-integration` *(internal call, first-time only)* — offer PM mirror if applicable
- `Write` *(filesystem MCP, tier 2)* — write build-plan.md / verification-plan.md / CLAUDE.md / status.json / README.md to `modules/0N-<slug>/`
- chat — present the kickoff message

**Outputs**
- 5 files written to `modules/0N-<slug>/` *(if filesystem MCP)* OR rendered in chat for delegate to copy *(tier 1)*:
  1. `build-plan.md`
  2. `verification-plan.md`
  3. `CLAUDE.md` *(per-module — the integration point with delegate's CC)*
  4. `status.json` *(initial state, current_phase: 1)*
  5. `README.md` *(human-readable index for the module folder)*
- Module status transitioned `recommended → planned` *(via `update-module-status`)*
- Roadmap artifact re-emitted *(Page 07 module-card status pill updates)*
- Optional PM-tool tasks created *(if delegate accepted `recommend-pm-integration`)*
- Explicit terminal kickoff message in chat

---

## Behaviour

### 1. Resolve the module

- If `<module-n>` is provided, validate it exists in `brain.recommendations.modules`
- If not provided and the delegate said *"plan it"*: default to the module with `tag: "recommended start"`
- If multiple matches *(e.g. "the demand planning one")*, confirm which
- If no match: surface available modules and stop. Don't guess.

### 2. Idempotency check

If the module's `deliverables.module_folder` is already populated AND the folder exists *(via filesystem MCP read)*, this is a re-kickoff. Two paths:

- **Status is `planned` or earlier** → safe to refresh. Tell the delegate: *"Module 02 already kicked off on 2026-04-15. Want me to refresh the build plan / CLAUDE.md from the latest brain state? (existing files moved to .bak.{{timestamp}})"*. If they say yes, regenerate; if no, surface the existing files and exit.
- **Status is past `planned`** → reject the refresh. Module is in flight; refreshing the plan mid-build is anti-pattern. *"Module 02 is at phase_3_complete. I won't reset the build plan mid-flight. If something's wrong with Phase 4+, we can run `regenerate-section` for that phase or `swap-module` for the whole thing."*

If filesystem MCP isn't enabled, idempotency check is brain-only *(check `deliverables.module_folder` field)*.

### 3. Check filesystem-MCP tier *(tier 1 vs tier 2)*

Probe the runtime: is filesystem MCP available?

- **Tier 2** *(filesystem MCP enabled)*: ensure the brand's `~/syncflow-projects/<brand-slug>/` exists. If it doesn't, fire `init-implementation-project` first — that's a one-time setup per brand. Then proceed to write deliverables to disk.
- **Tier 1** *(no filesystem MCP)*: same content, but rendered in chat for the delegate to copy. Mention the standard layout convention so they create the folders manually.

### 4. Generate the deliverables

**Resolve build path first** *(Track F · Sim #7)*. Set `<build-path>`:
- If `--path` flag provided → use it.
- Else → read `brain.sections.team.maintenance_tolerance`. `n8n_self_host` → `n8n`. `claude_code_app` → `claude_code_app`. `neither`/`null` → `n8n` *(default)* with a build-plan footnote.

Pass `<build-path>` to `generate-build-plan` so Phase 3 + Phase 5 fork correctly.

Internal calls in order:

1. `generate-build-plan` *(with `<build-path>`)* — produces the full 5-phase plan with bible citations *(per the new Required reading per phase pattern)*. Phase 3 + Phase 5 fork on `<build-path>`. Populates `{{build_plan_inline}}` placeholder.
2. `generate-verification-plan` — produces verification checks per phase. Populates `{{verification_plan_inline}}`.
3. `generate-cc-prompt` *(extended)* — produces the per-module CLAUDE.md from `reference/per-module-claude-md-template.md`. Inlines build-plan + verification-plan + stack summary. Substitutes all `{{...}}` placeholders from the brain.
4. Compose `status.json` *(initial state)*:
   ```json
   {
     "module_n": "<n>",
     "module_name": "<name>",
     "brand_slug": "<brand>",
     "current_phase": 1,
     "phases": {
       "1": { "status": "in_progress", "started_at": "<iso>", "verified_at": null, "notes": "" },
       "2": { "status": "pending", "started_at": null, "verified_at": null, "notes": "" },
       "3": { "status": "pending", "started_at": null, "verified_at": null, "notes": "" },
       "4": { "status": "pending", "started_at": null, "verified_at": null, "notes": "" },
       "5": { "status": "pending", "started_at": null, "verified_at": null, "notes": "" }
     },
     "deliverables_built": [],
     "blockers": [],
     "last_session": null,
     "next_action": "Read build-plan.md § Phase 1, run verification, update this file"
   }
   ```
5. Compose `README.md` *(human-readable module index — purpose + status pointer + folder map)*.

### 5. Write to disk *(tier 2)*

Use the `Write` tool. Paths:
- `~/syncflow-projects/<brand-slug>/modules/0<n>-<slug>/CLAUDE.md`
- `~/syncflow-projects/<brand-slug>/modules/0<n>-<slug>/build-plan.md`
- `~/syncflow-projects/<brand-slug>/modules/0<n>-<slug>/verification-plan.md`
- `~/syncflow-projects/<brand-slug>/modules/0<n>-<slug>/status.json`
- `~/syncflow-projects/<brand-slug>/modules/0<n>-<slug>/README.md`

Create the subdirectories `implementation/`, `n8n/`, `supabase/`, `clickup/` *(empty — delegate's CC populates them)*.

### 6. Update brain.json

Call `update-module-status`:
- `<module-n>` → `<n>`
- `<new-status>` → `planned`
- `<note>` → *"start-implementation kicked off; deliverables written to modules/0N-<slug>/"*

This also re-emits the roadmap artifact so Page 07 reflects the new status.

Set `brain.recommendations.modules[i].deliverables`:
```json
{
  "module_folder": "modules/02-demand-planning",
  "build_plan_path": "modules/02-demand-planning/build-plan.md",
  "verification_plan_path": "modules/02-demand-planning/verification-plan.md",
  "claude_md_path": "modules/02-demand-planning/CLAUDE.md",
  "status_json_path": "modules/02-demand-planning/status.json",
  "readme_path": "modules/02-demand-planning/README.md"
}
```

### 7. Offer PM-tool integration *(first-time only)*

If `brain.recommendations.modules[i].pm_tracking.tool` is unset AND this is the first `start-implementation` call for the brand, fire `recommend-pm-integration`. That skill checks the stack for ClickUp / Notion / Asana, offers a mirror if found, and *(if accepted)* creates the parent task + per-phase tasks.

If pm_tracking is already configured *(from a previous module's kickoff)*, just create the parent + per-phase tasks for this new module using the same tool.

### 8. Kickoff message in chat

Lead with the explicit terminal command. Format *(tier 2)*:

```
Module 02 · Demand Planning  →  status: planned. Files written:

  ~/syncflow-projects/ideal-direct/modules/02-demand-planning/
     ├── CLAUDE.md           ← per-module Claude Code instructions
     ├── build-plan.md       ← full 5-phase plan
     ├── verification-plan.md
     ├── status.json         ← read-this-first contract for your CC
     └── README.md

Now: open Terminal, run

    cd ~/syncflow-projects/ideal-direct/modules/02-demand-planning
    claude

Your Claude Code reads CLAUDE.md (this module's, scoped to this folder — your
other CC projects untouched), tells you it's Module 02, and starts on Phase 1
Schema. Verification per phase before moving on.

When Phase 1 passes verification, your CC writes the milestone to status.json.
Come back here and say "Phase 1 done on Module 02" — I'll record it, the
artifact updates, your ClickUp gets ticked.

T+4 audit will be scheduled when you hit `deployed`. I'll surface it on the
right session.

Anything before you go?
```

For tier 1 *(no filesystem MCP)*, the same message but with copy-paste instructions:

```
Module 02 · Demand Planning  →  status: planned. Below: 5 files. Copy each into
your ~/syncflow-projects/ideal-direct/modules/02-demand-planning/ folder
(create the folder structure manually — see reference/implementation-phase.md
for the standard layout).

[file 1: CLAUDE.md]
<content>

[file 2: build-plan.md]
<content>

... etc ...

When the files are in place, cd into the folder and run `claude`. The flow is
the same as above — phases pass verification, status.json updates, you tell
me, I record it.
```

### 9. Special cases

- **Module 01 · Control Plane** *(always foundation, always first)*: emphasise that this is the foundation. Other modules can't ship without it. The kickoff message is more directive: *"This is your foundation. Build it; everything else lands on it."*
- **Module is a custom-build *(rung 7)***: include the explicit auth/hosting/deployment caution block in the kickoff: *"This is rung 7 — the last 20% (auth, hosting, monitoring) takes longer than the first 80%. Phase 5 is real, not handwave."*
- **Stack is thin *(brain.sections.stack has gaps)***: warn the delegate. *"The build plan references Supabase but stack.md doesn't have a Supabase project named. Confirm: do you have one, and what's the name? Otherwise Phase 1 won't know where to put migrations."*

---

## Edge cases

- **Module is already `tolerated`**: refuse. *"Module 06 is `tolerated` (logged 2026-04-12). Re-running it requires a fresh recommend-modules cycle, not a start-implementation. Want to swap the tolerated module for something else?"*

- **Brain has no captured stack details**: refuse. Implementation needs a stack to plan against. Push the delegate back through the interview. *"Stack section isn't captured — without that, the build plan can't name your specific Supabase / n8n / ClickUp instances. Run `run-interview` to fill in Section 3 first."*

- **Multiple delegates running parallel kickoffs**: the brain is per-Cowork-project, so multi-delegate is rare. If it happens, the second kickoff sees the first's `status: planned` and falls into the idempotency-refresh path.

- **Filesystem MCP enabled but write fails *(permissions, disk full)***: surface clearly. *"Couldn't write to ~/syncflow-projects/ideal-direct/modules/02-demand-planning/CLAUDE.md (permission denied). Check the folder permissions, or fall back to chat-rendered files (I'll paste them)."*

---

## Don't

- **Don't generate a build plan separately first.** `generate-build-plan` exists as a sub-skill but the delegate-facing path is `start-implementation` which calls it. Don't tell the delegate *"first I'll generate the plan, then..."* — just do it.
- **Don't skip the per-module CLAUDE.md.** It's the integration point with their CC. A build plan without the CLAUDE.md leaves the delegate to figure out CC integration themselves — that's exactly the mess we're preventing.
- **Don't write outside the module folder.** All deliverables for Module 02 live in `modules/02-demand-planning/`. Period.
- **Don't promise the build will work.** You're producing the plan; the delegate's CC executes. The build success depends on their stack, their MCPs, their domain knowledge.
- **Don't auto-spawn projects.** Single-project hygiene applies even at kickoff. If the build plan references "Supabase project: <not in brain>", surface that to the delegate as a confirm-before-proceed: *"Stack doesn't name a Supabase project. Should I assume the build creates a new one, or do you already have one I should reference?"*

---

## Success looks like

- 5 files in the right folder *(or rendered in chat with copy-instructions)*
- Module status transitioned `recommended → planned` in brain
- Roadmap artifact updated with the new status pill
- *(if PM mirror accepted)* parent task + 5 phase tasks in ClickUp/Notion/Asana
- Delegate has an explicit terminal command to run + a clear protocol for what happens next

If the delegate `cd`s into the module folder, runs `claude`, and their CC immediately says *"I'm Module 02 — Demand Planning. Phase 1: Schema. Read for the build plan?"* — the skill worked.
