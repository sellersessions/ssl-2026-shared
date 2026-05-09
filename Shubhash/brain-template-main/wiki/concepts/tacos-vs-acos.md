---
type: concept
name: TACoS vs ACoS
domain: ads
tags: [concept, ads, ppc]
---

# TACoS vs ACoS

ACoS is what your PPC agency reports. TACoS is what your business actually feels. The gap between them is where money quietly leaks.

---

## Why it matters for an operator
ACoS only counts ad spend against revenue *from ads*. It ignores organic. A campaign with 25% ACoS sounds healthy, but if 80% of your sales are organic, you are spending 25% of 20% = 5% of total revenue on ads. That's TACoS.

The reverse is more common at 8 figures: a "30% ACoS" campaign that's actually pushing 40% of total revenue and bleeding cash on branded keywords you'd have won anyway.

The only ad efficiency number that connects to CM3 is TACoS.

---

## Formulas

```
ACoS  = ad spend / ad-attributed revenue
TACoS = ad spend / total revenue (ad + organic)
```

---

## Worked example

A SKU running PPC for 30 days:

| Metric | Value |
|---|---|
| Total revenue | $24,800 |
| Ad-attributed revenue | $9,920 (40%) |
| Organic revenue | $14,880 (60%) |
| Ad spend | $2,840 |
| **ACoS** | **28.6%** |
| **TACoS** | **11.5%** |

Same campaign, two very different stories.
- Agency report says "ACoS 28.6%, slightly above target".
- Operator report says "TACoS 11.5%, ad spend is 11.5% of CM3 base, healthy".

---

## Rules of thumb

| TACoS band | What it means |
|---|---|
| Under 8% | Brand is doing the work, ads are amplifying |
| 8-15% | Healthy scaling spend |
| 15-25% | Either launching or competing aggressively |
| Over 25% | Either launch phase or you're propping up an unhealthy SKU |

These bands are starting points, not laws. CM3 of the SKU and lifecycle stage decide what's acceptable.

---

## How we use it here
- Every SKU page has `ad_spend_30d` and `revenue_30d`. TACoS = `ad_spend_30d / revenue_30d`.
- `/sku-audit` flags TACoS outside the lifecycle-appropriate band.
- `/wbr` shows TACoS, not ACoS, in the channel deltas table.

Linked from:
- [[wiki/concepts/cm1-cm2-cm3]]
- [[wiki/skus/]]
