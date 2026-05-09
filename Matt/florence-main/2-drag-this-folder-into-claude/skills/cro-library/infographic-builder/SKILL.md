---
name: infographic-builder
description: Build Amazon listing infographics for slots 2-7 — Higgsfield-generated photography with overlay callouts following the 70%-photo / 3-5 callouts / 24pt+ / 3-6 word callouts design rules. Use when running `infographic-builder {ASIN} --slot={N} --benefit="{benefit}"` or when a slot needs to communicate a benefit + features with text overlay.
---

# infographic-builder — Slot 2-7 Infographic Generator

Most listing images that try to be infographics fail the design rules: too much text, wrong photo-to-text ratio, callout text too small, generic stock photography. This skill enforces the rules.

## Methodology — read before rendering

**Read `reference/02-visual-content/listing-image-creative-director.md` in full before generating.** Even infographic slots follow the editorial design philosophy from that file — clean type, generous white space, photo of product as the anchor. Florence's listing concepts read as editorial diagrams, not as clipart.

Hard rules:
- **Aspect ratio: 1:1** for listing slots 2–7. Locked in at start AND end of every prompt.
- **Reference image always**: pull live product photo from `brain/products/{asin}-{geo}.json` and pass to Higgsfield
- **Brand guidelines respected**: `brain.business.brand_guidelines` drives palette + visual style + type
- **Editorial type only** — generate clean photography with text-zone whitespace; brand designer adds type cleanly in post. Higgsfield's text rendering is unreliable for callouts at small sizes.
- **No clipart elements** — no callout arrows, no dimension lines (with line endcaps), no overlay boxes, no burst stickers. Editorial diagrams instead: clean photo + clean type.

The exception case described in the listing creative-director reference (slot 4 when explicitly asked for spec/size info) follows the same editorial mandate — diagram, not clipart.

Output emits `florence-concepts-{asin}` per the artifact protocol.

## Prerequisites

- Higgsfield MCP
- Research brief or context for the benefit being demonstrated

## Invocation

```
infographic-builder {ASIN} --slot=3 --benefit="all-day energy"
infographic-builder {ASIN} --slot=4 --type=ingredient-callouts
infographic-builder {ASIN} --slot=5 --type=size-comparison
```

## Output

`/tmp/cro-content/{ASIN}-infographic-slot-{N}.png` + brief markdown explaining the design choices.

## Design Rules (NON-NEGOTIABLE per `02-visual-content/listing-images.md`)

1. **Photography first, copy second** — image is 70%+, callouts 3-6 words each
2. **One message per image** — don't try to explain three things
3. **3-5 callouts max**
4. **Text legible at mobile (24pt+, ideally larger)**
5. **Mobile billboard test** — communicates in <2 seconds

## Phase 1 — Pick Concept Type

Based on slot + benefit:

| Type | Best for | Example structure |
|------|----------|-------------------|
| Benefit + 3 callouts | "all-day energy" | Hero photo + 3 short callouts above/beside |
| Ingredient/feature callouts | "5 active ingredients" | Product center + 5 ingredient callouts radiating out |
| Before/after | "skin transformation" | Split screen with minimal labels |
| Size/scale comparison | "fits in your pocket" | Product next to known reference (hand, coin) |
| Step-by-step (3 panels) | "easy to use" | 3 stacked panels with one short caption each |
| Spec table | "by the numbers" | Photo + clean spec list (numerals, not words) |

## Phase 2 — Generate Hero Photography

Higgsfield call: Nano Banana Pro (default) for product fidelity. Pure white or contextual background depending on type. Pass product reference image.

## Phase 3 — Compose Overlay

Two paths:
- **A. Higgsfield with text overlay** — Pass instruction "render exactly these callouts: [text]" — works well for Nano Banana Pro and GPT Image but verify text spelling/legibility (AI text often misspells)
- **B. Generate image alone, overlay text post-process** — More reliable. Higgsfield generates, then a Python/PIL or Figma-based overlay step adds text layers. This skill recommends path B for production-quality output.

For path B: skill outputs the photo + a structured callout JSON `{position, text, font, size}` that a designer or downstream automation overlays.

## Phase 4 — Validate

Auto-checks:
- ✅ ≤5 callouts? 
- ✅ Each callout ≤6 words?
- ✅ Text size ≥24pt at 2000×2000?
- ✅ Photo dominates (70%+ pixels)?
- ✅ One message?

If any fail: regenerate with corrected prompt.

## Phase 5 — Output

```markdown
# Infographic — {ASIN} Slot {N}

**Benefit:** {benefit} | **Type:** {concept type} | **Date:** {date}

## Image

![](infographic-slot-{N}.png)

## Design Choices Trace

- Photography: {description, model used, fidelity rating}
- Callouts: {list with word counts}
- Mobile billboard test: {pass/fail at 400×400}
- One message: {what it is}

## Callout JSON (for designer overlay)

```json
{
  "callouts": [
    {"text": "ALL-DAY ENERGY", "position": "top-right", "size": "32pt"},
    ...
  ]
}
```

## Approve / Iterate

- ⬜ Approve as-is for designer polish
- ⬜ Iterate: regenerate with {feedback}
```

## Reference Files

- Vault: `CRO-Knowledge-Base/02-visual-content/listing-images.md` (the 70/30 photo/text rule)
- `~/.claude/skills/cro/listing-image-best-practices.md`

## Quality Bar

- [ ] Auto-validation passed (5 ✅ checks)
- [ ] Mobile billboard test verified (render at 400×400, manually scan)
- [ ] Callout JSON exported (downstream overlay automation hook)
- [ ] One message per image — never breaks this rule

## Common Mistakes

- ❌ Cramming 7 callouts because the product has 7 features (pick top 3-5)
- ❌ Using AI-rendered text without verifying spelling
- ❌ Skipping the mobile test — looks great at 2000×2000, illegible at 400×400

## Auto-Triggers

- After `keyword-cvr-leak` flags a benefit-image gap
- `/cro-content-plan` slot 2-7 phase
- `cvr-leak-fix` when fix is "add infographic showing X"

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

