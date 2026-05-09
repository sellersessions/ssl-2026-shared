# CRO Process — CVR & CTR Optimization

#cro #process

## What Is CRO?

Conversion Rate Optimization for Amazon listings. Two metrics matter:

- **CTR** (Click-Through Rate) — do shoppers click your listing from search results?
- **CVR** (Conversion Rate) — once they click, do they buy?

Everything Keplo does maps to improving one or both of these.

## The Funnel

```
Shopper searches on Amazon
         |
         v
   SEARCH RESULTS PAGE
   (Your listing vs competitors)
         |
   CTR gate: Do they click?
   Driven by: main image, title, price, ratings, badges
         |
         v
   PRODUCT DETAIL PAGE
   (Your listing)
         |
   CVR gate: Do they buy?
   Driven by: images, bullets, A+, reviews, price, trust signals
         |
         v
      PURCHASE
```

## CTR Optimization

What makes someone click YOUR listing instead of a competitor's:

1. **Main image** — The single most impactful element. Must communicate the product's core value in a 150x150px thumbnail.
2. **Title** — First 80 chars visible on mobile. Must match search intent.
3. **Price** — Relative to competitors on the same SERP.
4. **Rating + review count** — Social proof at a glance.
5. **Badges** — Best Seller, Amazon's Choice, Coupon, etc.

### How We Measure CTR
- **SQP (Search Query Performance)** — Amazon's own data showing impressions → clicks per keyword
- **CTR Index** — Your CTR vs category average (>1.0 = outperforming)
- Main image A/B tests via Manage Your Experiments

### CTR Root Causes (from real client work)
- Main image doesn't show differentiator at thumbnail size
- Product looks the same as every competitor in the grid
- Set/bundle count not visible
- False/misleading claims that get challenged in reviews

## CVR Optimization

What makes someone buy after clicking:

1. **Image stack** — 7 images that answer every pre-purchase question
2. **Bullet points** — Benefits, not features. Address objections.
3. **A+ Content** — Brand story, comparison charts, lifestyle imagery
4. **Reviews** — Sentiment, recency, top critical reviews
5. **Price positioning** — Value perception vs alternatives
6. **Trust signals** — Warranty, brand registry, return policy

### How We Measure CVR
- **Business Reports** — Sessions → orders (unit session percentage)
- **CVR Index** — Your CVR vs category average
- **SQP Purchase Rate** — Keyword-level conversion

### CVR Root Causes (from real client work)
- Product education gap — shopper doesn't understand what it is
- Listing doesn't match SERP expectations — they clicked expecting something different
- Critical review at top of reviews section
- Design defect surfaced in reviews
- Missing use cases that satisfied customers love

## The CRO Workflow (What Keplo Does)

### Stage 1: Discovery & Priority Setting
1. Ingest client's product catalog (SellerApp Get Product Details — paste ASINs / amazon URLs)
2. Pull keyword data via SellerApp Reverse-ASIN → identify CTR/CVR gaps per keyword per ASIN
3. (Post-workshop) Pull Amazon Ads data → identify wasted spend, ACOS outliers
4. Score and rank all ASINs by opportunity size
5. Deep research top 5: reviews (all star levels), SERPs, competitor audit
6. Deliver Priority Report with root causes + recommendations

### Stage 2: Content Planning
1. Take approved priority ASINs
2. Create image content plans (what each of 7 images should show)
3. Create listing copy recommendations (title, bullets, A+)
4. Designer briefs for main image concepts
5. A/B test plan

### Stage 3: Implementation & Testing
1. Design new images (external designers)
2. Update listing copy
3. Launch A/B tests via Manage Your Experiments
4. Monitor results weekly

### Stage 4: Ongoing Optimization
1. Weekly SQP/CVR monitoring
2. Review velocity tracking
3. Competitive landscape changes
4. New keyword opportunities
5. Seasonal adjustments

## Data Sources

| Source | What It Provides | Used For |
|--------|-----------------|----------|
| SellerApp Get Product Details | Title, brand, BSR, price, sales estimate, ratings, images, promotions | Base product data |
| SellerApp Reverse-ASIN Keyword Research V2 | Keyword-level impressions, CTR, CVR, competition, demand momentum | CTR/CVR analysis |
| SellerApp Get Product Reviews | Full review text by star level | Sentiment / objection mining |
| SellerApp Get Rufus AI Queries | Amazon's AI shopping assistant suggestions | Shopper intent |
| SellerApp Keyword Search Result (SERP) | Top organic + sponsored ranking ASINs for a keyword | Competitor positioning |
| Amazon Ads API (post-workshop) | Search terms, ACOS, spend, wasted spend | Ad efficiency |

## Key Metrics & Formulas

- **CTR** = Clicks / Impressions (from SQP)
- **CVR** = Orders / Sessions (from Business Reports)
- **ACOS** = Ad Spend / Ad Revenue
- **TACoS** = Ad Spend / Total Revenue (ads + organic)
- **ROAS** = Ad Revenue / Ad Spend
- **Wasted Spend** = Spend on search terms with 0 conversions
- **CTR Index** = Your CTR / Category Average CTR
- **CVR Index** = Your CVR / Category Average CVR

---

## Source

Mirrored from Drive: `CRO-Knowledge-Base/cro-process.md`
Last sync: 2026-05-04.
