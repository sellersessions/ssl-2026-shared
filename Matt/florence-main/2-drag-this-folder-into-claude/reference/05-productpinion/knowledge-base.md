# ProductPinion Knowledge Base (verbatim mirror)

Source: <https://productpinion.helpscoutdocs.com> · Compiled: 2026-05-07

This file is the canonical reference for ProductPinion's product surface — the test types Florence can launch via `pinion`, the question types inside Pinion Ask, the templates inside Pinion Polls and Pinion Videos, audience targeting, and account management. Florence cites this file when recommending which PP test to run for a given CTR or CVR diagnosis.

When Matt's 2026-05-05 interview (`reference/_source/matt-2026-05-05-interview.md`) and this published doc disagree, the published doc wins for product surface questions; Matt's interview wins for **methodology** (test sequencing, sample-size logic, calibration ranges).

---

## Core capability — three test families

| Family | What it does | When Florence picks it |
|---|---|---|
| **Pinion Ask** | Survey shoppers with one or more questions (8 question types). Fastest, cheapest. | Validate a single objection, gather price sensitivity, find out brand perception, gauge campaign performance |
| **Pinion Polls** | Show shoppers 2–7 options (images, text, full SERP simulations) and have them pick. Quantitative + qualitative ("why this one?"). | Compare main-image variants (CTR), rank objections (CVR), test title/copy variants, simulate a SERP |
| **Pinion Videos** | Record real shoppers reacting to a URL or simulated SERP, answering up to 3 questions out loud. | Listing optimization deep-dives, objection-hunting, competitor-research walk-throughs, usability gaps |

---

## Pinion Ask — 8 question types

| Type | Description | Florence uses for |
|---|---|---|
| **Short Answer** | Brief open-ended response | Objection validation, free-text "why didn't you buy?" |
| **Single Answer** | Pick one from a list | Choice between 2–5 framings |
| **Multiple Answer** | Pick several from a list | Multi-objection validation |
| **Dropdown** | Compact scrollable list | Long option lists (categories, etc.) |
| **Price** | User inputs / selects price | Direct willingness-to-pay |
| **3 Second Test** | Image shown for 3 sec, then quick reaction | Main image stop-power (CTR) |
| **Listing Battle** | 2–3 listings side by side, pick favourite | SERP-level CTR comparison |
| **Price Sensitivity** | Multiple price points → which feels right | Van Westendorp pricing ladder |

**Price Sensitivity decoder:**
- **PMC (Point of Marginal Cheapness):** lowest price before customers doubt quality
- **PME (Point of Marginal Expensiveness):** highest before they feel overpriced
- **OPP (Optimal Price Point):** what most consider fair
- **IPP (Indifference Price Point):** evenly split between "too cheap" and "too expensive"
- **Acceptable Price Range:** band between PMC and PME

---

## Pinion Polls — 5 poll types

| Type | Format | Florence uses for |
|---|---|---|
| **Image Split Test** | Up to 5 image options | Main image variants (CTR) |
| **Text Split Test** | Up to 5 text variations | Title / bullet / ad copy variants (CTR or CVR) |
| **Stacked Image Test** | Up to 7 image galleries | Full image-stack comparisons (CVR) |
| **Amazon Search Simulation** | Mimic real SERP — adjust images, titles, prices | SERP-level CTR with full context |
| **Ranked Test** | 3–6 options ranked in order | Objection ranking, feature priority |

### 17 Pre-defined Pinion Poll templates

Florence picks the matching template when the diagnosis is unambiguous — saves the seller time and ensures methodology consistency.

| Template | Use case | Maps to flow |
|---|---|---|
| **Tilted Image Test** | Test a tilted/angled main image variation | CTR-1 |
| **Human Element Test** | Main image with a person (use white clothing) | CTR-1 |
| **Popular Pick Test** | Find which competitor is getting clicks and why | CTR-1 + CVR-7 |
| **Back Packaging Test** | Add retail-ready packaging to background | CTR-1 |
| **Keyphrase Test™** | Main image with visible keyphrase | CTR-1 + CTR-2 |
| **Open Package Test** | Main image with product opened | CTR-1 |
| **Sequenced Benefit Test™** | Infographic numbering benefits in sequence | CVR-6 |
| **Sunspot Packaging Test™** | Full solid-colour or darker package variation | CTR-1 |
| **Emoji Bullet Test** | Images with/without emojis in bullets | CVR-5 |
| **Benefit Bingo Test™** | Identify which top 3-5 benefits matter most | CVR-2, CVR-5 |
| **Perfect Insert Test™** | Variations of packaging inserts with offers | post-purchase / repurchase |
| **Page Content Test** | A+ content screenshot variations | CVR-6 |
| **Speed Bump Title Test™** | Add unique word to front of title to stop scroll | CTR-2 |
| **Shorter Title Test** | Title under 100 characters vs current | CTR-2 |
| **Brand Name Test** | Compare simple, memorable brand names | pre-launch |
| **Golden Guarantee Test™** | Variations of named zero-risk guarantee | CVR-1 (objection: trust) |
| **Coupon vs. Sale Test** | Price variations via SERP simulation | CTR-7 + price testing |

---

## Pinion Videos — 2 test types + 5 templates

### Test types

| Type | What gets recorded | Florence uses for |
|---|---|---|
| **Any URL** | Shopper viewing any URL (Amazon, competitor, Shopify, public Drive/Dropbox) answering up to 3 questions out loud | Real-shopper PDP review, competitor walk-through |
| **Amazon Search Mockup** | Shopper viewing a SERP simulation Florence configures | Pre-launch SERP test, A/B context |

### Pre-defined templates

| Template | Purpose |
|---|---|
| **Competitor Research Test** | Shopper sees real Amazon SERP for your main keyword. Reveals which competitors get attention and why. |
| **Objection Test** | Direct: why aren't shoppers buying? What needs fixing? |
| **Listing Optimization Test** | Where is the listing unclear / what's missing — generates ideas for split testing |
| **Product Development** | Validate a product idea via shared images (Drive/Dropbox link) |
| **Start from Scratch** | Custom test setup |

---

## Audience targeting

### Standard demographics (every test)

Sex · Household Income · Age · Amazon Shopping Behaviour · Country · Language

### Advanced Targeting

One detailed category per test, no extra cost. Categories: **Beliefs, Education, Family, Finance, Geographic, Health, Lifestyle, Personal, Politics, Shopping, Technology, Work**. Combine with Standard Demographics for tighter filtering.

### Custom Audience

Build a reusable audience with name + size + standard demographics + a qualifier question (e.g. *"What's your favourite animal?"* — multi-option, doesn't reveal which answers qualify).

- ProductPinion recommends 500+ shoppers per Custom Audience for enough qualified responses
- Each survey uses one Pinion Poll credit even if the shopper doesn't qualify
- More can be added later

### Exclude Previous Respondents

Available on Pinion Ask, Polls, Videos. Search prior tests by keyword and exclude their respondents to keep results fresh on retests.

---

## Sample size guidance (from this doc + Matt's interview)

| Test type | Recommended sample | Notes |
|---|---|---|
| Pinion Ask | 100+ | More accurate insights at 100; 0 = test only for own audience |
| Pinion Poll (2 options) | 100 | Standard; Matt says 50 per option for balanced feedback |
| Pinion Poll (3-5 options) | 50/option × N | 250 for 5 options |
| Stacked Image (galleries) | 100+ | Galleries are higher cognitive load |
| Custom audience tests | 500+ | Account for qualifier-question filtering |

---

## Test management

### Stop a test

`Previous Tests` → select test → `Stop Test`. Unused credits refund automatically. In-flight responses (already accepted) finish and count.

### Replace a poll / video

Gear icon → `Report Response`. Credit refunds. `Add More Results` to spend the refunded credit on a fresh response.

### Add more results to a live test

`Add More Results` from the test page. Useful for the 60-69% confidence zone — top up rather than relaunch.

### Stuck-zone fix

If results sit between 60-69% confidence: add 50 more respondents to the same poll (same audience config) instead of starting over. Cheaper, faster.

---

## MCP integration (the path Florence uses)

ProductPinion ships an MCP server you connect to Claude / Cowork. Once connected, Florence can launch tests, query past results, and pull poll data without the seller leaving chat.

| Field | Value |
|---|---|
| **MCP Server URL** | `https://api.productpinion.com/mcp` |
| **Client ID** | `B5f2zdcwuw2tEsKZZrwWvEcXF1R94l9y` (workshop-shared) |
| **Auth flow** | OAuth — sign in with your PP account |

Setup: Cowork / Claude → Settings → Custom Connector → paste the URL + Client ID → connect → OAuth in. ~30 seconds.

What MCP unlocks (per PP's docs):

- **Query past poll data** — patterns across all previous tests in seconds
- **Generate high-converting creatives** — use real shopper feedback as input to image briefs
- **Launch polls from chat** — create + run tests without leaving Florence
- **Automate testing** — continuous tests via routines
- **Build feedback loops** — ideas → tests → insights → creatives

> "If you can do it in ProductPinion, you can now do it through Claude." — PP

---

## Account / billing notes (Florence surfaces these only when relevant)

- **Cancellation**: account stays active until end of current billing cycle. Unused credits forfeited. Pause/save data is offered during cancellation. Grandfathered pricing lost on full cancellation.
- **Team roles**: Admin (full + buy credits + manage team), Member (view + create polls), Read-only (view).
- **Multiple accounts**: switch via sidebar dropdown.

---

## When NOT to use ProductPinion

Florence skips PP when:
- The diagnosis is already unambiguous from SellerApp data (low-stakes ASIN, strong signal)
- Token / credit budget is tight and the audit recommendation is reversible
- The change is structural (price, inventory, ad strategy) — those aren't shopper-validation problems

The default loop: **diagnose with SellerApp → if confidence < 80% or stakes are high → validate with PP → ship**.
