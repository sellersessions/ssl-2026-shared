---
name: listing-quality-audit
description: Run SellerApp's Listing Quality Index (LQI) across an ASIN portfolio (up to 100 ASINs per request) to surface section-level issues — title, bullets, description, images, videos, Q&A, ratings, reviews. Outputs a triage list ranked by lowest score. Use when running `listing-quality-audit {ASIN1,ASIN2,...}`, when onboarding a new client (LQI sweep across catalog), or when picking which ASINs need urgent fixes.
---

# listing-quality-audit — Portfolio LQI Sweep

LQI scores every section of a listing against Amazon best practices, returning a numeric score per section + an overall total. Best for onboarding a new client with a 20-100 ASIN catalog: surface the worst offenders fast.

## Invocation

```
listing-quality-audit {ASIN1,ASIN2,B0...}
listing-quality-audit --portfolio={path-to-asin-list.csv}
listing-quality-audit {ASIN}  # single-ASIN deep dive
```

## Output

`/tmp/cro-research/lqi-audit-{date}.md` — sortable triage list + per-ASIN section detail for the bottom 5.

## Tools Used

n8n MCP wrapper.

| Step | Tool | Purpose |
|------|------|---------|
| Schedule | LQI request endpoint | Submits batch — returns request_id |
| Poll | `Fetch_LQI-Report` (poll until complete) | Retrieve results — ~5-10 min for 100 ASINs |

## Phase 1 — Submit

Batch request for all ASINs (max 100 per call). Save the `request_id`.

## Phase 2 — Poll

Poll Fetch_LQI-Report with `request_id` every 60s. Show user a wait estimate.

## Phase 3 — Parse

For each ASIN, parse the 8 LQI sections:
1. Title Analysis
2. Bullet Points Analysis
3. Description Analysis
4. Image Analysis
5. Videos Analysis
6. Q&A Analysis
7. Ratings Analysis
8. Review Analysis

Each has its own score. Total = aggregate.

## Phase 4 — Build Triage List

Sort ASINs by total score (ascending = worst first). For the bottom 5:
- List the 2-3 weakest sections
- Cross-reference with `04-data-analysis/metric-to-action-framework.md` to suggest the right fix:
  - Low Image Analysis → `main-image-pipeline` or `lifestyle-stack-generator`
  - Low Title/Bullet → `copy-split-test`
  - Low Q&A → `rufus-answer-pack`
  - Low Reviews → cannot fix directly; flag for review-velocity work

## Phase 5 — Output

```markdown
# Listing Quality Audit — Portfolio

**Date:** {date} | **ASINs scanned:** {N} | **Avg score:** {score} | **Median:** {score}

## Data Sources

| Source | Records | Status |
|---|---|---|
| LQI scheduled | {N} ASINs | ✅ |
| Reports retrieved | {N} | ✅ |

## Portfolio Triage (sorted, worst first)

| Rank | ASIN | Title | Total | Title | Bullets | Desc | Images | Video | Q&A | Ratings | Reviews | Recommended Fix |
|------|------|-------|-------|-------|---------|------|--------|-------|-----|---------|---------|------------------|
| 1 | B0... | ... | 42/100 | 8 | 4 | 6 | 3 | 0 | 5 | 8 | 8 | `main-image-pipeline` + `aplus-module-generator` |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

## Bottom 5 — Detailed View

### 1. {ASIN} — {Title} (LQI {score}/100)

- **Title:** {LQI-flagged issue}
- **Bullets:** {issue}
- **Images:** {issue}
- **Recommended skill chain:** {ordered list}

### 2. ...

## Recommended Workflow

Tackle bottom 5 in score order — each is highest opportunity-size for that catalog. Use `/cro-priority-tracker` to layer in revenue weighting if you have SQP/sessions data.
```

## Reference Files

- Vault: `CRO-Knowledge-Base/04-data-analysis/metric-to-action-framework.md`
- `~/.claude/skills/cro/sellerapp-api.md` (LQI endpoint detail)
- `~/.claude/skills/cro/data-analysis.md` (how to combine LQI + revenue for true priority)

## Quality Bar

- [ ] Every ASIN has all 8 section scores
- [ ] Bottom 5 have explicit fix recommendations + skill names
- [ ] Triage list sortable (markdown table works in any viewer)
- [ ] Wait time clearly communicated to user (LQI is async — 5-10 min for 100 ASINs)

## Common Mistakes

- ❌ Treating LQI score as ground truth — it scores compliance, not conversion. A 90 LQI listing can still convert poorly. Pair with sessions/CVR data.
- ❌ Running on 1 ASIN when you have 50 (waste — schedule the batch)
- ❌ Not following up with the actual fixes — the audit is the start, not the end

## Auto-Triggers

- User asks "audit our portfolio" / "which ASINs need work" / "LQI sweep"
- New client onboarding workflow
- Quarterly portfolio review
