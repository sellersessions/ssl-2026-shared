# ProductPinion Tool Taxonomy

Three product surfaces. Florence must pick the right one before
recommending a test.

## Default tool hierarchy

> **Pinion Polls first. Pinion Ask is secondary.** Florence figures out
> which Poll type fits before reaching for Ask.

Pinion Videos are never optional in best practice — they're always the
qualitative first step. A seller may skip them for speed, but Florence
should always recommend them.

---

## Pinion Videos

Screen recordings of shoppers answering questions out loud while
browsing. Up to 3 questions analysed per video. Each video is 3–5
minutes.

**Send to:** any URL — live Amazon search results, live PDP, mocked-up
SERP simulation, Shopify store, Dropbox/Drive folder of prototype
images. Anywhere a real shopper can react.

**When:** always Step 1 of any workflow. Qualitative baseline before
anything quantitative. New competitors, title shifts, and shopper-
language drifts surface here before any keyword tool catches them.

---

## Pinion Polls — five types

One standalone test, one question type, one decision. Seller picks the
sample size.

| Type | What it does | Use for |
|---|---|---|
| **Image Split Test** | A vs B vs C vs D concept testing | Main image, creative concepts |
| **Text Split Test** | Compare text variants | Brand names, guarantees, bullet headlines |
| **Search Simulation** | 1:1 Amazon SERP mock-up — pick ASINs, set prices, hide/show reviews | **Flagship test type.** CTR baseline + CTR retest |
| **Ranked Test** | Rank options best-to-worst | Objection prioritisation in CVR work, ranking secondary images |
| **Stacked Image Test** | Full gallery vs gallery | Old listing images vs new |

---

## Pinion Ask

Multi-question survey in one sitting (closer in shape to Google
Surveys). Each question costs one credit. Same respondent answers
all questions sequentially.

| Type | What it does |
|---|---|
| Single-answer | Standard multiple-choice |
| Short-answer | Open-ended text — **the workhorse for objection mining** |
| Multiple-answer | Pick all that apply |
| Drop-down | Long-list multiple-choice |
| Price input | Free numeric entry |
| **3-Second Test** | Image shown 3s, "what did you gather?" |
| **Listing Battle** | Two listings, "which is better?" |
| **Price Sensitivity** | Van Westendorp 4-question framework |
| **Skimmer Test** | Limited time on a page, retention test |
| **Blur Test** | Blurred image, comprehension test |

**Important:** Ranking is **not** available in Pinion Ask. For ranking,
use a Pinion Poll Ranked Test.

---

## Currently confirmed in the MCP

As of the 2026-05-05 interview, Florence has runtime access to:

- Pinion Poll (standard)
- Pinion Poll — Ranked Test
- Pinion Ask — open-ended short answer (specifically: send to a live
  Amazon listing, ask "what's confusing?", capture free-text)

The full Pinion Ask MCP integration was still in progress at interview
date. Florence should always check her live tool manifest before
assuming what's available.

See `mcp-contract.md` for the full named-tool list.
