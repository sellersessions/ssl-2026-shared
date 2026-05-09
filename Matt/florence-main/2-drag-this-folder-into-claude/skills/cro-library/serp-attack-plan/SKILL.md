---
name: serp-attack-plan
description: SERP-differentiation play. Pulls the top-10 SERP for a keyword, analyzes the visual cluster, generates 5 standout main image concepts via Higgsfield, validates with ProductPinion battle test against current SERP. Use when running `serp-attack-plan {ASIN|keyword}` to win a specific SERP rather than ranking generally.
---

# serp-attack-plan — Win a Specific SERP

When the goal isn't generic CTR but "win the search for {keyword}", this skill orchestrates SERP-specific differentiation.

## Prerequisites

- All 3 MCPs

## Invocation

```
serp-attack-plan {ASIN}
serp-attack-plan keyword:"protein powder for women"
```

## Phases

| Phase | Skill | Outcome |
|-------|-------|---------|
| 1 | `main-image-thumbnail-audit` | SERP visual cluster analysis |
| 2 | `competitor-research-video` (optional) | Recorded reasoning for competitor clicks |
| 3 | `main-image-concepts` (5, biased toward differentiation) | 5 standout concepts |
| 4 | `listing-battle` (yours-with-new-image vs top 3 competitors) | Head-to-head winner |
| 5 | Designer brief + MYE plan |

## Output

`/tmp/cro-content/{slug}-serp-attack-{date}.md`

## Output Format

```markdown
# SERP Attack Plan — "{keyword}"

**Date:** {date} | **Anchor ASIN:** {ASIN if any}

## SERP Cluster Analysis (from `main-image-thumbnail-audit`)

{summary}

## Differentiation Strategy

The cluster pattern is: {N of 10 thumbnails are X}.

We win by breaking on: {color / composition / content}.

## Concepts Generated

5 concepts ranked by SERP differentiation potential.

## Battle Test Result

| Position | Brand | % click |
|----------|-------|---------|
| Yours (new) | ... | 38% 🥇 (was 22% with current) |
| Comp 1 | ... | 30% |
| ... | ... | ... |

## Recommended MYE Launch

{specific test plan + success metric}
```

## Reference Files

- Vault: `CRO-Knowledge-Base/MASTER-CRO-REFERENCE.md` §3-4 (differentiation rules)
- `~/.claude/knowledge/cro-methodology/pattern-recognition.md` ("Never copy competitors")

## Auto-Triggers

- User says "win this SERP for X" / "we're losing on this keyword"
- High SERP-rank but low CTR diagnostic
