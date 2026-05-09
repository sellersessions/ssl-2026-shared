---
name: restock-memo
description: Generate a restock decision draft for a SKU using velocity, lead time, MOQ, and cash position. Run from vault root with /restock-memo {ASIN} --weeks=12. Writes a draft to wiki/decisions/ for sign-off, never submits a PO.
---

# /restock-memo

Draft a restock decision page for one SKU.

## When to use
- Every Monday during the weekly restock cycle.
- Any time `days_on_hand < lead_time + 28` for a SKU.
- Before placing any PO above $50K.

## Inputs
- `{ASIN}` (required) - parent ASIN.
- `--weeks=12` (optional) - target weeks of cover after restock. Default 12.
- `--supplier={name}` (optional) - override which supplier page to read from.

## What the skill does

1. **Read SKU page frontmatter:** `cogs_landed`, `units_30d`, `days_on_hand`, `supplier`, `status`, `cm3_30d`.
2. **Read supplier page frontmatter:** `moq`, `lead_time_days`, `payment_terms`, `currency`.
3. **Read latest finance state:** open the most recent `wiki/finance/monthly-close-*.md` for cash + open PO total.
4. **Compute restock quantity** using the formula in [[wiki/concepts/restock-formula]]:
   - Weekly velocity = `units_30d / 4.3`
   - Target weeks cover = `lead_time_weeks + 4 (safety) + 4 (cycle)` or override
   - Target units = target weeks * weekly velocity
   - Gap = target units - (current FBA + in-transit)
   - Round gap up to nearest MOQ multiple
5. **Sanity-check against cash:** PO total = `units * cogs_landed`. If this plus open PO total exceeds available cash, downgrade the recommendation and flag.
6. **Sanity-check against CM3:** if `cm3_30d < 0.10` and `status != launch`, refuse to recommend a restock and flag for review.
7. **Write a decision draft** to `wiki/decisions/YYYY-MM-restock-{sku-slug}.md` using `_templates/decision.md`.

## Output format

The draft uses the standard decision template, prefilled:

```markdown
---
type: decision
date: 2026-05-09
title: Restock - Acme Baby Shampoo - 2,000 units
status: proposed
reversibility: medium
owner: Operator
sku: [[acme-baby-shampoo-001]]
supplier: [[shenzhen-soft-goods-co]]
estimated_impact: -$9,640 cash, +12 weeks of stock
follow_up_date: 2026-06-30
tags: [decision, restock]
---

# Restock - Acme Baby Shampoo - 2,000 units

## Context
Weekly velocity 290 units. Days on hand 47. Lead time 38d (5.5 weeks). Without action, OOS in week of 2026-06-21.

## Computation
- Weekly velocity (trailing 30d): 290 units
- Target weeks cover: 13.5 (lead 5.5 + safety 4 + cycle 4)
- Target units on hand: 3,915
- Current FBA + in-transit: 3,200
- Gap: 715
- MOQ: 2,000
- **Recommended order: 2,000 units**
- PO cost: 2,000 x $4.82 = $9,640

## Cash check
- Cash + 30d payouts: $84,000
- Open POs: $48,000
- Available: $36,000
- This PO: $9,640. **OK.**

## Decision (pending sign-off)
Place 2,000-unit PO with Shenzhen Soft Goods Co at FOB $4.10/unit (price tier at MOQ).

## Reversibility
Medium. Once PO is placed and 30% deposit paid, ~$3,000 is at risk if cancelled.

## Follow-up
- Review on: 2026-06-30
- What we're checking: PO arrived on time, defect rate at receipt, days on hand back to >60.
```

## Failure modes
- SKU page missing `supplier` link: prompt operator to set it.
- Supplier page missing `moq` or `lead_time_days`: stop and flag.
- Cash position not available (no monthly-close page found): proceed but flag "cash check skipped, manual review required".
- CM3 below threshold and not in launch: refuse and write the reason to a decision page anyway, so the deliberate non-restock is logged.

## What this skill does NOT do
- Send the PO. Always operator sign-off.
- Update the SKU's `days_on_hand` until the PO is confirmed (that happens on the next `/sku-audit`).
