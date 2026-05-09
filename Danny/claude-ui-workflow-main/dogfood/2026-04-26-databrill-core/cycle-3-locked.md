---
project: claude-ui-workflow
cycle: 3
brand: databrill-core
stage: 10 (cycle reset gate)
date: 2026-04-27
status: LOCKED
---

# Cycle-3 Databrill Core — Locked

## Final REFINE scores

| Dimension | Score |
|---|---|
| Color | 5/5 |
| Typography | 4/5 |
| Spacing | 4/5 |
| Layout | 5/5 |
| Content | 5/5 |
| Polish | 4/5 |
| **Total** | **27/30** |

## Hard-fail copy audit result

**PASS** — 88/88 locked source-truth strings verified verbatim in
rendered DOM (`htmllib.unescape(html)` byte-for-byte match).

- First-pass result: **4 missing** (problem-grid card titles
  "Access", "Cost", "Time", "Build")
- After Stage-8 fix: **0 missing**
- Palette discipline: all 5 canonical Databrill dark colours present
  (`#0c0a14`, `#100e1a`, `#e07a3a`, `#7c6bbd`, `#f5f5fa`); auxiliary
  tones (`#a394d6`, `#f09050`, `#ff4d00`, `#ffb380`) are gradient
  tints/shades of canonical accents — no off-brand drift.

## Total fixes applied during Stage 8

**1 fix, 16 LOC delta**, in 1 file:

- `dogfood/2026-04-26-databrill-core/full-page-merged.html` — added
  `<h3>` headings ("Access", "Cost", "Time", "Build") with canonical
  brand styling (`text-base tracking-wider uppercase`, accent
  `#e07a3a`) inside each of the four problem-grid glass cards.

## Cycle-3 findings logged

- **#38** — Stage 8 hard-fail audit catches dropped copy that visual
  review misses (primitive validated)
- **#39** — `source-truth.json` schema mixes copy with structural
  metadata; audit needs explicit field-type tagging
- **#40** — `locks.json` is missing the `anti_drift_rules` field
  referenced by Stage-8 spec

(Full detail in `cycle-3-retro.md`.)

## Cycle-4 carry-forward

1. Promote Stage-8 hard-fail audit to a blocking gate in
   `PRE-CHECK-CHECKLISTS.md`.
2. Standardise `source-truth.json` schema (copy vs structural
   metadata).
3. Extend `locks.json` schema to include `anti_drift_rules`.
4. Ship `scripts/audit-locked-copy.py` as a permanent tool (currently
   an inline heredoc).
5. Pricing / trust-ticker content-strategy call with the operator.

---

**Cycle-3 Databrill Core locked. Cycle-4 may begin.**
