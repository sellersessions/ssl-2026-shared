---
name: competitor-sweep
description: Top-10 Amazon competitor matrix for an ASIN or keyword. Pulls SERP via SellerApp n8n MCP, then enriches each competitor with product details, BSR, ratings, image counts, LQI score. Identifies table stakes (every competitor shows X), quality benchmarks (you must match), and differentiation gaps (no competitor owns this signal). Use when running `competitor-sweep {ASIN|keyword}`, when planning the main image, or when building a SERP-attack content plan.
---

# competitor-sweep — Top-10 Competitor Matrix

The fourth research source from `MASTER-CRO-REFERENCE.md` §2: Competitor Audit. This skill produces the structured matrix that feeds main image differentiation, listing image table stakes, and the "what to copy / what to avoid" decision in every brief.

## Invocation

```
competitor-sweep {ASIN}                    # use ASIN's top-3 keywords automatically
competitor-sweep keyword:"protein powder"  # SERP for a specific keyword
competitor-sweep {ASIN} --keywords=3       # how many primary keywords to sweep (default 3)
competitor-sweep {ASIN} --depth=10         # competitors per keyword (default 10)
```

## Output

Writes to `/tmp/cro-research/{ASIN_or_slug}-competitors-{date}.md` and opens.

## Tools Used

n8n MCP wrapper (workflow `9RmjDT107uXtrImf`). Tool prefix `mcp__f32016b6-7c77-45e2-b4a2-70195c5f2d2d__*`.

| Step | Tool | Purpose |
|------|------|---------|
| Identify primary keywords | `Keyword_Research_V2_Reverse_ASIN` (if ASIN given) | Top-N keywords by relative_score |
| Pull SERP | `Keyword_Search_Result_SERP_` (extended_response=1) | Top 10 organic + sponsored per keyword |
| Enrich competitors | `Get_Product_Details` (batch up to 20 ASINs/call, with `ratings=1`, `price_detail=1`, `potential_detail=1`) | BSR, ratings, sales estimate, image count, brand |
| Quality scores | LQI flag if available | Section-level quality |
| Optional: history | `Get_Product_History_30d_` for top 3 competitors | Are they rising / falling? |

## Phase 1 — Build the competitor set

If invoked with **ASIN**:
1. Reverse-ASIN keywords → top 3 by relative_score (or `--keywords=N`)
2. SERP for each → collect unique competitor ASINs (deduplicate; mark which keywords surface them)
3. Cap at 10 unique competitors (or `--depth=N`)

If invoked with **keyword**:
1. Single SERP pull → top 10 organic results

Always exclude the user's own ASIN from the set (compare-to set).

## Phase 2 — Enrich

Batch `Get_Product_Details` (up to 20 ASINs per call) to get:
- Title (full)
- Brand
- Image count + first image URL (thumbnail)
- BSR (root category + closest sub)
- Rating + number of ratings
- Listing price + was-price (deal indicator)
- Sales estimate (units/day)
- Variation count (parent ASIN + child count)
- Number of sellers (FBA dominance indicator)

For top 3 competitors: add 30-day BSR + rating trend.

## Phase 3 — Build the matrix

Output a single dense table: 10 rows (competitors) × ~12 columns (signals). Then derive 4 analytical sections:

### A. Table Stakes (must-match)
Anything ≥80% of competitors do. If 8/10 show "before/after" images → that's table stakes; if you don't have it, add it. If 9/10 have a 5-image gallery minimum → match it.

### B. Quality Benchmarks
- Median rating, median number of ratings, median image count, median price
- Your ASIN's position in each (if user asin provided)
- Gap-to-leader on each axis

### C. Differentiation Gaps
Patterns where ≤30% of competitors do something **but** customer signal (from review-mining or rufus, if available) suggests it matters. These are the "own-this" opportunities.

### D. Visual SERP Snapshot
For the primary keyword's SERP — list each thumbnail's apparent visual style (color dominance, on/off product, packaging visible, lifestyle vs hero, etc.). The point: spot the cluster your thumbnail blends into and design a thumbnail that breaks out.

## Phase 4 — Write Output

```markdown
# Competitor Sweep — {ASIN or "keyword: X"}

**Date:** {date} | **Geo:** {us} | **Keywords:** {top 3} | **Depth:** {N}

## Data Sources

| Source | Records | Status |
|---|---|---|
| Reverse ASIN keywords | {N} candidates → top {K} | ✅ |
| SERP results | {N} unique competitors | ✅ |
| Product Details (enriched) | {N} ASINs | ✅ |
| 30-day history (top 3) | 3 competitors | ✅ |

## Competitor Matrix

| Rank | ASIN | Brand | Title (excerpt) | BSR | Rating | #Ratings | Price | Images | Sales/day est. | Sponsored? |
|------|------|-------|-----------------|-----|--------|----------|-------|--------|----------------|------------|
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

## A. Table Stakes
{bulleted list with "X out of 10 competitors do Y" — if user asin missing any, flag 🔴}

## B. Quality Benchmarks

| Metric | Median | Top 3 avg | Your ASIN | Gap |
|---|---|---|---|---|
| Rating | ... | ... | ... | ... |
| # Ratings | ... | ... | ... | ... |
| Price | ... | ... | ... | ... |
| Image count | ... | ... | ... | ... |
| BSR | ... | ... | ... | ... |

## C. Differentiation Gaps
{list of patterns ≤30% of competitors do, that customer signal supports — these are own-it opportunities}

## D. Visual SERP Snapshot — {primary keyword}
{For each thumbnail: dominant color / on or off product / packaging visible / lifestyle vs hero / scale visible / number prominent}

**Cluster analysis:** {Most thumbnails fall into pattern X. Recommend breaking the pattern with Y for scroll-stop.}

## E. Movers
{Top 3 competitors with 30-day trend: rising? falling? — flag any aggressive entrants}

## Recommended Next Skills

- For visual differentiation: `main-image-pipeline {ASIN}` (which uses this matrix)
- For image stack planning: `/cro-content-plan {ASIN}`
- For SERP-attack play: `serp-attack-plan {ASIN}`
```

## Reference Files

- `~/.claude/skills/cro/methodology.md` — competitive analysis section
- `~/.claude/skills/cro/listing-image-best-practices.md` — table stakes vs differentiation rules
- Vault: `CRO-Knowledge-Base/01-research/competitor-audit.md`
- Vault: `CRO-Knowledge-Base/MASTER-CRO-REFERENCE.md` §2 (Competitor Audit) and §4 (Decision Rules)

## Quality Bar

- [ ] At least 10 unique competitors enriched (or marked: smaller niche)
- [ ] Matrix table complete — no missing cells (use "—" if data missing)
- [ ] Table Stakes section has frequency counts ("8 out of 10")
- [ ] Differentiation gaps cross-referenced with customer signal (not just "nobody does X" but "nobody does X *and* customers care")
- [ ] Visual SERP snapshot includes thumbnail cluster analysis (not just description)
- [ ] User's ASIN flagged on every metric where it lags the median

## Common Mistakes

- ❌ Listing variations of the same brand as separate competitors (consolidate parent ASINs)
- ❌ Including own products (exclude the user's ASIN + same brand)
- ❌ Treating sponsored slots as organic competitors (mark them, weight differently)
- ❌ Missing the visual cluster — without thumbnail analysis, this is just a spreadsheet
- ❌ Recommending "do what the leader does" — the rule is differentiate, not blend in (`pattern-recognition.md`: "Never copy competitors")

## Auto-Triggers

Runs (without prefix) when:
- User asks "what are the top competitors for {ASIN|keyword}"
- A pipeline (`/cro-content-plan`, `main-image-pipeline`, `serp-attack-plan`) needs the matrix
- User says "audit the SERP" / "competitive landscape for {keyword}"
