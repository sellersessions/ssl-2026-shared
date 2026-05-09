# Section 06 — The moodboard layer + killing endless browsing

**Status:** Banked — surfaces a NEW gap (#8) in the unification plan, with proposed workflow shape
**Created:** 2026-04-11
**Source:** the operator's prompt + Perplexity analysis of [seesaw.website](https://www.seesaw.website/)
**Part of:** Design System Unification — adds **NEW Gap #8** to the plan, sits between **Inspiration capture** and **DECIDE** (a missing stage in the 8-phase process)

---

## The two problems the operator named

1. **Endless browsing.** Inspiration sites like SEESAW, Dribbble, Behance, Pinterest are designed to keep you scrolling. There's no built-in stop condition, no structured output, no way to convert an hour of browsing into something that feeds the next stage of work.
2. **No moodboard layer.** Our current pipeline goes from *inspiration capture* (Workflow C — video transcripts only) straight to *DECIDE* (Workflow D — CSV-driven brief). There's no intermediate stage where visual references get *fingerprinted* and *summarised* into a corpus that the brief can reference. Pinterest does this for the operator manually today, but it's siloed and doesn't feed downstream.

> **Diagnosis:** Inspiration capture currently handles **video URLs only**. Web inspiration (the larger, more recurring source) has no on-ramp into the workflow at all. And there's no canonical artefact between "I saw something I liked" and "here's the brief".

---

## What we already have (don't rebuild)

| Primitive | What it does | Today's gap |
|---|---|---|
| **DesignLoop Photo Brain** | Memory-layer fingerprints of visual style (colour depth, typography, whitespace, micro-details). 23 Photoshop/Illustrator effects written as prompt language. | **Fed manually via uploaded images.** No bulk-capture path. |
| **gallery-dl** (Section 02) | Pulls images from ~300 sites — Pinterest, Dribbble, Behance, ArtStation, Tumblr, etc. — without rendering pages. No CAPTCHA. | **No wrapper integrating it with Photo Brain.** |
| **ExtractFlow** (4-tier cascade) | HTTP → Playwright → CDP → SeleniumBase. Hits any URL incl. live SPAs. | **Currently used for content extraction only**, not visual capture. |
| **Workflow C (Inspiration capture)** | Video URL → transcript → entity extract → spec | **Video-only.** No web URL path. |
| **Pinterest** | the operator's existing manual moodboarding tool | **Siloed** — boards don't feed any downstream system. |
| **`brands/<slug>/profile.md`** (Section 04 hybrid) | Operational layer of brand profile | **No "moodboard.md" sibling** to capture aspirational visual direction |

**Key insight: every primitive needed already exists. The missing piece is the wiring + the artefact format.**

---

## Proposed workflow: web inspiration → moodboard → brief

```
 ┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌────────────┐
 │ SOURCE LIST          │    │     CAPTURE      │    │  FINGERPRINT    │    │    MOODBOARD    │    │   BRIEF    │
 │  (curated, finite)   │    │                  │    │                 │    │                 │    │            │
 │                      │    │  gallery-dl      │    │  DesignLoop     │    │  brands/<slug>/ │    │ Workflow D │
 │  • SEESAW URLs       │ →  │  (Pinterest,     │ →  │  Photo Brain    │ →  │  moodboard.md   │ →  │  (DECIDE)  │
 │  • Pinterest boards  │    │   Dribbble,      │    │  Memory layer   │    │   + /imgs/      │    │            │
 │  • Dribbble tags     │    │   Behance, ...)  │    │  fingerprints   │    │                 │    │            │
 │  • awesome-design-md │    │                  │    │                 │    │                 │    │            │
 │  • specific URLs     │    │  ExtractFlow     │    │  (already       │    │                 │    │            │
 │  • competitor sites  │    │  (live SPAs)     │    │   exists)       │    │                 │    │            │
 └─────────────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘    └────────────┘
         ▲                                                                          │
         │                                                                          │
         └───────────────  feedback: prune what didn't fit  ◀───────────────────────┘
```

### What "endless browsing" gets replaced with

- **Source list = stop condition.** You curate the list once (or pull from an existing Pinterest board, which IS the curation). Browsing ends when the list is captured.
- **Capture is parallel, not interactive.** Same pattern as Mino's competitor analysis (Section: `mino-competitor-analysis.md`) — give the system N URLs, get back fingerprinted images. No scrolling.
- **Fingerprint pass forces summarisation.** The output is structured (colour palette, type mood, etc.) — not "stuff I saw".

---

## The `moodboard.md` artefact (proposed format)

Sits next to `design.md` and `profile.md` (per Section 04's hybrid):

```
brands/sellersessions/
├─ design.md      ← Stitch-extracted visible style (Section 04)
├─ profile.md     ← Operational layer (Section 04)
└─ moodboard.md   ← Aspirational visual direction (NEW — this section)
   └─ imgs/        ← captured reference images (gallery-dl output)
```

### `moodboard.md` schema

```markdown
# Moodboard — <brand slug>

**Updated:** YYYY-MM-DD
**Source URLs:** (the curated list this was built from)
**Image count:** N references in ./imgs/

## Visual rhythm
- **Layout:** [grid / asymmetric / single-column / mixed]
- **Density:** [sparse / balanced / dense]
- **Whitespace ratio:** [low / medium / high]

## Colour
- **Dominant palette:** [3–5 hex values]
- **Mood:** [warm / cool / neutral / high-contrast]
- **Background tendency:** [dark / light / mixed]

## Typography
- **Mood:** [editorial / technical / playful / brutalist / refined]
- **Weight contrast:** [low / medium / high]
- **Display vs body separation:** [strong / unified]

## Hero pattern
- [split layout / centred / full-bleed image / video bg / animated]

## Motion style
- [restrained / playful / theatrical / static]
- Notes from any DesignSpells references

## Component density
- [minimal / moderate / dense]
- Recurring patterns: [bento grids / cards / rails / lists]

## CTA treatment
- [prominent button / inline link / floating / bar]
- Voice: [direct / soft / urgent]

## Anti-references
- What we explicitly DON'T want from the corpus (e.g. "Stripe-style elegance, but NOT the muted grey palette")

## Refresh trigger
- [when do we re-capture? — quarterly / on rebrand / on REFINE failure]
```

This format is **machine-fingerprintable** (Photo Brain can populate the colour/density fields automatically) AND **human-readable** (the anti-references and refresh trigger are operational, not visible).

---

## Wiring DesignLoop Photo Brain into this

Photo Brain already has:
- Memory-layer collection: `visual_preferences` (the operator's approvals/rejections)
- Fingerprinting of colour depth, typography, whitespace, micro-details
- 23 Photoshop/Illustrator effects as prompt language

**The hook:** Add a `pipeline/moodboard.py` (sibling to `pipeline/blend.py`) that:
1. Takes a folder of captured images + a `moodboard.md` skeleton
2. Runs Photo Brain on each image
3. Aggregates fingerprints into the moodboard.md fields (colour palette, density, etc.)
4. Outputs the populated moodboard.md alongside the images

**This is ~half a day of work post-SSL.** The hard part already exists (Photo Brain).

---

## SEESAW specifically

| Question | Answer |
|---|---|
| **MCP server / API?** | None found. Curation-only site. |
| **Best use** | Source URL list for the *capture* stage. Browse once, save 5–10 references, feed to gallery-dl/ExtractFlow. |
| **Workflow position** | Top-left of the diagram above (one of several source list inputs). |
| **What it replaces** | Open-ended Dribbble browsing. SEESAW's hand-picked daily rotation IS the curation. |

> **Practical use today (no new tooling):** open SEESAW, save 5 URLs into a `seesaw-pull.txt`, run `gallery-dl --input-file seesaw-pull.txt`, look at what came back. That's the MVP test of the whole workflow.

---

## How this maps to the unification plan

**This adds a NEW gap to the plan:**

| New gap | Where it bites | Owner |
|---|---|---|
| **#8 No web inspiration on-ramp + no moodboard layer** | Workflow C only handles videos. Pinterest siloed. No artefact between "saw something I liked" and "design brief". | New `pipeline/moodboard.py` in DesignLoop, fed by gallery-dl/ExtractFlow, output to `brands/<slug>/moodboard.md` |

**And it strengthens existing gaps:**

| Existing gap | How this helps |
|---|---|
| **#1 Logo Brain** | Moodboards become the visual context input to logo prompts (already in section 02 prompt #02 — "INDUSTRY" placeholder gets richer when you can attach a moodboard) |
| **#2 Brand token duplication** | `moodboard.md` is the *aspirational* sibling of `design.md` (current state) and `profile.md` (operational rules). Three-file canonical brand source. |
| **#5 REFINE guard rails** | REFINE can compare a built page against its `moodboard.md` to catch drift |

---

## Test-pass plan (before adoption)

Per the operator's rule: compile now, test before installing.

1. **Source curation test** — open SEESAW, save 5 URLs. Time it. If you spend > 10 min curating, the source isn't doing its job (curation should be cheap).
2. **Bulk capture test** — run `gallery-dl` against the 5 URLs. Confirm what it actually returns (full pages? thumbnails? CDN-direct images?). Some inspiration sites use lazy-loaded backgrounds that gallery-dl may not catch — fall back to ExtractFlow for those.
3. **Photo Brain fingerprint test** — feed the captured images through Photo Brain. Check whether the existing fingerprinting fields produce sensible aggregates (colour palette, density). If not, the moodboard.md schema needs adjusting.
4. **Pinterest on-ramp test** — separate test: pick one of the operator's existing Pinterest boards, run `gallery-dl` against it, see if it captures the pins. This is the **fastest path to value** because the curation already exists.
5. **Brief integration test** — manually populate one `moodboard.md` and feed it into Workflow D. Does the brief change? Does the LLM produce visually different output? If not, the moodboard isn't earning its place in the pipeline.

**Pass criteria:** Pinterest on-ramp works (test 4) AND a populated moodboard.md meaningfully changes Workflow D's brief output (test 5). If both pass, this becomes plan step **1.5** — sits between brand source (step 1) and Logo Brain (step 2).

---

### Short version

> **Inspiration capture is currently video-only. Web inspiration has no on-ramp. There's no moodboard artefact between "saw something I liked" and "design brief". Every primitive needed already exists (gallery-dl for Pinterest/Dribbble/etc., DesignLoop Photo Brain for fingerprinting, ExtractFlow for live sites). The missing piece is a `moodboard.md` artefact that sits beside `design.md` + `profile.md`, plus a `pipeline/moodboard.py` that wires the existing primitives. Pinterest on-ramp is the fastest test (the operator's curation already exists). Adds NEW Gap #8 to the plan, slots between current steps 1 and 2 as step 1.5.**
