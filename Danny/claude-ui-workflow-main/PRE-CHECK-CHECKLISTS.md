---
project: claude-ui-workflow
purpose: v2 architecture — Claude self-review before every the operator review gate
source: cycle-1 dogfood retechuk findings (26 items in dogfood/2026-04-25-retechuk/friction-log.md)
created: 2026-04-26
status: v1 draft — to be validated against cycle-2 run
---

# Pre-Check Checklists — v2 Workflow

## Why this file exists

Cycle-1 loop:
```
Claude does work → the operator eyeballs → the operator finds 26 things
```

Cycle-2 loop:
```
Claude does work → Claude self-checks against this file → the operator eyeballs the residue
```

Every cycle-1 finding becomes a mechanical check here. Every new cycle-2 finding gets appended. Over time Claude catches more, the operator catches less, and his review collapses to taste calls only.

---

## Handoff format (every stage uses this)

```
✅ Caught and fixed: [list with finding refs]
⚠️ Flagged for your eye: [specific items, with WHY]
❓ Genuinely uncertain: [taste calls only]
```

the operator only reads ⚠️ and ❓. ✅ is auditable but doesn't need attention unless something feels off.

---

## Autonomy classes

| Class | Meaning | the operator in loop? |
|---|---|---|
| **A** | Claude end-to-end. Output is deterministic, pass/fail is objective. | No — review only on demand |
| **B** | Claude executes, output needs verification. Mechanical part is mine, judgement gate is the operator's. | Yes — at the gate |
| **C** | Claude prepares options. Pick is taste, not checklist. | Yes — the operator picks |
| **D** | Never autonomous. Risk is too high (publishing, production writes, money). | Yes — the operator does it |

---

## Stage 1 — INTAKE

**Class:** B (Claude runs the interview, the operator confirms intake.json)
**Tool:** `intake/SKILL.md` + extract-flow for URL pre-pass

**Pre-checks (run before handing intake.json back):**

- [ ] **#1** — If URL was given before /intake fired, acknowledge it explicitly in the opener
- [ ] **#2** — If new brand from URL, slug = hostname-without-tld, lowercased, hyphens for dots. Auto-create `brands/<slug>/`
- [ ] **#3, #11** — Run audience pre-pass via `scripts/ingest-url.py` (extract-flow), NOT WebFetch, BEFORE Q2
- [ ] **#4** — Cross-check brand-name implication vs scout content. If scout contradicts the name (Re Tech UK trap), surface it
- [ ] **#5** — If scout detects catalogue/SKUs, set `offer.format = ecommerce` (don't shoehorn into single-offer schema)
- [ ] **#6** — If `output_type=landing`, ask `landing_archetype` (offer / brand-homepage / product-detail / category / about / lead-magnet) before Q3. Branch downstream questions on this
- [ ] **#7** — If redesign, capture both `vibe.current` (auto from scout) and `vibe.target` (user). Compute delta
- [ ] **#8** — Ask `brand_context.history` after Q2 ("Anything I should know about how this brand got here? Founders, history, false starts?")
- [ ] **#9** — At URL time, request optional Shottr full-page front-loaded ("Drop a Shottr if you've got one — saves a step if Stage 2 confidence is low")
- [ ] **#13** — One question at a time when binary/option choice. Multi-part only when additive
- [ ] **#12** — Project-infra preflight: never reach for generic web tools without checking `infra_*.md` memory + project README

**Handoff:** intake.json + summary of what was inferred from URL vs answered by user.

---

## Stage 2 — URL ingestion (extract-brand)

**Class:** A (deterministic — pass/fail is auditable)
**Tool:** `scripts/ingest-url.py` → extract-flow → `extract-brand.mjs`

**Pre-checks:**

- [ ] **#14** — `theme.mode` heuristic uses multi-sample luminance: read body bg at 3+ scroll positions OR sample largest visible bg-painted region by area. Single-element check is banned
- [ ] **#15** — `primary` role assigned by frequency × visual prominence (size, fold position). NOT first-button-found. Outliers go to `colors.accent`
- [ ] **#16** — Schema includes ALL these slots (warn if unfilled):
  - `colors.accent` (single accent hue, distinct from primary/cta)
  - `decorative_palette[]` (array of 2-6 hexes — illustrative / petal / pop)
  - `texture` ({ type, intensity })
  - `line_work` ({ stroke, style })
  - `photography_direction` (free-text)
- [ ] **#18** — Visual review: photography vs wordmark vs CTA colour alignment. Flag specific mismatching elements (not wholesale verdict)
- [ ] **#11** — Always extract-flow cascade. Never WebFetch as primary

**Handoff:** tokens.json with confidence per field, plus `_schema_gaps_observed` block listing any unfilled new slots.

---

## Stage 3 — Screenshot assist (low-confidence rescue)

**Class:** A
**Tool:** `scripts/refine-from-screenshot.py`

**Pre-checks:**

- [ ] **#17** — If `theme.mode` confidence low, re-evaluate from screenshot using multi-sample luminance (NOT just secondary/card/border roles)
- [ ] **#17** — If `primary` confidence low, re-count buttons by colour frequency from the screenshot
- [ ] Diff vs Stage 2 tokens.json — show what changed, why

**Handoff:** refined tokens.json + before/after diff.

---

## Stage 4 — Tokens validate

**Class:** A
**Tool:** schema validator

**Pre-checks:**

- [ ] Validate against schema (including new accent/decorative/texture/line_work/photography_direction slots)
- [ ] Flag any field with confidence < threshold
- [ ] Run intent-vs-delivery alignment check (#10/#18) — output specific mismatches, not vibe rating

**Handoff:** validated tokens.json OR list of unfilled slots needing manual input.

---

## Stage 5 — Lock primitive

**Class:** A
**Tool:** `/lock` skill

**Pre-checks:**

- [ ] Locks recorded with rationale (which finding / brief item drove the lock)
- [ ] No accidental locks on must-change fields (redesign delta from #7 — locked items must NOT include items the redesign is meant to change)
- [ ] Reference `vibe.current` vs `vibe.target` delta — anything in delta should NOT be locked

**Handoff:** lock.json + delta-vs-locks sanity report.

---

## Stage 6 — Design brief assembly

**Class:** B (the operator verifies brief before Stitch fires)
**Tool:** brief assembler

**Pre-checks:**

- [ ] **#6** — Brief reflects `landing_archetype`, not generic landing. Hero shape + CTA shape + Q3-Q6 tuning all archetype-specific
- [ ] **#7** — If redesign, vibe delta is explicit ("shift from grey-minimal to warm-editorial")
- [ ] **#8** — `brand_context.history` lands in the brief, not lost on context compaction
- [ ] **#10, #18** — Intent vs delivery mismatches surfaced as guidance with specific element callouts
- [ ] **#24, #26** — Anti-hallucination block + `[EXACT TEXT]` markers on every literal copy line (headlines, subheads, CTAs, brand story, product names, footer copy)
- [ ] Brief sized to fit Stitch prompt limits (no overflow)

**Handoff:** brief for the operator review BEFORE Stitch fires (this is a hard gate — Stitch cost goes up if brief is wrong).

---

## Stage 7 — Stitch generation

**Class:** B (Claude generates, the operator picks variant if multiple)
**Tool:** Stitch (browser via Playwright auth-persisted Chromium per `infra_playwright_chromium_auth.md`)

**Pre-checks BEFORE generation:**

- [ ] **#19, #25** — Verify Stitch model selector is on the right model. Hard rule:
  - Refresh existing site → Refresh (Nano Banana) + reference image
  - Fresh redesign → Thinking 3.1 Pro, single variant only
  - Text-led / SaaS / dev tools → 3 Flash OK
  - Fashion / lifestyle / image-led → NEVER 3 Flash
- [ ] **#20** — If the operator said "redesign" with new direction, route to Pro WITHOUT reference image. Reference locks into refresh territory
- [ ] **#24** — If brand-led + content fidelity matters: Refresh→Pro chain (Refresh output PNG as reference into Pro with anti-hallucination + `[EXACT TEXT]` markers)
- [ ] **#25** — First action in any new Stitch project: confirm model picker (defaults to Flash on reload)

**Pre-checks AFTER generation:**

- [ ] **#22** — Capture BOTH outputs: ZIP screenshots AND code-to-clipboard HTML. Drop folder: `stitch-export/screenshots/*.png` + `stitch-export/html/<variant>.html`
- [ ] **#26** — Read the rendered DOM, NOT Stitch's chat narration. Stitch confidently lies about its own output
- [ ] **#23, #24** — Verify locks held in rendered DOM. Each lock checked literally: text matches, sections in order, structure intact
- [ ] **#21** — If Flash output appeared (Marvel superheroes, random training data) — discard immediately, regenerate on Pro

**Handoff:** HTML on disk + lock-pass report (which locks held, which drifted) + the operator picks variant if multiple.

---

## Stage 8 — REFINE pass

**Class:** B (Claude runs audits, the operator eyeballs flagged items)
**Tool:** `/claude-ui-workflow` REFINE (19 techniques) + QA Gauntlet (7 agents)

**Pre-checks:**

- [ ] **#26** — Run audits on rendered HTML, not Stitch's preview iframe
- [ ] Run REFINE 19-technique audit (whitespace, hierarchy, rhythm, grid, contrast, etc.)
- [ ] Run QA Gauntlet 7-agent parallel
- [ ] Diff drift report: rendered tokens vs canonical tokens.json
- [ ] Lock-violation report: any lock that drifted between Stage 7 and Stage 8 fixes
- [ ] Cross-reference findings: REFINE + QA Gauntlet may report same issue from different angles — dedupe

**Handoff:** refined HTML + audit report + de-duped issue list ranked by severity. the operator eyeballs the ⚠️/❓ items only.

---

## Stage 9 — Cycle retro

**Class:** B
**Tool:** friction-log + bucket clustering

**Pre-checks:**

- [ ] All findings logged with rank/stage/evidence/proposed-fix
- [ ] Findings clustered into three buckets:
  - **v2-fix wave** — must fix before next cycle (foundational bugs)
  - **B9 spec** — workflow/skill/doc additions
  - **Deferred** — nice-to-have, not blocking
- [ ] Each ✅ positive finding codified (e.g. Refresh→Pro chain, refresh-mode lock pattern)
- [ ] Pre-check checklist (this file) updated with any new mechanical checks

**Handoff:** retro doc + updated PRE-CHECK-CHECKLISTS.md.

---

## Stage 10 — Cycle reset gate

**Class:** B (Claude verifies gates mechanically; the operator gives the green light)
**Tool:** none — gate logic only

**Purpose:** Hard boundary between cycle N and cycle N+1. Nothing carries
forward into the next cycle except codified rules. If any gate fails, cycle
reset is **paused** and the failing item becomes the next priority.

### 10A — Findings hygiene

- [ ] Every finding from cycle N has a bucket assigned: `v2-fix-wave`, `B9 spec`, or `deferred`. **No unclassified findings.**
- [ ] Each `v2-fix-wave` item has: code change + smoke test result (PASS, PARTIAL, or honest "still gap — escalated to cycle N+2") + commit hash.
- [ ] Each `🟢 positive finding` has been codified (rule added to a doc, not just sitting in the friction log).

### 10B — Documentation hygiene

- [ ] `PRE-CHECK-CHECKLISTS.md` updated. **Every new cycle-N finding has either:**
  - A new pre-check item with finding-# reference, OR
  - An explicit "no pre-check possible (taste-only)" note in the finding entry.
- [ ] `STITCH-MODEL-RULES.md` updated if any cycle-N findings were model-related.
- [ ] `TOKENS-SCHEMA.md` updated if cycle-N added/changed schema slots.
- [ ] Cycle-N retro entry written in project `MASTER-LOG.md` (above Kickoff section).

### 10C — Architecture review (the PAUSE gate)

- [ ] **Did cycle N reveal a meta-issue that requires architectural work before another dogfood?** Example: cycle 1 surfaced #6 — `output_type` collapses 6 archetypes. That's not a fix, that's a redesign. If a comparable meta-issue appears in cycle N, **pause** cycle reset and propose a meta-cycle (architecture rework) before cycle N+1.
- [ ] **Autonomy classes re-reviewed.** If a Stage classed A actually needed the operator in the loop during cycle N (or a Stage classed B turned out fully mechanical), re-classify in PRE-CHECK-CHECKLISTS.md. The classes are *empirical*, not aspirational.
- [ ] **Handoff format honoured.** Did every Class B stage actually use `✅ caught and fixed | ⚠️ flagged | ❓ taste only`? If the operator had to do a full review pass, the handoff format failed and that's a finding.

### 10D — Memory + state

- [ ] Cycle-N decisions captured to your memory layer (especially model rules + autonomy reclassifications + new positive-finding rules).
- [ ] Git: cycle-N work committed and pushed. No uncommitted v2-fix-wave changes.
- [ ] `OUTSTANDING-WORK.md` reflects: cycle-N closed, cycle N+1 queued, deferred items parked.

### 10E — Cycle N+1 setup

- [ ] **Brand pick locked with rationale on disk.** Different brand than cycle N. Ideally different `landing_archetype` to stress-test #6 branching. Rationale written: "picked X because Y stress-tests Z."
- [ ] **Fresh `dogfood/<YYYY-MM-DD>-<slug>/` initialised** containing:
  - `friction-log.md` from template (rubric + empty findings section)
  - `brief.md` (locked brand intake)
  - `stage-tracker.md` (which stages run, which skip, why)
- [ ] Brand-name implication vs scout content cross-check passed (the Re Tech UK trap from #4) — fail this and Stage 1 has a known landmine.

**Handoff:**

```
✅ Caught and fixed: [list of 10A-10D items that passed]
⚠️ Flagged for your eye: [any gate that didn't pass cleanly]
❓ Genuinely uncertain: [meta-issues — should we pause for architecture work?]

Cycle N: CLOSED.
Cycle N+1: ARMED on brand <slug>, archetype <type>.
Green light?  [Y / N / PAUSE-for-meta-cycle]
```

**Pause vs proceed (for clarity):**

- **PROCEED** — every gate green; cycle N+1 starts at Stage 1.
- **PAUSE for meta-cycle** — 10C revealed an architectural issue. Cycle reset is suspended. We design and ship the rework, *then* re-run Stage 10 gate. This is rare but valid (cycle 1 → cycle 2 should have been a pause for #6 archetype-branching work; we proceeded anyway because we'd already shoehorned, and accepted the noise).
- **PROCEED with carry** — gate failed on a non-foundational item (e.g., a 🟢 positive rule didn't get codified yet). Cycle N+1 starts but the carry-item is the first task post-Stage-1.

---

## Workflow-tax pre-flight (runs before any stage)

These aren't stage-bound — they're rules I have to obey every time.

- [ ] **#12** — Before invoking any generic web tool, check `infra_*.md` memory + project README for project-specific infra
- [ ] **#26** — For any AI-generated artifact (Stitch, image gen, copy), audit ground truth (rendered DOM, on-disk file). Never trust the tool's self-narration
- [ ] **#11** — URL extraction always goes through extract-flow, never WebFetch directly

---

## Cycle-1 finding → Stage map (audit trail)

| Finding | Stage | Class of fix |
|---|---|---|
| #1 acknowledge URL | 1 | UX text |
| #2 slug-from-URL branch | 1 | Schema |
| #3 audience pre-pass | 1 | Feature |
| #4 brand-name trap | 1 | Feature (covered by #3) |
| #5 offer.format ecommerce | 1 | Schema |
| #6 landing_archetype branch | 1 | Schema (cascades everywhere) |
| #7 vibe.current + vibe.target | 1 | Schema |
| #8 brand_context.history | 1 | Schema |
| #9 screenshot front-loaded | 1 | UX text |
| #10 intent-vs-delivery check | 2/4 | Feature |
| #11 use extract-flow | tax | Process |
| #12 infra-preflight | tax | Process |
| #13 one Q at a time | 1 | UX rule |
| #14 theme.mode multi-sample | 2 | Bug fix |
| #15 primary by frequency | 2 | Bug fix |
| #16 schema slots missing | 2 | Schema |
| #17 screenshot assist scope | 3 | Feature expand |
| #18 specific mismatch flag | 2/4 | Feature |
| #19 model selection rule | 7 | Doc + rule |
| #20 Refresh-mode misnamed | 7 | Doc rename |
| #21 never Flash for fashion | 7 | Doc rule |
| #22 two-channel Stitch export | 7 | Process |
| #23 refresh locks vs soft | 7 | Doc rule (positive) |
| #24 Refresh→Pro chain | 6/7 | Doc rule (positive) |
| #25 Flash default trap | 7 | Process rule |
| #26 never trust Stitch narration | 7/8 | Process rule (curriculum gold) |

---

## Status

- [x] v1 draft (this file)
- [ ] Validated against cycle-2 run on a fresh brand
- [ ] Each pre-check converted into an actual code/skill/script check (not just docs)
- [ ] STITCH-MODEL-RULES.md split out (#19, #20, #21, #23, #24, #25)
- [ ] Schema additions implemented (#5, #6, #7, #8, #16)
- [ ] extract-brand.mjs bug fixes (#14, #15)
- [ ] refine-from-screenshot.py expanded (#17)

---

## Open decisions for the operator

1. **STITCH-MODEL-RULES.md placement** — standalone doc (recommended) vs merged into umbrella SKILL.md
2. **Cycle-2 fix wave timing** — fix foundational bugs (#14, #15, #16) BEFORE cycle-2 dogfood (recommended) vs run cycle-2 on broken extractor (validates that we'd catch the same bugs)
3. **Cycle-2 brand pick** — needs to be different from retechuk; ideally a different `landing_archetype` (e.g. SaaS/dev tool to test #6 archetype branching properly)
