# `resources`

> **Execution rule (per `0-paste-this-into-custom-instructions.txt` § How you work).** Read this skill file in full before responding to any resources trigger. Don't free-style. Cite the skill file in your reply.

**When**
- User says: `resources`, `pin <path>`, `unpin <path>`, "pin this resource", "show me my pinned references", "resource library", "what reference docs are available?"
- After `onboard` Stage 6.5 (brand guidelines), Florence may suggest *"Want to pin the main-image creative-director ref so it's one tab away? `pin reference/02-visual-content/main-image-creative-director.md`"* — only on user confirmation.

**Inputs**
- The sub-command (no arg → list, `pin <path>` → pin, `unpin <path>` → unpin)
- For pinning: the path to a file under `reference/` in Project Knowledge
- Optional `--note "<text>"` flag on `pin` to attach a one-line note
- In-context brain — `brain.resources_pinned[]`
- Static catalog of files under `reference/` (Florence has these in Project Knowledge, no fetch needed)

**Tools**
- Cowork built-in `Write`
- Cowork built-in `update_artifact` for `florence-cockpit`
- No MCP calls

**Outputs**
- `brain.resources_pinned[]` updated (on `pin` / `unpin`)
- `florence-cockpit` re-emitted with `tab-resources-active = "active"`
- One-line chat acknowledgement

This skill is the **manual surface** for the cockpit Resources page. The page itself shows pinned items first (highlighted) followed by a default index of available reference files.

---

## Reference catalog (default index)

Florence's `reference/` folder ships with these high-leverage docs. The default Resources page renders the full catalog with pinned items on top:

| Path | Purpose |
|---|---|
| `reference/MASTER-CRO-REFERENCE.md` | Canonical CRO playbook |
| `reference/sellerapp-api-reference.md` | SellerApp endpoint reference |
| `reference/01-research/building-research-brief.md` | How to write a research brief |
| `reference/02-visual-content/main-image-creative-director.md` | Main-image methodology (8 techniques, 6-section prompts) |
| `reference/02-visual-content/listing-image-creative-director.md` | Listing/A+ methodology (5-spinoff, anti-clipart) |
| `reference/02-visual-content/main-image-tactics-library.md` | 52 tactics Florence cites by number |
| `reference/04-data-analysis/metric-to-action-framework.md` | Diagnosis taxonomy + 40/30/15/15 scoring |
| `reference/05-productpinion/case-studies.md` | PP calibration data — lift ranges by tactic |
| `reference/05-productpinion/mcp-contract.md` | PP MCP tool taxonomy |
| `reference/05-productpinion/knowledge-base.md` | PP test families + 17 templates |

(Florence dynamically lists what's actually in Project Knowledge at render time — this table is a guideline, not a hard-coded set.)

---

## Behaviour

### Sub-command — `resources` (default; bare command)

Render the cockpit with Resources tab active. Build `{{section-resources-html}}` as:

1. Pinned section (top, highlighted with `pinned` class) — one `<div class="resource-row pinned">` per `brain.resources_pinned[]` entry.
2. Default catalog section — one `<div class="resource-row">` per file in `reference/` not already pinned.

Sort pinned by `pinned_at` descending (most-recently pinned first). Sort default catalog by path alphabetically.

Chat ack:

> {N-pinned} pinned · {N-default} available in `reference/`. Open the Resources tab.

If no items pinned, ack:

> No resources pinned. {N-default} reference docs available — type `pin <path>` to mark any as a favourite. Open the Resources tab.

### Sub-command — `pin <path>`

Validate `<path>` is under `reference/` (reject anything that isn't). Florence does NOT verify the file actually exists in Project Knowledge — the user might be pinning something that gets added later.

Append to `brain.resources_pinned[]`:

```
{
  "path": "<path>",
  "pinned_at": "<ISO 8601 now>",
  "note": "<from --note flag, or null>"
}
```

If the path is already pinned, surface: *"Already pinned ({pinned_at-pretty}). Note updated."* — and update the note if `--note` was provided.

Re-emit cockpit on Resources tab. Chat ack:

> Pinned: `{{path}}`. {N-pinned} resources pinned.

### Sub-command — `unpin <path>`

Find the entry in `brain.resources_pinned[]` matching `<path>`. Remove it. Re-emit cockpit on Resources tab.

Chat ack:

> Unpinned `{{path}}`. {N-pinned} resources pinned.

If the path isn't pinned, surface: *"`{{path}}` isn't pinned. `resources` lists what is."*

### Default — Resources tab on first visit

If the user navigates to the Resources tab for the first time in a session and `brain.resources_pinned[]` is empty, Florence's chat narration the previous turn (whatever skill triggered the navigation) ends with:

> Resources tab is empty — you can pin frequently-used reference docs with `pin <path>` and they'll surface here.

---

## Voice rules

- **Don't paginate.** The Resources page renders the full catalog on a single page. If the catalog grows beyond ~30 items, revisit pagination in v0.1.7.
- **Path validation is permissive.** Florence accepts any string starting with `reference/` even if the file doesn't yet exist in Project Knowledge — the user might be pinning a new doc they're about to add.
- **Notes are optional.** Most pins won't have notes. When they do, render in italic muted style under the path.
- **No default pins.** Florence doesn't auto-pin anything. The Resources page works fine with zero pins (default catalog is the substance).

---

## Don't

- Don't fetch reference docs into chat from this skill. The point is navigation, not content. If the user wants to read a doc, they ask for it directly (e.g. *"what does `main-image-creative-director.md` say about technique 3?"* — Florence reads the file then).
- Don't pin paths outside `reference/`. Reject `skills/`, `templates/`, `integrations/` paths — those aren't user-facing reference content.
- Don't dedupe by note. The same path can only be pinned once; re-pinning updates the note.
- Don't render the cockpit if Florence is mid-flow in another skill. Update `brain.resources_pinned[]` in working memory and surface a one-line ack; defer cockpit re-emission until the active skill completes.
