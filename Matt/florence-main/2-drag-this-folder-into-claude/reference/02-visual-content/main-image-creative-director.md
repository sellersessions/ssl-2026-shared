# Main image — creative director methodology

> **Scope:** the methodology Florence uses every time she generates a main-image concept (Amazon listing slot 1). Source-of-truth for `render` (when slot=main), `main-image-concepts`, `main-image-pipeline`, `main-image-multi-model`, `main-image-thumbnail-audit`, `three-second-test`, `main-image-poll`.
>
> **Companions:** `listing-image-creative-director.md` (slots 2–7 only); `aplus-creative-director.md` (A+ Content modules).
>
> **Calibration:** every recommendation in this file traces to lift ranges in `reference/05-productpinion/case-studies.md`. Florence cites them; she doesn't invent numbers.

---

## The 13-step main-image flow (canonical Florence sequence)

Every `render` run for a main image follows this loop. Florence narrates each step in chat as she goes; the `florence-concepts-{asin}` artifact is the durable deliverable; the project tracker logs the work.

| # | Step | Owner | What happens |
|---|---|---|---|
| 1 | **Product research** | Florence | Pull SellerApp `Get Product Details` for the ASIN. Capture title, brand, BSR, sales estimate, ratings, **and the URL of the current main image** — that URL becomes the reference image passed to Higgsfield in step 7. |
| 2 | **Competitor analysis** | Florence | Run SellerApp Keyword Search Result on the top keyword. Identify the top 5 competitors (filter sponsored). Pull their product details + main images. |
| 3 | **Gap analysis** | Florence | Compare our hero image against the 5 competitors. Where does ours fade? What angles, packaging, human elements are competitors using that we aren't? Where's the pattern-interrupt opportunity? |
| 4 | **Write hypotheses** | Florence | Surface ≥5 hypotheses for scroll-stopping high-CTR variants. Each hypothesis names the technique (from the 8-list below) + the specific gap it closes. |
| 5 | **Validate** | Florence | Cross-check every hypothesis against actual product features / benefits. **No invented claims.** If a hypothesis says "show waterproof" and the product isn't actually waterproof per SellerApp data + reviews, drop the hypothesis. Cite the source for every claim. |
| 6 | **User review & generation** | User → Florence | Florence presents the 5 hypotheses + technique mapping in chat. User approves / edits. Florence proceeds to render only after user confirms. |
| 7 | **Reference upload** | Florence | Upload the live product main image (from step 1's URL) as the reference image with **every** Higgsfield call. Non-negotiable — keeps the rendered product matching the actual SKU. |
| 8 | **Run the prompts** | Florence | Fire the 5 Higgsfield generations in parallel. Each uses one of the 8 enhancement techniques, no repeats across the 5. Each prompt follows the 6-section structure (below) at 200–350 words, ending with the canonical terminator. |
| 9 | **Self-assess + iterate** | Florence | Score each output on the 4-axis rubric + the 5 binary pre-screen checks. Re-generate any concept failing aspect ratio / background / fidelity / technique legibility / brand fit. Cap at 3 attempts per concept. |
| 10 | **Present the images** | Florence | Emit `florence-concepts-{asin}` artifact (per `templates/concepts.html`). Each card shows image, technique badge, prompt collapsible, score row, citation. Narrate the headline finding in chat in 4-6 lines + "What I'd do today: send concept #N to Pinion." |
| 11 | **Propose ProductPinion tests** | Florence | Recommend the right Pinion test (typically Image Split Test for 2-3 top concepts vs current main). Confirm cost + audience before launching. |
| 12 | **Run the test** | Florence (via `pinion`) | Launch the Pinion test. Emits `florence-tests-{asin}` artifact in running state. Project tracker flips to `running`. |
| 13 | **Get results + iterate** | Florence | When PP results come in, update tests artifact to complete, surface verbatim shopper quotes + winner with confidence. If winner is decisive: brief designer for production polish. If stuck zone: top up the poll OR iterate the prompt + re-render. Loop back to step 8 with the new direction. |

The full loop is what produces shippable main images — not just the prompts in step 8. Skip a step and Florence is guessing instead of grounded.

---

## What the main image has to do

The main image is the SERP scroll-stop. It does one job: get clicked in mobile browse before the shopper reads anything. Lift on a winning main image variant in the calibration set sits in the **6–14% CTR range** when the change addresses the actual gap (Pinion case studies, ranked by frequency).

Three rules govern every concept:

1. **The image alone has to communicate the hero benefit.** If it needs a callout to make sense, it's a listing-slot image, not a main image.
2. **Amazon TOS hard constraints.** Pure white background (`#FFFFFF`), product fills the frame, no text overlays, no people, no lifestyle staging, no logos other than on-product.
3. **Square 1:1 format.** Non-negotiable. Every prompt ends with this token literally.

---

## The 8 enhancement techniques

Pick exactly one technique per concept. Don't combine. Don't repeat across the 5 variants Florence renders for any given run — each variant is a different technique against the same product.

| # | Technique | When to pick it | What the prompt has to deliver |
|---|---|---|---|
| 1 | **Swing tag** | Hangtag / removable tag is part of the product (clothes, soft goods, personal care). The tag carries the headline benefit visibly. | The product with a swing tag attached, tag legible in frame, tag copy reading the single hero claim. Photoreal close-up. |
| 2 | **Sticker** | Headline benefit can sit as a peel-away or printed sticker on the product or its package. | The product with a high-contrast sticker visible, sticker copy short. The sticker is the focal element. |
| 3 | **Packaging integration** | Branded packaging tells the story (boxed cosmetics, electronics, kits). | Product partially in frame with the package next to it OR product visible inside an open box. Package face shows the brand and the hero ingredient/feature. |
| 4 | **Premium gift packaging** | Gifting category, premium positioning, unboxing matters. | Product visible inside or next to gift-grade packaging — ribbon, tissue, structured box. Lighting reads as luxury. |
| 5 | **Dramatic angle** | Product geometry rewards a non-standard POV — tall, slim, intricate, mechanical. | Hero shot from low angle, hero shot from above, three-quarter, or extreme close-up. The angle has to make the product look more impressive than the standard front-on shot. |
| 6 | **Human interaction** | Allowed by Amazon when the human element is a hand or partial limb (not a face). Demonstrates scale or use. | A hand holding the product, applying it, or a hand for scale. Hand and product in frame; pure white bg behind everything. |
| 7 | **Product in action** | Function visible in stillness — pouring, unfolding, opening, the moment the product does its thing. | The product captured mid-action: liquid pouring, hinge open, fabric mid-unfold. White bg held; the action gives life. |
| 8 | **Benefit visualization** | The hero benefit is invisible without a visual metaphor (hidden ingredient, internal mechanism, durability claim). | Cutaway / cross-section / metaphorical visual that makes the invisible benefit visible. Photoreal, not infographic. |

When Florence has to choose, the order of preference for first-time renders is: **3 (Packaging) → 5 (Dramatic angle) → 7 (Product in action) → 1 (Swing tag) → 6 (Human interaction) → 2 (Sticker) → 4 (Premium gift) → 8 (Benefit viz)**. This matches frequency of wins in the calibration set. Override when the research brief points elsewhere.

---

## The 6-section mandatory prompt structure

Every Higgsfield prompt for a main-image concept has these 6 sections, in this order. Skipping any section reliably produces off-brief outputs.

```
1. PRODUCT POSITION
   Where the product sits in the frame, scale (e.g. "fills 75% of frame"),
   distance from viewer.

2. ANGLE
   Camera POV — front, three-quarter, top-down, low-angle, extreme close-up.
   Pick the one the technique demands.

3. LIGHTING
   Soft, natural, studio. Direction of light (front, side, top). Shadows
   minimal but present so the product looks 3D, not floating. Avoid the
   words "dramatic lighting" — Higgsfield reads that as too contrasty for
   white-bg work.

4. EXTRA ITEMS
   Anything else in the frame (the package, a swing tag, a hand, a pour
   moment). One extra element max. The technique determines this.

5. WHITE BACKGROUND
   Always: "pure white background, #FFFFFF, no shadows on the background
   itself, slight contact shadow under the product only."

6. SQUARE FORMAT
   Always: "square 1:1 format, e-commerce product photography,
   hyper-realistic, ultra-sharp, 8k."
```

Hard rules on prompt construction:

- **200–350 words.** Shorter than 200 produces under-detailed outputs; longer than 350 produces hallucinated details Higgsfield wasn't asked for.
- **Never name camera bodies, lens models, or lighting equipment.** Higgsfield over-anchors on those tokens and produces studio-warehouse aesthetic instead of e-commerce product photography.
- **End every prompt** with: `"pure white background, #FFFFFF, e-commerce product photography, hyper-realistic, ultra-sharp, 8k, square 1:1 format"` — Higgsfield's terminator anchor for this category.
- **No people's faces.** Hands or partial limbs only, when technique 6 is in play. Otherwise no human element.
- **No text in the image.** Amazon TOS prohibits text on main images. If the technique implies text (swing tag, sticker, package face), the text must be photoreal and short — single hero claim only, photographed as part of the product, never overlaid in post.

---

## The 5 thumbnail rules

Main images render at thumbnail size in browse. Even a beautiful concept fails if it's illegible at 200×200px. Every concept Florence renders has to pass these 5 checks before scoring:

1. **Frame fill 85%.** The product takes up ≥85% of the frame area. At thumbnail size, anything smaller becomes a blob.
2. **Hero angle.** The angle that makes the product instantly recognisable to the category — not the most aesthetic, the most identifiable. A toaster shot from above is artistic; a toaster shot three-quarter is recognisable.
3. **Perceived quality.** The rendering reads as "expensive" — soft shadows, premium material rendering, no plastic-toy aesthetic.
4. **Pattern interrupt.** Side-by-side with the SERP neighbours, this image looks different. Not weird-different — distinctive-different. Same angle as everyone else = invisible.
5. **Instant category recognition.** A shopper on autopilot scrolling browse should know what category this is in 200ms. Eucalyptus sheets need to look like sheets first, eucalyptus second.

---

## Florence's scoring rubric (40/30/15/15 applied to main-image concepts)

After every generation, Florence scores each concept on the four axes from `0-paste-this-into-custom-instructions.txt` voice rules. Main-image-specific weighting:

| Axis | Weight | What "100" looks like for a main image |
|---|---|---|
| **F — Fidelity to research** | 40 | The chosen technique addresses the top objection or top driver from `florence-research-{asin}`. Direct, traceable. |
| **I — Impact potential** | 30 | The concept has analogues in `case-studies.md` with a published lift range matching this technique. |
| **C — Compliance** | 15 | Passes Amazon TOS (no text, no people-face, white bg, no logos). Passes the 5 thumbnail rules. |
| **R — Reproducibility** | 15 | The brand can ship this — packaging exists, hand model accessible, photo studio can match, designer can polish from the render. |

Score interpretation:
- **≥ 85** → ship-track. Send to `pinion` for validation, then designer polish.
- **70–84** → iterate. Florence regenerates with a tightened prompt, then re-scores.
- **< 70** → fail. Surface honestly; reconsider the technique or the brief.

---

## Reference image handoff (non-negotiable)

Every main-image render starts from the live product photo. Florence pulls `current_main_image_url` from `brain/products/{asin}-{geo}.json` (populated by `track-products`) and passes it as the reference image to Higgsfield's image-to-image input. This is what keeps brand colours, packaging shape, and product silhouette consistent across renders.

If the ASIN isn't tracked, Florence calls SellerApp `Get Product Details` first and caches the response before rendering.

If there's no live image (pre-launch product), Florence proceeds without a reference and explicitly notes that on the concept card: *"No live image — generated from scratch. Validate the rendered shape matches the actual product before testing."*

---

## The iteration loop

Florence renders 5 concepts per run, each using a different technique. After generation:

1. Score each concept on the 4 axes.
2. For any concept where any axis < 70 (especially compliance — wrong aspect ratio, off-white background, text bleeding through), revise the prompt to fix that specific failure and regenerate **that concept only**.
3. Cap at 3 attempts per concept. If still failing on the third attempt, surface honestly: *"Higgsfield isn't capturing the swing-tag detail on B07X across 3 attempts. Options: try Flux Kontext model, rework the brief, or skip this technique for this product."*
4. Once all concepts score ≥ 70 (or are honestly retired), emit the `florence-concepts-{asin}` artifact.

The iteration loop matters because under-iterated concepts produce poor `pinion` results, which produce wrong CRO recommendations. The cost of one extra Higgsfield generation is much lower than the cost of one bad PP test.

---

## Brand guidelines integration

Florence reads `brain.business.brand_guidelines` (added in v0.1.5) at the start of every render run. The fields that affect main-image work specifically:

- `primary_color`, `secondary_color`, `accent_color` — guide packaging integration shots, swing-tag colours, sticker colours
- `visual_style_keywords` — e.g. `["minimal", "editorial", "premium", "soft-natural"]` — affects lighting direction and the rendered material aesthetic
- `tone_descriptors` — informs any photoreal copy on swing tags / packaging

If `brand_guidelines` is empty (default), Florence picks a neutral premium aesthetic and surfaces that on the concept card: *"Brand guidelines not set — used neutral premium aesthetic. Run `onboard` Stage 4 to set brand colours and Florence will respect them next time."*

---

## What to do when Florence has to choose between 8 techniques

Decision tree, applied in order:

1. **Read the research brief.** Does `florence-research-{asin}` name a specific objection or driver that maps to one technique? (e.g. *"shoppers complain it doesn't look premium"* → technique 4 Premium Gift Packaging.) If yes, that technique wins.
2. **Read the SERP.** What technique are competitors NOT using? The pattern-interrupt rule says the winner is the one that's distinctive, not the one that's safest.
3. **Read the product.** Some techniques only work for some product types — a 30ml dropper bottle won't host a swing tag; a folded sheet won't read as packaging integration.
4. **Default order** (when no signal differentiates): 3 → 5 → 7 → 1 → 6 → 2 → 4 → 8 (the calibration-set frequency order from above).

Florence picks 5 different techniques per run, ordered by the decision tree. Never picks the same technique twice.

---

## Common failures + fixes

| Failure | What it looks like | Fix |
|---|---|---|
| Wrong aspect ratio | Output is 4:3 or 16:9, not 1:1 | Higgsfield ignored the format token. Re-prompt with `"square 1:1 format"` repeated at the start AND end of the prompt, AND set the model's aspect-ratio parameter explicitly if the MCP exposes it. |
| Off-white background | Background reads as cream, grey, or pale beige | Higgsfield drifted on white. Re-prompt with `"pure white background, hex #FFFFFF, no other colour anywhere in the background"` and bump that to the front of section 5. |
| Text leaking onto product | The model added a fake brand name or fake claim text | Prompt was too detailed about copy. Strip any specific text from the prompt; if a swing tag or sticker is part of the technique, name the tag's material and shape but leave the copy as `"[brand-readable copy, single line]"`. Edit text in post if needed (but don't ship text on main images — Amazon TOS). |
| Plastic-toy aesthetic | Product looks like a render, not a photo | Drop "studio lighting" tokens, add "natural soft daylight, slight contact shadow only, no harsh edges, photographic film aesthetic" |
| Wrong product silhouette | Output doesn't match the live product | Reference image wasn't passed, or model ignored it. Re-render with reference image priority increased (Flux Kontext respects this best); if Higgsfield Soul, use Soul Character training first. |
| Frame fill too low | Product fills <60% of frame | Re-prompt with the explicit frame-fill instruction in section 1: `"product fills 85% of the frame, hero-positioned"` |

---

## Frame-fill reconciliation

The original spec carries a small contradiction: the white-background section says *"product occupies 60–70% of frame"* while the thumbnail checklist says *"product fills 85%+"*. Both are right depending on the technique:

| Technique | Target frame fill | Why |
|---|---|---|
| Dramatic Angle | **85%+** | Pattern interrupt comes from sheer scale; tight crop |
| Product in Action | **80–85%** | Action needs room but product is the hero |
| Swing Tag / Product Sticker | **75–85%** | Tag/sticker readable, product still dominant |
| Human Interaction | **65–75%** | Hand needs room without becoming the subject |
| Packaging Integration | **65–75%** | Box angled behind product; box visible |
| Premium Gift Packaging | **60–70%** | Presentation box needs equal weight |
| Benefit Visualization | **70–80%** | Effect (splash/steam/motion) surrounds product |

Florence picks the per-technique target when drafting section 1 of the prompt. Across all techniques: **white margins on all sides remain non-negotiable** — no edge-to-edge product, no studio environment.

## Equipment-talk translation rule

The original creative-director system prompt uses photography vocabulary (f-stops, focal lengths, lens types) when framing depth of field or perspective for human readers. **Florence does not pass that vocabulary into Higgsfield prompts** — the model over-anchors on equipment names and produces studio-warehouse aesthetic instead of e-commerce product photography. Translation table:

| Original spec phrasing | What Florence writes in the Higgsfield prompt |
|---|---|
| "shallow depth of field, f/1.8–2.8" | "hero product razor-sharp, soft creamy background blur, dramatic separation between product and surroundings" |
| "moderate depth of field, f/4–5.6" | "product sharp with most of the supporting elements also in focus, gentle background softness" |
| "deep depth of field, f/8+" | "everything in the frame sharp from front to back, full clarity throughout" |
| "85mm lens" | (drop entirely — describe the visual perspective instead, e.g. *"product viewed straight-on, no distortion, slight foreshortening"*) |
| "key light at 45 degrees" | "soft directional light falling from the upper-right, gentle shadow on the lower-left" |

The intent transfers; the equipment vocabulary doesn't.

---

## Source

This methodology is **adapted to Florence's voice** from creative-director system prompts the user shared. Originally framed for direct Imagen 3 / general AI image generation, adapted for Florence's Higgsfield-MCP workflow with the validate / Pinion-loop additions:

- The 13-step canonical flow (research → competitor → gap analysis → hypotheses → validate → user review → reference upload → render → self-assess → present → propose Pinion → run Pinion → results + iterate)
- Lead with the conclusion (the 8 techniques, the 6-section structure, the 5 thumbnail rules)
- **Validate step** — never invent product claims; cite SellerApp data + reviews for every hypothesis
- Frame-fill per-technique reconciliation (was a small contradiction in the original spec)
- Equipment-talk translation rule (no f-stops in the Higgsfield prompt; describe the visual result)
- 40/30/15/15 scoring layered onto every concept
- File citations — every concept card links back to either a research artifact's objection/driver row or a tactic from `main-image-tactics-library.md`
- Aspect ratio enforcement (1:1 main, hard-coded)
- Reference image handoff (live product photo always passed; no generation from scratch unless explicitly told)

Last sync: v0.1.7-higgsfield-workflows.
