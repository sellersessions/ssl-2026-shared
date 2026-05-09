# Section 04 — Stitch screenshot → `design.md` vs. our existing brand profiles

**Status:** Banked — analysis only, no implementation. Awaiting test-pass before adoption.
**Created:** 2026-04-11
**Source:** TikTok video `7623486895430831382` (@adrien.ninet) + comparison against `Claude-UI-Workflow/brands/sellersessions.md`
**Part of:** Design System Unification — informs **Plan Step 1** (canonical brand source)
**Question the operator asked:** *"Is Stitch's screenshot → design.md sufficient as our design system extraction? Our existing extraction seemed to go around in a loop."*

---

## What Adrien's reel shows

```
Screenshot or landing page → drop into Stitch
  → "generate a design system based on the reference image attached"
  → click Design System → Design.md → copy outputs
  → single portable .md file you paste into any LLM as brand context
```

One screenshot in. ~30 seconds. One portable file out.

## What we currently have (`brands/sellersessions.md`, 131 lines)

A hand-authored brand profile covering **eight layers**, only the first of which is visible-on-screen and machine-extractable:

| # | Layer | What's in it (SS example) | Could Stitch extract from a screenshot? |
|---|---|---|---|
| 1 | **Tokens** (colours, type, spacing) | 10 colour roles, 3 font roles, Google Fonts URL | **Yes** — exactly what Stitch's design.md captures |
| 2 | **Component inventory** (20 components) | Badge, Button, Card, CardStack, FAQ, Hero, etc. with purpose | **Partial** — only what's visible in the screenshot |
| 3 | **Visual REFINE techniques** (14 applied) | Banding, glow cards, atmospheric orbs, glass overlays | **Partial** — surface effects yes, naming/intent no |
| 4 | **Image constraints** | "Dark only, no stock, append 'No text', glassmorphic > flat" | **No** — operational lessons from past mistakes |
| 5 | **Animation prefs** | Durations, easing, GPU rules, prefers-reduced-motion | **No** — invisible in static screenshots |
| 6 | **Performance budget** | LCP < 2.5s, CLS < 0.1, JS < 200KB, font-display:swap | **No** |
| 7 | **Anti-patterns** | "Never light backgrounds, never deploy to live IDs without approval" | **No** — these are scars, not style |
| 8 | **Deploy rules** | Tailwind `important: '#root'`, WP Rocket defer, type="module" | **No** — environment-specific |

## Diagnosis: why our current extraction loops

If a single workflow tries to capture *both* the visual layer *and* the operational layer in one pass, it'll loop forever — because half the data isn't in the source material. The visual layer is machine-extractable in one shot; the operational layer is human knowledge that has to be authored from scars and decisions.

**Stitch's `design.md` covers ~20–30% of `sellersessions.md`** — the visible style layer only. That's not a flaw, that's its scope.

## Recommendation (HYBRID — split, don't replace)

```
brands/sellersessions/
├─ design.md      ← Stitch-generated (machine, refreshable, ~30 sec)
│                   Tokens, type, spacing, surface components.
│                   THIS is the file pasted into any LLM as "brand context".
│
└─ profile.md     ← Hand-authored (human, durable, append-only)
                    REFINE techniques, image rules, anti-patterns,
                    deploy rules, perf budget, animation prefs.
                    THIS is the file *you* read before making decisions.
```

### Why this works

1. **Stitch kills the slowest 30% of brand profile authoring** (visible style extraction). ~30 sec vs ~1 hr.
2. **The loop disappears** — each file has clear ownership (machine for visible, human for operational).
3. **`design.md` becomes refreshable.** When SS rebrands, re-screenshot, re-run Stitch, get a fresh tokens file. No manual rewrite.
4. **`profile.md` is append-only.** New lessons get added; old scars never get auto-overwritten by AI extraction.
5. **Plugs into the `awesome-design-md` library** (Section 01). You can borrow `stripe/design.md` from the 58-system reference repo and layer your own `profile.md` operational rules on top — same hybrid pattern.

### What this maps to in the unification plan

| Plan step | How this helps |
|---|---|
| **Step 1: Canonical brand source** | This is the spec for Step 1. Split single file into `design.md` (machine) + `profile.md` (human). Kills gap #2 (token duplication) cleanly. |
| Step 2: Logo Brain | `design.md` becomes the brand context input to logo generation prompts |
| Step 5: REFINE guard rails | `profile.md` is the source of truth for what REFINE checks against |

## Honest answer to the question

> **Is Stitch's screenshot → design.md sufficient to replace our extraction?**

**No alone, yes as half of a hybrid.** Stitch replaces the visible-style extraction half (the slowest, most repetitive part). The operational half stays human-authored. Together they replace the single bespoke file we have today, and they kill the "loop" by giving each layer a clean ownership model.

## Test-pass plan (before adoption)

Per the operator's rule: *"compile ideas now, test before installing"*. Tests to run before this becomes Plan Step 1:

1. **Screenshot test** — drop the live SS landing page into Stitch, generate a `design.md`, diff it against the tokens block of `brands/sellersessions.md`. How much overlap? What does Stitch invent or miss?
2. **LLM context test** — paste the Stitch-generated `design.md` into a fresh Claude conversation, ask for an SS-branded landing page mockup. Compare visual fidelity vs the same prompt with our full `sellersessions.md` pasted in. Does the slimmer file produce on-brand output, or does it lose the glow/banding/glass character?
3. **Round-trip test** — generate `design.md` from a screenshot, then re-generate from a screenshot of the output. Does it converge or drift? (This catches the "looping" failure mode.)
4. **Operational layer test** — try generating something that requires `profile.md`-only knowledge (e.g. "build a Hero with the right perf budget"). Confirm `design.md` alone is insufficient → validates the hybrid split.

**Pass criteria for adoption:** Stitch `design.md` covers ≥80% of the visible-style fields in our existing `sellersessions.md` *without inventing wrong values*, AND the LLM context test produces visually on-brand output.

---

### Short version

> **Stitch's screenshot → design.md captures visible style only — about 30% of what our hand-authored brand profiles contain. The other 70% is operational scar tissue that no screenshot can infer (deploy rules, perf budgets, anti-patterns). Recommendation: split `brands/<slug>.md` into machine-refreshable `design.md` + human-authored `profile.md`. Kills the "loop" by giving each layer clean ownership. Test-pass required before adoption (4 tests defined above).**
