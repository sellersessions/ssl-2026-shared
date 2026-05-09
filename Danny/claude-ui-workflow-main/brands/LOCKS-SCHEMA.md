---
project: claude-ui-workflow
last_updated: 2026-04-25
role: locks-schema
---

# `locks.json` — Schema

> Machine-readable record of fields the user has frozen for a brand.
> Persisted at `brands/<slug>/locks.json` alongside `tokens.json` and
> `intake.json`. Read at **two** points in the pipeline:
>
> 1. **`/design`** — included in the Stitch prompt as "LOCKED, do not change"
>    instructions (best-effort guidance — Stitch may still drift).
> 2. **`/refine`** — applied to the user-exported Stitch HTML to snap any
>    drifted locked fields back to their canonical values (authoritative
>    enforcement).
>
> Locks are **not** a runtime block on Stitch itself. They're a contract
> between the user, the prompt, and the post-export cleanup pass.

---

## Why a separate file?

`tokens.json` answers *"what does the brand look like?"*.
`intake.json` answers *"what are we making, for whom, and why?"*.
`locks.json` answers *"which of those answers must NEVER change across iterations?"*

Locks reference fields in either of the first two files. They store the
*value* alongside the path, so a lock survives a regenerated `tokens.json`
or a re-run `/intake`.

---

## Top-level shape

```json
{
  "brand": "<slug>",
  "version": "1",
  "generated_at": "<ISO date>",
  "source": "user-via-/lock",
  "locks": [
    {
      "field": "<dotted path>",
      "value": <canonical value>,
      "reason": "<one-line why>",
      "locked_at": "<ISO date>",
      "source": "user-via-/lock | from-/intake-step",
      "enforce": "html | prompt"
    }
  ]
}
```

`brand` matches the folder slug. `version` is a stringified integer that
bumps on every modification. `generated_at` and `source` describe the
file-level metadata; each lock entry has its own `locked_at` + `source`.

---

## `enforce` — the discriminator

Three values, three pipeline behaviours. **This is the most important field.**

### `enforce: "html"` — tokens-level locks

Field paths inside `tokens.json`:

| Path pattern | Example |
|---|---|
| `typography.<role>.font` | `typography.headings.font` → `"Plus Jakarta Sans"` |
| `typography.<role>.weight_range` | `typography.body.weight_range` → `[400, 600]` |
| `colors.<role>.hex` | `colors.cta.hex` → `"#fc6815"` |
| `colors.<role>.token` | `colors.primary.token` → `"ss-purple"` |
| `theme.mode` | `theme.mode` → `"dark"` |

Behaviour:

- **`/design`** writes a "LOCKED" instruction into the Stitch prompt.
- **`/refine`** parses the user's exported HTML, finds every drift on the
  locked field, and rewrites in place. Replacement is value-for-value
  (`#FF5722` → `#fc6815`, `Inter` → `Plus Jakarta Sans`).

### `enforce: "prompt"` — intake-level locks

Field paths inside `intake.json`:

| Path pattern | Example |
|---|---|
| `output_type` | `"landing"` |
| `vibe.adjectives` | `["premium", "high-energy", "authoritative"]` |
| `vibe.tone` | `"confident, no fluff"` |
| `cta.primary.label` | `"Book your seat"` |
| `cta.primary.url` | `"#book"` |
| `audience.who` | `"Amazon FBA sellers running £1M+/yr"` |
| `offer.value_prop` | `"13 working operators on stage"` |

Behaviour:

- **`/design`** writes a "LOCKED" instruction into the Stitch prompt
  (e.g. "vibe MUST be premium, high-energy, authoritative — do not soften").
- **`/refine`** does **not** post-process these. They're judgement-level
  values; HTML cleanup can't enforce a vibe. The prompt is the only lever.

### `enforce: "asset"` — pinned reference images

Field paths inside a virtual `assets` namespace (this lives only in
`locks.json` — not in `tokens.json` or `intake.json`):

| Path pattern | Example |
|---|---|
| `assets.<slot>.image` | `assets.hero.image` → `"_assets/at2020.png"` |
| `assets.<slot>.image` | `assets.features.card_3.image` → `"_assets/podcast-rig.png"` |

`<slot>` is a free-form label that names where the image should land
(`hero`, `features.card_3`, `footer.logo`, etc.). It's a hint to Stitch
and a label for the user — the harness does **not** verify slot semantics
(see "Harness scope" below).

`value` is the path to the pinned image, relative to the brand folder
or the workflow root. The image file must exist on disk when `/refine`
runs.

Behaviour:

- **`/design`** writes an "ASSET LOCK" instruction into the Stitch prompt
  (e.g. "HERO must feature the real product photo at `_assets/at2020.png`.
  This is the actual product. Do NOT generate a substitute, do NOT
  illustrate a different version. Place it as the hero visual.").
- **`/refine`** runs the **ref-image harness** (`scripts/ref-image-check.py`)
  against the user-exported Stitch HTML/ZIP. For each asset lock, the
  harness checks whether the pinned image survived the export:
  1. **HTML scan** — find the pinned filename in any `<img src>`,
     `srcset`, `style="background-image:..."`, `data-*` attribute, or
     `<picture>` source across the export.
  2. **Hash fallback** — if the filename isn't in the HTML, perceptual-hash
     compare the pinned image against every image file in the export's
     asset bundle. A close match means Stitch renamed but kept the file.
  3. **Verdict per slot** — `PASS` (filename found), `PASS-VARIANT`
     (hash match), or `FAIL` (neither).
- Failures get a `/regen-nb2 <slot>` recommendation written into
  `brands/<slug>/ref-image-report.md` (schema:
  `brands/REF-IMAGE-REPORT-SCHEMA.md`).

#### Harness scope (what it doesn't check)

- The harness does not verify that the image landed in the *right* slot
  (e.g. it can't tell hero from footer). Slot-aware checking would
  require Playwright rendering + region screenshots, which is brittle
  for arbitrary Stitch exports. If Stitch placed the pinned image but
  in the wrong section, the harness records `PASS` and the user catches
  it visually.
- The harness does not regenerate. It surfaces a per-slot verdict and
  a recommended action; the user decides whether to re-Stitch, run
  NB2 fallback, or accept the drift.

---

## Fields per lock

| Field | Required | Type | Notes |
|---|---|---|---|
| `field` | yes | string | Dotted path. Must point at a known key in tokens.json or intake.json. |
| `value` | yes | matches field type | The canonical value. String, number, or array. |
| `reason` | recommended | string | One-line why. Drives the `/refine` change-log entry. |
| `locked_at` | yes | ISO date | When the lock was set. |
| `source` | yes | enum | `user-via-/lock` (explicit) or `from-/intake-step` (set during /intake confirmation). |
| `enforce` | yes | enum | `html`, `prompt`, or `asset`. Must match the field's home: `tokens.json`, `intake.json`, or the virtual `assets.*` namespace. |

---

## Validation rules

- `enforce: "html"` ↔ field path resolves inside `tokens.json`.
- `enforce: "prompt"` ↔ field path resolves inside `intake.json`.
- `enforce: "asset"` ↔ field path begins with `assets.` and ends with
  `.image`. Value must be a non-empty string pointing at an image file.
- A field can only appear once in the `locks` array. Re-locking overwrites.
- `value` type must match the canonical type (`vibe.adjectives` → array,
  `colors.cta.hex` → string, `typography.headings.weight_range` → 2-element
  number array, `assets.<slot>.image` → string path).
- Hex values normalise to lowercase before write.
- Missing fields are omitted, not nulled.

---

## Round-trip example

Curriculum reference (sellersessions-derived):

```json
{
  "brand": "sellersessions-derived",
  "version": "1",
  "generated_at": "2026-04-25",
  "source": "user-via-/lock",
  "locks": [
    {
      "field": "typography.headings.font",
      "value": "Plus Jakarta Sans",
      "reason": "matches website + book cover",
      "locked_at": "2026-04-25",
      "source": "user-via-/lock",
      "enforce": "html"
    },
    {
      "field": "colors.cta.hex",
      "value": "#461499",
      "reason": "SS purple — primary brand colour",
      "locked_at": "2026-04-25",
      "source": "user-via-/lock",
      "enforce": "html"
    },
    {
      "field": "vibe.adjectives",
      "value": ["premium", "high-energy", "authoritative"],
      "reason": "no soft / playful drift across iterations",
      "locked_at": "2026-04-25",
      "source": "from-/intake-step",
      "enforce": "prompt"
    },
    {
      "field": "output_type",
      "value": "landing",
      "reason": "this brand intake is for the SSL 2026 landing page only",
      "locked_at": "2026-04-25",
      "source": "from-/intake-step",
      "enforce": "prompt"
    },
    {
      "field": "assets.hero.image",
      "value": "_assets/ssl-stage-2025.png",
      "reason": "real photo of the SSL 2025 stage — Stitch must not generate a substitute conference shot",
      "locked_at": "2026-04-25",
      "source": "user-via-/lock",
      "enforce": "asset"
    }
  ]
}
```

---

## Pipeline integration

### `/design` (Workflow D)

After loading `tokens.json` and `intake.json`, also load `locks.json` if
present. Emit a **§9. Locks** block at the end of the design brief:

```
## 9. Locks (do not change across iterations)

- typography.headings.font = "Plus Jakarta Sans" (html, brand)
- colors.cta.hex = "#461499" (html, SS purple)
- vibe.adjectives = ["premium", "high-energy", "authoritative"] (prompt)
- output_type = "landing" (prompt)
```

The same lines are appended to the Stitch prompt in plain English:

> "LOCKED — do not change: primary heading font is Plus Jakarta Sans.
> Primary CTA colour is the brand purple #461499. Page vibe must remain
> premium, high-energy, authoritative — never soft or playful."

### `/refine` (Workflow E)

After receiving the user-exported Stitch HTML, before generating the
gap-analysis table:

1. For every lock with `enforce: "html"`, scan the exported HTML.
2. Replace any drift on `typography.*.font` (CSS `font-family`, inline
   styles, Tailwind classes that map to a font).
3. Replace any drift on `colors.*.hex` (CSS hex values, `rgb()` calls,
   Tailwind colour utilities).
4. Append a **§7. Lock corrections** block to the gap-analysis output
   listing every replacement, with old → new + reason.
5. For every lock with `enforce: "asset"`, run the ref-image harness
   (`scripts/ref-image-check.py`):
   - HTML scan for the pinned filename across all image-bearing
     attributes.
   - Perceptual-hash fallback against every image in the export bundle.
   - Per-slot verdict (`PASS` / `PASS-VARIANT` / `FAIL`).
6. Append a **§8. Asset locks** block to the gap-analysis output with
   headline counts (e.g. *"2 slots · 1 PASS · 1 FAIL"*) and a pointer
   to the full report at `brands/<slug>/ref-image-report.md`.
7. The cleaned HTML is the artefact handed back to the user.

`enforce: "prompt"` locks are *not* applied here — they were already in
the Stitch prompt and any drift on them is a vibe judgement, not a
mechanical replacement.

---

## How to set / unset

- `/lock` — guided interview: which field, what value, why.
- `/unlock <field>` — remove a single lock.
- `/locks` — list current locks for the active brand.

Schema for the `/lock` skill: `Claude-UI-Workflow/.claude/skills/lock/SKILL.md`.
