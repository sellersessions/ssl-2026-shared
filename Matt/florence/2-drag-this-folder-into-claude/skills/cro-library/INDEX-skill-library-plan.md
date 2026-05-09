# CRO Skill Library — ProductPinion + Higgsfield + SellerApp

## Context

Three new tools just came online with documented capabilities:

- **SellerApp** (23 endpoints) — accessed via n8n MCP integration (workflow `9RmjDT107uXtrImf` at https://keplo.app.n8n.cloud/workflow/9RmjDT107uXtrImf). Amazon data: product details, reviews, keywords, Rufus, BSR history, LQI, search results, sellers, profit calc, keyword tracking
- **Higgsfield MCP** (30+ models) — AI image/video generation. **Defaults: GPT Image (latest) and Nano Banana Pro for images — best-quality only, no multi-model spread by default.** Video: Veo 3.1 / Sora 2 / Kling for premium output
- **ProductPinion** (MCP-connected) — Real shopper testing: Pinion Polls (image/text split, stacked, Amazon search sim, ranked), Pinion Ask (Q&A, 3-second test, listing battle, price sensitivity), Pinion Videos (recorded reactions on any URL)

**Build format:** Every skill below is a Claude Code skill (markdown + tool calls in `~/.claude/skills/`), not an n8n workflow. SellerApp data is pulled by calling the n8n MCP that wraps the SellerApp API — Claude skills compose those calls plus Higgsfield + ProductPinion MCP calls into end-to-end CRO workflows.

The CRO Knowledge Base (`MASTER-CRO-REFERENCE.md`, `cro-process.md`, `01-research/`, `02-visual-content/`, `04-data-analysis/`, `05-testing/`) is built around four stages:

1. **Diagnose** — SQP / Business Reports / metric-to-action framework
2. **Research** — 4 sources (reviews, keywords, Rufus, competitors) → Research Brief
3. **Plan** — Translate brief into main image, listing images (2-7), A+ content, copy
4. **Test** — A/B via Manage Your Experiments + iterate

Each manual step in this chain has a clear automation lever now. This plan maps every CRO workflow to a skill that uses one or more of the three tools, organized by funnel stage so we can prioritize builds.

---

## Skill Library (by CRO funnel stage)

### A. Research & Diagnostic Skills — SellerApp-led

These replace the 3-4 hours of manual data pulling that currently precedes every research brief.

| # | Skill | Endpoints / Tools | What it produces |
|---|-------|-------------------|------------------|
| A1 | `asin-deep-research` | Product Details + Reviews (1-5★) + Rufus Queries + Reverse ASIN + Keyword Search + LQI + History | Pre-filled Research Brief sections 1-5 |
| A2 | `review-mining` | Reviews (sentiment + verified + multi-page) | Categorized purchase drivers / objections / surprises / Rufus-style questions / photo refs, with frequency tags (>30% = mandatory visual signal) |
| A3 | `rufus-gap-analysis` | Rufus Queries | Each query → classified (FAQ / comparison / use case / concern) → mapped to content slot |
| A4 | `competitor-sweep` | Keyword Search Result + Product Details (bulk) + LQI | Top-10 competitor matrix: image counts, LQI scores, BSR, table stakes vs gaps |
| A5 | `sqp-priority-rank` | Keyword Tracking bulk + Keyword Research bulk + Product Details | Portfolio scored by opportunity (Data Strength 40 / $ Impact 30 / Effort 15 / Speed 15) |
| A6 | `listing-quality-audit` | LQI + Fetch LQI Report | Triage list across portfolio with section-level issues (title, bullets, images, Q&A, reviews) |
| A7 | `keyword-cvr-leak` | Reverse ASIN + cross-reference review insights | Keywords where benefit is searched but not visually shown |
| A8 | `main-image-thumbnail-audit` | Keyword Search (extended) + competitor SERP screenshots | Side-by-side grid showing your thumbnail vs top 9 competitors |
| A9 | `keyword-rank-tracker` | Keyword Tracking schedule + Fetch Report | Daily/weekly rank changes for portfolio + alert on movers |
| A10 | `review-velocity-monitor` | Reviews (sort=recent) | New review sentiment per ASIN + critical-review surface alert |

### B. Content Generation Skills — Higgsfield-led

These replace external designer cycles for early concept exploration. Designers still polish finalists; AI handles the 80% that gets cut.

| # | Skill | Tools | What it produces |
|---|-------|-------|------------------|
| B1 | `main-image-concepts` | Higgsfield multi-model (Soul + Flux + Nano Banana Pro) | 5-10 main image concepts scored against 6-dim rubric (Fidelity / Background / Scroll-Stop / Compliance / Creative / Quality) |
| B2 | `main-image-multi-model` | Higgsfield Multi-Model mode | Same prompt across Soul, Flux, Nano Banana Pro, Seedream — side-by-side for client choice |
| B3 | `soul-character-train` | Higgsfield Soul training | Trained character used across all lifestyle slots (consistency across slots 2-7) |
| B4 | `lifestyle-stack-generator` | Higgsfield Soul + image gen | Demographically-accurate lifestyle photography for slots 2-7, matched to review-mined customer profile |
| B5 | `infographic-builder` | Higgsfield image + overlay rules from `02-visual-content/listing-images.md` | Slot 2-7 infographics with 3-5 callouts, 24pt+, 70% photo, 3-6 word callouts |
| B6 | `aplus-module-generator` | Higgsfield image (modules 1-3 hero, 4-7 FAQ) | A+ Premium-ready 5-7 vertical modules per the two-half architecture |
| B7 | `ugc-video-creator` | Higgsfield Kling / Veo / Seedance + UGC preset | 6-15 second UGC product videos for SBV / Brand Store / A+ Premium |
| B8 | `hero-video-builder` | Higgsfield Veo 3.1 / Sora 2 / Cinema Studio | Cinematic A+ hero video |
| B9 | `ad-creative-batch` | Higgsfield Ad Engine | UGC + TV spot + Wild Card variations of one product brief |
| B10 | `packaging-mockup` | Higgsfield Flux Kontext / Nano Banana | Sunspot Packaging Test™ and Open Package Test™ variations |

### C. Pre-launch Validation Skills — ProductPinion-led

These insert real-shopper validation **before** paying for Manage Your Experiments. Cheaper, faster, gets the qualitative "why".

| # | Skill | Pinion Test Type | What it validates |
|---|-------|------------------|--------------------|
| C1 | `main-image-poll` | Image Split Test (2-5 options) | Which main image stops the scroll + why |
| C2 | `listing-battle` | Amazon Search Simulation | Your listing vs top 2-3 competitors on real SERP mockup |
| C3 | `copy-split-test` | Text Split Test | 3-5 title or first-bullet variations |
| C4 | `/3-second-test` | Pinion Ask 3 Second Test | Billboard test — does the main image read in <2s |
| C5 | `objection-video` | Pinion Video (Objection Test template) | Why people don't buy — recorded with transcripts |
| C6 | `listing-optimization-video` | Pinion Video (Listing Optimization template) | What's confusing on the listing — recorded |
| C7 | `competitor-research-video` | Pinion Video (Competitor Research template) | Why shoppers click competitors instead of you |
| C8 | `price-sensitivity` | Pinion Ask Price Sensitivity | PMC / PME / OPP / Acceptable Range |
| C9 | `aplus-comprehension` | Pinion Video on A+ URL | Scannability check — do shoppers grasp it in 15-20s |
| C10 | `stacked-gallery-test` | Stacked Image Test (galleries up to 7) | Whole image stack vs current — single comparison |
| C11 | `ranked-priorities` | Ranked Test (3-6 options) | Which benefit / use case / feature shoppers prioritize |
| C12 | `audience-builder` | Custom Audience + Advanced Targeting | Reusable audiences for the brand (saves rebuild work each test) |

### D. Combined Power Workflows — end-to-end pipelines

These are the high-value plays: research → generate → validate → ship-ready brief, in one orchestrated skill.

| # | Skill | Pipeline | Replaces |
|---|-------|----------|----------|
| D1 | `/cro-content-plan-pro` | SellerApp research → Higgsfield concepts → Pinion polls → final brief | Full content planning cycle (currently 1-2 weeks per ASIN) |
| D2 | `main-image-pipeline` | SellerApp competitor sweep → Higgsfield 8 concepts → 3-second test → Pinion image split → winner | 3-week external designer cycle for main image |
| D3 | `serp-attack-plan` | SellerApp top-10 SERP → visual differentiator analysis → Higgsfield 5 standout concepts → Pinion battle test | Manual competitive visual audit + concept exploration |
| D4 | `listing-launch-pack` | Competitor audit + 5 main image concepts + 3 title variants + price sensitivity + comprehension test | Pre-launch validation grab-bag — currently ad-hoc |
| D5 | `quarterly-listing-refresh` | Re-run review mining → detect sentiment shifts → generate 3 refresh concepts → Pinion poll → test recommendation | Manual quarterly check-in |
| D6 | `aplus-premium-build` | Research brief → 7 module designs (Higgsfield) → 1 hero video (Higgsfield) → Pinion comprehension test → designer-ready | Full A+ Premium build cycle |
| D7 | `cvr-leak-fix` | SellerApp keyword-CVR leak detection → Higgsfield generates the missing visual → Pinion validates → ship-ready slot | Manual CVR diagnosis → designer brief loop |
| D8 | `objection-killer` | SellerApp review mining (1-3★) → top 3 objections → Higgsfield image preempting each → Pinion validation → A+ FAQ refresh | Reactive review response work |
| D9 | `rufus-answer-pack` | SellerApp Rufus → top 5 unanswered questions → Higgsfield FAQ images → Pinion comprehension → A+ bottom-half + alt-text refresh | Manual Rufus-driven A+ updates |

### E. Ongoing Operations Skills

Scheduled / recurring jobs that keep the optimization loop alive between active engagements.

| # | Skill | Cadence | Tools |
|---|-------|---------|-------|
| E1 | `/competitor-tracker` (enhance existing agent) | Weekly | SellerApp Product Details + History |
| E2 | `profit-recalc-on-change` | Triggered on BSR / price shift | SellerApp Profit Calculator + History |
| E3 | `review-sentiment-shift` | Weekly | SellerApp Reviews + sentiment baseline diff |
| E4 | `portfolio-lqi-watch` | Monthly | SellerApp LQI across portfolio |
| E5 | `auto-refresh-trigger` | Quarterly | Combines E1-E4 to flag ASINs needing `quarterly-listing-refresh` |

---

## Build Sequence — Most Important First

Flat priority list ordered by importance to actual CRO client work (Priority Chef, Etta Vita, Ideal Direct, Brandvised). Top of list = highest frequency × highest impact = build first.

| # | Skill | Why this rank |
|---|-------|---------------|
| 1 | A1 `asin-deep-research` | Foundational. Runs at the start of every ASIN engagement — replaces 3-4 hours of manual data pulling |
| 2 | A2 `review-mining` | Primary research signal. Feeds every brief, every image plan, every objection list |
| 3 | A4 `competitor-sweep` | Table-stakes / differentiation map for every ASIN |
| 4 | D2 `main-image-pipeline` | Main image is the highest CTR lever — full pipeline (research → concepts → 3-second test → split test → winner) is the single most valuable play |
| 5 | B1 `main-image-concepts` | Standalone version of step 4 when you only need concepts |
| 6 | C1 `main-image-poll` | Validate concepts with real shoppers before MYE spend |
| 7 | D1 `/cro-content-plan-pro` | Full ASIN content plan end-to-end — the headline deliverable for the CRO Partner Program |
| 8 | A3 `rufus-gap-analysis` | Rufus is the fastest path to "what's missing" — every query is a content slot |
| 9 | A7 `keyword-cvr-leak` | Direct CVR diagnostic — finds searched benefits not visually shown |
| 10 | D7 `cvr-leak-fix` | Pipeline that closes a CVR leak end-to-end |
| 11 | B4 `lifestyle-stack-generator` | Slots 2-7 lifestyle photography with Soul-trained consistency |
| 12 | B5 `infographic-builder` | Slots 2-7 infographics following the design rules |
| 13 | C9 `aplus-comprehension` | A+ scannability validation — shoppers actually grasp it in 15-20s |
| 14 | C5 `objection-video` | Surfaces hidden objections via recorded shopper reactions |
| 15 | D8 `objection-killer` | Pipeline: review mining → preempt image → validate → A+ FAQ refresh |
| 16 | A8 `main-image-thumbnail-audit` | SERP grid vs your thumbnail — fast visual diff |
| 17 | A6 `listing-quality-audit` | LQI sweep across portfolio — section-level triage |
| 18 | B6 `aplus-module-generator` | A+ Premium-ready 5-7 module set |
| 19 | C2 `listing-battle` | Your listing vs top competitors on a real SERP mockup |
| 20 | C3 `copy-split-test` | Title and bullet variations validated by real shoppers |
| 21 | C4 `/3-second-test` | Billboard test — built into D2 but useful standalone |
| 22 | A5 `sqp-priority-rank` | Portfolio ranking when client has 20+ ASINs |
| 23 | C8 `price-sensitivity` | Pre-launch and repricing decisions |
| 24 | D4 `listing-launch-pack` | New product launch validation bundle |
| 25 | C12 `audience-builder` | Reusable Pinion audiences per brand (one-time setup) |
| 26 | D9 `rufus-answer-pack` | A+ bottom-half + alt-text refresh driven by Rufus |
| 27 | C10 `stacked-gallery-test` | Whole image stack vs current — single comparison |
| 28 | C6 `listing-optimization-video` | What's confusing about the listing |
| 29 | C7 `competitor-research-video` | Why shoppers click competitors instead of you |
| 30 | C11 `ranked-priorities` | Which benefits / use cases shoppers prioritize |
| 31 | B2 `main-image-multi-model` | Only when you explicitly want multi-model spread (default is best-only) |
| 32 | B3 `soul-character-train` | Per-brand one-time setup that B4 depends on for higher consistency |
| 33 | B10 `packaging-mockup` | Sunspot Packaging Test™ / Open Package Test™ variations |
| 34 | A9 `keyword-rank-tracker` | Ongoing rank tracking |
| 35 | A10 `review-velocity-monitor` | Critical-review surface alert |
| 36 | E1 `/competitor-tracker` | Weekly competitor snapshots (enhance existing agent) |
| 37 | E3 `review-sentiment-shift` | Weekly sentiment baseline diff |
| 38 | E4 `portfolio-lqi-watch` | Monthly LQI sweep |
| 39 | E2 `profit-recalc-on-change` | Triggered on BSR/price shift |
| 40 | E5 `auto-refresh-trigger` | Quarterly trigger that fans out to D5 |
| 41 | D5 `quarterly-listing-refresh` | Quarterly check-in pipeline |
| 42 | D3 `serp-attack-plan` | When you specifically want a SERP-differentiation play |
| 43 | B7 `ugc-video-creator` | UGC for SBV / Brand Store / A+ Premium |
| 44 | B8 `hero-video-builder` | Cinematic A+ hero video |
| 45 | B9 `ad-creative-batch` | Higgsfield Ad Engine — UGC + TV spot + Wild Card variations |
| 46 | D6 `aplus-premium-build` | Full A+ Premium build cycle (premium / aspirational) |

---

## Files to Reference When Building Each Skill

| Skill family | Source-of-truth files |
|--------------|------------------------|
| All research skills (A*) | `01-research/building-research-brief.md`, `01-research/review-mining.md`, `01-research/rufus-ai-queries.md`, `01-research/competitor-audit.md`, `01-research/keyword-analysis.md` |
| All content generation skills (B*) | `02-visual-content/core-visual-principles.md`, `02-visual-content/main-image.md`, `02-visual-content/listing-images.md`, `02-visual-content/a-plus-content.md`, `MASTER-CRO-REFERENCE.md` §3-§4 |
| All validation skills (C*) | `05-testing/test-design-methodology.md`, `05-testing/interpreting-results.md` |
| All pipeline skills (D*) | `06-process/optimization-pipeline.md`, `06-process/client-delivery-workflow.md`, `cro-process.md` |
| Ongoing operations (E*) | `04-data-analysis/metric-to-action-framework.md`, `06-process/ongoing-maintenance.md` |
| Decision rules (all) | `~/.claude/knowledge/cro-methodology/decision-framework.md`, `content-standards.md`, `testing-framework.md`, `pattern-recognition.md` |

---

## Verification

A skill is "built and validated" when:

1. Runs end-to-end on a real ASIN (Priority Chef butter crock or Etta Vita NAD+ are good test ASINs — both have rich review data)
2. Output matches the format defined in the relevant `02-visual-content/*.md` or `01-research/*.md` doc
3. Output passes the quality bar in `06-process/quality-checklists.md`
4. Skill registered in `~/.claude/skills/` with proper trigger phrases
5. SellerApp data flows are routed through the n8n MCP wrapper (workflow `9RmjDT107uXtrImf`), not direct API calls
6. Higgsfield calls default to GPT Image (latest) or Nano Banana Pro for image gen unless the skill explicitly requests a multi-model comparison

For the top-3 skills (`asin-deep-research`, `review-mining`, `competitor-sweep`), `MASTER-CRO-REFERENCE.md` §2 ("The Research Brief") is the acceptance test — the output must answer all 5 brief questions cleanly.
