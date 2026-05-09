---
name: sku-audit
description: Audit a single SKU's health (CM3, ad efficiency, review velocity, listing drift). Run from the vault root with /sku-audit {ASIN}. Pulls live SP-API data if mcp-amazon is wired, otherwise reads SKU page frontmatter. Updates the SKU page with a dated audit block.
---

# /sku-audit

Score one SKU's health and append findings to its page.

## When to use
- Weekly during the restock cycle for top SKUs.
- Before any pricing or discount decision.
- After a packaging or supplier change.
- When a SKU's review velocity drops or 1-star themes spike.

## Inputs
- `{ASIN}` (required) - the parent ASIN. Looks up `wiki/skus/*.md` where `asin: {ASIN}` in frontmatter.
- `--since=90d` (optional) - lookback window for trend data. Default 90 days.

## What the skill does

1. **Locate the SKU page** by frontmatter ASIN match. Fail if not found.
2. **Pull current numbers** in this priority order:
   - If `mcp-amazon` MCP server is available: pull live 30d revenue, units, ad spend, refund rate, current FBA + reserve inventory.
   - Otherwise: read frontmatter values.
3. **Compute scores** across four dimensions:
   - **Margin health.** CM3 30d vs threshold (default 25%). Trend over 90d.
   - **Ad efficiency.** TACoS 30d vs lifecycle band (launch/scaling/mature/pruning).
   - **Review health.** Velocity 28d vs trailing 90d. Average rating delta.
   - **Inventory health.** Days on hand vs lead time + 28d safety.
4. **Detect drift** by comparing current frontmatter to last audit's snapshot:
   - FBA fee changed (suggests tier creep).
   - COGS changed (supplier price move).
   - Price changed (deliberate or buy-box loss).
5. **Write findings back** to the SKU page as a new dated section under `## Audit log`. Include: scores, drift flags, recommended actions.
6. **Update frontmatter** field `last_audit: YYYY-MM-DD`.

## Output format (written to the SKU page)

```markdown
## Audit log

### YYYY-MM-DD audit

**Margin health: 7/10**
- CM3 30d: 31% (threshold 25%, healthy)
- CM3 90d trend: stable

**Ad efficiency: 8/10**
- TACoS 30d: 11.5%, in healthy scaling band
- ACoS / TACoS gap: 17.1pp - branded share strong

**Review health: 6/10**
- Velocity 28d: 12/wk (vs 9/wk 90d avg)
- Avg rating: 4.4 (no change)
- New 1-star themes: scent intensity (3 reviews) - watch

**Inventory health: 5/10 (warning)**
- Days on hand: 47
- Lead time: 38d. Buffer: 9d. Below 28d safety threshold.
- Action: trigger /restock-memo this week.

**Drift detected**
- FBA fee unchanged
- COGS unchanged
- Price stable at $22.99 since 2026-02 test

**Recommended actions**
1. Run /restock-memo this Monday.
2. Open a sample request with [[shenzhen-soft-goods-co]] for unscented variant reformulation.
```

## Failure modes
- ASIN not found in vault: list candidate ASINs by partial match.
- Frontmatter missing required fields (`cogs_landed`, `units_30d`): surface which fields are blocking and skip those scores.
- mcp-amazon unreachable: degrade to frontmatter-only mode and flag in the output.
