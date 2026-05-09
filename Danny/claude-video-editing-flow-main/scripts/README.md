# Claude Video Editing Flow — scripts

Terminal helpers for the candidate / lock-in / verdict interaction points. All output is coloured ANSI so it renders inline in Claude Code's terminal (and in any ANSI-capable terminal).

## Setup

```bash
python3 -m pip install -r requirements.txt
```

One dependency: [`rich`](https://github.com/Textualize/rich) ≥ 13.

## Usage

```bash
# Step 3 — show candidates for picking
python3 scripts/picker.py  <clip>/edit/candidates.json

# Step 5 — show locked-in picks before rendering
python3 scripts/lockin.py  <clip>/edit/edl.json

# Step 9 — show verdict options after watching preview
python3 scripts/verdict.py [optional preview path]
```

## Colour palette (semantic, theme-respecting)

| Element | Colour | Meaning |
|---|---|---|
| ★★★ tier | green | top picks |
| ★★ tier | yellow | supporting |
| ⚠ flag | yellow | needs attention |
| combo letter | bold magenta | selectable key |
| total runtime | green ✓ / red ✗ | target check |
| step header | bold cyan | section marker |
| verdict lanes | a=green · b=cyan · c=yellow · d=red | affordance by risk |

Uses named ANSI colours (not truecolor hex) so each terminal renders them per its own theme.

## Plain-text fallback

```bash
NO_COLOR=1 python3 scripts/picker.py <clip>/edit/candidates.json
```

`rich` respects `NO_COLOR` automatically and drops to plain text.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | OK |
| 2 | File not found / bad args |
| 3 | Malformed JSON |
