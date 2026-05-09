# Florence — n8n Workflow Plan

Workflow inventory for the Florence assistant. All workflows follow the
`florence-{function}` naming convention (per the no-orphan rule).

## Naming Conventions

- Prefix: `florence-` (so they don't collide with keplo / idealdirect / keploscraper workflows on the shared n8n instance)
- Format: `florence-{skill}-{function}` for skill-specific, `florence-{function}` for cross-cutting
- Examples: `florence-marketinformant-sqp-watcher`, `florence-brief-daily`

## Priority Tiers

- **P0** — must ship for Seller Sessions live demo (workshop blocker)
- **P1** — ship within 2 weeks of launch (real users start using Florence)
- **P2** — roadmap (post-launch, prove with users first)

---

## Quick-Reference Table

| # | Workflow | Skill | Trigger | Priority |
|---|----------|-------|---------|----------|
| 1 | `florence-marketinformant-sqp-watcher` | 1 | Daily cron 6am | P1 |
| 2 | `florence-marketinformant-listing-snapshot` | 1 | Weekly cron Mon 5am | P1 |
| 3 | `florence-marketinformant-price-alert` | 1 | Sub-flow of #2 | P1 |
| 4 | `florence-marketinformant-investigation` | 1 | On-signal from #1 | P1 |
| 5 | `florence-variation-image-analysis` | 2 | Webhook (manual + scheduled) | P1 |
| 6 | `florence-variation-technique-match` | 2 | Sub-flow of #5 | P1 |
| 7 | `florence-variation-generate` | 2 | Sub-flow of #5 | P1 |
| 8 | `florence-variation-monthly-reminder` | 2 | Monthly cron 1st 8am | P2 |
| 9 | `florence-shopper-review-mining` | 3 | Webhook | **P0** |
| 10 | `florence-shopper-rufus-extract` | 3 | Webhook | **P0** |
| 11 | `florence-shopper-pp-openended-launch` | 3 | Webhook | **P0** |
| 12 | `florence-shopper-objection-synthesis` | 3 | Sub-flow of #9–11 | **P0** |
| 13 | `florence-shopper-pp-ranking-launch` | 3 | Sub-flow of #12 | **P0** |
| 14 | `florence-shopper-image-blueprint` | 3 | Sub-flow of #13 | **P0** |
| 15 | `florence-tester-image-pool-assembly` | 4 | Webhook | P1 |
| 16 | `florence-tester-search-simulation` | 4 | Sub-flow of #15 | P1 |
| 17 | `florence-tester-pp-tournament-launch` | 4 | Sub-flow of #16 | P1 |
| 18 | `florence-tester-results-feedback` | 4 | Sub-flow of #17 | P1 |
| 19 | `florence-tester-quarterly-cadence` | 4 | Quarterly cron | P2 |
| 20 | `florence-brief-daily` | core | Daily cron 8am | **P0** |
| 21 | `florence-brief-voice` | core | Sub-flow of #20 | P1 |
| 22 | `florence-recap-weekly` | core | Friday cron 4pm | P1 |
| 23 | `florence-memory-write` | core | Webhook (called by every skill) | **P0** |
| 24 | `florence-memory-load` | core | Webhook (called by every skill) | **P0** |
| 25 | `florence-prioritization-score` | core | Webhook | **P0** |
| 26 | `florence-handoff-slack` | core | Webhook | **P0** |
| 27 | `florence-handoff-notion-task` | core | Webhook | P1 |
| 28 | `florence-handoff-designer-brief` | core | Webhook | P1 |
| 29 | `florence-handoff-calendar-block` | core | Webhook | P2 |
| 30 | `florence-onboarding-new-asin` | ops | Webhook | P1 |
| 31 | `florence-onboarding-competitor-set` | ops | Webhook | P1 |
| 32 | `florence-monitor-error-handler` | ops | On error from any workflow | P1 |
| 33 | `florence-demo-live-trigger` | demo | Webhook (workshop only) | **P0** |

**Total: 33 workflows. P0 count: 11.** _(SP-API workflows #30–33 dropped in v0.1.4 — Florence uses SellerApp's API for product/keyword data instead, no SP-API auth gymnastics.)_

---

## P0 — Workshop Demo Critical Path

These 11 must work end-to-end for the live demo on stage.

### `florence-demo-live-trigger`
- **Purpose:** Single button on stage. Audience picks an ASIN, Dorian types it in, this fires the full Skill 3 chain.
- **Trigger:** Webhook from a simple form
- **Calls:** #9 → #10 → #11 → #12 → #13 → #14 → #26
- **Output:** Slack message in #demo with the final image blueprint + score

### `florence-shopper-review-mining` (#9)
- **Purpose:** Mines competitor 1-star and 3-star reviews for objection patterns
- **Inputs:** Competitor ASINs (3–5)
- **Tools:** Amazon scrape MCP (existing — `Call_Get_Reviews_`)
- **Output:** Structured objections with verbatim quotes + frequency
- **Latency target:** <90s for 5 competitors

### `florence-shopper-rufus-extract` (#10)
- **Purpose:** Pulls questions Amazon's Rufus surfaces on the listing
- **Inputs:** Target ASIN
- **Tools:** Amazon Rufus MCP (existing — `Get_Rufus_Data`)
- **Output:** List of shopper questions
- **Latency target:** <30s

### `florence-shopper-pp-openended-launch` (#11)
- **Purpose:** Launches the "What would stop you from buying this?" poll on PP
- **Inputs:** Target ASIN, target sample size (50–100), Matt's PP API key
- **Tools:** Product Pinion API (Matt to provide spec)
- **Output:** Poll ID + verbatim responses (when poll completes)
- **Latency target:** Poll launch <10s; results 5–15 min depending on PP panel
- **DEMO RISK:** If PP panel is slow, demo dies. Need pre-launched fallback poll.

### `florence-shopper-objection-synthesis` (#12)
- **Purpose:** Claude consolidates reviews + Rufus + PP into 5–7 distinct objections
- **Inputs:** Outputs of #9, #10, #11
- **Tools:** Claude API (Sonnet 4.6 for speed, Opus 4.7 if quality matters more)
- **Output:** Ranked list of objection clusters with evidence from each source
- **Prompt cache:** Yes — system prompt + technique DB cached

### `florence-shopper-pp-ranking-launch` (#13)
- **Purpose:** Fires a second PP poll asking shoppers to rank the 5–7 objections
- **Inputs:** Output of #12
- **Tools:** Product Pinion API
- **Output:** Ranked importance list
- **DEMO TIMING:** This is the second PP wait. May need to skip live and use pre-canned ranking for the demo.

### `florence-shopper-image-blueprint` (#14)
- **Purpose:** Generates the slide-by-slide secondary image brief from ranked objections
- **Inputs:** Output of #13, target ASIN context
- **Tools:** Claude API
- **Output:** Markdown brief (objection → image concept → expected lift)

### `florence-prioritization-score` (#25)
- **Purpose:** Scores every Florence recommendation on 40/30/15/15
- **Inputs:** Recommendation object + context (data sources, est. impact, est. effort, est. speed)
- **Output:** Score + transparent breakdown
- **Used by:** Every skill workflow before output

### `florence-handoff-slack` (#26)
- **Purpose:** Posts Florence output to the right Slack channel/DM with formatting
- **Inputs:** Channel, message blocks, optional thread
- **Tools:** Slack MCP (existing)
- **Used by:** Every skill workflow

### `florence-memory-write` (#23) and `florence-memory-load` (#24)
- **Purpose:** Florence's persistent memory — every recommendation, test, result, conversation
- **Storage:** Supabase (Florence-dedicated project, not the shared keplo-cro-dashboard one)
- **Schema:**
  - `recommendations` — id, asin, skill, content, priority_score, created_at, shipped (bool), result
  - `tests` — id, asin, hypothesis, variant_a, variant_b, started_at, ended_at, winner, lift_pct
  - `objections` — id, asin, text, source, frequency, rank
  - `briefs` — id, asin, type (daily/weekly), content, sent_at
- **Used by:** Every skill workflow

### `florence-brief-daily` (#20)
- **Purpose:** The Monday-Friday 8am Slack DM. The "always shows up" piece.
- **Inputs:** Loads from #24, latest signals from data workflows
- **Output:** Slack message with overnight signals → priority pick → "What I'd do today: [one action]"
- **Demo use:** Dorian shows yesterday's brief on stage as the "this is what arrives every morning" moment

---

## P1 — Ship Within 2 Weeks of Launch

The full Florence experience for the first cohort of users.

### Skill 1 — Market Informant (full)

_(Note: SP-API SQP workflow #30 was dropped in v0.1.4. Market Informant now uses SellerApp Reverse-ASIN Keyword Research V2 — has CTR/CVR/competition/demand_momentum per keyword, no LWA OAuth needed.)_

**`florence-marketinformant-sqp-watcher` (#1)**
- Reads SellerApp keyword data (per /track-products cache), compares to 7-day rolling baseline
- Flags shifts beyond threshold (configurable, default ±15% on CVR or CTR)
- Triggers #4 when shift detected

**`florence-marketinformant-listing-snapshot` (#2)**
- Weekly competitor scrape (image hash, price, title, bullets, A+ presence)
- Stores in `competitor_snapshots`
- Diffs against prior snapshot

**`florence-marketinformant-price-alert` (#3)**
- Sub-flow of #2 — when price delta > threshold, fire Slack alert

**`florence-marketinformant-investigation` (#4)**
- When SQP shifts, automatically pulls latest competitor snapshots and writes a "what changed" report
- Output: Slack message in #florence-alerts with: ASIN, signal, likely cause, recommended next step

### Skill 2 — Variation Engine (full)

**`florence-variation-image-analysis` (#5)**
- Vision model analyzes target image
- Extracts: angle, background, text overlays, whitespace, lifestyle vs studio, perceived size, color palette
- Output: structured image attributes

**`florence-variation-technique-match` (#6)**
- Cross-references attributes against `techniques.json` (15–20 curated techniques)
- Returns 3–5 unmissed techniques with rationale

**`florence-variation-generate` (#7)**
- If user has image gen API key: calls OpenAI/Gemini with the top technique applied
- If not: outputs a paste-ready prompt
- Stores generated mockup in user's S3 / Supabase storage

### Skill 4 — Evergreen Image Tester

**`florence-tester-image-pool-assembly` (#15)** — gathers main + variations + competitor mains
**`florence-tester-search-simulation` (#16)** — assembles realistic SERP comparison image
**`florence-tester-pp-tournament-launch` (#17)** — fires PP comparison poll
**`florence-tester-results-feedback` (#18)** — parses results, packages back to Variation Engine input

### Cross-cutting (full)

**`florence-brief-voice` (#21)** — ElevenLabs TTS of #20 output, posted as audio in Slack
**`florence-recap-weekly` (#22)** — Friday 4pm: tests this week, results, what's queued
**`florence-handoff-notion-task` (#27)** — creates Notion task in user's test backlog
**`florence-handoff-designer-brief` (#28)** — turns image blueprint into designer-ready spec

### Data ingestion

_(SP-API workflows #31–33 dropped in v0.1.4. Florence uses SellerApp Get Product Details + Get Product History for product-level data — no LWA OAuth, no Amazon developer-app approval. Ads / business reports remain post-workshop work via a different mechanism if needed.)_

### Onboarding (full)

**`florence-onboarding-new-asin` (#34)**
- One-shot setup when a seller adds an ASIN
- Configures: competitor set, baseline data pulls, schedule, target metrics
- Creates initial memory entry

**`florence-onboarding-competitor-set` (#35)**
- Triggered when seller updates competitor list
- Re-baselines tracked competitors

### Operations (full)

**`florence-monitor-error-handler` (#36)**
- Catches errors from any Florence workflow
- Logs to Supabase `error_log`
- Pings Dorian's #florence-ops channel if anything fails twice in a row
- Self-heal for common cases (token refresh, rate limit retry)

---

## P2 — Roadmap (Post-Launch)

Build only after real users prove demand.

**`florence-variation-monthly-reminder` (#8)** — auto-triggers a new variation test each month
**`florence-tester-quarterly-cadence` (#19)** — auto-triggers full image tournament every Q
**`florence-handoff-calendar-block` (#29)** — auto-blocks calendar time for priority tests

Future skills (not workflows yet — define before building):
- AEO optimization (Rufus + AI search visibility)
- Title + bullet rewriting (only if differentiated vs. existing tools)
- A+ content optimization
- Inventory/PPC budget recommendations

---

## Architectural Notes

### Sub-flow vs. standalone

Several workflows are sub-flows of others (e.g., #6, #7 are called by #5). On n8n we can either:
- Build them as separate workflows called via "Execute Workflow" node (cleaner, more reusable)
- Build them as sub-sections of a parent workflow (faster to ship, harder to test in isolation)

**Recommendation:** Standalone for #5–7 and #15–18 (high reuse), embedded for one-time chains.

### Shared state

Florence needs persistent memory across workflows. Options:
- **Supabase** (recommended) — Florence-dedicated project, RLS-protected per user, all skills read/write here
- **n8n credentials store** — for API keys only
- **n8n static data** — small config only, not user-scoped

### MCP vs. HTTP nodes

For Amazon scrapes and Claude calls, prefer the existing MCP servers Dorian already has working (faster to ship, fewer auth bugs). For Product Pinion, depends on Matt's API surface — likely HTTP nodes.

### Workflow versioning

All Florence workflows live in a `florence` folder in n8n. Tag with `v0`, `v1`, etc. Never modify a P0 workflow during the workshop week — branch a new version, test, then promote.

---

## What This Means for the Build Week

| Day | n8n work |
|-----|----------|
| Mon | Build #23, #24 (memory) and Supabase schema. Without memory, nothing else is interesting. |
| Tue | Build #9, #10 (review mining + Rufus) — the data-in side of Skill 3. |
| Wed | Build #11, #13 (PP poll launchers) with Matt. The biggest demo risk. |
| Thu | Build #12, #14, #25, #26 (synthesis, blueprint, scoring, Slack handoff). |
| Fri | Build #20 (daily brief) using whatever signals exist. Build #37 (live demo trigger). Dry-run the full chain. |
| Sat | Buffer. Nothing new. Test, test, test. |

P0 = 11 workflows in 5 days. Tight but doable since most logic is in Claude prompts, not n8n node graphs.

---

## Open Questions for Matt

1. **PP API surface for poll launching** — what's the endpoint, what's auth, what's rate limit, what's typical poll-fill latency for a 50-respondent open-ended poll?
2. **PP poll templates** — can Florence reuse 3–4 stable poll templates (open-ended objection, ranking, image tournament), or does each poll need to be configured fresh?
3. **PP cost / billing model** — for the workshop demo, is PP eating the poll cost? What about the first 100 sellers who install Florence post-workshop?
4. **PP webhooks** — does PP fire a webhook when a poll completes, or do we need to poll the API for status?

---

## Open Questions for Dorian

1. **Supabase project for Florence** — separate project, or share with keplo-cro-dashboard? Recommendation: separate (cleaner permissions, no cross-project hazards per the project-lock rule).
2. **Where do P0 workflows live during build** — separate n8n folder, separate environment, or just naming-prefixed in the existing instance?
3. **Multi-tenant from day 1, or single-tenant for the workshop demo?** — the demo is one ASIN, so single is fine. Multi-tenant adds 2–3 days of work to the schema and every workflow.
4. **Do we surface n8n to end users at all?** — recommendation: no. Workflows are infrastructure. The seller's interface is Slack + Claude Code, not n8n.
