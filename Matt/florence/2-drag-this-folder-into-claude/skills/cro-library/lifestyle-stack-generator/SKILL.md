---
name: lifestyle-stack-generator
description: Generate demographically-accurate lifestyle photography for Amazon listing slots 2-7 using Higgsfield. Pulls customer demographic from review-mined photo evidence, optionally trains a Soul Character for cross-slot consistency, then generates 6 lifestyle/use-case images. Use when running `lifestyle-stack-generator {ASIN}` or when the listing image stack needs people-in-context photography.
---

# lifestyle-stack-generator — Slot 2-7 Lifestyle Photography

Per `02-visual-content/listing-images.md`, slots 2-3 are highest-impact conversion slots, and lifestyle photography (people using the product in context) is one of the top image types. This skill generates that stack consistently across all 6 slots using Soul Character training.

## Methodology — read before rendering

**Read `reference/02-visual-content/listing-image-creative-director.md` in full before generating any concept.** That file is the source of truth for:

- Editorial design philosophy (Monocle / Kinfolk aesthetic, NOT infographic clipart)
- The 5-spinoff methodology (same hero benefit, 5 different visual deliveries via lever rotation)
- The 6-section mandatory prompt structure (Scene / Position / Lighting / Palette / Type Placement / Aspect Ratio)
- The anti-clipart rules — no callout arrows, dimension lines, overlay boxes, flow charts, annotated diagrams, burst stickers
- 4-axis scoring rubric (40/30/15/15)
- Iteration loop: cap at 3 attempts per slot

Hard rules:
- **Aspect ratio: 1:1** for listing slots 2–7. Locked in at start AND end of every prompt.
- **Reference image always**: pull live product photo from `brain/products/{asin}-{geo}.json` and pass to Higgsfield
- **Brand guidelines respected**: `brain.business.brand_guidelines` drives palette + visual style keywords; falls back to editorial neutral if empty
- **No text generation in image** — generate clean photography with type-zone whitespace; brand designer adds type in post

Output emits `florence-concepts-{asin}` per the artifact protocol.

## Prerequisites

- Higgsfield MCP connected (https://mcp.higgsfield.ai/mcp)
- Existing research brief or `asin-deep-research` already run
- Product reference image (clean PNG)

## Invocation

```
lifestyle-stack-generator {ASIN}
lifestyle-stack-generator {ASIN} --slots=2,3,4,5,6,7         # default all 6 slots
lifestyle-stack-generator {ASIN} --train-soul                # train a Soul Character first for consistency
lifestyle-stack-generator {ASIN} --reference-photos={dir}    # use customer photo references for demographic
```

## Output

`/tmp/cro-content/{ASIN}-lifestyle-stack-{date}.md` + 6 images saved to `/tmp/cro-content/{ASIN}-lifestyle/slot-{N}.png`.

## Phase 1 — Demographic Source

Pull from research brief:
- **Photo review evidence** — age band, gender split, race distribution, setting (home / office / outdoor / etc.)
- **Use context** — when/where/how customers report using it
- **Lifestyle keywords** — "for small apartments" / "as a gift" / "during travel"

If brief missing demographic data: pause, request `review-mining --media-only` first.

## Phase 2 — Soul Character Training (optional but recommended)

If `--train-soul` flag (or 6+ slots requested): train a Soul Character with 3-5 reference photos matching the demographic, save trained character ID to brand state file at `~/.claude/skills/lifestyle-stack-generator/.brand-characters.json`.

Reuse trained characters across ASINs in the same brand → big consistency win.

## Phase 3 — Slot-by-Slot Concept Brief

For each slot, derive the concept from research:

| Slot | Concept type | Source signal |
|------|--------------|---------------|
| 2 | Hero benefit photography | Top driver (reviews + keywords) |
| 3 | Secondary benefit / use case | Second driver |
| 4 | Lifestyle in-context | Photo review evidence + lifestyle keyword |
| 5 | Detail shot or scale ref | Top objection (size / quality) |
| 6 | Edge case / additional use | Positive surprise from reviews |
| 7 | Strong close — gifting / family / pride | Repurchase signal |

## Phase 4 — Generate

Default model per plan: **Nano Banana Pro** for product fidelity, **GPT Image** for creative angles. No multi-model spread — best-only.

Per slot:
- Pass: prompt + Soul Character (if trained) + product reference + slot-specific composition
- Aspect: 1:1 (Amazon main image) or 4:5 (mobile)
- Resolution: 2000×2000

## Phase 5 — Output

```markdown
# Lifestyle Image Stack — {Title}

**ASIN:** {ASIN} | **Date:** {date} | **Soul Character:** {trained ID or N/A}

## Demographic Anchor (from review photos + research)

- Age: {band}
- Gender: {split}
- Setting: {home/office/outdoor}
- Use context: {when/where}

## Slot Plan

| Slot | Concept | Image | Driver/Objection | Approve? |
|------|---------|-------|-------------------|----------|
| 2 | {} | ![](slot-2.png) | {} | ⬜ |
| ... | ... | ... | ... | ... |

## Designer Brief (handoff)

For polish:
- Maintain consistent character across all slots (Soul ID: {})
- Use trained character for any future variations
- Output spec: PNG, sRGB, 2000×2000 (1:1) or 1600×2000 (4:5 mobile)

## Recommended Next Skill

- Validate stack: `stacked-gallery-test {ASIN}` (Pinion gallery comparison)
- Or full content plan: `/cro-content-plan {ASIN}` (combines all slots + A+ + copy)
```

## Reference Files

- Vault: `CRO-Knowledge-Base/02-visual-content/listing-images.md`
- `~/.claude/skills/cro/listing-image-best-practices.md`
- `~/.claude/skills/hero-image/prompt-engineering.md`

## Quality Bar

- [ ] Each slot has a research-traced rationale (no slot-as-decoration)
- [ ] Demographic accuracy validated against photo reviews
- [ ] Soul Character ID saved if trained (for reuse across ASINs in brand)
- [ ] Mobile-first check: text legible at 400×400px (per `MASTER-CRO-REFERENCE.md` §1)

## Auto-Triggers

- User asks "generate lifestyle images for {ASIN}"
- `/cro-content-plan` calls it for slot 2-7 work
- `cvr-leak-fix` calls it when the leak is image-shaped

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

