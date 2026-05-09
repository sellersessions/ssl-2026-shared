# `idea`

> **Execution rule (per `0-paste-this-into-custom-instructions.txt` § How you work).** Read this skill file in full before responding to any idea-capture trigger. Don't free-style. Cite the skill file in your reply.

**When**
- User says: `idea <text>`, `/ideas`, "save this idea", "log a hypothesis", "remember this for later", "note this down", "let's test this later"
- During `optimize-listing` / `render` / `pinion`, Florence may proactively suggest *"That's worth saving as an idea — type `idea` to log it."* — but only logs on user confirmation, never silently
- User types `idea` with no args → Florence asks for the idea + status

**Inputs**
- User's free-text idea (everything after `idea`)
- Optional `--linked-asin <asin>` flag to attach the idea to a tracked product
- Optional severity hint via wording (e.g. "park this for later" → `parked`, "test this next" → `captured`, "ship this" → `shipped`)
- In-context brain (for `business.brand`, `personnel[0].name` for greeting context)

**Tools**
- Cowork built-in `Write` (file on disk)
- Cowork built-in `update_artifact` for `florence-cockpit`
- Pure substitution into `templates/cockpit.html` — no MCP calls, no skill chaining

**Outputs**
- New entry appended to `brain.ideas[]` in working memory
- `florence-cockpit` re-emitted with `tab-ideas-active = "active"` so the Ideas page is visible with the new entry
- One-line chat acknowledgement: *"Logged: '{title}' (status: {status}). {N} ideas captured."*

This skill captures hypotheses for later. It does NOT run a test, generate concepts, or take action. Pair with `recommend-test`, `render`, or `pinion` when the user wants to act on an idea.

---

## Status taxonomy

| Status | When to pick |
|---|---|
| **`captured`** | Default — new idea, not yet tested. The "let's try this later" bucket. |
| **`tested`** | User confirms this idea has been validated via `pinion` or shipped + measured. Manually advanced via `idea status <id> tested`. |
| **`shipped`** | Already live on Amazon. Useful as a reminder of what's been done. |
| **`parked`** | Considered + rejected, or low-priority. Florence keeps it on the list at lower visual weight. |

---

## Behaviour

### Step 0 — Detect the trigger

1. Slash command `idea <text>` — log immediately, default status `captured`, ask for severity only if the wording is ambiguous.
2. Bare `idea` — ask: *"What's the idea? (one line is fine)"* + *"Status — captured / tested / shipped / parked? (default captured)"*.
3. Auto-suggest from another skill — Florence offers *"Want to save that as an idea? Type `idea` + the line or just say yes and I'll log it as: '{auto-generated title}'."* Never logs silently.

### Step 1 — Build the entry

```
{
  "id":          "idea_<YYYY-MM-DD>_<NNN>",   // auto-increment from last idea
  "title":       "<user's text, trimmed to 80 chars>",
  "notes":       "<longer text if user provided one>",
  "status":      "captured" | "tested" | "shipped" | "parked",
  "created_at":  "<ISO 8601 now>",
  "linked_asin": "<from --linked-asin flag, or null>",
  "source":      "idea" | "optimize-listing" | "render" | null
}
```

### Step 2 — Append to `brain.ideas[]`

Append the new entry. Florence keeps `brain.ideas[]` in working memory; entries persist in the next `florence-brain.json` emission.

### Step 3 — Re-emit cockpit on Ideas page

1. Read `templates/cockpit.html` from Project Knowledge.
2. Strip the leading doc-comment.
3. Build the substitution map per `templates/_placeholders.md` § `cockpit.html`:
   - `{{eyebrow}}` = `"Ideas"`
   - `{{title}}` = `"{N} ideas captured"` (or `"1 idea captured"` if singular)
   - `{{stage-num}}` = the new count (e.g. `"3 ideas"`)
   - `{{stage-label}}` = the most recent status (e.g. `"captured"`)
   - `{{progress-pct}}` = `100` (Ideas page has no meaningful progress %)
   - `{{footer-msg-html}}` = `Captured: <em>{{title}}</em>`
   - `{{tab-ideas-active}}` = `"active"`, all other `{{tab-X-active}}` = `""`
   - `{{tab-ideas-count}}` = the new total
   - `{{section-ideas-html}}` = one `<div class="idea-row status-{X}">` per entry, chronological reverse (newest first)
   - `{{section-brand-html}}`, `{{section-projects-html}}`, `{{section-resources-html}}`, `{{section-about-html}}` — full content for the other tabs (so navigation works); skill keeps the working state for these between calls
4. `Write` to `./florence-cockpit.html`.
5. Call `update_artifact({ id: "florence-cockpit", html_path: "./florence-cockpit.html", update_summary: "Idea captured · {N} total" })`.

### Step 4 — Acknowledge in chat

One line. No essay.

> Logged #{N} — *{{title}}* ({{status}}). Open the Ideas tab on the cockpit to review.

If linked to an ASIN, surface that:

> Logged #{N} — *{{title}}* ({{status}}, linked to {{asin}}). Open the Ideas tab.

---

## Sub-commands

`idea status <id> <new-status>` — manually advance status (e.g. `idea status idea_2026_05_08_001 tested`). Florence finds the entry, updates `status`, re-emits cockpit.

`idea remove <id>` — delete an entry. Florence asks for confirmation once, then removes from `brain.ideas[]` and re-emits cockpit.

`idea list` — re-emit cockpit on Ideas page (no new entry). Same as just navigating to the Ideas tab.

---

## Voice rules

- **Verbatim title.** Don't paraphrase the user's idea text. Trim to 80 chars only if longer; put the rest in `notes`.
- **Default to `captured`.** Don't push back on status unless the wording is clearly indicating a different state.
- **No silent logging.** Auto-suggested ideas (from `optimize-listing` etc.) always require user confirmation.
- **Cite `pinion` and `render` as next steps when relevant.** If the idea reads like an image hypothesis, end the chat ack with: *"Want to render concepts for this? Type `render`."* If it reads like a price test, *"Want to validate? Type `pinion`."*
- **Don't auto-link to ASINs.** Linking happens via the explicit `--linked-asin` flag or a clear ASIN reference in the user's text.

---

## Don't

- Don't auto-create projects from ideas. Ideas are hypotheses; projects are work-in-flight. The user explicitly runs `optimize-listing` / `render` / `pinion` to convert an idea into a project.
- Don't dedupe by title. The user might genuinely want to log the same idea twice with different notes.
- Don't lose entries on conversation reset. `brain.ideas[]` persists in `florence-brain.json` once the user emits / downloads the brain.
- Don't render the cockpit if the user is mid-flow in another skill (e.g. `onboard` Stage 3). Capture the entry into `brain.ideas[]` and surface a one-line ack; defer the cockpit re-emission until the in-progress skill finishes.
