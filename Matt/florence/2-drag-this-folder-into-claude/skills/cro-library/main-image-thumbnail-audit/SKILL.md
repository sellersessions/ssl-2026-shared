---
name: main-image-thumbnail-audit
description: Side-by-side visual diff of your Amazon main image thumbnail vs the top 9 SERP competitors. Pulls SERP via SellerApp n8n MCP, downloads thumbnails, builds a 10-up grid view, then identifies the visual cluster pattern (what 7+ thumbnails look like) and your scroll-stop opportunity. Use when running `main-image-thumbnail-audit {ASIN|keyword}` or before generating new main image concepts.
---

# main-image-thumbnail-audit — SERP Grid Visual Diff

The single fastest way to see why an ASIN's main image isn't stopping the scroll: stack it next to its 9 SERP neighbors at thumbnail size and ask "does this break the cluster?". Per `MASTER-CRO-REFERENCE.md` §3: differentiate, don't blend.

## Invocation

```
main-image-thumbnail-audit {ASIN}
main-image-thumbnail-audit keyword:"protein powder"   # audit a specific SERP
main-image-thumbnail-audit {ASIN} --primary-keyword="best protein powder for women"
```

## Output

`/tmp/cro-content/{ASIN}-thumbnail-audit-{date}.md` with embedded 10-up grid, cluster analysis, and 3 differentiation recommendations.

## Tools Used

n8n MCP wrapper.

| Step | Tool | Purpose |
|------|------|---------|
| Identify keyword | `Keyword_Research_V2_Reverse_ASIN` (top 1 by relative_score) | Primary SERP keyword |
| SERP | `Keyword_Search_Result_SERP_` (extended_response=1, page 1) | Top 10 thumbnails (organic only) |
| Your thumbnail | `Get_Product_Details` | Your image_urls[0] |

## Phase 1 — Pull

3 calls. Combine into 10-image set: yours + top 9 organic competitors.

## Phase 2 — Build the Grid

Download all 10 thumbnails (image_urls). Resize to 150×150 (Amazon mobile thumbnail size — the actual rendering size). Build a 5×2 grid showing each thumbnail with rank label.

Save to `/tmp/cro-content/{ASIN}-thumbnail-grid.png` for embedding.

## Phase 3 — Cluster Analysis

For each thumbnail, tag (lightweight visual classification):
- **Background:** white / lifestyle / colored / dark
- **Subject:** product only / product + packaging / packaging only / lifestyle
- **Color dominance:** {primary hex or descriptor}
- **Composition:** centered hero / off-center / multi-product / tight crop
- **Text/badges visible:** yes/no (Amazon technically forbids but it happens)
- **Scale visible:** yes/no
- **Angle:** straight-on / 3/4 / top-down / dramatic

Identify the dominant cluster: e.g. "7 of 10 are white-bg, centered, straight-on, no scale". That's the cluster your thumbnail must break from.

## Phase 4 — Your Position

- Where does your thumbnail sit? Inside the cluster or outside?
- At 150×150, what reads first? (Color, shape, text legibility)
- 3-second test (heuristic): if a shopper scans the grid for 3s, which thumbnails would they remember?

## Phase 5 — Recommendations

3 differentiation moves, ranked:

1. **Color break** — if cluster is neutral, recommend bold accent color
2. **Composition break** — if cluster is centered hero, recommend angled or off-center
3. **Content break** — if cluster shows product only, recommend hint of use / open package / scale ref

## Phase 6 — Output

```markdown
# Main Image Thumbnail Audit — {ASIN or keyword}

**Date:** {date} | **Primary keyword:** "{keyword}" | **SERP geo:** {us}

## SERP Grid (rendered at 150×150 mobile size)

![](thumbnail-grid.png)

| Rank | ASIN | BG | Subject | Color | Compose | Scale | Angle | Cluster member? |
|------|------|----|---------|-------|---------|-------|-------|-----------------|
| 1 | {own} | white | product+pkg | green | centered | no | straight | YES — blends |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... |

## Cluster Analysis

**Dominant pattern:** 7 of 10 thumbnails are {pattern description}.

**Your thumbnail status:** {inside cluster / outside cluster}.

**At 150×150 — what reads first:** {color → shape → text}.

## Differentiation Recommendations

1. 🎨 **Color break** — {specific recommendation}
2. 📐 **Composition break** — {specific recommendation}
3. 🔍 **Content break** — {specific recommendation}

## Recommended Next Skill

`main-image-pipeline {ASIN}` — feed this audit into concept generation
```

## Reference Files

- Vault: `CRO-Knowledge-Base/02-visual-content/main-image.md`
- `~/.claude/skills/cro/main-image-best-practices.md`

## Quality Bar

- [ ] 10-up grid actually rendered at 150×150 (not full-size — would defeat the audit)
- [ ] Each thumbnail tagged on all 7 dimensions
- [ ] Cluster identified (named pattern, count of members)
- [ ] Recommendations are specific (not "be different" — "switch to a dominant orange accent")

## Auto-Triggers

- User asks "why does my main image blend in" / "audit my SERP thumbnail"
- `main-image-pipeline` calls it during Phase 1
- Before any main image concept work
