---
type: playbook
name: New SKU launch
event_window: 12-20 weeks from PRD to PR-ready
last_run:
owner:
tags: [playbook, launch]
---

# New SKU launch

A new SKU launch ladder. PRD through to first 1,000 units sold. Framed for Amazon as primary launch channel with TikTok Shop as a parallel option.

---

## When to run
- Trigger: A new SKU has been approved at the gate decision (see decisions folder).
- Lead time required: 12-20 weeks from PRD to live, depending on supplier qualification.

---

## Pre-launch checklist

### Phase 1 - Concept (T-20 to T-16 weeks)
- [ ] PRD written: who is the customer, what problem, what claim, what differentiator.
- [ ] Category audit: top 10 ASINs, their CM3 estimate, their review themes.
- [ ] Pricing band locked: floor (CM3 25%+), ceiling (elasticity test), launch price.
- [ ] Supplier shortlist: 2-3 candidates. Sample requests sent.

### Phase 2 - Sample + qualification (T-16 to T-10 weeks)
- [ ] Samples received from all candidates. Side-by-side test.
- [ ] Selected supplier signed. PO 1 (small batch, 500-2,000 units) placed.
- [ ] Brand assets locked: SKU code, UPC, brand-on-pack approval.
- [ ] Compliance check: lab tests (if applicable), CPSIA, FDA monograph alignment.

### Phase 3 - Listing build (T-10 to T-6 weeks)
- [ ] Listing copy written: title, 5 bullets, description, A+ modules.
- [ ] Hero + lifestyle + infographic images shot or rendered.
- [ ] Backend keywords pulled from Helium 10 or equivalent.
- [ ] FNSKU / FBA labels generated. Inbound shipment plan built.

### Phase 4 - Pre-launch (T-6 to T-2 weeks)
- [ ] First PO arrives at FBA. Inventory live.
- [ ] Listing live but unindexed (no PPC yet).
- [ ] Review accelerator (Vine, etc) requested.
- [ ] PPC campaigns built (paused). Auto + branded + competitor + research.

### Phase 5 - Launch (week of)
- [ ] PPC campaigns activated, Day 1 budget envelope agreed.
- [ ] First Vine reviews start landing.
- [ ] Daily monitoring: BSR, conversion, click-through, ad spend.

### Phase 6 - First 90 days
- [ ] Week 1: traffic + conversion check. If conversion <5%, suspect listing.
- [ ] Week 4: review velocity check. Target 5+ reviews/week by week 4.
- [ ] Week 8: profitability check. Target CM3 positive (even at -5% CM3 this is OK during launch if velocity is climbing).
- [ ] Week 12: graduation review. Move from `launch` to `scaling` or kill.

---

## Launch gates - what would kill the launch

| Gate | Threshold | Action |
|---|---|---|
| Week 4 | Reviews <2/week | Investigate listing or product, hold ad spend |
| Week 8 | CM3 < -15% | Stop launch, root cause analysis |
| Week 12 | Daily units < 5 | Move to `pruning`, recover what you can |

These thresholds are starting points. Adjust per category.

---

## What NOT to do during launch
- Don't change the listing every week. Give variants 14 days each minimum.
- Don't add more SKUs to the line until this one graduates.
- Don't run discounts in the first 30 days if you can avoid it (corrupts the conversion baseline).

---

## Post-launch retro
At week 12 graduation, capture:
- Total spend to launch (samples, ads, content, ops time)
- Time from PO 1 to first 1,000 units sold
- What surprised you
- Lessons for the next launch

Update this playbook in place.

Linked from:
- [[wiki/skus/]]
- [[wiki/decisions/]]
- [[wiki/concepts/cm1-cm2-cm3]]
