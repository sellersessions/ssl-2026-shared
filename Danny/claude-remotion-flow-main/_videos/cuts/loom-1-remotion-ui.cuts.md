# Loom 1 cut sheet : Remotion UI (v6, will be replaced by v7)

**Source:** https://www.loom.com/share/783f203e026c423ebc53cbe15509c0eb
**Title:** How ReMotion and Claude Create Videos
**Source duration:** 05:13 (313s)
**v6 output duration:** 42.42s (TOO SHORT — see Next Up)
**v6 output size:** 2.9 MB
**Output path:** `claude-remotion-flow/out/loom-1-remotion-ui.mp4`
**Purpose:** README clip for `claude-remotion-flow` + SSL 2026 deck slot
**Target for v7:** ~2:30 (~150s) under 10 MB

## v6 keep ranges (word-precise, neighbor-constrained, 150ms breath room)

| # | label | in (s) | out (s) | seconds | first word | last word | source content |
|---|---|---|---|---|---|---|---|
| 1 | Open | 4.910 | 28.420 | 23.51 | "Out" | "timeline" | Hook + composition list summary, ending sharp at "timeline" before redundant "here" |
| 2 | Claude | 29.690 | 31.810 | 2.12 | "You" | "Claude." | "You will be speaking to Claude." (after excised "here.") |
| 3 | Alchemist | 212.350 | 221.130 | 8.78 | "what" | "video." | "what you're doing is you're doing the overseeing and guidance. So you become the alchemist of guiding of how you want to make this video." |
| 4 | Wrap | 303.770 | 311.650 | 7.88 | "So" | "plugins." | "So hopefully this will be useful enough to get you started and over time you can start adding your own plugins." |

## v7 plan (next session)

Target ~2:30. Add back content cut from v6:
- Some of the composition list walk (which compositions exist, claude-video-editing-flow / claude-ui-flow / stack explainer references)
- File menu walk (keep brief — open GitHub, render, packages, plugins) — but skip the verbose codec / h264 / gifs detour
- Visual playback flash (the "if I play this now" demo that shows intro + SFX + walkthrough fragment) for visual variety
- Skip retained: verbal repetitions ("design system... design system", "in the day... at the end of the day... Claude is going to ... Claude is going to"), the "Lasting on this" filler, redundant trailing "here" after "timeline"

After v7 cut: `ffmpeg -i out/loom-1-remotion-ui.mp4 -c:v libx264 -preset medium -crf 26 -c:a aac -b:a 128k out/loom-1-remotion-ui.web.mp4` to land under 10 MB for free-tier GitHub release upload.

## Workflow doctrine (locked in S29)

1. Word-level Whisper (`whisper --word_timestamps True`).
2. Pick keeps by phrase markers (start_phrase + end_phrase), not by timestamp.
3. `cut_in = max(prev_out + ε, prev_substantive_word_end + ε, first_word_start - 150ms)`.
4. `cut_out = min(last_word_end + 150ms, next_substantive_word_start)`.
5. Filter Whisper sub-100ms ghost words.
6. Combine adjacent kept ranges that are continuous in source.
7. 80ms fade-in / 80–120ms fade-out.
8. **RE-transcribe rendered output and read sentences.** Zero fragments, zero verbal repetitions. Whisper artefacts on the rendered output are not actionable — Danny listens for the truth.

## Status

- [x] Transcript extracted (segment + word level)
- [x] v1–v6 iteration complete
- [x] Workflow doctrine locked in MASTER-LOG S29
- [ ] v7 cut to ~2:30 target — pending
- [ ] CRF 26 web encode — pending
- [ ] Slotted into README placeholder — pending
- [ ] Danny final sign-off — pending
