# Session: pod-test-claude

> Source: `../pod-test-claude/pod-test-claude.mp4`
> Recorded: 2026-04-23 03:58 BST (Riverside export)
> Duration: 4:26 (raw) -> 60s target

## Summary

First prototype clip for the selection-first video editing workflow. Danny + Shubash on AI voice cloning. Two autonomous render passes were done (v1 full 3:11 cut, v2 60s cut at 46.6s) before Danny redirected the workflow: humans belong at selection, Claude belongs at render-iterate. Rules extracted into `SELECTION-RULES.md`, candidate sheet generated. Awaiting Danny's ticks.

## Source profile

- Single-camera talking-head, 1080p, 24fps, AAC mono
- 68MB, 4:26
- Danny first (0-180s), Shubash second (180-270s)
- Clean Riverside export, no audio issues, no jump cuts

## What was built

| Artifact | Path | Purpose |
|----------|------|---------|
| Scribe word-level transcript | `../pod-test-claude/edit/transcripts/pod-test-claude.json` | Source of truth for word-boundary snapping |
| Phrase-packed transcript | `../pod-test-claude/edit/takes_packed.md` | Grouped on silences >=0.5s, easy to scan |
| SOP | `SELECTION-RULES.md` | Rules for candidate generation + render |
| Candidate sheet | `../pod-test-claude/edit/candidates.md` | 13 candidates ★★★/★★, awaiting ticks |
| v1 EDL | `../pod-test-claude/edit/edl.json` | Autonomous 3:11 cut (not used for final) |
| v1 render | `../pod-test-claude/edit/preview.mp4` | 3:11, has bugs (clipping, black frames, grade drift) |
| v2 render | `../pod-test-claude/edit/preview_v2.mp4` | 46.6s autonomous 60s attempt, clean |
| Master SRT | `../pod-test-claude/edit/master.srt` | 292 cues from transcript + v1 offsets |

## Render pass log

### Pass 1 (v1, autonomous, full 4-min -> 3:11)

- Built from scratch — 11 ranges, every salient beat
- Per-segment grade with auto-detection
- Issues:
  - Audio clipping in one section (excess gain compounding after Riverside mix)
  - Black frames at 2-3 cut boundaries (GOP artefact from `--preview` mode)
  - Colour grade switching mid-playback (per-segment auto-grade drift)
- Verdict: too long, visibly inconsistent

### Pass 2 (v2, autonomous, 60s target -> 46.6s)

- Picks narrowed to HOOK / CADENCE / PODCAST_NO / LOOM_WORKFLOW
- Single `neutral_punch` grade across all segments
- Loudnorm disabled (Danny mixes in Riverside before export)
- 30ms audio fades at every cut
- CRF 20 full render, not `--preview`
- Framing rotation: 100% full / 104% center / 100% full / 104% shifted right
- Verdict: clean. Framing rotation gives multi-cam feel from single-cam source. Danny approved the rendering rules.

### Pass 3 (v3, Danny-picked, 60s target)

**Pending Danny's ticks in `candidates.md`.**

## Rules locked after v2

- Single grade across whole cut (no per-segment drift)
- No loudnorm (Danny mixes audio externally)
- 30ms audio fades at every cut
- Framing rotation applied automatically by pick order
- CRF 20 full render (not `--preview` mode)
- Captions as SRT (not burned) — homebrew ffmpeg lacks libass
- 10% tolerance on target runtime (54-66s for 60s target)

Full rules at `../SELECTION-RULES.md`.

## What Danny pushed back on

**Autonomous selection was wrong.** Danny watching v2 flagged that while the cut was technically clean, the picks weren't his. The insight: selection is a taste decision that reads in seconds, whereas correction (grade, cadence, cut boundaries) is the slow-expensive part.

"We should have a workflow for this so it kind of works in the background of rules."

Translated into: write the SOP once (`SELECTION-RULES.md`), generate the candidate sheet for each clip, let Danny tick, then render. The rules compound across clips, the picks don't.

## Next action

Wait for Danny to tick boxes in `../pod-test-claude/edit/candidates.md` (or reply with a verbal list). Then:

1. Read ticks
2. Validate budget (54-66s)
3. Build v3 EDL with framing rotation by pick order
4. Render per segment + concat
5. Self-eval + open QuickTime
6. If Danny locks it in, commit + update this log. If not, re-tick.
