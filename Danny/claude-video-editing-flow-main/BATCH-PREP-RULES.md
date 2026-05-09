# Batch Prep Rules — camera-dump prep workflow

> How Claude turns a raw camera-dump folder into a searchable, previewable, mildly polished folder ready for video editing. This is the SOP for the **batch prep** flow — sibling to `SELECTION-RULES.md` (cut-flow studio default) and `SCENARIO-RULES.md` (cut-flow in-situ deltas). Read once, rarely edit.

## What this flow is not

Not the selection-first cut flow. There is no transcript, no candidates sheet, no per-segment EDL, no captions, no target runtime. This flow predates that one — it runs on a camera dump *before* anyone has decided what to use.

If you have a Riverside / Loom export and want short-form cuts: use `SELECTION-RULES.md`.

If you have a folder of `DSC_NNNN.MOV` from a DSLR and want to make it findable: this file.

---

## The principle

**Pre-production is unowned territory.** CapCut, Premiere, Resolve all start at "import a file." None of them fix the camera-dump folder before that. That's the gap this flow fills:

```
CAMERA DUMP  →  STORYBOARDS  →  VISION SLUG  →  GRADE + AUDIO BRANCH  →  REVIEW
   (00-source/)   (3x2 + 6 stills) (kebab-case name)  (per-clip decision)   (index.html)
                                                                            ↑
                                                                       Originals untouched
```

Every clip stays at full source resolution. Every clip keeps its original byte-for-byte in `00-source/`. The prepped output sits alongside, slug-named, lightly graded, audio in the right ballpark.

---

## Pipeline shape

```
<project-dir>/
├── 00-source/                originals — never modified, never renamed
│   └── DSC_NNNN.MOV
├── storyboards/              3x2 contact sheet per clip
│   └── <slug>.png
├── stills/                   6 individual frames per clip — usable for thumbnails
│   └── <slug>/f00.jpg ... f05.jpg
├── prepped/                  light grade + audio-branched, slug-named
│   └── <slug>.MOV
├── slugs.json                {original_stem: slug} — written by vision pass
├── manifest.json             {slug: {original_stem, duration, audio_mode, peak_dbfs, ...}}
└── index.html                review surface
```

---

## Phases

The script (`scripts/batch-prep.py`) runs three phases. Each is independently re-runnable.

| Phase | Reads | Writes | Time |
|---|---|---|---|
| `storyboards` | `00-source/*.MOV` | `storyboards/`, `stills/` | seconds (parallel ffmpeg) |
| `encode` | `00-source/`, `slugs.json`, storyboards | `prepped/<slug>.MOV`, renames `storyboards/<slug>.png` + `stills/<slug>/` | minutes (libx264 encode) |
| `index` | everything | `manifest.json`, `index.html` | instant |

`--phase all` runs them in order. Most of the time you'll want that.

Between `storyboards` and `encode` is the **vision pass** — see § Slug rules below.

---

## Processing chain

### Video grade

`neutral_punch` — same preset as the cut-flow. One grade across all clips. No per-clip override. Canonical definition lives in `scripts/render.py`:

```
eq=contrast=1.06:brightness=0.0:saturation=1.0,curves=master='0/0 0.25/0.23 0.75/0.77 1/1'
```

This is deliberately the same grade as the cut-flow. A camera-dump clip and a Riverside-cut export should look like they came from the same world.

### Audio chain — measure first, branch per clip

Camera-dump audio is unpredictable. Some clips peak hot (Nikon mic gain), some are quiet (subject far from camera). A single fixed chain misfires on at least one of those modes. Instead:

1. **Measure** with `ffmpeg -af volumedetect`. Get `max_volume` (peak in dBFS).
2. **Pick a mode** based on peak.
3. **Apply the mode-specific chain.**
4. **Log mode + peak to `manifest.json`** so future-you can see why each clip was processed the way it was.

| Mode | Threshold | Chain | Why |
|---|---|---|---|
| **HOT** | peak > −2 dBFS | `volume=-3dB,acompressor=threshold=-18dB:ratio=2:attack=20:release=200` | Drops the ceiling 3 dB, then 2:1 compression above −18 dB. **No makeup gain** (banned per kerrie audit — stacking gain ahead of any normalize stage causes inter-sample clipping). |
| **LOW** | peak < −12 dBFS | `volume=+6dB,alimiter=limit=0.99` | Flat gain stage with a hard ceiling at −0.087 dBFS. No dynamic re-processing. Audible lift, no clip risk. |
| **OK** | −12 ≤ peak ≤ −2 | passthrough | Already in a usable window. Don't touch what isn't broken. |
| **All modes** | every clip | 30 ms `afade` in/out | Project rule. Prevents pops at clip start/end. |

**Banned filters (project-wide for this flow):**

- `loudnorm` — re-processes balanced audio, can push inter-sample peaks past target. The kerrie scenario in `SCENARIO-RULES.md` carves an exception for clip-mic / unmixed sources at the cut-flow stage; that exception does **not** apply here. Batch prep predates the cut.
- `afftdn` / denoise — destructive, removes high-end. If a clip needs denoise, it's a cut-flow scenario decision, not a batch-prep default.
- High-pass filter — same logic. Applies when wind / rumble is the dominant problem; not a default.
- Compressor with makeup gain — see HOT mode rationale.

### Codec settings

| Stream | Codec | Settings | Why |
|---|---|---|---|
| Video | `libx264` | `crf 20 -preset medium -pix_fmt yuv420p` | crf 20 matches `SELECTION-RULES.md`. Preset `medium` for batch — slower than the cut-flow render preset, but we're encoding once per clip and quality is the win. |
| Audio | `aac` | `-b:a 192k` | Standard. |
| Container | `.MOV` | `-movflags +faststart` | Streaming-friendly seek table at the front. |

Resolution and frame rate are passed through unchanged. We don't downscale 4K to 1080 — the editor can do that on import. Keeping native res preserves the option to use the prepped clip directly in a higher-res timeline.

---

## Slug rules

Slugs are how a non-editor finds the clip. `dj-mixing-deck.MOV` beats `DSC_5317.MOV` every time.

### Source

The slug is derived from the **storyboard PNG**, not the filename or any metadata. Six frames at evenly-spaced timestamps tell you what's *in* the clip — that's the input to the rename decision.

### Format

- 2–3 words, lowercase, kebab-case (e.g. `dj-mixing-deck`, `crowd-applause-wide`, `kerrie-piece-to-cam`)
- Letters and numbers only, hyphen-separated
- Max ~25 chars total
- Subject-first when there's a clear subject (`kerrie-...`, `dj-...`); content-first when it's a scene (`crowd-...`, `booth-...`, `panel-...`)

### Vision pass

Today: in-session. Claude reads the 10 storyboard PNGs, writes `slugs.json` like:

```json
{
  "DSC_5317": "dj-mixing-deck",
  "DSC_5337": "crowd-applause"
}
```

Future: Anthropic API call from inside `batch-prep.py`. Same input (storyboard PNG), same output (kebab slug), different transport. The script is structured so that step is swappable.

### Collisions

Two clips that vision-pass to the same slug get a numeric suffix:

```
dj-mixing-deck.MOV
dj-mixing-deck-2.MOV
```

The script handles this in `assign_slugs()`. No human intervention needed.

### Traceability

`manifest.json` always carries the original stem so you can find the source from the slug:

```json
{
  "dj-mixing-deck": {"original_stem": "DSC_5317", "duration_s": 52.8, ...}
}
```

---

## What this flow deliberately does NOT do

- **No trim.** The prepped clip is the same duration as the source. Trim is a cut-flow decision, not pre-production.
- **No segment cuts.** One source clip → one prepped clip. No EDL, no concat.
- **No framing rotation.** The 100/104 rotation rule from `SELECTION-RULES.md` exists because cut-flow stitches segments from a single-cam source and needs visual variation. Batch prep keeps clips whole — no stitching, no rotation.
- **No captions / SRT.** No transcript step. If the cut-flow picks a prepped clip later, captions get generated then.
- **No 9:16 crop.** Same logic — aspect transformations belong to the publish step, not pre-production.
- **No portrait auto-rotate.** DSLR clips with no rotation metadata that were shot vertically will read sideways. We do not auto-detect this — the cost outweighs the win for typical batches. If a clip needs rotation, the user moves it manually into a separate folder before re-running.

---

## One-click promise

```
./scripts/batch-prep.py <project-dir>
```

That command runs `storyboards` → vision pass → `encode` → `index` end-to-end on a folder containing `00-source/`. The vision pass is the only step that needs the model in the loop; everything else is deterministic.

The output: a folder where every clip has a meaningful name, a storyboard, six stills, an audio-branch decision, and a polished render — plus an `index.html` to review the lot. Originals untouched.

---

## When to evolve into scenarios

Same threshold as `SCENARIO-RULES.md`:

> **3+ clips with the same correction pattern** that the existing rules don't cover.

Until then, log per-batch findings inside the project working folder (`<batch>/findings.md`) and route through the defaults. Don't add a `BATCH-PREP-SCENARIOS.md` file until the evidence demands it.

Likely future scenarios (placeholders, not active):

- **Drone footage** — different audio expectations (no useful sound on most drones), different grade (atmospheric haze).
- **Phone vertical clips** — rotation metadata reliable here; can auto-detect and bucket separately.
- **Mixed multi-cam batch** — when the dump contains intentional matched pairs from different cameras, color-match across pairs may belong here.

None active today.

---

## Cross-references

- `SELECTION-RULES.md` — selection-first cut-flow rules. No overlap with this file. If a clip from `prepped/` later goes into the cut-flow, that flow re-processes from the source (not from prepped).
- `SCENARIO-RULES.md` — overlay for the cut-flow scenarios. Doesn't apply here.
- `CLAUDE.md` (project root) — broad project rules. The `no loudnorm` rule there is grounded in the Riverside-mixed scenario and remains in force for the cut flow. Batch prep never uses loudnorm regardless.

---

## File layout this affects

```
claude-video-editing-flow/
├── CLAUDE.md                  # project rules (unchanged)
├── SELECTION-RULES.md         # cut-flow STUDIO default (unchanged)
├── SCENARIO-RULES.md          # cut-flow scenario overlay (unchanged)
├── BATCH-PREP-RULES.md        # this file
└── scripts/
    └── batch-prep.py          # implements this file
```
