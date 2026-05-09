---
type: concept
name: Restock formula
domain: inventory
tags: [concept, inventory, restock]
---

# Restock formula

The maths `/restock-memo` uses to recommend a PO. Plain English version below.

---

## Why it matters for an operator
"Reorder when stock is low" is not a system. At 8 figures, the cost of running out of a winning SKU for two weeks during peak is six figures. The cost of over-ordering a slowing SKU is also six figures (in trapped cash and long-term storage fees).

A restock formula forces you to size each PO against velocity, lead time, MOQ, and cash, not against vibes.

---

## Formula

```
target_units = target_weeks_cover * weekly_velocity
units_to_order = target_units - current_inventory_in_transit_or_on_hand
                 - rounded up to nearest MOQ multiple
```

Where:
- `target_weeks_cover` = lead time + safety stock + buffer for the next planning cycle
  Typical: lead_time_weeks + 4 weeks safety + 4 weeks cycle buffer
- `weekly_velocity` = trailing 8-week units sold, weighted (latest weeks heavier)
- `current_inventory_in_transit_or_on_hand` = FBA + 3PL + units in shipment, no double counting

---

## Worked example

Acme Baby Shampoo 6oz lavender:
- Weekly velocity (trailing 8wk weighted): 290 units/week
- Lead time: 5.5 weeks (38 days FOB to FBA receivable)
- Safety stock: 4 weeks
- Cycle buffer: 4 weeks
- Target weeks cover: 13.5 weeks
- Target units on hand: 290 * 13.5 = 3,915
- Current FBA: 1,400. In transit: 1,800. Total: 3,200.
- Gap: 715 units
- MOQ: 2,000 units
- **Recommended PO: 2,000 units** (round up to MOQ)

This builds 6 weeks of extra cover beyond target, deliberate because Q4 is approaching. The decision page captures the rationale.

---

## When to override the formula

| Situation | Override |
|---|---|
| Q4 / Prime Day / event approaching | Add 4-8 weeks cover |
| New SKU with <8 weeks of velocity data | Use category benchmark, halve safety |
| SKU being phased out (`status: pruning`) | Skip restock unless OOS damages line ranking |
| Cash position tight | Reduce buffer, accept higher OOS risk on lower-CM3 SKUs first |

---

## How we use it here
- `/restock-memo {ASIN}` outputs a draft using this formula and writes it to a new page in `wiki/decisions/`.
- The formula reads `cogs_landed`, `units_30d`, `days_on_hand`, `supplier` from the SKU frontmatter.
- The supplier page provides MOQ and lead time.

Linked from:
- [[wiki/skus/]]
- [[wiki/suppliers/]]
- [[wiki/concepts/cash-conversion-cycle]]
- [[wiki/playbooks/restock-cycle]]
