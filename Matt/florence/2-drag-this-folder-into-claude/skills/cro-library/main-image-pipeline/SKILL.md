---
name: main-image-pipeline
description: End-to-end main image optimization pipeline — the flagship CRO play. Pulls SellerApp competitor SERP, generates 8 main image concepts via Higgsfield (GPT Image / Nano Banana Pro), runs a 3-second billboard test on top 3 via ProductPinion, then runs a final Image Split Test to declare a winner. Use when running `main-image-pipeline {ASIN}` or when an ASIN has a CTR problem (low CTR vs category index). Replaces the 3-week external designer cycle with a same-day-to-3-days pipeline.
---

# main-image-pipeline — Flagship CRO Pipeline

Single command that orchestrates the highest-ROI play in the skill library: research → AI concepts → billboard test → split test → ship-ready winner. Main image is the highest CTR lever on Amazon; this is the one to run first when an ASIN has a CTR gap.

## Methodology — read before rendering

Before generating ANY main-image concept, **read `reference/02-visual-content/main-image-creative-director.md` in full**. That file is the source of truth for:

- The 8 enhancement techniques (one per concept, no repeats across the variants)
- The 6-section mandatory prompt structure (Product Position / Angle / Lighting / Extra Items / White Background / Square Format)
- The 5 thumbnail rules (frame fill 85%, hero angle, perceived quality, pattern interrupt, instant category recognition)
- The 200–350 word prompt cap + the terminator anchor
- The 4-axis scoring rubric (40/30/15/15 — F/I/C/R) and 5 binary pre-screen checks
- Reference image handoff (live product photo from `brain/products/{asin}-{geo}.json`, always passed)
- Aspect ratio enforcement: **1:1 hard-coded** for main images
- Iteration loop: cap at 3 attempts per concept, fail honestly if the model can't deliver

**Aspect ratio is non-negotiable.** Every prompt ends with `square 1:1 format, e-commerce product photography, hyper-realistic, ultra-sharp, 8k`. Wrong-ratio outputs trigger automatic re-generation.

Concept gallery output emits `florence-concepts-{asin}` per the artifact protocol — see `0-paste-this-into-custom-instructions.txt` § *When to emit per-product artifacts*.

## Prerequisites

This pipeline calls 3 skills in sequence, so all of these must be available:
- ✅ SellerApp via n8n MCP (workflow `9RmjDT107uXtrImf`)
- ⚠️ Higgsfield MCP — required for Phase 2; see prerequisites in `main-image-concepts`
- ⚠️ ProductPinion MCP — required for Phases 3-4; see prerequisites in `main-image-poll`

If any are missing, skill stops at that phase with a setup instruction and a `--resume-from={phase}` flag for after the user connects the missing piece.

## Invocation

```
main-image-pipeline {ASIN}
main-image-pipeline {ASIN} --skip-3-second    # skip Phase 3, go straight to split test
main-image-pipeline {ASIN} --concepts=10      # default 8
main-image-pipeline {ASIN} --resume-from=3    # if a prior run stopped at a phase
```

## Output

Master report: `/tmp/cro-content/{ASIN}-main-pipeline-{date}.md` — links to each phase output. Final ship-ready image saved to `/tmp/cro-content/{ASIN}-main-WINNER.png`.

## State File

Persists state to `/tmp/cro-content/{ASIN}-main-pipeline.state.json` after every phase so the pipeline is resumable across sessions.

## Phase 0 — Re-entry Check

```
Check: /tmp/cro-content/{ASIN}-main-pipeline.state.json
```

If found:
- "Found existing pipeline at Phase {N}. Resume or restart?"
- Resume → skip to phase
- Restart → archive old state, begin Phase 1

## Phase 1 — Research & SERP Sweep

Calls `competitor-sweep {ASIN}` (which itself calls `asin-deep-research` if no brief exists).

Outputs needed for Phase 2:
- Top 3 purchase drivers (visual must-shows)
- Top 3 objections (preempt list)
- Customer demographic
- Competitor SERP cluster — the dominant visual style your thumbnail must break from
- Quality benchmarks (target rating, image count, etc.)

State after Phase 1: `phase: "concepts", brief_path: "/tmp/cro-research/..."`

## Phase 2 — AI Concept Generation

Calls `main-image-concepts {ASIN} --research={brief_path} --count=8`.

Default models: `nano-banana-pro` primary, `gpt-image` fallback. Best-only — no multi-model spread.

Outputs:
- 8 generated concepts in `/tmp/cro-content/{ASIN}-main-concepts/`
- Scored concept grid (6-dim rubric)
- Top 3 recommended

State after Phase 2: `phase: "billboard_test", top_3: ["A", "B", "C"]`

## Phase 3 — 3-Second Billboard Test (ProductPinion)

The "Show Me, Don't Tell Me" rule from `MASTER-CRO-REFERENCE.md` requires the main image to communicate in <2 seconds. This phase runs ProductPinion's **Pinion Ask 3 Second Test** on the top 3 concepts to validate before the more expensive split test.

Setup:
- Test type: Pinion Ask → 3 Second Test (per ProductPinion docs)
- Each concept shown for 3 seconds, followed by quick recall questions:
  - "What product did you see?" (free text)
  - "What stood out?" (free text)
  - "Would you click to learn more?" (yes/no)
- Sample: 50 shoppers per concept (3 concepts = 150 total)
- Audience: research-brief-derived demographic

Pass criteria per concept:
- ≥80% correctly identified the product category
- ≥40% would click

Concepts that fail this gate are dropped from Phase 4. If 0-1 pass: stop pipeline, return to Phase 2 with feedback.

State after Phase 3: `phase: "split_test", finalists: ["A", "C"]` (those that passed the gate)

## Phase 4 — Image Split Test (ProductPinion)

Calls `main-image-poll {ASIN} --concepts={finalists}` with sample size of 100 per option (200+ total).

Outputs:
- Winner declaration with % preference + confidence
- Qualitative "why" themes
- Ship/iterate recommendation

State after Phase 4: `phase: "complete", winner: "A", winner_path: "/tmp/.../concept-A.png"`

## Phase 5 — Ship-Ready Output

Master report at `/tmp/cro-content/{ASIN}-main-pipeline-{date}.md`:

```markdown
# Main Image Pipeline — {Title}

**ASIN:** {ASIN} | **Date:** {date} | **Total run time:** {duration}

## TL;DR

🏆 **Winner:** Concept {X} — {brief description}
**Confidence:** {high/med/low} from {N} shoppers
**Recommended next step:** Launch in Amazon Manage Your Experiments

## Pipeline Trace

| Phase | Output | Link |
|-------|--------|------|
| 1. Research | Brief + competitor matrix | [link] |
| 2. AI Concepts | 8 generated, top 3 picked | [link] |
| 3. Billboard Test | 2 of 3 passed gate | [link] |
| 4. Split Test | Winner declared | [link] |

## Winner Image

![](concept-A.png)

## Why It Won (qualitative)

- Theme 1: {%}
- Theme 2: {%}
- Theme 3: {%}

## Designer Brief (handoff to polish)

{For external designer if final cleanup is needed:}
- Use the AI-generated concept as composition reference
- Maintain: {key elements that drove the win}
- Polish: {color accuracy / cutout cleanup / lighting tweak}
- Final spec: 2000×2000 PNG, white #FFFFFF background, sRGB

## MYE Launch Plan

- Test: New main image vs current
- Duration: 14 days minimum (per `05-testing/test-design-methodology.md`)
- Success metric: CTR lift ≥10% with 95% confidence
- Failure plan: revert to current, queue Concept {Y} for next test
```

## Reference Files

- This skill orchestrates `asin-deep-research`, `competitor-sweep`, `main-image-concepts`, `main-image-poll`
- `~/.claude/skills/cro/main-image-best-practices.md`
- Vault: `CRO-Knowledge-Base/02-visual-content/main-image.md`
- Vault: `CRO-Knowledge-Base/05-testing/test-design-methodology.md`

## Quality Bar

- [ ] All 4 phases completed (or graceful stop at MCP-prerequisite phase)
- [ ] State file persisted after each phase (resumable)
- [ ] Master report has winner, confidence, "why", and MYE launch plan
- [ ] Designer brief section is filled (this is the handoff to external polish)
- [ ] Winner image saved to `{ASIN}-main-WINNER.png` for easy retrieval

## Failure Modes

| Phase | Failure | Action |
|-------|---------|--------|
| 1 | Research returns thin data | Stop, prompt user; this is the foundation |
| 2 | All 8 concepts fail compliance | Re-run with stricter prompt template |
| 3 | 0-1 concepts pass billboard | Return to Phase 2 — concepts not strong enough |
| 4 | No statistical winner (e.g. 51/49) | Two paths: ship best, OR run a 3rd contender |

## Auto-Triggers

Runs (without prefix) when:
- User says "fix the main image for {ASIN}" / "low CTR on {ASIN}"
- Diagnostic shows low CTR + healthy CVR (per `04-data-analysis/metric-to-action-framework.md`)
- User asks for "the full main image play" or "end-to-end main image"

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

