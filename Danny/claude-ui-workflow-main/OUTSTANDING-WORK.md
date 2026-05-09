---
project: claude-ui-workflow
last_updated: 2026-04-25
---

# Outstanding Work — Claude UI Workflow

Single tracker for everything that's built-but-unvalidated or planned-but-deferred.
This file is the anti-forgetting layer: if it's here, it won't fall through the cracks
when context compacts. Update as items close.

## Summary (27 Apr 2026)

| | |
|---|---|
| **Total findings to date** | ~40 (29 cycle-1, 8 cycle-2, 3 cycle-3, cycle-4 retro pending) |
| **Resolved + shipped** | cycle-1 v2 architecture rewrite, cycle-2 fix wave + visual-brief merge primitive, cycle-3 Stage-8 hard-fail audit (`audit-copy.py`) |
| **In-flight (cycle-4)** | Stage 9 retro, Stage 10 lock, Push-Pull Netlify deploy |
| **Queued (cycle-5)** | `source-truth.json` schema v2 (cycle-3 #39); `/lock` skill emit `anti_drift_strings` (cycle-3 #40); Stage 7 pre-flight gate auto-routes by `locks.json::must_preserve_copy`; retrofit Re Tech UK + Databrill `locks.json` to schema v2; cycle-2 fix-wave residue (#30 / #31 / #32 / #33) |

---

> **⚠ Direction reset (25 Apr 2026).** Read [`PRD.md`](PRD.md) first. The new
> end-state retires the tldraw moodboard and reverts DESIGN to Stitch (Claude
> Design = reference IP). The build queue below has been re-shaped to match.
> Triage rationale lives in `<your local plans dir>/claude-i-fed-some-fuzzy-quilt.md`.

> **Timing reset (25 Apr 2026, later same day).** The post-SSL gate is removed.
> This repo will be given away as part of the AI-Workshop curriculum, so the
> bar is **curriculum-grade** and the work is **active now**. Build queue
> below is no longer "deferred" — it's the active sequence.

---

## Pre-SSL Wave 1 — stabilisation (25 Apr 2026)

- [x] **PRD.md** — verbatim from the operator's end-in-mind notes. Becomes top-of-stack control doc.
- [x] **MASTER-LOG pivot entry** — 25 Apr block reframes kickoff around the new direction.
- [x] **RUNBOOK.md** — single-page operational doc against the end-state.
- [x] **brands/INVENTORY.md** — brand-by-brand status table.
- [x] **README banner** — points at PRD.md, names the pivot.
- [x] **DESIGN-PIPELINE-VISUAL banner** — marks doc as architectural reference, not live shape.
- [x] **OUTSTANDING-WORK refresh** (this edit).
- [x] **`_archive/ARCHIVE-MANIFEST.md` draft** — Explore-agent walk, no moves, awaits the operator approval.
- [x] **Archive sweep executed** (25 Apr session 2) — Claude Design removed (Q1), inspiration extract archived (Q2), Stitch demos promoted to `examples/stitch/` (Q3), section docs kept for later review (Q4). See manifest for full record.

---

## Completed (12 Apr 2026)

- ~~P0 #1: Persistence fix validated~~ — shapes survive hard refresh. 2 shapes on disk after CLI fire + reload.
- ~~P0 #2: Multi-tab duplicate delivery fixed~~ — `beforeunload` SSE cleanup + server-side dead subscriber pruning. `delivered=1` confirmed.
- ~~P1 #3: `tools/moodboard/README.md`~~ — 4MAT structure, install/run/CLI/API/troubleshooting.
- ~~P1 #4: `design-system-sections/07b-tldraw-moodboard-integration.md`~~ — why Stitch failed, what got built, architecture, scope boundaries, key decisions.
- ~~P1 #5: SKILL.md pipeline diagram updated~~ — 8-phase pipeline in ASCII, `/moodboard` trigger already wired from 11 Apr.
- ~~P1 #6: MEMORY.md cross-references~~ — Claude UI Workflow entry updated with 12 Apr progress.
- ~~P2 T2: profile.md / design.md split~~ — NO SPLIT. `profile.md` is single source of truth. `design.md` generated on-the-fly when needed.
- ~~P2 T3: Impeccable + Brand Guidelines~~ — ADOPT BOTH post-SSL. Complementary stack (negative + positive constraints).
- ~~P2 T4: Motion Recipe format~~ — HYBRID (CSV index + §05 detail). Create `motion.csv` post-SSL.
- ~~.gitignore Databrill/ overmatch~~ — narrowed to `/Databrill/` so `brands/databrill/` is trackable.

---

## Claude Design integration (DEPRIORITISED 25 Apr 2026)

> **Status:** Reference IP only after the 25 Apr pivot. Stitch reclaims the
> primary DESIGN surface. The bundle handoff pattern stays useful for the
> brand-ingestion screenshot mode (post-SSL), so the work is not wasted.
> Active items below are **kept** but no longer block any pre-SSL deliverable.

Full spec: `reference/claude-design-integration.md`.

### Pre-SSL discovery (low-cost, non-blocking) — now optional

- [ ] Create one design system in Claude Design pointed at
  `sellersessions/sellersessions-design-system` (GitHub link mode). Record what
  tokens it picks up vs our `brands/sellersessions/profile.md`. Diff captured in
  `_captures/claude-design-review/ds-token-diff.md`.
- [ ] Trigger one **Handoff to Claude Code** against an SSLive2026 screenshot,
  confirm the signed `/v1/design/h/<hash>` URL responds and returns a parseable
  bundle. Document the bundle format in
  `reference/claude-design-handoff-bundle.md` (new file post-test).
- [ ] Add a `claude_design_system_id:` field to each brand's `profile.md` once
  the DS is created in the app.

### Live recreation demo (deprioritised 25 Apr — finish-if-mid-flight only)

- [ ] **Test A — SSL 2026 recreation.** Project exists at
  `/design/p/3abf310e-0d26-409c-8de6-c63b5eea0496`. Screenshot + 1,830-char
  prompt already sent; first 4 generation attempts failed on train wifi. Resume
  by clicking Retry on that project with steady signal. Capture canvas output
  + Handoff-to-Claude-Code bundle. Files: `_captures/claude-design-review/test-a-ssl2026/` (20+ screenshots of the attempt).
- [ ] **Test B — Databrill waitlist rebuild.** Reference staged at
  `_captures/claude-design-review/test-b-databrill/databrill-waitlist-reference.png`.
  Brand tokens ready in `brands/databrill/profile.md` (dark Stitch variant).
  Re-run the same flow: create project → `comet-upload.js` to upload screenshot
  → paste prompt with Databrill dark tokens → send → capture output + handoff.
- [ ] **Side-by-side visual summary** — once both tests land a canvas output,
  produce single image comparing: (SS reference ↔ CD SS output ↔ handoff URL)
  | (Databrill reference ↔ CD Databrill output ↔ handoff URL). the operator makes
  the emotional/aesthetic read from there.
- [ ] **Fold `click-visible` into `inspect-comet.js`** — the two-Send-button
  gotcha (one disabled + hidden, one enabled + visible) will recur. New verb:
  `click-visible <text>` that enumerates, filters for `!disabled && offsetParent`,
  clicks the first match.
- [ ] **Find the SSL 2027 HTML demo** — the operator says it exists, but 4 searches
  couldn't locate it (filename glob, HTML content grep, JSONL transcript scan,
  Downloads/Desktop). Possible: iCloud, Mac Studio, a different Netlify project,
  or a one-off gist. Resolve next session by asking the operator directly for the URL.

### Post-SSL adoption (REVISED 25 Apr 2026)

> Original "Claude Design as default DESIGN surface" path is reversed by the
> 25 Apr pivot. Stitch is primary; Claude Design = reference IP. Items kept
> only where they still serve the new end-state (e.g. bundle handoff pattern
> as input to brand-ingestion screenshot mode).

- [ ] **Brand-ingestion screenshot mode** — reuse the Claude Design bundle
  pattern (signed URL → tarball → README contract) but apply it to the
  user's own brand inputs, not Claude Design's output.
- [ ] **README hero diagram refresh** — replace 8-phase legacy diagram with
  the end-state shape (intake → ingestion → DECIDE → Stitch → REFINE).
- [ ] ~~Promote Claude Design to default DESIGN surface~~ — **reversed.**
- [ ] ~~SKILL.md Workflow A rewrite for Claude Design sub-flow~~ — **reversed.**
- [ ] `scripts/fetch-claude-design-bundle.ts` — kept as low-priority utility
  (CDP infrastructure is reusable), no longer blocking.
- [ ] ~~Brand mirror decision (markdown vs Claude Design DS as mirror)~~ —
  **resolved:** markdown primary, no Claude Design mirror.
- [ ] Inspiration A/B (TikTok via ExtractFlow vs Claude Design capture) —
  **moot.** Inspiration capture demoted; brand ingestion is the primary
  input surface.

---

## Post-SSL Wave 2 — core builds from the PRD pivot (after 9 May 2026)

Sequenced so each milestone produces a usable improvement, not just internal
plumbing. Each is independently mergeable. Stop at any step. Full rationale:
`<your local plans dir>/claude-i-fed-some-fuzzy-quilt.md`.

- [x] **B1. Archive sweep** — executed 25 Apr session 2. Tree dropped ~26 → ~17 root entries. See `_archive/ARCHIVE-MANIFEST.md`.
- [x] **B2. `tokens.json` schema + emit** — schema at `brands/TOKENS-SCHEMA.md`, emitter at `scripts/emit-tokens.py`. Generated tokens.json for all 5 brands (sellersessions: 10 colours + 4 typography keys, databrill: 13 colours, databrill-core: 9 colours + 5 typography). 25 Apr session 2.
- [x] **B3. Brand ingestion (URL mode)** — `scripts/extract-brand.mjs` (Playwright regional sampler) + `scripts/ingest-url.py` (orchestrator) + `scripts/compare-tokens.py` (validator). Hits 80% on sellersessions canonical (passes bar). Snoozeshade light-theme case correctly maps brand wash `#d5f1ed` to primary, `#fc6815` to CTA. 25 Apr session 2.
- [x] **B4. Brand ingestion (screenshot assist)** — `scripts/refine-from-screenshot.py` (Pillow regional sampler), `ingest-url.py` surfaces screenshot prompt on low/medium confidence, `requirements.txt` + `.venv` setup, README updated. Light + dark fixtures validated; SS canonical hexes that URL ingestion couldn't reach (`#fbbf24` gold, `#9ca3af` tertiary) are correctly proposed by the screenshot pass. 25 Apr session 3.
- [x] **B5. Brand ingestion (doc mode)** — `scripts/ingest-doc.py`. Strict pass (canonical-shape docs, lossless) + fuzzy fallback (hex+role-keyword scan, font keyword scan). 100% match re-deriving sellersessions from its own profile.md; full extraction on free-form Acme fixture. Markdown / plain-text only. 25 Apr session 3.
- [x] **B6. `/intake` skill** — `.claude/skills/intake/SKILL.md` (guided 6-question interview + free-text bypass). Schema at `brands/INTAKE-SCHEMA.md`. Demo record at `brands/sellersessions-derived/intake.json`. `/design` wired to read it via `claude-ui-workflow/SKILL.md`. 25 Apr session 4.
- [x] **B7. Lock primitive** — `Claude-UI-Workflow/.claude/skills/lock/SKILL.md` (project-local, ships with curriculum). Schema at `brands/LOCKS-SCHEMA.md` — structured locks with `enforce: html | prompt` discriminator. `/design` reads locks and embeds them in the Stitch prompt as "LOCKED — do not change" guidance (best-effort). `/refine` applies `enforce: html` locks to the user-exported Stitch HTML, snapping drifted fonts/colours back to canonical values (authoritative cleanup). Demo record at `brands/sellersessions-derived/locks.json` (4 locks: heading font, CTA hex, vibe adjectives, output type). 25 Apr session 5.
- [x] **B8. Reference-image reliability harness** — `scripts/ref-image-check.py`. `enforce: "asset"` joins the locks schema as a third discriminator. Per-slot HTML filename scan + perceptual-hash fallback against the export's image bundle. Output: `brands/<slug>/ref-image-report.md` (schema at `brands/REF-IMAGE-REPORT-SCHEMA.md`) + §8 summary for `/refine`. Three-fixture validation (PASS / PASS-VARIANT / FAIL) green; ZIP exports + exit-on-FAIL also green. Synthetic curriculum fixture at `brands/sellersessions-derived/_assets/ssl-stage-2025.png` so the demo runs out of the box. 25 Apr session 6.
- [ ] **B9. Auto-REFINE** — **IN PROGRESS (cycle-1 dogfood, 25 Apr session 7).** Direction shift mid-session: instead of building B9 in the abstract, run all 10 pipeline stages end-to-end on a fresh brand (Re Tech UK), log every failure, batch-fix in cycle-2, validate on a different brand in cycle-3. Stage 1 partial (5/6 questions). 12 findings logged at `dogfood/2026-04-25-retechuk/friction-log.md` — 3 blockers, 7 majors, 2 minors. **B9 spec emerges from the friction log.**
- [ ] **B10. 165-rule audit** — once enforcement is automated, surface dead rules. Collapse what doesn't fire. `code-reviewer` agent task.

---

## P3 — Deferred to post-SSL (after 9 May 2026)

From the groovy-gathering-dongarra unification plan:

1. **Canonical brand source** — move all tokens into `brands/<slug>/tokens.json`, both Claude UI Workflow and `sellersessions-design-system` read from there. (Kicked off partially by the 11 Apr migration to subfolders — the shape is ready, the tokens.json split is not.)
2. **Logo Brain sub-project** — `DesignLoop-MCP-Server/logo-brain/` using the Ellis Presshot direct-Gemini template.
3. **Component registry consolidation** — promote `sellersessions-design-system/src/components/` into `brands/components/`, `website-cloner` consumes from there.
4. **Image-gen ADR** — "Gemini direct is primitive, NB2 is fallback" written up as an ADR, shared helper extracted from Ellis Presshot.
5. **REFINE guard rails + motion rules** — install Impeccable + Brand Guidelines (T3 result), create `design-db/motion.csv` (T4 result), port `SSLive2026.spec.md` pattern into Workflow E.
6. **Inspiration flow polish** — document TikTok `/photo/` fallback, optional frame-grab + palette sampler. **105 TikTok links incoming (the operator compiling 12 Apr)** — will drive a major expansion of the inspiration corpus + colour/font/visual asset library.

---

## Known issues parked (not blocking, worth noting)

- **Selection delay on images** on the tldraw canvas — flagged during T2. Possibly the autosave throttle interacting with selection state. Reproduce after persistence fix is validated.
- **Home page / brand picker** at `localhost:5273/` (no `?brand=`) — currently a 404. 10-minute follow-up: list existing brands from `brands/` and render a picker.
- **PNG export size** — first run produced 8 MB for 3 images because `toImage()` honoured the bounding box. Fixed by capping `MAX_DIM` at 2000, but worth tightening to 1200 once the picker ships.
- **CLI negative-number flag parsing** — fixed 11 Apr (bare `-80` was being read as a flag). Leaving the note here so the fix is remembered, not re-introduced.

---

## How to close an item

1. Ship the fix.
2. Delete (or strikethrough) the entry here.
3. Add a one-line note to `MASTER-LOG.md` if it changes any artefact on disk.

Do NOT leave closed items hanging — this file should always show what is *live* work.
