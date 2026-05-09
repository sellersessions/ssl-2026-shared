---
project: claude-ui-workflow
purpose: Stitch model selection rules. Which model for which intent. Curriculum-grade.
source: cycle-1 dogfood retechuk (findings #19, #20, #21, #23, #24, #25)
created: 2026-04-26
status: v1 — codified from cycle-1 evidence
---

# Stitch Model Rules

> The single most expensive lesson of cycle-1: "send the prompt to Stitch" is meaningless without a model rule. Same prompt, three models, three radically different outputs — including one that hallucinated Marvel superheroes into a women's clothing brand. This file exists so no one ever has to repeat that fishing trip.

---

## TL;DR — Decision table

| Intent | Model | Reference image? | Variants |
|---|---|---|---|
| **Refresh / update existing site** (preserve brand assets) | **Refresh (Nano Banana)** | ✅ required | 1 |
| **Fresh redesign** (new direction, same brand brief) | **Thinking 3.1 Pro** | ❌ no | 1 (multi-variant invites drift) |
| **Brand-led work needing aesthetic AND content fidelity** | **Refresh → Pro chain** (see below) | ✅ from Refresh output | 1 |
| **Text-led / SaaS / dev-tool layouts** | **3 Flash** | optional | 1-3 |
| **Fashion / lifestyle / image-led brand** | **NEVER 3 Flash** | use Pro or Refresh | 1 |

---

## Rule 1 — Pick the model BEFORE generating

**Finding #25 (🟠).** Fresh Stitch project (or any post-reload session) defaults the model picker to **3 Flash**, regardless of prior preference. State does not persist.

**The rule:** *First action in any new Stitch project is verify the model selector. Do not generate without this check.* Cycle-1 burned a generation cycle on Flash because the user assumed model state persisted — output was unusable for a fashion brief.

---

## Rule 2 — Refresh mode is a refresh tool, not a redesign tool

**Finding #20 (🟠).** Stitch labels Nano-Banana mode as **"Redesign"**. It is not. It is a **refresh** tool. The reference image dominates the prompt — soft prose suggestions read as decorative.

**On retechuk cycle-1:** prompt asked for editorial serif, warmer primary CTA, fresh direction. Output kept Montserrat-heavy type, kept black CTAs, kept the existing site's section ordering — just refreshed the model and tweaked the headline. *Good as a refresh. Not a redesign.*

**The rule:** In our internal docs, refer to Stitch "Redesign" mode as **"Refresh mode"** to set the right expectation. When you want a true redesign (different palette, type, layout DNA), explicitly route to **Thinking 3.1 Pro WITHOUT a reference image** — the reference is what locks the redesign into refresh territory.

---

## Rule 3 — Refresh mode honours hard locks, ignores soft suggestions

**Finding #23 (🟢 positive).** retechuk Refresh export held every locked field (theme.mode, paper-grain, petals, must_include sections, multi-CTA hero, brand story copy verbatim). It ignored every soft suggestion (editorial serif type pairing, aubergine primary CTA, full-bleed lookbook).

**Locked = held. Suggested = drifted.**

**Implication for /lock skill:** When running Refresh mode, encourage the user to lock anything they care about pre-generation. Aesthetic guidance in prose is decorative. The reference image dominates.

---

## Rule 4 — Never Flash for image-led / fashion / lifestyle / brand-storytelling

**Finding #21 (🔴).** retechuk run on 3 Flash produced: a Marvel-style superhero in the hero, cars in the secondary band, a pink "TEEES WORK" panel. None appeared in the prompt, reference image, or context.

**Diagnosis:** 3 Flash falls back to high-variance training data when the prompt is image / aesthetic / brand-led rather than text / layout / dev-spec-led.

**The rule (refines prior memory):**

| Use Flash for… | Don't use Flash for… |
|---|---|
| SaaS dashboards | Fashion / apparel |
| Dev tool layouts | Lifestyle / homewares |
| Layout-dominant pages | Brand storytelling |
| Text-led structure (forms, settings, admin) | Editorial / image-first |

**Hard rule:** If the brief mentions photography, palette, mood, brand aesthetic, or any image-led signal — Pro or Refresh, never Flash.

---

## Rule 5 — Refresh → Pro chain for content-faithful redesign

**Finding #24 (🟢 positive — biggest cycle-1 unlock).** Cycle-1 second-pass discovered: chaining Refresh into Pro produces output faithful to BOTH aesthetic AND content lock contract.

**The chain:**

```
1. Refresh (Nano Banana) + site screenshot
   → gorgeous reference PNG (anchored to existing aesthetic)

2. Pro 3.1 + Refresh PNG as reference image
   + anti-hallucination block
   + [EXACT TEXT] markers on every literal copy line
   → HTML/CSS faithful to both aesthetic AND lock contract
```

**Verified on retechuk (`stitch-export/retechuk-pro-from-nb.html`, 358 lines):** every locked element survived to rendered DOM — title, h1, subhead, dual CTA, nav order, wordmark, 7-section ordering, brand story copy verbatim, product names verbatim, lookbook caption verbatim, footer columns, footer copyright.

**When to use:** Brand-led work where aesthetic AND content fidelity both matter. Fashion, lifestyle, content-heavy brand homepages. The combination of "refresh anchors aesthetic" + "Pro respects [EXACT TEXT]" + "anti-hallucination block" was what made it stick.

**Anti-hallucination block template** (paste into Pro prompt):

```
Do not invent copy, headlines, CTAs, product names, or section names.
Do not pull alternative imagery from training data.
Every line marked [EXACT TEXT] must appear in the rendered output verbatim.
Every section marked [LOCK] must appear in the order specified.
If you would otherwise improve, modernise, or rephrase any text — STOP and use the original.
```

**[EXACT TEXT] markers go on every literal copy line:** headlines, subheads, CTAs, brand story, product names, footer copy, captions. If it's user-facing text and it must hold, mark it.

---

## Rule 6 — NEVER trust Stitch's self-narration

**Finding #26 (🔴 — curriculum gold).** On the failed Flash run, Stitch's chat panel claimed: *"Hero Section: Matches the reference image with the woman in the purple cardigan, the 'EFFORTLESSLY LAYERED' headline, and the dual aubergine CTAs."* Reading the actual rendered DOM showed every claim was false — wrong model, wrong headline, wrong copy, single CTA.

**Stitch confidently lies about its own output.**

**The rule:**
- Read the rendered DOM. NOT the chat narration.
- Stage 8 /refine MUST run a real DOM-level audit, not a "Stitch said it's good so we ship" check.
- Use Playwright with the auth-persisted Chromium (see `infra_playwright_chromium_auth.md`) to load the actual rendered output and verify locks against the DOM.

**Curriculum lesson:** *Generative tools confidently lie about their own output. Always verify against ground truth.* This applies beyond Stitch — same trap in image gen, copy gen, anywhere a model summarises its own work.

---

## Rule 7 — Two-channel Stitch export

**Finding #22 (🟠).** Stitch's ZIP export contains screenshots only — no HTML for drift audit. /refine pass needs HTML to operate on.

**The rule:** Every generation captures BOTH channels.

```
Channel 1: ZIP export → screenshots (visual reference, archive)
Channel 2: Code-to-clipboard → HTML/CSS for /refine pass
```

**Drop folder structure:**
```
stitch-export/
├── screenshots/
│   ├── variant-1.png
│   └── variant-2.png
└── html/
    ├── variant-1.html
    └── variant-2.html
```

Stage 7 is not done until both outputs are on disk.

---

## Quick-reference: model picker checklist

Before generating, confirm:

- [ ] Model selector is on the right model (not Flash by default)
- [ ] If Refresh: reference image attached
- [ ] If Pro for redesign: NO reference image
- [ ] If brand-led + content-critical: Refresh→Pro chain queued (Refresh runs first, output saved as reference for Pro)
- [ ] Anti-hallucination block in prompt (Pro path)
- [ ] [EXACT TEXT] markers on every literal copy line (Pro path)
- [ ] Locks recorded in lock.json (will guide which fields go [EXACT TEXT] vs decorative)
- [ ] Two-channel export plan: where ZIP screenshots land, where HTML lands

After generating, before declaring done:

- [ ] Read rendered DOM, not chat narration
- [ ] Verify each lock literally (text matches, sections in order, structure intact)
- [ ] If Flash output appeared on a non-Flash brief — discard, regenerate
- [ ] Both channels captured: screenshots AND HTML on disk

---

## Status

- [x] v1 — codified from cycle-1 retechuk evidence
- [ ] Validated against cycle-2 run on different archetype
- [ ] Wired into umbrella `claude-ui-workflow/SKILL.md` Stage 7 instructions
- [ ] /lock skill updated to surface lock-vs-soft guidance for Refresh mode

---

## Cross-references

- Pre-check checklists: [`PRE-CHECK-CHECKLISTS.md`](./PRE-CHECK-CHECKLISTS.md) — Stage 7 section embeds these rules as mechanical pre-checks
- Cycle-1 friction log: [`dogfood/2026-04-25-retechuk/friction-log.md`](./dogfood/2026-04-25-retechuk/friction-log.md) — full evidence for findings #19, #20, #21, #23, #24, #25
- Refresh→Pro proof: [`dogfood/2026-04-25-retechuk/stitch-export/retechuk-pro-from-nb.html`](./dogfood/2026-04-25-retechuk/stitch-export/retechuk-pro-from-nb.html) — 358 lines, all locks verified
- Playwright auth state: keep an auth-persisted Chromium profile (e.g. `~/.playwright-auth-profile/`) for DOM-level audit per Rule 6
