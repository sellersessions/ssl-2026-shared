# TreatmentExplainer — Voiceover Treatment

> Applying the 3-layer protocol to the narration itself. Drafted 22 Apr 2026.
> Composition: `src/TreatmentExplainer.tsx`. Video duration: 1164f / 38.8s @ 30fps.

---

## Layer 1 — Creative Brief

| Field | Value |
|---|---|
| **Objective** | Narrate an existing animated explainer so a non-technical viewer understands the 3-layer treatment framework in ~40 seconds. Voice adds warmth and authority to the motion graphics. |
| **Audience** | SSL 2026 attendees + internal team (Alex, Leo, editors) who'll use this framework to commission video work. Comfortable with business concepts, new to "treatments". |
| **Key Message** | Any video becomes easy once you split it into three stacked layers — brief, skeleton, treatment. |
| **Tone** | Conversational, confident, London-casual. Podcast voice. Em-dash cadence. No jargon. No buzzwords. |
| **References** | Danny's podcast intros (Seller Sessions brand). Voice preset: `scripts/voice/presets/ssl-2026-house-voice.json`. |
| **Deliverables** | 6 × MP3 files at `public/voiceover/TreatmentExplainer/scene-*.mp3`. Total ≈ 435 characters (≈ 435 credits). |

---

## Layer 2 — Story Skeleton

**Choice: Beat Sheet** — the video already IS a beat sheet (Hook → Setup → Turn → Proof → Resolve). VO lays one short line on top of each beat.

```
Scene 1 (4s)   →  HOOK     — frame the concept in one line
Scene 2 (6s)   →  SETUP    — preview all 3 layers
Scene 3 (7s)   →  TURN 1   — unpack Layer 1 (the brief)
Scene 4 (9s)   →  TURN 2   — unpack Layer 2 (skeletons)
Scene 5 (8s)   →  PROOF    — show Layer 3 in action (treatment doc)
Scene 6 (6s)   →  RESOLVE  — land the "you can do this" payoff
```

**VO cadence rules** (from the house preset):
- Em-dashes for beats inside a sentence (drive a breath, not a full stop).
- Extra commas to slow critical phrases.
- **No SSML `<break>` tags** — punctuation only.
- One idea per sentence. Short.
- Don't read on-screen labels aloud — say the thing graphics can't convey.

---

## Layer 3 — Treatment Document (per-scene VO scripts)

### Scene 1 — Title Card (120f / 4s)

| | |
|---|---|
| **On screen** | "How to Brief a Video" + "A 3-layer framework for anyone" |
| **VO** | *"Brief any video — in three layers."* |
| **Chars** | 36 |
| **File** | `scene-1-title.mp3` |

### Scene 2 — Three Layers Overview (180f / 6s)

| | |
|---|---|
| **On screen** | "Every video follows three layers" + 3 badges (THE BRIEF / THE SKELETON / THE TREATMENT) |
| **VO** | *"Every video follows three layers — the brief, the skeleton, and the treatment."* |
| **Chars** | 80 |
| **File** | `scene-2-layers.mp3` |

### Scene 3 — Layer 1: Creative Brief (210f / 7s)

| | |
|---|---|
| **On screen** | "The Creative Brief" + 6 fields (Objective / Audience / Key Message / Tone / References / Deliverables) + "References is the escape hatch" note |
| **VO** | *"Layer one is the brief — what you want, who watches, and the feel you're chasing."* |
| **Chars** | 82 |
| **File** | `scene-3-brief.mp3` |

### Scene 4 — Layer 2: Four Skeletons (270f / 9s)

| | |
|---|---|
| **On screen** | "Pick Your Shape" + 4 cards (Beat Sheet / PAS / Hook-Hold-Payoff / Energy Map) cycling highlight |
| **VO** | *"Layer two — pick your shape. Story, sales, social, or audio-led — each has its own skeleton."* |
| **Chars** | 94 |
| **File** | `scene-4-skeletons.mp3` |

### Scene 5 — Layer 3: Treatment Document (240f / 8s)

| | |
|---|---|
| **On screen** | Fake code editor / treatment doc scrolls with Visual / Motion / Text / Audio fields |
| **VO** | *"Layer three — the treatment. Scene by scene — visual, motion, text, audio, all spelled out."* |
| **Chars** | 93 |
| **File** | `scene-5-treatment.mp3` |

### Scene 6 — Pipeline + CTA (180f / 6s)

| | |
|---|---|
| **On screen** | "From idea to video" + 5 flow steps + tagline "You describe it. Claude builds it. Remotion renders it." |
| **VO** | *"That's the whole pipeline — from idea to shipped video."* |
| **Chars** | 56 |
| **File** | `scene-6-pipeline.mp3` |

---

## Totals & credit cost

```
Scene 1 ·  36 chars   Scene 4 ·  94 chars
Scene 2 ·  80 chars   Scene 5 ·  93 chars
Scene 3 ·  82 chars   Scene 6 ·  56 chars
                    ─────────────────
                    441 chars ≈ 441 credits
                    (0.36% of monthly 121k budget)
```

## Generation command

```bash
# from repo root
node --experimental-strip-types scripts/voice/generate-vo.ts \
  scripts/voice/treatment-explainer.config.json
```

## Iteration workflow

1. Change any `text` in the config JSON.
2. Re-run the command above — only regenerates the scene whose text changed (the script is idempotent on filename).
3. Refresh Remotion Studio at `localhost:3000` — `calculateMetadata` picks up the new MP3 automatically.
4. If VO length changes, scene duration updates, neighbouring scenes reflow.

## Open questions for Danny

1. **Music bed** — TreatmentExplainer has no bed wired yet. Pick a track from `public/audio/` (candidates: cyberpunk Brain Implant, trailer Wildfire, or something softer for an explainer?). Then I lift the ducking helper from FormatExplainer.
2. **Any line feel too formal / too loose?** Specifically Scene 3 "the feel you're chasing" is the riskiest — it's opinion not spec. Swap if it jars.
3. **Accent checks on "audio-led"** (Scene 4) and "spelled out" (Scene 5) — ElevenLabs sometimes stresses odd syllables on British compound phrases. Iterate if needed.
