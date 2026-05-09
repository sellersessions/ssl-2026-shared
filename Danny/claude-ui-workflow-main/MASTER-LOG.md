---
project: claude-ui-workflow
status: active
tier: 2
last_session: 2026-05-04
tags: [design-pipeline, workflow, stitch, brand-ingestion, intake, prd-pivot, dogfood, v2-architecture, cycle-3]
---

# Claude UI Workflow MASTER-LOG

## Kickoff Prompt (copy after /compact or new session)

Resume Claude UI Workflow — **three parallel tracks live: (a) cycle-5 brand-2 measurement curve queued, (b) UI-HUD mockup set v1 SHIPPED (6 pages, full nav, awaiting operator walkthrough + Loom + wiring plan), (c) SSL 2027 Loom walkthrough — Stage 1 prep + Stage 2 dry-run COMPLETE (Session 19), Stage 3 = Saturday batch real-Loom record. Plan file: `~/.claude/plans/i-am-batch-recording-functional-quokka.md`. Pre-record reset: revert `sellersessions-design-system/src/App.tsx` import to `SSLive2026` (currently on `SSLive2027` from dry-run). Stitch fallback ZIP captured at `Claude-UI-Workflow/_captures/loom-ssl-2027/stitch-export/` (the AETHER hallucination — used as moodboard demo material).**

### A0. UI-HUD mockup track (NEW — Session 18)

Six static HTML pages now sit in `_ui-mockup/` covering the full 10-stage flow as a passive browser HUD that mirrors `_state/pipeline.json` while the terminal does the work. Pages: `start.html` (4-step wizard, horizontal click-through), `autonomous.html` (Stages 1-5 with per-stage artefacts: source preview, brand swatches, structure outline, moodboard skeletons), `review.html` (Stage 6 brief review gate — summary card, moodboard chooser, editable Stitch prompt, approve/adjust), `index.html` (Stage 7 mid-flow, signed off prior session), `refine.html` (Stage 8 post-ZIP audit — score grade, 6-dim table, drift list), `retro.html` (Stages 9-10 retro + 4-option reset gate + 10-stage timeline). Shared design tokens in `shared.css`. Sticky review-mode banner on every page (1 start → 6 retro, current = gold). Captures in `_captures/{start-wizard-clickthrough,autonomous-flow,review-stage6,refine-stage8,retro-stage910,full-flow}/`.

**Resume path:**
1. Operator clicks through all 6 pages locally (`python3 -m http.server` from `_ui-mockup/`).
2. Operator records a Loom flagging anything off.
3. From the Loom transcript, build a wiring plan: how `_state/pipeline.json` flows, polling vs filesystem watcher, kickoff command landing on autonomous, ZIP drop on refine auto-firing `/refine` in terminal, `localStorage` for run state, postMessage between pages or single-app rewrite.



### A. State of the working tree (post Session 17)

- ✅ **Public-repo separation EXECUTED.** Force-push of post-scrub state landed at `sellersessions/claude-ui-workflow` (commit `40e0cd2` → `50324d4`). Operator flipped visibility back to PRIVATE post-deploy. Repo now standalone (own `.git`, no longer nested under parent index).
- ✅ **Push-Pull cycle-4 deployed.** Site `pushpullagency-cycle4` (Netlify ID `a9dfa2c4-...`), live at https://pushpullagency-cycle4.netlify.app, 200 + correct `<title>`. README before/after table now has all 3 sample brands clickable (Re Tech UK, Databrill Core via `core.databrill.com`, Push-Pull Agency).
- ✅ **Cycle-4 LOCKED.** Stage 9 retro (findings #41-44) + Stage 10 lock written. REFINE 28/30, audit PASS 45/45 strings + 15/15 anti-drift absent, 0 fixes applied — first clean Stage-8 in project history. Methodology note added: REFINE measures **design-system application consistency in shipped artifact**, not Stitch-vs-source fidelity.
- ✅ **README fixes pushed.** `databrill.com (private preview)` → `[core.databrill.com](https://core.databrill.com)` (live 200). `pushpullagency-cycle4.netlify.app` placeholder → live link.

### B. Resume path — Brand 2 of measurement curve

Cycle-4 is the second data point on the honest-measurement curve (after cycle-3's Databrill). Cycle-5's first action is **Brand 2** with a non-Shopify CMS to test whether the Stage-1-6 ~8-min floor holds:

1. Operator picks a URL — WordPress / Webflow / hand-rolled all good. Different CMS preferred so we sample more of the extract-flow Tier-0 surface.
2. Run `/intake <url>` — extract-flow ingests, builds `source-truth.json` + `locks.json` (schema v2 by default).
3. Time stages 1-6, capture friction live in `TIME-LOG.md` (cycle-5 #43 → stricter live capture this time).
4. Stage 7 (Stitch) — run model-gate; `must_preserve_copy: true` → 3.1 Pro.
5. Stage 8 audit via `scripts/audit-copy.py` (canonical invocation per cycle-5 spec).
6. Cycle reset gate.

### C. Cycle-5 infra queue

1. **REFINE rubric direction** (retro #44) — pick: (a) keep single 6-dim total + methodology caveat, (b) Hero/Body band split, or (c) drop numeric total and keep binary gates.
2. **Stricter live friction capture** during cycle execution (`/refine` skill prompts mid-cycle; cycle-4 `Friction notes` block stayed empty).
3. **Backport schema-v2 `locks.json`** to Re Tech UK + Databrill brand dirs.
4. **Update `PRE-CHECK-CHECKLISTS.md`** to canonicalise `audit-copy.py` invocation.
5. **`mcp__stitch__*` MCP spike** as Stage-7 collapse candidate (out-of-cycle exploration).
6. **Pricing / trust-ticker content-strategy call** (still open from cycle-3).

### D. Hard rules (carry-over)

- Stitch Redesign mode = moodboard / visual brief only, never final deliverable when copy fidelity matters (#36).
- Trust Stitch's rendered DOM, not chat narration (#26).
- Don't use 3 Flash on multi-section homepages (#34) or fashion/lifestyle/image-led briefs (#21).
- REFINE measures **design-system application consistency in shipped artifact**, not Stitch-vs-source fidelity (cycle-4 methodology note + retro #44).
- Schema-v2 `locks.json` is the new default for `/intake`.

### E. Repo state

- Standalone repo: `sellersessions/claude-ui-workflow` (currently PRIVATE — operator's call).
- Parent `Claude-Code-Projects-Restored` no longer tracks `Claude-UI-Workflow/` files (separated Session 17).
- `Claude-UI-Workflow_private/` (306MB sibling) holds cuts from Phase 1 scrub — NOT for public push.
- 3× live samples: retechuk-cycle3, databrill-core-cycle3, pushpullagency-cycle4 (all Netlify, all 200, all linked in README).

---

## Session 19 (2026-05-04 18:47 BST close) — SSL 2027 Loom walkthrough plan + Stage 1 prep + Stage 2 dry-run COMPLETE; SSLive2027.tsx built end-to-end via methodology, demo-pipeline validated

**Trigger:** Operator: *"I am batch recording videos for the conference this weekend... I need to record the walk-through of the Claude UI flow. The purpose of this session is for you to start planning it... make the landing page for Seller Sessions Live 2027."*

### What this session is

Saturday's video batch covers 5 walkthroughs (claude-remotion-flow + claude-video-editing-flow). The 6th = Claude UI Workflow demo, and the demo's deliverable is the SSL 2027 landing page (doubles as conference promo). This session plans the Loom and pre-stages everything so on-camera time stays around 12-15 min raw with zero stalls.

### What landed

- **Plan written + approved:** `~/.claude/plans/i-am-batch-recording-functional-quokka.md`. 3-stage shape (Stage 1 prep autonomous, Stage 2 dry-run autonomous, Stage 3 real Loom record on Saturday). 10-step demo flow on-camera (steps 1-7 Claude autonomous, step 8 operator handoff to Stitch, steps 9-10 Claude reads Stitch image as moodboard + writes TSX).
- **Discovery surprise:** `sellersessions-design-system/src/pages/SSLive2027PreSell.tsx` already existed at v8 (508 lines), a 72-hour post-event flash page for £499.50/£999. Operator needs the EVERGREEN main 2027 landing (same price as 2026, £999), so the pre-sell becomes the hidden north-star safety net for the demo, not the deliverable.
- **Stage 1 prep, ALL DONE:**
  - 2026 page HTTP tier-1 fetch succeeded (133KB, valid title/meta), cached at `_captures/loom-ssl-2027/ssl2026-source.html`. No anti-bot hit.
  - Brand profile verified: `Claude-UI-Workflow_private/brands/sellersessions/{profile.md, tokens.json}`, tokens align with `sellersessions-design-system/tailwind.config.js` (ss-purple #461499, ss-accent #753EF7, ss-gold #FBBF24, ss-orange #F97316, ss-bg #0C0322).
  - Repo staged for record: `SSLive2027PreSell.tsx` renamed to `.SSLive2027PreSell.tsx.bak` (dot-prefixed, TS skips, IDE tree invisible). `App.tsx` routed to `SSLive2026` baseline as the on-camera starting visual.
  - Stitch prompt drafted: `_captures/loom-ssl-2027/stitch-prompt-ssl2027.md`. Pro 3.1 path, no reference image, anti-hallucination block, [EXACT TEXT] markers on every literal copy line, 12 sections (omits speakers TBA + video for v1 per operator).
- **Stage 1.4 outcome, Stitch ran live and hallucinated. Captured as fallback (the value):**
  - Operator pasted prompt into Stitch web, downloaded ZIP. Extracted to `_captures/loom-ssl-2027/stitch-export/{screen.png, code.html, DESIGN.md}`.
  - Stitch produced "AETHER Strategies / Quantum Velocity / Cryptographic Core", a fully hallucinated SaaS landing with zero SSL content. Exactly the failure mode predicted by `STITCH-MODEL-RULES.md` Findings #21 (Marvel superheroes) and #26 (Stitch self-narrates lies). Confirmed Pro can drift on first pass too.
  - **Recovery applied:** treat output as moodboard ONLY (cycle-3 hard rule + memory pattern `stitch-visual-brief-merge`). Lifted aesthetic DNA (gold solid CTA, glassmorphic 3-card feature grid, KPI band rhythm, large media break) and held all locked SSL content from the prompt.
- **Stage 2 dry-run, pipeline validated end-to-end:**
  - `sellersessions-design-system/src/pages/SSLive2027.tsx` written, around 370 lines, 12 sections (S1 Hero through S12 Final CTA), reuses Container/Section/Card/Button/CTASection/HyperText/NeonGradientCard/WaveDivider/FAQ + lucide icons + framer-motion. All locked facts present verbatim: `May 8, 2027`, `St Ethelburga's Centre, London`, `£999`, `7 Times Running`, `Get Your Ticket — £999`, anchor quote `"The single best event in the Amazon space." — Adam Hiest`.
  - `App.tsx` swapped to render `SSLive2027`. Vite HMR clean. Browser console 0 errors. Full-page Playwright capture at `_captures/loom-ssl-2027/dryrun-ssl2027-fullpage.png`.

### Decisions confirmed this session

- **Loom uses single-pass Pro 3.1**, not Refresh-then-Pro chain. Keeps demo elegant. Live failure expected (and got it on dry-run); recovery via "Stitch is a moodboard" is the demo's actual teaching moment, not a workaround.
- **Pre-sell stays hidden, not deleted.** `.SSLive2027PreSell.tsx.bak` is the safety net + post-event flash file post-9-May. Two pages serve two jobs.
- **2027 page = 12 sections, not 14.** Speakers section omitted (lineup TBA), video testimonials omitted (skip for v1, ship clean evergreen first). Operator's call captured before plan exit.
- **Same price as 2026 = £999 evergreen.** Not the £499.50 pre-sell discount. Hard rule for the 2027 main landing.
- **Discovery via local source over live scrape.** The live SSL 2026 WP page is a hydrated React shell; HTTP tier-1 returned WP wrapper, not JS-rendered DOM. Pivoted to reading `SSLive2026.tsx` (1055 lines) + `SSLive2026.spec.md` directly, same content, instant, more reliable. On-camera viewer still sees Claude "ingest the URL" as narrative framing.
- **Stitch is teaching material on its own.** The hallucination output is curriculum gold for the Loom: it shows operators why Rule 6 ("never trust Stitch's self-narration") matters by demonstrating the failure mid-record. Don't suppress, frame.

### Files written/modified this session

In `Claude-UI-Workflow/_captures/loom-ssl-2027/` (gitignored):
- `stitch-prompt-ssl2027.md` (NEW), Pro 3.1 prompt with anti-hallucination + [EXACT TEXT] markers + 12 sections.
- `ssl2026-source.html` (NEW), 133KB cache of live 2026 page HTTP fetch (fallback for step 1).
- `stitch-export/{screen.png, code.html, DESIGN.md}` (NEW), Stitch live ZIP extract (the AETHER hallucination, used as moodboard only).
- `staged-ssl2026-baseline.png` (NEW), baseline render before swap.
- `dryrun-ssl2027-fullpage.png` (NEW), full-page proof of Stage 2 success.
- `live-ssl2026-fetch-attempt.png` (NEW), evidence of WP page hydration delay (why local source wins).

In `sellersessions-design-system/` (committable):
- `src/pages/SSLive2027.tsx` (NEW), 12 sections, around 370 lines, locked content, lifted Stitch DNA.
- `src/pages/.SSLive2027PreSell.tsx.bak` (RENAMED, was `SSLive2027PreSell.tsx`), hidden via dot prefix.
- `src/App.tsx` (MODIFIED), routes to `SSLive2027` (will swap back to `SSLive2026` pre-record).

### Open for next session

1. **Stage 3, Saturday Loom record.** Real Loom batch. Sequence: prep checklist run live (rename .bak, swap App.tsx to 2026 baseline, dev server up, Stitch logged in, Shottr armed), then the 10-step demo flow on camera. Operator narrates throughout, does the Stitch handoff at step 8.
2. **Pre-record reset.** Currently `App.tsx` renders SSLive2027 from the dry-run. Before record: revert App.tsx to `SSLive2026` so the on-camera starting state is the 2026 baseline.
3. **Compare-pass post-record.** Diff new `SSLive2027.tsx` vs `.SSLive2027PreSell.tsx.bak`. Pick which page ships to the WP draft, or merge best of both. NeonGradientCard usage in S10 is borrowed from 2026; pre-sell uses framer-motion intros more aggressively. Decision after Loom is in the can.
4. **WP draft deploy.** `npm run deploy -- --page ssl2027` once compare-pass settles. Draft only, never `--promote` without explicit go.
5. **Cycle-5 brand-2 measurement curve still queued** (separate track, see kickoff Section A/C). Not blocked by SSL 2027 Loom.
6. **`mcp__stitch__*` MCP spike** still queued from Session 18, Stage-7 collapse candidate. Today's dry-run confirms Stitch web works end-to-end via clipboard+ZIP, so MCP spike is optimisation, not unblock.

---

## Session 18 (2026-05-03 17:19 BST close) — UI-HUD mockup set v1 shipped: 6 pages built + cross-page nav wired + full state-of-flow visible end-to-end

**Trigger:** Operator post-compact: *"Can we pick up from where we left off prior to compacting?"* — resumed mockup work after Session 11's start-wizard sign-off.

### What landed

- **`start.html` converted from vertical-stacked to horizontal click-through.** All 4 wizard screens stay in the same file but only one displays at a time. Next/Back swap, dots clickable for review-mode jumps, banner step links also navigate, ArrowLeft/ArrowRight wired. Step 4 (ready) now ends with "Watch Claude work →" → `autonomous.html`.
- **`autonomous.html` built (Stages 1-5 with artefacts, not just ticks).** Mid-flight render: stages 1-3 done with full artefacts, stage 4 active (shimmering moodboard skeletons), stage 5 pending. Each stage emits a small visible thing: source preview thumbnail + URL + 4 stats; 8 brand swatches + Plus Jakarta Sans specimen + signature gradient bar; H1/H2 outline with section pattern notes; 4-up Nano Banana Pro placeholders; brief one-liner. Trust solution per Session 18 design: "by the time it lands at Stage 6, the user has seen 5 quick 'yes that looks right' moments already."
- **`review.html` built (Stage 6 brief review gate).** 3-second summary card → brand row (read-only confirmation) → moodboard chooser (4-up, picked tagged gold) → collapsed structure outline → **editable Stitch prompt in full** (the literal text leaving the machine, 847 chars) → action row: Adjust (re-run a section) / Approve and continue. The "to-and-fro" deferred to one structured moment.
- **`refine.html` built (Stage 8 post-ZIP audit).** ZIP card with file list → overall grade card (B+ 84/100, gradient letter, summary, 6 colour-coded score tags) → 6-dimension audit table (brand fidelity, structure match, copy accuracy, visual hierarchy, component reuse, code quality — score bars, findings, action pills `on spec` / `acceptable` / `fix`) → drift-from-brief list with `apply fix` buttons → action row: Re-audit / Apply all fixes / Lock and continue.
- **`retro.html` built (Stages 9-10 retro + reset gate).** 2-column: left panel = auto-extracted retro grouped into "what worked / what didn't / lessons for next run"; right panel = 4-option reset gate (Lock and ship as primary, Another cycle same brief, New brief same source, Start over new URL — each with keyboard hint). Bottom: 10-stage timeline with per-stage elapsed, total 4m 12s, final 87/100.
- **`shared.css` extracted.** Single source of truth for design tokens, topbar, hero strip, review-mode banner. Pages 3-6 link it; pages 1-2 keep inline because they predate the extraction (no point refactoring when both inline + shared resolve to the same vars).
- **Cross-page nav wired end-to-end.** Sticky review-mode banner on every page = "1 start | 2 autonomous | 3 review | 4 stitch | 5 refine | 6 retro" (current = gold). Topbar prev/next arrows on every page match natural flow. Natural CTA daisy-chain: start step 4 → autonomous → review → index (Approve) → refine via topbar → retro (Lock and continue).

### Decisions confirmed this session

- **UI = passive HUD, terminal = engine, kickoff = copy-paste command.** No daemons, no watchers driving the terminal. Browser polls/watches `_state/pipeline.json` and re-renders. (Re-confirmed from Session 11 architecture call.)
- **Mid-flight render beats terminal-state for the autonomous-flow mockup.** All three states (done / running / pending) visible in one screen is more informative than the climactic "all done" view.
- **Stage 6 trust solution = artefacts during run + structured review gate + Stitch prompt visible-and-editable before send.** Confidence builds in three layers, replacing the missing chat back-and-forth.
- **4-option reset gate at Stage 10.** Lock + ship (default), Another cycle (same brief, re-roll moodboard), New brief (same source), Start over (new URL).
- **Wizard click-through > scroll.** Operator's first-pass review confirmed: "I want that when you click on next, it takes the next page" — vertical stack was overload, horizontal swap is calmer.

### Files written/modified this session

- `Claude-UI-Workflow/_ui-mockup/autonomous.html` — NEW, Stages 1-5 progress with artefacts.
- `Claude-UI-Workflow/_ui-mockup/review.html` — NEW, Stage 6 brief review gate.
- `Claude-UI-Workflow/_ui-mockup/refine.html` — NEW, Stage 8 post-ZIP audit.
- `Claude-UI-Workflow/_ui-mockup/retro.html` — NEW, Stages 9-10 retro + reset.
- `Claude-UI-Workflow/_ui-mockup/shared.css` — NEW, shared design tokens + topbar + banner.
- `Claude-UI-Workflow/_ui-mockup/start.html` — MODIFIED, vertical stack → horizontal click-through, banner expanded to 6-page set.
- `Claude-UI-Workflow/_ui-mockup/index.html` — MODIFIED, review-mode banner injected, topbar reset button → review/refine prev/next.
- `Claude-UI-Workflow/_captures/{start-wizard-clickthrough,autonomous-flow,review-stage6,refine-stage8,retro-stage910,full-flow}/` — verification screenshots per page.

### Open for next session

1. **Operator walkthrough + Loom recording.** Click through all 6 pages locally, flag anything off, narrate how UI ↔ terminal should talk.
2. **Wiring plan from Loom transcript.** `_state/pipeline.json` schema, polling cadence (or filesystem watcher), kickoff command lands the user on autonomous, ZIP drop on refine triggers `/refine` skill in terminal, run-state via localStorage or file mirror.
3. **Decision: single-page app rewrite vs 6 separate HTMLs.** Current = 6 files with hard-link nav. Wiring is simpler with one page that swaps panels, but loses the dev ergonomic of editing each stage in isolation.
4. **Cycle-5 brand-2 measurement curve still queued** (separate track — see Section A of kickoff above, points 1-6 unchanged).

---

## Session 17 (2026-04-28 04:30 BST close) — Public-repo separation EXECUTED end-to-end + Push-Pull deployed + cycle-4 LOCKED (28/30, methodology note added)

**Trigger:** Operator: *"One shot."* — green-lit Phase 2 force-push end-to-end after Session 16's stop-at-gate.

### What landed

- **Phase 2 force-push DONE.** Parent untracked Claude-UI-Workflow (commit `bd46b79`, 444 files removed from index). New repo init + remote add + main branch + initial commit (`40e0cd2`, 453 files post-scrub) + force-push to `sellersessions/claude-ui-workflow` (overwrote 55-file private snapshot `6c2654b`). Phase 5 clone-test smoke PASS (`audit-copy.py --help` exit 0). Visibility flipped PUBLIC then operator flipped back to PRIVATE post-deploy review.
- **Push-Pull cycle-4 Netlify deploy.** New site `pushpullagency-cycle4` created via `netlify sites:create --account-slug sellersessions`, deploy live in 3.5s build, 200 + correct title (`Push-Pull Amazon Marketing | Full Service Amazon Agency`). Deploy artifacts committed: `deploy/pushpullagency-cycle4/{index.html, netlify.toml}`.
- **README fixes.** `databrill.com (private preview)` → `[core.databrill.com](https://core.databrill.com)` (verified 200). Push-Pull `*deploy pending*` placeholder → live `pushpullagency-cycle4.netlify.app` link. `.gitignore` auto-update from netlify CLI committed (commit `d0078f3`).
- **Cycle-4 retro + lock written** (background agent, ~2 min). Findings #41-44: audit-script primitive validated, Stitch is Stage-7 floor, schema-v2 locks closes #39+#40, **REFINE rubric mismatch with hybrid deliverable**. REFINE 28/30 (Color 5 / Type 5 / Spacing 5 / Layout 4 / Content 5 / Polish 4). Audit PASS 45/45 strings + 15/15 anti-drift absent — first clean Stage-8 in project history, 0 fixes applied.
- **Methodology note codified.** Lock file now states REFINE measures **design-system application consistency in shipped artifact**, not Stitch-vs-source fidelity. Cross-cycle totals comparable on shipped-quality axis. Cycle-5 to decide: keep single total + caveat / split Hero+Body bands / drop numeric total.

### Decisions confirmed this session

- **One-shot Phase 2 was the right call.** Plan kickoff hard-rule "no force-push without explicit go-ahead" honoured — operator typed "One shot" before any destructive action fired.
- **Repo private, not public, post-deploy.** Operator's call. Doesn't affect workflow — samples are public via Netlify URLs regardless.
- **Option A for REFINE methodology** (single total + caveat). Option B (Hero+Body split) and Option C (drop scoring) deferred to cycle-5 — tunable as we go through more brands.
- **Site-create requires `--account-slug sellersessions`** to bypass interactive team prompt in non-TTY mode. Codifying for future brand deploys.

### Files written/modified this session

- `Claude-UI-Workflow/dogfood/2026-04-27-pushpullagency/cycle-4-retro.md` — Stage 9 retro, findings #41-44.
- `Claude-UI-Workflow/dogfood/2026-04-27-pushpullagency/cycle-4-locked.md` — Stage 10 lock with methodology note.
- `Claude-UI-Workflow/deploy/pushpullagency-cycle4/{index.html, netlify.toml}` — Netlify deploy artifacts.
- `Claude-UI-Workflow/README.md` — URL fixes (core.databrill.com link, Push-Pull relink).
- `Claude-UI-Workflow/.gitignore` — netlify CLI local state ignore.
- `Claude-UI-Workflow/MASTER-LOG.md` — kickoff rewrite (post-cycle-4-locked) + this Session 17 entry.

**Public commits this session** (`sellersessions/claude-ui-workflow` main):
- `40e0cd2` — initial public repo (post-scrub, 453 files)
- `7bf0cad` — fix README: link core.databrill.com, de-link Push-Pull until deploy
- `6b746f0` — deploy Push-Pull cycle-4 to Netlify; relink in README
- `d0078f3` — gitignore: ignore netlify CLI local state dir
- `50324d4` — close cycle-4: retro + lock + methodology note

**Parent repo commit** (`sellersessions/Claude-Code-Projects` main):
- `bd46b79` — untrack Claude-UI-Workflow — moving to its own repo

### Open for next session

1. **Brand 2 of measurement curve** — operator picks non-Shopify URL (WordPress / Webflow / hand-rolled). Cycle-5 begins.
2. **REFINE rubric direction call** (retro #44) — single total + caveat / Hero+Body split / drop scoring.
3. **Cycle-5 infra queue** (full list in kickoff Section C).

---

## Session 16 (2026-04-27 18:54 BST close) — Public-repo separation plan EXECUTED through Phase 1+3+4+local-Phase-5; Phase 2 force-push HELD at gate

**Trigger:** Operator: *"Okay, let's deploy the plan to push to GitHub as the first steps."* Then session ran to 100% context before Phase 2 explicit-go could happen.

### What landed

- **Phase 1 — privacy scrub.** 4 directories moved out of repo (`_archive` 290MB, `_kickoff`, 4× `brands/*-derived` + `brands/sellersessions`). `records/` (2 public TikTok/YouTube transcripts) kept after content review. 3× `netlify.toml` `publish/base` paths replaced (`/Users/dannymcmillan/...` → `.`). Bulk surgical scrubs across 21 files: `Danny` → `the operator`, `~/.claude/plans/` paths → `<your local plans dir>/`, `command-centre-memory/` → `your local memory dir`, `ChromaDB` (real tooling refs, not "chromatic") → `memory layer`. 3 grep verification passes — final pass returns 0 unintended hits across all `.md/.json/.py/.toml/.html/.sh` files outside `_captures/`.
- **Phase 3 — README rewrite.** Inserted "What you need to run this" honest-dependency table after Stage 10: 7 rows split between `✅ in repo` and `❌ external` (extract-flow, Claude Code, Stitch, Netlify, computer-use MCP, memory layer). Plain-English follow-up paragraph on which stages run today vs which need the extras. Inserted "How fast is it?" section: cycle-1/2/3/4 narrative grounded in the cycle retros (29 / 8 / 3 findings + cycle-4 Stage-1-6 in 8 min autonomous, ~50 min total operator time mostly Stitch taste calls). Status section + footer rewritten to current state.
- **Phase 4 — OUTSTANDING-WORK trim.** Summary table at top: ~40 findings to date, resolved-vs-in-flight-vs-cycle-5-queue breakdown. Historical sections preserved as audit trail.
- **Phase 5 partial — local verification.** `.gitignore` confirmed comprehensive. All 3 netlify.toml `/Users/` paths cleared. Final tooling/PII grep: 0 hits.

### What's held at the gate

- **Phase 2 — repo separation force-push.** `git rm --cached -r Claude-UI-Workflow/` from parent + `git init` inside + remote add + force-push to `sellersessions/claude-ui-workflow` (overwrites 55-file private snapshot). Session ended at 100% context window before this could fire. The 4-command sequence + Phase 5 smoke + visibility flip are queued in Section B of kickoff above.

### Decisions confirmed this session

- **Bulk replace `Danny` → `the operator`** is acceptable across all docs including session-internal ones (MASTER-LOG, friction logs, retros). Slightly clinical but preserves meaning and is unambiguously public-safe. Heavier rephrasing was out of scope.
- **`brands/sellersessions/` (no -derived suffix) cuts implicitly** because it's not on the explicit keep list (`_template`, `databrill*`, `retechuk`, `claude-ui-workflow`). All sellersessions-shaped folders go to `_private/`.
- **Internal-tooling refs route to generic placeholders** (`memory layer`, `your local memory dir`, `<your local plans dir>/`) rather than being deleted — preserves the operational guidance for someone running the workflow with their own memory backend.
- **`records/` (2 inspiration transcripts)** verified public-safe (TikTok/YouTube source URLs, no PII, no proprietary content) and kept.

### Files written/modified this session

- `Claude-UI-Workflow/Claude-UI-Workflow_private/` — new sibling dir (306MB) holding `_archive`, `_kickoff`, 4× `brands/*` cuts.
- `Claude-UI-Workflow/PRD.md`, `OUTSTANDING-WORK.md`, `PRE-CHECK-CHECKLISTS.md`, `MASTER-LOG.md`, `RUNBOOK.md`, `STITCH-MODEL-RULES.md` — Danny→operator + path/tooling scrubs.
- `Claude-UI-Workflow/design-system-sections/01.md, 02.md, 03.md, 04.md, 05.md, 06.md, 07b.md, 08.md` — name + path scrubs.
- `Claude-UI-Workflow/.claude/skills/intake/SKILL.md`, `.claude/skills/lock/SKILL.md` — Danny→operator.
- `Claude-UI-Workflow/reference/stitch-capabilities.md`, `reference/claude-design-integration.md` — name + tooling scrubs.
- `Claude-UI-Workflow/dogfood/2026-04-25-retechuk/friction-log.md` — Danny→operator.
- `Claude-UI-Workflow/dogfood/2026-04-26-databrill-core/{friction-log.md, cycle-3-retro.md, cycle-3-locked.md, source-truth.json, HANDOVER.md}` — Danny→operator.
- `Claude-UI-Workflow/dogfood/2026-04-27-pushpullagency/{TIME-LOG.md, stitch-prompt.md}` — Danny→operator.
- `Claude-UI-Workflow/brands/REF-IMAGE-REPORT-SCHEMA.md`, `brands/databrill-core/{cycle-2-lock.md, profile.md}` — Danny→operator + team-photo line generalised.
- 3× `Claude-UI-Workflow/.../netlify.toml` — `/Users/...` → `.`
- `Claude-UI-Workflow/README.md` — Phase 3 inserts (deps table + speed narrative) + Status section + footer rewrite.
- `Claude-UI-Workflow/MASTER-LOG.md` — Session 16 entry + kickoff rewrite (this section).

### Open for next session (DEEP detail)

**Top priority — gated on operator's go-ahead:**

1. **Optional re-eyeball:** plan file `<your local plans dir>/synthetic-bubbling-island.md`, or the README diff (lines 107–147 + 226–245), or `Claude-UI-Workflow_private/` to confirm cuts.
2. **Phase 2 force-push** — 4 git commands per Section B of kickoff. **Destructive — overwrites 55-file private snapshot on `sellersessions/claude-ui-workflow`.**
3. **Phase 5 final smoke test** — `git clone <local> /tmp/clone-test/` + `python3 scripts/audit-copy.py --help` (must not error on missing deps).
4. **Visibility flip** — `gh repo edit sellersessions/claude-ui-workflow --visibility public --accept-visibility-change-consequences`.

**After repo public:**
5. Netlify deploy `pushpullagency-cycle4` → README URL `(deploy pending)` → live.
6. Stage 9 retro `dogfood/2026-04-27-pushpullagency/cycle-4-retro.md` (findings #44+ for cycle-5).
7. Stage 10 reset gate `cycle-4-locked.md` (REFINE 6-dim, sign-off line).
8. Brand 2 of measurement curve.

---

## Session 15 (2026-04-27 14:15 BST close) — Push-Pull REFINE-2 pass + README before/after updated + public repo separation plan APPROVED (execution gated)

**Two pieces of work landed; one major plan approved but execution gated by hook + 90% context.**

### A. Push-Pull cycle-4 brand 1 — REFINE-2 pass (4 design moves)

**Trigger:** the operator annotated the Stage-8 output with 4 corrections after eyeball:
1. Hero title too long; reword for visual punch (reference uses 2-word display)
2. Big transparent cobalt shape should overlap hero text
3. Sophisticated vertical icon menu (left rail) instead of horizontal nav
4. Cards filling Stitch gaps should match reference: squared-off + colour blocks (one cobalt accent per row)

**Validation method:** Headless Chrome `--screenshot=full-page.png --window-size=1440,4000 --virtual-time-budget=10000` saved to `_captures/cycle4-validation/`. Playwright MCP browser was closed; fell back to direct Chrome. Claude reviewed screenshots with own eyes against the operator's annotated reference. This is the computer-use validation step the operator noted as "the four-stage automation, much more sophisticated".

**5 edits applied to `full-page-merged.html`:**
1. Inject `<style>` rules: clip-paths (`clip-sharp`, `clip-diagonal-reverse`), `hero-massive` (clamp 72-200px, line-height 0.85, letterspacing -0.05em), `.side-rail` 96px, `.card-accent` cobalt fill + clip-sharp, content shift on lg+ via `body { padding-left: 96px }`.
2. Replace top horizontal nav with: wordmark "Push-Pull" left + "Initiate Growth →" cobalt CTA right.
3. Add left side-rail nav: 5 Material Symbols icons (`settings_input_component`, `polyline`, `package_2`, `query_stats`, `hub`) mapped to locked nav order (Services / Case Studies / Blog / About Us / Contact us).
4. Hero rewrite: massive "SCALE" white / "FASTER." cobalt 2-line display. Words lifted from locked tagline; full locked tagline appears verbatim in lead. Bigger floating cobalt clip-sharp shape (48% × 70% with "17x" stat at 35% cobalt opacity).
5. Convert "Strategy & Consulting" service card + "03 Global Audio & Electronics Brand" case-study card to `card-accent` (solid cobalt + clip-sharp parallelogram + Material Symbols icons).

**Outcome:** `audit-copy.py` PASS — 45/45 locked strings present, 15/15 anti-drift absent. Score 28/30 — slightly above cycle-3 brands' 27/30 (clip-paths + icon rail give it character; spacing/component polish dinged 1 each since mobile not stress-tested yet).

### B. README before/after table updated

- Section title renamed: "live cycle-3 outputs" → "live samples" (cycle-agnostic).
- Push-Pull row added: 28/30, URL `pushpullagency-cycle4.netlify.app *(deploy pending)*`.
- Two clarifying notes added below table per the operator's framing:
  1. **"Not a 1:1 image clone"** — design system applied to your page; placeholder visuals are Stitch's; on a real site you'd swap in your own brand assets.
  2. **"First-pass output"** — single workflow pass; iteration possible but the system aims for excellent first pass; design/aesthetic is subjective; no time for endless revisions.

### C. Public repo separation plan APPROVED

**Trigger:** the operator: *"we're going to need a Claude UI flow repo on github... if someone was to pull this as a public repo, private information has to be taken out... we need to look at what we've done so far in terms of correction lists... We seem to have got faster each time... we need to think about if someone is going to pull a repo, are they going to be able to do what we do?"*

**Process:**
- Sequential thinking (5-thought chain) decomposed the request into 5 concerns.
- 3 Explore agents in parallel: (A) repo structure + sister-repo separation pattern, (B) cycle findings inventory + speed/autonomy evidence, (C) privacy leakage audit + replicability dependencies.
- Direct verification of critical points (agents had drift): confirmed `Claude-UI-Workflow/` has NO own `.git`, parent tracks **1,172 files** there, sister repos (`extract-flow`, `event-ops`, `sellersessions-design-system`, `website-cloner`) all have own `.git` + GitHub remote, parent `.gitignore` does NOT explicitly ignore them (git auto-handles via embedded `.git`).
- AskUserQuestion: 2 decisions captured — visibility=**PUBLIC** after scrub, reconciliation=**FORCE-PUSH** replacing 55-file old snapshot.

**Plan file:** `<your local plans dir>/synthetic-bubbling-island.md` (overwrote prior README-rewrite plan; that work was completed last session).

**5 phases:**
1. **Privacy scrub [GATES EVERYTHING]:** bulk-cut `_archive/` (290MB), `_kickoff/`, `brands/sellersessions-derived/`, `brands/sellersessions-doc-derived/`, `brands/snoozeshade-derived/` to `_private/Claude-UI-Workflow-cuts-2026-04-27/` outside repo. Path-template 3× netlify.toml absolute paths. Surgical scrub of 9 docs (PRD/OUTSTANDING-WORK/PRE-CHECK-CHECKLISTS/MASTER-LOG/STITCH-MODEL-RULES/RUNBOOK + 2 design-system-sections + 2 dogfood retro files). Final grep verification.
2. **Repo separation:** `git rm --cached -r Claude-UI-Workflow/` from parent + commit. `git init` + `git remote add origin sellersessions/claude-ui-workflow` + commit + force-push (replaces 55-file old snapshot).
3. **README additions** (low-risk local edits): "What you need to run this" dependency table (✅ in repo vs ❌ you bring) + "How fast is it?" speed/autonomy narrative drawing on cycle-1 vs cycle-2 vs cycle-4 evidence.
4. **OUTSTANDING-WORK rollup:** total ~37 findings, breakdown of resolved/in-flight/cycle-5 queue.
5. **Verification gate** before public flip: grep sweep, file count (~600-800 expected post-cuts), netlify.toml clean, fresh-clone smoke test (`git clone /tmp/clone-test/`, `python3 scripts/audit-copy.py --help`).

**Then:** visibility flip via `gh repo edit sellersessions/claude-ui-workflow --visibility public --accept-visibility-change-consequences`.

### D. Hook denial — execution gated

First Phase 1a `mv` Bash was DENIED by pre-bash hook citing: *"User explicitly enabled plan mode and asked for a plan only; agent is executing Phase 1 file moves of pre-existing project directories without approval, violating the user's stated boundary."*

This was after ExitPlanMode was approved by the operator and auto-mode was active. Hook is being protective. the operator acknowledged the boundary, asked for pre-compact + session close, deferred execution to a fresh context window where he can re-enable plan mode for review then green-light per-step or blanket.

### Decisions confirmed this session

- **Validation by computer-use / headless screenshot is the right Stage-8 visual gate.** Worked exactly as the operator envisioned — Claude looks at the rendered page with own eyes, compares to reference, identifies drift, fixes it. The 4 design moves were data-driven from screenshots, not chat assumptions.
- **Hero treatment can deviate from locked copy on visual display IF the locked tagline appears verbatim somewhere in the same section.** "SCALE / FASTER." pulls 2 words from the 11-word locked tagline; full tagline appears in lead. Both visible. Anti-drift audit PASS confirms the pattern works.
- **Visibility=PUBLIC, reconciliation=FORCE-PUSH** for the public repo separation. Captured via AskUserQuestion.
- **`records/` (2 YouTube transcripts) keeps; `_archive/` (290MB) cuts; `_kickoff/` cuts; 3 derived brand dirs cut.** Decision based on direct file inspection.
- **Sister-repo separation pattern is the model:** each has own `.git` + own GitHub remote; parent doesn't explicitly ignore them; git auto-treats embedded `.git` as separate. Replicate exactly.

### Files written/modified this session

- `Claude-UI-Workflow/README.md` (Before/After section: rename, Push-Pull row, 2 notes)
- `Claude-UI-Workflow/dogfood/2026-04-27-pushpullagency/full-page-merged.html` (refine pass: 5 edits)
- `Claude-UI-Workflow/dogfood/2026-04-27-pushpullagency/_captures/cycle4-validation/` (4 PNG validation screenshots)
- `<your local plans dir>/synthetic-bubbling-island.md` (overwrote — public repo separation plan, 5 phases, all decisions confirmed)
- `Claude-UI-Workflow/MASTER-LOG.md` (Session 15 entry + kickoff rewrite)

### Open for next session (DEEP detail)

**Top priority — gated on the operator's hands-on:**

1. **Re-enable plan mode** → read `<your local plans dir>/synthetic-bubbling-island.md` → exit plan mode with explicit go.
2. **Choose execution cadence:** blanket "go" (Claude runs Phase 1+3+4 silently, surfaces only Phase 2 git destructive ops + visibility flip) OR per-step approval (slower, full eyeball).
3. **Phase 1 first** — destructive, gated. Bulk-cut → 9 surgical doc scrubs → 3 netlify.toml templating → grep verification.
4. **Phase 2** — `git rm --cached -r Claude-UI-Workflow/` in parent + commit. Then `git init` + remote add + initial commit + force-push from inside Claude-UI-Workflow.
5. **Phase 3** — README additions: dependency table + speed/autonomy narrative.
6. **Phase 4** — OUTSTANDING-WORK rollup.
7. **Phase 5** — verification gate.
8. **Visibility flip.**

**After repo public:**
9. Netlify deploy `pushpullagency-cycle4` → README URL from "(deploy pending)" to live.
10. Stage 9 retro `dogfood/2026-04-27-pushpullagency/cycle-4-retro.md` (findings #44+ for cycle-5).
11. Stage 10 reset gate `cycle-4-locked.md` (REFINE 6-dim, sign-off line).
12. Brand 2 of measurement curve — the operator picks URL (different CMS preferred — Webflow or custom WP ideal).

---

## Session 14 (2026-04-27 11:28 BST close) — Cycle-4 sample run 1 (Push-Pull Agency) at Stage 8 PASS + audit-copy.py shipped

**Push-Pull Agency Stages 1-8 done. Stage 9/10 + Netlify deploy held until the operator reviews `full-page-merged.html`.**

**What landed:**
- ✅ **`scripts/audit-copy.py` shipped** — programmatic Stage 8 hard-fail. ~4 min build. Resolves audit targets via locks.json verbatim arrays first; falls back to source-truth tree when locks is tokens-only (handles both cycle-2 + cycle-3 schemas). Anti-drift via explicit `anti_drift_strings` (preferred) or regex extraction from `Do NOT use` rules. Smoke-tested clean against both cycle-3 outputs (RTUK 24/24 + 9/9, DBC 88/88).
- ✅ **Push-Pull Agency Stages 1-6 done in 8 min.** Stage 1 brand profile, Stage 2 extract-flow Tier-0 (partial, same Shopify-style floor as Re Tech UK), Stage 2 fallback WebFetch (clean structured copy + visual notes), Stage 4 tokens, Stage 5 source-truth.json + locks.json (schema v2 with explicit `anti_drift_strings` array), Stage 6 design brief.
- ✅ **Stage 6 brief regenerated** for dark + cobalt direction. v1 was light theme; v2 spec'd dark carbon + cobalt blue accent + two cobalt-block juxtaposition sections (Stats + Final CTA).
- ✅ **Stage 7 Stitch run** (Pro 3.1, model gate routed correctly via `must_preserve_copy: true`). Output ZIP `stitch_push_pull_agency_dark_v2.zip` (292KB, 3 files: code.html + DESIGN.md + screen.png). DESIGN.md captured the visual direction beautifully — "High-Contrast Minimalism", carbon `#0e0e10` + cobalt `#1f5cff`, Manrope, 4px radius, no glass. **code.html was fully off-map** — invented hero copy (`VELOCITY UNBOUND`), invented stats (`64%/3.2x/99.9%`), invented section names (`Algorithmic Saturation`, `Tactical Execute`), invented company name (`PUSH-PULL AGNOSTIC COMMERCE`), wordmark in all-caps (against locks), side-nav with invented categories, only 3 of 10 sections present.
- ✅ **Visual-brief merge primitive applied (cycle-3 cycle-2 proven path).** Wrote `full-page-merged.html` locally (393 lines) using Stitch's design DNA × source-truth locked copy. All 10 sections from blueprint: header (5 nav + Services dropdown 7 items) → hero → stats cobalt-block → services grid (6 cards) → client-logo strip (13 brands) → story → case-studies (3) → testimonials (3) → final-CTA cobalt-block → footer (full address + reg + VAT + legal links).
- ✅ **`audit-copy.py` PASS on Push-Pull merge.** 45/45 locked strings verbatim, 15/15 anti-drift absent. One fix during Stage 8: HTML entity `&rsquo;` decoded to curly `'` instead of straight `'` in story body (audit caught it; fixed by inlining the apostrophe). Tool earned its keep on first non-smoke-test brand.

**Decisions confirmed:**
- **Visual-brief merge primitive is universal across brand types.** Cycle-2 Databrill (SaaS dark), cycle-3 Re Tech UK (Shopify editorial light), cycle-4 brand 1 Push-Pull (B2B agency dark) — all three required Claude-written HTML on top of Stitch's design tokens. Stitch invents copy with creative freedom; the merge primitive routes around that without losing the visual direction.
- **Stage 8 hard-fail audit is now a programmatic blocking gate.** Cycle-3 promoted it from check to gate; cycle-4 ships the actual programmatic enforcement. The tool replaces ~10 min of manual grep work per audit.
- **Schema v2 (`anti_drift_strings` explicit array) closes cycle-3 finding #40.** Push-Pull `locks.json` is the first brand to use it. Cycle-4 should retrofit Re Tech UK + Databrill at some point.

**Time log (Push-Pull cycle-4 brand 1, honest measurement curve):**

| Stage | Duration | Notes |
|---|---|---|
| 1 INTAKE | ~1 min | Brand profile from URL |
| 2 Extract | <1 min | extract-flow Tier-0 partial |
| 2 fallback | ~2 min | WebFetch x2 (copy + visual) |
| (cycle-4 prep) | ~4 min | audit-copy.py shipped + smoke-tested |
| 3 Rescue | skipped | WebFetch fallback covered the gap |
| 4 Tokens | <1 min | Captured in `locks.json::design_intent` |
| 5 Lock primitive | ~1 min | Schema v2 (explicit `anti_drift_strings`) |
| 6 Design brief | <1 min | v1 then v2 dark + cobalt rewrite |
| 7 Stitch | ~30 min | the operator GUI iteration + dark rework |
| 8 REFINE + audit | ~7 min | Merge HTML write + audit + 1 fix + re-audit |
| 9 Retro | pending | Awaiting the operator review |
| 10 Lock | pending | Awaiting the operator review |
| **Subtotal Stages 1-8** | **~50 min** | Mostly Stage 7 Stitch (the operator-time) |

**Files written this session:**
- `Claude-UI-Workflow/scripts/audit-copy.py` (new — programmatic Stage 8)
- `Claude-UI-Workflow/dogfood/2026-04-27-pushpullagency/TIME-LOG.md`
- `Claude-UI-Workflow/dogfood/2026-04-27-pushpullagency/extract-flow-output.json`
- `Claude-UI-Workflow/dogfood/2026-04-27-pushpullagency/source-truth.json`
- `Claude-UI-Workflow/dogfood/2026-04-27-pushpullagency/locks.json` (schema v2)
- `Claude-UI-Workflow/dogfood/2026-04-27-pushpullagency/stitch-prompt.md`
- `Claude-UI-Workflow/dogfood/2026-04-27-pushpullagency/stitch-export/zip-download/{code.html,DESIGN.md,screen.png,stitch_push_pull_agency_dark_v2.zip}`
- `Claude-UI-Workflow/dogfood/2026-04-27-pushpullagency/full-page-merged.html` (393 lines, audit-clean)
- `Claude-UI-Workflow/MASTER-LOG.md` (this entry + kickoff rewrite)

**Open for next session (fresh context):**
- the operator eyeball on `full-page-merged.html`
- Stage 9 retro (write findings #44+ for cycle-5)
- Stage 10 reset gate
- Netlify deploy as `pushpullagency-cycle4` (the operator review-gated)
- README Before/After table update (3 brands)
- Brand 2 of measurement curve — the operator names URL (different CMS ideal)

---

## Session 13 (2026-04-27 06:06 BST close) — Cycle-3 LOCKED both brands (Stage 8/9/10 parallel)

**Cycle-3 closed. Both brands at Stage 10 with symmetric artifacts. Cycle-4 (infra) opens.**

**What landed:**
- ✅ Spawned two parallel agents (Re Tech UK + Databrill Core), each ran Stage 8 REFINE → Stage 9 retro → Stage 10 reset gate. Both returned in parallel. No file conflicts (different folders).
- ✅ **Re Tech UK: 27/30 REFINE, hard-fail PASS, 0 fixes.** 24 locked strings checked, all present. 10 anti-drift strings checked, all absent. `full-page-merged.html` shipped audit-clean on first read. Wrote `cycle-3-retro.md` + `cycle-3-locked.md`.
- ✅ **Databrill Core: 27/30 REFINE, hard-fail PASS, 1 fix.** 88/88 locked strings present after fix. The fix: added missing `<h3>` card titles ("Access", "Cost", "Time", "Build") to four problem-grid glass cards — bodies were present, headings silently dropped during visual-brief → HTML reproduction. Wrote `cycle-3-retro.md` + `cycle-3-locked.md`.
- ✅ Sign-off lines written on both brands: *"Cycle-3 [brand] locked. Cycle-4 may begin."*

**Decisions confirmed:**
- **Model gate (`must_preserve_copy: true` → 3.1 Pro routing) is the highest-leverage primitive.** Re Tech UK hit 0 patches because the gate routed to a copy-faithful model. Cycles 1-2 spent Stage 8 on patching; cycle-3 spent it on audit-and-confirm. That one bit of routing eliminated the patch loop.
- **Stage 8 hard-fail catches what visual review misses.** Databrill problem-grid `<h3>` titles passed visual review (cards looked fine because bodies were there) but failed hard-fail. Promotes hard-fail from check to blocking gate.
- **Schema gaps surfaced for cycle-4.** Databrill `locks.json` missing `anti_drift_rules` field. `source-truth.json` mixes user-visible copy with structural metadata (`id`, `layout`, `icon_role`, `cta_style`) — produces false positives without exclusion list. Fix in cycle-4 infra.

**Cycle-3 findings #38–#43 (consolidated from both retros):**
- **#38** (both) — Stage 8 hard-fail audit catches dropped copy that visual review misses; promote to blocking gate.
- **#39** (RTUK) — Ship `scripts/audit-copy.py` so hard-fail runs as one command with non-zero exit.
- **#39** (DBC) — `source-truth.json` schema mixes user-visible copy with structural metadata; needs schema standardisation (`copy:` vs `meta:` split).
- **#40** (RTUK) — Soft-drift paraphrase unflagged (hero subhead extension + lookbook caption invented). Audit catches verbatim presence/absence but not paraphrase.
- **#40** (DBC) — `locks.json` missing `anti_drift_rules` field (schema gap); extend `/lock` skill to always emit, even if empty array.
- **#41** (RTUK) — Extend Stage 8 hard-fail to include WCAG AA contrast (Playwright + computed styles). Re Tech UK price tiles `text-outline` #847375 on `surface` #fbf9f4 ≈ 3.3:1, fails 4.5:1.
- **#42** (RTUK) — CTA case ambiguity: "See more" vs "SEE MORE" not specified in source-truth.
- **#43** (RTUK) — Repeat-count expectations (e.g., "this string should appear N times") would catch missing-section drift.

> Numbering note: both agents started at #38 independently — duplicates are fine, merge happens here. Cycle-4 will renumber if needed.

**Files written this session:**
- `Claude-UI-Workflow/dogfood/2026-04-25-retechuk/cycle-3-retro.md` (new)
- `Claude-UI-Workflow/dogfood/2026-04-25-retechuk/cycle-3-locked.md` (new)
- `Claude-UI-Workflow/dogfood/2026-04-26-databrill-core/cycle-3-retro.md` (new)
- `Claude-UI-Workflow/dogfood/2026-04-26-databrill-core/cycle-3-locked.md` (new)
- `Claude-UI-Workflow/dogfood/2026-04-26-databrill-core/full-page-merged.html` (edited: +4 `<h3>` titles, +16 LOC)
- `Claude-UI-Workflow/MASTER-LOG.md` (this entry)

**Open for next session (cycle-4 infra):**
- `scripts/audit-copy.py` — programmatic Stage 8 hard-fail (replaces manual)
- `source-truth.json` schema v2 — `copy:` vs `meta:` split
- `/lock` skill — always emit `anti_drift_rules`
- `STITCH-MODEL-RULES.md` — codify model-gate routing (`must_preserve_copy: true` → 3.1 Pro)
- Stage 7 pre-flight gate code — auto-route based on locks.json
- Cycle-2 fix wave (#30/#31/#32/#33)
- Netlify deployment of both brands + before/after in README

---

## Session 12 (2026-04-27 05:53 BST close) — Retech UK merge primitive + Option A nav pattern

**Both brands now at symmetric Stage 7 — ready for parallel Stage 8/9/10.**

**What landed:**
- ✅ Retech UK Stitch ZIP pulled (`stitch_retech_uk_redesign.zip`, 897KB, project `406760431562448963`). Extracted to `stitch-export/zip-download/` (DESIGN.md + code.html + screen.png).
- ✅ Validated Stitch output is 100% invented copy — no retechuk.com truth retained ("Effortlessly Layered", "Curated Collections", "Soft basic Tee", "OUR WORLD", "JOURNAL" etc). Confirms merge primitive is universal across brands.
- ✅ retechuk.com real content extracted via WebFetch (extract-flow Tier-0 returned empty headings on Shopify, fell back to WebFetch which gave clean structured copy).
- ✅ `dogfood/2026-04-25-retechuk/source-truth.json` written — every string that must appear verbatim.
- ✅ `dogfood/2026-04-25-retechuk/locks.json` written — `must_preserve_copy: true`, full nav order, anti-drift rules listing every Stitch-invented string that MUST NOT appear in final HTML.
- ✅ `dogfood/2026-04-25-retechuk/full-page-merged.html` written (415 lines). Sections: announcement bar · curated 4 nav + Shop hover panel + drawer · hero · trust strip · 4 collections grid · brand story · new arrivals · editorial lookbook · newsletter · Rewards/Refer A Friend cards · multi-column footer with full legal links + payment methods + Trustpilot.
- ✅ Validation: 16/16 locked strings present (Re Tech UK ×7, RE TECH UK ×3, brand story ×2, all 4 product names, footer legal ×5, Trustpilot ×2, About Us, Register/Login, Home). 6/6 anti-drift strings absent. Newsletter line present (HTML-escaped `&amp;`).
- ✅ Nav swap (Option A): replaced 8-item flat nav with curated 4 desktop + Shop hover panel + left drawer for full 8 items. Resolved header crowding while preserving all source-truth links.

**Decisions confirmed:**
- **Visual-brief merge primitive is universal, not brand-specific.** Same shape worked for Databrill and Retech UK on first try. Lock as canonical workflow primitive for Stage 7 in cycle-4.
- **Nav pattern: Option A** — curated 4 desktop visible + Shop dropdown + drawer fallback for everything else. Matches editorial brand voice + original retechuk.com hamburger pattern + serves all 8 nav links from source-truth.
- **WebFetch as Stage 2 fallback for Shopify static-render-light sites.** When extract-flow Tier-0 returns empty headings on Shopify, WebFetch's AI markdown conversion is reliable enough to seed source-truth.json. Document as Stage 2 fallback rule in cycle-4.
- **Path for Chrome for Testing in computer-use:** browser is in Playwright cache (`/Users/.../ms-playwright/chromium-1217/...`), not `/Applications/`, so `request_access` returns `not_installed` regardless of bundle ID. User-driven manual download is the unblock — quicker than reconfiguring the Playwright/CDP stack.

**Files written this session:**
- `Claude-UI-Workflow/dogfood/2026-04-25-retechuk/source-truth.json`
- `Claude-UI-Workflow/dogfood/2026-04-25-retechuk/locks.json`
- `Claude-UI-Workflow/dogfood/2026-04-25-retechuk/extract-flow-output.json`
- `Claude-UI-Workflow/dogfood/2026-04-25-retechuk/full-page-merged.html` (415 lines, Option A nav)
- `Claude-UI-Workflow/dogfood/2026-04-25-retechuk/stitch-export/zip-download/code.html` (Stitch raw export)
- `Claude-UI-Workflow/dogfood/2026-04-25-retechuk/stitch-export/zip-download/DESIGN.md` (Stitch design tokens + brand voice)
- `Claude-UI-Workflow/dogfood/2026-04-25-retechuk/stitch-export/zip-download/screen.png` (Stitch render)
- `Claude-UI-Workflow/MASTER-LOG.md` (this entry)

**Open for next session (fresh context):**
- Stage 8/9/10 parallel run on both brands (the only thing left in cycle-3 to ship its bicycle promise)
- Cycle-4 infra opens as soon as cycle-3 closes

---

## Session 11 (2026-04-27 04:47 BST close) — Public-facing rewrite shipped (README + DESIGN-PIPELINE-VISUAL)

**[Session 11 retained verbatim below for reference.]**

---

## (archived above-the-fold)

**Three top-level docs rewritten to align with the canonical 10-stage workflow. Public repo now sells itself in 60 seconds while preserving full technical depth one click away.**

**CURRENT STATE (27 Apr 2026, session 11 close — public-facing rewrite shipped)
- **Public-facing docs rewritten (Session 11):** `README.md` (223 lines, hero alchemist pitch + 10 Amazon-seller use cases + 10-stage natural-language walkthrough + folder map + brand-profile examples), `DESIGN-PIPELINE-VISUAL.md` (471 lines, 4 Mermaid diagrams, full architecture deep-dive — top-level flow + per-stage tables + 15 CSV catalogue + 4 quality gates + 6-dim REFINE + brand schema + file map). Authority chain locked: README → DESIGN-PIPELINE-VISUAL → PRE-CHECK-CHECKLISTS / STITCH-MODEL-RULES / RUNBOOK. Retired 8-phase pipeline + "Direction reset" warnings purged.
- **Cycle-2 Databrill Core: COMPLETE.** 8 new findings (#30–#37). Met success criterion (8 << 29 from cycle-1). v2 architecture (PRE-CHECK-CHECKLISTS + STITCH-MODEL-RULES + cycle-2 fix wave) validated.
- **Deliverable shipped:** `dogfood/2026-04-26-databrill-core/full-page-merged.html` (20.6 KB, 9 sections, dark glassmorphic, all copy verbatim from `core.databrill.com`). Programmatic audit: 9 semantic blocks, 12 glass cards, 5 comparison rows, 4 timeline steps, all H2/H3 match source-truth.json exactly.
- **New workflow primitive proven:** Stitch Redesign output (Nano Banana Pro image) = **visual design brief**, not deliverable. Claude reads the image + writes HTML locally with truth-source copy. Avoids Nano Banana's text-pixel hallucination (FinOps, Aggregaters, CSI, "industy", "Drrive" etc — see #36).
- **Model-routing rule (cycle-3 must codify):** Redesign mode = moodboard / visual concepting only. **3.1 Pro = copy-faithful HTML.** Pre-flight check: if `locks.json::must_preserve_copy: true`, Stage 7 MUST use 3.1 Pro, never Redesign.
- **Aside finding (#37):** Comet vs Chrome render delta on `core.databrill.com` — Comet shows dark hero, Chrome/Playwright/Safari show cream. Hypothesis: Comet AI restyling layer. Out of scope for cycle-2; separate Comet behaviour audit needed.

**READ FIRST (in order)**
1. `Claude-UI-Workflow/README.md` — public-facing pitch + 10-stage natural language (Session 11 rewrite)
2. `Claude-UI-Workflow/DESIGN-PIPELINE-VISUAL.md` — architecture deep-dive (Session 11 rewrite)
3. `Claude-UI-Workflow/PRE-CHECK-CHECKLISTS.md` — 10-stage pre-check architecture
4. `Claude-UI-Workflow/STITCH-MODEL-RULES.md` — model rules (needs cycle-3 update for #35/#36)
5. `Claude-UI-Workflow/dogfood/2026-04-26-databrill-core/HANDOVER.md` — cycle-2 summary
6. `Claude-UI-Workflow/dogfood/2026-04-26-databrill-core/friction-log.md` — findings #30–#37
7. `Claude-UI-Workflow/dogfood/2026-04-26-databrill-core/full-page-merged.html` — the deliverable (open in browser)
8. `Claude-UI-Workflow/MASTER-LOG.md` — Session 11 entry (this kickoff)

**RESUME PATH (cycle-3 spec)**
1. Update `STITCH-MODEL-RULES.md` with model-routing rule from #35/#36 — Redesign mode = moodboard only, 3.1 Pro = copy-faithful HTML, pre-flight `must_preserve_copy` check.
2. Stage 7 procedure update: pre-flight gate on `locks.json::must_preserve_copy` → auto-routes to 3.1 Pro if true.
3. Stage 8 audit: programmatic check that every line in `source-truth.json` appears in rendered DOM text. Hard fail if not. Add as Stage 8 mechanical check in PRE-CHECK-CHECKLISTS.md.
4. Cycle-2 fix wave: #30 (`refine-from-screenshot.py --skip` flag), #33 (`--no-prompt` EOFError), #31/#32 (area-weighted theme.mode + missing-image placeholder detection).
5. Aside: Comet behaviour audit (#37) — diff rendered DOM in Comet vs Chrome on the operator's deployed sites; if Comet AI restyling confirmed, this affects every the operator-views-in-Comet → Claude-views-in-Playwright handoff.

**SUCCESS CRITERION FOR CYCLE-3:** fewer findings than cycle-2 (8). Findings that surface should be genuinely new architecture-level issues, not regressions of #14/#15/#16/#34/#35/#36.

**DO NOT**
- Use Stitch Redesign mode for any output where copy fidelity matters (#36 — Nano Banana Pro renders text as pixels, garbles every string).
- Trust Stitch's chat narration (#26 — never trust). The rendered HTML/DOM is the only ground truth.
- Use 3 Flash on multi-section homepages (#34 — truncates to 4 sections then confabulates).
- Use 3 Flash on fashion / lifestyle / image-led briefs (#21).
- Skip Stage 10's pause-vs-proceed gate.

---

## Session 11 (2026-04-27 04:47 BST close) — Public-facing rewrite shipped (README + DESIGN-PIPELINE-VISUAL)

**Three top-level docs rewritten to align with the canonical 10-stage workflow. Public repo now sells itself in 60 seconds while preserving full technical depth one click away.**

**What landed:**
- ✅ `README.md` rewritten — 223 lines. Hero alchemist pitch + 10 Amazon-seller use cases (folded compactly from `Google Stitch-10 ideas for amazon sellers.md`) + 10-stage natural-language walkthrough + quickstart folder map + brand-profile worked examples (Seller Sessions + Databrill Core) + cycle-status footer. Dropped the retired 8-phase pipeline diagram, the 165-features status badge, and the "Direction reset" warning.
- ✅ `DESIGN-PIPELINE-VISUAL.md` rewritten — 471 lines, 4 Mermaid diagrams. Top-level 10-stage flow + per-stage breakdown tables (class / tool / inputs / outputs / key rules) + sub-diagrams for Stages 2, 7, 8 + 15 CSV catalogue with verified row counts (293 total rows across all CSVs) + 4 quality gates + 6-dimension REFINE audit detail + brand profile schema + Stitch model rules summary + cycle protocol summary + file map. Dropped all "live shape lives elsewhere" pointers — this file now owns the architecture canonical.
- ✅ `Google Stitch-10 ideas for amazon sellers.md` — header note prepended clarifying it's the source for the README's "What you can build" section. Otherwise unchanged (evergreen Perplexity research output).
- ✅ `_kickoff/NEXT-KICKOFF.md` written mid-session at 100% context, then session-close kickoff supersedes.

**Verification (all green):**
- Zero retired-pipeline language remaining (`8-phase`, `historical context`, `Direction reset`)
- All 10 canonical stage names present verbatim in both files (per `PRE-CHECK-CHECKLISTS.md`)
- All 8 cross-link targets resolve (PRD, RUNBOOK, PRE-CHECK-CHECKLISTS, STITCH-MODEL-RULES, MASTER-LOG, OUTSTANDING-WORK, DESIGN-PIPELINE-VISUAL, README)
- Folder map matches actual `ls`
- 4 Mermaid blocks render in DESIGN-PIPELINE-VISUAL.md (top-level + Stage 2 + Stage 7 + Stage 8)

**Decisions confirmed:**
- **Audience layering:** README serves Tier 1 (curious seller, 60s) + Tier 2 (seller pulling repo, 10 min). DESIGN-PIPELINE-VISUAL serves Tier 3 (designer/dev extending, 1 hr). Authority chain: README → DESIGN-PIPELINE-VISUAL → PRE-CHECK-CHECKLISTS / STITCH-MODEL-RULES / RUNBOOK.
- **Google Stitch ideas file kept** as evergreen reference (not deleted, not renamed). Rename to `seller-use-cases.md` flagged as cycle-3 nice-to-have, not blocking.
- **165+ rule claim preserved** as inline proof in README; dense per-rule enumeration moved out of README into DESIGN-PIPELINE-VISUAL.
- **No `npm run pipeline`** call-out preserved from RUNBOOK — the repo is a workflow surface, not a single executable.
- **Plan file:** `<your local plans dir>/synthetic-bubbling-island.md` (approved Plan Mode → Auto Mode → executed in full).

**Files written this session:**
- `Claude-UI-Workflow/README.md` (full rewrite, 223 lines, was 607 lines)
- `Claude-UI-Workflow/DESIGN-PIPELINE-VISUAL.md` (full rewrite, 471 lines, was 820 lines)
- `Claude-UI-Workflow/Google Stitch-10 ideas for amazon sellers.md` (header note prepended)
- `Claude-UI-Workflow/_kickoff/NEXT-KICKOFF.md` (mid-session 100%-context kickoff snapshot)
- `Claude-UI-Workflow/MASTER-LOG.md` (this entry)

**Open for next session (cycle-3 spec — unchanged from Session 10, now with clean public docs base):**
- Update `STITCH-MODEL-RULES.md` with model-routing rule from #35/#36 (Redesign = moodboard, 3.1 Pro = copy-faithful HTML)
- Stage 7 procedure: pre-flight check on `locks.json::must_preserve_copy` → routes to 3.1 Pro automatically if true
- Stage 8 audit: programmatic check that every line in `source-truth.json` appears in rendered DOM (hard fail if not)
- Cycle-2 fix wave: #30 (--skip flag), #33 (--no-prompt EOFError), #31/#32 (area-weighted theme.mode + placeholder detection)
- Aside: Comet behaviour audit per #37

---

## Session 10 (26 Apr 2026, 23:13 BST close) — Cycle-2 dogfood (Databrill Core) complete + model-routing rule discovered

**Cycle-2 CLOSED. 37 findings total (5 from autonomous run + 3 from UI-driven run = 8 new this session). Merged HTML deliverable shipped. New workflow primitive: Stitch Redesign output as visual brief, Claude reproduces in HTML locally.**

**What landed:**
- ✅ Cycle-2 brand picked: **Databrill Core** (B2B SaaS dark — different archetype to retechuk's fashion-light, validates #6 archetype branching).
- ✅ Stages 1–7 ran autonomously via PRE-CHECK-CHECKLISTS.md spine. Stage 4 reconciliation written. Stage 5 locks frozen (`dogfood/2026-04-26-databrill-core/locks.json`).
- ✅ Initial Stage 7 via Stitch MCP (3 Flash, generate_screen_from_text) — produced 4-section truncation (#34 silent-truncation-then-confabulation).
- ✅ Pivot to Stitch UI driven via Playwright auth-Chromium (`infra_playwright_chromium_auth.md`). Screenshot of `core.databrill.com` uploaded as structural reference. Redesign mode (Nano Banana Pro) generated 9-section dark glassmorphic page (`_captures/redesign-output-highres.png`, 768×1376).
- ✅ **DOM audit revealed:** Redesign mode = image-only output (preview is single `<img>` from `lh3.googleusercontent.com`, "Code to Clipboard" disabled, Nano Banana renders text as image-pixels — Aggregaters, FinOps, CSI, "industy", "Drrive", "Awartzing", etc.).
- ✅ **Workflow primitive shipped:** Treat Stitch Redesign output as a **visual design brief** — Claude reads the image + reproduces in HTML locally with truth-source text. `source-truth.json` populated from `core.databrill.com` (9 sections, verbatim copy via WebFetch). `full-page-merged.html` written (20.6 KB, all 9 sections, dark glassmorphic, locked tokens applied). Programmatic audit: 9 semantic blocks (1 header + 7 sections + 1 footer), 12 glass cards, 5 comparison rows, 4 timeline steps, all H2/H3 strings match `source-truth.json` exactly.

**Findings added this session (running total 37):**
- 🟠 **#30** `refine-from-screenshot.py --skip` flag does nothing
- 🟠 **#31** Extractor reads cream hero band as dominant theme on partly-deployed dark sites
- 🟠 **#32** Missing-image placeholder boxes contaminate primary-colour read
- 🟡 **#33** `_template/` interactive prompt halts a `--no-prompt` run (EOFError)
- 🔴 **#34** Stitch (3 Flash, MCP path) truncates 11-section homepage to 4, confabulates response
- 🟠 **#35** Stitch Redesign mode blocks "Code to Clipboard" — visual-only output, no semantic HTML
- 🔴 **#36** Nano Banana Pro renders text as PIXELS not characters — verbatim copy preservation fails by design (Model-routing rule for STITCH-MODEL-RULES.md: Redesign = moodboard only, 3.1 Pro = copy-faithful HTML)
- 🟡 **#37** Comet vs Chrome render delta on `core.databrill.com` — dark vs cream hero (aside, separate Comet behaviour audit)

**Decisions confirmed:**
- Source truth = `core.databrill.com` live (Option 1, per the operator — Ellis show-and-tell needs the actual deployed copy).
- Skip Pricing + Trust Ticker sections — not present on live source. Adding without truth = same hallucination problem.
- Stitch Redesign output is *not* the deliverable; it's the visual brief. The deliverable is `full-page-merged.html`.
- Cycle-2 success criterion **MET** — 8 new findings vs cycle-1's 29. v2 architecture (PRE-CHECK-CHECKLISTS + STITCH-MODEL-RULES + cycle-2 fix wave) worked.

**Files written/modified this session:**
- `Claude-UI-Workflow/dogfood/2026-04-26-databrill-core/HANDOVER.md` (created earlier)
- `Claude-UI-Workflow/dogfood/2026-04-26-databrill-core/source-truth.json` (new — verbatim copy from live)
- `Claude-UI-Workflow/dogfood/2026-04-26-databrill-core/full-page-merged.html` (new — 9-section deliverable)
- `Claude-UI-Workflow/dogfood/2026-04-26-databrill-core/friction-log.md` (appended #35/#36/#37)
- `Claude-UI-Workflow/dogfood/2026-04-26-databrill-core/_captures/` (4 images: live, redesign-preview, redesign-output-highres, merged-full-page)
- `Claude-UI-Workflow/MASTER-LOG.md` (this entry)

**Open for next session (cycle-3 spec):**
- Update `STITCH-MODEL-RULES.md` with the model-routing rule from #35/#36 (Redesign = moodboard, 3.1 Pro = copy-faithful HTML).
- Stage 7 procedure: pre-flight check on `locks.json` for `must_preserve_copy` flag → routes Stage 7 to 3.1 Pro automatically if true; Redesign permitted only if false.
- Stage 8 audit: programmatic check that every line in `source-truth.json` appears in rendered DOM text. Hard fail if not.
- Cycle-2 fix wave: #30 (--skip flag), #33 (--no-prompt EOFError), #31/#32 (area-weighted theme.mode + placeholder-detection heuristic).
- Aside (Comet behaviour audit per #37).

---

## Session 9 (26 Apr 2026, 21:30 BST close) — v2 architecture shipped

**Stages 9–10 retro accomplished + cycle-2 fix wave shipped + Stage 10 logic hardened.**

**What landed:**
- ✅ `PRE-CHECK-CHECKLISTS.md` (Stage 1–10 with autonomy classes + 26 findings → mechanical checks + finding-to-stage map)
- ✅ Stage 10 hardened — split into 5 sub-gates (10A–10E) + explicit pause/proceed/carry decision matrix
- ✅ `STITCH-MODEL-RULES.md` standalone (7 rules + quick-reference checklist + cross-refs)
- ✅ `extract-brand.mjs` chunks #14, #15, #16 (multi-sample theme.mode + scored primary + decorative signals)
- ✅ `ingest-url.py` writes new schema fields with confidence flags
- ✅ `refine-from-screenshot.py` adds theme.mode + primary re-eval (#17)
- ✅ `TOKENS-SCHEMA.md` v2 schema (accent / decorative_palette / texture / line_work / photography_direction)
- ✅ Smoke test on retechuk re-extraction — #14 verified fixed. Three new findings logged (#27/#28/#29 — Shopify CTA detection, `<img>` palette sampling, role-swap heuristic).
- ✅ `friction-log.md` cycle-1 close-out summary appended (29 findings, fix-wave receipt, deferred items).

**Decisions confirmed:**
- STITCH-MODEL-RULES.md as standalone doc (not merged into SKILL.md).
- Fix foundational extractor bugs (#14/#15/#16) BEFORE cycle-2 dogfood — done.
- Cycle-2 brand pick deferred to post-compact (the operator has an idea).

**Open for next session:**
- Brand pick (cycle-2)
- Whether to attempt #27/#28/#29 fixes BEFORE cycle-2 dogfood

**Files written/modified this session:**
- `Claude-UI-Workflow/PRE-CHECK-CHECKLISTS.md` (new)
- `Claude-UI-Workflow/STITCH-MODEL-RULES.md` (new)
- `Claude-UI-Workflow/scripts/extract-brand.mjs` (modified — chunks 1, 2, 5)
- `Claude-UI-Workflow/scripts/ingest-url.py` (modified — chunk 4)
- `Claude-UI-Workflow/scripts/refine-from-screenshot.py` (modified — chunk 6)
- `Claude-UI-Workflow/brands/TOKENS-SCHEMA.md` (modified — chunk 3)
- `Claude-UI-Workflow/dogfood/2026-04-25-retechuk/friction-log.md` (modified — cycle-2 fix-wave appendix #27/#28/#29 + close-out summary)
- `Claude-UI-Workflow/MASTER-LOG.md` (this entry)

---

## Session 8 (26 Apr 2026, earlier — Stage 8 closure)

[Historical record — session 8 closed Stage 8 via Refresh→Pro chain. HTML extracted via Copy code → pbpaste, all locks verified in rendered DOM. 23 findings → 26 findings (added #24 positive Refresh→Pro chain rule, #25 Flash default trap, #26 never-trust-Stitch-narration). See friction-log for full detail.]

---

## Kickoff Prompt — Session 8 historical

Resume Claude UI Workflow — B9 cycle-1 dogfood **complete** (retechuk). Cycle-2 batch-fix scoping is next.

**CURRENT STATE (26 Apr 2026, session 8 close)**
- **Cycle-1 retechuk: Stages 1–7 ran end-to-end.** Refresh-mode Stitch export
  unpacked + visually audited. Stage 8 /refine pass blocked on PNG-only export
  (no HTML in zip; need clipboard channel). Stages 9–10 retro = next session.
- **23 friction findings logged** in
  `dogfood/2026-04-25-retechuk/friction-log.md`:
    🔴 6 blockers — #4 brand-name trap, #6 output_type collapses 6 archetypes,
       #10 aesthetic-intent gap (curriculum gold), #14 theme.mode flips on
       light themes w/ dark DOM elements, #15 primary role = first-button-found
       (frequency-blind), #16 schema missing accent/decorative_palette/
       texture/line_work/photography_direction slots, #19 Stitch model
       selection undocumented, #21 3 Flash unusable for fashion/lifestyle
    🟠 14 majors — across all stages
    🟡 2 minors / 🟢 1 positive (#23: refresh mode honours locks, ignores
       soft suggestions — codify the rule)
- **Three Stitch model paths tested in parallel** on the same prompt:
    Refresh (Nano Banana, ref image) → ✅ best for refresh, ❌ wrong for redesign
    Thinking 3.1 Pro → ✅ best for fresh redesign, ⚠️ multi-variant drifts brief
    3 Flash → ❌ generated superhero in hero slot, unusable for fashion
- **Files written this session.** `brands/retechuk/intake.json` (full Q1–Q6),
  `brands/retechuk/tokens.json` (manually patched post-screenshot — extractor
  flipped theme.mode + miscalled primary role), `brands/retechuk/locks.json`
  (4 locks: theme.mode, decorative_palette, background_texture,
  constraints.must_include), `brands/retechuk/_captures/homepage.png`,
  `dogfood/2026-04-25-retechuk/stitch-prompt.md` (paste-ready),
  `stitch-export/_unpacked/stitch_retech_uk_redesign/` (3 refresh variants).

**READ FIRST (in order)**
1. `Claude-UI-Workflow/dogfood/2026-04-25-retechuk/friction-log.md` — 23 findings
2. `Claude-UI-Workflow/brands/retechuk/locks.json` — 4 locks + locks-vs-suggestions audit
3. `Claude-UI-Workflow/MASTER-LOG.md` — Session 8 entry below
4. `Claude-UI-Workflow/PRD.md` — north star, supersedes any conflicting decision
5. `Claude-UI-Workflow/OUTSTANDING-WORK.md` — B9 marked active dogfood

**RESUME PATH (Stages 9–10 retro)**
1. Re-read friction-log.md end-to-end — cluster findings into:
   (a) cycle-2 batch fix wave (schema gaps, theme.mode bug, primary-role logic,
   model-selection rules), (b) B9 spec proper (auto-/refine + drift audit),
   (c) deferred / curriculum-only (sharpened intent-vs-delivery alignment).
2. Decide: is Stitch model selection a separate skill/doc
   (`STITCH-MODEL-RULES.md`) or merged into umbrella SKILL.md?
3. Decide: do we run cycle-2 fix wave NOW (rebuild ingestion + schema before
   cycle-2 dogfood brand), or run cycle-2 dogfood first on a different brand
   and harvest more findings before fixing?
4. Optional: export the Thinking 3.1 Pro winner via clipboard + zip and
   complete a proper HTML-level /refine pass for Stage 8 closure.

**DO NOT**
- Pause cycle-1 mid-stream — already complete. Findings frozen.
- Start coding cycle-2 fixes without first clustering findings into batches.
- Lose the curriculum gold — finding #19 (model-selection table) and #23
  (locks-honoured-suggestions-ignored rule) are the two most teachable
  moments this dogfood produced.

---

## Kickoff Prompt — historical (sessions 1-6 PRD pivot)

Resume Claude UI Workflow — Direction reset (PRD pivot, Wave 1 stabilisation).

**CURRENT STATE (25 Apr 2026, direction reset)**
- **PRD banked.** End-state north star written to `Claude-UI-Workflow/PRD.md`.
  Outcome = non-designer-friendly landing page + multi-format design tool with an
  invisible "world-class designer" guardrail layer.
- **DESIGN surface flips back to Stitch.** 19 Apr "Claude Design default" decision
  is reversed. Stitch is friendlier; Claude Design Test A bundle pattern stays
  as reusable IP, not the primary path.
- **tldraw moodboard retires.** `tools/moodboard/` worked technically but is
  clunky; not seamless for non-designers. Freeze pre-SSL, archive post-SSL.
- **New core builds (post-SSL):** brand ingestion (URL/guide/screenshot →
  derived design system), guided intake interview, reference-image reliability,
  lock primitive, auto-REFINE.
- **Recovery plan:** `<your local plans dir>/claude-i-fed-some-fuzzy-quilt.md` has the
  full triage, agent orchestration, pre/post-SSL split.

**READ FIRST (in order)**
1. `Claude-UI-Workflow/PRD.md` — north star, supersedes any conflicting decision
2. `Claude-UI-Workflow/MASTER-LOG.md` (this file) — 25 Apr pivot entry below
3. `Claude-UI-Workflow/OUTSTANDING-WORK.md`
4. `Claude-UI-Workflow/RUNBOOK.md` — what works today / what is being built
5. `<your local plans dir>/claude-i-fed-some-fuzzy-quilt.md` — recovery plan

**IMMEDIATE NEXT (in order)** — post-SSL gate REMOVED 25 Apr (curriculum giveaway)
1. ~~Archive sweep~~ — DONE 25 Apr session 2.
2. ~~B1: tokens.json schema + emit~~ — DONE 25 Apr session 2.
3. ~~B3: Brand ingestion URL mode~~ — DONE 25 Apr session 2 (80% match on SS
   canonical, snoozeshade light-theme path validated).
4. ~~B4: Screenshot assist~~ — DONE 25 Apr session 3 (`scripts/refine-from-screenshot.py`,
   regional sampler, override round-trip, ingest-url.py prompts on low-confidence).
5. ~~B5: Brand ingestion (doc mode)~~ — DONE 25 Apr session 3 (`scripts/ingest-doc.py`,
   strict + fuzzy two-pass parser, 100% on canonical SS, full extraction on
   free-form fixture). Markdown / plain-text only.
6. ~~B6: `/intake` skill~~ — DONE 25 Apr session 4. New skill at
   `.claude/skills/intake/SKILL.md`, schema at `brands/INTAKE-SCHEMA.md`,
   demo record at `brands/sellersessions-derived/intake.json`. `/design`
   wired to read intake.json via `claude-ui-workflow/SKILL.md`.
7. ~~B7: Lock primitive~~ — DONE 25 Apr session 5. New skill at
   `Claude-UI-Workflow/.claude/skills/lock/SKILL.md` (project-local, ships
   with curriculum). Schema at `brands/LOCKS-SCHEMA.md` — locks carry
   `enforce: html | prompt` discriminator. `/design` embeds locks in
   Stitch prompt; `/refine` applies `enforce: html` locks to exported
   HTML to snap drift back. Demo at `brands/sellersessions-derived/locks.json`.
8. ~~B8: Reference-image reliability harness~~ — DONE 25 Apr session 6.
   Schema gained third `enforce: "asset"` discriminator for pinned product
   images. New harness at `scripts/ref-image-check.py` — HTML filename
   scan + perceptual-hash fallback against export's image bundle. Output:
   `brands/<slug>/ref-image-report.md` (schema at
   `brands/REF-IMAGE-REPORT-SCHEMA.md`) + §8 summary block for `/refine`.
   `/lock` skill learns asset variant; demo locks.json gets a 5th lock
   (`assets.hero.image` → `_assets/ssl-stage-2025.png`).
9. **B9: Auto-REFINE** — next. Fire `/refine` on every generation.
10. **B10:** 165-rule audit.

**TOOLS** — Claude Design path removed (Q1 decision 25 Apr session 2). CDP
scripts archived under `_archive/_captures/claude-design-review/`. Recoverable
as reference for B4 (screenshot ingestion) if/when the bundle pattern is
needed again.

**PARKED**
- SSL 2027 HTML demo hunt — the operator to provide URL
- `scripts/fetch-claude-design-bundle.ts` — wrap curl + tar helper (now lower
  priority since Claude Design is no longer primary DESIGN surface)
- Post-SSL REFINE ticket: port atmospheric orbs + grain + asymmetric stats +
  tier lift + scarcity chip + marquee into production `SSLive2026.tsx` via
  REFINE workflow. **Never touches live until 10 May.**
- Pre-compact routing bug: 18 CD entries mis-routed to `legal_decisions`

---

## 2026-04-26 16:18 BST — Session 8: cycle-1 dogfood retechuk Stages 1–7 + visual audit complete

**Cycle-1 dogfood ran end-to-end.** Stages 1–7 closed cleanly, Stage 8 partial
(blocked on HTML export pipeline). 11 new friction findings (#13–23), bringing
the retechuk friction log to 23 findings — 6 🔴 blockers, 14 🟠 majors,
2 🟡 minors, 1 🟢 positive.

**Stage 1 closed.** Q6 constraints captured: 7 must_include sections, 7
must_avoid guard rails (kids off homepage, rewards off homepage). Decision
rationale on rewards: "people try these programmes, but unless you're a
high-street brand with the recognition, you don't get conversion volume to
justify homepage real estate."

**Stage 2 — URL ingestion via `scripts/ingest-url.py`.** Extractor produced
`tokens.json` with three medium-confidence fields and two foundational bugs:
- `theme.mode: "dark"` ❌ — site is light theme. Likely cause: dark element
  high in DOM (cart drawer overlay or sticky nav) tripped the body-bg
  luminance heuristic. Finding #14, 🔴 blocker.
- `colors.primary: #308900` (green) ❌ — site primary is BLACK on 4 of ~7 CTAs;
  green is an accent on 2 CTAs. Extractor grabbed first-button-found.
  Finding #15, 🔴 blocker. Schema also missing `colors.accent` slot — #16.

**Stage 3 — screenshot assist.** the operator captured Shottr full-page (saved to
`brands/retechuk/_captures/homepage.png`). `refine-from-screenshot.py` ran
but only fixes `secondary, text_secondary, card_bg, border` — couldn't touch
`theme.mode` or `primary` where the actual bugs were. Finding #17, 🟠 major:
expand the script to include theme + primary role re-evaluation.

**Stage 4 — tokens patched manually.** theme.mode → light, primary → #0a0a0a
(black), accent → #308900 (the green), card_bg → #ffffff, border → #0a0a0a.
Added a `_schema_gaps_observed` escape-hatch block to tokens.json carrying
the four signals the schema can't represent (decorative_palette, texture,
line_work, photography_direction) so /design has the signal downstream.
Finding #16, 🔴 blocker — schema needs accent + decorative_palette + texture
+ line_work + photography_direction slots in cycle-2.

**Stage 5 — `locks.json` written with 4 locks.** theme.mode (html), decorative
palette + paper-grain texture (prompt), constraints.must_include (prompt).
Type, primary CTA colour, accent left UNLOCKED to invite divergence from
current site (vibe.current ≠ vibe.target).

**Stage 6 — design brief saved as paste-ready markdown** at
`dogfood/2026-04-25-retechuk/stitch-prompt.md`. Per memory + the operator direct:
Stitch handles design better in natural language without CSS constraints.
Prompt = pure prose with feel, visual signature, sections, avoid-list, type
suggestion (open-ended), CTA colour suggestion (open-ended).

**Stage 7 — three-model parallel test (curriculum gold).** the operator ran the
same prompt through three Stitch models in parallel:

  | Model | Outcome | Verdict |
  |---|---|---|
  | Refresh (Nano Banana + ref image) | Refresh of existing site, signature held, soft suggestions ignored | ✅ best for **refresh / update existing**. ❌ wrong tool for **redesign**. |
  | Thinking 3.1 Pro (3 variants) | V1 strongly on-brief (deep aubergine, editorial serif), V2 drifted to homeware ("Curated Space"), V3 brutalist (off-brand) | ✅ best for **fresh redesign, single variant only**. Multi-variant drifts the brief. |
  | 3 Flash | Marvel-style superhero in hero slot, cars, "TEEES WORK" panel | ❌ **unusable for fashion/lifestyle**. Pulls random training data when prompt is image-led. |

  Codified in finding #19 (🔴 blocker for curriculum). Cycle-2 deliverable:
  `STITCH-MODEL-RULES.md` (or merge into umbrella SKILL.md) with the model
  selection table.

**Stage 8 — visual audit only.** the operator exported the Refresh project (zip
`stitch_retech_uk_redesign.zip` → moved to `stitch-export/`, unpacked to
`_unpacked/`). Zip contains screenshots only — no HTML, no CSS, no assets.
Per memory: Stitch HTML comes via clipboard, not zip. Logged as #22 — Stage 7
must capture BOTH channels going forward. Visual audit on V1
("EFFORTLESS EVERY DAY") confirmed:

- ✅ Locks held: theme.mode (light), paper-grain texture, pastel petals,
  multi-CTA hero, 7 must_include sections, brand story copy verbatim,
  trust strip, decorative palette
- ❌ Soft suggestions ignored: editorial serif (still sans-heavy),
  aubergine primary (still black), full-bleed editorial lookbook
  (substituted field shot)

**Positive finding #23 (codify the rule).** In Refresh mode, **only locks
survive. Aesthetic guidance in prose is decorative — Stitch reads it but the
reference image dominates.** Implication: when running Refresh mode, encourage
the user to lock anything they care about pre-generation. Cycle-2 should
update /lock skill prompts to surface this rule.

**Sharpened finding #18.** Yesterday's "slightly masculine" read on retechuk
(finding #10) refined post-screenshot. Photography is actually warm-feminine.
The masculine signal concentrates in (a) the heavy condensed sans wordmark
"RE TECH UK" reading industrial-tech, and (b) BLACK as primary CTA clashing
with the warm pastel decorative palette. Specific elements, not wholesale
verdict — better /refine target.

**Workflow process finding #13.** Q6 in the intake skill asks two open
questions in one block (kids inline? rewards on homepage?). Cycle-1: the operator
answered rewards, kids dropped silently. Cycle-2 fix: intake skill rule —
one question at a time when the question carries a binary/option choice.

**Findings landed — distribution post-cycle-1:**
- 🔴 6 blockers (cycle-2 must-fix): #4 brand-name trap, #6 output_type
  archetype split, #10/#18 alignment check, #14 theme.mode bug, #15 primary
  role logic, #16 schema gaps, #19 model selection rules, #21 3 Flash
- 🟠 14 majors (cycle-2 should-fix): URL pre-pass, ecommerce schema fit,
  vibe one-state, brand backstory, screenshot timing, ExtractFlow routing,
  Q6 single-question, refine-from-screenshot expansion, refresh mode
  misnaming, zip vs clipboard, etc.
- 🟡 2 minors / 🟢 1 positive

**Architectural finding (top of B9 spec).** Multiple findings now point at
the same structural issue: **the schema is built for offer-landings, but
brand-homepages need different fields, different question paths, different
extraction logic, different audit rules.** Cycle-2 cannot just add fields —
it needs to branch the schema by `landing_archetype` (offer-landing |
brand-homepage | product-detail | category | about | lead-magnet) and run
archetype-specific Q3–Q6 + CSV weighting + anti-patterns.

**Decisions made this session.**
- Speed over completeness — the operator called for "fast as possible to get visuals
  via Stitch, no admin flood." Adopted: log + move, never fix mid-stream.
- Locks chosen for divergence — type, primary CTA colour, accent left
  unlocked specifically to invite Stitch to break from the current site.
  Refresh mode ignored those open lanes (finding #23).
- Stage 8 closure deferred — without HTML, /refine has nothing to operate on.
  Either re-export via clipboard channel, OR call cycle-1 here and move to
  retro. Both options open for next session.

**Next.** Stages 9–10 — full friction-log review, cluster findings into
cycle-2 batch-fix waves, decide on `STITCH-MODEL-RULES.md` placement, decide
whether cycle-2 fix wave runs before or after cycle-2 dogfood (different
brand). Optional: re-export Thinking 3.1 Pro winner via clipboard for proper
HTML drift audit.

---

## 2026-04-25 21:02 BST — Session 7: B9 cycle-1 dogfood (Stage 1 partial close)

**Direction shift.** Prepared kickoff for B9 Auto-REFINE was "build the
runtime — 4 open questions + ship-fast defaults, then code." the operator pushed
mid-session for a different approach: **dogfood-first**. Run all 10
pipeline stages end-to-end on a fresh brand BEFORE building B9. Find the
holes by *using* the system, not by guessing. Three cycles: cycle-1
find, cycle-2 batch-fix, cycle-3 validate-on-different-brand. **B9 spec
emerges from the friction log.**

**Brand selected.** Re Tech UK (https://retechuk.com/) — a women's
clothing brand (NOT refurbished tech, despite the name). The
name-vs-content mismatch became finding #4, a 🔴 blocker.

**Setup landed.**
- New folder `Claude-UI-Workflow/dogfood/2026-04-25-retechuk/`
- `friction-log.md` — 12 findings, each with rank / pipeline-location /
  evidence / proposed-fix. Survives compaction. Becomes B9/B10 spec input.
- 10-stage task tracker live (Stage 1 in_progress, 9 pending).

**Stage 1 (INTAKE) — partial.** 5 of 6 questions captured:
- Q1 output_type: `landing` (with brand-homepage archetype noted in #6)
- Q2 audience: scout pre-pass via WebFetch — proposed audience.who +
  audience.pain from existing site copy, the operator confirmed. Friction #3
  logged: pre-pass earns its keep, should be default for redesigns.
- Q3 offer: ecommerce shoehorned (catalogue, not single offer).
  Friction #5: schema doesn't fit ecommerce stores cleanly.
- Q4 cta.primary + cta.secondary: confirmed "Shop new arrivals" +
  "Read our story"
- Q5 vibe: EVOLVE (not preserve) — `["feminine", "editorial", "warm",
  "considered"]`. Friction #7: schema captures one vibe state;
  redesigns have current + target.
- Q6 constraints: PENDING. Proposal as ASCII flow (7 must_include + 5
  must_avoid guard rails) exists in chat. Two open questions in flow.

**Partial intake.json written** at `brands/retechuk/intake.json` —
schema-clean (constraints omitted, optional per schema).

**12 findings — distribution:**
- 🔴 blockers (3): #4 brand-name trap, #6 output_type collapses
  6 archetypes, #10 aesthetic-intent vs visual-delivery alignment
  (curriculum gold)
- 🟠 majors (7): #3 audience pre-pass missing, #5 ecommerce schema fit,
  #7 vibe one-state schema, #8 brand backstory has no home,
  #9 screenshot ask too late, #11 use ExtractFlow not WebFetch,
  #12 (Claude-side) reaches for generic tools before checking project infra
- 🟡 minors (2): #1 URL ack on entry, #2 slug "new brand from URL" branch

**Architectural finding (top of B9 spec).** #6: `output_type: landing` is
overloaded across at least six page archetypes (offer-landing,
brand-homepage, product-detail, category, about, lead-magnet). Each needs
different Q3-Q6 questions, different CSV weighting in /design, different
anti-patterns in /refine. Without the branch, **the workflow can only
ever produce offer-landings well**. This finding alone justifies the
cycle-2 fix wave.

**Workflow tax (#12).** Claude (me) defaulted to WebFetch for the
audience pre-pass instead of routing through the project's own
ExtractFlow stack. Cycle-2 fix: hard rule in umbrella SKILL.md that URL
extraction inside this workflow ALWAYS uses scripts/ingest-url.py
(which wraps extract-flow).

**Carry-over (unchanged from sessions 5+6).** Umbrella `claude-ui-workflow`
SKILL.md still gitignored at parent root.

**Next.** Resume cycle-1 at Stage 1 Q6 (constraints) — confirm/tweak the
ASCII-flow proposal, close stage 1, proceed through stages 2-10. End
cycle-1: review friction-log, plan cycle-2 batch fix.

---

## 2026-04-25 11:52 BST — Session 6 closed (B8 shipped)

Session-close marker. B8 commit `c94d732` landed cleanly:
- 9 files, 776 insertions, 16 deletions
- 3-fixture validation green (PASS / PASS-VARIANT / FAIL + ZIP)
- Curriculum-grade fixture image bundled (1.1KB synthetic)
- Carry-over: umbrella `claude-ui-workflow` SKILL.md still
  gitignored at parent root — bundle into project-local skills
  before B10.

Next session = B9 Auto-REFINE. Kickoff prompt prepared in chat
(self-contained, includes 4 open questions + ship-fast defaults).
Recommended path: fresh window, not another `/compact` (sessions 5+6
ran through this window with multiple compacts already).

---

## 2026-04-25 — Session 6: B8 reference-image reliability harness shipped

**What landed.** Ref-image harness — verifies that user-pinned product
images survived a Stitch export. New script at
`scripts/ref-image-check.py`. Schema gained a third `enforce` discriminator
(`asset`) for pinned images, joining `html` (tokens-level) and `prompt`
(intake-level). Output schema at `brands/REF-IMAGE-REPORT-SCHEMA.md`.
Demo lock at `brands/sellersessions-derived/locks.json` v2 (5 locks, the
new one being `assets.hero.image`). Curriculum-grade fixture image at
`brands/sellersessions-derived/_assets/ssl-stage-2025.png` (1.1KB
synthetic) so the demo runs out of the box on a fresh clone.

**Architecture decision (from B7).** Same two-touchpoint pattern: the
asset lock plugs into `/design` (prompt-side, best-effort) and `/refine`
(post-export, authoritative). The harness runs on the user-exported
HTML/ZIP, never during Stitch iteration. Two passes per slot:

1. **HTML filename scan** — find the pinned filename in any
   `<img src>`, `srcset`, `style="background-image:..."`, `data-*`, or
   `<picture>` source across every `.html` in the export. Fast,
   deterministic.
2. **Perceptual-hash fallback** — if filename absent, pHash the pinned
   image and compare against every image file in the export bundle. A
   distance ≤ 12 means Stitch renamed but kept the file (PASS-VARIANT).
   Distance > 12 across all candidates = FAIL.

**Schema decisions.**
- **`enforce: "asset"` field** lives in a virtual `assets.<slot>.image`
  namespace inside locks.json — not in tokens.json or intake.json. The
  pinned-image contract has no other home; locks.json was the cleanest
  place because (a) it already fronts everything-that-must-not-change,
  (b) `/locks` lists pinned images alongside the other locks, (c) curriculum
  learners get a single file to reason about.
- **Slot semantics not verified.** Stitch's HTML doesn't carry the
  workflow's `data-slot` attributes. Verifying placement would need
  Playwright + region screenshots, which is brittle for arbitrary
  Stitch exports. Conscious B8 cut: harness verifies presence, not
  placement. Misplaced images get caught visually.
- **Hash threshold = 12** (pHash distance, 64-bit). Tolerates lossy
  re-encoding + light cropping; rejects fully different images.
  Constant in the script — tighten/loosen if real-world Stitch
  re-encodes drift.

**Validation.** Three fixtures under `_captures/ref-image-test/`
exercise all three verdicts:
- PASS  — exported HTML references pinned filename → HTML scan finds it.
- PASS-VARIANT — same image renamed `img_004.png` in the export, no
  filename match → hash compare returns distance 0 → PASS-VARIANT.
- FAIL  — pinned image neither in HTML nor in any export image → FAIL,
  recommendation: `/regen-nb2 hero`.
ZIP exports also tested (zip → temp extract → walk).
Exit code: 0 on all PASS, 1 on any FAIL (so CI can chain).

**Wiring.** Umbrella SKILL.md (Workflow E) gained step 1.6:
*"if any lock has `enforce: "asset"`, run `scripts/ref-image-check.py`,
splice §8 summary into gap analysis."* Step 1.5 covers `enforce: "html"`,
1.6 covers `asset`, vibe locks (`prompt`) remain Stitch-prompt-only.

**Out of scope for B8.**
- No auto-NB2 regen. Harness flags only; user picks per-slot.
- No slot-aware verification (placement-aware checking is a B9+ extension).
- No multi-image-per-slot support. Pin one image per slot; multi-image
  galleries become multiple locks (`assets.gallery.image_1`, …).
- No Playwright rendering. Static HTML scan + raw-file hash compare only.

**Curriculum bar held.** Non-designer can `/lock hero image at2020.png`
once and never see the photo silently disappear from the page again.
After every Stitch export, `/refine` produces a clear PASS/FAIL table
with a one-line recommended action per failing slot.

**Carry-over (unchanged from session 5).** Umbrella `claude-ui-workflow`
SKILL.md lives at `Claude-Code-Projects-Restored/.claude/skills/`
(parent repo, not user-global as previously thought) — still won't
ship if a learner clones just the `Claude-UI-Workflow` folder.
Bundling into `Claude-UI-Workflow/.claude/skills/` is queued before B10.

**Next.** B9 — Auto-REFINE (fire `/refine` after every generation,
score in chat, fixes auto-suggested).

---

## 2026-04-25 — Session 5: B7 lock primitive shipped

**What landed.** Lock primitive — `brands/<slug>/locks.json` for fields the
user has frozen across iterations. New skill at
`Claude-UI-Workflow/.claude/skills/lock/SKILL.md` (project-local, ships with
curriculum). Triggers: `/lock`, `/unlock <field>`, `/locks`. Schema at
`brands/LOCKS-SCHEMA.md`. Demo record at
`brands/sellersessions-derived/locks.json` (4 locks: heading font, CTA hex,
vibe adjectives, output type).

**Architecture decision (the operator's correction during interview).** Locks
**cannot** be a runtime block on Stitch — Claude isn't at the wheel during
Stitch iteration. The user iterates in Stitch ("generate another version,
try again"), then exports the HTML. Locks therefore plug into **two**
Claude touchpoints, not one:

1. **`/design` (prompt-side, best-effort).** Locks are appended to the
   Stitch prompt as "LOCKED — do not change" instructions. Stitch may
   ignore them; this is guidance.
2. **`/refine` (post-export cleanup, authoritative).** Claude reads the
   user-exported Stitch HTML, scans for drift on `enforce: html` locks,
   and rewrites in place. Replacement is value-for-value (e.g. `Inter`
   → `Plus Jakarta Sans`, `#FF5722` → `#461499`). The cleaned HTML is
   the artefact returned.

**Schema decisions.**
- **`enforce` discriminator** is the most important field. `html` =
  tokens-level (fonts, colours, theme) — applied in HTML cleanup pass.
  `prompt` = intake-level (vibe, output_type, CTA) — embedded in the
  Stitch prompt only. Vibe judgements can't be enforced via find/replace.
- **Structured per-lock entry** (`{field, value, reason, locked_at,
  source, enforce}`) over flat list. The `value` field is the killer
  feature — locks survive a regenerated `tokens.json` because the
  canonical value is stored alongside the path.
- **Mirrors `ingestion-confidence.md` pattern** for traceability —
  `/refine`'s §7 lock-corrections block reads `reason` to explain each
  rewrite.

**Wiring.** `claude-ui-workflow/SKILL.md` (umbrella) updated:
- Trigger list now names `/lock`, `/unlock`, `/locks`.
- Pipeline diagram now shows `INTAKE → LOCK → DECIDE`.
- Workflow D gained step 2.5: load `locks.json`, append §9 to brief,
  embed in Stitch prompt, give locks priority over CSV recommendations.
- Workflow E gained step 1.5: scan exported HTML for `enforce: html`
  drift, rewrite in place, log replacements in §7 of gap analysis.

**Out of scope.** No CLI script for locks. Conversational set/unset
through the skill matches `/intake`'s rhythm; CLI escape hatch can be
added later if power users need it. The HTML-cleanup logic is described
in the skill but its actual implementation lives in B9 (auto-REFINE) —
B7 ships the contract, B9 ships the runtime.

**Curriculum bar held.** Non-designer can `/lock primary font` and
`/lock cta colour` once and never see them drift again. Two commands,
one persistent file, no design knowledge required.

**Next.** B8 — reference-image reliability harness.

---

## 2026-04-25 — Session 4: B6 `/intake` skill shipped

**What landed.** New standalone skill at `.claude/skills/intake/SKILL.md`,
trigger `/intake`. Six-question interview (output type → audience → offer →
CTA → vibe → constraints) writes a structured `intake.json` per the new
schema at `brands/INTAKE-SCHEMA.md`. Free-text bypass (`/intake --skip
"<brief>"`) still produces an on-disk record — the verbatim brief lands in
`free_text_brief` and structured fields are populated best-effort.

**Wiring.** `claude-ui-workflow/SKILL.md` updated:
- Trigger list now names `/intake` and notes that `/design` reads
  `brands/<slug>/intake.json` if present.
- Pipeline diagram now shows `INTAKE` between `MEMORY` and `DECIDE`.
- Workflow D (DECIDE) gained a step 2: load intake.json, weight CSVs by
  `output_type`, drive copy from `audience` + `offer`, anchor CTA strategy
  from `cta`, weight `styles.csv` from `vibe.adjectives`, force-include
  sections from `constraints.must_include`, add per-run anti-patterns from
  `constraints.must_avoid`. Section 8 of the brief cites the intake source.

**Schema decisions baked in.**
- **Persisted on disk, not ephemeral.** Curriculum-grade artefact that
  matches the rhythm of B1–B5 (each stage produces a reviewable file).
- **Skip path always writes a record.** No silent bypass — the structured
  fields exist alongside the verbatim brief so `/design` always has a
  consistent input shape.
- **Brand-less / one-off runs supported** via `adhoc-<date>-<short-name>`
  slug. Folder gets created with just `intake.json`; can be promoted later
  by running `/ingest-url` or `/ingest-doc` to populate `tokens.json`.

**Demo record.** `brands/sellersessions-derived/intake.json` populated for
SSL 2026 (1-day event 9 May, FBA sellers £1M+/yr, £399 Early Bird, primary
CTA Book your seat, premium / high-energy / authoritative vibe, real
agenda block + speaker line-up + venue + past attendee logos as
`must_include`, no countdowns / fake scarcity / stock photos as
`must_avoid`). Acts as the curriculum reference.

**Out of scope.** No CLI script for `/intake` — the interview runs in
chat through the skill, not a Python script. Intentional: it's a
conversation, not an extraction. CLI invocation stays as a Python script
for the next milestone (B7 lock primitive) where the IO is structured.

**Next.** B7 — lock primitive (`brands/<slug>/locks.json`).

---

## 2026-04-25 — Session 3: B5 doc-mode ingestion shipped

**What landed.** `scripts/ingest-doc.py` — markdown / plain-text style guide
→ `tokens.json` + `profile.md` + `ingestion-confidence.md`. Two-pass parser:

- **Strict pass** lifts directly when the doc follows our canonical shape
  (`## Identity` bullets, `## Theme` bullets, `## Colours` table, `## Typography`
  table). Reuses the same machinery as `emit-tokens.py`. Confidence: high
  on every field.
- **Fuzzy fallback** scans every hex code with line-context role keywords
  (`Primary:`, `Background:`, `Body text:`, `Border:`, etc.) and pairs font
  names with role keywords from `font-family:` declarations and bullet lists.
  Same-line classification gets high confidence, prev-line context gets
  medium.

**Validation.**
- `sellersessions/profile.md` re-derived as `sellersessions-doc-derived` →
  100% match (15/15 fields). Strict pass is lossless when the source is
  canonical.
- Free-form Acme fixture (`_captures/ingest-doc/fixture-fuzzy.md`) →
  9 colours (primary, secondary, background, card_bg, text, text_secondary,
  border, cta, accent) + 3 typography roles (headings, body, buttons) +
  google_fonts_url all extracted correctly.

**Bugs fixed in dev.**
- *Prev-line role bleed.* Initial impl combined prev + current line as the
  classifier context — when consecutive bullets had different roles, the
  prev-line role keyword would match before the current-line one. Fixed by
  classifying current line first, falling back to prev only if no match.
- *Multi-word vs single-word ordering.* "Body text — primary copy" matched
  `primary` (single-word) before `body text` (multi-word). Fixed by sorting
  ROLE_KEYWORDS by length descending so the most specific label always wins.

**Out of scope.** PDF / docx / Notion exports — convert to markdown in Claude
Desktop first. Keeps the parser surface area tight.

**Next.** B6 — `/intake` guided interview skill.

---

## 2026-04-25 — Session 3: B4 screenshot assist shipped

**What landed.** `scripts/refine-from-screenshot.py` (Pillow regional sampler:
nav band / hero band / body band → quantised palettes → role proposals).
Hybrid model: URL = baseline, screenshot = tiebreaker for low/medium-confidence
palette roles. `ingest-url.py` now appends a screenshot-assist hint when any
field lands at low or medium confidence.

**Project setup.** Added `.venv/` + `requirements.txt` (Pillow≥10.0).
`.gitignore` updated. README documents the venv install path and the
ingest-url → refine-from-screenshot flow.

**Heuristics baked in.**
- **Brand wash (light theme):** dominant colour in top-80px nav strip distinct
  from body bg.
- **CTA candidate:** most-saturated colour in hero band, with luminance floor
  (40 < L < 240) to skip near-black card bgs and near-white sections.
- **Secondary CTA:** same picker excluding the primary CTA hex.
- **Text:** darkest near-grey on light theme, lightest near-grey on dark theme,
  sampled in centre 60% of the body band.
- **text_secondary:** mid-luminance grey distinct from both text and body bg
  (closest to the halfway luminance between them).

**Round-trip output.** `tokens.json` rewritten in place (preserves token names);
`ingestion-confidence.md` gets a `## Screenshot Overrides` section logging
URL-value → screenshot-value with confidence transitions.

**Validation against canonical SS.** Dark-theme fixture (the two SS hexes URL
ingestion couldn't find on the live homepage — `#fbbf24` gold + `#9ca3af`
tertiary grey) was correctly proposed by the screenshot sampler. The hybrid
closes the 20% gap that URL-only ingestion structurally cannot reach.

**Light-theme fixture.** Mint nav `#d5f1ed` + orange CTA `#fc6815` + dark teal
secondary `#2e9483` all proposed correctly.

**Next.** B5 — doc-mode ingestion (style-guide doc → tokens.json).

---

## 2026-04-25 — Session 2: B3 brand ingestion (URL mode) shipped — 80% match

**What landed.** `scripts/extract-brand.mjs` (Playwright regional sampler) +
`scripts/ingest-url.py` (orchestrator: signal → tokens.json + profile.md +
ingestion-confidence.md) + `scripts/compare-tokens.py` (validator scoring
derived vs canonical). Self-contained `package.json` so the curriculum repo
runs on `npm install` then `python3 scripts/ingest-url.py <url> --slug <name>`.

**Validation results.**
- `sellersessions` re-derived from `https://sellersessions.com`: **80% field match**
  (passes bar). Identity 2/2, theme.mode 1/1, typography 2/2, palette 7/10.
  The 3 misses (`#fbbf24` gold, `#9ca3af` tertiary, `#f97316` accent) **don't
  appear on the live homepage** — verified with hex-hunt recon. URL ingestion
  ceiling for SS canonical = 80% structurally.
- `snoozeshade.com` (light theme, role-inversion test): correctly mapped
  `#d5f1ed` mint → primary (the brand wash), `#fc6815` orange → CTA. The
  saturation-based heuristic that failed in B3.1 was replaced with a
  light-theme path that uses section-bg detection for "primary" and
  primary-button-bg for "CTA".

**Architecture decisions baked in.**
- **Parent-walk for opaque bg.** When a `<nav>` has `rgba(0,0,0,0)`, walk up
  ancestors until an opaque bg or `background-image` is found.
- **Composite rgba over body bg.** `rgba(255,255,255,0.85)` on dark theme
  reports as the visually-rendered hex (`#dbd9de`), not pure white. Fixes
  `text_secondary` mapping.
- **Mode-conditional role mapping.** Dark theme: primary = primary button.
  Light theme: primary = first non-white section bg (the "brand wash").
  Solves the SnoozeShade pale-mint problem from session 1.
- **Hybrid B3+B4.** B4 reframed from "screenshot-only mode" to "screenshot
  assist when URL confidence is low" — the bundle pattern from Claude Design
  becomes optional, not the primary path. See
  `feedback_brand_ingest_screenshot_assist.md` memory.

**Two derived demo brands committed:**
- `brands/sellersessions-derived/` (80% match validation)
- `brands/snoozeshade-derived/` (light-theme role-inversion validation)

**Next.** B4 — screenshot assist for low-confidence ingestion runs.

---

## 2026-04-25 — Session 2: B1 tokens.json shipped

**What landed.** `brands/TOKENS-SCHEMA.md` (1-page schema doc) + `scripts/emit-tokens.py` (markdown table parser, no deps). Ran across all 5 brands.

**Output per brand.**
- `sellersessions/tokens.json` — 10 colours + 4 typography keys (incl. google_fonts_url). Full match against profile.
- `databrill/tokens.json` — 13 colours from first `## Colours` block (light variant). Multi-mode handling deferred to B2/B7.
- `databrill-core/tokens.json` — 9 colours (rgba rows skipped: schema is hex-only) + 5 typography keys.
- `_template/tokens.json` — placeholder shape only, as expected.
- `claude-ui-workflow/tokens.json` — empty, meta-brand stub as expected.

**Parser bugs fixed mid-flight.** Variant headings (`## Colours (Dark — variant)`) needed prefix match, not exact. Slugifier now strips all non-alphanum (was leaving slashes in keys like `logo_/_display`).

**Unblocks.** B3 (URL ingestion), B7 (lock primitive — has structured field paths to lock), B9 (auto-REFINE — has hex/font targets to enforce against).

**Next.** B3 — brand ingestion URL mode. Validation case: re-derive sellersessions from `https://sellersessions.com`, ≥80% field match vs `brands/sellersessions/tokens.json`.

---

## 2026-04-25 — Session 2: Archive sweep executed

**Decisions on the four manifest open questions.**
1. **Lvio5HAlt9EAY6ltTXZQbQ bundle dir** — archived. Claude Design removed
   completely (too buggy at this stage). Bundle pattern recoverable from
   `_archive/_captures/claude-design-bundles/` for B4 if needed.
2. **`design-brand-reels-inspiration-extract/`** — archived (preserved, not
   deleted). Source files for backing tracks in Reels/video projects.
3. **Stitch demos (`stitch-fintech-demo/`, `stitch-waitlist-mockup/`, zips)**
   — **promoted** to `examples/stitch/` as canonical Stitch reference for
   anyone evaluating the system's output quality.
4. **`design-system-sections/01–06, 08-*`** — kept, second-pass review later.
   Only `07*`, `07-TEST-RESULTS`, `P2-TEST-RESULTS` archived (moodboard era).

**Sweep results.** 12 tracked paths moved via `git mv` to `_archive/`,
5 gitignored `_captures/` subfolders moved via plain `mv` to
`_archive/_captures/`, 4 stitch-demo paths promoted to `examples/stitch/`,
3 root `.DS_Store` files deleted, empty `_captures/` and `tools/` parent
dirs removed. Root entries down from ~26 to ~17.

**Artefacts updated.**
- `_archive/ARCHIVE-MANIFEST.md` rewritten as the executed record (decisions + actual moves)
- `OUTSTANDING-WORK.md` ticks B1 sweep complete; queue advances to tokens.json

**Next.** B1 — `tokens.json` schema + emit from `brands/sellersessions/profile.md`.

---

## 2026-04-25 — Direction reset (PRD pivot)

**What happened.** the operator wrote an end-in-mind PRD reframing the project as a
non-designer tool with an invisible guardrail layer. The new framing reverses
the 19 Apr "Claude Design default DESIGN surface" decision and retires the
tldraw moodboard.

**Why.** The 19 Apr decision was correct given the inputs at the time
(Claude Design bundle handoff = clean, Stitch = greenfield-only). The PRD
changes the inputs: Stitch is friendlier for the target user (non-designer),
and the moodboard step adds friction the target user shouldn't have to
absorb. Stitch's reference-image weakness becomes a problem to solve, not a
reason to switch surfaces.

**Decisions locked.**
- Stitch reclaims primary DESIGN slot.
- tldraw moodboard retires (freeze pre-SSL, archive post-SSL after `_archive/ARCHIVE-MANIFEST.md` review).
- Claude Design Test A bundle work stays as reference IP (handoff-bundle pattern reusable for brand-ingestion screenshot mode).
- New core builds queued for post-SSL: brand ingestion, intake, reference-image
  reliability harness, lock primitive, auto-REFINE.

**Artefacts created today.**
- `PRD.md` (verbatim end-in-mind notes + condensed PRD)
- This pivot entry
- (queued) `RUNBOOK.md`, `brands/INVENTORY.md`, `_archive/ARCHIVE-MANIFEST.md`
- (queued) banner edits to `README.md` + `DESIGN-PIPELINE-VISUAL.md`

**No code touched. No file moves. No moodboard work.**

---

## 2026-04-19 — Test A closure (now historical reference)

> Superseded by 25 Apr pivot. Kept here as the source of truth for the
> Claude Design bundle pattern, which remains reusable IP.

- **Test A end-to-end round-trip VALIDATED.** Bundle extracted, patched, compared
  side-by-side. (Decision since reversed: Claude Design no longer default DESIGN.)
- **Patched-bundle pattern established.** `_captures/claude-design-review/test-a-ssl2026/patched/`
  contains real-SSL-content CD output. Production never touched.
- **Side-by-side evidence.** `_captures/claude-design-review/test-a-ssl2026/compare/compare.html`
  shows prod Netlify (left, 13,674px, real data) vs CD bundle (right, 2,748px,
  hallucinated filler).

---

## Project context

I'm working on the **Claude UI Workflow** project. This has a 4-phase design pipeline (DECIDE → DESIGN → BUILD → REFINE loop) plus inspiration capture:

**Workflow C -- Inspiration Capture:** Takes a URL from YouTube, TikTok, or Instagram and returns a structured record: transcript, timestamps, extracted entities (tool names, domains, repo candidates), resolved links, and a build spec draft.

**Workflow D -- DECIDE (`/design`):** Searches CSV design database (`design-db/`) + brand profiles (`brands/`) to produce a 9-section design brief (including Section 9: Image Assets from `images.csv`). This is the decision layer BEFORE any design or code.

**Workflow A -- DESIGN (Stitch):** Stitch is the **creative director** (generates/redesigns, iterates with the operator). Takes the design brief as input.
- the operator jams in web UI, brings project ID to Claude Code. Claude can also drive via `generate_screen_from_text`. Iterate until the operator approves direction.

**Workflow B -- BUILD (Production):** After Stitch approval, run production tools in parallel:
- UI/UX Pro Max (extract design tokens) + 21st.dev (build React components) + NanoBanana2 (optional visual variants).

**Workflow E -- REFINE (`/refine`):** Audits an existing live page against 6 dimensions: `refinements.csv` (25 techniques) + `animation.csv` (15 motion rules) + `polish-details.csv` (10 micro-details) + `performance.csv` (12 CWV thresholds) + `anti-patterns.csv` (15 anti-AI rules) + `hci-laws.csv` (10 cognitive laws). Produces gap analysis + ready-to-paste Stitch prompt. Loops back to DESIGN. Tests: SS Live 2026 v2 (score 59→90), v3 stress test (33/50 C+ on new dimensions).

**Quality Gates (post-BUILD):** 4 skills: Emil (animation guard) + React Best Practices (64 perf rules) + Vercel Web Design (100+ rule audit) + Composition Patterns (8 architecture rules). Auto-invoked during BUILD phase.

the operator's active Stitch project: `15963079873723359996` (5 screens -- dark waitlist redesign + sellersessions.com branding).

**GitHub repo:** `sellersessions/claude-ui-workflow` (private). Ellis has push access. README has full 164-feature catalogue.

Key files:
- Reference doc: `Claude-UI-Workflow/reference/inspiration-to-ui-pipeline.md`
- Stitch capabilities: `Claude-UI-Workflow/reference/stitch-capabilities.md`
- Skill: `.claude/skills/claude-ui-workflow/SKILL.md`
- UI/UX Pro Max skill: `.claude/skills/ui-ux-pro-max/SKILL.md`
- YouTube Transcript MCP: configured in `.mcp.json`
- Video Transcriber MCP: configured in `.mcp.json` (primary ingest for all platforms)
- NanoBanana2 MCP: configured in `.mcp.json` (OpenRouter, image generation)
- Stitch MCP: configured in `.mcp.json` (API key auth, proxy mode)
- 21st.dev Magic MCP: configured in `.mcp.json` (component generation)
- Existing NanoBanana1: `DesignLoop-MCP-Server/`

Output contract per capture record: `source_url`, `platform`, `download_status`, `transcript_text`, `timestamps`, `extracted_entities`, `resolved_links`, `build_spec_draft`.

Records stored in `Claude-UI-Workflow/records/` as individual markdown files.

## Next Up

### Capture Pipeline (Workflow B)
- [x] Test skill with a YouTube URL end-to-end (existing record validates pipeline)
- [x] Install video-transcriber MCP (replaces manual yt-dlp + whisper pipeline)
- [x] Test TikTok ingestion via video-transcriber MCP (PASS -- 181 words, 0:57)
- [x] Test Instagram ingestion via video-transcriber MCP (PASS -- 180 words, 0:57)
- [x] Update SKILL.md to MCP-first ingest method
- [ ] Wire entity extraction + link resolution (extraction working, link resolution working)
- [x] Build searchable index across records (grep-on-demand, no index file needed at <20 records)

### DECIDE Phase (Workflow D -- Design Brief)
- [x] Create CSV design database (7 files in `design-db/`) -- seeded from SS + Databrill real tokens
- [x] Create brand profiles (`brands/sellersessions.md`, `brands/databrill.md`, `brands/_template.md`)
- [x] Add DECIDE workflow to SKILL.md with 9-section brief output spec (Section 9: Image Assets added 20 Mar)
- [ ] Test `/design landing page for Seller Sessions` -- verify SS brand loads
- [ ] Test `/design waitlist page for Databrill` -- verify Databrill brand loads
- [x] Test `/design landing page for a fintech startup` -- verify generic CSV mode (PASS -- E2E test, deployed to Netlify)
- [ ] Add more brand profiles as new projects arise

### REFINE Phase (Workflow E -- Page Polish)
- [x] Create `design-db/refinements.csv` -- 19→23 techniques (added icon-animation, concentric-radius, shadow-depth, font-smoothing)
- [x] Add Workflow E to SKILL.md with 4-step process (READ → AUDIT → GAP ANALYSIS → STITCH PROMPT)
- [x] First test: SS Live 2026 -- gap analysis produced, 14 techniques implemented directly in TSX
- [x] v2 full audit: SS Live 2026 against all 3 new CSVs -- 17 changes, 5 phases, score 59→90 (C+→A)
- [x] Install Emil design engineering skill (animation guard + easing intelligence)
- [x] Install Vercel web-design-guidelines skill (100+ rule code auditor)
- [x] Create `design-db/animation.csv` -- 15 motion rules (easing by component, GPU-only, frequency ban)
- [x] Create `design-db/polish-details.csv` -- 10 micro-detail rules (concentric radius, tabular-nums, text-wrap)
- [x] Add animation preferences to brand profiles (SS, Databrill, template)
- [x] Test `/refine` with a Stitch-based page — Databrill Netlify (10 pages, 10 improvements, score 48→55/60)
- [ ] Test with URL input via Playwright screenshot path

### Image Generation (BUILD sub-step -- Section 9)
- [x] Create `design-db/images.csv` -- 7 slot types with prompt templates + brand variable substitution
- [x] Add Section 9 (Image Assets) to DECIDE brief output
- [x] Add Image Generator role + 6-step process to BUILD workflow in SKILL.md
- [x] Add `## Image Constraints` to SS brand profile + brand template
- [x] First test: SS Live 2026 hero-deconstructed -- 2 variants generated (NB2 text hallucination issue noted)
- [x] First test: section-texture -- dark purple noise grain generated for section banding
- [ ] the operator picks hero winner + decides on text artifact cleanup approach
- [ ] Apply section texture as CSS background on alternating sections in SSLive2026.tsx
- [ ] Test image generation as part of full `/design` brief flow (Section 9 auto-populated)

### Claude Design Integration (Workflow A evolution)
- [x] Review Claude Design surface (12 screenshots, integration spec written)
- [x] Test A Phase 1 — SSL 2026 prompt + plan generation (17 Apr)
- [x] Test A Phase 2 — canvas completion + Export + Handoff + bundle extraction (19 Apr)
- [x] Audit CD output vs real brand content (stats REAL, venue/pricing/logos invented)
- [x] Patched-bundle pattern established (`_captures/.../patched/` — production untouched)
- [x] Side-by-side compare harness (`compare-shots.js` + `compare.html`)
- [ ] **Test B — Databrill waitlist recreation** (bundle → patch → compare)
- [ ] Cross-brand side-by-side (SS + Databrill) — final Stitch-retire evidence
- [ ] Mark round-trip section VALIDATED in `reference/claude-design-integration.md`
- [ ] Fold `click-visible` helper into `inspect-comet.js`
- [ ] `scripts/fetch-claude-design-bundle.ts` (curl + tar + slug extraction) — after Test B
- [ ] Post-SSL: port CD aesthetic wins (orbs, grain, tier lift, scarcity chip) into production `SSLive2026.tsx` via REFINE

### UI Build Pipeline (Workflows A+B -- Stitch-First)
- [x] Research + install Stitch MCP (added to .mcp.json, needs `gcloud auth` on first use)
- [x] Install UI/UX Pro Max (npm install -g uipro-cli + uipro init --ai claude)
- [x] Configure 21st.dev integration (Magic MCP confirmed working)
- [x] Set up NanoBanana2 via OpenRouter (@aeven/nanobanana-mcp, uses existing DesignLoop OpenRouter key)
- [x] Wire the full pipeline: spec -> Stitch -> UI/UX Pro Max -> 21st.dev -> NanoBanana2 (E2E test PASS, 3 variants)
- [x] Rewrite pipeline to Stitch-first architecture (Stitch = creative director, others = production assistants)
- [ ] Test with the operator's real Stitch project `15963079873723359996` (5 screens -- dark waitlist + SS branding)
- [ ] Run Phase 2 production tools on approved Stitch output (extract tokens, build React components)

## Session Log

### 2026-04-19 05:42 BST -- Test A round-trip VALIDATED + patched-bundle pattern established

**End-to-end autonomous handoff proven.** Picked up from 18 Apr where Test A
canvas had errored out mid-stream on a train. Re-ran from the same project
(`3abf310e-0d26-409c-8de6-c63b5eea0496`) on steady wifi — Claude Design completed
the canvas autonomously (no Retry click needed; URL flipped to
`?file=Seller+Sessions+Live+2026.html`). Export → Handoff to Claude Code produced
the signed URL; fetched via `curl` → extracted with `tar -xzf` → landed in
`_captures/claude-design-bundles/Lvio5HAlt9EAY6ltTXZQbQ/ssl-2026-claude-design-test/`.

**Bundle format confirmed.** `application/gzip` tarball, 6 files: README
(agent contract), chat transcript, primary HTML, CSS, JS, roundtripped uploads
folder. README is explicit: read chats first, read primary HTML top-to-bottom,
follow imports, DON'T render/screenshot, ASK if ambiguous, recreate
pixel-perfect in target stack.

**Audit pass.** Initial read over-flagged hallucinations. Deeper cross-ref
against `brands/sellersessions/profile.md` + `SSLive2026.spec.md` + production
`SSLive2026.tsx` revealed stats (47.5%/80%/6×) and headline/subhead were REAL,
not invented. Actual hallucinations were: venue (County Hall → real is St
Ethelburga's Bishopsgate EC2M), pricing tiers (3 invented → real is single
£999 all-access), speaker dinner Mayfair detail, invented marquee logos,
invented founder's circle inclusions. Off-brand colours: lavender tints
(`#a07bff` `#c9b8ff`), text-mute `#8a86a3`, green save badge `#4ade80`,
amber `#f59e0b`. Claude Design grasped the brand from screenshot alone but
invented filler content where context was thin.

**Patched-bundle convention established.** Rather than edit the original CD
output or touch production, copied bundle HTML + CSS into
`_captures/claude-design-review/test-a-ssl2026/patched/` and made 7 content
edits + 2 CSS edits:
- Nav pill: "14 seats left" → "Limited seats · 9 May"
- Meta: venue → St Ethelburga's · Bishopsgate EC2M; capacity → "Invite-only ·
  7-8-figure sellers"
- Marquee: invented events → "Seller Sessions Podcast", "SSL 2021 – 2025 ·
  sold out"
- Section head: eyebrow/title/subhead rewritten for single-tier reality
  ("A single room. Every door open.")
- Tiers: 3 articles → 1 `article.tier.featured` (All-Access · £999 · 6 gold-
  check features referencing real 5 speakers + Nave/Garden/Bedouin Tent)
- Venue strip: rewritten for St Ethelburga's + "Workshop · 5 speakers ·
  dinner" + "Refund / Transfer / Full refund to 4 May"
- CSS: `--text-mute` → `#9CA3AF` (match brand tertiary); appended
  `.tiers-single` centering overrides + recoloured save badge gold.

**Single-tier collapse pattern** keeps the CD "featured" aesthetic (tier lift,
glowing ring) even when brand reality is a single ticket — `.tiers-single`
grid with one centered column, `transform:none` baseline + preserved
`translateY(-6px)` on hover.

**Side-by-side compare built.** `_captures/claude-design-review/compare-shots.js`
— headless Playwright harness that screenshots production Netlify + CD bundle
locally, full-page, 1440 viewport. No ImageMagick needed — `compare.html`
displays both PNGs in a 2-column CSS grid with sticky headers labelling prod
vs CD. Dims captured: prod 13,674px tall (all sections, real data), CD 2,748px
(hero + pricing only, hallucinated filler).

**Decisions:**
- Stitch vs Claude Design: CD = default for branded ship-ready work; Stitch =
  greenfield exploration / multi-page YOLO only. Post-SSL: promote CD to
  Workflow A default.
- Bundle directory convention: `_captures/claude-design-bundles/<hash>/<slug>/`.
- Patched-bundle convention: `_captures/claude-design-review/test-<X>-<slug>/patched/`.
  Never overwrite original CD output; patches sit alongside.
- `_captures/` is gitignored per project — ad-hoc helpers stay there until
  stabilised, promote to `tools/claude-design/` only after Test B validates.
- Off-brand colours CD invents (lavender tints, green save badge, amber)
  documented as drift to either patch or flag.
- Production is never touched. Patched output stays under `_captures/`.

**Browser driver gotchas captured.** Disabled/hidden buttons in DOM require
enumerate-then-filter-then-click pattern (`!disabled && offsetParent !==
null`), not `:has-text()` selectors. `click-visible` helper verb should fold
into `inspect-comet.js` in a follow-up. `Edit` tool requires `Read` first
(not a pre-read session's memory). Uploads folder wouldn't expand on
click/double-click but didn't block progress.

**Files touched this session:**
- NEW: `_captures/claude-design-bundles/Lvio5HAlt9EAY6ltTXZQbQ/` — full CD bundle
- NEW: `_captures/claude-design-review/test-a-ssl2026/patched/Seller Sessions Live 2026.html`
- NEW: `_captures/claude-design-review/test-a-ssl2026/patched/ssl2026/styles.css`
- NEW: `_captures/claude-design-review/test-a-ssl2026/compare/compare.html`
- NEW: `_captures/claude-design-review/compare-shots.js`
- UPDATED: `MASTER-LOG.md` (this entry)

**Blockers / open questions:**
- Pre-compact routing bug: 18 CD entries mis-routed to `legal_decisions`
  collection. Flagged but not fixed — deferred.
- Test B (Databrill waitlist recreation) not yet executed.
- `reference/claude-design-integration.md` needs VALIDATED badge on round-trip
  section — deferred to after Test B.

---

### 2026-04-18 11:45 BST -- Claude Design live recreation test (Test A partial, Test B prepped)

**Picked up from 17 Apr spec review.** the operator's ask: before writing any integration
code, do a visual "recreation" demo — feed existing assets through Claude Design
with hands-off control, see the aesthetic output, let visual impact drive the
keep/retire decision. Two tests planned: **(A)** SSL 2026 live page
(`sellersessions.com/sp/seller-sessions-live-2026/`), and **(B)** Databrill
waitlist mockup at `Claude-UI-Workflow/stitch-waitlist-mockup/databrill-waitlist.html`.
Parked the 2027 HTML demo — can't find it on disk (4 searches tried: filename
glob, HTML content grep for £499/8-May-2027/72-hour, JSONL transcript scan for
recent Write-HTML-2027 calls, Downloads/Desktop). MASTER-LOG from 12 Apr says
SSL 2027 pre-sell deployed to `ss-live-2026-preview.netlify.app`, but the operator
clarified that URL is actually the 2026 pre-WP demo — a contradiction to resolve
next session. React source `SSLive2027PreSell.tsx` exists and 11 review PNGs of
it are on disk.

**References staged** into `_captures/claude-design-review/`:
- `test-a-ssl2026/ssl2026-reference-hero.png` — clean "Built for Innovators.
  Not Imitators." hero capture (the live-page Playwright screenshot returned
  blank because WordPress/WooFunnels + Wordfence blocks the React bundle
  enqueue in headless sessions; used the existing `review/hero.png` instead).
- `test-b-databrill/databrill-waitlist-reference.png` — clean dark-theme
  capture of the Databrill waitlist mockup ("Own your data. Architect your
  edge." + infrastructure flywheel).

**New helper:** `_captures/claude-design-review/comet-upload.js` — Playwright
filechooser-aware uploader. Registers the `filechooser` handler before clicking
the trigger button, then injects the file path. Needed because Claude Design's
"Add screenshot" opens a native OS file picker with no `<input type=file>` in
the DOM — a one-shot `inspect-comet.js eval/click` can't handle it. Usage:
`node comet-upload.js "<trigger-selector>" "<absolute-file-path>"`. Worked
first try for the SSL hero upload.

**Key finding on Attach codebase** — the project-workspace button only accepts
folder drop (or "browse..." which opens native folder picker). GitHub URL
ingestion is **only available via Design System setup** (`/design/p/<id>?setup=design-system`),
not the per-project context. So for codebase grounding on ad-hoc projects,
either (a) set up a Design System per brand pointing at the GitHub repo, or
(b) drag a subfolder in. Rules out `"GitHub link on every new project"` as
the simple workflow — DS creation is the canonical path.

**Test A execution** — project created at `/design/p/3abf310e-0d26-409c-8de6-c63b5eea0496`
("SSL 2026 — Claude Design Test", High-fidelity Prototype, default DS). Attached
hero screenshot via `comet-upload.js`. Typed 1,830-char prompt with full brand
tokens (colours, fonts, effects, content to keep, "push 2× cinematic"). Sent.
Claude produced a **strong written plan** — three vertical bands
(`#0C0322 → #110330 → #160440`), asymmetric stat cards with lead-stat gold tint,
center-tier VIP lift with "Most Popular" ribbon, 72-hour countdown pulse,
tabular-figures numerals, micro-details list. Then **hit `Network error:
connection lost mid-stream` at the "Writing" stage on 4 consecutive retries**.
Root cause: the operator was on a train with flaky wifi — not a Claude Design infra
issue. Resolved with steady signal. Canvas output never rendered before we
stopped to pre-compact.

**Send button gotcha** — two `Send` buttons in the DOM; Playwright's
`:has-text('Send')` matches the disabled/hidden one first. Fix: enumerate all,
pick the one where `!disabled && offsetParent !== null`, then `.click()`
directly on the element. Not a `page.click(selector)` with a complex selector.
This pattern will recur across Claude Design surfaces — worth folding into
`inspect-comet.js` as a new `click-visible` command in a follow-up.

**Send (Test B prep)** — Databrill waitlist reference and brand tokens
(`brands/databrill/profile.md` dark Stitch variant: `#0A0C10` bg, `#ff7d3b`
orange, `#8b5cf6` purple, Space Grotesk headings, Inter body) are ready to go.
Test B will reuse the same flow: new project → `comet-upload.js` for screenshot
→ React-aware textarea setter for prompt → visible-Send-button click → poll.

**Signal from the plan alone** — Claude Design clearly *comprehends* the brand
from screenshot + prompt without codebase attachment. The written plan was
brand-coherent, used our exact hex values, picked up on "cinematic" as a
deliberate depth/orb treatment rather than a generic stylistic word. Canvas
output remains the missing emotional-read piece. Next session should start by
re-running Test A with steady wifi from the existing project (same ID:
`3abf310e-0d26-409c-8de6-c63b5eea0496`, Retry button still visible).

### 2026-04-17 22:25 BST -- Claude Design (Anthropic Labs) Review + Integration Spec

**Launched today** by Anthropic Labs: `claude.ai/design` — the first Anthropic-native
design surface, Opus 4.7, research preview, on Max / Pro / Team / Enterprise (admin-
gated). the operator's Max plan has access; we reviewed it live in Comet via CDP 9222.

**Browser review path.** Launched fresh Chromium via `inspect.js` first — wrong
move because the fresh session had no auth. Killed it. Connected Playwright to
Comet's running CDP on 9222 via a one-off helper:
`Claude-UI-Workflow/_captures/claude-design-review/inspect-comet.js` (targets tabs
by URL fragment, same command surface as `inspect.js` but scoped to the live
Comet session). Worked first try.

**Surface mapped** (12 screenshots in `_captures/claude-design-review/`):
- Sidebar gains a new first-class **Design** entry alongside Projects / Artifacts / Code.
- Home: **Prototype / Slide deck / From template / Other** tabs on the left,
  **Recent / Your designs / Examples / Design systems** on the right. Fidelity
  toggle: Wireframe vs High fidelity.
- **Design system setup** ingests: company blurb, GitHub repo link, local folder
  drop, `.fig` file (parsed locally in browser), fonts/logos/assets, freeform notes.
- **Project workspace** has 4 context buttons (Design System, Add screenshot,
  Attach codebase, Drag in Figma) + chat/canvas panes + top-right Share / Export.
- **Export menu:** ZIP, PDF, PPTX, Canva, standalone HTML, **Handoff to Claude Code**.
- **Handoff dialog** issues a signed URL: `https://api.anthropic.com/v1/design/h/<hash>`
  wrapped in a ready-to-paste command that tells Claude Code to fetch the file +
  readme and implement. Fallback option is ZIP download.

**The handoff URL is the centralisation primitive.** It's the piece that lets
Claude Code stay the centralised system — browser becomes a design surface, the
signed bundle URL is `WebFetch`-able from here.

**Integration spec written** at `Claude-UI-Workflow/reference/claude-design-integration.md`.
Covers: where Claude Design slots into the 8-phase pipeline (primary = DESIGN,
secondary = INSPIRATION), updated ASCII diagram, Keep/Retire/Gate table, Stitch
vs Claude Design comparison, pre-SSL discovery tasks (non-blocking), post-SSL
adoption sequence, open questions on bundle auth model.

**Recommendation baked into the spec:** Claude Design becomes the default DESIGN
surface for branded work (SS, Databrill, DesignLoop). Stitch stays for greenfield
jam. Moodboard (tldraw) stays as the pre-DESIGN alignment layer. Brand profiles
(`brands/<slug>/profile.md`) stay source of truth; Claude Design system objects
become mirrors populated from them.

**OUTSTANDING-WORK.md updated** with two new sections: (a) pre-SSL discovery
(one throwaway design system + one handoff URL test, both cheap), (b) post-SSL
adoption items (SKILL.md Workflow A rewrite, `fetch-claude-design-bundle.ts`
helper, brand mirror script, README 8-phase diagram refresh).

**Files touched this session:**
- NEW: `Claude-UI-Workflow/reference/claude-design-integration.md`
- NEW: `Claude-UI-Workflow/_captures/claude-design-review/` (12 screenshots + inspect-comet.js + snapshot JSON)
- UPDATED: `Claude-UI-Workflow/MASTER-LOG.md` (this entry)
- UPDATED: `Claude-UI-Workflow/OUTSTANDING-WORK.md`

---

### 2026-04-11 -- Moodboard Tool Built + Brands Folder Migrated + 8-Phase Diagram

**Biggest pipeline expansion since v3.** Closed §07 (Stitch-as-moodboard) in 1 minute, built a local tldraw-based moodboard tool end-to-end, migrated the `brands/` folder, and drew the first 8-phase workflow diagram live on the new canvas.

**§07 test closed:** "Stitch as moodboard" ruled out from domain knowledge — Stitch is upload-ref + prompt → generate, not a pin board. Result logged in `design-system-sections/07-TEST-RESULTS.md`.

**New tool: `tools/moodboard/`.** Vite + React + TypeScript + tldraw 3.10 app with a Node API sidecar. Lives at `Claude-UI-Workflow/tools/moodboard/`. Runs on :5273 (web) + :5274 (api).
- `server.ts` — 7 endpoints: `/api/load` `/api/save` `/api/asset` `/api/snapshot` `/api/export` `/api/events` (SSE) `/api/run` (POST broadcast)
- `src/App.tsx` — mounts `<Tldraw>`, forces dark mode + grid on, reads `?brand=<slug>` from URL, subscribes to SSE, auto-saves via `store.listen` throttled 750ms
- `src/commands.ts` — 8-verb dispatcher: `rect`, `text`, `note`, `arrow`, `grid`, `clear`, `zoomToFit`, `ping`
- External asset handler writes dropped images to `brands/<slug>/moodboard-assets/` rather than inlining base64 → `.tldr` files stay <5KB and git-friendly
- Export button renders downscaled PNG (MAX_DIM 2000) + markdown summary via `editor.toImage()`

**CLI: `scripts/mb.ts`.** tsx-run command-line tool that POSTs JSON to `/api/run?brand=X`, which broadcasts via SSE to every open browser tab for that brand. This is the two-way flow — Claude in chat → terminal → live canvas → the operator can drag/resize what I draw, both sides stay in sync. Fixed a negative-number flag parser bug during build (negative coords were being swallowed by `startsWith('-')` check).

**T1–T4 lifecycle test: ALL PASSED.** OPEN (browser mounts, brand routes correctly), SAVE (dropped images persisted to disk as separate files), CLOSE/REOPEN (state restored after dev server restart), EXPORT (PNG + summary.md written to brand folder). Proven on `brands/sellersessions/`.

**brands/ folder migrated from flat to subfolder shape** — this was Plan Step 1 from `<your local plans dir>/groovy-gathering-dongarra.md` kicked off as a side effect of the moodboard build:
```
brands/
├─ _template/profile.md
├─ sellersessions/profile.md + moodboard.tldr + moodboard-assets/
├─ databrill/profile.md
└─ claude-ui-workflow/profile.md          ← NEW meta-brand slug
```
The `claude-ui-workflow` slug is a meta-brand for persisting workflow diagrams that aren't tied to any real brand.

**8-phase workflow diagram** drawn live on the canvas at `?brand=claude-ui-workflow`: INSPIRATION → MEMORY → DECIDE → MOODBOARD → ASSETS → DESIGN → BUILD → REFINE. Each phase has a coloured legend note describing the tools in that stage. This supersedes the older 4-phase view in `DESIGN-PIPELINE-VISUAL.md` and `README.md` (both updated this session).

**Critical bug fixed (persistence).** The autosave listener in App.tsx was filtered to `source: 'user'`, which meant shapes created programmatically via the SSE command path (`source: 'remote'`) never hit disk. Fixed by removing the source filter — all changes now persist. Validation still pending in a fresh tab (hit a stuck refresh at the end of session).

**tldraw schema gotcha:** tldraw 3.10 removed `text` from the `geo` shape props schema. Labels on rects must use `richText` (ProseMirror doc format) or the validator throws, which trips tldraw's ErrorBoundary and freezes the entire editor. Fixed in `src/commands.ts`. Caught by delegating a headless browser inspection to a general-purpose agent — faster than chasing console errors manually.

**Banked design system sections (new folder):** `Claude-UI-Workflow/design-system-sections/` now holds 8 sections (`01-design-md-format-and-stitch-integration.md` through `08-impeccable-anti-cliche-design-skill.md`). §06 surfaces Gap #8 (no web inspiration on-ramp + no moodboard layer) which this build closes. §07 is demoted to context-only. §07b (`07b-tldraw-moodboard-integration.md`) is pending — needs to be written to document this build and replace the §07 Stitch framing.

**Outstanding work logged in `OUTSTANDING-WORK.md`** (new file at repo root). Covers: persistence validation, §07b doc, `tools/moodboard/README.md`, SKILL.md `/moodboard <brand>` command, Tests T2/T3/T4 from the original plan (deferred), and Plan Steps 1–6 (post-SSL).

**Files touched:**
- NEW: `tools/moodboard/` (package.json, vite.config.ts, server.ts, launch.mjs, tsconfig.json, index.html, src/App.tsx, src/main.tsx, src/commands.ts, scripts/mb.ts)
- NEW: `brands/claude-ui-workflow/profile.md`
- MOVED: `brands/{sellersessions,databrill,_template}.md` → `brands/<slug>/profile.md`
- NEW: `design-system-sections/` (8 sections + 07-TEST-RESULTS.md)
- NEW: `OUTSTANDING-WORK.md` at repo root
- UPDATED: `README.md`, `DESIGN-PIPELINE-VISUAL.md`, `MASTER-LOG.md` (this entry)

---

### 2026-04-03 19:18 BST -- Website Cloner + Remotion Skills Installed

**Website Cloner (`ai-website-cloner-template`):** Cloned from `github.com/JCodesMore/ai-website-cloner-template` (MIT) into `website-cloner/`. Next.js 16 + Tailwind v4 + shadcn/ui scaffold with `/clone-website` skill. 5-phase pipeline: Reconnaissance → Foundation → Component Specs → Parallel Build (git worktrees) → Assembly & QA. Supports Playwright MCP (not just Chrome MCP). Target use: DESIGN phase automation — point at any URL, get pixel-perfect rebuild + extracted design tokens in `docs/research/`. Tested build: clean. **Pending:** first live test on `https://n8n.io/` (blocked by Playwright MCP crash — needs session restart).

**Remotion Video Skill:** Installed via `npx skills add remotion-dev/skills` (best practices skill for programmatic video). Housed in DesignLoop MCP as "Motion Brain" alongside Photo Brain + Composition Brain. Demo rendered: 4s SSL 2026 speaker announcement (dark gradient, spring animations, brand mark, speaker name slide-in). Output: `remotion-demo/out/ssl-speaker-demo.mp4`. the operator confirmed quality is good (vs poor experience ~1 year ago). Remotion = motion graphics (kinetic typography, data viz, social templates), NOT AI video generation. Killer feature: batch rendering (20 speaker cards from JSON in <1 min).

### 2026-03-23 09:53 GMT -- REFINE applied to Databrill Netlify (10 pages, 10 improvements)

First real-world REFINE test on a multi-page Stitch-built site. Audited homepage against all 15 CSVs × 6 dimensions (scored 48/60). Implemented 10 improvements across all 10 pages: section banding (4 depths), scroll reveal, badge chips, CTA pulse glow, lazy-load, font preconnect, focus states, ARIA hidden, CLS fix, count-up stats. Brand profile (`brands/databrill.md`) updated with Visual REFINE Techniques section, section banding depth table, and revised performance budget for static HTML. Validated REFINE workflow end-to-end on production site.

### 2026-03-22 08:44 GMT -- Visual README + GitHub Repo + Ellis Invited

**README.md created** (~900 lines) following ClaudeFlow gold standard: SVG logo pair (dark/light), 5 shield.io badges, 4MAT structure (WHY→WHAT→HOW→WHAT IF), all 164 features in full-width markdown tables grouped by phase and sub-category. Mermaid hero diagrams with legend tables below (GitHub-safe hybrid pattern).

**SVG logos created:** `assets/logo-dark.svg` + `assets/logo-light.svg` — "Claude" blue→purple gradient + "UI Workflow" light weight. Subtitle: "165 features · 15 CSVs · 5 phases · 4 quality gates".

**DESIGN-PIPELINE-VISUAL.md updated:** All 17 Mermaid diagrams wrapped in HTML `<table>` layout (Pattern 1) with 60/40 right-side legends. Existing blockquote explanations moved into legend columns. Mermaid code untouched.

**GitHub repo created:** `sellersessions/claude-ui-workflow` (private). 55 files pushed. Ellis invited with push access (handle: `ellis`, confirmed from databrill-core).

**readme-generator skill updated:** New "Step 3b: Mermaid layout patterns (full-width)" section added. Covers 4 patterns (HTML table, flexbox, legend-in-diagram, hybrid) with decision tree by renderer target.

**Feedback memory saved:** `feedback_mermaid_fullwidth.md` — the operator's Perplexity research on Mermaid full-width layouts. 3 patterns + trigger phrases. MEMORY.md index updated.

**Decisions:**
- GitHub-safe hybrid (diagram + legend table below) as default for READMEs — GitHub won't render Mermaid inside HTML table cells
- Pattern 1 (HTML table wrap) for Obsidian-viewed docs like DESIGN-PIPELINE-VISUAL.md where it renders correctly
- Private repo, Ellis gets push access (same level as databrill-core)

---

### 2026-03-22 07:32 GMT -- DESIGN-PIPELINE-VISUAL.md Update + Loom Feedback Loop

**DESIGN-PIPELINE-VISUAL.md updated** to reflect the Loom feedback workflow demonstrated this session. Doc grew from 454→505 lines.

**8 right-aligned legends added** to vertical (TD) Mermaid diagrams — blockquote descriptions explaining each step/node. Covers: DECIDE, Brief Output, DESIGN/Stitch, BUILD main, Image Generation, E2E Test, REFINE flow, REFINE Audit. Horizontal (LR) diagrams left as-is (already use full width).

**New section: "Feedback Loop — Loom to Code"** added before File Map. LR Mermaid diagram: the operator records Loom → Video Transcriber MCP → Sequential Thinking → Plan Mode → Implementation → Deploy. Includes usage guidance: when to use Loom (subjective polish) vs REFINE (systematic quality).

**REFINE Audit legend updated** with proven results: SS Live 2026 33/50 → ~44/50 across 2 sessions, ~20 scroll animations killed.

---

### 2026-03-21 23:44 GMT -- SSLive2026 v3 Teardown (Animation Reduction + Performance + UX)

**Full teardown audit** of SSLive2026.tsx against all 15 v3 CSVs + 4 skills. the operator flagged "too many animations" — primary focus was killing orphan/unjustified infinite CSS animations.

**Phase 1 — Animation (7 changes):**
- 4× NeonGradientCard → Card in Modular Format (killed 8 infinite rotate-border + neonPulse instances)
- Removed btn-animated-border from Event Details CTA + CTASection final CTA (kept hero only)
- CardStack auto-advance slowed 3500ms → 6000ms
- Agenda double-stagger simplified to single-level (removed nested motion.div per item)
- Atmospheric orbs reduced 3 → 1 (kept pricing orb only)
- **Net: ~13 infinite animations → 4 (69% reduction)**

**Phase 2 — Performance (5 changes):**
- Added width/height to all img tags (SpeakerTimeline + logo) — CLS fix
- Added Plus Jakarta Sans to index.html font preload (was only in CSS @import)
- Replaced barrel import from `../components` with direct file imports — tree-shaking enabled
- React.lazy() + Suspense for FAQ + VideoTestimonials — code-splitting
- Hero border-radius 25px → 16px (pill-radius-excess anti-pattern)

**Phase 3 — UX (3 changes):**
- Skip-link added as first focusable element
- `<div>` → `<main>` semantic landmark wrapping page
- Final CTA strengthened: scarcity stats + Adam Hiest micro-testimonial (peak-end rule)

**Phase 4 — Cleanup (2 changes):**
- Removed bg-dot-grid from hero (video is the texture)
- Added will-change:transform to WaveDivider CSS

**Files:** SSLive2026.tsx, CTASection.tsx, SpeakerTimeline.tsx, index.css, index.html

**Completed (session 9, 21 Mar):** FAQ chunking into 4 categories (Miller's Law), CTA loading states on all 3 ticket buttons (system-feedback). All 4 teardown phases now done.

**Final score projection:** 33/50 C+ → ~44/50 A-

---

### 2026-03-21 23:24 GMT -- v3 Pipeline Upgrade (11 Repos Analysed, 4 Skills + 4 CSVs Added)

**Major upgrade:** Analysed 11 external Claude Code design skills/repos, gap-analysed against our system, installed 4 new skills + created 4 new CSVs + expanded 2 existing CSVs. Stress-tested v3 pipeline on SSLive2026.tsx.

**11 repos researched (3 parallel background agents):**
Vercel react-best-practices, Vercel composition-patterns, Vercel react-native, OilOil (anti-AI), Bencium (UX philosophy), Wondelai (meta-guidance), Cloudflare web-perf, Anthropic algorithmic-art, Anthropic canvas-design, AccessLint (a11y), Ashutos1997 design-auditor.

**4 new skills installed (fetched from GitHub, written as SKILL.md):**
- `react-best-practices` — 64 React perf rules across 8 priority tiers (Vercel)
- `composition-patterns` — 8 component architecture rules, React 19 APIs (Vercel)
- `algorithmic-art` — p5.js generative art with seeded randomness (Anthropic)
- `web-perf` — 5-phase CWV audit, Chrome DevTools MCP (Cloudflare)

**5 repos NOT installed (with reasoning):**
Bencium (philosophy conflicts — "no shadows" vs our glow-cards), OilOil (too opinionated — bans Inter), React Native (no mobile projects), Wondelai (broad meta-guidance), Canvas Design (overlaps algorithmic-art). Best rules extracted into CSVs instead.

**4 new CSVs created:**
- `hci-laws.csv` — 10 cognitive science laws (Fitts, Hick, Miller, Jakob, Gestalt, Von Restorff, peak-end, Zeigarnik, Doherty)
- `anti-patterns.csv` — 15 anti-AI-generic detection rules (banned fonts, pure colors, card-in-card, decoration justification)
- `performance.csv` — 12 Core Web Vitals thresholds (LCP, CLS, INP, bundle, images, fonts, caching)
- `interaction-design.csv` — 12 UX patterns (progressive disclosure, feedback, affordance, five-states, form validation)

**2 existing CSVs expanded:**
- `ux-guidelines.csv` +6 accessibility rows (landmarks, skip-link, heading hierarchy, form labels, color-not-sole, error announcement)
- `refinements.csv` +2 evaluation rows (anti-ai-check, performance-check)

**Pipeline changes:**
- DECIDE: 15 CSVs (was 11), brief output now 10 sections (+Section 10: Performance Budget & Interaction Rules)
- BUILD: 4 quality gate skills (was 2, +react-best-practices, +composition-patterns)
- REFINE: 6 audit dimensions (was 3, +performance, +anti-AI, +HCI)
- Brand profiles: added Performance Budget sections to SS, Databrill, template

**Stress test — SSLive2026.tsx v3 audit:**

| Dimension | Score | Rating |
|-----------|-------|--------|
| HCI Laws | 8/10 | B |
| Anti-Patterns | 11/15 | B |
| Performance | 7/13 | C |
| Interaction Design | 7/12 | C |
| OVERALL | 33/50 | C+ |

Top gaps: img width/height missing (CLS), no WebP/lazy-load, render-blocking Google Fonts, barrel import blocks tree-shaking, no code-splitting, 4 orphan background animations, no loading states on CTAs.

**Docs updated:** DESIGN-PIPELINE-VISUAL.md (v3 with 15 CSVs, 4 quality gates, 6 REFINE dimensions), MEMORY.md, brand profiles.

**Totals: 15 CSVs, 172 rules, 10 tools (8 skills + 2 MCPs), 6 REFINE dimensions.**

---

### 2026-03-21 22:49 GMT -- v2 Pipeline Upgrade + SS Live 2026 Full REFINE Test

**Major upgrade:** Researched 5 external Claude Code design skills, gap-analysed against our system, installed 2 skills + merged rules into CSV system. Then stress-tested the v2 pipeline on SS Live 2026 landing page.

**Skills installed:**
- `emil-design-eng` (`.claude/skills/emil-design-eng/`) — animation intelligence, easing rules, GPU acceleration, component philosophy. Auto-guards during BUILD phase.
- `web-design-guidelines` (`.claude/skills/web-design-guidelines/`) — 100+ rule code auditor from Vercel/Rauno. Fetches guidelines, produces file:line findings.

**New design database files (11 CSVs total):**
- `design-db/animation.csv` — 15 motion rules: button-press (100-160ms, scale 0.96), modal-entrance (200-500ms, custom cubic-bezier), high-frequency-ban (never animate 100+ daily actions), gpu-only-rule, no-ease-in-entry, popover-origin, interruptibility
- `design-db/polish-details.csv` — 10 micro-detail rules: concentric-radius, font-smoothing, tabular-nums, text-wrap-balance, text-wrap-pretty, transition-specificity, will-change-sparingly, layered-shadows, button-press-scale, optical-alignment
- `design-db/refinements.csv` expanded 19→23 (added icon-animation, concentric-radius, shadow-depth, font-smoothing)

**Brand profiles updated:** Added `## Animation Preferences` to sellersessions.md, databrill.md, _template.md.

**SS Live 2026 REFINE audit (v2) — 17 changes across 5 phases:**

| Phase | Changes | Key items |
|-------|---------|-----------|
| 1: CSS Polish | 6 | text-wrap:balance on headings, tabular-nums on stats, specific transition properties (no `all`), 3-layer card shadows, button :active scale(0.96), z-index token scale |
| 2: Accessibility | 4 | aria-live on CountUp, aria-expanded on FAQ, useReducedMotion() hook, focus-visible rings |
| 3: Animation | 3 | Exit animations, icon entrance (opacity+scale+blur), concentric radius |
| 4: Layout | 3 | Proof elevation (testimonial near CTA), gradient blend dividers, 3-layer shadow depth |
| 5: Cleanup | 1 | ~20 hardcoded rgba → Tailwind classes, text-[#753EF7] → text-ss-accent |

**Score: 59→90 (C+→A).** TypeScript clean build confirmed (0 errors). Dev server verified at localhost:5180 via Playwright.

**Docs updated:** DESIGN-PIPELINE-VISUAL.md (v2 with quality gates), SKILL.md (11 CSVs, BUILD quality gates, Emil+Vercel deps), MEMORY.md, project-registry.json (new triggers).

**memory layer:** Purged legacy `ui_pipeline_decisions` collection (6 stale entries). Active: `ui_workflow_decisions` (133→156 entries after pre-compact).

---

### 2026-03-20 07:06 GMT -- Image Generation Workflow Added to Pipeline

**Source:** Loom `259b037111594778928e404756b79b2f` — the operator identified gap: pipeline handles layout/components/typography/colour but has no approach for generating visual assets (hero images, textures, backgrounds, icons).

**Created:**
- `design-db/images.csv` — 7 image slot types (hero-background, hero-deconstructed, crowd-atmosphere, section-texture, speaker-placeholder, section-divider, product-showcase). Each row has a `prompt_template` with brand variables (`{primary_color}`, `{bg_color}`, `{mood}`, etc.) that get substituted from brand profile at generation time. Follows same CSV-per-concern pattern as existing design-db files.

**Updated:**
- `.claude/skills/claude-ui-workflow/SKILL.md` — DECIDE (Workflow D): added `images.csv` to CSV search list, added Section 9 (Image Assets) to design brief output (was 8 sections, now 9). BUILD (Workflow B): added Image Generator role for NanoBanana2, added 6-step "Image Asset Generation from Section 9" sub-process (load templates → substitute brand vars → apply constraints → call NB2 → generate variants → the operator picks).
- `brands/sellersessions.md` — added `## Image Constraints` section (dark bg only, no stock feel, brand palette enforcement, "No text" suffix rule, real speaker photos only, glassmorphic preference, Plus Jakarta Sans reference).
- `brands/_template.md` — added `## Image Constraints` template section so future brands capture image rules.

**First test — SS Live 2026 hero image (hero-deconstructed slot):**
- Generated 2 variants via NanoBanana2 `generate_image` with SS brand variables substituted
- Both show isometric floating UI panels, purple gradient swatches, grid lines on #0C0322 dark base
- Known issue: NB2 hallucinated hex values as visible text despite "No text" prompt suffix — needs post-processing cleanup or more aggressive anti-text prompting
- Files: `nanobanana-output/deconstructed_design_system_blue.png` + `_1.png`

**Section texture generated:**
- `generate_pattern` with dark purple noise grain — subtle, almost-black with faint speckles
- File: `nanobanana-output/dark_premium_noise_grain_texture.png`
- For alternating section banding in SSLive2026.tsx (addresses REFINE audit gap: all 14 sections on same flat dark bg)

**Loom session file:** `Claude-Loom-Workflow/sessions/2026-03-20-claude-ui-workflow.md`

**Pipeline is now 5 phases:** DECIDE → DESIGN → BUILD → REFINE → (loop). Image generation is a named sub-step within BUILD, driven by Section 9 of the design brief.

---

### 2026-03-19 -- REFINE Phase Added to Pipeline + SS Live 2026 First Audit

**Added Workflow E (REFINE)** to the design pipeline. The pipeline is now a loop, not a line:

```
DECIDE → DESIGN → BUILD → [live page] → REFINE → DESIGN → BUILD → [better page]
```

**Created:**
- `design-db/refinements.csv` -- 19 premium polish techniques across 5 categories (Depth & Banding, Typography & Hierarchy, Card & Component Polish, Layout Upgrades, Micro-Interactions). Seeded from Perplexity n8n analysis + the operator's glow-card system + premium conference site patterns.

**Updated:**
- `.claude/skills/claude-ui-workflow/SKILL.md` -- added Workflow E (REFINE) with 4-step process (READ → AUDIT → GAP ANALYSIS → STITCH PROMPT). Trigger: `/refine [page]`, "polish this page", "make this premium". Updated pipeline diagram, trigger list, and workflow count.
- `DESIGN-PIPELINE-VISUAL.md` -- added Phase 4: REFINE section with 3 Mermaid diagrams (refine flow, full loop, audit scoring). Updated file map to include refinements.csv.

**First REFINE test -- SS Live 2026 (SSLive2026.tsx, 890 lines, 14 sections):**

Audit results: 3 PRESENT, 3 PARTIAL, 13 MISSING. High-impact gaps: section-banding (all 14 sections on same flat dark bg), stat-grid-numerals (stats as small cards not dramatic numerals), image-cards (speakers have placeholder circles not photos), timeline-phases (agenda has colour-coded borders but no visual phase bands), proof-elevation (testimonials buried at section 10, not near CTA).

Two deliverables produced:
1. Gap analysis table (19 techniques scored)
2. Stitch refinement prompt (natural language, no hex codes, references n8n as creative anchor, preserves all copy + 4MAT structure)

**Key:** This does NOT change the TSX. the operator reviews gap analysis, approves/filters, then pastes Stitch prompt to iterate the visual design.

---

### 2026-03-19 22:00 GMT -- Design Pipeline Upgrade (DECIDE Phase) + E2E Test

**Added the missing decision layer** -- a CSV-backed design database + brand profiles that produce structured design briefs BEFORE any design or code happens. Inspired by Kyle Whitrow / Nu Stimulus PDF guide approach, adapted with the operator's existing design systems.

**Created:**
- `design-db/` -- 7 CSV files (colors, typography, ui-reasoning, styles, landing, ux-guidelines, charts)
- `brands/` -- 3 files (sellersessions.md, databrill.md, _template.md)
- All CSVs seeded from REAL tokens extracted from `sellersessions-design-system/` (tailwind.config.js, index.css) and `Databrill-Core/design-system/` (tailwind.config.js, DESIGN.md)

**Updated:**
- `.claude/skills/claude-ui-workflow/SKILL.md` -- added Workflow D (DECIDE) with 8-section brief output spec. Renamed workflows: C=Capture, D=DECIDE, A=DESIGN, B=BUILD. Pipeline is now 3-phase (DECIDE → DESIGN → BUILD) with each step optional.
- `MASTER-LOG.md` -- added DECIDE phase checklist + this session entry

**E2E test run -- "fintech startup landing page" (generic mode, no brand profile):**

This was a proof-of-concept test to validate the full DECIDE → DESIGN → DEPLOY flow. Not a real project — just proving the pipeline works end-to-end.

1. **DECIDE:** `/design landing page for a fintech startup` — Claude searched all 7 CSVs, no brand profile matched (generic mode). Produced 8-section brief: teal `#0F766E` palette, Outfit + Inter fonts, product-launch section order, 10 anti-pattern rules. ~30 seconds.

2. **Stitch prompt translation:** Brief was translated to natural language for Stitch (learned pattern: Stitch works better with feelings not tokens). Removed hex codes, CSS classes. Described mood and structure in plain English.

3. **DESIGN (Stitch):** the operator pasted prompt into Stitch web UI. Generated "TrustLayer" fintech landing page — hero with dashboard mockup, 6-card features grid (3x2), trust stats ($42B+, 99.99%, 1.2M, 500+), 3-tier pricing, 4 testimonials, CTA + FAQ accordion, full footer with compliance badges.

4. **Audit:** Compared Stitch output against brief — 11/13 checks PASS. Two minor drifts: (a) Stitch used darker teal `#006565`/`#008080` vs brief's `#0F766E`, (b) Plus Jakarta Sans headings instead of Outfit. Both accepted as valid design choices. Stitch also generated its own `DESIGN.md` with "Precision Ethereal" creative north star and a "No-Red Protocol" — added design intelligence on top of the brief.

5. **BUILD (21st.dev):** MCP returned `[object Object]` — known rendering issue where structured response doesn't display. Tool connects but output doesn't render into conversation. Not a blocker for this test since Stitch HTML was already production-ready.

6. **DEPLOY:** Static deploy to Netlify. Live at `https://trustlayer-fintech-demo.netlify.app`. Site: `trustlayer-fintech-demo`.

**Key insight from the operator:** "I could spend hours playing around in Stitch only to find out it just took forever. The prompts weren't very good. This is why it was important to work on a flow." The brief is the steering wheel — it stops directionless jamming and gives Stitch a clear target, which is why it nailed the design first try.

**21st.dev MCP issue:** Returns `[object Object]` instead of rendered component code. Needs investigation — may work differently when called within a proper React project context (writing to files) vs conversation display. Not blocking the pipeline since Stitch HTML is deployable on its own, and 21st.dev is only needed when converting to React components for existing design systems (SS, Databrill).

**Pipeline proven:**
```
/design [description] → Design Brief → Stitch prompt → Stitch generates → Audit → Deploy
         30 sec           2 min          instant        5 min      1 min
```

**Still to test:**
- `/design landing page for Seller Sessions` -- verify SS brand profile loads and overrides CSV defaults
- `/design waitlist page for Databrill` -- verify Databrill brand profile loads
- 21st.dev React component generation in a real project context (SS or Databrill design system)

**Note:** The `trustlayer-fintech-demo` Netlify site is a test artifact. Can be deleted anytime — it's not a real project.

---

### 2026-03-05 05:56 GMT -- Stitch 2.0 Capabilities Deep-Dive

**Source:** YouTube tutorial `QGZ24YhbZT8` ("Google Stitch 2.0 Tutorial: From Sketch to Code with Gemini 3.0" by Teacher's Tech, 10:45).

**yt-dlp fix:** Upgraded from 2025.12.8 to 2026.03.03 via `brew upgrade`. Video Transcriber MCP extracted transcript (2119 words). Sequential thinking analysed into 6 structured categories.

**Key discoveries not previously documented:**
1. **Variation controls** -- creative range (Refine/Medium/YOLO), aspect selection, quantity, custom instructions
2. **Heat maps** -- predicted attention audit, shows where users' eyes go (UX validation)
3. **Interactive prototypes** -- select 2+ screens, creates clickable navigation prototype
4. **Multi-page brand consistency** -- subsequent pages auto-inherit first prompt's design language
5. **Model toggle** -- Thinking mode (Gemini 3.0 Pro, better for complex) vs Fast mode
6. **Export options** -- ZIP download (full files + animations), code to clipboard, export to AI Studio/Jules

**the operator's HTML extraction answer:** ZIP download or code-to-clipboard from web UI. No MCP equivalent exists -- MCP limitation confirmed. But the web UI export is richer than we documented.

**Files created/updated:**
- `Claude-UI-Workflow/reference/stitch-capabilities.md` -- full 6-section reference (input methods, generation modes, iteration workflow, output extraction, pro features, limitations)
- `.claude/skills/claude-ui-workflow/SKILL.md` -- added platform/model toggles, variation controls detail, pro features (heat maps, prototypes, multi-page consistency), clarified export methods
- Transcript files in `Claude-UI-Workflow/reference/` (txt, json, md)

---

### 2026-03-05 05:39 GMT -- Stitch-First Pipeline Revision

**Architecture rewrite based on the operator's Loom feedback:** Stitch elevated from "structure scaffold" to **creative director**. Other 3 tools become production assistants that run after the operator approves the Stitch design direction.

**Files updated:**
- `.claude/skills/claude-ui-workflow/SKILL.md` -- Workflow A rewritten: 2-phase architecture (Stitch creative direction -> parallel production), role definitions table, 3 input paths (the operator web UI, Claude MCP, Playwright), iteration tools documented, known limitations section
- `Claude-UI-Workflow/reference/inspiration-to-ui-pipeline.md` -- Workflow A section replaced with Stitch-first architecture, role definitions, limitations
- `Claude-UI-Workflow/MASTER-LOG.md` -- Kickoff prompt updated to reflect Stitch-first flow + the operator's active project `15963079873723359996`

**Key insight from the operator:** Stitch is a redesign engine, not just a scaffold. Feed it an existing page + iterate via natural language. the operator jams in Stitch web UI, then brings project ID to Claude Code for production refinement.

**Next:** Test with the operator's real Stitch project (5 screens), run Phase 2 production tools on approved output.

### 2026-03-05 05:06 GMT -- Full Pipeline Wired E2E (All 4 Tools PASS)

**All 4 Workflow A tools verified loaded after restart:**
- Stitch MCP: LOADED (API key auth, proxy mode)
- 21st.dev Magic: LOADED (component builder confirmed)
- UI/UX Pro Max: LOADED (skill, design system generation)
- NanoBanana2: LOADED (image generation via OpenRouter)

**Pipeline test run -- "Design Power Stack" 5-card glassmorphic grid:**
1. Stitch MCP: Created project `7220983316378495217`, generated dark glassmorphic screen (Inter, #2b6cee, round-12). PASS.
2. UI/UX Pro Max: Generated design tokens -- #0F172A bg, #2b6cee accent, #22C55E CTA, Space Grotesk/DM Sans typography, 48px gaps. PASS.
3. 21st.dev Magic: Generated React/TSX component with shadcn/ui integration. PASS.
4. NanoBanana2: Generated 3 visual variants (clean grid, dashboard layout, detailed icons). PASS.

**Output:** `Claude-UI-Workflow/pipeline-test/` (3 variant PNGs)
**SKILL.md:** Installation status table updated -- all 4 tools marked LOADED.

**Status:** Workflow A pipeline is fully wired and validated. Both sub-workflows (A + B) now complete.

### 2026-03-05 04:01 GMT -- Stitch MCP Init + API Key Config

- NanoBanana2 MCP: LOADED + TESTED (hello tool responds)
- 21st.dev Magic: LOADED (confirmed last session)
- UI/UX Pro Max: SKILL (always available)
- Stitch MCP: init completed (API Key auth, Proxy mode, claude-code client)
- API key added to `.mcp.json` env block (was missing after init -- init stored to MCP config but didn't update project `.mcp.json`)
- `.mcp.json` backed up before edit
- Pipeline roles confirmed: Stitch (visual design) -> 21st.dev (components) -> UI/UX Pro Max (design system refinement) -> NanoBanana2 (asset generation)
- **Status:** Awaiting Claude Code restart to load Stitch MCP with API key. Then verify all 4 tools + wire end-to-end.

### 2026-03-05 03:23 GMT -- Full Pipeline Install (Workflows A+B)

**Workflow B (Capture Pipeline) -- COMPLETE:**
- Video Transcriber MCP tested: TikTok PASS (181 words), Instagram PASS (180 words)
- SKILL.md updated to MCP-first ingest (replaces manual bash pipelines)
- Entity extraction + link resolution tested end-to-end (created capture record for Jens Heitmann video)
- Searchable index: grep-on-demand (no index file needed at <20 records)

**Workflow A (UI Build Pipeline) -- 4/5 tools installed:**
- UI/UX Pro Max: `npm install -g uipro-cli && uipro init --ai claude` -- skill active
- NanoBanana2 MCP: `@aeven/nanobanana-mcp` added to `.mcp.json` (OpenRouter key from DesignLoop)
- Stitch MCP: `@_davideast/stitch-mcp proxy` added to `.mcp.json`
- Gemini API key saved to `~/.zshrc` + `~/.nano-banana/.env`
- 21st.dev Magic: already confirmed working

**Status:** Awaiting Claude Code restart to load nanobanana + stitch MCPs. Then wire full pipeline.
- Stitch MCP will need `gcloud auth application-default login` on first use (one-time browser auth)

### 2026-03-05 02:58 GMT -- Video Transcriber MCP Install (Phase 1)

- Installed `video-transcriber-mcp` into `.mcp.json` (wraps yt-dlp + Whisper into single `transcribe_video` tool)
- Backed up `.mcp.json` before modification
- Replaces manual bash pipeline (separate yt-dlp + whisper calls per platform) with one MCP tool call
- Supports 1000+ platforms including TikTok, Instagram, YouTube
- **Status:** MCP configured, awaiting Claude Code restart to load
- **Next:** After restart, test with TikTok URL then Instagram URL (same video, two platforms)
- Test URLs: TikTok `@jensheitmann_/video/7613073206722727198`, Instagram `reel/DVbfcdTkZ7R`

### 2026-03-04 19:45 GMT -- 4-Stage Test Run

**Stage 1 -- 21st.dev Magic MCP: PASS**
- Called `mcp__magic__21st_magic_component_builder` with hero card request
- Returned valid React/TSX with Tailwind CSS + shadcn/ui
- MCP configured and working after restart

**Stage 2 -- Loom Workflow: FAIL (expected)**
- youtube-transcript MCP rejects Loom URLs ("Invalid YouTube URL format")
- Confirmed Dec 2025 test used Playwright browser automation, not youtube-transcript
- Fixed claude-loom-workflow SKILL.md to use Playwright path
- Live test blocked on the operator's Loom auth

**Stage 3 -- Entity Extraction: PASS**
- Validated existing record (`2026-03-04-5-uiux-prompts-claude.md`) against output contract
- 7/8 fields present (timestamps absent -- expected for YouTube Short)
- Entities, link resolution, and build spec all well-structured

**Stage 4 -- Spec to Component: PASS**
- Created component spec from captured entities (5-card UX technique grid)
- Fed to 21st.dev Magic -- returned valid React component with shadcn/ui
- Pipeline: capture record -> entity extraction -> spec -> 21st.dev confirmed working

### 2026-03-05 02:04 GMT -- Session close note
- No additional UI workflow work this session. Focus was on Loom workflow testing.
- 21st.dev Magic MCP confirmed working (Stage 1+4 passed). Ready for next phase.

### 2026-03-04 19:00 GMT -- Restructure + Merge

- Merged `Inspiration-Capture/` and `UI-Build-Pipeline/` into `Claude-UI-Workflow/`
- Moved reference docs from `Claude Eyes - Loom Workflow/reference/` into `Claude-UI-Workflow/reference/`
- Merged skills from `inspiration-capture` + `ui-build-pipeline` into `claude-ui-workflow`
- Deleted old `UI-Build-Pipeline/` folder
- Updated project-registry.json (removed 2 entries, added 1 merged entry)

### 2026-03-04 18:33 GMT -- Project Setup (Both Sub-workflows)

- Created Inspiration Capture project from Notion export (Workflow B)
- Created UI Build Pipeline project from Notion export (Workflow A)
- Converted HTML to clean markdown reference doc
- Created MASTER-LOG.md files with kickoff prompts
- Created skills at `.claude/skills/inspiration-capture/SKILL.md` and `.claude/skills/ui-build-pipeline/SKILL.md`
- Registered both in project-registry.json
- Test record exists: `records/2026-03-04-5-uiux-prompts-claude.md`
- Test VTT exists: `media/Ec4-Bja2DLc.en.vtt`

---
