# `emit-brain-artifact`

**When**
- Right after `emit-roadmap-artifact` at the end of the interview *(automatic, end of demo path)*
- User says: *"save my brain"* / *"export brain"* / *"give me a brain.json"* / *"how do I save this?"*
- Before the conversation gets too long — periodic auto-prompt: *"Want to save your brain so you can come back to it in a fresh conversation?"*

**Inputs**
- The in-context `brain` object

**Tools**
- Claude artifacts — emit a JSON artifact downloadable via the right panel
- *(power-user tier 2 only)* if filesystem MCP is configured AND the user opted in, also write `output/<brand>/brain.json` to disk

**Outputs**
- A `brain.json` artifact in Claude Desktop's right panel, downloadable
- Hand-off message instructing the delegate to drag the downloaded file into Project Knowledge for tier-1 persistence
- *(tier 2 only)* same file mirrored to disk

---

## Why this skill exists

**Tier-1 persistence.** The default flow keeps the brain in conversation context — it survives within that conversation but disappears if the delegate starts a new chat. To bring the brain back later *(next week, next month)*, they need to save it.

This skill emits the brain as a single `brain.json` artifact. The delegate downloads it from the artifact panel, then drags it into the Project Knowledge files. Future conversations in that project start with the brain auto-restored *(via `restore-brain-from-knowledge`)*.

This is the v0 persistence story. Cheap, no infrastructure, all local.

---

## Behaviour

1. **Validate the brain.** Check it conforms to `templates/brain-schema.json`:
   - `schema_version` is set to `"1.0"`
   - All four `sections` exist (even if empty)
   - `brand`, `brand_display`, `captured_at` are populated
   - `last_updated_at` is fresh *(now)*

   If anything's missing, halt and report what's incomplete. Do NOT emit a partial brain — that breaks `restore-brain-from-knowledge` later.

2. **Refresh metadata.** Update `last_updated_at` to now. Re-count `fact_count` from the actual section contents.

3. **Serialise to JSON.** Pretty-print with 2-space indent. UTF-8.

4. **Emit via the Cowork MCP protocol** *(per system prompt § Artifact emission)*:
   - **Write to disk.** Use the `Write` tool to write the serialised JSON to a stable working-directory path — e.g. `./syncflow-brain.json`. Same path is overwritten on every re-emission.
   - **First emission of `syncflow-brain` in this conversation** → call `create_artifact({ id: "syncflow-brain", html_path: "<absolute path>", description: "syncflow · brain export · <brand>" })`. *(Yes, the field is named `html_path` even for a JSON artifact — that's the MCP's quirk; the file extension can be `.json`.)*
   - **Every subsequent emission** → call `update_artifact({ id: "syncflow-brain", html_path: "<same path>", update_summary: "<X> facts captured · last updated <ts>" })`.
   - **Stable `id` `syncflow-brain` for the whole conversation** — never invent new ids, never qualify with the brand slug.
   - If the MCP returns a validation error, halt and surface it. Don't silently fall back to chat JSON.

5. **(Tier 2 only)** If filesystem MCP is configured AND the user opted in, also write a copy to `output/<brand>/brain.json` *(separate from the artifact's html_path; this is the structured-output mirror for git tracking / hand-edit / Obsidian use)*.

6. **Hand off in chat** — instruct the delegate on the drag-into-Knowledge step. This is the moment that determines whether their brain survives this conversation.

   Format:

   ```
   Brain saved → brain.json · Cordova  (right panel →)
   
   To pick this up later in a new conversation:
   
     1. Click the artifact's Download button.
     2. Drag the downloaded brain.json file into this Project's
        Knowledge files (the same place you dropped the bundle folders
        during setup).
     3. Next conversation in this project, type "let's continue" —
        I'll read the brain back in and pick up where we left off.
   
   You can re-export anytime by saying "save my brain". The artifact
   updates in place, so you only ever need the latest brain.json in
   Knowledge.
   ```

7. **For re-emits:** stable `identifier` means the artifact updates in place. Tell the delegate they should replace the prior `brain.json` in Project Knowledge with the new download — don't accumulate stale brain files.

8. **Disk mirror *(tier 2 only — filesystem MCP enabled)*.** After the artifact emission succeeds, ALSO write the same brain.json to `~/syncflow-projects/<brand-slug>/brain.json`. This is the disk-mirror channel that lets the delegate's Claude Code sessions read brain context from disk *(via the per-module CLAUDE.md's `../../brain.json` pointer — see `reference/per-module-claude-md-template.md`)* and lets `restore-brain-from-knowledge` reconcile statuses against disk on next session.

   - If `~/syncflow-projects/<brand-slug>/` doesn't exist: don't auto-create. That's `init-implementation-project`'s job. Just emit the artifact and skip the disk write.
   - If the disk path exists but the file write fails *(permissions / disk full)*: surface as a soft warning but don't fail the artifact emission. *"Artifact emitted ✓. Disk mirror failed (permission denied at ~/syncflow-projects/&lt;brand&gt;/brain.json). Run `init-implementation-project` to fix the folder permissions, or skip the mirror — the artifact + Knowledge file are still your canonical save."*
   - The disk mirror is **always** authoritative-from-Cowork. The delegate's CC reads it as context but doesn't write to it. *(Per-module status updates go through `status.json` files, NOT through brain.json.)*

---

## When to auto-prompt the user

Periodically *(not every message — once per natural breakpoint)*:

- **After interview completes + roadmap is emitted** *(highest priority — this is the canonical save moment)*
- **After a significant brain update** *(swap-module, update-brain, multi-fact correction)*
- **When the conversation is getting long** *(soft signal — user might want to save before context gets unwieldy)*
- **Never automatically more than once per 10 user messages** — don't nag

When auto-prompting:

> *"Heads up — the brain's grown by 12 facts since you last saved. Want me to emit a fresh brain.json artifact you can drop in Project Knowledge?"*

---

## Don't

- Don't emit a partial brain. If validation fails, halt and report.
- Don't emit a brain artifact if the brain is empty (interview not started). Tell the user there's nothing to save yet.
- Don't say *"saved!"* / *"all done!"* — the brain isn't saved until the delegate drags it into Knowledge. Lead with the drag instruction.
- Don't promise the artifact persists outside Claude Desktop. If they close Claude Desktop without downloading, the artifact is gone *(though the in-context brain survives within the conversation)*.
- Don't fabricate filesystem operations when tier 2 isn't on. Default flow emits the artifact only.
- Don't emit duplicate artifacts. Use the stable identifier so re-emits update the existing artifact rather than spawn new ones.
- Don't include the conversation transcript in the brain artifact unless explicitly asked. Transcripts can be large; brain.json should stay under ~50KB for fast restore.
