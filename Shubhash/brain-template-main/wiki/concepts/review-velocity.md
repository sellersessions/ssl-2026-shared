---
type: concept
name: Review velocity
domain: listing
tags: [concept, listing, reviews]
---

# Review velocity

Reviews per week is a leading indicator that beats BSR and review-count. It tells you what's about to happen, not what already did.

---

## Why it matters for an operator
Review count is a vanity metric: 3,000 reviews on a SKU launched in 2022 says nothing about the SKU's current health. BSR is volatile and category-relative.

**Review velocity** (new reviews per week) tracks current customer flow. When it accelerates, the SKU is winning. When it stalls, the SKU is leaking conversion or losing search rank, often weeks before BSR catches up.

At 8 figures, every active SKU should have review velocity tracked. It's the single best early-warning system for a SKU starting to slide.

---

## Formula

```
review_velocity = reviews_received_in_trailing_28_days / 4
```

Reported as reviews/week. Compare to:
- The SKU's own 90-day average
- Category benchmarks if available

---

## Worked example

Acme Baby Shampoo 6oz lavender:

| Period | Reviews | Velocity (per week) |
|---|---|---|
| Trailing 28d | 48 | 12/wk |
| Prior 28d | 32 | 8/wk |
| 90d average | 36 | 9/wk |

Velocity is up 33% MoM and above the 90-day average. Combined with the price test (+9% CM3 with no conversion drop), this is a SKU that should be moved to `status: scaling` and given a defended ad budget.

---

## What's normal

| Lifecycle stage | Typical review velocity |
|---|---|
| Launch (first 90d) | 1-3/wk if review accelerator on, 0-1/wk if not |
| Scaling | 5-15/wk |
| Mature | 3-8/wk |
| Pruning | falling toward 0 |

These vary wildly by category and price band. Build your own benchmarks per SKU.

---

## Warning signs

- Velocity drops 30%+ over two consecutive weeks. Action: check listing for suppression, pricing change, image change, or competitor move.
- Velocity stable but average rating dropping. Action: run `/onestar-themes` and look for a new defect signal.
- Velocity ramping but average rating dropping. Action: stop ad spend until cause is found, or you are paying to get bad reviews.

---

## How we use it here
- Every SKU page has `review_count` and `review_avg`. Velocity is computed by `/sku-audit` from review timestamps.
- `/wbr` reports velocity deltas in the bottom-5-SKUs section.

Linked from:
- [[wiki/skus/]]
- [[wiki/concepts/cm1-cm2-cm3]]
