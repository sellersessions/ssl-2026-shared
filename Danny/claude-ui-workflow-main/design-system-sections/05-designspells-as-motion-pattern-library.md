# Section 05 — DesignSpells as a motion pattern library for Claude Code

**Status:** Banked — Perplexity-sourced analysis + Claude Code usage spec, awaiting test-pass before implementation
**Created:** 2026-04-11
**Source:** [designspells.com/?tag=motion](https://www.designspells.com/?tag=motion) — surfaced via Adrien Ninet's AI tools stack carousel (`7569185812751863062`)
**Analysis by:** the operator via Perplexity
**Part of:** Design System Unification — directly informs **Plan Gap #6** (no motion / video design rules) + **Plan Step 5** (REFINE guard rails)

---

## TL;DR

Use **DesignSpells** as a **motion pattern library for prompting Claude Code**, not as a full design system. Pick 3–5 "spells", convert each into a reusable rule + component brief, then have Claude Code implement them with restrained CSS/JS motion.

> **Why this matters for our plan:** Gap #6 in the unification plan said "nothing in `design-db/` covers Remotion, social aspect ratios, duration budgets". DesignSpells is the missing seed corpus for `design-db/motion.csv` — but framed as **interaction recipes**, not animation theory.

---

## Best use

- Treat DesignSpells as a **reference bank of interaction ideas** — animated number changes, smooth sidebars, magnetic drop targets, rubber-banding sliders, playful navigation behaviour.
- For each example, capture: **where it appears, what triggers it, how it moves, how long it lasts, what fallback happens if motion is reduced.**
- Use it mainly for **micro-interactions**, because the site is organised around small "feel like magic" details rather than full page systems.

## The 5 spells worth pulling first

| Spell | Source | Claude Code use case |
|---|---|---|
| **Animated numbers** | Dub.co | KPI cards, dashboards, MRR widgets, live counters |
| **Smooth sidebars** | Typefully | Slide-over settings, filters, inspector panels |
| **Magnetic drop targets** | Dia | Drag-and-drop builders, sortable tabs, kanban lanes |
| **Rubber-banding slider** | Opal | Time controls, budget sliders, range inputs |
| **Curved navigation tabs** | Goat | Mobile nav, segmented controls, app shell navigation |

## How to prompt it

Give Claude Code a **behaviour spec**, not "make it cool". The structure that works:

```
Component:           Analytics KPI card
Reference behaviour: Animate numbers when values change, inspired by Dub.co
Motion rule:         Subtle easing, 400–800ms, no bounce unless celebratory
Constraints:         Respect prefers-reduced-motion, no layout shift, mobile-safe
Tech:                CSS transitions first; minimal JS only where needed
```

## Prompt template (verbatim, ready to reuse)

> Build a KPI card component in React/Tailwind.
> Add a Dub.co-style number change animation when the value updates.
> Use the golden easing curve `cubic-bezier(0.16, 1, 0.3, 1)` for entry and interactive transitions.
> Do not cause layout shift; scroll reveals should animate opacity or clip-path only.
> Only add hover states to clickable elements, and pair hover with active/focus-visible states.
> Support `prefers-reduced-motion` with a non-animated fallback.

## Implementation rules (the constants)

- **CSS-native animation first.** Use JS only for stateful behaviours: counting, drag feedback, shared layout transitions.
- **Golden easing curve:** `cubic-bezier(0.16, 1, 0.3, 1)` for most entries and hover states.
- **Timing budgets:**
  - ~180ms for interactive states (hover, active)
  - ~300–800ms for richer motion (entry, panel transitions, number changes)
- **Anti-patterns to enforce:**
  - No hover on non-clickable elements
  - No `transition: all`
  - No scroll animations that visually move layout out of place
  - No bounce unless celebratory

## The "Motion Recipes" folder pattern (the operator's recommendation)

Build a **Motion Recipes** folder in the repo:

```
design-db/motion-recipes/
├─ metric-change.md
├─ sidebar-slide.md
├─ magnetic-dropzone.md
├─ elastic-slider.md
└─ curved-nav-tabs.md
```

**Each recipe file contains:**
- **Purpose** — what this motion is for
- **Trigger** — what fires it
- **Motion spec** — duration, easing, transform/opacity rules
- **Accessibility fallback** — `prefers-reduced-motion` behaviour
- **Claude Code prompt snippet** — paste-ready, references the recipe by name

Reuse across Databrill, Seller Sessions, and internal tools so Claude Code has a **consistent motion vocabulary**.

## How this maps to the unification plan

| Plan item | How DesignSpells feeds it |
|---|---|
| **Gap #6: No motion / video design rules** | This *is* the missing source. `motion-recipes/` becomes the operational answer to `design-db/motion.csv`. |
| **Step 5: REFINE guard rails** | Motion recipes become enforceable rules that REFINE checks against ("does this page respect prefers-reduced-motion?", "is anything using `transition: all`?") |
| **Brand profile `profile.md`** (per Section 04) | Motion rules belong in `profile.md`, not `design.md` — they're operational, not visible style |
| **Step 1: Canonical brand source** | SS already has 8 animation rules in `brands/sellersessions.md` lines 110–117 — these become the SS-specific override on top of the shared motion-recipes baseline |

## Format question for later

**CSV vs folder of `.md` recipes?** The plan originally said `design-db/motion.csv`, but the recipe-per-file pattern the operator proposed is richer (carries the prompt snippet inline). Decide at test-pass:
- **CSV:** queryable, terse, fits the existing `design-db/` shape
- **Folder of .md:** richer per-recipe, prompt snippets stay readable, harder to query
- **Hybrid:** `motion.csv` for the index (name, trigger, duration, easing), `motion-recipes/` for the prompt-ready expansions

## Test-pass plan (before adoption)

Per the operator's rule (compile now, test before installing):

1. **Browse test** — open DesignSpells and pull the 5 spells into rough notes. Confirm they're as named (not paywalled, not video-only, not stale).
2. **Recipe authoring test** — write ONE recipe (`metric-change.md`) end-to-end as the template. See if the file size and shape feel right.
3. **Prompt test** — paste the recipe into a fresh Claude conversation, ask it to build a KPI card. Compare to building one without the recipe. Does the recipe meaningfully constrain output?
4. **REFINE integration test** — write one REFINE check that consumes a recipe (e.g. "verify all KPI cards on page X use the metric-change motion spec"). See if the recipe format is machine-readable enough.

**Pass criteria:** A recipe meaningfully changes Claude's output (test 3) AND can be consumed by a REFINE check (test 4). If either fails, the format needs rework before scaling to all 5 spells.

---

### Short version

> **DesignSpells = the missing seed corpus for plan gap #6 (motion rules). Use as a reference bank of micro-interactions, not a full design system. Convert 5 spells into per-file motion recipes (`design-db/motion-recipes/`), each with purpose / trigger / spec / a11y fallback / Claude Code prompt snippet. Recipes belong in `profile.md` ownership (operational), not `design.md` (visible style). Test-pass required before scaling beyond the first recipe — and the CSV vs folder format question gets answered then.**
