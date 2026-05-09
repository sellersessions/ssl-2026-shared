---
name: audience-builder
description: Build and save a reusable ProductPinion Custom Audience for an Amazon brand. One-time setup per brand — saves 10-15 minutes per future poll/video test. Use when running `audience-builder {brand-slug}` for new CRO clients, before launching the first ProductPinion test for that brand.
---

# audience-builder — Per-Brand Reusable Pinion Audience

Every Pinion test needs an audience. Configuring it from scratch each time wastes time. This skill builds one audience per brand and saves the ID for reuse across all future tests.

## Prerequisites

- ProductPinion MCP
- Research brief with demographic detail (or willingness to estimate)

## Invocation

```
audience-builder {brand-slug}
audience-builder priority-chef --from-research-brief={path}
audience-builder --list                   # list saved audiences
audience-builder --update {brand-slug}    # refresh a saved audience
```

## Output

- ProductPinion Custom Audience created (saved in Pinion account, gets a Pinion-internal ID)
- Local registry update at `~/.claude/skills/audience-builder/.brand-audiences.json`
- Confirmation report at `/tmp/cro-content/{brand}-audience-{date}.md`

## Brand Audience Registry

`~/.claude/skills/audience-builder/.brand-audiences.json`:

```json
{
  "priority-chef": {
    "pinion_audience_id": "...",
    "created": "2026-05-08",
    "size": 500,
    "demographic": {
      "sex": "female",
      "age_band": "35-65",
      "household_income": "60k+",
      "amazon_shopper": "frequent",
      "country": "US",
      "language": "en"
    },
    "advanced_targeting": "Lifestyle: home cook",
    "qualifier": "What is your favorite cooking activity?"
  }
}
```

Other Pinion-using skills (`main-image-poll`, `listing-battle`, `copy-split-test`, etc.) auto-look-up the brand's audience ID before launching.

## Phase 1 — Demographic Spec

Pull from research brief:
- Sex (or skip if not material)
- Age band
- Household income (if material — supplement vs cookware vs apparel differ)
- Amazon shopper frequency
- Country (`us` default)
- Language

## Phase 2 — Advanced Targeting

Per ProductPinion docs, one Advanced Targeting category per audience. Pick from:
- Beliefs / Education / Family / Finance / Geographic / Health / Lifestyle / Personal / Politics / Shopping / Technology / Work

For brands serving niche segments, this is high-leverage. E.g. Priority Chef → Lifestyle: home cook. Etta Vita → Health: NAD+ / longevity.

## Phase 3 — Qualifier Question

Per ProductPinion best practice: a qualifier question filters the audience further. The trick: don't reveal which answer qualifies (per Pinion docs):

❌ "Do you cook at home?" — leading
✅ "What is your favorite weekend activity?" — qualifier filters those who pick "cooking" without leading

## Phase 4 — Build & Save

Submit Custom Audience build via ProductPinion MCP. Save returned `audience_id` to local registry.

## Phase 5 — Output

```markdown
# Brand Audience Built — {brand}

**Date:** {date} | **Pinion ID:** {ID}

## Demographic Spec

- Sex: {}
- Age: {}
- Income: {}
- Amazon shopper: {}
- Country: {us}
- Language: {en}

## Advanced Targeting

- {category}: {trait}

## Qualifier Question

{question}

## Now Available For All Future Tests

These skills will auto-use this audience for {brand}:
- `main-image-poll`
- `listing-battle`
- `copy-split-test`
- `three-second-test`
- `objection-video`
- `listing-optimization-video`
- `aplus-comprehension`
- `stacked-gallery-test`
- `ranked-priorities`
- `price-sensitivity`

## Maintenance

Re-run `audience-builder --update {brand}` if:
- Brand expands to new demographic
- New product line targets different segment
- Initial audience proved off-target after first 2-3 tests
```

## Reference Files

- ProductPinion Knowledge Base — Create Your Custom Audience + Using Advanced Targeting

## Quality Bar

- [ ] All 6 demographic fields filled
- [ ] Advanced Targeting category chosen (don't skip)
- [ ] Qualifier question is non-leading
- [ ] Local registry updated with audience ID

## Auto-Triggers

- New CRO client onboarding (do this once before any Pinion test)
- Other Pinion-using skills check for brand audience first; trigger this if missing
