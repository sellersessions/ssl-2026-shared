# Source of Truth — claude-remotion-flow

> One doc. Everything that defines how a video gets made in this repo:
> design, audio, timing, factories, recipes, and what's currently inconsistent.
> Read top-to-bottom once; after that, jump by section.
>
> Replaces `docs/CONVENTIONS.md` + `HOW-TO-SHIP-AN-EXPLAINER.md` (kept in
> place for now until this is signed off).

## Contents

1. [TL;DR — the spine](#tldr--the-spine)
2. [Composition status](#composition-status)
3. [Two patterns, three flavours](#two-patterns-three-flavours)
4. [Audio system](#audio-system)
5. [Visual design system](#visual-design-system)
6. [Timing & envelope](#timing--envelope)
7. [Factories](#factories)
8. [Voice pipeline](#voice-pipeline)
9. [Recipe — ship a Type-A explainer](#recipe--ship-a-type-a-explainer)
10. [Recipe — ship a Type-B tutorial](#recipe--ship-a-type-b-tutorial)
11. [Drift & open decisions](#drift--open-decisions)
12. [Files index](#files-index)

---

## TL;DR — the spine

Every video in this repo is **1920×1080 / 30fps**, opens with a **whoosh**,
closes with a **boom**, and (now) sits over the same **HOUSE_DEFAULT** music
bed. Voice is the **Danny Raw Voice 2026** ElevenLabs Pro clone. Palette is
the SSL purple gradient with `#753EF7` as the accent.

| Spine element | Value | Lives in |
|---|---|---|
| Resolution | 1920×1080 | `tokens.ts` (`CANVAS_W`/`CANVAS_H`) |
| Frame rate | 30 fps | `constants.ts` (`FPS`) |
| Music bed (default) | `HOUSE_DEFAULT` (10:13 cinematic-ambient loop) | `audio-beds.ts` |
| Bed volume | flat (no ducking), 0.08–0.12 per comp | per-comp `BED_VOLUME` const |
| Intro SFX | Pixabay `whoosh-8` (3.79s) | `constants.ts` (`SFX_INTRO`) |
| Outro SFX | Pixabay `cinematic-boom` (2.09s) | `constants.ts` (`SFX_OUTRO`) |
| Background | linear-gradient `#0C0322 → #1a1a2e → #461499` | `tokens.ts` (`BG`) |
| Accent | `#753EF7` (purple), `#FBBF24` (amber), `#22d3ee` (cyan) | `tokens.ts` |
| Font | Inter (Google Fonts, loaded in tokens) | `tokens.ts` (`FONT`) |
| Safe-area | 120px X / 80px Y target (drift allowed) | `tokens.ts` (`SAFE_INSET_*`) |
| Voice | ElevenLabs `jQOgcOzmmipekvxJN09W` "Danny Raw Voice 2026" | voice configs in `scripts/voice/` |

If a new comp doesn't honour all 11 of these, it's a deviation — flag it
in the [composition status table](#composition-status) below and explain why.

---

## Composition status

Truth as of 2026-04-28. **Type** column: A = voice-driven explainer,
B = pre-recorded tutorial. **Bed** column shows what's wired today.

| # | Composition | Type | Bed | Bed mech | Ducking | SFX intro/outro | Opener / closer | Voice norm |
|---|---|---|---|---|---|---|---|---|
| 1 | `FormatExplainer` | A (hand-built) | HOUSE_DEFAULT | flat 0.08 | ❌ removed | inherits constants | envelope (preroll + whoosh→title→boom) | per-scene MP3s, no formal pipeline |
| 2 | `TreatmentExplainer` | A (hand-built) | HOUSE_DEFAULT | flat 0.12 | ❌ removed | 0.65 / 0.55 | envelope | per-scene MP3s |
| 3 | `StackExplainer` | A (hand-built) | HOUSE_DEFAULT | flat 0.10 | ❌ removed | 0.55 / 0.55 | envelope | per-scene MP3s |
| 4 | `WorkshopIntroCh03` | A (factory) | wings | factory `musicHigh` | ⚠️ schema still has it (`musicDuck` is dead) | 0.7 / 0.7 | factory (whoosh on first card, boom on lead-in) | single-stem chapter pipeline |
| 5 | `WorkshopIntroCh05` | A (factory) | wings | factory | ⚠️ same | 0.7 / 0.7 | factory | single-stem chapter |
| 6 | `WorkshopVideo01TheSetup` | A (factory) | wings | factory | ⚠️ same | 0.7 / 0.7 | factory | single-stem chapter |
| 7 | `WorkshopVideo02TheSystem` | A (factory) | wings | factory | ⚠️ same | 0.7 / 0.7 | factory | single-stem chapter |
| 8 | `WorkshopVideo03TheToolkit` | A (factory) | wings | factory | ⚠️ same | 0.7 / 0.7 | factory | single-stem chapter |
| 9 | `WorkshopOverview` | A (factory) | cherry-orchard (deliberate signature pick) | factory `musicHigh 0.35` | ⚠️ same | 0.7 / 0.7 | factory | single-stem chapter |
| 10 | `UmbrellaTutorial` | B (custom) | HOUSE_DEFAULT | flat 0.10 | ❌ never had it | 1.0 / 0.55 | manual SFX, no shared envelope | loudnorm + limiter (Loom) |
| 11 | `ClaudeCodeToolsWindows` | B (TimelineAudio) | HOUSE_DEFAULT | `bed.volume=0.1` via `TimelineAudio` | ❌ never had it | 0.5 / 0.5 | `TimelineAudio` (sequential mode) | n/a (recorded VO, Loom cuts) |

**What this table tells us:**

- Bed unification is **3/11 done** (Format / Treatment / Stack / ClaudeCodeToolsWindows = 4 actually). Workshop wings 5+ Overview = 6 still on legacy beds.
- Ducking removed in 4 comps (FormatExplainer / Treatment / Stack / Tools). 6 Workshop comps still carry the `musicHigh / musicDuck` schema, but `musicDuck` is **dead code** — `intro-chapter.tsx:192` does `void musicDuck;`.
- SFX volumes are **all over the place** (0.45–1.0). No comp uses the constant defaults from `constants.ts`.
- Only **5/11 comps** use any shared audio helper (`TimelineAudio` or `makeIntroChapter`). The other 6 wire SFX/bed inline.

---

## Two patterns, three flavours

There are **two video patterns** in the repo (voice-driven A vs. recorded
tutorial B), and Type A has split into **three flavours** as the codebase
matured:

```
Type A — voice-driven explainer
├── A1: hand-built (Format, Treatment, Stack, WorkshopOverview-style custom)
│        → bespoke scene components, manual TransitionSeries, per-scene MP3s
│        → use when each scene needs unique motion design
│
├── A2: chapter factory (Workshop wings × 5, Overview)
│        → makeIntroChapter() wraps source-clip slices in standard spine
│        → use when scenes are "card → source clip" with shared chrome
│
Type B — pre-recorded tutorial
└── B1: timeline audio (ClaudeCodeToolsWindows; UmbrellaTutorial = legacy custom)
         → Series of OffthreadVideo clips back-to-back + shared TimelineAudio
         → use for Loom/screen-record sets that already have voice baked in
```

**Picking the right flavour:**

| If you have… | Use |
|---|---|
| A treatment doc and need per-scene custom motion | A1 hand-built |
| Source clips + voice script + want chrome auto-applied | A2 factory |
| A set of finished video clips with voice already on them | B1 TimelineAudio |

**The ones that don't fit:** `UmbrellaTutorial` is a B-pattern that pre-dates
`TimelineAudio` and wires SFX manually. Should be migrated to `TimelineAudio`
when next touched (low priority — it works).

---

## Audio system

The audio doctrine is now **simple and explicit**:

> One looped bed, one whoosh in, one boom out. No ducking.
> All we need to decide per-comp is the placements and the volume floor.

### The bed — `HOUSE_DEFAULT`

- File: `assets/music/ssl-live-beds/_loops/penguinmusic-emotions-cinematic-ambient-bed10min.wav`
- Length: ~10:13 (32× loop of a 19.21s 4-bar phrase, 61ms equal-power crossfades, no tail-fade)
- Built with `Claude-Video-Editing-Flow/scripts/loop_bed.py` + `tools/loop-cutter`
- Long enough for any short-form video without seam concerns

**Volume floors** (flat across the comp — never ducked):

| Comp type | `BED_VOLUME` | Why |
|---|---|---|
| Hand-built A explainer (motion + voice) | 0.08 – 0.12 | Voice carries the show; bed = atmosphere |
| Factory A explainer (chapter wings) | TBD (see [Drift](#drift--open-decisions)) | Currently `musicHigh: 0.15` — review post-migration |
| B tutorial (recorded VO baked in) | 0.10 | Recorded VO is louder — bed sits quieter |

### Ducking — **removed**

Ducking was the original mixer pattern (`musicHigh` / `musicDuck` in
`constants.ts` and `metadata.ts:buildMusicVolume`). It caused more problems
than it solved (artifacts, hard to listen-test). **Decision (28 Apr 2026):
no comp uses ducking.** The bed sits at a flat low volume; voice rides on
top.

What this means in code:

- `MUSIC_HIGH` / `MUSIC_DUCK` / `DUCK_RAMP` / `MUSIC_FADE_OUT_FRAMES` constants in `constants.ts` → **deprecated**, candidate for removal once Workshop comps migrate.
- `buildMusicVolume()` in `metadata.ts` → **dead code**, no caller.
- `musicHigh` / `musicDuck` props on Workshop comps → **migrate to flat `BED_VOLUME` const** (see [Drift](#drift--open-decisions) for the cleanup list).
- Hand-built A comps (Format/Treatment/Stack) and ClaudeCodeToolsWindows are already on the flat-`BED_VOLUME` pattern.

### The bookends — whoosh + boom

| SFX | File | Length | Default volume (constant) |
|---|---|---|---|
| Intro whoosh | `pixabay-ksjsbwuil-whoosh-8-6b32a439bc.mp3` | 114 frames (3.79s) | `SFX_INTRO_VOLUME = 0.45` |
| Outro boom | `pixabay-universfield-impact-cinematic-boom-be1e4daf3e.mp3` | 63 frames (2.09s) | `SFX_OUTRO_VOLUME = 0.55` |

**Per-comp volumes drift** — the constants are defaults but every
composition currently overrides via `defaultProps`. That's fine *as long
as the override is intentional*. If you find yourself copy-pasting the
same override across 3 comps, it belongs in the constants instead.

### Placements

The whole audio question reduces to **where the SFX fire** relative to
the visual. Three placement modes are defined in `audio-timeline.ts`:

| Mode | Layout | Use for |
|---|---|---|
| `sequential` | whoosh → visual → boom (no overlap) | Recorded tutorials where voice carries pacing (B1) |
| `envelope` | preroll holds whoosh → visual → boom decays into postroll | Hand-built explainers where the title fades in under the whoosh peak (A1) |
| `carded` | intro card holds whoosh → scenes → outro card holds boom | Reserved for future use; not currently wired |

Factory A2 (`makeIntroChapter`) doesn't use `audio-timeline.ts` — it bakes
its own envelope (whoosh on first card, boom at `visualEnd - SFX_OUTRO_LEAD_IN_FRAMES`).
That's a **convergence opportunity** (see Drift).

---

## Visual design system

All values live in `src/explainer-shared/tokens.ts`. Touch them there;
never hard-code.

### Palette

```
BG       = linear-gradient(140deg, #0C0322, #1a1a2e, #461499)  -- the SSL purple wash
ACCENT   = #753EF7   -- primary purple
ACCENT_2 = #FBBF24   -- amber (eyebrow / chapter labels)
ACCENT_3 = #22d3ee   -- cyan (highlights, callouts)
TEXT     = #ffffff
TEXT_DIM = #a0a0b0
```

### Typography

- Body / display: **Inter** (Google Fonts, loaded once at module init)
- Mono: `ui-monospace, SFMono-Regular, Menlo`
- Eyebrow labels: MONO, 24px, 0.32em letter-spacing, uppercase
- Chapter title: Inter, 92px, weight 600, -0.02em letter-spacing

### Easing

- General motion: `EASE_OUT = bezier(0.16, 1, 0.3, 1)` — the snap-then-settle curve
- Cross-fades: `TRANS_EASE = bezier(0.4, 0, 0.2, 1)` — linear-feeling material easing

### Safe-area

`SAFE_INSET_X = 120` (6.25%), `SAFE_INSET_Y = 80` (7.4%). These are
**targets, not hard stops**. Scene bodies should reach near the edges.
Don't pad so much content sits in a thin band. Let AI drift a little
over the safe-area; trim only when something visually clips.

### Shared visual components

In `src/explainer-shared/components.tsx`:

| Component | Purpose |
|---|---|
| `<SceneBG />` | Background gradient + drifting noise (camera-drift effect) + 3.5% film grain. Wraps every scene. |
| `<SceneExit>` | Last-`EXIT_FRAMES` (14f) scale+fade so cross-fades don't feel abrupt. |
| `<TRANS />` | Cross-fade transition factory for `<TransitionSeries>`. |
| `<ChapterCard>` | Eyebrow + rule + title card. Used between major sections. |
| `<FadeToBlack>` | Last-`FADE_TO_BLACK_FRAMES` (60f / 2.0s) black curtain. |
| `<FadeUp>` | Spring-driven rise + fade. Default offset 40px, pass 0 for pure fade. |
| `easeIn(frame, start, end)` | Helper — interpolates 0→1 with `EASE_OUT`. |

---

## Timing & envelope

All in `src/explainer-shared/constants.ts`. Treat as the rhythm grid for
every comp.

| Constant | Value | Why |
|---|---|---|
| `FPS` | 30 | Repo-wide |
| `TRANS_FRAMES` | 8 | Cross-fade length (matches `<TRANS>`) |
| `VO_PRE_PAD_FRAMES` | 15 (~0.5s) | Visual establishes before VO lands |
| `VO_POST_PAD_FRAMES` | 20 (~0.67s) | Voice doesn't butt against cross-fade |
| `EXIT_FRAMES` | 14 | `<SceneExit>` shrink/fade tail |
| `CARD_DURATION_FRAMES` | 45 (12 in · 21 hold · 12 out) | Default card length |
| `FADE_TO_BLACK_FRAMES` | 60 (2.0s) | Closing curtain |
| `PRE_ROLL_FRAMES` | 30 (1.0s) | Trimmed from 2.0s — title was dragging |
| `POST_ROLL_FRAMES` | 60 (2.0s) | Room for boom decay + silent black |
| `SFX_OUTRO_LEAD_IN_FRAMES` | 31 | Boom fires before `visualEnd` so attack lands mid-fade |
| `SFX_INTRO_LEN_FRAMES` | 114 (3.79s) | Whoosh peak lands at `PRE_ROLL_FRAMES` |
| `SFX_OUTRO_LEN_FRAMES` | 63 (2.09s) | Zero-attack boom + decay |

**Deprecated (kept until cleanup):**

- `MUSIC_HIGH = 0.15`, `MUSIC_DUCK = 0.05`, `DUCK_RAMP = 15`, `MUSIC_FADE_OUT_FRAMES = 75` — ducking is gone; remove these once Workshop comps migrate to flat `BED_VOLUME`.

---

## Factories

Two helper paths exist to keep new comps off copy-paste. Use whichever
fits the pattern; if neither does, write hand-built (A1) and lift any
new shared bits into the helpers afterwards.

### `makeIntroChapter` — Type A2 (chapter wings)

`src/explainer-shared/intro-chapter.tsx`. One call returns
`{ Component, schema, calculateMetadata, fallbackDurationInFrames }` ready
to register in `Root.tsx`.

**Inputs:**

```ts
makeIntroChapter({
  slug: "workshop-intro-ch03",            // canonical slug → derives all paths
  scenes: [
    { id, label, title, sourceStart, clipDurationSeconds, visual? },
    ...
  ],
  sourceMp4: "assets/source-clips/<series>.mp4",   // skipped if every scene has `visual`
  cardBefore?: boolean | (boolean | ChapterCardSpec | null)[],  // default true
  fallbackSceneSeconds?: readonly number[],   // animator's intent floor (default 4s/scene)
  cardDurationFrames?: number,                // default ~0.8s
  voVolume?: number,                          // default 0.65
  musicBed?: string,                          // staticFile path
});
```

**What you inherit (never re-wire per comp):**

- Cross-fades via `@remotion/transitions/fade`
- Auto chapter cards from each scene's `label` / `title`
- SFX intro whoosh + outro boom (with `SFX_OUTRO_LEAD_IN_FRAMES` lead-in)
- Pre/post-roll envelope and `FadeToBlack`
- Single-stem VO playback (one `<Audio>` over the full timeline)
- Music bed wired-on (currently via `musicHigh` prop — **migration target: flat `BED_VOLUME` const**)
- Clip-fit guard (warns when scene visual exceeds source clip's natural length)

**Migration target (28 Apr decision — kill ducking):**

The factory's schema currently exposes `musicHigh` / `musicDuck`. `musicDuck`
is already dead (`void musicDuck;` at `intro-chapter.tsx:192`). Next pass:

1. Replace `musicHigh`/`musicDuck` schema with a single `bedVolume` (or hard-code to `BED_VOLUME` per slug).
2. Remove the dead `void musicDuck;` line.
3. Update the 6 Workshop comp `defaultProps` blocks accordingly.
4. Drop `musicHigh`/`musicDuck` from `Root.tsx` defaults.

### `TimelineAudio` + `computeAudioTimeline` — Type B1 (tutorial)

`src/explainer-shared/audio-timeline.tsx`. Two pieces:

- **`computeAudioTimeline(visualFrames, mode)`** — pure function that returns frame placements (`whooshFrom`, `boomFrom`, `visualStart`, etc.) for `sequential` / `envelope` / `carded` modes.
- **`<TimelineAudio layout={...} bed={...} sfxIntroVolume sfxOutroVolume />`** — renders bed + whoosh + boom in one tag using the layout above.

**Usage pattern (current — `ClaudeCodeToolsWindows.tsx`):**

```tsx
const layout = computeAudioTimeline(visualFrames, { kind: "sequential" });

return (
  <AbsoluteFill>
    <TimelineAudio
      layout={layout}
      bed={{ src: BEDS.HOUSE_DEFAULT, volume: bedVolume }}
      sfxIntroVolume={sfxIntroVolume}
      sfxOutroVolume={sfxOutroVolume}
    />
    <Series>
      {clips.map((clip) => (
        <Series.Sequence durationInFrames={clipFrames(clip.durationSeconds)}>
          <OffthreadVideo src={staticFile(clip.path)} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
```

**Note for B1:** because the recorded clips already contain voice, you
typically run with **mode `sequential`** (no overlap with the visual).
Use `envelope` only if you want the whoosh to bleed under a title card
before the first clip.

### What's missing / weak

- Hand-built A1 comps (Format/Treatment/Stack) **don't use either helper** — they wire `<Audio>` for the bed and SFX inline. They could partially adopt `<TimelineAudio>` but the current inline form is so short it's barely a win. Leave alone unless we find a third reason.
- `audio-timeline.ts`'s `carded` mode is defined but **no comp uses it**. Could be the convergence path: `makeIntroChapter` could call `computeAudioTimeline({ kind: "carded", … })` instead of computing whoosh/boom placements itself. Out of scope today.

---

## Voice pipeline

Two pipelines exist depending on whether the comp generates per-scene VO
files (A1) or a single chapter stem (A2). B comps have voice baked into
the source clips and use no pipeline.

### A1 — per-scene MP3s (Format / Treatment / Stack)

```
ElevenLabs (one API call per scene)
    ↓
public/assets/voice/generated/<Slug>/scene-N-*.mp3
    ↓
metadata.makeCalculateMetadata reads each MP3's duration, sizes scenes
to max(VO + VO_PRE_PAD + VO_POST_PAD, fallbackSceneDuration)
```

**Known weakness:** there's **no formal post-process pass** on these
per-scene MP3s. Loudness can drift between scenes (different ElevenLabs
"rooms"). If we ever hear inconsistency, the fix is to run loudnorm +
limiter across the per-scene set the same way A2 does on the chapter stem
(see below).

### A2 — single chapter stem (Workshop wings)

```
ElevenLabs (single API call across whole chapter)   -- one consistent room
    ↓
_raw/chapter.mp3 + chapter.metadata.json
    ↓
ffmpeg silencedetect (post-process.py)               -- chapter.timings.json
    ↓
ffmpeg loudnorm  (-16 LUFS / -1.5 dBTP)
    ↓
pedalboard Reverb (wet 0.02 / dry 1.0)               -- 2% house default ("a little air")
    ↓
pedalboard Limiter (-1.0 dBTP)                       -- catches reverb tail before encode
    ↓
ffmpeg libmp3lame VBR ~190 kbps                      -- chapter.mp3 (final)
```

**Why single-stem:** one TTS call shares decoder warm-state and reference-audio
context — timbre is identical end-to-end. One loudnorm pass measures
integrated LUFS over the full voice (more accurate than per-scene). One
limiter pass catches the worst peak in the chapter.

**Why peak limiter:** reverb tails extend past the loudnorm true-peak
ceiling. Without a limiter, those tails clip into the MP3 encode and
distort loud syllables. −1.0 dBTP gives 0.5 dB headroom over the loudnorm
target.

### House voice settings (locked)

- Voice: ElevenLabs `jQOgcOzmmipekvxJN09W` "Danny Raw Voice 2026" Pro clone
- Settings: 0.31 stability / 1.0 similarity / 0.9 speed
- Style: em-dashes for beats, extra commas for pacing, no SSML
- Locked in `scripts/voice/presets/ssl-2026-house-voice.json`
- Per-scene overrides allowed via `voice_settings` block in scene config

### Voice-norm troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Voice still distorts after limiter | Limiter not catching | Drop `--limiter-threshold -1.5` or `--lufs -19` |
| `silence-detect found N regions but config has M scenes` | Inter-scene silence too short / broken | Tune `--silence-noise -38` or `--silence-min 1.0`; or fall back to `--mode per-scene` |
| Clip-fit warning `VO+pad XXf exceeds clip length YYf` | VO too long for source segment | Trim text in voice config, regen chapter |
| Audio drifts vs visuals (A2) | Inter-scene break tag length doesn't match `CARD_DURATION_FRAMES` | Tighten `BREAK_BETWEEN_SEC` in `generate-vo.ts` to match card frames |

---

## Recipe — ship a Type-A explainer

End-to-end for a new voice-driven explainer. Covers both A1 (hand-built)
and A2 (factory) — branch at Step 4.

### Preconditions (one-time)

- `npm install` (Remotion 4.0.448 + 18 pinned plugins)
- `scripts/voice/.venv` (`python3.12 -m venv` + `pip install -r scripts/voice/requirements.txt`)
- `ELEVENLABS_API_KEY` in `~/.zshrc`
- Studio runs on `npm run dev` → `localhost:3000`

### Step 1 — Write the treatment

**File:** `treatments/<slug>-vo.md`

Three sections:

1. **Brief** — 1 paragraph. Audience, one thing they should feel, one thing they should do next.
2. **Skeleton** — Hook → Hold → Payoff, ~3 sentences each.
3. **Treatment table** — one row per scene, columns: `#`, `scene id`, `visual`, `motion`, `text`, `audio`.

**Targets:** 8 scenes / ~45–75s. Mirror `treatments/treatment-explainer-vo.md`
or `treatments/stack-explainer-vo.md`.

### Step 2 — Generate the voiceover

**Voice config:** `scripts/voice/<slug>.config.json` — schema mirrors
`scripts/voice/stack-explainer.config.json`. Voice id, model, output dir,
scenes array with `id` + `text`.

**A1 — per-scene MP3s:**

```bash
# Cost estimate first (no credits spent)
node --strip-types scripts/voice/generate-vo.ts scripts/voice/<slug>.config.json --dry-run

# Generate (~1,000–1,200 credits for 8 scenes)
node --strip-types scripts/voice/generate-vo.ts scripts/voice/<slug>.config.json
```

**A2 — single chapter stem:**

```bash
node --experimental-strip-types scripts/voice/generate-vo.ts \
  scripts/voice/<slug>.config.json --mode chapter

./scripts/voice/.venv/bin/python3.12 scripts/voice/post-process.py --target <slug>
```

QuickLook the output before moving on. Cadence issues are cheapest to fix here.

### Step 3 — Pick the music bed

**Default:** `BEDS.HOUSE_DEFAULT`. Pick something else only if you have a
specific reason (Workshop Overview = cherry-orchard signature pick).

```ts
import { BEDS } from "./explainer-shared";
const MUSIC_BED = BEDS.HOUSE_DEFAULT;
const BED_VOLUME = 0.10;   // tune in 0.02 steps after listen-test
```

**Onset detection (optional, A1 only):**

```bash
scripts/voice/.venv/bin/python scripts/music/detect-onsets.py \
  public/assets/music/ssl-live-beds/<bed>.mp3 \
  --fps 30 --top 12 --min-gap 1.5 --comp-seconds 48.0
```

Output → `scripts/music/output/<slug>-onsets.json`. Feed strong onsets into
`BEAT_SNAP_FRAMES`, or set them all to `null` if no onset lands within 25
frames of a natural scene start.

### Step 4 — Build the composition

#### Branch A1 — hand-built (Format / Treatment / Stack pattern)

**File:** `src/<PascalCaseSlug>.tsx`. Copy `StackExplainer.tsx` as the
template and replace scene bodies.

Top-of-file config arrays:

```ts
const SCENE_AUDIO_FILES = [...];
const SCENE_VO_ENABLED = [...] as const;
const FALLBACK_SCENE_DURATIONS = [...];
const CARD_BEFORE = [...];                 // null OR { label, title }
const BEAT_SNAP_FRAMES = [...] as const;
const SCENE_COMPONENTS: React.FC[] = [Scene1, Scene2, ...];

const MUSIC_BED = BEDS.HOUSE_DEFAULT;
const BED_VOLUME = 0.10;                   // flat — no ducking
```

Render block — bed + SFX inline:

```tsx
<Audio src={staticFile(MUSIC_BED)} volume={BED_VOLUME} endAt={totalFrames} />

<Sequence from={0} durationInFrames={SFX_INTRO_LEN_FRAMES} name="sfx-intro">
  <Audio src={staticFile(SFX_INTRO)} volume={sfxIntroVolume} />
</Sequence>

<Sequence from={visualEnd - SFX_OUTRO_LEAD_IN_FRAMES} durationInFrames={SFX_OUTRO_LEN_FRAMES} name="sfx-outro">
  <Audio src={staticFile(SFX_OUTRO)} volume={sfxOutroVolume} />
</Sequence>
```

Schema — `sfxIntroVolume` + `sfxOutroVolume` only. **No `musicHigh` / `musicDuck`.**

#### Branch A2 — factory (Workshop wings pattern)

**File:** `src/<PascalCaseSlug>.tsx`. Copy `WorkshopVideo01TheSetup.tsx`
as the template.

```ts
const { Component, schema, calculateMetadata, fallbackDurationInFrames } =
  makeIntroChapter({
    slug: "workshop-video-04-xxx",
    scenes: [
      { id: "intro",   label: "Module 4", title: "The Wrap", sourceStart: 0,    clipDurationSeconds: 12.4 },
      { id: "concept", label: "Concept",  title: "How it works", sourceStart: 12.4, clipDurationSeconds: 28.7 },
      // ...
    ],
    sourceMp4: "assets/source-clips/workshop-video-04.mp4",
    musicBed: BEDS.HOUSE_DEFAULT,         // ← migrate away from `wings` per ducking-removal
  });

export const WorkshopVideo04TheWrap = Component;
export const workshopVideo04TheWrapSchema = schema;
export { calculateMetadata };
export const FALLBACK_DURATION_IN_FRAMES = fallbackDurationInFrames;
```

(Once the factory ducking-removal lands, replace `musicHigh` defaults
with a single `bedVolume` prop or hard-code per-comp.)

### Step 5 — Register in `Root.tsx`

```tsx
<Composition
  id="<PascalCaseSlug>"
  component={<PascalCaseSlug>}
  calculateMetadata={<slug>CalculateMetadata}
  durationInFrames={<slug>FallbackDuration}
  fps={30}
  width={1920}
  height={1080}
  schema={<slug>Schema}
  defaultProps={{
    sfxIntroVolume: 0.55,
    sfxOutroVolume: 0.55,
    // A2 only (until factory migration): musicHigh: 0.10
  }}
/>
```

### Step 6 — Scrub in Studio

```bash
npm run dev    # localhost:3000
```

Check:

1. End-to-end scrub — scene cuts feel right? Anything top-aligned?
2. Mixer sliders — drag during playback. Bed should feel like atmosphere, not backing track.
3. Chapter cards (A2) — feel like a breath, not an interruption (~45f / 1.5s).
4. VO sync (A1) — each line lands at `VO_PRE_PAD_FRAMES` into its scene? If not, raise `FALLBACK_SCENE_DURATIONS[i]`.

### Step 7 — Render

```bash
# Add this to package.json:
# "render:<slug>": "remotion render <PascalCaseSlug> out/<PascalCaseSlug>.mp4"

npm run render:<slug>
```

Render time: ~2–5 min per minute of finished video on M-series Mac.

**Quality gate:** play the MP4 in QuickLook full-screen with audio. If
anything feels off, tweak in Studio and re-render — never post-process
in another tool.

---

## Recipe — ship a Type-B tutorial

End-to-end for a tutorial built from pre-recorded video clips with
voice already on them (Loom screen-records, walk-throughs).
`ClaudeCodeToolsWindows` is the reference implementation.

### Step 1 — Get the source clips mastered

Source lives in a sibling repo (`Claude-Video-Editing-Flow`) where Loom
exports get cleaned, mastered, and renamed:

- Each clip is a self-contained section ("an asset"), not a chapter cut.
- Mastered output: `assets/loom-cuts/<series>_mastered/<NN>_<slug>.mp4`
- Probe each clip's duration with `ffprobe -v error -show_entries format=duration -of csv=p=0 <file>`

### Step 2 — Create the composition file

**File:** `src/<PascalCaseSlug>.tsx`. Copy `ClaudeCodeToolsWindows.tsx`
as the template.

```ts
const SOURCE_DIR = "assets/loom-cuts/<series>_mastered";

type Clip = { idx: number; slug: string; durationSeconds: number };

const CLIPS: readonly Clip[] = [
  { idx: 1, slug: "01_intro",        durationSeconds: 31.354 },
  { idx: 2, slug: "02_first-task",   durationSeconds: 72.396 },
  // ...
];

const clipFrames = (s: number) => Math.ceil(s * FPS);
const TOTAL_FRAMES = CLIPS.reduce((acc, c) => acc + clipFrames(c.durationSeconds), 0);
```

### Step 3 — Wire schema + metadata

```ts
export const <slug>Schema = z.object({
  bedVolume: z.number().min(0).max(1).multipleOf(0.05),
  sfxIntroVolume: z.number().min(0).max(1).multipleOf(0.05),
  sfxOutroVolume: z.number().min(0).max(1).multipleOf(0.05),
});

export const calculateMetadata = (): VideoConfig => ({
  durationInFrames: TOTAL_FRAMES,
  fps: FPS,
  width: 1920,
  height: 1080,
});

export const FALLBACK_DURATION_IN_FRAMES = TOTAL_FRAMES;
```

### Step 4 — Render block

```tsx
const layout = computeAudioTimeline(
  CLIPS.reduce((s, c) => s + clipFrames(c.durationSeconds), 0),
  { kind: "sequential" },   // for envelope-style with title card, swap to `envelope`
);

return (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <TimelineAudio
      layout={layout}
      bed={{ src: BEDS.HOUSE_DEFAULT, volume: bedVolume }}
      sfxIntroVolume={sfxIntroVolume}
      sfxOutroVolume={sfxOutroVolume}
    />
    <Series>
      {CLIPS.map((clip) => (
        <Series.Sequence
          key={clip.slug}
          durationInFrames={clipFrames(clip.durationSeconds)}
          name={`${String(clip.idx).padStart(2, "0")} ${clip.slug}`}
        >
          <OffthreadVideo src={staticFile(`${SOURCE_DIR}/${clip.slug}.mp4`)} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
```

### Step 5 — Register in `Root.tsx`

```tsx
<Composition
  id="<PascalCaseSlug>"
  component={<PascalCaseSlug>}
  calculateMetadata={calculateMetadata}
  durationInFrames={FALLBACK_DURATION_IN_FRAMES}
  fps={30}
  width={1920}
  height={1080}
  schema={<slug>Schema}
  defaultProps={{
    bedVolume: 0.10,
    sfxIntroVolume: 0.50,
    sfxOutroVolume: 0.50,
  }}
/>
```

### Step 6 — Scrub + render

Same as A above. Watch for:

- Bed competing with recorded voice — drop `bedVolume` to 0.06–0.08 if so.
- Hard cuts between clips feel jarring — wrap each in a fade if needed (currently no comp does this; cuts are intentional).
- First clip's start clips into the whoosh — switch `mode` to `envelope` so the visual sits in a preroll window.

### When to use envelope vs sequential

| Mode | Visual at frame 0 | Bed/SFX overlap visual | Use when |
|---|---|---|---|
| `sequential` | Whoosh plays alone, visual starts after | No | Recorded voice carries pacing |
| `envelope` | Visual starts after `PRE_ROLL_FRAMES`; whoosh peaks under it | Yes | Title card needs the whoosh under it |

---

## Naming convention

A composition is identified by its **slug** in kebab-case
(`workshop-intro-ch03`). That slug derives every path and identifier:

| Aspect | Pattern | ch03 example |
|---|---|---|
| Slug (canonical) | `<series>-ch<NN>` kebab-case | `workshop-intro-ch03` |
| Composition file | PascalCase | `src/WorkshopIntroCh03.tsx` |
| Composition ID (Studio + render CLI) | PascalCase | `WorkshopIntroCh03` |
| Voice config | `scripts/voice/<slug>.config.json` | `workshop-intro-ch03.config.json` |
| Voice output dir | `public/assets/voice/generated/<slug>/` | `…/workshop-intro-ch03/` |
| Voice files (A2) | `chapter.mp3`, `chapter.timings.json`, `chapter.metadata.json`, `_raw/chapter.mp3` | (within slug dir) |
| Source clip (A2) | `public/assets/source-clips/<series>.mp4` (or `<series>-chapters.mp4`) | `workshop-intro-chapters.mp4` |
| Render output | `out/<slug>.mp4` + npm script `render:<slug>` | `out/workshop-intro-ch03.mp4` |

**Pre-existing comps** (`StackExplainer`, `TreatmentExplainer`, `FormatExplainer`,
`UmbrellaTutorial`, `ClaudeCodeToolsWindows`) are series-of-one and keep
their PascalCase names; the kebab `<series>-chNN` convention applies to
chapter compositions only.

---

## Drift & open decisions

Honest list of what's inconsistent today and what we've decided to do
about it. **Updates here are the changelog** — when something gets
resolved, move it under "Resolved" with the date.

### Pending — needs work

1. **Kill ducking globally** (decision 28 Apr 2026). Workshop wings (5 comps) + WorkshopOverview still expose `musicHigh` / `musicDuck` in the factory schema.
   - [ ] Strip `musicHigh` / `musicDuck` from `introChapterSchema` in `intro-chapter.tsx`; replace with single `bedVolume` prop (or hard-code `BED_VOLUME` per slug, matching A1 pattern).
   - [ ] Remove `void musicDuck;` line at `intro-chapter.tsx:192`.
   - [ ] Remove the music-bed conditional `musicHigh > 0` gate (always-on now).
   - [ ] Update Workshop comp `defaultProps` blocks (6 comps).
   - [ ] Drop `musicHigh: 0` / `musicDuck: 0` shims from `Root.tsx` (8 comps currently pass them for type-compat).
   - [ ] Delete `MUSIC_HIGH`, `MUSIC_DUCK`, `DUCK_RAMP`, `MUSIC_FADE_OUT_FRAMES` from `constants.ts`.
   - [ ] Delete `buildMusicVolume` from `metadata.ts` (already dead code).
   - [ ] Delete `MUSIC_HIGH` / `MUSIC_DUCK` references from `metadata.ts` (`DEFAULT_MIXER`, `MixerProps`).

2. **Migrate Workshop wings off `wings` bed → `HOUSE_DEFAULT`.** 5 comps still on the source-MP3 bed (per the table). Decision pending — listen-test trio of A1 comps first to confirm the new bed at flat volumes is the right call before rolling it out.

3. **`WorkshopOverview` cherry-orchard bed** — keep as deliberate signature pick, or fold into `HOUSE_DEFAULT`? Pending Danny's call.

4. **`TreatmentExplainer`'s `BEAT_SNAP_FRAMES` (134f, 852f)** — stale, tuned against the old `through-the-clouds` bed. Either recompute against the HOUSE_DEFAULT loop or remove and let scenes fall on natural starts. Decision pending.

5. **SFX volumes scattered.** Every comp overrides `SFX_INTRO_VOLUME` / `SFX_OUTRO_VOLUME` in `defaultProps` with its own values (0.45–1.0). If two or more comps converge on the same override, lift it into the constants.

6. **`UmbrellaTutorial` doesn't use `TimelineAudio`.** Wires SFX manually. Migrate when next touched. Low priority.

7. **`makeIntroChapter` doesn't share `audio-timeline.ts`.** The factory bakes its own envelope; could call `computeAudioTimeline({ kind: "carded", … })` to converge the two flavours of A. Out of scope for now.

8. **No formal voice-norm pass on A1 per-scene MP3s.** A2 chapter pipeline runs loudnorm + reverb + limiter; A1 doesn't. If we hear inconsistency between scenes, lift the post-process step into A1.

9. **Retire stale docs.** Once this doc is signed off:
   - [ ] `docs/CONVENTIONS.md` → delete or stub with a redirect to `SOURCE-OF-TRUTH.md`
   - [ ] `HOW-TO-SHIP-AN-EXPLAINER.md` → delete or stub
   - [ ] `docs/CONSOLIDATION-PLAN.md` → review (likely retire)
   - [ ] `docs/CH05-TEMPLATE-HARDENING.md` → review (likely retire — superseded by factory)

### Resolved

| Date | Decision |
|---|---|
| 2026-04-28 | Ducking removed from FormatExplainer / TreatmentExplainer / StackExplainer. Schemas dropped `musicHigh` / `musicDuck`. |
| 2026-04-28 | HOUSE_DEFAULT 10:13 loop wired into the 3 hand-built A comps + ClaudeCodeToolsWindows. |
| 2026-04-28 | Decision: kill ducking globally — applies to factory comps too (work pending, see Item 1 above). |

---

## Files index

Quick map of where things live. **Always edit at this layer** — never
copy values into individual comps.

### `src/explainer-shared/`

| File | What it owns |
|---|---|
| `index.ts` | Re-exports the 7 sibling files as one module |
| `constants.ts` | FPS, frame counts, SFX paths, SFX lengths, default SFX volumes (deprecated music constants still here pending cleanup) |
| `tokens.ts` | Palette, gradients, fonts, easings, safe-area, canvas dims, grain SVG |
| `audio-beds.ts` | `BEDS.HOUSE_DEFAULT` + 3 source-MP3 references (legacy, to retire) |
| `sfx-library.ts` | 18-item SFX shortlist (auto-generated from `public/assets/sfx/MANIFEST.json`) |
| `components.tsx` | `SceneBG`, `FadeUp`, `TRANS`, `SceneExit`, `FadeToBlack`, `ChapterCard`, `easeIn` helper |
| `timeline.ts` | `computeTimeline()` — interleaves cards before scenes, accounts for transition overlap |
| `metadata.ts` | `makeCalculateMetadata` (A1, per-scene MP3s), `makeChapterCalculateMetadata` (A2, single-stem) |
| `intro-chapter.tsx` | `makeIntroChapter` factory (A2 wings) |
| `audio-timeline.tsx` | `computeAudioTimeline` + `<TimelineAudio>` (B tutorials, sequential / envelope / carded modes) |

### `scripts/voice/`

| File | Purpose |
|---|---|
| `generate-vo.ts` | ElevenLabs caller. Modes: per-scene (default) / chapter (`--mode chapter`). Supports `--dry-run` for cost estimates. |
| `post-process.py` | A2 only — silencedetect → loudnorm → pedalboard reverb → pedalboard limiter → MP3 encode. |
| `presets/ssl-2026-house-voice.json` | House voice settings (0.31 stab / 1.0 sim / 0.9 speed). |
| `<slug>.config.json` | Per-comp scene texts + output dir + voice settings overrides. |

### `scripts/music/`

| File | Purpose |
|---|---|
| `detect-onsets.py` | Onset detection for beat-snap. Output → `output/<slug>-onsets.json`. |

### `public/assets/`

| Path | Contents |
|---|---|
| `music/ssl-live-beds/_loops/` | Long-form looped beds. `HOUSE_DEFAULT` lives here. |
| `music/ssl-live-beds/` | Source MP3s (legacy beds — retire as comps migrate to HOUSE_DEFAULT). |
| `sfx/library/transitions/` | Whooshes (intro SFX pool) |
| `sfx/library/impacts/` | Booms / impacts (outro SFX pool) |
| `sfx/library/risers/` | Risers (unused currently) |
| `sfx/library/stingers/` | Logo stingers (unused currently) |
| `sfx/MANIFEST.json` | Source manifest for `sfx-library.ts` codegen |
| `voice/generated/<slug>/` | ElevenLabs output (per-comp) |
| `source-clips/` | Long-form source MP4s for A2 chapter slicing |
| `loom-cuts/<series>_mastered/` | B-tutorial input clips (mastered in `Claude-Video-Editing-Flow`) |

### Repo root

| File | Purpose |
|---|---|
| `Root.tsx` | Composition registry. Every comp registered here surfaces in Studio + render CLI. |
| `package.json` | `render:<slug>` scripts (one per comp); pinned `@remotion/*` versions. |
| `remotion.config.ts` | Renderer config (codec, concurrency, etc.). |
| `MASTER-LOG.md` | Session log — read kickoff + Next Up + last entry. |
| `treatments/<slug>-vo.md` | Pre-build briefs for A1 comps. |

---

## Maintenance

**When does this doc get updated?**

- A new pattern emerges → add a flavour, update the picker table, write a recipe section.
- A constant changes → update `constants.ts` and the [Timing & envelope](#timing--envelope) table in lock-step.
- A drift item resolves → move it from "Pending" to "Resolved" with date.
- A new comp ships → add a row to [Composition status](#composition-status).

**Never:** let this doc and the code disagree silently. If you find a
contradiction, the **code wins** — fix this doc to match, then decide if
the code is also wrong.




