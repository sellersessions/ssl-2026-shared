# `project`

> **Execution rule (per `0-paste-this-into-custom-instructions.txt` § How you work).** Read this skill file in full before responding to any project trigger. Don't free-style. Cite the skill file in your reply.

**When**
- User says: `project list`, `projects`, `project show <id>`, `project rename <id> <name>`, `project status <id> <status>`, `project close <id>`, `project remove <id>`, "show me my projects", "what's running?", "list projects"
- After any CRO skill run (`optimize-listing`, `render`, `pinion`, `track-products`), the matching skill auto-creates / auto-updates a project entry — that logic lives in those skills, not here. This skill is the **manual maintenance + view** surface.

**Inputs**
- The sub-command (`list` / `show <id>` / `rename` / `status` / `close` / `remove`)
- In-context brain — specifically `brain.projects[]`
- Brain mutates in-place via working memory; persists when `florence-brain.json` is next emitted

**Tools**
- Cowork built-in `Write`
- Cowork built-in `update_artifact` for `florence-cockpit`
- No MCP calls; no skill chaining

**Outputs**
- `florence-cockpit` re-emitted with `tab-projects-active = "active"` so the Projects page is visible
- One-line chat acknowledgement (or short markdown table for `list` / `show`)

This skill is the **manual control surface** for the project tracker. Auto-creation lives in the CRO skills (`optimize-listing` Step 9, `render` Step 9, `pinion` Step 5.5, `track-products` Step 7).

---

## Project status taxonomy

| Status | When to pick |
|---|---|
| **`running`** | Work in flight — research underway, concepts queued, test live, designer brief out. Default for newly-created projects. |
| **`complete`** | All linked artifacts are emitted, the change is shipped or tested, no pending work. |
| **`blocked`** | Waiting on something external — Brand Registry, designer hours, marketplace approval. |
| **`parked`** | Deliberately deprioritised. Not abandoned, just not now. |

---

## Behaviour

### Sub-command — `project list` (or bare `projects`)

Render the cockpit with Projects tab active. Sort `brain.projects[]` by `updated_at` descending (newest first). Each project becomes one `<div class="project-row status-X">`.

Chat ack:

> {N} projects · {N-running} running · {N-complete} complete · {N-blocked} blocked. Open the Projects tab on the cockpit.

Skip the ack if the user just navigated; just render.

### Sub-command — `project show <id>`

Find the project in `brain.projects[]`. If not found, surface: *"No project matching `{id}`. `projects` lists everything."*

Otherwise render a chat-side detail dump (no artifact change):

```
{name} · {asin} · {status}

Purpose: {purpose}
Created: {created_at-pretty}
Updated: {updated_at-pretty}
Next: {next_steps}

Linked artifacts:
- {kind} → {artifact_id} (last updated {last_updated-pretty})
- ...

Recent invocations:
- {at-pretty} {skill}: {summary}
- ...
```

### Sub-command — `project rename <id> <new-name>`

Find the project. Update `name`. Append to `skill_invocations`: `{ skill: "project rename", at: now, summary: "Renamed to '{new-name}'" }`. Bump `updated_at`.

Re-emit cockpit on Projects tab. Chat ack: *"Renamed `{id}` → *{new-name}*."*

### Sub-command — `project status <id> <new-status>`

Validate `<new-status>` against the taxonomy (`running` / `complete` / `blocked` / `parked`). If invalid, list the four options and stop.

Find the project. Update `status`. Append to `skill_invocations`: `{ skill: "project status", at: now, summary: "Status: {old} → {new}" }`. Bump `updated_at`.

If new status is `complete`, set `next_steps` to `null` unless the user provided one with `--next "<text>"`.

Re-emit cockpit. Chat ack: *"`{id}` → *{new-status}*. {N} projects total · {breakdown}."*

### Sub-command — `project close <id>`

Shorthand for `project status <id> complete`. Same behaviour.

### Sub-command — `project remove <id>`

Florence asks for confirmation once: *"Remove `{id}` ({name})? This deletes the project entry but does NOT delete the linked artifacts (`{kinds-list}`) — those stay as standalone cards. **yes** to confirm."*

On `yes`, splice from `brain.projects[]`, re-emit cockpit. Linked artifact cards in the right panel are unaffected (still discoverable via `brain.history.artifacts[asin]`).

### Sub-command — `project link <project-id> <asin>` (advanced)

Manually link a project to an ASIN if auto-detection didn't catch it. Updates `asin` field, doesn't touch artifacts.

### Default behaviour when user types just `project`

Treat as `project list`.

---

## Project ID conventions

Auto-generated IDs from the CRO skills follow this pattern (skills, not this skill, generate them — documented here for reference):

```
proj_<asin>_<purpose-slug>_<seq>
```

Examples:
- `proj_B07XYZ4231_audit_001` — first CRO audit on B07XYZ4231
- `proj_B07XYZ4231_main_image_001` — first main image render run
- `proj_B07XYZ4231_main_image_002` — second main image render run (e.g. iterating after a Pinion test)
- `proj_no-asin_general_001` — projects without an ASIN (rare; e.g. brand-wide work)

Seq increments per `(asin, purpose)` pair so re-running `optimize-listing` on the same ASIN doesn't collide.

---

## Voice rules

- **Don't surface every project field in chat.** `project list` returns a counts summary + cockpit pointer. Detail lives on the cockpit Projects page.
- **Confirm before `project remove`.** Project entries are user-facing memory; deletion is reversible only if the user has `florence-brain.json` from before the deletion.
- **Don't propose status changes.** Florence updates status on user command (`project status …`) or via the auto-rules in the CRO skills (e.g. `pinion` flips a project to `complete` when test results come back). Never auto-`parked` or auto-`blocked`.
- **Append-only event log.** `skill_invocations[]` is append-only — manual edits via this skill add entries, never modify or delete prior entries.

---

## Don't

- Don't create projects from this skill. Projects are auto-created by the CRO skills that do real work (`optimize-listing`, `render`, `pinion`, `track-products`). This skill manages the resulting tracker; it doesn't seed it.
- Don't delete linked artifacts when removing a project. The dossier / research / concepts / tests artifacts are independent — they live in the right panel until the conversation ends.
- Don't auto-update status based on time. A project staying in `running` for 30 days isn't auto-`parked`. Status changes are user-driven.
- Don't merge projects automatically. If the user has two projects on the same ASIN with overlapping purposes (e.g. two audits run the same day), they stay distinct unless the user manually closes one or removes it.
- Don't render the cockpit if Florence is mid-flow in another skill. Update `brain.projects[]` and surface a one-line ack; defer cockpit re-emission until the active skill completes.
