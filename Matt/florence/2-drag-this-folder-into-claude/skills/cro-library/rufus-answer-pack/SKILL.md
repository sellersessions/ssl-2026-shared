---
name: rufus-answer-pack
description: Convert top Rufus AI queries into a complete A+ bottom-half FAQ refresh + listing image alt-text injection. Generates FAQ images via Higgsfield, validates comprehension via ProductPinion. Use when running `rufus-answer-pack {ASIN}` after `rufus-gap-analysis` identifies content gaps.
---

# rufus-answer-pack — Rufus → A+ FAQ Refresh

Per `MASTER-CRO-REFERENCE.md` §2: every Rufus query is a content gap. This pipeline closes the gaps systematically.

## Prerequisites

- All 3 MCPs

## Invocation

```
rufus-answer-pack {ASIN}
rufus-answer-pack {ASIN} --top-N=5
```

## Phase 1 — Source Gaps

Calls `rufus-gap-analysis {ASIN}` → classified queries with slot recommendations.

## Phase 2 — Pick Top-5 (default)

Filter to "FAQ" and "Concern" classes (per Rufus gap analysis classification). Cap at 5.

## Phase 3 — Generate FAQ Module Set

Calls `aplus-module-generator` with `--bottom-half-only` constraint and the 5 queries as the module sources.

Each module: photo-led answer to one Rufus query, alt-text packed with the query phrasing + product keywords.

## Phase 4 — Validate

`aplus-comprehension {ASIN}` post-deploy or with mockup — confirm shoppers can scan and recall the FAQ answers.

## Phase 5 — Output

```markdown
# Rufus Answer Pack — {ASIN}

**Date:** {date} | **Queries answered:** {N}

## Queries → Modules

| Rufus Query | Class | Module | Image | Alt-Text |
|-------------|-------|--------|-------|----------|
| "Does it have voice control?" | Concern | A+ Module 4 | ![](mod-4.png) | "{packed string}" |
| ... | ... | ... | ... | ... |

## A+ Bottom-Half Refresh Spec (modules 4-7)

{Designer-ready spec per module}

## Comprehension Validation

| Query | Pre-fix recall | Post-fix recall (mockup) | ✅ |
|-------|----------------|---------------------------|-----|
| ... | 30% | 78% | ✅ |

## Recommended Next Skill

- Deploy via Brand Registry A+ editor (no MYE — instant deploy)
- Re-run `rufus-gap-analysis {ASIN}` in 30 days to confirm queries shifted
```

## Reference Files

- Anthropic skill: `amazon-rufus-optimization`
- Vault: `CRO-Knowledge-Base/01-research/rufus-ai-queries.md`

## Quality Bar

- [ ] 5 queries → 5 modules
- [ ] Alt-text packed (Rufus + Amazon search index this)
- [ ] Comprehension mockup-tested before live deploy
