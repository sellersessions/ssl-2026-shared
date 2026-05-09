---
type: playbook
name: Review crisis (1-star attack response)
event_window: 24-72 hours from detection
last_run:
owner:
tags: [playbook, reviews, defensive]
---

# Review crisis playbook

Cluster of 1-star reviews lands in a short window. Could be: a real defect surfacing, a competitor attack, a misuse pattern, a bad batch shipping, or an Amazon platform issue. This playbook covers the first 72 hours of response.

---

## When to run
- Trigger: 3+ 1-star reviews on a single SKU in 7 days, where the trailing 90-day baseline is <1/week.
- Or: average rating drops 0.2+ points in 14 days on a SKU with 500+ reviews (signal that the trend is real, not noise).

---

## First 60 minutes - triage

- [ ] **Quantify.** Count 1-stars in last 7 days. Compare to trailing baseline. Is this signal or noise?
- [ ] **Read every one of them.** Don't summarise without reading. Patterns hide in language.
- [ ] **Cluster by theme.** Likely 2-4 distinct themes (defect / misuse / competitor language / shipping / unrelated).
- [ ] **Photo / video evidence?** Reviews with photos hit hard. Capture them.

---

## Hour 1-4 - root cause hypothesis

For each theme, rank the most likely cause:

| Pattern | Likely cause | First action |
|---|---|---|
| Same defect described 5+ ways | Bad batch from supplier | Identify lot/batch, check FBA inbound dates, flag at supplier |
| Identical phrasing across reviews | Competitor attack / fake reviews | Document, prepare report-a-violation, do NOT engage |
| "Listing said X but I got Y" | Listing copy / image mismatch | Audit listing immediately |
| Shipping damage descriptions | FBA prep or carrier issue | Open Amazon case, check FBA inventory health |
| Allergic / safety reactions | Compliance issue | STOP - escalate to legal/compliance immediately |

---

## Hour 4-24 - decisions

Run `/onestar-themes {ASIN} --since=14d` if you have it wired. Otherwise manual.

Decisions to make:

| Decision | When |
|---|---|
| Pause ad spend on the SKU? | Immediately if average rating drops below 4.0. Don't pay to acquire bad reviewers. |
| Pull the listing? | If suspected safety / compliance issue. Otherwise no. |
| Open Amazon case? | If competitor attack suspected. Document with examples. |
| Reach out to suppliers? | If batch defect suspected. Get the manufacturing date for affected units. |
| Recall/replace affected units? | If the operator + legal are confident a defect exists in a known batch. |

Each decision goes into `wiki/decisions/` with a 24-72h follow-up date.

---

## Hour 24-72 - response

- [ ] Engage with reviewers one-by-one through Amazon's reviewer-message channel. Polite, factual, offer resolution.
- [ ] If product issue confirmed: prep PR / social statement BEFORE more reviews land.
- [ ] If competitor attack confirmed: file report-a-violation with documentation.
- [ ] Update SKU page's `## 1-star theme tracker` with the new themes and current status.

---

## What NOT to do
- Do NOT respond emotionally on Amazon publicly. One bad reply can metastasise.
- Do NOT delete or hide reviews. (You can't anyway. Trying triggers worse outcomes.)
- Do NOT incentivise positive reviews to "balance" the average. ToS violation. Suspension risk.
- Do NOT drop the price. It signals desperation and hurts brand equity.
- Do NOT do nothing. Silence in the first 72 hours doubles the long-tail damage.

---

## After the crisis

By Day 14 from detection:
- [ ] Run a full audit on the SKU.
- [ ] Update the SKU page with the resolution narrative.
- [ ] Log the incident as a decision in `wiki/decisions/`.
- [ ] Add the lesson to the relevant concept page or this playbook.

The goal is that the next operator who reads this (or you, in 6 months) has the playbook and the institutional memory.

Linked from:
- [[wiki/concepts/review-velocity]]
- [[wiki/skus/]]
