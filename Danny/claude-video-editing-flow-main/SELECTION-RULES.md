# Selection Rules — video-use workflow

> How Claude generates `candidates.md` for any raw footage. Runs silently in the background. This is the SOP — read once, rarely edit.

## The principle

**Selection is a human decision. Correction is a Claude decision.**

Humans belong at the text-reading stage, where taste is cheap. Claude belongs at the render-iterate stage, where re-pulls cost seconds, not minutes of scrubbing a timeline.

```
RAW FOOTAGE  →  TRANSCRIBE  →  SCAN  →  CANDIDATES.MD  →  TICK  →  RENDER
                                          ↑                    ↓
                                      Claude fills            Human picks
                                     (background rules)      (foreground taste)
```

---

## Candidate inclusion rules

A segment qualifies for the sheet only if:

1. **Silence snappable** — within ±2.0s of each proposed bound there must be a real silence in the audio waveform (head ≥150ms, tail ≥250ms). Programmatically enforced at lockin via `ffmpeg silencedetect`; see Gate 1 below.
2. **Duration 3–30s** — shorter = weaker, longer = subdivide into smaller candidates.
3. **Contains at least one of:**
   - A self-contained thought that makes sense without the surrounding context
   - A quotable line that stands alone
   - A decision / turn / reveal / callback
4. **Filler-free within the segment** OR the filler is clean to strip with a mid-cut.
5. **No mid-phrase audio edges** — never starts or ends on a word the speaker hasn't finished.

Segments that fail any rule get dropped before the sheet is written.

### Gate 1 — programmatic snap-to-silence (lockin.py)

Whisper / Scribe `word.end` is the end of the phoneme, not where the audio actually goes silent. Cutting at word boundaries clips consonant tails and runs adjacent thoughts into each other (the "hands-off-UI / human-in-the-loop" failure on the 3 May Loom).

`scripts/lockin.py` runs `ffmpeg silencedetect` on the source (cached in `<edit>/silences.json`), snaps every EDL range to the nearest qualifying silence, writes the snapped bounds back into the EDL, and **refuses to advance to render** if any cut is mid-word (no silence in window).

Defaults — tunable via CLI:

| Flag | Default | What it controls |
|---|---|---|
| `--head-pad` | `0.150` | Min silence before cut start to call it `clean` |
| `--tail-pad` | `0.250` | Min silence after cut end to call it `clean` |
| `--snap-window` | `2.0` | How far to search for a silence edge (seconds) |
| `--noise-db` | `-32` | silencedetect noise floor (lower = more sensitive) |
| `--accept-tight` | off | Render even when a cut is still mid-word (escape hatch) |

Status taxonomy printed in the Gate 1 table:
- ✓ **clean** — head ≥ pad AND tail ≥ pad
- ⚠ **tight** — snapped to a silence but shorter than pad threshold (still better than no snap)
- ✗ **mid-word** — no silence found within window, render refused unless `--accept-tight`

---

## Ranking rules

```
★★★  Top-rank — peak insight density, quotable, self-contained
      → These should be ~3-5 per clip
      → Danny picks MOSTLY from these

★★   Supporting — bridges, context, credibility frames
      → Add only if the story needs them
      → ~3-5 per clip

★     Weaker — filler beats, only if narrative demands
      → Rarely surfaced; only when nothing else fits
      → Can be omitted from sheet entirely
```

**Scoring heuristics** (silent, applied during candidate generation):

- Insight density = ideas per second (concept per 3-5s = ★★★)
- Quotability = does a 15-word pull stand alone? (yes = ★★★)
- Self-containment = does it need setup from another segment? (no = ★★★)
- Stumble count = uhs, ahs, false starts within (any = downgrade)
- Narrative function = HOOK / INSIGHT / DECISION / PAYOFF / CLOSE (clear function = upgrade)

---

## Budget rules

Target runtime has ±10% tolerance. At render time, Claude checks:

- **Over budget:** flag the ★★ candidates first as drop targets; only drop ★★★ as last resort.
- **Under budget:** suggest the highest-ranked unpicked candidate to add.
- **Mutually exclusive candidates:** same beat offered as tight/full versions → pick one, not both. Claude warns if both ticked.

---

## Render rules (no human decision)

Everything below is auto-applied. Don't surface in the candidate sheet.

### Grade
- **Single preset across all segments** — `neutral_punch` default (contrast 1.06, S-curve, no colour shift).
- **Never per-segment auto-grade** — causes drift and visible pops.
- Creative looks (`warm_cinematic` etc.) only on explicit request.

### Audio
- **30ms fades** at every cut boundary (prevents pops).
- **No loudnorm** — Danny mixes audio in Riverside before export. Loudnorm here would re-process balanced audio and risk clipping.
- For other users / unmixed sources: loudnorm to -14 LUFS / -1 dBTP / LRA 11 (social standard).

### Framing rotation
For single-camera talking-head sources, auto-rotate subtle framing between adjacent cuts to give a multi-cam feel:

```
Index 0  → scale=1920:-2                                       (100% full)
Index 1  → scale=1996:1122:flags=lanczos,crop=1920:1080:38:21  (104% center)
Index 2  → scale=1920:-2                                       (100% full reset)
Index 3  → scale=1996:1122:flags=lanczos,crop=1920:1080:62:21  (104% shifted right)
Index 4+ → cycle repeats
```

No motion, no Ken Burns, no zooms during a shot. 4% scale change only. Visible but not fidgety.

### Extract / concat
- `-ss <start>` BEFORE `-i` (fast + accurate on modern ffmpeg 5+).
- CRF 20, `-preset fast`, yuv420p, 24fps, `+faststart`.
- Concat via demuxer with `-c copy` (no re-encode).
- **Don't use `--preview` mode for final output** — it's CRF 22 + GOP artifacts at segment boundaries.

### Captions
- SRT always built from transcript + EDL offsets (Hard Rule 5 from video-use skill).
- Burned in only if host has libass-enabled ffmpeg (`brew install homebrew-ffmpeg/ffmpeg/ffmpeg`).
- Otherwise ship SRT as companion file for Premiere/Resolve/Descript import.
- Style: 2-word UPPERCASE, Helvetica 18 Bold, MarginV=35 (from video-use `SUB_FORCE_STYLE`).

---

## The cycle in full

```
1. Drop raw .mp4 into <project>/

2. Claude runs:
     ffprobe                 → inventory
     transcribe.py           → Scribe word-level JSON (cached)
     pack_transcripts.py     → takes_packed.md
     [scans + scores]        → candidates.md (this file's output)

3. Danny (or team member) opens candidates.md:
     ticks [ ] → [x] on picked segments
     saves file
     tells Claude "done"

4. Claude runs:
     validates budget (54-66s for 60s target)
     builds edl.json from ticked candidates
     applies framing rotation by order
     renders: per-segment extract → concat → open in QuickTime

5. Danny watches:
     ✓ Lock it in  →  move to next clip
     ✗ Re-tick     →  different picks, same 2-min re-render
     ✗ Rule bug    →  fix SELECTION-RULES.md, apply going forward
```

---

## Who can run this

- **Danny** — primary.
- **Alex** — can do selection pass on any clip Danny flags. Rules + candidate sheet are both plain markdown.
- **Future VA** — hand them this rules file + a clip's candidates.md. Clear enough to tick against without needing editorial judgment from Claude.

The rules live in the clip project folder, not `~/.claude/`. Keeps per-project variations possible without affecting the global skill.

---

## When to edit these rules

- After 3+ clips show the same correction pattern → encode the fix here.
- When output target changes (vertical Shorts, 30s micro-clips, 90s YouTube Shorts) → add a separate framing rotation variant.
- When a specific speaker has a signature style (Shubash always needs more air before his closing beats) → add per-speaker overrides.

Don't edit for one-off exceptions. Per-clip tweaks belong in the EDL, not the rules.

---

## Variants

### Screen-share framing (Keplo / browser / any UI screencap)

The default 4% talking-head rotation (100% / 104% center / 100% / 104% right) assumes the subject fills the frame. **Screen-share UIs don't** — content sits in a centered column with dark padding. Pasting the talking-head rotation over a screen-share produces black bars + off-target zooms.

Rules for screen-share cuts:

- **Zoom targets are per-pick, derived from content position**, not a fixed percentage cycle. Sample the mid-point frame of each pick; pick the scale + crop that fills the visible content column.
- **Typical ranges**: 115% center (hide browser chrome), 120-135% when the pick is focused on a single content block (modal, hero image, call-out).
- **Continuity within a section**: if two consecutive picks share the same UI region, keep the same zoom — don't chop the viewer around.
- **Chops not motion**: hard cuts between zoom states, no Ken Burns.

### Vertical 9:16 framing (Shorts / TikTok / Reels)

For vertical distribution, source 1920×1080 talking-head footage is cropped to a 608×1080 subject-centric slice and scaled to 1080×1920. Rotation keeps the 4% bump pattern; shifted-right variant offsets from the centered crop.

```
Index 0  → crop=608:1080:656:0,scale=1080:1920:flags=lanczos                                   (center)
Index 1  → scale=2074:1166:flags=lanczos,crop=608:1080:733:43,scale=1080:1920                 (108% pseudo-tight center)
Index 2  → crop=608:1080:656:0,scale=1080:1920:flags=lanczos                                   (center reset)
Index 3  → scale=2074:1166:flags=lanczos,crop=608:1080:813:43,scale=1080:1920                 (108% shifted right)
Index 4+ → cycle repeats
```

Framing constraints:

- **Subject must stay inside the 608-wide centered column.** For off-center speakers, adjust the crop offset per-clip (`x` parameter) before render — don't rely on the default centered slice.
- **Single-camera only.** Multi-cam sources need per-cut framing choices; not auto-applicable.
- **No motion / no Ken Burns**, same as horizontal.
- **Screen-share sources** do not fit this variant. Vertical screen-share needs a different crop strategy (content-column isolation).

Run via `render.py --format vertical`. Output is 1080×1920, same grade preset, same 30ms fades, same concat pipeline as horizontal.

### Reaction beats need their own setup

A pick like *"oh, I would definitely click on it"* or *"that's why it works"* is a reaction. It lands *because* the viewer heard the setup — the "boring ones," the "blends in," the framing that made the reaction inevitable. Isolating the reaction to save seconds kills the payoff.

Rule: **expand reaction picks to include their own setup line within the same cut.** If the speaker narrates "this stands out better than the boring ones — so if this blends in, washed away — but if I saw *this*…", that's ONE pick, not three. Trim within it, don't chop it.

*Derived from:* Dorian v3 → v4 revision (23 Apr 2026). v3 isolated the 3.7s reaction; v4 expanded to 15.7s with setup and landed.

---

## Pre-render gate rules

Two checks MUST run after lock-in and BEFORE render. If either fails, Claude proposes a fix and does not render until the boundary/close is signed off.

### Gate 1 — Transcript boundary review

For every pick in the EDL, Claude reads the word-level Scribe JSON at `±1.5s` around the `start` and `end`. Reject any pick where:

- **Start catches a tail word** from the adjacent prior phrase (e.g. pick starts at `13.58` but the word `voices,` occupies `13.58 → 14.14` — that's a bleed-in).
- **End is mid-word or mid-phrase** (cuts off audible). End must fall inside a real silence gap (`≥ 0.15s` of space after the final word).
- **Start is mid-word** — start must begin on a word onset, not mid-syllable.

When a bleed is detected, shift to the nearest clean silence edge (typically the next phrase boundary in `takes_packed.md`, or the word-boundary in the Scribe JSON) and report the delta. Render only after the corrected EDL is confirmed.

*Derived from:* pod-test-claude Combo A (23 Apr 2026). v3 caught the word `voices` bleeding into VALIDATION (13.58 → 14.14) and `part and parcel` bleeding into LOOM (118.96 → 120.16). v4 fixed both with boundary review before render.

### Gate 2 — Every cut needs a close, not just a hook

A HOOK alone is not enough. The last pick MUST end on a landing. Acceptable closers:

- A **quotable payoff** (*"It can write them."*, *"That's pretty much your listing done."*)
- A **decision or callback** (*"No — but for walkthroughs, why not?"*)
- A **natural sign-off** (*"does that make sense?"*, *"there you go"*)
- A **thesis restatement** at lower tempo

Reject trailing ends: *"…live with the voice a bit"*, *"…and stuff like there is everywhere"*, filler words, incomplete thoughts, running-on into unrelated territory.

If the selected picks don't include a natural closer, Claude:

1. Proposes trimming the last pick to a stronger internal landing, OR
2. Suggests adding a CLOSE candidate from elsewhere in the clip (often from the speaker's sign-off at the end of the source, or a callback to the HOOK).

*Derived from:* pod-test-claude Combo A (23 Apr 2026). v3 ended on *"live with the voice a bit"* — trailed, didn't land. v4 ended on *"Claude can do the work. It can write them."* by trimming LOOM end from 138.54 to 135.90. Clean payoff landing.
