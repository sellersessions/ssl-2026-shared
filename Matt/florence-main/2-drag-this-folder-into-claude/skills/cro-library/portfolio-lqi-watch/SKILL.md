---
name: portfolio-lqi-watch
description: Monthly portfolio-wide LQI sweep with diff against prior month — detects which ASINs improved, stagnated, or regressed in listing quality. Use when running `portfolio-lqi-watch {client}` monthly via `/loop monthly` or as part of CRO Partner Program monthly review.
---

# portfolio-lqi-watch — Monthly Portfolio LQI Diff

Month-over-month LQI tracking. Catches stagnation (no improvement post-fix) and regression (LQI dropped without intentional change).

## Prerequisites

- SellerApp via n8n MCP

## Invocation

```
portfolio-lqi-watch {client-slug}
portfolio-lqi-watch --portfolio={asin-list-path}
```

## Output

`/tmp/cro-research/{client}-lqi-watch-{date}.md`

## Phase 1 — Run LQI Sweep

Calls `listing-quality-audit {portfolio}` → current LQI scores.

## Phase 2 — Compare to Prior Month

State at `/tmp/cro-research/.lqi-state/{client}.json` — last month's scores.

Compute:
- ASINs improved (+5 or more)
- ASINs stagnated (±5)
- ASINs regressed (-5 or more)

For regressed: which sections dropped?

## Phase 3 — Output

```markdown
# Portfolio LQI Watch — {client}

**Period:** {last month} → {this month} | **ASINs:** {N}

## Movers

### 🟢 Improved (+5 or more)
| ASIN | Last | Now | Δ | Why (cross-ref engagement actions) |
|------|------|-----|---|------------------------------------|
| ... | 62 | 78 | +16 | Image refresh shipped |

### 🟡 Stagnated
{ASINs that didn't move — investigate why post-fix didn't lift LQI}

### 🔴 Regressed (-5 or more)
{ASINs that lost score without intentional change — possible Amazon algorithm shift or content edit}

## Section Trends Across Portfolio

| Section | Avg Δ | Comment |
|---------|-------|---------|
| Title | +2 | Steady |
| Bullets | -3 | Watch — LQI scoring may have changed |
| ... | ... | ... |

## Recommended Actions

- Stagnated ASINs: pull engagement file to understand why no lift
- Regressed: investigate
- Section regression across portfolio: possible LQI algorithm shift
```

## Reference Files

- Companion: `listing-quality-audit` (single-run)
- Vault: `CRO-Knowledge-Base/04-data-analysis/metric-to-action-framework.md`

## Auto-Triggers

- `/loop monthly portfolio-lqi-watch {client}`
- CRO Partner Program monthly client review
