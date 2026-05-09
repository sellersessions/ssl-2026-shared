---
date: 2026-04-23
clip: pod-test-claude
session: 4
duration_final: 49.19s
target: 60s
picks: 5
verdict: accepted
tags: [podcast, two-speaker, terminal-first, boundary-review, close-check, jump-cut]
---

# Session — pod-test-claude Combo A + pre-render gates

## Clip

- **Source:** `pod-test-claude.mp4` (4:26, Danny + Shubash on AI voice cloning)
- **Speakers:** S0 Danny (primary, 0-186s), S1 Shubash (187-266s)
- **Format:** Two-person face-to-face podcast conversation
- **Target:** 60s ±10% (54-66s)
- **Final:** 49.19s (under target — Danny chose the cleaner lean cut over filler to hit the budget)

## The pick

Danny picked **Combo A — Voice Ethics Arc** from the 3 pre-computed combos:

| # | Beat | Source | Tier |
|--:|------|:---:|:---:|
| 1 | HOOK — Cloning Ethics | 0:00 → 0:07 | ★★★ |
| 9 | Validation | 0:14 → 0:22 | ★★ |
| 2 | Cadence Limit (tight) | 1:14 → 1:30 | ★★★ |
| 4 | Podcast No | 1:46 → 1:49 | ★★★ |
| 5 | Loom Workflow | 1:59 → 2:18 | ★★★ |

All Danny (no Shubash). Utility-focused. Target: 55.0s.

## Revision loop

| Version | Dur | Feedback | Loop |
|:---:|:---:|----------|:---:|
| v3 | 54.81s | "`voices` bleeds into VALIDATION; `part` bleeds into LOOM; ending trails on 'live with the voice a bit'" | RE-FLOW |
| v4 | 49.19s | "this is much better all round, and especially the colour grading. Very happy with that." | ACCEPT |

## Boundary review (Gate 1) — applied in v4

Word-level Scribe JSON inspected at ±1.5s around every EDL boundary:

| Pick | Boundary | Was | Bleed detected | Fixed to | Delta |
|------|----------|----:|---------------|-------:|------:|
| VALIDATION | start | 13.58 | `voices,` (13.58→14.14) from prior phrase | **15.00** | +1.42s |
| LOOM | start | 118.96 | `part and parcel with it` tangent (118.96→120.16) | **120.56** | +1.60s |
| LOOM | end | 138.54 | trailed past the landing | **135.90** | −2.64s |

## Close check (Gate 2) — applied in v4

v3 ended on *"…live with the voice a bit"* — trailed, didn't land. v4 trimmed LOOM to end on *"Claude can do the work. It can write them."* — quotable payoff, clean landing.

## Rules encoded from this loop

**Gate 1 — Transcript boundary review (pre-render).** Read word-level Scribe JSON at ±1.5s around every EDL `start`/`end`. Reject any bleed-in tail words, mid-phrase cuts, or mid-word starts. Shift to nearest silence/phrase edge. Render only after sign-off.

**Gate 2 — Close check (pre-render).** HOOK alone isn't enough. Last pick must land: quotable payoff, decision/callback, or natural sign-off. Reject trailing ends. Propose trim-to-landing or add CLOSE candidate if no natural closer in picks.

## Reframe — per-clip outputs are ASSETS, not finished pieces

Danny surfaced a new intent:

> "One of the biggest things we have to do is prepare your files in sections. Now we've done it to a point of one, but it's better to be the jump cut style, and then it can be refined when you're actually piecing all these components together. Jump cuts work well with reels and short videos anyway. Also, I plan to take some of these edits and then I'll feed them into our Claude Remotions Flow, as we can mix and match that with animations and text and overlays on top so it will mask some of the discrepancies."

**Implication for the workflow:** the target output shape is a **library of cut assets**, not polished short-form clips. Jump cuts are the intent. Polish happens downstream in Claude Remotion Flow composition where animations, captions, and overlays mask residual discrepancies.

**New top of backlog:** batch/asset mode — accept a folder of raw `.mp4`s, run each through the flow, output to a shared assets library for Remotion composition.

## Artefacts

- `../pod-test-claude/pod-test-claude.mp4` (source, 4:26)
- `../pod-test-claude/edit/candidates.md` (13 ranked, pre-existing from Session 1)
- `../pod-test-claude/edit/candidates.json` ← new (machine-readable for picker)
- `../pod-test-claude/edit/edl.json` (v3 → boundary-reviewed v4)
- `../pod-test-claude/render_v4.sh` (final render script)
- `../pod-test-claude/edit/preview_v4.mp4` (49.19s, accepted, 20.3MB)

## Files updated in this project

- `SELECTION-RULES.md` — appended "Pre-render gate rules" section with both gates + derivation notes
- `reference/pipeline-flow.md` — updated flow diagram + step table (5.5 boundary review, 5.7 close check)
- `.claude/skills/claude-video-editing-flow/SKILL.md` — steps 5.6 and 5.7 added; re-flow path now loops back to 5.5 (not 5.5 only)
- `MASTER-LOG.md` — Session 4 logged; Next Up updated (batch/asset mode now top)

## ChromaDB

Decision #1773 in `video_editing_flow_decisions`.
