---
type: supplier
name: Shenzhen Soft Goods Co
country: China
city: Shenzhen
factory_or_trader: factory
moq: 2000
lead_time_days: 38
payment_terms: 30/70
incoterms: FOB Yantian
currency: USD
since: 2024-09
status: active
skus_supplied: [[[acme-baby-shampoo-001]], [[acme-baby-lotion-002]]]
defect_rate_lifetime: 1.8
last_sample: 2026-04-12
last_audit: 2026-01-22
tags: [supplier, example]
---

# Shenzhen Soft Goods Co

Mid-size factory, baby-skincare specialist. Owns the cap tooling for the Acme baby line. Primary contact is responsive on WeChat within 4 hours during China business hours.

---

## Contacts

| Role | Name | WeChat / WhatsApp | Email | Notes |
|---|---|---|---|---|
| Sales | Lily Chen | WeChat: lilychen-sg | lily@shenzhen-softgoods.example | English fluent, primary contact |
| Sourcing manager | David Wu | WeChat: davidwu-sg | david@shenzhen-softgoods.example | Better for cost negotiations than Lily |
| QC contact | Mei Zhang | WeChat: meizhang-qc | mei@shenzhen-softgoods.example | Send pre-shipment QC requests here |

---

## Commercial terms
- MOQ: 2,000 units per SKU
- Lead time: 38 days from PO confirmed to FOB Yantian
- Payment terms: 30% deposit on PO, 70% before shipment
- Incoterms: FOB Yantian
- Price tier: $4.10/unit at MOQ. $3.85/unit at 5,000+. $3.60/unit at 10,000+.
- Tooling owned by: us (cap mould paid for in 2024 PO)

---

## SKUs supplied
- [[acme-baby-shampoo-001]]
- [[acme-baby-lotion-002]]

---

## Sample log

| Date | SKU | Sample # | Outcome | Notes |
|---|---|---|---|---|
| 2024-08-12 | baby shampoo | S-001 | pass | Initial qualification |
| 2025-10-04 | baby shampoo | S-014 | partial | New cap supplier sample, leak rate 3% |
| 2026-01-22 | baby shampoo | S-019 | pass | Cap fix verified, leak rate <0.5% |
| 2026-04-12 | baby lotion | S-021 | pass | New SKU sample, ready to PO |

---

## Defect history

| Date | SKU | Issue | Units affected | Resolution | Cost to us |
|---|---|---|---|---|---|
| 2025-09 | baby shampoo | Cap leaks | ~120 of 5,000 | Switched cap supplier, replacement units shipped | $1,400 |
| 2026-02 | baby shampoo | Bottle deformation | ~30 of 4,000 | Tightened pre-ship QC checklist | $0 (absorbed) |

---

## Audit log

| Date | Type | Outcome | Doc |
|---|---|---|---|
| 2024-08 | 3rd-party (Asia Inspection) | pass | [[audit-shenzhen-softgoods-2024-08]] |
| 2026-01 | factory video walkthrough | pass | Loom in [[raw/]] |

---

## Risk flags
- **Single-source for the cap mould.** Cap supplier swap took 4 months in 2025-2026. Backup cap source qualified but not active: [[supplier-dongguan-cap-co]].
- **Lunar New Year shutdown:** typically Jan 20 - Feb 15. Place Q1 POs by mid-December.
- **USD-CNY exposure:** terms are USD, but 5%+ CNY moves in a quarter trigger a price review.

---

## Decisions linked
- [[2025-11-shenzhen-supplier-switch]] - selected as primary supplier after Factory A defect issues
- [[2026-04-baby-lotion-launch-supplier-pick]] - chosen for new lotion SKU based on cap-mould adjacency
