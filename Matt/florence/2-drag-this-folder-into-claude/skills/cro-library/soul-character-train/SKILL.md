---
name: soul-character-train
description: Train a Higgsfield Soul Character for an Amazon brand using 3-5 reference photos, then save the trained character ID for reuse across all the brand's lifestyle photography (consistency across slots 2-7 + A+ modules + ad creatives). Use when running `soul-character-train {brand}` once per new brand client, before generating any lifestyle stack.
---

# soul-character-train — Per-Brand Soul Character Training

Per Higgsfield docs: Soul Character training lets you generate the same person across infinite scenes/styles with consistency. For Amazon CRO, this means slots 2-7, A+ modules, sponsored brand video, and ad creatives all feature the same model — a massive consistency win that no AI image gen accomplishes by default.

This is a **one-time per brand** setup skill.

## Prerequisites

- Higgsfield MCP
- 3-5 reference photos of the target demographic (can be customer photo reviews, stock, or commissioned shoots)

## Invocation

```
soul-character-train {brand-slug} --references={dir-of-photos}
soul-character-train priority-chef --references=~/Desktop/priority-chef-refs
soul-character-train --list                        # list trained characters across brands
soul-character-train --regenerate {brand-slug}     # retrain if demographic shifts
```

## Output

- Trained character saved to Higgsfield account
- Character ID + metadata saved to `~/.claude/skills/soul-character-train/.brand-characters.json`
- Confirmation report at `/tmp/cro-content/{brand}-soul-trained-{date}.md`

## Brand Character Registry

`~/.claude/skills/soul-character-train/.brand-characters.json` schema:

```json
{
  "priority-chef": {
    "character_id": "soul_xxx",
    "trained_date": "2026-05-08",
    "demographic": {
      "age_band": "35-50",
      "gender": "female",
      "setting": "kitchen / home"
    },
    "reference_count": 5,
    "version": 1
  },
  "etta-vita": { ... }
}
```

Other Higgsfield-using skills (`lifestyle-stack-generator`, `aplus-module-generator`, `ugc-video-creator`) auto-look-up the brand's character before generating.

## Phase 1 — Demographic Spec

Confirm with user:
- Age band
- Gender expression
- Race/ethnicity
- Setting (where will they be? home, gym, outdoors, etc.)
- Style (athleisure, professional, casual, etc.)

Pull from review-mining photo evidence if available.

## Phase 2 — Reference Photo Set

3-5 photos. Each should:
- Be high quality (≥1024×1024)
- Show the same person from different angles
- Feature consistent lighting/style
- Match the demographic exactly

If user only has product/customer photos: skill recommends commissioning 3-5 quick stock-style shots first OR using customer review photos (with note: customer photos are inconsistent across people).

## Phase 3 — Train via Higgsfield MCP

Submit training job. Wait for completion (typically minutes-to-hours per Higgsfield).

## Phase 4 — Validate

Generate 3 quick test images using the trained character — different scenes (kitchen, outdoor, close-up) — to confirm consistency. Save to `/tmp/cro-content/{brand}-soul-test/`.

If consistency fails: retrain with better references.

## Phase 5 — Output

```markdown
# Soul Character Trained — {brand}

**Date:** {date} | **Character ID:** {soul_xxx}

## Demographic Anchor

- Age: {band}
- Gender: {expression}
- Setting: {context}
- Style: {style}

## Reference Photos Used
- ![](ref-1.png) — {description}
- ![](ref-2.png)
- ...

## Validation Test (3 scenes)

| Scene | Image | Consistency | Pass |
|-------|-------|-------------|------|
| Kitchen | ![](test-1.png) | Same face/build | ✅ |
| Outdoor | ![](test-2.png) | Same face/build | ✅ |
| Close-up | ![](test-3.png) | Same face/build | ✅ |

## Now Available For

These skills will auto-use this character for {brand}:
- `lifestyle-stack-generator` (slots 2-7)
- `aplus-module-generator` (modules with people)
- `ugc-video-creator` (UGC with consistent talent)
- `ad-creative-batch` (Ad Engine variations)

## Maintenance

Re-train if:
- Brand demographic shifts (different target age / setting)
- Higgsfield Soul model upgrades
- New, better reference photography becomes available

Run `soul-character-train --regenerate {brand}` to bump version.
```

## Reference Files

- Higgsfield docs (Soul Character feature)
- `~/.claude/skills/lifestyle-stack-generator/SKILL.md` — primary downstream consumer

## Quality Bar

- [ ] 3 test scenes generated, all show same person
- [ ] Brand registry file updated with character ID
- [ ] Demographic matches research brief

## Auto-Triggers

- New brand onboarding (do this once before any lifestyle work)
- `lifestyle-stack-generator --train-soul` flag
- User asks "train a Soul character for {brand}"
