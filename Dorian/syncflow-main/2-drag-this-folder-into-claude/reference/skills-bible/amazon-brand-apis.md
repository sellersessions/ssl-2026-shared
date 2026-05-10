# Amazon Brand APIs: The Complete Stack

> A department-by-department map of every API an Amazon brand might use — native Amazon, third-party tools, and infrastructure services. Includes free and paid tiers where available.

---

## Table of Contents

1. [Amazon Native APIs](#1-amazon-native-apis)
2. [Product Research & Market Intelligence](#2-product-research--market-intelligence)
3. [Listing Optimization & Content Creation](#3-listing-optimization--content-creation)
4. [AI Image & Visual Content](#4-ai-image--visual-content)
5. [Advertising & Paid Media](#5-advertising--paid-media)
6. [Email, SMS & CRM Marketing](#6-email-sms--crm-marketing)
7. [Inventory & Supply Chain Management](#7-inventory--supply-chain-management)
8. [Shipping & Logistics](#8-shipping--logistics)
9. [Finance & Accounting](#9-finance--accounting)
10. [Tax & Sales Tax Compliance](#10-tax--sales-tax-compliance)
11. [Repricing & Pricing Intelligence](#11-repricing--pricing-intelligence)
12. [Customer Service & Helpdesk](#12-customer-service--helpdesk)
13. [Review & Feedback Management](#13-review--feedback-management)
14. [Brand Protection & IP Monitoring](#14-brand-protection--ip-monitoring)
15. [Analytics & Business Intelligence](#15-analytics--business-intelligence)
16. [Automation & Workflow Orchestration](#16-automation--workflow-orchestration)
17. [AI & Large Language Models](#17-ai--large-language-models)
18. [HR, Payroll & Contractor Management](#18-hr-payroll--contractor-management)
19. [Communication & Collaboration](#19-communication--collaboration)
20. [Developer Infrastructure](#20-developer-infrastructure)

---

## 1. Amazon Native APIs

These are Amazon's own programmatic interfaces — free to use (within rate limits), though SP-API now has paid tiers for high-volume third-party developers.

### Selling Partner API (SP-API)
Amazon's core seller API, replacing the legacy MWS system. Covers virtually every operational aspect of an Amazon business.

| Module | What It Does |
|---|---|
| **Orders API** | Pull order data, confirm shipments, update tracking |
| **Listings API** | Create, update, delete product listings at scale |
| **Catalog Items API** | Search and retrieve Amazon catalog product info |
| **Inventory API** | Real-time FBA inventory levels across warehouses |
| **Reports API** | Download sales, inventory, settlement, and performance reports |
| **Finances API** | Access transaction-level financial data and settlements |
| **Fulfillment Outbound API** | Create and track MCF (Multi-Channel Fulfillment) orders |
| **Notifications API** | Subscribe to push events (new orders, listing changes, pricing) |
| **Product Pricing API** | Get competitive pricing, Buy Box status, and offer data |
| **Merchant Fulfillment API** | Buy and print shipping labels via Amazon's carrier accounts |
| **Vendor Orders API** | Purchase order management for vendors/1P sellers |
| **Vendor Shipments API** | ASN (Advanced Ship Notices) for vendor shipments |
| **Brand Analytics API** | Search term reports, market basket, repeat purchase data |
| **A+ Content API** | Programmatically create and manage A+ content |
| **Feeds API** | Bulk upload listings, prices, and inventory via flat files |
| **Tokens API** | Request Restricted Data Tokens for PII access |

- **Cost:** Free for sellers using their own account. Third-party app developers now pay ~$1,400/year subscription (as of Jan 2026) + monthly GET call fees (as of Apr 2026).
- **Docs:** https://developer-docs.amazon.com/sp-api/

---

### Amazon Advertising API
Programmatic management of all Amazon ad types under a unified v1 API.

| Ad Type | Coverage |
|---|---|
| Sponsored Products | Campaign, ad group, keyword, bid management |
| Sponsored Brands | Video, headline, store spotlight |
| Sponsored Display | Audience and product targeting |
| Amazon DSP | Programmatic display, video, OTT |
| Sponsored TV | Streaming TV ads |

- **New in 2026:** DSP Inventory Management Unified APIs (open beta March 2026); cross-account reach & frequency reporting (April 2026); Amazon Ads MCP Server (open beta).
- **Cost:** Free to access; you pay for ad spend.
- **Docs:** https://advertising.amazon.com/API/docs/

---

### Amazon Vendor Central API
For 1P (first-party) vendors selling wholesale to Amazon.

- Purchase Order Management
- Inventory health reporting
- Direct fulfillment integration
- Retail analytics

---

### Amazon Brand Registry Tools (API-accessible)
- **Report a Violation (RAV):** Submit IP complaints programmatically
- **Project Zero:** Self-service counterfeit removal
- **Transparency API:** Serial code generation and verification for counterfeit prevention
- **Brand Catalog Lock:** Lock listing fields against unauthorized edits

---

## 2. Product Research & Market Intelligence

### Helium 10
Full-suite Amazon seller software with API access.

| Tool | Function |
|---|---|
| Black Box | Product discovery / opportunity finder |
| Cerebro | Reverse ASIN keyword research |
| Magnet | Keyword research by seed term |
| Xray | Market analysis and competitor data |
| Trendster | Sales trend analysis |

- **Free tier:** Limited (20 product research uses, 2 keyword lookups/day)
- **Paid:** From $97/month (Platinum) → Diamond → Enterprise
- **API:** Available for higher tiers
- **Docs:** https://www.helium10.com/

---

### Jungle Scout
Market intelligence, product tracking, and keyword data for Amazon.

| Tool | Function |
|---|---|
| Product Database | Searchable Amazon product catalog |
| Keyword Scout | Search volume and keyword difficulty |
| Rank Tracker | SERP position monitoring |
| Sales Analytics | Revenue and BSR tracking |
| Supplier Database | Factory/manufacturer discovery |

- **Paid:** From $29/month (Starter annual) → Growth → Brand Owner ($119/month)
- **API:** Available on higher plans
- **Docs:** https://www.junglescout.com/features/jungle-scout-api/

---

### SellerApp
Amazon intelligence platform with deep API integration (used in this workflow).

| Module | Function |
|---|---|
| Product Research | Opportunity scoring |
| Keyword Research | Volume, CPC, trend data |
| Product Tracking | BSR and price history |
| Review Analysis | Sentiment and rating trends |
| LQI Score | Listing quality scoring |
| Advertising Analytics | PPC performance tracking |

- **Free tier:** Limited
- **Paid:** From $39/month
- **API:** REST API with full endpoint coverage
- **Docs:** https://www.sellerapp.com/api/

---

### Keepa
Amazon price and BSR history — the gold standard for historical data.

- Price history charts for any ASIN
- Sales rank tracking over time
- New/used/FBA seller tracking
- Deal alerts

- **Free tier:** Very limited (limited API tokens)
- **Paid:** ~€19/month for API access (1,000 tokens/day)
- **Docs:** https://keepa.com/#!api

---

### DataDive
Deep data analytics for Amazon keyword and listing optimization.

- Keyword universe building
- Competitor ASIN analysis
- Search volume trends
- BSR-to-sales velocity modeling

- **Paid:** From $97/month
- **API:** Available for enterprise accounts

---

### Google Trends API (via SerpAPI / Pytrends)
Track consumer interest trends outside Amazon.

- Unofficial Python library (pytrends) — free
- SerpAPI provides a paid, stable Google Trends endpoint
- **SerpAPI Paid:** From $50/month (5,000 searches)
- **Docs:** https://serpapi.com/google-trends-api

---

### SimilarWeb API
Web traffic and consumer behavior intelligence.

- Traffic estimates for competitor D2C sites
- Audience demographics
- Referral channel analysis

- **Paid:** Custom enterprise pricing
- **Docs:** https://developers.similarweb.com/

---

## 3. Listing Optimization & Content Creation

### OpenAI API
Used for listing copy, A+ content drafts, keyword integration, and bulk content generation.

- GPT-4o: Best for quality copy
- GPT-4o mini: Cost-effective for bulk tasks

- **Free tier:** None (trial credits for new accounts)
- **Paid:** ~$2.50/1M input tokens (GPT-4o); ~$0.15/1M (GPT-4o mini)
- **Docs:** https://platform.openai.com/docs/

---

### Anthropic Claude API
Claude models for nuanced listing copy, product descriptions, and structured data extraction.

- **Models:** Claude Opus 4.6, Sonnet 4.6, Haiku 4.5
- **Paid:** ~$3/1M input tokens (Sonnet); $0.25/1M (Haiku)
- **Docs:** https://docs.anthropic.com/

---

### DataDive / Listing Builder Tools
Keyword-dense listing construction tools (see Product Research section above).

---

### Wordsmith / Phrasee (AI Copy APIs)
Automated copy generation and A/B testing for product descriptions.

- **Paid:** Custom enterprise pricing

---

## 4. AI Image & Visual Content

### Claid.ai
API-first AI image enhancement and background replacement, built for ecommerce scale.

- Background removal and replacement
- Image upscaling and enhancement
- Batch processing via API
- Shopify integration
- Generates marketplace-compliant images

- **Free tier:** Trial credits
- **Paid:** ~$0.10–$2.00/image depending on volume
- **Docs:** https://claid.ai/api/

---

### Photoroom API
Marketplace-focused AI editor — background removal, lifestyle scene generation, templated outputs.

- Batch API for high-volume SKU processing
- Template system for consistent brand look
- Product placement in lifestyle scenes

- **Free tier:** Limited
- **Paid:** From $19/month; API volume pricing available
- **Docs:** https://www.photoroom.com/api

---

### Flair.ai
Creative control AI product photography — drag-and-drop product staging.

- Lifestyle scene generation
- 3D asset placement
- Brand prop and background library

- **Free tier:** 10 generations/month
- **Paid:** From $21/month
- **Docs:** https://flair.ai/

---

### Adobe Firefly API
Enterprise-grade generative AI for product imagery, with commercial-use licensing.

- Text-to-image
- Generative fill / background
- Trained on licensed content (safe for commercial use)

- **Paid:** Included in Adobe Creative Cloud or via API credits
- **Docs:** https://developer.adobe.com/firefly-services/

---

### OpenAI DALL-E / GPT-4o Vision
Image generation and vision analysis via API.

- Product image generation
- Competitor image analysis
- Alt-text and image description generation

- **Paid:** ~$0.04/image (1024×1024)
- **Docs:** https://platform.openai.com/docs/guides/images

---

### Stability AI API
Open-weight image generation — cost-effective for high-volume visual work.

- Stable Diffusion via API
- Image-to-image transformation
- Inpainting / outpainting

- **Free tier:** Limited credits
- **Paid:** From ~$20/month credit packs
- **Docs:** https://platform.stability.ai/

---

## 5. Advertising & Paid Media

### Amazon Advertising API
(See Section 1 — Native APIs)

---

### Google Ads API
Manage Google Shopping, Search, Display, and Performance Max campaigns.

- Drive external traffic to Amazon listings
- Brand keyword defense
- Competitor conquest campaigns

- **Free:** API access is free (pay for ad spend)
- **Docs:** https://developers.google.com/google-ads/api/

---

### Meta Marketing API (Facebook/Instagram)
Programmatic Facebook and Instagram ad management.

- Product catalog integration
- Audience targeting for Amazon brand awareness
- Retargeting off-Amazon visitors

- **Free:** API access is free (pay for ad spend)
- **Docs:** https://developers.facebook.com/docs/marketing-apis/

---

### TikTok Marketing API
TikTok for Business programmatic ad management.

- TikTok Shop integration
- Spark Ads (boosting organic content)
- Affiliate creator management

- **Free:** API access is free (pay for ad spend)
- **Docs:** https://business-api.tiktok.com/

---

### Pinterest API for Shopping
Product catalog management and promoted pins.

- **Free:** API access free (pay for promoted pins)
- **Docs:** https://developers.pinterest.com/docs/shopping/

---

### Triple Whale
Amazon and DTC advertising analytics — attribution and unified dashboards.

- Cross-channel attribution
- Amazon + Shopify + Meta unified view
- Creative reporting

- **Paid:** From $129/month
- **API:** Available for enterprise

---

### Perpetua / Quartile / Intentwise
AI-powered Amazon PPC management platforms with API access.

| Platform | Specialty |
|---|---|
| Perpetua | Sponsored Products + DSP optimization |
| Quartile | AI bidding across all ad types |
| Intentwise | Data warehouse + ad analytics |

- **Paid:** Typically % of ad spend or flat monthly fee

---

## 6. Email, SMS & CRM Marketing

### Klaviyo API
The de facto standard for ecommerce email and SMS — B2C CRM platform.

- Email flows (welcome, post-purchase, winback)
- SMS and RCS messaging
- WhatsApp and mobile push (2026)
- Customer segmentation and lifecycle automation
- Amazon order data integration

- **Free tier:** Up to 250 contacts / 500 emails/month
- **Paid:** Scales with contact list size; ~$45/month for 1,000 contacts
- **Docs:** https://developers.klaviyo.com/

---

### Mailchimp API
Broader email marketing platform — good for content-driven campaigns.

- **Free tier:** Up to 500 contacts / 1,000 emails/month
- **Paid:** From $13/month
- **Docs:** https://mailchimp.com/developer/

---

### HubSpot API
Full CRM + marketing automation platform — better for B2B or DTC brands with complex sales cycles.

- Contact and deal management
- Email sequences and workflows
- Marketing attribution

- **Free tier:** CRM is free
- **Paid:** From $15/month (Starter) → Professional ($800/month)
- **Docs:** https://developers.hubspot.com/

---

### Attentive API
SMS-first ecommerce marketing platform.

- SMS/MMS automated flows
- Subscriber list management
- Two-way conversational SMS

- **Paid:** Custom pricing (% of revenue driven)
- **Docs:** https://docs.attentive.com/

---

### Postscript API
Amazon brand SMS marketing, focused on Shopify/DTC.

- **Paid:** From $100/month
- **Docs:** https://developers.postscript.io/

---

### SendGrid API (Twilio)
Transactional email infrastructure — order confirmations, shipping updates, review requests.

- **Free tier:** 100 emails/day free
- **Paid:** From $19.95/month (50,000 emails)
- **Docs:** https://docs.sendgrid.com/api-reference/

---

## 7. Inventory & Supply Chain Management

### Cin7 (formerly DEAR Inventory)
Multi-channel inventory and order management.

- Real-time inventory sync across Amazon + DTC
- Purchase orders and supplier management
- 3PL integration
- Manufacturing / kitting support

- **Paid:** From $349/month
- **API:** REST API available
- **Docs:** https://cin7.com/integrations/api/

---

### Brightpearl
Unified retail operations platform — inventory, OMS, accounting, and POS.

- Amazon, Shopify, and wholesale channel sync
- Automated replenishment
- 3PL coordination

- **Paid:** Custom enterprise pricing
- **API:** Full REST API
- **Docs:** https://www.brightpearl.com/

---

### Skubana / Extensiv
Order and inventory management for high-SKU Amazon brands.

- Multi-warehouse routing
- FBA vs FBM split logic
- Demand forecasting

- **Paid:** From $500/month
- **API:** Available

---

### Linnworks
Centralized inventory and order management across marketplaces.

- Amazon FBA + FBM inventory sync
- Automated repricing integration
- Shipping rule automation

- **Paid:** From $449/month
- **Docs:** https://developer.linnworks.com/

---

### Inventory Planner (by Sage)
Demand forecasting and repurchase planning.

- AI-powered demand forecasting
- Reorder point automation
- Supplier lead time tracking

- **Free trial available**
- **Paid:** From $99/month
- **Docs:** https://inventoryplanner.com/api

---

### Flexport API (formerly Deliverr)
3PL and freight forwarding with API integration.

- International freight booking
- Customs documentation
- Last-mile fulfillment

- **Paid:** Volume-based pricing
- **Docs:** https://api.flexport.com/

---

### ShipBob API
3PL fulfillment network API.

- Order routing to nearest fulfillment center
- Returns management
- Inventory syncing across locations

- **Paid:** Custom fulfillment pricing + API access
- **Docs:** https://developer.shipbob.com/

---

## 8. Shipping & Logistics

### EasyPost API
Multi-carrier shipping API — 100+ carriers in a single integration.

- Rate shopping across carriers
- Label generation
- Package tracking
- Address verification
- Insurance

- **Free tier:** 1,000 shipments/month free on some carriers
- **Paid:** Custom volume pricing
- **Docs:** https://www.easypost.com/docs/api

---

### Shippo API
Shipping label and rate API — beginner-friendly and well-documented.

- 85+ carriers supported
- Batch label printing
- Returns labels
- Tracking webhooks

- **Free tier:** Pay-per-label ($0.05/label + carrier rates)
- **Paid:** From $19/month (starter plans)
- **Docs:** https://docs.goshippo.com/

---

### ShipStation API
Shipping and order fulfillment platform with broad carrier and marketplace integrations.

- Amazon, Shopify, eBay order import
- Multi-carrier rate shopping
- Returns portal

- **Paid:** From $9.99/month (50 shipments) → $229.99/month (10,000 shipments)
- **Docs:** https://www.shipstation.com/docs/api/

---

### FedEx API
Direct carrier API for FedEx services.

- Rate quotes
- Label generation
- Tracking
- Pickup scheduling

- **Free:** API access free (pay shipping rates)
- **Docs:** https://developer.fedex.com/

---

### UPS Developer Kit API
Direct UPS API for shipping integrations.

- Rate and service selection
- Label generation
- Time in transit calculations
- Tracking

- **Free:** API access free
- **Docs:** https://developer.ups.com/

---

### USPS Web Tools API
USPS direct API — best for domestic lightweight packages.

- Rate calculator
- Address validation
- Tracking
- Label generation (via eVS)

- **Free:** API access free
- **Docs:** https://www.usps.com/business/web-tools-apis/

---

### DHL API
International shipping API — best for cross-border Amazon orders.

- Global rate calculator
- Shipment booking
- Tracking
- Customs document generation

- **Free:** API access free (pay for shipments)
- **Docs:** https://developer.dhl.com/

---

### FreightQuote / uShip API
LTL and full truckload freight APIs for large-volume brand shipments.

- Rate comparison
- Carrier booking
- Shipment tracking

---

## 9. Finance & Accounting

### QuickBooks Online API
The most widely used accounting API for small-to-mid Amazon brands.

- P&L, balance sheet, cash flow reports
- Expense categorization
- Amazon settlement reconciliation
- Payroll integration

- **Free tier:** No free tier (30-day trial)
- **Paid:** From $35/month (Simple Start) → $235/month (Advanced)
- **Docs:** https://developer.intuit.com/

---

### Xero API
Cloud accounting platform — popular with Amazon brands for its clean API.

- Financial reporting
- Bank reconciliation
- Multi-currency support
- Integration with A2X for Amazon settlements

- **Paid:** From $20/month (Early) → $47/month (Established)
- **Docs:** https://developer.xero.com/

---

### A2X Accounting
Amazon-specific accounting middleware — maps Amazon settlements to accounting categories.

- Splits settlement data into revenue, fees, COGS, refunds
- Pushes clean entries to QuickBooks or Xero
- Multi-marketplace support

- **Paid:** From $29/month
- **Docs:** https://www.a2xaccounting.com/integrations/

---

### Finaloop
Ecommerce-specific real-time bookkeeping platform.

- Real-time P&L for Amazon brands
- COGS tracking with landed cost
- Inventory accounting (FIFO, WAC)
- Tax-ready financials

- **Paid:** From $65/month
- **Docs:** https://www.finaloop.com/

---

### Stripe API
Payment processing for DTC/off-Amazon sales (Shopify, website, etc.)

- Card processing
- Subscription billing
- Payouts and transfers
- Financial reporting

- **Free:** No monthly fee; 2.9% + $0.30/transaction
- **Docs:** https://stripe.com/docs/api

---

### PayPal API
Payment processing and international payouts.

- Standard card and PayPal payments
- Mass payouts (supplier payments, influencer payouts)
- International currency support

- **Free:** No monthly fee; transaction fees apply
- **Docs:** https://developer.paypal.com/

---

### Brex / Mercury / Ramp APIs
Modern business banking with API access — popular with ecommerce founders.

| Platform | Best For |
|---|---|
| Brex | Venture-backed brands, corporate cards |
| Mercury | Lean startups, free banking |
| Ramp | Expense management, bill pay automation |

- **Free tier:** All three offer free basic accounts
- Paid tiers for advanced features

---

### Sellerboard API
Amazon-specific P&L dashboard with real-time profitability tracking.

- Per-ASIN profitability
- PPC cost attribution
- Refund and return tracking
- Inventory cost tracking (FIFO)

- **Free trial:** Available
- **Paid:** From $19/month
- **Docs:** https://sellerboard.com/api/

---

## 10. Tax & Sales Tax Compliance

### TaxJar API
US sales tax automation — best for domestic-focused brands.

- Sales tax calculation at checkout
- Automated filing and remittance
- Nexus tracking across states
- Amazon integration

- **Note:** US sales tax only (no VAT/GST)
- **Free trial:** Available
- **Paid:** From $19/month (Starter)
- **Docs:** https://developers.taxjar.com/

---

### Avalara AvaTax API
Enterprise-grade global tax compliance.

- US sales tax + VAT + GST
- International marketplace tax handling
- Returns filing automation
- Cross-border compliance

- **Paid:** Custom volume-based pricing (sales tax registration ~$403/location)
- **Docs:** https://developer.avalara.com/

---

### TaxCloud API
US-focused sales tax automation — good TaxJar alternative.

- Tax calculation and filing
- Free plan available for qualifying merchants

- **Free tier:** Available
- **Paid:** Volume-based
- **Docs:** https://taxcloud.com/developers/

---

### Anrok API
Sales tax for AI / SaaS businesses — growing into ecommerce.

- Modern API-first design
- Global tax coverage

- **Paid:** Custom pricing
- **Docs:** https://www.anrok.com/

---

### Quaderno API
VAT, GST, and digital services tax automation for international sales.

- Automatic tax calculation
- Invoice generation
- Tax compliance reporting

- **Free trial:** Available
- **Paid:** From $49/month
- **Docs:** https://developers.quaderno.io/

---

## 11. Repricing & Pricing Intelligence

### Repricer.com API
AI-powered Amazon repricing — top-rated for Buy Box performance.

- Rule-based and AI repricing
- Buy Box targeting
- Velocity-based pricing strategies
- Multi-marketplace support

- **Paid:** From $79/month
- **Docs:** https://www.repricer.com/

---

### Aura Repricer
Specialized for private label / FBA brands.

- Rule-based repricing
- Min/max guard rails
- Competitor analysis

- **Paid:** From $27/month
- **Docs:** https://goaura.com/

---

### BQool Repricer
Budget-friendly repricing with strong AI features.

- AI-powered Buy Box strategy
- 35% average sales increase reported
- Repricing interval: every 15 minutes

- **Free trial:** Available
- **Paid:** From $25/month
- **Docs:** https://www.bqool.com/

---

### Wiser Solutions API
Competitive pricing intelligence across retail channels.

- MAP violation monitoring
- Competitor price tracking
- Price benchmarking

- **Paid:** Custom enterprise pricing
- **Docs:** https://www.wiser.com/

---

## 12. Customer Service & Helpdesk

### Gorgias API
Ecommerce-first helpdesk — integrates directly with Amazon, Shopify, and more.

- Amazon Buyer-Seller Messaging integration
- Ticket management and automation
- Macro responses for common issues
- Revenue tracking per ticket

- **Free trial:** Available
- **Paid:** From $10/month (10 tickets) → scales with volume
- **Docs:** https://developers.gorgias.com/

---

### Zendesk API
Enterprise helpdesk platform — highly customizable.

- Ticket management
- AI-powered routing and suggestions
- Knowledge base / self-service portal
- Multi-channel (email, chat, phone)

- **Free trial:** Available
- **Paid:** From $19/agent/month (Suite Team)
- **Docs:** https://developer.zendesk.com/

---

### Freshdesk API
Cost-effective helpdesk — good for growing Amazon brands.

- Ticket automation
- Canned responses
- Team performance reporting

- **Free tier:** Up to 10 agents free
- **Paid:** From $15/agent/month
- **Docs:** https://developers.freshdesk.com/

---

### Re:amaze API
Ecommerce-focused helpdesk with Amazon messaging integration.

- Amazon order data in tickets
- Chat, email, and social unified
- Proactive messaging

- **Paid:** From $29/month
- **Docs:** https://www.reamaze.com/api

---

### Intercom API
Conversational support and customer engagement.

- In-app messaging
- AI-powered bot responses
- Customer health scoring

- **Free trial:** Available
- **Paid:** From $39/month
- **Docs:** https://developers.intercom.com/

---

## 13. Review & Feedback Management

### FeedbackWhiz API
Amazon review and order email automation.

- Automated review request emails (within Amazon ToS)
- Order notification automation
- Review monitoring and alerts

- **Free trial:** Available
- **Paid:** From $19.99/month
- **Docs:** https://www.feedbackwhiz.com/

---

### Seller Labs (FeedbackFive) API
Review request automation and seller feedback management.

- Automated messaging sequences
- Review monitoring
- Negative review alerts

- **Free tier:** Limited
- **Paid:** From $49/month
- **Docs:** https://www.sellerlabs.com/

---

### SalesDuo API
AI-powered review management — top-ranked in 2026.

- Review request automation
- AI response generation for reviews
- Listing feedback loop integration

- **Paid:** Custom pricing
- **Docs:** https://www.salesduo.com/

---

### Yotpo API
Reviews, loyalty, and UGC platform — better for DTC/off-Amazon.

- Verified review collection
- Star rating widget integration
- Referral and loyalty programs

- **Free tier:** Available (basic reviews)
- **Paid:** From $79/month
- **Docs:** https://developer.yotpo.com/

---

## 14. Brand Protection & IP Monitoring

### Amazon Brand Registry (Native Tools)
Built-in brand protection via the SP-API and Brand Registry portal.

- Report a Violation (RAV) — programmatic IP complaint submission
- Project Zero — self-service counterfeit removal
- Transparency API — product serialization for anti-counterfeiting
- Brand Catalog Lock — protect listing content fields

- **Cost:** Included with Brand Registry enrollment (requires trademark)

---

### Red Points API
Third-party brand protection monitoring across Amazon and beyond.

- Real-time infringement detection
- Automatic takedown submission
- Counterfeit seller profiling
- Multi-marketplace monitoring (not just Amazon)

- **Paid:** Custom enterprise pricing
- **Docs:** https://www.redpoints.com/

---

### BrandShield API
AI-powered brand protection and online threat intelligence.

- Marketplace listing monitoring
- Social media impersonation detection
- Domain squatting alerts
- Phishing site detection

- **Paid:** Custom pricing
- **Docs:** https://www.brandshield.com/

---

### IP Vigilance / MarkMonitor
Enterprise trademark and brand monitoring.

- Domain and trademark monitoring
- Counterfeiting intelligence
- Legal escalation workflows

- **Paid:** Enterprise pricing

---

### USPTO / TrademarkNow API
Trademark search and monitoring APIs.

- USPTO trademark database search
- International trademark watch services
- Conflict analysis

- **USPTO API:** Free
- **TrademarkNow:** Paid (custom pricing)
- **USPTO Docs:** https://developer.uspto.gov/

---

## 15. Analytics & Business Intelligence

### Google Analytics 4 (GA4) API
Web and DTC traffic analytics.

- Audience behavior and attribution
- Off-Amazon traffic tracking
- Conversion funnel analysis

- **Free tier:** Standard GA4 is free
- **Paid:** GA4 360 from $50,000+/year
- **Docs:** https://developers.google.com/analytics/devguides/reporting/data/v1

---

### Amazon Attribution API
Track off-Amazon marketing traffic impact on Amazon conversions.

- UTM tag generation for external ads
- Conversion attribution back to Amazon detail pages
- ROAS measurement for Google, Meta, email campaigns

- **Free:** Part of the Amazon Advertising API
- **Docs:** https://advertising.amazon.com/API/docs/en-us/amazon-attribution/

---

### Looker Studio (Data Studio) API
Google's free BI tool — widely used to build Amazon seller dashboards.

- Connect SP-API, Advertising API, GA4 data
- Custom reporting dashboards
- Automated scheduled reports

- **Free:** Core product is free
- **Docs:** https://developers.google.com/looker-studio

---

### Tableau / Tableau Cloud API
Enterprise BI for large Amazon brands.

- Advanced data visualization
- Predictive analytics
- Cross-department reporting

- **Paid:** From $75/user/month
- **Docs:** https://developer.salesforce.com/docs/tableau/en/

---

### Power BI API (Microsoft)
BI and reporting embedded into Microsoft 365 / Azure.

- Custom Amazon seller dashboards
- Real-time data refresh
- Embedded analytics

- **Free tier:** Power BI Desktop is free
- **Paid:** From $10/user/month (Pro)
- **Docs:** https://learn.microsoft.com/en-us/rest/api/power-bi/

---

### Northbeam / TripleWhale / Rockerbox
Cross-channel marketing attribution platforms for DTC + Amazon brands.

| Platform | Best For |
|---|---|
| Northbeam | Enterprise multi-touch attribution |
| Triple Whale | Amazon + Shopify brands |
| Rockerbox | Mid-market DTC attribution |

- **Paid:** From $200–$500/month

---

## 16. Automation & Workflow Orchestration

### n8n API / Self-hosted
Open-source workflow automation — increasingly popular with Amazon brands for custom integrations.

- Connect SP-API, SellerApp, Slack, Google Sheets
- Custom automation without monthly per-task fees
- Self-hosted or cloud-hosted

- **Free:** Self-hosted is free
- **Paid:** n8n Cloud from $20/month
- **Docs:** https://docs.n8n.io/

---

### Zapier API
No-code automation between 6,000+ apps.

- Quick integrations without engineering
- Amazon → CRM, Slack, Email automations
- Popular for small brand teams

- **Free tier:** 100 tasks/month
- **Paid:** From $19.99/month (750 tasks)
- **Docs:** https://platform.zapier.com/

---

### Make (Integromat) API
Visual workflow automation — more powerful than Zapier, better for complex multi-step flows.

- Visual scenario builder
- Advanced data manipulation (JSON, arrays)
- Error handling and retry logic

- **Free tier:** 1,000 operations/month
- **Paid:** From $9/month (10,000 operations)
- **Docs:** https://www.make.com/en/api-documentation

---

### Pipedream
Developer-first workflow automation with full code control.

- Node.js and Python step functions
- Pre-built Amazon, Slack, and Gmail connectors
- Webhook handling

- **Free tier:** 100 invocations/day
- **Paid:** From $19/month
- **Docs:** https://pipedream.com/docs/

---

### ClickUp API
Project management and task tracking for Amazon brand operations.

- Campaign calendar management
- Product launch tracking
- Team task assignment and reporting

- **Free tier:** Available (unlimited tasks)
- **Paid:** From $7/user/month
- **Docs:** https://clickup.com/api/

---

### Notion API
Knowledge base and project management for brand SOPs and content calendars.

- Product launch wikis
- Influencer outreach tracking
- SOP documentation

- **Free tier:** Available
- **Paid:** From $10/user/month
- **Docs:** https://developers.notion.com/

---

### Airtable API
Flexible database/spreadsheet hybrid for brand operations.

- SKU and catalog management
- Influencer and creator tracking
- Product launch workflows
- Image and asset management

- **Free tier:** Up to 1,000 records/base
- **Paid:** From $20/user/month
- **Docs:** https://airtable.com/developers/web/api/introduction

---

## 17. AI & Large Language Models

### OpenAI API
- GPT-4o, o3, o4-mini for content, analysis, automation
- Vision API for competitor image analysis
- Embeddings API for semantic search and review clustering
- **Paid:** Usage-based; ~$2.50–$15/1M tokens depending on model

---

### Anthropic Claude API
- Claude Opus 4.6 / Sonnet 4.6 / Haiku 4.5
- Superior for long-context analysis (competitor review mining, large reports)
- Strong reasoning for pricing and strategy tasks
- **Paid:** $0.25–$75/1M tokens depending on model and input/output

---

### Google Gemini API
- Gemini 2.0 Flash for fast, cost-effective tasks
- Gemini 2.5 Pro for complex reasoning
- Native multimodal (text, image, audio, video)
- **Free tier:** Limited
- **Paid:** Usage-based
- **Docs:** https://ai.google.dev/

---

### Perplexity API
AI-powered real-time web research.

- Live web search with citations
- Competitive intelligence queries
- Market trend research

- **Paid:** From $20/month; API credits additional
- **Docs:** https://docs.perplexity.ai/

---

### ElevenLabs API
AI voice generation for product videos, ads, and brand content.

- Text-to-speech in 30+ languages
- Voice cloning
- Audio for Amazon video ads

- **Free tier:** 10,000 characters/month
- **Paid:** From $5/month
- **Docs:** https://docs.elevenlabs.io/

---

## 18. HR, Payroll & Contractor Management

### Gusto API
Payroll, benefits, and HR for US-based Amazon brand teams.

- Payroll processing
- Benefits administration
- Employee onboarding

- **Paid:** From $46/month + $6/person
- **Docs:** https://docs.gusto.com/

---

### Deel API
Global contractor and employee payments — essential for brands with overseas VAs and suppliers.

- International contractor payments (150+ countries)
- Compliance management
- EOR (Employer of Record) services

- **Free tier:** Free for contractor management (limited)
- **Paid:** From $49/contractor/month (employer of record)
- **Docs:** https://developer.deel.com/

---

### Rippling API
HR, payroll, IT, and finance in one platform.

- Employee lifecycle management
- Device and app provisioning
- Global payroll

- **Paid:** From $8/user/month (base)
- **Docs:** https://developer.rippling.com/

---

### Remote API
Global employment and contractor compliance.

- EOR services in 180+ countries
- Contractor management
- Benefits localization

- **Paid:** From $29/contractor/month
- **Docs:** https://remote.com/api

---

## 19. Communication & Collaboration

### Slack API
Team messaging and workflow automation for Amazon brand teams.

- Channel-based ops communication
- Bot integrations (order alerts, inventory warnings)
- Slash commands for brand data queries

- **Free tier:** 90-day message history
- **Paid:** From $7.25/user/month
- **Docs:** https://api.slack.com/

---

### Twilio API
SMS, WhatsApp, and voice communications infrastructure.

- SMS alerts for order issues, inventory low-stock
- Customer communication automation
- WhatsApp Business API

- **Free tier:** Trial credits ($15)
- **Paid:** ~$0.0079/SMS sent + $1/month/number
- **Docs:** https://www.twilio.com/docs/

---

### Loom API
Async video messaging — useful for team SOPs and training.

- Screen recording and sharing
- Team training libraries
- Video transcription

- **Free tier:** 25 videos free
- **Paid:** From $12.50/creator/month
- **Docs:** https://dev.loom.com/

---

### Zoom API
Video conferencing and webinar integration.

- Team meetings and supplier calls
- Automated webinar recording
- Meeting transcription

- **Free tier:** 40-min meetings free
- **Paid:** From $13.33/user/month
- **Docs:** https://marketplace.zoom.us/docs/api-reference/

---

### Google Workspace API (Gmail, Drive, Sheets, Docs)
Core productivity suite used by most Amazon brand teams.

- Gmail API: Email automation
- Drive API: Asset storage and sharing
- Sheets API: Reporting and data pipelines
- Docs API: Document generation

- **Free tier:** Personal Google account
- **Paid:** From $6/user/month (Business Starter)
- **Docs:** https://developers.google.com/workspace

---

## 20. Developer Infrastructure

### AWS APIs (Amazon Web Services)
Cloud infrastructure for custom Amazon brand tech stacks.

| Service | Use Case |
|---|---|
| S3 | Asset storage (images, reports) |
| Lambda | Serverless automation triggers |
| RDS / DynamoDB | Database for seller data |
| SQS | Message queues for order processing |
| CloudWatch | Monitoring and alerting |
| Bedrock | Managed AI/LLM access |

- **Free tier:** 12-month free tier available
- **Paid:** Pay-as-you-go
- **Docs:** https://aws.amazon.com/api/

---

### Supabase API
Open-source Firebase alternative — popular for lean brand tech stacks.

- PostgreSQL database
- Auth and user management
- Realtime subscriptions
- Edge functions

- **Free tier:** Generous free tier
- **Paid:** From $25/month (Pro)
- **Docs:** https://supabase.com/docs/reference/api/

---

### Vercel API
Deployment platform for brand web apps and tools.

- One-click deployments
- Edge functions
- Preview environments

- **Free tier:** Hobby tier free
- **Paid:** From $20/month (Pro)
- **Docs:** https://vercel.com/docs/rest-api

---

### GitHub API
Version control and code collaboration.

- Repository management
- CI/CD automation
- Code review workflows

- **Free tier:** Unlimited public repos + generous private
- **Paid:** From $4/user/month (Team)
- **Docs:** https://docs.github.com/en/rest

---

### Datadog / New Relic API
Application monitoring and observability for brands running custom integrations.

- API performance monitoring
- Error alerting
- Custom dashboards

- **Free tier:** Datadog has a free tier
- **Paid:** From $15/host/month
- **Docs:** https://docs.datadoghq.com/api/

---

## Quick Reference: API Categories by Brand Size

| Brand Stage | Must-Have APIs |
|---|---|
| **Launch** | SP-API, Amazon Ads API, EasyPost, Klaviyo, TaxJar, OpenAI, Slack |
| **Growth** | + Helium 10 / SellerApp, Repricer, Gorgias, QuickBooks, Claid.ai, Zapier |
| **Scale** | + Avalara, ShipBob, Cin7, Red Points, Tableau, Deel, Custom AWS stack |
| **Enterprise** | + Full Amazon DSP, Triple Whale, Brightpearl, Salesforce, custom n8n pipelines |

---

## Useful Starting Points

- **Amazon Developer Docs:** https://developer-docs.amazon.com/sp-api/
- **Amazon Advertising API:** https://advertising.amazon.com/API/docs/
- **Public APIs GitHub:** https://github.com/public-apis/public-apis
- **Unified.to (multi-API abstraction):** https://unified.to/ — single API for shipping, marketing, CRM, and more
- **SP-API Rate Limits Guide (2026):** https://novadata.io/resources/blog/amazon-sp-api-rate-limits-guide

---

*Last updated: May 2026*
