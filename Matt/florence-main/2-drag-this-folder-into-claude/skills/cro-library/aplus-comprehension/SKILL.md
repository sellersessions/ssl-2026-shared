---
name: aplus-comprehension
description: Validate Amazon A+ Premium content scannability by running a ProductPinion Pinion Video on the A+ section URL — shoppers view the A+ and answer comprehension questions. Validates the "scannable in 15-20 seconds" rule from `02-visual-content/a-plus-content.md`. Use when running `aplus-comprehension {ASIN}` or after launching new A+ content.
---

# aplus-comprehension — A+ Scannability & Comprehension Test

A+ that takes 60 seconds to scan loses readers. The rule per `02-visual-content/a-plus-content.md`: scannable in 15-20 seconds. This skill validates it with real shoppers.

## Prerequisites

- ProductPinion MCP
- Live Amazon listing with A+ content rendered

## Invocation

```
aplus-comprehension {ASIN}
aplus-comprehension {ASIN} --shoppers=15
```

## Output

`/tmp/cro-content/{ASIN}-aplus-comprehension-{date}.md`

## Phase 1 — Configure

Pinion Videos → Any URL → custom A+ comprehension questions.

Setup:
- URL: Amazon detail page (A+ renders within)
- Sample: 15 shoppers
- Questions (after they scroll the A+):
  1. "After viewing the A+ content, what is this product?"
  2. "What 3 things stood out?"
  3. "What's the main reason someone would buy this?"
  4. "Was anything confusing or did you skip past it?"

## Phase 2 — Analyze

Comprehension scores:
- **Identification:** % who correctly described the product
- **Top-3 recall:** Do their "stood out" items match the modules' intended messages?
- **Buy reason match:** Does their answer match the brief's #1 driver?
- **Skip behavior:** Which modules did they skip / not remember?

Tag pass/fail:
- ✅ ≥80% identification + top-3 recall matches design intent
- ⚠️ 60-80% — partial pass
- ❌ <60% — A+ failing the scannability rule

## Phase 3 — Output

```markdown
# A+ Comprehension — {ASIN}

**Sample:** {N} | **Date:** {date} | **A+ launch date:** {when}

## Comprehension Scores

| Metric | Score | Pass? |
|--------|-------|-------|
| Product identification | 92% | ✅ |
| Top-3 recall match | 73% | ⚠️ |
| #1 driver match | 60% | ⚠️ |
| Skipped modules | 2 of 6 (modules 4, 5) | ❌ |

## What Stood Out (verbatim themes)

- "the colors / design" — visual hook working
- "before/after photos" — module 2 landing
- ...

## What Was Skipped / Confusing

- Module 4 ("Visual FAQ") — 60% skipped
- Module 5 (comparison) — 40% confused

## Action Items

| Module | Issue | Recommended fix |
|--------|-------|-------------------|
| 4 | Skipped | Stronger lead image, more visual / less text |
| 5 | Confusing | Simplify comparison — too many cells |

## Recommended Next Skill

For module-level rebuild: `aplus-module-generator {ASIN} --modules-to-redo=4,5`
```

## Reference Files

- Vault: `CRO-Knowledge-Base/02-visual-content/a-plus-content.md`
- `~/.claude/skills/cro/aplus-best-practices.md`

## Quality Bar

- [ ] All 4 comprehension scores filled
- [ ] Skipped modules identified explicitly
- [ ] Action items module-by-module

## Auto-Triggers

- After A+ launch
- `aplus-premium-build` final phase
- Quarterly review when A+ engagement appears low (per Business Reports A+ engagement metric)
