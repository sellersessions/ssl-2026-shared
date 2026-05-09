# `test-log`

> **Execution rule (per `0-paste-this-into-custom-instructions.txt` § How you work).** Read this skill file in full before responding to any test-log trigger. Don't free-style. Cite the skill file in your reply.

**When**
- User says: `log <note>`, `feedback <note>`, `test-log`, "log this", "save this feedback", "track this", "broken", "not working", "that's wrong", "this isn't right", "you got that wrong", "off-brief", "wrong product", "wrong angle", "ignore the prompt", "didn't follow the brief"
- After Florence emits any artifact and the user pushes back negatively in the next 1-2 messages
- Explicitly: end of a test session — user types `log download` and Florence finalises the artifact for export

**Inputs**
- The user's free-text note (everything after `log` or `feedback`, OR the negative-feedback message itself)
- Florence's working memory of: last skill run, last artifact emitted, last ASIN touched, last MCP tool called, last prompt used (if `render` was the prior step)
- An in-context running list of entries — Florence keeps an array `[entries]` in working memory across the conversation, appending one entry per `log` call
- Brain (for `personnel[0].name` to seed `tester-name`)

**Tools**
- Cowork built-in `Write` (file on disk)
- Cowork built-in `create_artifact` / `update_artifact`
- Pure substitution into `templates/test-log.html` — no MCP calls, no skill chaining

**Outputs**
- A `florence-test-log` artifact rendered from `templates/test-log.html` — single artifact per conversation, accumulates entries over time
- A one-line chat acknowledgement: *"Logged. {N} entries this session — {summary-counts}."*
- The user can download the artifact at any time and share the file with the build maintainer; one file = full repro context for every issue captured during the session

This skill is the **session-level feedback capture surface**. Florence doesn't try to fix the issue; she captures it cleanly so the user can move on.

---

## Severity taxonomy

Every entry gets one severity. Florence picks based on the user's language; if ambiguous, asks once.

| Severity | When to pick | Examples of trigger phrasing |
|---|---|---|
| **`blocker`** | Florence couldn't complete the skill at all. Flow broke. | "you crashed", "this didn't run", "the artifact never appeared", "MCP connector missing", "tool failed", "skill aborted" |
| **`bug`** | Skill ran but output was wrong / off-brief / off-spec | "wrong product", "wrong angle", "ignored the brief", "didn't follow the prompt", "the image is wack", "this isn't what I asked for", "image at the wrong aspect ratio", "didn't use my product photo" |
| **`nit`** | Cosmetic / phrasing / minor — works but could be better | "phrasing's off", "this would read better as", "small thing but", "a bit too long" |
| **`praise`** | This is what we want more of — capture the win | "this is great", "exactly right", "love this", "ship this" |

When the user types `log` with no severity hint, Florence asks once: *"Severity? (blocker / bug / nit / praise)"*

---

## Behaviour

### Step 0 — Detect the trigger

Three trigger paths:

1. **Explicit slash command.** User types `log <note>`, `feedback <note>`, `test-log <note>`. Note text follows. Skip Step 1's auto-context-pull if the user wrote a complete note; otherwise pull what Florence remembers.
2. **Negative-feedback heuristic.** User's message contains any phrase from the trigger list above (e.g. "broken", "not working", "wrong angle"). Florence asks once before logging: *"Sounds like an issue. Want me to log this in the test log? Type **yes** + any extra detail, or **skip** to keep going."* — only log if the user confirms.
3. **Session export.** User types `log download`, `log export`, `log save`. Florence skips entry creation, just re-emits the artifact (so it appears as the most-recent card).

For path 2, **never log silently**. The user must confirm. Otherwise Florence is logging things the user didn't actually flag.

### Step 1 — Build the entry

Capture these fields. Most are auto-filled from Florence's working memory; the user only writes the `feedback` field.

```
{
  "num":          <auto-increment from last entry>,
  "timestamp":    <ISO 8601 now>,
  "severity":     "blocker" | "bug" | "nit" | "praise",
  "skill":        <last skill Florence ran, or "n/a">,
  "artifact":     <last artifact id Florence emitted, or "n/a">,
  "asin":         <last ASIN touched, or null>,
  "what_florence_did": <one-line summary of the most recent Florence action — what she generated, what she said, what she emitted>,
  "feedback":     <user's note, verbatim>,
  "repro":        <optional — last prompt sent to Higgsfield, last Pinion test_id, last SellerApp tool call args — anything that helps reproduce>
}
```

If the auto-pulled fields are blank (e.g. nothing has run yet in the conversation), set them to `"n/a"` and don't pretend.

### Step 2 — Append to in-context entries

Florence keeps a running array of entries in working memory. Append the new entry. Compute `summary-counts` (e.g. `"1 blocker · 2 bugs · 0 nits · 1 praise"`).

### Step 3 — Render the artifact

1. Read `templates/test-log.html` from Project Knowledge.
2. Strip the leading doc-comment.
3. Substitute placeholders per `templates/_placeholders.md` § `test-log.html`:
   - `{{tester-name}}` from `brain.personnel[0].name` or `"tester"` if brain is empty
   - `{{session-id}}` — auto-generated label (e.g. `2026-05-08-cold-install`); reuse across the conversation
   - `{{started-at}}` — first entry's timestamp; locked once set
   - `{{updated-at}}` — newest entry's timestamp
   - `{{entry-count}}` — total
   - `{{entry-lbl}}` — `Entries` / `Entry`
   - `{{summary-counts}}` — the pluralised counts string
   - `{{lede-html}}` — instructions reminding the user how to add more entries + how to download
   - `{{entries-html}}` — one `<div class="entry severity-{X}">…</div>` per entry, in chronological order
   - `{{footer-msg-html}}` — `<strong>Download me</strong> and DM the file. Every entry's repro context is captured.`
   - `{{generated-at}}` — ISO 8601
   - `{{version}}` — Florence's current version string from the top of `0-paste-this-into-custom-instructions.txt`
4. `Write` the substituted HTML to `./florence-test-log.html`.
5. **First emission of `florence-test-log` in this conversation:** `create_artifact({ id: "florence-test-log", html_path: "./florence-test-log.html", description: "Florence — Test log" })`.
6. **Every subsequent emission:** `update_artifact({ id: "florence-test-log", html_path: "./florence-test-log.html", update_summary: "{N} entries · {summary-counts}" })`.

### Step 4 — Single entry HTML

```html
<div class="entry severity-{{severity}}">
  <div class="entry-head">
    <span class="entry-num">#{{num}}</span>
    <div class="entry-tags">
      <span class="badge severity-{{severity}}">{{severity}}</span>
      <span class="badge skill">{{skill}}</span>
      <span class="badge artifact">{{artifact}}</span>
      <span class="badge asin">{{asin}}</span>
    </div>
    <span class="entry-when">{{timestamp}}</span>
  </div>
  <div class="entry-body">
    <div class="what">
      <div class="lbl">What Florence did</div>
      <div class="body">{{what-florence-did}}</div>
    </div>
    <blockquote class="feedback">{{feedback}}</blockquote>
    <div class="repro">
      <span class="lbl">Repro</span>
      {{repro-text}}
    </div>
  </div>
</div>
```

Omit the `repro` block if no repro context exists. Omit the `asin` badge if no ASIN was touched. Severity badge always appears.

### Step 5 — Confirm in chat

One line. Don't be chatty.

> Logged #{N} ({severity}). Test log now has {entry-count} entries — {summary-counts}. Type `log download` when you want to share.

### Step 6 — Download flow

When the user types `log download` or `log export`:

1. Re-emit the artifact (no new entry).
2. Reply: *"Test log ready. Click the download button on the `florence-test-log` artifact card (right panel) to save the HTML file. DM that file to the build maintainer — every entry's repro context goes with it."*

If the user wants the entries in a different format (markdown, JSON), Florence offers:

- **Markdown export:** Florence formats the entries as a markdown document and emits it as a chat message (single code block) the user can copy.
- **JSON export:** same, JSON of the entries array.

Default is the HTML artifact (most legible, best for sharing).

---

## What "what Florence did" should capture

This field is critical — it's the only way the build maintainer reproduces the issue. Be specific. Examples of GOOD entries:

- *"Generated 5 main-image concepts for B07XYZ4231 using technique 1 (Swing Tag), 3 (Packaging), 5 (Dramatic Angle), 7 (Product in Action), 8 (Benefit Viz). Model: Higgsfield Soul. Reference image: from cache (3h old). All 5 concepts emitted in `florence-concepts-B07XYZ4231` artifact."*
- *"Ran `optimize-listing B0FVD7TGGR uk`. Pulled 30 critical reviews + 6 Rufus queries + 50 keywords. Top objection: 'doesn't look like the photo'. Emitted `florence-research-B0FVD7TGGR` + `florence-product-dossier-B0FVD7TGGR`."*
- *"Onboarding Stage 4 — captured voice = ['warm', 'precise'], forbiddens = ['leverage', 'unlock']. Re-emitted cockpit at stage 4/5."*

Examples of BAD entries (rewrite if Florence finds herself writing these):

- *"Did `render`."* — too vague
- *"Pulled some data."* — what data, on what?
- *"Generated images."* — for what slot, what techniques, with what reference?

---

## Voice rules

- **Verbatim feedback.** Save the user's note as they wrote it. Don't paraphrase. The build maintainer needs the user's exact words.
- **Don't try to fix the issue in the same turn.** This skill captures; it doesn't repair. If the user wants Florence to attempt a fix, they explicitly ask: *"Florence, retry that with the swing tag visible."* — that's a new skill run, not part of `log`.
- **Severity honestly.** Don't downgrade blockers to bugs. Don't upgrade nits to bugs. The build maintainer reads severity to triage.
- **One entry per problem.** If the user lists 3 unrelated issues in one message, log 3 separate entries (Florence asks once: *"Three things — log them as 3 entries?"*).
- **No silent logging.** Auto-detection from negative-feedback phrasing must always confirm with the user before creating an entry. Otherwise Florence is putting words in the user's mouth.

---

## Don't

- Don't log the same issue twice. If the user re-flags the same problem, `update_artifact` to add detail to the existing entry rather than appending a duplicate.
- Don't include sensitive data in the `repro` field. Reference image URLs are fine; raw API keys, refresh tokens, full review payloads are not.
- Don't truncate the user's feedback. Even if it's a paragraph long. The maintainer needs the full context.
- Don't replace this artifact with a different stable id — `florence-test-log` is permanent for the conversation. One id, one card, accumulating entries.
- Don't gate other skills on this one. The user can run `render`, `optimize-listing`, `pinion` etc without ever touching `log`. Logging is opt-in.
- Don't render the test-log artifact spontaneously (e.g. at end of every skill run). Only when explicitly triggered or when negative-feedback phrasing is detected and the user confirms.
- Don't lose entries on conversation reset. If a new chat starts, the previous test-log artifact is gone (artifacts are conversation-scoped) — Florence should mention this once at the start of any new chat: *"Heads up: previous chat's test-log didn't carry over. If you have it downloaded, drag it into Project Knowledge and I'll continue appending. Otherwise this is a fresh log."*
