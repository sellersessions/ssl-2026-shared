---
name: copy-split-test
description: Run a ProductPinion Text Split Test on 3-5 title or first-bullet variations to find which copy drives clicks/comprehension before launching to Amazon MYE. Use when running `copy-split-test {ASIN}` or when copy variations need shopper validation.
---

# copy-split-test — Pre-MYE Copy Validation

ProductPinion's Text Split Test compares 2-5 copy variations and gathers shopper preference + reasoning.

## Prerequisites

- ProductPinion MCP
- 3-5 copy variations to test (titles, bullets, descriptions, A+ headlines)

## Invocation

```
copy-split-test {ASIN} --type=title --variants={path-or-list}
copy-split-test {ASIN} --type=bullet --slot=1
copy-split-test {ASIN} --type=aplus-headline
copy-split-test {ASIN} --shoppers=100
```

## Output

`/tmp/cro-content/{ASIN}-copy-{type}-{date}.md`

## Phase 1 — Source Variants

Variants can come from:
- User-provided list / file
- Output of `anthropic-skills:amazon-title-bullet-optimization`
- Existing copy + 2-3 generated alternatives via Claude (using research-brief constraints)

Mandatory: every variant has the same constraint — 200 chars title (Amazon allows up to 200), or single bullet, or single A+ headline. Don't compare title vs bullet (different jobs).

## Phase 2 — Configure Pinion Test

Test type: **Pinion Polls → Text Split Test**

Setup:
- Question by type:
  - Title: "Which title would you most likely click on Amazon?"
  - Bullet: "Which bullet point most makes you want to buy?"
  - A+ headline: "Which headline best describes the product?"
- Variants: 2-5 (3-5 recommended)
- Sample: 100 per variant
- Audience: research-brief

## Phase 3 — Analyze

Per variant:
- % preference
- Why themes (clustered)

## Phase 4 — Output

```markdown
# Copy Split Test — {ASIN} ({type})

**Sample:** {N} | **Date:** {date}

## Variants

| Variant | Text | % Preference |
|---------|------|--------------|
| A | "{Variant A copy}" | 38% 🥇 |
| B | "{Variant B copy}" | 28% |
| ... | ... | ... |

## Why Variant A Won

- "More specific" (32% mentioned)
- "Easier to scan" (24%)
- ...

## Recommendation

✅ Ship Variant A to MYE for title test
OR ⚠️ Top 2 are within margin — iterate / merge their best elements
```

## Reference Files

- Vault: `CRO-Knowledge-Base/03-copy/title-optimization.md`
- Vault: `CRO-Knowledge-Base/03-copy/bullet-point-optimization.md`
- Anthropic skill: `amazon-title-bullet-optimization` (variant generation)

## Quality Bar

- [ ] Same constraint across variants (apples-to-apples)
- [ ] Sample ≥100 per variant
- [ ] Why-themes clustered
- [ ] Recommendation: ship or iterate

## Auto-Triggers

- After title/bullet generation
- `listing-launch-pack` calls it
- User says "test these titles"
