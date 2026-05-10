# Skills Bible — Master Reference

> Last updated: 2026-05-07 | 22 skill documents synthesized

---

## Table of Contents

1. [Amazon Ecosystem](#1-amazon-ecosystem)
   - [1.1 SP-API](#11-sp-api)
   - [1.2 Advertising API](#12-advertising-api)
   - [1.3 Brand APIs](#13-brand-apis)
   - [1.4 Brand Registry (Advanced)](#14-brand-registry-advanced)
   - [1.5 Keyword Research](#15-keyword-research)
   - [1.6 Multi-Marketplace Patterns](#16-multi-marketplace-patterns)
   - [1.7 Rainforest / Scrapers](#17-rainforest--scrapers)
2. [Automation & Workflow](#2-automation--workflow)
   - [2.1 n8n](#21-n8n)
   - [2.2 Webhooks & Event-Driven Patterns](#22-webhooks--event-driven-patterns)
   - [2.3 ClickUp for Amazon Business](#23-clickup-for-amazon-business)
3. [AI & Claude Tools](#3-ai--claude-tools)
   - [3.1 Claude Code](#31-claude-code)
   - [3.2 Claude Connectors, Cowork & Code](#32-claude-connectors-cowork--code)
4. [Infrastructure & Backend](#4-infrastructure--backend)
   - [4.1 Supabase](#41-supabase)
   - [4.2 Vercel + Next.js](#42-vercel--nextjs)
   - [4.3 Database Best Practices](#43-database-best-practices)
   - [4.4 Auth & Security Patterns](#44-auth--security-patterns)
   - [4.5 Local LLM / GPU](#45-local-llm--gpu)
5. [APIs & Integrations](#5-apis--integrations)
   - [5.1 Email & CRM APIs](#51-email--crm-apis)
   - [5.2 WhatsApp API](#52-whatsapp-api)
   - [5.3 Image Generation APIs](#53-image-generation-apis)
   - [5.4 Figma Plugin SDK](#54-figma-plugin-sdk)
6. [Project Management](#6-project-management)
   - [6.1 Project Management Apps for Amazon Brands](#61-project-management-apps-for-amazon-brands)
7. [Quick Reference Index](#7-quick-reference-index)

---

## 1. Amazon Ecosystem

### 1.1 SP-API

**What it is:** The Selling Partner API (SP-API) is Amazon's programmatic interface for seller/vendor account management. It replaced MWS (Marketplace Web Services) and is the only supported way to access Amazon seller data programmatically.

**Auth architecture — two-layer system:**

| Layer | Mechanism | Purpose |
|---|---|---|
| App authentication | LWA (Login with Amazon) — OAuth 2.0 | Identifies your developer app and authorizes access to a seller's account |
| Request signing | AWS SigV4 | Signs every individual API request |

Both are required on every call. Neither alone is sufficient.

**LWA Token Types:**

- **Refresh token** — long-lived (~1 year), represents a seller's authorization of your app, stored in Supabase Vault
- **Access token** — short-lived (1 hour), obtained by exchanging the refresh token, cached in memory, NEVER stored persistently
- **Restricted Data Token (RDT)** — required for any PII endpoint (order buyer info, addresses), obtained just-in-time per request, expires in 1 hour

**App types — Private vs Public:**

| Type | Use Case | Auth Difference |
|---|---|---|
| Private app | Automating your own accounts only | Simpler — no OAuth redirect flow needed |
| Public app | Multi-seller SaaS / agency | Full OAuth redirect → authorization code → refresh token exchange |

**XML Feeds are dead:** JSON_LISTINGS_FEED replaced them. Feeds API XML support was sunset July 31, 2025. If any workflow still uses `_POST_PRODUCT_DATA_` XML, it is broken.

**RDT — Breaking Change (2024):** Any SP-API endpoint that returns PII (buyer name, email, address) now requires a Restricted Data Token. You cannot just use the standard access token. RDT must be requested for the specific resource path you intend to call.

**Key APIs and their rate limits (token bucket model):**

| API Group | Default Rate | Burst | Notes |
|---|---|---|---|
| Orders | 0.0167/sec | 20 | Per selling partner + developer |
| Listings | 5/sec | 10 | Per account |
| Reports | 0.0222/sec | 10 | Report creation rate |
| Catalog Items | 2/sec | 2 | High-volume throttled |
| Feeds | 0.0083/sec | 15 | Feed document creation |

**SQS Notifications — critical setup rules:**
- The SQS principal that must be granted `SendMessage` permission is: `437568002678`
- You MUST use a standard SQS queue. FIFO queues are NOT supported by SP-API notifications.
- Set Visibility Timeout to at least 2× your expected processing time.

**Three architecture patterns:**

1. **Pull + webhook hybrid** — scheduled pulls for bulk data, SQS webhooks for real-time events (recommended)
2. **Pure webhook** — event-driven only; requires careful DLQ setup
3. **Pure pull** — simplest but misses real-time events; acceptable for reporting-only workflows

**Key Gotchas:**
- SigV4 requires exact UTC timestamps; clock skew > 5 minutes causes `InvalidSignatureException`
- Refresh tokens expire ~1 year but Amazon doesn't notify you — build proactive expiry monitoring
- Rate limits are per (selling partner, developer app) tuple — one rogue workflow can throttle all other workflows for that account
- The `x-amz-access-token` header (LWA) is separate from the `Authorization` header (SigV4) — both must be present
- XML Feeds sunset: use `JSON_LISTINGS_FEED` with `PATCH` operations instead

**Best Practices:**
- Use STS AssumeRole instead of direct IAM user credentials for AWS signing
- Cache access tokens with a 5-minute expiry buffer (1-hour token, start refresh at 55 minutes)
- Store refresh tokens in Supabase Vault, never in environment variables or workflow JSON
- Implement exponential backoff with jitter for 429 and 503 responses
- One LWA developer app per client organization — never share apps between clients

---

### 1.2 Advertising API

**What it is:** Amazon Advertising API gives programmatic access to Sponsored Products, Sponsored Brands, Sponsored Display, DSP, and Amazon Marketing Cloud (AMC) campaigns.

**Auth differences vs SP-API:**
- Uses the same LWA OAuth 2.0 for authentication
- BUT requires a **profile ID** header (`Amazon-Advertising-API-ProfileId`) on every request
- Profile IDs are marketplace-specific — one profile per marketplace per advertiser
- The API base URL is `advertising.amazon.com/v2/` (not sellingpartnerapi.amazon.com)

**Campaign Management API — Unified in December 2025:**
All campaign type APIs (Sponsored Products, Brands, Display) were unified under a single endpoint in December 2025. Legacy per-type endpoints still work but are being phased out.

**Reporting v3 — Async 3-step flow:**

```
Step 1: POST /reporting/reports
  Body: { "name": "...", "startDate": "...", "endDate": "...", "configuration": {...} }
  Response: { "reportId": "ABCD1234", "status": "PENDING" }

Step 2: GET /reporting/reports/{reportId}
  Poll until status = "COMPLETED"
  Response includes: { "url": "https://s3.amazonaws.com/..." }

Step 3: GET <presigned S3 URL>
  Download the gzipped report data
  ⚠️ URL expires in 5 MINUTES — download immediately on step 2 completion
```

**Data latency:** Advertising data has a 48–72 hour attribution lag. Never compare yesterday's data to last week — attribution is still accumulating on recent campaigns.

**AMC (Amazon Marketing Cloud):**
- SQL-based clean room analytics running on Amazon's infrastructure
- Allows attribution analysis across touchpoints (Sponsored + DSP + organic)
- Outputs to S3 — schedule via AMC API, not interactive SQL

**Key Gotchas:**
- Presigned S3 URLs for report downloads expire in 5 minutes — if your workflow has any delay between polling and downloading, the URL will be stale
- Profile IDs are different from seller account IDs — fetch them via `GET /v2/profiles` after auth
- Reporting v3 uses different date formats (ISO 8601) than Reporting v2 (YYYYMMDD)
- Campaign Management unified API uses portfolio-level structure not available in legacy endpoints

**Best Practices:**
- Implement exponential backoff with max 10 retries for 429 responses
- Poll report status with exponential backoff starting at 30 seconds (reports typically take 2–10 minutes)
- Download report immediately after step 2 completes — do not queue the URL for later
- Cache profile IDs in your database — they don't change often
- Keep separate credentials per advertiser (same as SP-API multi-client isolation)

---

### 1.3 Brand APIs

**What it is:** Amazon provides 20+ distinct APIs specifically for brand-registered sellers. These split roughly into: content management, analytics, advertising, transparency/authenticity, and store management.

**Key API categories and access tiers:**

| API | Free? | Notes |
|---|---|---|
| A+ Content API | Free | Requires SP-API app + Brand Registry |
| Brand Story API | Free | Required prerequisite for Premium A+ |
| Amazon Stores API | Free (GA Feb 2026) | Programmatic store management |
| Brand Analytics (BA) | Free | SQP, Market Basket, Demographics — limited to Brand Registry members |
| Data Kiosk | Free | GraphQL-based; future of BA; supports historical queries |
| Transparency API | Paid + Lead time | Per-unit codes; 6-10 week lead time for new batches |
| Vine API | Free | Request products for Vine review program |
| Brand Protection API | Free | Report infringement, counterfeits |

**Brand stage → must-have API matrix:**

| Stage | Must-Have APIs |
|---|---|
| New brand (<50 ASINs) | A+ Content, Brand Analytics |
| Growing brand (50–500 ASINs) | Add Vine, Stores, Brand Story |
| Mature brand (500+ ASINs) | Add Data Kiosk, Transparency, Brand Protection |
| Agency managing multiple brands | Add Advertising API, all the above per client |

**Key Gotchas:**
- A+ Content module types must match available slot types for each template — wrong module type returns a 400 error that is hard to debug
- Brand Story is a prerequisite for Premium A+ — it must be published on ALL ASINs in the brand, and you need 15 approved A+ Content projects minimum
- Transparency codes have a 6–10 week lead time for new batches — plan launches accordingly
- Data Kiosk (GraphQL) is the future of Brand Analytics; SQP via classic BA API will eventually be deprecated

**Best Practices:**
- Use Brand Story as a consistent brand identity layer across all ASINs before attempting Premium A+
- Batch A+ content updates via the API rather than the UI — UI changes don't version-control
- Store SQP data weekly in Supabase — historical data is not available retroactively beyond Amazon's rolling windows
- When checking A+ eligibility, always verify the ASIN has a valid brand claim in Brand Registry first

---

### 1.4 Brand Registry (Advanced)

**What it is:** Amazon Brand Registry (ABR) is the access control layer for all brand-protective and brand-building features. Requires a registered trademark (USPTO or equivalent international office). Unlocks A+, Stores, Vine, Brand Analytics, Transparency, and IP protection tools.

**A+ Content API — Key endpoints:**

```
POST /aplus/2020-11-01/contentDocuments                    # Create A+ document
PUT  /aplus/2020-11-01/contentDocuments/{contentReferenceKey}  # Update A+ document
POST /aplus/2020-11-01/contentPublishRecords               # Publish to ASINs
GET  /aplus/2020-11-01/contentSummaries                    # List all A+ content
POST /aplus/2020-11-01/contentDocuments/{key}/approvalSubmissions  # Submit for review
```

**Premium A+ prerequisites — all three must be met:**
1. Brand Story module published on ALL ASINs in the brand
2. At least 15 A+ Content projects approved in the trailing 12 months
3. Brand registered with an active trademark in Brand Registry

**Brand Protection Toolkit — BTP audience segments:**

| Segment | Description | Primary Use |
|---|---|---|
| Brand Followers | Customers who follow your brand store | Launch announcements, new products |
| Cart Abandoners | Added to cart, didn't purchase | Retargeting via Sponsored Display |
| Past Purchasers | Verified buyers (Sponsored Display only) | Upsell, replenishment campaigns |

**Search Query Performance (SQP) — critical metrics:**

| Metric | What It Measures |
|---|---|
| Search Query Volume | Total searches for this query across Amazon |
| Impression Share | Your brand's % of impressions for this query |
| Click Share | Your brand's % of clicks |
| Purchase Share | Your brand's % of purchases |
| Branded vs Non-Branded | SQP separates brand-name queries from category queries |

**Data Kiosk — GraphQL future of Brand Analytics:**
- Accessible via SP-API at `/dataKiosk/2023-11-15/queries`
- Supports historical SQP queries beyond the standard 90-day rolling window
- Returns data via S3 presigned URLs (same pattern as Advertising API reports)
- `SALES_AND_TRAFFIC_BY_ASIN` and `SEARCH_CATALOG_PERFORMANCE` are the two most important datasets

**Share of Voice (SoV) Trend Alerting — Supabase SQL pattern:**

```sql
-- Detect significant SoV drops week-over-week
WITH current_week AS (
  SELECT search_query, click_share, purchase_share
  FROM sqp_weekly WHERE week_end = CURRENT_DATE - 7
),
prior_week AS (
  SELECT search_query, click_share, purchase_share
  FROM sqp_weekly WHERE week_end = CURRENT_DATE - 14
)
SELECT
  c.search_query,
  c.click_share AS click_share_now,
  p.click_share AS click_share_prior,
  (c.click_share - p.click_share) AS click_share_delta
FROM current_week c
JOIN prior_week p USING (search_query)
WHERE ABS(c.click_share - p.click_share) > 0.05  -- 5% delta threshold
ORDER BY click_share_delta ASC;
```

**Key Gotchas:**
- Transparency program requires per-unit code printing — codes can't be applied retroactively to existing inventory
- Brand Registry approval can take 1–4 weeks for new trademark applications; plan launches with this in mind
- SQP data is only available to brand owners, not resellers — even if they're authorized sellers
- Brand Story modules have specific character limits and image dimensions that differ from standard A+ modules

**Best Practices:**
- Store SQP weekly snapshots in Supabase immediately — Amazon only retains 90 days by default
- Set up automated SoV trend alerts for your top 20 search queries by volume
- Use Brand Analytics Market Basket data to identify natural cross-sell pairs for bundle creation
- Transparency program is worth the cost ($0.01–$0.05/unit) for premium brands — it actively blocks counterfeits

---

### 1.5 Keyword Research

**What it is:** The process of identifying which search queries drive discovery, clicks, and purchases for your products on Amazon — using a combination of Amazon's own first-party data (SQP) and third-party tools (Helium 10, Jungle Scout, DataDive).

**SQP Funnel metrics — the full conversion funnel:**

```
Search Query → Impressions → Clicks → Cart Adds → Purchases

Each step has a "share" metric:
  Impression Share = your brand impressions / total impressions for that query
  Click Share      = your brand clicks / total clicks
  Purchase Share   = your brand purchases / total purchases
```

**Search Frequency Rank (SFR):** Amazon's relative ranking of search queries by volume. SFR 1 = most searched query on Amazon. Lower SFR number = higher volume. Not an absolute number — relative within the SQP dataset.

**Backend keywords — 500-BYTE limit (not characters):**
- The listing backend keyword field has a 500-byte limit
- Multi-byte characters (accented letters, special characters) count as 2–4 bytes each
- Bytes != characters — never trust a character counter for backend keywords
- Check byte count with: `len("your keyword string".encode('utf-8'))`

**PPC match types for keyword strategy:**

| Match Type | When to Use | Cost |
|---|---|---|
| Broad | Discovery — finding new converting terms | Lowest CPC, most irrelevant spend |
| Phrase | Mid-funnel — known converting root terms | Medium |
| Exact | Proven converters — max control | Highest CPC, best ROAS |

**4-Phase Keyword Analyst Workflow:**

1. **Discovery** — pull SQP for all brand ASINs, filter for queries with >0 purchase share
2. **Competitive gap analysis** — compare your click share vs impression share; high impression/low click = title/image problem; low impression = ranking problem
3. **Prioritization** — sort by purchase share descending; these are your conversion-proven terms
4. **Implementation** — add top terms to listing title (first 80 chars), backend keywords, and exact-match campaigns

**Key Gotchas:**
- SQP only shows data where your brand had at least some activity — zero-activity queries don't appear even if they're relevant
- Search Frequency Rank changes weekly — a query ranked #500 this week could be #2000 next week (seasonal)
- Backend keywords do NOT need to repeat terms already in the title/bullets — Amazon indexes the full listing
- International keywords for non-English marketplaces must be in the target language — English keywords in German listings don't rank

**Best Practices:**
- Pull SQP every Monday and store in Supabase with week_end date for trend tracking
- Prioritize queries where your purchase share < your impression share — you're getting seen but not converting
- Use DataDive or Cerebro for reverse-ASIN competitor keyword research to fill gaps in your SQP (SQP only shows your data)
- Build a master keyword bank per ASIN with columns: term, SFR, impression_share, click_share, purchase_share, placement (title/bullet/backend/PPC)

---

### 1.6 Multi-Marketplace Patterns

**What it is:** Architectural patterns for building data pipelines and applications that serve Amazon sellers across multiple marketplaces (US, UK, DE, FR, ES, IT, JP, CA, MX, AU, etc.) correctly — with proper currency handling, timezone scheduling, and data isolation.

**All 21 Amazon Marketplace IDs:**

| Marketplace | ID | Region | Currency | Timezone |
|---|---|---|---|---|
| Amazon US | ATVPDKIKX0DER | NA | USD | America/New_York |
| Amazon CA | A2EUQ1WTGCTBG2 | NA | CAD | America/Toronto |
| Amazon MX | A1AM78C64UM0Y8 | NA | MXN | America/Mexico_City |
| Amazon BR | A2Q3Y263D00KWC | NA | BRL | America/Sao_Paulo |
| Amazon UK | A1F83G8C2ARO7P | EU | GBP | Europe/London |
| Amazon DE | A1PA6795UKMFR9 | EU | EUR | Europe/Berlin |
| Amazon FR | A13V1IB3VIYZZH | EU | EUR | Europe/Paris |
| Amazon IT | APJ6JRA9NG5V4 | EU | EUR | Europe/Rome |
| Amazon ES | A1RKKUPIHCS9HS | EU | EUR | Europe/Madrid |
| Amazon NL | A1805IZSGTT6HS | EU | EUR | Europe/Amsterdam |
| Amazon SE | A2NODRKZP88ZB9 | EU | SEK | Europe/Stockholm |
| Amazon PL | A1C3SOZRARQ6R3 | EU | PLN | Europe/Warsaw |
| Amazon TR | A33AVAJ2PDY3EV | EU | TRY | Europe/Istanbul |
| Amazon EG | ARBP9OOSHTCHU | EU | EGP | Africa/Cairo |
| Amazon SA | A17E79C6D8DWNP | EU | SAR | Asia/Riyadh |
| Amazon AE | A2VIGQ35RCS4UG | EU | AED | Asia/Dubai |
| Amazon IN | A21TJRUUN4KGV | EU | INR | Asia/Kolkata |
| Amazon JP | A1VC38T7YXB528 | FE | JPY | Asia/Tokyo |
| Amazon AU | A39IBJ37TRP1C6 | FE | AUD | Australia/Sydney |
| Amazon SG | A19VAU5U5O7RUS | FE | SGD | Asia/Singapore |
| Amazon BE | AMEN7PMS3EDWL | EU | EUR | Europe/Brussels |

**Database design — always Option A (marketplace_id column):**

```sql
-- CORRECT: one table with marketplace_id column
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asin TEXT NOT NULL,
  marketplace_id TEXT NOT NULL REFERENCES marketplaces(marketplace_id),
  title TEXT,
  price DECIMAL(10,2),
  currency TEXT,
  -- composite unique prevents duplicate rows
  UNIQUE(asin, marketplace_id)
);

-- WRONG: separate tables per marketplace (never do this)
-- amazon_us_listings, amazon_de_listings, etc.
```

**Currency normalization — store both raw and normalized:**

```sql
-- Always store original currency value AND USD equivalent
CREATE TABLE price_history (
  asin TEXT,
  marketplace_id TEXT,
  price_local DECIMAL(10,2) NOT NULL,   -- original currency
  currency TEXT NOT NULL,
  price_usd DECIMAL(10,2),              -- normalized for cross-marketplace comparison
  fx_rate DECIMAL(10,6),                -- rate used for conversion
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Timezone-aware scheduled operations:**

```sql
-- Create a pg_cron job that respects marketplace business hours
-- US report pull: 3 AM Eastern
SELECT cron.schedule('us-report-pull', '0 8 * * *', $$
  SELECT process_marketplace_reports('ATVPDKIKX0DER');
$$);  -- 8 UTC = 3 AM ET

-- JP report pull: 3 AM JST  
SELECT cron.schedule('jp-report-pull', '18 * * * *', $$
  SELECT process_marketplace_reports('A1VC38T7YXB528');
$$);  -- 18:00 UTC = 3 AM JST
```

**Seller accounts table — Supabase Vault integration:**

```sql
CREATE TABLE seller_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  marketplace_id TEXT NOT NULL REFERENCES marketplaces(marketplace_id),
  seller_id TEXT NOT NULL,
  -- Secrets stored in Vault, only the Vault key name stored here
  vault_key_refresh_token TEXT NOT NULL,  -- e.g., 'sp_api:seller_abc:refresh_token'
  vault_key_client_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(brand_id, marketplace_id)
);
```

**Key Gotchas:**
- Never hardcode marketplace IDs as string literals — always reference the marketplaces lookup table
- EU marketplaces share the same SP-API endpoint but have different marketplaceId values — don't assume same endpoint = same data
- Japan uses a different FE (Far East) endpoint than NA and EU
- Currency conversion rates change daily — store the FX rate used at time of conversion for auditability
- Some API endpoints require marketplace-specific headers and return locale-specific content

**Best Practices:**
- Seed the marketplaces table on project setup with all 21 rows — it's a stable reference table
- Always join through the marketplaces table for currency/timezone lookups, never hardcode
- When building reports that compare across marketplaces, normalize to USD using daily FX rates
- Use the composite UNIQUE(asin, marketplace_id) constraint everywhere — it prevents duplicate data bugs

---

### 1.7 Rainforest / Scrapers

**What it is:** Third-party data collection APIs and tools for Amazon competitive intelligence — pricing, reviews, BSR, and competitor listing data. Primary tools: Rainforest API, Keepa.

**Rainforest API — key request types:**

| `type` value | What it returns | Cost (credits) |
|---|---|---|
| `product` | Full listing details (title, bullets, A+, images, BSR) | 1 |
| `search` | Search results for a query | 1 |
| `offers` | All seller offers (pricing by fulfillment type) | 1–2 |
| `reviews` | Product reviews (paginated) | 1 |
| `bestsellers` | BSR list for a category | 1 |

**CRITICAL: Use `type=offers` for pricing, NOT `type=product`:**
- `type=product` returns the "featured" price but can be stale and doesn't show all seller prices
- `type=offers` returns the current Buy Box price AND all seller offers with fulfillment type
- For competitive price monitoring, always use `type=offers`

**ZIP code rotation for accurate US pricing:**
Amazon prices vary by ZIP code (shipping cost factors, local availability). A 21-ZIP rotation set covering all major US regions produces representative pricing data:

```sql
-- Rotate through these ZIPs in sequence
WITH zip_rotation AS (
  VALUES ('10001'), ('90001'), ('60601'), ('77001'), ('85001'),
         ('19101'), ('30301'), ('98101'), ('02101'), ('33101'),
         ('63101'), ('55401'), ('46201'), ('44101'), ('35201'),
         ('37201'), ('27601'), ('53201'), ('80201'), ('84101'),
         ('97201')
)
```

**Async mode with callbacks:**
For bulk requests, use Rainforest's async mode to avoid blocking workflows:
- Include `callback.url` in your request
- Rainforest calls your webhook URL when the result is ready
- Store the `request_id` immediately — you need it to correlate the callback

**Keepa API — CSV format decoding:**

Keepa returns price history as a CSV array where:
- Values are integers representing price in CENTS (divide by 100 for dollars)
- Value of -1 means "not available" (product delisted or no data)
- Timestamps are in "Keepa minutes" — minutes since **January 1, 2011 00:00:00 UTC**

```python
# Convert Keepa timestamp to datetime
from datetime import datetime, timezone, timedelta
KEEPA_EPOCH = datetime(2011, 1, 1, tzinfo=timezone.utc)

def keepa_time_to_datetime(keepa_minutes: int) -> datetime:
    return KEEPA_EPOCH + timedelta(minutes=keepa_minutes)

def keepa_price_to_dollars(keepa_price: int) -> float | None:
    return None if keepa_price == -1 else keepa_price / 100.0
```

**Keepa CSV array indices:**

| Index | Data |
|---|---|
| 0 | Amazon price |
| 1 | Marketplace/3P new |
| 3 | BSR (Best Sellers Rank) |
| 7 | FBA seller count |
| 18 | Buy Box price |

**Content change detection — use content_hash:**

```sql
-- Only write a new record when content actually changed
UPDATE marketplace_listings
SET
  title = $2,
  content_hash = MD5($2 || $3 || $4),  -- hash of title+bullets+description
  updated_at = NOW()
WHERE asin = $1 
  AND content_hash IS DISTINCT FROM MD5($2 || $3 || $4);
```

**Key Gotchas:**
- Rainforest's async mode with callback webhooks requires tracking `request_id` — callbacks don't include enough context otherwise
- Keepa minutes epoch is 2011-01-01, not Unix epoch (1970-01-01) — off-by-one on the epoch breaks all date calculations
- BSR is at index 3 in Keepa CSV, not 0 — wrong index = wrong data
- Rainforest charges 1 credit per request regardless of cache hit — credits at $0.01 each; bulk pricing available
- Some Rainforest `type=product` responses are cached and may be hours stale — for price monitoring use `type=offers` with `max_age=60`

**Best Practices:**
- Use `max_age` parameter on Rainforest requests to control cache staleness for price-sensitive data
- For bulk catalog tracking (500+ ASINs), use Rainforest async mode with a webhook receiver
- Store raw Keepa CSV arrays in Supabase JSONB for reprocessing — don't only store computed values
- Rate limit your Rainforest/Keepa calls to avoid hitting API limits — implement a simple token bucket in Redis/Supabase
- Never use SQS async without immediately persisting the request_id to Supabase

---

## 2. Automation & Workflow

### 2.1 n8n

**What it is:** Low-code workflow automation platform. Self-hosted (recommended) or cloud. Particularly powerful for Amazon brand automation because of its LangChain-based AI cluster node architecture and extensive integration library.

**Typed connection system — AI nodes use distinct connection types:**

| Connection Type | Visual Color | What It Connects |
|---|---|---|
| `ai_languageModel` | Purple | LLM sub-nodes (Claude, OpenAI, Ollama) to AI Agent or Chain |
| `ai_memory` | Green | Memory sub-nodes (Buffer, Supabase Vector, Redis) |
| `ai_tool` | Orange | Tool sub-nodes (HTTP, Calculator, Code) that the agent can call |
| `ai_outputParser` | Teal | Parser sub-nodes (JSON, Structured Output) |
| `ai_document` | Dark blue | Document loaders |
| `ai_embedding` | Yellow | Embedding model sub-nodes |
| Standard data | Gray | Regular node-to-node data flow |

**You cannot connect a gray wire to a purple socket.** Typed connections prevent wrong integrations at design time.

**Claude integration — two methods:**

**Method 1 — Anthropic Chat Model sub-node (recommended for AI Agent nodes):**
```
[AI Agent node]
  └──(purple)── [Anthropic Chat Model]
                  Model: claude-sonnet-4-5
                  API Key: {{ $credentials.anthropicApi }}
```

**Method 2 — HTTP Request node (for non-AI-cluster use):**
```json
{
  "url": "https://api.anthropic.com/v1/messages",
  "method": "POST",
  "headers": {
    "x-api-key": "{{ $env.ANTHROPIC_API_KEY }}",
    "anthropic-version": "2023-06-01",
    "anthropic-beta": "prompt-caching-2024-07-31"
  },
  "body": {
    "model": "claude-sonnet-4-5",
    "max_tokens": 4096,
    "system": [
      {
        "type": "text",
        "text": "{{ $env.SYSTEM_PROMPT }}",
        "cache_control": { "type": "ephemeral" }
      }
    ],
    "messages": [{"role": "user", "content": "{{ $json.userMessage }}"}]
  }
}
```

**Prompt caching — 90% cost reduction on system prompts:**
When using the Anthropic HTTP Request method, add `cache_control: { "type": "ephemeral" }` to system prompt content blocks. Cached prompt tokens cost 10% of normal input price and are retained for 5 minutes. For workflows that run frequently with the same system prompt, this dramatically reduces costs.

**Session memory strategies for AI workflows:**

| Strategy | Best For | Implementation |
|---|---|---|
| In-memory (default) | Single-run workflows | Built into n8n AI Agent, cleared after execution |
| PostgreSQL/Supabase | Multi-turn conversations | Window Buffer Memory → Supabase credentials |
| Redis | High-frequency short sessions | Window Buffer Memory → Redis credentials |

**Error workflow architecture — 3 tiers:**
1. **Node-level:** `Continue on Fail` + error branch in workflow
2. **Workflow-level:** n8n error workflow trigger (fires when any workflow crashes)
3. **Instance-level:** n8n health monitoring + external uptime check (UptimeRobot)

**HMAC sanitization for Claude JSON output:**
Claude sometimes adds markdown fences (` ```json `) around JSON output. Strip them before `JSON.parse()`:

```javascript
// Code node — sanitize Claude's JSON output
const raw = $json.content[0].text;
const cleaned = raw
  .replace(/^```json\s*/i, '')
  .replace(/^```\s*/i, '')
  .replace(/```\s*$/i, '')
  .trim();
return [{ json: JSON.parse(cleaned) }];
```

**6 core workflow patterns for Amazon:**

1. **Report polling** — Schedule → SP-API report request → Poll status → Download from S3 → Process → Supabase upsert
2. **SQS event processing** — SQS trigger → Parse notification → Route by notification type → Handle each type
3. **AI content generation** — Supabase query (pending items) → Loop → Anthropic/Ollama → Structured output → Supabase update
4. **Price monitoring** — Schedule → Rainforest/Keepa → Compare to prior → Alert if threshold breached
5. **Multi-marketplace sync** — Supabase event → Loop over seller accounts → SP-API per marketplace → Aggregate results
6. **Webhook routing** — WhatsApp/SP-API webhook → Parse → Route by event type → Branched handling

**Key Gotchas:**
- n8n loops are single-threaded — if you need true parallelism, split into sub-workflows
- The `N8N_ENCRYPTION_KEY` is a one-way commitment — changing it invalidates all stored credentials; back it up in Supabase Vault
- n8n's HTTP Request node sends `content-type: application/json` by default but the body may need to be set as JSON string if you're building it dynamically
- Workflow JSON exports include credential references but NOT credential values — safe to git commit; inline credentials in node parameters are NOT safe

**Best Practices:**
- Store `N8N_ENCRYPTION_KEY` in Supabase Vault before creating any credentials
- Use named credentials (stored in n8n's encrypted store) — never hardcode in workflow JSON
- Use the `Supabase` native node for database operations, not raw HTTP Request to the REST API
- Enable the Postgres backend for n8n (not SQLite) in production — SQLite is too fragile for concurrent workflows
- Set `OLLAMA_HOST=0.0.0.0` if n8n and Ollama are on separate services/containers

---

### 2.2 Webhooks & Event-Driven Patterns

**What it is:** SP-API Notifications API + SQS = real-time event delivery for order changes, listing updates, FBA notifications, and more. The core of a reactive Amazon automation system.

**SP-API SQS setup — mandatory steps:**

```python
# Step 1: Create an SQS destination
POST /notifications/v1/destinations
{
  "name": "syncflow-notifications",
  "resourceSpecification": {
    "sqs": {
      "arn": "arn:aws:sqs:us-east-1:YOUR_AWS_ACCOUNT:syncflow-notifications"
    }
  }
}

# Step 2: Subscribe to a notification type
POST /notifications/v1/subscriptions/{notificationType}
{
  "payloadVersion": "1.0",
  "destinationId": "YOUR_DESTINATION_ID"
}
```

**SQS queue policy — required principal:**
The SQS queue must grant `sqs:SendMessage` to Amazon's notification service principal `437568002678`:

```json
{
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::437568002678:root" },
  "Action": "sqs:SendMessage",
  "Resource": "arn:aws:sqs:us-east-1:YOUR_ACCOUNT:syncflow-notifications"
}
```

**Queue type: STANDARD, NOT FIFO:**
SP-API notifications are sent to standard SQS queues only. FIFO queues will silently fail to receive messages. No error is returned — messages just never arrive.

**Priority notification types:**

| Notification Type | Priority | What It Triggers |
|---|---|---|
| `LISTINGS_ITEM_STATUS_CHANGE` | P0 | Listing suppressed or restored — immediate action needed |
| `ORDER_CHANGE` | P0 | New order or order status change |
| `FBA_INBOUND_SHIPMENT_STATUS` | P1 | Inbound shipment status |
| `ITEM_PRODUCT_TYPE_CHANGE` | P1 | Amazon changed the product type classification |
| `BRANDED_ITEM_CONTENT_CHANGE` | P2 | A+ content or listing content changed by Amazon |
| `FEED_PROCESSING_FINISHED` | P2 | Feed submission completed (success or error) |
| `REPORT_PROCESSING_FINISHED` | P2 | Async report ready for download |

**3-layer idempotency for webhook processing:**

```
Layer 1: SQS deduplication
  - Store messageId in processed_sqs_messages table
  - Check before processing: if exists, DELETE and return 200

Layer 2: Business logic deduplication
  - Hash the notification payload
  - Store payload_hash with processed_at timestamp
  - If hash exists and was processed < 24h ago, skip

Layer 3: Database upsert (not insert)
  - Use ON CONFLICT (asin, marketplace_id) DO UPDATE
  - Idempotent writes — re-processing produces same result
```

**DLQ setup — MaxReceiveCount = 3:**
```
Main Queue → [Process attempt 1]
           → [Process attempt 2 — Visibility Timeout expired]
           → [Process attempt 3 — Visibility Timeout expired again]
           → Dead Letter Queue (after 3 failures)

DLQ retention: 14 days
DLQ alert: CloudWatch alarm → SNS → email/Slack when DLQ depth > 0
```

**Visibility Timeout rule:** Set to at least 2× your expected processing time. If your n8n workflow takes 30 seconds to process a message, set Visibility Timeout to at least 60 seconds. Otherwise, SQS will re-deliver the message while you're still processing it.

**n8n SQS message parsing:**

```javascript
// Parse SP-API notification from SQS body
const body = JSON.parse($json.Body);
const notification = JSON.parse(body.Message);

return [{
  json: {
    notificationType: notification.NotificationVersion,
    sellerId: notification.SellerId,
    marketplaceId: notification.Payload?.AnyOfferChangedNotification?.OfferChangeTrigger?.MarketplaceId,
    payload: notification.Payload
  }
}];
```

**Key Gotchas:**
- FIFO queues silently fail — no error, no messages — always use standard queues
- SQS Visibility Timeout < processing time = duplicate processing — set it generously
- The AWS principal for SP-API is `437568002678` (12-digit number) — not an ARN, a bare account ID
- `LISTINGS_ITEM_STATUS_CHANGE` is the most time-critical notification — a suppressed listing costs sales every minute

**Best Practices:**
- Process `LISTINGS_ITEM_STATUS_CHANGE` first in your routing logic — alert immediately
- Set MaxReceiveCount=3 on DLQ and alert when DLQ depth > 0
- Log every SQS message (messageId + payload) to Supabase before processing — enables replay if something goes wrong
- Use separate SQS queues per notification priority tier if volume is high enough to justify it

---

### 2.3 ClickUp for Amazon Business

**What it is:** Project management platform with the best MCP tool coverage (49 tools) for Amazon brand management. Workspace hierarchy: Workspace → Space → Folder → List → Task.

**Recommended Amazon brand ClickUp structure:**

```
Workspace: [Brand Name / Agency]
├── Space: 🛒 Amazon Operations
│   ├── Folder: Catalog Management
│   │   ├── List: ASIN Launches
│   │   ├── List: Listing Optimization
│   │   └── List: Content Calendar
│   ├── Folder: PPC & Advertising
│   │   ├── List: Campaign Planning
│   │   ├── List: Bid Management
│   │   └── List: A/B Tests
│   └── Folder: Compliance & Issues
│       ├── List: Suppressed Listings
│       ├── List: IP Complaints
│       └── List: Account Health
├── Space: 📦 Operations & Supply Chain
│   ├── List: Inventory Planning
│   ├── List: FBA Shipments
│   └── List: Supplier Relationships
├── Space: 🎨 Creative
│   ├── List: Image Shoots
│   ├── List: A+ Content Projects
│   └── List: Brand Assets
└── Space: 📊 Analytics & Reporting
    ├── List: Weekly Reports
    ├── List: SQP Tracking
    └── List: Competitive Intel
```

**MCP tool limits:**

| Plan | MCP Calls / 24h | Automation Runs / Month |
|---|---|---|
| Free | 100 | 100 |
| Unlimited | 300 | 1,000 |
| Business | 1,000 | 10,000 |
| Enterprise | Unlimited | 250,000 |

**Brain AI add-on:** $7/user/month. Enables AI task summaries, AI-assisted task creation, and AI search within ClickUp. Required for Claude to generate task descriptions via the MCP.

**49 MCP tools available** — key ones for Amazon workflows:
- `clickup_create_task` — create tasks with all fields
- `clickup_update_task` — update status, assignee, due date, custom fields
- `clickup_filter_tasks` — query tasks by status/assignee/date
- `clickup_get_custom_fields` — read custom field definitions (needed to set them)
- `clickup_create_list` — programmatically create new lists
- `clickup_search` — full-text search across workspace

**Key Gotchas:**
- Custom field IDs are UUIDs, not human-readable names — fetch them with `clickup_get_custom_fields` before trying to set them
- The 300 MCP calls/24h limit on Unlimited plan resets at midnight UTC
- Task comments via MCP do not trigger notifications — use `@mentions` if you need someone alerted
- Space, Folder, and List IDs are numeric strings — always store them as TEXT, not INTEGER

**Best Practices:**
- Build your ClickUp structure before connecting MCP — harder to reorganize after workflows depend on IDs
- Store Space/Folder/List IDs in a config table in Supabase — don't hardcode them in workflows
- Use custom fields for ASIN, Marketplace, Status, and Priority — they make filtering vastly more powerful
- For suppressed listing incidents: create an automated task via n8n MCP call immediately when `LISTINGS_ITEM_STATUS_CHANGE` fires

---

## 3. AI & Claude Tools

### 3.1 Claude Code

**What it is:** Anthropic's official CLI for Claude. Designed for agentic coding tasks — reading/editing files, running bash commands, and building software iteratively with full filesystem access.

**CLAUDE.md — the persistent context file:**
- Lives at project root (or `~/.claude/CLAUDE.md` for global context)
- Read by Claude Code at the start of every session
- Maximum effective length: **200 lines** — beyond that, Claude's attention on early content degrades
- Keep it high-signal: project description, tech stack, key patterns, what NOT to do

**Optimal CLAUDE.md structure:**

```markdown
# Project: [Name]

## What this is
[2-3 sentences: what the system does, who uses it]

## Tech stack
- Frontend: Next.js 15 App Router, TypeScript, Tailwind
- Backend: Supabase (Postgres + Auth + Vault + Edge Functions)
- Automation: n8n (self-hosted, Cloud instance)
- APIs: SP-API, Amazon Ads, Rainforest, Keepa

## Key patterns
- All SP-API calls server-side only (never in Client Components)
- TIMESTAMPTZ for all timestamps — never naive datetime
- Supabase Vault for all secrets — never env vars for sensitive data
- UUID primary keys everywhere

## Don'ts
- Never add NEXT_PUBLIC_ prefix to sensitive keys
- Never create XML feed workflows (use JSON_LISTINGS_FEED)
- Never commit .env files
- Never hardcode marketplace IDs
```

**MCP configuration — ~/.claude.json:**

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://..."]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/projects"]
    },
    "amazon-ads": {
      "command": "npx",
      "args": ["-y", "@anthropic/amazon-advertising-mcp-server"]
    }
  }
}
```

**toolSearch:true saves 95% of context:** When enabled in Claude Code settings, only the tools Claude actively needs are loaded into context. Without it, all MCP tool descriptions load at session start, consuming thousands of tokens.

**Deny rules survive --dangerously-skip-permissions:**
Even with the dangerous flag, rules in the `deny` list in `settings.json` are enforced. This is the right way to create hard limits that can't be overridden.

**cc-prompt anatomy for syncflow builds:**

```
1. Context block: current system state (what exists, what's working)
2. Objective: specific deliverable (not vague — name the file, the function, the behavior)
3. Constraints: what NOT to do, what to preserve
4. Output format: what you want back (code file path, test, SQL migration)
5. Verification: how to know it worked (test command, expected output)
```

**Key flags:**
- `--dangerously-skip-permissions` — skips confirmation prompts (use in CI/automation, not interactive)
- `--max-turns N` — limits agentic loop depth (default: unlimited)
- `/compact` — compresses conversation history (run at ~70% context window)
- `/cost` — shows current session token usage

**Key Gotchas:**
- CLAUDE.md content beyond ~200 lines loses attention weighting — edit ruthlessly
- Without `toolSearch:true`, a heavily-configured MCP session can burn 20K+ tokens on tool descriptions before writing a single line of code
- `--dangerously-skip-permissions` doesn't bypass deny rules — use deny rules for truly dangerous operations
- Claude Code reads the CWD's CLAUDE.md automatically — put project-specific rules there, not in global CLAUDE.md

**Best Practices:**
- Maintain CLAUDE.md as living documentation — update it when patterns change
- Use `/compact` before reaching context limit — not after (you need context to compact intelligently)
- Pin specific model versions in projects that need consistent output (creative work especially)
- For long agentic tasks, break into phases: phase 1 = scaffold, phase 2 = implement, phase 3 = test

---

### 3.2 Claude Connectors, Cowork & Code

**What it is:** Claude's native integration ecosystem for connecting to external data sources, APIs, and services via MCP (Model Context Protocol) — either through one-click connectors, remote URL MCPs, or locally-running MCP servers.

**Three connection methods:**

| Method | Setup | Best For |
|---|---|---|
| One-click connector | OAuth flow in Claude.ai settings | Consumer SaaS (Google Drive, Notion, GitHub) |
| Remote URL MCP | Enter URL in settings | Cloud-hosted MCP servers (Porter Metrics, Amazon Ads MCP) |
| Local MCP server | Run process locally, configure `~/.claude.json` | Local filesystem, local databases, custom integrations |

**Amazon Ads MCP Server (open beta February 2026):**
- 50+ tools covering campaign management, reporting, and profile management
- Connects directly to Amazon Advertising API using LWA credentials
- Available at: `@anthropic/amazon-advertising-mcp-server`
- Tools include: `list_profiles`, `get_campaigns`, `create_campaign`, `get_reports`, `update_bids`

**Porter Metrics:**
- A remote MCP server that provides Seller Central data (sales, inventory, advertising) through a unified API
- Alternative to direct SP-API integration — useful for simpler reporting workflows
- Connects to Claude via remote URL MCP

**Cowork (Claude's agentic workspace):**
- Multi-agent coordination for complex tasks
- Artifacts system for shared workspace between agents
- Skills library: persistent reusable workflows for common patterns

**Key Gotchas:**
- One-click connectors use OAuth and need re-authentication if tokens expire
- Local MCP servers must be running before Claude Code starts — they don't auto-start
- Amazon Ads MCP requires LWA credentials with advertising scope — separate from SP-API scope
- Remote MCP servers can have latency issues — local is faster for high-frequency tool calls

**Best Practices:**
- Use the Amazon Ads MCP for campaign management tasks rather than raw API calls — much faster to iterate
- Configure `toolSearch: true` in Claude Code settings to avoid tool description context bloat
- For production automation, prefer local MCP servers over remote — you control the reliability
- Keep MCP server configurations in version control (except credential values)

---

## 4. Infrastructure & Backend

### 4.1 Supabase

**What it is:** PostgreSQL-based backend-as-a-service. The recommended primary database for syncflow. Provides Auth, Storage, Edge Functions, Realtime, and Vault in addition to the database.

**Core table schema pattern:**

```sql
-- brands table (the root entity)
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  amazon_seller_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  asin TEXT NOT NULL,
  marketplace_id TEXT NOT NULL REFERENCES marketplaces(marketplace_id),
  title TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asin, marketplace_id)
);

-- Always add: updated_at trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Supabase Vault — secrets storage:**

```sql
-- Store a secret
SELECT vault.create_secret(
  'sp_api:seller_abc123:refresh_token',           -- name (namespaced)
  'Atzr|IwEBIK-actual-refresh-token',             -- value (encrypted)
  'SP-API LWA refresh token for Brand A'          -- description
);

-- Read a secret (service role only)
SELECT decrypted_secret 
FROM vault.decrypted_secrets 
WHERE name = 'sp_api:seller_abc123:refresh_token';
```

**RLS (Row Level Security) pattern:**

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own brand's products
CREATE POLICY "Users see own brand products"
ON products
FOR ALL
USING (
  brand_id IN (
    SELECT brand_id FROM user_brands 
    WHERE user_id = auth.uid()
  )
);
```

**Critical rules:**
- Service role key bypasses RLS — NEVER expose it to browser/client code
- Use `anon` key for browser clients — RLS enforces access control
- Use `auth.uid()` in RLS policies, not hardcoded user IDs
- `getUser()` not `getSession()` for server-side auth — sessions can be spoofed, users cannot

**pgvector for embeddings:**

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column
ALTER TABLE products ADD COLUMN embedding vector(1536);

-- Create HNSW index for fast similarity search
CREATE INDEX ON products 
  USING hnsw (embedding vector_cosine_ops);

-- Semantic search query
SELECT asin, title, 1 - (embedding <=> query_embedding) AS similarity
FROM products
WHERE 1 - (embedding <=> query_embedding) > 0.8
ORDER BY similarity DESC
LIMIT 10;
```

**pg_cron for scheduled jobs:**

```sql
-- Install extension (done in Dashboard → Database → Extensions)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily SP-API report pull (3 AM ET = 8 AM UTC)
SELECT cron.schedule('daily-sp-api-pull', '0 8 * * *', $$
  SELECT trigger_report_pull();
$$);

-- View scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
```

**Supavisor connection pooler:**
Always use the Supavisor URL for n8n and external services (not the direct connection URL). Format:
`postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

**Schema migrations — always via CLI, never dashboard in production:**

```bash
# Create a new migration file
supabase migration new add_sqp_weekly_table

# Edit the generated file in supabase/migrations/

# Apply locally (test)
supabase db reset

# Push to production
supabase db push
```

**Key Gotchas:**
- CONCURRENTLY is required for indexes on live production tables — without it, the table is locked during index build
- `vault.decrypted_secrets` is a view that only works with service role — anon key returns empty (not an error)
- Edge Functions get `SUPABASE_SERVICE_ROLE_KEY` automatically via `Deno.env.get()` — don't pass it as a parameter
- Never edit the database schema in the Supabase Dashboard on production — use migration files

**Best Practices:**
- Use `TIMESTAMPTZ` always — `TIMESTAMP` without timezone causes DST bugs in EU/non-UTC timezones
- Use `DECIMAL(10,2)` for monetary values — never `FLOAT` (floating-point rounding errors in money = accounting nightmare)
- Use UUID primary keys everywhere — integer PKs expose enumeration vulnerability
- Index foreign keys explicitly — Postgres doesn't auto-index FK columns
- Keep Edge Functions thin — move complex business logic to database functions or n8n

---

### 4.2 Vercel + Next.js

**What it is:** Vercel is the deployment platform for Next.js (App Router). Together they provide the web application tier for syncflow dashboards and the server-side SP-API proxy layer.

**Server vs Client Components — the critical rule for SP-API:**

```
SP-API CALLS MUST BE SERVER-SIDE ONLY.

Server Components (no "use client" directive) — CAN make SP-API calls
Route Handlers (/app/api/*) — CAN make SP-API calls
Server Actions — CAN make SP-API calls
Client Components ("use client") — CANNOT directly call SP-API
```

If SP-API credentials appear in client-side code, every browser user can extract them.

**@supabase/ssr — correct package for Next.js:**

```typescript
// lib/supabase/server.ts — for Server Components and Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) { cookieStore.set({ name, value, ...options }) },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}

// lib/supabase/client.ts — for Client Components
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Middleware for session refresh:**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  // Refresh session — must call getUser() to refresh, not getSession()
  await supabase.auth.getUser()
  return response
}
```

**ISR vs SSR vs SWR — when to use each:**

| Pattern | When to Use | Stale Tolerance |
|---|---|---|
| ISR (revalidate: N) | Aggregate data, product catalogs | Minutes to hours OK |
| SSR (no-store) | User-specific data, live metrics | Must be fresh |
| SWR (client-side) | Real-time updates, live inventory | Seconds OK |
| Static | Marketing pages, help content | Days OK |

**LWA token refresh in Vercel (in-memory cache pattern):**

```typescript
// lib/lwa-token.ts
const tokenCache = new Map<string, { token: string; expiresAt: number }>()

export async function getLwaToken(refreshToken: string): Promise<string> {
  const cached = tokenCache.get(refreshToken)
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.token
  }
  
  const response = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.SP_API_CLIENT_ID!,
      client_secret: process.env.SP_API_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  })
  
  const data = await response.json()
  const expiresAt = Date.now() + data.expires_in * 1000
  tokenCache.set(refreshToken, { token: data.access_token, expiresAt })
  return data.access_token
}
```

**NEXT_PUBLIC_ rules:**

| Variable | Public? | Reason |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | URL is not secret |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Designed to be public; RLS guards data |
| `SUPABASE_SERVICE_ROLE_KEY` | NO | Full DB bypass |
| `SP_API_LWA_REFRESH_TOKEN` | NO | Full seller account access |
| `SP_API_CLIENT_SECRET` | NO | Can mint tokens for any authorized seller |

**Key Gotchas:**
- Vercel Serverless Functions have a 60-second timeout on Hobby plan, 300 seconds on Pro — SP-API report downloads must be async or use Edge Functions
- `getSession()` in Server Components can be spoofed — always use `getUser()` for auth checks
- NEXT_PUBLIC_ prefix causes the value to be compiled into the browser bundle — inspect your JS to verify no secrets leaked
- In-memory caches (like the LWA token cache above) do NOT persist across Vercel cold starts — each function instance has its own cache

**Best Practices:**
- Use separate Supabase projects for production and preview — never share prod DB with preview deployments
- Run `vercel env pull .env.local --environment=preview` to sync local env with Vercel (pull staging, not production)
- Use ISR for product catalog pages — they rarely change but get frequent visits
- Route Handlers for all SP-API calls — keeps business logic server-side and out of Server Components

---

### 4.3 Database Best Practices

**What it is:** The canonical patterns for schema design, data types, indexing, and database selection across syncflow projects.

**Database selection guide:**

| Use Case | Recommended | Cost | Why |
|---|---|---|---|
| Primary app database | Supabase Pro | $25/mo | Auth, Vault, Edge Functions, RLS all included |
| Pure DB (no auth needed) | Neon | Free–$19/mo | Cheapest pure Postgres; no extra features |
| High-traffic read-heavy | Supabase + pgBouncer | $25+/mo | Pooler handles connection limits |
| Development/testing | Supabase free tier | $0 | But has 1-week pause on inactivity |

**Rule: Always start with Supabase Pro** for any production Amazon brand system. The $25/month includes too many must-have features to justify starting on the free tier.

**Data type rules (non-negotiable):**

| Data Type | Use For | Never Use |
|---|---|---|
| `TIMESTAMPTZ` | All timestamps | `TIMESTAMP` (no timezone) |
| `DECIMAL(10,2)` | All monetary values | `FLOAT`, `REAL`, `DOUBLE PRECISION` |
| `UUID` | All primary keys | `SERIAL`, `BIGSERIAL`, `INTEGER` |
| `TEXT` | All strings | `VARCHAR(n)` (no benefit in Postgres) |
| `JSONB` | Semi-structured data | `JSON` (JSONB is indexed and binary) |
| `BOOLEAN` | True/false flags | `CHAR(1)`, `INTEGER` (Y/N anti-pattern) |

**Core Amazon brand schema (complete set):**

```sql
-- Brands
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplaces (seed with 21 rows)
CREATE TABLE marketplaces (
  marketplace_id TEXT PRIMARY KEY,  -- 'ATVPDKIKX0DER'
  name TEXT NOT NULL,               -- 'Amazon US'
  region TEXT NOT NULL,             -- 'NA', 'EU', 'FE'
  currency TEXT NOT NULL,           -- 'USD'
  timezone TEXT NOT NULL            -- 'America/New_York'
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  asin TEXT NOT NULL,
  marketplace_id TEXT NOT NULL REFERENCES marketplaces(marketplace_id),
  title TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asin, marketplace_id)
);

-- Daily sales
CREATE TABLE sales_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  date DATE NOT NULL,
  units_ordered INTEGER NOT NULL DEFAULT 0,
  ordered_product_sales DECIMAL(12,2),
  currency TEXT,
  UNIQUE(product_id, date)
);

-- Inventory snapshots
CREATE TABLE inventory_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  fulfillable_quantity INTEGER,
  reserved_quantity INTEGER,
  inbound_quantity INTEGER
);

-- PPC performance (daily)
CREATE TABLE ppc_performance_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  campaign_id TEXT NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  sales DECIMAL(10,2) DEFAULT 0,
  UNIQUE(product_id, campaign_id, date)
);

-- SQP snapshots
CREATE TABLE sqp_weekly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  week_end DATE NOT NULL,
  search_query TEXT NOT NULL,
  search_frequency_rank INTEGER,
  impression_share DECIMAL(5,4),
  click_share DECIMAL(5,4),
  purchase_share DECIMAL(5,4),
  UNIQUE(product_id, week_end, search_query)
);
```

**Indexing rules:**

```sql
-- Index all foreign keys (Postgres doesn't do this automatically)
CREATE INDEX ON products(brand_id);
CREATE INDEX ON sales_daily(product_id);

-- Index all columns used in WHERE clauses
CREATE INDEX ON products(asin);
CREATE INDEX ON products(status);
CREATE INDEX ON sales_daily(date);

-- Use CONCURRENTLY on live production tables (non-blocking)
CREATE INDEX CONCURRENTLY ON ppc_performance_daily(campaign_id);

-- Partial indexes for active records only (huge speed improvement)
CREATE INDEX ON products(asin) WHERE status = 'active';
```

**Key Gotchas:**
- `FLOAT` for prices causes rounding errors — $9.99 stored as FLOAT can come back as $9.989999... 
- `TIMESTAMP` (no timezone) causes ghost DST bugs when EU daylight saving changes clocks
- Missing FK indexes cause sequential scans on joins — major performance issue at scale
- JSONB is slower to read than columns but invaluable for variable schema data (raw API responses)

**Best Practices:**
- Add `created_at` and `updated_at` to every table — you'll always need them eventually
- Use `ON CONFLICT DO UPDATE` (upsert) for API data ingestion — much simpler than INSERT + UPDATE logic
- Store raw API responses in a `raw_response JSONB` column alongside parsed columns — enables re-parsing without re-fetching
- Partition large tables (>10M rows) by date: `PARTITION BY RANGE (date)`

---

### 4.4 Auth & Security Patterns

**What it is:** Cross-stack security architecture for credential management, secrets storage, API key rotation, and compliance — across SP-API, Supabase, n8n, Vercel, and Amazon Ads.

**Threat matrix — priority tiers:**

| Priority | Threats | Action |
|---|---|---|
| P0 — Fix before shipping | SP-API creds in git (T1), Ads creds insecure (T2), Supabase service role exposed client-side (T3), client data cross-contamination via RLS gaps (T10) | Immediate |
| P1 — Fix before second client | No HMAC webhook validation (T7), no offboarding rotation (T9), n8n credentials in workflow exports (T4), SSRF in Edge Functions (T12) | Within sprint |
| P2 — Operational hygiene | Rate limit monitoring (T8), anon key in logs (T11) | Within 30 days |

**SP-API credential types:**

| Credential | Lifetime | Exposure Impact | Rotation |
|---|---|---|---|
| LWA Client ID | Permanent | Low alone | Rarely |
| LWA Client Secret | Permanent until rotated | High + Client ID = token minting | Annually minimum |
| LWA Refresh Token | ~1 year | Critical — full seller access | On compromise; annually |
| AWS IAM credentials | Long-lived unless rotated | High | 90 days, or use STS |

**STS AssumeRole — why it beats direct IAM:**
- Credentials auto-expire in 1–12 hours (configured)
- Leaked temp credentials become useless in ≤1 hour
- Full CloudTrail audit of every AssumeRole call
- No long-term keys to rotate

**Vault naming convention:**
```
sp_api:<seller_account_id>:refresh_token
sp_api:<seller_account_id>:client_id
sp_api:<seller_account_id>:client_secret
ads_api:<seller_account_id>:refresh_token
ads_api:<seller_account_id>:profile_id
webhook:<service>:<seller_account_id>:signing_secret
n8n:api_key
n8n:encryption_key
figma:<brand_id>:access_token
```

**Secrets hierarchy — canonical:**

```
Supabase Vault (Source of Truth — all shared secrets)
    │
    ├── Vault Proxy Edge Function (allowlisted secret names only)
    │       │
    │       ├── n8n credential store (cached, rotated on change)
    │       └── Vercel server-side env vars (prod only, never NEXT_PUBLIC_)
    │
    └── .env.local (dev/staging credentials only — never production)
```

**Key rules:**
1. Supabase Vault is authoritative — every secret must exist there
2. Downstream systems cache, not own — n8n and Vercel hold cached copies only
3. No secret exists in more than one place permanently
4. `.env.local` contains dev/sandbox credentials only — never production

**Vault Proxy Edge Function — allowlisted secrets for n8n:**

```typescript
// supabase/functions/get-secret/index.ts
const ALLOWED_SECRETS = [
  'sp_api:seller_abc123:refresh_token',
  'ads_api:seller_abc123:refresh_token',
  // Explicit allowlist — NEVER allow wildcard retrieval
]

// Validate caller with a shared function key before returning any secret
const authHeader = req.headers.get('x-function-key')
if (authHeader !== FUNCTION_API_KEY) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
```

**n8n credential management rules:**
- Set `N8N_ENCRYPTION_KEY` to a 32+ char random string before creating ANY credentials
- Store the encryption key itself in Vault (before n8n even starts — chicken-and-egg solved by bootstrap key)
- Never embed credential values in workflow JSON nodes — use named credential references
- Workflow JSON exports with credential references (not values) are safe to commit to git

**Git commit protection:**

```bash
# Install git-secrets globally
brew install git-secrets
git secrets --register-aws --global

# Add Amazon-specific patterns
git secrets --add 'Atzr\|[A-Za-z0-9_-]{200,}'   # LWA refresh token
git secrets --add 'amzn1\.[a-z0-9]+\.[a-z0-9-]+'  # LWA client ID

# Essential .gitignore entries
.env
.env.local
.env.*.local
.env.production
*.n8n.json
n8n-workflows/
workflow-exports/
.supabase/
supabase/.env
```

**Supabase RLS keys — the decisive choice:**

| Key | RLS Enforced? | Use In |
|---|---|---|
| `anon` key | Yes — policies apply | Browser clients, public Next.js |
| `service_role` key | No — bypasses all RLS | n8n, Edge Functions, server-side only |

**NEXT_PUBLIC_ security rule:**
Any variable prefixed `NEXT_PUBLIC_` is compiled into the browser bundle and visible to every user via DevTools. Service role key, SP-API tokens, and n8n API key must NEVER have this prefix.

**Multi-account isolation for agencies:**
```
syncflow Developer Central
├── App: syncflow-internal           → Your own accounts
├── App: syncflow-client-brand-a     → Brand A only
├── App: syncflow-client-brand-b     → Brand B only
└── App: syncflow-client-brand-c     → Brand C only
```
One LWA app per client — if one app is suspended, only that client loses access.

**Webhook HMAC validation:**
Always validate inbound webhook signatures before processing. For WhatsApp: `X-Hub-Signature-256` header. For SP-API: not applicable (SQS handles auth). For custom webhooks: implement HMAC-SHA256 with a shared secret stored in Vault.

**GDPR / CCPA compliance basics:**
- Buyer PII via SP-API requires RDT (Restricted Data Token) — never cached, used once
- Order data retention: implement a `delete_after` column + pg_cron cleanup job
- Document what data you store and why — maintain a data processing register
- SP-API DPA (Data Processing Agreement) must be accepted in Developer Central

**Key Gotchas:**
- `vault.decrypted_secrets` returns empty (not an error) when accessed with anon key — confusing to debug
- n8n encryption key loss = loss of all stored credentials — no recovery path
- STS temp credentials include a `SessionToken` that MUST be sent with every SigV4 request alongside the key/secret
- LWA refresh tokens expire ~1 year but Amazon doesn't send expiry warnings — build your own monitoring

**Best Practices:**
- Run a monthly credential audit: list all Vault secrets, verify they're still needed
- Rotate LWA client secrets annually at minimum
- Use an offboarding checklist for contractors: list every credential they had access to, rotate all of them
- Never log SP-API access tokens or refresh tokens — mask them in all log outputs

---

### 4.5 Local LLM / GPU

**What it is:** Running AI inference locally for Amazon brand automation — text LLMs via Ollama, image generation via ComfyUI — for overnight batch jobs where volume makes cloud APIs uneconomical.

**Break-even analysis:**

| Hardware | Cost | Monthly API savings threshold |
|---|---|---|
| RTX 3090 (used, 24GB) | ~$800 | >$100/month API spend |
| RTX 4090 (new, 24GB) | ~$1,500 | >$200/month API spend |
| RTX 6000 Ada (48GB) | ~$5,500 | >$700/month API spend |

Rule: >5,000 images/month OR >200K LLM calls/month → local GPU pays for itself within a year.

**Hardware tiers:**

| Tier | Hardware | Best Models | Use Case |
|---|---|---|---|
| Consumer | RTX 4090 24GB | 8B FP16, 70B Q4, Flux Dev fp8 | Primary recommendation for syncflow |
| Prosumer | RTX 6000 Ada 48GB | 70B Q8, Flux Dev BF16 | Agency-scale simultaneous jobs |
| Mac Apple Silicon | M3/M4 Max (36–128GB unified) | 70B Q4 LLM (no images at scale) | LLM batch on existing hardware |
| Cloud rental | Vast.ai / RunPod | Any | Occasional heavy jobs |

**VRAM calculation rule:** `Parameter count × 2 bytes = VRAM minimum (FP16)`
- 7B model: 14 GB VRAM minimum
- 8B model: 16 GB VRAM minimum
- 70B model: 140 GB VRAM minimum → use Q4 quantization (≈0.5 bytes/param = ~35 GB)

**Quantization:** Q4_K_M ≈ 0.5 bytes/param. Q8 ≈ 1 byte/param. Q4 for batch jobs (speed), Q8 for quality-sensitive tasks.

**Ollama — local LLM server:**

```bash
# Install
brew install ollama  # macOS
curl -fsSL https://ollama.com/install.sh | sh  # Linux

# Key models for Amazon workflows
ollama pull llama3.1:8b          # General purpose — product descriptions, bullets
ollama pull llama3.1:70b         # High quality — A+ content, complex copywriting
ollama pull qwen2.5:7b           # Multilingual — DE/FR/JP/ES marketplaces
ollama pull nomic-embed-text     # Embeddings for pgvector (768-dim)
ollama pull phi4:14b             # Classification, extraction (very fast)

# OpenAI-compatible API — drop-in replacement
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.1:8b", "messages": [{"role": "user", "content": "..."}]}'
```

**Ollama Python integration (OpenAI-compatible):**

```python
from openai import OpenAI

# Point to local Ollama — same code as OpenAI, different base_url
client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama"  # value ignored by Ollama
)

response = client.chat.completions.create(
    model="llama3.1:8b",
    messages=[
        {"role": "system", "content": "You are an Amazon listing expert."},
        {"role": "user", "content": "Rewrite this bullet point: ..."}
    ],
    temperature=0.2
)
```

**Key Ollama environment variables:**

| Variable | Default | When to Change |
|---|---|---|
| `OLLAMA_HOST` | `127.0.0.1:11434` | Set `0.0.0.0` when n8n and Ollama are on different containers |
| `OLLAMA_KEEP_ALIVE` | `5m` | Set `60m` for batch jobs to avoid model reload overhead |
| `OLLAMA_NUM_PARALLEL` | `1` | Increase for concurrent requests (if VRAM allows) |
| `OLLAMA_FLASH_ATTENTION` | off | Enable for better performance on supported GPUs |

**Model selection by Amazon task:**

| Task | Recommended Model | Why |
|---|---|---|
| Product description rewriting | LLaMA 3.1 8B | Fast enough, quality sufficient |
| Bullet point optimization | Mistral 7B | Efficient instruction following |
| Complex A+ content | LLaMA 3.1 70B Q4 | Quality justified for overnight batch |
| Multi-marketplace translation | Qwen2.5 7B | Multilingual is its superpower |
| Keyword extraction / classification | Phi-4 Mini (3.8B) | Trivially fast, minimal VRAM |
| Review summarisation | LLaMA 3.1 8B | Sufficient quality, high throughput |
| Embeddings for pgvector | nomic-embed-text | Fast 768-dim, excellent quality |

**Custom Ollama modelfiles for consistent Amazon output:**

```dockerfile
# Modelfile.amazon-bullets
FROM llama3.1:8b

SYSTEM """
You are an Amazon listing optimization expert.
Rules:
- Start each bullet with a key benefit in ALL CAPS (max 3 words)
- Keep each bullet under 200 characters
- Focus on customer benefit, not just feature
- Return output as JSON array of strings only
"""

PARAMETER temperature 0.2
PARAMETER top_p 0.9
```

**ComfyUI — local image generation:**

ComfyUI is node-based (unlike AUTOMATIC1111's simple UI) and fully API-drivable for batch automation. Exposes HTTP API at `http://localhost:8188`.

**Directory structure:**
```
ComfyUI/models/
├── checkpoints/    # Main model weights (Flux .safetensors)
├── loras/          # LoRA adapter files
├── vae/            # VAE decoder models
└── unet/           # Flux UNet for split format
```

**Essential custom nodes for Amazon workflows:**
- `ComfyUI-Impact-Pack` — product background removal/segmentation
- `ComfyUI_IPAdapter_plus` — consistent product appearance across generations
- `ComfyUI-layerdiffuse` — transparent background generation for product compositing
- `WAS Node Suite` — file I/O and batch processing utilities

**ComfyUI API — programmatic job submission:**

```python
import requests, json, time

COMFY_URL = "http://localhost:8188"

def submit_image_job(workflow: dict) -> str:
    """Submit workflow, return prompt_id."""
    response = requests.post(f"{COMFY_URL}/prompt", json={"prompt": workflow})
    return response.json()["prompt_id"]

def wait_for_images(prompt_id: str, timeout: int = 300) -> list[str]:
    """Poll until complete, return image URLs."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        history = requests.get(f"{COMFY_URL}/history/{prompt_id}").json()
        if prompt_id in history:
            images = []
            for node_output in history[prompt_id]["outputs"].values():
                for img in node_output.get("images", []):
                    images.append(f"{COMFY_URL}/view?filename={img['filename']}&type={img['type']}")
            return images
        time.sleep(3)
    raise TimeoutError(f"Job {prompt_id} timed out")
```

**Recommended model for Amazon images:** Flux.1 Dev at Q5 quantization (fits 12–16 GB VRAM). Produces commercially-grade product shots at ~10–18 sec/image on RTX 4090 = 3,000–5,000 images in an overnight run.

**Overnight batch pipeline pattern:**

```
11 PM — Supabase pg_cron triggers batch job
  → n8n pulls "pending" items from Supabase
  → Loop: send to Ollama/ComfyUI via HTTP
  → Write results back to Supabase
  → Update status to "done"
7 AM — Batch complete, results ready for review
```

**Key Gotchas:**
- CPU-only inference is viable for testing but unusable for batch scale — 2–5 tokens/sec vs 50+ on GPU
- Flux.1 Dev at full precision (24 GB) causes OOM on RTX 4090 under load — use fp8 or Q5 quantization
- Multiple concurrent large models: only one large model loads at a time in a 24 GB GPU
- Apple Silicon (M3 Max+) is a legitimate LLM machine but ComfyUI's Metal backend has less community support than CUDA

**Best Practices:**
- Use LM Studio for model evaluation and quantization selection — then commit to Ollama for production
- Set `OLLAMA_KEEP_ALIVE=60m` for batch jobs to avoid repeated model load overhead
- For batch jobs > 1,000 items, use async Python with a semaphore (limit to 3 concurrent) rather than sequential processing
- Monitor VRAM usage during batch jobs — `ollama ps` shows GPU% utilization
- Keep overnight job logs in Supabase — when a job partially fails, you need the exact record of what was processed

---

## 5. APIs & Integrations

### 5.1 Email & CRM APIs

**What it is:** Email infrastructure for Amazon brand automation — transactional system alerts (SendGrid), customer lifecycle marketing for DTC (Klaviyo), and creator/influencer outreach workflows.

**Important constraint:** Amazon prevents sellers from directly emailing customers. Order confirmation emails go through Amazon's system. The only email addresses you receive are Amazon proxy addresses (e.g., `abc123@marketplace.amazon.com`) — you cannot use these in a standard ESP.

**Email use cases for Amazon brands:**

| Use Case | Tool | Why |
|---|---|---|
| Transactional system alerts (n8n errors, suppressed listings) | SendGrid | Simple, reliable, developer-focused |
| DTC (direct-to-consumer) customer lifecycle | Klaviyo | Best for e-commerce customer journeys, LTV optimization |
| Creator/influencer outreach | Gmail + n8n | Personalized outreach sequences |
| Order follow-ups (within Amazon system) | Amazon Request a Review API | Only compliant method for post-purchase contact |

**SendGrid for system alerts:**
- Transactional email API: `POST https://api.sendgrid.com/v3/mail/send`
- API key stored in Supabase Vault: `sendgrid:api_key`
- Use for: n8n error notifications, suppressed listing alerts, daily digest emails

**Klaviyo for DTC email:**
Klaviyo profiles are the central entity. Everything flows through profile creation → event tracking → flow triggers:

```bash
# Create/update a Klaviyo profile
curl -X POST https://a.klaviyo.com/api/profiles/ \
  -H "Authorization: Klaviyo-API-Key your-private-key" \
  -H "revision: 2024-02-15" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "type": "profile",
      "attributes": {
        "email": "customer@example.com",
        "first_name": "Jane",
        "properties": {
          "amazon_marketplace": "ATVPDKIKX0DER",
          "lifetime_orders": 3,
          "last_purchase_asin": "B08XYZ123"
        }
      }
    }
  }'
```

**n8n Supabase → Klaviyo sync pattern:**

```
[pg_cron trigger: daily at 2 AM]
  → [Supabase node: SELECT customers WHERE klaviyo_synced = false]
  → [Loop Over Items]
  → [HTTP Request: Klaviyo Profile API]
  → [Supabase node: UPDATE customers SET klaviyo_synced = true]
```

**Creator outreach best practices:**
- Use Gmail with n8n for sequence automation — avoid triggering spam filters by sending from a real inbox
- Keep initial outreach short (< 100 words) with one clear ask
- Track opens and replies in Supabase: `creator_outreach` table with `email_sent_at`, `opened_at`, `replied_at`
- Add 2–3 day delays between follow-ups in your sequence

**Key Gotchas:**
- Amazon proxy email addresses cannot be used for ESP campaigns — they're for Amazon system use only
- Klaviyo's free tier (500 contacts) disappears quickly — plan for paid tier from the start
- SendGrid requires domain verification (DNS records) before emails land consistently in inboxes
- Gmail's SMTP limits (500/day consumer, 2,000/day Workspace) matter for outreach sequences at scale

**Best Practices:**
- Set up email domain authentication (DKIM, DMARC, SPF) before sending any volume — deliverability depends on it
- Use Klaviyo for customer segments based on ASIN purchase history (sync from SP-API Orders)
- For creator outreach, research before contacting — an irrelevant pitch has negative value
- Store all sent emails in Supabase with a status column — enables resumable sequences if n8n crashes mid-sequence

---

### 5.2 WhatsApp API

**What it is:** Meta's WhatsApp Business API for customer communication. Particularly valuable for Amazon brands doing creator outreach, VIP customer programs, and B2B wholesale communication. Opt-in is a legal non-negotiable.

**Two integration paths:**

| Path | Cost | Setup | Best For |
|---|---|---|---|
| Meta Cloud API (direct) | Free API + conversation fees | Meta Developer console | syncflow (full control) |
| BSP (360dialog) | $10–50/month + fees | Simpler onboarding | Agencies needing faster setup |

**Recommendation: Meta Cloud API direct for syncflow.** BSP (360dialog) is appropriate for non-technical teams who need faster setup, but adds cost and a dependency for no technical benefit.

**Auth — System User tokens:**
- Create a System User in Meta Business Manager (not a personal user)
- Generate a never-expiring token for the System User
- Scope: `whatsapp_business_messaging`, `whatsapp_business_management`
- Store in Vault: `whatsapp:system_user_token`
- Regular user tokens expire every 60–90 days — System User tokens do NOT expire

**Webhook signature verification — X-Hub-Signature-256:**
This is CRITICAL. Verify every inbound webhook before processing:

```python
import hmac, hashlib

def verify_whatsapp_webhook(body: bytes, signature_header: str, app_secret: str) -> bool:
    """
    IMPORTANT: body must be the RAW bytes from the request.
    Never parse JSON first — parsing can reorder keys and invalidate the signature.
    """
    expected = 'sha256=' + hmac.new(
        app_secret.encode(),
        body,  # raw bytes, not parsed JSON
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)
```

**Conversation-based pricing (as of March 2024):**

| Conversation Type | Cost (US) | Notes |
|---|---|---|
| Service (user-initiated) | FREE | User messages you first |
| Marketing | ~$0.025 | You initiate with marketing template |
| Utility | ~$0.01 | Transactional (order updates, receipts) |
| Authentication | ~$0.01 | OTP, verification |

**Service conversations are free** since March 2024 — if the user messages first, all replies within the 24-hour window cost nothing.

**Supabase schema for WhatsApp automation:**

```sql
CREATE TABLE whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,  -- E.164 format: +15551234567
  display_name TEXT,
  opt_in_status TEXT DEFAULT 'pending',  -- 'pending', 'opted_in', 'opted_out'
  opt_in_at TIMESTAMPTZ,
  opt_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE whatsapp_consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES whatsapp_contacts(id),
  action TEXT NOT NULL,  -- 'opt_in', 'opt_out'
  source TEXT,           -- 'web_form', 'qr_code', 'manual'
  ip_address TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE whatsapp_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES whatsapp_contacts(id),
  message_id TEXT UNIQUE,  -- Meta's message ID for deduplication
  direction TEXT NOT NULL,  -- 'inbound', 'outbound'
  content TEXT,
  template_name TEXT,
  status TEXT,  -- 'sent', 'delivered', 'read', 'failed'
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Creator outreach 3-step sequence:**
```
Day 1: Introduction template
  "Hi {{name}}, I'm the team behind {{brand}}. We noticed your content about {{topic}} 
   and think you'd be a great fit for our creator program. Interested?"

Day 3 (if no reply): Follow-up
  "Following up on my message — would love to share a free {{product}} with you. 
   Just say 'yes' and I'll get details sent over."

Day 7 (if no reply): Final
  "Last message from me — our creator program for this quarter is filling up. 
   Reply 'info' for details or 'stop' to not hear from us again."
```

**Opt-in compliance — non-negotiable (GDPR/TCPA):**
- NEVER send WhatsApp messages without explicit prior opt-in
- Opt-in must be specific to WhatsApp (not buried in generic terms)
- Log every opt-in with timestamp, source, and IP address
- Honor opt-outs within 24 hours — remove from all active sequences
- Keep consent records for 5 years minimum

**n8n webhook routing for WhatsApp:**

```javascript
// Route by message type
const messageType = $json.entry[0].changes[0].value.messages?.[0]?.type;
const statusType = $json.entry[0].changes[0].value.statuses?.[0]?.status;

if (messageType) {
  return [{ json: { route: 'inbound_message', type: messageType } }];
} else if (statusType) {
  return [{ json: { route: 'status_update', status: statusType } }];
} else {
  return [{ json: { route: 'unknown' } }];
}
```

**Key Gotchas:**
- Signature verification MUST use raw request body bytes — parsing JSON first invalidates the signature
- System User token vs User Access Token: User tokens expire in 60–90 days; System User tokens never expire
- WhatsApp has a 24-hour window for free-form replies after a user sends a message — after 24 hours, you can only send approved templates
- Marketing templates require Meta review and approval (24–48 hours typically)

**Best Practices:**
- Store the System User token in Vault — rotate it only if compromised
- Build an opt-out handler as the first workflow you create — compliance first
- Use template messages for all outbound initiations — free-form only allowed within the 24h window
- For creator outreach, personalize the first message with their actual content topic — generic messages get ignored

---

### 5.3 Image Generation APIs

**What it is:** Cloud APIs for AI image generation — product lifestyle images, infographic backgrounds, text-in-image graphics, and creative variations at scale for Amazon listings.

**Amazon main image policy (non-negotiable):**
- **Main image (slot 1) MUST be a real photograph** on pure white background
- AI-generated main images violate Amazon policy and will be rejected or removed
- AI generation is appropriate for: secondary lifestyle images, infographic backgrounds, A+ content backgrounds, social media assets

**Provider decision tree:**

```
Need text in image (product badge, label, infographic)?
  → Ideogram 3 ($0.08/image)

Need lifestyle/scene photo at scale (>100/month)?
  → FAL.ai Flux.1 Dev ($0.025/image)
  → OR local ComfyUI ($0.0004/image electricity)

Need maximum reliability/consistency?
  → GPT-Image-1 ($0.04–$0.08/image)

Budget is zero, have GPU?
  → ComfyUI local (Flux.1 Dev quantized)
```

**Provider pricing comparison:**

| Provider | Model | Cost/image | Best For |
|---|---|---|---|
| FAL.ai | Flux.1 Dev | $0.025 | Lifestyle photos, scenes, highest quality cloud |
| FAL.ai | Flux.1 Schnell | $0.003 | Fast drafts, high-volume iteration |
| Ideogram | Ideogram 3 | $0.08 | Text-in-image (badges, labels, graphics) |
| OpenAI | GPT-Image-1 | $0.04–$0.08 | Reliability, consistency, easy API |
| ComfyUI local | Flux.1 Dev Q5 | ~$0.0004 | Zero variable cost at scale |

**FAL.ai integration:**

```python
import fal_client

# Simple generation
result = fal_client.subscribe(
    "fal-ai/flux/dev",
    arguments={
        "prompt": "Luxury bamboo cutting board on modern kitchen countertop, "
                  "natural light, lifestyle photography, pure white background elements",
        "image_size": "square_hd",  # 1024x1024
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "num_images": 1,
        "enable_safety_checker": True,
    }
)
image_url = result["images"][0]["url"]
```

**Ideogram for text-in-image:**

```python
import requests

response = requests.post(
    "https://api.ideogram.ai/generate",
    headers={
        "Api-Key": "your-ideogram-api-key",
        "Content-Type": "application/json"
    },
    json={
        "image_request": {
            "prompt": "Product badge: '2X More Durable' in bold white text on dark green rounded rectangle, clean modern design, no background",
            "model": "V_3",
            "magic_prompt_option": "OFF",  # OFF for text-in-image — don't let AI rewrite your prompt
            "aspect_ratio": "ASPECT_1_1",
            "rendering_quality": "QUALITY"
        }
    }
)
image_url = response.json()["data"][0]["url"]
```

**Full 7-image set cost estimate per ASIN:**

| Image Slot | Type | Tool | Cost |
|---|---|---|---|
| 1 — Main | Real photo (required) | Photography / existing | $0 (AI prohibited) |
| 2 — Lifestyle | AI-generated scene | FAL.ai Flux Dev | $0.025 |
| 3 — Lifestyle | Different scene/angle | FAL.ai Flux Dev | $0.025 |
| 4 — Infographic | Product with text callouts | Ideogram 3 | $0.080 |
| 5 — Size chart | Dimensional graphic | Ideogram 3 | $0.080 |
| 6 — Use case | In-use lifestyle | FAL.ai Flux Dev | $0.025 |
| 7 — Comparison | Feature comparison graphic | Ideogram 3 | $0.080 |
| **Total** | | | **~$0.35/ASIN** |

**Key Gotchas:**
- FAL.ai Flux presigned S3 URLs expire — download and store images immediately after generation
- `magic_prompt_option: "OFF"` in Ideogram is essential for text-in-image — with it ON, Ideogram rewrites your prompt and the text changes
- GPT-Image-1 uses the OpenAI Images API (`/v1/images/generations`), not chat completions
- Flux.1 Dev (cloud) is a gated model on Hugging Face — accept license before using the local version

**Best Practices:**
- Generate multiple variations per slot (3–5) and pick the best — at $0.025/image, variety is cheap
- Always store the generation prompt alongside the image in Supabase — enables exact reproduction
- For product shots, include specific lighting descriptors: "soft diffused studio lighting, subtle shadows, product sharp focus" consistently outperforms generic prompts
- Build a prompt template library per product category — consistent prompts produce consistent style

---

### 5.4 Figma Plugin SDK

**What it is:** The Figma Plugin API for building plugins that run inside Figma — used for Amazon brand tools like bulk image export, listing image optimization, and design system management.

**Two-thread model — the most critical architectural constraint:**

```
Plugin architecture:
┌─────────────────────────────────────────┐
│           Figma App (sandboxed)          │
│                                         │
│  main.ts (Plugin Main Thread)           │
│  ├── Access: figma.* API (ALL of it)    │
│  ├── Cannot: fetch(), XMLHttpRequest    │
│  └── Cannot: access browser APIs        │
│                                         │
│  ui.html (Plugin UI Thread - iframe)    │
│  ├── Access: fetch(), browser APIs      │
│  ├── Cannot: figma.* API (none)         │
│  └── Communicates via postMessage       │
└─────────────────────────────────────────┘
```

**The rule: ALL network I/O (fetch, API calls) must happen in ui.html.** If you try to `fetch()` in main.ts, it throws. This is not a bug — it's a security sandbox.

**Communication pattern between threads:**

```typescript
// main.ts — send to UI
figma.ui.postMessage({ type: 'EXPORT_REQUEST', nodeId: selectedNode.id });

// ui.html — receive from main thread
window.onmessage = async (event) => {
  const { type, nodeId } = event.data.pluginMessage;
  if (type === 'EXPORT_REQUEST') {
    // Fetch can happen here
    const result = await uploadToS3(nodeId);
    // Send result back
    parent.postMessage({ pluginMessage: { type: 'UPLOAD_DONE', url: result } }, '*');
  }
};

// main.ts — receive from UI
figma.ui.onmessage = (msg) => {
  if (msg.type === 'UPLOAD_DONE') {
    figma.notify(`Uploaded: ${msg.url}`);
  }
};
```

**networkAccess in manifest.json — mandatory for fetch:**

```json
{
  "name": "Amazon Image Uploader",
  "id": "your-plugin-id",
  "api": "1.0.0",
  "main": "main.js",
  "ui": "ui.html",
  "networkAccess": {
    "allowedDomains": [
      "https://your-vercel-app.vercel.app",
      "https://your-project.supabase.co",
      "https://sellingpartnerapi-na.amazon.com"
    ]
  }
}
```

**Without `networkAccess.allowedDomains`, all fetch calls fail silently (or with a generic error) — not "Access denied", just fails.** Add every domain you need to call.

**postMessage bytes gotcha:**
When exporting Figma nodes as PNG/SVG bytes, convert to `Array.from()` before postMessage:

```typescript
// main.ts — CORRECT way to export and send bytes
const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
figma.ui.postMessage({
  type: 'IMAGE_BYTES',
  data: Array.from(bytes),  // Convert Uint8Array → regular Array for structured clone
  filename: `${node.name}.png`
});
```

If you send raw `Uint8Array` without `Array.from()`, it silently fails or arrives as empty data on the UI side.

**Sequential export — don't use Promise.all() for large batches:**

```typescript
// WRONG — parallel export can OOM Figma
const results = await Promise.all(nodes.map(n => n.exportAsync()));

// CORRECT — sequential with progress updates
const results = [];
for (const node of nodes) {
  figma.ui.postMessage({ type: 'PROGRESS', current: results.length, total: nodes.length });
  results.push(await node.exportAsync({ format: 'PNG' }));
  await new Promise(resolve => setTimeout(resolve, 50));  // yield between exports
}
```

**SP-API image upload route (Vercel — called from ui.html):**

```typescript
// app/api/upload-image/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('image') as File;
  const asin = formData.get('asin') as string;
  
  // 1. Get SP-API credentials from Vault
  // 2. Request pre-signed upload URL from SP-API Feeds
  // 3. Upload to Amazon's S3
  // 4. Associate image with ASIN via Listings API
  
  return Response.json({ success: true, imageUrl: '...' });
}
```

**Key Gotchas:**
- `fetch()` in main.ts = silent failure — all network calls must be in ui.html
- `networkAccess.allowedDomains` must list every domain explicitly — wildcards not supported
- `Array.from(bytes)` before postMessage — raw Uint8Array fails silently
- Parallel exports with `Promise.all()` on large node sets causes Figma to become unresponsive
- Plugin UI height must be set explicitly: `figma.showUI(__html__, { width: 400, height: 500 })`

**Best Practices:**
- Build the UI thread as a mini web app (separate HTML/CSS/JS) for maintainability
- Add explicit error handling in postMessage handlers — unhandled errors in the plugin UI crash silently
- Use `figma.notify()` for user feedback (shows in Figma's notification bar) instead of UI-only alerts
- Store the last 10 generated images in Supabase with their Figma node IDs for re-upload without re-generating

---

## 6. Project Management

### 6.1 Project Management Apps for Amazon Brands

**What it is:** Comparison of project management tools for Amazon brand teams, with focus on MCP tool availability, automation capabilities, and recommended stack.

**MCP tool coverage comparison (2026):**

| Tool | MCP Tools | MCP Status | Best For |
|---|---|---|---|
| ClickUp | 49 tools | Production stable | Best overall MCP coverage |
| Asana | ~30 tools | MCP v2 (first mover) | Governance, compliance, enterprise |
| Linear | 20+ tools | Stable | Engineering teams, sprint management |
| Notion | 15+ tools | Stable | Documentation, wikis, databases |
| Trello | 0 | No MCP | Not suitable for automation |
| Airtable | 0 official | No official MCP (mid-2026 estimated) | Best data layer, but no MCP yet |
| Monday.com | 0 | No MCP | Not suitable for automation |
| Jira | Limited | API-based | Enterprise only; complex setup |

**Recommended stack for Amazon brand automation:**

```
ClickUp          — Task and project management (MCP automation)
Airtable         — Structured data layer (product database, SKU tracking)
Slack            — Team communication + n8n alerts
n8n / Make       — Workflow automation glue
```

**ClickUp hierarchy refresher:**
```
Workspace → Space → Folder → List → Task → Subtask → Checklist Item
```
- **Workspace**: top-level organization (one per company)
- **Space**: business area (Amazon Operations, Creative, Finance)
- **Folder**: project or process group
- **List**: specific workflow type or status group
- **Task**: individual work item (one ASIN optimization = one task)

**Key differentiators:**

| Tool | Unique Strength | Key Limitation |
|---|---|---|
| ClickUp | 49 MCP tools, Brain AI, deep automation | Can be overwhelming; 300 MCP calls/24h on standard |
| Asana | Best governance features, MCP v2 pioneer | Expensive for large teams |
| Airtable | Best structured data layer (like a spreadsheet+DB) | No official MCP yet; automation limited |
| Notion | All-in-one (docs + database + tasks) | Task management is weaker than dedicated tools |
| Linear | Best for engineering/dev workflows | Overkill for non-technical Amazon ops |

**ClickUp custom fields for Amazon brand management:**

```
Must-have custom fields per task:
- ASIN (text) — the specific ASIN being worked on
- Marketplace (dropdown) — US / UK / DE / JP / etc.
- Task Type (dropdown) — Listing Opt / PPC / Content / Compliance / Launch
- Priority (dropdown) — P0 Critical / P1 High / P2 Medium / P3 Low
- Brand (relation) — links to brand entity
- Week (date) — the work week this task belongs to
```

**n8n + ClickUp automation examples:**

1. **Suppressed listing → ClickUp task:**
```
[SP-API webhook: LISTINGS_ITEM_STATUS_CHANGE]
  → [Parse: ASIN, marketplace, reason]
  → [ClickUp: create_task in "Compliance & Issues" list]
     Title: "SUPPRESSED: {ASIN} - {reason}"
     Priority: P0 Critical
     Due Date: today + 1 day
     Custom fields: ASIN, Marketplace
  → [Slack alert to #amazon-ops channel]
```

2. **Weekly SQP report → ClickUp tracking task:**
```
[Schedule: every Monday 9 AM]
  → [Supabase: fetch SQP data with significant click_share drops]
  → [Loop: one task per affected ASIN]
  → [ClickUp: create_task in "Analytics & Reporting" list]
```

**Airtable as data layer (no MCP — use n8n HTTP integration):**
Despite no official MCP, Airtable is valuable as a structured data layer for:
- Product master catalog (ASIN master with all attributes)
- Supplier and cost tracking
- Launch planning gantt (Formula fields make this powerful)
- Creator database (contact info, engagement rates, partnership history)

Connect via n8n's Airtable native node or REST API.

**Key Gotchas:**
- ClickUp's 300 MCP calls/24h limit on Unlimited plan resets at midnight UTC — heavy automation workflows can hit this
- ClickUp custom field IDs are UUIDs — must be fetched programmatically with `clickup_get_custom_fields` before setting
- Notion's task database is functional but lacks priority queuing, dependency tracking, and status workflow rules compared to ClickUp
- Airtable's automation runs (max 25,000/month on Business plan) are separate from MCP call limits

**Best Practices:**
- Build the ClickUp structure first, document all Space/Folder/List IDs in a Supabase config table
- Set up the "Suppressed Listing → ClickUp task" automation before any other — it's highest ROI
- Use ClickUp for task lifecycle (create, assign, track, close); use Airtable for data that needs to be queried/filtered like a database
- Enable Slack notifications from ClickUp for P0 tasks — your team shouldn't need to check ClickUp to know there's a fire

---

## 7. Quick Reference Index

| Topic | Key API/Tool | Auth Method | Key Gotcha | Best Use Case |
|---|---|---|---|---|
| SP-API | `sellingpartnerapi.amazon.com` | LWA OAuth2 + SigV4 | SQS standard only (not FIFO); XML feeds dead July 2025 | All seller account automation |
| SP-API Reports | Reports API v2021 | SP-API auth | Presigned S3 URL expires in 5 min; download immediately | Sales, inventory, keyword data |
| SP-API Notifications | SQS + Notifications API | SQS policy: principal `437568002678` | Standard queue only; Visibility Timeout ≥ 2× processing time | Real-time order/listing events |
| Advertising API | `advertising.amazon.com/v2/` | LWA + Profile ID header | Data has 48–72h attribution lag; report S3 URLs expire in 5 min | Campaign management, bid optimization |
| A+ Content API | SP-API | SP-API auth | Brand Story must be on ALL ASINs before Premium A+ | Programmatic content publishing |
| Brand Analytics / SQP | SP-API / Data Kiosk | SP-API auth | Only 90-day rolling window by default; store weekly | Share of voice tracking |
| Multi-Marketplace | Supabase + marketplace_id column | Per-seller Vault credentials | FIFO vs standard SQS; UTC timestamps; FX rate per conversion | Cross-market reporting |
| Rainforest API | `api.rainforestapi.com` | API key | Use `type=offers` for prices (not `type=product`) | Competitive price monitoring |
| Keepa | `api.keepa.com` | API key | Epoch = 2011-01-01 (not Unix); price index 0 = Amazon, 18 = Buy Box | Historical price/rank trends |
| n8n | Self-hosted / Cloud | n8n API key + credential store | Typed AI connections; JSON exports with inline creds unsafe | Workflow automation hub |
| SQS Event Pipeline | AWS SQS | IAM STS credentials | `437568002678` principal; standard queue; DLQ MaxReceiveCount=3 | SP-API real-time event processing |
| ClickUp | `api.clickup.com` | API key + OAuth | Custom field IDs are UUIDs, fetch first; 300 MCP calls/24h limit | Amazon ops project management |
| Claude Code | CLI | API key in ~/.claude.json | CLAUDE.md max ~200 lines; enable toolSearch:true | Agentic coding / file editing |
| Supabase | PostgreSQL + extras | anon/service_role JWT | Service role bypasses RLS; Vault for all secrets; TIMESTAMPTZ always | Primary database + auth + secrets |
| Vercel + Next.js | Next.js App Router | Supabase Auth JWT | SP-API must be server-side only; NEXT_PUBLIC_ = browser-visible | Dashboard + SP-API proxy |
| Auth / Security | Supabase Vault + STS | Vault → downstream | One LWA app per client; N8N_ENCRYPTION_KEY loss = credential loss | Secrets management |
| Ollama | `localhost:11434` | None (local) | OLLAMA_HOST=0.0.0.0 for network access; Q4 for 70B | Overnight LLM batch jobs |
| ComfyUI | `localhost:8188` | None (local) | Sequential export only; IP-Adapter for product consistency | Local product image generation |
| FAL.ai | `fal.run` | FAL_KEY env var | Download images immediately — URLs expire | Cloud image generation at scale |
| Ideogram | `api.ideogram.ai` | Api-Key header | Set `magic_prompt_option: "OFF"` for text-in-image | Text-in-image (badges, infographics) |
| SendGrid | `api.sendgrid.com/v3/` | Bearer token | Domain DKIM/DMARC required for deliverability | System alert emails |
| Klaviyo | `a.klaviyo.com/api/` | Klaviyo-API-Key header | Amazon proxy emails can't be used; sync via orders data | DTC customer lifecycle email |
| WhatsApp API | Meta Cloud API | System User token (never-expires) | Verify X-Hub-Signature-256 on raw body; opt-in is legally required | Creator outreach, VIP programs |
| Figma Plugin SDK | Plugin API + postMessage | Figma plugin credentials | ALL fetch in ui.html; Array.from(bytes) before postMessage; no wildcard domains | Bulk image export, listing tools |
| Image Gen (cloud) | FAL.ai / Ideogram / GPT-Image-1 | Per-provider API key | Amazon main image must be real photo — AI prohibited in slot 1 | Secondary/lifestyle images |
| Email & CRM | SendGrid + Klaviyo + Gmail | Per-provider API keys | Amazon prevents direct customer email — proxy addresses only | DTC marketing, system alerts |
| Project Management | ClickUp (MCP) + Airtable (data) | API keys | Airtable has no official MCP yet; ClickUp 49 MCP tools | Task tracking + product database |

---

*Skills Bible synthesized from 22 source documents: amazon-advertising-api.md, amazon-brand-apis.md, amazon-brand-registry-advanced.md, amazon-keyword-research.md, amazon-sp-api.md, auth-security-patterns.md, claude-code.md, claude-connectors-cowork-code.md, clickup-amazon-business.md, database-best-practices.md, email-crm-apis.md, figma-plugin-sdk.md, image-generation-apis.md, local-llm-gpu.md, multi-marketplace-patterns.md, n8n-skill-research.md, project-management-apps-amazon-brands.md, rainforest-scrapers.md, supabase.md, vercel-nextjs.md, webhook-event-driven-patterns.md, whatsapp-api.md*
