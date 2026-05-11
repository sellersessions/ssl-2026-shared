# Scraping Tools · decision guide

> **Source:** Sim's huntr-handover · file 06. Cherry-picked into syncflow to give a frequency-pricing-driven decision tree when a roadmap module surfaces a scraping need and the delegate doesn't already own a tool.

---

## When this gets used

A delegate's roadmap surfaces a need to scrape something, and the brand doesn't already own a scraping tool. Examples:

- Twice-daily competitor price check (UW-03)
- ZIP-rotated US rank tracking
- Competitor PDP monitoring
- Off-Amazon brand mentions / TikTok / Reddit
- One-off market research (review pulls, BSR snapshots)

Apply the **frequency-pricing principle**:

> **Few uses per month → pay-as-you-go. Many uses per week → monthly subscription.**

This file gives the data to make that call quickly.

## The decision tree

```
Is this Amazon-specific scraping?
├─ Yes → use Rainforest API (Tier 1) or SellerApp (Tier 1, if owned)
└─ No → continue

Is this a one-off or low-frequency need (<10 scrapes/week)?
├─ Yes → Apify pay-go ($5/mo free credit) or pay-go on Rainforest
└─ Continue if higher volume

Is this continuous monitoring (daily/hourly)?
├─ Yes → monthly subscription on the most-fit tool
└─ Otherwise → pay-go

Is the volume enterprise scale (>1000 requests/hour)?
├─ Yes → Bright Data with residential proxies
└─ Mid-range volume → Apify Pro or ScrapingBee sub
```

## Tool comparison (pricing verified 2026-05-06)

### Amazon-specific scraping

| Tool | Best for | Free tier | Pay-go | Sub | Verdict |
|---|---|---|---|---|---|
| **Rainforest API** | Amazon scrape with ZIP rotation | None | Credit packs from $50 (50k credits, ~1 credit per request) | None — pure pay-go model | **Default for Amazon** especially when ZIP rotation matters |
| **SellerApp API** | Continuous Amazon intel (rank tracking, review pulls) | None | None — sub only | Tiered, varies by volume | **Default if already owned** (Sim has via DorianFlows) |
| **Helium 10 API** | Cerebro/Magnet workflows programmatic | None | None | Diamond tier $249/mo includes API | **Avoid** for new builds; OK if owned |
| **Keepa** | BSR + price history | Free for limited browsing | Per-request via Data API | $20+/mo for full data access | **Default for historical** Amazon data |

### General-purpose scraping (off-Amazon)

| Tool | Best for | Free tier | Pay-go | Sub | Verdict |
|---|---|---|---|---|---|
| **Apify** | Marketplace of pre-built scrapers + custom actors | $5/mo credit | Pay-go per actor run | Pro $49/mo for $20 credit + scaling | **Default for general scraping** — flexibility wins |
| **Firecrawl** | Modern scraping with LLM-friendly output | Limited | Pay-go pricing per page | Available | **Tier 1 candidate** — pairs well with Claude/Cowork workflows |
| **Bright Data** | Enterprise scale + residential proxies | None | Pay-go but high entry | Enterprise plans | **Enterprise only** — overkill for delegates <$10M/yr |
| **ScrapingBee** | General scraping with browser rendering | 1k free requests | Plans from $49/mo | Yes | **Recognise** — Apify usually wins |
| **ScrapingDog** | Lower-cost ScrapingBee alternative | Free trial | Plans from $30/mo | Yes | **Recognise** — marginal differentiation |
| **ScraperAPI** | High-volume general scraping | 1k free requests | Plans from $49/mo | Yes | **Recognise** |

### Specialised scraping

| Tool | Best for | Pricing | Verdict |
|---|---|---|---|
| **SerpAPI** | Google/Bing/YouTube SERP results | Plans from $50/mo | **Tier 1 candidate** for SEO + competitor work |
| **DataForSEO** | SEO and SERP data at scale | Pay-go | **Recognise** |
| **Phantombuster** | Social media scraping (LinkedIn, Twitter, Insta) | Plans from $69/mo | **Recognise** — Apify covers most use cases |
| **Octoparse** | No-code visual scraping | Free tier + paid | **Recognise** — non-technical users only |
| **Browse.AI** | Visual scraping for non-technical users | Freemium → Sub | **Recognise** |

## Decision examples

### Example 1: UW-03 competitor price tracker (twice daily)

**Volume:** 2 scrapes/day per ASIN × ~5 competitor ASINs = 10 requests/day = 300/month.
**Verdict:** **Rainforest API pay-go.** $50 buys 50k credits (~150 months of polling for this volume). Cheaper than any sub.

### Example 2: Hyper-local US rank tracking (daily, 50 keywords × 10 ZIPs)

**Volume:** 500 requests/day = 15,000/month.
**Verdict:** **Rainforest API credit packs.** At ~$1/1k requests, this is ~$15/month for the data. Cheaper than any sub.

### Example 3: Off-Amazon competitor brand monitoring (TikTok creator activity, daily)

**Volume:** ~10 creators × daily checks = 300/month.
**Verdict:** **Apify pay-go.** Use a TikTok creator scraper actor; run on schedule via n8n. Free tier $5/mo credit covers most of it.

### Example 4: One-off market research (1000 ASINs scraped once for niche analysis)

**Volume:** 1000 requests, one-off.
**Verdict:** **Apify pay-go** with the Amazon scraper actor, OR **Rainforest credit pack** $50 covers easily. Choose based on what data fields are needed.

### Example 5: Continuous SERP monitoring (200 keywords daily)

**Volume:** 200 requests/day = 6000/month.
**Verdict:** **SerpAPI sub** at $50–150/mo depending on volume. Pay-go would be more expensive at this volume.

### Example 6: Enterprise-scale scraping (millions of pages, residential proxies needed)

**Volume:** >100k requests/day.
**Verdict:** **Bright Data enterprise.** Most delegates don't need this, but flag if it surfaces.

## Pricing-tier rule (pseudocode)

```
if volume_per_month < 1000:
    recommend pay-go (Apify free tier covers; Rainforest cheap credit pack)
elif volume_per_month < 10000:
    recommend pay-go on Apify Pro tier OR Rainforest credit pack
elif volume_per_month < 100000:
    recommend ScrapingBee sub OR Apify Pro tier
else:
    recommend enterprise (Bright Data) — flag this with delegate

# Always:
include "verified [date]" with pricing
recommend twice the volume cap to leave headroom
suggest n8n cloud as the orchestration layer (rung 4)
```

## When NOT to recommend a scraping tool

If the delegate's need can be solved another way, take the lower rung:

- **Their own brand's data** → SP-API direct, no scraping needed
- **Their own competitive intelligence already accessible via SellerApp / Helium 10** → use what's owned
- **Static / low-frequency data** → manual export from Amazon Brand Analytics or competitor's public PDP
- **Public APIs exist** (Reddit API, Twitter/X API, GitHub API) → use those over scraping

## Compliance flag

Every scraping recommendation includes:

> ⚠️ **TOS reminder:** Amazon's TOS prohibits direct scraping. Third-party APIs (Rainforest, SellerApp) absorb that risk on the delegate's behalf. If the delegate is considering rolling their own scraper, redirect to a third-party tool. Don't help them scrape Amazon directly.

For non-Amazon scraping, similar TOS considerations apply per platform — flag when they come up.

---

## How syncflow uses this

- **`skills/recommend-modules.md`** — when a module would need a scraper, walk this tree before recommending a specific tool. Use the *example* closest to the volume profile.
- **`skills/generate-build-plan.md`** — at the phase that names a scraper, cite the rung and the verified pricing date.
- Pricing data goes stale fast. Re-fetch from the official site at recommendation time when precision matters (delegate is about to commit to a sub).
