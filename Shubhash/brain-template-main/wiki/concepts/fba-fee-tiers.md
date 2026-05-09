---
type: concept
name: FBA fee tiers
domain: finance
tags: [concept, finance, fba]
---

# FBA fee tiers

Amazon prices FBA fulfilment by size + weight band. A SKU that crosses a tier boundary by an eighth of an inch can lose 20% of CM3 overnight.

---

## Why it matters for an operator
At 8 figures, every active SKU should have its tier locked in frontmatter. Packaging changes that nudge a SKU into the next tier are silent margin killers. Conversely, a 4% reduction in box dimensions can drop a SKU one tier and recover several points of CM3.

Most operators discover tier creep at the monthly close, two months after the damage starts.

---

## Tier categories (Amazon US, 2026 reference - check current)

| Tier | Approx longest side | Approx unit weight | Typical fee per unit |
|---|---|---|---|
| Small standard | up to 15" | up to 12oz | $3.06 |
| Large standard | up to 18" | up to 20lb | $3.91 - $7.27 |
| Large bulky | up to 59" | up to 50lb | $9.61+ |
| Extra large | over 59" or over 50lb | varies | $26.33+ |

These are illustrative. Always check the current Amazon FBA fee schedule.

---

## How tier creep happens
1. New supplier ships slightly thicker corrugate.
2. Product re-branded with thicker label, weight up 0.3oz.
3. New gift-set bundle exceeds dimensional weight on one axis.
4. FBA inbound storage prep (poly-bag or label) adds to dimensions.

---

## How to defend

- Every SKU page records dimensions + weight in frontmatter (`dims`, `weight_oz`).
- After any packaging change, re-measure and re-check tier.
- After any supplier re-quote, ask for current packaging spec sheet, not just the unit price.
- Monthly close compares per-unit FBA fee to last month. A 5%+ jump triggers an investigation.

---

## How we use it here
- `/sku-audit` cross-checks current FBA fee against tier expectation and flags drift.
- Supplier pages capture cap / packaging spec changes that can affect tier.

Linked from:
- [[wiki/concepts/cm1-cm2-cm3]]
- [[wiki/skus/]]
