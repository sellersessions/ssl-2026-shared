# Florence ↔ CRO Knowledge Base Mapping

**Source:** Drive folder
[CRO-Knowledge-Base](https://drive.google.com/drive/folders/1QxDcrV6qMDrn2bPwHsrUPlwToOetem0v)
(owner: Dorian)

This is the living index of Keplo's existing CRO methodology and how
each piece feeds Florence's skills. The Drive folder is the canonical
source of truth — Dorian and Matt keep adding to it, and Florence
treats it as authoritative.

A subset of files is mirrored locally into `knowledge/cro/` for
build-time guarantees (no Drive dependency at workshop install time).
The rest stays in Drive and is loaded on demand via the Drive MCP.

---

## What's mirrored vs what stays in Drive

### Mirrored locally (ships with the repo)

These are the **AI-ready synthesis files** that get loaded into Florence's
context as system-prompt-level reference material. They're small, dense,
and the canonical references for every skill:

| File | Size | Loaded by |
|---|---|---|
| `knowledge/cro/MASTER-CRO-REFERENCE.md` | ~10 KB | Every skill — system prompt level. Florence's CRO-philosophy backbone. |
| `knowledge/cro/FRAMEWORK-REFERENCE.md` | ~6 KB | Skill 2 (Variation Engine) primarily. Has the 6-dimension image scoring rubric. |
| `knowledge/cro/cro-process.md` | ~6 KB | Daily brief, prioritisation. The CTR/CVR funnel model + Keplo's 4-stage workflow. |
| `knowledge/cro/02-visual-content/core-visual-principles.md` | ~9 KB | Skill 2 + Skill 3 (image blueprint). The 6 non-negotiable visual rules. |
| `knowledge/cro/04-data-analysis/metric-to-action-framework.md` | ~6 KB | Daily brief diagnostics. The signal→diagnosis→action matrix. |
| `knowledge/cro/01-research/building-research-brief.md` | ~6 KB | Skill 3 (Shopper Interrogator) output format. The 5-question synthesis. |

### Stays in Drive (loaded on demand)

Larger or per-skill methodology files. Florence's skills load these via
the Drive MCP when the user asks a question that needs them. Not
duplicated locally because (a) they evolve frequently and (b) full
mirror would push the repo size up unnecessarily.

| Folder | Files | Loaded by |
|---|---|---|
| `01-research/` (other 4) | review-mining, keyword-analysis, rufus-ai-queries, competitor-audit | Skill 3 (Shopper Interrogator) + Skill 1 (Market Informant) |
| `02-visual-content/` (other 3) | main-image, listing-images, a-plus-content | Skill 2 (Variation Engine) on demand |
| `03-copy/` | title-optimization, bullet-point-optimization, copy-visual-alignment, backend-search-terms | Skill 1 + future copy skill |
| `04-data-analysis/` (other 4) | business-reports, search-query-performance, advertising-analysis, brand-analytics | Daily brief, Skill 1 |
| `05-testing/` | test-design-methodology, manage-your-experiments, interpreting-results, iteration-cycles | Skill 4 (Evergreen Tester) |
| `06-process/` | optimization-pipeline, client-delivery-workflow, quality-checklists, ongoing-maintenance | `/onboard` skill, routine configs |
| `masterclasses/` | Full HTML masterclasses (main image, A+, listing images) | Skill 2 deep mode + onboarding "show your work" artifacts |
| `visual-examples/` | Good vs bad teaching images | Skill 2 calibration data |
| `sqp/` | SQP-specific SOPs, n8n PRD | Skill 1 + SellerApp Reverse-ASIN keyword data |

### Not used by Florence

These exist in Drive but Florence doesn't load them:

- `07-meeting-insights/` — operational learnings, Gemini meeting transcripts. Background context only.
- `prds/` — internal product requirement docs. Reference only.
- Client-specific data (PriorityChef, Brandvised, EttaVita, Ideal Direct). Privacy-scoped.

---

## How each Florence skill uses CRO Knowledge

### Skill 1 — Market Informant (competitor watch)

**Distilled brief loaded into skill:**
- Competitor audit methodology (from `01-research/competitor-audit.md`)
- Keyword & search-intent rules (from `01-research/keyword-analysis.md`)
- SQP analysis (from `04-data-analysis/search-query-performance.md`)

**Full files loaded on demand** when user asks "tell me more about why":
- `04-data-analysis/business-reports.md`
- `04-data-analysis/advertising-analysis.md`
- `04-data-analysis/brand-analytics.md`
- `sqp/` SOPs

**Florence's behaviour:** when she runs Skill 1 nightly, she pulls
SQP shifts → cross-references the audit method → produces a "competitor
moved here, you should respond" recommendation. The decision rules
come straight from the lifted methodology.

### Skill 2 — Variation Engine (main-image redesign)

**Distilled brief loaded into skill:**
- The 6 non-negotiable visual principles (from `core-visual-principles.md`)
- Main-image hard requirements + scoring rubric (from `main-image.md` + `FRAMEWORK-REFERENCE.md`)
- Listing-images slot priority rules (from `listing-images.md`)

**Full files loaded on demand:**
- All `02-visual-content/` files
- `masterclasses/` HTML when user asks "show me a deep walkthrough"
- `visual-examples/` good-vs-bad pairs as inline references

**Florence's behaviour:** when she generates an image variation, every
decision traces back to a specific source rule. "I'm proposing this
because — see core-visual-principles.md, principle 1 (Show Me, Don't
Tell Me)." Recommendations are auditable, not opaque.

### Skill 3 — Shopper Interrogator (review mining + Rufus + PP poll → image blueprint)

**Distilled brief loaded into skill:**
- Review mining decision rules + volume thresholds (from `review-mining.md`)
- Rufus-to-content mapping (from `rufus-ai-queries.md`)
- Research brief format — the 5-question synthesis (from `building-research-brief.md`)

**Full files loaded on demand:**
- All `01-research/` files
- Matt's PP-specific methodology (separate, see Section below)

**Florence's behaviour:** the headline workshop demo skill. The output
follows the canonical research-brief format from
`building-research-brief.md` so every shopper-objection → image-blueprint
recommendation has the same shape Keplo already trusts.

### Skill 4 — Evergreen Tester (image tournament loop)

**Distilled brief loaded into skill:**
- Test design methodology (from `05-testing/test-design-methodology.md`)
- Result interpretation rules (from `05-testing/interpreting-results.md`)
- Iteration cycle pattern (from `05-testing/iteration-cycles.md`)

**Full files loaded on demand:** all `05-testing/` files.

**Florence's behaviour:** this skill needs Matt's PP-specific test
methodology to be rigorous (sample sizes, audience, question framing).
Dorian's `05-testing/` folder is generic test design; Matt's input
fills in the PP-specific layer.

### Daily brief (`/florence-brief-daily`)

**Distilled brief loaded into skill:**
- The metric-to-action matrix (from `metric-to-action-framework.md`) — this is the diagnostic engine
- The Keplo CRO funnel + 4-stage workflow (from `cro-process.md`)
- Optimization priority order (from `MASTER-CRO-REFERENCE.md`)

**Florence's behaviour:** every morning, she pulls overnight signals,
runs them through the metric-to-action matrix verbatim, and produces
the day's "What I'd do today" recommendation in the same vocabulary
the Keplo team already uses.

### `/onboard` skill

**Distilled brief loaded into skill:**
- Client delivery workflow (from `06-process/client-delivery-workflow.md`)
- Quality checklists (from `06-process/quality-checklists.md`)

**Florence's behaviour:** her onboarding interview pulls structure and
rigor from the existing Keplo CRO Partner Program engagement flow —
the same shape Dorian uses for new clients.

---

## How Matt's input augments this

Dorian's CRO Knowledge Base is comprehensive on **research, visual
content, copy, data analysis, and process**. Matt's input file
(`docs/inputs-matt.md`) fills the gaps the base doesn't cover:

1. **Test methodology specific to Product Pinion** — sample sizes,
   confidence thresholds, audience targeting, question framing,
   shopper-panel quirks. Dorian's `05-testing/` is generic; PP has its
   own conventions Matt encodes separately.
2. **Real PP case studies** — wins, losses, surprising-loss
   calibration. These become Florence's reference set for "I've seen
   tests like this before — here's how it played out."
3. **PP MCP contract** — the technical layer Florence calls. Lives in
   `knowledge/pp-mcp-contract.md` once Matt fills in the inputs file.
4. **A/B testing decision tree** — given a seller goal, which test
   does Florence suggest? Becomes a lookup table inside her skills.

When Matt's `florence-matt-answers.md` lands, it gets mirrored to
`knowledge/cro/08-pp-methodology/` as a separate authored block (not
merged into Dorian's `05-testing/` because authorship and citation
should stay distinct).

**Net:** Dorian's CRO Knowledge Base + Matt's PP expertise = Florence's
complete operating manual. No third source needed.

---

## Important gap: the 40/30/15/15 prioritisation framework

This plan and `presentation.md` repeatedly reference a **"40/30/15/15"**
prioritisation scoring framework. **It is not in the CRO Knowledge
Base.** The closest thing is the 6-dimension main-image scoring rubric
in `FRAMEWORK-REFERENCE.md` (Fidelity / Background / Scroll-Stop /
Compliance / Creative / Quality, each 1–10) — but that's an image
quality assessment, not a CRO prioritisation framework.

So either:

1. 40/30/15/15 lives in Dorian's head and needs to be written down
   (the inputs-dorian.md template C section captures this)
2. It's elsewhere we haven't surfaced
3. It needs to be explicitly designed now

**Until it's defined**, Florence's skills use:
- The 6-dimension image scoring rubric where applicable
- The metric-to-action matrix (`metric-to-action-framework.md`) as
  the working priority logic for daily-brief recommendations

Once Dorian fills C in `docs/inputs-dorian.md` (or Section C of the
Notion page **Florence — My Inputs (Dorian)**), Florence's
prioritisation skill gets the canonical scoring spec.

---

## Refresh strategy

The CRO Knowledge Base evolves. Florence stays in sync via:

1. **Build-time snapshot:** at workshop install, the mirrored synthesis
   files in `knowledge/cro/` are whatever was in the repo at that
   moment. Predictable for delegates.
2. **Runtime Drive MCP:** non-mirrored files are loaded live from
   Drive when a skill needs them. Always current.
3. **`/florence-knowledge-sync` skill** (post-workshop, Stage 9): when
   Dorian pushes major updates to a synthesis file, this skill pulls
   the diff into the local mirror and regenerates the distilled briefs
   in affected skills. One-command refresh.

Workshop delegates get option 1 by default. Power users opt into 2 + 3.

---

## Open decisions

| Decision | Recommendation | Status |
|---|---|---|
| **Mirror full Drive vs synthesis-only?** | Synthesis-only (current approach) — keeps repo lean, Drive MCP loads the rest | Going with this |
| **Granularity of distilled skill briefs** | ~500 words per skill, with full-file references for deep mode | Going with this |
| **Versioning** | Snapshot at build time, sync skill for power users | Going with this |
| **Where does Matt's input land?** | `knowledge/cro/08-pp-methodology/` — separate authored block | Going with this |
| **40/30/15/15 framework** | Dorian to define in inputs (Section C) | **Pending Dorian** |

---

## Inventory snapshot (2026-05-04)

This list is generated from the Drive folder as of 2026-05-04. When
Dorian or Matt adds new content, this section gets updated.

### Top-level (8 files)
- `MASTER-CRO-REFERENCE.md` ⭐ MIRRORED
- `FRAMEWORK-REFERENCE.md` ⭐ MIRRORED
- `INDEX-master-cro-reference.md`
- `README.md`
- `AGENTS.md`
- `CHANGELOG.md`
- `cro-process.md` ⭐ MIRRORED
- `client-workflows.md`

### `01-research/` (5 files)
- `building-research-brief.md` ⭐ MIRRORED
- `review-mining.md`
- `keyword-analysis.md`
- `rufus-ai-queries.md`
- `competitor-audit.md`

### `02-visual-content/` (4 + 4 older)
- `core-visual-principles.md` ⭐ MIRRORED
- `main-image.md`
- `listing-images.md`
- `a-plus-content.md`
- `00-overview-amazon-visual-content-guide.md` (~34 KB)
- `00-masterclass-amazon-visual-content.md` (~32 KB)
- Older: `main-image-best-practices.md`, `listing-image-best-practices.md`, `a-plus-content-best-practices.md`

### `03-copy/` (4 files)
- `title-optimization.md`
- `bullet-point-optimization.md`
- `copy-visual-alignment.md`
- `backend-search-terms.md`

### `04-data-analysis/` (5 files)
- `metric-to-action-framework.md` ⭐ MIRRORED
- `business-reports.md`
- `search-query-performance.md`
- `advertising-analysis.md`
- `brand-analytics.md`

### `05-testing/` (4 files)
- `test-design-methodology.md`
- `manage-your-experiments.md`
- `interpreting-results.md`
- `iteration-cycles.md`

### `06-process/` (4 files)
- `optimization-pipeline.md`
- `client-delivery-workflow.md`
- `quality-checklists.md`
- `ongoing-maintenance.md`

### Folders not mirrored
- `07-meeting-insights/` — operational logs
- `masterclasses/` — long-form HTML
- `prds/` — product requirement docs
- `sqp/` — SQP-specific SOPs
- `visual-examples/` — good/bad teaching images

---

## Florence-side files this mapping creates

When implementation runs:

| Path | Purpose |
|---|---|
| `knowledge/cro/MASTER-CRO-REFERENCE.md` | Mirrored synthesis (Florence's CRO backbone) |
| `knowledge/cro/FRAMEWORK-REFERENCE.md` | Mirrored synthesis (visual-content framework) |
| `knowledge/cro/cro-process.md` | Mirrored synthesis (CTR/CVR process model) |
| `knowledge/cro/02-visual-content/core-visual-principles.md` | Mirrored synthesis (6 non-negotiable principles) |
| `knowledge/cro/04-data-analysis/metric-to-action-framework.md` | Mirrored synthesis (signal→action matrix) |
| `knowledge/cro/01-research/building-research-brief.md` | Mirrored synthesis (5-question research format) |
| `docs/cro-knowledge-mapping.md` | This file — the human-readable index |

The mirror is not exhaustive by design. It's the spine. Drive MCP
loads everything else on demand.
