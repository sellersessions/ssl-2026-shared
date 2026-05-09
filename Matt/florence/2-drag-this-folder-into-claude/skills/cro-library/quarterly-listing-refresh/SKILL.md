---
name: quarterly-listing-refresh
description: Quarterly check-in pipeline for an Amazon ASIN — re-runs review mining, detects sentiment shifts, generates 3 refresh concepts, polls them with shoppers, and recommends a single test to launch. Use when running `quarterly-listing-refresh {ASIN}` every 90 days for active CRO clients to catch listing decay.
---

# quarterly-listing-refresh — 90-Day Listing Check-In

Listings decay: competitors enter, reviews shift, keywords change. Quarterly refresh catches drift early.

## Prerequisites

- All 3 MCPs

## Invocation

```
quarterly-listing-refresh {ASIN}
quarterly-listing-refresh {ASIN list}      # batch
```

## Phases

| Phase | Skill | Outcome |
|-------|-------|---------|
| 1 | `review-mining` (compare to last quarter's snapshot) | Sentiment shift detected? |
| 2 | `competitor-sweep` (compare to last quarter's matrix) | New entrants? Cluster shift? |
| 3 | `keyword-cvr-leak` (current state) | New leaks since last refresh? |
| 4 | If shift detected: `main-image-concepts --count=3` | 3 refresh concepts |
| 5 | `main-image-poll` on top 3 | Shopper preference |
| 6 | Recommendation: which single test to launch this quarter |

## State Files

Each phase saves snapshot to `/tmp/cro-research/.quarterly/{ASIN}-Q{N}.json` for next-quarter diff.

## Output

```markdown
# Quarterly Listing Refresh — {ASIN}

**Quarter:** Q{N} {YYYY} | **Date:** {date}

## Drift Detected?

| Source | Status | Detail |
|--------|--------|--------|
| Reviews sentiment | {shifted up / stable / shifted down} | {} |
| Competitor SERP | {new entrants / cluster shift} | {} |
| Keyword leaks | {N new leaks} | {} |

## This Quarter's Top Action

{Single recommended action — based on biggest drift signal}

## Concepts Generated (if drift)

{3 refresh concepts + poll winner}

## Next Test Queued

- Test: {what}
- Launch: {when}
- Success metric: {what}

## Save Snapshot

Saved Q{N} state for next quarter's diff.
```

## Reference Files

- Vault: `CRO-Knowledge-Base/06-process/ongoing-maintenance.md`

## Auto-Triggers

- Scheduled via `/loop quarterly quarterly-listing-refresh {ASIN}` for active CRO Partners clients
- Triggered by `auto-refresh-trigger` when drift signals stack
