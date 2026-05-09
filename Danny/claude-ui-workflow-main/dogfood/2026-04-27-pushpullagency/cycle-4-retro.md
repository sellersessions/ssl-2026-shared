---
project: claude-ui-workflow
cycle: 4
brand: push-pull-agency
stage: 9 (cycle retro)
date: 2026-04-27
predecessor: cycle-3 (last finding #40)
---

# Cycle-4 retro — Push-Pull Agency

> Cycle-4 introduced the **honest-measurement curve** — first cycle to
> log per-stage timing in a `TIME-LOG.md` artifact rather than guessing
> at workflow cost. Goal: identify which stages are infra-compoundable
> floors vs which ones are irreducible (operator + external compute).
> Cycle-4 also shipped the cycle-3 carry-forward: `scripts/audit-copy.py`
> as a permanent project tool, replacing the inline Stage-8 heredoc.

## What worked

- **`scripts/audit-copy.py` shipped and smoke-tested clean.** Cycle-3
  finding #40 carry-forward closed in 4 minutes (06:21→06:25, vs 30 min
  budget). Smoke-tested PASS on both prior brands' artifacts (Re Tech UK
  24/24 strings + 9/9 anti-drift; Databrill Core 88/88 strings) before
  cycle-4 Stage 8 ran against it. The schema-v2 `anti_drift_strings`
  array (cycle-3 #40 carry-forward) was honoured directly, no regex
  extraction needed.
- **Stage-8 hard-fail audit ran clean first pass.** 45/45 locked
  strings verbatim present. 15/15 anti-drift strings absent. PASS,
  zero fixes required. First cycle in the project history with a
  zero-fix Stage-8 result — visual-brief merge primitive (cycle-2 #36)
  + 3.1 Pro routing + locks-v2 schema is now a stable triad.
- **Honest measurement landed.** Stages 1–6 + tool build elapsed in
  ~8 min wall-clock (06:21 → 06:29). The TIME-LOG showed extract-flow
  Tier-0 returning partial (same Shopify-style floor as Re Tech UK
  cycle-3) and WebFetch fallback covering it cleanly in ~2 min — the
  floor is now empirically known, not estimated.
- **Schema-v2 `locks.json` proved out.** Explicit `anti_drift_strings`
  array (15 phrases) + `anti_drift_rules` prose (6 rules) + flat
  `*_verbatim` keys gave the audit script unambiguous targets. No
  regex inference, no STRUCT_FIELDS exclusion list — the cycle-3 #39
  schema-mixing problem is structurally avoided in v2.
- **Wordmark discipline held.** All five wordmark hallucinations
  (`PUSH PULL`, `Push Pull`, `PushPull`, `PUSHPULL`, `Push & Pull`)
  absent from rendered DOM. The hyphenated `Push-Pull` form is
  preserved verbatim throughout.

## What broke

- **Nothing broke at Stage 8.** First clean cycle. The retro-worthy
  observations are about workflow shape, not defects.
- **Stage 7 (Stitch) is the irreducible floor.** TIME-LOG marks it
  "AWAITING OPERATOR — review brief, paste into Stitch, drive GUI,
  ZIP export." This stage is the operator + Google's compute, and
  no amount of project infrastructure compounds against it. Stages
  1–6 collapsing from "vibes-based effort" to ~8 min measured wall
  clock highlights how much weight Stage 7 now carries proportionally.
- **No subjective friction logged.** The TIME-LOG `Friction notes`
  block is empty for this cycle. Either the workflow ran clean or
  micro-friction wasn't captured live — flagging for cycle-5 to keep
  a stricter capture habit during execution, not just retros.

## Findings

> Continuing the cycle-3 sequence which ended at #40. (Cycle-3 retro
> noted parallel Re Tech UK starting at #38; the merge convention
> kept Databrill Core's #38–#40 as the canonical sequence.)

### #41 — Programmatic Stage-8 audit collapses fix-cycle time to zero on a clean run

- **Stage:** 8 (REFINE / hard-fail copy audit)
- **Rank:** 🟢 primitive validated (now permanent tooling)
- **Evidence:** `scripts/audit-copy.py` ran against
  `full-page-merged.html` and returned 45/45 locked strings present,
  15/15 anti-drift strings absent, PASS. Total runtime <1 second.
  No fixes applied to the deliverable. Compare cycle-3 Databrill Core:
  4/88 missing on first pass, 1 fix (16 LOC). Compare cycle-3 Re Tech
  UK: 0 missing first pass but inline heredoc audit only.
- **Reasoning:** The inline-heredoc audit (cycles 1–3) was fragile —
  every cycle reinvented the STRUCT_FIELDS exclusion list (cycle-3
  #39). Schema-v2 `locks.json` + `audit-copy.py` reading the explicit
  `*_verbatim` arrays + `anti_drift_strings` array eliminates the
  schema-walk ambiguity. The audit is now a 1-second blocking gate.
- **Recommendation:** Promote `scripts/audit-copy.py` invocation into
  the Stage-8 step of `PRE-CHECK-CHECKLISTS.md` as the canonical call.
  Inline heredocs deprecated.

### #42 — Stage 7 (Stitch) is the irreducible operator-time floor; infra cannot compound it

- **Stage:** 7 (Stitch model gate)
- **Rank:** 🟠 major (workflow architecture insight)
- **Evidence:** TIME-LOG.md shows Stages 1–6 + tool build at ~8 min
  total wall clock. Stage 7 (`AWAITING OPERATOR`) is unbounded by
  Claude infra — it's operator review of the design brief, paste into
  Stitch, drive the GUI, ZIP export. Subsequent project-infra work
  will continue compressing Stages 1–6 and 8–10, but Stage 7 stays
  fixed. Over time the proportional cost of Stage 7 in the cycle
  approaches 100% of operator-time.
- **Reasoning:** Honest measurement (cycle-4 primitive) makes this
  visible. Without per-stage timing, the workflow felt uniformly
  expensive; with timing, the floor is obvious. This reframes future
  ROI work — "speed up Stage 7" requires either reducing operator
  review touches (better Stage-6 brief = first-pass acceptance) or
  externalising the GUI step (Stitch API / `mcp__stitch__*`).
- **Recommendation cycle-5:** Investigate `mcp__stitch__*` MCP tools
  (`generate_screen_from_text`, `apply_design_system`, `get_screen`)
  as a candidate to bypass GUI-driven export. If the MCP can take a
  `stitch-prompt.md` and return rendered output programmatically,
  Stage 7 collapses from operator-time-floor to another infra step.
  Spike candidate, not a cycle-5 commitment.

### #43 — Schema-v2 `locks.json` (with `anti_drift_strings` array) makes the audit script trivial

- **Stage:** 5 / 8 (lock primitive ↔ audit)
- **Rank:** 🟢 schema validated
- **Evidence:** `locks.json` cycle-4 ships with `schema_version: 2`,
  `anti_drift_strings` (15 explicit phrases), `anti_drift_rules` (6
  prose rules), and flat `*_verbatim` keys. `audit-copy.py` reads
  these directly — no regex extraction from the prose rules, no
  field-type tagging walk over `sections[*]`. Cycle-3 #39 (mixed-
  schema audit) and #40 (missing `anti_drift_rules` field) are both
  structurally closed by v2.
- **Reasoning:** Cycle-3 carry-forward items #39 and #40 wanted
  schema-level fixes. Schema-v2 delivers them as: (a) `*_verbatim`
  arrays only contain copy strings (no `id`, `layout`,
  `cta_style` — those structural fields don't exist in the v2 lock
  file at all), and (b) `anti_drift_strings` is a first-class array.
  The audit script becomes a 60-line iterator instead of a tagged-
  walk parser.
- **Recommendation:** Backport schema-v2 to all prior brands'
  `locks.json` (cycles 1–3) when convenient. New brands should default
  to v2 from `/intake` onward.

### #44 — REFINE rubric mismatch with hybrid deliverable

The 6-dim REFINE rubric (Color/Typography/Spacing/Layout/Content/Polish,
each /5) was designed in cycle-1 for a single-source deliverable. Since
cycle-2 the deliverable is a **hybrid**: Stitch renders the hero
(operator pixel-reviews this directly), Claude reproduces the body with
locked copy from `source-truth.json` rendered against the same design
language. Scoring it like-for-like against the original brand site is
also wrong — the workflow is not a clone, it's a design-system
application.
- **What was decided cycle-4:** Methodology note added to
  `cycle-4-locked.md` codifying that REFINE measures **design-system
  application consistency in the shipped artifact**, not Stitch-vs-
  source fidelity. Cross-cycle totals remain comparable on the
  shipped-quality axis under that lens.
- **What's open for cycle-5:** Decide between (a) keep single 6-dim
  total + methodology caveat (current), (b) split into Hero band
  (6-dim, operator-judged) + Body band (audit PASS + design-language
  consistency, smaller rubric), or (c) drop the numeric total and
  keep binary gates only. Likely tunable cycle-by-cycle until the
  measurement settles.

## Decisions for cycle-5

> Carry-forward unresolved items from cycle-3, plus cycle-4
> discoveries.

1. **Spike `mcp__stitch__*` MCP** as a candidate Stage-7 collapse
   (per #42). Out-of-cycle exploration; not a cycle-5 commitment.
2. **Backport schema-v2 `locks.json`** to cycles 1–3 brand directories
   when convenient (per #43). Low priority — existing audits work.
3. **Stricter live friction capture** during cycle execution (per
   "What broke" — empty Friction notes). Operator habit, not infra.
4. **Pricing / trust-ticker content-strategy call** still open from
   cycle-3 carry-forward — the operator decision pending.
5. **PRE-CHECK-CHECKLISTS.md update** to canonicalise
   `scripts/audit-copy.py` invocation as the Stage-8 step (per #41).

## Score (REFINE 6-dim, 0-5 each)

| Dimension | Score | Notes |
|---|---|---|
| Color | 5/5 | Carbon charcoal `#0e0e10` + surface `#16161b` + warm off-white `#f5f4ee` + single bold cobalt `#1f5cff` accent. Two cobalt-block juxtaposition sections (Stats strip + Final CTA) per design intent. No off-brand drift. |
| Typography | 5/5 | Clean sans-serif throughout per `typography_direction`. Bold display-scale stat numerals. Mid-weight body. No type-system drift. |
| Spacing | 5/5 | Grid-led structured sections per `layout_direction`. Generous whitespace centred hero. Card-based services on dark surface. Vertical rhythm consistent across the ten-section blueprint. |
| Layout | 4/5 | Section blueprint (Header → Hero → Stats[C] → Services → Logos → Story → Case studies → Testimonials → Final CTA[C] → Footer) reads top-to-bottom with the two cobalt-block juxtapositions creating intended chromatic pacing. Minor: the alternating dark/cobalt rhythm only triggers twice (sections 3 + 9), which is the brief — but visually conservative for a B2B confident voice. Not a defect, design choice. |
| Content | 5/5 | All 45 locked copy strings verbatim present. Wordmark `Push-Pull` (hyphenated, title case) preserved everywhere. All 15 anti-drift phrases absent. Voice (specialists-not-generalists, data-led, anti-vendor-quirk) consistent. |
| Polish | 4/5 | Sharp-corner discipline held (no pill buttons, no rounded-2xl glass per `roundness_direction`). Cobalt-on-dark CTA contrast strong. Minor: focus-visible / keyboard-nav polish not separately verified — same accessibility-polish gap noted in cycle-3 (#carry from #38-era observation). |

**Total: 28/30**

**Hard-fail copy audit: PASS** (45/45 locked strings verbatim
present in DOM, 15/15 anti-drift strings absent, zero fixes applied).

## Files edited during Stage 8

None. First clean Stage-8 pass in project history — `audit-copy.py`
returned PASS on first invocation against `full-page-merged.html`.

## Score consistency check vs cycle-3

Cycle-3 Databrill Core closed at 27/30. Cycle-4 Push-Pull closes at
28/30 (+1, Spacing 4→5 and Typography 4→5; Layout 5→4 reflects the
conservative alternation; Polish steady at 4/5). Different brand,
different design language — the score isn't directly comparable
across brands, but the workflow's ability to deliver high-fidelity
output on a brand with strict copy discipline (must_preserve_copy +
hyphenated wordmark + 15 anti-drift phrases) is now established.

---
