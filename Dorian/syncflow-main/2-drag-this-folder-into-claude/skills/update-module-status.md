# `update-module-status`

> **The only legitimate way to change a module's status.** Every transition flows through this skill so brain.json stays canonical, the artifact re-emits, and *(if configured)* the PM-tool mirror updates. Read alongside `reference/implementation-phase.md` Principle 4 + `reference/implementation-anti-patterns.md` rule 3.

**When**
- User says: *"Phase N done on Module 0M"* / *"Module 0M deployed"* / *"mark Module 0M as built"* / *"Module 0M is in progress"* / *"Module 0M tolerated"* / etc.
- After `start-implementation` fires *(automatically transitions `recommended → planned`)*.
- After `audit-module-t4` runs *(transitions `redeployed → audit_t4_passed` or back to `built_v1` if audit failed)*.
- After `track-redeployment` runs *(transitions `deployed → redeployed`)*.
- When `restore-brain-from-knowledge` reads disk `status.json` files and finds drift between brain.json and disk *(reconciliation path)*.

**Inputs**
- `<module-n>` — the module to update *(e.g. "02")*
- `<new-status>` — target status from the lifecycle enum
- `<note>` *(optional)* — why this transition; appended to `status_history`

**Tools**
- `read-brain` — inspect current module state before transitioning
- chat — confirm the transition with the delegate before applying
- in-context brain mutation — write `status`, `last_status_update`, append `status_history`
- `emit-roadmap-artifact` — re-emit so Page 07 module-card status pills reflect the change
- *(if `pm_tracking.tool` set)* the matching MCP — sync the change to ClickUp / Notion / Asana

**Outputs**
- Updated `brain.recommendations.modules[i]` with new status, timestamp, history entry
- Re-emitted roadmap artifact
- *(optional)* PM-tool task status updated
- One-line confirmation in chat

---

## The lifecycle *(must memorise — this is what you validate against)*

```
recommended
   → planned             (start-implementation fires)
   → in_progress         (delegate confirms started)
   → phase_1_complete    (Phase 1 verification passed)
   → phase_2_complete
   → phase_3_complete
   → phase_4_complete
   → phase_5_complete
   → built_v1            (all 5 phases done, full verification green)
   → deployed            (running unattended — Sim P5)
   → redeployed          (recovered hours moved to higher-value work — Sim P6)
   → audit_t4_passed     (T+4 audit passed — hours saved AND redeployed AND tool up)
   ← tolerated           (terminal — Sim's three-option C; from any state)
```

Backwards transitions are allowed but **require a `note`**. e.g. `phase_3_complete → phase_2_complete` because a regression was found in Phase 2.

`tolerated` is terminal — modules don't come back without a fresh `recommend-modules` cycle.

---

## Behaviour

### 1. Identify the module

Parse the user's request. Resolve `<module-n>` from:
- Explicit number: *"Module 02"* → `n: "02"`
- Module name: *"Demand Planning is deployed"* → match against `brain.recommendations.modules[*].name`
- Pronoun / ambiguous: *"that one's done"* → ask which: *"Which module — 02 (Demand Planning) or 04 (Branded Documents)?"*

If no match, return: *"I don't see a module matching that. Modules are: 01 Control Plane, 02 Demand Planning, ..."*. Don't guess.

### 2. Validate the transition

Read current `status` from `brain.recommendations.modules[i].status`. Determine the new status from the user's words + context.

Check the transition is valid:

| From | Valid forward transitions | Notes |
|---|---|---|
| `recommended` | `planned`, `tolerated` | Skipping straight to `tolerated` is fine — sometimes Sim's three-option C decides the build cost > saving before a plan ever generates |
| `planned` | `in_progress`, `tolerated` | Delegate started CC session OR decided not to build it |
| `in_progress` | `phase_1_complete`, `tolerated` | First milestone or abort |
| `phase_N_complete` | `phase_(N+1)_complete`, `tolerated`, OR backward to `phase_(N-1)_complete` *(with note)* | Forward = next milestone; backward = regression caught |
| `phase_5_complete` | `built_v1`, `tolerated` | All phases done → built, OR abort |
| `built_v1` | `deployed`, `tolerated` | Built but not yet shipped to cloud unattended |
| `deployed` | `redeployed`, `tolerated`, OR backward to `built_v1` *(with note — deployment failed)* | Sim P5 satisfied — running unattended |
| `redeployed` | `audit_t4_passed`, OR backward to `deployed` *(with note — redeployment didn't stick)* | Hours moved to higher-value work; awaiting T+4 |
| `audit_t4_passed` | *(no further transitions; terminal-success)* | Audit passed — module is closed-loop |
| `tolerated` | *(terminal — only via fresh recommend-modules)* | |

If the transition is invalid:
> *"Module 02 is currently `phase_3_complete`. Going straight to `deployed` skips phase_4, phase_5, built_v1. That's not a valid transition. Did Phase 4 + 5 actually complete? Talk me through what happened."*

If valid, continue.

### 3. Confirm with the delegate

For non-trivial transitions *(anything past `phase_N_complete`, especially `built_v1` / `deployed` / `redeployed` / `audit_t4_passed` / `tolerated`)*: confirm before applying.

> *"Confirming: Module 02 (Demand Planning) `built_v1` → `deployed`. That means it's running unattended in the cloud, monitored, with alerts wired. Is that accurate?"*

For routine transitions *(`recommended → planned`, `planned → in_progress`, `phase_N → phase_(N+1)_complete`)*: skip confirmation, just apply.

### 4. Apply the update

Write to in-context brain:
```
brain.recommendations.modules[i] = {
  ...existing,
  status: <new_status>,
  last_status_update: <ISO now>,
  status_history: [
    ...existing,
    { status: <new_status>, at: <ISO now>, note: <user-provided or auto-generated> }
  ],
  // also update auxiliary fields per transition:
  // → planned: started_at = ISO now
  // → phase_N_complete: current_phase = N+1 (or null if N=5)
  // → built_v1: current_phase = null
  // → deployed: audit_t4.scheduled_for = ISO now + 28 days
}
```

### 5. Disk sync *(if filesystem MCP enabled)*

Update `~/syncflow-projects/<brand-slug>/modules/0N-<slug>/status.json` to reflect the new status. The disk file holds the per-module phase breakdown; brain.json holds the top-line status.

### 6. PM-tool sync *(if `pm_tracking.tool` set)*

If the module has `pm_tracking.tool: "clickup"` and `pm_tracking.task_id_per_phase`:
- For phase transitions *(`phase_N_complete`)*: mark the matching ClickUp task as Done.
- For built/deployed/redeployed/audit transitions: update the parent task status field.

Don't do this if the delegate hasn't accepted PM mirroring *(see `recommend-pm-integration`)*. The brain stays primary regardless; PM mirror is opt-in convenience.

### 7. Re-emit the roadmap artifact

Call `emit-roadmap-artifact` *(or `update_artifact` directly if a roadmap artifact exists)*. Page 07 module cards re-render with the new status pill. The delegate sees the change immediately.

### 8. Confirm in chat

One short line. Format:

```
Module 02 · Demand Planning  →  deployed
T+4 audit scheduled for 2026-06-04. I'll surface it then.

Anything else? Or "status" for the full implementation overview.
```

For `audit_t4_passed`: include the audit summary inline:

```
Module 02 · Demand Planning  →  audit_t4_passed
Hours saved: 18/wk (target was 12+) ✓
Redeployed to: Adam working on US scaling decisions
Tool uptime: 99.7%

Closed-loop. Nothing else needed on this one. Want to start the next?
```

For `tolerated`: include the rationale:

```
Module 06 · Creator CRM  →  tolerated
Rationale: build cost (30 hrs) > saving (~3 hrs/wk for Adam). Revisit in 6 months
when SKU count grows.

Logged in status_history. Won't be flagged again until you re-run recommend-modules.
```

---

## Edge cases

- **Same status, no actual change** *(e.g. user types "Module 02 in progress" twice)*: idempotent — just confirm *"Module 02 already in progress, no change"*. Don't add a duplicate `status_history` entry.

- **User asserts a status they can't actually validate** *(e.g. "Module 02 deployed" but the build plan was never started)*: push back. *"I don't have evidence Module 02 went through phases 1-5. Walk me through what was built — or did you mean to mark a different module?"*

- **Delegate's CC session pre-emptively wrote `status.json` past the brain** *(filesystem MCP enabled)*: when `restore-brain-from-knowledge` reads it on session start, treat the disk state as the **proposed** new state and confirm with the delegate before writing brain. *"Disk says Module 02 is at phase_3_complete since yesterday. Brain has it at phase_2_complete. Confirm: did Phase 3 actually pass verification?"*

- **Phase verification failed** *(user types "Phase 3 didn't pass verification")*: don't transition forward. Stay at `phase_2_complete`. Append a `status_history` entry with the failure note. Suggest next move: *"Phase 3 verification failed. Want to go back to `generate-build-plan` for Phase 3 with the failure noted as a constraint?"*

- **Ambiguous "done"** *("Module 02 is done")*: ask. *"Done = built_v1 (all 5 phases passed) or deployed (running unattended)?"* Don't infer.

- **PM mirror sync fails** *(ClickUp API timeout, rate limit)*: brain update succeeds; PM sync logged as a soft failure; surfaced to delegate in confirmation. *"Module 02 → deployed in syncflow. ClickUp task didn't sync (API timeout). Want me to retry, or fix it manually?"*

---

## Don't

- **Don't change status without going through this skill.** Every other path *(direct edits, side-channel updates)* is an anti-pattern.
- **Don't infer a transition from vague language.** *"Going well"* is not `phase_2_complete`. Ask.
- **Don't backward-transition silently.** Backward steps require a `note` field explaining the regression.
- **Don't skip phases.** `in_progress → phase_3_complete` directly is invalid even if the delegate insists Phase 1 + 2 don't apply. Use `tolerated` for individual phases that genuinely don't apply *(rare — usually means the module shape is wrong)*.
- **Don't apply `tolerated` casually.** It's terminal. Confirm explicitly: *"`tolerated` means we're parking this module — it doesn't come back without a fresh recommend cycle. Sure?"*
- **Don't update the artifact more than once per status change.** One status change → one re-emission. Batch multiple transitions if they happen in quick succession *(e.g. delegate types "Phases 1 and 2 both done in this session")*.

---

## Why this matters

Every cherry-pick we made *(Simplicity Ladder, Universal Wins, the bible)* feeds into modules; every module's lifecycle is tracked here. If status updates are sloppy, the artifact lies, the PM mirror drifts, and the audit trail becomes useless. This skill is the gatekeeper.

`update-module-status` is the simplest skill in the implementation phase but the most-frequently-called. Get this right; the rest of the phase works.
