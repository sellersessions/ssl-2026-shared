---
name: cvr-leak-fix
description: End-to-end CVR-leak fix pipeline. Detects keyword × visual coverage gaps via SellerApp, generates the missing visual via Higgsfield, validates with ProductPinion poll, outputs ship-ready slot. Use when running `cvr-leak-fix {ASIN}` or when CVR is below category average and you need a single-slot intervention. Closes the loop from diagnosis to ship-ready in one pipeline.
---

# cvr-leak-fix — Full CVR-Leak Diagnostic-to-Ship Pipeline

The high-leverage CVR play: find the biggest keyword × visual gap, generate the visual that fills it, validate with shoppers. One slot, three tools, ship-ready output.

## Prerequisites

- SellerApp via n8n MCP
- Higgsfield MCP
- ProductPinion MCP

## Invocation

```
cvr-leak-fix {ASIN}
cvr-leak-fix {ASIN} --leak-rank=1   # default: fix top leak; use 2/3 for next-priority
```

## Output

`/tmp/cro-content/{ASIN}-cvr-leak-fix-{date}.md` + ship-ready image at `/tmp/cro-content/{ASIN}-cvr-fix-WINNER.png`.

## State File

`/tmp/cro-content/{ASIN}-cvr-leak-fix.state.json` for resumable runs.

## Phase 1 — Detect

Calls `keyword-cvr-leak {ASIN}` → top-10 leaks with recommended fixes.

## Phase 2 — Pick the Target

Default: top-ranked leak. User can override with `--leak-rank=N`.

The leak record contains:
- Keyword + search volume
- Implied benefit
- Coverage gap (image / bullet / title)
- Recommended fix type

## Phase 3 — Generate the Fix

Branch by fix type:
- **Image gap → `infographic-builder`** for benefit overlays OR `lifestyle-stack-generator` for use-context
- **Bullet gap → `copy-split-test`** with 3 bullet variants generated
- **Title gap → `copy-split-test`** with 3 title variants

Skill picks the right downstream skill, passes the leak's benefit constraint, gets the candidate output.

## Phase 4 — Validate

Branch by fix type:
- **Image fix → `main-image-poll`** if main, `three-second-test` if hero, or `stacked-gallery-test` if it changes the whole stack
- **Copy fix → `copy-split-test`** (ProductPinion text split)

Use existing brand audience via `audience-builder` lookup.

## Phase 5 — Output (Ship-Ready)

```markdown
# CVR-Leak Fix — {ASIN}

**Leak fixed:** {keyword} ({vol}/mo) — benefit "{benefit}" was searched but not visually shown
**Date:** {date}

## Pipeline Trace

| Phase | Output | Link |
|-------|--------|------|
| 1. Detect | Leak rank #{N} | [keyword-cvr-leak] |
| 2. Generate | {N candidates} | [generation output] |
| 3. Validate | Winner: {variant} at {N}% preference | [poll output] |

## Winner

![](winner.png)

**Why this fixes the leak:**
{trace from leak to fix to validation}

## MYE Launch Plan

- Test: New {slot} vs current
- Duration: 14 days
- Success: CVR lift ≥10% for visitors searching the leak keyword
- Source-attribution: SQP keyword-level CVR (track {keyword} specifically)

## Recommended Next Skill

- After 14 days: pull SQP, validate the leak closed → run `cvr-leak-fix {ASIN} --leak-rank=2` for next-priority leak
```

## Reference Files

- `~/.claude/knowledge/cro-methodology/decision-framework.md` (CVR > CTR priority)
- Vault: `CRO-Knowledge-Base/MASTER-CRO-REFERENCE.md` §4 (CVR-leak rules)

## Quality Bar

- [ ] All 4 phases completed (or graceful stop with state saved)
- [ ] Winner traces back to specific leak (not arbitrary)
- [ ] MYE launch plan + success metric specific to the leak

## Auto-Triggers

- User says "fix CVR for {ASIN}" / "what's leaking on {ASIN}"
- Diagnostic shows healthy CTR but low CVR
- Following `/cro-priority-tracker` or `sqp-priority-rank`
