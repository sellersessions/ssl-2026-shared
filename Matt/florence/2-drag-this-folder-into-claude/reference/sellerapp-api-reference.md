# SellerApp Custom APIs - Full Documentation

Source: https://documenter.getpostman.com/view/27769832/2s93sW7aEX
Exported: May 7, 2026

---
## Overview

**Base URL:** `https://api.sellerapp.com/sellmetricsv2/`

**Authentication:** All requests require the following request headers:
- `client-id`: Your client ID
- `token`: Your API token

**Response Format:** All responses are JSON.

**Supported Geographies:** `us`, `uk`, `de`, `fr`, `br`, `ca`, `mx`, `ae`, `eg`, `es`, `in`, `it`, `nl`, `sa`, `se`, `tr`, `sg`, `au`, `jp`, `cn`, `pl`, `be`

---

## 1. Product Details

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/products`  
**Tokens Consumed:** 1 per product (plus additional tokens for optional parameters)

### Description

Returns product details for requested ProductID(s) or UPC codes. Product attributes are returned by default. Pass optional parameters to retrieve additional attribute groups. Maximum of 20 ASINs/UPC codes per request. Either ASINs or UPCs can be provided per request, not both.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `productIds` or `upc_ids` | Comma-delimited list of product identifiers. Example: `&productIds=B00CHJEJG8,B0CHF328XB` |
| `geo` | Geographical region of the Amazon marketplace |

### Optional Parameters

| Parameter | Value | Description | Additional Tokens |
|-----------|-------|-------------|-------------------|
| `fee_detail` | `1` | Amazon fee attributes (referral, closing, FBA fee) | 2 per product |
| `price_detail` | `1` | Amazon price attributes | 1 per product |
| `potential_detail` | `1` | Sales/Revenue Estimates | 2 per product |
| `ratings` | `1` | Ratings attributes | 1 per product |
| `realtime_data` | `1` | Real-time scrape of Amazon listing before returning data | 3 per product |
| `additional_attributes` | `1` | Additional dynamic Amazon attributes | 0 |
| `promotions` | `1` | Product promotions attributes | 4 per product |
| `product_specifications` | `1` | Product specification attributes | varies |

### Response Groups

**Product Attributes (Default):** ASIN, Title, Images, Brand, Category, BSR, Release Date, Description, Key Points, Manufacturer, URL, Number of Sellers, Relationship (parent/child)

**Amazon Fee Attributes** (`fee_detail=1`): Referral Fee, Closing Fee, FBA Fee

**Amazon Price Attributes** (`price_detail=1`): Landed/Listing/Shipping Price (New & Used), Points (New & Used), Currency Code

**Product Specification Attributes** (`product_specifications=1`): GTIN Code, UPC Code, Is Adult Product, Model Number, Part Number, Parent ASINs, Number of Items, Package Dimensions, Item Dimensions, Batteries Required

**Sales/Revenue Estimates** (`potential_detail=1`): Sales Estimate Low/High (daily units), Revenue Estimate Low/High (daily revenue)

**Ratings Attributes** (`ratings=1`): Overall Ratings, Number of Ratings

**Additional Attributes** (`additional_attributes=1`): Item Form, Material Feature, Diet Type, Color, Material

**Promotions Attributes** (`promotions=1`): Deals, Promo Details (promo codes and discount percentages)

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/products?product_specifications=1&potential_detail=1&price_detail=1&fee_detail=1&ratings=1&realtime_data=1&geo=us&productIds=B0016HF5GK&promotions=1' \
--header 'client-id: <client-id>' \
--header 'token: <token>'
```

### Example Response (200 OK)

```json
[
  {
    "product_attributes": {
      "asin": "B07255MPRN",
      "title": "Sports Research Vegan D3 5000iu with Vitamin K2 100mg - 60 Softgels",
      "brand": "Sports Research",
      "manufacturer": "Sports Research",
      "url": "https://www.amazon.com/dp/B07255MPRN",
      "number_of_sellers": 1,
      "bsr": [{"node_id": "3774781", "name": "Vitamin D Supplements", "rank": 1, "level": -1}]
    },
    "price_details": {
      "landed_price_new": 19.16,
      "listing_price_new": 16.77,
      "currency_code": "USD"
    },
    "product_potential": {
      "sales_estimate_low": 6332,
      "sales_estimate_high": 7000,
      "revenue_estimate_low": 101312,
      "revenue_estimate_high": 112000
    },
    "ratings": {"ratings": 4.7, "number_of_ratings": 47306},
    "promotions": {
      "deals": ["Limited time deal"],
      "promo_details": [
        {"promo_code": "I5SBDATS", "discount_percentage": 50},
        {"promo_code": "2MHK9LEO", "discount_percentage": 30}
      ]
    }
  }
]
```

---

## 2. Product Best Sellers by Category

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/bestsellers`  
**Tokens Consumed:** 2 per API call

### Description

Retrieve Amazon's top 50 products within a specified category by providing the category ID and list type.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `category_id` | Unique category identifier. Use the Category Tree API to retrieve. |
| `geo` | Geographical region |

### Optional Parameters

| Parameter | Description |
|-----------|-------------|
| `pagenumber` | Page number (defaults to 1). Each page returns 50 product IDs. |
| `type` | List type: `bestsellers`, `new-releases`, `most-gifted`, `movers-and-shakers`, `most-wished-for` |

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/bestsellers?geo=us&type=bestsellers&pagenumber=1' \
--header 'client-id: your-token' \
--header 'token: your-token'
```

### Example Response (200 OK)

```json
{
  "list": [
    "B09KN2QCML", "150118315X", "B0BW31X61X", "1982181281", "1649374178",
    "0735211299", "B0BW38DFCX", "1649374046", "0593545400", "0307742482"
  ]
}
```

---

## 3. Category Tree

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/category_tree`  
**Tokens Consumed:** 0 per API call

### Description

Retrieve child categories based on a parent category ID or category name.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `key` | Category ID or category name |
| `key_type` | Type of key: `id` or `name` |
| `geo` | Geographical region |

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/category_tree?key=12896551&key_type=id&geo=us' \
--header 'client-id: <client-id>' \
--header 'token: <token>'
```

### Example Response

```json
[
  {
    "category_id": "689392011",
    "parent_id": "12896551",
    "name": "Craft Scissors",
    "category_path": "/Arts, Crafts & Sewing/Craft Supplies & Materials/Craft Supplies/Craft Cutting Tools/Craft Scissors",
    "has_child": false
  },
  {
    "category_id": "12896611",
    "parent_id": "12896551",
    "name": "Art Mat Cutters & Blades",
    "category_path": "/Arts, Crafts & Sewing/Craft Supplies & Materials/Craft Supplies/Craft Cutting Tools/Art Mat Cutters & Blades",
    "has_child": true
  }
]
```

---

## 4. Category Products

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/category_products`  
**Tokens Consumed:** 3 per API call

### Description

Retrieve product details for a given Amazon category node ID. Supports pagination via the `pagenumber` parameter. Returns first page by default.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `category_id` | The Amazon category/node ID |
| `geo` | Geographical region |

### Optional Parameters

| Parameter | Description | Additional Tokens |
|-----------|-------------|-------------------|
| `pagenumber` | Amazon page number (defaults to 1) | — |
| `extended_response` | `1` to get extended product info (image_url, title, rating, price, is_prime, product_badge) | 3 |

### Response Fields

| Field | Description |
|-------|-------------|
| `asin` | Unique product identifier |
| `product_rank` | Position/ranking for the category |
| `is_sponsored` | Whether the listing is sponsored (boolean) |
| `image_url` | Primary image URL *(extended only)* |
| `title` | Product title *(extended only)* |
| `rating` | Product rating *(extended only)* |
| `number_of_rating` | Count of ratings *(extended only)* |
| `price` | Selling price *(extended only)* |
| `listing_price` | Listing price *(extended only)* |
| `is_prime` | Amazon Prime eligibility *(extended only)* |
| `product_badge` | Badge like "best-seller" or "amazons choice" *(extended only)* |

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/category_products?geo=us&category_id=21571226011&pagenumber=1&extended_response=1' \
--header 'client-id: <client-id>' \
--header 'token: <token>'
```

### Example Response

```json
{
  "search_results": [
    {
      "asin": "B087QHXW6Z",
      "product_rank": 1,
      "is_sponsored": true,
      "image_url": "https://m.media-amazon.com/images/I/71sAp9qcuLL._AC_UL320_.jpg",
      "title": "Lulu Home Concentrated Bubble Solution, 1 L/ 33.8 OZ Refill",
      "rating": "4.5",
      "number_of_ratings": "5309",
      "price": "$14.39",
      "listing_price": "$29.99",
      "is_prime": "Amazon Prime",
      "product_badge": "amazons-choice"
    }
  ],
  "total_indexed_products": 122
}
```

---

## 5. Product Reviews

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/reviews`  
**Tokens Consumed:** 10 per page

### Description

Retrieve review details for a given product ASIN including star ratings, review text, dates, and reviewer info. Maximum 10 pages of reviews per product. Use `up_to_page` to fetch multiple pages in one call — tokens are billed per page (e.g. 10 tokens/page x 3 pages = 30 tokens).

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `productId` | ASIN of the product |
| `geo` | Geographical region |

### Optional Parameters

| Parameter | Value | Description | Additional Tokens |
|-----------|-------|-------------|-------------------|
| `pagenumber` | integer | Page number (defaults to 1) | — |
| `up_to_page` | integer | Fetch multiple pages at once (e.g. `3` = 30 reviews) | 10 per page |
| `reviewer_type` | `verified_purchase` | Only verified purchase reviews | 1 |
| `rating` | `1`–5 | Filter by star rating | 1 |
| `semantics` | `positive` or `critical` | Filter by sentiment (cannot combine with `rating`) | 1 |
| `media_type` | `multimedia` | Reviews with media only | 1 |
| `keyword` | string | Filter reviews by keyword | 1 |
| `sort` | `recent` | Sort by most recent | 1 |
| `filter_by_current_variant` | `1` | Reviews for the requested variant only | 0 |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `review_id` | string | Unique review ID |
| `review_link` | string | Direct URL to review on Amazon |
| `product_id` | string | Product ASIN |
| `author` | string | Reviewer name |
| `user_id` | string | Amazon user ID |
| `rating` | integer | Star rating (1–5) |
| `description` | string | Review text |
| `title` | string | Review title |
| `place` | string | Reviewer location |
| `is_verified` | boolean | Whether reviewer purchased the product |
| `review_date` | string | Date written (YYYY-MM-DD) |
| `helpful_count` | integer | Helpful vote count |
| `image_urls` | array/null | Review image URLs |
| `video_urls` | array/null | Review video URLs |
| `author_profile` | string | Reviewer Amazon profile URL |
| `is_global_review` | boolean | Whether review applies globally |
| `variation_details` | string | Product variation details |
| `variant_asin` | string | ASIN of the specific variation |

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/reviews?productId=B07RYP2PGN&geo=us&pagenumber=1&reviewer_type=recent&rating=4&media_type=multimedia&keyword=wonderful&sort=recent&filter_by_current_variant=1' \
--header 'client-id: <client-id>' \
--header 'token: <client-token>'
```

### Example Response (200 OK)

```json
{
  "reviews": [
    {
      "review_id": "R2307XTDERMQHX",
      "review_link": "https://www.amazon.com/gp/customer-reviews/R2307XTDERMQHX",
      "product_id": "B07RYP2PGN",
      "author": "Curt",
      "rating": 5,
      "description": "Very happy with this blanket...",
      "title": "Weighted blanket that keeps you cool",
      "place": "United States",
      "is_verified": true,
      "review_date": "2025-03-16",
      "helpful_count": 0,
      "image_urls": null,
      "video_urls": null,
      "is_global_review": false,
      "variation_details": "Size: 48x72\" 15lbs | Color: Grey | 1 Cover",
      "variant_asin": "B07DXP633F"
    }
  ],
  "reviews_meta": {
    "product_id": "B07RYP2PGN",
    "total_reviews_count": 3269,
    "total_ratings_count": 11466
  }
}
```

---

## 6. Product Offers

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/offers`  
**Tokens Consumed:** 2 per API call

### Description

Get all offers and sellers for a product, including seller name, selling price, delivery fee, delivery time, order quantity, and fulfillment details.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `productId` | ASIN of the product |
| `geo` | Geographical region |

### Optional Parameters

| Parameter | Description |
|-----------|-------------|
| `pagenumber` | Page number (defaults to 1) |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `seller_id` | string | Unique seller ID |
| `seller` | string | Seller name |
| `selling_price` | string | Price offered |
| `base_price` | string | Unit price or MRP |
| `minimum_order_quantity` | integer | Minimum units per order |
| `maximum_order_quantity` | integer | Maximum units per order |
| `condition` | string | Product condition (New, Used, etc.) |
| `is_fulfilled_by_amazon` | boolean | Whether FBA |
| `countdown` | string | Time window for valid pricing |
| `delivery_date` | string | Expected delivery date |
| `delivery_price` | string | Delivery cost ("FREE" if applicable) |
| `is_prime` | string | Prime eligibility |
| `position` | integer | Seller listing position (starting from 1) |

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/offers?geo=US&productId=B00449Q4SU' \
--header 'client-id: <client-id>' \
--header 'token: <token>' \
--header 'Content-Type: application/json'
```

### Example Response (200 OK)

```json
[
  {"seller_id": "N/A", "seller": "Amazon Resale", "selling_price": "$37.19", "base_price": "$44.94",
   "maximum_order_quantity": 30, "minimum_order_quantity": 1, "is_fulfilled_by_amazon": true,
   "countdown": "18 hrs 46 mins", "delivery_date": "Friday, May 30", "delivery_price": "FREE",
   "is_prime": "non-Prime", "position": 1},
  {"seller_id": "A1KOY50926GHXN", "seller": "Metroplex Goods", "selling_price": "$69.99",
   "is_fulfilled_by_amazon": false, "delivery_date": "June 4 - 5", "delivery_price": "FREE",
   "position": 3}
]
```

---

## 7. Product Question Answers ⚠️ DEPRECATED (v0.1.5)

> **This endpoint is deprecated by SellerApp** and was removed from Florence's master MCP workflow `9RmjDT107uXtrImf` in v0.1.5. The tool node `Get Product Q and A` no longer exists; calls will fail with "tool not found." The remaining sections of this doc are kept as historical reference. Florence's objection-mining now triangulates from reviews + Rufus only (two sources instead of three).

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/product_qna` _(deprecated)_  
**Tokens Consumed:** 2 per API call (+1 for `isAnswered` filter) _(historical)_

### Description

Get questions and answers posted by Amazon users on a product. Returns product title, subtitle, Q&A list, and pagination details.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `productId` | ASIN of the product |
| `geo` | Geographical region |

### Optional Parameters

| Parameter | Description | Additional Tokens |
|-----------|-------------|-------------------|
| `pagenumber` | Page number (defaults to 1) | — |
| `isAnswered` | `true` for answered questions only (default), `false` for unanswered | 1 |

### Response Fields

**Top-level fields:** `title`, `subTitle`, `pagination` (currentPage, totalPages)

**Per question:** `position`, `question`, `answer`, `questionLink`, `date`, `authorProfile`, `helpfulCount`

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/product_qna?productId=B0C3G9B9X1&isAnswered=true&geo=us&pageNumber=1' \
--header 'client-id: <client-id>' \
--header 'token: <token>'
```

### Example Response (200 OK)

```json
{
  "title": "Anker 100W USB C Charger, Compact and Foldable Travel Charger...",
  "subTitle": "by Anker",
  "questionAnswers": [
    {
      "position": 0,
      "question": "Is the cable rated for 100W charging?",
      "answer": "Not sure, but the cable and the charging block together are crazy fast",
      "questionLink": "https://www.amazon.com/ask/questions/Tx11HT8URXAC76T/ref=ask_ql_ql_al_hza",
      "date": "December 4, 2023",
      "authorProfile": "Dan",
      "helpfulCount": 0
    }
  ],
  "pagination": {"currentPage": 1, "totalPages": 15}
}
```

---

## 8. Listing Quality Index (LQI)

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/lqi`  
**Tokens Consumed:** 3 per ASIN

### Description

SellerApp's LQI compares each Amazon product listing against standard Amazon best practices and assigns a logical score to each section, which combined gives an overall listing quality score. Supports up to 100 products per request. Average processing time: ~5-7 minutes for 1 product, ~5-10 minutes for 100 products.

### LQI Analysis Sections

**1. Title Analysis**
- Number of title characters (ideal count)
- Compliance: capitalization rules, numerals vs. numeric digits, avoidance of promotional/subjective words
- Benchmarking against top-performing products in the category

**2. Bullet Points Analysis**
- Number of bullet points (adequacy of information)
- Compliance: capitalized letters, proper grammar, no promotional language
- Benchmarking against category best practices

**3. Description Analysis**
- Number of characters (vs. recommended)
- Compliance: sentence capitalization, clear/relevant content, no promotional language
- Benchmarking against top listings in the category

**4. Image Analysis**
- Number and variety of images
- Benchmarking against leading products in the category

**5. Videos Analysis**
- Number and usefulness of videos
- Benchmarking against industry leaders in the category

**6. Question and Answer Analysis**
- Answered and unanswered question counts
- Benchmarking Q&A engagement against top products

**7. Ratings Analysis**
- Overall product rating (aggregate customer score)
- Benchmarking against average and top-rated products in the category

**8. Review Analysis**
- Product review rate (% positive)
- Total reviews received
- Recent review sentiment analysis
- Benchmarking review volume/sentiment against leading products

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `productIds` | Comma-delimited ASINs (up to 100 products per request) |
| `geo` | Geographical region |

### API Response

Returns a `request_id` — a unique identifier for the scheduled LQI request. Use the Fetch LQI-Report API to retrieve the results.

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/lqi?geo=us&productIds=B01NBNDC1T,B00YCBBCHI,B0DBQSCLTS' \
--header 'client-id: <client-id>' \
--header 'token: <client-token>'
```

### Example Response

```json
{
  "request_id": "request_id"
}
```

---

## 9. Fetch LQI-Report

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/lqi_report`  
**Tokens Consumed:** 0 per call

### Description

Retrieve an LQI report that was previously scheduled using the LQI API. Poll this endpoint using the `request_id` returned from the LQI schedule call.

> **Note:** If requesting data for only one product, the response is an object (not an array).

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `request_id` | Unique request ID returned from the LQI scheduling call |

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/lqi_report?request_id=<request-id>' \
--header 'client-id: <client-id>' \
--header 'token: <token>'
```

### Example Response

```json
[
  {
    "asin": "0528026186",
    "title": "",
    "summary": {
      "total_score": 100
    }
  }
]
```

---

## 10. Product History

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/products/history`  
**Tokens Consumed:** 2 per API call + 1 per optional flag enabled

### Description

Get historical data for a product including price, BSR, ratings, review count, and sellers count. Returns last 30 days by default.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `productId` | ASIN of the product |
| `geo` | Geographical region |

### Optional Parameters

| Parameter | Description | Additional Tokens |
|-----------|-------------|-------------------|
| `price` | `1` to retrieve historical price data | 1 |
| `bsr` | `1` to retrieve historical best seller rank | 1 |
| `rating` | `1` to retrieve historical rating (divide integer by 10) | 1 |
| `review_count` | `1` to retrieve historical number of reviews | 1 |
| `sellers_count` | `1` to retrieve historical number of sellers | 1 |
| `days` | Number of days of history (counting backward from today, defaults to 30) | — |

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/products/history?geo=US&price=1&bsr=1&rating=1&review_count=1&sellers_count=1&productId=B01N6IKSSZ' \
--header 'client-id: <client-id>' \
--header 'token: <token>'
```

### Example Response (200 OK)

```json
{
  "price_history": [
    {"time": "2025-08-18T10:40:00Z", "value": 1221}
  ],
  "bsr_history": [...],
  "rating_history": [...],
  "review_count_history": [...],
  "sellers_count_history": [...]
}
```

---

## 11. Rufus Queries

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/rufus_queries`  
**Tokens Consumed:** 30 per API call

### Description

Programmatically extract related and suggested natural language queries from Amazon Rufus, Amazon's AI-powered shopping assistant. Returns user queries generated or suggested by Rufus in response to a specific product or topic.

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `geo` | Yes | Geographical region |
| `productId` | Yes | ASIN of the product |
| `search_query` | No | Optional search query to filter Rufus responses |

### Example Request

```bash
# Without search query
curl --location 'https://api.sellerapp.com/sellmetricsv2/rufus_queries?geo=us&productId=B0CXG3HMX1' \
--header 'client-id: <client-id>' \
--header 'token: <token>'

# With search query
curl --location 'https://api.sellerapp.com/sellmetricsv2/rufus_queries?geo=us&productId=B0CXG3HMX1&search_query=does%20it%20have%20voice%20control' \
--header 'client-id: <client-id>' \
--header 'token: <token>'
```

### Example Response

```json
{
  "answer": "",
  "queries": [
    "Can it connect to gaming consoles?",
    "Does it have voice control?",
    "Is this TV wall mountable?",
    "Ask something else",
    "What apps are included?",
    "Does it have Bluetooth?"
  ]
}
```

---

## 12. Profit Calculator

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/profit_calculator`  
**Tokens Consumed:** 3 per API call

### Description

Calculate estimated Amazon fees for a product ASIN with a given price. Useful for estimating profitability before changing prices.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `product_id` | ASIN of the product |
| `geo` | Geographical region |

### Optional Parameters

| Parameter | Description |
|-----------|-------------|
| `listing_price` | New listing price to estimate fees against |
| `shipping_price` | New shipping price to estimate fees against |
| `point_amount` | New point amount to estimate |
| `point_number` | New point number to estimate |

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/profit_calculator?geo=us&product_id=B0BH8WHC8Y&listing_price=36.75' \
--header 'client-id: <client-id>' \
--header 'token: <token>'
```

### Example Response

```json
{
  "referral_fee": 5.51,
  "variable_closing_fee": 0.44,
  "per_item_fee": 0.99,
  "fba_fee": 7.54
}
```

---

## 13. Keyword Search Result

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/keyword_search_result`  
**Tokens Consumed:** 3 per API call

### Description

Retrieve product search results for a given Amazon search keyword, including product rankings and sponsored status. Use `extended_response=1` to get full product details.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `search` | Keyword or search term |
| `geo` | Geographical region |

### Optional Parameters

| Parameter | Description | Additional Tokens |
|-----------|-------------|-------------------|
| `pagenumber` | Amazon page number (defaults to 1) | — |
| `sort` | Sort order: `low-to-high`, `high-to-low`, `avg-review`, `newest-arrivals`, `best-seller` | — |
| `include_sponsored_results` | `1` to include sponsored products alongside organic | 1 |
| `extended_response` | `1` to get full product details (image, title, price, ratings, etc.) | 6 |

### Response Fields

**Basic:** `asin`, `product_rank`, `is_sponsored`

**Extended only:** `image_url`, `title`, `rating`, `number_of_rating`, `price`, `listing_price`, `is_prime`, `product_badge`

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/keyword_search_result?geo=us&search=mobile&pagenumber=1&extended_response=1&sort=low-to-high' \
--header 'client-id: your-token' \
--header 'token: your-token'
```

### Example Response (200 OK)

```json
{
  "search_results": [
    {
      "asin": "B0BBZZ1SXT",
      "product_rank": 5,
      "is_sponsored": false,
      "title": "...",
      "price": "$29.99",
      "rating": "4.5",
      "is_prime": "Amazon Prime"
    }
  ]
}
```

---

## 14. Keyword Tracking

**Method:** `POST`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/keyword_tracking_schedule`  
**Tokens Consumed:** 10 tokens per keyword + 1 token per productId

### Description

Schedule keyword tracking for a set of keywords and products. Returns a `request_id` to fetch results from the Fetch Keyword Tracking Report API.

**Token Calculation:** Each keyword-ASIN pair = 10 tokens. Example: 3 keywords x 3 ASINs = 90 tokens. If the report fails to return, no tokens are charged.

### Request Body Parameters

| Field | Required | Description |
|-------|----------|-------------|
| `keywords` | Yes | Array of keywords (max 150) |
| `product_ids` | Yes | Array of ASINs (max 150) |
| `geo` | Yes | Geographical region |
| `enable_index_checking` | No | `true` to check if product is indexed for the keyword |
| `include_sponsored` | No | `true` to include sponsored positions |
| `report_type` | No | Report format: `json` or `csv` |

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/keyword_tacking_schedule' \
--header 'client-id: your-client-id' \
--header 'token: your-token' \
--header 'Content-Type: application/json' \
--data '{
  "enable_index_checking": true,
  "geo": "US",
  "keywords": ["speaker"],
  "product_ids": ["B0931QN643", "B002HZHUCW", "B07S62HZR7"],
  "include_sponsored": false,
  "report_type": "json"
}'
```

### Example Response

```json
{
  "request_id": "2yzPl7RbnHDB3MW29jwgr4KJizb"
}
```

---

## 15. Fetch Keyword Tracking Report

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/keyword_tracking_report`  
**Tokens Consumed:** 0 per call

### Description

Retrieve a previously scheduled keyword tracking report using the `request_id` from the Keyword Tracking API.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `request_id` | Unique request ID from the Keyword Tracking scheduling call |

### Report File Formats

- **CSV:** [requestId.csv](https://drive.google.com/file/d/1m0jW-Uilzzpa3wMQCruPp571DmbBwKcL/view?usp=sharing)
- **JSON:** Available via report URL returned in response

### Example Request

```bash
curl --location 'http://api.sellerapp.com/sellmetricsv2/keyword_tracking_report?request_id=<request-id>' \
--header 'client-id: <client-id>' \
--header 'token: <token>'
```

### Example Response

```json
{
  "status": "completed",
  "report_url": "<report-url>",
  "message": "Your request has been successfully processed."
}
```

---

## 16. Keyword Research / Reverse ASIN

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/keyword_research`  
**Tokens Consumed:** 2 per call (+1 per every 50 additional results)

### Description

Retrieve relevant and high-converting keywords for a given keyword or ASIN. Supports both keyword-based research and reverse ASIN lookup.

**Relevance scoring considers:** Search Volume, Relevance, Click-Through Rate (CTR), Conversion Rate, Cost-Per-Click (CPC), Trend

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `type` | `asin` for Reverse ASIN lookup, `keyword` for keyword research |
| `key` | Valid ASIN (if `type=asin`) or keyword string (if `type=keyword`) |
| `geo` | Geographical region |

### Optional Parameters

| Parameter | Description | Additional Tokens |
|-----------|-------------|-------------------|
| `pagenumber` | Pagination parameter | — |
| `results_count` | Number of results (multiples of 50, max 500, default 50) | 1 per every 50 additional |

### Response Fields

| Field | Description |
|-------|-------------|
| `cpc` | Cost per click |
| `search_volume` | Search volume |
| `relative_score` | Relative score (response sorted by this) |
| `match_type` | Match type of the keyword |

### Error Codes

| Code | Description |
|------|-------------|
| `401` | `missing_token_credentials` — Auth headers not present |
| `401` | `invalid_token_credentials` — Invalid auth headers |
| `400` | `invalid_request` — Bad request |
| `406` | `api_limit_exceeded` — Quota reached or insufficient tokens |

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/keyword_research?key=B0009STNC4&type=asin&geo=us&pagenumber=1' \
--header 'client-id: <client-id>' \
--header 'token: <token>'
```

### Example Response (200 OK)

```json
{
  "title": "DMI Wedge Pillow Leg Pillow Bolster Pillow...",
  "keyword_list": [
    {
      "keyword": "leg elevation pillow",
      "cpc": 0.85,
      "search_volume": 45000,
      "relative_score": "Very High",
      "match_type": "Exact"
    }
  ]
}
```

---

## 17. Keyword Research / Reverse ASIN V2 Beta

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetrics/v2/keyword_research`  
**Tokens Consumed:** 4 per call (+1 per every 50 additional results, +1 for `additional_details`)

### Description

Enhanced version of the Keyword Research/Reverse ASIN API with additional data points including impressions, CTR, CVR, competition index, demand momentum, and top products by clicks/conversions.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `type` | `asin` or `keyword` |
| `key` | ASIN or keyword |
| `geo` | Geographical region |

### Optional Parameters

| Parameter | Description | Additional Tokens |
|-----------|-------------|-------------------|
| `pagenumber` | Pagination | — |
| `results_count` | Number of results (multiples of 50, max 500) | 1 per 50 additional |
| `additional_details` | `1` to get extended metrics (impressions, rank, CTR, CVR, etc.) | 1 |

### Response Fields (V2 Extended)

All V1 fields plus:

| Field | Description |
|-------|-------------|
| `impressions` | Estimated search result appearances |
| `rank` | Keyword popularity rank |
| `CTR` | Click-Through Rate (% of impressions clicked) |
| `CVR` | Conversion Rate (% of clicks that converted) |
| `demand_momentum` | Whether demand is rising or falling |
| `seasonality_index` | Whether keyword is in-season |
| `competition_index` | Competition score 0–100 |
| `no_of_indexed_products` | Number of competing products |
| `top_products_by_clicks` | Top products receiving most clicks |
| `top_products_by_conversions` | Top products generating most sales |

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetrics/v2/keyword_research?key=adventskalender&type=keyword&geo=de&pagenumber=1' \
--header 'client-id: <client-id>' \
--header 'token: <token>'
```

### Example Response

```json
{
  "keyword_list": [
    {
      "keyword": "adventskalender",
      "cpc": 0.2,
      "search_volume": 250000,
      "relative_score": "Very High",
      "match_type": "Exact",
      "impressions": 1200000,
      "CTR": 12.5,
      "CVR": 8.3,
      "competition_index": 72
    }
  ]
}
```

---

## 18. Keyword Research Bulk

**Method:** `POST`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/keyword_research_schedule`  
**Tokens Consumed:** 2 per key (keyword or ASIN)

### Description

Schedule keyword research for multiple keywords or ASINs in a single request. Returns a `request_id` for fetching results via the Keyword Research Bulk Report API.

**Token Calculation:** Each keyword/ASIN = 2 tokens. Example: 50 keywords = 100 tokens.

### Required Parameters (Query String)

| Parameter | Description |
|-----------|-------------|
| `type` | `keyword` or `asin` |
| `geo` | Geographical region |

### Request Body

| Field | Description |
|-------|-------------|
| `keys` | Array of keywords or ASINs to research |

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/keyword_research_schedule?type=keyword&geo=us' \
--header 'client-id: <client-id>' \
--header 'token: <token>' \
--header 'Content-Type: application/json' \
--data '{"keys": ["car", "toy", "kids"]}'
```

### Example Response

```json
{
  "request_id": "<request id>"
}
```

---

## 19. Keyword Research Bulk Report

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/keyword_research_report`  
**Tokens Consumed:** 0 per call

### Description

Retrieve a previously scheduled keyword research bulk report using the `request_id` from the Keyword Research Bulk API.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `request_id` | Unique request ID from the Keyword Research Bulk scheduling call |

### Report File Format

- **CSV example:** [requestId.csv](https://drive.google.com/file/d/11R5P8uq2k8IWSLSWJ1sIsP5BtJNqt3wu/view?usp=sharing)

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/keyword_research_report?request_id=<request id>' \
--header 'client-id: <client id>' \
--header 'token: <token>'
```

### Example Response

```json
{
  "status": "completed",
  "report_url": "<report url>",
  "message": "Your request has been successfully processed."
}
```

---

## 20. Keyword Metrics

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/keyword_metrics`  
**Tokens Consumed:** 2 per API call

### Description

Retrieve keyword-level metrics for a given search term including CPC, search volume, relative score, and match type.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `keyword` | The keyword to get metrics for |
| `geo` | Geographical region |

### Response Fields

| Field | Description |
|-------|-------------|
| `keyword` | The keyword |
| `cpc` | Cost per click |
| `search_volume` | Search volume (may be a range like "<100") |
| `relative_score` | Relative score (e.g. "Very High") |
| `match_type` | Match type (e.g. "Exact") |

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/keyword_metrics?geo=us&keyword=cover' \
--header 'client-id: your client id' \
--header 'token: your token'
```

### Example Response

```json
{
  "keyword": "athletic shoes",
  "cpc": 0.725,
  "search_volume": "<100",
  "relative_score": "Very High",
  "match_type": "Exact"
}
```

---

## 21. Seller Profile

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/seller_profile`  
**Tokens Consumed:** 2 per API call

### Description

Retrieve real-time profile details for a particular Amazon seller.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `seller_id` | The unique ID of the seller |
| `geo` | Geographical region |

### Response Fields

| Field | Description |
|-------|-------------|
| `seller_id` | Unique seller ID |
| `seller_name` | Seller display name on Amazon |
| `review_ratings` | Overall seller rating |
| `review_count` | Total number of ratings received |
| `star_ratings` | Ratings breakdown by star (1–5 star) |
| `rating_percentage` | Percentage of positive ratings |
| `seller_address` | Registered address of the seller |

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/seller_profile?geo=in&seller_id=AXOGFIT0PZZ7G' \
--header 'client-id: <client-id>' \
--header 'token: <token>'
```

### Example Response (200 OK)

```json
{
  "seller_id": "AXOGFIT0PZZ7G",
  "seller_name": "RetailEZ Pvt Ltd",
  "review_ratings": 4.6,
  "review_count": 58383,
  "star_ratings": {
    "1 star": 4,
    "2 star": 1,
    "3 star": 1,
    "4 star": 20,
    "5 star": 74
  },
  "rating_percentage": 98,
  "seller_address": ""
}
```

---

## 22. Seller Products

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/seller_products`  
**Tokens Consumed:** 3 per API call (+3 for extended_response)

### Description

Retrieve products sold by a particular seller. Supports pagination. By default returns first page results.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `seller_id` | The unique ID of the seller |
| `geo` | Geographical region |

### Optional Parameters

| Parameter | Description | Additional Tokens |
|-----------|-------------|-------------------|
| `pagenumber` | Amazon page number (defaults to 1) | — |
| `extended_response` | `1` to get extended product details (image, title, rating, price, is_prime, product_badge) | 3 |

### Response Fields

**Basic:** `asin`, `product_rank`, `is_sponsored`

**Extended only:** `image_url`, `title`, `rating`, `number_of_ratings`, `price`, `listing_price`, `is_prime`, `product_badge`

**Top-level:** `total_indexed_products`

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/seller_products?geo=us&pagenumber=2&seller_id=A294P4X9EWVXLJ&extended_response=1' \
--header 'client-id: <client-id>' \
--header 'token: <token>'
```

### Example Response (200 OK)

```json
{
  "search_results": [
    {
      "asin": "B07QXV6N1B",
      "product_rank": 17,
      "is_sponsored": false,
      "image_url": "https://m.media-amazon.com/images/I/71rC6tBu0NL._AC_UY218_.jpg",
      "title": "Anker Portable Charger, Power Bank, 10,000 mAh Battery Pack...",
      "rating": "4.5",
      "number_of_ratings": "101581",
      "price": "$19.99",
      "listing_price": "$21.99"
    }
  ],
  "total_indexed_products": 700
}
```

---

## 23. Token Status

**Method:** `GET`  
**Endpoint:** `https://api.sellerapp.com/sellmetricsv2/token_status`  
**Tokens Consumed:** 0 per call

### Description

Retrieve token status information including allowed tokens, available tokens, and usage breakdown per API. Use this to track consumption and ensure you stay within token limits.

### Example Request

```bash
curl --location 'https://api.sellerapp.com/sellmetricsv2/token_status' \
--header 'client-id: <client-id>' \
--header 'token: <token>'
```

### Example Response

```json
{
  "allowed_tokens": 20000000,
  "available_tokens": 19708256,
  "usages": [
    {"api_name": "Product_Details", "token_usages": 362074},
    {"api_name": "Product_Reviews", "token_usages": 25372},
    {"api_name": "lqi", "token_usages": 24},
    {"api_name": "Keyword_Tracking", "token_usages": 183},
    {"api_name": "Product_Best_Sellers_by_Category", "token_usages": 16842},
    {"api_name": "Keyword_Research/Reverse_ASIN", "token_usages": 3096},
    {"api_name": "lqi_report", "token_usages": 0},
    {"api_name": "Keyword_Search_Result", "token_usages": 2787},
    {"api_name": "Keyword_Research_Bulk", "token_usages": 26},
    {"api_name": "Keyword_Research_Bulk_Report", "token_usages": 0},
    {"api_name": "Exact Keyword Data", "token_usages": 11238}
  ]
}
```

---

## Token Consumption Summary

| API Endpoint | Tokens |
|--------------|--------|
| Product Details | 1 per product (base) |
| Product Details + fee_detail | +2 per product |
| Product Details + price_detail | +1 per product |
| Product Details + potential_detail | +2 per product |
| Product Details + ratings | +1 per product |
| Product Details + realtime_data | +3 per product |
| Product Details + promotions | +4 per product |
| Product Best Sellers by Category | 2 per call |
| Category Tree | 0 per call |
| Category Products | 3 per call (+3 extended) |
| Product Reviews | 10 per page |
| Product Offers | 2 per call |
| Product Question Answers | 2 per call (+1 isAnswered) |
| Listing Quality Index (LQI) | 3 per ASIN |
| Fetch LQI-Report | 0 per call |
| Product History | 2 per call (+1 per flag) |
| Rufus Queries | 30 per call |
| Profit Calculator | 3 per call |
| Keyword Search Result | 3 per call (+1 sponsored, +6 extended) |
| Keyword Tracking | 10 per keyword + 1 per productId |
| Fetch Keyword Tracking Report | 0 per call |
| Keyword Research / Reverse ASIN | 2 per call |
| Keyword Research / Reverse ASIN V2 Beta | 4 per call |
| Keyword Research Bulk | 2 per key |
| Keyword Research Bulk Report | 0 per call |
| Keyword Metrics | 2 per call |
| Seller Profile | 2 per call |
| Seller Products | 3 per call (+3 extended) |
| Token Status | 0 per call |

---

*Documentation exported from [SellerApp API Docs](https://documenter.getpostman.com/view/27769832/2s93sW7aEX) on May 7, 2026*