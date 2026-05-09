# A+ Content — creative director methodology

> **Scope:** methodology for generating concepts for **A+ Content modules** (Amazon's brand-side content blocks below the bullets). Source-of-truth for `render` (when slot is A+ module), `aplus-module-generator`, `aplus-premium-build`.
>
> **Companions:** `main-image-creative-director.md` (slot 1 only — 1:1 white background); `listing-image-creative-director.md` (slots 2–7 — 1:1 editorial).
>
> **Calibration:** every recommendation in this file traces to lift ranges in `reference/05-productpinion/case-studies.md`. Florence cites them; she doesn't invent numbers.

---

## The 13-step A+ flow (canonical Florence sequence)

| # | Step | Owner | What happens |
|---|---|---|---|
| 1 | **Full product analysis** | Florence | SellerApp `Get Product Details` + reviews + Rufus + reverse-ASIN keyword research + competitor SERP. Identify main features, benefits, use cases, top objections. Read the current A+ stack to know what modules exist today. |
| 2 | **A+ best-practice review** | Florence | Cross-check current A+ against the playbook (`reference/02-visual-content/a-plus-content.md` if present + `MASTER-CRO-REFERENCE.md`). Where do the current modules fail editorial-design / mobile-legibility / single-message rules? |
| 3 | **Hypothesis** | Florence | Propose changes per-module — what message each module should carry, what photography moment, what type treatment. **Cite the objection / driver / SERP gap** that drives each proposed change. |
| 4 | **User review** | User → Florence | Florence presents hypothesis in chat. User approves / edits. Florence proceeds only after confirmation. |
| 5 | **Brand guidelines load** | Florence | Read `brain.business.brand_guidelines` — primary/secondary/accent colours, headline/body fonts, visual style keywords, tone descriptors. Bake into prompt sections 4 + 5. |
| 6 | **Reference image upload** | Florence | Pull the live product photo from `brain/products/{asin}-{geo}.json`. Pass as Higgsfield image-to-image reference with **every** call. |
| 7 | **Layout / typography rules baked in** | Florence | Every prompt explicitly requires: editorial layout, mobile-optimised typography, the feature/benefit visually represented (no clipart callouts), **16:9 widescreen aspect ratio**. |
| 8 | **Run the prompts (5 spinoffs of the same concept)** | Florence | Same hero benefit, 5 different visual deliveries via the spinoff levers (photography / layout / typography). All 5 in parallel, all 16:9. |
| 9 | **Self-assess + iterate** | Florence | 4-axis rubric + 5 binary pre-screen checks + the **A+ Critical Rules** (4 checks below) + **Pre-Generation Checklist** (5 questions below). Re-generate any concept failing aspect ratio / clipart-leak / brand-fit / fidelity / mobile legibility. Cap at 3 attempts per concept. |
| 10 | **Present the images** | Florence | Emit `florence-concepts-{asin}` artifact (per `templates/concepts.html`). Each card carries technique badge, prompt, score row, citation. Narrate the headline finding in chat. |
| 11 | **Propose Pinion tests** | Florence | For A+, common tests: Page Content Test (entire A+ block vs alternative), Pinion Video on the PDP for full-page reaction, Sequenced Benefit Test for module ordering. Confirm cost + audience. |
| 12 | **Run the test** | Florence (via `pinion`) | Launch. `florence-tests-{asin}` artifact in running state. Project tracker flips to `running`. |
| 13 | **Get results + iterate** | Florence | When PP results come in, surface verbatim quotes + winner. If decisive → brief designer for production polish. If stuck → top up OR iterate the prompts + re-render. Loop back to step 8. |

---

## What A+ Content has to do

A+ is the deep-conversion surface — the shopper has clicked from the SERP, scrolled past the bullets, and is reading the brand-side narrative below. A+ does three jobs:

1. **Reinforce the hero benefit** with editorial photography that the bullets can't carry.
2. **Answer the silent questions** — fit, scale, ingredients, durability, who it's for.
3. **Build trust through consistency** — same palette, type, tone across every module. Trust is built through repetition; chaos signals cheap.

Lift on a winning A+ rebuild in the calibration set sits in the **4–14% CVR range** when the rebuild addresses real objections from review-mining (Pinion case studies).

Three rules govern every concept:

1. **Aspect ratio: 16:9 widescreen.** Hard-coded for all A+ modules. Non-negotiable. (Listing slots 2–7 are 1:1; main image is 1:1 — both have their own creative-director files.)
2. **Editorial design philosophy.** A+ modules are editorial photography with type, in the spirit of Monocle, Kinfolk, luxury campaign work. Same product, told as a story.
3. **One message per module.** A module that tries to convey "premium AND fast AND eco" conveys nothing. Pick one.

---

## A+ Critical Rules (4 checks before generation)

Every concept must pass these four binary checks before Florence proceeds to render. If any fails, revise the brief — don't fire the prompt.

| # | Check | What "pass" looks like |
|---|---|---|
| **01** | **Legibility** | Text + key elements instantly readable at thumbnail size. High contrast, bold type, nothing smaller than 14pt-equivalent. If you have to squint to read it on a phone screen, it fails. |
| **02** | **Single clear message** | One hero idea per image. If it can't be stated in 6 words, simplify the image. Confused eye = lost sale. |
| **03** | **Visual benefit (hero photography)** | Show the outcome, not just the object. Crisp lighting, clean staging, emotional context that lets shoppers picture owning it. The photograph alone communicates the message. |
| **04** | **Branding + consistency** | Same palette, fonts, tone across every module in the A+ stack. Trust is built through repetition; chaos signals cheap. |

*Less is more.*

## Pre-Generation Checklist (5 questions)

Before Florence drafts the Higgsfield prompt for a module, she answers these five questions. If any answer is "no", revise.

1. **Have I simplified the message** instead of making it more complex?
2. **Is the benefit visually shown** — will the customer understand it just by scrolling past?
3. **Is the layout professional** — modern grid, generous whitespace, asymmetric balance?
4. **Is the photography professional** — moment captured, environment storytelling, lighting as mood?
5. **Is the copy clear and tied to the benefit** — one hero line + one supporting line, max?

---

## Editorial design philosophy

A+ modules in the calibration set's top quintile read as luxury campaign work, not as Amazon listing pages.

| Direction | What it means | What to avoid |
|---|---|---|
| **Photography** | Moment-based. Environment storytelling. Lighting as mood, not illumination. Depth-of-field separates hero from context. The image alone communicates the message before any type loads. | Studio-warehouse aesthetic. Floating product on coloured background. Stock-photo lifestyle (fake smiles, model hands). Plastic-render aesthetic. |
| **Layout** | Modern grid. Asymmetric balance. 50–70% product (or product-in-environment). Generous whitespace. Type held at the edges, not over the product. **All layouts composed for 16:9 widescreen** — use the full horizontal canvas. | Centred everything. Equal margins. Square or portrait compositions. Full-bleed type sitting on the product. |
| **Typography** | Architectural. 3–4× scale ratio between hero and body type. Maximum 2 hierarchy levels per module. Brand fonts respected. | Multiple competing weights. Decorative scripts. ALL CAPS WALLS. Comic Sans / Papyrus. |

### What never appears in Florence's A+ concepts

These are the diagnostic markers of "infographic clipart" output. Florence rejects any concept containing any of them and re-prompts:

- **Callout arrows** pointing to product features
- **Dimension lines** showing size in inches/cm
- **Overlay boxes** with feature lists
- **Flow charts** explaining how-to
- **Annotated diagrams** with numbered labels
- **Stock-icon clipart** (gears, lightbulbs, checkmarks)
- **Speech bubbles** of any kind
- **Burst stickers** ("100% Pure!" / "Best Value!")
- **Stars and confetti** as decorative elements

---

## The 5-spinoff methodology (A+ variant)

A+ stacks work best as a coherent narrative — typically 3–7 modules telling the brand story across the page. For any single module, Florence generates **5 spinoffs of the SAME concept** (same hero benefit, 5 different visual deliveries) per the user's creative brief or a research-artifact recommendation.

| # | Lever varied | What changes per spinoff | What stays |
|---|---|---|---|
| 1 | Photography style | Scene / lighting / time-of-day / mood | Hero benefit, type system, brand voice |
| 2 | Layout | Where the product sits, where type sits, how the eye moves | Photography style, hero benefit |
| 3 | Type intensity | More type / less type / type-only / no type | Photography, layout grid |
| 4 | Crop | Wide environment vs extreme close-up | Composition logic, hero benefit |
| 5 | Material / surface treatment | Product on linen vs stone vs wood vs water — affects mood | Hero benefit, layout |

A+ spinoffs are typically tested by Pinion's Page Content Test (entire A+ block vs alternative) or Sequenced Benefit Test (module ordering).

---

## The 6-section mandatory prompt structure (A+ variant)

```
1. SCENE
   Where this is — kitchen, bathroom, garden, urban window light. Time
   of day. Mood (e.g. "early Sunday morning, slow, light just up").

2. PRODUCT POSITION + ENVIRONMENT
   Where the product sits in the wide 16:9 frame. Foreground, mid-ground,
   background. What surrounds it — linen, ceramic, stone, water. Use
   the wider canvas — don't compose as if for square.

3. LIGHTING
   Direction (window light, side-lit, overhead). Quality (soft natural,
   directional). Time-of-day cue (golden hour, morning, blue hour).
   Describe by visual result, not equipment.

4. PALETTE + MOOD
   3-colour palette tied to brand_guidelines (primary / secondary /
   accent hex codes if set; otherwise neutral premium). Visual style
   keywords from brain.business.brand_guidelines.visual_style_keywords.

5. TYPE PLACEMENT (mobile-optimised, Amazon-optimised)
   Where copy sits in the wide frame (top-left, bottom edge, anchored
   to one of the 16:9 thirds, no copy at all). Hierarchy (one hero
   line + one supporting line). Brand fonts named if known.
   "Mobile-legible at thumbnail size" stated explicitly.

6. ASPECT RATIO + AESTHETIC
   "widescreen 16:9 format, horizontal layout, editorial product
   photography, campaign aesthetic, hyper-realistic, photographic film
   grain, 8k."
```

Hard rules:

- **250–400 words per prompt.** A+ runs longer than main-image because environment matters.
- **Always end** with the canonical 16:9 terminator: `widescreen 16:9 format, horizontal layout, editorial product photography, campaign aesthetic, hyper-realistic, 8k`.
- **Reference image passed.** Always. Live product photo from `brain/products/{asin}-{geo}.json`.
- **Aspect ratio token at start AND end.** Plus the model's aspect-ratio parameter set to 16:9 explicitly if the MCP exposes it.
- **No text generation in image** unless the user explicitly asks. Generate clean photography; the brand designer adds type cleanly in post via Figma / Adobe.
- **No camera bodies / lens models / lighting equipment names.** Higgsfield over-anchors on those tokens.
- **Brand guidelines respected.** See section 4 + 5.
- **Forbidden tokens excluded.** Florence does not generate copy containing anything in `brain.voice.forbiddens`.

---

## Florence's scoring rubric (40/30/15/15 for A+ concepts)

| Axis | Weight | What "100" looks like for an A+ concept |
|---|---|---|
| **F — Fidelity to research** | 40 | The module answers a specific objection / driver from `florence-research-{asin}`. Direct, traceable. |
| **I — Impact potential** | 30 | The pattern (lifestyle moment / before-after / use-case demo / spec block) has analogues in `case-studies.md` with published lift ranges. |
| **C — Compliance** | 15 | Aspect ratio = 16:9 (NOT 1:1). Editorial aesthetic held. No clipart markers. Type hierarchy clean. Passes all 4 A+ Critical Rules + all 5 Pre-Generation Checklist questions. |
| **R — Reproducibility** | 15 | Brand can ship — environment can be staged or matched, the product photographs as rendered, designer can polish from the render in their typesetting tool. |

Score interpretation matches main-image and listing:
- **≥ 85** → ship-track
- **70–84** → iterate
- **< 70** → fail; reconsider the spinoff lever or revise the brief

---

## Cannot change (across the 5 spinoffs of one module)

- The core concept from the creative brief
- The product's brand identity or appearance
- The key benefit or message being communicated
- Brand guidelines

If the user wants a different concept or different benefit, that's a different module — not a spinoff.

## Creative levers (what Florence varies)

| Lever | What changes |
|---|---|
| **Photography** | Scene / moment, lighting mood, camera angle, depth-of-field intent, environment / surface |
| **Layout** | Grid structure, product placement, text-zone position, compositional balance, whitespace distribution (across the wider 16:9 canvas) |
| **Typography** | Scale relationship between hero + supporting, alignment, weight contrast, position relative to image, copy phrasing |

---

## Reference image handoff (non-negotiable)

Every A+ render starts from the live product photo. Florence pulls `current_main_image_url` from `brain/products/{asin}-{geo}.json` (populated by `track-products`) and passes it as Higgsfield's image-to-image input. Same rule as main-image and listing.

If the listing has secondary product photos (multi-angle, in-package, in-use) and the user has uploaded them, Florence picks the most relevant per module:
- Hero / mood module → standard product photo
- Use-case / in-action module → action-ready angle
- Spec / size context module → side-on or with-hand shot if available
- Social proof / brand close → whichever angle best supports the closing message

---

## The iteration loop

1. **First pass** — render all 5 spinoffs of the module using the levers above.
2. **Score each concept** on the 4 axes + binary pre-screens + the 4 A+ Critical Rules + the 5 Pre-Generation Checklist questions.
3. **For any concept scoring < 70 OR failing any A+ Critical Rule**, revise that concept's prompt and regenerate.
4. **Cap at 3 attempts per concept.** If still failing, surface honestly: *"Higgsfield isn't capturing the editorial composition for module X across 3 attempts. Options: try a different model, rework the brief, or skip this module for this product."*
5. **A+ stack consistency check** — once individual modules pass, score the SET (3–7 modules together). If one breaks the visual cohesion of the set (different palette, different photography style), regenerate that module only.

---

## Comparison module exception

The only A+ context where the editorial mandate eases is a **genuine comparison or spec-table module**. These are diagrams, not photographs — but the type system still has to be editorial. No clipart even here.

When the user explicitly requests a comparison module, Florence:
1. Generates a clean photography anchor (the product, hero positioned in the 16:9 frame at one of the thirds)
2. Leaves type-zone whitespace at the opposite third for the designer to add the comparison table in post
3. Does NOT generate cartoon table-cell graphics or callout-arrow comparisons
4. Notes on the concept card: *"Comparison module — designer adds the table in post; the rendered image is the photographic anchor."*

Default to editorial photography. Drop only when the user or the research brief explicitly demands the comparison-module exception.

---

## Common failures + fixes

| Failure | What it looks like | Fix |
|---|---|---|
| Wrong aspect ratio | Output is 1:1 or 4:3 instead of 16:9 | Higgsfield ignored the format token. Repeat `widescreen 16:9 format` at start AND end. Set the model's aspect-ratio parameter to 16:9 explicitly. |
| Square composition in 16:9 frame | Output is technically 16:9 but the composition is centred / square — wasted horizontal space on both sides | Re-prompt section 2 with explicit "use the full horizontal canvas, product positioned at one of the 16:9 thirds, environment fills the rest". |
| Clipart leak | Output has cartoon arrows, generic icons, burst stickers | Prompt drifted toward infographic. Re-anchor: `"editorial campaign photograph, NO infographic elements, NO callouts, NO arrows, NO clipart, NO icons, NO badges. Pure photography."` |
| Stock-photo lifestyle aesthetic | Output reads as Getty Images stock — fake smiles, model hands | Drop "lifestyle" / "happy customer" tokens. Re-prompt with `"editorial moment, no model faces, partial human element only if any, mood-driven lighting, magazine campaign aesthetic"`. |
| Mobile-illegible type | Generated text is too small / low-contrast at thumbnail | Stop generating text in the image. Render clean photography with text-zone whitespace; brand designer adds type in post. Most A+ in the calibration set's top quintile use minimal type rendered separately. |
| Branding inconsistency across A+ stack | Module 3 looks like a different brand than module 1 | Soul Character training first (if Higgsfield Soul) OR pass module 1's output as the reference for module 2-N (image-to-image-to-image chain). |
| Background colour drift | Module supposed to be on cream surface, came back grey | Specify colour as hex in section 4 palette (`"warm cream #F4F1EA"`) instead of as a name. |

---

## Brand guidelines integration

Florence reads `brain.business.brand_guidelines` and uses every relevant field for A+ work specifically:

- `primary_color`, `secondary_color`, `accent_color` — section 4 palette directly
- `visual_style_keywords` — section 1 scene + section 4 mood (e.g. `["minimal", "editorial"]` → cleaner scenes; `["warm", "lived-in"]` → richer environments)
- `tone_descriptors` — informs any photoreal copy in the photograph (works in concert with `voice.adjectives`)
- `headline_font`, `body_font` — Florence describes these in section 5 type placement; the actual typesetting happens in post via the brand's designer
- `logo_url` — Florence references it in the prompt for placement intent, but the logo overlay happens in post

If `brand_guidelines` is empty (default), Florence picks neutral premium aesthetic and surfaces it on every concept card: *"Brand guidelines not set — used neutral premium aesthetic. Run `onboard` Stage 6.5 to set brand colours / fonts and Florence will respect them next time."*

---

## A+ module taxonomy

A+ stacks typically span 3–7 modules. Common taxonomy + the lever Florence picks per module:

| Module | Job | Default lever |
|---|---|---|
| **Hero (1)** | Brand intro / mood / aspirational moment | Photography style — most evocative, fewest constraints |
| **Benefit pillar (2)** | First key benefit, shown as an in-use moment | Crop — close-up of the use moment |
| **Benefit pillar (3)** | Second key benefit, shown as a different moment | Photography style (different scene/lighting) |
| **Social proof (4)** | Reviews / awards / press mentions | Layout — type-forward, photography-supporting |
| **Comparison / spec (5)** | Diff vs alternatives; or sizes / variants | Genuine comparison-module exception (see above) |
| **Brand close (6-7)** | Emotional close + CTA-style message | Photography style with a different mood — emotional close |

Override per the research brief — if `florence-research-{asin}` says the top objection is fit, the comparison/spec module might move up the stack and a benefit pillar might drop.

---

## Source

This methodology is **adapted to Florence's voice** from a creative-director system prompt the user shared (originally framed for direct Imagen 3). Adapted for Florence's Higgsfield-MCP workflow:

- The 13-step canonical flow with research → hypothesis → user review → render → present → Pinion loop → results + iterate
- A+-specific separation from listing (was merged in v0.1.6's `listing-image-creative-director.md`; split into its own ref in v0.1.7)
- The 4 A+ Critical Rules baked in (Legibility / Single Message / Visual Benefit / Branding consistency)
- The 5 Pre-Generation Checklist questions baked in
- 16:9 aspect ratio enforcement at start AND end of every prompt
- Cannot Change + Creative Levers explicitly delineated
- Mobile-optimised + Amazon-optimised typography rules made explicit
- Equipment-talk translation (no f-stops in the Higgsfield prompt; describe the visual result)
- 4-axis scoring rubric (40/30/15/15) layered on
- Reference image handoff (live product photo always passed)
- Comparison-module exception for genuine spec / size tables
- A+ module taxonomy mapped to spinoff levers

Last sync: v0.1.7-higgsfield-workflows.
