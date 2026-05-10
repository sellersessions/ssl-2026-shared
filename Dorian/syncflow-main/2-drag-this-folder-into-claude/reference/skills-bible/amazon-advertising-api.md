# Amazon Advertising API — Expert Reference Guide

> This document is the definitive reference for working with the Amazon Advertising API (Amazon Ads API). It covers access requirements, credential setup, authentication flows, secure credential storage, all major API capabilities and endpoints, reporting, rate limits, and a full Dos & Don'ts section. Written from the perspective of an experienced practitioner.

---

## Table of Contents

1. [What Is the Amazon Advertising API?](#1-what-is-the-amazon-advertising-api)
2. [Who Can Access It & Access Tiers](#2-who-can-access-it--access-tiers)
3. [How to Obtain API Access (Step-by-Step)](#3-how-to-obtain-api-access-step-by-step)
4. [Authentication — OAuth 2.0 / Login With Amazon (LWA)](#4-authentication--oauth-20--login-with-amazon-lwa)
5. [Credential Security & Storage](#5-credential-security--storage)
6. [API Structure: Regions, Profiles & Base URLs](#6-api-structure-regions-profiles--base-urls)
7. [Core API Capabilities & Endpoints](#7-core-api-capabilities--endpoints)
8. [Reporting API (v3) — Deep Dive](#8-reporting-api-v3--deep-dive)
9. [Amazon Marketing Cloud (AMC)](#9-amazon-marketing-cloud-amc)
10. [Rate Limits & Throttling](#10-rate-limits--throttling)
11. [Error Handling](#11-error-handling)
12. [Dos & Don'ts — Practitioner Wisdom](#12-dos--donts--practitioner-wisdom)
13. [Key Watchouts & Common Pitfalls](#13-key-watchouts--common-pitfalls)
14. [Useful Libraries & Tools](#14-useful-libraries--tools)
15. [Official Documentation Links](#15-official-documentation-links)

---

## 1. What Is the Amazon Advertising API?

The **Amazon Ads API** (formerly Amazon Advertising API) is a programmatic interface that allows sellers, vendors, agencies, and tool builders to manage advertising operations and access performance data on Amazon's advertising platform. It is **not** the same as the Product Advertising API (PA API), which is for affiliates fetching product catalog data.

### What you can do with it:
- Create, read, update, and pause campaigns programmatically
- Manage keywords, bids, budgets, targeting, negative keywords
- Pull granular performance reports (impressions, clicks, spend, ROAS, ACOS)
- Automate bid optimization and dayparting
- Pull search query performance reports
- Manage Amazon Attribution (off-Amazon channel tracking)
- Access Amazon DSP programmatic buying
- Query Amazon Marketing Cloud (AMC) clean room data
- Manage Brand Stores (as of February 2026 GA)

### Supported Ad Types:
| Ad Type | Code Prefix | Description |
|---|---|---|
| Sponsored Products | `sp` | Keyword/product-targeted search ads |
| Sponsored Brands | `sb` | Brand-level headline/video search ads |
| Sponsored Display | `sd` | Audience/contextual display ads |
| Amazon DSP | `dsp` | Programmatic display, video, OTT |

---

## 2. Who Can Access It & Access Tiers

Amazon has **two main organization types** for API access:

### Individual Advertisers / Sellers
- Access the API to automate their **own** ad account
- Application accessed via **Seller Central** (sellers) or the **Amazon Advertising Console** (vendors/brands)
- Simpler approval process
- Credentials tied to your own advertising account

### Third-Party Developers / Agencies / Tool Builders
- Build tools or manage advertising **on behalf of others**
- Must go through a more thorough **application & review process**
- Can license the application to other advertisers
- Must adhere to Amazon's API usage policies and developer agreements

### Access to Amazon DSP & AMC
DSP and AMC access have **additional requirements**:
- Active Amazon DSP **Master Service Agreement (MSA)** required for AMC
- Must have live DSP campaigns or campaigns within the last 28 days
- AMC API additionally requires an **AWS account**
- A technical resource capable of writing SQL is needed for AMC

---

## 3. How to Obtain API Access (Step-by-Step)

### Step 1: Prerequisites
Before applying, ensure you have:
- An active Amazon Seller Central or Vendor Central account
- An active Amazon Ads account (with at least one campaign)
- An Amazon Developer account at [developer.amazon.com](https://developer.amazon.com)
- A clear use case description ready

### Step 2: Create a Login With Amazon (LWA) Application
1. Go to [developer.amazon.com](https://developer.amazon.com)
2. Navigate to **Login with Amazon**
3. Create a new security profile (this becomes your OAuth app)
4. Note your **Client ID** and **Client Secret** — these are your permanent app credentials
5. Set your **Allowed Return URLs** (the redirect URI used in the OAuth flow)

### Step 3: Apply for Amazon Ads API Access
1. Go to [advertising.amazon.com/API/docs/en-us/guides/onboarding/apply-for-access](https://advertising.amazon.com/API/docs/en-us/guides/onboarding/apply-for-access)
2. Fill out the application form — include:
   - Your use case (automation, reporting, agency tool, etc.)
   - Your LWA Client ID (from Step 2)
   - Whether you're building for yourself or third parties
3. Amazon reviews and approves the application (can take days to weeks for third-party)
4. Once approved, your LWA app is whitelisted for Amazon Ads API calls

### Step 4: Authorize Your Advertising Account
After approval, run the OAuth flow to get tokens:
1. Direct the user (or yourself) to the Amazon authorization URL
2. User logs in and grants permission to your LWA app
3. Amazon redirects to your callback URL with an **authorization code**
4. Exchange the authorization code for an **access token** and **refresh token**
5. Store refresh token securely — you'll use it to get new access tokens

### Step 5: Get Your Profile ID
Before making any campaign API calls, fetch your **advertising profiles**:
```
GET https://advertising.amazon.com/v2/profiles
```
Every API call must include a valid `Amazon-Advertising-API-ClientId` header and an `Amazon-Advertising-API-Scope` header (your profile ID). Profiles map to specific marketplaces and account types.

---

## 4. Authentication — OAuth 2.0 / Login With Amazon (LWA)

The Amazon Ads API uses **OAuth 2.0 Authorization Code Grant** via Login With Amazon (LWA). Here's the complete flow:

### Token Lifecycle
```
Authorization Code → (one-time use) → Access Token + Refresh Token
Access Token → (short-lived, ~60 min) → used in API calls
Refresh Token → (long-lived) → used to get new access tokens
```

### Step 1: Authorization Request
Redirect user to:
```
GET https://www.amazon.com/ap/oa
  ?client_id={YOUR_CLIENT_ID}
  &scope=advertising::campaign_management
  &response_type=code
  &redirect_uri={YOUR_REDIRECT_URI}
  &state={RANDOM_STATE_STRING}
```

### Step 2: Exchange Code for Tokens
```
POST https://api.amazon.com/auth/o2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={AUTHORIZATION_CODE}
&redirect_uri={YOUR_REDIRECT_URI}
&client_id={YOUR_CLIENT_ID}
&client_secret={YOUR_CLIENT_SECRET}
```
Response:
```json
{
  "access_token": "Atza|...",
  "refresh_token": "Atzr|...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Step 3: Refresh Access Token (Ongoing)
```
POST https://api.amazon.com/auth/o2/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token={STORED_REFRESH_TOKEN}
&client_id={YOUR_CLIENT_ID}
&client_secret={YOUR_CLIENT_SECRET}
```

### Step 4: Authenticate API Calls
Every API request requires these headers:
```
Authorization: Bearer {ACCESS_TOKEN}
Amazon-Advertising-API-ClientId: {YOUR_CLIENT_ID}
Amazon-Advertising-API-Scope: {PROFILE_ID}
Content-Type: application/json
```

### Scopes Available
| Scope | Purpose |
|---|---|
| `advertising::campaign_management` | Full campaign read/write |
| `advertising::audiences` | Audience management |
| `profile` | Basic profile data |

---

## 5. Credential Security & Storage

This section is critical. Mishandled credentials can expose your clients' advertising accounts or your own.

### The Golden Rules

**NEVER:**
- Store Client Secret, access tokens, or refresh tokens in plain text in code
- Hardcode credentials directly in source code
- Commit credentials to Git repos (even private ones)
- Log raw token values in application logs
- Share credentials over unencrypted channels (email, Slack)
- Store credentials in client-side code (JavaScript, mobile apps)

**ALWAYS:**
- Encrypt credentials at rest
- Transmit credentials over HTTPS only
- Limit access to credentials using the principle of least privilege
- Rotate credentials if there's any suspicion of compromise
- Store the Secret Key immediately after creation — Amazon will not show it again

### Recommended Storage Patterns

**Environment Variables (minimum viable)**
```bash
AMAZON_ADS_CLIENT_ID=amzn1.application-oa2-client.xxxx
AMAZON_ADS_CLIENT_SECRET=xxxx
AMAZON_ADS_REFRESH_TOKEN=Atzr|xxxx
```
Load at runtime, never hardcode. Suitable for personal tools.

**AWS Secrets Manager (recommended for production)**
- Store credentials as versioned secrets
- Rotate tokens automatically
- Fine-grained IAM access control per service/function
- Full audit trail via CloudTrail

**HashiCorp Vault / Similar KMS**
- Enterprise-grade key management
- Dynamic secrets and automated rotation
- Useful if not exclusively on AWS

**Environment-Specific Config Files (e.g., `.env`)**
- Use `.env.local` style files
- Add `.env` to `.gitignore` immediately
- Never commit `.env` files

### Token Management Best Practices
- Access tokens expire in **~60 minutes** — implement automatic refresh
- Refresh tokens can expire or be revoked — handle 401 errors gracefully
- Cache access tokens until 5 minutes before expiry, then proactively refresh
- If a refresh token is revoked, the user must re-authorize via OAuth
- Store each advertiser's refresh token separately (never share tokens across accounts)

---

## 6. API Structure: Regions, Profiles & Base URLs

### Regions
Amazon Ads API is organized into three geographic regions:

| Region | Code | Marketplaces Included |
|---|---|---|
| North America | NA | US, CA, MX, BR |
| Europe | EU | UK, DE, FR, IT, ES, NL, TR, SE, PL, BE, IN, SA, EG, AE |
| Far East | FE | JP, AU, SG |

**Base URLs per region:**
```
NA: https://advertising.amazon.com
EU: https://advertising.amazon.co.uk (or .de)
FE: https://advertising.amazon.co.jp
```

### Profiles
A **Profile** is the unit of account in the Ads API. Each profile maps to:
- A specific marketplace (e.g., amazon.com vs amazon.co.uk)
- An account type (seller, vendor, agency)

You must specify the `Amazon-Advertising-API-Scope` header (Profile ID) on every request. Retrieve all profiles your token has access to:
```
GET /v2/profiles
```

Example profile response:
```json
{
  "profileId": 1234567890,
  "countryCode": "US",
  "currencyCode": "USD",
  "timezone": "America/Los_Angeles",
  "accountInfo": {
    "type": "seller",
    "marketplaceStringId": "ATVPDKIKX0DER"
  }
}
```

> **Note:** Agency accounts will see profiles for all their managed advertisers. Filter by `type: seller` or `type: vendor` as needed — `type: agency` profiles cannot be used for campaign calls.

---

## 7. Core API Capabilities & Endpoints

### Campaign Management (Unified API — GA as of Dec 2025)
Amazon's unified Campaign Management API reduced ~200 endpoint variations to **16 standardized operations** across Sponsored Products, Sponsored Brands, and DSP.

**Core resource hierarchy:**
```
Portfolio
  └── Campaign
        └── Ad Group
              ├── Ads (Product Ads / Creatives)
              ├── Keywords / Targets
              └── Negative Keywords / Negative Targets
```

### Sponsored Products Endpoints

| Action | Method | Endpoint |
|---|---|---|
| List campaigns | GET | `/sp/campaigns` |
| Create campaign | POST | `/sp/campaigns` |
| Update campaign | PUT | `/sp/campaigns` |
| List ad groups | GET | `/sp/adGroups` |
| Create keywords | POST | `/sp/keywords` |
| List keywords | GET | `/sp/keywords` |
| Create negative keywords | POST | `/sp/negativeKeywords` |
| Create product ads | POST | `/sp/productAds` |
| Get bid recommendations | POST | `/sp/targets/bid/recommendations` |
| Keyword suggestions | POST | `/sp/suggested/keywords/{adGroupId}` |

### Sponsored Brands Endpoints
Similar structure to SP with extensions for:
- Video creatives
- Store Spotlight formats
- Brand logo / headline management
- Custom landing page URLs

### Sponsored Display Endpoints
- Audience targeting (remarketing, in-market, lifestyle)
- Contextual targeting (similar product, category)
- Views remarketing
- Off-Amazon audience expansion

### Amazon DSP Endpoints (Programmatic)
- Order management (insertion orders)
- Line item creation and management
- Creative management (display, video, OTT)
- Audience management
- Inventory deals management
- Brand suitability / content exclusion settings (open beta, Nov 2025)
- Forecasting API (GA Oct 2025): query projected spend, reach, CPC, CPA, ROAS

### Budget Management
- Campaign-level daily budgets
- Portfolio-level budget caps
- Budget rules (dayparting, event-based)

### Bid Optimization
- Manual keyword bids
- Automated bidding strategies (Down Only, Up & Down, Fixed)
- Bid recommendations API

### Targeting Types
- **Keyword Targeting**: Broad, Phrase, Exact match
- **Product Targeting**: Individual ASINs or categories
- **Audience Targeting**: Lifestyle, in-market, remarketing audiences
- **Contextual Targeting**: Similar products, expanded audiences
- **Auto Targeting** (SP only): Amazon-managed targeting

### Amazon Attribution API
Track off-Amazon channels (Google, Facebook, email, etc.) that drive Amazon conversions:
- Create attribution tags for non-Amazon ads
- Retrieve attribution reports (clicks, detail page views, add to carts, purchases)
- Available for sellers and vendors with an active Amazon account

### Search Query Performance (SQP) Reports
Available via the Ads API Reporting:
- Shows customer search terms that triggered your ads/organic listings
- Metrics: impressions, clicks, CTR, add to carts, purchases, purchase rate
- Filter at brand level or ASIN level
- Supported granularity: WEEK, MONTH, QUARTER only (no daily)
- Critical data for keyword research and negative keyword identification

### Brand Stores API (GA February 2026)
- Programmatically create and update Amazon Brand Store pages
- Manage store content at scale (useful for agencies with many brands)

---

## 8. Reporting API (v3) — Deep Dive

The Reporting API is **asynchronous**. You cannot get data in a single request. Always use a queue-based or polling architecture.

### The Three-Step Report Flow

```
Step 1: Request Report → Returns reportId
Step 2: Poll Status   → Wait for status = "SUCCESS"
Step 3: Download      → Use presigned S3 URL (valid 5 min only)
```

### Step 1: Request a Report
```
POST /reporting/reports
{
  "name": "SP Campaign Report",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "configuration": {
    "adProduct": "SPONSORED_PRODUCTS",
    "groupBy": ["campaign"],
    "columns": ["campaignName", "impressions", "clicks", "cost", "purchases1d"],
    "reportTypeId": "spCampaigns",
    "timeUnit": "SUMMARY",
    "format": "GZIP_JSON"
  }
}
```
Returns: `{ "reportId": "abc123" }`

### Step 2: Poll for Status
```
GET /reporting/reports/{reportId}
```
Possible statuses:
- `PENDING` — queued, not started
- `PROCESSING` — being generated
- `SUCCESS` — ready to download
- `FAILURE` — something went wrong, retry with a new request

**Best practice:** Use exponential backoff polling. Start at 30-second intervals, back off to every 2-5 minutes for large reports. Max generation time is ~15 minutes.

### Step 3: Download the Report
When status is `SUCCESS`, the response includes a `url` field:
```json
{
  "status": "SUCCESS",
  "url": "https://reporting.s3.amazonaws.com/...presigned...",
  "fileSize": 123456
}
```
**Critical:** The S3 presigned URL expires in **5 minutes**. Download immediately upon receiving it.

### Report Types Available

| Report Type ID | Ad Product | Description |
|---|---|---|
| `spCampaigns` | Sponsored Products | Campaign-level metrics |
| `spAdGroups` | Sponsored Products | Ad group-level metrics |
| `spKeywords` | Sponsored Products | Keyword performance |
| `spSearchTerm` | Sponsored Products | Search term report |
| `spProductAds` | Sponsored Products | Product ad-level performance |
| `spTargets` | Sponsored Products | Product/category targeting |
| `sbCampaigns` | Sponsored Brands | Campaign-level |
| `sbAdGroups` | Sponsored Brands | Ad group-level |
| `sbKeywords` | Sponsored Brands | Keyword-level |
| `sbSearchTerm` | Sponsored Brands | Search term data |
| `sdCampaigns` | Sponsored Display | Campaign-level |
| `sdAdGroups` | Sponsored Display | Ad group-level |
| `sdTargets` | Sponsored Display | Targeting performance |

### Key Metrics Available

**Traffic Metrics:** impressions, clicks, clickThroughRate (CTR)

**Cost Metrics:** cost (total spend), costPerClick (CPC), costPerMille (CPM)

**Conversion Metrics (by attribution window):**
- `purchases1d`, `purchases7d`, `purchases14d`, `purchases30d`
- `sales1d`, `sales7d`, `sales14d`, `sales30d`
- `unitsSoldClicks1d`, `unitsSoldClicks7d`, `unitsSoldClicks14d`, `unitsSoldClicks30d`
- `addToCart`, `addToCartClicks`
- `detailPageViews`

**Derived Metrics:** ACOS, ROAS (must calculate yourself or use Amazon's pre-calculated versions)

### Data Latency & Freshness Rules
- Standard metrics: available within **24 hours** of campaign activity
- Data can fluctuate significantly for **48-72 hours** from the current date
- **Never trust same-day or yesterday data for final reporting** — always use data at least 3 days old for stable numbers
- Invalid click adjustments are applied retroactively and can shift historical numbers slightly

### Time Units
- `SUMMARY` — entire date range aggregated
- `DAILY` — one row per day

---

## 9. Amazon Marketing Cloud (AMC)

AMC is Amazon's **privacy-safe data clean room** built on AWS Clean Rooms. It's the most powerful analytics layer in the Amazon Ads ecosystem.

### What AMC Can Do
- Join your first-party data with Amazon's ad signal data (impressions, clicks, conversions, etc.)
- Multi-touch attribution modeling (which channels/touchpoints actually drove purchases)
- Audience overlap analysis
- Path-to-purchase analysis
- Frequency and reach analysis across ad types
- Custom SQL-based queries on pseudonymized user-level data

### Access Requirements for AMC
- Executed Amazon DSP **Master Service Agreement (MSA)**
- Live DSP campaigns within the last 28 days
- AWS account (for AMC on AWS Clean Rooms)
- Technical resource who can write SQL

### AMC API Capabilities
- Programmatically submit SQL queries
- Schedule recurring reports
- Upload first-party signals (hashed email, customer IDs) for matching
- Retrieve query results
- Manage audiences built from AMC insights for activation in DSP

### Key Constraint
AMC only accepts **pseudonymized** data. You cannot upload raw PII. All data must be hashed (SHA-256 of email addresses, etc.). Amazon's privacy controls prevent signal-level export — you only see aggregate outputs.

---

## 10. Rate Limits & Throttling

Rate limits vary by endpoint and are enforced per **profile + application** combination.

### General Rate Limit Structure
- Limits are expressed as **requests per second (RPS)** or **requests per day (RPD)**
- Different endpoints have different limits
- Reporting endpoints are the most commonly throttled
- You can request higher rate limits from Amazon if you consistently hit defaults

### Typical Rate Limits (Approximate)

| Endpoint Category | Approximate Limit |
|---|---|
| Campaign management reads | 2-5 RPS |
| Campaign management writes | 1-2 RPS |
| Reporting — create report | 10 per minute |
| Reporting — check status | 10 per second |
| Profiles | 1-2 RPS |

### Handling Rate Limits (429 Errors)

**Exponential Backoff Pattern:**
```python
import time

def api_call_with_retry(fn, max_retries=5):
    for attempt in range(max_retries):
        response = fn()
        if response.status_code == 429:
            wait_time = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(wait_time)
            continue
        return response
    raise Exception("Max retries exceeded")
```

**Best practices to avoid throttling:**
- Never request reports synchronously in a tight loop
- Use a job queue (Redis, SQS, etc.) for report requests
- Stagger report requests across profiles — don't fire all at once
- Cache profile lists, campaign structures, and other static data aggressively
- Avoid re-fetching data that hasn't changed (use `lastUpdatedDate` filters)
- Request only the metrics you need — leaner reports are faster and count against limits less

---

## 11. Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|---|---|---|
| 200 | Success | Process response |
| 400 | Bad Request | Fix your request (bad params, invalid dates) — do not retry |
| 401 | Unauthorized | Refresh access token and retry once |
| 403 | Forbidden | Wrong profile scope, app not approved, or revoked access |
| 404 | Not Found | Resource doesn't exist or was deleted |
| 422 | Unprocessable Entity | Business logic error (e.g., invalid campaign state transition) |
| 429 | Too Many Requests | Throttled — back off and retry with exponential delay |
| 500 | Server Error | Amazon-side issue — retry with backoff |
| 503 | Service Unavailable | Amazon overloaded — retry with backoff |

### Critical Error Scenarios

**401 Unauthorized:** Your access token expired. Automatically refresh using the refresh token and retry the original request. If the refresh also fails, the refresh token may have been revoked — trigger re-authorization.

**403 Forbidden with "not approved":** Your LWA application isn't approved for the API or the specific scope. Check your application status in the developer portal.

**400 with "profile not found":** The profile ID in your header doesn't match the credentials. Verify the advertiser granted access to your app.

**Report status `FAILURE`:** Don't keep polling. Retry with a completely new report request. Investigate the error message in the status response.

---

## 12. Dos & Don'ts — Practitioner Wisdom

### ✅ DO

**Credentials & Access:**
- Register your LWA app with a clear, professional name — Amazon reviewers see it
- Request only the scopes you actually need
- Store one refresh token per advertiser account
- Implement automatic token refresh before expiry, not after a 401
- Use separate LWA credentials for dev/staging vs. production

**API Usage:**
- Always fetch profiles first before any campaign call — profile IDs change between environments
- Use the `Amazon-Advertising-API-Scope` header correctly — wrong profile = wrong account's data
- Implement idempotency in your write operations (check if a campaign/keyword exists before creating)
- Use `state=ENABLED/PAUSED` filters when listing campaigns to reduce response payload
- Paginate properly — use `startIndex` and `count` parameters or cursor-based pagination

**Reporting:**
- Build a queue-based async report pipeline — never do synchronous report polling in a request loop
- Download S3 URLs immediately (5-minute expiry)
- Cache downloaded reports locally — don't re-request the same date range unnecessarily
- Use `DAILY` time unit for trend analysis, `SUMMARY` for period totals
- Always request at least 3-day-old data for stable metrics
- Use `GZIP_JSON` format for large reports — significantly reduces S3 file sizes and download times

**Operations:**
- Log API request/response IDs (Amazon's `x-amzn-requestId` header) for debugging
- Set up monitoring/alerts for 429 and 5xx error rate spikes
- Test with small batches before bulk campaign creation

### ❌ DON'T

**Credentials:**
- Never hardcode credentials in source code
- Don't store credentials in client-side or browser-accessible code
- Don't share a single refresh token across multiple advertisers
- Don't expose the Client Secret in any frontend or public-facing code
- Don't use the same LWA app for testing and production

**API Usage:**
- Don't poll report status in tight loops — you'll hit rate limits fast
- Don't assume all profiles are seller-type — always check `accountInfo.type`
- Don't make bulk write calls without rate limiting your own code
- Don't skip pagination — assuming you got all results from one call is a silent data bug
- Don't rely on same-day or T-1 data for stable reporting — it fluctuates for 48-72 hours
- Don't call the API without handling 429 responses — unhandled throttling causes data gaps

**Business Logic:**
- Don't delete campaigns to "reset" them — Amazon retains campaign history and it affects account health
- Don't create duplicate campaigns or keywords without deduplication checks
- Don't run automated bid changes more frequently than once per 24 hours — Amazon's bid optimization needs time to react
- Don't make bid changes exceeding ±20% per update without monitoring — large bid swings can crash impressions

---

## 13. Key Watchouts & Common Pitfalls

### 1. Profiles vs. Accounts — The #1 Source of Confusion
Every advertiser has multiple profiles (one per marketplace). Always confirm you have the right profile ID. An agency account may have hundreds of profiles. Accidentally writing to the wrong profile = writing to the wrong client's account.

### 2. Agency vs. Seller Profile Types
Agency-type profiles cannot be used as the `Amazon-Advertising-API-Scope` for campaign calls. You must use seller or vendor profiles. Always filter by `accountInfo.type` when selecting profiles.

### 3. Data Latency Is Real
Don't build reporting automations that pull yesterday's data and treat it as final. Data adjustments (invalid click removal, attribution recalculation) happen continuously for 48-72 hours. For critical decisions, use data that is at least 3 days old.

### 4. Refresh Token Revocation
Amazon can revoke refresh tokens if:
- The advertiser revokes your app's access in their account settings
- There's unusual security activity
- The app violates Amazon's usage policies

Always handle 401 errors on the refresh endpoint gracefully, log them, and notify the advertiser that re-authorization is needed.

### 5. Report Request Failures Are Silent
A report that returns status `FAILURE` won't retry itself. Your system must detect this and requeue the report request. Without this logic, data gaps accumulate silently.

### 6. Presigned URL 5-Minute Expiry
The S3 URL returned when a report is `SUCCESS` expires in 5 minutes. If your pipeline polls status and then waits before downloading, you'll get a 403. Download immediately.

### 7. SQP Reports Have Limited Granularity
Search Query Performance reports only support WEEK, MONTH, and QUARTER granularity — not daily. Date ranges must align exactly with the start/end of those periods. Using arbitrary dates will cause API errors.

### 8. The Unified Campaign Management API Changed Everything (Dec 2025)
If you're using older documentation or tutorials, the endpoint structure changed significantly. The legacy ~200 endpoint variations have been consolidated to 16 operations. Old code targeting v1/v2 campaign management endpoints may need to be updated.

### 9. Currency & Bid Values
Bids and budgets are always in the account's local currency, in **micro-currency units** for some endpoints (check per-endpoint documentation). A bid of `$1.00 USD` may need to be passed as `100` (cents) or `1.00` depending on the endpoint version. Always verify units before setting bids programmatically.

### 10. API Approval Is Not Instant
Third-party developer access can take **days to weeks** to be approved. Plan timelines accordingly. Have a test account ready and understand that initial approval only grants access — you may need to request higher rate limits separately.

---

## 14. Useful Libraries & Tools

### Python
- **python-amazon-ad-api** ([GitHub](https://github.com/denisneuf/python-amazon-ad-api)) — community-maintained Python wrapper, good coverage of SP/SB/SD/DSP endpoints
- **requests** + **boto3** — for raw API calls + S3 report downloads

### Node.js / JavaScript
- Raw fetch/axios implementations are common — no dominant official SDK
- Consider the official Amazon Ads API Postman collection for exploration

### Data Pipeline / ETL
- **Airbyte** — has a maintained Amazon Ads connector (profiles, campaigns, reports)
- **Openbridge** — specializes in Amazon Ads reporting pipelines
- **n8n** — HTTP node can hit all Amazon Ads endpoints (see sellerapp-api-n8n skill for patterns)

### Official Tools
- **Amazon Ads API Postman Collection** — available in the Advanced Tools Center docs
- **Amazon Advertising Console** — always use this to sanity-check your API calls
- **Amazon Ads API Advanced Tools Center** — primary documentation portal

---

## 15. Official Documentation Links

| Resource | URL |
|---|---|
| Amazon Ads API Overview | https://advertising.amazon.com/about-api |
| Apply for API Access | https://advertising.amazon.com/API/docs/en-us/guides/onboarding/apply-for-access |
| Getting Started Guide | https://advertising.amazon.com/API/docs/en-us/guides/get-started/overview |
| Authorization Overview | https://advertising.amazon.com/API/docs/en-us/guides/account-management/authorization/overview |
| Access Tokens Guide | https://advertising.amazon.com/API/docs/en-us/guides/get-started/retrieve-access-token |
| Rate Limiting (Reports) | https://advertising.amazon.com/API/docs/en-us/reference/concepts/rate-limiting |
| Reporting v3 Overview | https://advertising.amazon.com/API/docs/en-us/guides/reporting/v3/overview |
| Reporting v3 Get Started | https://advertising.amazon.com/API/docs/en-us/guides/reporting/v3/get-started |
| Report Types Reference | https://advertising.amazon.com/API/docs/en-us/guides/reporting/v2/report-types |
| Sponsored Products Overview | https://advertising.amazon.com/API/docs/en-us/guides/sponsored-products/overview |
| Amazon Marketing Cloud | https://advertising.amazon.com/API/docs/en-us/guides/amazon-marketing-cloud/overview |
| Amazon Attribution API | https://advertising.amazon.com/API/docs/en-us/guides/amazon-attribution/overview |
| API Overview Reference | https://advertising.amazon.com/API/docs/en-us/reference/api-overview |
| Release Notes | https://advertising.amazon.com/API/docs/en-us/info/release-notes |
| LWA Authorization Code Grant | https://developer.amazon.com/docs/login-with-amazon/authorization-code-grant.html |
| Python Authorization Example | https://advertising.amazon.com/API/docs/en-us/guides/usage-examples/2025-03-step-by-step-guide-authorization-amazon-ads-api-requests-using-python |

---

*Last updated: May 2026 | Based on Amazon Advertising API as of 2025-2026 including the Unified Campaign Management API (GA Dec 2025) and Brand Stores API (GA Feb 2026)*
