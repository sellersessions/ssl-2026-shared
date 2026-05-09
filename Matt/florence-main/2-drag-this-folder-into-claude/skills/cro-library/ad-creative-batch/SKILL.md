---
name: ad-creative-batch
description: Generate ad creative variations across formats (UGC, TV spot, Wild Card) for an Amazon product using Higgsfield Ad Engine. Replaces a $5K/mo agency retainer per Higgsfield's positioning. Use when running `ad-creative-batch {ASIN}` or when building Sponsored Brand Video / external traffic ad campaigns.
---

# ad-creative-batch — Higgsfield Ad Engine Batch

Higgsfield's Ad Engine takes one brief and outputs UGC + TV spot + Wild Card variations. Designed to replace a retainer-style agency for Amazon SBV + external traffic ads.

## Prerequisites

- Higgsfield MCP (Ad Engine feature available)
- Research brief

## Invocation

```
ad-creative-batch {ASIN}
ad-creative-batch {ASIN} --formats=ugc,tv-spot,wild-card   # default all 3
ad-creative-batch {ASIN} --variants-per-format=3           # default 1 each
```

## Output

`/tmp/cro-content/{ASIN}-ads-{date}/` directory with subfolders per format:
- `ugc/` — handheld authentic style
- `tv-spot/` — high-production cinematic
- `wild-card/` — experimental / scroll-stop

## Phase 1 — Brief

Single brief pulled from research:
- Product: name + reference image
- Top driver
- Target demographic
- Brand tone
- Outreach goal (engagement / conversion / awareness)

## Phase 2 — Generate (Ad Engine)

Submit brief to Higgsfield Ad Engine. Engine outputs:
- N UGC variants (handheld, talking-head)
- N TV spot variants (cinematic, polished)
- N Wild Card variants (creative experiments)

## Phase 3 — Review

Per Higgsfield's positioning the Ad Engine also writes outreach copy + provides a weekly performance report — surface this if available.

## Phase 4 — Output

```markdown
# Ad Creative Batch — {ASIN}

**Date:** {date} | **Formats:** UGC + TV Spot + Wild Card | **Variants:** {N each}

## UGC ({N} variants)
- ![](ugc/v1.gif) — talking-head benefit angle
- ...

## TV Spot ({N} variants)
- ![](tv/v1.gif) — cinematic hero moment
- ...

## Wild Card ({N} variants)
- ![](wild/v1.gif) — {experimental angle}
- ...

## Outreach Copy (if Ad Engine generates)

{Pulled from Higgsfield Ad Engine response}

## Recommended Use

| Format | Best Amazon placement |
|--------|------------------------|
| UGC | Sponsored Brand Video — mobile feed |
| TV Spot | Brand Store + A+ Premium hero |
| Wild Card | External traffic ads (Meta/TikTok), test in Amazon if compliant |

## Compliance Check

- All variants ≤15s for SBV
- No prohibited claims
- Aspect ratios (9:16, 16:9, 1:1)
```

## Reference Files

- Higgsfield docs — Ad Engine

## Quality Bar

- [ ] At least 1 variant per format
- [ ] Compliance checked across all
- [ ] Best-use recommendations per format

## Auto-Triggers

- User says "make ads for {ASIN}" / "ad campaign batch"
- New product launch
- Quarterly creative refresh
