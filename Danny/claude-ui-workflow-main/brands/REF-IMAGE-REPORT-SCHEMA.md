---
project: claude-ui-workflow
last_updated: 2026-04-25
role: ref-image-report-schema
---

# `ref-image-report.md` — Schema

> Per-slot verdicts produced by the ref-image harness
> (`scripts/ref-image-check.py`) when `/refine` runs against a Stitch
> export. Persisted at `brands/<slug>/ref-image-report.md` alongside
> `tokens.json`, `intake.json`, `locks.json`, and `ingestion-confidence.md`.
>
> Read by `/refine` to populate **§8. Asset locks** in the gap-analysis
> output. Read by the operator as the curriculum-grade reference for what
> survived the export.

---

## Why a separate file?

`/refine`'s gap-analysis is a single-pass document that gets noisy when
asset checks land alongside HTML cleanup, anti-pattern audits, and
performance scoring. The standalone report keeps the per-slot evidence
and recommendation visible after the gap-analysis has scrolled off, and
mirrors the `ingestion-confidence.md` pattern: every milestone produces
a reviewable on-disk artefact.

---

## Top-level shape

```markdown
---
brand: <slug>
generated_at: <ISO date>
export_source: <path to the Stitch HTML or ZIP>
locks_checked: <integer>
verdict_summary:
  pass: <integer>
  pass_variant: <integer>
  fail: <integer>
---

# Reference Image Report — <brand slug>

Generated 2026-04-25 from `_captures/stitch-export-25apr.zip` against
4 asset locks in `brands/<slug>/locks.json`.

**Headline:** 3 PASS · 1 PASS-VARIANT · 1 FAIL  (5 slots checked)

## Per-slot verdicts

| Slot | Pinned image | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| `assets.hero.image` | `_assets/at2020.png` | PASS | found in `<img src="assets/at2020.png">` | — |
| `assets.features.card_1.image` | `_assets/podcast-rig.png` | PASS-VARIANT | renamed to `assets/img_004.png`, hash distance 4 | — |
| `assets.features.card_3.image` | `_assets/at2020.png` | FAIL | not found in HTML or asset bundle | `/regen-nb2 features.card_3` |

## Notes

- Hash threshold: 12 (perceptual hash distance). Anything ≤ 12 is treated
  as the same image; > 12 is treated as a different image.
- Slot semantics are not verified. The harness checks whether the pinned
  image is present *somewhere* in the export. If Stitch placed it in the
  wrong section, the user catches that visually.
- `FAIL` recommendations point at NB2 fallback by default. Other options:
  re-prompt Stitch, or accept the drift if Stitch's substitution is
  acceptable.
```

---

## Verdicts

| Verdict | Meaning | Trigger |
|---|---|---|
| `PASS` | Pinned filename found in the exported HTML. | HTML scan matches `<img src>`, `srcset`, `style="background-image:..."`, `<picture>`, or any `data-*` attribute referencing the filename. |
| `PASS-VARIANT` | Pinned image found in the export's asset bundle under a different filename (Stitch renamed). | Filename absent from HTML, but a perceptual-hash compare against every image file in the export bundle returns a distance ≤ threshold. |
| `FAIL` | Pinned image neither in the HTML nor in the asset bundle. | Stitch dropped the image entirely or substituted its own. |

---

## Frontmatter fields

| Field | Type | Notes |
|---|---|---|
| `brand` | string | Brand slug (matches the folder). |
| `generated_at` | ISO date | When the harness ran. |
| `export_source` | string | Path to the Stitch HTML file or ZIP that was checked. Relative to repo root if inside the workflow, absolute otherwise. |
| `locks_checked` | integer | Number of `enforce: "asset"` locks in `locks.json` at run time. |
| `verdict_summary.pass` | integer | Count of `PASS` verdicts. |
| `verdict_summary.pass_variant` | integer | Count of `PASS-VARIANT` verdicts. |
| `verdict_summary.fail` | integer | Count of `FAIL` verdicts. |

---

## Per-slot table columns

| Column | Notes |
|---|---|
| `Slot` | The dotted path from the asset lock (`assets.hero.image`). |
| `Pinned image` | The path stored in the lock's `value` field. |
| `Verdict` | `PASS` / `PASS-VARIANT` / `FAIL`. |
| `Evidence` | One-line proof. PASS → first matching HTML attribute. PASS-VARIANT → matched filename + hash distance. FAIL → "not found in HTML or asset bundle". |
| `Recommendation` | `—` for passes. For FAIL: `/regen-nb2 <slot>` or a manual instruction. |

---

## Hash threshold

The harness uses a perceptual hash (pHash, 64-bit) and treats distances
≤ **12** as a match. This tolerates lossy re-encoding, light cropping,
and minor recolouring while rejecting fully different images.

The threshold is a constant in `scripts/ref-image-check.py`
(`HASH_DISTANCE_THRESHOLD = 12`). Tighten if you see false-positives;
loosen if Stitch's re-encoder is producing distance ~15+ on your assets.

---

## §8 summary in `/refine` gap-analysis

The gap-analysis output gets a compact pointer — the full report stays
in `ref-image-report.md`:

```markdown
## §8. Asset locks

5 slots checked · 3 PASS · 1 PASS-VARIANT · 1 FAIL

Failed:
- `assets.features.card_3.image` (pinned `_assets/at2020.png`)
  → recommend `/regen-nb2 features.card_3`

Full report: `brands/sellersessions-derived/ref-image-report.md`
```

---

## Why no slot-aware verification?

Stitch's HTML output doesn't carry the workflow's slot semantics
(`data-slot="hero"` etc.), so the harness can't reliably tell which
section is "the hero". Slot-aware checking would need either:

- **Browser rendering** (Playwright + region screenshots + perceptual
  hash on slot crops) — heavy, and arbitrary Stitch HTML often won't
  render correctly without its full asset bundle.
- **Stitch-side annotation** (asking Stitch to add `data-pin-slot`
  attributes) — fragile, prone to prompt drift.

For B8 the harness verifies presence, not placement. If the user pins
a hero image and Stitch puts it in the footer, the harness records
`PASS` and the user catches the misplacement visually. This is a
conscious scope cut — placement-aware checking is a B9-or-later
extension.
