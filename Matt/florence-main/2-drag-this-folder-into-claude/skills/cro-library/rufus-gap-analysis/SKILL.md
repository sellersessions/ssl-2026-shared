---
name: rufus-gap-analysis
description: Pull Rufus AI queries for an Amazon ASIN, classify each (FAQ / comparison / use case / concern), and map every query to a content slot (image, A+ segment, bullet, alt-text). Use when running `rufus-gap-analysis {ASIN}`, when planning A+ content, or when diagnosing "missing information" in a listing. Each Rufus question is a content gap your listing should already answer.
---

# rufus-gap-analysis — Rufus AI Queries → Content Slot Map

Per `MASTER-CRO-REFERENCE.md` §2: every Rufus query = a gap in the listing's information architecture. This skill pulls them, classifies them, and tells you exactly where each one should be answered.

## Invocation

```
rufus-gap-analysis {ASIN}
rufus-gap-analysis {ASIN} --search-query="does it have voice control"   # narrow to a specific concern
```

## Output

Writes to `/tmp/cro-research/{ASIN}-rufus-gaps-{date}.md` and opens.

## Tools Used

n8n MCP wrapper. Tool prefix `mcp__f32016b6-7c77-45e2-b4a2-70195c5f2d2d__*`.

| Step | Tool | Purpose |
|------|------|---------|
| Pull queries | `Get_Rufus_AI_Queries` | All Rufus suggestions for ASIN |
| Optional: drill | Same tool with `search_query` param | Get follow-up queries on a specific topic |

## Phase 1 — Pull

Single call: `Get_Rufus_AI_Queries(productId, geo)`. Returns array of queries + Rufus's own answer.

## Phase 2 — Classify

For each query, tag with one of:

| Class | Pattern | Slot recommendation |
|-------|---------|---------------------|
| **FAQ** | "Is/Does/Can it…" / "How long…" / "What is…" | A+ bottom half (Visual FAQ) |
| **Comparison** | "vs / better than / compared to" / "Is X or Y" | Listing image: comparison table or callout |
| **Use case** | "for X" / "good for…" / "can I use it for…" | Listing image: lifestyle/in-context |
| **Concern** | "is it safe" / "side effects" / "real" / "legit" | Listing image: trust signal / objection-handling |
| **Specs** | "size" / "weight" / "battery life" / "ingredients" | Bullet point + listing image with overlay |

## Phase 3 — Map to Slots

Output the slot map. Per `02-visual-content/a-plus-content.md`:
- A+ top half (segments 1-3) = NOT for FAQs (that's bottom half)
- A+ bottom half = FAQ visual answers
- Slot 2-3 listing images = highest-impact, pick top concerns
- Slot 7 = strong close (don't waste on minor specs)

## Phase 4 — Write Output

```markdown
# Rufus Gap Analysis — {Title}

**ASIN:** {ASIN} | **Date:** {date} | **Rufus queries pulled:** {N}

## Data Sources

| Source | Records | Status |
|---|---|---|
| Rufus AI Queries | {N} queries | ✅ |

## Classified Queries

| # | Query | Class | Recommended Slot | Notes |
|---|-------|-------|-------------------|-------|
| 1 | "Does it have voice control?" | Concern | A+ bottom half segment 4 | Auto-fail if not in listing |
| 2 | ... | ... | ... | ... |

## Content Gap Summary

- **A+ bottom half FAQs to add:** {list of FAQ-class queries}
- **Listing image opportunities:** {Use case + Comparison classes mapped to slots}
- **Bullet point updates:** {Specs class}
- **Alt-text injections:** {Pack every Rufus phrase into A+ alt-text — Amazon search + Rufus index this}

## Top 3 "Must Answer Now"

The 3 queries Rufus is asking that have the highest impact if unanswered:
1. {query} — {slot} — {why critical}
2. ...

## Recommended Next Skills

- For A+ refresh: `rufus-answer-pack {ASIN}`
- For full content plan: `/cro-content-plan {ASIN}`
```

## Reference Files

- `~/.claude/skills/cro/methodology.md`
- Vault: `CRO-Knowledge-Base/01-research/rufus-ai-queries.md`
- Vault: `CRO-Knowledge-Base/MASTER-CRO-REFERENCE.md` §2 (Rufus is signal #3 of 4)
- Anthropic skill: `amazon-rufus-optimization`

## Quality Bar

- [ ] Every Rufus query classified (no "uncategorized")
- [ ] Slot mapping uses the two-half A+ rule (top = capture, bottom = FAQ)
- [ ] Top 3 "Must Answer Now" justified with rationale
- [ ] Alt-text injection list included (often missed — high SEO value)

## Auto-Triggers

- User asks "what is Rufus saying about {ASIN}"
- A+ refresh / `rufus-answer-pack` / `/cro-content-plan` calls it
