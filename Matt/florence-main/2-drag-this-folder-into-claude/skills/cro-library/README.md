# CRO Skill Library

Forty-six specialized CRO skills layered on top of Florence's nine core skills. Each one chains the same three MCPs Florence already speaks (SellerApp, ProductPinion, Higgsfield) into a focused job — research a single ASIN, kill a specific objection, generate a main image variant, validate with a Pinion test, etc.

The full plan + priority order is in [`INDEX-skill-library-plan.md`](./INDEX-skill-library-plan.md).

---

## Where this fits with Florence's core skills

Florence's nine core skills (`onboard`, `today`, `track-products`, `optimize-listing`, `shopper-interrogator`, `recommend-test`, `pinion`, `render`, `setup-validate`, `restore-brain`, `florence-help`) are the **front door** — the curated daily-loop UX that takes a seller from "no setup" to "ship this today." The skills in this library are the **deep-dive toolkit** Florence reaches for when:

1. The user asks for a specific advanced flow by name (e.g., `asin-deep-research B07XYZ`)
2. A core skill (`optimize-listing`, `shopper-interrogator`) decides to delegate to a more specialized library skill mid-flow
3. The user wants a multi-step pipeline like `main-image-pipeline` or `cvr-leak-fix`

Florence's core skills always run first. The library is opt-in.

---

## The 46 skills, by funnel stage

### A. Research & Diagnostic (SellerApp-led) — 10 skills

Replace 3-4 hours of manual data pulling that precedes every research brief.

`asin-deep-research` · `review-mining` · `rufus-gap-analysis` · `competitor-sweep` · `sqp-priority-rank` · `listing-quality-audit` · `keyword-cvr-leak` · `main-image-thumbnail-audit` · `keyword-rank-tracker` · `review-velocity-monitor`

### B. Content Generation (Higgsfield-led) — 10 skills

Replace external designer cycles for early concept exploration. Designers polish finalists; AI handles the 80% that gets cut.

`main-image-concepts` · `main-image-multi-model` · `soul-character-train` · `lifestyle-stack-generator` · `infographic-builder` · `aplus-module-generator` · `ugc-video-creator` · `hero-video-builder` · `ad-creative-batch` · `packaging-mockup`

### C. Pre-launch Validation (ProductPinion-led) — 12 skills

Insert real-shopper validation **before** paying for Manage Your Experiments. Cheaper, faster, surfaces the qualitative "why."

`main-image-poll` · `listing-battle` · `copy-split-test` · `three-second-test` · `objection-video` · `listing-optimization-video` · `competitor-research-video` · `price-sensitivity` · `aplus-comprehension` · `stacked-gallery-test` · `ranked-priorities` · `audience-builder`

### D. Combined Pipelines — 9 end-to-end plays

Research → generate → validate → ship-ready brief, in one orchestrated skill.

`main-image-pipeline` · `cvr-leak-fix` · `objection-killer` · `rufus-answer-pack` · `quarterly-listing-refresh` · `aplus-premium-build` · `serp-attack-plan` · `listing-launch-pack` · *(plus the cro-content-plan-pro umbrella, in `INDEX-skill-library-plan.md`)*

### E. Ongoing Operations — 5 scheduled jobs

Keep the optimization loop alive between active engagements.

`competitor-watch` · `profit-recalc-on-change` · `review-sentiment-shift` · `portfolio-lqi-watch` · `auto-refresh-trigger`

---

## How Florence picks one

She doesn't auto-fire any of them. The rule:

1. User explicitly types the slash command (e.g., `asin-deep-research B07XYZ`) → Florence reads `cro-library/asin-deep-research/SKILL.md` and runs it
2. A core skill is mid-flow and lands on a specialized step (e.g., `optimize-listing` finishes audit; user says "now give me 5 image concepts to test the top action") → Florence reads `cro-library/main-image-concepts/SKILL.md` and follows it
3. User asks for one of the named pipelines ("run a CVR leak fix on B0X") → matches `cvr-leak-fix` → Florence reads + executes

Florence's core trigger map (in `0-paste-this-into-custom-instructions.txt`) doesn't list every library skill — she discovers them by name when the user invokes them. The `INDEX-skill-library-plan.md` in this folder is her catalog.

---

## Tool-prefix normalisation

The library was written for Claude Code's skill convention where MCP tools are referenced with explicit prefixes like `mcp__f32016b6-7c77-45e2-b4a2-70195c5f2d2d__Get_Product_Details`. **In Florence's Cowork environment, MCPs surface their tools by human-readable name** (`Get Product Details`, `Get Product Reviews`, etc.) — no prefix.

When Florence runs a library skill, she **mentally translates** any `mcp__<uuid>__<tool>` reference she sees in the skill text to the matching tool name on her Cowork toolbelt. Example:

| Skill text says | Florence calls |
|---|---|
| `mcp__f32016b6-7c77-45e2-b4a2-70195c5f2d2d__Get_Product_Details` | `Get Product Details` (SellerApp MCP) |
| `mcp__pp__create_poll` | `create_poll` (ProductPinion MCP) |
| `mcp__higgs__generate_image` | the matching Higgsfield image-gen tool |

The tool **arguments + behaviour** are identical between the two prefixes — only the surface naming differs.

---

## Source-of-truth files each family relies on

| Family | Reference files |
|---|---|
| Research (A*) | `01-research/building-research-brief.md`, `01-research/review-mining.md`, `01-research/rufus-ai-queries.md`, `01-research/competitor-audit.md`, `01-research/keyword-analysis.md` |
| Content gen (B*) | `02-visual-content/core-visual-principles.md`, `02-visual-content/main-image-tactics-library.md`, `MASTER-CRO-REFERENCE.md` §3-4 |
| Validation (C*) | `03-testing-methodology/decision-tree.md`, `03-testing-methodology/question-framing.md`, `05-productpinion/case-studies.md`, `05-productpinion/knowledge-base.md` |
| Pipelines (D*) | `cro-process.md`, `MASTER-CRO-REFERENCE.md` |
| Operations (E*) | `04-data-analysis/metric-to-action-framework.md` |

---

## Mission alignment check

Every library skill earns its place by improving CTR or CVR. The B/D families that touch image / video generation default to **Amazon listing assets** — main image variants, listing slot 2-7, A+ modules. They don't drift into off-mission territory like ad-engine bulk creative or social media — that's deliberately out of scope, same as Florence's core `render` skill.

If a library skill ever feels like it's pulling Florence away from the CTR/CVR loop, treat it as a smell, not a feature.

---

## Status

The 46 skill files in this folder are **integration-ready** but not yet validated against Florence's existing skill-spec format (When / Inputs / Tools / Outputs / Behaviour / Don't). They use a different format (YAML frontmatter + body). Florence reads both formats interchangeably; she follows whichever is present.

Re-formatting to Florence's canonical shape is a follow-up — for v1 of this integration, the library ships as-uploaded so the user can start firing the slash commands immediately.

---

## How to reference this in chat

> asin-deep-research B07XYZ4231

> Run the main image pipeline on B07XYZ — full thing.

> What's the rufus gap on B08ABC?

> Run an objection killer on the Argan Oil ASIN.

Florence reads the matching `cro-library/<skill>/SKILL.md`, follows the steps, and reports.
