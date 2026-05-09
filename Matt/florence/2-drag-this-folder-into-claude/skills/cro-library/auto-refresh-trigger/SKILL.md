---
name: auto-refresh-trigger
description: Quarterly orchestrator that combines signals from `competitor-watch`, `review-sentiment-shift`, `portfolio-lqi-watch`, and `keyword-rank-tracker` to flag which ASINs need a `quarterly-listing-refresh`. Use when running `auto-refresh-trigger {client}` at start of each quarter, or as scheduled task.
---

# auto-refresh-trigger — "Which ASINs Need Refresh This Quarter?"

Cross-references all the ongoing-operations skills' state files to surface ASINs hitting drift thresholds. Outputs a refresh queue.

## Prerequisites

- All Group 5 skills' state files populated (`competitor-watch`, `review-sentiment-shift`, `portfolio-lqi-watch`, `keyword-rank-tracker`)

## Invocation

```
auto-refresh-trigger {client-slug}
auto-refresh-trigger --portfolio={asin-list}
```

## Output

`/tmp/cro-research/{client}-refresh-queue-{date}.md`

## Phase 1 — Aggregate Signals

For each ASIN, collect:
- Competitor pressure (from `competitor-watch`): new entrants? aggressive moves?
- Sentiment regression (from `review-sentiment-shift`): theme drops?
- LQI regression (from `portfolio-lqi-watch`): score drops?
- Keyword rank loss (from `keyword-rank-tracker`): indexing loss or rank drops?

## Phase 2 — Score Each ASIN

| Signal | Weight |
|--------|--------|
| Competitor pressure | 25 |
| Sentiment regression | 30 |
| LQI regression | 20 |
| Keyword rank loss | 25 |

ASINs scoring >50 = priority refresh queue.

## Phase 3 — Output

```markdown
# Quarterly Refresh Queue — {client}

**Quarter:** Q{N} {YYYY} | **ASINs analyzed:** {N}

## Priority Refresh (score >50)

| Rank | ASIN | Score | Top signal | Recommended skill |
|------|------|-------|-------------|-------------------|
| 1 | B0... | 82 | Sentiment regression + competitor pressure | `quarterly-listing-refresh {ASIN}` |
| 2 | B0... | 67 | Keyword rank loss | `keyword-cvr-leak` then `cvr-leak-fix` |
| ... | ... | ... | ... | ... |

## Healthy (score <50)

{ASINs not requiring refresh this quarter — defer}

## Action Plan

For Q{N}, tackle priority refresh queue in score order. Estimated effort: {N} pipelines × 2-3 hours each.
```

## Reference Files

- All Group 5 state files
- Vault: `CRO-Knowledge-Base/06-process/ongoing-maintenance.md`

## Auto-Triggers

- Scheduled via `/loop quarterly auto-refresh-trigger {client}`
- Start of each quarter for active CRO Partners
