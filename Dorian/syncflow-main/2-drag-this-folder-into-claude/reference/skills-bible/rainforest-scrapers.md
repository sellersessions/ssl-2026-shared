# Amazon Market Intelligence & Scraping Tools — Expert Reference

> **Scope:** Rainforest API, Keepa, and the full landscape of third-party Amazon data tools — what they give you, how to use them properly, how to store the data, and how to integrate everything into n8n + Supabase workflows. Written for the syncflow system. Opinions included.  
> **Stack Context:** Rainforest API · Keepa · n8n · Supabase · ClickUp  
> **Last Updated:** May 2026

---

## Table of Contents

1. [Why Third-Party Data Tools Exist — The SP-API Gap](#1-why-third-party-data-tools-exist--the-sp-api-gap)
2. [Rainforest API Overview](#2-rainforest-api-overview)
3. [Rainforest API Authentication & Request Structure](#3-rainforest-api-authentication--request-structure)
4. [Rainforest API Endpoints In Depth](#4-rainforest-api-endpoints-in-depth)
   - [4.1 Product Data (type=product)](#41-product-data-typeproduct)
   - [4.2 Search Results (type=search)](#42-search-results-typesearch)
   - [4.3 Offers / Sellers (type=offers)](#43-offers--sellers-typeoffers)
   - [4.4 Reviews (type=reviews)](#44-reviews-typereviews)
   - [4.5 Best Sellers (type=bestsellers)](#45-best-sellers-typebestsellers)
   - [4.6 Category Browse Nodes](#46-category-browse-nodes)
5. [ZIP-Code Rotation for Hyper-Local Pricing Intelligence](#5-zip-code-rotation-for-hyper-local-pricing-intelligence)
6. [Keepa Overview](#6-keepa-overview)
7. [Keepa API In Depth](#7-keepa-api-in-depth)
8. [Third-Party Tool APIs: When Managed Beats DIY](#8-third-party-tool-apis-when-managed-beats-diy)
9. [Custom Scraping: When to Roll Your Own](#9-custom-scraping-when-to-roll-your-own)
10. [Storing Scraped Data in Supabase](#10-storing-scraped-data-in-supabase)
11. [n8n Integration Patterns](#11-n8n-integration-patterns)
12. [Legal & ToS Posture](#12-legal--tos-posture)
13. [Cost Discipline](#13-cost-discipline)
14. [End-to-End Use Case: ZIP-Rotation Price Monitor](#14-end-to-end-use-case-zip-rotation-price-monitor)
15. [Competitive ASIN Monitoring Patterns](#15-competitive-asin-monitoring-patterns)
16. [Common Pitfalls](#16-common-pitfalls)
17. [Dos & Don'ts](#17-dos--donts)
18. [Quick Reference Cheat Sheet](#18-quick-reference-cheat-sheet)

---

## 1. Why Third-Party Data Tools Exist — The SP-API Gap

SP-API is Amazon's sanctioned programmatic interface for sellers — and it is genuinely powerful for what it does. But there is a hard wall around what SP-API gives you, and most of the strategically valuable market intelligence data sits on the other side of that wall.

### What SP-API Does NOT Give You

| Data Type | SP-API? | Why Not |
|---|---|---|
| Competitor listing content (title, bullets, images) | ❌ | No endpoint for competitors' ASINs |
| Competitor pricing (unless you're the seller) | ❌ | Pricing API is your own account only |
| Buybox ownership history | ❌ | No historical buybox data at all |
| Organic search rank for keywords | ❌ | Search rank requires knowing every buyer's search context |
| Review velocity (rate of new reviews over time) | ❌ | Reviews API has no velocity metrics |
| Historical BSR trends | ❌ | Current BSR only, no history |
| Local/ZIP-code pricing variation | ❌ | Amazon prices by geography; SP-API doesn't expose this |
| Competitor FBA/FBM seller counts per ASIN | ❌ | No competitor inventory visibility |
| Review text and sentiment for any ASIN | ❌ | Buyer–seller messaging restrictions; review data blocked |
| Search results page layout (ads vs organic) | ❌ | No API reflects the actual SERP |

This is not an accident. Amazon deliberately walls off this data because it would allow sellers to game the system programmatically at scale in ways that would degrade the customer experience. The result is that a large, legitimate ecosystem of third-party data providers has grown up to fill the gap by doing what Amazon doesn't want you to do on your own: scraping public Amazon pages.

### The Fundamental Gap in Practice

Here's the concrete problem: You're a brand selling a premium silicone spatula. You want to know:

- Is your main competitor undercutting you by $2 only in the Pacific Northwest?
- Have they started getting more reviews this month (are they ramping up review velocity)?
- Are you losing organic rank for "heat resistant spatula" even though your ad spend is fine?
- What does the page look like to a buyer in Miami vs. Chicago?

SP-API answers none of these questions. Third-party data tools answer all of them. That's the gap — and filling it is the entire reason this document exists.

---

## 2. Rainforest API Overview

### What It Is

[Rainforest API](https://www.rainforestapi.com/) is a **managed Amazon scraping infrastructure service**. You send it an API request asking for Amazon product data, it routes that request through its own proxy and browser infrastructure, fetches the live Amazon page, parses it, and returns clean structured JSON. You never touch HTML, never manage proxies, never worry about CAPTCHA or bot detection. You pay per request.

The key insight: Rainforest is not "a scraper you host." It's a service that does the scraping for you. You interact with it the same way you'd interact with any REST API — an HTTP request in, JSON out. That's it.

### How It Works Under the Hood

Rainforest maintains a rotating pool of:
- Residential and datacenter proxies (geographically distributed)
- Browser instances capable of rendering JavaScript-heavy pages
- Anti-bot evasion infrastructure (headers, fingerprinting, retry logic)
- Request queuing and backoff handling for Amazon's rate limiting

When you submit a request, Rainforest:
1. Enqueues the job
2. Selects an appropriate proxy and browser context
3. Loads the Amazon page (with retries if Amazon rejects the initial request)
4. Parses the rendered HTML into structured JSON
5. Returns the response — synchronously (default) or asynchronously via webhook

Most responses come back in 3–8 seconds. Under heavy load or for complex pages, 15–20 seconds is possible.

### Geographic Support

Rainforest supports all major Amazon marketplaces:

| Marketplace | Domain Parameter |
|---|---|
| United States | `amazon.com` |
| United Kingdom | `amazon.co.uk` |
| Germany | `amazon.de` |
| France | `amazon.fr` |
| Italy | `amazon.it` |
| Spain | `amazon.es` |
| Canada | `amazon.ca` |
| Japan | `amazon.co.jp` |
| India | `amazon.in` |
| Australia | `amazon.com.au` |
| Brazil | `amazon.com.br` |
| Mexico | `amazon.com.mx` |

Pass the `amazon_domain` parameter (e.g. `amazon_domain=amazon.co.uk`) to target a specific marketplace.

### Pricing Tiers (as of 2026)

Rainforest uses a **credit-based pricing model**. One API request = one credit (with some exceptions for complex requests).

| Plan | Monthly Credits | Monthly Cost | Per-Request Cost |
|---|---|---|---|
| Starter | 5,000 | ~$50 | $0.010 |
| Business | 50,000 | ~$380 | $0.0076 |
| Business 200K | 200,000 | ~$1,200 | $0.0060 |
| Enterprise | 500,000+ | Custom | $0.004–0.005 |

> ⚠️ Prices change. Always check [rainforestapi.com/pricing](https://www.rainforestapi.com/pricing) before quoting costs to a client or building a budget.

**Free trial:** Rainforest offers 10 free credits to test the API. This is enough to validate your integration against a few product pages. Request more credits on their site if you need broader testing.

**Key caveat on cost:** At $0.010 per call on Starter, costs add up fast. 50 ASINs × 4 data types × 24 polls/day = 4,800 calls/day = $48/day. Cost discipline (Section 13) is essential.

---

## 3. Rainforest API Authentication & Request Structure

### API Key

All requests authenticate via an API key passed as a query parameter named `api_key`. No OAuth, no token refresh — just a static key.

```
GET https://api.rainforestapi.com/request?api_key=YOUR_API_KEY&...
```

Store your API key in Supabase Vault or n8n's credential store. **Never hardcode it in workflow JSON or commit it to git.**

### Base URL

```
https://api.rainforestapi.com/request
```

All endpoints use this same base URL. The `type` parameter determines what data is returned.

### Request Structure

Every request is a GET with query parameters:

```
https://api.rainforestapi.com/request
  ?api_key=DEMO
  &type=product
  &asin=B08N5WRWNW
  &amazon_domain=amazon.com
```

**Core parameters present on most requests:**

| Parameter | Type | Description |
|---|---|---|
| `api_key` | string | Your API key |
| `type` | string | Request type: `product`, `search`, `offers`, `reviews`, `bestsellers`, `category` |
| `amazon_domain` | string | Target marketplace, e.g. `amazon.com` |
| `asin` | string | Amazon Standard ID (product-specific requests) |
| `zip_code` | string | US ZIP code for location-based pricing (US only) |
| `output` | string | `json` (default) or `html` |
| `include_html` | boolean | Include raw HTML alongside JSON |

### Response Format

All responses are JSON. The top-level structure is:

```json
{
  "request_info": {
    "success": true,
    "credits_used": 1,
    "credits_remaining": 4999,
    "credits_reset_at": "2026-06-01T00:00:00.000Z"
  },
  "request_metadata": {
    "id": "d5e38b2a-1234-...",
    "created_at": "2026-05-06T09:12:34.456Z",
    "processed_at": "2026-05-06T09:12:38.789Z",
    "total_time_taken": 4.333,
    "amazon_url": "https://www.amazon.com/dp/B08N5WRWNW"
  },
  "request_parameters": {
    "type": "product",
    "asin": "B08N5WRWNW",
    "amazon_domain": "amazon.com"
  },
  "product": { ... }
}
```

If `success` is `false`, check `request_info.message` for the error reason. Common ones:
- `"ASIN not found"` — bad ASIN or product delisted
- `"Credits exhausted"` — out of credits
- `"Rate limited"` — too many requests per second

### Asynchronous Requests

For bulk/batch use cases, add `async=true` and a `callback` webhook URL:

```
?api_key=...&type=product&asin=B08N5WRWNW&async=true&callback=https://your.n8n.webhook/...
```

Rainforest processes the request and POSTs the result to your webhook when complete. This avoids n8n execution timeout on large batches (n8n HTTP Request timeout is ~120 seconds by default; async sidesteps that entirely).

---

## 4. Rainforest API Endpoints In Depth

### 4.1 Product Data (type=product)

**Use case:** Retrieve the full listing for any ASIN — competitor or your own. This is your primary endpoint for listing monitoring, change detection, and market intelligence.

**Key parameters:**

| Parameter | Notes |
|---|---|
| `asin` | Required |
| `zip_code` | Affects price, delivery estimate, availability |
| `include_a_plus_body` | `true` to get A+ content HTML |

**Example request:**

```
https://api.rainforestapi.com/request
  ?api_key=DEMO
  &type=product
  &asin=B08N5WRWNW
  &amazon_domain=amazon.com
  &zip_code=90210
```

**Key response fields:**

```json
{
  "product": {
    "asin": "B08N5WRWNW",
    "title": "Product Title Here",
    "brand": "BrandName",
    "main_image": { "link": "https://m.media-amazon.com/images/..." },
    "images": [ { "link": "...", "variant": "PT01" } ],
    "description": "Full product description",
    "feature_bullets": ["Bullet 1", "Bullet 2", "Bullet 3"],
    "buybox_winner": {
      "price": { "value": 29.99, "currency": "USD", "raw": "$29.99" },
      "is_prime": true,
      "is_fulfilled_by_amazon": true,
      "seller": { "name": "Amazon.com", "id": "ATVPDKIKX0DER" }
    },
    "rating": 4.5,
    "ratings_total": 1247,
    "categories": [
      { "name": "Kitchen & Dining", "id": "284507" },
      { "name": "Spatulas", "id": "3746451" }
    ],
    "bestsellers_rank": [
      { "category": "Kitchen & Dining", "rank": 1534, "link": "..." },
      { "category": "Spatulas", "rank": 12, "link": "..." }
    ],
    "images_count": 7,
    "videos_count": 1,
    "has_a_plus": true
  }
}
```

**What to watch for:**
- `buybox_winner` may be `null` if no one owns the buybox (suppressed listing)
- `bestsellers_rank` is an array — an ASIN can rank in multiple categories
- `images_count` and `videos_count` are useful for competitive content quality comparisons
- Prices are in both `value` (float) and `raw` (string with currency symbol) — always use `value` for math

---

### 4.2 Search Results (type=search)

**Use case:** Track organic search rank for keywords. See what's appearing above your listing — organically and sponsored. Detect if a competitor is newly running ads against your keywords.

**Key parameters:**

| Parameter | Notes |
|---|---|
| `search_term` | Required — the keyword to search |
| `page` | Page number (default 1, up to ~20) |
| `sort_by` | `relevanceblender` (default), `date-desc-rank`, `price-asc-ltc`, etc. |
| `zip_code` | Affects local/delivery-filtered results |

**Example request:**

```
https://api.rainforestapi.com/request
  ?api_key=DEMO
  &type=search
  &search_term=silicone+spatula+heat+resistant
  &amazon_domain=amazon.com
  &page=1
```

**Key response fields:**

```json
{
  "search_results": [
    {
      "position": 1,
      "asin": "B07CZ4NZP3",
      "title": "...",
      "sponsored": false,
      "price": { "value": 24.99, "currency": "USD" },
      "rating": 4.6,
      "ratings_total": 3892,
      "is_prime": true,
      "bestseller_badge": false
    }
  ],
  "sponsored_results": [
    {
      "position": 1,
      "asin": "B08N5WRWNW",
      "title": "...",
      "sponsored": true
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages_approx": 20
  }
}
```

**Tracking organic rank:** To find where your ASIN ranks, loop through `search_results` and find the item where `asin == YOUR_ASIN`. Record `position`. Run this daily per keyword. Store in Supabase with a `(keyword, asin, marketplace_id, scraped_at)` key. Trend over time.

**Sponsored vs organic:** `sponsored: true` items in `search_results` are ads interspersed in the organic feed. `sponsored_results` is the dedicated sponsored area (usually top 3 above organic). Both matter for share-of-voice analysis.

---

### 4.3 Offers / Sellers (type=offers)

**Use case:** See every seller on a listing — not just the buybox winner. Know who's undercutting you, who's FBA vs. FBM, and whether Amazon itself is competing. Critical for buybox strategy and third-party seller intelligence.

**Key parameters:**

| Parameter | Notes |
|---|---|
| `asin` | Required |
| `zip_code` | Affects delivery estimates and sometimes pricing |

**Example request:**

```
https://api.rainforestapi.com/request
  ?api_key=DEMO
  &type=offers
  &asin=B08N5WRWNW
  &amazon_domain=amazon.com
```

**Key response fields:**

```json
{
  "offers": [
    {
      "position": 1,
      "is_buybox_winner": true,
      "seller": { "name": "BrandName Direct", "id": "A1B2C3D4E5F6" },
      "price": { "value": 29.99, "currency": "USD" },
      "shipping": { "free": true },
      "fulfillment": {
        "type": "Amazon",
        "is_sold_by_amazon": false,
        "is_fulfilled_by_amazon": true,
        "is_prime_eligible": true
      },
      "condition": { "is_new": true }
    },
    {
      "position": 2,
      "is_buybox_winner": false,
      "seller": { "name": "Discounter LLC", "id": "Z9X8W7V6U5T4" },
      "price": { "value": 27.50, "currency": "USD" },
      "fulfillment": {
        "type": "Merchant",
        "is_sold_by_amazon": false,
        "is_fulfilled_by_amazon": false,
        "is_prime_eligible": false
      }
    }
  ],
  "buybox_winner": { ... }
}
```

**What you learn from this:**
- Who is undercutting you and by how much
- Whether unauthorized resellers have appeared on your listing (3P gray market detection)
- Whether the buybox is suppressed (no winner = price likely above Amazon's fair pricing threshold)
- FBA/FBM split across all sellers

---

### 4.4 Reviews (type=reviews)

**Use case:** Monitor competitor reviews — volume, velocity, sentiment themes, verified vs. unverified ratio. Track your own review inflow. Feed review text into an LLM for sentiment/theme analysis.

**Key parameters:**

| Parameter | Notes |
|---|---|
| `asin` | Required |
| `reviewer_type` | `all_reviews` or `avp_only_reviews` (verified purchases only) |
| `filter_by_star` | `five_star`, `four_star`, `three_star`, `two_star`, `one_star`, `positive`, `critical` |
| `sort_by` | `recent` (default) or `helpful` |
| `page` | Pagination |

**Example request:**

```
https://api.rainforestapi.com/request
  ?api_key=DEMO
  &type=reviews
  &asin=B08N5WRWNW
  &amazon_domain=amazon.com
  &sort_by=recent
  &reviewer_type=all_reviews
  &page=1
```

**Key response fields:**

```json
{
  "reviews": [
    {
      "id": "R1ABCDE12345",
      "title": "Works great but the handle is slippery",
      "body": "Full review text here...",
      "rating": 3,
      "date": { "raw": "Reviewed in the United States on May 1, 2026", "utc": "2026-05-01T00:00:00.000Z" },
      "verified_purchase": true,
      "helpful_votes": 12,
      "images": []
    }
  ],
  "summary": {
    "rating": 4.3,
    "ratings_total": 1247,
    "rating_breakdown": {
      "five_star": { "percentage": "72%", "count": 897 },
      "four_star": { "percentage": "13%", "count": 162 },
      "three_star": { "percentage": "6%", "count": 75 },
      "two_star": { "percentage": "4%", "count": 50 },
      "one_star": { "percentage": "5%", "count": 63 }
    }
  }
}
```

**Review velocity tracking:** Poll `sort_by=recent` daily. Compare `reviews[0].date` to yesterday's stored `reviews[0].date`. Count net new reviews in the last 24h. A sudden spike (5× normal rate) often indicates a launch push or review incentive program — worth flagging in ClickUp.

---

### 4.5 Best Sellers (type=bestsellers)

**Use case:** Track which ASINs are dominating a category's bestseller list. Useful for category surveillance and market share estimation.

**Key parameters:**

| Parameter | Notes |
|---|---|
| `category_id` | Amazon browse node ID (see Section 4.6) |
| `page` | Page 1 gives rank 1–50, page 2 gives 51–100, etc. |

**Example request:**

```
https://api.rainforestapi.com/request
  ?api_key=DEMO
  &type=bestsellers
  &amazon_domain=amazon.com
  &category_id=3746451
```

**Key response fields:**

```json
{
  "bestsellers": [
    {
      "position": 1,
      "asin": "B07CZ4NZP3",
      "title": "...",
      "price": { "value": 19.99 },
      "rating": 4.7,
      "ratings_total": 8423
    }
  ],
  "category": {
    "name": "Spatulas",
    "id": "3746451",
    "link": "https://www.amazon.com/Best-Sellers-Kitchen-Dining-Spatulas/zgbs/kitchen/3746451"
  }
}
```

**Practical use:** Scrape the top 50 of your target category weekly. Build a ranked table in Supabase. Track week-over-week position changes. When a new competitor enters the top 10, trigger a ClickUp task for listing analysis.

---

### 4.6 Category Browse Nodes

**Use case:** Discover Amazon's category hierarchy to find the correct `category_id` for bestseller polling.

**Example request:**

```
https://api.rainforestapi.com/request
  ?api_key=DEMO
  &type=category
  &category_id=284507
  &amazon_domain=amazon.com
```

This returns the category's subcategories, each with their own IDs. Navigate the tree to find the leaf node (most specific subcategory) relevant to your niche.

**Shortcut:** Look at `product.bestsellers_rank[].link` from a product request — the URL contains the browse node ID directly (e.g. `.../zgbs/kitchen/3746451`).

---

## 5. ZIP-Code Rotation for Hyper-Local Pricing Intelligence

### Why Prices Vary by ZIP Code

Amazon dynamically adjusts product prices, shipping availability, and delivery promises based on the buyer's location. The factors include:

- **Warehouse proximity** — items stocked in closer fulfillment centers may have lower displayed prices due to reduced shipping cost absorption
- **Local competition** — Amazon's algorithmic pricing responds to local retail competition density
- **Third-party seller offers** — some 3P sellers ship only to certain regions, affecting who wins the buybox (and at what price) in different ZIPs
- **Delivery promise** — Prime eligibility and delivery dates differ by location, indirectly affecting buybox weighting

The practical impact: an ASIN priced at $29.99 in New York may appear at $27.99 in Kansas City. For competitive intelligence, missing this variation gives you an incomplete picture.

### The zip_code Parameter

Rainforest exposes ZIP-code level pricing via the `zip_code` parameter on `type=product` and `type=offers` requests:

```
https://api.rainforestapi.com/request
  ?api_key=DEMO
  &type=product
  &asin=B08N5WRWNW
  &amazon_domain=amazon.com
  &zip_code=10001
```

Pass any valid US ZIP code. Rainforest sets the shipping location accordingly before scraping. The `buybox_winner.price.value` in the response reflects the price a buyer in that ZIP would see.

> ⚠️ `zip_code` is US-only. For other marketplaces, geographic pricing variation exists but is not controllable via this parameter.

### Building a ZIP Rotation Schedule

A practical ZIP rotation strategy doesn't mean polling every ZIP code in America. It means polling a representative set covering the key geographic segments that matter to your analysis.

**Recommended ZIP set for national US coverage:**

```
Northeast:  10001 (New York, NY), 02101 (Boston, MA), 15201 (Pittsburgh, PA)
Southeast:  30301 (Atlanta, GA), 33101 (Miami, FL), 27601 (Raleigh, NC)
Midwest:    60601 (Chicago, IL), 44101 (Cleveland, OH), 55401 (Minneapolis, MN)
South:      77001 (Houston, TX), 73101 (Oklahoma City, OK), 35201 (Birmingham, AL)
Mountain:   80201 (Denver, CO), 85001 (Phoenix, AZ), 84101 (Salt Lake City, UT)
Pacific:    90001 (Los Angeles, CA), 98101 (Seattle, WA), 97201 (Portland, OR)
Rural:      59601 (Helena, MT), 82001 (Cheyenne, WY), 72201 (Little Rock, AR)
```

This 21-ZIP set gives you national coverage without bankrupting your Rainforest credit balance. For most analyses, 10–12 strategic ZIPs is sufficient.

**Polling frequency:** Unless you suspect active price warfare, daily is sufficient. For a brand actively repricing, hourly polling of 5–6 key ZIPs may be warranted.

### Storing ZIP Price Data in Supabase

```sql
CREATE TABLE zip_price_snapshots (
    id              bigserial PRIMARY KEY,
    asin            text NOT NULL,
    marketplace_id  text NOT NULL DEFAULT 'amazon.com',
    zip_code        text NOT NULL,
    price           numeric(10,2),
    currency        text NOT NULL DEFAULT 'USD',
    is_prime        boolean,
    seller_id       text,
    seller_name     text,
    is_buybox        boolean DEFAULT true,
    is_fba          boolean,
    scraped_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_zip_price_asin_zip_ts 
    ON zip_price_snapshots (asin, zip_code, scraped_at DESC);
```

**Detecting regional price variations:**

```sql
-- Find ASINs with >$2 price spread across ZIPs in the last 24 hours
SELECT 
    asin,
    MAX(price) - MIN(price) AS price_spread,
    MAX(price) AS max_price,
    MIN(price) AS min_price,
    COUNT(DISTINCT zip_code) AS zips_polled
FROM zip_price_snapshots
WHERE scraped_at > now() - interval '24 hours'
GROUP BY asin
HAVING MAX(price) - MIN(price) > 2.00
ORDER BY price_spread DESC;
```

---

## 6. Keepa Overview

### What Keepa Is

[Keepa](https://keepa.com/) is the gold standard for **historical Amazon price and sales rank data**. Where Rainforest gives you a live snapshot of any Amazon page, Keepa gives you years of price history for virtually every ASIN. Keepa has been scraping Amazon since 2013 and maintains time-series records going back to its founding for millions of products.

### What Keepa Uniquely Provides

| Data Type | Available | How Far Back |
|---|---|---|
| Price history (Amazon, 3P, used) | ✅ | Since ~2013 (product dependent) |
| Sales rank (BSR) history | ✅ | Since ~2013 |
| Buybox price history | ✅ | Since ~2015 |
| Stock availability history | ✅ | Since ~2015 |
| Rating/review count history | ✅ | Since ~2017 |
| New offers count history | ✅ | Since ~2016 |
| Deal alerts | ✅ | Real-time |
| Estimated sales (Keepa Sales Rank data) | ✅ (Tokens) | Current estimate |

**The core value proposition:** Keepa lets you answer questions like:
- "What has this competitor's price done over the last 2 years?"
- "When does this ASIN's BSR spike? (Seasonality pattern)"
- "How long has the buybox been suppressed?"
- "When did this product first appear on Amazon?"
- "Is this seller's price rising or falling over time?"

This is data you simply cannot get anywhere else in this form.

### API Access Model

Keepa uses a **tokens-based API**, not subscription tiers. You buy tokens and spend them per request. Tokens do not expire.

**Pricing (2026 approximate):**
- 1,000 tokens: ~$18
- 10,000 tokens: ~$150
- 100,000 tokens: ~$1,100
- Bulk rates available for >500k

Each API request for a product with full data costs tokens based on the data returned. A typical product request costs 1–5 tokens depending on the depth of history requested.

**Token replenishment (free tier):** Keepa provides a limited free API with 1 token that replenishes per minute — suitable for testing, not production.

---

## 7. Keepa API In Depth

### Authentication

All requests use an `key` query parameter:

```
https://api.keepa.com/product?key=YOUR_API_KEY&domain=1&asin=B08N5WRWNW
```

### Domain Codes

Keepa uses numeric domain codes, not domain strings:

| Code | Marketplace |
|---|---|
| 1 | amazon.com |
| 2 | amazon.co.uk |
| 3 | amazon.de |
| 4 | amazon.fr |
| 5 | amazon.co.jp |
| 6 | amazon.ca |
| 8 | amazon.it |
| 9 | amazon.es |
| 10 | amazon.in |
| 11 | amazon.com.mx |

### Product Endpoint

```
GET https://api.keepa.com/product
  ?key=YOUR_API_KEY
  &domain=1
  &asin=B08N5WRWNW
  &stats=90        (days of statistical summaries)
  &history=1       (include full price history)
  &offers=20       (include up to N live offers)
  &rating=1        (include review history)
```

**Multiple ASINs in one call:**

```
?asin=B08N5WRWNW,B07CZ4NZP3,B09X4FT1PZ
```

Up to 100 ASINs per request. Token cost is cumulative.

### Response Structure

```json
{
  "timestamp": 1746520800000,
  "tokensLeft": 4523,
  "products": [
    {
      "asin": "B08N5WRWNW",
      "title": "Product Title",
      "domainId": 1,
      "productType": 0,
      "categories": [284507, 3746451],
      "rootCategory": 284507,
      "csv": [...],
      "stats": {...},
      "offers": [...],
      "rating": [...]
    }
  ]
}
```

### Understanding the csv Array — Keepa's Time-Series Format

The `csv` array is Keepa's compressed time-series format. It is an array of arrays, indexed by **data type**. Each inner array is a flat alternating list of `[keepa_time, value, keepa_time, value, ...]`.

**csv index mapping (key ones):**

| Index | Data Type | Unit |
|---|---|---|
| 0 | Amazon price | Cent values (integer, divide by 100) |
| 1 | Marketplace (3P) new price | Cent values |
| 2 | Marketplace used price | Cent values |
| 3 | Sales rank | Rank integer |
| 7 | Rating | Rating × 10 (e.g. 45 = 4.5 stars) |
| 8 | Review count | Integer |
| 9 | New offers count | Integer |
| 11 | FBA 3P price (new) | Cent values |
| 18 | Buybox price | Cent values |

**Keepa time:** Keepa stores time as minutes since January 1, 2011 (00:00 UTC). Convert to Unix timestamp:

```python
import datetime

KEEPA_EPOCH = datetime.datetime(2011, 1, 1, tzinfo=datetime.timezone.utc)

def keepa_time_to_datetime(keepa_minutes: int) -> datetime.datetime:
    return KEEPA_EPOCH + datetime.timedelta(minutes=keepa_minutes)

def decode_keepa_csv(csv_array: list) -> list[dict]:
    """Decode a Keepa csv array into a list of (datetime, value) pairs."""
    results = []
    for i in range(0, len(csv_array), 2):
        keepa_minutes = csv_array[i]
        value = csv_array[i + 1]
        if keepa_minutes == -1 or value == -1:
            continue  # -1 means no data at this point
        dt = keepa_time_to_datetime(keepa_minutes)
        results.append({"timestamp": dt.isoformat(), "value": value})
    return results
```

**Example: Extract price history from Keepa response:**

```python
def extract_price_history(product: dict) -> list[dict]:
    csv = product.get("csv", [])
    if len(csv) <= 18:
        return []
    
    buybox_csv = csv[18]  # Index 18 = buybox price
    if not buybox_csv:
        return []
    
    raw_points = decode_keepa_csv(buybox_csv)
    return [
        {
            "timestamp": p["timestamp"],
            "price_usd": p["value"] / 100  # Keepa stores as cents
        }
        for p in raw_points
        if p["value"] > 0
    ]
```

### Storing Keepa Data in Supabase

```sql
CREATE TABLE keepa_price_history (
    id              bigserial PRIMARY KEY,
    asin            text NOT NULL,
    domain_id       integer NOT NULL DEFAULT 1,
    data_type       text NOT NULL,  -- 'amazon', 'buybox', 'marketplace_new', 'bsr', etc.
    recorded_at     timestamptz NOT NULL,
    value           numeric(12,2),
    raw_keepa_value integer
);

CREATE UNIQUE INDEX idx_keepa_asin_type_ts 
    ON keepa_price_history (asin, domain_id, data_type, recorded_at);

CREATE INDEX idx_keepa_asin_ts 
    ON keepa_price_history (asin, recorded_at DESC);
```

**Upserting Keepa history (avoid duplicates on re-import):**

```sql
INSERT INTO keepa_price_history (asin, domain_id, data_type, recorded_at, value, raw_keepa_value)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (asin, domain_id, data_type, recorded_at) 
DO NOTHING;
```

**Token efficiency tip:** Keepa history is largely static for past events. Don't re-fetch full history every time. Instead, fetch once to seed historical data, then use a `since` timestamp to request only incremental data on subsequent calls.

---

## 8. Third-Party Tool APIs: When Managed Beats DIY

Beyond Rainforest and Keepa, a handful of paid tools offer APIs worth knowing about. Here's an honest assessment of each.

### Helium 10

Helium 10 is primarily a seller tool suite (keyword research, listing optimization, PPC management). Their **Cerebro** tool has no public API — data is accessible via their web interface only. Community solutions exist (browser scraping of the UI) but these are fragile and violate their ToS.

**Verdict:** No reliable API. Don't build automated workflows on top of Helium 10 data extraction. Use their tools manually for research, then bring findings into Supabase manually.

### Data Hawk

[Data Hawk](https://www.datahawk.co/) offers a proper API for Amazon rank tracking, product monitoring, and market analytics. It's enterprise-priced (~$500+/month) and targeted at brands doing serious market share analysis.

**Verdict:** Justifiable for enterprise clients with multiple brands and six-figure ad spends. Overkill for most syncflow use cases where Rainforest + Keepa covers the same ground.

### Jungle Scout API

Jungle Scout has an API available on their higher-tier plans. It exposes estimated monthly sales volume, keyword search volume, and product database queries. The **Jungle Scout API** is primarily for **sales velocity estimates** — something neither Rainforest nor Keepa provides directly.

**Verdict:** If sales volume estimation is a critical workflow input (e.g., market opportunity sizing), Jungle Scout's API is the right call. Plan for $600–800/month. If you're already paying for Jungle Scout for manual research, check if the API tier is accessible.

### Sellerboard API

Sellerboard is primarily a P&L tool for sellers. Their API gives access to profit/loss data, which is useful only for sellers using Sellerboard — not for competitor intelligence.

**Verdict:** Relevant only for direct client analytics integration. Not a competitive intelligence tool.

### Summary Comparison

| Tool | Best For | API? | Approximate Cost |
|---|---|---|---|
| Rainforest API | Live competitor data, search rank, offers | ✅ REST | $50–1,200/mo |
| Keepa | Historical price/BSR, trend analysis | ✅ REST | ~$18/1k tokens |
| Jungle Scout | Sales volume estimates | ✅ (higher tiers) | $600+/mo |
| Helium 10 | Keyword research (manual) | ❌ No public API | $100–450/mo |
| Data Hawk | Enterprise market share analytics | ✅ REST | $500+/mo |

---

## 9. Custom Scraping: When to Roll Your Own

### The Case Against Rolling Your Own (Most of the Time)

Before going down the custom scraper path, be clear-eyed about the costs:

- **Anti-bot infrastructure:** Amazon aggressively detects and blocks scrapers. You need rotating residential proxies (Brightdata, Oxylabs, Smartproxy) at ~$5–15/GB. A single product page is ~100KB, so 10,000 requests = 1GB = $5–15 just in proxy costs — comparable to Rainforest.
- **Maintenance tax:** Amazon changes its HTML structure periodically, breaking your parsers. You will spend engineering time maintaining this, not building product.
- **JS rendering:** Amazon's pages are largely server-rendered, but some sections (delivery estimates, price personalisation) require JavaScript execution. That means Playwright or Puppeteer — slow and memory-heavy.
- **Legal risk:** Custom scraping puts you directly in violation of Amazon's ToS. Rainforest assumes that liability (they're the one scraping). You don't.

**When custom scraping makes sense:**

1. You need data that Rainforest doesn't expose (e.g., specific page structures, A/B test variants Amazon is running)
2. You're accessing your own Seller Central pages (where you have authorisation) and SP-API doesn't expose the data you need
3. The request volume is very low (< 100/day) and the data is one-time research, not ongoing monitoring

### Python + Playwright Approach (When You Must)

```python
import asyncio
from playwright.async_api import async_playwright

PROXY = "http://user:pass@residential-proxy.example.com:8080"

async def scrape_amazon_page(url: str, zip_code: str = None) -> str:
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            proxy={"server": PROXY},
            headless=True
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...",
            locale="en-US",
            timezone_id="America/New_York"
        )
        
        if zip_code:
            # Set ZIP code cookie before loading product page
            await context.add_cookies([{
                "name": "lc-main",
                "value": f"en_US",
                "domain": ".amazon.com",
                "path": "/"
            }])
        
        page = await context.new_page()
        
        # Randomise delay to appear human
        await asyncio.sleep(1.5 + (asyncio.get_event_loop().time() % 2))
        
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        
        html = await page.content()
        await browser.close()
        return html
```

**Honest assessment:** This will work initially. It will break within weeks. Amazon's bot detection is extremely sophisticated — it fingerprints JavaScript execution patterns, mouse movement (if rendered), IP reputation, request cadence, and more. A static Playwright script will be blocked at scale. If you go this route, budget for ongoing maintenance and proxy costs that may exceed Rainforest's pricing anyway.

### The ToS Risk Gradient

```
LOWER RISK ←————————————————————————————→ HIGHER RISK

Rainforest API         Keepa              Custom Playwright
(they scrape,          (they scraped,     (you scrape Amazon
 you use their         you use their      directly — clear
 API — they hold       historical data)   ToS violation)
 the legal exposure)
```

Rainforest and Keepa are not immune to Amazon legal action, but they've operated for years and have legal teams managing that risk. If you build and operate a custom scraper at scale, you own that risk directly.

---

## 10. Storing Scraped Data in Supabase

### Core Schema Patterns

#### Competitor Price Tracking

```sql
CREATE TABLE competitor_prices (
    id              bigserial PRIMARY KEY,
    asin            text NOT NULL,
    marketplace_id  text NOT NULL DEFAULT 'amazon.com',
    seller_id       text,
    seller_name     text,
    price           numeric(10,2) NOT NULL,
    currency        text NOT NULL DEFAULT 'USD',
    is_buybox       boolean NOT NULL DEFAULT false,
    is_fba          boolean,
    is_prime        boolean,
    zip_code        text,
    scraped_at      timestamptz NOT NULL DEFAULT now(),
    data_source     text NOT NULL DEFAULT 'rainforest'  -- 'rainforest', 'keepa', 'custom'
);

-- Partial index for fast recent-price lookups
CREATE INDEX idx_comp_prices_asin_recent 
    ON competitor_prices (asin, marketplace_id, scraped_at DESC)
    WHERE scraped_at > now() - interval '30 days';
```

#### Listing Change Tracking

```sql
CREATE TABLE listing_snapshots (
    id              bigserial PRIMARY KEY,
    asin            text NOT NULL,
    marketplace_id  text NOT NULL DEFAULT 'amazon.com',
    title           text,
    bullet_count    integer,
    image_count     integer,
    video_count     integer,
    has_aplus       boolean,
    bsr_main        integer,      -- BSR in primary category
    bsr_sub         integer,      -- BSR in sub-category
    rating          numeric(3,1),
    review_count    integer,
    scraped_at      timestamptz NOT NULL DEFAULT now(),
    content_hash    text          -- MD5 of title+bullets for change detection
);

CREATE INDEX idx_listing_snapshots_asin_ts 
    ON listing_snapshots (asin, scraped_at DESC);
```

#### Search Rank Tracking

```sql
CREATE TABLE search_rank_history (
    id              bigserial PRIMARY KEY,
    keyword         text NOT NULL,
    asin            text NOT NULL,
    marketplace_id  text NOT NULL DEFAULT 'amazon.com',
    organic_rank    integer,      -- null if not found on page 1-3
    sponsored_rank  integer,      -- null if no sponsored placement found
    page_scraped    integer NOT NULL DEFAULT 1,
    scraped_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_search_rank_keyword_asin_ts 
    ON search_rank_history (keyword, asin, marketplace_id, scraped_at);
```

### Deduplication with INSERT ON CONFLICT

For price data where you only want to store changes (not identical repeated rows):

```sql
-- Option 1: Skip exact duplicates entirely
INSERT INTO competitor_prices (asin, marketplace_id, seller_id, price, is_buybox, scraped_at)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT DO NOTHING;

-- Option 2: Store only when price changes (compare to last stored value)
INSERT INTO competitor_prices (asin, marketplace_id, seller_id, price, is_buybox, scraped_at)
SELECT $1, $2, $3, $4::numeric, $5, $6::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM competitor_prices cp
    WHERE cp.asin = $1
      AND cp.marketplace_id = $2
      AND cp.seller_id = $3
      AND cp.price = $4::numeric
      AND cp.scraped_at > now() - interval '1 hour'
);
```

### Change Detection with content_hash

For listing snapshots, compute a hash of the content you care about before inserting. Only insert a new row if the hash changed:

```python
import hashlib
import json

def compute_listing_hash(product: dict) -> str:
    """Compute a stable hash of the listing content we track for changes."""
    content = {
        "title": product.get("title", ""),
        "feature_bullets": sorted(product.get("feature_bullets", [])),
        "images_count": product.get("images_count", 0),
        "has_a_plus": product.get("has_a_plus", False)
    }
    return hashlib.md5(json.dumps(content, sort_keys=True).encode()).hexdigest()
```

In Supabase, check if the hash changed before inserting:

```sql
INSERT INTO listing_snapshots (asin, title, bullet_count, image_count, has_aplus, scraped_at, content_hash)
SELECT $1, $2, $3, $4, $5, $6, $7
WHERE NOT EXISTS (
    SELECT 1 FROM listing_snapshots
    WHERE asin = $1
      AND content_hash = $7
      AND scraped_at > now() - interval '24 hours'
);
```

This dramatically reduces storage — for a stable listing, you only get one row per day instead of one per polling cycle.

---

## 11. n8n Integration Patterns

### Basic HTTP Request Node Setup

Configure the HTTP Request node for Rainforest calls:

```
Method:     GET
URL:        https://api.rainforestapi.com/request
Authentication: None (key is in query params)

Query Parameters:
  api_key     → {{ $credentials.rainforestApiKey }}  (or hardcoded from n8n credential)
  type        → product
  asin        → {{ $json.asin }}
  amazon_domain → amazon.com
```

Store the `api_key` in an n8n credential of type "Generic Credential" → "Header Auth" or just use "Query Auth" with parameter name `api_key`.

### Cron Trigger for Scheduled Polling

```json
{
  "node": "Schedule Trigger",
  "parameters": {
    "rule": {
      "interval": [{ "field": "hours", "hoursInterval": 6 }]
    }
  }
}
```

Every 6 hours is a reasonable default for competitive price monitoring. Daily (every 24h) is fine for listing change detection.

### Batching Multiple ASINs Efficiently

Don't call the API once per ASIN sequentially. Use the Split In Batches node to process in parallel:

```
[Start Trigger]
     ↓
[Supabase — Get ASIN List]
  SQL: SELECT asin FROM monitored_asins WHERE active = true
     ↓
[Split In Batches]
  Batch Size: 5  (5 parallel Rainforest requests)
     ↓
[HTTP Request — Rainforest Product]
  URL: https://api.rainforestapi.com/request?type=product&asin={{ $json.asin }}&...
     ↓
[Supabase — Insert competitor_prices]
```

> ⚠️ Don't set batch size > 10. Rainforest enforces rate limits (~5 requests/second on Starter). Hitting the limit wastes credits on retried requests and may cause n8n execution failures.

### Error Handling for Failed Requests

Add error handling at the HTTP Request node level:

```
On Error: Continue (don't stop the whole workflow for one failed ASIN)
```

Then add an IF node after the HTTP Request:

```
Condition: {{ $json.request_info.success }} is false
  → True branch: Log to Supabase error_log table with asin, error_message, timestamp
  → False branch: Continue to data processing
```

**Error log table:**

```sql
CREATE TABLE scraping_error_log (
    id          bigserial PRIMARY KEY,
    source      text NOT NULL,  -- 'rainforest', 'keepa'
    request_type text,
    asin        text,
    error_code  text,
    error_msg   text,
    occurred_at timestamptz NOT NULL DEFAULT now()
);
```

### Async Rainforest Calls in n8n

For large batches (>50 ASINs), use async mode to avoid HTTP timeout:

1. Send all requests with `async=true&callback=https://your-n8n.com/webhook/rainforest-result`
2. n8n Webhook node receives each result as it completes
3. Process and store each result independently

This decouples submission from processing and handles Amazon's variable response times gracefully.

### Keepa API in n8n

```
Method: GET
URL: https://api.keepa.com/product
Query Parameters:
  key   → {{ $credentials.keepaApiKey }}
  domain → 1
  asin  → {{ $json.asins.join(',') }}  (up to 100 ASINs per call)
  history → 1
  stats → 90
  rating → 1
```

Note that Keepa returns a `tokensLeft` value in every response. Add a check after each call:

```
IF tokensLeft < 100 → send Slack/ClickUp alert "Keepa tokens running low"
```

Running out of tokens mid-workflow silently fails without this guard.

---

## 12. Legal & ToS Posture

### Amazon's Position on Automated Access

Amazon's Conditions of Use explicitly prohibit:

> "...use of any robot, spider, scraper or other automated means to access the Amazon Services for any purpose without our express written permission..."

This applies to their public-facing pages. They protect this through robot.txt declarations, CAPTCHA challenges, IP blocking, browser fingerprinting, and legal action for egregious violators.

### The Managed API Shield

Services like Rainforest API and Keepa occupy a grey zone: they scrape Amazon on your behalf and sell you the data. They operate openly as businesses, have been operating for years, and Amazon has not shut them down. This is partly because:

1. Amazon uses the threat of ToS enforcement selectively — large-scale commercial scraping operations are the primary target
2. The data returned is public (no personal data, no seller backend access)
3. There is no clear legal precedent in the US that prohibits scraping publicly accessible data (hiQ v. LinkedIn was significant; EU has different rules)

**From a practical standpoint:** Using Rainforest API or Keepa is materially safer than operating your own scraper. They hold the infrastructure, they've built compliance and legal posture around it, and they're the party with a relationship with Amazon's legal team (if any).

### Risk Gradient Summary

| Approach | Amazon ToS | Operational Risk | Your Legal Exposure |
|---|---|---|---|
| Rainforest API | Violates Amazon ToS (Rainforest's problem) | Low — managed, reliable | Minimal — you're a customer of a legal service |
| Keepa API | Same as Rainforest | Low — established service | Minimal |
| Jungle Scout API | Same | Low | Minimal |
| Custom Playwright scraper | Violates Amazon ToS (your problem) | High — maintenance, blocks | Moderate — you are the party scraping |
| Automated Seller Central access beyond SP-API | Violates ToS + potential account suspension | Very high | High |

**Bottom line:** For syncflow workflows, use managed APIs (Rainforest, Keepa). Never build custom scrapers for ongoing production workflows. The cost difference doesn't justify the risk, the maintenance, or the complexity.

---

## 13. Cost Discipline

At $0.01 per Rainforest credit, naive polling strategies get expensive fast. Here's the framework for staying in control.

### Request Minimisation Principles

**1. Only fetch what you'll use.** Don't call `type=product` just to check if the price changed — use `type=offers` which is cheaper and returns price faster.

**2. Stagger your polling by data freshness requirement.** Not all data changes at the same rate:

| Data Type | Recommended Poll Frequency | Rainforest Type |
|---|---|---|
| Buybox price | Every 4–6 hours | `offers` |
| Competitor offers list | Daily | `offers` |
| Listing content (title, bullets) | Daily | `product` |
| Search rank for keywords | Daily | `search` |
| BSR tracking | Daily | `product` |
| Review count | Weekly | `product` |
| Best sellers list | Weekly | `bestsellers` |
| Full ZIP rotation | Daily (per ZIP set) | `product` or `offers` |

**3. Cache aggressively.** Before making a Rainforest call, check the last scraped timestamp in Supabase. If the data is recent enough, skip the call:

```sql
SELECT scraped_at FROM competitor_prices
WHERE asin = $1 AND scraped_at > now() - interval '4 hours'
LIMIT 1;
```

If this returns a row, skip the Rainforest call.

**4. Don't poll inactive ASINs.** Maintain an `active` flag on your ASIN watchlist. Only poll ASINs currently relevant to active campaigns or analysis.

**5. Use async mode for large batches.** Synchronous requests can time out and retry, costing duplicate credits. Async eliminates this.

### Sample Monthly Cost Estimate

**Scenario:** 50 competitor ASINs, US marketplace, daily monitoring

| Action | Volume | Frequency | Monthly Requests | Cost @ $0.008 |
|---|---|---|---|---|
| Offers check (50 ASINs) | 50 | 4×/day | 6,000 | $48 |
| Product snapshot (50 ASINs) | 50 | 1×/day | 1,500 | $12 |
| Search rank (20 keywords) | 20 | 1×/day | 600 | $4.80 |
| ZIP rotation (10 ZIPs × 50 ASINs) | 500 | 1×/day | 15,000 | $120 |
| **Total** | | | **23,100** | **~$185/mo** |

At Business tier (50K credits at ~$380/mo), this is well within budget with room to spare. At Starter tier, you'd exceed your 5K credits in under a week on this volume — move to Business immediately.

---

## 14. End-to-End Use Case: ZIP-Rotation Price Monitor

### Goal

Monitor 50 competitor ASINs across 10 US ZIP codes, detect price drops > $2 in any ZIP, and create a ClickUp task for the brand manager when detected.

### Architecture

```
n8n Schedule Trigger (every 6 hours)
         ↓
Supabase: Fetch active ASIN list
  SELECT asin FROM monitored_asins WHERE active = true LIMIT 50
         ↓
Split In Batches (batch size: 5)
         ↓
For each ASIN: Loop over 10 ZIP codes
  ↓ [HTTP Request — Rainforest offers]
  URL: .../request?type=offers&asin={asin}&zip_code={zip}&api_key=...
         ↓
Extract: buybox price, seller, is_fba, is_prime
         ↓
Supabase: INSERT INTO zip_price_snapshots ...
         ↓
Supabase: Check for price drops
  (compare current price to 7-day average for this asin+zip)
         ↓
IF price_drop > 2.00:
  → ClickUp: Create task "Price alert: {asin} dropped ${amount} in {zip}"
```

### Supabase: Price Drop Detection Query

```sql
-- Called after each batch of inserts
WITH recent_avg AS (
    SELECT 
        asin,
        zip_code,
        AVG(price) AS avg_price_7d
    FROM zip_price_snapshots
    WHERE scraped_at > now() - interval '7 days'
      AND scraped_at < now() - interval '6 hours'  -- exclude current scrape
    GROUP BY asin, zip_code
),
current_price AS (
    SELECT DISTINCT ON (asin, zip_code)
        asin,
        zip_code,
        price AS current_price,
        scraped_at
    FROM zip_price_snapshots
    ORDER BY asin, zip_code, scraped_at DESC
)
SELECT 
    cp.asin,
    cp.zip_code,
    cp.current_price,
    ra.avg_price_7d,
    ra.avg_price_7d - cp.current_price AS price_drop
FROM current_price cp
JOIN recent_avg ra USING (asin, zip_code)
WHERE ra.avg_price_7d - cp.current_price > 2.00
ORDER BY price_drop DESC;
```

### n8n ClickUp Task Creation

When the price drop query returns results, create a ClickUp task:

```json
{
  "name": "⚠️ Price Alert: {{ $json.asin }} dropped ${{ $json.price_drop.toFixed(2) }} in ZIP {{ $json.zip_code }}",
  "description": "Current price: ${{ $json.current_price }}\n7-day avg: ${{ $json.avg_price_7d }}\nDrop: ${{ $json.price_drop.toFixed(2) }}\n\nDetected: {{ $now.toISO() }}",
  "priority": 2,
  "due_date": "{{ $now.plus({hours: 24}).toMillis() }}",
  "tags": ["price-alert", "competitor-intelligence"]
}
```

---

## 15. Competitive ASIN Monitoring Patterns

### Detecting Listing Changes

1. Scrape `type=product` daily for tracked competitor ASINs
2. Compute `content_hash` from title + bullets + image count
3. Compare to yesterday's stored `content_hash`
4. If changed: trigger a ClickUp task with a diff summary

**Diff generation in n8n Code node:**

```javascript
const yesterday = $input.first().json.previous_snapshot;
const today = $input.first().json.current_snapshot;
const changes = [];

if (yesterday.title !== today.title) {
  changes.push(`Title changed:\n  Old: ${yesterday.title}\n  New: ${today.title}`);
}
if (yesterday.bullet_count !== today.bullet_count) {
  changes.push(`Bullet count: ${yesterday.bullet_count} → ${today.bullet_count}`);
}
if (yesterday.image_count !== today.image_count) {
  changes.push(`Image count: ${yesterday.image_count} → ${today.image_count}`);
}
if (yesterday.has_aplus !== today.has_aplus) {
  changes.push(`A+ content: ${yesterday.has_aplus} → ${today.has_aplus}`);
}

return [{ json: { asin: today.asin, changes: changes.join('\n'), changed: changes.length > 0 } }];
```

### Review Velocity Spike Detection

```sql
-- Reviews added in last 24h vs. rolling 30-day daily average
WITH daily_counts AS (
    SELECT 
        asin,
        DATE_TRUNC('day', scraped_at) AS day,
        MAX(review_count) AS review_count
    FROM listing_snapshots
    WHERE scraped_at > now() - interval '31 days'
    GROUP BY asin, DATE_TRUNC('day', scraped_at)
),
daily_deltas AS (
    SELECT 
        asin,
        day,
        review_count - LAG(review_count) OVER (PARTITION BY asin ORDER BY day) AS new_reviews
    FROM daily_counts
),
stats AS (
    SELECT
        asin,
        AVG(new_reviews) AS avg_daily_reviews,
        STDDEV(new_reviews) AS stddev_reviews
    FROM daily_deltas
    WHERE day < CURRENT_DATE
    GROUP BY asin
)
SELECT 
    dd.asin,
    dd.new_reviews AS today_new_reviews,
    s.avg_daily_reviews,
    ROUND(dd.new_reviews / NULLIF(s.avg_daily_reviews, 0), 1) AS velocity_multiplier
FROM daily_deltas dd
JOIN stats s USING (asin)
WHERE dd.day = CURRENT_DATE
  AND dd.new_reviews > s.avg_daily_reviews * 3  -- 3× spike threshold
ORDER BY velocity_multiplier DESC;
```

A 3× velocity multiplier means the competitor got 3 times their usual daily review count today — worth flagging.

### BSR Movement Tracking

```sql
-- Week-over-week BSR change
WITH weekly_bsr AS (
    SELECT
        asin,
        DATE_TRUNC('week', scraped_at) AS week,
        AVG(bsr_main) AS avg_bsr
    FROM listing_snapshots
    WHERE scraped_at > now() - interval '8 weeks'
    GROUP BY asin, DATE_TRUNC('week', scraped_at)
),
ranked AS (
    SELECT 
        asin,
        week,
        avg_bsr,
        LAG(avg_bsr) OVER (PARTITION BY asin ORDER BY week) AS prev_week_bsr
    FROM weekly_bsr
)
SELECT 
    asin,
    week,
    ROUND(avg_bsr) AS current_bsr,
    ROUND(prev_week_bsr) AS prev_bsr,
    ROUND(prev_week_bsr - avg_bsr) AS bsr_improvement  -- positive = moved up in rank
FROM ranked
WHERE week = DATE_TRUNC('week', now())
ORDER BY bsr_improvement DESC;
```

---

## 16. Common Pitfalls

### 1. Serving Stale Data from Cache Without Checking Freshness

**Problem:** You check the Supabase cache before calling Rainforest but use a TTL that's too long (e.g., 24 hours) for data that's actually needed at higher freshness (e.g., buybox price during a promotion).

**Fix:** Use data-type-specific TTLs (see Section 13 table). For price data during active promotions, drop to 1–2 hour TTL.

### 2. Rate Limit Errors Under Burst Load

**Problem:** An n8n workflow with a large ASIN list runs all requests in parallel with no throttling, hitting Rainforest's rate limit and getting 429 errors (which still consume partial credits in some configurations).

**Fix:** Use Split In Batches with a batch size of 5, add a Wait node of 1 second between batches, and route 429 responses to a retry queue with exponential backoff.

```
[HTTP Request]
    ↓
IF status_code == 429:
    → Wait 30 seconds → retry (max 3 times)
    → If still 429 → log to error table, continue
```

### 3. Keepa Tokens Draining Silently

**Problem:** A workflow requests 50 ASINs at a time from Keepa with full history, burning tokens faster than expected. You only notice when requests start failing.

**Fix:** Check `tokensLeft` in every Keepa response. Alert at 200 tokens, halt non-essential calls at 50 tokens.

### 4. ZIP Code Data Causing False Price Alerts

**Problem:** ZIP code rotation causes alerts because some ZIP codes legitimately have different prices — you alert on every difference, creating noise.

**Fix:** Only alert when price in a ZIP drops below the **minimum** across all ZIPs in the set. A price of $24 in Chicago is only noteworthy if other ZIPs show $29. Use the SQL pattern in Section 5 to detect spread, not individual ZIP prices.

### 5. Content Hash False Negatives

**Problem:** You compute a hash of title + bullets for change detection, but minor whitespace differences in Amazon's HTML cause different hashes even when the content is functionally identical.

**Fix:** Normalize content before hashing: strip leading/trailing whitespace, normalize Unicode, sort bullets before hashing.

```python
import unicodedata

def normalize_for_hash(text: str) -> str:
    text = unicodedata.normalize('NFC', text)
    return ' '.join(text.split())  # collapse all whitespace
```

### 6. Rainforest Async Webhook Reliability

**Problem:** You use async mode for large batches, but some webhook callbacks never arrive (Rainforest has rare reliability hiccups, or n8n's webhook URL temporarily unreachable).

**Fix:** Track request IDs. After submitting async requests, log them to a `pending_scrape_jobs` table. A separate workflow runs every hour and checks for jobs older than 30 minutes that haven't been fulfilled, then re-requests them synchronously.

### 7. Browser Fingerprinting on Custom Scrapers

**Problem:** Your Playwright scraper works fine initially, then gets increasingly blocked. You rotate proxies but still get CAPTCHAs.

**Root cause:** Amazon fingerprints browser automation tooling — specific Chrome DevTools Protocol patterns, webdriver properties, missing browser APIs. A vanilla Playwright instance is identifiable even with residential proxies.

**Fix:** Use `playwright-stealth` (Python: `playwright-stealth` package) to patch the most obvious telltale signs. Even then, expect cat-and-mouse. This is the maintenance cost of going custom.

---

## 17. Dos & Don'ts

### ✅ Dos

1. **Use Rainforest API for all live Amazon data needs.** It handles proxy rotation, JavaScript rendering, anti-bot evasion, and retries. You get clean JSON. Pay the per-call cost; it's worth it.

2. **Use Keepa for any analysis that needs historical data.** Historical price trends, BSR seasonality, competitor trajectory over time — Keepa's historical depth is irreplaceable.

3. **Store your API keys in n8n credential store, not in workflow JSON.** Credential store is encrypted; workflow JSON is not. A credential leak is bad; a workflow export with hardcoded keys is catastrophic.

4. **Implement TTL-based caching before every Rainforest call.** Check Supabase first. If recent enough data exists, skip the API call. This alone can cut your monthly credit usage by 60–70% on stable data.

5. **Poll `type=offers` for price intelligence, not `type=product`.** Offers is faster, more price-specific, and contains all seller information. `type=product` is for full listing data.

6. **Track `tokensLeft` on every Keepa response.** Add an alert workflow that fires when tokens drop below 500. Keepa doesn't pro-rate failed requests — running out mid-analysis means waiting for a recharge.

7. **Use ZIP rotation for any client managing multiple US regions.** The pricing variation across geographies is real and actionable. Without it, you're making strategy decisions on incomplete data.

8. **Store only changes, not every poll result.** Use `ON CONFLICT DO NOTHING` or content_hash checks to avoid filling your Supabase storage with identical rows. Compact storage keeps queries fast.

9. **Use async mode for batches of >20 Rainforest requests.** Async avoids n8n execution timeouts, handles variable Amazon response times gracefully, and decouples submission from processing.

10. **Use SP-API for your own data and Rainforest for competitor data.** They are complementary, not competing. SP-API gives you perfect, authoritative data about your own account. Rainforest gives you competitive intelligence. Use both.

11. **Alert on BSR spikes AND drops.** A BSR improvement for a competitor means they're gaining velocity — investigate why. A BSR drop might mean a promotion ended or stock ran low.

12. **Use Keepa tokens for bulk/historical requests; Rainforest for real-time.** Keepa is cheap for historical data because it fetches from its own database, not from Amazon live. Rainforest is better for real-time/current state.

---

### ❌ Don'ts

1. **Don't build a custom Playwright scraper for ongoing production monitoring.** Amazon will detect and block it. You'll spend more on maintenance and proxy costs than Rainforest charges, and you own the ToS liability.

2. **Don't poll the same ASIN more frequently than your business logic actually requires.** Hourly product scraping of stable ASINs is wasteful. Tier your frequency by data type and urgency.

3. **Don't use `type=product` to check prices.** It returns the entire listing — images, A+ content, reviews, categories — when all you needed was the price. Use `type=offers` for pricing intelligence.

4. **Don't ignore `request_info.success` in Rainforest responses.** Always check it before processing the response body. Processing a failed response as if it succeeded produces silently corrupt data in Supabase.

5. **Don't assume prices are stable across ZIP codes.** A single ZIP poll is not representative. If your monitoring shows a competitor at $29.99, they may be at $26.99 in three other major metros.

6. **Don't scrape Seller Central or Vendor Central pages.** This directly accesses authenticated, non-public pages and constitutes account-level ToS violation with the risk of account suspension. Use SP-API for anything behind a login.

7. **Don't store Keepa's raw csv arrays in Supabase.** Decode them first. Storing raw compressed arrays is opaque, hard to query, and wastes space. Decode to typed rows (timestamp, value) at ingestion time.

8. **Don't start a custom scraper because Rainforest was down for an hour.** Rainforest has 99%+ uptime. Build retry/backoff logic, not a parallel scraping infrastructure.

9. **Don't build workflows that blindly re-scrape all ASINs on every run.** Maintain a priority queue. Recently changed ASINs (detected via content_hash change) deserve more frequent polling; stable ASINs need less.

10. **Don't skip error logging.** Every failed Rainforest request should be logged to `scraping_error_log` with the ASIN, request type, error code, and timestamp. Without this, diagnosing systematic failures (rate limits, credit exhaustion, Amazon blocking certain ASINs) is guesswork.

11. **Don't use the Keepa free tier for production.** One token per minute is not a workflow — it's a testing tool. Buy tokens before building workflows that depend on Keepa.

12. **Don't confuse Rainforest's `amazon_url` in the response metadata with a reliable canonical URL.** Amazon URLs are full of tracking parameters and can change. Use the ASIN as your canonical identifier, always.

---

## 18. Quick Reference Cheat Sheet

### Rainforest API

| Need | Type | Key Params |
|---|---|---|
| Full listing data | `product` | `asin`, `zip_code` |
| Competitor prices | `offers` | `asin`, `zip_code` |
| Organic search rank | `search` | `search_term`, `page` |
| Recent reviews | `reviews` | `asin`, `sort_by=recent` |
| Category BSR leaders | `bestsellers` | `category_id` |

```
Base URL: https://api.rainforestapi.com/request
Auth:     ?api_key=YOUR_KEY (query param)
Credits:  check request_info.credits_remaining in response
```

### Keepa API

| Need | Parameters |
|---|---|
| Price history | `history=1`, `csv` index 0 (Amazon), 18 (buybox) |
| BSR history | `history=1`, `csv` index 3 |
| Review history | `rating=1` |
| Live offers | `offers=20` |

```
Base URL: https://api.keepa.com/product
Auth:     ?key=YOUR_KEY (query param)
Tokens:   check tokensLeft in response
Time:     Keepa minutes since 2011-01-01 UTC
Price:    integer cents (divide by 100)
```

### Supabase Key Tables

| Table | Purpose |
|---|---|
| `competitor_prices` | Live price snapshots from Rainforest |
| `zip_price_snapshots` | ZIP-code level price variation |
| `listing_snapshots` | Content change tracking (title, bullets, images) |
| `search_rank_history` | Keyword rank over time |
| `keepa_price_history` | Decoded Keepa historical time-series |
| `scraping_error_log` | Failed requests for diagnostics |

### n8n Pattern Summary

```
Cron → Supabase (get ASINs) → Split In Batches (5)
  → HTTP Request (Rainforest) → IF success? 
    → [Yes] Supabase insert → IF change?
        → [Yes] ClickUp task
    → [No] Error log
```

---

*This document is part of the syncflow expert reference library. Cross-reference with `amazon-sp-api.md` for owned account data and `supabase.md` for database architecture patterns. Pricing and API specifications change — verify against official documentation before quoting or building.*
