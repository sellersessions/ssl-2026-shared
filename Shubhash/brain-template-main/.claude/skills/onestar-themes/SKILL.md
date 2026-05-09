---
name: onestar-themes
description: Cluster recent low-star reviews by theme for one SKU and update the SKU page's 1-star theme tracker block. Run from vault root with /onestar-themes {ASIN} --since=90d.
---

# /onestar-themes

Pull recent <4-star reviews, cluster by recurring theme, write back to the SKU page.

## When to use
- After `/sku-audit` flags a review-health drop.
- Before any product reformulation or supplier swap discussion.
- Quarterly on every active SKU.

## Inputs
- `{ASIN}` (required)
- `--since=90d` (optional) - default 90 days, can extend to 180/365.

## What the skill does

1. **Locate SKU page** by ASIN.
2. **Pull recent reviews** in this priority:
   - mcp-amazon (preferred): SP-API customer reviews endpoint.
   - Manual: prompt operator to paste Helium 10 / Jungle Scout review export.
3. **Filter** to ratings 1-3 within the lookback window.
4. **Cluster reviews into themes** using two passes:
   - Keyword pass: leak, smell, scent, broken, wrong, fake, allergic, etc.
   - Semantic pass: read the cluster and merge near-duplicates.
5. **Score each theme** by:
   - Count
   - Trend (this 30d vs prior 60d)
   - Severity (1-stars weight 3x, 2-stars 2x, 3-stars 1x)
6. **Update the SKU page's `## 1-star theme tracker` section.** Replace existing entries that match a theme, append new ones, mark resolved themes with `Status: resolved YYYY-MM-DD` if no fresh occurrences in 60d.

## Output format

Updates the SKU page section in place. Example:

```markdown
## 1-star theme tracker
- **Cap leaks**: 14 reviews (was 11). Status: fix shipped Apr 2026, monitoring.
- **Scent too strong**: 8 reviews (was 5, +3 in last 30d). Status: open. Recommended: open reformulation discussion with [[shenzhen-soft-goods-co]].
- **Bottle dents in transit**: 4 reviews. Status: monitoring, threshold for action 10+ in 30 days.
```

## Failure modes
- mcp-amazon unreachable AND no review export pasted: skill cannot proceed, prompts for input.
- Fewer than 5 reviews in window: skill writes a brief note saying "insufficient signal" and exits.

## What this skill does NOT do
- Reply to reviews. Use Amazon's reviewer-message feature manually.
- Auto-open supplier conversations. The operator decides whether a theme rises to that.
