---
name: listing-launch-pack
description: Pre-launch validation bundle for a new Amazon product — competitor audit + 5 main image concepts + 3 title variants + price sensitivity test + comprehension test, all in one pipeline. Use when running `listing-launch-pack {ASIN-or-product-spec}` for a brand-new ASIN before going live, or when revamping an existing listing for a major repositioning.
---

# listing-launch-pack — Pre-Launch Full Validation

Bundles competitive research, creative concepts, copy variants, pricing decision, and comprehension validation into a single launch-readiness checkpoint.

## Prerequisites

- All 3 MCPs

## Invocation

```
listing-launch-pack {ASIN}                  # use existing ASIN as anchor
listing-launch-pack --new --product={spec}  # new product not yet on Amazon
```

## Phases

| Phase | Skill | Output |
|-------|-------|--------|
| 1 | `competitor-sweep` | Top-10 competitor matrix + SERP cluster |
| 2 | `main-image-concepts` | 5 main image concepts |
| 3 | `copy-split-test` (titles, with 3 variants) | Winner title |
| 4 | `price-sensitivity` | OPP / Acceptable Range |
| 5 | `aplus-comprehension` (mockup) | Comprehension score on planned A+ |

## Output

`/tmp/cro-content/{ASIN}-launch-pack-{date}.md` — single deck-style report covering all 5 phases.

## State File

`/tmp/cro-content/{ASIN}-launch-pack.state.json` — resumable.

## Output Format

```markdown
# Listing Launch Pack — {ASIN or product name}

**Date:** {date} | **Status:** READY / NEEDS WORK

## Executive Summary

✅ Competitor analysis: {summary}
✅ Main image concept: {winner}
✅ Title: "{winner title}"
✅ Price: ${OPP} (within ${PMC}–${PME})
✅ A+ comprehension: {score}/100

**Launch Recommendation:** GO / WAIT — {reasoning}

## Phase Outputs

[Links to each phase output file]

## Pre-Launch Checklist

- [ ] Main image: ship to Amazon
- [ ] Listing copy (title + bullets): ship to Amazon
- [ ] A+ Premium content: ship via Brand Registry
- [ ] Initial price: ${X} (not below ${PMC} — quality-doubt threshold)
- [ ] MYE main image test queued for Day 14
```

## Reference Files

- All sub-skill reference files
- Vault: `CRO-Knowledge-Base/06-process/optimization-pipeline.md`

## Quality Bar

- [ ] All 5 phases completed (any skip = FAIL — this is the launch checkpoint)
- [ ] GO/WAIT recommendation backed by data
- [ ] Pre-launch checklist actionable

## Auto-Triggers

- New product launch
- Major listing revamp
