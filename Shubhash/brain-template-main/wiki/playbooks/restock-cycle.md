---
type: playbook
name: Weekly restock cycle
event_window: every Monday
last_run:
owner:
tags: [playbook, restock, weekly]
---

# Weekly restock cycle

The Monday morning ritual that decides which POs go out this week. Runs in 60 minutes if the brain is up to date. Three hours if it isn't.

---

## When to run
- Trigger: Every Monday, 09:00 local.
- Lead time required: zero - this IS the lead time management.

---

## Inputs needed
- Live FBA inventory (Seller Central -> Inventory)
- 3PL / FBM inventory snapshot
- Last 8 weeks of unit sales per SKU
- Cash position (latest monthly close + bank balance)
- Open POs and their expected receive dates

---

## Step-by-step

### Step 1 - Refresh velocity (10 min)
For each active SKU, update `units_30d` in frontmatter. Compute trailing 8-week velocity (weighted: last 4 weeks count double).

### Step 2 - Update days-on-hand (10 min)
For each SKU: `days_on_hand = (FBA + 3PL inventory) / daily_velocity`.

### Step 3 - Flag OOS risks (5 min)
Any SKU where `days_on_hand < lead_time_days + 28` is a restock candidate this week.

### Step 4 - Run /restock-memo on each candidate (15 min)
For each candidate SKU:
```
/restock-memo {ASIN} --weeks=12
```
The skill writes a draft to `wiki/decisions/`. Review, adjust, sign off.

### Step 5 - Cash check (5 min)
Sum the recommended PO totals. Compare against current bank + 30 days expected payouts - fixed costs. If short, prioritise by SKU CM3 (highest CM3 SKUs get full restock, lowest get cut).

### Step 6 - Send POs (15 min)
Email POs to suppliers. Update each supplier page with PO number + expected ship date.

---

## Output every Monday
- 0-N new decision pages in `wiki/decisions/`
- Updated supplier pages with PO numbers
- Updated daily note with "POs sent today" entry

---

## Common edge cases

| Situation | What to do |
|---|---|
| Supplier MOQ exceeds budget | Either delay 1 week and combine with next SKU's PO, or accept higher CCC |
| New SKU with <8wk velocity data | Use the bottom-50% of category benchmark. Halve safety stock. |
| Q4 approaching | Add 4-8 weeks to target cover for hero SKUs |
| Cash crunch | Restock only SKUs with CM3 >25%. Document the deferred SKUs in `wiki/decisions/` so you can come back to them. |

---

## Why this is a playbook, not just a process
Restock decisions compound. A bad restock today is trapped cash for 90+ days. A skipped restock today is a 14-day OOS in 6 weeks. Running this every Monday means small corrections instead of big crises.

Linked from:
- [[wiki/concepts/restock-formula]]
- [[wiki/concepts/cash-conversion-cycle]]
- [[wiki/decisions/]]
