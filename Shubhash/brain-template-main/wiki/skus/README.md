---
type: folder-readme
---

# SKUs

One page per **parent ASIN**. Children listed inline on the parent's page.

---

## Naming
Use the format: `BRAND-product-NNN.md`
Examples: `acme-baby-shampoo-001.md`, `craftikit-balm-007.md`.

Or use the ASIN itself: `B0XXXXXXX.md`. Either works. Be consistent.

---

## What you put on a SKU page
The frontmatter fields drive every Claude Code skill in this vault. Keep them filled in. The most important ones:

| Field | Why it matters |
|---|---|
| `asin` | Used by `/sku-audit` and `/restock-memo` to query SP-API |
| `cogs_landed` | Drives all CM1/CM2/CM3 maths |
| `units_30d`, `revenue_30d`, `ad_spend_30d` | Drive performance scoring |
| `days_on_hand` | Triggers restock warnings |
| `status` | Lets `/wbr` filter active vs pruning vs discontinued |
| `supplier` | Links to the supplier page for negotiation prep |

---

## Worked example
See `EXAMPLE-acme-baby-shampoo-001.md`. Read it before you create your first one.

---

## When to retire a page
Don't delete. Set `status: discontinued` in the frontmatter and leave it. Your future self (and Claude) will thank you for the history.
