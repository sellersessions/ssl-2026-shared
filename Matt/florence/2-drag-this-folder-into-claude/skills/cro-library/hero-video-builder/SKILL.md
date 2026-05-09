---
name: hero-video-builder
description: Generate cinematic Amazon A+ Premium hero video using Higgsfield Veo 3.1 / Sora 2 / Cinema Studio. Use when running `hero-video-builder {ASIN}` or when A+ Premium needs a top-of-page hero video that's higher production than UGC.
---

# hero-video-builder — Cinematic A+ Premium Hero Video

For brands that qualify for A+ Premium and want a hero video that stops the scroll on the product detail page — cinematic, ad-quality, not UGC.

## Prerequisites

- Higgsfield MCP
- Product reference image
- Brand identity (color palette, mood, tone)

## Invocation

```
hero-video-builder {ASIN}
hero-video-builder {ASIN} --duration=15 --model=veo-3
hero-video-builder {ASIN} --style=cinema-studio   # use Cinema Studio preset for max polish
```

## Output

`/tmp/cro-content/{ASIN}-hero-video.mp4` + scene breakdown.

## Phase 1 — Concept

Cinematic structure (10-15s):
- 0-3s: Establishing shot (product in hero context)
- 3-8s: Detail / use moment (close-ups, slow motion)
- 8-12s: Lifestyle reveal (product + person)
- 12-15s: Brand close (logo + tagline)

Pull tone/style from research brief and brand guidelines.

## Phase 2 — Generate

Models, ranked by quality:
1. **Veo 3.1** — top-tier cinematic
2. **Sora 2** — second-tier cinematic
3. **Cinema Studio** preset — Higgsfield's curated cinema look
4. **Kling 3.0** — fallback

Single best output. No multi-model spread by default.

## Phase 3 — Output

```markdown
# Hero Video — {ASIN}

**Duration:** {N}s | **Model:** {model} | **Aspect:** 16:9

## Scene Breakdown

| Time | Shot | Description |
|------|------|-------------|
| 0-3s | Establishing | {} |
| 3-8s | Detail | {} |
| ... | ... | ... |

## Output

![Video preview](hero-video.gif)

## A+ Premium Spec

- Aspect: 16:9
- Resolution: 1920×1080 minimum
- Length: ≤45s for A+ Premium video module
- Audio: ambient music + minimal voiceover

## Recommended Next Skill

- Validate scannability: `aplus-comprehension {ASIN}`
- Embed in A+ Premium: `aplus-module-generator {ASIN} --premium`
```

## Reference Files

- Higgsfield docs — Cinema Studio + Veo + Sora
- Vault: `CRO-Knowledge-Base/02-visual-content/a-plus-content.md` (A+ Premium video)

## Quality Bar

- [ ] Scene breakdown documented
- [ ] Resolution/aspect matches A+ Premium spec
- [ ] Brand tone matches identity (not generic stock-look)

## When to Use vs `ugc-video-creator`

- **Hero video** = cinematic, A+ Premium, brand-forward
- **UGC** = handheld, authentic, ad/SBV/feed

## Auto-Triggers

- `aplus-premium-build` calls it
- User asks "make A+ hero video" / "cinematic video for {ASIN}"
