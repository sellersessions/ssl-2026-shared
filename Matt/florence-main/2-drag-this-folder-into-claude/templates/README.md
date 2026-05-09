# Templates

Florence's render surfaces. Two HTML templates, one JSON schema. Every emission goes through Cowork's MCP-based artifact API.

## The contract

**Florence reads the brain, substitutes `{{placeholder}}` tokens into the template, writes the result to disk, and calls `create_artifact` (first emission of an id) or `update_artifact` (every re-emission).**

Cowork's artifact API is **not** the inline `<antArtifact>` XML protocol from `claude.ai`. It exposes two MCP tools that read content from a file on disk; neither accepts inline content. The full schemas, stable IDs, and emission cadence live in the **`## Artifact emission`** section of `0-paste-this-into-custom-instructions.txt`.

## Why this shape

- **No `<script>` in templates.** Cowork's iframe sandbox blocks external CDNs (`esm.sh`, `cdn.tailwindcss.com`, `fonts.googleapis.com`). Inline scripts are unreliable. Templates render correctly only when content is server-substituted before emission.
- **No fetch from inside artifacts.** Florence does IO. The template paints what it's given.
- **Vanilla HTML, inline CSS, system fonts.** The artifacts work offline, in any Cowork sandbox, without any external dependency.
- **Testable in isolation.** Substitute placeholders by hand, open the file in a normal browser, see the render. No skill or MCP needed to debug.

## Files

| File | Owned by | Lifecycle | Renders |
|---|---|---|---|
| `cockpit.html` | `skills/onboard.md`, `skills/setup-validate.md`, `skills/restore-brain.md` | **Session-evolving** — single stable id `florence-cockpit`, re-emitted at milestones (~5 per onboarding) | Onboarding cockpit (stages 0–5) + health-check view, swappable via `{{view-onboard-active}}` / `{{view-health-active}}` |
| `today.html` | `skills/today.md` | **Daily** — fresh emission each morning. Stable id `florence-today` | Daily brief: priority pick, signals, noticed list |
| `brain-schema.json` | `skills/onboard.md`, `skills/restore-brain.md` | Versioned schema for the `florence-brain.json` artifact (id `florence-brain`) | (not a render — a contract) |

The cockpit replaces what used to be three separate artifacts (cockpit + setup-status + today). Onboarding and health-check are different *views* of one stable artifact id; they re-paint in place rather than spawning new artifacts. The user sees one artifact build and update — never "where did the last one go?"

Each template's full `{{placeholder}}` contract lives in `_placeholders.md`. **That file is the source of truth.** When you change the shape, update both ends — the skill that builds the substitution map and the placeholder doc.

## Evolving artifact pattern (cockpit)

Cowork artifacts have stable identifiers. Re-emit with the same id and the artifact updates in place — no new card spawned.

The cockpit uses this:

- **Page 0 (Welcome)** is always rendered.
- **Pages 1–5** flip between rendered and locked via two paired tokens per page: `{{page-N-class}}` (CSS class — `""`, `"current"`, or `"locked"`) and `{{page-N-body-html}}` (the page body, full content or locked stub).
- A sticky progress bar at the bottom shows `{{progress-pct}}%` (0–100).

**Locked-state stub** the agent substitutes for any page below its stage gate:

```html
<div class="page-body">
  <div class="lock-msg">Fills in after {{after-condition}}.</div>
</div>
```

Re-emit at natural milestones, **not per-fact**. Per-fact would burn tokens on 50+ regenerations during a 12-min interview. Florence emits ~5 times per onboarding:

1. Stage 0 (welcome stub) — first message of fresh project — `create_artifact`
2. After brand + marketplaces captured — `update_artifact` — *Brand captured · stage 1/5*
3. After products + competitors captured — `update_artifact` — *Products captured · stage 3/5*
4. After voice + goals captured — `update_artifact` — *Voice & goals · stage 4/5*
5. Final at stage 5 (with `florence-brain.json` emission alongside) — `update_artifact` — *Complete · 100%*

Each re-emission is one short status line in chat: *"Cockpit updated · 60%"*. Doesn't break flow.

## Conventions

- **No hidden defaults in the template.** If a placeholder isn't substituted, the artifact shows literal `{{var}}` — that's a bug. Florence substitutes everything before `Write`.
- **One word per status.** `green` / `yellow` / `red` for health; `done` / `current` / `locked` for stages; `up` / `down` / `flat` for trends. Keep the vocabulary small.
- **Empty-state placeholders are explicit.** When a section has no content, the agent fills the slot with a literal `<div class="empty-block">…</div>` rather than leaving it blank. Skills know what empty-state copy to use.
- **Florence's emphasis is the green word.** `<em>` is repurposed (`em { color: var(--accent); font-weight: 700; font-style: normal; }`) so emphasised text comes out in Pinion Green.
- **No external assets.** All CSS inline. System fonts only (`-apple-system, system-ui, ...`). No `<script>` tags. No `<link rel="stylesheet">` to remote hosts. No `@font-face` referencing remote URLs.

## Adding a new artifact

1. Decide on a stable id (kebab-case, e.g. `florence-shopper-run`) and a stable file path (e.g. `./florence-shopper-run.html`). Both go into the **`## Artifact emission`** table in `0-paste-this-into-custom-instructions.txt`.
2. Copy `today.html` (simpler than cockpit) as a starting point.
3. Inline the design tokens from the existing artifacts (the `:root` block at top — they're shared).
4. Define `{{placeholder}}` tokens. Document each one in `_placeholders.md` (kind, type, required-when, example value).
5. Update the skill that owns the artifact: read template → substitute placeholders → `Write` to stable path → `create_artifact` (first emission) or `update_artifact` (re-emission).

## Smoke-testing a template

Substitute the placeholders by hand:

```bash
sed -e 's/{{view-onboard-active}}/active/g' \
    -e 's/{{stage-num}}/3/g' \
    -e 's/{{progress-pct}}/60/g' \
    ... \
    cockpit.html > /tmp/cockpit-test.html
open /tmp/cockpit-test.html
```

If the render matches what Florence should be showing the user, the template is correct. If it doesn't, fix the template — never paper over a missing placeholder by adding fallback HTML in the skill's substitution step.
