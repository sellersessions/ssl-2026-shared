# Claude Video Editing Flow — Pipeline

> Terminal-first workflow. Every interaction is a coloured table in the terminal. The only non-terminal moment is QuickTime watching the rendered preview. Works with any `.mp4 / .mov / .mkv / .webm` — Riverside, Loom, Zoom, phone, YouTube download, raw camera.

## The flow

```
TRANSCRIBE → PACK → SCORE → PICK → EDL → BOUNDARY-REVIEW → CLOSE-CHECK → RENDER → WATCH → VERDICT ──┐
                                                                                                     │
                                                ┌────────── LOOP ◀───────────────────────────────────┘
                                                ▼
                                              ACCEPT
```

## Steps

| # | Step | Writes | You see in terminal |
|--:|------|--------|---------------------|
|  1 | Transcribe (Scribe) | `transcripts/<clip>.json` | one-line summary |
|  2 | Pack phrases | `takes_packed.md` | one-line summary |
|  3 | Score candidates | `candidates.md` + `candidates.json` | **picker table + quotes + combos** |
|  4 | You pick | — | natural language reply |
|  5 | Build EDL | `edl.json` | **lock-in table with target ✓/✗** |
| **5.5** | **Boundary review *(pre-render gate 1)*** | updated `edl.json` if shifts needed | **bleed-word report + proposed fixes** |
| **5.7** | **Close check *(pre-render gate 2)*** | updated `edl.json` if trim needed | **closer verdict — land / trail / missing** |
|  6 | Frame check | `frames/seg_NN.png` | one-line done |
|  7 | Render | `preview_vN.mp4` | progress + auto-opens QuickTime |
|  8 | **You watch** *(only non-terminal moment)* | — | QuickTime |
|  9 | You verdict | — | **verdict options table** → your reply |
| 10 | Loop 5.5–9 until accept | — | — |

## What each interaction looks like

### Step 3 — Picker

Claude runs:
```bash
python3 scripts/picker.py <clip>/edit/candidates.json
```

You see a coloured table:

| # | Beat | Dur | Source | Tier | Flag |
|--:|------|----:|--------|:----:|------|
| 1 | Hook — Why People Buy | 4.48s | 0:00 → 0:05 | ★★★ | — |
| 2 | Conversion Framework (full) | 19.70s | 0:29 → 0:49 | ★★★ | anchor |
| 3 | Price Justification | 8.12s | 2:37 → 2:45 | ★★★ | ⚠ stutter |
| … | | | | | |

Plus a **Quotes** block (one per row) and a **Combos** table with pre-computed totals coloured green (in tolerance) or red (out).

### Step 4 — Your pick

Type a combo letter, a number list, `skip N`, or free text:

```
go with option C
1 4 6 9
cut the gibberish
```

### Step 5 — Lock-in

Claude runs:
```bash
python3 scripts/lockin.py <clip>/edit/edl.json
```

You see:

| Pick | Beat | Dur |
|:---:|------|----:|
| 1 | HOOK | 3.14s |
| 2 | FRAMEWORK | 18.55s |
| … | | |
| — | **Total** | **51.26s ✓** |

**Render?** `y` yes · `n` revise · `q` quit

### Step 9 — Verdict

Claude runs:
```bash
python3 scripts/verdict.py <clip>/edit/preview.mp4
```

You see:

| Lane | Action | Say (example) | Means |
|:---:|--------|---------------|-------|
| **a** | ACCEPT *(green)* | "ship it" | write learnings → close |
| **b** | RE-FRAME *(cyan)* | "tighten zoom on 3" | back to step 7 |
| **c** | RE-FLOW *(yellow)* | "23s feels mishmash" | back to step 5 |
| **d** | RE-PICK *(red)* | "scrap, start over" | back to step 4 |

## Persistent vs per-clip

**Persistent** (cross-clip, encoded once)

| Item | Where |
|------|-------|
| SELECTION-RULES.md | project root |
| Framing variants (talking-head · screen-share · vertical) | SELECTION-RULES.md |
| Grade preset: `neutral_punch` | scripts/render_v2.sh |
| Filler-stripping policy | SELECTION-RULES.md |
| ChromaDB collection | `video_editing_flow_decisions` |
| Terminal helpers | `scripts/picker.py` / `lockin.py` / `verdict.py` |

**Per-clip** (artefacts — never opened for interaction)

| Item | Where |
|------|-------|
| Transcripts | `<clip>/edit/transcripts/` |
| Packed phrases | `<clip>/edit/takes_packed.md` |
| Candidates (human + machine) | `<clip>/edit/candidates.md` · `candidates.json` |
| EDL | `<clip>/edit/edl.json` |
| Frame checks | `<clip>/edit/frames/` |
| Per-segment renders | `<clip>/edit/clips_vN/` |
| Final preview | `<clip>/edit/preview_vN.mp4` |

## Worked example — Dorian clip (2026-04-23)

| Version | Picks | Duration | Your feedback | Loop taken |
|:---:|-------|:--------:|---------------|:---:|
| v1–v2 | 9 initial candidates | — | "remove the ones with gibberish" | RE-PICK |
| v3 | 5 clean picks, Option C | 36.8s | "works until 23s, then mishmash" | RE-FLOW |
| v4 | +BRIDGE, expanded STAND_OUT | 51.4s | "this is much better" | ACCEPT |

**Rules encoded into SELECTION-RULES.md from this loop:**

1. Screen-share variant — per-pick zoom on content region, 4% rotation does not apply
2. Reaction beats need their own setup — expand, don't isolate

## The one rule

> Claude scores. You tick. Claude renders. You verdict.
>
> Never does Claude autonomously decide what's "the best cut." Taste is human. Mechanics are Claude's. That split is why it works — and why each verdict makes the next clip sharper.
