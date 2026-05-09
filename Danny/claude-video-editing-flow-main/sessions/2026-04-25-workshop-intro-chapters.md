---
clip: workshop-intro-chapters
date: 2026-04-25
session_n: 6
mode: chapter-cut (NEW)
source_type: loom-screen-share
duration_in: 22:33
duration_out: 17:17
chapters: 10
status: rendered
---

# Workshop Intro — chapter-cut session

## Source

| Field | Value |
|-------|-------|
| File | `../workshop-intro-chapters/workshop-intro-chapters.mp4` |
| Length | 22:33 (1353.8s) |
| Source type | Loom screen-share, single speaker, voiceover |
| Transcript | 2,528 words, ElevenLabs Scribe, 40s upload |
| Speaker | Danny (single, `speaker_0`) |

## What this session unlocked

A **new pipeline mode** — chapter-cut. Previously the pipeline did:

- single clip → one 60s short (selection mode, `picker.py`)
- folder of clips → folder of 60s assets (batch mode, `batch.py`)

Now it can do:

- **single long clip → N chapter assets at variable length** (chapter mode, this session)

Driven by:

1. ElevenLabs transcript
2. Claude semantic chapter detection (read transcript, propose chapter map)
3. Per-chapter EDL build with Medium cleanup (filler drop + silence collapse)
4. Render each chapter via `render.py`

## Chapter map (10)

| # | Title | Start | End | Source dur | Render dur | Drop | Segs |
|---|-------|------:|----:|-----------:|-----------:|-----:|----:|
| 01 | Workflow Overview & VS Code Setup | 00:00 | 02:28 | 148.2s | 128.5s | 13.3% | 19 |
| 02 | Themes — Designers vs Programmers | 02:28 | 04:11 | 103.4s | 82.9s | 19.9% | 14 |
| 03 | Extensions & Recovering from Loops | 04:11 | 06:49 | 157.6s | 119.0s | 24.5% | 21 |
| 04 | Settings, Sidebar & Asking Claude for Help | 06:49 | 08:15 | 86.2s | 73.4s | 14.8% | 9 |
| 05 | Screenshots & Typora Markdown Workflow | 08:15 | 11:21 | 186.6s | 128.0s | 31.4% | 23 |
| 06 | Slash Commands, Agents & Master Log | 11:21 | 12:53 | 91.6s | 62.3s | 32.0% | 9 |
| 07 | Human in the Loop vs Fixed Automation | 12:53 | 14:25 | 92.3s | 66.1s | 28.3% | 19 |
| 08 | Actions Per Minute & Domain Knowledge | 14:25 | 17:22 | 176.3s | 142.2s | 19.3% | 30 |
| 09 | Iteration & The One-Shot Myth | 17:22 | 20:42 | 199.8s | 155.6s | 22.1% | 28 |
| 10 | Closing — Build, Don't Imitate | 20:42 | 22:33 | 111.8s | 79.4s | 29.0% | 20 |
| — | **Total** | — | — | **1353.8s** | **1037.4s** | **23.4%** | **192** |

## Cleanup spec — Medium

- **Silence split:** gap >= 0.9s between words = segment break
- **Filler drop:** standalone segments matching `{um, uh, er, erm, ah, umm, uhh, mm, mhm}` removed
- **Min keep:** segments shorter than 0.4s discarded
- **Head/tail pad:** 0.05s lead-in, 0.15s tail-out per segment
- **Boundary clamp:** segments cannot extend outside chapter range

## Render spec (locked, all 10)

- Single `neutral_punch` grade across whole chapter
- 30ms audio fades at every internal cut (silence-collapse boundaries)
- Framing rotation cycle: `100% / 104% center / 100% / 104% right`
- CRF 20, preset fast, 24fps, +faststart
- Format: horizontal 1920×1080
- No loudnorm (Riverside/Loom mix preserved)

## Files produced

```
workshop-intro-chapters/
  workshop-intro-chapters.mp4               # source (95.5 MB)
  edit/
    transcripts/workshop-intro-chapters.json    # 877 KB ElevenLabs Scribe
    chapters_proposed.json                       # chapter map
    chapters_summary.json                        # cleanup ledger
    build_chapter_edls.py                        # one-off cleanup script
    edls/
      01_workflow-overview-vs-code-setup.edl.json
      02_themes-designers-vs-programmers.edl.json
      03_extensions-recovering-from-loops.edl.json
      04_settings-sidebar-asking-claude-for-help.edl.json
      05_screenshots-typora-markdown-workflow.edl.json
      06_slash-commands-agents-master-log.edl.json
      07_human-in-the-loop-vs-fixed-automation.edl.json
      08_actions-per-minute-domain-knowledge.edl.json
      09_iteration-the-one-shot-myth.edl.json
      10_closing-build-dont-imitate.edl.json
  assets/
    01_workflow-overview-vs-code-setup.mp4    # 7.5 MB · 02:08
    02_themes-designers-vs-programmers.mp4    # 4.6 MB · 01:23
    03_extensions-recovering-from-loops.mp4   # 8.3 MB · 01:59
    04_settings-sidebar-asking-claude-for-help.mp4  # 5.6 MB · 01:13
    05_screenshots-typora-markdown-workflow.mp4     # 7.3 MB · 02:08
    06_slash-commands-agents-master-log.mp4   # 3.3 MB · 01:02
    07_human-in-the-loop-vs-fixed-automation.mp4    # 4.4 MB · 01:06
    08_actions-per-minute-domain-knowledge.mp4      # 8.4 MB · 02:22
    09_iteration-the-one-shot-myth.mp4        # 8.6 MB · 02:35
    10_closing-build-dont-imitate.mp4         # 4.9 MB · 01:19
```

Total assets: **62.9 MB across 10 MP4s**, 17:17 of cleaned content.

## Observations

- **Chapters 5, 6, 7, 10 had >28% drop** — these have higher dead-air ratios (screen-share switching, philosophy beats with longer pauses). Material was preserved; only filler + silence collapsed.
- **Chapters 1, 4 had <15% drop** — denser intro/setup explanation, less dead air to remove.
- **Render durations matched EDL targets within 0.5s** — fade overlap accumulates ~30ms × n_cuts. Acceptable.
- **No Gate 2 (landing) failures** — chapter mode inherits chapter-end from the chosen boundary, so landing is by-construction.

## Next moves

- [ ] Watch a sample chapter (recommend 06 or 10 — short + clean) to verify cleanup feel
- [ ] Decide: promote `build_chapter_edls.py` to `Claude-Video-Editing-Flow/scripts/chapters.py` (reusable for any Loom walkthrough)?
- [ ] Feed these 10 assets to claude-remotion-flow as the demo-3 input — proves the "edit-to-finished-short" beat with real screen-share content
- [ ] If chapter 5 drop feels too aggressive (31%), drop "like / you know" out of the FILLERS set and re-render

## Pipeline shape demonstrated

```
22-min Loom .mp4
    │
    ├── ElevenLabs Scribe ──→ transcripts/<clip>.json
    │
    ├── Claude reads transcript ──→ chapters_proposed.json (10 titles + boundaries)
    │
    ├── build_chapter_edls.py ──→ edls/NN_<slug>.edl.json (192 ranges total)
    │       (silence split @ 0.9s · filler drop · 0.4s min)
    │
    └── render.py × 10 ──→ assets/NN_<slug>.mp4
            (neutral_punch · 30ms fades · framing rotation · CRF 20 · 1080p)
```
