# `emit-build-plan-artifact`

**When**
- Auto-fired by `render-roadmap` step 7 at `progress.stage === complete` AND a recommended-start module exists *(emits the recommended-start module's build plan as a sibling to the roadmap artifact)*
- User says: *"emit Module N's build plan as an artifact"* / *"give me the build plan as a downloadable file"* / *"send me Module 02's PRD"*
- Re-emitted on user request: *"refresh the Module 02 build plan"* / *"re-render the build plan"*

**Inputs**
- `<module-n>` — which module's plan to emit *(e.g. `"02"`)*. Default: the recommended-start module *(`brain.recommendations.modules[*]` where `tag === "recommended start"`)*.
- The in-context `brain` object *(for stack-specific phasing + brand metadata)*

**Tools**
- `generate-build-plan` *(in artifact-emission mode — see `generate-build-plan.md` § Artifact-emission mode)* — produces the markdown body
- `Write` — write the markdown to a stable disk path *(`./syncflow-build-plan-<n>.md`)*
- Cowork MCP `create_artifact` / `update_artifact` — emit / refresh the markdown artifact in the right panel

**Outputs**
- A `syncflow-build-plan-{n}.md` artifact in Cowork's right panel, downloadable as markdown
- One-line chat handoff confirming the emission *(if fired by user; silent otherwise — `render-roadmap` handles the chat handoff for the auto-emit path)*

---

## Why this skill exists

`render-roadmap` already emits two artifacts: `syncflow-roadmap` *(the HTML PDF)* and `syncflow-brain` *(the JSON brain)*. Sim's feedback after the Track A/B/C re-test asked for the third side of the triangle:

> *"are there any md files to share if we want to implement in Claude Code MVPs... where is the plan?"*

The build plan exists — `generate-build-plan` produces it on demand in chat — but it never made it into a downloadable artifact. A delegate who ends the syncflow session has the roadmap PDF + brain.json on their desktop; they don't have the per-module PRD. To start Phase 1, they have to re-open Cowork and type *"build plan for Module 02"* to get the plan into their session.

This skill closes the loop: when the roadmap completes, the **recommended-start module's** build plan auto-emits alongside it. The delegate downloads three artifacts together — roadmap, brain, build plan — and walks away with everything a tech lead needs to drop into Claude Code on Monday.

**Only the recommended-start module's plan auto-emits.** Pre-rendering all 7 modules adds ~30-50K tokens per render *(7 × 5-8K each)* and most won't be used in v0. Other modules' plans emit on-demand: `start Module 0N` *(creates the on-disk folder structure with build-plan.md)* OR an explicit *"emit Module 0N's build plan as an artifact"* call to this skill.

---

## Behaviour

### 1. Resolve the module

Determine `<module-n>`:

- **Auto-emit path** *(triggered by `render-roadmap`)*: read `brain.recommendations.modules` and find the entry where `tag === "recommended start"`. Use its `n` *(e.g. `"02"`)*. If no module is tagged recommended-start *(unusual at `complete` stage but defensive)*, halt — don't pick a default. Surface to `render-roadmap` so it can ask the user which module to emit.
- **User-invoked path**: parse the user's request for an explicit module number or name *(same logic as `update-module-status` § 1)*. If ambiguous, ask which.

If the resolved module's `status === "tolerated"`: don't emit. Tolerated modules don't get build plans. Surface: *"Module 0N is tolerated — no build plan to emit. Did you mean a different module?"*

### 2. Generate the markdown body

Call `generate-build-plan` with `<output-mode> = "artifact"`. It returns the structured 5-phase plan + verification + risks as a single markdown body string *(see `generate-build-plan.md` § Artifact-emission mode for the exact header/footer shape)*.

Validate the returned string:

- Starts with `# Build plan · Module {{n}} · {{name}}`
- Contains `## PHASE 1 · Schema`, `## PHASE 2 · Ingestion`, `## PHASE 3 · Logic`, `## PHASE 4 · Surface`, `## PHASE 5 · Deploy + monitor` *(or "N/A — this module doesn't need this phase" inline)*
- Contains `## Verification plan` near the bottom
- Contains `## Status update protocol` at the bottom
- No `{{var}}` leakage *(all placeholders substituted)*

If validation fails, halt and surface the failure to the caller. Don't emit a partial plan — that's worse than no artifact.

### 3. Pick the stable artifact ID + path

- **Artifact ID:** `syncflow-build-plan-{{n}}` *(e.g. `syncflow-build-plan-02` for module 02)*. Stable for the conversation; never invent new IDs, never qualify with the brand slug.
- **Disk path:** `./syncflow-build-plan-{{n}}.md` *(absolute path; same path overwritten on every re-emission)*. The path is stable so `update_artifact` always points at the same file.

One artifact per module per conversation. If the delegate emits Module 02's plan + then Module 04's plan in the same session, that's two artifacts *(`syncflow-build-plan-02` and `syncflow-build-plan-04`)* — both panels co-exist.

### 4. Emit via the Cowork MCP protocol

Per the system prompt § *"Artifact emission"*:

- **Write to disk.** Use the `Write` tool to write the markdown body to the stable path. Same path overwritten on every re-emission.
- **First emission of `syncflow-build-plan-{n}` in this conversation** → call `create_artifact({ id: "syncflow-build-plan-{n}", html_path: "<absolute path>", description: "syncflow · build plan · Module {n} · {name} · {brand}" })`. *(Yes, the field is named `html_path` even for a markdown artifact — that's the MCP's quirk; the file extension can be `.md`.)*
- **Every subsequent emission** → call `update_artifact({ id: "syncflow-build-plan-{n}", html_path: "<same path>", update_summary: "<short note about what changed>" })`. Common update_summary values: *"Re-rendered after brain edit"*, *"Phase 2 verification updated"*, *"Stack revision · n8n → Make"*.
- If the MCP returns a validation error, halt and surface it. Don't silently fall back to chat output.

### 5. Hand off in chat

#### Auto-emit path *(fired by `render-roadmap`)*

Don't add a separate handoff line. `render-roadmap`'s `complete`-stage handoff *(see `emit-roadmap-artifact.md` § Path A)* mentions the build-plan artifact as part of the *"three artifacts"* line:

> *"Roadmap done · Connected Systems Roadmap · {{brand}} (right panel →)*
>  *Plus: brain.json + Module {{recommended_start_n}} build plan, both downloadable from the right panel."*

The build plan is part of the bundle, not a separate event. Adding a second handoff line after the roadmap one would be noisy.

#### User-invoked path *(explicit emit request)*

One short line. Format:

```
Build plan emitted → syncflow-build-plan-02.md · Module 02 · Demand Planning  (right panel →)

Drop the markdown into Claude Code as the per-module PRD. Phase 1 starts at
the top of the file — no setup needed beyond `cd modules/02-demand-planning/`.

Re-emit anytime by saying "refresh the Module 02 build plan".
```

### 6. Re-emits

Stable artifact ID + stable disk path means the panel updates in place. Tell the delegate they should replace the prior `syncflow-build-plan-{n}.md` in their downloads folder with the latest version — don't accumulate stale build plans.

Common re-emit triggers:

- User edits the brain *(stack revision, owner change)* → re-derive the plan
- A phase verification fails → re-derive with the failure noted as a constraint *(per `update-module-status` § "Phase verification failed")*
- User explicitly asks: *"refresh the Module 02 build plan"*

### 7. Disk mirror *(tier 2 only — filesystem MCP enabled)*

If filesystem MCP is configured AND the user opted in, ALSO write the markdown to `~/syncflow-projects/<brand-slug>/modules/<n>-<slug>/build-plan.md` *(same path that `start-implementation` writes to)*. The artifact and the disk file stay in lockstep; the delegate's tech lead reads from disk in Claude Code, the delegate downloads from the artifact panel — same content.

- If `~/syncflow-projects/<brand-slug>/modules/<n>-<slug>/` doesn't exist *(start-implementation hasn't fired)*: don't auto-create. The artifact is enough on its own — disk mirror is a convenience, not a requirement.
- If the disk write fails *(permissions / disk full)*: surface as a soft warning, don't fail the artifact emission. *"Artifact emitted ✓. Disk mirror failed — your downloaded markdown is still your canonical PRD."*

---

## When NOT to emit

- **Stage isn't `complete`.** The auto-emit path is gated on `progress.stage === complete`. Mid-interview, the build plan would be derived from a sparse brain — too unreliable. Surface to the caller and skip.
- **No recommended-start module exists** *(auto-emit path)*. Halt; let `render-roadmap` decide the fallback.
- **Module is tolerated.** No plan to emit *(see § 1)*.
- **Brain is too thin to support the archetype** *(e.g. `recommend-modules` recommended Demand Planning but `stack.md` is missing inventory tools)*. Surface the gap to the caller; don't emit a fabricated plan.
- **Artifact panel quota exhausted** *(rare; Cowork limits concurrent artifacts)*. Surface and let the delegate decide which artifact to drop.

---

## Don't

- **Don't emit a partial plan.** If `generate-build-plan` returns a body that fails validation *(missing phases, unsubstituted placeholders)*, halt — don't write a half-broken artifact.
- **Don't accumulate per-conversation duplicates.** Stable artifact ID + stable disk path; re-emits update in place.
- **Don't auto-emit plans for modules that aren't recommended-start.** v0 only auto-emits the one. Others emit on demand. Pre-rendering all 7 is a v0.5 deferred item.
- **Don't ship a markdown body without `## Status update protocol` at the bottom.** That section names the trigger phrases the delegate paste back into Cowork *(`Phase 1 done on Module 02`)* — without it, the bidirectional state loop *(see `update-module-status`)* breaks.
- **Don't promise the artifact persists outside Claude Desktop.** If the delegate closes Cowork without downloading, the artifact's gone *(though the in-context plan survives within the conversation)*.
- **Don't auto-emit at every stage transition.** Auto-emit fires only at `complete`. Earlier stages don't have the data the plan needs *(prerequisites, acceptance metrics, owner)*.
- **Don't rewrite `generate-build-plan`'s output.** This skill is a thin wrapper: derive → validate → emit. The plan content belongs to `generate-build-plan`; this skill owns the artifact lifecycle.
