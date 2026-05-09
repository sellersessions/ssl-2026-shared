---
project: claude-ui-workflow
cycle: 3
brand: retechuk
url: https://retechuk.com/
output_type: landing
landing_archetype: brand-homepage
stage_run: 8 (REFINE) → 9 (retro) → 10 (reset gate)
date: 2026-04-27
---

# Cycle-3 Retro — Re Tech UK

## What worked

- **Stage 7 model gate did its job.** `locks.json::must_preserve_copy = true` routed generation to Stitch 3.1 Pro (not Refresh, not 3 Flash). The resulting `full-page-merged.html` shipped with every locked string already verbatim — Stage 8 had zero copy fixes to apply. That's the first cycle where copy fidelity was a property of the pipeline, not a property of post-hoc patching.
- **Hard-fail copy audit is fast and decisive.** Grepping each `source-truth.json` and `locks.json::anti_drift_rules` string against the rendered HTML took <1 minute and produced an unambiguous PASS/FAIL signal. No interpretation, no judgement calls. This is the first audit primitive in the workflow that is mechanically checkable, not vibes-based.
- **Anti-drift rules held.** Every cycle-1 hallucination listed in `anti_drift_rules` (Effortlessly Layered, KNITS/POLOS/CARDIGANS/TEES, Curated Collections, OUR WORLD, Sustainability, Ribbed knit dress, Relaxed-fit Polo, Knitted Cardigan, Soft basic Tee) was absent from cycle-3 output. The blocklist works.
- **Wordmark contract held.** `RE TECH UK` appears uppercase at all three wordmark positions (nav, drawer, footer). Body-copy mentions of the brand name use title case `Re Tech UK` per `source-truth.brand.name`. Casing rule split (wordmark vs prose) is correctly observed.
- **Refresh→Pro chain (cycle-1 finding #24) carried into cycle-3.** Visual fidelity of the rendered page (paper grain, petal blurs, organic underlines, editorial serif headings, aubergine primary palette) survived the model gate, so we got both copy fidelity AND aesthetic continuity in one deliverable.

## What broke

- **Nothing hard-fail-grade broke.** Zero locked strings missing, zero anti-drift strings present. This is the cleanest Stage 8 of the three cycles.
- **Soft drift (non-fail) observed:**
  - **Hero subhead extends locked story copy** — line 191 reads `Re Tech UK represents and inspires those who work with no boundaries. Quality knitwear, polo necks, cardigans and comfortable essentials — sizes 8 to 26.` The locked phrase is verbatim present, but Stitch appended its own continuation. Not a hard-fail (locked content is intact and unchanged) but it's content the source-truth didn't explicitly authorise.
  - **Lookbook caption invented** — line 324 `Quality knitwear, polo necks, and cardigans — for women who work with no boundaries.` Echoes the brand story but is not in `source-truth.json`. Same shape as above: harmless paraphrase, but technically copy invention.
  - **`text-outline` (#847375) on `surface` (#fbf9f4) for product prices** (lines 282/291/300/309) — contrast ratio ~3.3:1, fails WCAG AA 4.5:1 for body text. Not a hard-fail under current locks (locks.json doesn't enforce contrast) but a real accessibility miss.
  - **CTA `See more` rendered as `SEE MORE`** — source-truth `ctas.primary` is `"See more"` (sentence case). DOM is uppercase via label-caps style. Visually consistent with the rest of the design system, but a strict `verbatim` reading would flag this. Cycle-3 hard-fail rule treated `ctas` as styling-flexible rather than verbatim-locked because it's not in `locks.json::*_verbatim`.

## REFINE 6-dimension scores

| # | Dimension | Score (/5) | Notes |
|---|---|---|---|
| 1 | Color | 4 | Aubergine primary (#481925) + warm cream surface + pastel petal accents — coherent and on-brief. Half-mark off for `text-outline` price contrast fail. |
| 2 | Typography | 5 | Noto Serif display + Manrope body, label-caps with letter-spacing, hierarchical scale (display-hero 64px → label-caps 12px). Editorial-feminine read locked. |
| 3 | Spacing | 4 | `section-gap` 120px + `gutter` 24px tokens applied consistently. Newsletter and rewards sections breathe. Half-mark off for variable vertical rhythm in trust strip vs new arrivals. |
| 4 | Layout | 5 | 12-col hero grid, asymmetric collection cards (`md:mt-12` offset on alternating tiles), full-bleed lookbook, two-column rewards/refer block — composition reads as editorial brand site, not template. |
| 5 | Content | 5 | Every locked string verbatim. Trust strip carries the Trustpilot phrase. Story copy intact. Footer legal block complete. |
| 6 | Polish | 4 | Hover states on collection cards (`group-hover:scale-105`), CTA colour transitions, off-canvas drawer with backdrop blur, organic-underline decorative element, petal-blur radial gradients. Half-mark off for missing focus-visible rings on nav links and form inputs. |

**Total: 27 / 30**

## Hard-fail audit

- **Locked strings checked:** 24 (wordmark, tagline, story body, value-prop, 4 product names, 9 nav items, 5 footer-legal, trust phrase, newsletter headline + body, 2 social URLs)
- **Anti-drift strings checked:** 10 (Effortlessly Layered, JOURNAL, KNITS/POLOS, Ribbed knit dress, Relaxed-fit Polo, Knitted Cardigan, Soft basic Tee, Curated Collections, OUR WORLD, Sustainability)
- **Result:** **PASS** — all locked present, all anti-drift absent
- **Fixes applied during Stage 8:** 0
- **Files edited:** none

## Findings (continuing from #37)

### #38 — `must_preserve_copy` model gate is the highest-leverage primitive in the workflow

- **Stage:** 7 (Stitch generation) → 8 (audit)
- **Rank:** 🟢 positive (codify rule)
- **Evidence:** Cycle-3 is the first run where Stage 8 had zero copy fixes to apply. The single-bit lock `must_preserve_copy: true` in `locks.json` deterministically routed to 3.1 Pro and yielded a content-faithful HTML on first generation. Cycles 1-2 spent the bulk of Stage 8 effort on copy patches; cycle-3 spent it on audit-and-confirm.
- **Proposed rule (codify in `STITCH-MODEL-RULES.md`):**
  ```
  locks.json::must_preserve_copy = true → ALWAYS route to 3.1 Pro
                                          (never Refresh, never Flash)
  Default behaviour: if any *_verbatim key exists in locks.json, treat
                     must_preserve_copy as implicitly true.
  ```

### #39 — Hard-fail copy audit should be a single grep script, not a manual pass

- **Stage:** 8 (REFINE)
- **Rank:** 🟠 major
- **Evidence:** Cycle-3 Stage 8 hard-fail audit ran as a one-shot bash loop iterating every `*_verbatim` value in `locks.json` and every entry in `anti_drift_rules`. It took ~30 seconds and was unambiguous. Currently this is reconstructed by hand each cycle. Should be a script.
- **Proposed fix:** Add `Claude-UI-Workflow/scripts/audit-copy.py` (or `.sh`) that takes `<brand-slug>` and `<html-path>`, reads `locks.json` + `source-truth.json`, runs the grep loop, and exits non-zero if any locked string is missing OR any anti-drift string is present. Wire into Stage 8 pre-checks.

### #40 — Soft drift in non-locked copy (paraphrase / extension) is unflagged

- **Stage:** 7 (generation) → 8 (audit)
- **Rank:** 🟡 minor
- **Evidence:** Re Tech UK cycle-3 HTML contains two pieces of invented copy that are not in `source-truth.json`: hero subhead extension (`Quality knitwear, polo necks, cardigans and comfortable essentials — sizes 8 to 26.`) and lookbook caption (`Quality knitwear, polo necks, and cardigans — for women who work with no boundaries.`). Neither violates a hard lock — the locked phrase is intact and the anti-drift list isn't triggered — but they're new strings the workflow didn't authorise.
- **Proposed fix:** Optional cycle-4 primitive: `locks.json::strict_copy_only = true` flag that runs an inverse audit — every visible text node in the rendered HTML must map to a string in `source-truth.json` (after stripping decorative joiners like `·` and `—`). Off by default (too strict for most brands), on for legal/regulated copy. Until then, log soft-drift findings to the friction log without failing the audit.

### #41 — Contrast checks are missing from the hard-fail set

- **Stage:** 8 (REFINE) — Color dimension
- **Rank:** 🟠 major
- **Evidence:** Cycle-3 product price tiles use `text-outline` (#847375) on `surface` (#fbf9f4) for the "From £28" prices. Contrast ratio ~3.3:1 against an effective 4.5:1 WCAG AA threshold for body text. The hard-fail audit doesn't surface this because `locks.json` only contracts copy, not contrast.
- **Proposed fix:** Cycle-4 primitive: contrast hard-fail audit. Parse the rendered DOM for every text+bg colour pair, compute WCAG ratio, fail if any body-text pair < 4.5:1 (or large-text pair < 3:1). Implementation: Playwright `page.evaluate` getComputedStyle pass + WCAG contrast formula. Reuses the auth-persisted Chromium from `infra_playwright_chromium_auth.md`.

### #42 — `ctas.primary` source-truth field is ambiguous (sentence case vs label-caps style)

- **Stage:** 1 (intake) → 8 (audit)
- **Rank:** 🟡 minor
- **Evidence:** `source-truth.json::ctas.primary = "See more"`. DOM renders `SEE MORE` (label-caps Tailwind style). The hard-fail audit grepped for `See more` and got zero matches, but `SEE MORE` is the design-system-correct rendering of a label-caps CTA. Cycle-3 manually overrode the verbatim rule for CTAs because they're not in `locks.json::*_verbatim`. Future cycles need a clearer convention.
- **Proposed fix:** Convention: `source-truth.json::ctas` values are stored in **canonical case** (e.g. `See more`). The audit treats them as case-insensitive when matched against text inside elements with `.uppercase` / `.label-caps` / `text-transform: uppercase` styling. For CTAs that must hold their exact case (e.g. `iPhone`), add them to `locks.json::*_verbatim` explicitly.

### #43 — Repeat-count expectations would catch missing-section drift earlier

- **Stage:** 8 (REFINE) — copy audit
- **Rank:** 🟠 major
- **Evidence:** Cycle-3 audit found `Long Sleeve Maxi Cardigan` 5 times (nav drawer, shop panel, collections card, new arrivals product, footer shop list). That's correct — but if Stitch had dropped the footer shop column entirely, the count would drop to 4 and the current audit (which only checks `>= 1`) would still pass. Same risk for `Ribbed Cotton Polo Neck Tops` (4×) and `Kids Clothing` (4×).
- **Proposed fix:** `locks.json::repeat_counts` block — optional dictionary of `{string: minimum_count}`. The hard-fail audit fails if any string is below its minimum count, not just when it's absent. E.g. `{ "Long Sleeve Maxi Cardigan": 4 }` would catch any cycle where Stitch silently drops a section that should reference it.

## Top 3 cycle-3 findings (selected for cycle-4 hardening)

1. **#38** — codify the `must_preserve_copy` → 3.1 Pro routing rule in `STITCH-MODEL-RULES.md` (this is the single highest-leverage finding of cycle-3 — it's the reason Stage 8 was clean)
2. **#39** — ship `scripts/audit-copy.py` so Stage 8 hard-fail audit runs in one command
3. **#41** — extend the hard-fail audit to include WCAG AA contrast (Playwright + computed styles)

## Decisions for cycle-4

- **Land #38 as a documented rule** in `STITCH-MODEL-RULES.md` — model gate routing is now a first-class primitive, not a behavioural quirk.
- **Build the audit script (#39)** — manual grep loops don't scale to multi-brand cycles. One-shot script + non-zero exit code is the right shape.
- **Add contrast audit (#41)** — copy audit alone misses real accessibility regressions. Cycle-4 hard-fail set = copy + contrast.
- **Defer #40 (strict_copy_only) and #43 (repeat_counts)** — useful but not blocking. Layer in cycle-5 if cycle-4's contrast work surfaces a need.
- **Continue deferring cycle-1 #27/#28/#29** — Re Tech UK was the Shopify trigger brand for #27, but cycle-3 didn't re-run extraction (started from existing source-truth.json), so the fix isn't validated this cycle either. Stamp them for cycle-4 if a fresh Shopify ingest happens.

## Score

- **REFINE 6-dim total: 27 / 30**
- **Hard-fail audit: PASS** (24 locked strings present, 10 anti-drift strings absent, 0 fixes applied)
- **Cycle-3 verdict: cleanest cycle to date** — the model gate (`must_preserve_copy`) and the verbatim audit (Stage 8 hard-fail) together produced a content-faithful, brand-coherent landing page on first generation, with zero post-hoc patching required.
