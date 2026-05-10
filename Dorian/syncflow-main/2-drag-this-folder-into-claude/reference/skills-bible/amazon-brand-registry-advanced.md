# Amazon Brand Registry — Advanced Features & Programmatic Interfaces

> **Scope:** Expert reference for Brand Registry-gated tools and APIs — A+ Content, Brand Story, Virtual Bundles, Transparency, Brand Tailored Promotions, Brand Analytics, Posts, Brand Stores, and Manage Your Experiments. Assumes you have already read `amazon-sp-api.md` and `amazon-brand-apis.md`. Treat this as a living document; Amazon updates Brand Registry features frequently — cross-check with the [official Brand Registry help](https://brandregistry.amazon.com/) and [SP-API developer docs](https://developer-docs.amazon.com/sp-api/).

> **Context:** This document is part of the syncflow reference stack — an AI agent system that builds automation modules for Amazon sellers. Every section is written for programmatic implementation, not manual Seller Central clicks.

---

## Table of Contents

1. [Brand Registry Fundamentals](#1-brand-registry-fundamentals)
2. [A+ Content API — Deep Dive](#2-a-content-api--deep-dive)
3. [Brand Story (Brand Carousel)](#3-brand-story-brand-carousel)
4. [Virtual Bundles](#4-virtual-bundles)
5. [Transparency Program](#5-transparency-program)
6. [Brand Tailored Promotions (BTP)](#6-brand-tailored-promotions-btp)
7. [Brand Follow](#7-brand-follow)
8. [Brand Analytics — Programmatic Deep Dive](#8-brand-analytics--programmatic-deep-dive)
9. [Amazon Posts](#9-amazon-posts)
10. [Brand Store API (GA February 2026)](#10-brand-store-api-ga-february-2026)
11. [Manage Your Experiments (MYE / A/B Testing)](#11-manage-your-experiments-mye--ab-testing)
12. [Project Zero — Brand Protection](#12-project-zero--brand-protection)
13. [Brand Registry Monitoring Dashboard — Supabase + n8n](#13-brand-registry-monitoring-dashboard--supabase--n8n)
14. [API Rate Limits & Access Tiers](#14-api-rate-limits--access-tiers)
15. [Common Pitfalls](#15-common-pitfalls)
16. [Dos & Don'ts](#16-dos--donts)
17. [Useful Links](#17-useful-links)

---

## 1. Brand Registry Fundamentals

### 1.1 What Brand Registry Is (and Isn't)

Amazon Brand Registry is Amazon's brand protection and content enrichment program. Enrollment unlocks a suite of features unavailable to non-enrolled sellers. It is **not** just a brand protection tool — it is the gateway to most of Amazon's advanced content and analytics capabilities.

**What Brand Registry is NOT:**
- Not a listing approval program (you still need product category approval separately)
- Not automatic — you apply per brand, not per account
- Not a one-time configuration — some benefits require ongoing eligibility maintenance (e.g., Premium A+)

### 1.2 Enrollment Requirements

**Mandatory requirement:** An **active, registered trademark** (not pending) in an accepted trademark office.

| Trademark Type | Accepted? |
|---|---|
| Registered word mark (text) | ✅ Yes |
| Registered design mark (image with text showing brand name) | ✅ Yes |
| Pending USPTO application (direct filing) | ❌ No (standard path) |
| Pending via Amazon IP Accelerator | ✅ Yes (expedited path) |
| Registered trademark in one market, applying for another | ✅ Yes (per-marketplace enrollment) |

**Additional requirements:**
- Trademark must visibly appear on your products or product packaging
- You must be the trademark owner or an authorized agent
- Your brand name must match what's registered

**Trademark offices Amazon accepts (partial list):**
USPTO (US), EUIPO (EU), IPO (UK), CIPO (Canada), IP Australia, JPO (Japan), CNIPA (China), KIPO (South Korea), and ~70+ others. Check the current list in Brand Registry enrollment — it expands regularly.

### 1.3 Enrollment Process

1. Go to [brandregistry.amazon.com](https://brandregistry.amazon.com) → Sign in with Seller Central credentials
2. Click **Enroll now** → Enter brand name (must match trademark exactly, case-sensitive)
3. Enter trademark registration number and select the issuing trademark office
4. Select product categories and marketplaces
5. Upload product/packaging images showing the brand name
6. Submit

**Verification step:** Amazon sends a verification code to the **trademark correspondent** listed in your trademark registration (typically your IP attorney). You must receive this code and enter it in Brand Registry within **10 days** or the application lapses.

**Timeline:** Once the verification code is submitted: 1–5 business days for approval in most cases. Complex cases or mismatches between trademark data and submission can extend this to 2–3 weeks.

### 1.4 What Unlocks on Enrollment

| Feature | Unlocks Immediately | Notes |
|---|---|---|
| A+ Content (Standard) | ✅ | Apply per ASIN |
| Enhanced Brand Content (legacy name) | ✅ | Same as A+ Content |
| Brand Analytics | ✅ | Requires Brand Analytics SP-API role |
| Sponsored Brands ads | ✅ | Via Amazon Ads account |
| Amazon Stores (Brand Stores) | ✅ | One store per marketplace |
| Amazon Posts | ✅ | Free organic content placement |
| Manage Your Experiments (MYE) | ✅ | After first A+ Content is approved |
| Virtual Bundles | ✅ | FBA-only, US marketplace only |
| Brand Tailored Promotions | ✅ | Minimum audience size thresholds apply |
| Transparency | Requires separate enrollment | Per-product enrollment, per-unit cost |
| Project Zero | Requires separate application | Invite-based historically, now broader |
| Premium A+ Content | Conditional | Requires Brand Story on all ASINs + 15 approved A+ projects |
| Brand Follow button | ✅ | Appears on Stores and Sponsored Brand ads |

### 1.5 Multi-Marketplace Enrollment

Each marketplace requires a separate Brand Registry enrollment, but you can use the **same trademark** to enroll in multiple marketplaces if that trademark is registered in the corresponding country or regional jurisdiction.

**Strategy for global brands:**
- US trademark → enrolls amazon.com
- EUIPO registration → enrolls .de, .fr, .it, .es, .nl, .se simultaneously (EU-wide trademark)
- UK trademark → enrolls amazon.co.uk
- JP trademark → enrolls amazon.co.jp

> ⚠️ A+ Content, Brand Stories, and Stores are marketplace-specific. A+ content approved on amazon.com is **not** automatically applied to amazon.co.uk or amazon.de. You must create and publish separate content per marketplace.

---

## 2. A+ Content API — Deep Dive

### 2.1 Standard A+ vs. Premium A+

| Dimension | Standard A+ | Premium A+ |
|---|---|---|
| Module rows | Up to 5 modules | Up to 7 modules |
| Available modules | 17 module types | 19 module types (adds interactive hotspot, video) |
| Comparison table | Up to 5 columns | Up to 6 columns |
| Image sizes | Standard | Full-width, larger images |
| Interactive elements | None | Hotspot images, Q&A module, video |
| Cost | Free | Free (was briefly paid, now free again as of 2024) |
| Eligibility | All Brand Registry enrollees | Brand Story published on ALL catalog ASINs + 15 approved A+ projects in past 12 months |
| How access unlocks | Immediately | Automatically when criteria are met — no application needed |

**Premium A+ eligibility check:**
1. Navigate to A+ Content Manager in Seller Central
2. If Premium modules appear in the content builder, you have access
3. Via API: attempt to create a content document using a Premium module type — if eligibility is missing, the API returns a 403 with code `PREMIUM_NOT_ELIGIBLE`

### 2.2 A+ Content API Endpoints

**Base URL:** `https://sellingpartnerapi-na.amazon.com` (NA) / `sellingpartnerapi-eu.amazon.com` (EU) / `sellingpartnerapi-fe.amazon.com` (FE)

**API version:** `2020-11-01`

**Role required:** `Listings` role in your SP-API application

All endpoints are under `/aplus/2020-11-01/`:

| Operation | Method + Path | Purpose |
|---|---|---|
| `searchContentDocuments` | `GET /contentDocuments` | List all A+ content documents for a marketplace |
| `createContentDocument` | `POST /contentDocuments` | Create a new A+ content document |
| `getContentDocument` | `GET /contentDocuments/{contentReferenceKey}` | Retrieve a specific content document |
| `updateContentDocument` | `POST /contentDocuments/{contentReferenceKey}` | Update an existing draft document |
| `listContentDocumentAsinRelations` | `GET /contentDocuments/{contentReferenceKey}/asins` | Get ASINs linked to a document |
| `postContentDocumentAsinRelations` | `POST /contentDocuments/{contentReferenceKey}/asins` | Link/unlink ASINs to a document |
| `validateContentDocumentAsinRelations` | `POST /contentDocuments/{contentReferenceKey}/asins/validations` | Pre-validate before submission |
| `postContentDocumentApprovalSubmission` | `POST /contentDocuments/{contentReferenceKey}/approvalSubmissions` | Submit for review/publication |
| `postContentDocumentSuspendSubmission` | `POST /contentDocuments/{contentReferenceKey}/suspendSubmissions` | Pull a document back from review |
| `searchContentPublishRecords` | `GET /publishRecords` | Check publication status by ASIN |

### 2.3 Workflow: Create → Link → Submit

```
1. POST /contentDocuments
   → Returns contentReferenceKey (your document ID)

2. POST /contentDocuments/{contentReferenceKey}/asins
   → Link parent ASINs to this document
   → Each parent ASIN can only have one approved A+ document at a time

3. POST /contentDocuments/{contentReferenceKey}/asins/validations
   → Optional pre-validation; catches issues before submission
   → Recommended: always run this before submitting

4. POST /contentDocuments/{contentReferenceKey}/approvalSubmissions
   → Submits for Amazon review
   → Status transitions: DRAFT → IN_REVIEW → APPROVED → PUBLISHED
   → Or: IN_REVIEW → REJECTED (with rejection reasons in the response)

5. GET /contentDocuments/{contentReferenceKey}
   → Poll to check status
   → Or use GET /publishRecords?asin={asin}&marketplaceId={id} to check live status
```

### 2.4 Content Document Structure

A content document is a JSON object with this top-level shape:

```json
{
  "contentDocument": {
    "name": "My Brand A+ Content - Hero Product",
    "contentType": "STANDARD",
    "locale": "en_US",
    "contentModuleList": [
      {
        "contentModuleType": "STANDARD_IMAGE_TEXT_OVERLAY",
        "standardImageTextOverlay": { ... }
      },
      {
        "contentModuleType": "STANDARD_FOUR_IMAGE_TEXT",
        "standardFourImageText": { ... }
      }
    ]
  },
  "marketplaceId": "ATVPDKIKX0DER"
}
```

**Supported `contentModuleType` values:**

| Module Type | Description | Use Case |
|---|---|---|
| `STANDARD_COMPANY_LOGO` | Brand logo image | Always the first module for brand recognition |
| `STANDARD_IMAGE_TEXT_OVERLAY` | Full-width image with text overlay | Hero banner |
| `STANDARD_FOUR_IMAGE_TEXT` | 4 images with text in a row | Feature highlights |
| `STANDARD_FOUR_IMAGE_TEXT_QUADRANT` | 4 images in 2×2 grid with text | Benefits grid |
| `STANDARD_SINGLE_SIDE_IMAGE` | Single image with headline and body text beside it | Detailed feature callout |
| `STANDARD_TECH_SPECS` | Table of technical specifications | Tech/electronics products |
| `STANDARD_PRODUCT_DESCRIPTION` | Full-width text block | Long-form brand/product story |
| `STANDARD_MULTIPLE_IMAGE_TEXT` | Up to 3 images with text rows | Sequential story |
| `STANDARD_HEADER_IMAGE_TEXT` | Headline text with image and body | Section header |
| `STANDARD_COMPARISON_TABLE_TECHNICAL_MATURITY` | Comparison table | Compare your product line |
| `STANDARD_TEXT` | Plain text section | Legal/compliance text, brand story |
| `STANDARD_THREE_IMAGE_TEXT_MODULE` | 3 images with text in a row | 3-benefit showcase |

**Premium-only module types (additional):**
- `PREMIUM_HOTSPOT_IMAGE` — Interactive image with clickable hotspot zones revealing product details
- `PREMIUM_VIDEO` — Embedded video module (video must be uploaded separately via Amazon's media upload)
- `PREMIUM_INTERACTIVE_COMPARISON_TABLE` — Enhanced comparison table

### 2.5 Image Requirements for A+ Modules

| Module | Recommended Dimensions | Min Width | Format |
|---|---|---|---|
| Company logo | 600×180 px | 200px | JPEG, PNG |
| Full-width hero | 1464×600 px | 970px | JPEG, PNG |
| Four image grid | 220×220 px per image | 150px | JPEG, PNG |
| Single side image | 300×400 px | 200px | JPEG, PNG |
| Three image row | 300×300 px per image | 200px | JPEG, PNG |

> All images must be under 2MB. JPEG preferred. No text overlaying faces. No promotional price claims. No Amazon badge lookalikes.

### 2.6 Approval Workflow & Timing

| Status | Meaning | Expected Duration |
|---|---|---|
| `DRAFT` | Document created, not submitted | Indefinite |
| `IN_REVIEW` | Submitted for moderation | 1–7 business days (typically 24–72 hours) |
| `APPROVED` | Approved by Amazon | — |
| `PUBLISHED` | Live on product detail page | 24–48 hours after approval |
| `REJECTED` | Did not pass moderation | See rejection codes in response |
| `SUSPENDED` | Pulled from review by seller | — |

**Rejection reasons (common):**
- `IMAGE_NOT_APPROPRIATE` — Image contains restricted content (competing logos, time-limited claims, Amazon branding)
- `TEXT_NOT_APPROPRIATE` — Prohibited words/phrases (e.g., "best", "#1", price claims, warranty claims not verified by Amazon, competitor comparisons)
- `BRAND_NAME_MISMATCH` — The ASIN's registered brand name doesn't match the Brand Registry-approved brand
- `IMAGE_DIMENSIONS` — Images don't meet minimum resolution requirements
- `DUPLICATE_IMAGE` — Reusing images already used in the product image gallery
- `LOGO_VIOLATION` — Multiple logos in a single module, or logo doesn't match registered trademark
- `ASIN_NOT_ELIGIBLE` — The ASIN is in a restricted category or doesn't meet eligibility criteria

### 2.7 Bulk A+ Strategy

To efficiently apply one content document to many ASINs programmatically:

```python
import requests

def apply_aplus_to_asins(content_reference_key, asin_list, marketplace_id, access_token):
    """Apply one A+ content document to a list of parent ASINs."""
    
    url = f"https://sellingpartnerapi-na.amazon.com/aplus/2020-11-01/contentDocuments/{content_reference_key}/asins"
    
    headers = {
        "x-amz-access-token": access_token,
        "Content-Type": "application/json"
    }
    
    # Step 1: Link all ASINs
    body = {
        "contentDocumentAsinMetadataList": [
            {
                "asin": asin,
                "badge": "BRAND_STORY",  # or "STANDARD"
                "badgeDate": None
            }
            for asin in asin_list
        ],
        "marketplaceId": marketplace_id
    }
    
    response = requests.post(url, headers=headers, json=body)
    response.raise_for_status()
    
    # Step 2: Validate
    validate_url = f"{url}/validations"
    validate_response = requests.post(validate_url, headers=headers, json={"marketplaceId": marketplace_id})
    
    # Check for validation errors before submitting
    validation_data = validate_response.json()
    if validation_data.get("warnings") or validation_data.get("errors"):
        print(f"Validation issues: {validation_data}")
        return False
    
    # Step 3: Submit for approval
    submit_url = f"https://sellingpartnerapi-na.amazon.com/aplus/2020-11-01/contentDocuments/{content_reference_key}/approvalSubmissions"
    submit_response = requests.post(submit_url, headers=headers, json={"marketplaceId": marketplace_id})
    submit_response.raise_for_status()
    
    return True
```

**Key constraint:** A parent ASIN can only be linked to **one** approved A+ document at a time. If you push a new document to an ASIN that already has approved A+, the new document replaces it upon approval. Child ASINs inherit A+ from their parent — you don't apply A+ to child ASINs directly.

---

## 3. Brand Story (Brand Carousel)

### 3.1 What Brand Story Is

Brand Story is a special A+ content module — a horizontal scrollable carousel that appears at the top of the A+ section on a product detail page (above the regular A+ modules). It's also called the "brand carousel."

**Visually:** A full-width band showing your brand hero image, brand description, and a set of featured ASIN cards. When shoppers click it, they're taken to your Brand Store.

### 3.2 Why Brand Story Is Critical

Brand Story is a **prerequisite for Premium A+** access. To unlock Premium A+:
1. Brand Story must be **published** (not just submitted — actually live)
2. Brand Story must be published on **all ASINs** in your catalog
3. You must have **15 or more approved A+ projects** in the past 12 months
4. When all three conditions are met, Premium A+ modules appear automatically in the A+ Content Manager — no application required

> ⚠️ "All ASINs" means every active parent ASIN with the enrolled brand name. If you have 200 ASINs and only 195 have Brand Story, you won't qualify. This is the most common gotcha.

### 3.3 Creating Brand Story via API

Brand Story uses the same A+ Content API, but with `contentType: "BRAND_STORY"` and specific module types:

```json
{
  "contentDocument": {
    "name": "My Brand - Brand Story Module",
    "contentType": "BRAND_STORY",
    "locale": "en_US",
    "contentModuleList": [
      {
        "contentModuleType": "BRAND_STORY_FEATURED_ASINS",
        "brandStoryFeaturedAsins": {
          "brandDisplayName": "MyBrand",
          "brandLogo": {
            "uploadDestinationId": "sc/7890-brand-logo",
            "imageCropSpecification": {
              "size": { "width": { "value": 600, "units": "pixels" }, "height": { "value": 180, "units": "pixels" } },
              "offset": { "x": { "value": 0, "units": "pixels" }, "y": { "value": 0, "units": "pixels" } }
            },
            "altText": "MyBrand logo"
          },
          "headline": "Built for performance, designed to last.",
          "description": "MyBrand creates premium products for discerning customers who refuse to compromise.",
          "featuredAsinList": [
            { "asin": "B001234567" },
            { "asin": "B009876543" },
            { "asin": "B005551234" }
          ]
        }
      }
    ]
  },
  "marketplaceId": "ATVPDKIKX0DER"
}
```

### 3.4 Brand Story vs. Standard A+ Content

| Dimension | Brand Story | Standard A+ |
|---|---|---|
| Content type value | `BRAND_STORY` | `STANDARD` |
| Position on PDP | Top of A+ section (carousel) | Below Brand Story |
| ASIN scope | Applied to all ASINs of a brand | Applied per parent ASIN |
| Featured ASINs | Displays clickable ASIN cards | N/A |
| Link destination | Clicks go to Brand Store | No outbound links |
| Approval required | Yes | Yes |

### 3.5 Automating Brand Story at Scale

```python
def deploy_brand_story_to_all_asins(brand_story_ref_key, asin_list, marketplace_id, access_token):
    """
    Batch-link Brand Story to all ASINs.
    Amazon allows up to 100 ASINs per postContentDocumentAsinRelations call.
    """
    BATCH_SIZE = 100
    
    for i in range(0, len(asin_list), BATCH_SIZE):
        batch = asin_list[i:i + BATCH_SIZE]
        # Call postContentDocumentAsinRelations with this batch
        link_asins(brand_story_ref_key, batch, marketplace_id, access_token)
        time.sleep(1)  # Respect rate limits
    
    # Submit once after all ASINs are linked
    submit_for_approval(brand_story_ref_key, marketplace_id, access_token)
```

---

## 4. Virtual Bundles

### 4.1 What Virtual Bundles Are

Virtual Bundles let you sell two or more complementary products together under a single bundle ASIN without physically kitting them in a warehouse. When a customer orders the bundle, Amazon picks and ships the component ASINs from their individual FBA inventory.

**Contrast with physical kits:** Physical kits are pre-assembled in a warehouse and have their own FBA inventory. Virtual Bundles draw dynamically from the existing FBA stock of each component.

### 4.2 Hard Limitations

| Constraint | Value |
|---|---|
| Marketplace availability | US (amazon.com) only as of 2026 |
| Fulfillment method | FBA only — all component ASINs must be FBA |
| Maximum components per bundle | 5 ASINs |
| Minimum components per bundle | 2 ASINs |
| Bundle availability | Automatically goes out-of-stock if any component ASIN has 0 FBA inventory |
| Product types excluded | Digital products, gift cards, hazmat, age-restricted items, products with expiration dates |
| Vendor eligibility | Not available for Vendor Central (1P) sellers |

### 4.3 Creating Bundles Programmatically

Virtual Bundles can be created via the **Virtual Products API** in SP-API (under the `virtualBundles` resource). However, as of early 2026, many sellers create bundles directly in Seller Central's "Virtual Bundles" tool, and the API is the less-documented path.

**API path:** `POST /virtual-products/2020-09-01/bundles`

**Request body:**
```json
{
  "bundleDetails": {
    "title": "My Brand Complete Starter Kit",
    "description": "Everything you need to get started with MyBrand",
    "marketplaceId": "ATVPDKIKX0DER",
    "componentItems": [
      {
        "asin": "B001MAINPROD",
        "quantity": 1
      },
      {
        "asin": "B002ACCESSORY",
        "quantity": 1
      },
      {
        "asin": "B003BONUS",
        "quantity": 2
      }
    ],
    "price": {
      "currency": "USD",
      "amount": 49.99
    }
  }
}
```

### 4.4 Inventory & Pricing Strategy

**Inventory dynamics:**
- The bundle's available quantity = `min(stock of component A, stock of component B, ... / quantity required)`
- If any component goes to 0, the bundle goes to "Out of Stock" automatically
- Replenishing individual components restores bundle availability — no separate FBA shipment for the bundle

**Pricing strategy:**
- Bundle price must be **less than the sum of individual component prices** — Amazon enforces this
- Ideal bundle discount: 5–15% off the combined sum (enough to be compelling, not so much it cannibalizes individual sales)
- Bundle pricing does not affect the pricing of individual component ASINs

### 4.5 Monitoring Bundle Health with Supabase

Since a virtual bundle's availability is driven by component inventory, you need to monitor each component's FBA stock level and trigger alerts when any falls below your reorder point:

```sql
-- Table: bundle_components
CREATE TABLE bundle_components (
  id SERIAL PRIMARY KEY,
  bundle_asin TEXT NOT NULL,
  component_asin TEXT NOT NULL,
  quantity_per_bundle INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- View: bundle_availability
CREATE VIEW bundle_availability AS
SELECT 
  bc.bundle_asin,
  MIN(fi.sellable_quantity / bc.quantity_per_bundle) AS effective_bundle_qty,
  ARRAY_AGG(bc.component_asin || ':' || fi.sellable_quantity) AS component_stock
FROM bundle_components bc
JOIN fba_inventory fi ON bc.component_asin = fi.asin
GROUP BY bc.bundle_asin;
```

---

## 5. Transparency Program

### 5.1 What Transparency Solves

Transparency is Amazon's product authentication program. It prevents counterfeit units from reaching customers by requiring a unique, scannable code on every unit of enrolled products. Amazon associates and customers can scan the code to verify authenticity before the item ships or when received.

**The problem it addresses:**
- Commingled FBA inventory allows counterfeit units from other sellers to ship to your customers
- Third-party resellers can source and resell gray-market or fake units
- Customers receive items they believe to be authentic but aren't

**Note:** As of March 31, 2026, Amazon ended automatic inventory commingling for most product categories (commingled = different sellers' identical units pooled together). Transparency is now even more critical as a proactive brand protection layer.

### 5.2 Enrollment Requirements

1. Must be enrolled in Amazon Brand Registry
2. Product must have a valid GTIN (UPC, EAN, or ISBN) registered to your brand
3. You must have the **operational capability** to apply a Transparency code to every unit you manufacture or import, before it reaches Amazon's warehouse
4. Complete enrollment at [transparency.amazon.com](https://transparency.amazon.com)
5. All units of the enrolled product must carry a code — you cannot selectively enroll some units

> ⚠️ The "all units" requirement is the most operationally challenging aspect of Transparency. Once enrolled, any unit without a Transparency code will be rejected by Amazon's fulfillment centers or flagged to customers scanning via the Amazon Shopping app.

### 5.3 Code Generation

**Two code-generation paths:**

**Path A — Amazon-issued codes (standard):**
- You submit a request for a batch of codes via the Transparency portal or API
- Amazon generates unique alphanumeric codes and provides them as a downloadable dataset
- You (or your manufacturer) print and apply the codes to units
- Cost: $0.01–$0.05 per code (sliding scale; larger batches are cheaper)
- Lead time: Plan for 2–4 weeks minimum from code request to physical codes on shelves

**Path B — Interoperability (bring your own serialization):**
- You already have a serialization system (e.g., NFC tags, proprietary QR codes, GS1 serial numbers)
- You submit your serial numbers to Amazon via the Transparency API
- Amazon maps your serial numbers to Transparency verification — customers and associates verify using your codes
- Requires API integration and Amazon approval of your serialization format

**Transparency API overview (code generation):**
```
POST /transparency/2018-09-01/codes/orders
→ Request a batch of codes for an enrolled product

GET /transparency/2018-09-01/codes/orders/{orderId}
→ Check order status and download codes when ready

POST /transparency/2018-09-01/codes/verifications
→ Verify whether a code is authentic (used by 3P scanning apps)
```

### 5.4 Label & Workflow Integration

**Code label specs:**
- Minimum printable size: 10mm × 10mm
- Supported label types: QR code or Data Matrix
- Must be scannable in all lighting conditions
- Often co-printed with GS1 barcode, FNSKU label, or product label

**Typical factory integration flow:**
1. n8n workflow: 6 weeks before production run → POST to Transparency API for code batch
2. Factory receives code dataset (CSV) → prints codes on units during manufacturing
3. Units arrive at Amazon FBA → Amazon scans codes on receipt
4. Unscannable or unregistered codes → units quarantined and returned

**n8n workflow pattern:**
```json
{
  "nodes": [
    { "type": "Cron", "parameters": { "cronExpression": "0 9 * * MON" }},
    { "type": "HTTP Request", "parameters": {
      "url": "https://transparency.amazon.com/api/codes/orders",
      "method": "POST",
      "body": {
        "productGtin": "{{ $env.PRODUCT_GTIN }}",
        "quantity": "{{ $json.weekly_production_units }}",
        "productionDate": "{{ $now.plus(42, 'days').toISO() }}"
      }
    }},
    { "type": "Supabase", "parameters": { "operation": "insert", "table": "transparency_orders" }}
  ]
}
```

### 5.5 Per-Unit Cost Analysis

| Volume (units/year) | Approx. cost per code |
|---|---|
| < 10,000 | ~$0.05 |
| 10,000 – 100,000 | ~$0.03 |
| 100,000 – 500,000 | ~$0.02 |
| 500,000+ | ~$0.01 |

Break-even analysis: For most brands, Transparency pays for itself by eliminating even 1–2 counterfeit-driven negative review cascades or FBA return spikes per year.

---

## 6. Brand Tailored Promotions (BTP)

### 6.1 What BTP Is

Brand Tailored Promotions (BTP) let Brand Registry sellers create targeted discount promotions for specific customer audience segments — showing those customers a personalized discount on your product detail page, Brand Store, and in search results. Unlike Lightning Deals or Coupons (which are public), BTPs are shown only to the targeted audience segment.

**Where BTPs appear:** Product detail page, Brand Store pages, and Amazon search results (for qualifying audience members only).

### 6.2 Discount Mechanics

- Discount range: **10% to 50%** off your current selling price
- Promotion type: All BTPs are "Preferential" — if a customer qualifies for multiple Preferential promotions, Amazon automatically applies the **highest-value** discount
- No coupon code required — discount applies automatically at checkout
- Cannot be stacked with Subscribe & Save discounts
- Promotions run for up to **90 days** per campaign

### 6.3 Audience Segments

BTP offers highly targeted audience segments — far more precise than broadcast discounts:

| Audience | Description | Minimum Size |
|---|---|---|
| **Brand Followers** | Customers who have followed your brand | No minimum published |
| **Brand Customers — All** | Anyone who has purchased from your brand | ~500 |
| **High-Intent Shoppers** | Customers who recently viewed or searched your products but didn't purchase | Varies |
| **Recent Purchasers** | Customers who bought from you in the last 30–90 days | ~500 |
| **One-Time Customers** | Customers who have purchased from you exactly once | ~500 |
| **Lapsed Customers** | Previously loyal customers with no recent purchase | ~1,000 |
| **Cart Abandoners** (Cart Remarketing) | Added to cart but didn't complete purchase | Varies |
| **Views Remarketing** | Viewed your ASIN recently but didn't add to cart | Varies |
| **Repeat Customers** | Purchased from you 2+ times | ~500 |
| **Top Tier Customers** | Your highest-value repeat buyers | ~250 |

> ⚠️ If your audience segment is too small, BTP creation will fail with an error indicating the audience doesn't meet the minimum threshold. Build your follower base and sales volume before expecting all segment types to be available.

### 6.4 BTP Business Goal Framework (2026 Update)

When creating a BTP in 2026, you now select a **business goal** that determines which audience segments Amazon recommends:

| Goal | Recommended Audiences |
|---|---|
| New Customer Acquisition | High-Intent Shoppers, Views Remarketing, Potential Customers |
| Customer Retention | Repeat Customers, Top Tier Customers, Brand Followers |
| Re-engagement | Lapsed Customers, One-Time Customers, Cart Abandoners |
| Cross-sell | Recent Purchasers (of a specific ASIN) → promoted to different ASIN |

### 6.5 API Access

As of 2026, BTP does not yet have a fully-documented public SP-API endpoint for programmatic campaign creation. Management is primarily done via Seller Central → Brand Registry → Brand Tailored Promotions. Performance data is accessible via:

- Seller Central reporting dashboard (manual)
- Data Kiosk API (emerging — check the Brand Analytics schema for BTP metrics)

**Performance metrics available:**
- Impressions (how many audience members saw the promotion)
- Clicks (how many clicked through to the product)
- Units sold (attributed to the promotion)
- Revenue (attributed)
- Redemption rate

### 6.6 BTP Strategy for Automation

While full API creation isn't available yet, you can automate BTP performance monitoring:

```python
# n8n HTTP node: fetch BTP performance report
# Route: Seller Central → Reports → Promotions report

REPORT_TYPE = "GET_PROMOTION_PERFORMANCE_REPORT"

# Supabase schema to track BTP performance
BTP_SCHEMA = """
CREATE TABLE btp_performance (
  id SERIAL PRIMARY KEY,
  promotion_id TEXT NOT NULL,
  audience_type TEXT,
  asin TEXT,
  start_date DATE,
  end_date DATE,
  discount_pct NUMERIC(5,2),
  impressions INTEGER,
  clicks INTEGER,
  units_sold INTEGER,
  revenue NUMERIC(10,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
"""
```

---

## 7. Brand Follow

### 7.1 The Brand Follow Button

The Brand Follow button appears in two places:
1. Your **Brand Store** (storefront) — persistent "Follow" button in the header
2. **Sponsored Brand ads** — the "Follow" button can appear on video and headline ad formats

As of 2026, there are 20+ million active brand-follower relationships across Amazon. Brands with strong follower bases see measurably higher repeat purchase rates.

### 7.2 What Followers Receive

Followers don't get email notifications. Instead:
- Followers see your **Amazon Posts** appear in their personalized feed
- Followers are eligible for **Brand Tailored Promotions** targeted at the "Brand Followers" segment
- Followers may see your new product launches surfaced in Amazon's recommendation engine
- Amazon's internal engagement data shows brands with followers see ~34% higher repeat purchase rates vs. non-followed brands

### 7.3 Follower Count & Metrics

Follower counts are visible in:
- Seller Central → Brands → Brand Metrics → Brand Followers
- Amazon Ads API → Brand Metrics endpoint (programmatic)

**Brand Metrics API (Amazon Ads API, not SP-API):**
```
GET /brand-metrics/v1/brandMetrics
?startDate=2025-01-01&endDate=2025-01-31&amazonBrandId={brandId}
```
Returns: follower count, follower growth rate, customer engagement score (CES).

### 7.4 Strategies to Grow Followers

1. **Sponsored Brand ads with Follow format** — SB ads can display a "Follow" CTA; allocate budget specifically for follower acquisition campaigns
2. **Post consistently** — frequent, high-quality Posts drive organic follow actions from shoppers who discover your content
3. **Brand Store optimization** — a well-designed store with clear brand identity converts browser visits to follows
4. **Insert cards in FBA packaging** — "Follow us on Amazon for exclusive deals" (must not promise specific discounts in writing per Amazon's guidelines — keep the call to action generic)
5. **BTP for cart abandoners** — converting near-buyers into customers also converts them to eligible followers

---

## 8. Brand Analytics — Programmatic Deep Dive

### 8.1 Overview

Brand Analytics is the data intelligence layer of Brand Registry. It surfaces customer behavior data that would otherwise be opaque — what customers search, what they view alongside your products, what they buy repeatedly, and who they demographically are.

**Access path:**
- Seller Central: Reports → Brand Analytics (manual download)
- SP-API: Reports API with Brand Analytics report types
- SP-API: Data Kiosk API (GraphQL — the future of all analytics; not all ABA reports are in Data Kiosk yet)

**Role required:** You must have the **Brand Analytics Selling Partner API role** enabled in your SP-API application. This is separate from the Listings and Orders roles — request it in your developer profile.

### 8.2 Reports API — Brand Analytics Report Types

All reports below use the standard Reports API async flow (createReport → poll → download):

| Report Type Constant | Description | Periods | Notes |
|---|---|---|---|
| `GET_BRAND_ANALYTICS_MARKET_BASKET_REPORT` | Items most frequently purchased together with your products | DAY, WEEK, MONTH, QUARTER | Shows top 3 co-purchased ASINs |
| `GET_BRAND_ANALYTICS_SEARCH_TERMS_REPORT` | Search terms driving clicks to your ASINs (like SQP but older format) | WEEK, MONTH, QUARTER | Superseded by SQP for search data |
| `GET_BRAND_ANALYTICS_REPEAT_PURCHASE_REPORT` | Repeat purchase rate per ASIN | WEEK, MONTH, QUARTER | Key LTV proxy |
| `GET_BRAND_ANALYTICS_ITEM_COMPARISON_REPORT` | ASINs most commonly viewed or bought instead of yours | DAY, WEEK, MONTH, QUARTER | Competitive intelligence |
| `GET_BRAND_ANALYTICS_ALTERNATE_PURCHASE_REPORT` | What customers buy instead of (or after viewing) your ASIN | DAY, WEEK, MONTH, QUARTER | Same as item comparison, different angle |
| `GET_BRAND_ANALYTICS_DEMOGRAPHICS_REPORT` | Demographic breakdown of your brand buyers | QUARTER | Age, gender, income, education, marital status |
| `GET_SEARCH_QUERY_PERFORMANCE_REPORT` | SQP — impressions, clicks, cart adds, purchases per search query | WEEK, MONTH | Requires `reportPeriod` option. Launched Feb 2025 via API |

**Creating a report via SP-API:**
```python
def create_brand_analytics_report(report_type, marketplace_id, start_date, end_date, report_period, access_token):
    url = "https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports"
    
    payload = {
        "reportType": report_type,
        "marketplaceIds": [marketplace_id],
        "dataStartTime": start_date,  # ISO 8601: "2025-01-01T00:00:00Z"
        "dataEndTime": end_date,
        "reportOptions": {
            "reportPeriod": report_period  # "WEEK", "MONTH", "QUARTER"
        }
    }
    
    headers = {
        "x-amz-access-token": access_token,
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, headers=headers, json=payload)
    return response.json()["reportId"]
```

### 8.3 Share of Voice (SOV) / Search Query Performance (SQP) Deep Dive

SQP is the most powerful dataset in Brand Analytics for competitive intelligence. Available programmatically via SP-API since February 25, 2025.

**What SQP measures:**

| Column | Definition | How to Use |
|---|---|---|
| `searchQueryScore` | Importance of this query to your brand (Amazon's proprietary rank) | Prioritize highest-score queries for content and PPC |
| `brandImpressionShare` | % of total impressions for this query that were your ASINs | Your visibility; below 30% = opportunity |
| `brandClickShare` | % of total clicks for this query that went to your ASINs | Your CTR competitiveness |
| `brandCartAddShare` | % of cart adds for this query going to your ASINs | Intent-to-purchase signal |
| `brandPurchaseShare` | % of purchases for this query going to your ASINs | Your actual conversion market share |

**Interpreting share data:**
- **High impression share, low click share** → Your listings appear but aren't compelling enough to click (main image or title problem)
- **High click share, low purchase share** → Customers click but don't convert (price, reviews, detail page problem)
- **Competitor's purchase share spike on a query you ranked on** → A competitor improved their listing or ran promotions on that term

**SQP report options:**
```python
# reportOptions for GET_SEARCH_QUERY_PERFORMANCE_REPORT
{
    "reportPeriod": "WEEK",       # Required: WEEK or MONTH
    "asinGranularity": "PARENT",  # PARENT or CHILD
    "reportLevel": "BRAND"        # BRAND or ASIN
}
```

### 8.4 Repeat Purchase Behaviour Report

**Purpose:** Measure customer loyalty and LTV potential per ASIN.

**Key metrics:**
- **Repeat Purchase Rate** — % of orders for this ASIN that are the 2nd+ purchase by the same customer
- **Subscription Rate** — % of orders that chose Subscribe & Save
- **Repeat Purchase Revenue %** — what % of this ASIN's total revenue comes from repeat buyers

**How to use:**
- ASINs with high repeat purchase rates are your LTV anchors — protect their reviews, pricing, and A+ content
- ASINs with low repeat rates despite strong initial sales signal quality issues (customers try once, don't return)
- Subscription rate is a proxy for consumable product satisfaction — above 15% is strong

### 8.5 Demographics Report

**Granularity:** Available quarterly only (not more frequent).

**Data points:**
- Age ranges: 18–24, 25–34, 35–44, 45–54, 55–64, 65+
- Household income brackets: <$25k, $25–50k, $50–75k, $75–100k, $100–150k, $150k+
- Education: Less than high school, High school diploma, Some college, Bachelor's, Graduate degree
- Gender: Male, Female
- Marital status: Single, Married/partnered

**How to use for content targeting:**
- If 60% of buyers are 45–54, use lifestyle imagery showing that age group
- If majority are high-income ($100k+), don't compete on price — differentiate on quality and brand story
- If primarily female buyers, ensure A+ content and imagery skews toward that demographic
- Demographics also inform Sponsored Display audience targeting (match your Sponsored Display audiences to your actual buyer profile)

### 8.6 Item Comparison & Alternate Purchase Report

**Item Comparison:** Shows the top 3–5 ASINs most frequently viewed on the same shopping session as your ASIN. These are your true competitors — not just category neighbors, but the specific alternatives customers are actively evaluating.

**Alternate Purchase:** Shows what customers actually bought when they didn't buy your ASIN.

**Programmatic access:**
```python
# Report type: GET_BRAND_ANALYTICS_ITEM_COMPARISON_REPORT
# Returns per-ASIN: up to 5 competitor ASINs with comparison frequency rank

# Automation use case: track weekly — alert when a new competitor appears in your top 3
def track_competitor_changes(current_week_data, previous_week_data):
    new_competitors = set(current_week_data.keys()) - set(previous_week_data.keys())
    if new_competitors:
        trigger_alert(f"New competitors entering comparison set: {new_competitors}")
```

### 8.7 Data Kiosk API — The Future of Brand Analytics

Amazon is migrating all analytics data to the **Data Kiosk API** (GraphQL-based). The Reports API for analytics is still available but won't receive new report types — all new data will be accessible only via Data Kiosk.

**Key characteristics:**
- Uses GraphQL for dynamic, custom queries
- Results in JSONL format (one JSON object per line)
- Interactive Schema Explorer at `developer-docs.amazon.com/sp-api/docs/schema-explorer-guide`
- Supports more granular filtering than the Reports API

**Data Kiosk query example:**
```graphql
query SalesAndTraffic {
  analytics_salesAndTraffic_2024_11_01 {
    salesAndTrafficByDate(
      startDate: "2025-01-01"
      endDate: "2025-01-31"
      aggregateBy: CHILD
      marketplaceIds: ["ATVPDKIKX0DER"]
    ) {
      startDate
      endDate
      asin
      sales {
        orderedProductSales { amount currencyCode }
        orderedProductSalesB2B { amount currencyCode }
        unitsOrdered
      }
      traffic {
        sessions
        pageViews
        buyBoxPercentage
        unitSessionPercentage
      }
    }
  }
}
```

**Data Kiosk workflow:**
```
1. POST /dataKiosk/2023-11-15/queries    (submit GraphQL query)
   → Returns queryId

2. GET /dataKiosk/2023-11-15/queries/{queryId}
   → Poll until processingStatus = "DONE"

3. GET /dataKiosk/2023-11-15/documents/{documentId}
   → Get the JSONL download URL

4. Download JSONL → parse line by line
```

---

## 9. Amazon Posts

### 9.1 What Amazon Posts Are

Posts are organic, social-media-style content cards that appear on Amazon. They display on:
- Your own product detail pages (in a Posts feed below A+ content)
- Competitor product detail pages (when Amazon deems them relevant)
- Category feeds (shoppers browsing by category see Posts from brands in that category)
- Your Brand Store feed

Posts are **free** — there's no pay-per-click model. They function like organic Instagram posts, but on Amazon.

### 9.2 Content Requirements & Restrictions

**Must include:**
- At least one product tag (linking to an ASIN)
- A relevant brand image (your product in context, lifestyle, or use-case photography)
- A caption

**Prohibited:**
- Price or promotional claims ("$29.99", "30% off", "limited time deal")
- External URLs or links
- Amazon branding or Amazon Prime logo
- Time-sensitive claims ("today only", "this week")
- Competitor product mentions
- Low-quality, blurry, or heavily text-overlaid images

### 9.3 Image Specifications

| Spec | Requirement |
|---|---|
| Formats | JPEG, PNG |
| Recommended aspect ratio | Square (1:1), Portrait 4:5, or 9:16 vertical (mobile-first) |
| Minimum resolution | 640×640 px |
| Recommended resolution | 1080×1080 px or higher |
| Maximum file size | 10MB |

> **Best practice:** 9:16 vertical images perform best on mobile (where most Amazon browsing happens). Use lifestyle photography showing the product in use. Avoid white-background studio shots — those are for your main listing images.

### 9.4 Performance Metrics

| Metric | Definition |
|---|---|
| Impressions | Number of times the Post was displayed |
| Clicks | Number of clicks on the Post card |
| Engagement rate | Clicks / Impressions |
| Click-through to product | Clicks that resulted in a product detail page visit |
| Follows driven | Brand Follow actions attributed to this Post |

### 9.5 Posts API

The Posts API allows publishing and scheduling Posts programmatically. It enables third-party tools to manage Amazon Posts on behalf of brands — without requiring the user to log into Seller Central.

**Key capability:** Schedule Posts in advance via API, enabling editorial calendars and automated drip publishing.

**Base endpoint:** `https://sellingpartnerapi-na.amazon.com/posts/2023-10-01/posts`

**Create a Post:**
```json
POST /posts/2023-10-01/posts
{
  "marketplaceId": "ATVPDKIKX0DER",
  "brandEntityId": "ENTITY1234567",
  "contentType": "DEFAULT",
  "caption": "Meet the product that changed our morning routine. Built for performance, made to last.",
  "asins": ["B001234567"],
  "contentImageUrls": [
    "https://your-cdn.com/images/post-hero-jan.jpg"
  ],
  "scheduledDate": "2026-06-01T09:00:00Z"
}
```

**Retrieve Posts:**
```
GET /posts/2023-10-01/posts?marketplaceId=ATVPDKIKX0DER&brandEntityId=ENTITY1234567
```

**n8n automation pattern:** Weekly content calendar → auto-publish scheduled Posts on Monday/Wednesday/Friday for consistent brand presence.

### 9.6 Publishing Cadence Guidance

- **Minimum:** 2 Posts/week to stay active in category feeds
- **Optimal:** 4–5 Posts/week for brands with large catalogs or frequent new arrivals
- **Avoid:** Posting the same image multiple times — Amazon may suppress duplicate content
- Repurpose Instagram and TikTok content (check aspect ratios), but strip price/promo callouts

---

## 10. Brand Store API (GA February 2026)

### 10.1 Overview

Amazon Brand Stores (storefronts) are multi-page, branded shopping destinations on Amazon, accessible via a clean URL (`amazon.com/stores/YourBrandName`). They function like a mini brand website within Amazon.

The **Brand Store API** exited beta and reached **General Availability in February 2026**, enabling programmatic management of storefront content at scale for the first time.

### 10.2 What the API Enables

- Retrieve current store structure (pages, sections, modules)
- Update product selection and content in store pages
- Create and modify store page layouts
- Submit store updates for Amazon moderation
- Retrieve store performance metrics

**Note:** The API enables content updates and structural changes, but a Brand Store must first be created in Stores Builder UI before it can be managed programmatically. The API cannot create a brand-new store from scratch.

### 10.3 Store Structure

A Brand Store consists of:

```
Store (root)
├── Home page (required, always the landing page)
├── Category pages (organize by product line, use case, etc.)
├── Product grid pages (curated product collections)
├── Featured Deals page (optional, time-limited)
└── Custom pages (any layout: shoppable images, editorial, etc.)
```

**Page types:**
| Page Type | Use Case |
|---|---|
| `HOME` | Main brand landing page — hero image, featured products, brand story |
| `PRODUCT_GRID` | Curated product collection with filtering |
| `FEATURED_DEALS` | Time-limited offers (links dynamically to active promotions) |
| `CUSTOM` | Fully custom layout — shoppable images, lifestyle editorial |
| `CATEGORY` | Sub-brand or product line sub-page |

### 10.4 API Reference

**Base:** Amazon Ads API (not SP-API) — `https://advertising.amazon.com/API/`

**Brand Store endpoints:**
```
GET    /brand-stores/v1/stores/{brandEntityId}
→ Get store structure and pages

GET    /brand-stores/v1/stores/{brandEntityId}/pages
→ List all pages

PUT    /brand-stores/v1/stores/{brandEntityId}/pages/{pageId}
→ Update a page's content and layout

POST   /brand-stores/v1/stores/{brandEntityId}/submissions
→ Submit updated store for moderation

GET    /brand-stores/v1/stores/{brandEntityId}/insights
→ Retrieve performance metrics
```

### 10.5 Store Insights Metrics

Brand Store analytics underwent a major upgrade in January 2026 with **section-level performance metrics** (beta):

| Metric | Level | Definition |
|---|---|---|
| Visits | Page | Unique visitors to a specific page |
| Page views | Page | Total page views (one visitor can generate multiple) |
| Sales | Page | Revenue attributed to sessions that included this page |
| Units sold | Page | Units ordered attributed to this page |
| Section renders | Section | How many times a specific section loaded |
| Viewable impressions | Section | How many times the section was actually seen (not just loaded) |
| Section clicks | Section | Clicks on any element within the section |
| Section CTR | Section | Clicks / Viewable Impressions |

**API access for store metrics:**
```
GET /brand-store/insight-metrics
?startDate=2026-01-01
&endDate=2026-03-31
&pageId={pageId}
&sectionId={sectionId}        # Optional — for section-level
&metricType=VIEWABLE_IMPRESSIONS
&aggregationLevel=DAILY
```

### 10.6 Automation Use Cases

1. **Seasonal refresh automation:** Trigger store page updates via n8n when specific dates arrive (holiday seasons, Prime Day, Back to School)
2. **Inventory-aware content:** Automatically swap featured products on the home page based on FBA stock levels (if hero product is OOS, swap to next-best-seller)
3. **A/B testing store layouts:** Rotate different page configurations monthly and compare sales attribution via metrics API
4. **Multi-marketplace sync:** Update the same store across US, UK, DE simultaneously via API

---

## 11. Manage Your Experiments (MYE / A/B Testing)

### 11.1 What MYE Is

Manage Your Experiments is Amazon's native A/B testing platform, built into Seller Central and accessible via SP-API. It lets brand owners test different versions of content elements to determine which drives higher conversions, and shows the results with statistical significance indicators.

**How it works:** Amazon randomly splits eligible product detail page visitors into two groups — Group A (current/control content) and Group B (variant content). After sufficient data accumulates, MYE calculates which version performed better and indicates statistical confidence.

### 11.2 What You Can Test

| Element | Notes |
|---|---|
| **Main product image** | Primary image (slot 1) — highest impact test type |
| **Product title** | Full title string — test keyword placement, benefit emphasis, length |
| **Bullet points** | Test order, content emphasis, specific claims |
| **Product description** | Plain text description below bullet points |
| **A+ Content** | Test entire A+ documents against each other |
| **Brand Story** | Test different Brand Story carousel configurations |
| **Multi-attribute experiments** | Test title + image simultaneously (available as of 2025) |

### 11.3 Eligibility Requirements

- Professional selling account
- Brand Representative role (not Brand Agent or Admin-only)
- The ASIN must have sufficient traffic (Amazon doesn't publish the exact minimum, but ~50 sessions/week is a practical floor)
- ASIN must be enrolled in Brand Registry
- Must have at least one approved A+ content piece to unlock MYE

### 11.4 Statistical Significance & Reading Results

Amazon uses a 90% confidence threshold for declaring a winner. Results display:

| Status | Meaning |
|---|---|
| "Winner Found" | One version has 90%+ confidence of being better |
| "No Preference" | Neither version performed significantly differently |
| "Learning" | Insufficient data — run longer |
| "Paused" | Experiment paused (often due to price change or suppression) |

**Metrics reported:**
- Units sold per unique visitor
- Units sold (total)
- Revenue (total)
- Conversion rate (units / sessions)
- Sample size per variant

**Caution:** Don't end an experiment prematurely — peeking at results and stopping early inflates false positive rates. Run for at least 4–6 weeks minimum, or until MYE declares a winner, whichever comes first.

### 11.5 AI-Powered Suggestions

As of 2025, MYE offers **ML-based content suggestions** for title and A+ experiments, derived from patterns in successful experiments on similar products. These suggestions are available in the experiment creation flow but are not accessible via API.

### 11.6 Programmatic Experiment Management (API)

MYE is accessible via the **Manage Your Experiments API** in SP-API.

**Endpoints:**
```
GET  /experiments/2021-11-01/experiments
→ List all experiments for a brand

POST /experiments/2021-11-01/experiments
→ Create a new experiment

GET  /experiments/2021-11-01/experiments/{experimentId}
→ Get experiment details and current status

PUT  /experiments/2021-11-01/experiments/{experimentId}
→ Update experiment parameters (e.g., extend end date)

POST /experiments/2021-11-01/experiments/{experimentId}/publishExperimentVariant
→ Publish the winning variant to production

GET  /experiments/2021-11-01/experiments/{experimentId}/results
→ Get experiment results and significance
```

**Creating an experiment via API:**
```json
POST /experiments/2021-11-01/experiments
{
  "startDate": "2026-06-01",
  "endDate": "2026-07-31",
  "type": "TITLE",
  "name": "Title Test: Keyword-First vs Benefit-First",
  "asin": "B001234567",
  "variants": [
    {
      "type": "CONTROL",
      "content": {
        "title": "MyBrand Widget Pro - Professional Grade Tool for Advanced Users"
      }
    },
    {
      "type": "TREATMENT",
      "content": {
        "title": "Professional Grade Tool for Advanced Users | MyBrand Widget Pro"
      }
    }
  ]
}
```

### 11.7 Experiment Tracking in Supabase

```sql
CREATE TABLE mye_experiments (
  id SERIAL PRIMARY KEY,
  experiment_id TEXT UNIQUE NOT NULL,
  asin TEXT NOT NULL,
  experiment_type TEXT,           -- TITLE, MAIN_IMAGE, A_PLUS, etc.
  name TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT,                    -- RUNNING, WINNER_FOUND, NO_PREFERENCE
  winner_variant TEXT,            -- CONTROL or TREATMENT
  control_content JSONB,
  treatment_content JSONB,
  confidence_level NUMERIC(5,2),
  control_conversion_rate NUMERIC(8,5),
  treatment_conversion_rate NUMERIC(8,5),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 12. Project Zero — Brand Protection

### 12.1 What Project Zero Is

Project Zero is Amazon's premium brand protection program that gives enrolled brands three capabilities:

1. **Automated Protections Engine** — Amazon's AI proactively scans and blocks suspected counterfeits before they go live
2. **Self-Service Counterfeit Removal** — Brands remove confirmed counterfeit listings directly, without submitting a report and waiting for Amazon's investigation team
3. **Product Serialization** — Integration with the Transparency program to verify unit authenticity

**Cost:** Free for enrolled brands. No subscription or per-removal fee.

### 12.2 Automated Protections Engine

Amazon's machine learning model scans **5+ billion product listings daily** to proactively identify counterfeits. The model learns from:
- Your brand's trademark, logos, and product images (submitted during enrollment)
- Historical enforcement actions on your brand
- Pattern recognition across similar counterfeit listings globally

**Effectiveness:** Amazon claims 99%+ of suspected counterfeits are blocked before they go live. The remaining <1% require manual action via the self-service tool.

### 12.3 Self-Service Counterfeit Removal

Unlike the standard "Report a Violation" (RaV) process — which requires Amazon's IP team to review and act, taking days to weeks — Project Zero allows immediate self-service removal.

**Process:**
1. Brand Registry → Protect → Project Zero
2. Search for the infringing listing (by ASIN, URL, or search term)
3. Click "Remove" on confirmed counterfeits
4. The listing is immediately removed

**Usage limits:** Amazon monitors removal accuracy. If your false-positive rate (removing legitimate listings) exceeds a threshold, your self-service removal access is suspended pending review. Don't abuse this tool.

### 12.4 Project Zero API

Project Zero counterfeit reporting is accessible programmatically via the **Brand Registry Counterfeit Removal API** (not the same as the self-service UI):

```
POST /brand-registry/2021-09-10/counterfeit-report
{
  "infringingAsin": "B00FAKE1234",
  "violationType": "COUNTERFEIT",
  "brandName": "MyBrand",
  "evidence": {
    "description": "Unit purchased and compared against authentic product. Serial number missing.",
    "imageUrls": ["https://your-cdn.com/evidence/comparison-photo.jpg"]
  }
}
```

> ⚠️ The API submits a report for review — it does not give you instant removal in the way the UI self-service tool does. For instant removal, the Seller Central UI is currently the only path.

### 12.5 Eligibility for Project Zero

As of 2026, Project Zero enrollment is broadly available (no longer invite-only) to brands that:
- Are enrolled in Amazon Brand Registry with an approved trademark
- Have a demonstrated history of using Brand Registry's standard protection tools (RaV)
- Have not had their Brand Registry access restricted for abuse

---

## 13. Brand Registry Monitoring Dashboard — Supabase + n8n

### 13.1 Architecture Overview

A complete monitoring system for Brand Registry data tracks A+ content status, experiment outcomes, Share of Voice over time, and brand protection events. This section provides the Supabase schema and n8n ingestion patterns.

```
n8n (orchestrator)
  ├── Weekly: Fetch SQP report → Supabase
  ├── Daily:  Fetch A+ publish status per ASIN → Supabase
  ├── Weekly: Fetch Item Comparison report → Supabase
  ├── Weekly: Fetch Repeat Purchase report → Supabase
  ├── Daily:  Fetch Brand Store metrics → Supabase
  ├── On-trigger: Log brand protection events → Supabase
  └── Weekly: Check MYE experiment status → Supabase
```

### 13.2 Supabase Schema

```sql
-- A+ Content status tracking
CREATE TABLE aplus_status (
  id SERIAL PRIMARY KEY,
  asin TEXT NOT NULL,
  marketplace_id TEXT NOT NULL,
  content_reference_key TEXT,
  content_type TEXT,              -- STANDARD or BRAND_STORY
  status TEXT,                    -- DRAFT, IN_REVIEW, APPROVED, PUBLISHED, REJECTED
  rejection_reasons JSONB,
  last_updated TIMESTAMPTZ,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asin, marketplace_id, content_type)
);

-- Share of Voice (SQP) tracking
CREATE TABLE sqp_weekly (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  marketplace_id TEXT NOT NULL,
  asin TEXT,
  brand_name TEXT,
  search_query TEXT NOT NULL,
  brand_impression_share NUMERIC(8,5),
  brand_click_share NUMERIC(8,5),
  brand_cart_add_share NUMERIC(8,5),
  brand_purchase_share NUMERIC(8,5),
  total_impressions BIGINT,
  total_clicks BIGINT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_start, marketplace_id, asin, search_query)
);

-- Competitor tracking (from Item Comparison report)
CREATE TABLE competitor_comparison (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  report_period TEXT,             -- WEEK, MONTH
  your_asin TEXT NOT NULL,
  competitor_asin TEXT NOT NULL,
  comparison_rank INTEGER,        -- 1 = most frequently co-viewed
  marketplace_id TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repeat purchase tracking
CREATE TABLE repeat_purchase (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  asin TEXT NOT NULL,
  marketplace_id TEXT NOT NULL,
  repeat_purchase_rate NUMERIC(8,5),
  subscription_rate NUMERIC(8,5),
  unique_customers INTEGER,
  total_orders INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand protection events
CREATE TABLE brand_protection_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,       -- COUNTERFEIT, LISTING_HIJACK, IP_COMPLAINT
  infringing_asin TEXT,
  status TEXT,                    -- REPORTED, REMOVED, UNDER_REVIEW
  reported_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- MYE experiment results (referenced in Section 11)
-- See Section 11.7 for schema
```

### 13.3 n8n Ingestion Patterns

**SQP weekly ingestion:**
```json
[
  { "type": "Cron", "cron": "0 6 * * MON" },
  {
    "type": "HTTP Request",
    "method": "POST",
    "url": "https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports",
    "body": {
      "reportType": "GET_SEARCH_QUERY_PERFORMANCE_REPORT",
      "marketplaceIds": ["ATVPDKIKX0DER"],
      "dataStartTime": "={{ $now.minus(7, 'days').startOf('week').toISO() }}",
      "dataEndTime": "={{ $now.minus(1, 'days').toISO() }}",
      "reportOptions": { "reportPeriod": "WEEK" }
    }
  },
  { "type": "Wait", "seconds": 300 },
  { "type": "HTTP Request", "url": "...poll for reportId..." },
  { "type": "HTTP Request", "url": "...download report document..." },
  {
    "type": "Supabase",
    "operation": "upsert",
    "table": "sqp_weekly",
    "conflictColumns": ["week_start", "marketplace_id", "asin", "search_query"]
  }
]
```

**A+ status daily check:**
```json
[
  { "type": "Cron", "cron": "0 8 * * *" },
  {
    "type": "HTTP Request",
    "url": "https://sellingpartnerapi-na.amazon.com/aplus/2020-11-01/contentDocuments",
    "params": { "marketplaceId": "ATVPDKIKX0DER", "contentType": "STANDARD" }
  },
  { "type": "Code", "code": "// check for status changes vs previous record" },
  {
    "type": "If",
    "condition": "{{ $json.status === 'REJECTED' }}",
    "true": [{ "type": "Slack", "message": "A+ content rejected for ASIN {{ $json.asin }}: {{ $json.rejectionReasons }}" }]
  },
  { "type": "Supabase", "operation": "upsert", "table": "aplus_status" }
]
```

### 13.4 SoV Trend Alerting

```sql
-- Alert when click share drops by 20%+ week-over-week on a top query
SELECT 
  current_week.search_query,
  current_week.brand_click_share AS current_click_share,
  prev_week.brand_click_share AS prev_click_share,
  ROUND((current_week.brand_click_share - prev_week.brand_click_share) / prev_week.brand_click_share * 100, 1) AS pct_change
FROM sqp_weekly current_week
JOIN sqp_weekly prev_week 
  ON current_week.search_query = prev_week.search_query
  AND current_week.marketplace_id = prev_week.marketplace_id
  AND prev_week.week_start = current_week.week_start - INTERVAL '7 days'
WHERE current_week.week_start = CURRENT_DATE - (CURRENT_DATE - DATE_TRUNC('week', CURRENT_DATE))::int
  AND ((current_week.brand_click_share - prev_week.brand_click_share) / NULLIF(prev_week.brand_click_share, 0)) < -0.20
ORDER BY pct_change ASC;
```

---

## 14. API Rate Limits & Access Tiers

### 14.1 A+ Content API Rate Limits

| Operation | Rate (req/sec) | Burst |
|---|---|---|
| `searchContentDocuments` | 1 | 5 |
| `createContentDocument` | 1 | 5 |
| `getContentDocument` | 1 | 5 |
| `updateContentDocument` | 1 | 5 |
| `listContentDocumentAsinRelations` | 1 | 5 |
| `postContentDocumentAsinRelations` | 1 | 5 |
| `validateContentDocumentAsinRelations` | 1 | 5 |
| `postContentDocumentApprovalSubmission` | 1 | 5 |
| `searchContentPublishRecords` | 1 | 5 |

### 14.2 Brand Analytics Reports Rate Limits

| Operation | Rate (req/sec) | Burst |
|---|---|---|
| `createReport` (all types) | 0.0167 (~1/min) | 15 |
| `getReport` | 2 | 15 |
| `getReportDocument` | 0.0167 | 15 |

### 14.3 Data Kiosk Rate Limits

| Operation | Rate (req/sec) | Burst |
|---|---|---|
| `createQuery` | 0.0222 (~1.3/min) | 2 |
| `getQuery` | 1 | 5 |
| `cancelQuery` | 0.0222 | 2 |
| `getDocument` | 0.0222 | 2 |

### 14.4 Brand Store API Rate Limits (Advertising API)

| Operation | Rate | Notes |
|---|---|---|
| Store reads | 1 req/sec | Standard advertising API limits apply |
| Store submissions | 1 per 5 minutes | Amazon's moderation queue throttle |

### 14.5 Which Endpoints Require Brand Registry

| API / Feature | Brand Registry Required? | Additional Requirement |
|---|---|---|
| A+ Content API | ✅ Required | Brand Rep role |
| Brand Analytics Reports | ✅ Required | Brand Analytics SP-API role |
| Data Kiosk Analytics schemas | ✅ Required (for brand schemas) | Brand Analytics role |
| Manage Your Experiments API | ✅ Required | At least 1 approved A+ first |
| Virtual Products API (Bundles) | ✅ Required | FBA enrolled ASINs |
| Brand Store API | ✅ Required | Store must exist first |
| Posts API | ✅ Required | Brand entity ID required |
| Transparency API | ✅ + Separate enrollment | Per-product enrollment |
| Project Zero | ✅ + Separate enrollment | Clean enforcement history |
| Brand Tailored Promotions | ✅ Required | Minimum audience sizes |

### 14.6 SP-API Pricing (2026)

Since January 31, 2026, SP-API has a paid tier for third-party developers:

| Tier | Annual Fee | Monthly GET calls included | Overage |
|---|---|---|---|
| Basic | $1,400/year | 2.5 million | Per-call pricing above threshold |
| Standard | Negotiated | Higher included volume | Negotiated |

**Does not apply to:** Sellers accessing their own account via a private application (self-use). Fees apply to developers building tools used by multiple sellers.

---

## 15. Common Pitfalls

### 15.1 A+ Content Pitfalls

**Pitfall 1: Applying A+ to child ASINs directly**
You cannot apply A+ content to child (variation) ASINs. Apply it to the **parent ASIN** only — children inherit it automatically. Attempting to apply to a child ASIN returns an error about ASIN eligibility.

**Pitfall 2: Image dimensions don't match the module**
Every A+ module has specific image dimension requirements. Using an image from your product gallery (1000×1000 px square) in a hero banner module (which expects 1464×600 px landscape) will either fail validation or produce a distorted, cropped result. Pre-generate correctly dimensioned images for every module type.

**Pitfall 3: Reusing gallery images triggers rejection**
Amazon's moderation system detects when A+ images are duplicates of images already in your product's image gallery. Use unique images created specifically for A+.

**Pitfall 4: "Best in class" and superlative language**
Words like "best," "#1," "superior," "world's only," "most effective," and "proven" trigger automatic rejection. Amazon requires superlatives to be substantiated by verifiable third-party data — and even then, moderation often rejects them. Write factual, feature-focused copy instead.

**Pitfall 5: Submitting to too many ASINs at once**
If you bulk-link a document to 1,000 ASINs and the document gets rejected, all 1,000 links need to be re-submitted after fixing. Test with 3–5 ASINs first, get approval, then bulk-apply.

### 15.2 Premium A+ Pitfalls

**Pitfall 6: Brand Story not on ALL ASINs**
Premium A+ requires Brand Story on every active parent ASIN in your enrolled brand. Brands with hundreds of ASINs often miss inactive or recently launched ASINs. Build an automated check: query all active ASINs → cross-reference against published Brand Stories → flag gaps.

**Pitfall 7: Counting toward the 15-project threshold before verification**
The 15 approved A+ projects must be **approved in the past 12 months**, not just published at any time. Projects older than 12 months don't count. If you're close to the threshold but don't have access yet, check whether older projects have aged out.

### 15.3 Transparency Pitfalls

**Pitfall 8: Lead time underestimation**
Ordering Transparency codes takes time (1–2 weeks for batch generation), shipping to manufacturer takes time, applying codes during production takes time, and then the product ships to Amazon. Minimum lead time from "order codes" to "codes on units at Amazon": 6–10 weeks. Plan around your production schedule, not your restock date.

**Pitfall 9: Partial enrollment**
If even one production run of an enrolled product ships without codes, those units will be rejected at Amazon's receiving facility. There is no "grandfathering" older inventory once you're enrolled.

### 15.4 Brand Tailored Promotions Pitfalls

**Pitfall 10: Audience too small**
Amazon requires minimum audience sizes for each segment type. New brands with few followers, few purchases, and low traffic will find most BTP segment types unavailable. Focus on growing sales volume and followers before relying on BTP as a core strategy.

**Pitfall 11: BTP stacking with coupons**
BTPs stack with regular coupons (they're different promotion types). A customer with an active coupon AND a BTP discount gets both. This can result in effective discounts far beyond what you intended — audit your active promotions before creating BTPs.

### 15.5 MYE Pitfalls

**Pitfall 12: Peeking and stopping early**
Ending an experiment after a few days because "Treatment is clearly winning" introduces false positives. Statistical significance requires adequate sample sizes. Run for a minimum of 4 weeks or until MYE declares a result.

**Pitfall 13: Testing during anomalous periods**
Running a title experiment during Prime Day or a major promotional period corrupts the results — conversion rate spikes from deal-seeking behavior are not representative of organic performance. Pause experiments during major sale events.

### 15.6 General Brand Registry Pitfalls

**Pitfall 14: Marketplace isolation assumption**
A+ content, Stores, and Brand Stories are marketplace-specific. A team that successfully builds out all Brand Registry assets in the US assumes they're done — but EU and JP marketplaces each need their own independent content build-out, in the local language.

**Pitfall 15: Trademark correspondent access**
Amazon sends the Brand Registry verification code to the trademark correspondent on file with the trademark office — usually your IP attorney. If your attorney has changed, left the firm, or uses a generic email that is no longer monitored, you will not receive the verification code and enrollment will fail. Verify this contact point before submitting.

---

## 16. Dos & Don'ts

### ✅ DO

- **DO** read the `amazon-sp-api.md` reference before integrating with Brand Registry APIs — authentication, rate limiting, and error handling apply identically
- **DO** always validate A+ content documents via `validateContentDocumentAsinRelations` before submitting — a pre-validation call that saves you from rejection cycles
- **DO** test A+ content on 3–5 ASINs before bulk-applying to your full catalog — validate approval first
- **DO** track Brand Story publication status per ASIN in Supabase — ensuring 100% coverage is a recurring operational task, not a one-time setup
- **DO** pull the Item Comparison report weekly — your competitive landscape shifts faster than you think, and a new competitor appearing in your top 3 is an early warning signal
- **DO** use the SQP report to calculate click share week-over-week — a 20%+ drop on a key query is a lagging indicator of a PDP or pricing problem
- **DO** set up automated alerting for A+ content rejections — moderation can reject published content retroactively (rare, but happens)
- **DO** monitor your repeat purchase rate quarterly — it's one of the most reliable signals of product-market fit and post-launch quality
- **DO** create targeted BTPs for Lapsed Customers as a win-back strategy — cheaper than acquiring new customers
- **DO** request Transparency codes 8+ weeks before production — lead time is the most common operational failure point
- **DO** run MYE tests for at least 4 weeks before interpreting results — statistical confidence requires sample volume
- **DO** use the Demographics report quarterly to validate your creative assumptions — your actual buyer may be demographically different from your intended buyer
- **DO** use Data Kiosk for all new analytics work — the Reports API is legacy; all new Brand Analytics data will land in Data Kiosk only

### ❌ DON'T

- **DON'T** use price claims, superlatives ("best," "#1"), warranty claims, or competitor comparisons in A+ content — these are the most common rejection triggers and Amazon moderation catches them consistently
- **DON'T** apply A+ content to child ASINs — always target the parent ASIN; children inherit automatically
- **DON'T** assume Premium A+ access is permanent — if your Brand Story coverage drops below 100% of your catalog ASINs, Premium eligibility can be revoked
- **DON'T** submit A+ bulk updates to your entire catalog simultaneously — if rejected, you must fix and re-submit at scale; batch in groups of 10–20 for risk management
- **DON'T** rely on SQP data older than 60 days for decision-making — keyword trends shift with seasonality and competitor behavior
- **DON'T** use the Project Zero self-service removal tool aggressively or against listings you're uncertain about — false removals (removing legitimate competing listings) will get your self-service access suspended
- **DON'T** order Transparency codes for your next production run without accounting for 6–10 weeks of lead time — running out of codes = manufacturing stoppage or FBA receiving failures
- **DON'T** ignore the Alternate Purchase report — when customers are consistently buying a competitor instead of you, that's an actionable conversion problem, not a traffic problem
- **DON'T** run MYE experiments during Prime Day, Black Friday, or major promotional events — deal-driven traffic patterns contaminate the test and produce misleading results
- **DON'T** assume Brand Registry features work identically in every marketplace — A+ module support, BTP availability, and Brand Story requirements can vary by marketplace
- **DON'T** let your Brand Store sit unchanged for 6+ months — stale content signals brand inactivity to Amazon's algorithm; seasonal refreshes also drive incremental traffic
- **DON'T** skip checking BTPs against active coupon promotions — unintentional stacking can result in giving away far more margin than intended

---

## 17. Useful Links

| Resource | URL |
|---|---|
| Brand Registry portal | https://brandregistry.amazon.com |
| A+ Content API reference | https://developer-docs.amazon.com/sp-api/reference/a-content-management-v2020-11-01 |
| A+ Content use case guide | https://developer-docs.amazon.com/sp-api/docs/a-plus-content-api-use-case-guide |
| A+ Content document examples | https://developer-docs.amazon.com/sp-api/docs/a-content-document-examples |
| Brand Analytics role requirements | https://developer-docs.amazon.com/sp-api/docs/brand-analytics-role |
| Analytics report type values | https://developer-docs.amazon.com/sp-api/docs/report-type-values-analytics |
| Data Kiosk API overview | https://developer-docs.amazon.com/sp-api/docs/data-kiosk-api |
| Data Kiosk schema explorer guide | https://developer-docs.amazon.com/sp-api/docs/schema-explorer-guide |
| Brand Store insight metrics | https://advertising.amazon.com/API/docs/en-us/guides/brand-store/insight-metrics |
| Brand Metrics API (Amazon Ads) | https://advertising.amazon.com/API/docs/en-us/guides/reporting/brand-metrics/overview |
| Manage Your Experiments API reference | https://developer-docs.amazon.com/sp-api/reference/manage-your-experiments |
| Transparency program | https://transparency.amazon.com |
| Project Zero | https://sell.amazon.com/brand-registry/project-zero |
| SP-API rate limits reference | https://developer-docs.amazon.com/sp-api/docs/usage-plans-and-rate-limits |
| SP-API developer portal | https://developer-docs.amazon.com/sp-api |

---

*Last updated: May 2026. Amazon updates Brand Registry features frequently — verify all API endpoints, rate limits, and eligibility requirements against official documentation before implementation.*
