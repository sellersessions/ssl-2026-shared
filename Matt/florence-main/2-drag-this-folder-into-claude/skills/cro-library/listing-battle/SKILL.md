---
name: listing-battle
description: Stage your Amazon listing vs top 2-3 competitors on a ProductPinion Amazon Search Simulation, get real shoppers to pick favorites + explain why. Use when running `listing-battle {ASIN}`, when evaluating competitive positioning before SERP-attack, or when client wants direct head-to-head shopper data.
---

# listing-battle — Listing vs Top Competitors on Real SERP Mockup

ProductPinion's Amazon Search Simulation lets you stage a SERP — your listing alongside top competitors — and have shoppers tell you which one they'd click and why. The single best signal for "are we winning the SERP".

## Prerequisites

- ProductPinion MCP
- Top 2-3 competitor ASINs from `competitor-sweep`

## Invocation

```
listing-battle {ASIN}                          # auto-pick top 3 competitors
listing-battle {ASIN} --competitors=B0X,B0Y    # specify
listing-battle {ASIN} --shoppers=200
listing-battle {ASIN} --keyword="protein powder for women"   # SERP context
```

## Output

`/tmp/cro-content/{ASIN}-listing-battle-{date}.md`

## Phase 1 — Source Competitors

If not provided, pull from latest `competitor-sweep` matrix or run it. Pick top 2-3 by SERP rank for the primary keyword.

## Phase 2 — Stage the SERP Mockup

ProductPinion Amazon Search Simulation accepts:
- 4 listings (yours + 2-3 competitors)
- Each: image, title, price, rating, review count
- Mobile or desktop simulation (mobile recommended)

Pull each ASIN's title/image/price via SellerApp `Get_Product_Details`.

## Phase 3 — Configure Pinion Test

Test type: **Pinion Polls → Amazon Search Simulation**

Setup:
- Internal name: `{ASIN}-battle-{YYYY-MM-DD}`
- Keyword shown above the SERP (for context)
- 4 product cards
- Question: "Which would you click on?" + "Why?"
- Sample: 100-200 shoppers
- Audience: research-brief demographic
- Display: Mobile (default per `MASTER-CRO-REFERENCE.md` §1: 80%+ browse mobile)

## Phase 4 — Analyze

Quantitative:
- % click share per listing
- Statistical confidence

Qualitative themes (group "why" answers):
- Visual clarity
- Title clarity
- Price perception
- Trust (rating + review count)
- Brand recognition
- Stand-out factor

## Phase 5 — Output

```markdown
# Listing Battle — {ASIN} vs Competitors

**Date:** {date} | **Sample:** {N} shoppers | **Keyword context:** "{keyword}"

## SERP Mockup

| Position | Brand | ASIN | % Click Share |
|----------|-------|------|---------------|
| Yours | {brand} | {ASIN} | 28% 🥈 |
| Competitor 1 | ... | ... | 41% 🥇 |
| Competitor 2 | ... | ... | 19% |
| Competitor 3 | ... | ... | 12% |

## Why You Lost / Won

### Why Competitor 1 won (41%)
- "image was clearer" (32%)
- "price felt right for what I'd get" (24%)
- ...

### Why your listing got 28%
- "decent reviews but image was confusing" (18%)
- ...

## Action Items

| Issue | Recommended fix | Skill |
|-------|------------------|-------|
| Image clarity | Refresh main image | `main-image-pipeline` |
| Title brevity | Mobile-truncate test | `copy-split-test` |
| Trust signal | More reviews — outside this skill | (review velocity work) |
```

## Reference Files

- ProductPinion docs — Amazon Search Simulation
- Vault: `CRO-Knowledge-Base/01-research/competitor-audit.md`
- `~/.claude/skills/cro/main-image-best-practices.md`

## Quality Bar

- [ ] Real SERP simulation (not abstract questions)
- [ ] Mobile by default
- [ ] Qualitative themes clustered, not just "why" raw text
- [ ] Action items per losing dimension

## Auto-Triggers

- After `competitor-sweep`
- `serp-attack-plan` calls it
- User asks "test my listing vs competitors"
