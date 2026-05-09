# Scenario Rules — additive overlay on top of `SELECTION-RULES.md`

> `SELECTION-RULES.md` is the source of truth for the **studio / Loom / Riverside-mixed** scenario it was written for. Do **not** modify it for in-situ exceptions. Add scenario blocks here.
>
> Every block below = the same shape (audio chain, grade, framing, stills, trade-offs, evidence). When a clip arrives, route to the matching scenario; inherit everything not overridden.

---

## How to use this file

1. **Detect the scenario** from the source. Heuristics in each block under "How to detect this scenario".
2. **Inherit from STUDIO (default)**.
3. **Apply the deltas** in the matched block.
4. **Log evidence** when round-N feedback adds a new finding. Don't generalize from one clip — wait for 3+ clips with the same correction pattern before promoting a finding to a rule (per `SELECTION-RULES.md` line 177).

If a clip matches no scenario, it's STUDIO. Don't invent a new block until you've shipped at least one clip through the default and seen what breaks.

---

## 1. STUDIO (default) — defined in `SELECTION-RULES.md`

The defaults: studio mic with preamp, Loom or Riverside, talking-head, lit indoor, mixed audio. Use `SELECTION-RULES.md` as written. This block is a placeholder — no overrides here.

---

## 2. MUSIC IN A VENUE / DARK LIGHTING / MOVING SUBJECT

Evidence: `_captures/dj-demo/test1dj/` (Danny DJing, club, 4K, no speech).

### How to detect this scenario

- Source loudness already `≥ -16 LUFS` measured by `loudnorm=print_format=json` (broadcast-balanced before our pipeline touches it).
- No speech detected (Whisper returns empty or near-empty word array).
- Source brightness histogram skewed to lower quartile (dark venue).
- Subject moves laterally across the frame between segments (sample mid-segment frames; if subject x-centre shifts > 10% of frame width across cuts, treat as moving).

### Audio (override)

- **No HPF, no compression, no loudnorm.** Source is already at broadcast loudness. Re-processing balanced audio produces a "strained mid-range" failure mode.
- **Keep:** 30 ms `afade` in/out at every cut boundary (project rule, prevents pops).

### Grade (no override)

- Stay on `neutral_punch` exactly as defined in `SELECTION-RULES.md` (`contrast=1.06`, `saturation=1.0`, S-curve).
- Do **not** add saturation pump or `gamma < 1`. Dark venues already crush — extra grade reads as "too dark".

### Framing (override)

- **16:9:** static or moderate push-in (1.0× / 1.25× centre / 1.0× / 1.35× off-right) is acceptable here even though it exceeds the 4% rotation rule. Wide 16:9 frame gives the moving subject room without losing them.
- **9:16:** the default talking-head crop (`608×1080` centred slice) **fails** for moving subjects — they leave the column. Instead:
  1. Sample mid-segment frames at full source resolution.
  2. Pick a 9:16 vertical slice from the source — for 4K (3840×2160) that's `1215×2160` (no scaling first).
  3. Pick `x` per segment so the subject sits in the centre of the slice. No motion within shot.
  4. Scale to `1080×1920` with `lanczos`.
- Static x-offset per cut, **not** Ken Burns or tracking.

### Stills

- Mid-segment grab unreliable in this scenario (moving hands, blink, mid-stride).
- **Defer until a stills protocol exists** — flagged universal across scenarios.

### Trade-offs

- Letting the source audio through unprocessed means the listener gets the venue PA + crowd as recorded. Acceptable for "DJ-in-context" reels; not acceptable if the source has dialogue you want isolated.

### Evidence

- `_captures/dj-demo/test1dj/test1dj.md` — round-1 / feedback / round-2 / findings.

---

## 3. VOICE IN A PUBLIC PLACE / CLIP-MIC / UNMIXED

Evidence: `_captures/dj-demo/test2-kerrie/` (Kerrie at venue, raw camera/clip mic, talking-head face-to-camera).

### How to detect this scenario

- Source loudness `≤ -18 LUFS` measured (unmixed, lower than studio target).
- Audible noise floor: `astats` shows RMS within 25 dB of peak across silence regions.
- Speech present (Whisper returns clean word timestamps).
- Subject framing static (face-to-camera, body doesn't traverse the frame).

### Audio (override) — chain order matters more than the parameters

```
afade(in/out 30ms)
  → afftdn=nr=12:nf=-25         # FFT denoise lowers noise band BEFORE any gain stage
  → acompressor=threshold=-22dB:ratio=2.5:attack=15:release=180   # NO makeup gain
  → loudnorm=I=-14:TP=-1.5:LRA=11   # normalize cleaner signal last
```

**Why this order:** denoise first keeps the noise floor down; compress without makeup gain tames dynamics so loudnorm has predictable peaks; loudnorm last is the only gain stage that needs to hit a target.

**Why TP=-1.5 not -1:** -1 dBTP is the social standard, but inter-sample peaks on plosives clip the ceiling. -1.5 dBTP = 0.5 dB of perceived loudness traded for clipping safety. Drop to -2 dBTP for hot plosive sources.

**Why no makeup gain on the compressor:** stacking +2 dB ahead of loudnorm pushed measured peaks past the dBTP target in test2-kerrie round-2. Loudnorm alone does the levelling — that's its job.

### Grade (no override)

- `neutral_punch` as default. No scenario reason to deviate.

### Framing

- **16:9:** default 4% rotation pattern (100/104/100/104R) works — face-to-camera, subject doesn't traverse.
- **9:16:** default `608×1080` centred slice works for the same reason. No per-segment x-offset needed.

### Stills

- Same as scenario 2 — defer pending stills protocol.

### Trade-offs

- `afftdn=nr=12` removes 12 dB from the noise band; some sibilance dies with it. Acceptable when background noise is the bigger problem. If venue is quieter, drop `nr` to 6–8 to preserve more high-end.
- Loudnorm with no measured first-pass is single-pass — outputs are within ~0.5 LUFS of target, not exact. Run two-pass loudnorm only when an exact LUFS is required.

### Evidence

- `_captures/dj-demo/test2-kerrie/test2-kerrie.md` — round-1 / feedback / round-2 / round-2b / findings.

---

## 4. OUTDOOR / WIND / VARIABLE  *(placeholder — not yet evidenced)*

Reserve. To be filled when a test clip surfaces this case (street interview, podcast-on-the-move, garden recording).

Likely overrides anticipated:
- Audio: high-pass filter at 80–120 Hz to kill wind rumble (default rules forbid HPF; this scenario likely needs it).
- Grade: variable lighting may need per-cut WB normalization — explicit override of "single grade across the cut" rule.

Don't apply this block until a clip with this scenario actually exists in `_captures/`.

---

## When to add a new scenario block

Same threshold as global rule edits: **3+ clips show the same correction pattern** that the existing scenarios don't cover. Until then, log findings inside the per-test markdown and route the clip through the closest existing scenario.

## When to upgrade STUDIO (the global rules)

If a finding from in-situ scenarios proves to be universal — i.e. it would also improve studio output — propose a `SELECTION-RULES.md` edit. Examples that might cross over:

- 30 ms `afade` rule (already global).
- TP=-1.5 dBTP ceiling (currently in scenario 3; might generalize to all unmixed sources).

Cross-overs require their own evidence in 2+ scenarios before they're promoted.

---

## File layout this affects

```
claude-video-editing-flow/
├── CLAUDE.md                  # project rules (unchanged)
├── SELECTION-RULES.md         # STUDIO defaults (unchanged)
├── SCENARIO-RULES.md          # this file (additive overlay)
└── _captures/
    └── <project>/
        └── <test>/
            └── <test>.md      # round-N feedback breadcrumb (evidence)
```
