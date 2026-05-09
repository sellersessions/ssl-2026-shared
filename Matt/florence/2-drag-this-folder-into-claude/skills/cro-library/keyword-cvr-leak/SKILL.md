---
name: keyword-cvr-leak
description: Find Amazon keywords where shoppers search for a benefit your listing doesn't visually demonstrate. Cross-references Reverse ASIN keywords (high search volume) with review-mined drivers (what customers actually buy for) — flagging mismatches as CVR leaks. Use when running `keyword-cvr-leak {ASIN}`, when CVR is below category average, or when planning the listing image stack.
---

# keyword-cvr-leak — Keyword × Visual-Coverage Diagnostic

A specific, high-leverage diagnostic: every high-volume keyword that searches for a benefit, where your listing doesn't visually show that benefit, is bleeding CVR. This skill finds them.

## Invocation

```
keyword-cvr-leak {ASIN}
keyword-cvr-leak {ASIN} --threshold=10000   # min search volume to flag (default 5000)
```

## Output

`/tmp/cro-research/{ASIN}-cvr-leaks-{date}.md`

## Tools Used

n8n MCP wrapper. Plus inputs from prior skills.

| Step | Tool | Purpose |
|------|------|---------|
| Keywords | `Keyword_Research_V2_Reverse_ASIN` (results_count=200, additional_details=1) | High-volume keywords + benefit signals |
| Reviews | `Get_Product_Reviews` 5★ pages 1-3 | What customers love about it |
| Listing | `Get_Product_Details` (with realtime_data=1) | Current bullets + image set + title |

## Phase 1 — Pull

Run all 3 in parallel. Use existing `asin-deep-research` outputs if available.

## Phase 2 — Build the Coverage Map

For each keyword above threshold:
1. Extract the benefit/feature implied by the keyword (NLP: "leg elevation pillow" → benefit = leg elevation; "pillow for back pain" → benefit = back pain relief)
2. Check: does the **title** mention this benefit? (yes/no)
3. Check: does any **listing image** visually show this benefit? (yes/no — requires inspection of image_urls)
4. Check: does any **bullet** call it out? (yes/no)

A keyword is a "CVR leak" when:
- Search volume ≥ threshold AND
- Customers in 5★ reviews confirm this benefit matters AND
- Title OR image OR bullet does NOT cover it

## Phase 3 — Rank Leaks by Impact

Score each leak: `search_volume × (1 if reviews-confirmed else 0.3) × (3 if image-missing, 2 if bullet-missing, 1 if title-missing)`.

Top 10 = priority fix list.

## Phase 4 — Output

```markdown
# Keyword CVR Leak Analysis — {Title}

**ASIN:** {ASIN} | **Date:** {date} | **Volume threshold:** {N}

## Data Sources

| Source | Records | Status |
|---|---|---|
| Reverse ASIN keywords | 200 | ✅ |
| Reviews (5★) | 30 | ✅ |
| Current listing | 1 ASIN | ✅ |

## Top 10 CVR Leaks (ranked by impact)

| # | Keyword | Vol/mo | Implied Benefit | Reviews-Confirm | Title? | Bullet? | Image? | Recommended Fix |
|---|---------|--------|-----------------|-----------------|--------|---------|--------|------------------|
| 1 | "leg elevation pillow" | 45000 | Leg elevation | ✅ "I use this for elevation" | ❌ | ✅ | ❌ | Add lifestyle slot 3 showing leg-elevation use |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... |

## Coverage Gaps Summary

- **Image gaps** (highest CVR impact): {N} keywords
- **Bullet gaps**: {N} keywords
- **Title gaps**: {N} keywords

## Recommended Next Skills

- Generate the missing visual: `lifestyle-stack-generator {ASIN}` or `infographic-builder {ASIN}`
- Fix the listing copy: `copy-split-test {ASIN}`
- Full CVR fix pipeline: `cvr-leak-fix {ASIN}`
```

## Reference Files

- Vault: `CRO-Knowledge-Base/MASTER-CRO-REFERENCE.md` §4 ("High-volume keyword for benefit not shown → CVR leak — fix immediately")
- `~/.claude/knowledge/cro-methodology/decision-framework.md`

## Quality Bar

- [ ] At least 10 keywords assessed; top 10 leaks ranked
- [ ] Coverage check is honest (verified by inspecting actual title / bullets / images)
- [ ] Recommended fix per leak is specific (slot number, image type, or bullet rewrite)
- [ ] Reviews-confirmation column filled (otherwise this is just "keyword research")

## Common Mistakes

- ❌ Flagging brand keywords as leaks (you're already there)
- ❌ Not checking the actual image content — keyword may be in alt-text
- ❌ Treating low-volume long-tail as leaks (focus on threshold)

## Auto-Triggers

- User says "why is CVR low on {ASIN}" / "what keywords am I missing"
- `cvr-leak-fix` calls it as a sub-step
- `/cro-content-plan` Phase 2 references it
