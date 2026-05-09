# Claude Video Editing Flow Skill

## Trigger

Danny says any of:

- "edit this clip" / "cut this down" / "make a 60s cut"
- "candidates" / "selection" / "tick sheet"
- Drops a path to a Riverside `.mp4` file
- Pastes a filename like "Claude-Podtest-*.mp4" or mentions a `<clipname>/` working folder
- "render v2" / "re-render" / "new picks"
- **Batch mode:** "batch", "process folder", "asset library", "chop them all up", drops a path to a folder of `.mp4`s — routes to the autonomous batch flow (see § Batch / asset mode).

## What This Skill Does

Turns a raw Riverside podcast `.mp4` into a rendered short-form clip. Claude does all the work except the selection pass — Danny ticks candidates in a markdown sheet, Claude renders.

**Principle:** Selection is a human decision. Correction is a Claude decision.

## Steps

### 1. Set up the clip working folder

If not already set up, create `<clipname>/edit/` alongside the raw `.mp4`:

```
<clipname>/
  <clipname>.mp4          # Source
  edit/
    transcripts/          # Scribe cache
    takes_packed.md       # Phrase-level transcript
    candidates.md         # Ranked picks (Danny ticks)
    edl.json              # EDL built from ticks
    preview.mp4           # Final render
```

### 2. Transcribe (Scribe word-level)

Use the `video-use` skill's Python pipeline:

```bash
cd "${VIDEO_USE_DIR:-../video-use}"
source .venv/bin/activate
python scripts/transcribe.py <clip.mp4> --out <clipname>/edit/transcripts/
python scripts/pack_transcripts.py <clipname>/edit/transcripts/*.json > <clipname>/edit/takes_packed.md
```

Set `ELEVENLABS_API_KEY` in this repo's `.env` (copy `.env.example` to `.env` and fill it) or export it directly into the shell.

Scribe is cached — re-running is free after the first pass.

### 3. Score + rank candidates

Read `SELECTION-RULES.md` at the project root. Apply the inclusion rules:

1. Word-boundary snappable (use Scribe word timestamps)
2. Duration 3-30s
3. Contains at least one: self-contained thought, quotable line, decision/turn/reveal
4. Filler-free within segment, or clean to strip with a mid-cut
5. No mid-phrase audio edges

Score every qualifying segment with the silent heuristics (insight density, quotability, self-containment, stumble count, narrative function). Assign tier ★★★ / ★★ / ★.

### 4. Emit candidates — JSON + markdown + terminal display

Write two files side by side:

- `<clipname>/edit/candidates.json` — machine-readable, consumed by `scripts/picker.py`
- `<clipname>/edit/candidates.md` — git-tracked artefact, same data in prose

Then **display via the coloured picker in the terminal**:

```bash
/opt/homebrew/opt/python@3.12/bin/python3.12 \
  Claude-Video-Editing-Flow/scripts/picker.py \
  <clipname>/edit/candidates.json
```

The picker prints a meta panel, a candidates table (tier stars coloured, flags amber), a quotes block, and a combos table with target-check colouring. That is the interface.

**Never point Danny at `candidates.md` to tick.** Markdown files are artefacts, not interfaces.

**~3-5 ★★★ picks + 2-3 ★★ is the sweet spot** — the table should fit without scrolling.

### 5. Receive picks as natural language

Danny replies in the terminal with any of:

- A combo letter (`"A"`, `"go with C"`)
- A number list (`"1 4 6 9"`, `"pick 1, 4, 6, 9"`)
- An exclusion (`"skip 3"`, `"drop 2 and 7"`)
- Free text (`"cut the gibberish"`, `"narrow to clean only"`)

Resolve the reply to a concrete pick list. **Never re-autonomously pick.** If Danny asks for a suggestion, offer one, but never render without his nod.

### 5.5. Lock-in display before rendering

After resolving picks, write `<clipname>/edit/edl.json` and display the lock-in table:

```bash
/opt/homebrew/opt/python@3.12/bin/python3.12 \
  Claude-Video-Editing-Flow/scripts/lockin.py \
  <clipname>/edit/edl.json
```

Green ✓ if total is within target tolerance, red ✗ if not. Wait for Danny's `y` / `n` / `q`.

### 5.6. Boundary review (pre-render gate 1)

Before rendering, read the word-level Scribe JSON (`<clipname>/edit/transcripts/<clip>.json`) and for each EDL range, inspect `±1.5s` around `start` and `end`. Reject any pick where:

- Start catches a tail word from the prior phrase (bleed-in).
- End cuts off mid-word or mid-phrase (mid-syllable slice).
- Start begins mid-word.

Report all bleeds as a table: `pick · boundary · current_time · offending_word · proposed_shift`. Update `edl.json` with the fixes and get Danny's sign-off before render. See `SELECTION-RULES.md` → "Gate 1".

### 5.7. Close check (pre-render gate 2)

The final pick must land — quotable payoff, decision/callback, or natural sign-off. Reject trailing ends (`…live with the voice a bit`, `…and stuff`, incomplete thoughts). If no closer, propose:

1. Trim the final pick to a stronger internal landing, OR
2. Add a CLOSE candidate from elsewhere in the source (speaker's sign-off, HOOK callback).

Confirm with Danny before render. See `SELECTION-RULES.md` → "Gate 2".

### 6. Validate budget

Read ticked candidates. Sum durations.

- Over budget (>target × 1.1): flag ★★ candidates first as drop targets. Only drop ★★★ as last resort.
- Under budget (<target × 0.9): suggest the highest-ranked unpicked candidate to add.
- Mutually exclusive picks (tight + full of same beat ticked): warn, ask which one.

### 7. Build EDL + render

Write `<clipname>/edit/edl.json` with ranges from picks. Assign framing rotation by pick order:

```
Index 0 -> scale=1920:-2                                         (100% full)
Index 1 -> scale=1996:1122:flags=lanczos,crop=1920:1080:38:21    (104% center)
Index 2 -> scale=1920:-2,crop=1920:1080:0:0                      (100% full)
Index 3 -> scale=1996:1122:flags=lanczos,crop=1920:1080:62:21    (104% shifted right)
Index 4+ -> cycle repeats
```

Render via the generalised `scripts/render.py` (preferred):

```bash
/opt/homebrew/opt/python@3.12/bin/python3.12 \
  Claude-Video-Editing-Flow/scripts/render.py \
  --edl <clipname>/edit/edl.json \
  --out <clipname>/edit/preview.mp4 \
  --format horizontal  # or "vertical" for 9:16 Shorts/TikTok (1080x1920)
```

`render.py` reads the EDL, resolves source paths from the `sources` map (or takes `--src <override.mp4>`), applies the framing rotation cycle by pick order, grades once with `neutral_punch`, and concats lossless. Keep `scripts/render_v2.sh` as the reference pod-test-claude pipeline — don't use it for new clips.

Core ffmpeg flags (what `render.py` emits):


```
ffmpeg -y -ss <start> -i <src> -t <duration> \
  -vf "<frame>,eq=contrast=1.06:brightness=0:saturation=1,curves=master='0/0 0.25/0.23 0.75/0.77 1/1'" \
  -af "afade=t=in:st=0:d=0.03,afade=t=out:st=<dur-0.03>:d=0.03" \
  -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -r 24 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart <out>
```

Concat with demuxer + `-c copy` (no re-encode).

**Never use `--preview` mode.** It's CRF 22 + GOP artefacts at boundaries.

### 8. Self-eval

Before opening in QuickTime:

- Probe output duration — verify within ±10% tolerance
- timeline_view PNGs at each cut boundary + start + end
- Visually confirm no black frames, no grade pops, audio levels roughly match

Report durations + framing assignments back to Danny.

### 9. Open in QuickTime + display verdict options

```bash
open <clipname>/edit/preview.mp4
/opt/homebrew/opt/python@3.12/bin/python3.12 \
  Claude-Video-Editing-Flow/scripts/verdict.py \
  <clipname>/edit/preview.mp4
```

The verdict helper prints the 4-lane options table (a=ACCEPT green, b=RE-FRAME cyan, c=RE-FLOW yellow, d=RE-PICK red). Wait for Danny's reply — natural language, no file hunting. Loop back to the appropriate step:

- `a` accept → step 10 (session log + close)
- `b` re-frame → step 7 (re-render with tighter crops)
- `c` re-flow → step 5.5 (revise EDL, re-run boundary review + close check)
- `d` re-pick → step 4 (show picker again)

### 10. Update session log

After lock-in, append to `Claude-Video-Editing-Flow/sessions/<date>-<clipname>.md`:

- Clip source + duration
- Target runtime + final cut duration
- Picks made + framing rotation applied
- Any deviations from rules + why
- Final preview path + verdict

## Batch / asset mode (autonomous, prototype)

**When to use:** Danny drops a folder of raw `.mp4`s to be chopped into a shared assets library for downstream Claude Remotion Flow composition. Outputs are **jump-cut section assets, NOT finished shorts**. Selection-is-human is suspended here by design — this is prototype mode, documented in `project_video_editing_flow_assets.md`.

```bash
/opt/homebrew/opt/python@3.12/bin/python3.12 \
  Claude-Video-Editing-Flow/scripts/batch.py \
  --source-dir <folder-of-mp4s> \
  --assets-dir <shared-library> \
  --target 60 --tolerance 0.1 \
  --format horizontal  # or "vertical"
```

Per-clip flow inside `batch.py`:

1. Transcribe if `<clip>/edit/transcripts/<clip>.json` missing (calls video-use `transcribe.py`; sources `ELEVENLABS_API_KEY` from this repo's `.env`, falling back to sibling `claude-remotion-flow/.env`).
2. **Heuristic scoring** — groups words into silence-bounded segments (gap ≥ 0.9s), ranks by word-density minus filler count (weighted 0.6×), tiebreaks on trailing-silence length.
3. **Greedy pick** — top-density non-overlapping segments until total ∈ `[target*(1-tol), target*(1+tol)]`.
4. **Gate 1 auto-snap** — boundary review: start shifts off tail-word bleeds, end prefers nearest silence edge within ±1.5s.
5. **Gate 2 landing check** — if last pick's trailing silence < 0.3s, reorders so the best-trailing pick lands last.
6. Writes `<clip>/edit/edl.json` + `batch_log.json`.
7. Renders via `render.py` with the requested `--format`.
8. Symlinks preview into `<assets-dir>/<clipname>__preview_<format>.mp4`.

A `batch_summary.json` is written to the assets dir with the full run ledger.

**Guardrails specific to batch mode:**

- Autonomous picks only run when `batch.py` is invoked. Single-clip flow still requires Danny's verbal picks.
- Jump cuts are the intent. Don't re-engineer batch outputs to smooth transitions — that's Claude Remotion Flow's job downstream.
- Dry-run with `--dry-run` to inspect picks before rendering.

## Output Contract

Every processed clip produces:

1. `candidates.md` -- ranked picks with checkboxes
2. `edl.json` -- source of truth for the cut
3. `preview.mp4` -- rendered output
4. `master.srt` -- captions from transcript + EDL offsets
5. Session log entry at `Claude-Video-Editing-Flow/sessions/<date>-<clipname>.md`

## Rules File

`SELECTION-RULES.md` at the project root is the SOP. Read it when:

- Any selection or render question is unclear
- A new clip type needs evaluating against the rules
- A rule edit is being proposed (check when-to-edit guidance at the bottom of the file)

## Dependencies

- `ffmpeg` 8.0.1+ (Homebrew). `brew install homebrew-ffmpeg/ffmpeg/ffmpeg` for burned captions (optional)
- ElevenLabs Scribe API. Key in `.env` at this repo's root (see `.env.example`)
- `video-use` skill Python venv at `$VIDEO_USE_DIR/.venv/` (default: `../video-use/.venv/` sibling)
- QuickTime (macOS default)

## ChromaDB

Collection: `video_editing_flow_decisions`.
Write decisions with:

```bash
/opt/homebrew/opt/python@3.12/bin/python3.12 command-centre-memory/memory.py decide "[about]" "[decision]" "[context]"
```

## Guardrails

- **Terminal-first.** Every interaction moment (picker, lock-in, verdict) is a coloured table in the terminal via `scripts/picker.py` / `lockin.py` / `verdict.py`. Markdown files are artefacts, not interfaces. Never ask Danny to open `candidates.md` to tick boxes.
- **Never render without Danny's explicit verbal picks.** Autonomous picks are a prototype mode only.
- **Never switch grade presets per segment.** One preset across the whole cut.
- **Never enable loudnorm.** Danny mixes in Riverside before export.
- **Never render in `--preview` mode.** CRF 20 full quality only.
- **Never use Playwright for this workflow.** ffmpeg is the engine end-to-end.
