---
project: claude-ui-workflow
last_updated: 2026-04-25
role: brand-inventory
---

# Brand Inventory

> One row per brand. Tells you at a glance which brands are real, complete,
> and ready to drive `/design` runs vs. which are stub or partial.
> Source of truth for `brands/` folder state. Update on every brand add or
> material change.

---

## Schema (from `_template/profile.md`)

A complete brand profile has 11 sections: Identity, Theme, Colours, Typography,
Key Effects, Page Structure, Deploy Rules, Image Constraints, Animation
Preferences, Performance Budget, Anti-Patterns. Brand-specific extensions
(Components, Visual REFINE Techniques, Section Banding Depths, Semantic Token
Architecture, Brand Narrative) are additive.

A complete brand asset set has: `profile.md`, `moodboard.tldr` (now retired),
`moodboard-assets/`, `moodboard-snapshot.png`, `moodboard-summary.md`. With
the moodboard retirement (25 Apr pivot), the `moodboard-*` artefacts become
historical-reference-only — new brands won't generate them.

---

## Inventory

| Slug | Profile | Schema coverage | Extras | Moodboard | Status | Notes |
|---|---|---|---|---|---|---|
| `_template` | ✅ 1.9KB | 11/11 sections (placeholders) | — | — | **template** | Source of truth for the schema. Do not populate. |
| `sellersessions` | ✅ 7.1KB | 11/11 + Components, Visual REFINE | 27 colour tokens, 20 named components, 14 REFINE techniques | ✅ `.tldr` + assets + snapshot + summary | **complete** | Only fully populated brand. Reference profile for ingestion design. tokens.json: 10 colours, 4 typography keys. |
| `databrill` | ✅ 6.9KB | 11/11 + Light + Dark colour variants, Semantic Tokens, Section Banding | Dual-mode tokens (design-system light vs Stitch build dark), 10 REFINE techniques | ❌ no `.tldr` | **partial** | Strong tokens, strong narrative. Missing Image Constraints (only deploy rules). No moodboard run. tokens.json: 13 colours (first table only — emit picks first `## Colours` block). |
| `databrill-core` | ✅ 5.9KB | 11/11 + Brand Narrative + Section Banding | Dual-mode colours, 218 moodboard-asset files, 72 moodboard-drop files, ring-wordmark concepts, logo lockups | ✅ `.tldr` (54KB — large) + assets + snapshot + summary | **partial-rich** | Profile slim relative to extensive moodboard work. tokens.json: 9 colours (rgba rows skipped — schema is hex-only), 5 typography keys. |
| `claude-ui-workflow` | ⚠️ 374B | meta-brand stub | — | ✅ `.tldr` (1.2KB — placeholder) | **meta** | Internal slug for workflow diagrams. Not a real brand. Will retire with moodboard. tokens.json: empty colours/typography. |
| `sellersessions-derived` | auto-gen | from-URL ingest | tokens + profile + confidence | — | **derived-demo** | B3 demo: ingested from sellersessions.com via `npm run ingest-url`. 80% match vs canonical (passes bar). Misses: gold CTA + tertiary + accent_orange (not on homepage). Reproducible: `python3 scripts/ingest-url.py https://sellersessions.com --slug sellersessions-derived`. |
| `snoozeshade-derived` | auto-gen | from-URL ingest | tokens + profile + confidence | — | **derived-demo** | B3 demo: ingested from snoozeshade.com (light theme + role-inversion validation case). Correctly maps mint `#d5f1ed` to primary, orange `#fc6815` to CTA. |

Legend:
- **complete** — populated profile + (where applicable) moodboard
- **partial** — profile populated but missing schema sections or major extras
- **partial-rich** — heavy assets but light profile (asset/profile mismatch)
- **template** — schema source, never populated
- **meta** — placeholder, not a real brand

---

## Implications for the ingestion build

`tokens.json` schema landed 25 Apr session 2 (B1 done — see
`brands/TOKENS-SCHEMA.md` and `scripts/emit-tokens.py`). Next: brand-ingestion
URL mode (B2). Seller Sessions is the validation case — its tokens.json
already captures 10 colours + 4 typography roles. Re-deriving from
`https://sellersessions.com` should hit ≥80% of those fields. Anything
below that bar means the URL-mode extractor needs more work.

Databrill (light + dark dual-mode) is the harder validation case — the
ingestion needs to detect both modes from a single URL. Current emit picks
only the first `## Colours` block; multi-mode handling is a B2/B7 question.

`claude-ui-workflow` retires with the moodboard.

---

## Adding a new brand (today, manual)

1. Copy `brands/_template/profile.md` to `brands/<new-slug>/profile.md`.
2. Fill the 11 sections. Use `sellersessions/profile.md` as the populated
   reference.
3. Add the brand here as a new row.
4. Update the brand-detection list in `/design` if the slug isn't auto-matchable
   from project descriptions.

Post-SSL: the ingestion build replaces step 2 — supply a URL / style guide doc
/ screenshot, get a populated profile + tokens.json + confidence score in one
shot.
