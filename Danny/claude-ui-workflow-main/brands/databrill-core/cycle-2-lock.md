# Cycle-2 Brand Lock — Databrill Core

**Locked:** 2026-04-26
**Cycle:** 2 (autonomous dogfood with pre-checks)
**Predecessor:** cycle-1 retechuk (closed 2026-04-26)

## Pick

**Brand:** Databrill Core
**Domain:** core.databrill.com (live, Ellis-built deploy)
**Source of truth:** `Claude-UI-Workflow/brands/databrill-core/profile.md` + `tokens.json` (canonical dark system, refreshed 25 Apr)
**Companion canonical:** `Databrill-Core/stitch-build/DESIGN.md` (Stitch design system, dark premium)

## Archetype delta vs cycle-1 (retechuk)

| Dimension | retechuk | databrill-core | Why this delta matters |
|---|---|---|---|
| Theme mode | Light | Dark | Exercises dark-theme code path in `ingest-url.py::map_to_tokens` (#29 light-theme bug stays out of scope, as planned) |
| Vertical | E-commerce (apparel) | B2B SaaS (data infra) | Different copy archetype — proof-grids and pricing tiers vs product cards |
| Stack archetype | Shopify | Custom React SPA + Netlify static | Out of #27 Shopify-CTA scope (planned) |
| Visual language | Craft / decorative / pastel | Glassmorphic / mesh-gradient / glow CTAs | Tests STITCH-MODEL-RULES on premium-SaaS aesthetic instead of fashion |
| Copy weight | Light, lifestyle | Dense, technical, narrative-heavy (four weak links) | Stresses content-density rules vs cycle-1's image-heavy hero pattern |

## Live-vs-canonical alignment (corrected 2026-04-26 after screenshot review)

Reference: `_captures/live-site-reference-2026-04-26.png` (Danny-supplied full-page Shottr).

**Observed (live `core.databrill.com`):** dark bg (~`#0c0a14`), orange CTA buttons (`Start Free Trial`, `Log in`), orange step-number circles, full-bleed orange "Stop Paying to Access Your Own Data" outro band, full content laid out (hero, problem, solution, how-it-works, who-it's-for, comparison table, footer). **Missing/broken images** in 4 problem-grid cards and the BI-Tool comparison cell — these render as pale placeholder boxes, which is what tripped my earlier WebFetch parse.

**Canonical (this lockfile + `DESIGN.md`):** same dark + orange foundation. Adds purple `#7c6bbd` secondary accent, Space Grotesk display font, glassmorphic surfaces, glow CTAs, gradient mesh background, four-rings logo concept.

**Gap = polish, not foundation.** Ellis's live deploy is correctly aligned to the canonical core direction; what's missing is decorative/secondary layer (purple accents, glassmorphism, glow, mesh gradient, populated images).

Cycle-2 plan:
1. Stage 2: run extractor against `core.databrill.com`. Expect orange/dark to dominate the signal; purple may be absent (no live-site usage). Compare to canonical `tokens.json`.
2. Stage 3: screenshot assist using `_captures/live-site-reference-2026-04-26.png` — should confirm dark/orange and flag missing-image regions.
3. Stage 4 token validation: reconcile extracted (live) + canonical (intent). Purple gets re-injected from canonical; missing images flagged for asset work.

**Expected new finding-class for cycle-2:** `live-deploy-undershoots-canonical` — when extractor captures a partial/in-progress deploy and the canonical brand profile carries layers the deploy hasn't shipped yet, what's the merge rule?

## Fix-wave disposition (carried from cycle-1 close-out)

Findings #27, #28, #29 are NOT pulled forward. Verified rationale in
`dogfood/2026-04-25-retechuk/friction-log.md` — disposition table stamped
2026-04-26. Trigger conditions don't match Databrill Core (custom site / no
raster decorative / dark theme).

## Cycle-2 entry conditions

- ✅ Brand picked + locked (this file)
- ✅ Canonical profile + tokens already on disk (`brands/databrill-core/profile.md`, `tokens.json`)
- ✅ Pre-check spine ready (`PRE-CHECK-CHECKLISTS.md`)
- ✅ Stitch model rules locked (`STITCH-MODEL-RULES.md`)
- ⏳ Cycle-2 dogfood folder to be created at run time: `dogfood/2026-04-26-databrill-core/`

## Open question for Stage 2 (URL ingestion)

Run `ingest-url.py core.databrill.com` and accept Ellis's deploy as the
extracted profile (then test the override path), OR skip Stage 2 and feed the
canonical `DESIGN.md` directly into Stage 4 (tokens validate)?

Recommendation: **run Stage 2** — the divergence is a free workflow stress
test we won't get cheaply on any other brand.

## References

- Cycle-1 friction log: `Claude-UI-Workflow/dogfood/2026-04-25-retechuk/friction-log.md`
- Pre-checks: `Claude-UI-Workflow/PRE-CHECK-CHECKLISTS.md`
- Stitch model rules: `Claude-UI-Workflow/STITCH-MODEL-RULES.md`
- Canonical profile: `Claude-UI-Workflow/brands/databrill-core/profile.md`
- Canonical tokens: `Claude-UI-Workflow/brands/databrill-core/tokens.json`
- Stitch design system (primary feed): `Databrill-Core/stitch-build/DESIGN.md`
- **Realised reference (operator-built, local)**: `Databrill-Core/.Archives/wp-waitlist/waitlist.html` — fully-implemented version of the canonical system. Same tokens, gradient borders, glow CTAs, ticker, glassmorphic surfaces, hero radial-gradient mesh. Use as the visual aspiration target for Stitch generation.
- Live screenshot (Ellis deploy): `brands/databrill-core/_captures/live-site-reference-2026-04-26.png`
- Project master log: `Databrill-Core/MASTER-LOG.md`
