---
name: packaging-mockup
description: Generate Amazon packaging mockup variations for split testing — Sunspot Packaging Test™, Open Package Test™, Back Packaging Test, Brand Name Test variations using Higgsfield Flux Kontext / Nano Banana. Use when running `packaging-mockup {ASIN} --variant={test-type}` or when running ProductPinion pre-defined templates that need packaging variations.
---

# packaging-mockup — Packaging Variation Generator

Several ProductPinion pre-defined templates (Sunspot, Open Package, Back Packaging, Brand Name, Tilted Image) need packaging variations to test. This skill generates them via Higgsfield Flux Kontext or Nano Banana.

## Prerequisites

- Higgsfield MCP
- Product reference image (current packaging)

## Invocation

```
packaging-mockup {ASIN} --variant=sunspot       # solid color / darker package
packaging-mockup {ASIN} --variant=open          # product opened, contents visible
packaging-mockup {ASIN} --variant=back          # back of packaging visible
packaging-mockup {ASIN} --variant=brand-name    # alternate brand name on label
packaging-mockup {ASIN} --variant=tilted        # angled / tilted main image
packaging-mockup {ASIN} --variant=keyphrase     # visible keyphrase on label
packaging-mockup {ASIN} --all                   # generate all 6 variants
```

## Output

`/tmp/cro-content/{ASIN}-packaging-{variant}.png` — one or more mockup images.

## Variant Recipes

### Sunspot Packaging Test™
Pull current product, generate variant with:
- Single dominant solid color (different from current)
- Darker overall tone
- Same logo placement
- Hides label complexity

### Open Package Test™
- Product unboxed / opened
- Lid removed
- Contents partially visible
- Stops the scroll via curiosity

### Back Packaging Test
- Back of packaging facing forward
- Shows ingredient list / spec / story
- Useful when back has differentiation copy

### Brand Name Test
- Same packaging, alternate brand name on front
- Test 2-3 brand name candidates
- Use a separate ProductPinion poll to pick

### Tilted Image Test
- Same packaging, angled/tilted vs straight-on
- Tests which presentation reads better at thumbnail

### Keyphrase Test™
- Add a visible keyphrase to the label/front
- Examples: "0g Sugar" / "100% Natural" / "Made in USA"
- Tests whether claim-on-package improves CTR

## Phase 1 — Generate

Higgsfield Flux Kontext for packaging modifications (best at structured edits to existing imagery). Nano Banana Pro fallback for cleaner standalone generation.

## Phase 2 — Validate Compliance

Amazon main image rules apply if used as main:
- Pure white background
- 85%+ product fill
- No text added that violates compliance (varies by category — some allow on-package text, some don't)

## Phase 3 — Output

```markdown
# Packaging Mockup — {ASIN}

**Variant:** {type} | **Date:** {date}

## Current vs Variant

| | Current | Variant |
|---|---------|---------|
| Image | ![](current.png) | ![](variant.png) |

## Compliance Check

- White BG: ✅
- Product fill: 87%
- No added text: ✅

## Recommended Next Skill

- Test against current: `main-image-poll {ASIN} --concepts=current,variant`
- Or stage in main image pipeline: `main-image-pipeline {ASIN}`
```

## Reference Files

- ProductPinion docs — pre-defined poll templates
- `~/.claude/skills/cro/main-image-best-practices.md` — Amazon compliance rules

## Quality Bar

- [ ] Variant is meaningfully different (not a near-duplicate)
- [ ] Compliance checked
- [ ] Side-by-side with current included

## Auto-Triggers

- ProductPinion test plans that reference these template names
- User asks "generate {variant} mockup"

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

