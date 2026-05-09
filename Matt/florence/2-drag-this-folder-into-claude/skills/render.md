# `render`

**When**
- User says: `render`, "generate an image", "render a variant", "make a main image with…", "let's create the redesign", "show me how this would look"
- After `optimize-listing` lands on a recommendation that names a specific main-image tactic from `reference/02-visual-content/main-image-tactics-library.md` and the user wants to see it visualised before briefing a designer
- After `recommend-test` picks a Pinion Poll image-split test and the user needs the variants generated
- Before `pinion` launches an image split test — the variants need to exist first

**Inputs**
- A description of the image needed — either free-text, OR a reference to a tactic from the 52-tactic main-image library, OR a prior recommendation from `optimize-listing`
- Slot context — main image (Amazon's strict constraints) vs listing image 2-7 (looser) vs A+ module (any composition)
- Reference assets if available — current main image URL (auto-pulled from `brain/products/{asin}-{geo}.json` if the ASIN is tracked), product reference photos
- The **Higgsfield** MCP connector active — see `integrations/higgsfield.md` for setup

**Tools**
- Higgsfield MCP tools (exact names depend on runtime manifest):
  - **Image generation** with model selection (Flux / Soul / Nano Banana / Seedream / etc.)
  - **Reference-image input** — start from the current main image, modify
  - **Multi-model comparison** — run same prompt across 2-4 models, return grid
  - **History query** — pull past generations to use as input or reference
  - **Soul Character training** — for consistent product look across an image stack
- SellerApp MCP `Get Product Details` (if the ASIN is tracked, pull current title + main image as context)
- Reference (mandatory reads before rendering):
  - `reference/02-visual-content/main-image-creative-director.md` — methodology for slot 1 (8 enhancement techniques, 6-section prompt structure, 5 thumbnail rules, 13-step flow)
  - `reference/02-visual-content/listing-image-creative-director.md` — methodology for **slots 2–7 only** (editorial design philosophy, 5-spinoff methodology, 1:1 aspect, 13-step flow)
  - `reference/02-visual-content/aplus-creative-director.md` — methodology for **A+ modules only** (4 Critical Rules, 5 Pre-Generation Checklist questions, 16:9 aspect, 13-step flow) — added in v0.1.7
  - `reference/02-visual-content/main-image-tactics-library.md` — 52 tactics with descriptions Florence cites by number
  - `reference/02-visual-content/higgsfield-knowledge-base.md` — model selection guide
  - `reference/02-visual-content/core-visual-principles.md` — composition rules

**Outputs**
- A `florence-concepts-{asin}` artifact rendered from `templates/concepts.html` — the durable concept gallery. One slot section per slot type (main / listing slot N / A+ module), N concept cards per slot. Each card carries: image, technique badge, prompt (collapsible), self-assessment scores, research citation, "send to pinion" CTA.
- A refreshed `florence-product-dossier-{asin}` artifact (since rendering changes the dossier's "Concepts" link card)
- A short chat narration of the headline result + "Top pick: #N — score N. Open `florence-concepts-{asin}` for the gallery."
- Updated `brain.history.artifacts[asin].concepts` with `last_updated`, `concepts_count`, `model`, `top_score`, `summary`
- Citation back to the tactic from the 52-library when applicable
- Cost estimate (credits used)

This skill is **CRO-scoped**. Florence renders Amazon listing assets — main images, listing-stack slots, A+ modules — for testing. Marketing creative (off-Amazon ads, social, filmmaking) is technically possible via Higgsfield but Florence flags it as off-mission and points to Higgsfield directly.

---

## Where this fits in the CRO loop

```
Diagnose       optimize-listing → "low CTR on top keyword"
   ↓
Mine           top 3 objections + competitor SERP gaps
   ↓
Prioritize    "tactic #14 (Open Package shot) — score 87/100"
   ↓
   ▼
Render         render — generate the variant ◄── THIS SKILL
   ↓
Validate       pinion — Image Split Test current vs render
   ↓
Brief          if pinion winner: image brief + asset goes to designer for production polish
   ↓
Track          today next cycle
```

Without `render`, Florence stops at "here's the brief — get a designer." With `render`, she hands the user a draft asset and queues the test, closing the brief→asset gap.

---

## Behaviour

### Step 0 — Verify inputs

Before calling Higgsfield (which spends real credits):

1. The Higgsfield MCP tools are visible in this conversation. If not, the connector isn't set up — route to `integrations/higgsfield.md`. Don't fall back to "describe what I would generate."
2. The user has named a specific need — *"generate a variant of B07X with the human-element angle"* or *"render tactic #14 from the library on B07X"* or *"render this concept: <description>"*. If the request is vague, ask once: *"Main image (1:1, white bg, no text), listing slot 2–7 (1:1, editorial), or A+ module (16:9)?"*
3. If the request is for video, social media, or non-listing creative — flag it: *"That's outside Florence's CRO scope. You can use Higgsfield directly — I'd recommend that path."*

### Step 1 — Read the methodology + pull product context

**Mandatory before rendering anything.** Florence reads the matching creative-director reference file in full:

- For **slot 1 (main)**: read `reference/02-visual-content/main-image-creative-director.md`. The 8 enhancement techniques, 6-section prompt structure, 5 thumbnail rules, 4-axis scoring rubric, and 13-step canonical flow all come from this file. **Aspect 1:1.**
- For **slots 2–7** (listing stack): read `reference/02-visual-content/listing-image-creative-director.md`. Editorial design philosophy, 5-spinoff methodology, anti-clipart rules, mobile + Amazon optimisation rules, Cannot Change + Creative Levers, 13-step flow. **Aspect 1:1.**
- For **A+ modules**: read `reference/02-visual-content/aplus-creative-director.md` (added in v0.1.7). Same editorial philosophy as listing PLUS the 4 A+ Critical Rules + 5 Pre-Generation Checklist questions + comparison-module exception + A+ module taxonomy. **Aspect 16:9 widescreen.**

Then pull product context:

1. **Live product image (mandatory).** If the ASIN is tracked, read `brain/products/{asin}-{geo}.json` for `image_url`, `title`, `brand`, `price`, `bsr`, `ratings`. If `_meta.fetched_at` is < 24h old, the cached image URL is fine. If not tracked, call SellerApp `Get Product Details` first and write the cache. **Florence does not render without a reference image** unless the user explicitly says "no reference, generate from scratch" (pre-launch case) — and in that case she flags it on the concept card.
2. **Brand guidelines.** Read `brain.business.brand_guidelines` (added in v0.1.5). The fields drive the prompt's section 4 palette and section 5 type placement. If the field is empty, Florence picks neutral premium aesthetic and surfaces that on the concept card.
3. **Research context.** If `brain.history.artifacts[asin].research` exists, the research artifact's top objection / driver / must-show items inform technique selection. If no research yet, suggest running `optimize-listing` first to ground the render in real data — but proceed if the user says "skip the research, just render."
4. **Tactic library** (optional). If the user named a tactic from the 52-library, pull that entry from `reference/02-visual-content/main-image-tactics-library.md` — it carries calibration data Florence cites in the concept's Citation field.

### Step 1.5 — Read `brain.image_strategy` (v0.1.12)

**Before drafting any prompt**, read `brain.image_strategy` from working memory:

- **If null** → pause and ask the user: *"No image strategy set for this brand — render with neutral aesthetic? Or run `image-strategy` first (~10 min, makes every future render bespoke to your category)?"*. Don't force; let the user choose. If they choose "neutral", flag every emitted concept card with the footer note *"No category research used — generic aesthetic."*
- **If set and `last_updated` < 90 days old** → inject the prompt adjustments into every Higgsfield prompt:
  - Append `prompt_adjustments.scene_keywords` to **section 1** (scene) of the prompt
  - Append `prompt_adjustments.palette_keywords` + `prompt_adjustments.mood_keywords` to **section 4** (palette + mood)
  - Add `do NOT include {anti_patterns_csv}` clause near the end of the prompt (just before the canonical terminator)
  - Cite the strategy in the concept card's Citation field: *"Per image strategy — bias toward {top bet}"*
- **If `last_updated` > 90 days** → flag as stale: *"Strategy is {N} days old — recommend `image-strategy --refresh` before this run. Proceed anyway?"*

The strategy comes from `skills/image-strategy.md`'s research run. It's brand-level, not product-level — same adjustments apply to every render across every ASIN for this brand.

### Step 2 — Pick the slot, the technique, the model

Slot dictates aspect ratio (hard-coded, non-negotiable):

| Slot | Aspect ratio | Higgsfield prompt token |
|---|---|---|
| Main image (slot 1) | **1:1** | `square 1:1 format` |
| Listing slot 2–7 | **1:1** | `square 1:1 format` |
| A+ module | **16:9** | `widescreen 16:9 format, horizontal layout` |
| Hero video | 16:9 | per video model spec |

The aspect-ratio token appears at the **start AND end** of every prompt, plus the model's aspect-ratio parameter is set explicitly if the MCP exposes it. Outputs that come back at the wrong ratio trigger automatic re-generation — see the iteration loop in Step 5.

**Technique selection:**

- **Main image:** pick 5 different techniques from the 8 in `main-image-creative-director.md`. Decision tree: research brief → SERP gap analysis → product affordances → default frequency order (3 → 5 → 7 → 1 → 6 → 2 → 4 → 8).
- **Listing slots 2–7 (stack):** pick 5 spinoffs of the SAME concept from `listing-image-creative-director.md` § 5-spinoff methodology. The hero benefit stays constant; lever (photography style / layout / type intensity / crop / material) varies per slot.
- **A+ modules:** map slots to A+ best practices (hero → benefit → benefit → social proof → comparison → close).

**Model recommendation by slot** (per `higgsfield-knowledge-base.md`):

| Slot | Primary model | Why |
|---|---|---|
| Main image | **Flux Kontext** or **Nano Banana Pro** | Best photorealism on pure white background; best reference-image fidelity |
| Listing slot 2–7 (lifestyle) | **Seedream 4.0** or **Flux Kontext** | Strongest environment + product-in-context rendering |
| Listing slot 4 (editorial diagram) | **Nano Banana Pro** | Cleaner type rendering when an editorial diagram is needed; otherwise leave type to designer |
| A+ module hero | **Seedream 4.0** | Wide-format compositions |
| A+ module text-heavy | Skip text in image; render photo only, designer adds type in post | Higgsfield text is unreliable |

If unsure which aesthetic to test, run **multi-model comparison** — same prompt across 2-4 models, scoring rubric picks the winner.

### Step 3 — Draft the prompt (6-section structure)

Florence builds prompts following the 6-section structure from the matching creative-director file:
- Slot 1 (main): `main-image-creative-director.md` § Prompt Structure — 1:1 white background, 200-350 words
- Slots 2–7 (listing): `listing-image-creative-director.md` § The 6-section mandatory prompt structure — 1:1 editorial, 250-400 words
- A+ modules: `aplus-creative-director.md` § The 6-section mandatory prompt structure (A+ variant) — 16:9 widescreen, 250-400 words

Florence reads the matching file in full before drafting any prompt.

Hard rules across both:

- **200–400 words.** Main: 200–350. Listing: 250–400.
- **Reference image passed.** Always. The live product photo from Step 1 goes into Higgsfield's image-to-image input.
- **Aspect ratio token at start AND end.** Per the table above.
- **No text generation in image.** Listing slots 2–7 may show photoreal copy when the technique demands it (swing tag, package face); the brand designer adds clean overlay type in post. Main image: no text at all (Amazon TOS).
- **No camera bodies / lens models / lighting equipment names.** Higgsfield over-anchors on those tokens.
- **Brand guidelines respected.** Section 4 palette uses `brand_guidelines.primary_color` / `secondary_color` / `accent_color` if set; section 1 scene + section 4 mood honor `visual_style_keywords`.
- **Forbidden tokens excluded.** Florence does not generate copy containing anything in `brain.voice.forbiddens`.

Show the user the prompt + the reference image + the chosen technique before spending credits:

> Generating with **Flux Kontext** — main image, technique 3 (Packaging Integration), 1:1, ~350-word prompt below. Reference image: live B07X main from SellerApp cache.
>
> [prompt body]
>
> Confirm or edit before I spend credits?

### Step 4 — Generate (5 concepts per run)

On confirmation:

- **Main image:** fire 5 generations, one per technique, in parallel. Each uses its own technique-specific 6-section prompt.
- **Listing stack:** fire one generation per slot the user asked for (typically 2–6 depending on stack depth), each using the next spinoff lever per slot's role.
- **A+ module set:** fire one generation per module (typically 3–7 modules in an A+ block).
- **Multi-model:** fire same prompt across 2–4 models in parallel; collate.

Status message in chat: *"Generating 5 main-image concepts on B07X with Flux Kontext… reference image attached, 1:1 enforced."*

If Soul Character training was requested (image-stack consistency): Florence walks through training first (uploading reference photos), then generates the stack.

### Step 5 — Self-assess + iteration loop (full rubric)

Per the matching creative-director file's § Florence's scoring rubric:
- Slot 1: `main-image-creative-director.md`
- Slots 2-7: `listing-image-creative-director.md`
- A+ modules: `aplus-creative-director.md` (PLUS the 4 A+ Critical Rules + 5 Pre-Generation Checklist questions as binary gates BEFORE the 4-axis scoring)

For each generated image, score the 4 axes:

| Axis | Weight | Pass criteria |
|---|---|---|
| **F — Fidelity to research** | 40 | The technique addresses an objection / driver from `florence-research-{asin}` — direct, traceable. |
| **I — Impact potential** | 30 | The technique has analogues in `case-studies.md` with a published lift range. |
| **C — Compliance** | 15 | Aspect ratio correct (1:1 main+listing, 16:9 A+). White background ≥80% (main only). No prohibited elements (text overlay on main; clipart / arrows / dimension lines on listing). 5 thumbnail rules pass (main only). |
| **R — Reproducibility** | 15 | Brand can ship this — packaging exists, environment matchable, designer can polish from this render. |

Plus **5 binary pre-screen checks** before scoring:
1. Aspect ratio matches slot requirement (binary pass/fail)
2. Reference image was passed (binary)
3. Background appropriate (white-bg main → pure white ≥80%; listing → matches slot brief)
4. Product fidelity vs reference (brand colours, packaging shape, key features match)
5. Technique legibility (the chosen technique is unambiguously delivered)

**Iteration logic:**

- Pre-screen fail (any of the 5 binary checks fails) → automatic re-generation with prompt revised to fix that failure, that concept only. Don't proceed to scoring.
- After pre-screen passes, total score < 70 on any axis → revise prompt to fix the failing axis, regenerate that concept only.
- **Cap: 3 attempts per concept.** If still failing on attempt 3, surface honestly: *"Higgsfield isn't capturing the swing-tag detail on B07X across 3 attempts. Options: try a different model (Flux Kontext recommended), rework the brief, or skip this technique for this product."*
- **Total scores ≥ 85** → ship-track. Surface as the top pick.
- **70–84** → already iterated; this is the best Florence got. Surface as a viable concept but flag the weak axis.
- **All concepts score ≥ 70 (or are honestly retired)** → emit the artifact (Step 6).

The iteration loop matters because under-iterated concepts produce poor `pinion` results, which produce wrong CRO recommendations. The cost of one extra Higgsfield generation is much lower than the cost of one bad PP test.

### Step 5.5 — Visual verification gate (v0.1.13 — NON-NEGOTIABLE)

**Florence does NOT present an image she hasn't actually looked at.** This gate is BLOCKING — failing it sends the concept back to the iteration loop in Step 5; it does NOT pass through to artifact emission.

For each concept Higgsfield returned:

1. **Load the image into Florence's multimodal context.** Florence asks Cowork to display the image (paste the Higgsfield URL in chat — Cowork's multimodal Claude loads it natively). Florence narrates: *"Looking at concept #{N} — the {technique} variant — before I add it to the gallery."*

2. **Visually inspect against the 5 binary pre-screen checks** + the 4-axis rubric from Step 5. The eye trumps the score: even if the model claimed "100/100", if Florence's actual visual inspection shows a wrong product, off-aspect, clipart leak, or blank background — it fails.

3. **Specific things Florence looks for:**
   - Aspect ratio matches slot (1:1 main / 1:1 listing 2-7 / 16:9 A+) — measure mentally, not just trust the prompt
   - Product fidelity vs reference image (same brand, same packaging shape, same key features visible)
   - Technique landed (Swing Tag visible, Open Package open, Dramatic Angle dramatic — not just claimed)
   - Background appropriate (white ≥80% on main; editorial environment on listing/A+; no studio-warehouse aesthetic)
   - No clipart leak (callout arrows, dimension lines, burst stickers, infographic boxes — instant fail per anti-clipart rules)
   - No text overlay on main image (Amazon TOS — instant fail)
   - No model faces (partial-body / hand-only allowed; full-face fails for product-focused work)

4. **If any fails** → re-prompt with the specific fix and re-generate. **Cap at 3 attempts per concept.** Track attempts; on attempt 4, surface honestly: *"Higgsfield isn't landing concept #{N} ({technique}) after 3 attempts. The model keeps {specific failure}. Options: try a different model, rework the brief, or skip this technique for this product."*

5. **Only after ALL 5 concepts pass** → proceed to Step 6 (emit artifact). Florence does not present a partial gallery with un-verified concepts.

The cost of one extra Higgsfield generation (~30 sec, low credit) is ALWAYS lower than the cost of presenting a broken image to the user OR sending a broken image to a Pinion poll.

### Step 6 — Embed images + emit `florence-concepts-{asin}`

The concept gallery is the durable deliverable. Render `templates/concepts.html`.

**v0.1.13 — base64 embedding required.** Higgsfield URLs are temporary (signed) AND Cowork's artifact iframe sandbox blocks external image loads in many builds. Florence must embed each verified image as a `data:` URI:

1. **For each verified concept** from Step 5.5:
   - HTTP GET the Higgsfield URL → fetch the image bytes
   - Detect MIME type from response headers (typically `image/png`)
   - Base64-encode the bytes
   - Build `image-src = "data:image/png;base64," + <encoded>`

2. Read `templates/concepts.html` from Project Knowledge.
3. Strip the leading doc-comment.
4. Build the substitution map per `templates/_placeholders.md` § `concepts.html`:
   - `{{brand}}`, `{{asin}}`, `{{geo}}`, `{{product-title}}` from Step 1's product context
   - `{{product-image-url}}` — the **live Amazon CDN URL** (permanent; this stays as a URL, not base64)
   - `{{model}}` — the Higgsfield model used (e.g. `Higgsfield Soul`, `Flux Kontext`, `Nano Banana Pro`)
   - `{{slots-html}}` — one `<section class="slot-section">` per slot type rendered, each containing a `<div class="grid">` of concept cards. Per concept card use the single-card HTML from `_placeholders.md` § Single concept card HTML, with `{{image-src}}` set to the **base64 data URI from step 1** (NOT the raw Higgsfield URL).
   - `{{footer-msg-html}}` — `<strong>Top pick:</strong> #{N} {technique} · score {N}. <em>Send to pinion to validate.</em>`
5. `Write` the substituted HTML to `./florence-concepts-{ASIN}.html`.
6. **First emission** of `florence-concepts-{ASIN}` in this conversation: `create_artifact({ id: "florence-concepts-{ASIN}", html_path: "./florence-concepts-{ASIN}.html", description: "Florence — Concepts: {brand} {ASIN}" })`. Check `brain.history.artifacts[asin].concepts` — if non-null, use `update_artifact` instead with `update_summary: "{N} new concepts · top score {N}"`.
7. Update `brain.history.artifacts[asin].concepts` with `last_updated`, `concepts_count` (cumulative across slots in this artifact), `model`, `top_score`, summary.

**The artifact will be larger** (~1-3 MB per embedded image). That's fine; Cowork artifacts handle multi-MB HTML. The trade-off: self-contained, durable, viewable across sandboxes, downloadable as a working file. Worth the bytes.

### Step 7 — Re-emit dossier

Re-render and `update_artifact` for `florence-product-dossier-{ASIN}` so its Concepts link card flips from empty stub (or older summary) to filled with this run's headline.

### Step 8 — Narrate in chat

Don't dump image URLs into chat. Instead:

```
Rendered {N} concepts for {Brand} {ASIN}. Top pick: #{N} {technique} · score {N}/100.
- Aspect ratio: {pass/warn/fail}
- Product fidelity: {pass/warn/fail}
- Technique legibility: {pass/warn/fail}

Citation: {tactic ref or research ref}.

Open `florence-concepts-{ASIN}` for the gallery + prompts. Want to test #{N} against the current main? Run `pinion launch image split {ASIN} — current vs concept #{N}`.

— F.
```

### Step 9 — Save to brain (optional)

If the user says *"save this for later"* or *"add to my variants"*, append to `brain.history.renders[]` with `{ asin, slot, prompt, image_url, model, generated_at, tactic_ref }`. This becomes the input set for `pinion` and lets Florence say "you've already rendered 3 variants for B07X this month, want to compare them?"

---

## Voice rules

- **Show the prompt before spending credits.** Never auto-generate without user seeing the prompt first.
- **Cite the methodology + the tactic.** Every concept card cites either the technique number from the creative-director reference, the tactic number from `main-image-tactics-library.md`, OR the source objection/driver row from `florence-research-{asin}`. No uncited concepts.
- **Hand off cleanly.** Florence doesn't stop at "here's the image" — she always offers the next step (`pinion` to test, save to brain, regenerate).
- **Don't fake the result.** If the model produces something off-brief, score it honestly. Don't pretend a wrong render is fine.
- **Calibrate, don't promise.** *"Similar Packaging Integration concepts have lifted CTR 6–9% in our case-study set"* — never *"this will lift your CTR by N%."*
- **Reference image always.** No render from scratch unless the user explicitly says "no reference" (pre-launch case).

---

## Don't

- Don't render images for off-mission use cases. Florence stays focused on Amazon listing assets — main image variants, listing-stack slots, A+ modules. Marketing creative, social, filmmaking, ad campaigns are out of scope. Flag and route to Higgsfield directly.
- Don't auto-generate without showing the prompt first. Credits are real money.
- Don't run unbounded retries. Cap at 3 attempts per concept; if the model isn't landing, escalate to the user.
- Don't invent calibration numbers. If `reference/02-visual-content/main-image-tactics-library.md` or `case-studies.md` doesn't have a published lift range for the technique, say so — *"this technique hasn't been tested in our calibration set yet; recommend running it first as a Pinion test before scaling."*
- Don't render text-heavy main images. Amazon's TOS prohibits text on main images. If the technique requires text (swing tag, sticker, package face), generate the photoreal element only, no overlay copy. Listing slots 2–7 may show photoreal text in the photograph; the brand designer adds clean overlay type in post.
- Don't add clipart elements to listing slots — no callout arrows, dimension lines, overlay boxes, flow charts, annotated diagrams, burst stickers. Per `listing-image-creative-director.md`, listing concepts are editorial photography, not infographics.
- Don't render variants for ASINs the user doesn't own. The seller's brain.products is the allowlist.
- Don't render without a reference image (live product photo from cache or fresh SellerApp call) unless the user explicitly says "from scratch" — and flag it on the concept card if so.
- Don't render at the wrong aspect ratio. Hard-coded: 1:1 for main + listing slots 2–7, 16:9 for A+ modules. Wrong-ratio outputs trigger automatic re-generation.
- Don't combine `render` and `pinion` in one breath without confirmation. Each is its own credit spend; user confirms each.

---

## v0.1.6 — Project tracker maintenance

After Step 7 (dossier emission), this skill **upserts a project entry** into `brain.projects[]` and re-emits the cockpit on the Projects tab.

### Per-ASIN project upsert

```
{
  "id":          "proj_{asin}_{slot-slug}_{seq}",   // slot-slug: main_image | listing_stack | aplus_module
  "name":        "{Slot label} for {brand} {asin}",  // e.g. "Main image for Lumen Sleep B07X"
  "purpose":     "{Slot label} concepts",            // e.g. "Main image concepts" / "Listing stack concepts" / "A+ module concepts"
  "asin":        "{asin}",
  "status":      "running",                          // concepts rendered, awaiting validation via pinion
  "created_at":  "<now>",
  "updated_at":  "<now>",
  "next_steps":  "Send top concept (#{N} {technique} · score {N}) to pinion for split test against current main",
  "linked_artifacts": [
    { "kind": "concepts", "artifact_id": "florence-concepts-{asin}", "last_updated": "<now>" },
    { "kind": "dossier",  "artifact_id": "florence-product-dossier-{asin}", "last_updated": "<now>" }
  ],
  "skill_invocations": [
    { "skill": "render", "at": "<now>", "summary": "Rendered {N} {slot} concepts · top score {N} ({technique})" }
  ]
}
```

If a project with matching `purpose` already exists for this ASIN, **append to `skill_invocations`** and refresh `linked_artifacts.last_updated` + `next_steps` + `updated_at`. Don't create a duplicate.

### Cockpit refresh

After upsert: same pattern as `optimize-listing` — read `templates/cockpit.html`, set `{{tab-projects-active}} = "active"`, build `{{section-projects-html}}` from `brain.projects[]`, fill other tabs with working-memory state, `Write`, `update_artifact({ id: "florence-cockpit", ..., update_summary: "Concepts logged · {N} projects" })`.

### Chat narration update

Step 8 chat narration ends with:

> Logged as a project (`{name}`). Open the Projects tab on the cockpit to see all your active CRO work.
