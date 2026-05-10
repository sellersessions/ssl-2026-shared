# Amazon Selling Partner API (SP-API) — Expert Reference

> **Scope:** Everything a seller or developer needs to know about SP-API — from first-time registration through production-grade architecture. Treat this as a living reference: Amazon updates SP-API frequently, always cross-check with the [official docs](https://developer-docs.amazon.com/sp-api/docs/welcome).

---

## Table of Contents

1. [What Is SP-API?](#1-what-is-sp-api)
2. [Account Prerequisites](#2-account-prerequisites)
3. [Developer Registration — Step by Step](#3-developer-registration--step-by-step)
4. [Private vs. Public Applications](#4-private-vs-public-applications)
5. [Credentials: What They Are & How They Work](#5-credentials-what-they-are--how-they-work)
6. [Authentication Flow (LWA + OAuth 2.0)](#6-authentication-flow-lwa--oauth-20)
7. [Restricted Data Tokens (RDT) & PII](#7-restricted-data-tokens-rdt--pii)
8. [Grantless Operations](#8-grantless-operations)
9. [API Endpoints & Regions](#9-api-endpoints--regions)
10. [What Data Can You Get? (Full API Surface Map)](#10-what-data-can-you-get-full-api-surface-map)
11. [Reports API — The Data Workhorse](#11-reports-api--the-data-workhorse)
12. [Feeds API — Bulk Write Operations](#12-feeds-api--bulk-write-operations)
13. [Notifications API — Real-Time Push](#13-notifications-api--real-time-push)
14. [Rate Limits & Throttling](#14-rate-limits--throttling)
15. [Sandbox & Testing](#15-sandbox--testing)
16. [Credential Security — Storage & Rotation](#16-credential-security--storage--rotation)
17. [Dos & Don'ts](#17-dos--donts)
18. [Common Errors & How to Fix Them](#18-common-errors--how-to-fix-them)
19. [Architecture Patterns for Production](#19-architecture-patterns-for-production)
20. [Key Things to Watch (Ongoing)](#20-key-things-to-watch-ongoing)
21. [Useful Links](#21-useful-links)

---

## 1. What Is SP-API?

The **Selling Partner API (SP-API)** is Amazon's REST-based API that replaced the older MWS (Marketplace Web Service) API. It allows sellers, vendors, and third-party developers to programmatically access Amazon marketplace data and automate business operations.

**Core capabilities:**
- Access orders, shipments, inventory, pricing, payments, and catalog data
- Submit listings, feeds, and reports at scale
- Receive real-time push notifications
- Manage FBA and MFN logistics
- Access buyer messages, returns, and solicitations

**SP-API is not:**
- A marketing or advertising API (use the Amazon Ads API for that)
- A public product data API (use the Product Advertising API for that)
- The same as Vendor Central APIs (vendors have a separate path, though the auth pattern is the same)

---

## 2. Account Prerequisites

Before you write a single line of code, confirm you meet these requirements:

| Requirement | Sellers | Vendors |
|---|---|---|
| Account type | **Professional Selling Account** | Vendor Central account |
| Account status | Active, in good standing | Active |
| Primary account holder | Must register as developer | Must register as developer |
| Region | Must match the marketplace you'll query | Must match |

**Critical:** You cannot use a free/individual seller account for SP-API. You need a **Professional** plan (~$39.99/month in the US).

---

## 3. Developer Registration — Step by Step

### Step 1: Access Developer Central
1. Log into **Seller Central** (or Vendor Central)
2. Go to **Apps and Services → Develop Apps**
3. Click **Developer Central**
4. Click **Proceed to Developer Profile**

### Step 2: Complete the Developer Profile
You must fill this out truthfully and completely. Amazon reviews this information. Required fields:

- **Organization contact info** — legal name, address, email
- **Data access requirements** — which APIs and which data elements (be specific — vague answers slow approval or get rejected)
- **Use case description** — what your application will do with the data
- **Security controls** — how you store credentials, who has access, encryption methods

> ⚠️ **Amazon reads these.** Vague or generic answers will trigger a follow-up review or denial. Describe your actual use case clearly. If you're building for your own store: say so. If for clients: say so.

### Step 3: Wait for Approval
Amazon evaluates the profile. Response time varies — typically a few days to a couple of weeks. You may be asked for additional documentation, a security questionnaire, or a privacy policy URL.

### Step 4: Register Your Application
Once approved:
1. In Developer Central, click **Add New App Client**
2. Choose Private or Public (see Section 4)
3. Select the **API type** (Seller, Vendor, Hybrid)
4. Choose **IAM ARN** (for AWS-based apps) or a direct credential setup
5. Select the **roles/permissions** (data access scopes) your app needs
6. Save — Amazon generates your **LWA Client ID** and **Client Secret**

---

## 4. Private vs. Public Applications

### Private Applications
- Built exclusively for **your own organization's** Amazon accounts
- Authorization is self-authorized — no OAuth consent flow with external users
- Simpler setup; no Appstore listing required
- Best for: internal tools, your own seller account automation, agencies managing a fixed set of client accounts under one agreement

**Self-authorization path:**
In Seller Central → Apps and Services → Develop Apps → your app → **Authorize** → generates a **Refresh Token** tied to that seller account.

### Public Applications
- Available to **multiple third-party selling partners**
- Requires a full OAuth 2.0 consent flow (seller authorizes your app via browser redirect)
- Must be listed in the **Amazon Selling Partner Appstore**
- Amazon requires a publicly accessible website describing your services
- More rigorous review process
- Best for: ISVs, SaaS tools, agencies building a product for many clients

> **Rule of thumb:** If you're a seller automating your own account, go private. If you're building software that other sellers will use, go public.

---

## 5. Credentials: What They Are & How They Work

SP-API uses a layered credential system. You need to understand all pieces:

### 5.1 LWA (Login with Amazon) Credentials
Generated when you register your app in Developer Central.

| Credential | What it is | Where it lives |
|---|---|---|
| **LWA Client ID** | Identifies your app | Developer Central → View credentials |
| **LWA Client Secret** | Authenticates your app | Developer Central → View credentials |
| **Refresh Token** | Long-lived token tied to a specific seller's authorization | Generated during authorization |

The Client ID + Client Secret + Refresh Token together let you generate short-lived **Access Tokens**.

### 5.2 Access Token
- Short-lived: **expires in 1 hour (3600 seconds)**
- Generated by exchanging your Refresh Token + Client credentials with Amazon's LWA server
- Must be included in the `x-amz-access-token` header of every API call (except grantless operations and restricted operations requiring RDT)

### 5.3 Refresh Token
- Long-lived (does not expire by default)
- Represents the seller's authorization of your app
- Must be stored securely — it is the "master key" for that seller account
- If revoked (seller deauthorizes your app in Seller Central), it stops working immediately

### 5.4 AWS IAM Credentials (for request signing)
SP-API calls must be **signed using AWS Signature Version 4 (SigV4)**. This requires:
- **AWS Access Key ID**
- **AWS Secret Access Key**
- (Optionally) **AWS Session Token** (if using temporary IAM role credentials)

These are your IAM user or role credentials in AWS, NOT Amazon seller credentials. Separate thing entirely.

> **Best practice:** Use an **IAM Role** with least-privilege permissions rather than long-lived IAM user access keys. If running on EC2/Lambda, use instance profiles — no keys to manage.

---

## 6. Authentication Flow (LWA + OAuth 2.0)

Every SP-API call goes through this flow:

```
[Your App]
    │
    ├─1─► POST https://api.amazon.com/auth/o2/token
    │         grant_type=refresh_token
    │         client_id=<LWA_CLIENT_ID>
    │         client_secret=<LWA_CLIENT_SECRET>
    │         refresh_token=<REFRESH_TOKEN>
    │
    │◄─2─ { access_token, expires_in: 3600 }
    │
    ├─3─► Sign request with AWS SigV4 (using IAM credentials)
    │
    ├─4─► Call SP-API endpoint
    │         Header: x-amz-access-token: <ACCESS_TOKEN>
    │         Header: Authorization: AWS4-HMAC-SHA256 ...
    │
    │◄─5─ API Response
```

### Token Caching — Critical Performance Pattern
**Always cache your access token** and reuse it until ~5 minutes before expiry. Calling the LWA token endpoint for every API request is:
- Slow (adds ~200-500ms per call)
- Wasteful
- A rate limit risk on the token endpoint itself

```python
# Pseudocode pattern
if token_cache.is_expired_or_missing():
    token = fetch_new_lwa_token()
    token_cache.store(token, ttl=3300)  # 55 minutes
return token_cache.get()
```

### For Public Apps — OAuth Authorization Code Flow
When a new seller authorizes your app:
1. Redirect seller to Amazon's authorization URL with your `client_id` and `redirect_uri`
2. Seller logs in and approves permissions
3. Amazon redirects back with an `authorization_code`
4. Exchange `authorization_code` for a `refresh_token` (one-time exchange)
5. Store the `refresh_token` securely — it represents this seller's ongoing access

---

## 7. Restricted Data Tokens (RDT) & PII

Some SP-API operations return **Personally Identifiable Information (PII)** — buyer name, shipping address, phone number, email, etc. These require an extra security layer.

### What Requires an RDT
- `getOrder` (with PII fields)
- `getOrderAddress`
- `getOrderBuyerInfo`
- Certain report types (e.g., flat file orders reports with buyer data)
- `getOrderItems` (with buyer info)

### How RDT Works
1. Call `createRestrictedDataToken` (in the Tokens API) with the specific restricted resource and `dataElements` you need
2. You get back an RDT — valid for **1 hour**
3. Use the RDT in place of the standard LWA access token for the restricted operation
4. The RDT is scoped to exactly the resource you requested — you can't reuse it for other operations

```
POST /tokens/2021-03-01/restrictedDataToken
{
  "restrictedResources": [
    {
      "method": "GET",
      "path": "/orders/v0/orders/{orderId}/address",
      "dataElements": ["shippingAddress"]
    }
  ]
}
```

### ⚠️ Important (Breaking Change in 2024)
Amazon announced: **LWA access tokens can no longer retrieve PII in SP-API.** PII access strictly requires RDTs now. If your integration was relying on LWA tokens for PII fields, it has been broken. You must use the RDT flow.

### Handling PII Responsibly
- Don't log PII
- Don't store PII longer than necessary for order fulfillment
- Encrypt PII at rest (AES-256 minimum)
- Only request the `dataElements` you actually need
- Document your PII handling in your developer profile

---

## 8. Grantless Operations

Some operations don't require a seller's authorization (no refresh token needed). They use a **grantless token** instead.

**Grantless operations include:**
- `createDestination` (Notifications API)
- `deleteDestination`
- `getDestination`
- `getDestinations`
- `getAuthorizationCode`

**Token request for grantless:**
```
POST https://api.amazon.com/auth/o2/token
grant_type=client_credentials
client_id=<LWA_CLIENT_ID>
client_secret=<LWA_CLIENT_SECRET>
scope=sellingpartnerapi::notifications
```

Scope options: `sellingpartnerapi::notifications` or `sellingpartnerapi::migration`

---

## 9. API Endpoints & Regions

SP-API endpoints are region-specific. **Sending a request to the wrong region = 403 error.**

| Region | Endpoint | Marketplaces |
|---|---|---|
| North America | `https://sellingpartnerapi-na.amazon.com` | US, Canada, Mexico, Brazil |
| Europe | `https://sellingpartnerapi-eu.amazon.com` | UK, Germany, France, Italy, Spain, Netherlands, Poland, Sweden, Belgium, Turkey, Saudi Arabia, UAE, Egypt, India |
| Far East | `https://sellingpartnerapi-fe.amazon.com` | Japan, Australia, Singapore |

**Sandbox endpoints:**
- NA: `https://sandbox.sellingpartnerapi-na.amazon.com`
- EU: `https://sandbox.sellingpartnerapi-eu.amazon.com`
- FE: `https://sandbox.sellingpartnerapi-fe.amazon.com`

> **Marketplace IDs (required in most calls):**
> - US: `ATVPDKIKX0DER`
> - UK: `A1F83G8C2ARO7P`
> - Germany: `A1PA6795UKMFR9`
> - Canada: `A2EUQ1WTGCTBG2`
> - Japan: `A1VC38T7YXB528`
> - Australia: `A39IBJ37TRP1C6`
> Full list in the [SP-API docs](https://developer-docs.amazon.com/sp-api/docs/marketplace-ids)

---

## 10. What Data Can You Get? (Full API Surface Map)

### Orders & Fulfillment
- **Orders API** — list orders, get order details, buyer info (with RDT), order items, shipping address (with RDT)
- **Shipment Invoicing API** — get shipment invoice status, submit invoices (EU-specific)
- **Shipping API** — purchase shipping labels, track shipments, cancel shipments
- **Merchant Fulfillment API** — create MFN shipments, get eligible shipping services

### Inventory & FBA
- **FBA Inventory API** — real-time inventory levels, reserved quantities, unfulfillable inventory, AWD quantities
- **Fulfillment Inbound API** — create/manage FBA inbound shipments, shipment plans, labels, transport details
- **Fulfillment Outbound API** — MCF (Multi-Channel Fulfillment) order creation and tracking
- **Supply Sources API** — manage supply source locations

### Listings & Catalog
- **Listings Items API** — get, create, update, delete individual SKU listings; patch specific attributes
- **Catalog Items API** — search and retrieve Amazon catalog data (ASIN details, images, attributes)
- **Product Type Definitions API** — get JSON schema for product type attributes (critical for correct listing submission)
- **Listings Restrictions API** — check if a listing is restricted for a given seller

### Pricing & Fees
- **Product Pricing API** — competitive pricing, Buy Box prices, offers by ASIN/SKU
- **Product Fees API** — estimate FBA fees for a given price
- **Replenishment API** — subscribe-and-save data

### Reports
- **Reports API** — request, download, manage reports (full detail in Section 11)

### Feeds (Write Operations)
- **Feeds API** — bulk submit listings, pricing, inventory updates via JSON feeds (Section 12)

### Notifications (Real-Time Events)
- **Notifications API** — subscribe to events via SQS or EventBridge (Section 13)

### Financial
- **Finances API** — financial events, order-level charges, refunds, adjustments
- **Seller Wallet API** — balance, transactions, bank account info (where available)

### Sellers & Account
- **Sellers API** — get marketplace participations (which marketplaces a seller is active on)

### Messaging & Reviews
- **Messaging API** — send specific approved message types to buyers (e.g., "request a review")
- **Solicitations API** — request product reviews and seller feedback (one message per order)

### Vendor-Specific (Vendor Central accounts)
- **Vendor Orders API** — purchase orders from Amazon
- **Vendor Shipments API** — shipment confirmations
- **Vendor Direct Fulfillment** — dropship order management
- **Vendor Invoices API** — invoice submission

### Other
- **Tokens API** — create RDTs (Section 7)
- **Uploads API** — get upload destinations for feed documents
- **Vehicles API** — vehicle fitment data (auto parts category)
- **Services API** — home services appointments

---

## 11. Reports API — The Data Workhorse

Reports are the primary way to get bulk historical data. The flow is always async:

```
1. createReport     → returns reportId
2. getReport        → poll until processingStatus = "DONE"
3. getReportDocument → returns downloadUrl (pre-signed S3 URL)
4. Download the document (usually .gz compressed)
```

### Key Report Categories

**Orders:**
- `GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL` — all orders flat file
- `GET_XML_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL` — XML version
- `GET_FLAT_FILE_RETURNS_DATA_BY_RETURN_DATE` — returns

**Inventory:**
- `GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA` — current FBA inventory
- `GET_RESTOCK_INVENTORY_RECOMMENDATIONS_REPORT` — restock suggestions
- `GET_FBA_INVENTORY_AGED_DATA` — aged inventory (long-term storage fee exposure)
- `GET_STRANDED_INVENTORY_UI_DATA` — stranded inventory

**Listings:**
- `GET_MERCHANT_LISTINGS_ALL_DATA` — all active listings
- `GET_MERCHANT_LISTINGS_INACTIVE_DATA` — inactive listings

**Financial:**
- `GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE` — settlement reports
- `GET_DATE_RANGE_FINANCIAL_TRANSACTION_DATA` — transaction-level data

**Advertising/Performance:**
- `GET_BRAND_ANALYTICS_MARKET_BASKET_REPORT` — market basket analysis
- `GET_BRAND_ANALYTICS_SEARCH_TERMS_REPORT` — search term data (SQP equivalent via API)
- `GET_SALES_AND_TRAFFIC_REPORT` — business report data by ASIN/SKU

**PII-Restricted Reports** (require RDT):
- `GET_AMAZON_FULFILLED_SHIPMENTS_DATA_GENERAL` — includes buyer names/addresses
- `GET_FLAT_FILE_ORDERS_DATA_BY_ORDER_DATE_GENERAL` — orders with PII fields

### Report Polling Best Practice
Don't poll every 5 seconds. Use **exponential backoff**:
- Start at 30 seconds
- Double each retry
- Cap at 5 minutes
- Total wait for large reports can be 15–30 minutes

Better yet: use **Notifications API** — subscribe to `REPORT_PROCESSING_FINISHED` events to get push notification when your report is ready.

---

## 12. Feeds API — Bulk Write Operations

Feeds are how you push data to Amazon at scale. The flow is also async:

```
1. createFeedDocument  → returns feedDocumentId + uploadUrl
2. Upload your content to the uploadUrl (PUT to S3)
3. createFeed          → submit with feedDocumentId, returns feedId
4. getFeed             → poll until processingStatus = "DONE"
5. getFeedDocument     → get result document (processing report)
6. Download & parse result to see per-record success/errors
```

### ⚠️ BREAKING CHANGE: XML Feeds Deprecated (July 31, 2025)
Amazon dropped support for all legacy XML and flat file listing feeds. **If you're still using XML-based listing, pricing, or inventory feeds, they are now dead.** Migrate to:

- **`JSON_LISTINGS_FEED`** — bulk equivalent of Listings Items API, supports up to 25,000 messages per feed
- **`POST_FLAT_FILE_INVLOADER_DATA`** — still supported for inventory quantity updates (flat file)
- **`POST_PRODUCT_PRICING_DATA`** — still supported for pricing (flat file)

### Feed Types Still Actively Supported
- `JSON_LISTINGS_FEED` — listings (create, update, delete) — preferred bulk method
- `POST_FLAT_FILE_INVLOADER_DATA` — inventory quantity
- `POST_PRODUCT_PRICING_DATA` — pricing
- `POST_PRODUCT_IMAGE_DATA` — product images

### Feeds API Best Practices
- Always download and parse the processing report — a "DONE" status means Amazon processed it, not that everything succeeded. Individual records can fail.
- Don't submit the same feed multiple times simultaneously. Wait for the previous one to complete.
- Use `contentType` that matches exactly what you specified in `createFeedDocument` — a mismatch = 400 error.
- Compress large feeds with gzip (set `Content-Encoding: gzip`)

---

## 13. Notifications API — Real-Time Push

Instead of polling, subscribe to events and receive push notifications. This is the right approach for production systems.

### Setup (One-Time)
1. Create an SQS queue in your AWS account (standard queue — NOT FIFO)
2. Set SQS queue policy to allow SP-API principal `437568002678` to `SendMessage` and `GetQueueAttributes`
3. Call `createDestination` (grantless operation) with your SQS queue ARN → get `destinationId`
4. Call `createSubscription` (with seller's auth token) to subscribe to a notification type for that destination

### Key Notification Types

| Notification Type | What triggers it |
|---|---|
| `ANY_OFFER_CHANGED` | Price or availability changes on an ASIN you're watching |
| `ORDER_CHANGE` | New order, order status change |
| `ITEM_SALES_EVENT` | Sale occurred |
| `FBA_INVENTORY_AVAILABILITY_CHANGES` | FBA inventory level changes |
| `REPORT_PROCESSING_FINISHED` | Your report is ready to download |
| `FEED_PROCESSING_FINISHED` | Your feed finished processing |
| `BRANDED_ITEM_CONTENT_CHANGE` | Listing content was changed (useful for brand protection) |
| `LISTINGS_ITEM_STATUS_CHANGE` | Listing became active/inactive/suppressed |
| `LISTINGS_ITEM_ISSUES_CHANGE` | New listing issues/suppression reasons |
| `MFN_ORDER_STATUS_CHANGE` | MFN order status update |
| `PRICING_HEALTH` | Pricing health event (competitive pricing alerts) |

### SQS Design Considerations
- Standard SQS does **not** guarantee order — design your consumer to handle out-of-order messages
- Messages may be delivered more than once — make your processing **idempotent**
- Set a reasonable visibility timeout (at least 2x your processing time)
- Use a Dead Letter Queue (DLQ) to capture failed messages
- EventBridge is available as an alternative destination (useful for fan-out architectures)

---

## 14. Rate Limits & Throttling

SP-API uses a **token bucket algorithm** per operation per seller account. Each operation has its own rate and burst limits.

### How It Works
- Each operation has a **rate** (tokens added per second) and a **burst** (maximum tokens in the bucket)
- Each successful request consumes one token
- When the bucket is empty → `429 TooManyRequests`
- The `x-amzn-RateLimit-Limit` response header tells you the current limit for that operation

### Sample Rate Limits (Key Operations)

| Operation | Rate (req/sec) | Burst |
|---|---|---|
| `getOrders` | 0.0167 (~1/min) | 20 |
| `getOrder` | 0.5 | 30 |
| `getOrderItems` | 0.5 | 30 |
| `getInventorySummaries` | 2 | 2 |
| `putListingsItem` | 5 | 10 |
| `createReport` | 0.0167 | 15 |
| `getReport` | 2 | 15 |
| Sandbox (all) | 5 | 15 |

> Limits vary — always check the specific API's rate limit documentation page.

### Throttling Best Practices

**1. Cache aggressively.** Don't re-fetch data you already have. Cache order data, listing data, pricing data with appropriate TTLs.

**2. Use push notifications over polling.** `ORDER_CHANGE` notifications beat polling `getOrders` on a timer every time.

**3. Implement exponential backoff with jitter.** On 429:
```python
import random, time
def retry_with_backoff(fn, max_retries=5):
    for attempt in range(max_retries):
        try:
            return fn()
        except ThrottlingException:
            wait = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(wait)
    raise Exception("Max retries exceeded")
```

**4. Distribute requests over time.** Don't burst all requests at midnight. Spread them.

**5. Use batch APIs.** Where available, batch operations reduce call count significantly.

**6. Use the official SP-API SDK.** Amazon's SDKs have a built-in rate limiter.

**7. Monitor your 429 rate.** If you're getting consistent 429s, you need architectural changes, not just retry logic.

---

## 15. Sandbox & Testing

SP-API provides two sandbox environments — **test here before going live.**

### Static Sandbox
- All endpoints return **predefined mock responses** from the API's Swagger model
- No real data, no real actions
- Good for: unit testing, CI/CD pipelines, integration smoke tests
- Use the sandbox endpoint prefix: `sandbox.sellingpartnerapi-na.amazon.com`

### Dynamic Sandbox
- Calls are proxied to a real sandbox backend
- Returns **realistic responses based on your request parameters**
- Some APIs have special dynamic sandbox setups (e.g., Fulfillment Outbound)
- Good for: end-to-end testing, validating business logic

### Using Sandbox
- Use the same credentials as production (LWA client ID/secret, IAM credentials)
- Direct calls to sandbox endpoints instead of production endpoints
- Rate limit on sandbox: **5 req/sec, burst 15** (for all operations)

### Sandbox-Only Operations
Some operations are sandbox-only (`"x-amzn-api-sandbox-only": true` in the Swagger model). These only work in sandbox and are useful for triggering specific test scenarios.

### Testing Checklist Before Going Live
- [ ] Auth flow works (LWA token exchange)
- [ ] All required roles/scopes are granted
- [ ] Marketplace ID is correct for your region
- [ ] Request signing (SigV4) is working
- [ ] Rate limit handling and retry logic works
- [ ] Error responses are properly handled (400, 403, 404, 429, 500)
- [ ] PII operations use RDT (not LWA tokens)
- [ ] Token caching works correctly

---

## 16. Credential Security — Storage & Rotation

This is where most developers cut corners. Don't.

### What You're Protecting
| Credential | Impact if leaked |
|---|---|
| LWA Client Secret | Attacker can impersonate your app, steal seller tokens |
| Refresh Token | Full access to that seller's Amazon account |
| AWS Secret Access Key | Full SP-API access + any other AWS resources your IAM user/role has |

### Secure Storage Options

**AWS Secrets Manager (Recommended)**
- Purpose-built for this use case
- Encryption at rest (AES-256) and in transit
- Fine-grained IAM access control
- Automatic rotation support
- Audit trail via CloudTrail
- ~$0.40/secret/month

**AWS Systems Manager Parameter Store (SecureString)**
- Good for non-rotating secrets or configs
- Free tier available
- Slightly less featured than Secrets Manager

**HashiCorp Vault**
- Good if you're not AWS-native
- Supports dynamic secrets and rotation

**DO NOT:**
- Hardcode credentials in source code
- Store in `.env` files committed to git
- Store in S3 buckets without encryption
- Log credentials (even in "debug mode")
- Store in browser localStorage or cookies
- Share credentials via Slack, email, or Notion

### IAM Best Practices
- Create a **dedicated IAM user or role** for SP-API with only the permissions it needs (least privilege)
- If running on EC2/ECS/Lambda: **use IAM roles, not access keys** — no keys to manage or rotate
- Enable **MFA** on your AWS root account
- Rotate IAM access keys at least annually; automate if possible

### Refresh Token Security
- Treat each seller's refresh token like a password to their Amazon account
- Store per-seller with encryption (one secret per seller in Secrets Manager, keyed by seller ID)
- Have a revocation plan: if compromised, seller can deauthorize your app in Seller Central
- Log access to refresh tokens via CloudTrail / audit logs

### Encryption Requirements
- Credentials at rest: minimum AES-128, recommended AES-256
- In transit: TLS 1.2 minimum, TLS 1.3 preferred
- Never transmit credentials over HTTP

---

## 17. Dos & Don'ts

### ✅ DO

- **DO** register as a private developer if you're only automating your own account — it's simpler and faster
- **DO** cache LWA access tokens and reuse them for their 3600-second lifetime
- **DO** use Notifications (SQS) instead of polling for real-time data
- **DO** use exponential backoff with jitter for 429 errors
- **DO** use the sandbox environment before touching production
- **DO** use IAM roles instead of IAM user access keys where possible
- **DO** store all credentials in AWS Secrets Manager or equivalent
- **DO** use RDTs for any operation that returns PII
- **DO** download and parse the processing report after every feed — don't assume "DONE" means success
- **DO** test every marketplace separately — behavior can differ by marketplace
- **DO** subscribe to SP-API release notes and changelog
- **DO** handle idempotency — SQS delivers messages at least once, not exactly once
- **DO** use the Product Type Definitions API before submitting new listings — it gives you the correct JSON schema
- **DO** set a Dead Letter Queue on your SQS notification queue

### ❌ DON'T

- **DON'T** hardcode credentials anywhere — not in code, not in config files, not in notebooks
- **DON'T** commit `.env` files with secrets to git (use `.gitignore` + secret scanning)
- **DON'T** poll aggressively — aggressive polling wastes your rate limit budget and triggers 429s
- **DON'T** assume XML feeds still work — Amazon deprecated them July 31, 2025
- **DON'T** use the same access token indefinitely — they expire after 1 hour
- **DON'T** ignore the processing report on feeds — individual record failures will silently not apply
- **DON'T** mix up regions — a seller in EU can't be queried via the NA endpoint
- **DON'T** request more data scopes than you need — Amazon may deny your developer profile
- **DON'T** log PII — buyer names, addresses, phone numbers, emails
- **DON'T** build on MWS — it's deprecated and being retired
- **DON'T** share refresh tokens across environments (dev/staging/prod should have separate tokens)
- **DON'T** assume delivery order in SQS — design for out-of-order messages
- **DON'T** use FIFO SQS queues for SP-API notifications — they're not supported
- **DON'T** submit the same feed multiple times without checking the previous one completed

---

## 18. Common Errors & How to Fix Them

| Error | Code | Likely Cause | Fix |
|---|---|---|---|
| `Unauthorized` | 401 | Expired or invalid access token | Refresh your LWA token |
| `Access denied` | 403 | Wrong region, wrong marketplace ID, missing scope | Check endpoint region matches seller region; verify app has correct roles |
| `InvalidInput` | 400 | Malformed request, wrong content type, GET request with body | Remove body from GET requests; check content type matches feed document |
| `QuotaExceeded` / `TooManyRequests` | 429 | Rate limit hit | Implement exponential backoff with jitter; reduce call frequency |
| `NotFound` | 404 | ASIN/order/report doesn't exist or wrong marketplace | Verify the resource exists in that marketplace |
| `InternalServerError` | 500 | Amazon-side error | Retry with backoff; if persistent, check AWS status page |
| `InvalidGrant` on LWA | 400 | Refresh token revoked or invalid | Seller re-authorization required |
| `Redirect URI mismatch` | OAuth error | redirect_uri in auth flow doesn't match registered URI | Update redirect URI in Developer Central to match exactly |
| RDT required | 403 | Trying to access PII with standard LWA token | Create and use an RDT via the Tokens API |
| Feed stuck in `IN_PROGRESS` | — | Large feed or Amazon backend delay | Wait longer; don't resubmit; check Notifications for FEED_PROCESSING_FINISHED |
| `contentType mismatch` | 400 | Feed content type in upload doesn't match createFeedDocument | Ensure content types match exactly |
| Special characters in SKU | 400 | SKU contains `/` or `\` unencoded | URL-encode special characters in SKU path parameters |

---

## 19. Architecture Patterns for Production

### Pattern 1: Simple Single-Seller Automation (Private App)
```
[Scheduler / Cron]
        │
        ▼
[Worker Lambda / EC2]
  - Fetches LWA token (cached in ElastiCache or Secrets Manager)
  - Calls SP-API
  - Writes results to RDS / DynamoDB
```

### Pattern 2: Event-Driven with Notifications
```
[SP-API] ──push──► [SQS Queue]
                        │
                   [Lambda Consumer]
                        │
              ┌────────┴────────┐
              ▼                 ▼
     [Process Order]    [Update DB]
              │
              ▼
     [Call getOrder API only when needed]
```
This pattern dramatically reduces SP-API calls because you only fetch details when you know something changed.

### Pattern 3: Multi-Seller SaaS
```
[Seller Authorizes via OAuth]
        │
        ▼
[Your Backend] → Store refresh_token encrypted in Secrets Manager (keyed by sellerId)
        │
        ▼
[Queue per seller or shared queue with seller context]
        │
        ▼
[Worker Pool] → fetches seller-specific token → calls SP-API → processes result
```

### Key Infrastructure Recommendations
- **Lambda** for event-driven SP-API calls (scales to zero, no idle cost)
- **SQS** for notification processing + decoupling
- **ElastiCache (Redis)** or **DynamoDB** for LWA token caching
- **Secrets Manager** for all credentials
- **CloudWatch** for monitoring throttle rates, error rates, latency
- **DLQ** on all SQS queues for error capture

---

## 20. Key Things to Watch (Ongoing)

### API Changes & Deprecations
- Subscribe to the [SP-API Release Notes](https://developer-docs.amazon.com/sp-api/docs/sp-api-release-notes) — Amazon deprecates things with sometimes short notice
- **XML feeds are dead (July 31, 2025)** — if you haven't migrated to JSON_LISTINGS_FEED, do it now
- LWA tokens can no longer return PII — RDT is mandatory for PII access

### Policy & Compliance
- Your developer profile must stay up to date — misrepresenting your use case risks suspension
- Data usage must comply with Amazon's [acceptable use policy](https://developer-docs.amazon.com/sp-api/docs/acceptable-use-policy-for-selling-partner-api-data)
- PII handling must follow Amazon's data protection requirements and applicable laws (GDPR, CCPA, etc.)
- Annual security reviews may be required for public apps

### Application Review
- Amazon can review your application at any time — keep your security controls current
- If your app is suspended: check for email from Amazon Selling Partner Developer Support; respond quickly

### Rate Limit Budget
- If your usage grows, you may hit per-operation rate limits before you expect to
- Build monitoring for `x-amzn-RateLimit-Limit` header values and your 429 error rate
- Contact Amazon Developer Support if you need rate limit increases for high-volume use cases

### Token Expiry & Refresh
- LWA access tokens expire every hour — monitor for auth failures and ensure your token refresh logic is bulletproof
- Refresh tokens don't expire by default, but they can be revoked — have alerting for `InvalidGrant` errors

---

## 21. Useful Links

- [SP-API Home](https://developer-docs.amazon.com/sp-api/docs/welcome)
- [SP-API Registration Overview](https://developer-docs.amazon.com/sp-api/docs/sp-api-registration-overview)
- [Register as Private Developer](https://developer-docs.amazon.com/sp-api/docs/register-as-a-private-developer)
- [Register as Public Developer](https://developer-docs.amazon.com/sp-api/docs/register-as-a-public-developer)
- [Connecting to SP-API](https://developer-docs.amazon.com/sp-api/docs/connecting-to-the-selling-partner-api)
- [Authorizing Applications](https://developer-docs.amazon.com/sp-api/docs/authorizing-selling-partner-api-applications)
- [Restricted Data Token Guide](https://developer-docs.amazon.com/sp-api/docs/authorization-with-the-restricted-data-token)
- [SP-API Endpoints](https://developer-docs.amazon.com/sp-api/docs/sp-api-endpoints)
- [Usage Plans & Rate Limits](https://developer-docs.amazon.com/sp-api/docs/usage-plans-and-rate-limits)
- [SP-API Sandbox](https://developer-docs.amazon.com/sp-api/docs/sp-api-sandbox)
- [Safeguarding Credentials](https://developer-docs.amazon.com/sp-api/docs/safeguarding-sensitive-credentials)
- [Feeds API](https://developer-docs.amazon.com/sp-api/docs/feeds-api)
- [Reports API](https://developer-docs.amazon.com/sp-api/docs/reports-api)
- [Notifications API](https://developer-docs.amazon.com/sp-api/docs/notifications-api)
- [SP-API Release Notes](https://developer-docs.amazon.com/sp-api/docs/sp-api-release-notes)
- [SP-API Error FAQ](https://developer-docs.amazon.com/sp-api/docs/errors-faq)
- [Seller Use Cases Guide](https://developer-docs.amazon.com/sp-api/docs/sp-api-seller-use-cases)
- [AWS Prescriptive Guidance — Integrating SP-API](https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-gen-ai-selling-partner-api/integrating-sp-api.html)

---

*Last researched: May 2026. Always verify against official Amazon documentation before implementing — SP-API evolves rapidly.*
