# Process-Viz Examples Catalogue

> Source: 14 HTML skeletons generated in Claude Desktop, 5 May 2026. Same 10-stage Stitch pipeline content (Intake → URL → Screenshot → Tokens → Lock → Brief → Stitch → Refine → Retro → Reset) rendered through different visual idioms, for like-for-like comparison.
>
> All files: pure SVG + CSS + vanilla JS. No external libraries. All scoped CSS prefixes (s1, s2, kb, ng, etc). All use `var(--font-sans / --font-mono / --font-serif)` — host page must define.

## Inventory

| # | File | Style family | Stages | Theme | Best fit |
|---|------|--------------|--------|-------|----------|
| 1 | `style_1_radiating_hub_obsidian.html` | Hub + 5 satellites | 6 | Dark + violet vignette | README sub-section, "what connects to what" |
| 2 | `style_2_horizontal_pipeline_neon.html` | Linear neon pipeline | 4 | Dark grid + neon | Short pipelines, slide for 4-step flows |
| 3 | `style_3_branching_tree_editorial.html` | Branching tree | 7 | Light cream + serif | Documentation hierarchy. The only LIGHT one |
| 4 | `style_card_stack_tarot.html` | Card stack (flip reveal) | 10 | Dark + gold | Slide format. Dramatic reveal for talk opener |
| 5 | `style_circuit_schematic.html` | PCB traces + components | 10 | Dark green PCB | Technical audience. "How it's wired" |
| 6 | `style_kanban_swimlane.html` | Cards moving across columns | 10 | Light cream | Project status. "Watch the work move" |
| 7 | `style_nodegraph_n8n.html` | n8n nodes + cables + packets | 10 | Dark grey grid | Automation, ExtractFlow, Databrill visuals |
| 8 | `style_pinball_path_tracer.html` | Ball + bumpers + glowing trail | 10 | Dark blue + gold | High-energy slide opener. Too playful for README |
| 9 | `style_radial_mindmap.html` | Hub + 10 radial branches | 10 | Dark radial vignette | Overview hero, "everything connects" |
| 10 | `style_sankey_flow.html` | Width-encoded ribbons | 10 | Dark + pink | Volume/distribution flows. Specialised |
| 11 | `style_timeline_gantt.html` | Gantt bars + playhead | 10 | Light cream | Project schedule. Onboarding. NOT a process flow |
| 12 | `ten_stage_production_pipeline_hero.html` | Phase-grouped sequential w/ captions | 10 | Dark + 4-phase bands | **README hero candidate**. Most narratively rich |
| 13 | `wizard_flow_ten_stages.html` | Frame-by-frame icon + paragraph | 10 | Dark + icons | **Slide builder pattern**. 1-slide-per-stage |
| 14 | `wizard_dynamic_per_stage_animations.html` | Wizard w/ bespoke animation per stage | 10 | Dark + 10 unique mechanisms | **Demo showpiece**. Saturday talk "watch each stage" |

## Design system observations

**Shared accent palette** (already coherent across 12 of 14 dark examples):
- `#9D4EDD` violet — Setup phase
- `#5DCAA5` teal — Capture phase
- `#EF9F27` amber — Build phase
- `#FF6BB4` pink — Quality phase
- `#378ADD` blue — accent, secondary
- `#D85A30` orange — accent

**Dark base options:**
- `#030C1B → #0A1228` linear gradient (used in 12, 13, 14)
- `#0F0820 → #1A0B2E` (used in 2, 10)
- `#1A1A24` flat (7)
- `#0F1F1A` PCB green (5)
- `#1A1228 → #0A081A` gold-on-dark (4)

Current Remotion Flow README uses `#0c0a14`. Closest match in the set is the `#030C1B → #0A1228` gradient (12, 13, 14). Recommend promoting that as the dark-base standard.

**Light/editorial sub-system** (3, 6, 11):
- `#FAF8F4 / #FAFAF7 / #F4F2ED` cream
- `#3D3527` charcoal
- `#C99554` accent
- Serif typography (3 only)

**Phase semantics** (used in 4, 6, 11, 12, 13, 14):
- 4 phases × stages: SETUP (1-2) · CAPTURE (3-5) · BUILD (6-7) · QUALITY (8-10)
- Phases mapped to palette colours above
- This becomes the spine of the design system

**Required font vars** (host stylesheet must define before any of these render correctly):
```css
:root {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', SF Mono, monospace;
  --font-serif: 'Source Serif Pro', Georgia, serif;
}
```

## Use-where-how matrix

```
USE CASE                            │ TOP PICK             │ BACKUP
────────────────────────────────────┼──────────────────────┼─────────────────
README hero (any repo)              │ 12 hero composite    │ 9 radial mindmap
README section: pipeline detail     │ 7 nodegraph          │ 5 circuit
README section: phase overview      │ 12 hero composite    │ 14 dynamic wizard
README section: hierarchy           │ 3 editorial tree     │ 1 hub
Saturday talk: opener               │ 14 dynamic wizard    │ 8 pinball
Saturday talk: 1-stage-per-slide    │ 13 wizard flow       │ 4 card stack
Saturday talk: workflow demo        │ 6 kanban             │ 7 nodegraph
Saturday talk: dramatic moment      │ 4 card stack         │ 8 pinball
Databrill / ExtractFlow visuals     │ 7 nodegraph          │ 5 circuit
Project schedule / timeline         │ 11 gantt             │ —
Volume/distribution viz             │ 10 sankey            │ —
GIF for inline README embed         │ 13 wizard flow       │ 12 hero composite
Static PNG for slide background     │ 9 radial             │ 12 hero composite
Iframe live demo on stage           │ 14 dynamic wizard    │ 13 wizard flow
```

## Top 5 to lock as the kit

1. **#14 wizard_dynamic_per_stage_animations** — talk showpiece + per-stage animation library
2. **#13 wizard_flow_ten_stages** — slide pattern, scales infinitely
3. **#12 ten_stage_production_pipeline_hero** — README hero across all 3 repos
4. **#7 style_nodegraph_n8n** — automation/extraction story
5. **#3 style_3_branching_tree_editorial** — light/documentation variant

The other 9 stay in the library. Deploy when domain-specific (Sankey for volume, Pinball for energy openers, Gantt for schedule, Kanban for task flow, etc).

## Open decisions

- [ ] Lock font vars (Inter / JetBrains Mono / Source Serif Pro?) and define in host stylesheet.
- [ ] Reconcile dark base with current Remotion Flow README (`#0c0a14` vs `#030C1B → #0A1228` gradient).
- [ ] Decide if the light/editorial sub-system is in or out. Leans IN for documentation pages, OUT for talk slides.
- [ ] Phase 4-colour mapping locked or open? Currently consistent across rich examples; recommend lock.
- [ ] Content swap mechanism — single JSON of stage data per repo, fed into the chosen template? Or hand-edit per use?
- [ ] Hosting model for live demos: Mac Studio static server, GitHub Pages, or inline iframe in slide deck.
