---
name: ugc-video-creator
description: Generate 6-15 second UGC-style Amazon product videos using Higgsfield Kling / Veo / Seedance with the UGC preset. Use when running `ugc-video-creator {ASIN}` for Sponsored Brand Video, Brand Store, or A+ Premium video slots. Replaces UGC creator commissions ($500-$2K per video) with same-day AI generation.
---

# ugc-video-creator — UGC-Style Product Video

Per Higgsfield's preset library, UGC is one of 9 curated video presets (alongside unboxing, product review, hyper motion, TV spot). This skill generates UGC-format videos for Amazon ad placements.

## Prerequisites

- Higgsfield MCP
- Product reference image (clean PNG)
- Optional: trained Soul Character for the brand (`soul-character-train`)
- Research brief — for the talking-points / use case

## Invocation

```
ugc-video-creator {ASIN}
ugc-video-creator {ASIN} --duration=15            # 6 / 10 / 15 seconds (default 10)
ugc-video-creator {ASIN} --model=kling-2-5-turbo  # default; or veo-3, sora-2, seedance-pro
ugc-video-creator {ASIN} --variants=3             # generate N variations (default 1)
```

## Output

`/tmp/cro-content/{ASIN}-ugc-{date}/video-{N}.mp4` + script + use-case map.

## Phase 1 — Brief

Pull from research:
- Top driver (the "this is great because..." beat)
- Demographic — match Soul Character if trained
- Use context — where they're using it

## Phase 2 — Script (talk-track)

UGC structure (10s example):
- 0-2s: Hook — "I was looking for X..."
- 2-5s: Reveal — show product in use
- 5-8s: Benefit moment — the "wow"
- 8-10s: Soft CTA — "you have to try this"

For 15s: add a problem-setup before the hook. For 6s: drop the hook, lead with reveal.

## Phase 3 — Generate

Higgsfield with UGC preset. Default model: **Kling 2.5 Turbo** for speed/quality balance. Premium: **Veo 3.1** or **Sora 2** for top quality.

Pass:
- Soul Character (if trained for brand)
- Product reference
- Script
- UGC preset
- Aspect: 9:16 (mobile vertical) — Amazon SBV requires 16:9 OR 9:16; vertical performs better in feed

## Phase 4 — Output

```markdown
# UGC Video — {ASIN}

**Duration:** {N}s | **Model:** {model} | **Soul Character:** {ID or N/A}

## Script

{Verbatim talk-track}

## Generated Variants

1. ![Video preview](video-1.gif) — {use case}
2. ...

## Compliance Check

- Duration ≤ 15s: ✅
- No prohibited claims: ✅
- Vertical 9:16 or horizontal 16:9: ✅
- Audio levels: {note — Higgsfield generates with audio?}

## Use Cases

| Variant | Best for |
|---------|----------|
| 1 | Sponsored Brand Video (mobile feed) |
| 2 | Brand Store hero |
| 3 | A+ Premium video module |

## Recommended Next Skill

- Validate: `listing-optimization-video {ASIN}` (Pinion video reaction test)
- A/B test in Amazon: launch via Sponsored Brand Video → MYE
```

## Reference Files

- Higgsfield docs — UGC preset
- Vault: `CRO-Knowledge-Base/02-visual-content/a-plus-content.md` (A+ Premium video)
- `~/.claude/skills/hero-image/prompt-engineering.md`

## Quality Bar

- [ ] Script written before generation (don't wing it)
- [ ] Soul Character used if available (consistency)
- [ ] Compliance check passed (Amazon ad rules)
- [ ] At least 1 variant produced; ideally 3 to A/B test

## Auto-Triggers

- User says "make UGC video for {ASIN}" / "create SBV"
- `aplus-premium-build` calls it for hero video
- Ad campaign creative refresh
