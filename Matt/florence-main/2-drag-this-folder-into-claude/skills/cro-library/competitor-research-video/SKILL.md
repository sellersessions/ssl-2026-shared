---
name: competitor-research-video
description: Run a ProductPinion Pinion Video using the Competitor Research Test template — share a SERP and have shoppers narrate why they click certain competitors over others. Use when running `competitor-research-video {keyword|ASIN}` or when planning differentiation strategy backed by recorded shopper reasoning.
---

# competitor-research-video — Why Shoppers Click Competitors

Sister skill to `listing-battle` (which uses Image Split Test polls) — this one captures **video** of shoppers walking through the SERP and explaining their click logic.

## Prerequisites

- ProductPinion MCP
- Either: Amazon SERP URL OR top 5-10 competitor ASINs

## Invocation

```
competitor-research-video {keyword}
competitor-research-video {ASIN} --use-primary-keyword   # auto-pick from reverse ASIN
competitor-research-video --serp-url="https://amazon.com/s?k=..."
```

## Output

`/tmp/cro-content/{slug}-competitor-research-video-{date}.md`

## Phase 1 — Configure

Pinion Videos → Any URL → **Competitor Research Test** template.

URL: an actual Amazon search URL (e.g. `amazon.com/s?k=protein+powder+for+women`).

Default questions:
1. "Look at this search — which products catch your eye? Why?"
2. "Which would you click into first? Why?"
3. "Anything stand out as low-quality or you'd skip?"

Sample: 15-20 shoppers.

## Phase 2 — Analyze

Themes:
- **Why they click X** — what made certain thumbnails win
- **Why they skip Y** — pattern-recognition for "low quality"
- **What language they use** — verbatim phrases that map to differentiation copy

## Phase 3 — Output

```markdown
# Competitor Research Video — "{keyword}"

**Sample:** {N} | **Date:** {date}

## SERP Click Distribution

| Brand | Click attention | Skip rate |
|-------|-----------------|-----------|
| Brand A | High | Low |
| Brand B | Medium | Medium |
| ... | ... | ... |

## Why Shoppers Click

### Brand A (most-clicked)
- "{quote — under 15 words}"
- Theme: clean image + recognizable brand

## Why Shoppers Skip

- "{quote}"
- Pattern: cluttered image + sketchy brand name

## Action Items for {our brand}

| Insight | Action | Skill |
|---------|--------|-------|
| Top-clicked use {pattern X} | Match table-stake | `main-image-pipeline` |
| Top-clicked avoid {anti-pattern} | Stop doing | (audit current) |
| Differentiation gap | Own {opportunity} | `serp-attack-plan` |
```

## Reference Files

- Vault: `CRO-Knowledge-Base/01-research/competitor-audit.md`
- Companion: `listing-battle`, `serp-attack-plan`

## Quality Bar

- [ ] Real SERP URL (not screenshot)
- [ ] Click + skip both analyzed
- [ ] Verbatims clustered into patterns
- [ ] Action items reference specific skills

## Auto-Triggers

- `serp-attack-plan` Phase 1
- Strategy phase deep-dive
- User asks "why are people clicking competitors"
