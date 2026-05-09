---
name: asin-deep-research
description: One-shot ASIN research package using SellerApp via n8n MCP. Pulls product details, reviews (1-5★ with sentiment), Rufus queries, reverse ASIN keywords, competitor SERP, LQI score, and BSR history into a pre-filled CRO Research Brief. Use when starting any new ASIN engagement, before content planning, or when running `asin-deep-research {ASIN}`. Replaces 3-4 hours of manual data pulling.
---

# asin-deep-research — Foundational ASIN Research Pipeline

Single command that produces a complete Research Brief (Sections 1-5 of `MASTER-CRO-REFERENCE.md` §2) for any ASIN. This is the foundation skill — every CRO project starts here.

## Invocation

```
asin-deep-research {ASIN}
asin-deep-research {ASIN} {marketplace}
```

- **ASIN** (required): Amazon product ID (e.g. `B0CXG3HMX1`)
- **marketplace** (optional, default: `us`): `us`, `uk`, `de`, `ca`, etc.

## Output

Writes to `/tmp/cro-research/{ASIN}-research-brief-{date}.md` and opens with `open` command.

## Tools Used

All SellerApp data flows through the **n8n MCP wrapper** (workflow `9RmjDT107uXtrImf` at https://keplo.app.n8n.cloud/workflow/9RmjDT107uXtrImf). Tool prefix: `mcp__f32016b6-7c77-45e2-b4a2-70195c5f2d2d__*`.

| Step | n8n MCP tool | Purpose |
|------|--------------|---------|
| Product baseline | `Get_Product_Details` (with all flags) | ASIN, title, brand, BSR, price, ratings, sales estimate |
| Review mining | `Get_Product_Reviews` (3 pages each at 1★, 3★, 5★, sort=recent) | Purchase drivers / objections / surprises / questions / photo refs |
| Rufus signal | `Get_Rufus_AI_Queries` | Customer questions Amazon's AI surfaces |
| Keyword landscape | `Keyword_Research_V2_Reverse_ASIN` (results_count=200) | High-volume search terms + benefit signals |
| Competitor SERP | `Keyword_Search_Result_SERP_` (extended_response=1) on top 3 keywords | Top-10 competitors per primary keyword |
| Quality baseline | LQI request (via `Get_Product_Details` LQI flag if available, else flag as manual) | Section-level quality score |
| BSR trajectory | `Get_Product_History_30d_` | 30-day price/BSR/rating trend |

## Phase 1 — Collect (parallel where possible)

Run these in a single batch where the MCP supports it:

1. `Get_Product_Details` for ASIN with full flags (`product_specifications=1`, `ratings=1`, `price_detail=1`, `potential_detail=1`, `promotions=1`)
2. `Get_Product_Reviews` page 1, sort=recent (latest 10 reviews — recency baseline)
3. `Get_Rufus_AI_Queries` for ASIN
4. `Keyword_Research_V2_Reverse_ASIN` for ASIN with results_count=200
5. `Get_Product_History_30d_` for ASIN (price + BSR + rating + review_count)

Then sequentially:
6. `Get_Product_Reviews` pages 1-3 at rating=1 (objections)
7. `Get_Product_Reviews` pages 1-3 at rating=5 (drivers)
8. `Get_Product_Reviews` page 1 at rating=3 (nuanced)
9. From step 4, identify the top-3 keywords by relative_score → `Keyword_Search_Result_SERP_` extended for each

## Phase 2 — Synthesize into Research Brief

Map the data into the 5 brief questions from `~/.claude/knowledge/cro-methodology/decision-framework.md` and `MASTER-CRO-REFERENCE.md` §2:

### Section 1 — Customer Profile
- Demographics from photo reviews + targeted keywords (e.g. "for small apartments")
- Use context (when/where/why)
- Pull source: review images, lifestyle keywords

### Section 2 — Why They Buy (Top 3-5 Purchase Drivers, ranked)
- 5★ review themes ranked by frequency
- High-volume benefit keywords from reverse ASIN
- Tag each driver: `frequency >30%` = mandatory visual; `frequency 10-30%` = supporting

### Section 3 — Worries / Objections (Top 3-5)
- 1-3★ review themes ranked by frequency
- Rufus "concern"-classified queries
- Recurring questions across all stars
- Tag each: `>20% of negative reviews` = preempt with image

### Section 4 — Competitive Landscape
- Top 10 competitors per primary keyword (from SERP pulls)
- Table stakes (every competitor shows X)
- Quality benchmarks (BSR / rating / image count averages)
- Differentiation gaps (no one shows X but customers care)

### Section 5 — Visual Must-Show List
- Cross-reference: every Section-2 driver → "is this visually demonstrated?"
- Every Section-3 worry → "is this preempted?"
- Output: prioritized image-slot assignments per `02-visual-content/listing-images.md`

## Phase 3 — Output

Write to `/tmp/cro-research/{ASIN}-research-brief-{YYYY-MM-DD}.md`. **Required header:**

```markdown
# Research Brief — {Title}

**ASIN:** {ASIN} | **Brand:** {Brand} | **Marketplace:** {geo} | **Date:** {date}

## Data Sources

| Source | Records | Status |
|---|---|---|
| Product Details | 1 ASIN | ✅ |
| Reviews | {N} reviews across 1★/3★/5★ | ✅ |
| Rufus Queries | {N} queries | ✅ / ⚠️ Empty |
| Reverse ASIN Keywords | {N} keywords | ✅ |
| Competitor SERP | Top-{N} on {K} keywords | ✅ |
| BSR / Price History | 30 days | ✅ |
| LQI | {Score} / Manual | ✅ / ⚠️ Manual needed |

## Quick Stats

- BSR: #{rank} in {category} ({trend over 30d})
- Rating: {n}★ ({count} ratings)
- Price: ${price} ({trend})
- Sales estimate: {low}–{high} units/day
- Number of sellers: {N}
- Variations: {parent or N variants}
```

Then sections 1-5 as above, ending with:

```markdown
## Recommended Next Skills

- For SERP differentiation: `competitor-sweep {ASIN}` (deep version of competitor data)
- For review drill-down: `review-mining {ASIN}`
- For main image work: `main-image-pipeline {ASIN}`
- For full content plan: `/cro-content-plan {ASIN}`
```

## Reference Files

- `~/.claude/skills/cro/methodology.md` — full diagnostic framework
- `~/.claude/skills/cro/review-analysis.md` — 8-layer claim decomposition
- `~/.claude/skills/cro/sellerapp-api.md` — endpoint reference (legacy direct API; this skill uses the n8n MCP wrapper instead)
- `~/.claude/knowledge/cro-methodology/decision-framework.md` — 5-check sequence
- Vault: `CRO-Knowledge-Base/MASTER-CRO-REFERENCE.md` §2 (The Research Brief)
- Vault: `CRO-Knowledge-Base/01-research/building-research-brief.md`

## Quality Bar

Before declaring "research brief ready":

- [ ] Every section answers the question (no "TBD" or empty bullets)
- [ ] Every claim cites the data source ("from 1★ reviews" / "from Rufus" / "from keyword X with vol N")
- [ ] Frequency tags applied to drivers and worries
- [ ] Section 5 has at least one visual must-show per slot 1-7
- [ ] `Data Sources` header lists every source with status
- [ ] Output file exists at `/tmp/cro-research/` and was opened

## Failure Modes

| Symptom | Likely cause | Action |
|---|---|---|
| Rufus returns empty | Newer ASIN, low traffic | Note in Data Sources, proceed without; flag for manual SERP browse |
| Reverse ASIN returns < 20 keywords | Low-traffic ASIN | Pull Keyword_Search_Result_SERP_ for the brand/category as fallback |
| Reviews < 50 | Newer ASIN | Pull all available, prioritize photo reviews + verified |
| MCP timeout | n8n workflow stalled | Retry once, then check workflow `9RmjDT107uXtrImf` health |

## Auto-Triggers

This skill runs automatically (without `asin-deep-research` prefix) when:
- User pastes an Amazon ASIN or amazon.com/dp/ link as the start of a new CRO conversation
- User asks "research this ASIN" / "pull data on B0..."
- A higher-level pipeline (`/cro-content-plan`, `main-image-pipeline`) needs the brief
