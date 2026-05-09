---
name: main-image-concepts
description: Generate 5-10 Amazon main image concepts for an ASIN using Higgsfield AI image generation. Defaults to GPT Image (latest) and Nano Banana Pro — best-quality only. Each concept is scored against the 6-dimension main image rubric (Fidelity, Background, Scroll-Stop, Compliance, Creative, Quality). Use when running `main-image-concepts {ASIN}`, when you need standalone main image ideation without polling, or as a sub-step of `main-image-pipeline`.
---

# main-image-concepts — AI-Generated Main Image Concepts

Standalone concept generation using Higgsfield. Replaces the early "designer ideation" cycle (5-10 days, $500-$2000) with same-day AI concepts that go to designers for polish.

## Methodology — read before rendering

**Read `reference/02-visual-content/main-image-creative-director.md` in full before generating any concept.** That file is the source-of-truth for: the 8 enhancement techniques (one per variant, no repeats), the 6-section mandatory prompt structure, the 5 thumbnail rules, the 4-axis scoring rubric (40/30/15/15), and the iteration loop.

Hard rules from that file (non-negotiable):
- **Aspect ratio: 1:1**, locked in at start AND end of every prompt
- **Reference image always**: pull live product photo from `brain/products/{asin}-{geo}.json` and pass to Higgsfield's image-to-image input
- **Brand guidelines respected**: read `brain.business.brand_guidelines` for colours / fonts / visual style keywords; if empty, fall back to neutral premium aesthetic and flag on the concept card
- **Cap at 3 attempts per concept** before surfacing failure honestly

Output emits `florence-concepts-{asin}` per the artifact protocol.

## Prerequisites

**Higgsfield MCP must be connected** at https://mcp.higgsfield.ai/mcp. If not connected:
1. Tell user: "Higgsfield MCP isn't connected. Open Claude Settings → Connectors → Add Custom Connector → URL `https://mcp.higgsfield.ai/mcp` → sign in with Higgsfield account."
2. Pause until connected, then resume.

## Invocation

```
main-image-concepts {ASIN}
main-image-concepts {ASIN} --count=8           # default 8
main-image-concepts {ASIN} --model=gpt-image   # or nano-banana-pro (default), or both
main-image-concepts {ASIN} --research={path}   # use existing research brief
```

## Output

Writes to `/tmp/cro-content/{ASIN}-main-concepts-{date}.md` with embedded image URLs and a scoring grid. Saves images to `/tmp/cro-content/{ASIN}-main-concepts/` directory.

## Default Models (Best-Only Policy)

Per the skill plan: best-quality models only, no multi-model spread by default.

- **Primary:** `nano-banana-pro` — best for product fidelity + clean Amazon look
- **Alternate:** `gpt-image` (latest) — best for creative angles + dramatic lighting
- **Fallback:** `flux-kontext` for product replacement / packaging variations

To explicitly compare across models, use `main-image-multi-model` instead.

## Phase 1 — Source the Brief

Required inputs (in order of preference):
1. `--research={path}` — existing brief from `asin-deep-research`
2. Existing `/tmp/cro-research/{ASIN}-research-brief-*.md` (most recent)
3. If neither: trigger `asin-deep-research` first, then resume

The brief provides:
- Top 3 purchase drivers (what to lead with visually)
- Top 3 objections (what to preempt)
- Customer demographic (who's in the image, if person)
- Competitor SERP cluster (what visual styles are saturated)

Required: confirm with user the **product reference image URL** (clean PNG, white BG) before generating. Higgsfield Soul/Nano Banana need this for fidelity.

## Phase 2 — Concept Brief Generation

Translate the research into 8 distinct concept directions per `02-visual-content/main-image.md`:

**Standard concept slate (pick 5-8 from this menu based on research):**

| # | Concept type | Pulls from research | Example |
|---|-------------|--------------------|---------|
| 1 | Hero product, dramatic angle | Top driver + scroll-stop rule | Wide-angle, soft shadow, premium feel |
| 2 | Product + premium packaging | Brand trust + table stakes | Box visible, product foreground |
| 3 | Scale reference (if size matters) | Size objection | Hand holding / next to known object |
| 4 | Dominant color break | Visual SERP cluster analysis | If SERP is white/neutral, use bold color |
| 5 | On-product label callout | Top driver legibility at thumbnail | "100mg" / "30 servings" visible at 150px |
| 6 | Set/bundle visualization | If multipack & not visible | Quantity grouped clearly |
| 7 | Alt angle (top-down or 3/4) | Differentiation | Most competitors use one angle, break |
| 8 | "Open" or "in-use" hint | Scroll-stop curiosity | Lid off, contents partially visible |

Each concept gets a structured prompt that includes:
- Product fidelity instruction (use reference image)
- Background rule: pure white #FFFFFF
- Composition: product fills 85%+
- Compliance: no text/logos/badges (Amazon main image rule)
- Style: photorealistic, e-commerce, soft natural lighting
- Aspect ratio: 1:1 (Amazon main image)
- Resolution: 2000×2000 minimum

## Phase 3 — Generate via Higgsfield MCP

For each concept (8 by default):
- Call Higgsfield generate with primary model (`nano-banana-pro`)
- Pass: prompt, reference image, aspect 1:1, resolution 2000×2000

Run in batches of 4 (Higgsfield can handle parallel; respect MCP rate limits).

If a generation fails the fidelity check (product visibly different), re-run with `gpt-image` as fallback.

## Phase 4 — Score Against the 6-Dimension Rubric

Per `MASTER-CRO-REFERENCE.md` §3 (Main Image scoring):

| Dimension | What to check (1-10) |
|-----------|----------------------|
| Fidelity | Does it look like the actual product? Color accuracy? Shape? |
| Background | Pure white, no artifacts, no reflections, clean cutout? |
| Scroll-Stop | Does it break from the SERP cluster? Read at 150px thumbnail? |
| Compliance | No text/logos/badges? Product fills 85%+? Min 1000px? |
| Creative | Beyond "catalog shot" — angle, lighting, depth of field? |
| Quality | Resolution sharpness, no AI artifacts, lighting consistency? |

**Pass:** average ≥7 with no dimension <5.
**Auto-fail triggers:** product too small, flat catalog shot, dull lighting, cluttered, visible cutout artifacts, product blends into white.

## Phase 5 — Output

```markdown
# Main Image Concepts — {Title}

**ASIN:** {ASIN} | **Date:** {date} | **Models:** {models} | **Reference:** {ref-image-url}

## Brief Summary
- Top driver: {from research}
- Top objection to preempt: {from research}
- SERP visual cluster: {from competitor sweep}
- Differentiation play: {strategy chosen}

## Concept Grid

| # | Concept | Image | Fid | BG | Stop | Compl | Creat | Qual | Avg | Pass |
|---|---------|-------|-----|-----|------|-------|-------|------|-----|------|
| 1 | Hero, dramatic angle | ![](path) | 9 | 10 | 8 | 10 | 8 | 9 | 9.0 | ✅ |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

## Top 3 Recommended (for next step)

1. **Concept #X — {name}** (Avg: 9.2) — Why: {1 line on which research signal it lands}
2. **Concept #Y — {name}** (Avg: 8.8) — Why: {...}
3. **Concept #Z — {name}** (Avg: 8.5) — Why: {...}

## Recommended Next Skill

- Validate with shoppers: `main-image-poll {ASIN} --concepts={1,2,3}`
- Or run the full pipeline: `main-image-pipeline {ASIN}` (research → generate → 3-second test → poll → winner)
```

## Reference Files

- `~/.claude/skills/cro/main-image-best-practices.md` — full 6-dim scoring + Amazon compliance
- `~/.claude/skills/hero-image/prompt-engineering.md` — proven Higgsfield prompt patterns
- `~/.claude/skills/hero-image/image-scoring.md` — scoring rubric details
- Vault: `CRO-Knowledge-Base/02-visual-content/main-image.md`
- Vault: `CRO-Knowledge-Base/MASTER-CRO-REFERENCE.md` §3 (Main Image)

## Quality Bar

- [ ] At least 5 distinct concept directions (not 8 variations of one idea)
- [ ] Every concept passes Amazon compliance (no text/logos)
- [ ] Reference image used — products are recognizable
- [ ] Scoring filled for every concept (no blank cells)
- [ ] Top 3 picks justified with research-signal references
- [ ] Saved images accessible at `/tmp/cro-content/{ASIN}-main-concepts/`

## Auto-Triggers

Runs (without prefix) when:
- User asks "generate main image concepts for {ASIN}"
- User completes `asin-deep-research` and asks for visuals
- `main-image-pipeline` calls it as a sub-step

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

