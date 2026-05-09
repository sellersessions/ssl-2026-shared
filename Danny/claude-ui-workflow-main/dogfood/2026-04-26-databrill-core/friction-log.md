---
project: claude-ui-workflow
run: dogfood-cycle-2
brand: databrill-core
started: 2026-04-26
predecessor: dogfood/2026-04-25-retechuk
tags: [design-pipeline, workflow, stitch, brand-ingestion, dark-theme, B2B-SaaS, autonomous-run]
---

# Friction log — Databrill Core (cycle-2)

> Findings continue numbering from cycle-1 (last was #29).

---

## #30 — `refine-from-screenshot.py --skip` flag does nothing

- **Stage:** 3 (screenshot assist) — `scripts/refine-from-screenshot.py`
- **Rank:** 🟠 major
- **Evidence:** Ran with `--skip "colors.primary"` to prevent overriding the
  extracted primary (which was a misread of missing-image placeholder
  boxes). The script printed the override anyway and the final write log
  said `applied 4 override(s)` — including the primary it was told to skip.
  Verified: `tokens.json::colors.primary` ended up at `#686353` (the placeholder
  colour) rather than the original `#f4f2f9` extracted value.
- **Proposed fix:** In `refine-from-screenshot.py::main`, the `--skip` arg is
  parsed (line ~480-ish) but the filter isn't applied to the proposals list
  before write. Add `proposals = [p for p in proposals if p['field'] not in skip_set]`
  before the apply loop. Also dim/strikethrough skipped fields in the print.

---

## #31 — Extractor reads cream hero band as the dominant theme

- **Stage:** 2 (URL ingestion) — `scripts/ingest-url.py`
- **Rank:** 🟠 major (but Stage 3 caught it — workflow is robust)
- **Evidence:** core.databrill.com has a cream/off-white hero band (radial
  gradient ~`#f8f7fc → #f4f2f9`) above-the-fold, with the rest of the page
  on dark `#0c0a14`. Extractor sampled body-level computed bg, returned
  `theme.mode: light` and `colors.background: #f8f7fc`. Stage 3 multi-band
  luminance vote correctly flipped to `dark` (light_share=0.23) — so the
  recovery path works, but the URL-only extraction was decisively wrong.
- **Reasoning:** This is closely related to #14 (multi-sample theme.mode)
  from cycle-1 — that fix sampled the theme correctly *for retechuk*, but
  on a hero-banded site the dominant body bg is no longer a reliable
  proxy. The fix needs another layer: weight the section-band luminances
  by their pixel-area share, not by section count.
- **Proposed fix:** In `extract-brand.mjs`, add an area-weighted luminance
  vote at extraction time (mirror what `refine-from-screenshot.py` does at
  the screenshot level). When the primary band's luminance disagrees with
  the area-weighted majority, return `theme.mode_confidence: low` and
  surface it explicitly in the confidence report.

---

## #32 — Missing-image placeholder boxes contaminate primary colour read

- **Stage:** 3 (screenshot assist) — `scripts/refine-from-screenshot.py`
- **Rank:** 🟠 major
- **Evidence:** core.databrill.com has 4 missing-image placeholder boxes
  in the "Tired of Being a Data Hostage?" grid and 1 in the comparison
  table — they render as pale tan/grey rectangles (~`#686353`). Stage 3
  hero-band button re-rank picked these up as the dominant non-bg colour
  and proposed `primary = #686353`, which is just empty-image fallback,
  not a brand colour.
- **Reasoning:** The refiner's "hero-band button re-rank" assumes the
  most-prevalent saturated/dim colour after bg is brand-meaningful. On a
  partial deploy with broken images, that assumption fails — the
  "dominant" colour is actually the `<img>` placeholder background.
- **Proposed fix:** Add a heuristic that detects rectangular regions of
  uniform pale colour (variance < threshold, w/h ratio in image-card
  range) and excludes them from the colour distribution. OR cross-check
  proposed primaries against the extracted DOM `<img>` count: if many
  images are missing/broken, suppress the screenshot-derived primary and
  flag for manual review.

---

## #34 — Stitch truncates 11-section homepage brief to hero-only, then over-reports in chat

- **Stage:** 7 (Stitch generation) — `mcp__stitch__generate_screen_from_text` with GEMINI_3_1_PRO
- **Rank:** 🔴 blocker for "single-screen homepage" use cases
- **Evidence:** Sent an 8.3KB brief with 11 explicitly-numbered sections (nav, hero, ticker, problem, solution, how-it-works, personas, comparison-table, pricing, closing-CTA, footer). Stitch generated **one screen with 4 sections**: nav, hero, ticker, footer. Sections 4–10 (problem / solution / timeline / personas / comparison / pricing / closing-CTA) were silently dropped. Stitch's text response said: *"You can see the full 11-section layout on the canvas now. How does this direction feel?"* — that claim is false. Counted `<section|<header|<footer|<nav>` in returned HTML: **4**. Searched for all required section headlines: only "How It Works" appears (and it's the secondary CTA *label*, not a section).
- **Reasoning:** Stitch is optimised for app-screen generation, not full marketing-homepage scrolls. When given a multi-section homepage brief, it compresses to a hero-centric single-viewport composition and discards mid-page content. The model also confabulates the response copy to sound complete.
- **Proposed fix:** Workflow change, not a Stitch bug — Stitch is doing what it's good at. **Cycle-2 procedure update:**
  1. Brief assembly (Stage 6) splits a homepage into one screen per section group: e.g. 1 = hero+nav+ticker, 2 = problem+solution, 3 = timeline+personas, 4 = comparison+pricing, 5 = closing+footer
  2. Stage 7 calls `generate_screen_from_text` once per section group, all attached to the same project
  3. Stage 8 stitches the per-section HTML into a single homepage at the local layer, OR uses `edit_screens` with a "extend with the next section group" prompt
  4. Stitch's text-response claims must be ignored — only the HTML is ground truth. Verification gate added to Stage 8.
- **Workaround for this cycle-2 run:** Either (a) call generate_screen_from_text 4 more times with section-group prompts and merge, OR (b) accept the hero+nav+ticker+footer as proof-of-concept for the visual system and ship the brand styling, leaving content sections for cycle-3.

---

## #35 — Stitch Redesign mode blocks "Code to Clipboard" — visual-only output, no semantic HTML

- **Stage:** 7 (Stitch generation) — Redesign mode (Nano Banana Pro) via browser UI
- **Rank:** 🟠 major (changes model-routing rules)
- **Evidence:** Drove Stitch UI via Playwright auth-Chromium (`mcp__playwright__*`), uploaded screenshot of `core.databrill.com` as structural reference, prompted full 9-section redesign in locked dark glassmorphic system. Generation produced screen `7ffb0ee79b154632aab365a24d7b84b2` ("DataBrill Dark Redesign Full Landing Page", 768×1376). Opened More → Export menu — **"Code to Clipboard" radio is `[disabled]`**. Available formats: AI Studio (HTML+image via export), Figma (disabled), Jules, .zip (PNG only per #22), MCP, Project Brief. The preview URL (`stitch.withgoogle.com/preview/{project}?node-id={node}&raw=1`) loads a Google App Companion iframe whose body contains a single `<img>` tag pointing to `lh3.googleusercontent.com/aida/...` — the entire "page" is one rendered image, not HTML.
- **Reasoning:** Nano Banana Pro is an image-generation model, not a HTML-generation model. Redesign mode produces a pixel-perfect visual mockup, not semantic markup. That's why Code-to-Clipboard is disabled in this mode — there is no code.
- **Proposed fix (model-routing rule for STITCH-MODEL-RULES.md):**
  - **Refresh / Edit** → update existing screen
  - **3.1 Pro (text-to-HTML)** → text-faithful semantic HTML — use for any output meant for code merge or production handoff
  - **Redesign (Nano Banana Pro)** → visual concepting / moodboard ONLY — never use when verbatim copy preservation matters
- **Workflow consequence:** the merge pipeline ("Stitch styling + truth-source text → full HTML page") cannot use Redesign mode as the styling source. Either (a) use Redesign output as a *visual brief* that Claude reads + reproduces in HTML locally (option D pattern), or (b) re-run with 3.1 Pro for actual extractable HTML.

---

## #36 — Nano Banana Pro renders text as PIXELS, not characters — verbatim copy preservation fails by design

- **Stage:** 7 (Stitch generation) — Redesign mode
- **Rank:** 🔴 blocker for "use Redesign output for client-facing copy" use cases
- **Evidence:** Audited the 768×1376 high-res asset (`_captures/redesign-output-highres.png`) downloaded directly from Google CDN. Layout, brand system, glassmorphism, gradients, mesh effects — all rendered correctly. **Text is image-pixel approximation, not character-set rendering.** Sample diffs vs the explicit `[VERBATIM]` strings in the prompt:

  | Source truth | Stitch rendered | Severity |
  |---|---|---|
  | "5 different platforms" | "**3** different platforms" | content drift |
  | "Third-party tools charge you monthly fees" | "Third-party **task change** you monthly **fert**" | garbled |
  | "last quarter's numbers" | "last **haster's** numbers" | garbled |
  | "Selling Partner API and Advertising API" | "...and **Awartzing** API" | garbled |
  | "Data lands in YOUR PostgreSQL database" | "Data **labels** in YOUR PostgreSQL database" | content drift |
  | "No vendor lock-in" | "No **version** lock-in" | content drift |
  | "Connect any BI tool instantly" | "...BI tool **industy**" | garbled |
  | "Export to CSV anytime" | "Export to **CSI** anytime" | garbled |
  | "Finance & Operations Teams" | "**FinOps** & Operations Teams" | hallucinated |
  | "Data-Driven Leaders" | "Data **Drrive** Leaders" | garbled |
  | "Aggregators" | "**Aggregaters**" | misspelled |

- **Reasoning:** Nano Banana Pro paints text-shaped glyph clusters that look right at thumbnail scale but garble under inspection. Text is an emergent visual property of the image, not a string. The model has no representation for "verbatim copy" — `[EXACT TEXT]` markers in the prompt are advisory only; the image generator treats them as visual hints. Same class of failure as Stable Diffusion text rendering pre-DALL·E 3.
- **Proposed fix:** Add a hard check to STITCH-MODEL-RULES.md: **if `must_preserve_copy: true` is set in `locks.json`, Stage 7 MUST use 3.1 Pro (text-to-HTML), never Redesign.** Add a Stage 8 audit: `for line in source-truth.json: assert line in rendered_dom_text`. For visual-only / moodboard work where copy is decorative, Redesign is fine.
- **Workflow primitive validated this cycle:** Treat Stitch Redesign output as a **visual design brief** — a moodboard for layout, components, gradients, spacing — and have Claude read the image + reproduce as HTML locally with truth-source text. Output: `dogfood/2026-04-26-databrill-core/full-page-merged.html` + `_captures/merged-full-page.png`. All 9 sections rendered, all copy verbatim, dark glassmorphic system applied throughout. Audit (programmatic): 9 semantic blocks (1 header + 7 sections + 1 footer), 12 glass cards, 5 comparison rows, 4 timeline steps, all H2/H3 strings match `source-truth.json`.

---

## #37 — Comet vs Chrome render delta on core.databrill.com — Comet shows dark hero, Chrome shows cream

- **Stage:** N/A — rendering observation surfaced during cycle-2
- **Rank:** 🟡 minor (orthogonal to workflow; aside-finding for Comet behaviour audit)
- **Evidence:** During the screenshot-attach step, the operator captured `core.databrill.com` in three browsers and posted side-by-side: (1) Comet renders the hero with a dark navy gradient + white "Own Your Amazon Data. Finally." headline, (2) Chrome renders the same URL with a cream/off-white hero band + dark text, (3) Stitch's preview tab shows the Stitch redesign (separate). Playwright auth-Chromium (used for our Stage 7 reference upload) matches the Chrome render — cream hero. So the canonical Chrome render is what Stage 2 ingests, what Stage 7 uploads to Stitch, and what users see in Chrome/Safari/Firefox. Comet is the outlier.
- **Reasoning (hypotheses, unverified):**
  1. Comet's AI assistant layer is restyling the page at render time (Comet is built on Chromium but bundles AI features that can transform pages)
  2. A Comet-specific extension/setting is injecting CSS overrides
  3. Comet's cache holds an older deploy of `core.databrill.com` that used the dark theme, while Chrome/Playwright fetched the current cream-deploy
  4. Comet uses a different user-agent fingerprint that triggers a feature flag in the site's CSS layer
- **Proposed fix:** Out of scope for cycle-2. File for separate Comet behaviour audit — useful test case: load any of the operator's deployed sites in Comet vs Chrome and diff rendered DOM + computed styles. If hypothesis 1 is correct (Comet AI restyling), this affects every "the operator views in Comet → Claude views in Playwright" handoff, because the operator and Claude are seeing different pages.

---

## #33 — `_template/` interactive prompt halts a `--no-prompt` run

- **Stage:** 3 (screenshot assist) — `scripts/refine-from-screenshot.py`
- **Rank:** 🟡 minor
- **Evidence:** Even with `--auto-medium --skip ...` flags, the script
  fell through to an `input()` call and crashed with `EOFError` when run
  non-interactively. Had to pipe `echo "y" |` to proceed.
- **Proposed fix:** When ANY of `--apply`/`--skip`/`--auto-medium`/`--no-prompt`
  is set, default the confirm to `y`. OR add `--yes`/`-y` flag. Currently
  every autonomous workflow needs to pipe stdin.

---
