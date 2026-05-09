---
type: concept
name: Cash conversion cycle
domain: finance
tags: [concept, finance, cash]
---

# Cash conversion cycle (CCC)

The number of days between paying your supplier and getting paid by the customer. It is the single biggest driver of how much cash you need to grow.

---

## Why it matters for an operator
You can be profitable on paper and still go broke. If you pay a supplier today and Amazon pays you 90 days from now, you need to fund 90 days of growth out of cash. At 8 figures, doubling revenue while CCC stays at 90 days means doubling the working capital you have parked in inventory.

CCC is the lever that decides whether your next $1M of revenue costs you $250K or $50K of new cash.

---

## Formula

```
CCC = DIO + DSO - DPO
```

- **DIO** (Days Inventory Outstanding): how long inventory sits before it sells
- **DSO** (Days Sales Outstanding): how long after a sale you wait to get paid
- **DPO** (Days Payable Outstanding): how long after a PO you wait to pay the supplier

Lower DIO, lower DSO, higher DPO = less cash trapped.

---

## Worked example

Acme Baby Skincare:

| Component | Days | Why |
|---|---|---|
| DIO | 60 | Inventory turns ~6x/year |
| DSO | 14 | Amazon pays every 14 days |
| DPO | -27 | Pays supplier 30% deposit at PO + 70% before ship (avg ~27 days BEFORE goods land) |
| **CCC** | **101 days** | Cash trapped per turn |

If revenue doubles from $5M to $10M with the same CCC, working capital required goes from ~$1.4M to ~$2.8M. That's the funding gap.

---

## How to shrink CCC

| Lever | Impact | How |
|---|---|---|
| Lower DIO | Big | Faster sell-through, smaller more frequent POs, FBA + 3PL split |
| Lower DSO | Small | Already mostly fixed by Amazon (14d) |
| Higher DPO | Big | Negotiate net-30 or net-60 once supplier trust is earned. Avoid pre-pay. |

---

## How we use it here
- `monthly-close.md` reports CCC every month.
- `/wbr` flags CCC creep (more than 5 days drift in 60 days).
- Restock decisions reference current cash position from the latest monthly close.

Linked from:
- [[wiki/finance/]]
- [[wiki/concepts/restock-formula]]
- [[wiki/concepts/cm1-cm2-cm3]]
