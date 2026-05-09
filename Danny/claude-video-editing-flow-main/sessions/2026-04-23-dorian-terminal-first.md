---
date: 2026-04-23
clip: dorian-listings-tips
session: 3
duration_final: 51.4s
target: 59s
picks: 6
verdict: accepted
tags: [screen-share, polish-accent, keplo, bridge-pick, terminal-first, rich]
---

# Session — Dorian clip + terminal-first refactor

## Clip

- **Source:** `dorian-listings-tips.mp4` (5:11.7, Keplo screen-share, Polish-accented English)
- **Speakers:** S0 Dorian (primary), S1 Matt ("Mm-hmm" × 2)
- **Format:** Off-camera narration over a live Amazon listing teardown inside Keplo tool
- **Target:** 59s ±10% (53-65s)
- **Final:** 51.4s (under target — deliberate, clean-only cut)

## Revision loop

| Version | Picks | Duration | Feedback | Loop |
|:---:|-------|:--------:|----------|:---:|
| v1-v2 | 9 initial candidates | — | "remove the ones with gibberish" | RE-PICK |
| v3 | 5 clean picks, Option C | 36.8s | "works until 23s, then mishmash" | RE-FLOW |
| v4 | +BRIDGE, expanded STAND_OUT | 51.4s | "this is much better" | ACCEPT |

## Final picks (v4)

| # | Beat | Source | Dur | Note |
|--:|------|--------|----:|------|
| 1 | HOOK | 0.06 → 3.20 | 3.14s | "why people buy your product" |
| 2 | FRAMEWORK | 30.30 → 48.85 | 18.55s | Two-ways thesis (anchor) |
| 3 | BRIDGE ← new | 50.81 → 53.38 | 2.57s | "going to the listing. First of all, main image." |
| 4 | STAND_OUT ← expanded | 98.86 → 114.56 | 15.70s | Setup + reaction in one pick |
| 5 | PRICE | 158.20 → 164.96 | 6.76s | "13 vs 150" |
| 6 | CLOSE | 307.36 → 311.90 | 4.54s | "pretty much your listing done" |

## Rules encoded from this loop (into `SELECTION-RULES.md`)

1. **Screen-share variant** — zoom targets are per-pick, derived from content position, not a fixed percentage cycle. Default 4% talking-head rotation does NOT apply to screen-share UIs (black gutters + off-target zooms). Typical ranges: 115% center (hide chrome), 120-135% for focused content blocks
2. **Reaction beats need their own setup** — a reaction without its setup line dies in a cut. Expand the pick to include the framing that made the reaction inevitable. Don't isolate to save seconds

## Terminal-first refactor (shipped same session)

Danny surfaced the friction: `candidates.md` required VS Code ticking (context switch); ASCII box-art display walled data + quote together per row (unreadable for designers/editors).

**What shipped:**

| File | Purpose |
|------|---------|
| `scripts/picker.py` | Reads `candidates.json` → meta + candidates table + quotes + combos |
| `scripts/lockin.py` | Reads `edl.json` → picks table with target ✓/✗ |
| `scripts/verdict.py` | Prints 4-lane options (a=green · b=cyan · c=yellow · d=red) |
| `scripts/requirements.txt` | `rich>=13.0` |
| `scripts/README.md` | 3-line setup, palette, NO_COLOR fallback |
| `SKILL.md` | Steps 4, 5, 5.5, 9 rewritten; Terminal-first guardrail added |
| `CLAUDE.md` | New top-level "Terminal-first interaction" rule |
| `SELECTION-RULES.md` | +2 variants (screen-share, reaction setup) |
| `reference/pipeline-flow.md` | Fully rewritten as tables |

**Colour approach:** semantic ANSI names (green/yellow/cyan/magenta) — each terminal renders in its own theme. Truecolor hex rejected as brittle + unshareable. `rich` respects `NO_COLOR` env var for plain-text fallback.

**Dependencies:** `rich` 14.3.2 already installed on python3.12. Fresh clones: one line install via requirements.txt.

**Verification (6 tests all passed):**

1. Built `candidates.json` from Dorian's `candidates.md` — 12 candidates + 3 combos
2. `picker.py` live render — coloured table, quotes, combos render cleanly
3. `lockin.py` live render — 6 picks, total 51.26s ✗ (under 59s target — informative)
4. `verdict.py` live render — 4 lanes with distinct colours
5. `NO_COLOR=1` fallback — colour dropped, structure preserved
6. SKILL.md points to scripts, not file ticking

**ChromaDB:** Decision #1762 recorded in `decisions` collection.

**Plan file:** internal plan (not in repo)

## Artefacts

- `../dorian-listings-tips/dorian-listings-tips.mp4` (source)
- `../dorian-listings-tips/edit/transcripts/dorian-listings-tips.json` (Scribe)
- `../dorian-listings-tips/edit/takes_packed.md` (48 phrases)
- `../dorian-listings-tips/edit/candidates.md` (13 ranked)
- `../dorian-listings-tips/edit/candidates.json` ← new (12 structured)
- `../dorian-listings-tips/edit/edl.json` (v2, 6 picks incl. BRIDGE)
- `../dorian-listings-tips/render_v4.sh` (final render script)
- `../dorian-listings-tips/edit/preview_v4.mp4` (51.4s, accepted)
