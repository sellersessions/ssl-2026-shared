# `emit-roadmap-artifact` *(reference)*

> **The imperative for emitting artifacts lives in the system prompt, § *"Artifact emission"*.** That section specifies the Cowork MCP protocol: `Write` to disk, then call `create_artifact` *(first emission)* or `update_artifact` *(every re-emission)*. This file is reference material for the stage→content mapping — read it to know *what goes inside* each emission, not *how* to emit.

## Stage → content mapping

The roadmap is one evolving artifact with a **stable id `syncflow-roadmap`** *(no brand suffix — the brand surfaces via description and HTML contents, not the id)*. The artifact's html_path is also stable across the conversation; the file gets overwritten on each re-emission. Two MCP tools drive emission:

- **First emission** of `syncflow-roadmap` in the conversation → `create_artifact({ id: "syncflow-roadmap", html_path, description })`
- **Every subsequent emission** → `update_artifact({ id: "syncflow-roadmap", html_path, update_summary })`

Each emission carries updated HTML reflecting the current `progress.stage`:

| Milestone | Stage value | What populates |
|---|---|---|
**FOUR milestones total per a complete interview-to-roadmap flow** *(updated in pivot-13 — was 9 in pivot-9, dropped to 4 because the user found per-section emissions noisy and asked for explicit verification gates instead)*. Each milestone is both an artifact update AND a moment to confirm with the delegate before proceeding.

| Milestone | When | What changes | MCP call + update_summary |
|---|---|---|---|
| **1 · Stub** | First response after `let's start` | Generic cover *(syncflow wordmark, no brand)*; manifesto, **TOC, appendix all populate** *(static content)*; pages 02 + 04–09 locked. Progress 0%. | `create_artifact` with description `"syncflow · Connected Systems Roadmap (in progress)"` |
| **2 · Mid-interview verify** | After Section 3 (Stack) completes | Cover stamped with brand. Page 04 (Current state) fully populated with sprawl + glue-humans + CSV moments. Page 02 (Summary) partially populated. Progress 75%. | `update_artifact`, summary `"Stack mapped — verify before we sequence modules"` |
| **3 · Post-interview verify** | After Section 4 (Goals) completes | Page 02 fully populates with goals. All captured pages show data; modules + replacement table still locked. Progress 90%. | `update_artifact`, summary `"Interview complete — ready to derive recommendations?"` |
| **4 · Final** | After all derivations *(diagnose-sprawl → design-future-state → derive-replacement-table → recommend-modules)* run silently | All 11 pages populated. `progress.stage: "complete"`. Progress 100%. | `update_artifact`, summary `"Roadmap complete · 100%"` |

**No emissions between these milestones.** Specifically: do NOT emit after Section 1 (Business) or Section 2 (Team) — verify in chat instead with a short summary + "anything off?". The chat verification is enough at those points; the artifact update would be too noisy because page 02 wouldn't have meaningfully new content yet.

**Cross-session note:** if `restore-brain-from-knowledge` fires at the start of a new chat *(brain.json was in Project Knowledge)*, it does its own create_artifact at whatever stage the brain is at. That counts as Milestone 1 for that conversation. Subsequent emissions follow the cadence above as the user continues from where they left off.

**Sibling artifacts at Milestone 4 (`complete`):** alongside this skill's roadmap emission, `render-roadmap` step 8 fires `emit-build-plan-artifact` for the recommended-start module *(see `emit-build-plan-artifact.md`)*. The result is **three artifacts in the right panel** at the end of the session: `syncflow-roadmap` *(HTML PDF)*, `syncflow-brain` *(JSON brain)*, and `syncflow-build-plan-{n}` *(markdown PRD for the recommended-start module)*. The chat handoff copy below mentions all three; this skill emits the roadmap, but the user-visible end-state is the bundle.

**On corrections:** if the user corrects a fact mid-interview *(e.g. "actually we don't use SellerApp")*, update the in-context brain via `update-brain` but DO NOT re-emit the artifact immediately. The next scheduled milestone will reflect the correction. Exception: if the correction would change something already populated and visible in the artifact, re-emit with `update_summary: "Brain corrected — <what changed>"`.

**On re-renders:** user says *"re-render"* / *"regenerate the roadmap"*. `update_artifact` with current brain state, `update_summary: "Re-rendered on request"`. Doesn't add to the milestone count.

## Inputs needed for each emission

- `<filled_html>` — completed HTML string from `render-roadmap`
- The in-context `brain` object *(for description metadata)*
- `<stage>` — one of: `pre-interview` / `business` / `team` / `stack` / `goals` / `deriving` / `complete`
- The **stable id**: always `syncflow-roadmap` *(no brand suffix; never changes within a conversation)*
- The **stable html_path**: a working-directory file like `./syncflow-roadmap.html` *(absolute path; same path overwritten on every emission)*

## Validation before the MCP call

- `<filled_html>` should be self-contained — no `<script>` tags, no CDN imports *(no `esm.sh`, no `cdn.tailwindcss.com`, no `fonts.googleapis.com`)*. The Cowork artifact sandbox blocks them. Verify by searching the filled HTML for `<script` and externalised `<link rel="stylesheet"` — both should be absent.
- No `{{var}}` leakage on unlocked pages. Locked pages keep their literal placeholder copy *(they're rendered as static "Available after X" stubs, not React components)* — that's expected.
- If validation fails, halt and surface the failure to `render-roadmap` for a re-fill. Don't write a broken file or call the MCP with bad content.

## The Write → MCP-call sequence

For each emission:

1. `Write` the filled HTML string to the absolute path *(stable across the conversation; overwrite each time)*.
2. Call the right MCP tool:
   - **First emission ever** for this id → `create_artifact({ id: "syncflow-roadmap", html_path: "<path>", description: "syncflow · Connected Systems Roadmap (in progress)" })`
   - **Every subsequent emission** → `update_artifact({ id: "syncflow-roadmap", html_path: "<same path>", update_summary: "<short note about what changed>" })`
3. Verify the MCP call returned successfully. If it returned a validation error *(e.g. "id required, html_path required")*, you passed wrong arg names — check that you used `id` and `html_path` exactly *(not `identifier` / `content`)*. Surface the error to the delegate; don't silently retry.

## Tier 2 disk mirror *(power-user only — separate from the artifact write)*

If `<stage>` is `complete` AND filesystem MCP is configured AND the user opted in, ALSO write `output/<brand>/roadmap.html` to disk *(separate from the artifact's html_path)*. **Skip the disk mirror for intermediate stages** — interview-time emissions are artifact-only to avoid disk thrash. Note: the artifact's html_path is itself a file on disk — the "tier 2 mirror" is an additional copy in a structured `output/<brand>/` directory for git tracking / hand-edit / Obsidian use.

## Chat handoff per stage

For **intermediate stages** *(`pre-interview` post-brand / `business` / `team` / `stack` / `goals` / `deriving`)*: one short line. The delegate is mid-interview; don't break flow.

```
Roadmap updated · 50% · Team section captured. Continuing.
```

Then immediately advance to the next interview question or derivation step. Do **not** add bulleted next-steps mid-interview; they belong only at `complete`.

For the **brand-less first emission** *(stage `pre-interview`, before brand capture)*: the chat-side handoff is folded into `onboard-delegate`'s 4-paragraph intro — *"the roadmap is appearing in the right panel as we speak"*. No separate one-liner.

For **`complete` stage**: the full handoff with the next-step menu. **Lead with the recommended-start build plan as the obvious-default action.** The delegate has just finished the interview and seen the roadmap — they need to know what to do, not be presented with an open-ended menu.

**Two paths depending on whether implementation is already in flight:**

#### Path A — fresh complete-stage roadmap *(no modules past `recommended`)*

Format *(replace `Module 0X` and `<recommended_start_name>` with the actual recommended-start module from `brain.recommendations.modules` where `tag === "recommended start"`)*:

```
Roadmap done · Connected Systems Roadmap · {{brand_display}} (right panel →)
Plus: brain.json + Module {{recommended_start_n}} build plan, both downloadable
from the right panel. Three artifacts together = everything your tech lead needs
to drop into Claude Code on Monday.

Take 2 minutes — open the artifact and skim:
  • Page 02 (Summary) — what's about to happen
  • Page 04 (Current state) — your sprawl, named
  • Page 07 (Migration plan) — the modules in sequence; rung pills show what's reuse vs new build
  • Page 07.5 (Project Board) — kanban view of every module's lifecycle state
  • Page 09 (Closing) — your week-after picture

──────────────────────────────────────────
Your obvious next move:

  Module 0X · {{recommended_start_name}}  — the recommended start (and your foundation).

  Type "start Module 0X" and I'll do the full kickoff in one go:
    1. Generate the 5-phase build plan + verification plan
    2. Write the per-module CLAUDE.md (your Claude Code reads this when you cd in)
    3. Set up the module folder structure on your Mac (~/syncflow-projects/{{brand_slug}}/modules/0X-…/)
    4. Optionally mirror status to ClickUp / Notion / Asana if you use one
    5. Tell you the exact Terminal command to run to start Phase 1

  ~5 minutes; you'll come away with everything wired and a clear first action
  on your own machine.

  (Or: "plan it" if you just want the build plan and you'll set up the
  folder structure yourself.)

──────────────────────────────────────────
Other things you can say:

  • "save my brain"    → emit brain.json so you can pick up later in this project
  • "start Module N"   → kick off a different module (full setup)
  • "build plan for Module N"   → plan only, no folder setup
  • "tell me more about Module N"   → focused explainer, no re-rendering
  • "swap Module N for X"    → change the module list
  • "actually we don't use SellerApp" / "we just hired a brand manager"    → brain edit, surfaces consequences

  Plus 3-5 universal Amazon opportunities are flagged on Page 07 — those
  layer on top of the modules; we tackle them once Module 01 is in place.
```

#### Path B — implementation in flight *(any module past `recommended`)*

When re-emitting after `update-module-status` or after a status change has been recorded mid-session, the handoff is shorter and module-aware:

```
Roadmap re-emitted · Connected Systems Roadmap · {{brand_display}}
Status: {{status_summary}}  (e.g. "Module 02 phase_3_complete · Module 05 deployed · 5 others recommended")

Page 07 module pills updated:
  Module 02 · Demand Planning  →  phase_3_complete  (Phase 4 Surface next)
  ...

Next moves:
  • "open Module 02" — continue with Phase 4
  • "audit Module 05" — T+4 audit overdue
  • "status" — full portfolio view
  • Something else
```

**Why this shape:** Sim's pre-SSL test-run feedback flagged the prior handoff as *"it's just a fancy PDF, now what?"* The fix: **lead with one explicit next move** *(start the recommended-start module fully wired)*, name the exact phrase to type, and explain what they'll get. Open-ended menus push the delegate to choose; a leading recommendation tells them.

`start Module 0X` is preferred over `plan it` because it produces the per-module CLAUDE.md + folder structure *(see `start-implementation`)*. `plan it` still works but only generates the plan in chat — the delegate then sets up their own structure.

If `tag === "recommended start"` isn't set on any module *(unlikely at `complete` stage, but defensive)*, fall back to *"Type 'list modules' for the menu"* — never leave the delegate without a concrete next phrase.

## Cadence guardrail

Don't re-emit more than once per ~60 seconds during the interview *(skip if a section finishes a few seconds after the previous one due to terse answers — bundle the emit into the next milestone)*. The user shouldn't see the panel flicker. Re-emit only at genuine stage transitions, not per-fact.

## Re-emissions and the identifier

The identifier stays stable across the conversation *(after the one-time `pending` → `<brand-slug>` switch on brand capture)*, so the same artifact updates in place. The delegate sees the same panel slot update — no duplicates accumulate. The `progress.stage` field in the injected `reportData` is what controls which pages are locked vs unlocked at each emission.

---

## Manifest format (tier 2 only)

When tier 2 is on and an `output/<brand>/manifest.json` is written:

```json
{
  "schema_version": "1.0",
  "brand": "Ideal Direct",
  "brand_slug": "ideal-direct",
  "generated_at": "2026-05-05T14:32:00Z",
  "last_regenerated_at": "2026-05-05T14:32:00Z",
  "generated_by": "syncflow v0",
  "fact_count": 47,
  "interview_minutes": 11,
  "modules_count": 7,
  "featured_module": "Module 02 · Demand Planning",
  "artifact_identifier": "syncflow-roadmap-ideal-direct",
  "files": [
    "brain/business.md",
    "brain/team.md",
    "brain/stack.md",
    "brain/goals.md",
    "brain/interview-transcript.md",
    "roadmap.html"
  ],
  "regenerate_command": "Type 're-render the roadmap' to update from the brain"
}
```

---

## Don't

- Don't emit multiple artifacts for the same brand on re-render. Use the stable `identifier` so the artifact updates in place.
- Don't write to disk outside `output/<brand>/` — even in tier 2 mode.
- Don't open or auto-launch anything. The user clicks the artifact themselves.
- Don't say *"successfully emitted"* / *"all done!"*. Lead with what they have now and what they can do next.
- Don't promise the artifact will work everywhere. Document that it's optimised for Claude Desktop's artifact panel; downloaded HTML works in Chrome / Safari / Firefox.
- Don't include any references to filesystem operations in the chat handoff if tier 2 is off — the delegate has no `output/` folder to look at, only the artifact.
