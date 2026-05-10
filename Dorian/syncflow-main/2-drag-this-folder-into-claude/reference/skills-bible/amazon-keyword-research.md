# Amazon Keyword Research — Analyst Knowledge Base

> **Purpose:** Everything an experienced Amazon keyword research analyst needs to know — where to find data, what each data source tells you, how different data types work, and how to synthesize it all into a research workflow.

---

## 1. What Is Amazon Keyword Research (And Why It's Different)

Amazon keyword research is the process of identifying the exact words and phrases customers type into the Amazon search bar when looking for a product — and understanding how those queries perform in terms of impressions, clicks, and purchases.

It differs from Google SEO keyword research in a critical way: **every Amazon search query carries commercial intent.** There's no "how to" or "what is" traffic — people are there to buy. This means conversion behavior (clicks, add-to-cart, purchases per search) matters more than raw search volume. A keyword with 5,000 monthly searches and 8% click-through beats one with 50,000 searches and 0.3% click-through every time.

In 2026, the A10 algorithm weights **conversion relevance** heavily. Your product needs to rank for keywords it can actually convert on — not just the highest-volume terms in the category.

---

## 2. Native Amazon Data Sources

These are first-party sources — direct from Amazon. They are the most accurate and should anchor every research project.

### 2.1 Amazon Autocomplete (Search Bar Suggestions)

**What it is:** Real-time query suggestions that appear as you type in the Amazon search bar.

**Why it matters:** Autocomplete reflects actual historical search behavior from Amazon's database. These are not estimated or modeled — they are surfaced because customers are genuinely typing them.

**How to use it:**
- Type your seed keyword and note every suggestion Amazon offers
- Use the "alphabet soup" technique: type "keyword a", "keyword b" ... "keyword z" to generate hundreds of variations
- Also try appending numbers, colors, sizes, use cases
- Suggestions shift by locale, so research on the correct Amazon marketplace (amazon.com vs amazon.co.uk vs amazon.ca)

**Limitations:** No volume data, no conversion data — it tells you *what* is searched, not *how often* or *how well it converts.*

---

### 2.2 Amazon Brand Analytics (ABA) — Brand Registry Required

Brand Analytics is the most powerful first-party keyword intelligence available. It is exclusive to sellers enrolled in Amazon Brand Registry.

#### Search Query Performance (SQP) Report

**What it is:** Shows how specific search queries funnel into impressions → clicks → add-to-cart → purchases for your brand and specific ASINs. Data is broken into Brand View (all products combined) and ASIN View (single product).

**Reporting periods:** Weekly, monthly, quarterly.

**Core metrics in SQP:**

| Metric | Definition |
|--------|------------|
| **Search Query Volume** | Total number of times a query was searched across all of Amazon for the period |
| **Search Query Score** | Amazon's proprietary ranking of which queries matter most for your brand (weighted toward sales, not just volume) |
| **Total Impressions** | How many times any listing appeared for that query (market total) |
| **Brand Impressions** | How many times YOUR listings appeared for that query |
| **Impression Share** | Brand Impressions ÷ Total Impressions — your visibility % for the query |
| **Total Clicks** | Total clicks on any listing for that query |
| **Brand Clicks** | Clicks on your listings |
| **Click Share** | Brand Clicks ÷ Total Clicks — your share of traffic |
| **Total Add-to-Cart** | How many cart adds the query generated market-wide |
| **Brand Add-to-Cart** | Your cart adds for that query |
| **Cart Add Share** | Your share of cart adds — signals purchase intent signal strength |
| **Total Purchases** | Total purchases resulting from the query across Amazon |
| **Brand Purchases** | Your purchases from that query |
| **Purchase Share** | Your share of conversions — the most important conversion metric |

**How an analyst uses SQP:**
- Identify queries where you have high impressions but low click share → title/main image problem
- Identify queries where you have high click share but low purchase share → listing conversion or price problem
- Identify high-volume queries you're not showing for at all → indexing or ranking gap
- Export and sort by Total Search Query Volume to find the universe of relevant queries your category owns
- Compare brand vs. ASIN view to understand which products pull in which queries

#### Search Frequency Rank (SFR) / Top Search Terms Report

**What it is:** A ranking of the top ~500,000 search terms on Amazon for a given week, along with the top 3 clicked ASINs for each term and their click/conversion share.

**Key metrics:**
- **Search Frequency Rank (SFR):** Amazon's ranking of popularity for the search term (rank 1 = most searched). Not a raw volume number, but a relative rank.
- **Click Share (Top 3 ASINs):** What % of clicks goes to each of the top 3 products
- **Conversion Share (Top 3 ASINs):** What % of purchases goes to each of the top 3 products

**How an analyst uses it:**
- Find high-frequency terms where the top 3 ASINs don't dominate (fragmented click/conversion share = opportunity)
- Identify which competitors are owning which terms
- Validate whether a new keyword opportunity has real purchase intent (look at conversion share relative to click share)

#### Market Basket Analysis

Shows what products customers frequently buy together with your product. Used to identify complementary keyword angles and bundle opportunities.

#### Repeat Purchase Behavior

Shows what % of your buyers are repeat customers. Useful for identifying whether keyword traffic is bringing in loyal vs. one-time buyers.

---

### 2.3 Amazon Advertising Console — Sponsored Products Data

Your own PPC campaigns are a goldmine of keyword intelligence because they show real search terms that triggered your ads and the downstream conversion behavior.

**Search Term Report (Advertising Console):**
- Shows every actual search query that triggered an impression or click on your ads
- Columns: Impressions, Clicks, Spend, Orders, Revenue, ACoS, ROAS
- The most direct measure of which keywords convert for YOUR listing specifically

**How an analyst uses it:**
- Mine auto campaigns for discovered keywords that convert → harvest into manual exact/phrase campaigns
- Find negative keywords (terms that spend but don't convert)
- Identify high-converting terms that aren't in your listing copy → add them to frontend/backend

**Auto Campaign Match Types (for discovery):**
- **Close Match:** Amazon shows your ad for queries closely related to your product
- **Loose Match:** Broader semantic matches — more exploratory
- **Substitutes:** Queries for similar/competing products
- **Complements:** Queries for products commonly bought with yours

---

### 2.4 Amazon Seller Central — Listing Indexing Checker

While not a keyword research tool per se, Seller Central allows you to check whether your ASIN is indexed for specific search terms by using the search bar on Amazon and appending `field-keywords=your+keyword` or by using third-party index checkers. Knowing which terms you're indexed (and not indexed) for is essential for gap analysis.

---

## 3. External Software Tools

These tools model Amazon's data using scraped search results, third-party panel data, and historical databases. They supplement first-party data — they do not replace it. Think of them as exploration and gap-finding engines; SQP/ABA is truth.

### 3.1 Helium 10

The most widely used Amazon seller software suite. Keyword-specific tools:

**Cerebro (Reverse ASIN Lookup):**
- Input any ASIN (yours or a competitor's) and get the full list of keywords it ranks for organically and via PPC
- Key metrics: Search Volume, Rank (organic position), Sponsored Rank, Competing Products, Title Density (how many top titles include that keyword)
- Can input up to 10 ASINs simultaneously for a "common keyword" overlap view — shows terms multiple top competitors share
- **Best use:** Competitor keyword mining; finding terms you should rank for but don't

**Magnet (Seed Keyword Expansion):**
- Input a seed keyword, get hundreds of related terms with volume estimates
- Filters: Search Volume, Competing Products, Magnet IQ Score (volume-to-competition ratio), Title Density, Search Volume Trend
- **Best use:** Expanding a keyword universe from a known starting point

**Keyword Tracker:**
- Track daily organic and sponsored rank for your ASINs across specific keywords
- Monitor rank changes after listing edits or PPC adjustments

**Frankenstein & Scribbles:**
- Frankenstein: Processes large keyword lists — deduplicates, removes stop words, ranks by frequency
- Scribbles: Drag-and-drop tool for placing keywords into listing fields while tracking which ones have been used

**Data quality note:** Helium 10 search volume is modeled/estimated. It correlates reasonably well with relative volume but the absolute numbers diverge from Amazon's actual SQP data. Use for ranking/prioritizing, not as gospel.

---

### 3.2 DataDive

Advanced competitor and niche analysis tool. Often used as a layer on top of Helium 10 and Jungle Scout.

**Key capabilities:**
- Deep multi-ASIN keyword overlap analysis across an entire niche
- Pulls from Jungle Scout's API + Keepa's historical data + Google Trends simultaneously
- Niche tracking dashboards for monitoring how a keyword landscape shifts over time
- Superior for niche-level keyword maps (seeing what terms define a whole category, not just a few competitors)

**Best use:** When you need to map an entire niche's keyword structure before entering a market or doing a full listing rebuild.

---

### 3.3 Jungle Scout — Keyword Scout

- Search volume estimates, trend data, and competitive difficulty scores
- PPC bid recommendations (can be directionally useful for prioritization)
- Better for initial product validation and niche sizing; less depth on keyword research than Helium 10 Cerebro
- Integrates with DataDive for deeper analysis

---

### 3.4 SellerSprite

- Strong filter-driven keyword discovery and competitor lookup
- Good for cross-referencing Chinese market data (useful for identifying supplier trends before they peak on US Amazon)
- Budget-friendly — free plan available with core functionality
- Comparable to Helium 10 Magnet for keyword expansion but with unique filters

---

### 3.5 SellerApp

- Keyword research, index checker, and listing quality tools
- Strong SQP integration for brand-registered sellers
- Good for smaller teams that want one dashboard

---

### 3.6 AdRazor / Adbrew / Scale Insights

PPC-focused tools that layer keyword data on top of advertising performance:
- Show which keywords are winning or losing in your campaigns over time
- Useful for identifying which organic keywords to protect with exact-match campaigns

---

### 3.7 Keepa

- Not a keyword tool, but provides historical BSR (Best Seller Rank) and price data
- BSR trend analysis helps validate whether the category's demand is growing, stable, or declining — context needed for interpreting keyword volume trends
- Used alongside DataDive for niche-level analysis

---

### 3.8 Google Keyword Planner / Google Trends

- Amazon and Google search intent diverge significantly, so use with caution
- Google Trends is useful for identifying seasonal patterns in a category (e.g., "air fryer" spikes every November before Black Friday)
- Some long-tail discovery from Google can transfer to Amazon, especially for use-case keywords ("best air fryer for small apartment")
- More relevant for Sponsored Display and DSP campaigns targeting off-Amazon customers

---

## 4. Types of Keyword Data

Understanding the different *types* of keyword data — not just the tools — is what separates an analyst from a practitioner.

### 4.1 By Data Origin

| Type | Source | Reliability |
|------|--------|-------------|
| **First-party (Amazon-native)** | SQP, ABA, Search Term Reports | Highest — actual Amazon data |
| **Third-party modeled** | Helium 10, Jungle Scout, SellerSprite | Medium — estimated from scraped SERP + panel data |
| **Cross-platform** | Google Trends, Similarweb | Low for Amazon intent, useful for seasonality/context |

**Rule of thumb:** Use third-party tools for discovery and gap-finding. Validate everything important against SQP or your own ad search term reports.

---

### 4.2 By Keyword Function in the Listing

**Frontend Keywords (Visible to Shoppers):**
- **Title:** Most heavily weighted field for ranking. Primary keywords with highest volume and relevance should appear here. Amazon indexes every word in the title.
- **Bullet Points:** Secondary keywords. Indexing weight below the title but above description.
- **Product Description / A+ Content:** Indexed but lower weight. Use for natural language, long-tail, and use-case keywords.
- **Brand Name Field:** Indexed and appears in search results.

**Backend Keywords (Hidden from Shoppers):**
- Located in Seller Central under "Keywords" → "Search Terms"
- **500-byte limit** (not characters — bytes). Exceeding the limit causes Amazon to de-index the entire field.
- Space-separated, no commas needed, no punctuation
- Use for: synonyms, alternate spellings, misspellings, Spanish translations, abbreviations, size/material variants that aren't in the copy
- Do NOT repeat words already in the frontend — Amazon already indexes them
- Do NOT use competitor brand names (IP violation)
- Do NOT use subjective claims ("best", "cheapest")

**Subject Matter / Intended Use / Target Audience / Other Attribute Fields:**
- Backend fields beyond Search Terms — also indexed
- Use for: intended use cases, target demographics, materials, compatibility terms

---

### 4.3 By Search Intent / Keyword Type

**Generic / Category Keywords:**
- Broad, high-volume, high-competition
- Example: "air fryer", "yoga mat", "protein powder"
- High impressions, often low conversion rate (shopper hasn't narrowed intent)
- Difficult to rank organically without velocity; expensive in PPC

**Feature / Attribute Keywords:**
- Mid-funnel, add specificity to a category term
- Example: "air fryer 6 quart", "non-slip yoga mat thick", "whey protein powder chocolate"
- Better conversion than pure generic terms
- Core of a mature listing's keyword strategy

**Long-Tail / Use-Case Keywords:**
- Low individual volume, but high purchase intent
- Example: "air fryer for dorm room", "yoga mat for hot yoga sweat grip", "protein powder for women weight loss"
- Individually low traffic but in aggregate can be significant — and conversion rates are substantially higher
- Often lower competition and lower PPC bids

**Brand Keywords (Competitor):**
- Searching for a specific competitor brand
- Can target in PPC (Sponsored Products auto/broad), but cannot use in backend search terms
- Organic ranking for competitor brand terms is nearly impossible and not advisable

**Exact Product / Model Keywords:**
- Highly specific (model numbers, product codes, compatibility terms)
- Example: "replacement filter for Instant Pot Duo 7-in-1"
- Low volume, extremely high conversion — the buyer knows exactly what they want

**Seasonal / Trend Keywords:**
- Volume spikes in specific periods
- Example: "Christmas gift for dad", "back to school supplies", "valentines day gift for her"
- Must be anticipated and loaded into the listing before the season — Amazon's algorithm needs time to index and test relevance

---

### 4.4 By Volume Tier

| Tier | Monthly Search Volume | Role in Strategy |
|------|----------------------|-----------------|
| **Head terms** | 50,000+ | Brand awareness, difficult to rank, expensive in PPC |
| **Torso / Mid-tail** | 5,000–50,000 | Core ranking targets — best ROI for most products |
| **Long-tail** | 500–5,000 | High-intent, easier to rank, good conversion |
| **Micro long-tail** | <500 | Niche, very specific use cases; valuable in bulk |

A balanced keyword strategy typically targets 2–3 head terms, 5–10 torso terms, and 15–30+ long-tail/micro long-tail terms.

---

### 4.5 By Performance Metric (What the Data Tells You)

**Search Volume:** How often a keyword is searched. Raw popularity. Does not tell you if the keyword converts.

**Search Frequency Rank (SFR):** Amazon's relative ranking of keyword popularity. More reliable for comparison than raw volume numbers (which are modeled by third-party tools).

**Impression Share:** Your ASIN's visibility for a query as a % of total market impressions. Low impression share = you're either not indexed, not ranking, or being outspent in ads.

**Click Share:** Your ASIN's share of total clicks for a query. Low click share despite impressions = weak main image, poor title for that query, or strong competition.

**Purchase Share / Conversion Share:** Your share of actual purchases resulting from a query. The most meaningful metric. A gap between click share and purchase share signals a listing quality or pricing issue.

**ACoS / ROAS (PPC Data):** Advertising Cost of Sale / Return on Ad Spend for a keyword. High ACoS doesn't always mean "kill the keyword" — it might signal the need for better creative or a bid adjustment.

**Organic Rank:** Where your ASIN appears naturally in search results for a keyword. Track over time to measure the impact of listing optimization or external traffic campaigns.

**Sponsored Rank:** Your ad position for a keyword. Paired with organic rank to understand total SERP ownership.

**Title Density:** How many of the top-ranked listings include a keyword in their title. High title density = keyword is considered critical to the category by competitors; low title density = potential opportunity or a sign the keyword is less relevant.

**Competing Products:** Number of listings targeting a keyword. High competition doesn't automatically disqualify a term — if you can out-convert the competition, you can still win.

**Keyword Sales Estimate:** Third-party tools estimate how many units are sold monthly through a specific keyword. Directionally useful, not precise.

---

## 5. PPC Match Types — Keyword Research Implications

Understanding match types is essential because your ad search term reports are one of your best keyword discovery channels.

| Match Type | How It Works | Research Use |
|------------|-------------|--------------|
| **Broad Match** | Keyword terms can appear in any order; includes synonyms, related terms, semantic variations | Discovery — casts the widest net; mine search term reports for new keywords |
| **Phrase Match** | Keyword terms must appear in order, but other words can appear before/after | Mid-funnel scaling — captures variations while maintaining relevance |
| **Exact Match** | Query must exactly match the keyword (plus close plurals/misspellings) | Conversion focus — only use for proven, high-intent keywords |
| **Auto (Close Match)** | Amazon finds queries closely related to your product | Discovery of queries you'd never think to target manually |
| **Auto (Loose Match)** | Broader semantic matching | Category-level discovery; often less relevant, more exploratory |
| **Auto (Substitutes)** | Queries for competing/similar products | Competitor conquest discovery |
| **Auto (Complements)** | Queries for products bought alongside yours | Cross-category keyword discovery |

**Analyst workflow:** Run auto + broad campaigns → audit search term reports weekly → harvest converting terms into phrase/exact campaigns → negate irrelevant terms → feed new terms back into listing copy.

---

## 6. Analyst Workflow: Putting It All Together

### Phase 1 — Seed & Expand
1. Start with autocomplete on Amazon for your core product category terms
2. Run Helium 10 Magnet on your 3–5 seed keywords to expand the universe
3. Run Cerebro on your top 5–10 competitors' ASINs to find what they rank for that you don't

### Phase 2 — Validate & Prioritize
1. Pull SQP report from Brand Analytics — overlay your brand data against the market to identify:
   - High-volume terms you're invisible for (impression share = 0)
   - Terms you show for but don't click (impression share high, click share low)
   - Terms you click but don't convert (click share high, purchase share low)
2. Check your Advertising Search Term Report — what's actually converting for you in PPC right now?
3. Cross-reference third-party volume estimates with SQP volume to calibrate how accurate your tool's numbers are for your category

### Phase 3 — Segment & Assign
Categorize your final keyword list by:
- **Tier** (head / torso / long-tail)
- **Placement** (title, bullets, backend, PPC campaign)
- **Intent type** (generic, feature, use-case, seasonal)
- **Current status** (ranked, not ranked, indexed, not indexed)

### Phase 4 — Monitor & Iterate
- Track organic rank weekly for your target keywords (Helium 10 Keyword Tracker or equivalent)
- Pull SQP monthly — watch for trend shifts in query volume and share
- After any listing change, run an indexing check 48–72 hours later to confirm the new keywords are indexed
- Feed PPC search term data back into listing copy quarterly

---

## 7. Common Analyst Mistakes to Avoid

**Trusting third-party volume over SQP.** External tool volume is modeled. SQP is reality. When they disagree, trust SQP.

**Keyword stuffing in the title.** Amazon's algorithm is sophisticated enough to parse natural language. An unreadable title hurts CTR, which hurts rank more than keyword density helps it.

**Repeating backend keywords in the frontend.** Wastes limited backend space. Amazon already indexes frontend terms.

**Optimizing only for impressions.** A keyword can generate thousands of impressions and zero purchases. Always follow the funnel: impressions → clicks → purchases.

**Ignoring seasonality.** Seasonal keywords need to be in the listing 4–6 weeks before the season peaks — not after. Amazon needs time to index, rank, and validate relevance.

**Overlooking long-tail in favor of head terms.** Most conversion volume comes from hundreds of long-tail terms, not a handful of head terms. Long-tail terms compound.

**Not monitoring rank changes post-edit.** Listing changes can cause rank fluctuations. Without tracking, you can't attribute whether a change helped or hurt.

---

## 8. Quick Reference: Data Source Cheat Sheet

| Data Source | Access Requirement | What It Tells You | Best For |
|-------------|-------------------|-------------------|---------|
| Amazon Autocomplete | Anyone | What customers search | Seed discovery |
| SQP Report | Brand Registry | Full funnel metrics, market share | Truth-checking, funnel analysis |
| ABA Top Search Terms | Brand Registry | SFR, top ASIN click/conversion share | Competitive intel |
| Ad Search Term Report | Active PPC campaigns | What actually converted | Harvest & negate |
| Helium 10 Cerebro | Paid subscription | Competitor keyword rank data | Gap analysis |
| Helium 10 Magnet | Paid subscription | Keyword expansion + estimates | Keyword universe building |
| DataDive | Paid subscription | Niche-level keyword maps | Market entry research |
| Jungle Scout Keyword Scout | Paid subscription | Volume estimates + difficulty | Initial product validation |
| SellerSprite | Free + paid | Filter-driven discovery | Budget-friendly expansion |
| Keepa | Paid subscription | BSR history | Demand validation |
| Google Trends | Free | Seasonality patterns | Timing strategy |

---

*Last updated: May 2026*
