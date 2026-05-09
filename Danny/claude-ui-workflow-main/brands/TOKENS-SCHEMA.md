---
project: claude-ui-workflow
last_updated: 2026-04-26
role: tokens-schema
---

# `tokens.json` — Schema

> Machine-readable export of the canonical fields in `brands/<slug>/profile.md`.
> Emitted by `scripts/emit-tokens.py`. Consumed by:
> - **Lock primitive (B7)** — read locked field paths from `locks.json`
> - **Brand ingestion (B3–B5)** — output target for URL/screenshot/doc derivation
> - **Auto-REFINE (B9)** — enforce palette + typography against generated output
>
> Profile.md remains the source of truth for *prose* fields (effects, animation
> philosophy, anti-patterns). Tokens.json captures the *structured* fields
> only — the ones that have a single canonical machine value.

## Top-level shape

```json
{
  "brand": "<slug>",
  "version": "1",
  "generated_at": "<ISO date>",
  "source": "brands/<slug>/profile.md",
  "identity": { … },
  "theme": { … },
  "colors": { … },
  "decorative_palette": [ … ],
  "texture": { … },
  "line_work": { … },
  "photography_direction": "…",
  "typography": { … }
}
```

**v2 additions (2026-04-26):** `decorative_palette`, `texture`, `line_work`,
`photography_direction`. Driven by retechuk cycle-1 finding #16 — the brand
identity carried four signals (pastel petal palette, paper-grain texture,
hand-drawn organic line-work, candid outdoor lifestyle photography) that had
no schema slot and would have been invisible to /design.

## `identity`

```json
{
  "name": "Seller Sessions",
  "domain": "sellersessions.com"
}
```

Lifted from `## Identity` section bullets. `name` from `**Project:**` (first
phrase before paren), `domain` from `**Domain:**`.

## `theme`

```json
{
  "mode": "dark",
  "style": "glassmorphic with mouse-following glow cards",
  "mood": ["premium", "authoritative", "high-energy"]
}
```

Lifted from `## Theme` section bullets. `mood` is split on commas.

## `colors`

```json
{
  "<role_snake_case>": {
    "token": "ss-purple",
    "hex": "#461499"
  }
}
```

Lifted from the `## Colours` markdown table. Every row becomes a key. Role
column is lower-snake-cased ("Card BG" → `card_bg`, "Text secondary" →
`text_secondary`, "Accent orange" → `accent_orange`). Token and hex are taken
verbatim. Hex is normalised to lowercase.

**Reserved roles** (URL ingestion writes these when signal is present):
`background`, `primary`, `cta`, `accent`, `secondary`, `text`,
`text_secondary`, `card_bg`, `border`. `accent` is distinct from `primary`
and `cta` — it's a single accent hue used for chips, sale badges, secondary
CTAs, or call-out elements. Outliers detected during ingestion go here rather
than getting promoted to `primary`.

## `decorative_palette`

```json
[
  "#b89bcc",
  "#f5cf6a",
  "#f4a98c",
  "#e8b4d4"
]
```

Array of 2-6 hexes. Illustrative / petal / pop / decorative-overlay colours
that aren't part of the core palette but appear in branded illustrations,
SVG accents, gradient washes, or background blurs. Drives /design's
illustrative element generation. Empty array if the brand has no decorative
layer (e.g. clean SaaS with no illustration).

## `texture`

```json
{
  "type": "paper-grain",
  "intensity": 0.3,
  "notes": "soft noise overlay on pale bg, visible at zoom"
}
```

`type` is one of: `paper-grain`, `noise`, `gradient`, `pattern`, `solid`.
`intensity` is 0.0-1.0. `notes` is free-text observation (where it appears,
how visible). `solid` means no texture detected — value is `{ "type": "solid",
"intensity": 0 }`.

## `line_work`

```json
{
  "stroke": "#0a0a0a",
  "style": "hand-drawn",
  "weight": "thin",
  "notes": "organic circles + petal motifs at section breaks"
}
```

`style` is one of: `hand-drawn`, `geometric`, `none`. `stroke` is the
dominant stroke colour as hex. `weight` is `hairline` / `thin` / `regular` /
`bold`. `notes` is free-text observation. `none` means no decorative line
work — value is `{ "style": "none" }`.

## `photography_direction`

```json
"candid outdoor lifestyle, soft natural light, women in warm-pastel knits"
```

Free-text direction string. Drives /design's photo prompt generation.
Captures subject, lighting, location, mood. Empty string if brand has no
photography (illustration-only, dev tool, etc.). On URL ingestion, this
field is populated heuristically from `<img>` sampling but always marked
medium/low confidence — confirm via screenshot or human review.

## `typography`

```json
{
  "<role_snake_case>": {
    "font": "Plus Jakarta Sans",
    "weight_range": [600, 800]
  },
  "google_fonts_url": "https://fonts.googleapis.com/…"
}
```

Lifted from the `## Typography` table. `weight_range` is a 2-element array
parsed from strings like `600-800`. Single weights become `[n, n]`.
`google_fonts_url` lifted from the `Google Fonts URL: \`<url>\`` line below
the table.

## Validation rules

- All hex colours match `^#[0-9a-fA-F]{3,8}$` (3, 6, or 8 chars).
- All weight values are integers `100`–`900`.
- `theme.mode` must be `"dark"` or `"light"`.
- `identity.domain` is bare hostname (no protocol, no trailing slash).
- `decorative_palette` is an array (possibly empty), each entry a valid hex.
- `texture.type` ∈ `{paper-grain, noise, gradient, pattern, solid}`.
- `texture.intensity` ∈ `[0.0, 1.0]`.
- `line_work.style` ∈ `{hand-drawn, geometric, none}`.
- `photography_direction` is a string (possibly empty).
- Missing fields are omitted, not nulled. The emit script reports any required
  field it couldn't parse.

## Field-match metric (used by B3)

When brand ingestion derives a profile from a URL, the validation harness
compares the derived `tokens.json` to the canonical one. A field counts as a
match if:

- **Identity / theme strings:** case-insensitive equal after trimming.
- **Theme mood:** set equality (order-insensitive).
- **Colors:** by hex value, ignoring role rename. ≥80% of canonical hexes must
  appear in derived output.
- **Typography fonts:** the primary heading + body fonts must match exactly.

A passing run reports `≥80%` on this metric for `sellersessions` re-derived
from `https://sellersessions.com`.
