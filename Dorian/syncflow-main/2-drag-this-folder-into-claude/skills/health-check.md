# `health-check`

**When**
- User says: *"/health-check"* / *"is this set up right?"* / *"are we good to go?"*
- Auto-fired once after `onboard-delegate` finishes — before the interview starts — to confirm the session is wired correctly
- User reports something feels off but isn't sure what

**Inputs**
- The current Claude Desktop Project state (Knowledge files, system prompt presence, conversation history)
- *(power-user tier 2 only)* the bundle's filesystem MCP if configured

**Tools**
- Project Knowledge inspection — list attached files, verify expected ones are present
- working memory — confirm the in-context `brain` exists if interview started
- chat — emit a structured health summary

**Outputs**
- A green / yellow / red status report covering 5–8 system checkpoints
- If anything is red, a single concrete next-step instruction

---

## Why this skill exists

**Setup validation from inside the chat.** Setup is two actions: paste `0-paste-this-into-custom-instructions.txt` into the Project's Custom Instructions, and drag `2-drag-this-folder-into-claude/` into Project Knowledge. The agent can't tell from outside whether either step completed correctly.

This skill closes that gap. The agent inspects its own session state and reports back.

---

## Behaviour

Run through the checks in order. For each, emit one of:
- ✓ **green** — passed, no action needed
- △ **yellow** — passed but suboptimal, advisory note
- ✗ **red** — failed, with a one-line fix

### Check 1 · System prompt loaded

The system prompt was pasted into Custom Instructions from `0-paste-this-into-custom-instructions.txt`. Test: are the worldview principles, the 8 personas, and the trigger phrase map all live in your context?

- ✓ if yes
- ✗ if you can't recall the 12 worldview principles or the trigger phrases — Custom Instructions is probably empty. Fix: *"Open `0-paste-this-into-custom-instructions.txt` from your `~/syncflow/` folder. Select all (⌘A), copy (⌘C). Open this Project's **Custom Instructions** panel, paste (⌘V), save. Then type `let's start` again."*

### Check 2 · Project Knowledge contents

The folder `2-drag-this-folder-into-claude/` contains `00-syncflow-system-prompt.md` plus 5 subfolders: `prompts/`, `skills/`, `templates/`, `reference/`, `integrations/`. All should be loaded.

- ✓ all six present
- △ missing optional subfolders *(integrations or reference)* — interview will work but integration recommendations and persona depth may be limited
- ✗ missing core subfolders *(prompts/, skills/, templates/)* — fundamental skill-resolution will fail. Fix: *"Re-drag the entire `2-drag-this-folder-into-claude/` folder into Project Knowledge — looks like only some files made it across."*

### Check 3 · In-context brain

If `init-brain` has fired, the brain should exist with at least `schema_version`, `brand`, `brand_display`, and the 4 section objects.

- ✓ brain exists with valid structure
- △ brain exists but is empty *(no facts captured)* — expected if interview hasn't started yet
- ✗ brain references a different brand than this Project's name suggests — surface the mismatch
- N/A if onboarding hasn't completed yet

### Check 4 · Restored brain *(if applicable)*

If a `brain*.json` was found in Project Knowledge by `restore-brain-from-knowledge`:

- ✓ restored cleanly, schema-valid, brand matches
- △ restored but stale *(last_updated_at > 30 days ago)* — flag, ask if still relevant
- ✗ schema version mismatch or validation failed — surface the error

### Check 5 · Filesystem MCP *(tier 2 only — skip if not configured)*

- ✓ MCP server `syncflow-fs` is connected and shows read+write tools
- △ connected but read-only — disk-mirror won't work; brain can be inspected from disk but not written
- ✗ MCP not connected — tier 2 unavailable; default flow still works

### Check 6 · Claude account tier

Some features need Pro/Team:
- ✓ Project Knowledge upload working, artifact panel visible — Pro/Team active
- ✗ if any of the above are blocked — Free tier limitation. Fix: *"syncflow requires Claude Pro or Team for Project Knowledge + Artifacts. Upgrade at claude.ai/upgrade."*

### Check 7 · Available skills *(spot check)*

Pick 3 random skills from `skills/` and confirm you can locate and read each. If any aren't findable, Project Knowledge isn't fully indexed yet *(can take a minute on first attach)* or the folder wasn't fully dragged in.

- ✓ all 3 found
- ✗ any missing — Fix: *"Project Knowledge may still be indexing. Wait 60 seconds and re-run /health-check. If still failing, re-drag the 2-drag-this-folder-into-claude folder."*

### Check 9 · Artifact emission *(critical — pivot-10)*

The roadmap is delivered as a Claude artifact. If the Artifacts capability is disabled at the account/org level, OR if the system prompt's `## Artifact emission` imperative block is missing, **no artifact will appear** even though the rest of syncflow seems to work.

- ✓ if you (the agent) can recall the system prompt's `## Artifact emission` section AND can confirm you would emit `syncflow-roadmap-pending` on the first response of a fresh conversation
- △ if you can recall the section but the user reports no artifact in the right panel — likely the Artifacts capability is disabled. Fix: *"Open Claude Desktop → Settings → Capabilities → confirm **Artifacts** is on. On Team/Enterprise plans, this may need to be enabled by your org admin."*
- ✗ if you can't recall the section or the identifier patterns *(`syncflow-roadmap-<brand-slug>`, `syncflow-brain-<brand-slug>`)* — the system prompt is incomplete. Fix: *"Re-paste `0-paste-this-into-custom-instructions.txt` into Custom Instructions. Make sure the file you copied includes the `## Artifact emission` block near the top. Save. Start a fresh chat."*

### Check 8 · Templates

`templates/dashboard-artifact.html`, `templates/report.html`, `templates/_placeholders.md`, `templates/brain-schema.json` should all be present in Project Knowledge.

- ✓ all four present
- ✗ any missing — Fix: *"Re-drag the 2-drag-this-folder-into-claude folder into Project Knowledge."*

---

## Output format

Compact, scannable. Always end with a clear next step.

```
syncflow · health check · Cordova

  ✓ System prompt loaded (12 principles, 8 personas, 22 trigger phrases recognised)
  ✓ Project Knowledge: prompts/, skills/, templates/, reference/, integrations/
  ✓ In-context brain: schema 1.0, Cordova, 47 facts captured
  ✓ Pro/Team account active
  ✓ Skills indexed (sampled 3, all readable)
  ✓ Templates present (4/4)
  N/A Filesystem MCP (tier 2 not configured — fine for default flow)
  N/A Restored brain (none in Knowledge — fresh session)

Status: GREEN. Ready to interview, render, or whatever you need.
Next: type "let's start" to begin, or any specific request.
```

If anything's red:

```
syncflow · health check · Cordova

  ✗ System prompt — I can't recall the worldview principles. The
    Custom Instructions panel is probably empty.
  ✓ Project Knowledge: prompts/, skills/, templates/, reference/, integrations/
  ...

Status: RED · 1 issue.
Fix: Open `0-paste-this-into-custom-instructions.txt` from your
~/syncflow/ folder. Select all (⌘A), copy (⌘C). Open this Project's
Custom Instructions panel, paste (⌘V), save. Then re-run /health-check.
```

---

## Don't

- Don't run health-check passively in the background. Only when explicitly invoked or after onboard-delegate completes.
- Don't make health-check noisy. One paragraph max in the green path.
- Don't fake a green check. If you can't actually verify a checkpoint, mark it N/A or ✗ — never ✓ on assumption.
- Don't recommend MCP setup if the delegate is on the default *(non-tier-2)* path. Filesystem MCP is opt-in.
- Don't lecture about Pro/Team if the delegate is on Pro/Team — only flag the tier issue if there's an actual symptom.
- Don't repeat health-check checks if the user just ran one in the same conversation. Cache the green checks for ~10 minutes; re-run only the ones likely to have changed.
