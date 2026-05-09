---
project: claude-ui-workflow
cycle: 3
brand: databrill-core
stage: 9 (cycle retro)
date: 2026-04-27
predecessor: cycle-2 (last finding #37)
parallel_run: re-tech-uk cycle-3 (same date)
---

# Cycle-3 retro — Databrill Core

> Cycle-3 introduced two new primitives: a **Stage 7 model gate**
> (`locks.json::must_preserve_copy === true` → auto-route to Stitch 3.1
> Pro instead of Redesign / Nano Banana Pro) and a **Stage 8 hard-fail
> copy audit** (every locked string in `source-truth.json` must appear
> verbatim in the rendered DOM, byte-for-byte). This is the first cycle
> those primitives ran end-to-end.

## What worked

- **Model gate (Stage 7) routed correctly.** The visual-brief merge
  primitive proved out in cycle-2 (#36) — cycle-3 codified it: when
  `must_preserve_copy: true` is set, Stitch Redesign output is treated
  strictly as a visual moodboard and the actual HTML is built locally
  from `source-truth.json` against a 3.1 Pro reference. Zero drifted
  copy strings made it into the cycle-3 deliverable from the model
  side.
- **Hard-fail copy audit caught a real defect.** 4/88 locked strings
  failed the verbatim DOM check on first audit pass (the four
  problem-grid card titles: "Access", "Cost", "Time", "Build"). The
  body copy was present, but the card *headings* had been silently
  dropped during the visual-brief → HTML reproduction. This was
  invisible at thumbnail / Stage-7 review and would have shipped
  without the audit.
- **Palette discipline held.** The canonical Databrill dark palette
  (`#0c0a14`, `#100e1a`, `#e07a3a`, `#7c6bbd`, `#f5f5fa`) is all
  present. Auxiliary tones (`#a394d6`, `#f09050`, `#ff4d00`, `#ffb380`)
  are mathematical tints/shades of the canonical accents used inside
  gradients — no off-brand colours leaked in.
- **Glassmorphic system reproduced cleanly.** `--glass-bg` /
  `--glass-border` / `backdrop-filter` triplet is consistent across the
  problem grid, solution columns, persona row, and comparison table.
  No per-section drift.
- **Verbatim-render contract.** Every body string from
  `source-truth.json` (89 nodes scanned, 88 verbatim copy strings
  after excluding structural metadata) renders byte-identical in the
  DOM after the Stage-8 fix.

## What broke

- **Card titles silently dropped during visual-brief → HTML
  reproduction.** The four problem-grid cards in `full-page-merged.html`
  shipped with body paragraphs only — the locked card titles
  ("Access" / "Cost" / "Time" / "Build") never made it into the DOM.
  Caught only by the Stage-8 hard-fail audit. This is the exact failure
  mode the audit primitive was built for.
- **`source-truth.json` mixes structural metadata with copy strings.**
  Fields like `id`, `layout`, `icon_role`, `cta_style`, and (debatably)
  `eyebrow: null` are walked alongside user-visible copy. The naive
  audit flagged `cta_style: "ghost-pill"` as a "missing string" because
  it never lands in the DOM (it's a layout instruction, not copy). The
  audit needs an explicit `STRUCT_FIELDS` exclusion list — currently
  hardcoded inline.
- **`locks.json` has no `anti_drift_rules` field.** The Stage-8 spec
  references it but the file only defines `locked_primitives`. The
  audit fell back to a palette-drift check against `locked_primitives`
  hex values, which works but is implicit. The schema needs to be
  extended.
- **Pricing & trust-ticker still absent.** `_brief_only_sections_omitted`
  in `source-truth.json` documents the decision to skip these (no live
  truth source on `core.databrill.com`), but the page reads as
  marketing-incomplete to a viewer who expects pricing on a B2B SaaS
  homepage. This is a content-strategy decision, not a bug — flagging
  for a the operator call in cycle-4.

## Findings

> Continuing the cycle-2 sequence which ended at #37. The parallel
> Re Tech UK agent is also starting at #38 — merge will be handled in
> the cycle-3 close-out commit.

### #38 — Stage 8 hard-fail audit catches dropped copy that visual review misses

- **Stage:** 8 (REFINE / hard-fail copy audit)
- **Rank:** 🟢 primitive validated (was #36 proposed-fix, now proven)
- **Evidence:** `full-page-merged.html` shipped Stage 7 with 4/88
  locked strings missing verbatim ("Access", "Cost", "Time", "Build" —
  the problem-grid card titles). All four bodies were present; only
  the headings were dropped. Visual-only review at Stage 7 saw four
  filled glass cards and called it good. The programmatic audit
  (every `sections[*]` leaf string in `source-truth.json` checked
  against `htmllib.unescape(html)`) flagged the four misses in <1 second.
  Fix applied: added `<h3>` headings inside each card with the
  canonical `text-base tracking-wider uppercase` brand styling, accent
  orange. Re-run: 0/88 missing.
- **Reasoning:** Visual review measures presence; copy audit measures
  *verbatim* presence. They're orthogonal checks. The visual-brief
  merge primitive (cycle-2 #36) is excellent for layout fidelity but
  has no native guard against silent copy drops during DOM
  reproduction.
- **Recommendation:** Promote the Stage-8 hard-fail audit to a
  blocking gate in `PRE-CHECK-CHECKLISTS.md`. Stage 9 retro is not
  permitted to start until Stage 8 returns 0 missing.

### #39 — `source-truth.json` schema mixes copy with structural metadata; audit needs explicit field-type tagging

- **Stage:** 8 (audit script)
- **Rank:** 🟠 major (correctness of audit results)
- **Evidence:** Naive walk over `sections[*]` produces 89 leaf
  strings, but at least 4 of them are not user-visible copy:
  `id`, `layout`, `icon_role`, `cta_style`. First audit run flagged
  `"ghost-pill"` (`nav.cta_style`) as a missing string — a false
  positive. Manual exclusion list (`STRUCT_FIELDS = (".id", ".layout",
  ".icon_role", ".cta_style", ".eyebrow")`) had to be added inline.
- **Reasoning:** The truth-source schema needs either (a) a separate
  `_copy` block per section that only contains user-visible strings,
  or (b) field-type annotations (`{"value": "...", "kind": "copy" |
  "structural"}`). Without that, every audit script will reinvent the
  exclusion list and they'll drift.
- **Recommendation cycle-4:** Standardise `source-truth.json` schema.
  Either separate `copy` from `meta`, or use a per-field `kind` tag.
  Rebuild the audit script against the new schema and ship it as
  `scripts/audit-locked-copy.py`.

### #40 — `locks.json` is missing the `anti_drift_rules` field referenced by Stage-8 spec

- **Stage:** 5 / 8 (lock primitive ↔ audit)
- **Rank:** 🟠 major (silent contract gap)
- **Evidence:** Stage-8 audit instructions reference
  `locks.json::anti_drift_rules` for forbidden-string checks. Current
  `locks.json` contains only `locked_primitives` (palette + fonts +
  Stitch design-system inputs). No anti-drift block. The audit fell
  back to palette-drift inference against `locked_primitives` hex
  values — which worked, but it's implicit and fragile.
- **Reasoning:** Cycle-2 surfaced specific anti-drift cases (e.g. the
  hallucinated "FinOps & Operations Teams" replacing "Finance &
  Operations Teams" in #36). Those would be exactly what
  `anti_drift_rules` should encode — yet the schema offers nowhere to
  put them.
- **Recommendation cycle-4:** Extend the `/lock` skill to write an
  `anti_drift_rules` array — strings that MUST NOT appear in the
  rendered DOM. Wire the Stage-8 audit to fail if any of them are
  found. Default population could include common Stitch hallucinations
  (FinOps, version lock-in, Aggregaters, etc.) per cycle-2 #36.

## Decisions for cycle-4

1. **Promote Stage-8 hard-fail audit to a blocking gate.** Add to
   `PRE-CHECK-CHECKLISTS.md` Stage 8 section: "Stage 9 cannot start
   until copy audit returns 0 missing AND 0 anti-drift hits."
2. **Standardise `source-truth.json` schema** with explicit copy vs
   structural-metadata separation. Update the `/intake` skill and the
   audit script in lockstep.
3. **Extend `locks.json` to include `anti_drift_rules`.** Update the
   `/lock` skill, the Stage-6 brief assembler, and the Stage-8 audit
   script to read it.
4. **Ship `scripts/audit-locked-copy.py`** as a permanent project
   tool. Currently the audit is an inline Python heredoc — fine for
   one-shot, fragile for repeat runs.
5. **Pricing / trust-ticker decision call** with the operator before cycle-4
   shipping work — either bring back from brief with explicit truth
   sourcing, or formally archive the sections.

## Score (REFINE 6-dim, 0-5 each)

| Dimension | Score | Notes |
|---|---|---|
| Color | 5/5 | Canonical palette intact, gradient tints derived correctly, no off-brand colours, accent2 (purple) used for solution-row OWN tile creating real chromatic contrast (vs cycle-2 #34 finding "zero purple") |
| Typography | 4/5 | Inter / DM Sans / Space Grotesk all wired correctly. Hero clamp (2.5–5rem) good. H2 clamp (2–3rem) consistent across 5 section heads. Minor: comparison-table `compare-th` letter-spacing 0.08em vs eyebrow-chip 0.1em — small inconsistency, not a defect |
| Spacing | 4/5 | Section padding rhythm 6rem/8rem hero / 5rem CTA band — good vertical rhythm. Glass card padding (p-7) consistent. Minor: persona row uses p-6 (smaller) while problem/solution use p-7 — intentional density choice but worth flagging |
| Layout | 5/5 | 1280px container-x consistent. 2×2 problem grid → 3-col solution → vertical timeline → 4-col persona row → table → full-bleed CTA → 4-col footer. Composition reads top-to-bottom with clear pacing |
| Content | 5/5 | All 88 locked copy strings verbatim post-fix. "Own Your Amazon Data" positioning carries through hero → closing CTA. Voice consistent (direct, technical, anti-vendor-lock-in). Brand voice ("YOUR data" emphasis) preserved |
| Polish | 4/5 | Hover transitions on `.cta-primary` / `.cta-ghost` / `.nav-link` defined. Mesh gradients in hero. Glow on step-num and CTAs. Minor: no focus-visible ring defined for keyboard navigation, no `:focus` style on nav-link — accessibility polish gap |

**Total: 27/30**

**Hard-fail copy audit: PASS** (88/88 locked strings verbatim
present in DOM after 1 fix applied).

## Files edited during Stage 8

- `dogfood/2026-04-26-databrill-core/full-page-merged.html` — added
  `<h3>` card titles ("Access", "Cost", "Time", "Build") to the four
  problem-grid glass cards. 4 lines added × 4 cards = 16 LOC delta.

## Score consistency check vs cycle-2

Cycle-2 closed without a 6-dim REFINE score (the model-gate primitive
hadn't shipped yet). Cycle-3 establishes the baseline at 27/30 for
Databrill Core — future cycles should track delta against this.

---
