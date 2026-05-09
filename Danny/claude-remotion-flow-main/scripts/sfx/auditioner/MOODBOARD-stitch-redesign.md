# SFX + Music Auditioner — UI redesign moodboard

> Brief for the Stitch redesign session. The current auditioner is functional but reads as a dense database table. This doc extracts the row patterns from **Apple Music / iTunes** (consumer playback ergonomics) and **Native Instruments Traktor Pro** (DJ row density + at-a-glance metadata) and proposes what to merge for the SS auditioner.

## Goal

A single-row pattern that holds:

- **Identity** of the track (title, source-context badge)
- **Playback** affordance (one click to audition, scrubbable)
- **Action lane** (shortlist, send-to-cutter, copy-to-batch)
- **Quick metadata** (duration, BPM if known, category tint)

without the eye having to traverse the full page width.

Today the row is `[idx] [select] [title] [—————— gap ——————] [audio] [duration] [star] [copy]`. The gap is the dominant visual feature.

---

## Reference 1 — Apple Music / iTunes track row

> Reference era: macOS Catalina+ Music app, list view. The track row Apple settled on after 20 years of refinement.

| Slot | Behaviour |
|---|---|
| **Artwork (40px square)** | Thumbnail; doubles as play-button on hover (overlay triangle) |
| **Title + Artist (stacked, 1fr)** | Title 14px regular, artist 12px secondary. Both ellipsis. |
| **Album (1fr, optional)** | Secondary text, links to album view |
| **Duration (right-aligned, 60px)** | Tabular nums, 12px secondary |
| **Trailing actions (revealed on row hover)** | `…` overflow menu, ⓘ info — invisible until hover so the row reads clean |
| **Click anywhere on row** | Focus + queue (not play); play is via the artwork hover-overlay |
| **Double-click row** | Play immediately |
| **Right-click row** | Full context menu — most actions live here, not in always-visible buttons |

**Lessons:**
1. **Action visibility is hover-gated.** Every row in the screenshot showed all 4 actions (✂︎ ⭐ ☐ 📋) glued visible — that's the source of the "what does this lever do" confusion. Apple shows them on hover only.
2. **One action is *the* primary affordance.** For Apple it's the play overlay on artwork. For us it's audition (the audio scrubber).
3. **Tabular nums on duration.** Already done at line 70 — keep.
4. **Right-click menu is the relief valve.** Anything advanced (export, copy command, batch promote) goes there, not in a button.

---

## Reference 2 — Native Instruments Traktor Pro browser

> Reference era: Traktor Pro 3+. Built for DJs who scan a 5,000-track library at 120 BPM under stage lights.

| Slot | Behaviour |
|---|---|
| **Color stripe (4px left edge)** | User-assigned tag. Reads at a glance even when you're 60° off-screen. |
| **Track icon (BPM + key sigil)** | Tiny 28×28 square. Shows compatibility at a glance. |
| **Title (bold 13px)** + Artist (light 11px under) | Stacked. |
| **BPM (right-aligned, large)** | The DJ's primary filter. Bold tabular nums, 14px. Stays visible always. |
| **Key (right of BPM)** | Camelot wheel notation if present. |
| **Length** | 12px tabular. |
| **Genre / tag** | Pill-shaped, low contrast. |
| **No play button on the row.** | Audition is via the dedicated preview deck, triggered by clicking the row OR pressing space. |

**Lessons:**
1. **Categorical color stripe at the row edge** is one of the cheapest ways to add structure without clutter. We could tint the left border per `category` (transitions/stingers/risers/impacts/ambience/music — 6 hues).
2. **One audition surface, not 89.** Traktor doesn't put a player widget on every row — there's one preview deck, click row → loads. We could collapse the per-row `<audio>` into a single sticky preview bar at the top or bottom, with a play-toggle on the row itself.
3. **BPM is the headline metadata for music**, not a "should we?" — bake the column in even if 80% of rows are null.

---

## Synthesis — what the SS auditioner row should look like

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ▌  Title that ellipsis                          ⏯  3:24   122  ⭐  …        │
│    artist · 3 tags                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
  ▲                                              ▲   ▲     ▲   ▲   ▲
  │                                              │   │     │   │   └ overflow menu (✂︎ open in cutter, copy command, batch ops)
  │                                              │   │     │   └── shortlist ⭐ (visible always — it's a bookmark)
  │                                              │   │     └────── BPM (tabular, dim if null)
  │                                              │   └──────────── duration (tabular)
  │                                              └──────────────── play/pause toggle (one row at a time, drives the global preview bar)
  └────────────────────────────────────────────────────────────── 4px categorical stripe (transitions=cyan, stingers=amber, risers=magenta, impacts=red, ambience=slate, music=gold)
```

### Column template

`grid-template-columns: 4px 26px 1fr 32px 56px 48px 28px 28px;`

- `4px` — categorical stripe (no gap after)
- `26px` — selection checkbox
- `1fr` — title/meta cell
- `32px` — play/pause toggle (drives global preview bar)
- `56px` — duration (tabular)
- `48px` — BPM (tabular, `--ink-muted` when null)
- `28px` — shortlist star (always visible)
- `28px` — overflow menu trigger (`…`) — opens dropdown with: Open in Loop Cutter, Add to copy batch, Copy loop_bed.py command

### Global preview bar (replaces 89× per-row `<audio>`)

Sticky bar at the bottom of the viewport. Shows current track waveform, transport, scrubber, IN/OUT preview, "send to cutter" button. Memory: one row plays at a time anyway.

Saves ~32px × 89 rows of vertical paint and removes the right-edge audio-player wall that's currently dominating the row.

### Hover-gated actions

Star + overflow `…` stay visible always (per Apple — bookmarks need to be discoverable). The scissor button moves *into* the overflow menu (resolves Loom F5/F6 confusion).

### Type ramp

- Title: 14px / 600 / `--ink`
- Sub (artist · tags): 12px / 400 / `--ink-muted`
- Tabular fields (duration, BPM): 12px / 500 / tabular-nums

### Density

Row height: 56px (Traktor is 48, Apple Music is 56–60). Two-line title/artist stack fits at 56.

### Categorical stripe palette

- transitions = `#22D3EE` (cyan-400)
- stingers = `#F59E0B` (amber-500)
- risers = `#EC4899` (pink-500)
- impacts = `#EF4444` (red-500)
- ambience = `#94A3B8` (slate-400)
- music = `#FBBF24` (gold — already `--ss-gold`)

Subcategory shows as a 10px pill in the meta line, low contrast.

---

## Stitch handover prompt seed

Suggested opening for the Stitch session:

> Redesign the SFX + Music Auditioner list view. Current implementation at `claude-remotion-flow/scripts/sfx/auditioner/index.html` is a dense table where every row has a play widget on the right edge, leaving a wide visual gap. Reference patterns: **Apple Music list row** (hover-gated actions, ellipsis title, tabular duration) and **Traktor Pro browser** (categorical left-edge color stripe, BPM-first metadata, single audition deck instead of per-row players). Move the audio player to a single global preview bar at the bottom of the viewport. Keep the existing token system (`--ss-deep`, `--ss-purple-light`, `--ss-gold`, Plus Jakarta Sans). See full spec: `MOODBOARD-stitch-redesign.md`.

---

*Draft 2026-05-01 from Loom F9 — extends F1-F11 review session.*
