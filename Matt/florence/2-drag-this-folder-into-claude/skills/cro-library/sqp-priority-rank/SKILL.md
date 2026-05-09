---
name: sqp-priority-rank
description: Score and rank an Amazon ASIN portfolio by CRO opportunity using SellerApp keyword data, BSR, and reviews. Wraps and extends the existing `cro-priority-tracker` skill. Use when running `sqp-priority-rank` on a portfolio, when deciding which ASIN gets research budget next, or when a client has 20+ ASINs and needs triage. Defaults to the Keplo scoring formula: Data Strength 40 / $ Impact 30 / Effort 15 / Speed 15.
---

# sqp-priority-rank — Portfolio CRO Opportunity Scoring

When a client has 20-100 ASINs, you can't optimize all of them. This skill scores each on opportunity size + data confidence and outputs a ranked work order.

> Companion to existing `cro-priority-tracker` skill. This version pulls SellerApp data automatically; the existing one accepts uploaded SQP/Ads/Business Reports CSVs. Use both together when you have first-party SP-API data + want to enrich with SellerApp keyword/competitor signals.

## Invocation

```
sqp-priority-rank {ASIN1,ASIN2,...}
sqp-priority-rank --portfolio={path-to-asin-list.csv}
sqp-priority-rank {ASIN list} --weights="data:40,impact:30,effort:15,speed:15"   # tweak weights
```

## Output

`/tmp/cro-research/portfolio-priority-{date}.md`

## Tools Used

n8n MCP wrapper.

| Step | Tool | Purpose |
|------|------|---------|
| Per ASIN baseline | `Get_Product_Details` (ratings + price + potential) | BSR, sales estimate, rating count |
| Keyword landscape | `Keyword_Research_V2_Reverse_ASIN` | Top keyword volume + relative_score |
| Quality gate | LQI flag (optional) | Section weakness for effort estimate |

## Phase 1 — Pull (batched)

`Get_Product_Details` accepts up to 20 ASINs/call — chunk the portfolio. Reverse-ASIN goes one at a time, batch where possible. Token-aware (per `cro/sellerapp-api.md`).

## Phase 2 — Score per ASIN (4 dimensions)

| Dimension | Weight | Inputs | Calculation |
|-----------|--------|--------|-------------|
| Data Strength | 40% | Review count, sample size in keywords, BSR stability | High when ≥100 reviews + ≥5 high-vol keywords |
| $ Impact | 30% | Sales estimate × delta-CVR potential | Higher BSR rank × higher current CVR gap = larger impact |
| Effort | 15% | LQI section weaknesses, image count, copy quality | Inverse — low effort = high score |
| Speed | 15% | Listing changes only, no MOQ/photoshoot needed | High when AI-generatable (fits Higgsfield) |

Total score 0-100. Tag ranking confidence (High / Med / Low).

## Phase 3 — Output

```markdown
# Portfolio Priority Ranking

**Date:** {date} | **ASINs scored:** {N} | **Weights:** {weights}

## Top 10 — Work Order

| Rank | ASIN | Title | BSR | Sales/day | Score | Confidence | Recommended next skill |
|------|------|-------|-----|-----------|-------|------------|------------------------|
| 1 | B0... | ... | #4,123 | ~250 | 87 | High | `asin-deep-research` then `main-image-pipeline` |
| 2 | ... | ... | ... | ... | ... | ... | ... |

## Score Breakdown — Top 5

### 1. {ASIN} — Score 87
- Data Strength: 38/40 — {N reviews, K high-vol keywords}
- $ Impact: 26/30 — {sales estimate, CVR gap}
- Effort: 13/15 — {LQI weaknesses, what to fix first}
- Speed: 10/15 — {needs photography or AI-only}

## Bottom 10 — Defer

{Same table — these are low-priority, may not be worth research budget}

## Combined View (if Sessions/CVR data uploaded)

If client provided SQP / Business Reports, layer in actuals via `cro-priority-tracker` and re-rank.
```

## Reference Files

- Existing skill: `cro-priority-tracker` (companion — handles SP-API/CSV inputs)
- `~/.claude/knowledge/cro-methodology/decision-framework.md` (scoring formula source)
- `~/.claude/skills/cro/data-analysis.md`
- Vault: `CRO-Knowledge-Base/04-data-analysis/business-reports.md`

## Quality Bar

- [ ] Top 10 + Bottom 10 both shown (don't just list winners)
- [ ] Each top-5 has score breakdown by dimension
- [ ] Recommended next skill is specific (skill name + ASIN)
- [ ] Confidence tagged (low confidence = caveat the ranking)

## Common Mistakes

- ❌ Ranking by sales alone — high sales + healthy CVR = no opportunity
- ❌ Ignoring effort/speed — best-scoring ASIN may need a photoshoot you don't have
- ❌ Using SellerApp data when client has cleaner SP-API data — use both, layer

## Auto-Triggers

- New client onboarding (after `listing-quality-audit`)
- Quarterly portfolio review
- User asks "which ASIN should I work on next" / "rank my catalog"
