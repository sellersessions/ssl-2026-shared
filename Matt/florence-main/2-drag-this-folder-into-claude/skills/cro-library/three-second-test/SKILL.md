---
name: three-second-test
description: Run a ProductPinion 3-Second Test on an Amazon main image to validate the billboard rule (communicates in <2 seconds). Shoppers see the image for 3 seconds, then answer free-text questions about what they saw. Use when running `three-second-test {image-path}` before launching a main image to MYE, or as a sub-step of `main-image-pipeline`.
---

# three-second-test — Billboard Test (Pre-MYE Quick Validation)

The "Show Me, Don't Tell Me" rule from `MASTER-CRO-REFERENCE.md` requires the main image to communicate in <2 seconds. This is the cheapest, fastest way to verify it does.

## Prerequisites

- ProductPinion MCP

## Invocation

```
three-second-test {image-path or URL}
three-second-test {ASIN} --concepts=1,2,3   # test 3 concepts from main-image-concepts output
three-second-test {image} --shoppers=50     # default 50
```

## Output

`/tmp/cro-content/{ASIN-or-image-slug}-3sec-{date}.md`

## Phase 1 — Configure Test

Pinion Ask test type: **3 Second Test**

Setup:
- Show image for 3 seconds
- Then ask:
  - "What product did you see?" (free text)
  - "What stood out?" (free text)
  - "Would you click to learn more?" (yes / no)
- Sample: 50 shoppers per image (default), customize via `--shoppers`
- Audience: research-brief-derived demographic

## Phase 2 — Submit & Wait

Submit via ProductPinion MCP. Pinion completes in hours.

## Phase 3 — Score

Pass criteria:
- ≥80% correctly identified the product category
- ≥40% would click to learn more
- "What stood out" responses cluster around your intended message

Tag each concept: ✅ pass / ⚠️ borderline / ❌ fail.

## Phase 4 — Output

```markdown
# 3-Second Test — {image-or-ASIN}

**Sample:** {N} shoppers per image | **Date:** {date}

## Results

| Image | Product ID rate | Click-through intent | "Stood out" cluster | Pass? |
|-------|-----------------|---------------------|---------------------|-------|
| Concept 1 | 92% | 64% | "color popped, label clear" | ✅ |
| Concept 2 | 71% | 38% | mixed signals | ❌ |
| ... | ... | ... | ... | ... |

## Verbatim Highlights

**What stood out — Concept 1:**
- "the color"
- "I could read the label"
- "looked premium"

**What stood out — Concept 2:**
- "Wasn't sure what it was"
- "Too cluttered"

## Recommendation

✅ Concept 1 passes the billboard test → proceed to `main-image-poll` (split test)
❌ Concept 2 fails — drop or iterate

## Recommended Next Skill

For passing concepts: `main-image-poll` (head-to-head split test)
For failing: regenerate with `main-image-concepts` using "stood out" feedback as constraint
```

## Reference Files

- ProductPinion docs — Pinion Ask 3 Second Test
- Vault: `CRO-Knowledge-Base/02-visual-content/main-image.md`
- `~/.claude/skills/cro/main-image-best-practices.md`

## Quality Bar

- [ ] At least 50 shoppers per image (statistical floor)
- [ ] Pass/fail explicit per image
- [ ] "Stood out" verbatims clustered (themes, not raw quotes)
- [ ] Recommendation: which concepts proceed to split test

## Auto-Triggers

- `main-image-pipeline` Phase 3
- User asks "billboard test" / "does my image read in 3 seconds"
- After `main-image-concepts` produces top-3
