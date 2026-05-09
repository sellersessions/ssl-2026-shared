# `image-strategy`

> **Execution rule (per `0-paste-this-into-custom-instructions.txt` § How you work).** Read this skill file in full before responding. Don't free-style. Cite the skill file in your reply.

**When**
- User says: `image-strategy`, `image strategy`, `category research`, "scope my image strategy", "what wins in my category?", "research bestsellers"
- End of `/onboard` Stage 8 — Florence offers this as the optional closing step
- First `render` request when `brain.image_strategy` is null — Florence pauses + offers
- Any render run when `brain.image_strategy.last_updated` > 90 days old — Florence flags as stale + recommends `image-strategy --refresh`
- User says `image-strategy --refresh` — overrides the existing strategy

**Inputs**
- The brand context (from `brain.business.brand` + `brain.products`)
- Category + main keyword (from `brain.business.category` + user input if missing)
- The **Florence MCP — SellerApp** connector active in this Cowork project (16 tools)
- Reference: `reference/MASTER-CRO-REFERENCE.md`, `reference/02-visual-content/main-image-creative-director.md`, `reference/02-visual-content/listing-image-creative-director.md`, `reference/02-visual-content/aplus-creative-director.md`

**Tools**
- SellerApp MCP tools: `Keyword Search Result` (top 20 SERP), `Get Product Details` (full flags)
- Cowork built-in `Write` + `create_artifact` / `update_artifact`
- Pure substitution into `templates/image-strategy.html`

**Outputs**
- A `florence-image-strategy` artifact rendered from `templates/image-strategy.html` — durable, designer-shareable
- `brain.image_strategy` populated with category / main_keyword / competitors_analysed / table_stakes / differentiation_gaps / directional_bets / prompt_adjustments / last_updated
- `brain.business.category` populated if it was empty
- Cockpit Brand tab refreshed — Image Strategy sub-section flips from empty stub to populated mini-card
- Chat narration: 4-6 lines summarising the directional bet + "ready to render now"
- Sign-off: `— F.`

This skill runs **before any render skill** to tune Florence's Higgsfield prompts to what wins in the brand's category. Without it, every render falls back to neutral premium aesthetic — fine, but generic.

---

## Cost + time

- **Tokens**: ~300 SellerApp tokens (~14 × 15 ASINs for product details, ~9 for keyword SERP, ~50 for top-5 listing image stacks)
- **Time**: ~10 min wall clock (sequential SellerApp calls + synthesis)
- **Trigger pattern**: opt-in — Florence asks before spending tokens

---

## Behaviour

### Step 0 — Verify inputs

Before running:

1. The Florence MCP — SellerApp tools are visible. If not, route to `integrations/sellerapp.md` setup or `/onboard` Stage 2c.
2. `brain.business.brand` is set. If not, route to `/onboard` first — image strategy needs brand context.

### Step 1 — Confirm category + main keyword

Read `brain.business.category` + `brain.business.marketplaces[0]`. If `category` is empty, ask once:

> What category — supplements, beauty oils, kitchen tools, etc.? And the highest-volume keyword you want to rank for? (e.g. "ashwagandha capsules" or "organic argan oil")

Capture into `brain.business.category` + the new `brain.image_strategy.category` + `brain.image_strategy.main_keyword`.

### Step 2 — Confirm cost

> Scoping image strategy costs ~300 SellerApp tokens + ~10 min. I'll analyse the top 15 bestsellers on **{main_keyword}** in **{geo}**, reverse-engineer the patterns, and tune my Higgsfield prompts so every future render is bespoke to your category. Worth it? (yes / skip)

If `skip`, exit gracefully — Florence renders with neutral aesthetic until next time. Don't write anything to the brain.

### Step 3 — Pull top 15 bestsellers

Call SellerApp `Keyword Search Result` on `{main_keyword}` with `geo: {marketplace mapping}`. Get top 20 organic results (filter `include_sponsored_results: ""`). Drop any ASIN that matches `brain.products[*].asin` (don't analyse the user's own listings). Take the top 15 by SERP rank.

In chat: *"Pulled top 15 bestsellers on '{main_keyword}'. Reading product details next."*

### Step 4 — Pull product details

For each of the 15 ASINs, call `Get Product Details` with full flags (`fee_detail`, `price_detail`, `potential_detail`, `ratings`, `realtime_data`, `promotions` all `"1"`). Capture: title, brand, BSR, sales estimate, ratings, **main_image_url**, price.

~14 tokens × 15 = ~210 SellerApp tokens.

In chat: *"Got product details for all 15. Top 3 by BSR-velocity: {brand-1}, {brand-2}, {brand-3}. Pulling listing image stacks for those next."*

### Step 5 — Pull listing image stacks for top 5

For the top 5 by BSR-velocity, look at the secondary product images returned in step 4's `Get Product Details` response (SellerApp's response includes a `gallery_images` or similar array). If the array isn't deep enough (some listings only return main + 1 secondary), Florence flags it but proceeds — main-image data alone is enough for the strategy.

If SellerApp's response doesn't include listing image URLs at all, Florence falls back to main-image analysis only and surfaces that limitation in the artifact's "Source data" footer.

### Step 6 — Cluster + reverse-engineer

Florence cannot directly inspect images through SellerApp (the API returns URLs, not pixels). She infers techniques from:

- **Title vocabulary** — "in-box", "with", "kit", "gift" → packaging integration; "for {use case}" → human interaction; "premium", "luxury" → premium gift packaging
- **Brand patterns** — same brand running multiple top-15 listings = consistent technique signal
- **Category category vocabulary** — for supplements: "veggie capsules", "1500mg", "60 day supply" → clinical-look territory
- **Sales estimate × ratings** — high-velocity + high-rating = the technique works in this category

Cluster recurring techniques:
- White bg vs lifestyle context
- Packaging integration vs naked product
- Dramatic angle vs front-on
- Human element presence (hands, skin, face partial)
- Palette ranges (warm vs cool, saturated vs muted, dark vs light)
- Type density (text-on-image vs no-text)

Identify:
- **Table stakes** = techniques used by ≥70% of top 15 (must-match to compete)
- **Differentiation gaps** = techniques used by <20% of top 15 (opportunity space)

### Step 7 — Synthesize directional bets

Per visual surface (main image / listing slots 2-7 / A+ modules), propose 3-5 directional bets. Each bet:

```
{
  "surface": "main" | "listing" | "aplus",
  "description": "string — the bet in one line",
  "techniques_to_bias_toward": ["..."],
  "techniques_to_avoid": ["..."],
  "evidence": "string — the data point (e.g. '12 of 15 winners use X but the top 3 use NONE')"
}
```

The bet should be **specific and contrarian where possible**. If the category is saturated with white-bg-clinical, the differentiation play is warm-light lifestyle. If everyone uses dramatic angle, the play is straight-on with packaging integration. Cite the data.

### Step 8 — Build prompt adjustments

Concrete tokens to inject into every future Higgsfield prompt for this brand:

- **`scene_keywords`** (section 1 of every prompt) — e.g. `["warm morning light", "linen surface", "soft natural"]`
- **`palette_keywords`** (section 4) — e.g. `["sage primary #3B5444", "warm cream", "matte finish"]`
- **`mood_keywords`** (section 4) — e.g. `["editorial", "lived-in", "ingredient-led"]`
- **`anti_patterns`** — what to NOT render. Injected as `do NOT include {anti_patterns_csv}` near the end of every prompt. e.g. `["clinical lab look", "transparent capsule shots", "white-coat hands"]`

Pull palette keywords from `brain.business.brand_guidelines` if set; otherwise propose neutral category-fit keywords.

### Step 9 — Emit `florence-image-strategy` artifact

1. Read `templates/image-strategy.html` from Project Knowledge.
2. Strip the leading doc-comment.
3. Substitute placeholders per `templates/_placeholders.md` § `image-strategy.html`:
   - `{{brand}}`, `{{category}}`, `{{main-keyword}}`, `{{geo}}` from working memory
   - `{{competitors-analysed-count}}` = 15 (or whatever Florence got)
   - `{{table-stakes-html}}` — `<li>` per item
   - `{{differentiation-gaps-html}}` — `<li>` per item
   - `{{directional-bets-html}}` — one `<div class="bet">…</div>` per bet, grouped by surface
   - `{{prompt-adjustments-html}}` — 4 sub-sections (scene / palette / mood / anti-patterns)
   - `{{last-updated}}` = ISO 8601 now
   - `{{footer-msg-html}}` = e.g. `<strong>What I'd render today:</strong> warm morning lifestyle moment with sage-cream palette. <em>Bias hard against the clinical look 80% of competitors use.</em>`
4. `Write` to `./florence-image-strategy.html`.
5. **First emission** of this conversation: `create_artifact({ id: "florence-image-strategy", html_path: "./florence-image-strategy.html", description: "Florence — Image Strategy: {brand}" })`. **Re-run / refresh**: `update_artifact` with `update_summary: "Refreshed · {brand} {category}"`.

### Step 10 — Save to brain + ack in chat + refresh cockpit

Save the strategy to `brain.image_strategy` (replacing any prior strategy). Set `last_updated` to ISO 8601 now.

Re-emit cockpit on Brand tab — the new "Image Strategy" sub-section flips from empty-state stub to populated mini-card showing category + main keyword + 1-line directional bet summary.

Chat narration (4-6 lines):

```
Strategy scoped — {brand} in {category}.

**Direction:** {one-line description of the headline bet — e.g. "go warm-light lifestyle, contrarian to the 80% clinical-look saturation"}.

**Bias toward:** {2-3 techniques}.
**Avoid:** {2-3 anti-patterns}.

Open `florence-image-strategy` for the full doc. Every `render` run from now on injects these tokens into Higgsfield. Type `render main image for {asin}` to start.

— F.
```

---

## Sub-commands

`image-strategy --refresh` — overrides the existing strategy. Florence asks for re-confirmation of category + main keyword (in case they've changed) before re-running. Useful quarterly or after a major competitive shift.

`image-strategy show` — re-emit the artifact without re-running. Just renders the current `brain.image_strategy` to the artifact panel. No SellerApp tokens spent.

---

## Voice rules

- **Cite the data.** Every directional bet names the specific evidence from the top-15 set ("12 of 15 use X, top 3 don't").
- **Be contrarian where data supports it.** Pattern interrupt is the differentiation play. Don't propose "do what everyone does" — that's table stakes, table stakes are necessary but insufficient.
- **Bake brand_guidelines in.** If `brain.business.brand_guidelines` has palette + visual style keywords, integrate those into `prompt_adjustments` — Florence's renders should reflect both category-fit AND brand identity.
- **Single sentence summary.** The strategy doc is shareable; lead with the one-line direction so a designer reading the artifact gets the bet in 5 seconds.

---

## Don't

- **Don't auto-run.** This skill costs SellerApp tokens; always confirm with the user (Step 2) before spending.
- **Don't analyse the user's own ASINs as competitors.** Filter them out at Step 3.
- **Don't propose "follow the leaders" verbatim.** Strategy = differentiation. If 12 of 15 do X, the bet is to do something else (or do X better — but call out the contrarian angle).
- **Don't lock in a bet that contradicts brand_guidelines.** If brand says "minimal editorial" and category says "loud bold colour", the bet has to reconcile both — usually by leaning into brand identity as the differentiator (since brand identity > category trend).
- **Don't run on a fresh brain (no products, no brand).** Strategy needs context. Route to `/onboard` first.
- **Don't store more than one strategy.** A re-run via `--refresh` supersedes; don't versionize. Old strategies live in git history if needed.
- **Don't render images.** This skill is research-only. The render skills consume the strategy via `prompt_adjustments`.
