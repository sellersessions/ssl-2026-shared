# UI mockup v1 — loop-cutter aligned

Static HTML mockup of a hypothetical visual UI for the Claude Video Editing Flow. Built to match the design system used in `claude-remotion-flow/tools/loop-cutter/` and the SFX library auditioner. No backend, no JS behaviour. Open `index.html` in a browser.

## Why this exists

The README + walkthrough video tells the story in words. This mockup gives a newcomer a single-screen "oh, that's what it does" moment without reading the README. Danny commissioned it to steer what a real UI surface (TUI launcher, Netlify landing page, or README hero image) should look like.

## Design system source

Tokens copied directly from `claude-remotion-flow/tools/loop-cutter/styles.css`:

- Palette: `--ss-deep` `#0C0322`, `--ss-purple-light` `#753EF7`, `--ss-gold` `#FBBF24`, `--ss-emerald`, `--ss-cyan`, `--ss-pink`, `--ss-orange`
- Typography: Plus Jakarta Sans (body) + JetBrains Mono (numerics, timestamps, paths)
- Card primitive: `.gcard` flat panel with `--line` border + `--radius-xl`
- Step progress pills, segmented controls, beat pills, drop zone, status dots all ported

## Layout

5 panes mapping directly to the pipeline stages, top to bottom:

1. **Drop** — file zone with recent-clip chips
2. **Presets** — Format / Target / Grade / Mode segmented controls
3. **Candidates** — 6-row table with tier stars, beat pills, picked highlighting, reply input, budget meter
4. **Pre-render gates** — 3 status rows (Gate 1 boundary, Gate 2 close, Budget)
5. **Render** — progress bar with stages + output card + 4 verdict lanes

Step progress at the top mirrors the live pipeline in real time.

## Worked example baked in

The mockup uses pod-test-claude as its example: 17 candidates scored, 4 picked (HOOK / INSIGHT / DECISION / CLOSE), 38.8s budget under 54-66s window, Gate 1 caught the `voices,` bleed-in and shifted start 13.58 → 14.16, Gate 2 lands on `It can write them.`, render at 72%.

## Files

- `index.html` — self-contained mockup, no external assets except Google Fonts
- `preview-full.png` — 1280-wide screenshot for visual reference

## Three forms this could take next

| Form | What it is | Effort |
|---|---|---|
| README hero image | Render this as a static PNG / animated SVG, drop into the README walkthrough placeholder | Same day |
| Real TUI launcher | `vef` command opens this layout live with `rich`. Existing picker.py / lockin.py / verdict.py become panels. | Bigger lift, aligns with terminal-first principle |
| Web landing page | Static `index.html` on Netlify, faceless GitHub gets a face | Marketing surface, useful once walkthrough video lands |
