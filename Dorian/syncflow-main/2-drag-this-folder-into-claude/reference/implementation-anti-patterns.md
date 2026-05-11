# Implementation phase · anti-patterns

> The opposite of structure is chaos. Each rule below kills a specific mess Sim, Dorian, or future delegates would otherwise hit. Read alongside `implementation-phase.md`.

---

## 1 · Don't fork the brain

`brain.json` is the source of truth. The roadmap artifact, the disk mirror, the optional PM-tool tasks are all derived. Never let a second copy of state diverge.

| Symptom | Fix |
|---|---|
| Delegate edits status.json directly to bump a phase | Reject. Use `update-module-status` — the skill writes brain first, then status.json |
| Delegate emails *"actually we already deployed Module 02 yesterday"* and asks you to update | `update-module-status` — don't free-text-edit the brain |
| Two brain.json files in different stages on the delegate's Mac | Pick the one with later `last_updated_at`; archive the other; never silently merge |

---

## 2 · One folder per module, no scatter

Module artifacts live in `modules/0N-<slug>/`. Period. No exceptions.

| Mess | What you should do |
|---|---|
| Migrations in `~/Desktop/sql/` | Move to `modules/0N-<slug>/supabase/` |
| n8n exports in `~/Downloads/` | Move to `modules/0N-<slug>/n8n/` |
| Loom video in iCloud Drive shared with brand manager | Move to `_shared/looms/` and reference from the module README |
| Credentials inside the module folder | Move to `_shared/credentials/`. Per-module credentials means rotating them per module too — that's worse |

---

## 3 · Status updates only via skill, never ad-hoc

`update-module-status` is the only legitimate way to change a module's status. If you find yourself opening brain.json or status.json in an editor, stop.

Why: status changes trigger artifact re-emission, optional PM-tool sync, and `status_history` audit-trail entries. Ad-hoc edits skip all of that and produce drift between Cowork and disk.

---

## 4 · Naming maps to module `n`

Folders: `0N-<slug>` where `N` is the module number from brain.json. Single source of truth.

```
modules/01-control-plane/        ✓
modules/02-demand-planning/      ✓
modules/02-demand_planning/      ✗  (underscore — breaks slug pattern)
modules/Demand-Planning/         ✗  (capitalised — breaks predictability)
modules/demand-planning-v2/      ✗  (no number — can't index)
modules/02-NEW-demand-planning/  ✗  (don't fork; update in place)
```

Subfolders inside a module *(`implementation/`, `n8n/`, `supabase/`, `clickup/`)* — keep these names exactly as documented. Tools and other skills look for these paths.

---

## 5 · Don't pollute the delegate's other Claude Code projects

The delegate has *(or will have)* lots of other CC projects: personal stuff, other brand work, side projects. **Each of those has its own root CLAUDE.md.** We don't touch any of them.

Per-module CLAUDE.md is scoped to `modules/0N-<slug>/CLAUDE.md`. When the delegate `cd`s into that folder and runs `claude`, their CC reads our CLAUDE.md. When they `cd` somewhere else, our CLAUDE.md is invisible. **Folder = scope.**

If you ever feel tempted to write to `~/.claude/`, `~/CLAUDE.md`, or any path outside the brand's `~/syncflow-projects/<brand>/` tree: stop.

---

## 6 · Don't regenerate build plans by accident

`start-implementation` is idempotent. If a module folder already exists and the plan files are populated, the second call does NOT overwrite — it surfaces what's there and asks the delegate if they want to refresh.

Why: a delegate halfway through Phase 3 doesn't want their build plan reset because they typed *"start Module 02"* twice.

If they explicitly want regeneration: `update-module-status` to back the module up to `planned`, then run `start-implementation --force`.

---

## 7 · Credentials never per-module

`_shared/credentials/` only. Per-module credential storage means rotating per module too, which means stale credentials, which means broken builds. One credential location per brand, all modules pull from it via the standard env-var pattern *(documented in `auth-security-patterns.md`)*.

---

## 8 · The roadmap is alive, not a one-shot PDF

Status pills on Page 07 reflect current state. If a module is `phase_3_complete`, the artifact shows that. Re-emit the artifact on every `update-module-status` call so the delegate's view stays fresh.

The "fancy PDF, now what?" failure mode comes from treating the roadmap as a deliverable that ships once. It's a living artifact.

---

## 9 · Don't skip the T+4 audit

Sim's method P9: *"audit at T+4 weeks that the hours were really saved AND really redeployed."* The audit isn't optional. Without it, modules drift back to their pre-build state and nobody notices.

`audit_t4.scheduled_for` in the brain triggers the prompt on the right session. `audit-module-t4` runs the structured check. Don't accept *"yeah it's working"* without numbers.

---

## 10 · Hours saved must be redeployed

Sim P6: *"the hour saved must be redeployed, not just reclaimed."* A bottleneck killed but the time backfilled with admin or low-value coordination is a **failed** module, not a successful one.

`track-redeployment` captures what the recovered hours were used for. If the answer is *"more of the same lower-tier work"* or *"I dunno, it just freed up time"* — that's a flag to revisit the role, not a successful outcome.

---

## 11 · One Cowork project per brand

Sim has 7 brands. Don't try to fit all 7 into one Cowork project. Each brand gets its own Project, its own brain.json, its own filesystem subfolder. Strict separation. Cross-brand pattern recognition is v0.5+ — not now.

---

## 12 · Don't promise auto-deploy

syncflow is a consultant, not a workflow executor. The delegate's CC executes; syncflow plans + tracks. If you find yourself describing automation that runs migrations, deploys to Vercel, or otherwise ships production code from inside Cowork: stop. That's `provision-supabase` / `provision-n8n` / `provision-clickup` territory — v2, not v0.

---

## 13 · `tolerated` is terminal

If a module ends up `tolerated` *(Sim's three-option C: build cost > saving)*, that's a valid outcome. Don't try to drag it back into the active list. If the delegate wants to revisit in 6 months, they swap it out via `swap-module` or run a fresh `recommend-modules` cycle. `tolerated` modules stay tolerated until that happens.

---

## How to reason about it

When a delegate hits friction during the implementation phase, ask: *which of the four principles is this rubbing against?*

1. **Single source of truth** — is brain.json the canonical state, or are we duplicating?
2. **Standard layout** — does this file/folder match the documented convention?
3. **Per-module CLAUDE.md scope** — am I about to touch something outside `modules/0N-<slug>/`?
4. **Status lifecycle** — am I about to skip a transition or edit state ad-hoc?

If the answer to any of those points to a violation, stop and find the right path *(usually the right skill)* before proceeding.

The whole point is: a delegate six months in should have a clean, navigable, queryable system — not a rubble pile of half-built projects. Every rule above is in service of that.
