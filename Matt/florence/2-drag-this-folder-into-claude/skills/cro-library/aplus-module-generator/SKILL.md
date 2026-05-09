---
name: aplus-module-generator
description: Generate the 5-7 vertical A+ Premium modules for an Amazon listing — Higgsfield image generation + structured layout following the two-half architecture (top half capture & convert, bottom half visual FAQ). Use when running `aplus-module-generator {ASIN}` or when planning A+ Premium content that follows Keplo's methodology.
---

# aplus-module-generator — A+ Premium 5-7 Module Set

Per `02-visual-content/a-plus-content.md`, A+ Premium uses two-half architecture: top 3 modules = capture & convert with photography-forward emotional content, bottom 4 modules = inform & reassure (visual FAQ).

## Methodology — read before rendering

**Read `reference/02-visual-content/aplus-creative-director.md` in full before generating any module.** (Updated in v0.1.7 — A+ has its own dedicated creative-director ref now, separate from listing-image.) That file is the source of truth for: the 13-step A+ flow, the 4 A+ Critical Rules (Legibility / Single Message / Visual Benefit / Branding consistency), the 5 Pre-Generation Checklist questions, editorial design philosophy, anti-clipart rules, the 6-section mandatory prompt structure (A+ variant), 4-axis scoring rubric, comparison-module exception, A+ module taxonomy, and iteration loop.

Hard rules specific to A+ modules:
- **Aspect ratio: 16:9** (widescreen, horizontal layout) — locked in at start AND end of every prompt. NOT 1:1. Wrong-ratio outputs trigger automatic re-generation.
- **Reference image always**: pull live product photo from `brain/products/{asin}-{geo}.json` and pass to Higgsfield
- **Brand guidelines respected**: `brain.business.brand_guidelines` drives palette + visual style keywords + type placement
- **No text generation in image**: render clean photography; brand designer adds type in post
- **No clipart elements** — no callout arrows, no dimension lines, no overlay boxes, no flow charts, no annotated diagrams, no burst stickers. A+ modules are editorial photography with type, not infographic clipart.

A+ comparison modules requiring side-by-side spec tables follow the editorial-diagram exception in the listing creative-director reference — clean type, generous white space, photo of product as anchor.

Output emits `florence-concepts-{asin}` per the artifact protocol.

## Prerequisites

- Higgsfield MCP
- Research brief (`asin-deep-research`) and Rufus gap analysis (`rufus-gap-analysis`)

## Invocation

```
aplus-module-generator {ASIN}
aplus-module-generator {ASIN} --modules=7   # 5-7, default 6
aplus-module-generator {ASIN} --premium     # use full-width hero + video
```

## Output

`/tmp/cro-content/{ASIN}-aplus-{date}.md` with 6 modules (1 hero, 2 capture, 3+ FAQ) + image set in `/tmp/cro-content/{ASIN}-aplus/`.

## Phase 1 — Source Research

Pull from existing files:
- Top 3 purchase drivers → modules 1-3 (capture)
- Top 3-4 Rufus FAQ-class queries → modules 4-7 (FAQ)
- Photo review demographics → module 1 hero

## Phase 2 — Module Plan

| Module | Type | Source | Visual approach |
|--------|------|--------|-----------------|
| 1 | Hero — emotional moment | Top driver + demographic | Full-width photography, minimal copy |
| 2 | Benefit deep-dive | Driver #2 | Photography + 1-2 short callouts |
| 3 | Differentiation / brand story | Competitive gap | Photography + short story copy (40-60 words) |
| 4 | Visual FAQ #1 | Top Rufus FAQ | Photo answers + alt-text packed |
| 5 | Visual FAQ #2 | Rufus FAQ #2 | Same |
| 6 | Comparison / why us | Reviews comparison signal | Side-by-side or callout grid |
| 7 (optional) | Final reassurance / guarantee / CTA | Repurchase signal | Trust-mark photography |

## Phase 3 — Generate Each Module

For each module:
- **Image:** Higgsfield call with module-specific prompt. Default Nano Banana Pro. Aspect varies (full-width 970×600 or two-up 487×487).
- **Copy:** Pull from research brief verbatim where possible. Keep modules scannable in 15-20s total.
- **Alt-text:** Pack with product name + keywords + benefit + use case + audience (Amazon search + Rufus index this).

## Phase 4 — Validate (per `02-visual-content/a-plus-content.md`)

- ✅ Top half is photography-forward, not specs
- ✅ Bottom half is visual FAQ (not text-only)
- ✅ No duplication of listing slot 2-7 images
- ✅ Full-width preferred over side-by-side on mobile
- ✅ Total scan time ≤20 seconds
- ✅ Alt-text on every image

## Phase 5 — Output

```markdown
# A+ Premium Module Set — {Title}

**ASIN:** {ASIN} | **Date:** {date} | **Modules:** {N}

## Two-Half Architecture

### Top Half — Capture & Convert
1. **Hero — emotional moment** ![](module-1.png)
   - Copy: {short headline + 1 sentence}
   - Alt-text: {keyword-packed string}
2. **Benefit deep-dive** ![](module-2.png)
   - ...

### Bottom Half — Inform & Reassure
4. **Visual FAQ — {Rufus query}** ![](module-4.png)
   - ...

## Designer Brief

- Image specs: 970×600 full-width (modules 1, 6); 487×487 two-up (others)
- Format: PNG, sRGB, ≤500KB each
- Use Higgsfield-generated as composition reference, polish for retail
- Do NOT duplicate any listing image (slots 1-7) — A+ should add, not repeat

## Recommended Next Skills

- Validate scannability: `aplus-comprehension {ASIN}`
- Build the FAQ alt-text pack: `rufus-answer-pack {ASIN}`
- Convert to A+ Premium spec doc: `anthropic-skills:amazon-aplus-brief`
```

## Reference Files

- Vault: `CRO-Knowledge-Base/02-visual-content/a-plus-content.md` (two-half architecture)
- `~/.claude/skills/cro/aplus-best-practices.md`
- Anthropic skill: `amazon-aplus-brief` (companion for client-ready Word doc)

## Quality Bar

- [ ] All 6 (or 7) modules have research-traced source
- [ ] Top half ≠ specs/FAQ (capture rule)
- [ ] Bottom half = visual FAQ (inform rule)
- [ ] No duplication of slot 2-7 images
- [ ] Alt-text packed on every image (often skipped — high SEO value)

## Auto-Triggers

- User asks "build A+ for {ASIN}"
- `/cro-content-plan` Phase 3 for A+
- After `rufus-gap-analysis` to act on the gaps

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

