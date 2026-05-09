---
type: sku
asin:
sku:
brand: [[]]
category:
launched:
status: active            # active | scaling | mature | pruning | discontinued
parent_asin:
children: []
supplier: [[]]
cogs_landed:              # USD per unit, all-in (FOB + freight + duty + 3PL inbound)
fba_fee:
referral_fee_pct: 0.15
ad_spend_30d:
units_30d:
revenue_30d:
cm3_30d:                  # decimal, e.g. 0.31 for 31%
days_on_hand:
review_count:
review_avg:
last_audit:
tags: [sku]
---

# {{ ASIN or product name }}

Short one-line description of what this product is.

---

## Numbers
{Last refreshed: YYYY-MM-DD HH:MM}

| Metric | Value |
|---|---|
| Revenue (30d) | $ |
| Units (30d) |  |
| Ad spend (30d) | $ |
| TACoS | % |
| CM3 (30d) | % |
| Days on hand |  |
| Review avg |  |

---

## Lifecycle
Stage: {active / scaling / mature / pruning}.
Why this stage: {one or two sentences}.

---

## Variant tree
- {child ASIN} - {variant attribute} - {% of mix}
- {child ASIN} - {variant attribute} - {% of mix}

---

## Listing watch
Last review of title / bullets / images / A+ / backend keywords: YYYY-MM-DD.
Open issues: {none, or list}.

---

## 1-star theme tracker
- {Theme}: {count} reviews. Status: {open / fix shipped DATE / monitoring}.
- {Theme}: {count} reviews. Status: {open / fix shipped DATE / monitoring}.

---

## Compliance
- [[Compliance-doc-name]] - expires YYYY-MM
- [[Compliance-doc-name]] - expires YYYY-MM

---

## Decisions linked
- [[YYYY-MM-decision-name]]

---

## Claude prompt block

> Run these inside Claude Code from this vault root:
>
> - `/sku-audit {{ASIN}}` - full health score + recommendations
> - `/restock-memo {{ASIN}} --weeks=12` - restock decision draft
> - `/onestar-themes {{ASIN}} --since=90d` - cluster recent low-star reviews
> - `/price-elasticity {{ASIN}}` - test a price move
