---
name: listing-optimization-video
description: Run a ProductPinion Pinion Video using the Listing Optimization Test template — shoppers narrate what's confusing, unclear, or missing on your Amazon listing. Use when running `listing-optimization-video {ASIN}` or when you need recorded user-comprehension feedback before designing fixes.
---

# listing-optimization-video — Listing UX Walkthrough

Different from `objection-video` — this template focuses on listing comprehension issues (clarity, structure, missing info) rather than purchase objections.

## Prerequisites

- ProductPinion MCP
- Live Amazon listing URL

## Invocation

```
listing-optimization-video {ASIN}
listing-optimization-video {ASIN} --shoppers=15
```

## Output

`/tmp/cro-content/{ASIN}-listing-opt-video-{date}.md`

## Phase 1 — Configure

Pinion Videos → Any URL → **Listing Optimization Test** template.

Default questions:
1. "Walk me through this listing top to bottom — what do you see?"
2. "What's confusing or unclear?"
3. "What information are you looking for that you can't find?"

Sample: 15 shoppers default.

## Phase 2 — Analyze

Cluster issues by:
- **Comprehension** — they didn't understand what it is / what it does
- **Information gaps** — they wanted to know X, couldn't find it (cross-ref Rufus)
- **Visual structure** — image stack order, A+ flow, scroll behavior
- **Trust** — what made them suspicious or unsure

## Phase 3 — Output

```markdown
# Listing Optimization Video — {ASIN}

**Sample:** {N} | **Date:** {date}

## Top Listing Issues (ranked)

| Rank | Issue | % of shoppers | Type | Fix |
|------|-------|----------------|------|-----|
| 1 | "Couldn't tell if it's [feature]" | 60% | Comprehension | Slot 3 image showing feature |
| 2 | "What's actually in the box?" | 45% | Info gap | Bullet + slot 5 |
| ... | ... | ... | ... | ... |

## Verbatim Highlights

> "{quote}"

## Cross-Reference: Rufus vs This

| Issue from this test | Also a Rufus query? | Action |
|----------------------|---------------------|--------|
| "What's in the box" | ✅ | High priority — both signals |
| ... | ... | ... |

## Recommended Next Skills

- `rufus-answer-pack {ASIN}` — combine these issues with Rufus into A+ refresh
- `aplus-comprehension {ASIN}` — validate fixes with comprehension test
```

## Reference Files

- ProductPinion docs — Listing Optimization Test template
- Vault: `CRO-Knowledge-Base/01-research/rufus-ai-queries.md`

## Quality Bar

- [ ] Issues clustered by type (Comprehension / Info gap / Visual / Trust)
- [ ] Cross-referenced with Rufus (high-priority overlap surfaced)
- [ ] Action item per top-5 issue

## Auto-Triggers

- User asks "what's confusing about my listing" / "UX walkthrough"
- After A+ launch — validate the comprehension impact
- During Month 2 strategy phase of CRO Partner Program
