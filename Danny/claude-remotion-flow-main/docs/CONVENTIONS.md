# claude-remotion-flow — Conventions

> Read this at session start. Conventions enforced by the IntroChapter factory
> so every new chapter inherits the production spine.

## Naming — one slug, three case representations

A chapter is identified by its **slug** in kebab-case, e.g. `workshop-intro-ch03`.
That slug derives every path and identifier:

| Aspect | Pattern | ch03 example |
|---|---|---|
| Slug (canonical) | `<series>-ch<NN>` kebab-case | `workshop-intro-ch03` |
| Composition file | PascalCase derived | `src/WorkshopIntroCh03.tsx` |
| Composition ID (Studio + render CLI) | PascalCase | `WorkshopIntroCh03` |
| Voice config | `scripts/voice/<slug>.config.json` | `scripts/voice/workshop-intro-ch03.config.json` |
| Voice output dir | `public/assets/voice/generated/<slug>/` | `public/assets/voice/generated/workshop-intro-ch03/` |
| Voice files | `chapter.mp3`, `chapter.timings.json`, `chapter.metadata.json`, `_raw/chapter.mp3` | (within slug dir) |
| Source clip (series-level) | `public/assets/source-clips/<series>.mp4` (or `<series>-chapters.mp4` if multi-chapter source) | `public/assets/source-clips/workshop-intro-chapters.mp4` |
| Render output | `out/<slug>.mp4` + npm script `render:<slug>` | `out/workshop-intro-ch03.mp4` |

**Pre-existing comps** (`StackExplainer`, `TreatmentExplainer`, `FormatExplainer`) are series-of-one and keep their names; the convention applies to chapter compositions only.

## Audio pipeline — one continuous stem, peak-limited

```
ElevenLabs (single API call)              ── one consistent room
        ↓
_raw/chapter.mp3 + chapter.metadata.json
        ↓
ffmpeg silencedetect (post-process.py)    ── chapter.timings.json
        ↓
ffmpeg loudnorm  (-16 LUFS / -1.5 dBTP)
        ↓
pedalboard Reverb (wet 0.02 / dry 1.0)    ── 2% house default ("a little air")
        ↓
pedalboard Limiter (-1.0 dBTP)            ── catches reverb tail before encode
        ↓
ffmpeg libmp3lame VBR ~190 kbps           ── chapter.mp3 (final)
```

Why single-stem:
- Per-scene generation produces different "rooms" — each ElevenLabs call is independent decoder context, and reverb tail behaviour drifts with content.
- One TTS call across the whole chapter shares decoder warm-state and reference-audio context, so timbre is identical end-to-end.
- One loudnorm pass measures integrated LUFS over the full voice (more accurate than per-scene).
- One limiter pass catches the worst peak in the chapter.

Why peak limiter:
- Reverb tails extend past the loudnorm true-peak ceiling. Without a limiter on top, those tails clip into the MP3 encode and produce audible distortion on loud syllables.
- Limiter at −1.0 dBTP gives 0.5 dB headroom over the loudnorm target; reverb tail caught before encode.

## Factory contract — what every new chapter inherits

```ts
import { makeIntroChapter } from "./explainer-shared";

makeIntroChapter({
  slug: "workshop-intro-chXX",
  scenes: [
    { id, label, title, sourceStart, clipDurationSeconds },
    ...
  ],
  sourceMp4: "assets/source-clips/<series>.mp4",
  // optional: cardDurationFrames, voVolume, musicBed
});
```

Inherited by default — **never re-wire per comp**:

- Cross-fades (`@remotion/transitions/fade`)
- Chapter cards (auto from scene `label`/`title`)
- SFX intro whoosh + outro boom
- Pre-roll fade-in / post-roll fade-to-black envelope
- Mixer props (`musicHigh`, `musicDuck`, `sfxIntroVolume`, `sfxOutroVolume`)
- Single-stem voiceover playback (one `<Audio>` over the whole timeline)
- Music bed wired-on, default off (set `musicHigh > 0` in `defaultProps` when picked, plus `musicBed` factory field)
- Clip-fit guard: scene VO duration is clamped to `clipDurationSeconds * FPS` so source clips never run past their natural segment. Warns to console on overshoot — trim the VO text in the config and regen.

House defaults:
- `voVolume: 0.65` (~−3.7 dB on top of −16 LUFS — kills clipping)
- `cardDurationFrames: 24` (0.8s flashes; source clip carries the screen time)
- Reverb wet 2% (`--wet 0.02`)
- Limiter ceiling −1.0 dBTP (`--limiter-threshold -1.0`)

## Workflow — author a new chapter

```bash
# 1. Author voice config (scenes: [{id, text}])
$EDITOR scripts/voice/<slug>.config.json

# 2. Author the composition (slug + scenes with sourceStart + clipDurationSeconds)
$EDITOR src/<PascalCaseSlug>.tsx
# Register in src/Root.tsx with id="<PascalCaseSlug>"

# 3. Generate the chapter stem (one ElevenLabs call)
node --experimental-strip-types scripts/voice/generate-vo.ts \
  scripts/voice/<slug>.config.json --mode chapter

# 4. Post-process: silence-detect timings + limit + reverb + encode
./scripts/voice/.venv/bin/python3.12 scripts/voice/post-process.py \
  --target <slug>

# 5. Verify in Studio
npm run dev   # open localhost:3000 → <PascalCaseSlug>

# 6. Render to MP4
npm run render:<slug>
```

## When things go wrong

| Symptom | Likely cause | Fix |
|---|---|---|
| Voice still distorts | Limiter not catching | Drop `--limiter-threshold -1.5` or `--lufs -19` |
| `silence-detect found N regions but config has M scenes` | Inter-scene silence too short or broken | Tune `--silence-noise -38` or `--silence-min 1.0`; or fall back to `--mode per-scene` for that chapter |
| Clip-fit warning `VO+pad XXf exceeds clip length YYf` | VO too long for source segment | Trim text in voice config, regen chapter |
| Purple gradient bleeds through scene | Source clip seek past natural end | Check `clipDurationSeconds` matches reality; verify `sourceStart` |
| Audio drifts vs visuals | Inter-scene break tag length doesn't match `CARD_DURATION_FRAMES` | Tighten `BREAK_BETWEEN_SEC` in `generate-vo.ts` to match card frames |
