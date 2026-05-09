---
type: concept
name: CM1, CM2, CM3
domain: finance
tags: [concept, finance, margin]
---

# CM1, CM2, CM3

Three layers of contribution margin. Each one strips away another category of cost. CM3 is the only one that tells you whether a SKU actually makes money for your business.

---

## Why it matters for an operator
Most sellers track gross margin (Revenue - COGS) and call it a day. That number lies. It says nothing about FBA fees, ad spend, refunds, or storage. Two SKUs with identical 60% gross margin can have CM3 of +35% and -8%.

If you are running PPC against a SKU you have never CM3-checked, you are paying Amazon to lose you money.

---

## Formula

```
CM1 = Revenue - COGS (landed)
CM2 = CM1 - channel fees (referral + FBA + closing fees)
CM3 = CM2 - variable selling costs (ads, refunds, reimbursements diff, storage, returns processing)
```

Anything below CM3 (fixed costs - team, software, rent) belongs to operating profit, not contribution.

---

## Worked example

A baby shampoo at $20 list price on Amazon US:

| Line | $ | % of revenue |
|---|---|---|
| Revenue | $20.00 | 100% |
| COGS landed | -$4.82 | -24% |
| **CM1** | **$15.18** | **76%** |
| Amazon referral fee (15%) | -$3.00 | -15% |
| FBA fee | -$3.91 | -20% |
| **CM2** | **$8.27** | **41%** |
| Ad spend allocated | -$2.29 | -11% |
| Refunds + reimbursements diff | -$0.40 | -2% |
| Long-term storage / returns | -$0.30 | -2% |
| **CM3** | **$5.28** | **26%** |

26% CM3 is okay. 30%+ is healthy. Below 15% and you should ask whether the SKU should exist.

---

## How we use it here
- Every SKU page has `cm3_30d` in frontmatter.
- `/sku-audit` flags any SKU below your CM3 threshold.
- `/wbr` ranks SKUs by absolute CM3 contribution, not by revenue.
- `/restock-memo` refuses to recommend a restock for a SKU with CM3 below 10%.

Linked from:
- [[wiki/skus/]]
- [[wiki/concepts/tacos-vs-acos]]
- [[wiki/concepts/restock-formula]]
