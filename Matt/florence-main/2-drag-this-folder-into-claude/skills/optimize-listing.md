# `optimize-listing`

**When**
- User says: "optimize-listing <ASIN>", "give me CRO ideas for B0…", "audit my listing", "optimise my listing", "what would you change on B0…?", "fast audit on B0…"
- A `recommend-test` decision-tree path lands on "want fast ideas first?"
- User has 30 seconds of attention and wants a structured first-pass audit (not a 5–30 minute panel-poll loop)

**Inputs**
- Target ASIN (from chat, or `brain.products[*]` if user said "my listing")
- In-context brain (for `business.marketplaces` → `geo` mapping, `voice`, `goals[asin]`)
- The **Florence MCP — SellerApp** connector active in this Cowork project (16 tools available — see `integrations/sellerapp.md` for the one-time setup; Q&A endpoint deprecated in v0.1.5)
- Reference: `reference/MASTER-CRO-REFERENCE.md`, `reference/04-data-analysis/metric-to-action-framework.md`, `reference/02-visual-content/main-image-tactics-library.md`, `reference/sellerapp-api-reference.md` (for endpoint grounding)

**Tools**
- SellerApp MCP tools: `Get Product Details`, `Get Product Reviews`, `Get Rufus AI Queries`, `Keyword Research V2 (Reverse ASIN)`, `Keyword Search Result (SERP)` (and the rest of the 17 available if needed)
- Chat (intermediate progress messages between calls, then final structured audit)

**Outputs**
- A `florence-research-{asin}` artifact rendered from `templates/research.html` (the durable report)
- A `florence-product-dossier-{asin}` artifact rendered from `templates/dossier.html` linking research/concepts/tests for the ASIN
- A short chat narration of the headline finding + the "What I'd do today" line (the lead-in; the artifact is the report)
- Updated `brain.history.artifacts[asin].research` with `last_updated` + `summary` + counts
- Sign-off: `— F.`

This skill emits **two artifacts** — research + dossier. Per the artifact protocol in `0-paste-this-into-custom-instructions.txt` § *Artifact emission*, IDs are stable: `florence-research-{ASIN}` and `florence-product-dossier-{ASIN}`. First emission of an id in a conversation = `create_artifact`; subsequent = `update_artifact`. Florence consults `brain.history.artifacts[asin]` to know which it is.

---

## When to run this vs `shopper-interrogator`

| | `optimize-listing` | `shopper-interrogator` |
|---|---|---|
| Speed | ~10–30s | 5–30 minutes |
| Cost | ~88 SellerApp tokens (~free) | 100 PP respondents × 2 polls (~$50–100) |
| Confidence | Medium — SellerApp data + competitor SERP | High — real shopper polls validate objections |
| Best for | Fast first-pass audit, weekly checkup, low-stakes ASINs | Deep-dive when CVR is broken on a high-stakes ASIN |

If the user already knows CVR is the problem and wants validated objection ranking, route to `shopper-interrogator`. If they want fast ideas, run this. If they're unsure, run this first — it's cheap and may surface enough to act without the panel-poll spend.

---

## Behaviour

### Step 0 — Verify inputs

Before launching anything that costs SellerApp tokens:

1. ASIN provided. If not, ask once: "Which ASIN? Paste the B0… code."
2. ASIN looks well-formed (`B0` followed by 8 alphanumerics).
3. The Florence MCP — SellerApp tools are visible in this conversation. If you don't see tools like `Get Product Details`, the MCP isn't connected — route to `integrations/sellerapp.md` setup.

If pre-flight fails, say which check failed and offer to walk through `integrations/sellerapp.md`. Don't run partial chains.

### Step 1 — Pull product details (cache-first)

**Before calling SellerApp**, check for a fresh cache file at `brain/products/{ASIN}-{geo}.json`. If it exists and `_meta.fetched_at` is less than 24 hours old, **read the cached response and skip the SellerApp call** — saves ~14 tokens per audit. The cache is populated by `skills/track-products.md` whenever a user adds an ASIN; recent `optimize-listing` runs also write to it (Step 1.5).

If no cache or the cache is stale, call the **Get Product Details** tool with full flags:

```
asin: {ASIN}
geo: {from brain.business.marketplaces[0] mapping, or {asin}-matching brain.products[].geo if set}
fee_detail: "1"
price_detail: "1"
potential_detail: "1"
ratings: "1"
realtime_data: "1"
promotions: "1"
```

Reference: `reference/sellerapp-api-reference.md` § 1 (line 21). ~14 tokens. Returns title, brand, BSR, sales estimate, price, ratings, promotions.

### Step 1.5 — Write/refresh the cache (only when we fetched fresh)

If Step 1 hit the live SellerApp endpoint, `Write` the response to `brain/products/{ASIN}-{geo}.json` with `_meta.fetched_at` set to the current ISO 8601 timestamp. Subsequent `optimize-listing` runs in the same 24h window read this cache.

Skip Step 1.5 entirely if Step 1 read from cache.

In chat: *"Pulled the listing. {brand} – {title}. BSR #{rank}. Reading reviews next."* (mention "from cache" if cache was hit, e.g. *"Using cached listing data ({hours} h old). Reading reviews next."*).

### Step 2 — Pull reviews

Call the **Get Product Reviews** tool. Note: SellerApp's reviews API rejects `pagenumber + up_to_page` together; use `up_to_page` only. Rating filter is a single value 1-5 — for full critical sweep, call 3 times (rating=1, rating=2, rating=3). For a quick first pass, omit `rating` to get all stars.

```
asin: {ASIN}
geo: {geo}
up_to_page: 3        # 30 reviews
rating: ""           # all stars (or 1, 2, 3 separately for critical)
sort: "recent"
```

Reference: `reference/sellerapp-api-reference.md` § 5 (line 283). 30 tokens (10/page × 3). Returns review text with verbatim quotes.

If the listing is heavy on Vine reviewers (free product), critical reviews may be sparse — read the 4★ and 3★ reviews carefully for buried friction points.

### Step 3 — Pull Rufus suggested queries

Call the **Get Rufus AI Queries** tool:

```
asin: {ASIN}
geo: {geo}
```

Reference: `reference/sellerapp-api-reference.md` § 11 (line 678). 30 tokens. Returns 6–10 natural-language shopper questions.

### Step 4 — Reverse-ASIN keyword research

Call the **Keyword Research V2 (Reverse ASIN)** tool with extended details:

```
type: "asin"
key: {ASIN}
geo: {geo}
results_count: "50"
additional_details: "1"
```

Reference: `reference/sellerapp-api-reference.md` § 17 (line 998 — V2 Beta). 5 tokens. Returns top 50 keywords this ASIN is indexed for, with `impressions`, `CTR`, `CVR`, `competition_index`, `demand_momentum`.

**Fallback**: V2 sometimes returns 500 on very-new ASINs (no indexing yet). If it fails, try the **Keyword Research V1 (legacy)** tool with the same inputs minus `additional_details`. V1 returns search volume + CPC + relative score (no CTR/CVR breakdown).

If both fail, the audit can still proceed — note that keyword data is unavailable and lean harder on review/Rufus/competitor signals.

### Step 5 — SERP for top keyword (competitor lookup)

If keywords V2 returned data: pick the top 1 keyword (highest `search_volume` × highest `relative_score`).
If keywords failed: use a category-derived term (e.g. for jojoba oil → "organic jojoba oil"). The product's category breadcrumbs from Step 1 give you the term.

Call the **Keyword Search Result (SERP)** tool:

```
search: {top keyword}
geo: {geo}
extended_response: "1"
include_sponsored_results: ""
```

Reference: `reference/sellerapp-api-reference.md` § 13 (line 776). ~9 tokens (3 + 6 extended). Returns top 10–20 organic ranking products with title, image, price, rating, badge.

Identify the top 2–3 competitor ASINs (filter out the user's ASIN and any sponsored slots).

### Step 6 — Competitor product details (optional)

If the SERP results don't already give you enough (titles + prices + ratings + image_url are inline), skip this step. If you need deeper competitor info (bullets, full description, key_points), call **Get Product Details** for each of the top 2–3 competitor ASINs:

```
asin: {competitor ASIN}
geo: {geo}
```

~1 token per competitor (basic flags only). Returns title, BSR, price, ratings.

Florence now has: target product context, ~30 critical reviews, ~6 Rufus questions, top 50 keywords with metrics, competitor SERP, and 2–3 competitor product profiles.

### Step 7 — Synthesise the audit

Load three reference files into context:
- `reference/MASTER-CRO-REFERENCE.md` (the canonical playbook)
- `reference/04-data-analysis/metric-to-action-framework.md` (for the diagnosis taxonomy + 40/30/15/15 scoring)
- `reference/02-visual-content/main-image-tactics-library.md` (for the 52 tactics Florence cites by number)

Apply the metric-to-action quadrant matrix to each underperforming keyword from Step 4:
- Low CTR + decent CVR → main image / SERP-stop work
- Decent CTR + low CVR → listing PDP / objection work
- Low both → full audit, start with objections

Cluster the ~30 reviews + 6 Rufus questions into **3–5 distinct objections** (group by theme — durability, fit, instructions, value, packaging — whatever the data actually says, don't impose a template).

Compare target ASIN's title / price / image hint against the top 2–3 competitors. Identify 1–2 angle gaps the target listing doesn't cover.

### Step 8 — Emit the research artifact

This is the user-facing deliverable. Skip the giant chat dump — render `templates/research.html` instead.

1. Read `templates/research.html` from Project Knowledge.
2. Strip the leading `<!-- TEMPLATE — substitute {{placeholders}} ... -->` doc-comment.
3. Build the substitution map per `templates/_placeholders.md` § `research.html`:
   - `{{brand}}`, `{{asin}}`, `{{geo}}`, `{{product-title}}`, `{{product-image-url}}` from Step 1's response
   - `{{lede-html}}` — one-paragraph diagnosis (e.g. *"Sales held flat. **The fix is the main image — three reviews this month flag 'doesn't look like the photo.'**"*)
   - `{{customer-html}}` — paragraph(s) describing the buyer based on review demographics + Rufus question framing
   - `{{drivers-html}}` — top 3-5 reasons people buy (from positive review themes + Keyword Research search-volume terms), each as a `<div class="driver">` row
   - `{{objections-html}}` — top 3-5 objections from your Step 7 clustering, each as a `<div class="objection">` row with verbatim quote
   - `{{competitors-html}}` — `<div class="competitor">` cards for the top 3 SERP results
   - `{{must-show-html}}` — 3-5 numbered must-show items, each citing the source objection / driver / competitor gap
   - `{{footer-msg-html}}` — `<strong>What I'd do today:</strong> {action}. <em>Score {N}/100.</em>`
   - `{{sources}}` — `Reviews · Rufus · SERP · KW Research V2` (or whatever combination ran)
4. `Write` the substituted HTML to `./florence-research-{ASIN}.html`.
5. **First emission** of `florence-research-{ASIN}` in this conversation: `create_artifact({ id: "florence-research-{ASIN}", html_path: "./florence-research-{ASIN}.html", description: "Florence — Research: {brand} {ASIN}" })`. Check `brain.history.artifacts[asin].research` — if non-null, the artifact already exists, use `update_artifact` instead with `update_summary: "Refreshed · {drivers_count} drivers · {objections_count} objections"`.
6. Update `brain.history.artifacts[asin].research` with `last_updated` (ISO 8601 now), `summary` (the lede), and the four counts.

### Step 9 — Emit the dossier artifact

The dossier is the per-product index. Re-emit it after every research/concepts/tests update so the user always has one card per product showing latest state.

1. Read `templates/dossier.html` from Project Knowledge.
2. Strip the leading doc-comment.
3. Substitute per `templates/_placeholders.md` § `dossier.html`:
   - `{{brand}}`, `{{asin}}`, `{{geo}}`, `{{product-title}}`, `{{product-image-url}}` from Step 1
   - `{{stats-html}}` — Price / BSR / Rating / Reviews as `<div class="head-stat">` rows
   - `{{goal-html}}` — `brain.goals[asin]` if set, otherwise empty-state stub
   - `{{research-link-html}}` — filled card linking the research artifact you just emitted (use the link card filled HTML from `_placeholders.md`)
   - `{{concepts-link-html}}` — empty stub (`optimize-listing` doesn't render concepts; will become a filled card after `render` runs for this ASIN)
   - `{{tests-link-html}}` — same; empty stub unless `brain.history.artifacts[asin].tests` exists
   - `{{timeline-html}}` — list the most recent 5-8 events for this product from `brain.history.artifacts[asin]` (research/concepts/tests `last_updated` fields). At minimum, "Research updated · just now."
   - `{{footer-msg-html}}` — `<strong>Latest:</strong> {summary}. <em>{next-step}</em>` (e.g. *"Latest: 3 objections clustered. Run render to propose image fixes."*)
4. `Write` to `./florence-product-dossier-{ASIN}.html`.
5. `create_artifact` if first time, `update_artifact` if `brain.history.artifacts[asin].dossier` exists, with `update_summary: "Research refreshed · {summary}"`.
6. Update `brain.history.artifacts[asin].dossier.last_updated`.

### Step 10 — Narrate the headline in chat

Chat is the lead-in, the artifact is the report. **Don't dump the full audit into chat.** Instead, write a tight 4-6 line narration:

```
{Brand} {ASIN} — opened the research artifact (right panel).

**Top objection:** {one phrase}. {N}/{total} reviews mention this. Verbatim: "{quote}"

**Lever to pull:** {single concrete change} — score {N}/100, F=… I=… C=… R=…

**What I'd do today:** {single specific action, plain language}.

Open `florence-research-{ASIN}` for the full picture (drivers / competitors / what visuals must show). `florence-product-dossier-{ASIN}` is your index for this product.

Total cost: ~88 SellerApp tokens.

— F.
```

If the data doesn't support 3 strong actions, write 1–2 honestly in the artifact and reflect that in chat. If keyword data is too thin (<10 keywords with impressions ≥100), say so and suggest re-running after the listing accumulates more search-term traffic.

If the seller wants validated objection rank rather than a fast first-pass, route to `shopper-interrogator` at the bottom: *"Want me to validate these objections with a 100-shopper Pinion Ask? Run shopper-interrogator."*

---

## Voice rules

- **Verbatim wherever possible** — review quotes are the asset. Don't paraphrase.
- **Cite the file behind every recommendation** — `reference/02-visual-content/main-image-tactics-library.md tactic #14` is way more useful than "use a packaging shot".
- **Score every action** — 40/30/15/15 with the F/I/C/R axes spelled out. Per `0-paste-this-into-custom-instructions.txt` voice rules.
- **One action per `What I'd do today`** — specific (ASIN, change, expected lift if available, axis score). Not "improve the listing".
- **Don't promise lift numbers** — cite calibration ranges from `reference/05-productpinion/case-studies.md`, not absolutes.

---

## Don't

- Don't run `optimize-listing` without verifying all 5 SellerApp webhooks are wired. Partial chains produce misleading audits.
- Don't fabricate review quotes. If `Get Product Reviews` returned thin text, surface that and offer to widen to 5 pages or sweep all 5 ratings.
- Don't recommend a price test from this skill — route to `recommend-test` for Van Westendorp methodology.
- Don't call `shopper-interrogator` automatically as a follow-up. Offer it; let the user say yes.
- Don't run this on competitor ASINs the user doesn't own (the Reviews and Rufus calls work on any public ASIN, but the recommendations only make sense for the user's listings).
- Don't skip the file citations. Florence's grounding rule: every recommendation traces to a specific reference file.

---

## v0.1.6 — Project tracker maintenance

After Step 9 (dossier emission), this skill **upserts a project entry** into `brain.projects[]` and re-emits the cockpit on the Projects tab.

### Per-ASIN project upsert

```
{
  "id":          "proj_{asin}_audit_{seq}",   // seq increments per (asin, "audit") pair
  "name":        "CRO audit on {brand} {asin}",
  "purpose":     "CRO audit",
  "asin":        "{asin}",
  "status":      "complete",                    // research is fast; one-shot, not multi-stage
  "created_at":  "<now>",
  "updated_at":  "<now>",
  "next_steps":  "{from chat narration top action — e.g. 'Run render to mock up the no-grease angle for B07X'}",
  "linked_artifacts": [
    { "kind": "research", "artifact_id": "florence-research-{asin}", "last_updated": "<now>" },
    { "kind": "dossier",  "artifact_id": "florence-product-dossier-{asin}", "last_updated": "<now>" }
  ],
  "skill_invocations": [
    { "skill": "optimize-listing", "at": "<now>", "summary": "Audit complete — {top objection in one phrase} · {N} actions ranked" }
  ]
}
```

If a project with `purpose: "CRO audit"` already exists for this ASIN, **append to `skill_invocations`** and refresh `linked_artifacts.last_updated` + `next_steps` + `updated_at`. Don't create a duplicate. The seq increments only when the user explicitly wants a separate audit thread (e.g. quarterly re-audit).

### Cockpit refresh

After upsert:

1. Read `templates/cockpit.html`.
2. Substitute per `_placeholders.md`:
   - `{{tab-projects-active}} = "active"`
   - `{{eyebrow}} = "Projects"`, `{{title}} = "{brand} {asin} — audit complete"`
   - `{{tab-projects-count}}` = total
   - `{{section-projects-html}}` per the project-row HTML pattern
   - Other tabs: keep working-memory state
3. `Write` + `update_artifact({ id: "florence-cockpit", ..., update_summary: "Audit logged · {N} projects" })`.

### Chat narration update

The Step 10 chat narration should add a final line pointing at the cockpit:

> Logged as a project (`{name}`). Open the Projects tab on the cockpit for the index.

Don't repeat the full audit in chat — the artifact + dossier already carry it; the project tracker is the meta-index.

---

## v0.1.7 — Hand-off to the Higgsfield workflow

After the audit lands and the project tracker logs it, Florence offers a structured hand-off into the Higgsfield render workflow. Three workflow paths, picked by what the audit's #1 action is:

| Audit recommends | Higgsfield workflow | Methodology ref |
|---|---|---|
| Main image change (CTR fix) | `render main image for {asin}` | `reference/02-visual-content/main-image-creative-director.md` (1:1, 8 techniques, 13-step flow) |
| Listing slot 2-7 redesign (CVR fix) | `render listing slot {N} for {asin}` | `reference/02-visual-content/listing-image-creative-director.md` (1:1, 5-spinoff, 13-step flow) |
| A+ rebuild (CVR / page narrative fix) | `render A+ module for {asin}` | `reference/02-visual-content/aplus-creative-director.md` (16:9, 4 Critical Rules + 5-question checklist, 13-step flow) |

The audit's chat narration (Step 10) should name the matching workflow path and offer to launch it:

> **What I'd do today:** {top action}. Run `render {workflow}` for {asin} when you're ready — that fires the 13-step canonical flow, including the Pinion test loop tail.

**Don't auto-launch render.** The user confirms; this skill stops at the hand-off offer. The workflow integrity (research → hypothesis → user review → render → present → Pinion → results → iterate) depends on user confirmation between the audit and the render run.
