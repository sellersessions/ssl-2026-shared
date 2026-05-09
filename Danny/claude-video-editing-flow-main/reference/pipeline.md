# Pipeline walk-through

End-to-end cycle for any Riverside `.mp4`. This is the operator's cheat sheet — for the full SOP see `../SELECTION-RULES.md`.

```
RAW FOOTAGE  ->  TRANSCRIBE  ->  SCAN  ->  CANDIDATES.MD  ->  TICK  ->  RENDER
                                             ^                 v
                                         Claude fills      Human picks
                                        (background)      (foreground)
```

## 1. Drop the clip

Put the `.mp4` in a named folder alongside this repo:

```
~/Claude-Code-Projects-Restored/
  Claude-Video-Editing-Flow/
  <clipname>/
    <clipname>.mp4
```

Good folder names: `ssl-2026-opener`, `danny-tenerife-ep1`, `kerry-form-e-loom`. Avoid spaces.

## 2. Transcribe

```bash
cd "${VIDEO_USE_DIR:-../video-use}"
source .venv/bin/activate
# ELEVENLABS_API_KEY: copy Claude-Video-Editing-Flow/.env.example to .env, fill it, then:
[ -f ../Claude-Video-Editing-Flow/.env ] && set -a && source ../Claude-Video-Editing-Flow/.env && set +a
python scripts/transcribe.py ../<clipname>/<clipname>.mp4 --out ../<clipname>/edit/transcripts/
python scripts/pack_transcripts.py ../<clipname>/edit/transcripts/*.json > ../<clipname>/edit/takes_packed.md
```

Scribe caches under the clip folder. Re-runs are free.

## 3. Generate candidates

Claude reads `takes_packed.md`, scores against `SELECTION-RULES.md`, writes `<clipname>/edit/candidates.md`. 3-5 per tier, ranked ★★★ / ★★.

Example candidate row:

```
### [ ] HOOK  ·  7.12s  ·  [0:00 -> 0:07]

> "Yeah? If you're cloning someone else's voice, it doesn't really matter, as long as it sounds good, right?"

**Why it's top:** Provocative opener, self-contained question.
```

## 4. Tick

Danny opens `candidates.md`, ticks `[x]` on picks, saves file. Says "done" (or lists picks verbally).

## 5. Validate budget

Claude checks sum of ticked durations against target ±10%:

- 60s target -> 54-66s window
- 90s target -> 81-99s window
- 30s target -> 27-33s window

Flags ★★ as drop targets first if over-budget. Suggests highest-ranked unpicked if under-budget.

## 6. Build EDL

Claude writes `<clipname>/edit/edl.json`:

```json
{
  "version": 1,
  "sources": {"<clipname>": "/absolute/path/to/<clipname>.mp4"},
  "ranges": [
    {"source": "<clipname>", "start": 0.120, "end": 7.240,
     "beat": "HOOK",
     "quote": "If you're cloning someone else's voice...",
     "reason": "Strong opening frame."}
  ],
  "grade": "neutral_punch",
  "overlays": [],
  "total_duration_s": <computed>
}
```

Framing rotation assigned by pick order, not by clip timestamp.

## 7. Render

Per-segment extract:

```bash
ffmpeg -y -ss <start> -i <src> -t <duration> \
  -vf "<frame>,eq=contrast=1.06:brightness=0:saturation=1,curves=master='0/0 0.25/0.23 0.75/0.77 1/1'" \
  -af "afade=t=in:st=0:d=0.03,afade=t=out:st=<dur-0.03>:d=0.03" \
  -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -r 24 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart seg_<N>_<beat>.mp4
```

Concat:

```bash
ffmpeg -y -f concat -safe 0 -i _concat.txt -c copy -movflags +faststart preview.mp4
```

Reference implementation at `../scripts/render_v2.sh`.

## 8. Self-eval

- Probe output duration — must be within ±10% of target
- `timeline_view` at each cut boundary + start + end
- Check: no black frames, no grade pops, audio levels match

If any flag fires, re-render the offending segment (not the whole cut).

## 9. Preview

```bash
open <clipname>/edit/preview.mp4
```

QuickTime opens. Danny watches, returns one of:

- **Lock it in** -> commit, update session log, move on
- **Re-tick** -> loop back to step 4 (different picks, same 2-min re-render)
- **Rule bug** -> fix `SELECTION-RULES.md`, apply going forward (then re-tick)

## 10. Ship

- `<clipname>/edit/preview.mp4` — the cut
- `<clipname>/edit/master.srt` — captions as companion
- Upload to destination (YouTube Shorts, TikTok, Instagram Reels, etc)
- Log session at `Claude-Video-Editing-Flow/sessions/<date>-<clipname>.md`

## Framing rotation reference

Source 1920x1080 single-cam talking-head:

| Pick # | ffmpeg filter | Effect |
|--------|---------------|--------|
| 0 | `scale=1920:-2` | 100% full frame (wide baseline) |
| 1 | `scale=1996:1122:flags=lanczos,crop=1920:1080:38:21` | 104% center (pseudo "close camera") |
| 2 | `scale=1920:-2,crop=1920:1080:0:0` | 100% full (fresh angle) |
| 3 | `scale=1996:1122:flags=lanczos,crop=1920:1080:62:21` | 104% shifted right |
| 4+ | Cycle repeats | |

Subtle — 4% scale change only. No motion, no zooms, no Ken Burns.

## Grade reference

Single `neutral_punch` preset applied to every segment:

```
eq=contrast=1.06:brightness=0.0:saturation=1.0
curves=master='0/0 0.25/0.23 0.75/0.77 1/1'
```

Contrast bump + subtle S-curve. No colour shift. Creative looks (`warm_cinematic`, etc) only on explicit request.

## Audio reference

- `afade=t=in:st=0:d=0.03` — 30ms fade-in at start of segment
- `afade=t=out:st=<dur-0.03>:d=0.03` — 30ms fade-out at end
- Codec: `aac -b:a 192k -ar 48000`
- **No loudnorm.** Danny mixes in Riverside before export.
