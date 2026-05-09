---
name: lock
description: Lock and unlock brand fields so iterations don't drift. Triggers on "/lock", "/lock <field>", "/unlock <field>", "/locks", or natural language like "lock the primary font", "freeze the cta colour", "stop changing the vibe". Outputs brands/<slug>/locks.json that /design embeds in the Stitch prompt and /refine enforces against the exported HTML.
---

# /lock — Lock Primitive

Part of Claude UI Workflow. Lives **alongside** `/intake` and the brand-ingestion
scripts. Reads from `tokens.json` and `intake.json`, writes to `locks.json`.

Schema: `Claude-UI-Workflow/brands/LOCKS-SCHEMA.md` (machine contract).

---

## Why this exists

Stitch drifts. The user iterates in Stitch ("generate another", "try again"),
then exports the HTML. Without locks, every regeneration risks the primary
font shifting, the CTA colour wandering, the page vibe softening.

Locks pin the values that **must not change**. They live in two places:

1. The Stitch prompt — Claude tells Stitch "primary font MUST be Plus Jakarta
   Sans, do not change". Stitch may still drift.
2. The post-export cleanup pass (`/refine`) — Claude rewrites the exported
   HTML to snap drifted locked fields back to canonical values. This is
   the authoritative enforcement.

---

## When this skill applies

Route here when the operator says any of:

- `/lock`, `/lock <field>`, `/lock <natural language>`
- `/unlock <field>`
- `/locks` — list current locks for the active brand
- "lock the primary font as Plus Jakarta Sans"
- "freeze the cta colour"
- "stop the vibe from drifting"
- "make sure the headings stay …"

---

## What this skill does

### `/lock` — set a lock

1. **Resolve target brand.** Default to the most recent `/intake` or
   `/design` slug. Fall back to asking the operator.
2. **Resolve field.** Map natural language to a dotted path (table below).
   If ambiguous, ask one clarifying question.
3. **Resolve value.** Auto-pick from `tokens.json` (for tokens-level fields)
   or `intake.json` (for intake-level fields). For `assets.*` fields,
   ask the operator for the image path (no auto-pick — these aren't in any
   existing file). If neither file has the value, ask the operator.
4. **Determine `enforce`.** Tokens paths → `html`. Intake paths →
   `prompt`. `assets.*` paths → `asset`.
5. **Capture reason.** Ask the operator one line. Optional but recommended.
6. **Write to `brands/<slug>/locks.json`.** Append to the `locks` array,
   bump file `version`. If the field is already locked, replace in place.
7. **Print confirmation.** Show what was locked, where it'll be enforced,
   and a one-line "How to undo" pointer.

### `/unlock <field>` — remove a lock

1. Find the lock in `brands/<slug>/locks.json`.
2. Remove the entry. Bump file `version`.
3. Print confirmation + a one-line "/lock <field> to re-lock".

### `/locks` — list current locks

Read `brands/<slug>/locks.json` and print a compact table:

```
LOCKS — sellersessions-derived (4 locked)

  field                          value                                     enforce
  ─────────────────────────────  ────────────────────────────────────────  ────────
  typography.headings.font       Plus Jakarta Sans                         html
  colors.cta.hex                 #461499                                   html
  vibe.adjectives                premium, high-energy, authoritative       prompt
  output_type                    landing                                   prompt

  /unlock <field>     to remove a lock
  /lock <field>       to add or change one
```

---

## Natural-language → dotted path map

The skill resolves these aliases to canonical paths.

### Tokens-level (enforce: `html`)

| Natural language | Dotted path | Source |
|---|---|---|
| "primary font" / "headings font" | `typography.headings.font` | tokens.json |
| "body font" | `typography.body.font` | tokens.json |
| "button font" | `typography.buttons.font` | tokens.json |
| "primary colour" | `colors.primary.hex` | tokens.json |
| "cta colour" / "button colour" | `colors.cta.hex` | tokens.json |
| "secondary colour" | `colors.secondary.hex` | tokens.json |
| "background colour" | `colors.background.hex` | tokens.json |
| "card colour" / "card bg" | `colors.card_bg.hex` | tokens.json |
| "text colour" | `colors.text.hex` | tokens.json |
| "border colour" | `colors.border.hex` | tokens.json |
| "theme" / "theme mode" | `theme.mode` | tokens.json |

### Intake-level (enforce: `prompt`)

| Natural language | Dotted path | Source |
|---|---|---|
| "output type" / "page type" | `output_type` | intake.json |
| "vibe" / "adjectives" | `vibe.adjectives` | intake.json |
| "tone" / "voice" | `vibe.tone` | intake.json |
| "primary cta" / "cta label" | `cta.primary.label` | intake.json |
| "cta link" / "cta url" | `cta.primary.url` | intake.json |
| "audience" | `audience.who` | intake.json |
| "value prop" / "the offer" | `offer.value_prop` | intake.json |

### Asset-level (enforce: `asset`)

For pinning real product images / photos to specific page slots so
Stitch can't drop them or substitute its own:

| Natural language | Dotted path | Source |
|---|---|---|
| "hero image" / "hero photo" | `assets.hero.image` | user-supplied path |
| "feature card N image" / "card N photo" | `assets.features.card_N.image` | user-supplied path |
| "footer logo" | `assets.footer.logo.image` | user-supplied path |
| "<slot> image" (free-form) | `assets.<slot>.image` | user-supplied path |

`<slot>` is a free-form label — pick anything memorable. The harness
checks whether the pinned image survived the export; it doesn't verify
slot semantics (so "hero" vs "footer" is a hint to Stitch + a label
for `/locks`, not a check).

If the operator says something not on any list, ask:
*"That doesn't match a known field. Are you locking a colour, a font,
something from the intake, or pinning a product image? Closest matches:
…"*

---

## Output contract

Single file written: `Claude-UI-Workflow/brands/<slug>/locks.json`.

Shape per `brands/LOCKS-SCHEMA.md`. Required per-lock fields:

- `field`, `value`, `locked_at`, `source`, `enforce`

`reason` is omitted if the operator declines to give one.

---

## After-write pointer

Print, verbatim, on success:

```
✓ locked typography.headings.font = "Plus Jakarta Sans" (html)
  brands/sellersessions-derived/locks.json — 4 locks total

  /design will embed this in the Stitch prompt.
  /refine will rewrite drift in the exported HTML back to this value.

  /unlock typography.headings.font   to remove
  /locks                              to list
```

---

## Process — `/lock` interview

If the operator says `/lock` with no field, ask in order:

### 1. Field

> *"Which field? You can name it plainly — primary font, cta colour, page
> vibe — or give the dotted path."*

If natural language, map via the table above. If ambiguous, list the top 2
matches and ask the operator to pick.

### 2. Value (skip if auto-resolved)

If the field exists in `tokens.json` or `intake.json`, **auto-pick the
current value** and confirm:

> *"Locking `typography.headings.font` at the current value
> `Plus Jakarta Sans`. Confirm or give a different value."*

If the file is missing the field, ask:

> *"What value should I lock it at?"*

For `assets.*` fields, ask for a path:

> *"Where's the image? Give me a path — relative to the brand folder
> or the workflow root."*

Verify the file exists on disk before writing the lock. If it doesn't,
warn (don't block — the operator might be queueing locks ahead of Shottring
the asset) and note in the confirmation that `/refine` will fail until
the file lands.

### 3. Reason

> *"One-line why? (Optional — helps `/refine` show you what it's protecting.)"*

### 4. Write + print confirmation

---

## Process — `/unlock`

Single-step:

> the operator: `/unlock cta colour`
> Claude: ✓ removed lock on `colors.cta.hex` (was `#461499`).
>         brands/sellersessions-derived/locks.json — 3 locks remaining.

---

## Edge cases

- **No `locks.json` yet.** Create it with the file-level frontmatter and
  the first lock.
- **No brand folder.** Create `brands/<slug>/` with just `locks.json`.
  Same as `/intake`'s adhoc path.
- **Field already locked at the same value.** Print "already locked" and
  bump `locked_at` only. No version bump.
- **Field already locked at a different value.** Replace, bump version,
  print the diff: "was `#fc6815` → now `#461499`".
- **Locking an unknown path.** Refuse politely; suggest the closest known
  paths.
- **`enforce` mismatch.** If the operator manually sets `enforce: html` on an
  intake path (or vice versa), reject with a one-line explanation.

---

## How `/design` consumes this

When `/design <slug>` runs and `brands/<slug>/locks.json` exists:

1. Read `locks.json` after `tokens.json` and `intake.json`.
2. Append a **§9. Locks** block to the design brief listing every lock,
   its enforcement mode, and its value.
3. Append the same lines, in plain English, to the Stitch prompt under
   a "LOCKED — do not change" header.

## How `/refine` consumes this

When `/refine` runs against an exported Stitch HTML file or a live URL:

1. Read `locks.json` for the active brand.
2. For every lock with `enforce: "html"`:
   - Scan the HTML for the field's CSS/Tailwind/inline counterpart.
   - Replace any drifted value with the locked value.
3. Append a **§7. Lock corrections** block to the gap-analysis output
   listing every replacement made.
4. For every lock with `enforce: "asset"`:
   - Run the ref-image harness (`scripts/ref-image-check.py`).
   - The harness checks each pinned image with HTML filename scan +
     perceptual-hash fallback against the export's asset bundle.
   - Output: `brands/<slug>/ref-image-report.md` (per-slot verdicts) +
     a **§8. Asset locks** summary block in the gap-analysis output.
5. `enforce: "prompt"` locks are not enforced here — they were the Stitch
   prompt's job, not the cleanup's.

---

## Curriculum note

This skill is part of the Claude UI Workflow giveaway. Two rules of thumb
when wording prompts to the operator (or the curriculum learner):

- Talk in terms of **fields**, not paths. ("Primary font", not
  `typography.headings.font`.) The dotted path appears in the
  confirmation, never in the question.
- The lock is **forever** until `/unlock`. Don't soften that — the whole
  point is "set it once and stop thinking about it".
