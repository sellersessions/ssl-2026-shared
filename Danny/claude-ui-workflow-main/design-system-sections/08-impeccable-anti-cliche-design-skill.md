# Section 08 — Impeccable: anti-cliche design skill for Claude Code

**Status:** Banked — additive layer, stacks with Section 03 (Brand Guidelines skill). Awaiting test-pass.
**Created:** 2026-04-11
**Source:** TikTok `7619538931884772621` (@github.awesome) — transcript in `design-brand-reels-inspiration-extract/`
**Part of:** Design System Unification — strengthens **BUILD** phase and partially pre-empts **Gap #5** (REFINE guard rails)

---

## What it is

- **GitHub:** https://github.com/pbakaus/impeccable
- **Site:** https://impeccable.style/
- **Install:** `npx skills add pbakaus/impeccable` (auto-detects Claude Code, Cursor, Gemini CLI, Codex CLI)

An installable Claude Code skill that acts as an **expert creative director**, explicitly fighting the default frontend look that AI coding agents fall into: **purple gradients, default Inter fonts, nested cards everywhere, generic hero layouts**. It ships with:

- **1 skill + 18 commands** (transcript said 20 — corrected from repo)
- **Curated anti-patterns** — explicit "do not do this" library. Catches gradient text, AI colour palettes, nested cards, low contrast, 20+ rules across HTML / CSS / JSX / TSX / Vue / Svelte.
- **7 domain reference files** — typography, colour/contrast (OKLCH), spatial design, motion design, interaction design, responsive design, UX writing.

**Relationship to Anthropic's native skill:** Anthropic ships a `frontend-design` skill (at `anthropics/claude-code/plugins/frontend-design/`). Impeccable is the **enhanced extension** of that native skill — not a competitor, a layer on top. That's a stronger stack position than Section 03's Brand Guidelines skill pairing, which doesn't share a parent.

## Why it matters

Our current pipeline has brand profiles that say "here's what Seller Sessions looks like". What we *don't* have is an explicit **"here's what nothing should ever look like"** layer. Without it, Claude Code defaults to the same generic look no matter which brand profile it's reading — because the brand profile is a positive constraint and the negative constraint is missing.

Impeccable fills that gap. It's a **negative constraint layer**, preventative rather than corrective.

## How it differs from Section 03

| | Section 03 — Brand Guidelines (Anthropic skill) | Section 08 — Impeccable |
|---|---|---|
| **Shape** | Official Anthropic CC skill | Third-party CC skill |
| **Direction** | Positive constraint — "follow these brand rules" | Negative constraint — "never do these cliches" |
| **Scope** | Per-brand (loads brand spec) | Cross-brand (universal anti-cliche) |
| **Stacks?** | — | **Yes, stacks with Brand Guidelines** |
| **Where it fires** | BUILD phase (during generation) | BUILD phase (during generation) + optional REFINE (as pre-flight check) |

**They're complementary, not redundant.** Brand Guidelines says "Seller Sessions uses `#2F0453`". Impeccable says "and whatever you do, don't gradient it into the background". Both load. Both fire.

## Where it slots in the unification plan

| Plan item | How Impeccable feeds it |
|---|---|
| **BUILD phase** (Workflow B) | Installed as a skill alongside Brand Guidelines. Fires whenever Claude Code generates frontend. |
| **Gap #5: REFINE has no guard rails** | **Partial fit.** Impeccable prevents drift that REFINE would otherwise have to catch. Cheaper to prevent than to flag. Doesn't replace REFINE, but shrinks REFINE's workload. |
| **Section 03** (Brand Guidelines skill) | Stacks. Both load in Claude Code. No conflict — different directions of constraint. |

## Key insight from the transcript

> *"AI coding agents building front-end UIs always default to the same generic look. Purple gradients, default Interfants, nested cards everywhere."*

This is the **exact failure mode** the operator catches in REFINE passes. The Databrill REFINE session (23 Mar) surfaced 10 improvements, many of which were "stop defaulting to generic". Impeccable would have prevented ~30–50% of those before REFINE even ran.

---

## What's UNKNOWN (questions for test-pass)

| Question | Why it matters |
|---|---|
| **Repo / install command** | Video doesn't give it. Need to find the GitHub URL before testing. |
| **What are the 20 steering commands?** | If they're generic ("no purple gradients") they overlap trivially with Brand Guidelines. If they're specific ("use at least one asymmetric layout element per hero") they're genuinely additive. |
| **Does it conflict with a dark brand?** | Databrill is dark-mode-native. If Impeccable's anti-patterns assume light-mode defaults, it could fight the brand. |
| **Does it stack cleanly with Brand Guidelines skill?** | Two skills loaded simultaneously — any order-of-precedence issues? |
| **Can it be pointed at REFINE as well as BUILD?** | If yes, it doubles as a REFINE guard rail (Gap #5). If no, BUILD only. |

## Test-pass plan (before adoption)

1. **Repo discovery (5 min)** — find the GitHub URL. Check the 20 steering commands. Confirm it's still maintained.
2. **Solo install test (10 min)** — install Impeccable into Claude Code, no Brand Guidelines. Ask it to build a Databrill landing hero. Does the output avoid the usual cliches?
3. **Stack test (15 min)** — install BOTH Impeccable AND Brand Guidelines (Section 03). Point at the Databrill brand profile. Same prompt. Compare:
   - Output vs Impeccable-only (does brand compliance still hold?)
   - Output vs Brand Guidelines-only (does anti-cliche guidance actually bite?)
4. **Dark-brand conflict test (5 min)** — run against a dark-mode-native brand (Databrill). Confirm Impeccable doesn't push toward light-mode defaults.
5. **REFINE double-duty test (10 min)** — try using Impeccable as a REFINE-phase pre-flight check (not just BUILD). See if it can review existing code, not just generate new. If yes → it's also a Gap #5 feeder.

**Pass criteria:**
- Tests 2, 3, and 4 all pass without conflict
- Test 3 shows measurable difference vs Brand Guidelines alone (i.e. Impeccable is *doing something*, not just duplicating)
- Test 5 is a bonus — if it works, Impeccable is worth more than we thought

**If tests 2–4 pass → adopt alongside Section 03 as the default BUILD-phase skill stack.**
**If test 5 also passes → it also counts toward Gap #5 (REFINE guard rails), reducing scope of that plan step.**

---

## What this does NOT change

- **pencil.dev** (the other design-lane highlight from the same session) is **not banked yet.** It competes with Stitch in Workflow A, so it's gated behind Section 07's Stitch canvas test. One tool only in DESIGN.
- **Plan step 5** (REFINE guard rails) stays on the plan — Impeccable shrinks its workload but doesn't replace it. REFINE still needs spec-based rollback like SSLive2026.
- **Section 03** stays. Impeccable stacks with it, doesn't replace it.

---

### Short version

> **Impeccable = installable Claude Code skill that fights the default AI frontend look (purple gradients, default Inter, nested cards). Negative constraint layer — complements Section 03's Brand Guidelines skill (positive constraint). Both stack, both load, no conflict expected. Slots into BUILD phase; may also serve as a REFINE pre-flight check (bonus — tested in step 5). Five-test pass plan (~45 min) required before adoption. pencil.dev deliberately NOT banked — it competes with Stitch in Workflow A and is gated behind Section 07's test.**
