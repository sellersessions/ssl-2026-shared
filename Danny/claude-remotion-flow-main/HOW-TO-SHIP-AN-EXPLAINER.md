# How to ship an explainer

End-to-end recipe for producing a new explainer video in this repo. This is a
practical cookbook — not a tour. Follow the six steps and you end up with an
MP4 in `out/`.

Three explainers have shipped this way so far:

- **TreatmentExplainer** — how to brief a video (the 3-layer protocol).
- **FormatExplainer** — output formats + dimensions.
- **StackExplainer** — the 18-plugin production stack.

If you get stuck, the README's `Audio Library`, `Voice Pipeline`, and `Live Mixer` sections cover the moving parts in detail.

---

## Preconditions

- `npm install` run once. Remotion 4.0.448 + 18 pinned plugins.
- `scripts/voice/.venv` — Python virtualenv for `generate-vo.py` and
  `detect-onsets.py`. Create with `python3.12 -m venv scripts/voice/.venv`
  and `scripts/voice/.venv/bin/pip install -r scripts/voice/requirements.txt`.
- ElevenLabs API key in `~/.zshrc` as `ELEVENLABS_API_KEY`. Uses the
  "Danny Raw Voice 2026" Pro clone (voice_id `jQOgcOzmmipekvxJN09W`).
- Studio hot-reloads on `npm run dev` (localhost:3000).

---

## Step 1 — Write the treatment

**What:** A single markdown doc at `treatments/<slug>-vo.md` that locks
audience, skeleton, and per-scene visuals before any code gets written.

**Why:** If the treatment is wrong, the render is wrong. Fixing a bad
treatment costs minutes. Fixing a bad render costs hours.

**Template:** Mirror `treatments/treatment-explainer-vo.md` or
`treatments/stack-explainer-vo.md`. Three sections:

1. **Brief** — 1 paragraph. Audience, one thing they should feel, one
   thing they should do next.
2. **Skeleton** — Hook → Hold → Payoff. ~3 sentences each.
3. **Treatment table** — one row per scene, columns: `#`, `scene id`,
   `visual`, `motion`, `text`, `audio`.

**Target length:** 8 scenes / ~45–75s of finished video. Shorter videos
are harder, not easier — each scene does more work.

---

## Step 2 — Generate the voiceover

**Files:**

- `scripts/voice/<slug>.config.json` — mirror the schema from
  `scripts/voice/stack-explainer.config.json` (voice id, model, output dir,
  scenes array with `id` + `text` per scene).
- `public/assets/voice/generated/<PascalCaseSlug>/scene-N-*.mp3` — output.

**Commands:**

```bash
# Cost estimate first (no credits spent).
node --strip-types scripts/voice/generate-vo.ts \
  scripts/voice/<slug>.config.json --dry-run

# Generate (≈1,000–1,200 credits for 8 scenes).
node --strip-types scripts/voice/generate-vo.ts \
  scripts/voice/<slug>.config.json
```

**House voice:** 0.31 stability / 1.0 similarity / 0.9 speed. Em-dashes for
beats, extra commas for pacing, no SSML. Locked in
`scripts/voice/presets/ssl-2026-house-voice.json`.

**Per-scene overrides:** If one line needs a push, add a `voice_settings`
block to that scene in the config. The generator merges it over the preset.

**Listen-back:** QuickLook each MP3 before moving on. Cadence issues are
cheapest to fix here — regenerating is ~5 credits per scene.

---

## Step 3 — Pick a music bed + detect onsets

**Pool:** `public/assets/music/ssl-live-beds/`. Four ambient cinematic
tracks. Rules:

1. **Never reuse** a bed across videos in the same series.
2. **Ambient, not melodic** — bed stays under VO.
3. **Length** ≥ comp length.

**Detection:**

```bash
scripts/voice/.venv/bin/python scripts/music/detect-onsets.py \
  public/assets/music/ssl-live-beds/<bed>.mp3 \
  --fps 30 --top 12 --min-gap 1.5 --comp-seconds 48.0
```

Output lands at `scripts/music/output/<slug>-onsets.json`. Each entry has
`time_s`, `frame`, and `strength`.

**What to do with onsets:** Feed them into `BEAT_SNAP_FRAMES` in the
composition file. Use the Session 12 auto-snap helper if it exists.
Or set them all to `null` if no onsets land within 25 frames of your
natural scene starts (that's what StackExplainer did).

---

## Step 3.5 — Pick SFX with the Auditioner + Loop Cutter

Before the composition gets wired, decide which SFX you want available.

```bash
npm run audition                 # localhost:4747
                                 # localhost:4747/cutter for the cutter
```

The auditioner browses `MANIFEST.json` by category (transitions / stingers / risers / impacts / ambience / music). Click ✂︎ on any row to open it in the Loop Cutter for trimming, then `Save → Library` to write the cut clip back as a new manifest entry (auto-shortlisted). Toggle `shortlisted` on every clip you want available in TSX, then run:

```bash
node --strip-types scripts/sfx/shortlist-to-code.ts
```

That regenerates `src/explainer-shared/sfx-library.ts` — your composition imports typed constants like `SFX_TRANSITIONS.WHOOSH_CINEMATIC` from there. No string paths in the TSX.

If the library is empty on a fresh clone, run `npm run library:fetch` first to rehydrate from the manifest's `cdn_url` entries.

---

## Step 4 — Build the composition

**Start from the shared skeleton.** `src/explainer-shared/` has the
extracted pattern from Sessions 9–11:

- `constants.ts` — FPS, pre/post-roll, music levels, SFX bookends.
- `tokens.ts` — colors, fonts, safe-area (`SAFE_INSET_X=120`,
  `SAFE_INSET_Y=80`).
- `components.tsx` — `SceneBG`, `SceneExit`, `TRANS`, `ChapterCard`,
  `FadeToBlack`, `FadeUp`.
- `timeline.ts` — `computeTimeline()` lays out scenes + chapter cards.
- `metadata.ts` — `makeCalculateMetadata()` (VO-driven scene sizing) and
  `buildMusicVolume()` (music ducking envelope).

**New composition file:** `src/<SlugExplainer>.tsx`. Copy
`StackExplainer.tsx` as your template and replace the scene bodies.

**Config arrays at the top:**

```typescript
const SCENE_AUDIO_FILES = [...];       // paths relative to public/
const SCENE_VO_ENABLED = [...] as const;  // false for silent scenes
const FALLBACK_SCENE_DURATIONS = [...]; // used if MP3 missing
const CARD_BEFORE = [...];             // null OR { label, title }
const BEAT_SNAP_FRAMES = [...] as const;
const SCENE_COMPONENTS: React.FC[] = [Scene1, Scene2, ...];
```

**Music bed:** `const MUSIC_BED = "assets/music/ssl-live-beds/<bed>.mp3";`

**Register in `Root.tsx`** — 1920×1080 / 30fps. Use
`defaultProps={{ ...DEFAULT_MIXER }}` so the 4 mixer sliders surface in
the Studio Props panel.

**Scene body rules:**

- **Fill the canvas.** Don't top-align. Use the full height down to
  `SAFE_INSET_Y` from the bottom. Danny's Session 11 Loom rule.
- **Safe-area target, not hard stop.** Let AI drift a little over
  `SAFE_INSET_X/Y` — don't pad so much that content looks stuck in a
  narrow band.
- **One idea per scene.** If a scene has two ideas, split it.
- **No mocks in this repo** — scene bodies are custom per video. The
  shared skeleton is the chassis, not the interior.

---

## Step 5 — Scrub in Studio

```bash
npm run dev    # localhost:3000
```

**What to check:**

1. **First scrub end-to-end** — do the scene cuts feel right? Is
   anything top-aligned?
2. **Mixer sliders.** Props panel → drag `musicHigh`, `musicDuck`,
   `sfxIntroVolume`, `sfxOutroVolume` during playback. Bed should
   feel like atmosphere, not backing track. If VO competes, drop
   `musicHigh`.
3. **Chapter cards** — they should feel like a breath, not an
   interruption. 45 frames (1.5s) default.
4. **VO sync.** Does each line land at `VO_PRE_PAD_FRAMES` into its
   scene? If not, the scene is under-sized — raise `FALLBACK_SCENE_DURATIONS[i]`.

**If hot-reload throws a TransitionSeries error:** it's almost
always a missing `else` branch in the `items.flatMap` — chapter card
items need their own `TransitionSeries.Sequence`. See StackExplainer:1637–1662.

---

## Step 6 — Render

```bash
npm run render:<slug>    # add this to package.json
# → out/<SlugExplainer>.mp4
```

Example from `package.json`:

```json
"render:stack": "remotion render StackExplainer out/StackExplainer.mp4",
"render:treatment": "remotion render TreatmentExplainer out/TreatmentExplainer.mp4"
```

**Render time:** ~2–5 min per minute of video on an M-series Mac.

**Quality gate:** Play the MP4 in QuickLook full-screen with audio on.
If anything feels off, tweak in Studio and re-render — don't post-process
in another tool.

---

## Common gotchas

- **VO file missing → fallback duration.** Check console warnings. If you
  see `[<Explainer>] VO file missing`, the scene is sized from
  `FALLBACK_SCENE_DURATIONS[i]`, not the MP3.
- **Music too loud.** Default `MUSIC_HIGH = 0.16` after the Loom feedback.
  If it still competes, drop the prop via the Studio slider — don't
  edit the constant unless everyone's bed is too loud.
- **VO speed locked at 0.9.** Don't change this per-scene. Slower feels
  considered; faster feels rushed.
- **Reference voice clone is Pro, not Free.** Uses the "Danny Raw Voice
  2026" clone. Old `pfeizhSY3j6DUhKGxyRz` Free clone is superseded.
- **Plugin pinning.** All `@remotion/*` packages are pinned to the same
  version. Never upgrade one without upgrading the set.

---

## What the pipeline scores right now

From the Session 10 audit:

| Stage | Score | Notes |
|---|---|---|
| VO generation | 9/10 | Preset + per-scene override is the missing nuance |
| Shortlist → code | 3/10 | Manual copy/paste from auditioner. Session 12 helper will close this. |
| Beat detection | 5/10 | Manual target picking; auto-snap helper pending |
| Render loop | 7/10 | `npm run render:<slug>` now exists (was 2/10) |

Use this doc as the starting point. Update it when the pipeline changes.
