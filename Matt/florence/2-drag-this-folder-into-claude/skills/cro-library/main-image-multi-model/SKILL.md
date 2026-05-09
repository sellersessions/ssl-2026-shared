---
name: main-image-multi-model
description: Run the same Amazon main image prompt across multiple Higgsfield models (GPT Image, Nano Banana Pro, Flux, Soul, Seedream) for side-by-side comparison. Use when running `main-image-multi-model {ASIN}` or when client/team explicitly wants to evaluate model output differences. Default workflow uses best-only single model — use this skill to override.
---

# main-image-multi-model — Multi-Model Concept Comparison

By default the skill library uses best-only models (GPT Image / Nano Banana Pro). This skill is the explicit override when you want a side-by-side: same prompt, 4-5 different models, pick the winner.

## Prerequisites

- Higgsfield MCP

## Invocation

```
main-image-multi-model {ASIN} --concept="{prompt}"
main-image-multi-model {ASIN} --models=gpt-image,nano-banana-pro,flux,soul,seedream
```

## Output

`/tmp/cro-content/{ASIN}-multi-model-{date}.md` with 4-5 images side-by-side + scoring.

## Phase 1 — Concept Setup

Single concept prompt (don't compare different concepts — same prompt for fair model comparison). Pull product reference image.

## Phase 2 — Generate Across Models

Higgsfield's Multi-Model mode supports running the same prompt across:
- **GPT Image** (latest) — creative angles, dramatic lighting
- **Nano Banana Pro** — product fidelity, clean Amazon look
- **Flux Kontext** — packaging variations, text overlay
- **Soul** — when character/person is in shot
- **Seedream 4.0** — alternate perspective

Run all 4-5 in parallel.

## Phase 3 — Score

Same 6-dim rubric as `main-image-concepts`:
- Fidelity / Background / Scroll-Stop / Compliance / Creative / Quality

Score each model's output. Compare averages.

## Phase 4 — Output

```markdown
# Multi-Model Main Image Comparison — {ASIN}

**Concept:** {prompt}

| Model | Image | Fid | BG | Stop | Compl | Creat | Qual | Avg |
|-------|-------|-----|-----|------|-------|-------|------|-----|
| GPT Image | ![](gpt.png) | 9 | 9 | 8 | 10 | 9 | 9 | 9.0 |
| Nano Banana Pro | ![](nbp.png) | 10 | 10 | 7 | 10 | 7 | 9 | 8.8 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

## Recommendation

**Winner:** {model} at {avg} — {why this model nailed this concept}.

For future runs of similar prompts: default to {model}.
```

## Reference Files

- `~/.claude/skills/main-image-concepts/SKILL.md` — the standard (single-model) workflow

## When to Use

- You explicitly want a model bake-off
- A particular concept isn't working — swap models to see if any handle it better
- Client wants to see "what's the model space look like for our product"

## When NOT to Use

- Default content planning — use `main-image-concepts` (single best-only)
- Time-pressured workflows — multi-model is slower

## Auto-Triggers

- User asks "compare models for this prompt" / "what does X model do here"

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

