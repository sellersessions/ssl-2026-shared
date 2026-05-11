# Multi-Marketplace Technical Patterns — Expert Reference for syncflow

> **Scope:** Architecture, schema design, and workflow patterns for building Amazon seller systems that operate across multiple marketplaces simultaneously — without duplicating logic or creating a spaghetti maintenance nightmare. This is a practitioner reference, not a neutral survey. When it says "do this," it means it.  
> **Stack Context:** n8n + Supabase + ClickUp + SP-API  
> **System Context:** syncflow — the AI agent platform that builds automation modules for Amazon sellers expanding internationally.  
> **Last Updated:** May 2026

---

## Table of Contents

1. [Amazon Marketplace Structure](#1-amazon-marketplace-structure)
2. [SP-API Credential Architecture for Multi-Marketplace](#2-sp-api-credential-architecture-for-multi-marketplace)
3. [Supabase Schema Strategy — The Core Architectural Decision](#3-supabase-schema-strategy--the-core-architectural-decision)
4. [Core Multi-Marketplace Schema (Full SQL)](#4-core-multi-marketplace-schema-full-sql)
5. [Localisation Data Patterns](#5-localisation-data-patterns)
6. [Currency Handling](#6-currency-handling)
7. [n8n Workflow Patterns for Multi-Marketplace](#7-n8n-workflow-patterns-for-multi-marketplace)
8. [Scheduling Across Marketplaces — Timezone Arithmetic](#8-scheduling-across-marketplaces--timezone-arithmetic)
9. [Translation Workflow Decision Guide](#9-translation-workflow-decision-guide)
10. [Content Compliance Per Marketplace](#10-content-compliance-per-marketplace)
11. [Inventory Synchronisation Across Marketplaces](#11-inventory-synchronisation-across-marketplaces)
12. [Reporting Aggregation — Cross-Marketplace Analytics](#12-reporting-aggregation--cross-marketplace-analytics)
13. [ClickUp Structure for Multi-Marketplace Operations](#13-clickup-structure-for-multi-marketplace-operations)
14. [Common Mistakes That Hurt Expanding Teams](#14-common-mistakes-that-hurt-expanding-teams)
15. [Practical Expansion Sequence](#15-practical-expansion-sequence)
16. [Dos & Don'ts](#16-dos--donts)
17. [Quick Reference Cheat Sheet](#17-quick-reference-cheat-sheet)

---

## 1. Amazon Marketplace Structure

### The Three Regions

Amazon organises marketplaces into three regional API clusters. This is not just geography — it determines which SP-API endpoint you call, which LWA credentials apply, and how shipping/FBA inventory is pooled.

| Region | SP-API Endpoint | Marketplaces |
|---|---|---|
| **North America (NA)** | `https://sellingpartnerapi-na.amazon.com` | US, CA, MX, BR |
| **Europe (EU)** | `https://sellingpartnerapi-eu.amazon.com` | UK, DE, FR, IT, ES, NL, SE, PL, TR, SA, AE, EG, IN, BE |
| **Far East (FE)** | `https://sellingpartnerapi-fe.amazon.com` | JP, AU, SG |

### Complete Marketplace ID Reference Table

This is the single most-referenced table in any multi-marketplace implementation. Every SP-API call that touches a specific marketplace requires the `marketplaceId` parameter. Get this wrong and you get a 403 or empty results with no useful error.

| Marketplace | Country | Marketplace ID | Region | Currency | Language |
|---|---|---|---|---|---|
| Amazon.com | United States | `ATVPDKIKX0DER` | NA | USD | en_US |
| Amazon.ca | Canada | `A2EUQ1WTGCTBG2` | NA | CAD | en_CA / fr_CA |
| Amazon.com.mx | Mexico | `A1AM78C64UM0Y8` | NA | MXN | es_MX |
| Amazon.com.br | Brazil | `A2Q3Y263D00KWC` | NA | BRL | pt_BR |
| Amazon.co.uk | United Kingdom | `A1F83G8C2ARO7P` | EU | GBP | en_GB |
| Amazon.de | Germany | `A1PA6795UKMFR9` | EU | EUR | de_DE |
| Amazon.fr | France | `A13V1IB3VIYZZH` | EU | EUR | fr_FR |
| Amazon.it | Italy | `APJ6JRA9NG5V4` | EU | EUR | it_IT |
| Amazon.es | Spain | `A1RKKUPIHCS9HS` | EU | EUR | es_ES |
| Amazon.nl | Netherlands | `A1805IZSGTT6HS` | EU | EUR | nl_NL |
| Amazon.se | Sweden | `A2NODRKZP88ZB9` | EU | SEK | sv_SE |
| Amazon.pl | Poland | `A1C3SOZRARQ6R3` | EU | PLN | pl_PL |
| Amazon.com.tr | Turkey | `A33AVAJ2PDY3EV` | EU | TRY | tr_TR |
| Amazon.sa | Saudi Arabia | `A17E79C6D8DWNP` | EU | SAR | ar_SA |
| Amazon.ae | United Arab Emirates | `A2VIGQ35RCS4UG` | EU | AED | ar_AE |
| Amazon.eg | Egypt | `ARBP9OOSHTCHU` | EU | EGP | ar_EG |
| Amazon.in | India | `A21TJRUUN4KGV` | EU | INR | en_IN |
| Amazon.com.be | Belgium | `AMEN7PMS3EDWL` | EU | EUR | fr_BE / nl_BE |
| Amazon.co.jp | Japan | `A1VC38T7YXB528` | FE | JPY | ja_JP |
| Amazon.com.au | Australia | `A39IBJ37TRP1C6` | FE | AUD | en_AU |
| Amazon.sg | Singapore | `A19VAU5U5O7RUS` | FE | SGD | en_SG |

> **Store this table in Supabase** as a `marketplaces` reference table (see Section 4). Never hardcode marketplace IDs in workflow logic — reference the database.

### Regional API Clusters and What They Mean

The region boundary matters beyond just the API endpoint:

- **Shared LWA credentials:** A single seller account covers all marketplaces within a region under one refresh token. A US seller's NA token covers US, CA, MX, and BR.
- **Separate seller accounts for different regions:** Most sellers expanding internationally create separate seller accounts for EU (registered at Seller Central EU) and FE (registered at Seller Central FE). These are distinct accounts with distinct LWA tokens.
- **FBA pools by region:** North America FBA is separate from EU FBA, which is separate from FE FBA. Inventory does not transfer automatically between regions.
- **Reports are region-scoped:** A Business Report pulled from the NA endpoint gives NA data only. You cannot aggregate across regions in a single SP-API report call.

---

## 2. SP-API Credential Architecture for Multi-Marketplace

### The Single Account vs. Multi-Account Reality

**Within a region:** One seller account, one LWA refresh token, covers all marketplaces in that region. A single `getOrders` call can specify `marketplaceIds=['ATVPDKIKX0DER', 'A2EUQ1WTGCTBG2']` to get US + CA orders together. No extra auth required.

**Across regions:** You must have separate seller accounts (one for NA, one for EU, one for FE) and therefore separate LWA refresh tokens per account. Token A covers NA. Token B covers EU. Token C covers FE. They cannot be mixed.

This means: if a seller sells in US, UK, and Japan, you are managing **three separate credential sets** minimum.

### Credential Storage in Supabase Vault

Never store LWA credentials in plain Supabase columns. Use **Supabase Vault** (`vault.secrets`) for the refresh token (the sensitive part), and store non-sensitive metadata in a standard `seller_accounts` table.

```sql
-- seller_accounts: the non-sensitive metadata
CREATE TABLE seller_accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id           TEXT NOT NULL UNIQUE,           -- Amazon Seller ID (e.g., A1B2C3D4E5F6G7)
    account_name        TEXT NOT NULL,                  -- Human label: "Acme NA", "Acme EU"
    region              TEXT NOT NULL CHECK (region IN ('NA', 'EU', 'FE')),
    marketplace_ids     TEXT[] NOT NULL,                -- All marketplaces this account covers
    lwa_client_id       TEXT NOT NULL,                  -- From Developer Central (not that sensitive)
    refresh_token_secret_id UUID,                       -- FK to vault.secrets
    api_endpoint        TEXT NOT NULL,                  -- e.g., https://sellingpartnerapi-na.amazon.com
    iam_role_arn        TEXT,                           -- AWS IAM role for SigV4 signing
    active              BOOLEAN NOT NULL DEFAULT true,
    token_last_refreshed_at TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Store the actual refresh token in Vault
SELECT vault.create_secret(
    'lwa_refresh_token_acme_na',               -- name
    'Atzr|IwEB...',                             -- the actual refresh token value
    'LWA refresh token for Acme North America account'
);
```

### Token Refresh Without Cross-Contamination

The risk in multi-account systems is accidentally using token A (NA) to call an EU endpoint, or vice versa. The pattern that prevents this:

```python
# credentials_service.py
import boto3
import requests
from functools import lru_cache
from datetime import datetime, timedelta

TOKEN_CACHE = {}  # key: seller_id, value: {access_token, expires_at}

def get_access_token(seller_id: str) -> str:
    """
    Always fetch the token for a specific seller_id. Never share tokens
    between seller accounts. Cache per seller, not globally.
    """
    cached = TOKEN_CACHE.get(seller_id)
    if cached and cached['expires_at'] > datetime.utcnow() + timedelta(minutes=5):
        return cached['access_token']

    # Fetch seller account metadata from Supabase
    account = supabase.table('seller_accounts').select('*').eq('seller_id', seller_id).single().execute()
    
    # Fetch refresh token from Vault
    refresh_token = supabase.rpc('vault.decrypted_secrets', {'id': account.data['refresh_token_secret_id']}).execute()

    # Exchange for access token
    response = requests.post('https://api.amazon.com/auth/o2/token', data={
        'grant_type': 'refresh_token',
        'client_id': account.data['lwa_client_id'],
        'client_secret': get_lwa_client_secret(account.data['lwa_client_id']),  # from Vault too
        'refresh_token': refresh_token.data[0]['decrypted_secret']
    })
    
    token_data = response.json()
    TOKEN_CACHE[seller_id] = {
        'access_token': token_data['access_token'],
        'expires_at': datetime.utcnow() + timedelta(seconds=token_data['expires_in'])
    }
    return TOKEN_CACHE[seller_id]['access_token']
```

In n8n: store `seller_id` as a workflow input parameter. Pass it to every SP-API HTTP Request node as context so the credential lookup is always scoped to that seller. Never hardcode a refresh token into an n8n credential — store it in Vault and retrieve it via a Supabase node at the start of each workflow execution.

### Managing Multiple Credential Sets in n8n

For n8n workflows that loop across multiple seller accounts:

1. Create a `Get All Active Seller Accounts` Supabase node at the start of the workflow.
2. Use a **SplitInBatches** or **Loop Over Items** node to iterate over each account.
3. Pass `seller_id` and `region` as item fields through the workflow.
4. Each SP-API HTTP Request node uses `{{ $json.api_endpoint }}` (from the account record) as the base URL — never a hardcoded endpoint.
5. Tokens are fetched fresh per account in a Code node that calls your token service.

---

## 3. Supabase Schema Strategy — The Core Architectural Decision

This is the decision that defines your maintenance burden for the next three years. Get it right upfront.

### Option A: `marketplace_id` Column on Every Table (Recommended)

Add a `marketplace_id` foreign key to any table that contains marketplace-specific data. A single `listings` table holds all listings for all marketplaces, differentiated by the `marketplace_id` column.

**When to use this:** Always. For virtually every Amazon seller operation — even large multi-brand agencies managing 15 marketplaces. The simplicity of unified queries, a single migration to apply, and straightforward aggregations makes this the right default.

**Example:**
```sql
-- One table for all marketplaces
SELECT asin, title, price, marketplace_id
FROM marketplace_listings
WHERE brand_id = 'acme'
ORDER BY marketplace_id, asin;

-- Filter to a single marketplace — trivial
WHERE marketplace_id = 'ATVPDKIKX0DER'

-- Aggregate across all marketplaces — also trivial
SELECT marketplace_id, COUNT(*) as listing_count, AVG(price_usd) as avg_price_usd
FROM marketplace_listings
GROUP BY marketplace_id;
```

### Option B: Separate Schemas Per Marketplace

Create a PostgreSQL schema per marketplace: `us_listings`, `uk_listings`, `de_listings`, etc. Each schema has identical table structures.

**When to use this:** Almost never. Only justified when you have hard data residency requirements (e.g., EU data must not sit in the same schema as US data for GDPR compliance reasons, enforced by auditors). Even then, a properly configured RLS policy on a single schema is usually sufficient and easier to manage.

**Why it hurts:** Cross-marketplace queries require `UNION ALL` across schemas. Every schema change (add a column, create an index) must be applied to N schemas. Migrations become `N × complexity` instead of `1 × complexity`. In a year, your staging schema has 14 marketplaces and you've applied 60 migrations to each. You will forget one. The schemas will drift. It becomes a nightmare.

**Verdict:** Use Option A (marketplace_id column) unless you have a specific, documented, auditor-reviewed compliance reason not to.

### The Composite Unique Constraint Pattern

For any table where the natural key includes an ASIN (or SKU) plus a marketplace:

```sql
-- Correct: ASIN is unique per marketplace, not globally
ALTER TABLE marketplace_listings 
ADD CONSTRAINT uq_listing_asin_marketplace 
UNIQUE (asin, marketplace_id);

-- Wrong: An ASIN can exist in multiple marketplaces with different data
-- UNIQUE (asin)  -- DON'T DO THIS
```

The same ASIN (B08N5WRWNW) can exist in US, UK, and DE with different titles, prices, and bullet points. The composite key is `(asin, marketplace_id)`, full stop.

---

## 4. Core Multi-Marketplace Schema (Full SQL)

This is the full baseline schema for a syncflow multi-marketplace deployment. Run this as a migration.

```sql
-- ============================================================
-- REFERENCE: marketplaces
-- Static reference table. Seed once, rarely changes.
-- ============================================================
CREATE TABLE marketplaces (
    marketplace_id      TEXT PRIMARY KEY,               -- Amazon's marketplace ID string
    country_code        TEXT NOT NULL,                  -- ISO 3166-1 alpha-2 (US, GB, DE, etc.)
    country_name        TEXT NOT NULL,
    region              TEXT NOT NULL CHECK (region IN ('NA', 'EU', 'FE')),
    currency_code       TEXT NOT NULL,                  -- ISO 4217 (USD, GBP, EUR, etc.)
    language_code       TEXT NOT NULL,                  -- Primary language (en_US, de_DE, etc.)
    api_endpoint        TEXT NOT NULL,
    timezone            TEXT NOT NULL,                  -- IANA timezone for scheduling (America/New_York, Europe/London, etc.)
    vat_applies         BOOLEAN NOT NULL DEFAULT false, -- EU/UK marketplaces = true
    active              BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the reference data
INSERT INTO marketplaces VALUES
  ('ATVPDKIKX0DER', 'US', 'United States',   'NA', 'USD', 'en_US', 'https://sellingpartnerapi-na.amazon.com', 'America/New_York',    false, true, NOW()),
  ('A2EUQ1WTGCTBG2', 'CA', 'Canada',          'NA', 'CAD', 'en_CA', 'https://sellingpartnerapi-na.amazon.com', 'America/Toronto',     false, true, NOW()),
  ('A1AM78C64UM0Y8', 'MX', 'Mexico',          'NA', 'MXN', 'es_MX', 'https://sellingpartnerapi-na.amazon.com', 'America/Mexico_City', false, true, NOW()),
  ('A2Q3Y263D00KWC', 'BR', 'Brazil',          'NA', 'BRL', 'pt_BR', 'https://sellingpartnerapi-na.amazon.com', 'America/Sao_Paulo',   false, true, NOW()),
  ('A1F83G8C2ARO7P', 'GB', 'United Kingdom',  'EU', 'GBP', 'en_GB', 'https://sellingpartnerapi-eu.amazon.com', 'Europe/London',       true,  true, NOW()),
  ('A1PA6795UKMFR9', 'DE', 'Germany',         'EU', 'EUR', 'de_DE', 'https://sellingpartnerapi-eu.amazon.com', 'Europe/Berlin',       true,  true, NOW()),
  ('A13V1IB3VIYZZH', 'FR', 'France',          'EU', 'EUR', 'fr_FR', 'https://sellingpartnerapi-eu.amazon.com', 'Europe/Paris',        true,  true, NOW()),
  ('APJ6JRA9NG5V4',  'IT', 'Italy',           'EU', 'EUR', 'it_IT', 'https://sellingpartnerapi-eu.amazon.com', 'Europe/Rome',         true,  true, NOW()),
  ('A1RKKUPIHCS9HS', 'ES', 'Spain',           'EU', 'EUR', 'es_ES', 'https://sellingpartnerapi-eu.amazon.com', 'Europe/Madrid',       true,  true, NOW()),
  ('A1805IZSGTT6HS', 'NL', 'Netherlands',     'EU', 'EUR', 'nl_NL', 'https://sellingpartnerapi-eu.amazon.com', 'Europe/Amsterdam',    true,  true, NOW()),
  ('A2NODRKZP88ZB9', 'SE', 'Sweden',          'EU', 'SEK', 'sv_SE', 'https://sellingpartnerapi-eu.amazon.com', 'Europe/Stockholm',    true,  true, NOW()),
  ('A1C3SOZRARQ6R3', 'PL', 'Poland',          'EU', 'PLN', 'pl_PL', 'https://sellingpartnerapi-eu.amazon.com', 'Europe/Warsaw',       true,  true, NOW()),
  ('A17E79C6D8DWNP', 'SA', 'Saudi Arabia',    'EU', 'SAR', 'ar_SA', 'https://sellingpartnerapi-eu.amazon.com', 'Asia/Riyadh',         false, true, NOW()),
  ('A21TJRUUN4KGV',  'IN', 'India',           'EU', 'INR', 'en_IN', 'https://sellingpartnerapi-eu.amazon.com', 'Asia/Kolkata',        true,  true, NOW()),
  ('A1VC38T7YXB528', 'JP', 'Japan',           'FE', 'JPY', 'ja_JP', 'https://sellingpartnerapi-fe.amazon.com', 'Asia/Tokyo',          false, true, NOW()),
  ('A39IBJ37TRP1C6', 'AU', 'Australia',       'FE', 'AUD', 'en_AU', 'https://sellingpartnerapi-fe.amazon.com', 'Australia/Sydney',    true,  true, NOW()),
  ('A19VAU5U5O7RUS', 'SG', 'Singapore',       'FE', 'SGD', 'en_SG', 'https://sellingpartnerapi-fe.amazon.com', 'Asia/Singapore',      true,  true, NOW());

-- ============================================================
-- SELLER ACCOUNTS
-- One row per Amazon seller account (one per region typically)
-- ============================================================
CREATE TABLE seller_accounts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id               TEXT NOT NULL UNIQUE,
    account_name            TEXT NOT NULL,
    region                  TEXT NOT NULL CHECK (region IN ('NA', 'EU', 'FE')),
    marketplace_ids         TEXT[] NOT NULL,
    lwa_client_id           TEXT NOT NULL,
    refresh_token_secret_id UUID,                   -- vault.secrets FK
    iam_role_arn            TEXT,
    active                  BOOLEAN NOT NULL DEFAULT true,
    token_last_refreshed_at TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MARKETPLACE LISTINGS
-- Core listing data per ASIN per marketplace
-- ============================================================
CREATE TABLE marketplace_listings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asin                TEXT NOT NULL,
    sku                 TEXT,                           -- Seller SKU (varies per marketplace)
    marketplace_id      TEXT NOT NULL REFERENCES marketplaces(marketplace_id),
    seller_account_id   UUID NOT NULL REFERENCES seller_accounts(id),
    brand_id            UUID,                           -- FK to your brands table
    title               TEXT,
    bullet_points       JSONB,                          -- Array of bullet point strings
    description         TEXT,
    main_image_url      TEXT,
    product_type        TEXT,
    category            TEXT,
    status              TEXT NOT NULL DEFAULT 'active' 
                            CHECK (status IN ('active', 'inactive', 'suppressed', 'deleted', 'unknown')),
    suppression_reason  TEXT,
    buy_box_eligible    BOOLEAN,
    is_fba              BOOLEAN,
    fulfillment_channel TEXT,                           -- 'AMAZON_NA', 'AMAZON_EU', 'DEFAULT' (MFN)
    raw_sp_api_data     JSONB,                          -- Full SP-API response snapshot
    last_synced_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_listing_asin_marketplace UNIQUE (asin, marketplace_id)
);

CREATE INDEX idx_listings_marketplace ON marketplace_listings(marketplace_id);
CREATE INDEX idx_listings_asin ON marketplace_listings(asin);
CREATE INDEX idx_listings_status ON marketplace_listings(status);
CREATE INDEX idx_listings_seller_account ON marketplace_listings(seller_account_id);

-- ============================================================
-- MARKETPLACE INVENTORY
-- Current inventory levels per ASIN per marketplace/fulfillment center
-- ============================================================
CREATE TABLE marketplace_inventory (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asin                    TEXT NOT NULL,
    sku                     TEXT NOT NULL,
    marketplace_id          TEXT NOT NULL REFERENCES marketplaces(marketplace_id),
    seller_account_id       UUID NOT NULL REFERENCES seller_accounts(id),
    fulfillable_quantity    INTEGER NOT NULL DEFAULT 0,
    reserved_quantity       INTEGER NOT NULL DEFAULT 0,
    unfulfillable_quantity  INTEGER NOT NULL DEFAULT 0,
    inbound_quantity        INTEGER NOT NULL DEFAULT 0,     -- In transit to FC
    total_quantity          INTEGER GENERATED ALWAYS AS 
                                (fulfillable_quantity + reserved_quantity + unfulfillable_quantity + inbound_quantity) STORED,
    days_of_supply          NUMERIC(8,2),                  -- Calculated from sales velocity
    reorder_recommended     BOOLEAN NOT NULL DEFAULT false,
    fc_id                   TEXT,                           -- Fulfillment center ID if known
    synced_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_inventory_sku_marketplace UNIQUE (sku, marketplace_id)
);

CREATE INDEX idx_inventory_marketplace ON marketplace_inventory(marketplace_id);
CREATE INDEX idx_inventory_asin ON marketplace_inventory(asin);
CREATE INDEX idx_inventory_reorder ON marketplace_inventory(reorder_recommended) WHERE reorder_recommended = true;

-- ============================================================
-- MARKETPLACE PRICING HISTORY
-- Snapshots of pricing over time per ASIN per marketplace
-- ============================================================
CREATE TABLE marketplace_pricing_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asin                TEXT NOT NULL,
    marketplace_id      TEXT NOT NULL REFERENCES marketplaces(marketplace_id),
    seller_account_id   UUID NOT NULL REFERENCES seller_accounts(id),
    our_price           NUMERIC(12,2) NOT NULL,
    our_price_currency  TEXT NOT NULL,                  -- ISO 4217
    our_price_usd       NUMERIC(12,2),                  -- Converted to USD at snapshot time
    buy_box_price       NUMERIC(12,2),
    buy_box_currency    TEXT,
    lowest_offer_price  NUMERIC(12,2),
    buy_box_won         BOOLEAN,
    fx_rate_used        NUMERIC(12,6),                  -- Rate used for USD conversion
    snapshotted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pricing_asin_marketplace ON marketplace_pricing_history(asin, marketplace_id);
CREATE INDEX idx_pricing_snapshot ON marketplace_pricing_history(snapshotted_at DESC);

-- Partition this table by month when it grows large
-- ALTER TABLE marketplace_pricing_history PARTITION BY RANGE (snapshotted_at);
```

---

## 5. Localisation Data Patterns

### The Core Problem

Your US listing copy cannot be copy-pasted to DE. Even if you just translated it word for word, it would be wrong — DE buyers expect different information, different formatting, different detail levels. Translation is step one; localisation is the goal.

### The `listing_content` Table

Separate the localised content from the listing metadata. This lets you track translation status, detect content drift, and manage approval workflows independently of the core listing record.

```sql
CREATE TABLE listing_content (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asin                TEXT NOT NULL,
    marketplace_id      TEXT NOT NULL REFERENCES marketplaces(marketplace_id),
    language_code       TEXT NOT NULL,                  -- e.g., de_DE, fr_FR, en_GB
    source_marketplace_id TEXT,                         -- Which marketplace this was translated FROM
    title               TEXT,
    title_char_count    INTEGER GENERATED ALWAYS AS (char_length(title)) STORED,
    bullet_points       JSONB,                          -- Array: ["Bullet 1", "Bullet 2", ...]
    description         TEXT,
    backend_keywords    TEXT,                           -- Space-separated, not visible to buyers
    a_plus_content      JSONB,                          -- A+ module content if applicable
    status              TEXT NOT NULL DEFAULT 'draft' 
                            CHECK (status IN ('draft', 'machine_translated', 'human_reviewed', 'approved', 'live', 'needs_review')),
    translation_method  TEXT CHECK (translation_method IN ('deepl', 'gpt4o', 'human', 'native')),
    translated_at       TIMESTAMPTZ,
    reviewed_by         TEXT,                           -- ClickUp assignee or team member name
    reviewed_at         TIMESTAMPTZ,
    source_content_hash TEXT,                           -- Hash of source content when translated
    needs_retranslation BOOLEAN NOT NULL DEFAULT false, -- Set true when source changes
    compliance_checked  BOOLEAN NOT NULL DEFAULT false,
    compliance_notes    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_content_asin_marketplace_lang UNIQUE (asin, marketplace_id, language_code)
);

CREATE INDEX idx_content_status ON listing_content(status);
CREATE INDEX idx_content_needs_retranslation ON listing_content(needs_retranslation) WHERE needs_retranslation = true;
CREATE INDEX idx_content_marketplace ON listing_content(marketplace_id);
```

### Detecting Content Drift

When US source content is updated, all translated versions become stale. Detect this automatically:

```sql
-- Function: flag translated content when source has changed
CREATE OR REPLACE FUNCTION flag_stale_translations()
RETURNS TRIGGER AS $$
BEGIN
    -- When source content (US) is updated, flag all translations of this ASIN
    IF NEW.marketplace_id = 'ATVPDKIKX0DER' AND 
       MD5(COALESCE(NEW.title,'') || COALESCE(NEW.description,'') || COALESCE(NEW.bullet_points::text,'')) 
       != MD5(COALESCE(OLD.title,'') || COALESCE(OLD.description,'') || COALESCE(OLD.bullet_points::text,'')) THEN
        
        UPDATE listing_content
        SET needs_retranslation = true,
            status = 'needs_review'
        WHERE asin = NEW.asin 
          AND marketplace_id != 'ATVPDKIKX0DER'
          AND status IN ('approved', 'live', 'machine_translated', 'human_reviewed');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_flag_stale_translations
AFTER UPDATE ON listing_content
FOR EACH ROW EXECUTE FUNCTION flag_stale_translations();
```

---

## 6. Currency Handling

### The Cardinal Rule

**Never compare prices from different currencies directly.** GBP 19.99 is not the same as EUR 19.99. Storing prices only in local currency and then trying to do cross-marketplace analysis is the #1 data bug in multi-marketplace systems.

**Always store:**
1. `price_local` — the actual price in the marketplace's native currency (what the buyer sees)
2. `price_usd` — the equivalent in USD at the time of the snapshot
3. `fx_rate_used` — the exchange rate applied at snapshot time

### The `fx_rates` Table

```sql
CREATE TABLE fx_rates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_pair   TEXT NOT NULL,                  -- e.g., 'GBP_USD', 'EUR_USD', 'JPY_USD'
    from_currency   TEXT NOT NULL,                  -- ISO 4217
    to_currency     TEXT NOT NULL DEFAULT 'USD',
    rate            NUMERIC(16,8) NOT NULL,          -- How many to_currency per 1 from_currency
    source          TEXT NOT NULL DEFAULT 'exchangerate-api',
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fx_pair_time UNIQUE (currency_pair, fetched_at)
);

CREATE INDEX idx_fx_pair ON fx_rates(currency_pair, fetched_at DESC);
```

### When to Snapshot vs. Live Convert

**Snapshot (store fx_rate_used alongside each price record):** Use for historical pricing, order revenue, settlement data. You need to know what the exchange rate was *at the time the event happened*, not today's rate. A sale in February at GBP 29.99 should be recorded as ~$38 USD using February's rate, not today's rate.

**Live convert (fetch current rate at query time):** Use for current price comparisons and dashboards that show "right now" pricing. Still reference `fx_rates` table — don't hardcode rates.

### n8n Currency Conversion Node Pattern

```javascript
// Code node: convert price to USD using latest fx_rate from Supabase
const marketplaceCurrency = $json.currency_code;      // e.g., 'GBP'
const localPrice = $json.price_local;

if (marketplaceCurrency === 'USD') {
  return [{ json: { ...$json, price_usd: localPrice, fx_rate_used: 1.0 } }];
}

// Fetch latest rate from Supabase (set up Supabase node before this Code node)
const fxRates = $node["Get FX Rates"].json; // pre-fetched in earlier node
const pair = `${marketplaceCurrency}_USD`;
const rate = fxRates.find(r => r.currency_pair === pair)?.rate;

if (!rate) throw new Error(`No FX rate found for ${pair}`);

return [{
  json: {
    ...$json,
    price_usd: Math.round(localPrice * rate * 100) / 100,
    fx_rate_used: rate
  }
}];
```

### Refresh FX Rates Daily

Set up a scheduled n8n workflow to refresh rates from a free tier API (exchangerate-api.com or open.er-api.com) once daily. Store per-currency-pair. Major currency pairs (USD, GBP, EUR, CAD, JPY, AUD, SEK, PLN, INR) are sufficient for Amazon's marketplace set.

---

## 7. n8n Workflow Patterns for Multi-Marketplace

### The Anti-Pattern: 15 Parallel Workflows

The worst thing a syncflow user can do is build a "US listing sync" workflow, then duplicate it to build a "UK listing sync", then a "DE listing sync". After three months you have 15 workflows that are 90% identical, and when you need to fix a bug in the core logic, you fix it in 3 of the 15 and forget the rest.

**Never duplicate workflow logic per marketplace. Always parameterise.**

### The Right Pattern: Single Parameterised Workflow

One workflow, accepts `marketplace_id` as an input. Everything else flows from that.

```
[Schedule or Webhook Trigger]
        │
        ▼
[Set Node: marketplace_config]          ← Get marketplace_id from trigger input
        │
        ▼
[Supabase: Get Marketplace Details]     ← SELECT * FROM marketplaces WHERE marketplace_id = ?
        │
        ▼
[Supabase: Get Seller Account]          ← SELECT * FROM seller_accounts WHERE marketplace_ids @> ARRAY[?]
        │
        ▼
[Code: Fetch LWA Token]                 ← Token lookup scoped to this seller_account
        │
        ▼
[HTTP: SP-API Call]                     ← Base URL from marketplace.api_endpoint
        │
        ▼
[Process Results + Upsert to Supabase]
```

### Using a Set Node for Marketplace Config

```json
// Set Node configuration
{
  "marketplace_id": "={{ $json.marketplace_id }}",
  "api_endpoint": "={{ $('Get Marketplace Details').item.json.api_endpoint }}",
  "currency_code": "={{ $('Get Marketplace Details').item.json.currency_code }}",
  "language_code": "={{ $('Get Marketplace Details').item.json.language_code }}",
  "region": "={{ $('Get Marketplace Details').item.json.region }}"
}
```

### The Sub-Workflow Pattern (Execute Workflow Node)

For the "run across all marketplaces" use case, use an **orchestrator + sub-workflow** pattern:

**Orchestrator workflow** (runs on schedule):
```
[Cron Trigger: Daily 02:00 UTC]
        │
        ▼
[Supabase: Get All Active Marketplaces]
    SELECT marketplace_id, timezone FROM marketplaces 
    WHERE active = true
        │
        ▼
[Loop Over Items]
        │ (for each marketplace)
        ▼
[Execute Workflow: sync_marketplace_listings]
    Input: { marketplace_id: "ATVPDKIKX0DER" }
        │ (parallel execution, n8n queues each)
        ▼
[Merge Results + Log Completion]
```

**Sub-workflow** (`sync_marketplace_listings`):
- Webhook trigger that accepts `{ marketplace_id }`
- All logic is written once, operates on whichever marketplace it receives
- Returns summary: `{ marketplace_id, listings_synced, errors, duration_ms }`

### Loop Pattern for Bulk Operations

When you need to process a list of ASINs across a marketplace, use SplitInBatches to stay within SP-API rate limits:

```
[Get ASINs List from Supabase]  (e.g., 500 ASINs)
        │
        ▼
[SplitInBatches: batchSize=10]   ← SP-API catalog lookup allows 10 ASINs per call
        │
        ▼
[HTTP: SP-API getCatalogItem]    ← Runs once per batch
        │
        ▼
[Wait Node: 2 seconds]           ← Rate limit safety margin
        │
        ▼
[Merge]
```

---

## 8. Scheduling Across Marketplaces — Timezone Arithmetic

### The Bug That Always Bites

"Run daily at midnight" means something different for each marketplace. If you set a UTC cron job at `0 0 * * *` and your seller has active US, JP, and AU operations, you are processing JP data at 9:00 AM JST, AU data at 10:00 AM AEST, and US data at 8:00 PM ET — not what anyone intended.

### Timezone-Aware Scheduling Principles

1. **Jobs that need to run at marketplace business hours** (e.g., price monitoring, inventory checks): Schedule in the marketplace's local timezone, not UTC.
2. **Jobs that need to aggregate all marketplaces** (e.g., daily rollup reports): Run at a consistent UTC time after all marketplaces have closed (e.g., 06:00 UTC covers both JP close and US previous day).
3. **Data freshness jobs** (e.g., pulling yesterday's Business Report): Run 2–4 hours after midnight local time for that marketplace — Amazon reports have a slight lag.

### n8n Schedule Trigger with Timezone

n8n's Schedule Trigger supports a timezone field. Use it:

```json
// n8n Schedule Trigger configuration for Japan marketplace jobs
{
  "rule": {
    "interval": [{ "field": "cronExpression", "expression": "0 9 * * 1-5" }]
  },
  "timezone": "Asia/Tokyo"
}
// This fires at 09:00 JST Mon–Fri — Amazon JP prime selling hours
```

Reference the `timezone` field from the `marketplaces` table to populate this dynamically. When syncflow generates an n8n workflow for a new marketplace, pull the timezone from `SELECT timezone FROM marketplaces WHERE marketplace_id = ?` and inject it into the Schedule Trigger config.

### Staggered Execution to Avoid Rate Limit Spikes

If your orchestrator fires all marketplace jobs simultaneously, they all hit SP-API at the same moment. A single seller account with US + CA + MX + BR all getting inventory data at once will eat your token bucket in seconds. Stagger them:

```javascript
// Code node: calculate staggered delay per marketplace
const marketplaceIndex = $json.loop_index;  // 0, 1, 2, 3...
const staggerMinutes = marketplaceIndex * 5;  // 5 minutes between each marketplace

return [{
  json: {
    ...$json,
    execute_after_minutes: staggerMinutes
  }
}];
```

Then use a **Wait Node** with `{{ $json.execute_after_minutes }} minutes` before triggering each sub-workflow.

### Reference Timezone Table

| Marketplace | IANA Timezone | UTC Offset (standard) | Business Hours (local) |
|---|---|---|---|
| US | America/New_York | UTC-5 (ET) | 9am–5pm ET |
| CA | America/Toronto | UTC-5 (ET) | 9am–5pm ET |
| MX | America/Mexico_City | UTC-6 | 9am–5pm CT |
| UK | Europe/London | UTC+0 (UTC+1 BST) | 9am–5pm |
| DE/FR/IT/ES/NL | Europe/Berlin | UTC+1 (UTC+2 CEST) | 9am–5pm |
| SE | Europe/Stockholm | UTC+1 (UTC+2 CEST) | 9am–5pm |
| PL | Europe/Warsaw | UTC+1 (UTC+2 CEST) | 9am–5pm |
| IN | Asia/Kolkata | UTC+5:30 | 9am–5pm |
| SA | Asia/Riyadh | UTC+3 | 9am–5pm |
| JP | Asia/Tokyo | UTC+9 | 9am–5pm |
| AU | Australia/Sydney | UTC+10 (UTC+11 AEDT) | 9am–5pm |
| SG | Asia/Singapore | UTC+8 | 9am–5pm |

---

## 9. Translation Workflow Decision Guide

Not all content warrants the same translation approach. Matching translation method to content type saves significant cost and prevents brand voice inconsistency.

### Decision Matrix

| Content Type | Volume | Brand Voice Critical? | Recommended Method | Why |
|---|---|---|---|---|
| Main title | Low | High | Human review after DeepL | Buyer's first impression; character limits vary by marketplace |
| Bullet points (1–5) | Medium | Medium | DeepL + human review | High-visibility; compliance rules differ by market |
| Product description | Low | High | Human or LLM draft + human review | Brand narrative; long-form copy needs cultural adaptation |
| Backend keywords | Medium | No | DeepL or LLM | Not buyer-facing; keyword strategy matters more than phrasing |
| A+ content | Low | Very High | Human only | Brand storytelling; DE/FR have strict A+ compliance rules |
| Internal summaries | High | No | GPT-4o | Non-customer-facing; speed > perfection |
| Main images | — | — | Human graphic designer | Text overlays, lifestyle imagery — not translatable via API |
| Q&A responses | Medium | Medium | LLM draft + human approval | Conversational tone; needs local cultural awareness |

### DeepL API Pattern (for bullets, descriptions, keywords)

DeepL is the best automated translation for European languages. Outperforms GPT on linguistic accuracy for DE, FR, IT, ES, NL, PL, SE.

```javascript
// n8n HTTP Request node config for DeepL
{
  "method": "POST",
  "url": "https://api.deepl.com/v2/translate",
  "headers": {
    "Authorization": "DeepL-Auth-Key {{ $credentials.deepl_api_key }}"
  },
  "body": {
    "text": ["{{ $json.title }}", "{{ $json.bullet_1 }}", "{{ $json.bullet_2 }}"],
    "source_lang": "EN",
    "target_lang": "{{ $json.deepl_language_code }}",  // DE, FR, IT, ES, NL, PL, SV
    "formality": "prefer_less",  // Casual tone usually converts better on Amazon
    "preserve_formatting": true
  }
}
```

DeepL language codes differ from Amazon's. Map them:

| Marketplace | Amazon lang code | DeepL target_lang |
|---|---|---|
| DE | de_DE | DE |
| FR | fr_FR | FR |
| IT | it_IT | IT |
| ES | es_ES | ES |
| NL | nl_NL | NL |
| PL | pl_PL | PL |
| SE | sv_SE | SV |
| PT (BR) | pt_BR | PT-BR |
| JP | ja_JP | JA |

### GPT-4o Translation Pattern (for rough drafts, JP, internal use)

GPT-4o is better than DeepL for Japanese (a morphologically complex language where DeepL struggles with product naming conventions) and for content requiring cultural interpretation beyond literal translation.

```javascript
// n8n OpenAI node prompt for Amazon JP translation
const systemPrompt = `You are an expert Amazon Japan listing copywriter. 
Translate the following English product listing content to Japanese for Amazon.co.jp.
Requirements:
- Use natural, sales-oriented Japanese appropriate for online retail
- Preserve all product specifications and measurements exactly
- For brand names and trademarked terms, keep in original language (English/Latin)
- Use appropriate keigo (polite language) consistent with Amazon JP listings
- Output ONLY the translated text, no explanations`;

const userPrompt = `Title: ${$json.title}\n\nBullet points:\n${$json.bullets.join('\n')}`;
```

### Translation Status Workflow in n8n

```
[Supabase: Get content where needs_retranslation = true]
        │
        ▼
[SplitInBatches: 20 at a time]
        │
        ▼
[Switch: translation_method by marketplace_id]
    │──── EU marketplaces ──► [DeepL API]
    │──── JP marketplace  ──► [OpenAI GPT-4o]
    │──── CA/AU (English) ──► [Skip translation, copy from US]
        │
        ▼
[Supabase: Upsert listing_content]
    status = 'machine_translated'
    needs_retranslation = false
    translated_at = NOW()
        │
        ▼
[ClickUp: Create review task]   ← Assign to human reviewer
```

---

## 10. Content Compliance Per Marketplace

This section contains the differences that silently break listings. The SP-API will accept non-compliant content. Amazon will suppress it later, sometimes weeks later, without clear explanation.

### Title Character Limits by Marketplace

Amazon's character limits are not uniform. This is a constant source of suppression.

| Marketplace | Title Character Limit | Notes |
|---|---|---|
| US | 200 characters | 80 chars recommended for mobile, 200 max |
| UK | 150 characters | Stricter than US; enforced more aggressively |
| DE | 150 characters | Often 80 recommended for search visibility |
| FR, IT, ES | 150 characters | Same as UK/DE |
| JP | 100 characters (full-width) | Full-width chars count as 2 bytes in some contexts |
| AU | 200 characters | Follows US model |
| IN | 150 characters | |

**Rule:** Write for the most restrictive marketplace first (150 chars). Expand for US if desired.

### Bullet Points — Regional Expectations

**Germany (DE):** Buyers expect technical specifications in bullets — dimensions, weight, materials, certifications. "Soft and comfortable" alone will kill your conversion. Include: material composition (%), dimensions, certifications (CE, GS), country of manufacture.

**Japan (JP):** Bullets should be short (30–50 characters in Japanese), factual, and formatted consistently. Avoid exclamation marks and overly promotional language. Buyers trust specifics over hype.

**UK (post-Brexit):** UKCA mark references in content are increasingly expected for regulated products. Listing claims must comply with UK Consumer Rights Act 2015 — "best product on the market" type claims are problematic.

**India (IN):** BIS certification details should be included in bullets for regulated electronics. Country of origin must be stated clearly.

### Prohibited Terms by Marketplace

| Market | Prohibited / Regulated Category | Examples |
|---|---|---|
| DE | Health claims without certification | "Strengthens immune system", "cures", "heals" — requires clinical evidence or removal |
| DE | Comparative advertising | Direct competitor product name comparisons are legally restricted |
| EU broadly | Medical device claims | "Medical grade" without MDR certification is illegal |
| UK | Post-Brexit specific | "EU approved" or "CE only" for product categories now requiring UKCA |
| JP | Pharmaceutical Act | Any health-related claim for food/supplement products triggers pharmaceutical regulations |
| AU | ACCC compliance | "Made in Australia" requires >50% Australian content by value |
| US | FTC guidelines | "Natural", "organic" for non-certified products; "clinically proven" without studies |
| FR | Linguistic law | All required product information must be in French (Loi Toubon) |

### Regulatory Compliance Markers

| Market | Key Certifications | Where to Include |
|---|---|---|
| EU (all) | CE marking | Title, bullets, description, backend keywords |
| UK | UKCA marking | Required for products that had CE in EU; same categories |
| AU | RCM / SAA | Electrical/electronic products; similar to CE |
| IN | BIS / ISI | Mandatory for regulated product categories |
| JP | PSE mark | Electrical products — this is enforced at import level |
| DE | GS mark | Safety certification beyond CE; buyers look for it |

### Special Case: Pan-European FBA and VAT Numbers

If using Pan-European FBA, you as the seller become liable for VAT registration in every country where Amazon stores your inventory. This is a legal/financial compliance issue, not just a content compliance issue — but it must inform how you set up the account and what information appears on your listings (VAT number may be required in the seller profile for EU marketplaces).

---

## 11. Inventory Synchronisation Across Marketplaces

### FBA Is Not One Global Pool

This is the single most-misunderstood aspect of multi-marketplace FBA expansion. FBA inventory is siloed by region:

| Program | What it covers | Inventory pooling |
|---|---|---|
| North America FBA | US, CA, MX (separate programs) | Not automatically shared; Multi-Country Inventory (MCI) opt-in |
| Pan-European FBA | UK, DE, FR, IT, ES, SE, NL, PL (Amazon decides where to store) | Amazon moves inventory between EU countries automatically |
| European Fulfillment Network (EFN) | Fulfills across EU from one FC | You keep inventory in one country; Amazon ships cross-border (higher FBA fees) |
| FBA Japan | JP only | Completely separate from NA and EU |
| FBA Australia | AU only | Completely separate |
| FBA India | IN only | Completely separate |

### Pan-European FBA: The Inventory Tracking Problem

When you enroll in Pan-EU FBA, Amazon stores your inventory across their EU fulfillment centers automatically. Today your 500 units might be 200 in DE, 150 in FR, 100 in IT, 50 in ES. Tomorrow Amazon may redistribute them. You cannot control this.

What this means for your inventory system:
- The SP-API `getInventorySummaries` call for EU marketplaces reflects per-marketplace availability, but the underlying stock is shared
- You cannot "reserve" 100 units specifically for UK — Amazon's algorithm decides
- For reporting purposes: track the total EU inventory pool, not per-marketplace
- For reorder calculations: use EU aggregate demand, not per-marketplace demand

```sql
-- EU inventory view: aggregate Pan-EU pool
CREATE VIEW eu_inventory_summary AS
SELECT 
    asin,
    SUM(fulfillable_quantity) as total_eu_fulfillable,
    SUM(reserved_quantity) as total_eu_reserved,
    SUM(inbound_quantity) as total_eu_inbound,
    MAX(synced_at) as last_synced_at
FROM marketplace_inventory mi
JOIN marketplaces m ON mi.marketplace_id = m.marketplace_id
WHERE m.region = 'EU'
  AND m.marketplace_id != 'A21TJRUUN4KGV'  -- Exclude IN if not on Pan-EU
GROUP BY asin;
```

### Cross-Marketplace Demand Planning

Demand differs by marketplace — don't assume your US sales velocity predicts EU or JP demand. Build per-marketplace velocity tracking from day one:

```sql
CREATE TABLE sales_velocity (
    asin            TEXT NOT NULL,
    marketplace_id  TEXT NOT NULL REFERENCES marketplaces(marketplace_id),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    units_sold      INTEGER NOT NULL DEFAULT 0,
    daily_velocity  NUMERIC(8,2) GENERATED ALWAYS AS (
                        CASE WHEN (period_end - period_start) > 0 
                        THEN units_sold::numeric / (period_end - period_start) 
                        ELSE 0 END
                    ) STORED,
    source          TEXT NOT NULL,      -- 'sp_api_report', 'manual', 'estimated'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (asin, marketplace_id, period_start)
);
```

### Inventory Sync Workflow Frequency

| Data | Recommended Sync Frequency | Notes |
|---|---|---|
| FBA inventory quantities | Every 4 hours | Fast enough for most operations; avoid spamming the API |
| Inbound shipment status | Every 2 hours | Once items check in at FC, listings become live |
| Stranded/unfulfillable | Daily | These don't change minute-to-minute |
| Sales velocity | Daily (pull yesterday's report) | Business Report is available by ~03:00 UTC |

---

## 12. Reporting Aggregation — Cross-Marketplace Analytics

### The Goal

A single view showing revenue, orders, units, and ACOS across all marketplaces in a common currency (USD), with the ability to drill down per marketplace.

### Normalised Metrics View

```sql
-- Aggregated performance view — cross-marketplace, USD-normalised
CREATE VIEW cross_marketplace_performance AS
SELECT
    mp.asin,
    mp.marketplace_id,
    m.country_code,
    m.currency_code,
    DATE_TRUNC('day', mp.report_date) as report_date,
    
    -- Revenue in local currency
    mp.ordered_revenue_local,
    m.currency_code as local_currency,
    
    -- Revenue in USD (using historical fx rate)
    mp.ordered_revenue_local * COALESCE(fx.rate, 1) as ordered_revenue_usd,
    
    -- Volume metrics
    mp.ordered_units,
    mp.sessions,
    mp.page_views,
    
    -- Conversion
    CASE WHEN mp.sessions > 0 
         THEN ROUND((mp.ordered_units::numeric / mp.sessions * 100), 2)
         ELSE 0 
    END as unit_session_percentage,
    
    -- PPC metrics (if joined from ads table)
    mp.ad_spend_local,
    mp.ad_spend_local * COALESCE(fx.rate, 1) as ad_spend_usd,
    
    -- ACOS (using USD amounts for cross-marketplace comparability)
    CASE WHEN mp.ordered_revenue_local * COALESCE(fx.rate, 1) > 0
         THEN ROUND(
             (mp.ad_spend_local * COALESCE(fx.rate, 1)) / 
             (mp.ordered_revenue_local * COALESCE(fx.rate, 1)) * 100, 
             2
         )
         ELSE NULL
    END as acos_pct

FROM marketplace_performance_daily mp
JOIN marketplaces m ON mp.marketplace_id = m.marketplace_id
LEFT JOIN LATERAL (
    -- Use the fx rate closest to (but not after) the report date
    SELECT rate 
    FROM fx_rates fx_inner
    WHERE fx_inner.currency_pair = m.currency_code || '_USD'
      AND fx_inner.fetched_at <= mp.report_date + INTERVAL '1 day'
    ORDER BY fx_inner.fetched_at DESC
    LIMIT 1
) fx ON true;

-- Brand-level rollup
CREATE VIEW brand_performance_summary AS
SELECT
    b.brand_name,
    cp.report_date,
    SUM(cp.ordered_revenue_usd) as total_revenue_usd,
    SUM(cp.ordered_units) as total_units,
    SUM(cp.ad_spend_usd) as total_ad_spend_usd,
    CASE WHEN SUM(cp.ordered_revenue_usd) > 0
         THEN ROUND(SUM(cp.ad_spend_usd) / SUM(cp.ordered_revenue_usd) * 100, 2)
         ELSE NULL
    END as blended_acos_pct,
    COUNT(DISTINCT cp.marketplace_id) as active_marketplaces
FROM cross_marketplace_performance cp
JOIN marketplace_listings ml ON cp.asin = ml.asin AND cp.marketplace_id = ml.marketplace_id
JOIN brands b ON ml.brand_id = b.id
GROUP BY b.brand_name, cp.report_date;
```

### Pulling Reports Per Marketplace in n8n

Each marketplace report must be requested separately — there is no "give me all EU data in one call." The orchestrator workflow iterates over active seller accounts × report types:

```
[Get Active Seller Accounts]
        │
        ▼
[Loop: For each seller_account]
        │
        ▼
[Loop: For each marketplace_id in seller_account.marketplace_ids]
        │
        ▼
[SP-API: createReport]
    reportType: GET_SALES_AND_TRAFFIC_REPORT
    marketplaceIds: [marketplace_id]
    dataStartTime / dataEndTime: yesterday
        │
        ▼
[Store reportId in Supabase: report_jobs table]
        │
        ▼
[Wait for REPORT_PROCESSING_FINISHED notification via SQS]
        │
        ▼
[Download + Parse + Upsert to marketplace_performance_daily]
```

---

## 13. ClickUp Structure for Multi-Marketplace Operations

### The Core Tension

Too much structure → overhead. Too little → chaos. The right ClickUp architecture for multi-marketplace operations balances visibility (can I see UK-specific tasks?) with simplicity (can I see all work across markets in one view?).

### Recommended Approach: Folders per Brand, Tags per Marketplace

Use **ClickUp tags** for marketplace filtering, not separate folders per marketplace. This lets you see "all listing tasks" in one view filtered by the `UK` tag, while still being able to see "all brand work" for a brand across all marketplaces.

```
Space: [Brand Name] or [Client Name]
├── Folder: Listings & Content
│   ├── List: Content Creation          ← Tasks tagged with marketplace (UK, DE, JP)
│   ├── List: Translation & Review      ← Tasks for each translation job
│   └── List: Compliance Checks
├── Folder: PPC & Advertising
│   ├── List: Campaign Management
│   └── List: Bid Optimisation
├── Folder: Inventory & Operations
│   ├── List: Restock Alerts            ← Auto-created by n8n when inventory < threshold
│   └── List: FBA Shipments
└── Folder: Analytics & Reporting
    └── List: Weekly Reports
```

**Tags to create per Space:**
- One tag per active marketplace: `US`, `UK`, `DE`, `FR`, `IT`, `ES`, `NL`, `SE`, `PL`, `JP`, `AU`, `CA`, `MX`
- Status tags: `needs-translation`, `compliance-check`, `live`, `suppressed`
- Priority tags: `urgent`, `q4-priority`

### Custom Fields for Multi-Marketplace Task Tracking

Add these custom fields to Listings-related tasks:
- `ASIN` (text field)
- `Marketplace` (dropdown: US, UK, DE, etc.)
- `SP-API Status` (dropdown: active, suppressed, inactive, pending)
- `Translation Status` (dropdown: not started, machine translated, human review, approved)
- `Compliance Approved` (checkbox)
- `Go-Live Date` (date field)

### n8n → ClickUp Auto-Task Creation

When the Supabase trigger detects a listing suppression or inventory alert, n8n auto-creates a ClickUp task:

```javascript
// ClickUp task creation payload from n8n
{
  "name": `[SUPPRESSED] ${$json.asin} - ${$json.marketplace_id} - ${$json.suppression_reason}`,
  "list_id": "{{ $env.CLICKUP_LISTINGS_LIST_ID }}",
  "priority": 2,  // High
  "due_date": Date.now() + (48 * 60 * 60 * 1000),  // 48 hours
  "tags": ["suppression", $json.country_code.toLowerCase()],
  "custom_fields": [
    { "id": "ASIN_FIELD_ID", "value": $json.asin },
    { "id": "MARKETPLACE_FIELD_ID", "value": $json.marketplace_id },
    { "id": "STATUS_FIELD_ID", "value": "suppressed" }
  ],
  "description": `Listing suppressed on ${$json.marketplace_id}.\n\nReason: ${$json.suppression_reason}\n\nDetected at: ${new Date().toISOString()}`
}
```

---

## 14. Common Mistakes That Hurt Expanding Teams

### Mistake 1: Treating US SP-API Patterns as Universal

The US marketplace has the most mature SP-API coverage. Some APIs, feed types, and report types are not available in all marketplaces. Before implementing any feature for a new marketplace, check SP-API docs explicitly for that marketplace's support. Examples of US-only or region-limited features:
- Brand Analytics reports are not available in all marketplaces
- Some feed types have marketplace-specific validations
- Shipment Invoicing API is EU-specific (required for business invoices in DE, IT)
- Rufus/AI-powered search features roll out US-first

### Mistake 2: Ignoring VAT Implications of Pan-EU FBA

Enrolling in Pan-European FBA makes Amazon responsible for logistics across EU, but makes *you* responsible for VAT compliance in every country where Amazon stores your inventory. This means potential VAT registration in DE, FR, IT, ES, PL, SE, CZ, and more. This is not a technical problem syncflow can automate away — it requires flagging clearly to clients before enabling Pan-EU FBA.

### Mistake 3: Timezone Bugs in Scheduled Jobs

The classic bug: cron runs at `0 0 * * *` UTC. Japan is UTC+9. Your "yesterday's report" job runs at 09:00 JST — which means it's asking for data from "yesterday" in Japan's terms, but the n8n Code node calculates yesterday based on UTC time, not JST. The report comes back with a date offset. You don't notice for weeks because the data looks plausible. Solution: always calculate date ranges using the target marketplace's timezone, not UTC.

```javascript
// Code node: calculate correct date range for marketplace
const { DateTime } = require('luxon');
const marketplaceTimezone = $json.timezone;  // e.g., 'Asia/Tokyo'

const yesterday = DateTime.now().setZone(marketplaceTimezone).minus({ days: 1 });
return [{
  json: {
    ...$json,
    report_date_start: yesterday.startOf('day').toISO(),
    report_date_end: yesterday.endOf('day').toISO(),
    report_date_local: yesterday.toISODate()
  }
}];
```

### Mistake 4: Forgetting to Renew SP-API Permissions Per Marketplace Region

When a seller creates a second account for EU and authorises your application, that generates a new refresh token for the EU account. This is separate from the NA refresh token. Developers sometimes set up NA correctly, then forget to properly authorise (and store) the EU token. Result: EU workflows fail silently with InvalidGrant errors.

### Mistake 5: Duplicate SKUs Across Marketplaces

A seller may use the same SKU string for a product in US and UK. In your database, this looks like the same SKU, but they represent listings on different accounts with different prices, different FBA quantities, and potentially different ASINs (if the product was listed separately). Always use `(sku, marketplace_id, seller_account_id)` as the compound key.

### Mistake 6: Over-syncing — Hitting Rate Limits Across All Marketplaces Simultaneously

If your inventory sync fires every 30 minutes and covers 10 marketplaces × 3 seller accounts, that's 30 API calls in a tight window. Stagger them. The `getInventorySummaries` rate limit is 2 req/sec, burst 2 — you cannot fire all 30 simultaneously.

### Mistake 7: Currency Confusion in Reporting

Reporting "total revenue" as a sum of local currency amounts (`29.99 GBP + 29.99 EUR + 3,800 JPY = 3,859.98`) is meaningless and will be presented to clients as if it's USD. Always convert to a reference currency (USD) before aggregation. Always label currency in reports.

### Mistake 8: Assuming Translation = Done

Machine-translated DE listings routinely fail compliance checks (prohibited health claims, missing technical specs). Translated JP listings often fail because the product name was left in English where a Japanese description was expected. Build a human review gate after machine translation — do not auto-publish to live.

---

## 15. Practical Expansion Sequence

### Which Marketplace to Add First and Why

When a US-native seller decides to expand internationally, the sequence matters. Don't let clients jump to JP before CA.

**Tier 1: Start here**

1. **Canada (CA)** — Same language (English), same region as US (one SP-API token covers both), similar consumer expectations, same FBA infrastructure (North America FBA). The first international marketplace for 90% of US sellers. You essentially just flip a switch in the SP-API call to add `A2EUQ1WTGCTBG2` to your `marketplaceIds`.

2. **United Kingdom (GB)** — English language (no translation), large consumer market, post-Brexit regulatory framework is well-understood. Requires a separate EU seller account, but UK English content from US can be adapted quickly. UKCA compliance is the primary new requirement.

**Tier 2: Add after Tier 1 is stable**

3. **Germany (DE)** — Largest EU marketplace by volume. Requires German-language content (DeepL works well for most categories). CE marking compliance is the gate. Once you've done DE content, you have a template for FR/IT/ES.

4. **Australia (AU)** — English language, separate FE account required, but familiar consumer market. GST (10%) is the key compliance difference. Volume is lower than UK/DE but entry complexity is low.

**Tier 3: Mature operations only**

5. **France (FR), Italy (IT), Spain (ES)** — Best done simultaneously if you've already done DE (same EU account, same FBA pool if Pan-EU enrolled). Requires translation, but the compliance framework is the same as DE.

6. **Japan (JP)** — Most complex expansion. Requires Japanese-language content that cannot simply be machine-translated. Product regulations (PSE mark, etc.) are category-specific and enforced. Consumer expectations are fundamentally different. Return rates are higher if product doesn't precisely match listing. Plan 3–6 months before the first sale.

### Technical Checklist for Adding a New Marketplace

```
BEFORE LAUNCH:
□ Seller account created for the target region (if needed)
□ SP-API app authorized for new seller account
□ New refresh token stored in Supabase Vault
□ seller_accounts row created in Supabase
□ marketplace_ids array updated to include new marketplace_id
□ FX rate subscription includes new marketplace's currency
□ listing_content rows seeded (status = 'draft') for all active ASINs
□ Translation jobs queued for all content
□ Compliance check completed per marketplace rules (Section 10)
□ Character limits verified for all titles (especially UK: 150 char max)
□ Regulatory certifications confirmed (CE, UKCA, PSE, RCM)
□ n8n workflows parameterised to include new marketplace_id
□ Scheduling configured with correct timezone
□ ClickUp tag created for new marketplace
□ ClickUp tasks created for each ASIN content review

AFTER LAUNCH (First 30 days):
□ Monitor listing_content.status for any suppressions
□ Verify inventory sync is working (check marketplace_inventory rows)
□ Verify pricing history is capturing in local currency + USD
□ Confirm FX rate conversions are correct in reports
□ Check for any SP-API errors in n8n execution logs
□ Verify ClickUp tasks are being auto-created on suppression events
```

---

## 16. Dos & Don'ts

### ✅ DO

- **DO** store marketplace IDs in a `marketplaces` reference table and always reference by ID — never hardcode `ATVPDKIKX0DER` strings in workflow logic
- **DO** use `(asin, marketplace_id)` as the composite unique key for any listing table — the same ASIN has different data per marketplace
- **DO** store prices in both local currency and USD at snapshot time, with the fx_rate used — you cannot reconstruct historical converted values without the rate
- **DO** parameterise every n8n workflow with `marketplace_id` as an input — one workflow serves all marketplaces
- **DO** use the `marketplaces.timezone` field for scheduling cron jobs — never assume UTC is correct for local-market data jobs
- **DO** stagger multi-marketplace API calls by at least 2–5 minutes to avoid simultaneous rate limit spikes
- **DO** use Supabase Vault for all LWA refresh tokens — never in plain columns, never in n8n credential fields directly
- **DO** scope every token fetch to a specific `seller_id` — never share tokens between accounts
- **DO** build a human review gate between machine translation and live publish — machine-translated content fails compliance checks regularly
- **DO** flag clients on Pan-EU FBA VAT obligations before enabling the program — this is a legal liability, not a technical setting
- **DO** use the sub-workflow (Execute Workflow) pattern in n8n for marketplace-specific logic — one sub-workflow called by an orchestrator, not 15 duplicate workflows
- **DO** implement content drift detection — when US source content changes, automatically flag all translations as needing review
- **DO** run inventory and reporting aggregations with USD-normalised figures — summing local currencies is meaningless
- **DO** add a `needs_retranslation` boolean to listing_content and set it via database trigger when source content changes

### ❌ DON'T

- **DON'T** build separate n8n workflows per marketplace — you will have 15 nearly-identical workflows that diverge over time and become a maintenance nightmare
- **DON'T** store prices only in local currency — cross-marketplace revenue reporting becomes impossible without USD equivalents
- **DON'T** assume Pan-EU FBA means you have unified EU inventory you can track per-marketplace — Amazon distributes it; track the pool, not per-country splits
- **DON'T** hardcode marketplace IDs in workflow expressions — a single misspelling breaks a workflow silently
- **DON'T** schedule all marketplace jobs at the same time — they will collide on SP-API rate limits and your queue will back up
- **DON'T** auto-publish machine-translated content without compliance and human review — DE prohibits certain health claims, JP requires Japanese text by law for certain product categories
- **DON'T** use US SP-API patterns universally — Brand Analytics, some report types, and certain feed validations differ by marketplace and region
- **DON'T** ignore `country_code` timezone in date calculations — "yesterday's" report for Japan uses JST, not UTC
- **DON'T** use the same n8n credential for multiple seller accounts — each seller account has its own LWA credentials and refresh token
- **DON'T** enroll in Pan-EU FBA without briefing the client on multi-country VAT registration requirements — this creates legal liability across 7+ EU jurisdictions
- **DON'T** use Option B (separate schemas per marketplace) unless you have a documented, auditor-reviewed compliance requirement — the maintenance overhead is severe
- **DON'T** create separate ClickUp lists per marketplace for the same type of work — use tags for marketplace filtering; lists for work type
- **DON'T** skip the technical expansion checklist when adding a new marketplace — missing a single step (e.g., FX rate subscription, timezone config) causes silent data errors that accumulate for weeks
- **DON'T** compare GBP prices to USD prices directly in any query or report — always convert to a common reference currency first

---

## 17. Quick Reference Cheat Sheet

### SP-API Endpoints by Region
```
NA: https://sellingpartnerapi-na.amazon.com
EU: https://sellingpartnerapi-eu.amazon.com
FE: https://sellingpartnerapi-fe.amazon.com
```

### Most-Used Marketplace IDs
```
US: ATVPDKIKX0DER
UK: A1F83G8C2ARO7P
DE: A1PA6795UKMFR9
CA: A2EUQ1WTGCTBG2
JP: A1VC38T7YXB528
AU: A39IBJ37TRP1C6
FR: A13V1IB3VIYZZH
IT: APJ6JRA9NG5V4
ES: A1RKKUPIHCS9HS
```

### Title Character Limits
```
US, AU:     200 chars
UK, DE, FR, IT, ES, NL, SE, PL, IN: 150 chars
JP:         100 chars (full-width)
```

### Expansion Sequence
```
1. CA → 2. UK → 3. DE → 4. AU → 5. FR/IT/ES → 6. JP
```

### Translation Method by Content
```
Human only:         A+ content, main image overlays
Human review reqd:  Title, bullet points (all EU)
DeepL sufficient:   Description, backend keywords (EU)
GPT-4o preferred:   JP content, cultural adaptation
LLM draft OK:       Internal summaries, rough drafts
```

### n8n Pattern Summary
```
One parameterised workflow per function, not per marketplace.
Orchestrator calls sub-workflow with marketplace_id input.
All SP-API base URLs from marketplaces table — never hardcoded.
All tokens fetched per seller_account_id — never shared.
All scheduling uses marketplaces.timezone — never assumed UTC.
```

---

*Last researched: May 2026. Amazon marketplace structure, SP-API behaviour, and EU regulatory requirements change frequently — cross-check against official Amazon documentation and regional regulatory sources before implementation.*
