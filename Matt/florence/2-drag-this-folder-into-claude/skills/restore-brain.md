# `restore-brain`

**When**
- User uploads a file named `florence-brain.json` (or `brain*.json`) to the Project chat
- User says: "restore from brain", "load my brain", "I uploaded the brain file"
- First message of a new conversation AND a `florence-brain.json` is present in Project Knowledge

**Inputs**
- A `florence-brain.json` file (uploaded to chat or present in Project Knowledge)
- `templates/brain-schema.json` for shape validation
- `templates/cockpit.html` and `templates/_placeholders.md` (to re-render the cockpit at the restored stage)

**Tools**
- Chat (acknowledge restore, ask one clarifying question if schema mismatch)
- `Write` tool (to re-render the cockpit at the restored stage)
- Cowork MCP `create_artifact` (this is the **first emission** of `florence-cockpit` in the new conversation — the artifact card from the previous chat doesn't survive)
- In-context state (this skill writes here)

**Outputs**
- In-context brain populated from the file
- `florence-cockpit` artifact re-emitted at the restored stage so the user has the visual back
- One-line confirmation: *"Restored — {brand}, {n} ASINs, last brief {date}. Type `today` for today's brief."*
- If schema mismatch: route to `skills/onboard.md` with the bad file noted (don't lose the user's data — surface what couldn't be parsed)

---

## Behaviour

### Step 1 — Find and parse the brain JSON

Look for the file in this order:
1. The file just uploaded to chat (if user mentioned it)
2. The most recent `florence-brain*.json` (or `brain*.json` for back-compat) in Project Knowledge
3. If none, route to `skills/onboard.md` instead

Parse as JSON. If parsing fails, reply:

> The file isn't valid JSON. Open it in a text editor and check the first character is `{`. If it's corrupted, type `onboard` and we'll rebuild — about 10 minutes.

### Step 2 — Validate against schema

Read `templates/brain-schema.json`. Check the uploaded file's `schema_version`:

| Version match | Action |
|---|---|
| Same as current schema (`1.0`) | Proceed to Step 3 |
| Older minor version (e.g. file `1.0`, current `1.1`) | Auto-migrate (forward-compatible by design); note in confirmation |
| Older major version (file `0.x`, current `1.0`) | Run the documented migration; flag any field that couldn't be migrated |
| Newer than current | Refuse: *"This florence-brain.json was emitted by a newer Florence than this Cowork project loaded. Update Florence or use an older brain file."* |
| Field missing entirely | Treat as `0.x`, run migration |

Required-field check (after migration):
- `business.brand` — non-empty string
- `products` — array, may be empty but must exist
- `schema_version` — string

If a required field fails, fall through to Step 5 (route to onboard with the bad file's contents kept in memory so the user doesn't have to retype).

### Step 3 — Hydrate in-context state

Copy the file contents into in-context working memory under the brain key. From this point on, every skill reads the brain from working memory; no further file reads needed.

### Step 4 — Re-emit the cockpit (first emission of new conversation)

The cockpit artifact card from the previous chat is gone — Cowork artifacts are conversation-scoped. So this skill **always** uses `create_artifact` (never `update_artifact`) to put the visual back in the right panel.

1. Determine the current stage from the restored brain. If everything's populated, stage = `5` (Ready). If only some sections filled, derive from what's present (brand only → 1; products only → 3; voice + goals → 4).
2. **Pick which tab to land on** (v0.1.6 multi-page cockpit):
   - If stage = 5 AND `brain.projects[]` is non-empty → land on **Projects** tab (`{{tab-projects-active}} = "active"`); user is returning to active work.
   - Otherwise → land on **Brand** tab (`{{tab-brand-active}} = "active"`); shows the restored brand context with Setup sub-section either collapsed (stage 5) or unfolded (stages 0-4).
3. Read `templates/cockpit.html`.
4. Substitute placeholders per `templates/_placeholders.md` § cockpit.html. Build all 5 section bodies — `{{section-ideas-html}}` (from `brain.ideas[]`), `{{section-brand-html}}` (the brand pattern with Setup sub-section), `{{section-projects-html}}` (from `brain.projects[]`), `{{section-resources-html}}` (default catalog + pinned), `{{section-about-html}}` (version + integrations health) — so navigation works once the artifact is rendered.
5. Set tab counters: `{{tab-ideas-count}}` = `brain.ideas.length`, `{{tab-projects-count}}` = `brain.projects.length`, `{{tab-resources-count}}` = `brain.resources_pinned.length + reference/ default file count`.
6. Use the `Write` tool to write the result to `./florence-cockpit.html`.
7. Call `create_artifact({ id: "florence-cockpit", html_path: "./florence-cockpit.html", description: "Florence — Setup & Brain (restored)" })`.

Then confirm in chat:

> Restored — **{brand}**, {n} ASINs ({list of asins or "{first 3} + {n-3} more"}), last brief {brain.history.last_brief or "never"}.
>
> Cockpit's back in the right panel. Type `today` for today's brief, or jump to `recommend-test` if there's something specific.

If the brain has stale data (e.g., `last_brief` is more than 7 days ago), surface that:

> Note: last brief was {N} days ago. Want me to catch you up on what's likely changed since? — F.

### Step 5 — On schema mismatch, route to onboard

If validation failed irrecoverably:

> The florence-brain.json you uploaded has {specific issue, e.g., "schema_version 0.7 — I can't migrate that automatically"}. Two options:
>
> 1. Run `onboard` again — about 10 minutes; I'll rebuild from scratch.
> 2. Edit the file by hand to match `templates/brain-schema.json` and re-upload.
>
> The file you uploaded is in this conversation, so you don't have to retype the brand name when we re-onboard.

Then route to `skills/onboard.md` with the user's existing values preserved as defaults where parseable.

---

## Don't

- Don't silently overwrite a populated in-context brain with a partial file. If the in-context brain has more data than the uploaded file, ask the user which to keep.
- Don't auto-emit a fresh `florence-brain.json` after restore. The whole point is the user's existing file is the source of truth this session.
- Don't expose schema migration details unless they failed. The user doesn't need to know "field `marketplaces` was renamed from `markets`" — they need to know "your brain restored, here's what's in it."
- Don't skip the cockpit re-emission. The first thing the user wants to see in a new chat is the visual they remember from the previous one.
- Don't validate ASINs against external systems at restore time. Cross-check format only (`^B0[A-Z0-9]{8}$`).