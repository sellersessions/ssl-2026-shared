# Loop Cutter — UI redesign moodboard

> Companion to `scripts/sfx/auditioner/MOODBOARD-stitch-redesign.md`. The auditioner redesign shipped 2026-05-01 and is now the brand baseline. The cutter needs to be brought up to that family — same restraint, same type ramp, same button language — without losing its workspace-grade ergonomics.

## Goal

Make the cutter and the auditioner read as one product. Today the cutter overshoots the chrome (gradient panels with bordered glow rings, gradient primary buttons, JetBrains Mono on every label) and undersells the waveform itself. The fix is the opposite of more polish: less chrome, more workspace.

A loaded-track view that holds:

- **The waveform** as the hero — ~50% of viewport vertical, not 280px
- **Transport** as a thin subordinate strip, not a card
- **Markers / loop chips / anchor** as the same gold-and-flat language the auditioner uses
- **Identity** of the source (track title, category stripe) so the cutter knows where the audio came from

without three competing card containers fighting the eye.

---

## Reference 1 — Traktor Pro deck (loaded track view)

> Same Traktor reference as the auditioner moodboard, but applied to a different surface. The cutter already borrows heavily — loop length chips, BPM input, anchor lock, IN/OUT markers — keep going.

| Slot | Behaviour |
|---|---|
| **Track title + artist** | Top-left, small. Identity, not branding. |
| **BPM (large readout, top-right)** | Mono, big. The DJ's primary number. |
| **Hotcues (coloured slot grid)** | 8 buttons, each a coloured pad. The cutter's IN/OUT markers are the same idea; expandable later. |
| **Loop length chips** | 1/4, 1/2, 1, 2, 4, 8, 16 bars — already in the cutter, keep. |
| **Anchor / downbeat lock** | Locks BPM grid to a known beat — already in the cutter, keep. |
| **Big waveform + overview lane** | Two waveforms: zoomed (current) + full track (overview). Cutter has only the zoomed view. |
| **Transport (3 circular buttons)** | Cue / Play / Sync. Cutter has the same three actions but in rectangular buttons. |

**Lessons:**
1. **Player-as-editor is the right mental model.** The cutter is in the same family as Traktor's main deck — keep the workflow ergonomics.
2. **The waveform is the hero.** Traktor gives it ~50% of vertical space. Cutter currently gives 240px out of ~900px (~27%).
3. **Cue/IN/OUT colors are loud, but only on the markers themselves.** Chrome stays neutral. The cutter has this right (green IN, orange OUT) — the chrome around them is what's noisy.
4. **Add an overview lane below the zoomed waveform** so you can see the loop region in context of the full track at a glance.

---

## Reference 2 — Apple Logic Pro Sample Editor

> Apple's chrome restraint applied to the workspace. The waveform fills the workspace; transport is a thin strip below; numeric inputs sit in a quiet right rail. No bordered glow rings, no gradient panels, no gradient buttons.

| Slot | Behaviour |
|---|---|
| **Title strip (very thin, top)** | Filename, duration. Single line. No gradient logo block, no CTAs in the chrome. |
| **Waveform (~70% of viewport)** | Loop region drawn as a translucent overlay, not bordered. Snap-to-zero markers visible. |
| **Inspector (right rail, optional)** | Numeric inputs in a quiet column. Not a glowing card. |
| **Transport (thin strip, bottom)** | Play / pause / scrubber / time. One row. No card around it. |
| **No glow rings, no card borders** | Workspace chrome is visible only at section edges (`--line` hairline). |

**Lessons:**
1. **Drop the `.gcard` glow ring everywhere.** Flat panels with `--line` borders read more confident. The bordered gradient ring is the single biggest visual divergence from the auditioner.
2. **Workspace = waveform.** Everything else subordinates. Resize the waveform area to ~50% of viewport height (currently 240px → target ~480px).
3. **Buttons match the auditioner's language.** Flat outlined ghost for secondary, gold-filled for primary action. Drop the gradient `btn-primary` (purple gradient + multi-stop shadow + lift on hover).
4. **Mono only where it's load-bearing.** The big `0:00.000` playhead readout earns mono. Marker time inputs, BPM input, loop bar count — those can all be Plus Jakarta Sans `tabular-nums`. The cutter currently uses mono on every numeric label, which adds noise.

---

## Synthesis — what the cutter should look like

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ▌ Simple Whoosh                              0:00.575        BPM 120  ⭐ … │  ← thin strip, 4px stripe + title + duration + BPM + shortlist + overflow
├────────────────────────────────────────────────────────────────────────────┤
│ ▼ Bar 1                                                                    │  ← ruler strip
│ ┃                                                                        ┃ │  ← waveform, ~480px tall, IN/OUT as coloured edges
│ ┃        ▁▂▃▅▇█▇▅▃▂▁                                                     ┃ │
│ ┃                                                                        ┃ │
│ ├────────────────────────────────────────────────────────────────────────┤ │
│ ╎    ▁▁▁▁▂▃▅▇█▇▅▃▂▁▁▁▁                                                  ╎ │  ← overview lane (NEW), ~36px tall, shows current zoom region
├────────────────────────────────────────────────────────────────────────────┤
│ ⟲ LOOP LENGTH  [1bar] [2] [4] [8] [16] [32] [64]    Snap [OFF] [BEAT] [BAR]│  ← loop+snap row, gold for active not purple gradient
├────────────────────────────────────────────────────────────────────────────┤
│ IN  0:00.000  [Set] [→]    OUT  0:00.575  [Set] [→]    Loop 0:00.575      │  ← markers row, flat layout, no card
├────────────────────────────────────────────────────────────────────────────┤
│ [⏹] [▶ Play] [⟲]    🔊──────●──── 100%       0:00.000     [💾 Save to lib]│  ← transport+save, single row, no card
└────────────────────────────────────────────────────────────────────────────┘
  ●  Loaded: Simple Whoosh                                Loop Cutter v1.0
```

### Layout changes

- **Drop the 3-card grid** (`markers-card` + `transport-card` + `export-card`) for a single-row layout under the waveform.
- **Drop the `gcard` glow ring**. Replace with `border-bottom: 1px solid var(--line)` between sections (matches auditioner's section dividers).
- **Add a thin track-identity strip** at the top with the source category stripe (4px), title, duration, BPM. Same stripe palette as the auditioner so the eye knows where the audio came from.
- **Add an overview lane** under the main waveform showing the zoomed region in context of the full track (Traktor pattern).
- **Resize the waveform** from 240px to ~480px (50% of a 960px viewport).

### Token alignment plan

- Adopt the auditioner's `--ink`, `--ink-muted`, `--line`, `--accent` aliases. Keep brand `--ss-*` tokens. **Delete** `--color-*` aliases — the duplicate-name layer drives drift.
- Drop the `gcard::before` border-mask gradient. Use `border: 1px solid var(--line)` and `background: var(--panel)` for chrome containers.
- **Mono = playhead only.** Use Plus Jakarta Sans `tabular-nums` for marker times, BPM input, loop bar count, status bar text. JetBrains Mono stays only on the big `0:00.000` playhead readout.
- **Gold = primary action.** Use `--ss-gold` for "Save to library", "Play" (when playing), active loop chip, active snap mode. Drop the gradient purple `btn-primary` (it competes with the auditioner's gold-primary visual hierarchy).
- **Purple = secondary / brand accent.** Keep purple for the brand-glow on titles, hover states, IN/OUT region overlay, focus rings.

### Button language merge

| Role | Auditioner pattern | Cutter today | Cutter target |
|---|---|---|---|
| Primary CTA | `tab.on` gold filled pill | `btn-primary` purple gradient + glow shadow + lift | gold-filled, no gradient, no shadow |
| Secondary | flat outlined ghost (`act`) | `btn-ghost` outlined + hover-tint | outlined ghost, same as auditioner |
| Icon-only | small ghost button | `btn-icon` with active-state gradient fill | flat outlined; active = gold-filled |
| Segmented (snap modes) | not used | `seg button.active` purple gradient | gold for active, flat for inactive |
| Loop length chip | not used | gradient purple when active | gold-filled when active, outlined when inactive |

### Component reuse from auditioner

- **Categorical 4px stripe** on the track-identity strip: tells you the source library (transitions = cyan, music = gold, etc).
- **Overflow `…` menu** for the cutter chrome: collapse "Copy Claude command", "Save loop (sanity)", "Load new file" into a trailing overflow menu in the title strip. Saves topbar real estate.
- **Type ramp** identical to auditioner: title 14/600, sub 12/400, tabular fields 12/500. Override only the big `0:00.000` playhead (26px mono).
- **Section divider pattern**: 1px hairline `var(--line)` between sections. No card borders. No glow rings.

### Density

- Title strip: 48px (matches auditioner header inner-content density)
- Ruler: 28px (unchanged)
- Waveform: ~480px (currently 240) — the single biggest visual win
- Overview lane: 36px (NEW)
- Loop+snap row: 48px
- Markers row: 56px (matches auditioner row height)
- Transport row: 64px (slightly taller — playhead readout is 26px)
- Status footer: 32px (unchanged)

---

## What we're keeping (don't strip these)

The cutter has earned visual richness in three places. The redesign keeps them:

1. **Marker chips with coloured dots** (●IN green, ●OUT orange) — these are great, they read instantly. Keep.
2. **Anchor / Beat lock pill** ("Locked · 1 bar = 0:02.000") — earned UX affordance for a DJ player. Keep.
3. **Big mono playhead readout** `0:00.000` — earned by being the workspace, not the library. Keep.

These three live alongside flat chrome, not inside glow cards.

---

## Stitch handover prompt seed

Suggested opening for the Stitch session:

> Redesign the Loop Cutter so it reads as the same product as the redesigned SFX + Music Auditioner. Current implementation at `claude-remotion-flow/tools/loop-cutter/index.html`. The auditioner shipped a redesign 2026-05-01 (see `scripts/sfx/auditioner/MOODBOARD-stitch-redesign.md`) and is the brand baseline. The cutter today wraps every panel in a bordered glow ring (`.gcard`), uses gradient purple primary buttons, and overuses JetBrains Mono on every numeric label. Reference patterns: **Traktor Pro deck** (player-as-editor; loop chips, BPM input, anchor lock — already in the cutter) and **Apple Logic Pro Sample Editor** (chrome restraint; waveform fills the canvas; transport is a thin strip; no card borders). Drop the `.gcard` glow ring entirely. Resize the waveform from 240px to ~480px. Match button language to the auditioner (gold for primary, flat outlined for secondary). Keep mono only on the big `0:00.000` playhead readout. See full spec: `MOODBOARD-stitch-redesign.md`.

---

*Draft 2026-05-01 — extends the auditioner Stitch redesign session shipped earlier today (commits 0f38a8a → 0f33a4f).*
