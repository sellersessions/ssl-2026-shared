---
name: aplus-premium-build
description: Full A+ Premium build pipeline — research brief → 7 module designs (Higgsfield) → 1 hero video (Higgsfield Veo/Sora) → comprehension test (ProductPinion video) → designer-ready output. Use when running `aplus-premium-build {ASIN}` for brands eligible for A+ Premium and willing to invest in cinema-quality assets.
---

# aplus-premium-build — Full A+ Premium Pipeline

A+ Premium gives brands the highest-impact PDP real estate on Amazon. This is the end-to-end build.

## Methodology — read before rendering

**Read `reference/02-visual-content/aplus-creative-director.md` in full before generating any A+ module.** (Updated in v0.1.7 — A+ has its own dedicated creative-director ref now, separate from listing-image.) That file is the source of truth for: the 13-step A+ flow, the 4 A+ Critical Rules, the 5 Pre-Generation Checklist questions, editorial design philosophy, anti-clipart rules, 6-section prompt structure (A+ variant), 4-axis scoring rubric, comparison-module exception, and A+ module taxonomy.

Hard rules:
- **Aspect ratio: 16:9** widescreen on every module — locked at start AND end of every prompt
- **Reference image always**: live product photo passed to Higgsfield as image-to-image reference with every call
- **Brand guidelines respected**: from `brain.business.brand_guidelines`
- **Stack consistency**: score the SET (5-7 modules + hero video) as well as each module — visual cohesion is non-negotiable. Use Soul Character training first when available.
- **Editorial photography only** — no clipart. Comparison-module exception applies for genuine spec/size tables.

## Prerequisites

- All 3 MCPs
- Brand qualifies for A+ Premium (Vine + ≥5 published A+ pages typically)

## Invocation

```
aplus-premium-build {ASIN}
aplus-premium-build {ASIN} --modules=7 --include-video
```

## Phases

| Phase | Skill | Output |
|-------|-------|--------|
| 1 | `asin-deep-research` (or pull existing) | Research brief |
| 2 | `rufus-gap-analysis` | FAQ source for bottom half |
| 3 | `aplus-module-generator --premium --modules=7` | 7 modules, two-half architecture |
| 4 | `hero-video-builder` (optional but recommended) | Cinematic hero video |
| 5 | `aplus-comprehension` (mockup test) | Validate scannability |
| 6 | Designer brief + Brand Registry deploy spec |

## Output

`/tmp/cro-content/{ASIN}-aplus-premium-{date}.md` — full deck + assets directory.

## Output Format

```markdown
# A+ Premium — {ASIN}

**Date:** {date} | **Modules:** {N} | **Hero video:** {included / skipped}

## Module Set

[Two-half architecture per `02-visual-content/a-plus-content.md`]

### Top Half — Capture & Convert
1. Hero (with optional video) ![](module-1.png)
2. Benefit deep-dive ![](module-2.png)
3. Differentiation ![](module-3.png)

### Bottom Half — Inform & Reassure
4. FAQ #1 (Rufus-sourced) ![](module-4.png)
5. FAQ #2 ![](module-5.png)
6. Comparison ![](module-6.png)
7. Final reassurance ![](module-7.png)

## Hero Video

![Video preview](hero.gif) — {duration, model used}

## Comprehension Score

{score}/100 — {pass/fail}

## Designer Brief

- Specs per module (970×600 full-width / 487×487 two-up)
- Hero video specs (16:9, 1080p)
- Alt-text packed per module

## Brand Registry Deploy Spec

[Step-by-step spec to upload via Brand Registry A+ editor]
```

## Reference Files

- Anthropic skill: `amazon-aplus-brief` (companion for client-ready Word doc)
- Vault: `CRO-Knowledge-Base/02-visual-content/a-plus-content.md`

## Quality Bar

- [ ] All 7 modules built + comprehension-tested
- [ ] Two-half architecture preserved
- [ ] Hero video if `--include-video`
- [ ] Designer brief detailed enough to ship without further questions

## v0.1.12 — Read `brain.image_strategy` before generating

**Before drafting any Higgsfield prompt**, read `brain.image_strategy` from working memory:

- **If null** → pause and offer `image-strategy` first (~10 min, makes every future render bespoke). If user proceeds without, flag concept cards with "No category research used — generic aesthetic."
- **If set + fresh (<90d)** → inject `prompt_adjustments.scene_keywords` into prompt section 1, `palette_keywords` + `mood_keywords` into section 4, and `do NOT include {anti_patterns_csv}` near the end. Cite the strategy on each concept card.
- **If stale (>90d)** → flag and recommend `image-strategy --refresh`.

This brand-level strategy comes from `skills/image-strategy.md`'s top-15-bestsellers analysis. Same adjustments apply across every render for this brand.


## v0.1.13 — Visual verification gate + base64 embedding (NON-NEGOTIABLE)

**Florence does NOT present an image she hasn't actually looked at, AND she does NOT use raw Higgsfield URLs in artifact HTML.** Two blocking rules added in v0.1.13:

### Verification gate

After Higgsfield returns each generated image, BEFORE adding to any artifact OR sending to Pinion:

1. **Load the image into Florence's multimodal context** — paste the URL in chat so Cowork's multimodal Claude loads it natively. Narrate: *"Looking at #{N} before I include it."*
2. **Visually inspect** against: aspect ratio (1:1 main+listing / 16:9 A+), product fidelity vs reference, technique landed (visibly), background appropriate, no clipart leak (anti-clipart rules), no text-on-main-image (TOS), no model faces.
3. **If anything fails** → re-prompt with specific fix + regenerate. Cap at 3 attempts per concept; surface honestly on attempt 4.
4. **Only after ALL concepts pass** → proceed to artifact emission.

The eye trumps the score. Even if the rubric said 100/100, if visual inspection finds a wrong product or off-aspect output, it fails the gate.

### Base64 embedding

Higgsfield URLs are temporary AND Cowork's artifact iframe sandbox blocks external image loads in many builds. For every verified concept:

1. HTTP GET the Higgsfield URL → fetch image bytes
2. Detect MIME type from response headers (typically `image/png`)
3. Base64-encode the bytes
4. Substitute `{{image-src}}` (or `{{winner-image-src}}` for tests) with `data:image/png;base64,<encoded>` — NOT the raw Higgsfield URL

This makes the artifact self-contained — survives sandbox + URL expiry. ~1-3 MB per image is fine for Cowork.

The live product image (`{{product-image-url}}` in concepts.html hero strip / dossier head / cockpit product cards) stays as the live Amazon CDN URL — that's permanent and not affected.

