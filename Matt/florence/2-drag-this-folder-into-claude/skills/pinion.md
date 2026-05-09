# `pinion`

**When**
- User says: `pinion`, "launch a poll", "run a Pinion test", "test these images", "ask shoppers", "validate this objection", "let's split test", "what did past polls say about…?", "video shoppers reacting"
- After `optimize-listing` surfaces a high-leverage action and confidence is below 80% → Florence offers `pinion` to validate before shipping
- After `track-products` when the user wants to test a listing variation
- After `recommend-test` lands on a specific PP test method — `pinion` is how Florence actually runs it

**Inputs**
- A clear question to test (image variant choice / title clarity / price sensitivity / objection ranking / first-impression / etc.)
- Target ASIN(s) or URL(s)
- In-context brain (for `business.marketplaces[0]` → audience country, voice rules, prior tests in `brain.history.tests`)
- The **ProductPinion MCP** connector active in this Cowork project — see `integrations/product-pinion.md` for the one-time setup

**Tools**
- ProductPinion MCP tools (exact names depend on PP's runtime manifest — Florence checks `tools/list` first, common shapes documented in `reference/05-productpinion/mcp-contract.md`):
  - **Launch** — Pinion Ask, Pinion Polls (Image Split / Text Split / Stacked Image / SERP Simulation / Ranked), Pinion Videos (Any URL / Amazon Search Mockup), with templates
  - **Query** — list past tests, get test details, get poll stats / submissions, get video transcripts
  - **Audience** — list / create / use Custom Audiences
  - **Manage** — stop a test, top up a live test, duplicate excluding prior respondents
- SellerApp MCP tools (only if the user hasn't already provided images / titles to test — Florence pulls from `Get Product Details`)
- Reference: `reference/05-productpinion/knowledge-base.md` (canonical product surface), `mcp-contract.md` (tool taxonomy), `case-studies.md` (calibration data — what's lifted in past tests), `reference/03-testing-methodology/decision-tree.md` (test selection logic)

**Outputs**
- One PP test launched, `test_id` captured to `brain.history.tests[]` so future skills can reference it
- A `florence-tests-{asin}` artifact rendered from `templates/tests.html` — initially with `status: running`, updated to `status: complete` when results land. Verdict + verbatim quotes + recommendation render inline.
- A refreshed `florence-product-dossier-{asin}` artifact (since this test changes the dossier's "Tests" link card)
- Brief confirmation card in chat (test type, audience, sample, ETA, credit cost) — but the durable record lives in the artifact
- Updated `brain.history.artifacts[asin].tests` with `last_updated`, `tests_count`, `running_count`, `complete_count`, summary
- Always: a citation to `reference/05-productpinion/case-studies.md` for calibration ("similar tests have lifted CTR 8–12%")

This skill is the **lightweight one-off path**. For the full Shopper Interrogator chain (review-mining → Rufus → Pinion Ask → synthesis → Pinion Ranked Test → image blueprint), use `shopper-interrogator` — that orchestrates n8n for the heavy synthesis steps. `pinion` is for direct single tests.

---

## When to run this vs `shopper-interrogator`

| | `pinion` | `shopper-interrogator` |
|---|---|---|
| Scope | One PP test, one question | Full CVR objection-mining chain |
| Steps | 1 PP launch (+ results retrieval) | 6 chained workflows (review + Rufus + 2 PP polls + synthesis + image blueprint) |
| Speed | ~15 min for first results | 5–30 min wall-clock; 2–48 hr if polls aren't pre-launched |
| Cost | 100 respondents × 1 poll (~$30–50) | 100 respondents × 2 polls (~$50–100) + Anthropic synthesis |
| Best for | Single hypothesis already framed; cheap retest; price sensitivity | "Why isn't this listing converting?" cold start |
| MCP-native | ✅ direct via PP MCP | ⚠️ workshop demo runs through n8n; MCP fallback if n8n missing |

If you already know the question and the variants, run `pinion`. If you only know "CVR is bad," run `shopper-interrogator` first.

---

## Behaviour

### Step 0 — Verify inputs

Before spending PP credits:

1. The PP MCP tools are visible in this conversation. If you don't see launch / query tools, the MCP isn't connected — route to `integrations/product-pinion.md` setup. Don't try to fall back; PP is the validation layer.
2. The user has a clear, single question to test — *not* "what should I test?" (that's `recommend-test`'s job).
3. The user has named target ASIN(s) or provided variants. If not, ask once.
4. Token / credit budget. PP costs real money per respondent — confirm if the cost looks high (>$100 estimated) before launching.

### Step 1 — Pick the right PP test family

Match the question to one of three families per `reference/05-productpinion/knowledge-base.md`:

| If the question is… | Family | Why |
|---|---|---|
| "Which of these images / titles wins?" (CTR or CVR) | **Pinion Poll** | Side-by-side comparison with reasoning |
| "Why aren't shoppers buying?" / "What's the friction?" / "Which objection matters most?" | **Pinion Ask** (Short Answer or Multiple Answer) for open mining, then Ranked Poll | Open mining first, ranking second |
| "What price feels right?" / "What's the willingness-to-pay band?" | **Pinion Ask** (Price Sensitivity) | Van Westendorp method built in |
| "What does a shopper actually do on this listing?" / "Where do they get stuck?" | **Pinion Video** | Real-time reaction, transcripts |
| "How does our SERP slot read vs competitors?" | **Pinion Poll** (Amazon Search Simulation) **or** **Pinion Video** (Competitor Research template) | Poll for quantitative; video for qualitative depth |
| "Validate this single objection" | **Pinion Ask** (Single or Multiple Answer) | Cheapest path |

Communicate the choice in chat in one line: *"For 'which of these 3 main images stops the scroll?' → Pinion Poll, Image Split Test, 100 shoppers, ~15 min."*

### Step 2 — Pick a template if one fits

If the question matches a pre-defined template from `knowledge-base.md`, prefer it — it bakes in PP's methodology (sample size, question framing, audience defaults).

The 17 Pinion Poll templates and 5 Pinion Video templates are listed in `reference/05-productpinion/knowledge-base.md`. The high-frequency picks for CRO work:

- **CTR work:**
  - `Tilted Image Test` / `Human Element Test` / `Open Package Test` / `Sunspot Packaging Test` — main-image variants
  - `Speed Bump Title Test` / `Shorter Title Test` — title variants
  - `Popular Pick Test` — competitor research
  - `Coupon vs Sale Test` — price perception
- **CVR work:**
  - `Benefit Bingo Test` — which benefits matter most
  - `Sequenced Benefit Test` — infographic ordering
  - `Page Content Test` — A+ variations
  - `Golden Guarantee Test` — risk-reduction language
  - `Objection Test` (Pinion Video) — direct "why aren't you buying?"
  - `Listing Optimization Test` (Pinion Video) — broad PDP feedback

If no template fits, build from scratch — pick the underlying poll/video type and configure manually.

### Step 3 — Frame the question + options

Florence drafts the test setup. Apply Matt Kostan's question-framing rules (`reference/03-testing-methodology/question-framing.md`):

- Single, simple question — no compound asks
- Don't reveal which answer is "yours" (asking *"would you buy version A or B?"* is fine, but the AI shouldn't hint)
- For open-ended (Pinion Ask Short Answer), pose the question how a real shopper would understand it — no jargon, no brand-speak

For polls with images: use SellerApp's `Get Product Details` to pull the current main image as the control, plus whatever variants the user supplies. If the user only has hypothesis images mentally ("test the human-element version"), Florence flags that real images need to be uploaded first via `upload_image` (or the equivalent PP MCP tool) before the poll can launch.

### Step 4 — Audience + sample size

Default audience per the brain:

- **Country** = `brain.business.marketplaces[0]` mapped to country code (`amazon.co.uk` → UK, `amazon.com` → US)
- **Standard demographics** = leave open unless the product category is gendered (e.g., maternity → female only) or age-banded (e.g., baby products → 25–44 with `Family > Has Children` advanced targeting)
- **Custom Audiences**: if `brain.audiences` lists a saved audience matching the product, use it. Otherwise broad — `Fastest Available Shoppers`.
- **Exclude prior respondents**: if this is a retest of an earlier test in `brain.history.tests`, default to excluding prior respondents on the matching test_id

Sample-size defaults (per `knowledge-base.md`):

| Test type | Sample |
|---|---|
| Pinion Ask | 100 |
| Pinion Poll, 2 options | 100 |
| Pinion Poll, 3–5 options | 50/option × N |
| Stacked Image | 100 |
| Pinion Video | 5–10 (transcripts are dense) |
| Custom Audience tests | 500+ (qualifier filtering) |

Surface estimated cost in chat before launching: *"100 shoppers × Pinion Poll Image Split = roughly 100 PP credits, ~$30 at standard PP credit cost. Confirm? (yes / change audience / change sample size / cancel)"*.

### Step 4.5 — Visual verification gate for images (v0.1.13 — NON-NEGOTIABLE for image polls)

**Florence does NOT spend ProductPinion credits on un-verified images.** If the test type is Image Split, Stacked Image, or SERP Simulation (anything that uploads images to PP):

1. **For each image** in the test set, load it into Florence's multimodal context (paste URL in chat — Cowork loads natively). Florence narrates: *"Verifying image #{N} ({label}) before launch."*
2. **Visually inspect each image** against:
   - Aspect ratio matches Amazon's expected slot (1:1 for main image / listing tests, 16:9 for A+ tests)
   - Right product (matches the ASIN — same brand, packaging, key features)
   - No corrupt rendering / partial generation / wrong colours
   - Text legibility (if any text overlay)
   - No artifacts, no glitches, no misspellings, no hallucinated UI
   - For A/B comparisons: each variant is meaningfully different (a Pinion test of two near-identical images wastes credits)
3. **If any image fails** → STOP. Do not launch. Florence reports: *"Image #{N} fails verification — {specific reason}. Pinion credits would be wasted on this. Options: re-render via `render` skill (with the fix), upload a different image, or skip this variant."*
4. **Only after ALL images pass** → proceed to Step 5 (confirm + launch).

This gate is BLOCKING. The cost of one extra `render` cycle (~30 sec, low Higgsfield credit) is dramatically lower than the cost of a Pinion test on broken images (~$30+, plus the lost time + lost confidence in the result).

### Step 5 — Confirm and launch

**Always confirm before launching.** PP credits are real money. Reply with the test summary:

> Launching: **Pinion Poll · Image Split Test** on B07XYZ4231
>
> **Question:** Which image makes you most likely to click on this product?
>
> **Options:** Current main image · Tilted variant · Human Element variant
>
> **Audience:** UK, Fastest Available, 100 shoppers
>
> **Cost:** ~100 PP credits (~$30)
>
> **ETA:** First results ~5 min, complete ~15 min
>
> Confirm? (yes / change anything / cancel)

On `yes`: call the matching PP MCP launch tool. Capture the returned `test_id` to `brain.history.tests[]` with `{ test_id, type, asin, question, launched_at }`.

Then **emit the tests artifact in `running` state** (Step 5.5 below — first emission of `florence-tests-{asin}` shows the test queued so the user has a durable record before results arrive). Reply with the test_id, the ETA, and the artifact link: *"Test launched · `test_id: pp_xxx`. See `florence-tests-{asin}` in the right panel — I'll update it when results land. Or ask `pinion results pp_xxx` to check now."*

### Step 5.5 — Emit `florence-tests-{asin}` (running state)

1. Read `templates/tests.html`, strip the leading doc-comment.
2. Substitute per `templates/_placeholders.md` § `tests.html`. The single test block uses `status: running`, the verdict region shows the test name + question + sample size + ETA in the headline (no winner yet — use a placeholder image like the control image with `Pending` overlay), the recommendation block reads "Awaiting results — Florence will update this artifact when the panel completes."
3. `Write` to `./florence-tests-{asin}.html`.
4. `create_artifact({ id: "florence-tests-{asin}", html_path: "./florence-tests-{asin}.html", description: "Florence — Tests: {brand} {asin}" })` if `brain.history.artifacts[asin].tests` is null; else `update_artifact` with `update_summary: "Test launched · running · {test-name}"`.
5. Update `brain.history.artifacts[asin].tests`: increment `tests_count` and `running_count`.
6. Re-emit `florence-product-dossier-{asin}` so its Tests link card flips from empty stub to filled.

### Step 6 — Retrieve + synthesise results

When the user comes back asking "what did the poll say?" / "pinion results":

1. Call PP MCP `get_poll_stats` (or video equivalent) for the test
2. If `processingStatus` not done yet, surface the ETA + offer to check again later
3. When done, pull `get_poll_submissions` for the verbatim "why" text
4. Synthesise in Florence's voice:
   - **Headline finding** in one line — the winner, by what margin, at what confidence
   - **Top 3 verbatim shopper quotes** — both winners and losers, so the user reads the why
   - **Calibration** — "similar tests in `case-studies.md` have lifted CTR 8–12%; this one's confidence interval suggests a likely 6–10% lift if shipped"
   - **One next action**, scored 40/30/15/15, ending with `What I'd do today: …`

5. **Update the tests artifact** to `status: complete`. Re-render `templates/tests.html` with the winner image, verdict-headline, sample/confidence/lift stats, top-3 quotes, and the recommendation block. `Write` to `./florence-tests-{asin}.html`. Call `update_artifact` with `update_summary: "Results in · {winner} won at {confidence}% · lift {lift}"`.

6. **Update brain**: decrement `running_count`, increment `complete_count`, refresh `summary` (e.g. *"Concept #3 won at 76% confidence"*), update `last_updated`.

7. **Re-emit dossier** so the timeline shows the result and the Tests link card summary updates.

8. **Narrate in chat** — short. The headline + verbatim top quote + the link to the artifact + "What I'd do today." Don't repeat the full verdict; that lives in the artifact.

If the result is in the 60-69% confidence "stuck zone": offer to top up the same poll with 50 more respondents (cheaper than relaunching, per `knowledge-base.md`).

### Step 7 — Sub-command: query past tests

`pinion history` or `pinion past <keyword>` — Florence calls PP MCP list/search tools, returns past tests filtered by keyword/date/country. Useful when:

- The user wants to know "what's worked on similar listings before"
- Florence wants calibration data for a recommendation ("we've run 12 main-image polls; the variants that lifted CTR most were the Human Element + Open Package types")
- Auditing test cadence ("you haven't tested this ASIN in 8 months — worth retesting?")

Surface results in a compact table with test_id, date, ASIN/topic, headline result, link to launch a similar test.

---

## Voice rules

- **One question per test.** PP works because shoppers answer one thing carefully. If the user wants "test image AND title AND price" — Florence pushes back and runs sequenced tests, each with one variable.
- **Verbatim quotes always.** Aggregate counts mean nothing without the "why" text. Pull at least 3 verbatim "why" responses per option.
- **Cite case studies.** For every recommendation Florence makes from poll results, point at the matching case study in `reference/05-productpinion/case-studies.md`.
- **Confidence honesty.** PP returns confidence intervals. Don't promise "this will lift X%" — say *"the panel scored option B 87/100 at 92% confidence; similar wins in our calibration set lifted CTR 8–12%."*
- **Never auto-launch.** Always confirm cost + audience before spending PP credits.

---

## Don't

- Don't run `pinion` if the PP MCP isn't connected. Route to `integrations/product-pinion.md` setup. Don't fall back to "describe what I would test" — that's not Florence's job.
- Don't auto-retry failed launches. If `create_poll` returns 422 or similar, surface the error verbatim and offer to fix.
- Don't compound questions. *"Which image AND which title AND which price?"* is three separate tests, run sequentially.
- Don't fabricate poll results. If the test hasn't filled, say so and offer to wait.
- Don't recommend `pinion` for low-stakes / reversible changes — just ship those. PP is for high-confidence validation when the change is expensive to revert (a designer's hours, a launch decision, a new SKU).
- Don't strip the verbatim "why" text on synthesis. Aggregate numbers without quotes is half the value.
- Don't fire `pinion` while a related test is still in flight on the same ASIN — duplicates dilute. Check `brain.history.tests[]` first; offer to wait or top up.
- Don't run on competitor-only ASINs the user doesn't own — PP works on any URL, but recommendations need to map to listings the user can actually change.

---

## v0.1.6 — Project tracker maintenance

After Step 5.5 (running-state tests artifact emission), this skill **upserts a project entry** into `brain.projects[]` and re-emits the cockpit on the Projects tab. Then in Step 6 (when results come in), it updates the project to `complete`.

### Per-ASIN project upsert (on launch)

```
{
  "id":          "proj_{asin}_{test-kind-slug}_{seq}",  // test-kind-slug: image_split | objection_test | price_test | etc.
  "name":        "{Test name} for {brand} {asin}",
  "purpose":     "{Test kind} via Pinion",
  "asin":        "{asin}",
  "status":      "running",                              // test live
  "created_at":  "<now>",
  "updated_at":  "<now>",
  "next_steps":  "Wait for results (~{ETA}). Type `pinion results {test_id}` to check.",
  "linked_artifacts": [
    { "kind": "tests",   "artifact_id": "florence-tests-{asin}", "last_updated": "<now>" },
    { "kind": "dossier", "artifact_id": "florence-product-dossier-{asin}", "last_updated": "<now>" }
  ],
  "skill_invocations": [
    { "skill": "pinion", "at": "<now>", "summary": "Launched {test_kind} · {sample_size} respondents · cost ~{cost}" }
  ]
}
```

If a project already exists for this ASIN with a related purpose (e.g. `"Main image concepts"` from a prior `render` run), **link this test to the existing project** instead of creating a new one — append to `skill_invocations` and `linked_artifacts`. The user is testing the concepts they just rendered; one project, multiple skill stages.

### On test results (Step 6)

When the test completes (Florence pulls results):

- Update `status` to `complete` if winner is decisive (≥75% confidence) or `running` (still in stuck zone) — match the chat narration.
- Append to `skill_invocations`: `{ skill: "pinion results", at: "<now>", summary: "Results: {winner} won at {confidence}% · lift {lift}" }`.
- Update `next_steps` to the recommendation: e.g. *"Ship Concept #3 — winner at 82% confidence. Brief designer for production polish."* or *"Topup with 50 more respondents (stuck zone)."*

### Cockpit refresh

After upsert (both launch and results stages): same pattern — read `templates/cockpit.html`, `{{tab-projects-active}} = "active"`, build `{{section-projects-html}}` from `brain.projects[]`, fill other tabs with working-memory state, `Write`, `update_artifact({ id: "florence-cockpit", ..., update_summary: "Test launched · {N} projects" })` (or `Test complete · winner #{N}` on results).

### Chat narration update

The launch confirmation message ends with:

> Logged as a project (`{name}`). Open the Projects tab on the cockpit to see all your active CRO work — I'll bump this when results land.

The results narration ends with:

> Project `{id}` flipped to {status}. Open the Projects tab.
