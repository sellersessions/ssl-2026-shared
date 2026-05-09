# Listing image — creative director methodology

> **Scope:** methodology for generating concepts for **listing slots 2–7** (the secondary image stack, square 1:1). Source-of-truth for `render` (when slot is 2-7), `lifestyle-stack-generator`, `infographic-builder`, `stacked-gallery-test`.
>
> **Companions:** `main-image-creative-director.md` (slot 1 only — 1:1 white background); `aplus-creative-director.md` (A+ Content modules — 16:9 widescreen).
>
> **Calibration:** every recommendation in this file traces to lift ranges in `reference/05-productpinion/case-studies.md`. Florence cites them; she doesn't invent numbers.

---

## The 13-step listing-image flow (canonical Florence sequence)

| # | Step | Owner | What happens |
|---|---|---|---|
| 1 | **Full product analysis** | Florence | SellerApp `Get Product Details` + reviews + Rufus + reverse-ASIN keyword research + competitor SERP. Identify main features, benefits, use cases, top objections. Read current listing images to know what slots exist today. |
| 2 | **CRO-best-practice review** | Florence | Cross-check current listing images against the CRO playbook (`reference/02-visual-content/listing-images.md` if present + `MASTER-CRO-REFERENCE.md`). Where do the current slots fail the editorial-design / mobile-optimized / single-message rules? |
| 3 | **Hypothesis** | Florence | Propose changes per-slot — what message each slot should carry, what photography moment, what type treatment. **Cite the objection / driver / SERP gap** that drives each proposed change. |
| 4 | **User review** | User → Florence | Florence presents the hypothesis in chat. User approves / edits. Florence proceeds to render only after user confirms. |
| 5 | **Brand guidelines load** | Florence | Read `brain.business.brand_guidelines` — primary/secondary/accent colours, headline/body fonts, visual style keywords, tone descriptors. Bake these into the prompt's section 4 palette + section 5 type placement. |
| 6 | **Reference image upload** | Florence | Pull the live product photo from `brain/products/{asin}-{geo}.json` (or call `Get Product Details` if not cached). Pass as Higgsfield image-to-image reference with **every** call. |
| 7 | **Layout / typography rules baked in** | Florence | Every prompt explicitly requires: editorial layout, mobile-optimized typography, the feature/benefit visually represented (no clipart callouts), 1:1 aspect ratio. |
| 8 | **Run the prompts (5 spinoffs)** | Florence | Same hero benefit, 5 different visual deliveries via the 5-spinoff levers (photography style / layout / type intensity / crop / material). All 5 in parallel. |
| 9 | **Self-assess + iterate** | Florence | 4-axis rubric + 5 binary pre-screen checks. Re-generate any concept failing aspect ratio / clipart-leak / brand-fit / fidelity / mobile legibility. Cap at 3 attempts per concept. |
| 10 | **Present the images** | Florence | Emit `florence-concepts-{asin}` artifact (per `templates/concepts.html`). Each card carries technique badge, prompt, score row, citation, send-to-pinion CTA. Narrate the headline finding in chat. |
| 11 | **Propose Pinion tests** | Florence | For listing slots, common tests: Stacked Image Test (whole stack vs whole stack), Image Split Test per slot, or Pinion Video on the product detail page (broad PDP feedback). Confirm cost + audience. |
| 12 | **Run the test** | Florence (via `pinion`) | Launch. `florence-tests-{asin}` artifact in running state. Project tracker flips to `running`. |
| 13 | **Get results + iterate** | Florence | When PP results come in, surface verbatim shopper quotes + winner. If decisive → brief designer for production polish. If stuck → top up OR iterate the prompts + re-render. Loop back to step 8 with new direction. |

The full loop is the methodology — not just the prompt-writing in step 8.

---

## What listing images have to do

Different from main image. Main image gets the click; listing slots 2–7 convert the click into a sale. They answer questions, show the product in context, and remove objections. CTR is irrelevant for these slots — CVR is the metric.

Lift on a winning listing-stack redesign in the calibration set sits in the **5–18% CVR range** when the redesign addresses real objections from review-mining (Pinion case studies, ranked by depth-of-fix).

Three rules govern every concept:

1. **Editorial design philosophy.** These images are not infographics with clipart. They're editorial photography with type, in the spirit of Monocle, Kinfolk, luxury campaign work. Same product, told as a story.
2. **Aspect ratio: 1:1.** Hard-coded for slots 2–7. Non-negotiable. (A+ modules use 16:9 — that's `aplus-creative-director.md`'s file.)
3. **One message per slot.** A listing image that tries to convey "premium AND fast AND eco-friendly" conveys nothing. Pick one.

---

## Editorial design philosophy

Listing slots 2–7 in the calibration set's top quintile read as luxury campaign work, not as Amazon listing images. They share these characteristics:

| Direction | What it means | What to avoid |
|---|---|---|
| **Photography** | Moment-based — the product mid-use, mid-moment. Environment storytelling — the product in the world it belongs in. Lighting as mood — not as illumination. Depth of field for hierarchy — what's sharp, what's soft. **The image alone communicates the message before any type loads.** | Studio-warehouse aesthetic. Floating product on coloured background. Stock-photo lifestyle (fake smiles, model hands on product). Plastic-render aesthetic. |
| **Layout** | Modern grid. Asymmetric balance. 50–70% product (or product-in-environment). Generous white space (or coloured space) around the hero element. Type held at the edges, not over the product. | Centred everything. Equal margins. Product floating in dead-centre with copy below. |
| **Typography** | Architectural. 3–4× scale ratio between hero and body type. Maximum 2 hierarchy levels per slot. Brand fonts respected. Type carries voice; product carries proof. | Multiple competing weights. Decorative scripts. ALL CAPS WALLS. Comic Sans / Papyrus. |

### What never appears in Florence's listing concepts

These are the diagnostic markers of "infographic clipart" output. Florence rejects any concept that contains any of them and re-prompts:

- **Callout arrows** pointing to product features
- **Dimension lines** showing size in inches/cm
- **Overlay boxes** with feature lists
- **Flow charts** explaining how-to
- **Annotated diagrams** with numbered labels
- **Stock-icon clipart** (gears, lightbulbs, checkmarks)
- **Speech bubbles** of any kind
- **Burst stickers** ("100% Pure!" / "Best Value!")
- **Stars and confetti** as decorative elements

When the listing genuinely needs a how-to step or a size chart, that goes in a dedicated infographic slot (4 or 5 typically) and follows a different methodology — but even those should read as editorial diagrams, not clipart.

---

## The 5-spinoff methodology

Listing slots 2–7 work best as a **stack** — same hero benefit told 5 different ways, escalating from emotional to functional. Florence doesn't render 5 different concepts (that's main image's job — 5 different techniques). She renders **5 spinoffs of the SAME concept** — one consistent visual story, told through 5 different visual deliveries.

| # | Lever | What changes | What stays |
|---|---|---|---|
| 1 | **Photography style** | Moment captured, environment, time of day | Hero benefit, brand voice, type system |
| 2 | **Layout** | Where the product sits, where the type sits, how the eye moves through the frame | Photography style, hero benefit |
| 3 | **Type intensity** | More type / less type / type-only / no type | Photography, layout grid |
| 4 | **Crop** | Wide environment vs. extreme close-up | Composition logic, hero benefit |
| 5 | **Material/surface treatment** | The product on linen / on stone / on wood / in water — affects mood | Hero benefit, layout |

The stack tells the same story 5 times because shoppers don't read all 5 — they skim. Each slot has to land the message standalone, but together they reinforce one truth.

A+ modules follow the same editorial-design philosophy but with 16:9 aspect ratio and longer narrative arcs across 3–7 modules — see the dedicated `aplus-creative-director.md` for that workflow.

---

## The 6-section mandatory prompt structure (listing variant)

Adapted from the main-image structure for the looser listing-slot constraints:

```
1. SCENE
   Where this is — bedroom, kitchen, garden, bathroom, urban window light.
   Time of day. Mood (e.g. "early Sunday morning, slow, light just up").

2. PRODUCT POSITION + ENVIRONMENT
   Where the product sits in the scene. Foreground, mid-ground, background.
   What surrounds it (linen sheet, ceramic vessel, wood surface, water).

3. LIGHTING
   Direction (window light, side-lit, overhead). Quality (soft natural,
   directional). Time-of-day cue (golden hour, morning, blue hour).

4. PALETTE + MOOD
   3-color palette (e.g. "warm cream, soft sage, walnut wood"). Visual
   style keywords from brain.business.brand_guidelines.

5. TYPE PLACEMENT (if any)
   Where copy sits in the frame (top-left, bottom edge, no copy at all).
   Hierarchy (one hero line + one body line). Brand font names if known.

6. ASPECT RATIO + AESTHETIC
   For listing slots 2-7: "square 1:1 format, editorial product photography,
   campaign aesthetic, hyper-realistic, photographic film grain, 8k."
```

Hard rules:

- **250–400 words.** Listing prompts run longer than main-image prompts because environment matters.
- **Always end** with `square 1:1 format` terminator. Listing slots 2–7 are 1:1, no exceptions.
- **Never generate text directly in the image** unless the user explicitly asks. Generate the photograph; type goes in post via the brand's typesetting tools (Figma, Adobe). Higgsfield text rendering is unreliable; better to ship clean photography and add type cleanly.
- **Stay editorial.** If the prompt drifts toward "infographic," re-anchor: *"editorial campaign photograph, magazine spread aesthetic, no text, no callouts, no overlays."*

---

## Florence's scoring rubric (40/30/15/15 for listing concepts)

Same axes as main-image, weighted slightly differently because compliance is looser and impact is harder to attribute:

| Axis | Weight | What "100" looks like for a listing-slot concept |
|---|---|---|
| **F — Fidelity to research** | 40 | The slot answers a specific objection or driver from `florence-research-{asin}`. Direct, traceable. |
| **I — Impact potential** | 30 | The pattern (lifestyle moment / before-after / size context / use-case demo) has analogues in `case-studies.md` with published lift ranges. |
| **C — Compliance** | 15 | Aspect ratio correct, editorial aesthetic held, no clipart markers, type hierarchy clean. |
| **R — Reproducibility** | 15 | The brand can ship this — environment can be staged or matched, the product photographs as rendered, designer can polish from the render in their typesetting tool. |

Score interpretation matches main-image:
- **≥ 85** → ship-track
- **70–84** → iterate
- **< 70** → fail; reconsider the spinoff lever or the brief

---

## Reference image handoff (non-negotiable)

Same rule as main-image. Florence pulls `current_main_image_url` from `brain/products/{asin}-{geo}.json` (populated by `track-products`) and passes it as the reference image to Higgsfield. For listing slots, this keeps the product silhouette consistent across the stack even as the environment changes.

If the listing has secondary product photos (multi-angle, in-package, etc.) and the user has uploaded them, Florence uses the most relevant one as the reference per slot:

- Slot 2 (lifestyle) → use the standard product photo
- Slot 3 (in-use) → use the most action-ready angle
- Slot 4 (infographic) → use a clean white-bg shot
- Slot 5 (size context) → use a side-on or with-hand shot if available
- Slots 6–7 (closing slots) → use whichever angle best supports the closing message

If only the live main image exists, that's the reference for every slot in the stack.

---

## The iteration loop (same as main-image, slot-aware)

Florence renders the listing stack in passes:

1. **First pass** — render all 5 slots (or however many the user asked for) using the spinoff levers above.
2. **Score each concept** on the 4 axes.
3. **For any slot scoring < 70**, revise that slot's prompt and regenerate. Don't regenerate the whole stack — only the failing slot.
4. **Cap at 3 attempts per slot.** If still failing, surface the failure and offer a different lever or a different model.
5. **Stack consistency** — listing slots 2–7 are scored as a stack. If one slot breaks the visual consistency (different palette, different photography style, different type aesthetic), regenerate that slot only.

---

## Brand guidelines integration

Florence reads `brain.business.brand_guidelines` and uses every relevant field:

- `primary_color`, `secondary_color`, `accent_color` — drive palette in section 4
- `visual_style_keywords` — anchor section 4 mood and section 1 scene selection (e.g. `["minimal", "editorial"]` → cleaner scenes; `["warm", "lived-in"]` → richer environments)
- `tone_descriptors` — affect any type copy (works in concert with `voice.adjectives`)
- `headline_font`, `body_font` — informs the prompt's section 5 type placement (Florence describes the fonts; the actual typesetting happens in post)
- `logo_url` — Florence references it in the prompt for placement, but the actual logo overlay happens in post

If `brand_guidelines` is empty (default), Florence picks a neutral editorial aesthetic and surfaces it on the concept cards: *"Brand guidelines not set — picked editorial neutral aesthetic. Run `onboard` Stage 4 to set brand colours / fonts and Florence will respect them next time."*

---

## Cannot change (across all 5 spinoffs)

These stay constant across the spinoffs Florence renders. Vary them = invalidate the test:

- **The core concept** from the user's creative brief (or from the research artifact's recommendation)
- **The product's brand identity or appearance** — palette, packaging shape, key visible features
- **The key benefit or message** being communicated — same hero claim across all 5 deliveries
- **Brand guidelines** — colours, fonts, tone, visual style keywords from `brain.business.brand_guidelines`

If the user wants a different concept or a different benefit tested, that's a new render run, not a spinoff.

## Creative levers (what Florence varies across the 5 spinoffs)

| Lever | What changes |
|---|---|
| **Photography** | Scene / moment captured, lighting mood, camera angle, depth-of-field intent (shallow vs moderate vs deep), environment / surface |
| **Layout** | Grid structure, product placement, text-zone position, compositional balance, whitespace distribution |
| **Typography** | Scale relationship between hero + supporting text, alignment, weight contrast, position relative to image, copy phrasing |
| **Crop** | Wide environment vs extreme close-up |
| **Material / surface treatment** | Product on linen vs stone vs wood vs water — affects mood without changing identity |

Pick one lever per spinoff; each spinoff varies primarily on one lever (so the differences are legible) while honouring the cannot-change list above.

## Mobile + Amazon optimisation rules

Every listing-slot prompt explicitly carries these rules in section 5 (Type Placement) and section 6 (Aspect / Aesthetic):

- **Mobile-optimised legibility** — hero headline ≥ 14pt-equivalent at thumbnail size; max 2 hierarchy levels (one headline + one supporting line). Type held at the edges, not over the product.
- **Amazon-optimised layout** — full-bleed hero image with text strip, OR 60/40 split, OR product floating in clean space with type anchored to one edge. NEVER: centred-everything-with-text-below.
- **Feature/benefit visually represented** — the photograph alone communicates the message before any type loads. If type is required to explain, the photograph isn't doing enough.

## Decision tree — which lever for which slot

When Florence has to pick the spinoff lever for each slot in the stack:

| Slot | Job | Default lever |
|---|---|---|
| **Slot 2** | Lifestyle / aspirational moment — the dream | Lever 1 (photography style) — most evocative, fewest constraints |
| **Slot 3** | In-use / functional — the proof | Lever 4 (crop) — close-up of the use moment |
| **Slot 4** | Comparative / infographic — the differentiator | Lever 3 (type intensity) — most type, editorial diagram aesthetic, NO clipart |
| **Slot 5** | Size / scale context | Lever 5 (material/surface) — product on a surface that gives scale |
| **Slot 6** | Social proof / review highlight | Lever 2 (layout) — type-forward, photo-supporting |
| **Slot 7** | Brand close / call-to-action | Lever 1 (photography) again, but with different mood — emotional close |

Override per the research brief — if `florence-research-{asin}` says the top objection is fit, slot 4 might shift from "infographic" to "scale context" and slot 5 might pick up the differentiator role.

A+ module slot decisions follow `aplus-creative-director.md` (the dedicated A+ ref).

---

## Common failures + fixes

| Failure | What it looks like | Fix |
|---|---|---|
| Wrong aspect ratio | Listing slot output is 4:5 or 16:9 instead of 1:1 | Higgsfield ignored the format token. Repeat `square 1:1 format` at start AND end. Set the model's aspect-ratio parameter explicitly if the MCP exposes it. |
| Clipart leak | Output has cartoon arrows, generic icons, burst stickers | Prompt drifted toward infographic. Re-anchor: `"editorial campaign photograph, NO infographic elements, NO callouts, NO arrows, NO clipart, NO icons, NO badges. Pure photography."` |
| Stock-photo lifestyle aesthetic | Output reads as Getty Images stock — fake smiles, model hands, generic lighting | Drop "lifestyle" / "people using product" / "happy customer" tokens. Re-prompt with `"editorial moment, no model faces, partial human element only if any, mood-driven lighting, magazine campaign aesthetic"` |
| Type rendered illegibly | Higgsfield generated text that's misspelled or aesthetically off | Stop generating text in the image. Generate clean photography with text-zone whitespace; the brand's designer adds type in post. |
| Inconsistent product across the stack | The product looks different in slots 2 vs 5 | Reference image wasn't passed consistently or Soul Character training wasn't run. For Soul: train a Character on the product first, then render the stack. For Flux Kontext: re-render with the live product image as a stronger reference. |
| Background colour drift | Listing slot was supposed to be on a cream surface, came back grey | Specify the colour as a hex in section 4 palette (`"warm cream #F4F1EA"`) instead of as a name. |

---

## When to skip the editorial methodology

There are two cases where Florence drops the editorial mandate:

1. **Genuine spec/size diagrams** — when a slot's job is a real comparison table or measurement chart. Editorial diagrams, not clipart. (For A+ versions of this, see `aplus-creative-director.md` § Comparison module exception.)
2. **Listing slot 4** when the brief specifically says "no editorial — just show me the spec / size / measurement." Florence builds an editorial diagram (clean type, generous white space, photo of product as the anchor) but accepts that the slot is informational rather than aspirational.

Default to editorial. Drop only when the user or the research brief explicitly demands the alternative.

---

## Source

This methodology is **adapted to Florence's voice** from a creative-director system prompt the user shared. Original prompt was framed for a different workflow (general AI image generation for editorial design). Adapted points:

- Lead with the conclusion (3 rules → editorial philosophy → 5-spinoff methodology → 6-section prompt structure)
- Cite case-studies for calibration ranges, never absolute lift numbers
- 40/30/15/15 scoring layered onto every concept
- "What I'd do today" rule — every render run ends with one specific slot/concept to ship or test next
- File citations — every concept card links back to either a research artifact's objection/driver row or a slot best-practice in `02-visual-content/`
- Aspect ratio enforcement (1:1 listing slots 2–7 — A+ moves to its own ref `aplus-creative-director.md` in v0.1.7)
- Reference image handoff (live product photo always passed; no generation from scratch unless explicitly told)
- Anti-clipart hard rules (callouts, arrows, dimension lines, burst stickers, etc.) — explicit

Last sync: v0.1.5.
