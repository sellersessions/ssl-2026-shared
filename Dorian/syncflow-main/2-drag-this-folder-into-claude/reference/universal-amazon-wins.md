# Universal Amazon Wins · systemic revenue-leak library

> **Source:** Sim's huntr-handover · file 10. Cherry-picked into syncflow as the pre-finalisation cross-check on every roadmap. Goal: ensure no roadmap is empty even when the brand-specific signal is thin — every Amazon brand has these systemic leaks.

---

## Why this exists

Most roadmaps surface brand-specific bottlenecks (the team's actual hours, the founder's actual frustrations). But there are systemic gaps **every Amazon brand has**, regardless of who's eating time on what. They don't show up in a normal interview because nobody's working on them yet — that's the point.

Every roadmap should include 3–5 universals where the brand's profile triggers them. Use this library during `recommend-modules` (after picking the brand-specific modules) as a second pass: are any of these systemic leaks being missed?

## Trigger logic

Each entry has a **trigger condition** — what must be true about the brand's profile for this win to be surfaced. If the trigger fails, don't recommend it. This keeps universals relevant per delegate, not generic.

Read trigger inputs from the brain:
- Channels (US-only? UK+EU? FBA vs FBM?)
- SKU count
- Active PPC spend (yes/no/at-what-scale)
- Stack (Helium 10? Sellerboard? Adtomic?)
- Brand-registered? (affects UW-04, UW-08)
- Returns volume (affects UW-05, UW-06)

---

## UW-01 · SQPR × PPC Gap-Filler

**Trigger:** brand has SP-API access + active PPC + SQPR data available

**Insight:** Search Query Performance Report (Brand Analytics, available via SP-API) shows full-funnel performance per keyword — impressions → click share → purchase share. Cross-reference against the keywords actually being bid on in Sponsored Products. **Keywords with high organic purchase share that aren't being targeted in PPC are uncaptured demand** — easy ranking gains, easy revenue uplift.

**Solution shape:** Claude Code routine that queries SP-API directly for SQPR data, reads the brand's current campaign keyword list via Amazon Ads MCP, identifies the gap, and **auto-creates a new exact-match campaign** for the gap keywords once the delegate confirms naming convention. No n8n needed — the data is readily available via SP-API.

**Critical interaction:** every brand has a different campaign naming convention. Ask up-front: *"What's your naming convention for new exact-match campaigns? Examples: `UK-DD-AUTO-2026-05-Hammer-Exact` or `[BRAND]-[ASIN]-EXACT`. Type your template with `[KW]` placeholder."*

**Tools:** SP-API (SQPR endpoint) + Amazon Ads MCP + Claude Code (the routine itself).

**Effort:** 2–3 days for the v1 routine. Re-run weekly thereafter.

**Universal applicability:** every Amazon seller with PPC and Brand Analytics access.

---

## UW-02 · Placement Performance Bid Adjuster

**Trigger:** brand has exact-match SP campaigns running

**Insight:** Inside any campaign, performance differs across **Top of Search**, **Rest of Search**, and **Product Pages** placements. Campaign Manager hides this granularity in the default view. Most sellers don't optimise at placement level — they tune campaign-wide bids and modifiers.

The honest framing (replacing the over-confident "Top of Search always wins" claim): **placement performance varies wildly per campaign and per keyword. There is no universal winner. The leak is that most teams aren't even looking.**

**Solution shape:** an internal tool — Claude Code routine, or Cowork+n8n if heavier — that pulls placement-level data from the Ads API per campaign, identifies meaningful divergence (>20% delta in CVR or ACoS between placements), and **pushes bid-adjustment changes back to Amazon via the Ads API** once the delegate approves.

**Workflow:**
1. Pull placement performance per campaign (last 30 days)
2. Flag campaigns where one placement is dramatically out- or under-performing
3. Recommend modifier changes (e.g. "raise TOS modifier on Campaign X by 25%, drop PP modifier on Campaign Y by 50%")
4. Delegate confirms; routine pushes via Ads API
5. Re-evaluate at T+30 days

**Tools:** Amazon Ads MCP + Claude Code routine + (optionally) a simple branded HTML report.

**Effort:** 3–5 days for the v1 (the bid-push logic is the bulk of the work).

**Universal applicability:** every Amazon seller running exact-match SP campaigns at any meaningful spend.

---

## UW-03 · Competitor Price Tracker (twice-daily)

**Trigger:** brand has SP-API access + identifies one or more key competitor ASINs they're benchmarked against

**Insight:** Most sellers don't know what their named competitor is doing pricing-wise on a daily basis. They check manually, weekly at best. By the time they react, the competitor has moved twice. **Real-time visibility on a single nemesis competitor is a high-leverage automation that costs almost nothing to run.**

**Solution shape:** scrape the competitor's price **twice per day** (or more if needed), compare to the brand's current price, flag when the gap breaches a threshold the delegate sets, optionally auto-adjust their own price via SP-API within a margin floor.

The frequency is deliberate: real-time isn't worth the cost or the risk. Twice a day catches every meaningful move, allows considered response, doesn't trigger Amazon's anti-scraping flags from a third-party scraper, and gives 6–12 hours' react time.

**Tools:** Rainforest API or Apify (scraper) + n8n (orchestrator on schedule) + SP-API Pricing API (the auto-adjust, if used) + Slack alert.

**Effort:** 2–3 days. The auto-adjust logic adds 1–2 days more if enabled.

**Universal applicability:** every brand that has a known nemesis competitor (which is most of them).

**Margin floor critical:** the auto-adjust must respect a hard margin floor. Never let a competitor drag you below break-even.

---

## UW-04 · Branded Search Cannibalisation Audit

**Trigger:** brand has Ads API + significant brand-name search volume

**Insight:** Many brands pay CPC for clicks on their own brand name — clicks they'd get organically anyway. Branded keywords often eat 15–30% of PPC spend with near-zero incremental sales. The exception is **defensive bidding** — when a competitor is running Sponsored Display targeting your brand, defending the brand search slot is worth it.

The audit separates the two cases.

**Solution shape:** monthly automated report — your brand-name search terms, organic vs paid share, recommendations for which to defund (offensive cannibalisation) and which to keep defensive (because a competitor is conquesting). Output as branded HTML on the brand's design system.

**Tools:** Amazon Ads MCP (search terms report) + SP-API SQPR (organic share) + Claude Code routine + branded HTML output.

**Effort:** 2 days for the v1 report. Re-run monthly.

**Universal applicability:** any brand with brand-name search volume worth defending.

---

## UW-05 · Returns Reason Mining

**Trigger:** brand has SP-API + meaningful returns volume (>50/month)

**Insight:** Amazon return reasons are unstructured text, but they cluster reliably into 5–7 themes per ASIN. Most teams never analyse them systematically — they're sitting on free product-improvement signal. Bullets that pre-empt the top 3 complaints can lift CVR materially.

**Solution shape:** monthly Cowork project — pulls returns text via SP-API (or CSV upload if API access is restricted), clusters by ASIN, identifies themes, generates **listing-bullet-revision recommendations** + **supplier-feedback briefs** for the top complaint themes per ASIN.

**Tools:** SP-API Returns Report + Cowork (the analysis project) + Sim's branded-doc flow (for the supplier brief output).

**Effort:** 1 day to build the Cowork project. Re-run monthly.

**Universal applicability:** every Amazon FBA seller with active return volume.

---

## UW-06 · Returnless Refunds & Grade-and-Resell Programme Audit

**Trigger:** brand has SP-API + active FBA inventory + return volume >100/month per marketplace

**Insight:** Amazon offers two return-disposition programmes that most sellers under-use:

1. **Returnless Refunds** — customer is refunded, keeps the product. Saves return processing fees, return shipping, and unsellable product cost. Best for low-value items that mostly come back unsellable anyway.
2. **FBA Grade & Resell** — Amazon grades returned items and relists them in "Used" condition. Recovers partial revenue instead of disposal. Best for higher-value items that mostly come back sellable.

The decision framework runs off **sellable quota** (% of returned items Amazon deems resaleable):

| Sellable quota | Programme | Why |
|---|---|---|
| < 40% | Returnless Refunds | Most stock comes back unsellable. Save processing fees. |
| 40–59% | Review individually | Compare product value vs return processing cost per ASIN |
| > 60% | Grade & Resell | Most stock comes back sellable. Recover value. |

For a multi-brand UK FBA seller with ~150 candidate ASINs, this can be **£80k–£100k/year in savings + revenue recovery**.

**Solution shape:** Cowork project that:
1. Pulls per-ASIN returns data (volume, sellable %, fees, average price) from SP-API or report exports
2. Categorises each ASIN into one of the three programme buckets
3. Generates a prioritised rollout plan — top-fee-saving ASINs first, with the price thresholds and return-reason filters Amazon needs configured per rule
4. Produces the implementation walkthrough (Settings > Return Settings > Returnless Refunds, step-by-step)
5. Schedules a 4-week review to validate refund rates haven't increased (abuse check)

**Tools:** SP-API Returns + Sales reports + Cowork + branded-doc flow for the rollout plan.

**Effort:** 1 day to build the Cowork project. Per-brand analysis runs in 30 minutes once configured.

**Universal applicability:** every Amazon FBA seller with active return volume.

---

## UW-07 · Review Request Automation Check (coach if missing)

**Trigger:** brand has SP-API + acceptable Amazon TOS standing

**Insight:** Amazon's "Request a Review" button can be triggered programmatically per order via SP-API (5–30 days post-delivery). Sellers who run it on every eligible order systematically out-review competitors over time.

**Critical caveat:** **most sellers using Sellerboard, Helium 10, or similar already have this automated.** First job is to check whether they're already doing it — if yes, confirm the coverage rate (% of eligible orders triggering). If no, recommend either enabling it in their existing tool OR building a simple n8n flow.

**Decision tree:**
1. Does the brand use Sellerboard / Helium 10 / SellerLegend / similar? → Confirm review automation is enabled. If not, **coach them through enabling it in the tool they already pay for** (rung 1 of the Simplicity Ladder).
2. No suitable tool in their stack? → Recommend a simple n8n flow: SP-API Orders pull → eligible-order filter → trigger Review Request → log volume → Slack daily digest.

**Tools:** Their existing analytics tool (preferred) OR SP-API Orders + n8n (fallback).

**Effort:** 30 mins to coach (rung 1) or half a day to build (rung 4).

**Universal applicability:** every Amazon FBA seller. The recommended path differs based on their existing stack.

---

## UW-08 · A+ Content Coverage Audit

**Trigger:** brand has registered Brand on Amazon + multiple ASINs

**Insight:** Many sellers have A+ on hero ASINs but not on long-tail. A+ adds 5–10% CVR. The gap is hidden because Amazon doesn't surface "ASINs without A+" anywhere obvious. A systematic audit reveals it instantly.

**Solution shape:** SP-API listing scrape → identifies ASINs without A+ → ranks by sales velocity (high-traffic, no-A+ ASINs are the priority) → output prioritised "build A+ for these next" list with **auto-generated A+ module briefs per ASIN**.

The A+ briefs are templated — image module recommendations, comparison-chart suggestions, brand-story positioning — based on the ASIN's category and existing listing content.

**Tools:** SP-API (listing data) + Cowork (the brief generator) + Figma plugin (for the actual A+ build later, downstream of the brief).

**Effort:** 1 day for the audit + brief generator. Re-run quarterly.

**Universal applicability:** every brand-registered Amazon seller.

---

## How syncflow uses this

In `skills/recommend-modules.md`:

1. Pick brand-specific modules first (the 5–7 from `reference/architecture.md`'s 15 archetypes).
2. **Then** walk this library. For each entry, evaluate the trigger condition against the brain. Queue any that pass.
3. Rank queued universals by:
   - Estimated revenue/savings impact for this brand
   - Effort to implement (lower = higher rank)
   - Synergy with the chosen brand-specific modules (e.g. if Module 04 is review responses, UW-07 review automation is doubly relevant)
4. Surface the **top 3–5** as a "Universal Opportunities" section in the roadmap.

If brand-specific modules are weak (thin brain, hesitant delegate), universals move to the front of the recommendation. **Every roadmap produces actionable wins.**

## Extension shape

This library is open-ended. New patterns are added when:
- New Sim case studies surface a recurring leak
- A pattern recurs across multiple delegate roadmaps (promote from anecdote to library entry)
- Sim or Dorian flags an emerging Amazon mechanic

Each new entry follows the template:
- Trigger condition (when to surface it)
- Insight (the leak in plain English)
- Solution shape (which tools, which Simplicity Ladder rung)
- Tools required
- Effort estimate
- Universal applicability test
