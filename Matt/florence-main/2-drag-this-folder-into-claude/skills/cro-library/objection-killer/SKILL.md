---
name: objection-killer
description: Pipeline that mines top objections from reviews + ProductPinion video, generates preempting visuals via Higgsfield, validates with shopper test, then refreshes A+ FAQ section. Use when running `objection-killer {ASIN}` or when 1-3★ reviews surface a recurring objection that needs to be preempted in the listing.
---

# objection-killer — Find and Kill Top Objections

The chain: review-mine → optionally video-mine → generate preempting image → validate → ship-ready A+ FAQ refresh.

## Prerequisites

- All 3 MCPs (SellerApp, Higgsfield, ProductPinion)

## Invocation

```
objection-killer {ASIN}
objection-killer {ASIN} --skip-video       # text reviews only (faster, no Pinion video)
objection-killer {ASIN} --top-N=3          # default: kill top 3 objections
```

## Output

`/tmp/cro-content/{ASIN}-objection-killer-{date}.md` + 3 preempting images + A+ FAQ refresh spec.

## Phase 1 — Mine Objections

Calls `review-mining {ASIN}` → ranked objections.
Optional: `objection-video {ASIN}` → adds hidden objections.

Combine + rank by frequency.

## Phase 2 — Generate Preempting Visuals

For each top-N objection:
- Determine fix type (image / A+ module / bullet)
- For image: call `infographic-builder {ASIN} --slot={N} --benefit="not {objection}"`
  Example: objection "looks small" → infographic showing scale reference; objection "side effects" → trust-signal/safety callout

## Phase 3 — Validate

`main-image-poll` if main image change, else `stacked-gallery-test` for slot 3-7 changes. Or `aplus-comprehension` if A+ module.

## Phase 4 — A+ FAQ Refresh Spec

For objections that belong in A+ bottom-half FAQ (per `02-visual-content/a-plus-content.md`):
- Generate FAQ module via `aplus-module-generator`
- Pack alt-text with the objection-resolving phrasing

## Phase 5 — Output

```markdown
# Objection Killer — {ASIN}

**Date:** {date} | **Objections killed:** {N}

## Top Objections Addressed

| # | Objection | Source | % shoppers | Fix | Validation |
|---|-----------|--------|------------|-----|------------|
| 1 | "looks small" | Reviews 28% + Video 60% | 🔴 | Slot 5 scale-ref image | ✅ Validated |
| 2 | "side effects" | Reviews 15% + Video 35% | 🟡 | A+ FAQ module 4 | ✅ Validated |
| 3 | ... | ... | ... | ... | ... |

## Generated Assets

- ![](slot-5-scale-ref.png) — preempts "looks small"
- ![](aplus-faq-safety.png) — preempts "side effects"
- ...

## A+ FAQ Refresh Spec

Alt-text packed for SEO + Rufus indexing:
> {ASIN} {brand} {benefit} — answers the question "{objection-as-question}" — {keywords}

## Designer Brief

- Polish slot 5 image (scale ref must be unmistakable)
- A+ module 4 needs branded design — use generated as composition
- Update alt-text on all A+ images per the table above

## MYE Launch Plan

- Slot 5 image swap → A/B test
- A+ module replacement → no MYE (instant deploy via Brand Registry)
- Success: 1-3★ reviews mentioning {objections} should drop within 60 days
```

## Reference Files

- `~/.claude/skills/cro/review-analysis.md`
- Vault: `CRO-Knowledge-Base/MASTER-CRO-REFERENCE.md` §4 ("Recurring complaint → preempt with image")

## Quality Bar

- [ ] Top N objections sourced + frequency-tagged
- [ ] Generated visual specifically preempts the objection (not generic)
- [ ] Validation confirms shoppers' confusion drops post-fix
- [ ] A+ alt-text packed (high-leverage)

## Auto-Triggers

- 1-3★ review trend turning negative
- New critical review surfaces in `review-velocity-monitor`
- User says "fix the objections on {ASIN}"
