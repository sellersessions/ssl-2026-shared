---
type: sku
asin: B0EXAMPLE001
sku: ACME-BABYSH-001
brand: [[Acme]]
category: baby-skincare
launched: 2024-03
status: scaling
parent_asin: B0EXAMPLE001
children: [B0EXAMPLE002, B0EXAMPLE003]
supplier: [[shenzhen-soft-goods-co]]
cogs_landed: 4.82
fba_fee: 3.91
referral_fee_pct: 0.15
ad_spend_30d: 2840
units_30d: 1240
revenue_30d: 24800
cm3_30d: 0.31
days_on_hand: 47
review_count: 3210
review_avg: 4.4
last_audit: 2026-04-28
tags: [sku, example]
---

# Acme Baby Shampoo - 6oz lavender (parent)

Hypoallergenic baby shampoo, 6oz pump bottle. Two scent variants under this parent. The hero SKU of the Acme baby line.

---

## Numbers
{Last refreshed: 2026-05-08 06:00 UTC}

| Metric | Value |
|---|---|
| Revenue (30d) | $24,800 |
| Units (30d) | 1,240 |
| Avg sale price | $20.00 |
| Ad spend (30d) | $2,840 |
| TACoS | 11.5% |
| CM3 (30d) | 31% |
| Days on hand | 47 |
| Review avg | 4.4 (3,210 reviews) |

---

## Lifecycle
Stage: **scaling**.
Why: TACoS down 14% MoM (was 13.4% in March), review velocity 12/wk (up from 8/wk), BSR holding inside top 30 in Baby Shampoo subcategory. Three more months at this trajectory and it moves to `mature` with a defended budget rather than aggressive ad spend.

---

## Variant tree
- B0EXAMPLE002 - 6oz lavender - 60% of mix
- B0EXAMPLE003 - 6oz unscented - 40% of mix

Variant ratio is stable since Q4 2025. Lavender is the conversion winner; unscented is the gift-set / sensitive-skin pull.

---

## Listing watch
Last full review of title / bullets / images / A+: 2026-04-28.
Open issues:
- Hero image refresh queued for May (current image fails the 4 / 5 mobile-thumbnail test).
- Bullet 3 (claims) being rewritten to comply with new FDA OTC guidance.

---

## 1-star theme tracker
- **Cap leaks**: 14 reviews. Status: fix shipped Apr 2026 (new cap supplier, new torque spec). Monitoring next 60 days.
- **Scent too strong**: 8 reviews. Status: reformulation discussion with [[shenzhen-soft-goods-co]] open.
- **Bottle dents in transit**: 4 reviews. Status: monitoring, threshold for action is 10+ in 30 days.

---

## Compliance
- [[compliance-cpsia-acme-baby-shampoo]] - expires 2027-08
- [[compliance-fda-otc-monograph-acme]] - in force
- [[lab-test-microbial-acme-baby-shampoo-2025]] - on file

---

## Decisions linked
- [[2025-11-shenzhen-supplier-switch]] - moved cap supplier from Factory A to Shenzhen Soft Goods after 2024 leak issues
- [[2026-02-acme-shampoo-price-test]] - moved from $19.99 to $22.99, +9% CM3, no conversion drop

---

## Claude prompt block

> Run these inside Claude Code from this vault root:
>
> - `/sku-audit B0EXAMPLE001` - full health score + recommendations
> - `/restock-memo B0EXAMPLE001 --weeks=12` - restock decision draft
> - `/onestar-themes B0EXAMPLE001 --since=90d` - cluster recent low-star reviews
> - `/price-elasticity B0EXAMPLE001` - test a price move
