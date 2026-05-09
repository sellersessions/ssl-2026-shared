# README Design System

The patterns this repo's README locks in. Use this as a builder/checklist when minting the README for any sibling repo (`claude-video-editing-flow`, `claude-ui-workflow`, future ClaudeFlow sub-repos).

Goal: every public repo lands with the same visual identity, the same scan-path, and the same depth-on-demand structure.

## 1. Hero stack (top of the file)

Order, top to bottom:

1. **Logo SVG pair** (light + dark, `<picture>` source switch). Gradient text mark, never raster.
2. **One-line tagline** (`**bold**` x 2 max). What this repo *is*, not what it *does*.
3. **TL;DR callout** as `> [!NOTE]`. 2 sentences max. The 7-second pitch.
4. **Badge row** (4 badges, `for-the-badge` style):
   - Watch demo (anchor link to See It In Action section)
   - Quick Start (anchor link)
   - Companion repos (anchor link)
   - Status / version
5. **Hero video block** (Loom embeds or GIF teasers, top of fold).
6. **`> [!TIP]`** line: where the recipe lives + which video to watch first if time-poor.

## 2. The "How the parts connect" pattern

Every system explainer leads with a hero diagram, *then* offers granular detail collapsed.

- **Hero**: animated SVG (SMIL, ~10KB, vector). Hub + cluster anchors + spokes. Pulses, drift-animated stroke-dashoffset, no JS.
- **Granular**: Mermaid `flowchart LR` inside `<details>`. Every named file, every arrow.
- **Caption** (`<sub>` tag): one paragraph explaining what to look for. Read-once-and-move-on.

Why two diagrams: the SVG sells the architecture, the Mermaid documents it. Different audiences, same section.

### SVG anatomy (use as template)

- Canvas: `viewBox="0 0 1200 700"`, `preserveAspectRatio="xMidYMid meet"`.
- 6 cluster anchors at radius 240 from centre (600, 350). Positions:
  - North: (600, 110)
  - NE: (808, 230)
  - SE: (808, 470)
  - South: (600, 590)
  - SW: (392, 470)
  - NW: (392, 230)
- 2-4 satellites per cluster at radius ~70 from cluster anchor.
- Centre hub: nested circles, biggest, brightest, with an `<animate attributeName="r">` on both circles.
- Filters: `glow` (Gaussian blur 3) for satellites + spokes, `hub-glow` (blur 6) for hubs and centre.
- Background: `radialGradient` vignette `#1a1625` → `#0c0a14` 0%/100% opacity.
- Spoke animation: `stroke-dashoffset` from 0 to -30 over 3-4s, `repeatCount="indefinite"`, vary the `dur` per spoke so they feel organic.
- Cluster colour map (lock these to brand):
  - Cyan `#22d3ee` → primary input / authoring
  - Purple `#753EF7` → code / engine
  - Green `#00B894` → output / shipped
  - Yellow `#FBBF24` → audio / time-domain
  - Light-purple `#c4b5fd` → voice / TTS
- Labels: cluster names below the hub (`font-size: 13`), satellite names tight against the satellite (`font-size: 10`, fill `#8b949e`).

## 3. Section structure (canonical order)

1. Hero stack (above)
2. **The Workflow** (Mermaid flowchart top-to-bottom — high level)
3. **How the parts connect** (SVG hero + Mermaid `<details>` granular)
4. **The Treatment System** (or repo-specific spec mechanism) inside `<details>`
5. **Quick Start (once installed)** — single command path
6. **Comparison table** (vs the obvious alternative — After Effects, Final Cut, etc.)
7. **See It In Action** (Loom embeds or GIF reel)
8. **Build Timeline** (commits + dates as a timeline)
9. **Companion repos** (cross-link to the other public ClaudeFlow repos)
10. **Architecture / Code reference** (`<details>` blocks, one per major sub-system)
11. **Credits / License**

## 4. Callout vocabulary

GitHub-flavored callouts only. Don't invent your own bordered HTML blocks.

- `> [!NOTE]` — TL;DR, factual context.
- `> [!TIP]` — performance/efficiency hint, optional read.
- `> [!IMPORTANT]` — must-not-miss rules (e.g. "never reuse a music bed", "MP3/WAV gitignored").
- `> [!WARNING]` — destructive or breaking gotcha.
- `> [!CAUTION]` — security or data-loss risk.

Use sparingly. Three callouts per README is a soft ceiling.

## 5. The 4MAT cycle

Every long-form section (treatment, architecture, workflow) follows WHY → WHAT → HOW → WHAT IF.

- **WHY**: who this is for + the pain it removes (1 paragraph).
- **WHAT**: the parts named (the hero diagram).
- **HOW**: commands, code blocks, file paths.
- **WHAT IF**: edge cases, known gotchas, future hooks (`<details>`).

## 6. `<details>` discipline

Default expanded for: TL;DR, Quick Start, Comparison table.
Default collapsed for: every other depth dive.

Summary text should be a complete sentence, not a label. `<summary><b>The Treatment System (3 Layers)</b>: how intent becomes buildable code</summary>` ✓ . `<summary>Treatment</summary>` ✗ .

## 7. Build Timeline block

Pulled from `git log --reverse`, formatted as a vertical list with **bold dates** + commit message + 1-line context. This is the one section that grows linearly with the project — keep it at the bottom, never collapse it.

## 8. Companion repos cross-link

Every public repo in the ClaudeFlow constellation links to its siblings. Use a 2-3 column table:

| Repo | What it does | Link |
|------|--------------|------|
| `claude-remotion-flow` | Treatment-driven video factory | [link] |
| `claude-video-editing-flow` | Batch source-clip prep CLI | [link] |
| `claude-ui-workflow` | UI explainer rendering | [link] |
| `extract-flow` | 4-tier web extraction stack | [link] |

## 9. Forbidden

- **Em-dashes** (`—`, `–`). Use `:`, `.`, `,`, or hyphen. AI-tell + Gmail subject encoding bug.
- **Raster logos.** SVG only.
- **External image hosts** for diagrams. Always commit SVG/PNG to `assets/`.
- **`./` prefix** on internal links unless required (GitHub auto-resolves).
- **More than one h1** in the README.
- **Centred narrative paragraphs.** Centre logos + diagrams + badges. Body copy is left-aligned.

## 10. The build order (when minting a new repo's README)

1. Drop the logo SVG pair + tagline + TL;DR.
2. Decide the 6 clusters of the system. Lock the colour map.
3. Mint the SVG hero (copy `assets/system-graph.svg`, swap labels + spoke colours).
4. Write the Mermaid granular wiring (one node per real file).
5. Write the Quick Start (single command).
6. Pick the comparison-table opponent. Fill 5-7 rows.
7. Drop Loom embeds in See It In Action.
8. Build Timeline from `git log`.
9. Cross-link companion repos.
10. Sweep for em-dashes. Sweep for callout overuse. Ship.

---

*Source of truth: this repo's `README.md`. When the pattern evolves, update this doc + back-port to siblings.*
