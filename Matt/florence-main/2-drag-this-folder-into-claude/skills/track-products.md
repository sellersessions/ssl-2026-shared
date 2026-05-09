# `track-products`

**When**
- User says: `track-products B07X, B08Y, ...`, `track-products https://amazon.co.uk/dp/B07X...`, "add these ASINs", "track these products"
- User pastes one or more ASIN-shaped strings (`^B0[A-Z0-9]{8}$`) or amazon-domain URLs in any chat — even without a slash command. The heuristic alone routes here.
- Called from `skills/onboard.md` Stage 3 to do the parse + fetch in one shot

**Inputs**
- One or more of these formats (mix freely, one per line / comma-delimited):
  - Bare ASIN: `B07XYZ4231` — geo defaults to `brain.business.marketplaces[0]`
  - ASIN + geo: `B07XYZ4231 uk` — explicit 2-letter geo override
  - Full amazon URL: `https://www.amazon.co.uk/dp/B07XYZ4231`, `https://www.amazon.com/Product-Name/dp/B07XYZ4231/ref=...` — geo inferred from TLD
- In-context brain (for `business.marketplaces[0]` default geo, and to de-dupe against existing `products[]`)
- The `Florence MCP — SellerApp` connector active in this Cowork project (specifically the `Get Product Details` tool)

**Tools**
- SellerApp MCP tool: `Get Product Details`
- `Write` tool (per-ASIN cache files at `brain/products/{asin}-{geo}.json`, plus updated `florence-brain.json` and `florence-cockpit.html`)
- Cowork `update_artifact` (cockpit + brain artifacts)

**Outputs**
- Per-product cache file: `brain/products/{asin}-{geo}.json` containing the full SellerApp response (title, brand, BSR, sales estimate, price, ratings, images, fees, promotions). This is the persistence layer — `optimize-listing` and any future skills read from it.
- Updated `brain.products[]` with `{ asin, geo, title, current_main_image_url, goal: null, status: "tracked" }` per new entry.
- Re-emitted cockpit artifact — page 3 (Products) shows minimal product cards (image thumbnail + title + ASIN+geo).
- Re-emitted `florence-brain.json` artifact — user can re-download for cross-session restore.
- Sign-off message in chat (no `— F.` — it's chat, not a brief).

---

## Behaviour

### Step 0 — Verify inputs

Before fetching anything:

1. The `Florence MCP — SellerApp` tools are visible. If you don't see `Get Product Details` in your tool list, the MCP isn't connected — surface that and route to `integrations/sellerapp.md` setup.
2. The user provided at least 1 ASIN-shaped string or amazon URL in their last message.
3. Total inputs ≤ 25. If more, stop and ask: *"You sent {N} ASINs. I cap at 25 per command to keep the wait reasonable. Want me to take the first 25, or pick a different subset?"*

### Step 1 — Parse `(asin, geo)` tuples

For each input string, extract:

- **Bare ASIN** (`^B0[A-Z0-9]{8}$`) → `asin = string`, `geo = brain.business.marketplaces[0]` (lowercase 2-letter, e.g. `amazon.co.uk` → `uk`)
- **ASIN + geo** (`^B0[A-Z0-9]{8}\s+(us|uk|de|fr|it|es|ca|mx|br|au|jp|in|ae|sg|nl|se|be|pl|tr|sa|eg)$`) → split on whitespace, lowercase the geo
- **Amazon URL** — match `amazon\.(com|co\.uk|de|fr|it|es|ca|com\.mx|com\.br|com\.au|co\.jp|in|ae|sg|nl|se|com\.be|pl|com\.tr|sa|eg)/.*?/dp/(B0[A-Z0-9]{8})` (the `/dp/` is what tells you it's a product page; ignore the rest of the URL noise). Map TLD → geo:
  | TLD | geo |
  |---|---|
  | `.com` | us |
  | `.co.uk` | uk |
  | `.de` | de |
  | `.fr` | fr |
  | `.it` | it |
  | `.es` | es |
  | `.ca` | ca |
  | `.com.mx` | mx |
  | `.com.br` | br |
  | `.com.au` | au |
  | `.co.jp` | jp |
  | `.in` | in |
  | `.ae` | ae |
  | `.sg` | sg |
  | `.nl` | nl |
  | `.se` | se |
  | `.com.be` | be |
  | `.pl` | pl |
  | `.com.tr` | tr |
  | `.sa` | sa |
  | `.eg` | eg |
- **Anything else** — collect into a "couldn't parse" list. After processing all inputs, surface them: *"I couldn't parse {N} of your inputs: {list}. ASIN format is `B0` followed by 8 alphanumeric uppercase chars. Send them again and I'll try."* Then proceed with the ones that did parse.

If `brain.business.marketplaces[0]` is missing AND the user pasted a bare ASIN, ask once: *"Which marketplace? `uk`, `us`, `de`, etc."* Wait for the answer.

### Step 2 — De-dupe against existing `brain.products[]`

For each `(asin, geo)` tuple, check if `brain.products[]` already has an entry with matching `asin` AND `geo`. Split into:

- `new_tuples` — not yet tracked
- `existing_tuples` — already in the brain

If `existing_tuples` is non-empty, ask:

> {N} already tracked: {list 3 asins, "+more" if longer}.
>
> - **Refresh** — re-fetch SellerApp and update the cache (use when prices / BSR / ratings have moved).
> - **Keep cached** — leave them alone, just add the new {M}.
> - **Replace** — re-fetch all of them.
>
> Default if you don't reply: keep cached, add new.

Wait for a one-word reply (`refresh`, `keep`, `replace`) or proceed with default after a clear pause. Build the final fetch list.

### Step 3 — Sequential fetch loop

For each `(asin, geo)` in the fetch list, in order:

1. Emit a one-line chat status: *"Fetching {asin} ({i}/{N})…"*
2. Call SellerApp `Get Product Details` with:
   ```
   asin: {asin}
   geo: {geo}
   fee_detail: "1"
   price_detail: "1"
   potential_detail: "1"
   ratings: "1"
   realtime_data: "1"
   promotions: "1"
   ```
   Reference: `reference/sellerapp-api-reference.md` § 1. Token cost: ~14 per ASIN.
3. **On success:** `Write` the full response to `brain/products/{asin}-{geo}.json`. Add an `_meta.fetched_at` timestamp (ISO 8601) and `_meta.geo` for clarity.
4. **On error** (404, 406 token-quota, 5xx): record the failure with the error code, **don't write a cache file**, continue to the next ASIN. Surface failures at the end.
5. Update the chat status with the brand + truncated title once you have them: *"Fetched {brand} {title-truncated-to-50-chars} ({i}/{N})"*.

Sequential is intentional — keeps SellerApp's per-account rate limits comfortable and gives the user a sense of progress.

### Step 4 — Update `brain.products[]`

For each successful fetch, parse the SellerApp response and add to `brain.products[]`:

```json
{
  "asin": "{asin}",
  "geo": "{geo}",
  "title": "{response.title}",
  "current_main_image_url": "{response.image_url or response.images[0]}",
  "goal": null,
  "status": "tracked"
}
```

If the same `(asin, geo)` already exists in `brain.products[]` (e.g. we're refreshing), update in place; don't duplicate.

### Step 5 — Re-emit cockpit

Read `templates/cockpit.html`. Substitute placeholders for the current stage (5 if onboarding done, otherwise current onboarding stage). For `{{page-3-body-html}}`, render a CSS grid of product cards — see `templates/_placeholders.md` § "page 3 body HTML" for the exact card structure.

`Write` the result to `./florence-cockpit.html`. Call `update_artifact({ id: "florence-cockpit", html_path: "./florence-cockpit.html", update_summary: "Tracked {N} new products" })`.

If this is the **first emission of `florence-cockpit` in the conversation** (e.g. user pasted ASINs as their first message and onboarding hasn't run), use `create_artifact` instead.

### Step 6 — Re-emit `florence-brain.json`

Serialize the updated brain (in-context state). `Write` to `./florence-brain.json`. Call `update_artifact({ id: "florence-brain", html_path: "./florence-brain.json", update_summary: "+{N} products" })` (or `create_artifact` on first emission of the conversation).

### Step 7 — Sign-off

Reply in chat:

> Tracked {N} new products: **{brand1}** {title1-short}, **{brand2}** {title2-short}{+ more}. Cache files at `brain/products/`, brain re-emitted.
>
> Type `optimize-listing <ASIN>` for a CRO audit, or paste more ASINs to add.

If any fetches failed, append:

> Couldn't fetch {M}: {asin1} ({error1}), {asin2} ({error2}). Likely causes: invalid ASIN, ASIN not on that marketplace, or SellerApp token quota exceeded (`Get Token Status` would tell us). Want me to retry the failed ones, or move on?

No `— F.` (chat output, not a brief).

---

## Voice rules

- **Sequential, not parallel** — even if 25 ASINs takes 30+ seconds, the user sees progress and the chain feels alive.
- **Status messages between fetches** — *"Fetched {brand} {title} (3/5)"* — not silent waits.
- **Never paste raw SellerApp JSON to chat.** The cache file holds the full response; the chat sign-off names brand + title, that's it.
- **Don't promise anything you can't verify.** If `realtime_data: "1"` returned cached SellerApp data (their flag is best-effort), don't claim "real-time."

---

## Don't

- Don't call SP-API. Florence dropped SP-API in v0.1.4 — SellerApp's the data layer now.
- Don't fetch in parallel. Sequential keeps rate limits and progress UX in check.
- Don't cap fetches at fewer than 25 silently — surface the cap message and let the user batch.
- Don't write a cache file if SellerApp returned an error (4xx / 5xx). Cached errors are worse than missing cache.
- Don't auto-refresh on every paste. If the same `(asin, geo)` was fetched in the last 1 hour, default to "keep cached" without asking — use refresh only when the user explicitly says so or many hours have passed.
- Don't strip the URL noise on parse — capture the source URL into the cache file's `_meta.source_url` if it was a URL paste, in case we want to surface the original Amazon link later.
- Don't fail the whole batch on one ASIN error. Fetch the rest, surface failures at the end with their error codes.

---

## v0.1.6 — Project tracker maintenance

After Step 7 (or whichever step is the last in the run), this skill **upserts a project entry** into `brain.projects[]` per `(asin, geo)` newly tracked and re-emits the cockpit on the Projects tab.

### Per-ASIN project upsert

For each ASIN newly tracked (skip if already in `brain.projects[]` matching purpose `"Track product"`):

```
{
  "id":          "proj_{asin}_track_001",      // increment seq if multiple track-only projects for same ASIN
  "name":        "Tracking {brand} {asin}",
  "purpose":     "Track product",
  "asin":        "{asin}",
  "status":      "running",
  "created_at":  "<ISO 8601 now>",
  "updated_at":  "<ISO 8601 now>",
  "next_steps":  "Run optimize-listing for a fast CRO audit",
  "linked_artifacts": [],                      // no per-product artifacts emitted from this skill
  "skill_invocations": [
    { "skill": "track-products", "at": "<now>", "summary": "Cached SellerApp product details" }
  ]
}
```

If the same ASIN is already in `brain.projects[]` with `purpose: "Track product"`, **don't create a duplicate** — append to `skill_invocations` and bump `updated_at` instead.

### Cockpit refresh

After updating `brain.projects[]`:

1. Read `templates/cockpit.html`.
2. Build the substitution map per `_placeholders.md`:
   - `{{tab-projects-active}} = "active"` (the user just did work that landed in Projects)
   - `{{eyebrow}} = "Projects"`, `{{title} = "{N} projects · {N-running} running"`
   - `{{tab-projects-count}}` = new total
   - `{{section-projects-html}}` = render every entry in `brain.projects[]` per the project-row HTML pattern
   - Other tabs: keep current state in working memory, fill their section bodies with current data
3. `Write` to `./florence-cockpit.html`.
4. `update_artifact({ id: "florence-cockpit", ..., update_summary: "Tracked {N} new · {N-projects} projects" })`.

### Skip the cockpit refresh during onboard

If `track-products` was called from inside `onboard` Stage 3, **do NOT re-emit the cockpit on Projects tab** — onboarding is already managing cockpit state on the Brand tab. Skip Step 4 of this section; just update working memory. The next `onboard` cockpit emission will pick up the new project entries via the section bodies.
