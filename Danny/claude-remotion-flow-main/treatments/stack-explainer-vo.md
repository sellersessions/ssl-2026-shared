# StackExplainer — Voiceover Treatment

> Applying the 3-layer protocol. Drafted 23 Apr 2026.
> Composition: `src/StackExplainer.tsx` (Session 11). Target: ~60f/2s pre-roll + ~57s visuals + 60f/2s post-roll ≈ 61s total @ 30fps.

---

## Layer 1 — Creative Brief

| Field | Value |
|---|---|
| **Objective** | Explain, in ~60 seconds, what it took to turn stock Remotion into a production video engine — the plugin stack, the design system, the voice preset, the music/SFX library, beat tracking. Functions as a video README for anyone landing on the repo. |
| **Audience** | Repo newcomers. Mixed technical levels — engineers skimming the stack + non-technical operators who just want to brief a video. |
| **Key Message** | Stock Remotion is a stage and a clock. Everything cinematic is a bolt-on — and we've assembled the bolt-ons so a script becomes a finished video in one pass. |
| **Tone** | Same SSL 2026 house voice as TreatmentExplainer. Confident, conversational, London-casual. Slightly more engineer-forward because this one names components. |
| **References** | `scripts/voice/presets/ssl-2026-house-voice.json`. Sibling: `treatments/treatment-explainer-vo.md`. |
| **Deliverables** | 8 × MP3 files at `public/assets/voice/generated/StackExplainer/scene-*.mp3`. Total ≈ 804 characters ≈ 804 credits. |

---

## Layer 2 — Story Skeleton

**Choice: Hook-Hold-Payoff with a component montage in the middle.** The hook lands the "stock → production" idea; the middle six scenes each name one piece of the stack; the payoff is the envelope (whoosh/boom/fade) and the one-pass claim. The meta-joke: the video ends with the exact envelope it's describing.

```
Scene 1 (~3.5s)  →  HOOK     — "stock → production engine"
Scene 2 (~7s)    →  FRAME    — what stock Remotion actually gives you
Scene 3 (~9s)    →  HOLD 1   — the 18-plugin stack
Scene 4 (~7.5s)  →  HOLD 2   — the design system (palette + scene skeleton)
Scene 5 (~7.5s)  →  HOLD 3   — the voice preset (script → MP3)
Scene 6 (~7s)    →  HOLD 4   — the music/SFX library + auditioner
Scene 7 (~8.5s)  →  HOLD 5   — beat tracking (librosa onsets → scene snap)
Scene 8 (~7s)    →  PAYOFF   — the envelope + "ships in one pass"
```

**VO cadence rules** (inherited from house preset — same as TreatmentExplainer):
- Em-dashes for beats inside a sentence.
- Extra commas to slow critical phrases.
- **No SSML `<break>` tags** — punctuation only.
- One idea per sentence. Short.
- Names of components (`Sequence`, `Audio`, `librosa`) are read aloud in this video — it's the stack tour.

---

## Layer 3 — Treatment Document (per-scene VO scripts)

### Scene 1 — Title (~105f / 3.5s)

| | |
|---|---|
| **On screen** | "From Stock Remotion" fades in / "to a Production Engine" punches in with the SS gold accent |
| **VO** | *"From stock Remotion — to a production engine."* |
| **Chars** | 46 |
| **File** | `scene-1-title.mp3` |

### Scene 2 — Stock Remotion (~210f / 7s)

| | |
|---|---|
| **On screen** | Three minimalist tags centred on a near-black canvas: `<Sequence>`, `<Audio>`, and a ticking clock. Deliberately plain — "this is all you get." |
| **VO** | *"Out of the box — Remotion gives you a stage, a clock, and a tag that plays a file. That's it."* |
| **Chars** | 94 |
| **File** | `scene-2-stock.mp3` |

### Scene 3 — The Plugin Stack (~270f / 9s)

| | |
|---|---|
| **On screen** | Grid of 18 package cards (`@remotion/transitions`, `@remotion/motion-blur`, `@remotion/noise`, `@remotion/google-fonts`, `@remotion/media-utils`, …) fading in on a beat. All pinned to `4.0.448` in the footer. |
| **VO** | *"Then we stacked eighteen plugins on top — transitions, motion blur, noise, fonts, media utils. Every cinematic move is a bolt-on."* |
| **Chars** | 128 |
| **File** | `scene-3-plugins.mp3` |

### Scene 4 — The Design System (~225f / 7.5s)

| | |
|---|---|
| **On screen** | Left: palette swatches (BG gradient + purple + gold). Right: a scene-skeleton diagram showing `TRANS_FRAMES`, `VO_PRE_PAD`, `calculateMetadata`, `FadeToBlack`. |
| **VO** | *"The design system — palette, scene skeleton, auto-sizing from the voiceover. One pattern — every video."* |
| **Chars** | 103 |
| **File** | `scene-4-design-system.mp3` |

### Scene 5 — Voice (~225f / 7.5s)

| | |
|---|---|
| **On screen** | Split panel: left = `ssl-2026-house-voice.json` preview; right = 8 MP3 waveforms cascading in. Caption: "Script in — MP3s out." |
| **VO** | *"The voice — one JSON config, one preset. Script in, MP3s out. Per-scene overrides if a line needs a push."* |
| **Chars** | 104 |
| **File** | `scene-5-voice.mp3` |

### Scene 6 — Music + SFX Library (~210f / 7s)

| | |
|---|---|
| **On screen** | Auditioner UI in frame. ⭐ toggle lights up on one row. 📋 copy-path tooltip shows bare `assets/sfx/library/...` path. Counter in corner: `378 items · 6 tabs`. |
| **VO** | *"The library — every sound and music bed indexed. Shortlist in the auditioner — paste the path, done."* |
| **Chars** | 100 |
| **File** | `scene-6-library.mp3` |

### Scene 7 — Beat Tracking (~255f / 8.5s)

| | |
|---|---|
| **On screen** | Music waveform across the full width with onset markers dropping in at phrase starts. One marker snaps a scene-cut line onto itself to show the effect. Caption: `librosa · onset_detect`. |
| **VO** | *"Beat tracking — librosa finds the phrase starts, and we snap scene cuts to the ones that fit. No tempo changes to the voice."* |
| **Chars** | 124 |
| **File** | `scene-7-beats.mp3` |

### Scene 8 — The Envelope (~210f / 7s)

| | |
|---|---|
| **On screen** | Three stacked bands animate in sync with the line: whoosh swoosh (sweep up), boom (impact), then a fade-to-black. The video's own envelope is the subject of the video's own ending. |
| **VO** | *"The envelope — whoosh in, boom out, fade to black. That's how a forty-second explainer ships in one pass."* |
| **Chars** | 105 |
| **File** | `scene-8-envelope.mp3` |

---

## Totals & credit cost

```
Scene 1 ·  46 chars   Scene 5 · 104 chars
Scene 2 ·  94 chars   Scene 6 · 100 chars
Scene 3 · 128 chars   Scene 7 · 124 chars
Scene 4 · 103 chars   Scene 8 · 105 chars
                    ─────────────────
                    804 chars ≈ 804 credits
                    (0.66% of monthly 121k budget)
```

## Generation command

```bash
# from repo root
node --experimental-strip-types scripts/voice/generate-vo.ts \
  scripts/voice/stack-explainer.config.json
```

## Iteration workflow

Same as TreatmentExplainer:

1. Change any `text` in `scripts/voice/stack-explainer.config.json`.
2. Re-run the command above — idempotent on filename, only re-bills changed scenes.
3. `calculateMetadata` (Session 11 composition) auto-resizes each scene to its MP3.

## Music bed + SFX plan (Session 10 lock)

- **Bed:** picked this session (see MASTER-LOG Session 10 entry + config in `src/StackExplainer.tsx` when built). NOT through-the-clouds — already used in TreatmentExplainer.
- **SFX bookends:** intro whoosh + outro boom — same picks as TreatmentExplainer for consistency across the explainer set.
- **Beat markers:** `scripts/music/output/stack-explainer-onsets.json` (captured this session; applied in Session 11 when scene durations are known).

## Open questions for Danny (ask at Session 11 boot)

1. **Scene 3 copy** — "eighteen plugins" is concrete but exact count is fragile if we add more. Swap to "a stack of plugins"? Lose the specificity but gain longevity.
2. **Scene 7 name-drop** — comfortable saying "librosa" aloud? It's technical. Alternative: *"Beat tracking — we find the phrase starts, and snap scene cuts to the ones that fit."*
3. **Ordering** — Voice before Library, or Library before Voice? Current order: Voice (S5) → Library (S6). Could flip so the library scene flows into beat tracking (which analyses a music bed from the library).
