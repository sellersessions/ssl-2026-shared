---
clip: claude-code-loom-5cacb8d1
date: 2026-04-28
session_n: 7
mode: chapter-cut
source_type: loom-screen-share
source_url: https://www.loom.com/share/5cacb8d15aac4d8ba2d739b5513aff5f
duration_in: 19:08
duration_out: 15:07
chapters: 10
status: rendered
---

# Tool Installation For Windows -- chapter-cut session

## Source

| Field | Value |
|-------|-------|
| Loom URL | https://www.loom.com/share/5cacb8d15aac4d8ba2d739b5513aff5f |
| File | `claude-code-loom-5cacb8d1/tool-installation-windows.mp4` (196 MB) |
| Length | 19:08 (1147.8s) |
| Source type | Loom screen-share, single speaker, voiceover |
| Speaker | Leo (single, `speaker_0`) |
| Title | Tool Installation For Windows (Claude Desktop, VS Code, Claude Code, MCPs, n8n) |

## Pipeline path

1. **Loom -> mp4** -- `yt-dlp` direct on share URL (no login). 275 fragments hls-raw merged to single `.mp4`, 196 MB.
2. **Transcribe** -- ElevenLabs Scribe via `video-use/helpers/transcribe.py`. 5,917 words, 46s upload.
3. **Chapter map (Claude-led)** -- read transcript, propose 10 chapters, pin n8n start/end (05:11 -> 07:18) for removal.
4. **EDLs** -- `edit/build_chapter_edls.py` (forked from workshop-intro) supports per-chapter `sub_ranges` so Ch1 can drop the in-intro n8n mention.
5. **Render** -- `Claude-Video-Editing-Flow/scripts/render.py` per chapter, horizontal 1080p.

## n8n removal

Two cuts:

- **Mid-intro mention** (Ch01): 00:23.7 -> 00:44.0 dropped ("And then in, uh, last but not least... So I will be showing you how to create an account in n8n. **But without further ado**...")
- **Whole n8n section**: 05:11 -> 07:18 dropped (~2:07). Ch04 ends at "we're going to be needing this." Ch05 picks up at 07:21.3 "show you how you can install the MCPs", skipping the awkward "Hello again, I just remembered I forgot to" recovery preamble.

## Chapter map (10)

| # | Title | Source range | Source dur | Render dur | Drop | Segs |
|---|-------|------:|-----------:|-----------:|-----:|----:|
| 01 | Intro & What We'll Install | 00:00->00:23 + 00:44->00:53 | 32.7s | 31.3s | 4.3% | 2 |
| 02 | Claude Desktop -- Windows Install | 00:53->02:08 | 75.5s | 72.4s | 4.3% | 4 |
| 03 | VS Code -- Windows Install | 02:08->04:04 | 115.5s | 97.7s | 15.6% | 7 |
| 04 | Claude Code Extension in VS Code | 04:04->05:11 | 67.0s | 62.7s | 6.6% | 4 |
| 05 | MCPs -- Node + NVM Setup | 07:21->10:22 | 180.7s | 158.1s | 12.7% | 16 |
| 06 | Sequential Thinking MCP | 10:22->12:24 | 122.3s | 112.8s | 8.0% | 10 |
| 07 | Adding MCPs to Claude Code (.claude.json) | 12:24->14:36 | 132.3s | 120.7s | 8.9% | 10 |
| 08 | Context7 MCP + Free API Key | 14:36->17:26 | 169.4s | 157.2s | 7.4% | 13 |
| 09 | Global vs Project-Level MCPs | 17:26->18:48 | 82.0s | 75.9s | 7.7% | 7 |
| 10 | Closing & Q&A | 18:48->19:07 | 19.7s | 18.5s | 6.1% | 1 |
| -- | **Total** | -- | **1097.1s** | **907.1s** | **17.3%** | **74** |

## Cleanup spec -- Medium (matches workshop-intro)

- Silence split: gap >= 0.9s = segment break
- Filler drop: standalone `{um, uh, er, erm, ah, umm, uhh, mm, mhm}`
- Min keep: < 0.4s
- Head/tail pad: 0.05s / 0.15s
- 30ms audio fades, single `neutral_punch` grade, framing rotation, CRF 20

## Files produced

```
claude-code-loom-5cacb8d1/
  tool-installation-windows.mp4              # source (196 MB)
  edit/
    transcripts/tool-installation-windows.json   # 1018 KB Scribe
    chapters_proposed.json                        # chapter map (with sub_ranges)
    chapters_summary.json                         # cleanup ledger
    build_chapter_edls.py                         # forked builder (sub_ranges support)
    edls/
      01_intro-what-well-install.edl.json        ... 10_closing-qa.edl.json
  assets/
    01_intro-what-well-install.mp4               1.7 MB  00:31
    02_claude-desktop-windows-install.mp4        5.6 MB  01:12
    03_vs-code-windows-install.mp4               7.8 MB  01:38
    04_claude-code-extension-in-vs-code.mp4      5.3 MB  01:03
    05_mcps-node-nvm-setup.mp4                  11.7 MB  02:38
    06_sequential-thinking-mcp.mp4               8.3 MB  01:53
    07_adding-mcps-to-claude-code-claudejson.mp4  9.9 MB  02:01
    08_context7-mcp-free-api-key.mp4            13.5 MB  02:37
    09_global-vs-project-level-mcps.mp4          5.4 MB  01:16
    10_closing-qa.mp4                            1.1 MB  00:19
```

Total assets: **67.1 MB across 10 MP4s**, 15:07 of cleaned, n8n-free, Claude-Code-focused content.

## What's new for the project (vs workshop-intro session)

- **Loom URL -> mp4 leg added**: `yt-dlp` on the share URL works without login -- write up in pipeline doc.
- **`sub_ranges` builder variant**: chapters can be discontinuous, enabling in-chapter trims (e.g. dropping a single sentence). Workshop-intro's builder only handled contiguous chapter ranges.
- **Single-speaker num_speakers=1 hint** to Scribe -- helps diarization on screen-share voiceover.

## Next moves

- [ ] Watch a sample chapter (recommend 04 or 05 -- short + most-relevant to "focus on Claude Code") to verify the cuts feel right.
- [ ] Decide whether to promote `build_chapter_edls.py` (this fork) to `Claude-Video-Editing-Flow/scripts/chapters.py` -- the sub_ranges feature is generally useful.
- [ ] If any chapter drops feel too aggressive, drop "you know" / "like" out of FILLERS and re-render that chapter only.
- [ ] Optional: feed the 10 assets into claude-remotion-flow as the next demo input -- proves the loom-source path of the chapter pipeline.
