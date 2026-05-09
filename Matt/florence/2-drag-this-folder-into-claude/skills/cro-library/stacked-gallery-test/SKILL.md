---
name: stacked-gallery-test
description: Run a ProductPinion Stacked Image Test to compare two galleries of up to 7 images each — your current 7-image stack vs a new variation. Use when running `stacked-gallery-test {ASIN}` after refreshing the listing image stack via `lifestyle-stack-generator` or `/cro-content-plan`.
---

# stacked-gallery-test — Whole Image Stack Comparison

Slot-by-slot polls (`main-image-poll`) test individual images. The stacked test asks "which whole 7-image gallery converts" — closer to the actual Amazon experience.

## Prerequisites

- ProductPinion MCP
- Two galleries (up to 7 images each): typically current stack vs new stack

## Invocation

```
stacked-gallery-test {ASIN} --current={path-or-asin} --new={path}
stacked-gallery-test {ASIN} --shoppers=200
```

## Output

`/tmp/cro-content/{ASIN}-stacked-gallery-{date}.md`

## Phase 1 — Configure

Pinion Polls → **Stacked Image Test** (galleries up to 7 images each).

Setup:
- Gallery A: current stack (pulled from `Get_Product_Details` image_urls)
- Gallery B: new stack (from `lifestyle-stack-generator` or designer)
- Question: "Which set of images would most make you confident in buying?" + Why
- Sample: 100-200 shoppers
- Audience: research-brief

## Phase 2 — Analyze

- % preference per gallery
- Why themes per gallery
- Specific call-outs (e.g. "loved image 3" / "image 5 was confusing") — Pinion gives per-image feedback in stacked tests

## Phase 3 — Output

```markdown
# Stacked Gallery Test — {ASIN}

**Sample:** {N} | **Date:** {date}

## Result

| Gallery | % Preference |
|---------|--------------|
| Current | 38% |
| New | 62% 🥇 |

## Why New Won

- "More variety" (32%)
- "Image 3 showed me using it" (24%)
- ...

## Per-Image Feedback (New Gallery)

| Slot | Praise | Concerns |
|------|--------|----------|
| 1 | Clear hero | — |
| 2 | "Nice angle" | "Could be brighter" |
| 3 | "I love seeing it in use" | — |
| 4 | — | "Confusing — what is that?" |
| ... | ... | ... |

## Action Items

- Ship new gallery to MYE
- Iterate on slot 4 before launch (single-slot poll if needed)
```

## Reference Files

- ProductPinion docs — Stacked Image Test (up to 7 images)

## Quality Bar

- [ ] Both galleries shown at the spec the user will deliver (mobile)
- [ ] Per-image feedback captured (this is the value of stacked over single-image tests)
- [ ] Action: ship-as-is OR iterate-then-ship (specific slots)

## Auto-Triggers

- After `lifestyle-stack-generator`
- `/cro-content-plan` Phase 4
- Pre-launch validation of a full image refresh
