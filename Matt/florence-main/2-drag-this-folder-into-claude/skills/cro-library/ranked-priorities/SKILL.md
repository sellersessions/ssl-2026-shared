---
name: ranked-priorities
description: Run a ProductPinion Ranked Test (3-6 options) to discover which benefits, use cases, or features shoppers prioritize most. Use when running `ranked-priorities {ASIN} --options=...` to inform main image messaging, top bullet positioning, or A+ module ordering.
---

# ranked-priorities — Shopper Benefit Prioritization

Reviews and keywords tell you what matters; ranked tests tell you the **order** of what matters most. Critical for main image headline and slot 2 messaging.

## Prerequisites

- ProductPinion MCP
- 3-6 options to rank (benefits, use cases, features)

## Invocation

```
ranked-priorities {ASIN} --options="all-day energy,no jitters,clean ingredients,great taste"
ranked-priorities {ASIN} --auto-pull-benefits   # auto-pick from research brief drivers
ranked-priorities {ASIN} --shoppers=150
```

## Output

`/tmp/cro-content/{ASIN}-ranked-priorities-{date}.md`

## Phase 1 — Source Options

If `--auto-pull-benefits`: pull top 5 drivers from `review-mining` output, formatted as user-facing options ("All-day energy", "No jitters", etc.).

If user-provided: use as-is. Cap at 6 (Pinion limit).

## Phase 2 — Configure Pinion Test

Pinion Polls → **Ranked Test** (3-6 options).

Setup:
- Question: "Rank these from most to least important when choosing this product:"
- Options: 3-6
- Sample: 150 shoppers
- Audience: research-brief

## Phase 3 — Analyze

- Average rank per option
- % choosing each option as #1
- Top-2 vs bottom-2 split (what's the real prioritization)

## Phase 4 — Output

```markdown
# Ranked Priorities — {ASIN}

**Sample:** {N} | **Date:** {date}

## Ranking

| Option | Avg Rank | % chose as #1 |
|--------|----------|---------------|
| All-day energy | 1.3 | 48% 🥇 |
| Clean ingredients | 2.4 | 22% |
| No jitters | 2.8 | 18% |
| Great taste | 3.5 | 12% |

## What This Tells You

- **Main image headline:** Lead with "all-day energy" — the #1 priority
- **Slot 2 image:** Reinforce energy benefit
- **Slot 3-4:** Clean ingredients + no jitters
- **Slot 5+:** Taste / quality-of-life

## Action Items

- Update main image copy to lead with #1 priority
- Reorder bullet points: drivers in priority sequence
- Reorder A+ module sequence: top half = #1, #2 drivers
```

## Reference Files

- Vault: `CRO-Knowledge-Base/MASTER-CRO-REFERENCE.md` §3 (slot priority rules)
- ProductPinion docs — Ranked Test

## Quality Bar

- [ ] 3-6 options (Pinion limit)
- [ ] Ranking + #1 % both shown
- [ ] Action items: main image, slot order, bullet order, A+ module order all addressed

## Auto-Triggers

- Before `main-image-pipeline` (informs headline)
- Before `aplus-module-generator` (informs module order)
- User asks "what do shoppers care about most" / "rank these benefits"
