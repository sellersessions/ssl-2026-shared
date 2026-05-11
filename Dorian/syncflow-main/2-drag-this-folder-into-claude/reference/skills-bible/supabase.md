# Supabase — Expert Reference for Amazon Seller Operations & syncflow

> **Scope:** Everything the syncflow system needs to know about Supabase — from project setup through production-grade schema design, n8n integration, Edge Functions, pgvector, and operational best practices. This is syncflow's preferred patterns, not a neutral survey of options. When we say "do this," we mean it.  
> **Stack Context:** n8n + Supabase + ClickUp + SP-API  
> **Last Updated:** May 2026

---

## Table of Contents

1. [Why Supabase for Amazon Seller Operations](#1-why-supabase-for-amazon-seller-operations)
2. [Project Setup & Organisation Structure](#2-project-setup--organisation-structure)
3. [Schema Design Conventions](#3-schema-design-conventions)
4. [Core Tables Every Amazon Operation Needs](#4-core-tables-every-amazon-operation-needs)
5. [Row Level Security (RLS)](#5-row-level-security-rls)
6. [Real-Time Subscriptions](#6-real-time-subscriptions)
7. [Edge Functions](#7-edge-functions)
8. [Supabase Storage](#8-supabase-storage)
9. [pgvector — AI Embeddings & Semantic Search](#9-pgvector--ai-embeddings--semantic-search)
10. [Migrations — Schema Change Discipline](#10-migrations--schema-change-discipline)
11. [Supabase MCP — Claude Direct Access](#11-supabase-mcp--claude-direct-access)
12. [n8n Integration Patterns](#12-n8n-integration-patterns)
13. [Preferred Extensions](#13-preferred-extensions)
14. [Performance — Indexing, Partitioning & Query Analysis](#14-performance--indexing-partitioning--query-analysis)
15. [Cost Management](#15-cost-management)
16. [Backup & Recovery](#16-backup--recovery)
17. [Security Hardening](#17-security-hardening)
18. [Dos & Don'ts](#18-dos--donts)
19. [Common Gotchas with Amazon Data Ingestion](#19-common-gotchas-with-amazon-data-ingestion)
20. [Quick Reference Cheat Sheet](#20-quick-reference-cheat-sheet)

---

## 1. Why Supabase for Amazon Seller Operations

### The Case

Amazon seller operations produce structured, relational business data: orders belong to ASINs, ASINs belong to brands, brands belong to marketplaces, PPC campaigns reference keywords which reference ASINs. This is relational data. You need a relational database. Full stop.

The question is which one. The answer — for syncflow's stack — is **Supabase**, and here's why it beats the alternatives:

**vs. Firebase / Firestore:** Firebase is a document database. It is the wrong data model for business intelligence on Amazon data. You will spend months contorting your queries to work around the lack of joins. SQP analysis alone — correlating search terms to impressions to clicks to sales over time across ASINs — becomes genuinely painful in a document store. Firebase also has no CLI-driven migrations. Don't do it.

**vs. PlanetScale:** MySQL, not PostgreSQL. The moment you need window functions for time-series analysis (rolling 7-day PPC ROAS, inventory trend detection), you'll hit MySQL's limitations. PlanetScale also eliminated its free tier in 2024. And it's MySQL — every Postgres tool, every Postgres extension, every Postgres expert is unavailable to you. Hard pass.

**vs. raw PostgreSQL (self-hosted):** You'd need to manage backups, WAL archiving, connection pooling (PgBouncer), SSL configuration, updates, monitoring, and alerting yourself. That's a part-time job. Supabase gives you all of that plus a dashboard, an auto-generated REST API, auth, storage, and Edge Functions — for $25/month. Manage your business, not your database server.

**vs. Neon:** Neon is excellent as a pure-database play and has cheaper compute. But it has no auth, no storage, no dashboard, no realtime, and no Edge Functions. For syncflow's use case — where AI agents, n8n, and human operators all need to read and write data — Supabase's full platform beats Neon's cheaper compute every time.

**Supabase wins because:**
- It's managed PostgreSQL — the right data model, with window functions, CTEs, JSON columns, and every extension you'll ever need
- The dashboard UI is excellent for non-technical operators browsing or editing records
- Auto-generated REST and GraphQL APIs make n8n integration trivial
- Built-in connection pooling via Supavisor handles n8n's connection-heavy patterns
- Edge Functions let you run lightweight compute (webhooks, transformations) without deploying a separate server
- Storage handles product image pipelines alongside your database
- pgvector is a first-class supported extension — enabling AI-powered product search on the same database
- The MCP integration lets Claude agents query and modify data directly with appropriate permissions
- The Supabase CLI makes migration-driven schema management straightforward
- It's open source — you can self-host if you outgrow the platform tier pricing

### When Supabase Is NOT Enough

Be honest about the limits. If you're ingesting millions of SP-API order records per day across dozens of brands, you'll hit the limits of a single Supabase project and start thinking about read replicas, partitioning, or a dedicated analytics layer (like ClickHouse or BigQuery) for historical data. But for 99% of Amazon seller operations — including large multi-brand agencies — Supabase handles it fine.

---

## 2. Project Setup & Organisation Structure

### Organisation Structure

Use a **single Supabase organisation** for all syncflow work. Within that organisation, create one project per environment per client (if applicable) or one project per environment for the syncflow platform.

```
Supabase Organisation: syncflow / syncflow
├── Project: syncflow-prod         (production)
├── Project: syncflow-staging      (staging / QA)
└── Project: syncflow-dev          (local dev / experiments)
```

**Do not** put production and staging in different organisations — you lose the ability to share team members easily and the billing gets messy.

### Naming Conventions for Projects

- Use `kebab-case` for project names: `syncflow-prod`, `brand-name-prod`
- Always include the environment suffix: `-prod`, `-staging`, `-dev`
- For client-specific databases: `client-slug-prod`
- Never use generic names like `database1` or `my-project` — you will have 12 of them in 18 months and have no idea which is which

### Environment Separation

| Environment | Purpose | Notes |
|---|---|---|
| `prod` | Live data, live integrations | Only automated migrations touch this |
| `staging` | QA testing, migration dry-runs | Mirror of prod schema, anonymised data |
| `dev` | Local development, experiments | Can be wiped freely |

Each environment gets its own:
- Supabase project (separate URL, separate keys)
- n8n credential set pointing to that project
- `.env.production`, `.env.staging`, `.env.development` files — never committed to git

### CLI Setup

```bash
# Install CLI
brew install supabase/tap/supabase

# Login
supabase login

# Link to a specific project (run from your project root)
supabase link --project-ref your-project-ref

# Verify you're linked to the right project
supabase status
```

The project ref is the string in your Supabase dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`.

### Local Development

Always run local Supabase for development — don't develop against staging or prod.

```bash
# Start local Supabase (requires Docker)
supabase start

# This gives you:
# Local Studio:     http://localhost:54323
# Local API:        http://localhost:54321
# Local DB:         postgresql://postgres:postgres@localhost:54322/postgres
# Service role key: printed on startup
```

Store your local credentials in `.env.local` and never in the codebase.

---

## 3. Schema Design Conventions

These are non-negotiable. Every table in syncflow follows these rules. Consistency beats personal preference.

### Naming

- **Table names:** `snake_case`, **plural** — `products`, `orders`, `ppc_campaigns`, `keyword_rankings`
- **Column names:** `snake_case`, **singular** — `asin`, `created_at`, `marketplace_id`
- **Foreign keys:** `<referenced_table_singular>_id` — `product_id`, `brand_id`, `marketplace_id`
- **Boolean columns:** prefix with `is_` or `has_` — `is_active`, `has_prime`, `is_fba`
- **Avoid reserved words:** don't name columns `status`, `value`, `type` without a prefix — use `order_status`, `campaign_type`
- **Indexes:** `idx_<table>_<column(s)>` — `idx_orders_asin_created_at`
- **Constraints:** `chk_<table>_<description>` — `chk_orders_status_valid`

### Primary Keys: UUID vs. bigint

Use **`uuid`** as the default primary key for all user-facing, externally-referenced tables. Use `gen_random_uuid()` as the default.

```sql
id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
```

**When to use bigint instead:**
- High-volume append-only tables (millions of rows/day) where join performance is critical
- Internal snapshot/logging tables never exposed externally
- When you need sortable IDs with insert ordering guarantees

```sql
id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
```

**Never mix the two** in foreign key relationships — pick UUID for the entity layer, bigint for the data layer if needed, but don't cross-reference them.

### Timestamps

Every table gets these two columns, always:

```sql
created_at timestamptz DEFAULT now() NOT NULL,
updated_at timestamptz DEFAULT now() NOT NULL,
```

`timestamptz` (timestamp with time zone) is mandatory. Never use `timestamp` (without time zone) — it stores no timezone context and Amazon data spans US, EU, and JP marketplaces. Every timezone confusion disaster in Amazon data ingestion history started with `timestamp`.

Set `updated_at` automatically with a trigger (create it once, reuse it):

```sql
-- Create the trigger function once in your schema
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to each table
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Soft Deletes

Use the `deleted_at` pattern for any entity that should be recoverable or audited:

```sql
deleted_at timestamptz DEFAULT NULL,
```

A `NULL` value means the record is active. A non-null value means it's soft-deleted.

Create a partial index to make queries on active records fast:

```sql
CREATE INDEX idx_products_active ON products (id) WHERE deleted_at IS NULL;
```

In queries, always add `WHERE deleted_at IS NULL` to exclude soft-deleted records. Consider a **view** for convenience:

```sql
CREATE VIEW active_products AS
  SELECT * FROM products WHERE deleted_at IS NULL;
```

### JSON Columns

Amazon data often comes with nested structures (attribute sets, fulfillment details, variation themes). Use `jsonb` (not `json`) for any unstructured or semi-structured data:

```sql
attributes jsonb DEFAULT '{}',
raw_response jsonb,  -- store the original SP-API response
```

`jsonb` is binary-stored and indexable. `json` is text-stored and not indexable. Always use `jsonb`.

---

## 4. Core Tables Every Amazon Operation Needs

These are the foundational tables for the syncflow system. Create them in this order (respecting foreign key dependencies).

### 4.1 brands

```sql
CREATE TABLE brands (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,  -- e.g. 'acme-widgets'
  brand_registry  boolean DEFAULT false,
  notes           text,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL,
  deleted_at      timestamptz DEFAULT NULL
);
```

### 4.2 marketplaces

```sql
CREATE TABLE marketplaces (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  marketplace_id  text NOT NULL UNIQUE,  -- Amazon's ID: 'ATVPDKIKX0DER' for US
  name            text NOT NULL,          -- 'Amazon US', 'Amazon UK'
  country_code    text NOT NULL,          -- 'US', 'GB', 'DE', 'JP'
  currency_code   text NOT NULL,          -- 'USD', 'GBP', 'EUR', 'JPY'
  region          text NOT NULL,          -- 'NA', 'EU', 'FE'
  endpoint        text NOT NULL,          -- SP-API endpoint for this marketplace
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- Seed with the standard marketplaces you operate in
INSERT INTO marketplaces (marketplace_id, name, country_code, currency_code, region, endpoint) VALUES
  ('ATVPDKIKX0DER', 'Amazon US',  'US', 'USD', 'NA', 'https://sellingpartnerapi-na.amazon.com'),
  ('A2EUQ1WTGCTBG2', 'Amazon CA', 'CA', 'CAD', 'NA', 'https://sellingpartnerapi-na.amazon.com'),
  ('A1F83G8C2ARO7P', 'Amazon UK', 'GB', 'GBP', 'EU', 'https://sellingpartnerapi-eu.amazon.com'),
  ('A1PA6795UKMFR9', 'Amazon DE', 'DE', 'EUR', 'EU', 'https://sellingpartnerapi-eu.amazon.com'),
  ('A1RKKUPIHCS9HS', 'Amazon ES', 'ES', 'EUR', 'EU', 'https://sellingpartnerapi-eu.amazon.com'),
  ('A13V1IB3VIYZZH', 'Amazon FR', 'FR', 'EUR', 'EU', 'https://sellingpartnerapi-eu.amazon.com'),
  ('APJ6JRA9NG5V4',  'Amazon IT', 'IT', 'EUR', 'EU', 'https://sellingpartnerapi-eu.amazon.com'),
  ('A1VC38T7YXB528', 'Amazon JP', 'JP', 'JPY', 'FE', 'https://sellingpartnerapi-fe.amazon.com');
```

### 4.3 products (ASINs)

```sql
CREATE TABLE products (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id        uuid NOT NULL REFERENCES brands(id),
  asin            text NOT NULL,
  marketplace_id  uuid NOT NULL REFERENCES marketplaces(id),
  sku             text,
  title           text,
  category        text,
  subcategory     text,
  product_type    text,
  is_fba          boolean DEFAULT true,
  is_active       boolean DEFAULT true,
  parent_asin     text,  -- NULL if this is the parent; populated for child ASINs
  variation_theme text,  -- 'Size', 'Color', 'Size-Color', etc.
  attributes      jsonb DEFAULT '{}',  -- raw attribute set from SP-API
  notes           text,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL,
  deleted_at      timestamptz DEFAULT NULL,

  UNIQUE (asin, marketplace_id)
);

CREATE INDEX idx_products_brand_id ON products (brand_id);
CREATE INDEX idx_products_asin ON products (asin);
CREATE INDEX idx_products_active ON products (id) WHERE deleted_at IS NULL;
```

### 4.4 inventory_snapshots

Append-only. Never update rows — always insert new snapshots. This gives you a full historical record.

```sql
CREATE TABLE inventory_snapshots (
  id                      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id              uuid NOT NULL REFERENCES products(id),
  snapshot_date           date NOT NULL,
  fulfillable_quantity    integer DEFAULT 0,
  reserved_quantity       integer DEFAULT 0,
  inbound_quantity        integer DEFAULT 0,
  unfulfillable_quantity  integer DEFAULT 0,
  total_quantity          integer GENERATED ALWAYS AS 
                          (fulfillable_quantity + reserved_quantity + inbound_quantity) STORED,
  days_of_supply          numeric(8,2),
  restock_recommended     boolean DEFAULT false,
  raw_response            jsonb,
  created_at              timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_inventory_snapshots_product_date 
  ON inventory_snapshots (product_id, snapshot_date DESC);
```

### 4.5 orders

```sql
CREATE TABLE orders (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  amazon_order_id       text NOT NULL UNIQUE,
  marketplace_id        uuid NOT NULL REFERENCES marketplaces(id),
  brand_id              uuid NOT NULL REFERENCES brands(id),
  order_status          text NOT NULL,  -- 'Pending', 'Unshipped', 'Shipped', 'Canceled', etc.
  purchase_date         timestamptz NOT NULL,
  last_update_date      timestamptz NOT NULL,
  fulfillment_channel   text NOT NULL,  -- 'AFN' (FBA) or 'MFN' (merchant)
  sales_channel         text,
  order_type            text,           -- 'StandardOrder', 'Preorder', 'SourcingOnDemandOrder'
  is_business_order     boolean DEFAULT false,
  is_prime              boolean DEFAULT false,
  is_replacement        boolean DEFAULT false,
  ship_service_level    text,
  order_total_amount    numeric(10,2),
  order_total_currency  text,
  item_count            integer,
  raw_response          jsonb,
  created_at            timestamptz DEFAULT now() NOT NULL,
  updated_at            timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_orders_marketplace_id ON orders (marketplace_id);
CREATE INDEX idx_orders_brand_id ON orders (brand_id);
CREATE INDEX idx_orders_purchase_date ON orders (purchase_date DESC);
CREATE INDEX idx_orders_amazon_order_id ON orders (amazon_order_id);
```

### 4.6 order_items

```sql
CREATE TABLE order_items (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id              uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id            uuid REFERENCES products(id),  -- nullable: may not be in our catalog
  amazon_order_item_id  text NOT NULL,
  asin                  text NOT NULL,
  sku                   text,
  title                 text,
  quantity_ordered      integer NOT NULL DEFAULT 0,
  quantity_shipped      integer NOT NULL DEFAULT 0,
  item_price_amount     numeric(10,2),
  item_price_currency   text,
  item_tax_amount       numeric(10,2),
  promotion_discount    numeric(10,2),
  is_gift               boolean DEFAULT false,
  condition_id          text,
  raw_response          jsonb,
  created_at            timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);
CREATE INDEX idx_order_items_asin ON order_items (asin);
```

### 4.7 ppc_campaigns

```sql
CREATE TABLE ppc_campaigns (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id              uuid NOT NULL REFERENCES brands(id),
  marketplace_id        uuid NOT NULL REFERENCES marketplaces(id),
  amazon_campaign_id    text NOT NULL,
  campaign_type         text NOT NULL,  -- 'sponsoredProducts', 'sponsoredBrands', 'sponsoredDisplay'
  name                  text NOT NULL,
  targeting_type        text,           -- 'MANUAL', 'AUTO'
  campaign_state        text NOT NULL,  -- 'ENABLED', 'PAUSED', 'ARCHIVED'
  daily_budget          numeric(10,2),
  start_date            date,
  end_date              date,
  portfolio_id          text,
  bidding_strategy      text,
  created_at            timestamptz DEFAULT now() NOT NULL,
  updated_at            timestamptz DEFAULT now() NOT NULL,
  deleted_at            timestamptz DEFAULT NULL,

  UNIQUE (amazon_campaign_id, marketplace_id)
);

CREATE INDEX idx_ppc_campaigns_brand_id ON ppc_campaigns (brand_id);
```

### 4.8 ppc_performance_snapshots

```sql
CREATE TABLE ppc_performance_snapshots (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campaign_id       uuid NOT NULL REFERENCES ppc_campaigns(id),
  snapshot_date     date NOT NULL,
  impressions       integer DEFAULT 0,
  clicks            integer DEFAULT 0,
  spend             numeric(10,2) DEFAULT 0,
  sales_7d          numeric(10,2) DEFAULT 0,  -- 7-day attributed sales
  orders_7d         integer DEFAULT 0,
  acos              numeric(8,4),  -- spend / sales_7d
  roas              numeric(8,4),  -- sales_7d / spend
  ctr               numeric(8,6),  -- clicks / impressions
  cpc               numeric(8,4),  -- spend / clicks
  created_at        timestamptz DEFAULT now() NOT NULL,

  UNIQUE (campaign_id, snapshot_date)
);

CREATE INDEX idx_ppc_perf_campaign_date 
  ON ppc_performance_snapshots (campaign_id, snapshot_date DESC);
```

### 4.9 keyword_rankings

```sql
CREATE TABLE keyword_rankings (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id      uuid NOT NULL REFERENCES products(id),
  keyword         text NOT NULL,
  rank            integer,
  page            integer,  -- which page of results (1 = first page)
  rank_type       text DEFAULT 'organic',  -- 'organic', 'sponsored'
  snapshot_date   date NOT NULL,
  source          text,  -- 'manual', 'helium10', 'jungle_scout', 'sp_api'
  created_at      timestamptz DEFAULT now() NOT NULL,

  UNIQUE (product_id, keyword, rank_type, snapshot_date)
);

CREATE INDEX idx_keyword_rankings_product_keyword 
  ON keyword_rankings (product_id, keyword, snapshot_date DESC);
```

### 4.10 sqpr_snapshots

Search Query Performance Report data. This is gold. Keep all of it.

```sql
CREATE TABLE sqpr_snapshots (
  id                          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand_id                    uuid NOT NULL REFERENCES brands(id),
  marketplace_id              uuid NOT NULL REFERENCES marketplaces(id),
  report_date_start           date NOT NULL,
  report_date_end             date NOT NULL,
  search_query                text NOT NULL,
  asin                        text NOT NULL,
  product_id                  uuid REFERENCES products(id),  -- nullable, join on asin
  search_query_score          numeric(8,4),
  impressions                 integer DEFAULT 0,
  clicks                      integer DEFAULT 0,
  cart_adds                   integer DEFAULT 0,
  purchases                   integer DEFAULT 0,
  brand_impressions            integer DEFAULT 0,
  brand_clicks                integer DEFAULT 0,
  brand_cart_adds             integer DEFAULT 0,
  brand_purchases             integer DEFAULT 0,
  click_rate                  numeric(8,6),
  conversion_rate             numeric(8,6),
  created_at                  timestamptz DEFAULT now() NOT NULL,

  UNIQUE (brand_id, marketplace_id, report_date_start, search_query, asin)
);

CREATE INDEX idx_sqpr_brand_date 
  ON sqpr_snapshots (brand_id, marketplace_id, report_date_start DESC);
CREATE INDEX idx_sqpr_search_query 
  ON sqpr_snapshots (search_query) WHERE length(search_query) > 2;
```

---

## 5. Row Level Security (RLS)

### What Is RLS?

RLS (Row Level Security) lets PostgreSQL enforce access control at the row level — based on the authenticated user's JWT claims. Without RLS, any user with the `anon` key can read any table (if they know the endpoint). With RLS, Postgres itself enforces who can see what.

### When to Enable RLS

**Enable RLS on:**
- Any table accessed via Supabase Auth users (human operators logging into a dashboard)
- Any table exposed via the auto-generated REST API
- Multi-tenant tables where different clients should see different rows

**Skip RLS (or use service role exclusively) when:**
- The table is only ever accessed by n8n workflows using the service role key
- The table is internal logging/audit data never exposed to end users
- You've verified the service role bypass pattern is in place and correct

**The rule:** If in doubt, enable RLS. You can always relax it. Accidentally exposing data is much worse than adding a policy.

### Enabling RLS

```sql
-- Enable RLS (row level security is NOT on by default for new tables)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- If RLS is enabled with no policies, the table is LOCKED DOWN for all users 
-- (except service role). This is correct default behavior.
```

### Basic Policies

```sql
-- Allow authenticated users to read all products for their brand
CREATE POLICY "Users can read their brand's products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT brand_id FROM user_brands WHERE user_id = auth.uid()
    )
  );

-- Allow service role to do everything (bypass policies)
-- Note: service role bypasses RLS automatically — no policy needed for it
-- But be explicit about what authenticated users can do

-- Allow authenticated users to insert products for their brands only
CREATE POLICY "Users can insert products for their brands"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM user_brands WHERE user_id = auth.uid()
    )
  );
```

### Multi-Brand / Multi-User Pattern

The most common pattern in Amazon agency work: many users, many brands, many-to-many relationship.

```sql
-- Junction table: which users have access to which brands
CREATE TABLE user_brands (
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id  uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  role      text NOT NULL DEFAULT 'viewer',  -- 'owner', 'manager', 'viewer'
  PRIMARY KEY (user_id, brand_id)
);
ALTER TABLE user_brands ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rows in user_brands
CREATE POLICY "Users see their own brand memberships"
  ON user_brands FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

Then all your business tables reference `brand_id` and you use the pattern above for RLS policies.

### Service Role Bypass

The **service role key** bypasses RLS entirely. This is intentional — it's for backend services (n8n, Edge Functions, MCP) that need full access without user context.

```
anon key      → public access, subject to RLS
authenticated → logged-in user, subject to RLS
service role  → bypasses RLS entirely — treat like root access
```

**Never use the service role key client-side.** Never put it in a frontend app, a browser extension, or any code that runs on a user's machine. It belongs in environment variables on your server/n8n instance only.

---

## 6. Real-Time Subscriptions

### How Supabase Realtime Works

Supabase Realtime sits on top of PostgreSQL's logical replication (WAL). When a row is inserted, updated, or deleted in a table that has Realtime enabled, Supabase broadcasts that change via WebSocket to any connected subscribers.

### Enabling Realtime on a Table

```sql
-- Enable realtime publication for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_snapshots;
```

Or enable it in the Supabase dashboard: Database → Replication → toggle the table.

### Useful Realtime Patterns in Automation Pipelines

**1. n8n watches for new inventory alerts:**
When an `inventory_snapshots` row is inserted with `days_of_supply < 30`, you want n8n to trigger a restocking task in ClickUp. Instead of polling the database every hour, use a WebSocket subscription.

```javascript
// In an n8n Code node or a lightweight Edge Function connector
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

supabase
  .channel('inventory-alerts')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'inventory_snapshots' },
    (payload) => {
      if (payload.new.days_of_supply < 30) {
        // trigger n8n webhook for restock alert
      }
    }
  )
  .subscribe()
```

**2. Dashboard live updates:** If syncflow ever has a human-facing dashboard showing live PPC performance, Realtime makes it responsive without polling.

### When NOT to Use Realtime

- High-volume tables (thousands of inserts per minute) — the broadcast overhead becomes significant
- When polling is simpler and latency doesn't matter (daily report ingestion doesn't need real-time)
- When your n8n workflow already handles everything in a single pipeline execution

**n8n's Supabase Trigger node** uses polling under the hood, not true WebSockets — be aware of that. For true real-time, you need the JS client or a custom webhook via Edge Function.

---

## 7. Edge Functions

### What Are Edge Functions?

Supabase Edge Functions are TypeScript/JavaScript functions that run on Deno Deploy — serverless, globally distributed, close to the user. Think of them as lightweight API routes without a server.

### When to Use Edge Functions

| Scenario | Right Tool |
|---|---|
| Receive and validate a webhook from Amazon SP-API | **Edge Function** |
| Scheduled daily report ingestion | **n8n** (pg_cron for pure SQL) |
| Heavy ETL, multi-step orchestration | **n8n** |
| Real-time webhook that needs fast response + database write | **Edge Function** |
| Server-Side computation for a Next.js app | **Next.js API route** |
| Transform data before inserting into Supabase | **Either** (Edge if latency-critical, n8n if complex) |
| Light compute that should scale to zero | **Edge Function** |

**Decision rule:** Edge Functions are best when you need a fast HTTP endpoint with database access, especially for webhooks. If your logic has more than 3 steps or calls multiple external APIs, move it to n8n.

### Creating an Edge Function

```bash
# Create a new function
supabase functions new amazon-webhook

# This creates: supabase/functions/amazon-webhook/index.ts
```

```typescript
// supabase/functions/amazon-webhook/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const payload = await req.json()
    
    // Validate the webhook (Amazon uses a signature header)
    const signature = req.headers.get('x-amz-signature')
    if (!validateAmazonSignature(signature, payload)) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Insert notification into the database
    const { error } = await supabase
      .from('sp_api_notifications')
      .insert({
        notification_type: payload.notificationType,
        payload: payload,
        received_at: new Date().toISOString()
      })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### Deploying Edge Functions

```bash
# Deploy a specific function
supabase functions deploy amazon-webhook

# Deploy all functions
supabase functions deploy

# Set secrets (environment variables) for Edge Functions
supabase secrets set AMAZON_APP_ID=xxx AMAZON_SECRET=yyy

# List deployed functions
supabase functions list
```

### Edge Function Limitations

- Max execution time: 150 seconds (wall clock), 2 CPU seconds
- Max memory: 256 MB
- Deno runtime (not Node.js) — `require()` does not work; use ESM imports
- Cold starts: ~100–300ms on first invocation
- Not suitable for heavy compute or long-running tasks

---

## 8. Supabase Storage

### Bucket Design for Amazon Operations

Create separate buckets by data category. Each bucket has its own access policies.

```
Buckets:
├── product-images/     (ASIN images, variant images)
├── reports/            (downloaded SP-API report files)
├── research/           (competitor research, market analysis)
└── exports/            (generated exports for clients)
```

### Creating Buckets

```sql
-- In SQL or via the dashboard
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('product-images', 'product-images', true),   -- public: images embeddable in listings
  ('reports', 'reports', false),                  -- private: SP-API report files
  ('research', 'research', false),                -- private: internal research
  ('exports', 'exports', false);                  -- private: client exports
```

### Bucket Policies

```sql
-- Allow authenticated users to read product images
CREATE POLICY "Authenticated users can read product images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'product-images');

-- Allow service role (n8n) to upload to product-images
CREATE POLICY "Service role can upload product images"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to read their brand's exports only
CREATE POLICY "Users can read their brand exports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'exports' AND
    (storage.foldername(name))[1] IN (
      SELECT brand_id::text FROM user_brands WHERE user_id = auth.uid()
    )
  );
```

### Product Image Pipeline

Store images in the pattern: `product-images/{asin}/{marketplace_id}/{filename}`

```typescript
// Upload a product image from URL (in n8n Code node or Edge Function)
const { data, error } = await supabase.storage
  .from('product-images')
  .upload(
    `${asin}/${marketplaceId}/main.jpg`,
    imageBuffer,
    {
      contentType: 'image/jpeg',
      upsert: true  // overwrite if exists
    }
  )

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('product-images')
  .getPublicUrl(`${asin}/${marketplaceId}/main.jpg`)
```

### Large Report File Storage

SP-API report files (especially GET_SALES_AND_TRAFFIC_REPORT, SQP reports) can be 10–100MB compressed. Store them raw before processing:

```
reports/{brand_id}/{report_type}/{YYYY-MM-DD}/{report_id}.json.gz
```

Storing the raw file lets you re-process historical data if your ingestion logic changes — no need to re-request from Amazon.

---

## 9. pgvector — AI Embeddings & Semantic Search

### Why This Matters for Amazon Operations

The syncflow AI agent needs to:
- Find semantically similar products across a catalog (embedding-based similarity)
- Search SQP keywords by meaning, not just exact match
- Build a product knowledge base that Claude can query

pgvector makes all of this native to PostgreSQL — no separate vector database needed.

### Enabling pgvector

```sql
-- Enable the extension (available on all Supabase plans)
CREATE EXTENSION IF NOT EXISTS vector;
```

### Storing Embeddings

```sql
-- Add embedding column to products table
ALTER TABLE products ADD COLUMN embedding vector(1536);  -- OpenAI text-embedding-3-small dimension
-- For Anthropic/Claude embeddings via Voyage AI: 1024 dimensions
-- ALTER TABLE products ADD COLUMN embedding vector(1024);

-- Dedicated embeddings table (preferred for clean separation)
CREATE TABLE product_embeddings (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  model         text NOT NULL,       -- 'text-embedding-3-small', 'voyage-2', etc.
  embedding     vector(1536),        -- adjust dimension to match your model
  content_hash  text,                -- hash of the text that was embedded (detect stale embeddings)
  created_at    timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE (product_id, model)
);

-- HNSW index for fast approximate nearest-neighbor search
-- Create AFTER initial bulk insert, not before
CREATE INDEX idx_product_embeddings_hnsw 
  ON product_embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### Generating and Storing Embeddings (n8n workflow)

```javascript
// In n8n Code node — generate embedding via OpenAI and store in Supabase
const productTitle = $input.item.json.title
const productDescription = $input.item.json.attributes.description || ''
const textToEmbed = `${productTitle}. ${productDescription}`.slice(0, 8000)

// Call OpenAI embedding endpoint
const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'text-embedding-3-small',
    input: textToEmbed
  })
})
const { data } = await embeddingResponse.json()
const embedding = data[0].embedding  // float array, length 1536

return [{
  json: {
    product_id: $input.item.json.id,
    model: 'text-embedding-3-small',
    embedding: `[${embedding.join(',')}]`,  // Supabase expects this format
    content_hash: crypto.createHash('md5').update(textToEmbed).digest('hex')
  }
}]
```

### Semantic Similarity Search

```sql
-- Find the 10 most similar products to a given product
SELECT 
  p.id,
  p.asin,
  p.title,
  1 - (pe.embedding <=> query_embedding.embedding) AS similarity
FROM product_embeddings pe
JOIN products p ON p.id = pe.product_id
CROSS JOIN (
  SELECT embedding FROM product_embeddings WHERE product_id = 'TARGET-PRODUCT-UUID'
) AS query_embedding
WHERE pe.product_id != 'TARGET-PRODUCT-UUID'
ORDER BY pe.embedding <=> query_embedding.embedding
LIMIT 10;

-- Operators:
-- <=>  cosine distance (use for text embeddings — most common)
-- <->  Euclidean distance
-- <#>  negative inner product (use for normalized vectors)
```

### Using pgvector with Claude via MCP

Once embeddings are stored, Claude can use the MCP connection to run similarity searches directly:

```sql
-- Claude can run this via MCP to find relevant products for a query
-- (the embedding for the query text would be generated separately and passed in)
SELECT p.asin, p.title, 1 - (pe.embedding <=> $1::vector) as similarity
FROM product_embeddings pe
JOIN products p ON p.id = pe.product_id
WHERE 1 - (pe.embedding <=> $1::vector) > 0.8
ORDER BY similarity DESC
LIMIT 20;
```

---

## 10. Migrations — Schema Change Discipline

### The Golden Rule

**Never edit the database schema directly in the Supabase dashboard in production.** Every schema change must be a migration file committed to version control. Every. Single. One.

The dashboard is great for browsing data. It is not a schema editor for production systems.

### Migration Workflow

```bash
# Step 1: Make sure you're linked to the right project
supabase status

# Step 2: Create a new migration file
supabase migration new add_product_embeddings_table
# Creates: supabase/migrations/20260506123456_add_product_embeddings_table.sql

# Step 3: Write your migration SQL in the generated file
# Always write UP migration (the change you want to make)
# Supabase does not natively support DOWN migrations — write them as separate migrations if needed

# Step 4: Test locally first
supabase db reset  # resets local DB and applies all migrations from scratch
# OR
supabase migration up  # applies pending migrations only

# Step 5: Verify your local schema is correct
supabase db diff  # shows diff between local DB and the migration files

# Step 6: Push to remote
supabase db push  # applies pending migrations to the linked remote project

# Step 7: Verify remote
supabase migration list  # shows applied migrations on remote
```

### Migration File Conventions

```sql
-- supabase/migrations/20260506123456_add_product_embeddings_table.sql

-- Always include a comment at the top explaining what this migration does and why
-- Migration: Add product_embeddings table for pgvector semantic search
-- Context: Enabling Claude AI agent to find semantically similar products

-- Enable extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the table
CREATE TABLE product_embeddings (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  model         text NOT NULL,
  embedding     vector(1536),
  content_hash  text,
  created_at    timestamptz DEFAULT now() NOT NULL,
  UNIQUE (product_id, model)
);

-- Note: HNSW index created AFTER bulk insert in a separate migration
-- to avoid slow index creation on large datasets
```

### Safe Schema Changes in Production

| Change Type | Safety | Notes |
|---|---|---|
| `CREATE TABLE` | ✅ Safe | Non-destructive |
| `ADD COLUMN` (nullable) | ✅ Safe | Non-destructive |
| `ADD COLUMN NOT NULL DEFAULT` | ✅ Safe | Postgres handles backfill |
| `ADD INDEX` | ⚠️ Careful | Use `CONCURRENTLY` to avoid table lock |
| `DROP COLUMN` | ❌ Destructive | Verify no references first |
| `DROP TABLE` | ❌ Destructive | Backup first, then archive |
| `ALTER COLUMN TYPE` | ❌ Dangerous | May require table rewrite |
| `RENAME COLUMN` | ⚠️ Breaking | Update all API clients first |

**Always use `CONCURRENTLY` for index creation on live tables:**

```sql
-- Do this (non-blocking)
CREATE INDEX CONCURRENTLY idx_orders_purchase_date ON orders (purchase_date DESC);

-- Not this (blocks all writes until complete)
CREATE INDEX idx_orders_purchase_date ON orders (purchase_date DESC);
```

### Database Diff (Pulling from Dashboard Changes)

If you (or a teammate) made dashboard changes directly, sync them back to migration files:

```bash
# Pull current remote schema state into a new migration file
supabase db diff --linked --schema public -f catch_up_schema_changes
```

Do this, commit it, and then have a serious conversation about not using the dashboard for schema changes in production again.

---

## 11. Supabase MCP — Claude Direct Access

### What the Supabase MCP Provides

The Supabase MCP (Model Context Protocol) server allows Claude to connect directly to your Supabase project and:
- List tables and schema
- Execute SQL queries (read and write)
- Apply migrations
- Inspect the database structure
- Generate TypeScript types

This is what powers the syncflow AI agent's ability to query and update the database directly during workflow execution.

### Setting Up the MCP

The Supabase MCP server is available on GitHub (`supabase/mcp-server-supabase`). In Claude's Cowork mode or Claude Code, configure it by providing your project URL and service role key.

```json
// In your MCP configuration
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_URL": "https://your-project-ref.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### Available MCP Tools

The Supabase MCP exposes these tools to Claude:
- `list_tables` — list all tables in a schema
- `execute_sql` — run arbitrary SQL (read or write)
- `apply_migration` — apply a SQL migration file
- `generate_typescript_types` — generate types from current schema
- `get_project` — get project metadata
- `list_projects` — list all projects in the organisation

### Security Implications

The MCP uses the **service role key**, which means:
- RLS is bypassed — Claude can read and write any row in any table
- There is no audit trail by default (add your own if needed)
- A poorly-worded Claude prompt could accidentally delete data

**Mitigations:**
- Use a read-only Postgres role for MCP when Claude only needs to query data
- Enable `log_statement = 'all'` or use `pg_audit` to log all SQL executed
- Be explicit in Claude prompts: "Read the products table, do not modify any data"
- In production, consider creating a restricted MCP user with specific permissions

```sql
-- Create a read-only MCP user for safe browsing
CREATE ROLE mcp_readonly NOLOGIN;
GRANT USAGE ON SCHEMA public TO mcp_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO mcp_readonly;

-- Create a limited write MCP user (can insert but not delete)
CREATE ROLE mcp_writer NOLOGIN;
GRANT USAGE ON SCHEMA public TO mcp_writer;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO mcp_writer;
```

---

## 12. n8n Integration Patterns

### Connection: Connection Pooler vs. Direct Connection

**Always use the connection pooler (Supavisor)** for n8n workflows. n8n creates many short-lived connections which will exhaust PostgreSQL's `max_connections` limit (default 60 on the free tier, up to 100 on Pro) without pooling.

From your Supabase dashboard → Project Settings → Database:
- **Direct connection:** `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`
- **Connection pooler (Supavisor):** `postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

In n8n's Postgres credentials, use the **pooler URL**. Set pool size to 3–5 connections per n8n workflow — don't default to the n8n maximum.

### Using the Supabase API Node vs. Postgres Node

**Supabase API node:** Uses the auto-generated REST API. Good for simple CRUD. Does NOT support complex SQL queries, CTEs, or window functions.

**Postgres node:** Direct SQL. Use this for anything more than basic inserts/selects. This is the right choice for syncflow's data-heavy workflows.

```
Simple insert of a few rows        → Supabase API node
Complex query with joins/windows   → Postgres node
Bulk upsert (thousands of rows)    → Postgres node
Calling a stored procedure         → Postgres node
```

### Bulk Insert Pattern

Never insert rows one at a time in n8n when you're processing a large dataset. Always batch.

```sql
-- In n8n Postgres node — use a single INSERT with multiple value rows
-- Prepare your data in a Code node first, then construct the query

INSERT INTO inventory_snapshots 
  (product_id, snapshot_date, fulfillable_quantity, reserved_quantity, inbound_quantity)
VALUES
  ('uuid-1', '2026-05-06', 450, 20, 100),
  ('uuid-2', '2026-05-06', 80, 5, 0),
  ('uuid-3', '2026-05-06', 1200, 50, 300)
-- ... up to 1000 rows per INSERT statement
ON CONFLICT (product_id, snapshot_date) DO UPDATE SET
  fulfillable_quantity = EXCLUDED.fulfillable_quantity,
  reserved_quantity = EXCLUDED.reserved_quantity,
  inbound_quantity = EXCLUDED.inbound_quantity;
```

In n8n, use a Code node to build the parameterized query from your item array, then pass it to a Postgres node:

```javascript
// In n8n Code node — prepare bulk insert
const items = $input.all()
const values = items.map(item => {
  const d = item.json
  return `('${d.product_id}', '${d.snapshot_date}', ${d.fulfillable}, ${d.reserved}, ${d.inbound})`
}).join(',\n')

const query = `
  INSERT INTO inventory_snapshots 
    (product_id, snapshot_date, fulfillable_quantity, reserved_quantity, inbound_quantity)
  VALUES ${values}
  ON CONFLICT (product_id, snapshot_date) DO UPDATE SET
    fulfillable_quantity = EXCLUDED.fulfillable_quantity,
    reserved_quantity = EXCLUDED.reserved_quantity,
    inbound_quantity = EXCLUDED.inbound_quantity
`

return [{ json: { query } }]
```

### Upsert on Conflict Pattern

Amazon data is inherently idempotent — if you re-run a data ingestion for the same date, you want it to overwrite, not duplicate. Design all ingestion workflows around upsert:

```sql
INSERT INTO sqpr_snapshots (
  brand_id, marketplace_id, report_date_start, report_date_end, 
  search_query, asin, impressions, clicks, purchases
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (brand_id, marketplace_id, report_date_start, search_query, asin) 
DO UPDATE SET
  impressions = EXCLUDED.impressions,
  clicks = EXCLUDED.clicks,
  purchases = EXCLUDED.purchases,
  updated_at = now();
```

### Service Role Key in n8n

Store the service role key as a Supabase credential or an n8n environment variable — never hardcode it in a workflow node. Access it via `$env.SUPABASE_SERVICE_ROLE_KEY` in Code nodes.

For the Supabase API node in n8n, create a credential with:
- Host: `https://[project-ref].supabase.co`
- Service Role Secret: `your-service-role-key`

---

## 13. Preferred Extensions

These are the extensions syncflow uses. Enable them once at project setup and leave them on.

### pg_cron — Scheduled SQL Jobs

```sql
-- Enable
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule a daily job to refresh a materialized view at 2 AM UTC
SELECT cron.schedule(
  'refresh-daily-sales-summary',      -- job name
  '0 2 * * *',                        -- cron expression
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary$$
);

-- Schedule a job every 15 minutes
SELECT cron.schedule('check-low-inventory', '*/15 * * * *', $$
  INSERT INTO restock_alerts (product_id, days_of_supply, alerted_at)
  SELECT product_id, days_of_supply, now()
  FROM inventory_snapshots
  WHERE snapshot_date = current_date
    AND days_of_supply < 14
    AND days_of_supply IS NOT NULL
  ON CONFLICT (product_id) DO UPDATE SET
    days_of_supply = EXCLUDED.days_of_supply,
    alerted_at = now()
$$);

-- List all scheduled jobs
SELECT * FROM cron.job;

-- Remove a job
SELECT cron.unschedule('check-low-inventory');
```

**Note:** pg_cron is available on Supabase Pro tier and above.

### pg_net — HTTP Calls from SQL

```sql
-- Enable
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Trigger an n8n webhook from a SQL function
-- (e.g., when a new order is inserted)
SELECT net.http_post(
  url := 'https://your-n8n-instance.com/webhook/new-order',
  body := json_build_object(
    'order_id', NEW.id,
    'amazon_order_id', NEW.amazon_order_id,
    'marketplace_id', NEW.marketplace_id
  )::jsonb,
  headers := '{"Content-Type": "application/json"}'::jsonb
) FROM orders WHERE id = NEW.id;
```

Combine pg_net with a trigger to create database-driven webhooks:

```sql
CREATE OR REPLACE FUNCTION notify_n8n_on_new_order()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-n8n.com/webhook/order-received',
    body := row_to_json(NEW)::jsonb,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer your-webhook-secret"}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_n8n_on_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_n8n_on_new_order();
```

### pgvector

Already covered in Section 9. Enable with `CREATE EXTENSION IF NOT EXISTS vector;`

### pg_stat_statements — Query Performance Monitoring

```sql
-- Enable (may require Supabase support or dashboard toggle on some tiers)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find your slowest queries
SELECT 
  query,
  calls,
  total_exec_time / calls AS avg_ms,
  rows / calls AS avg_rows,
  total_exec_time
FROM pg_stat_statements
WHERE calls > 10
ORDER BY avg_ms DESC
LIMIT 20;

-- Reset stats (do this after a schema change or optimization)
SELECT pg_stat_statements_reset();
```

---

## 14. Performance — Indexing, Partitioning & Query Analysis

### Indexing Strategy for Amazon Time-Series Data

Amazon data is almost always queried with time ranges and ASIN/brand filters. Design your indexes around this reality.

**Pattern 1: Time-series lookups (most common)**

```sql
-- "Give me the last 30 days of inventory for all our products"
-- Index: (product_id, snapshot_date DESC)
CREATE INDEX idx_inventory_snapshots_product_date 
  ON inventory_snapshots (product_id, snapshot_date DESC);
```

**Pattern 2: ASIN + marketplace composite (cross-marketplace operations)**

```sql
-- "Find all products with this ASIN across all marketplaces"
CREATE INDEX idx_products_asin_marketplace 
  ON products (asin, marketplace_id);
```

**Pattern 3: Partial indexes for active records (huge performance gain)**

```sql
-- Only index active campaigns — don't waste space on ARCHIVED ones
CREATE INDEX idx_ppc_campaigns_active 
  ON ppc_campaigns (brand_id, campaign_state) 
  WHERE deleted_at IS NULL AND campaign_state != 'ARCHIVED';
```

**Pattern 4: GIN index for JSONB search**

```sql
-- Search inside the attributes JSONB column
CREATE INDEX idx_products_attributes_gin 
  ON products USING gin (attributes);

-- Now you can query: SELECT * FROM products WHERE attributes @> '{"color": "red"}';
```

### EXPLAIN ANALYZE — Your Best Friend

Always run `EXPLAIN ANALYZE` before declaring a query "optimized":

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
  p.asin,
  p.title,
  inv.fulfillable_quantity,
  inv.days_of_supply
FROM products p
JOIN inventory_snapshots inv ON inv.product_id = p.id
WHERE p.brand_id = 'your-brand-uuid'
  AND inv.snapshot_date = current_date
  AND p.deleted_at IS NULL
ORDER BY inv.days_of_supply ASC NULLS LAST;
```

Look for:
- **Seq Scan on large tables** — add an index
- **Hash Join on large tables** — consider indexed nested loop instead
- **Actual Rows >> Estimated Rows** — stale statistics, run `ANALYZE table_name`
- **Buffers: hit >> read** — data is in cache (good); high `read` means cold cache (expected for infrequent queries)

### Materialized Views for Expensive Aggregations

PPC performance summaries, daily sales rollups, and inventory health scores are expensive to compute on every request. Precompute them:

```sql
CREATE MATERIALIZED VIEW daily_ppc_summary AS
SELECT
  c.brand_id,
  c.marketplace_id,
  s.snapshot_date,
  SUM(s.impressions)  AS total_impressions,
  SUM(s.clicks)       AS total_clicks,
  SUM(s.spend)        AS total_spend,
  SUM(s.sales_7d)     AS total_sales,
  CASE WHEN SUM(s.sales_7d) > 0 
    THEN SUM(s.spend) / SUM(s.sales_7d) 
    ELSE NULL END       AS blended_acos
FROM ppc_performance_snapshots s
JOIN ppc_campaigns c ON c.id = s.campaign_id
GROUP BY c.brand_id, c.marketplace_id, s.snapshot_date;

-- Create index on the materialized view
CREATE INDEX idx_daily_ppc_summary_brand_date 
  ON daily_ppc_summary (brand_id, snapshot_date DESC);

-- Refresh via pg_cron daily
SELECT cron.schedule('refresh-ppc-summary', '0 3 * * *', 
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY daily_ppc_summary$$);
```

### Table Partitioning (When You Need It)

For tables that grow into tens of millions of rows (inventory snapshots, order items, SQPR data over years), consider range partitioning by date:

```sql
-- Create the partitioned parent table
CREATE TABLE sqpr_snapshots_partitioned (
  LIKE sqpr_snapshots INCLUDING ALL
) PARTITION BY RANGE (report_date_start);

-- Create monthly partitions
CREATE TABLE sqpr_snapshots_2026_01 
  PARTITION OF sqpr_snapshots_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE sqpr_snapshots_2026_02 
  PARTITION OF sqpr_snapshots_partitioned
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

**Warning:** Partitioning adds operational complexity. Don't do it until you actually have performance problems from table size. Most Amazon seller operations run fine without partitioning for years.

---

## 15. Cost Management

### Free Tier Limits (Critical to Know)

| Resource | Free Tier Limit | Pro Tier Limit |
|---|---|---|
| Database size | 500 MB | 8 GB included, then $0.125/GB |
| Storage | 1 GB | 100 GB included, then $0.021/GB |
| Monthly Active Users | 50,000 | 100,000 |
| Edge Function invocations | 500,000/month | 2 million |
| Realtime messages | 2 million/month | 5 million |
| Number of projects | 2 | Unlimited |
| Project pause (inactivity) | After 1 week | Never |

### What Causes Overages

**Database size:**
- SQPR data is the biggest offender — a full weekly SQPR dump for 100 ASINs across 5 keywords each runs to ~50k rows. After 2 years, that's 5M rows. Estimate ~500 bytes/row = 2.5 GB just for SQPR.
- Raw SP-API responses stored as JSONB — remove these after parsing, or store in Storage instead
- pgvector embeddings — each 1536-dimension float32 vector is 6 KB. 100,000 product embeddings = 600 MB

**Storage overages:**
- Product images (if you're storing main + additional + 360° images)
- Uncompressed report files

**Edge Function overages:**
- Webhooks with high call volume (e.g., ORDER_CHANGE notifications during Prime Day)

### Cost Monitoring

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check database total size
SELECT pg_size_pretty(pg_database_size(current_database()));
```

### Staying Under Budget

- **Archive old data:** Move SQPR snapshots older than 1 year to a cheaper cold storage (export to Parquet in S3 or Google Cloud Storage)
- **Don't store raw SP-API responses forever:** Parse them immediately, store structured data, delete or compress the raw JSONB after 30 days
- **Compress report files** in Storage (gzip before upload)
- **Don't embed everything:** Only embed products that are actively managed or in the catalog — not historical products with no sales
- **Set up Supabase usage alerts** in the dashboard: Settings → Billing → Usage Alerts

---

## 16. Backup & Recovery

### Point-in-Time Recovery (PITR)

**Free tier:** Daily backups only (7-day retention). No PITR.  
**Pro tier:** PITR with 7-day recovery window.  
**Team tier:** PITR with 28-day recovery window.

For a production Amazon operation, **Pro tier is the minimum**. If you're running a multi-brand agency with client data, the $25/month for PITR is non-negotiable.

To restore to a point in time:
1. Dashboard → Settings → Backups
2. Select "Point in Time Recovery"
3. Choose your timestamp
4. Restore creates a NEW project — you then verify and cut traffic over

### Manual Export Pattern

Don't rely solely on Supabase's managed backups. Add a scheduled n8n workflow that exports critical tables to Supabase Storage as compressed JSON:

```javascript
// n8n workflow: daily export of products table to Storage
// Schedule: 0 4 * * * (4 AM UTC daily)

// Step 1: Query the table
const { data } = await supabase
  .from('products')
  .select('*')
  .is('deleted_at', null)

// Step 2: Compress
const compressed = gzip(JSON.stringify(data))

// Step 3: Upload to Storage
await supabase.storage
  .from('exports')
  .upload(`backups/products/${new Date().toISOString().split('T')[0]}.json.gz`, compressed)
```

### What to Back Up Separately

These tables are the most valuable and hardest to recreate:
1. `sqpr_snapshots` — Amazon won't let you re-request historical SQP data (it only shows 90 days)
2. `keyword_rankings` — historical rank data can't be retrieved once it's gone
3. `ppc_performance_snapshots` — Amazon Ads only retains ~60 days in the console
4. `products` and `brands` — your configuration

The orders and inventory data can be re-pulled from SP-API (within limits), but historical SQP and rank data cannot.

---

## 17. Security Hardening

### Key Hierarchy

```
anon key         → Used by frontend/public apps. Subject to RLS. Treat as public.
authenticated    → Used by logged-in users. Subject to RLS. JWTs expire.  
service role key → Bypasses RLS. Never expose. Backend only.
```

### Where Keys Belong

| Location | anon key | service role key |
|---|---|---|
| Frontend (React, Next.js client) | ✅ OK | ❌ Never |
| n8n credential | ❌ Only if RLS is correct | ✅ Yes |
| Edge Function env vars | ✅ OK | ✅ Yes (Supabase injects automatically) |
| Git repository | ❌ Never | ❌ Never |
| Client-side JavaScript | ✅ OK | ❌ Never |
| Supabase Vault | Store secrets here | Store secrets here |

### Supabase Vault for Secrets

Store sensitive credentials (SP-API tokens, Amazon LWA client secrets, n8n API keys) in Supabase Vault — not in plaintext database columns:

```sql
-- Store a secret in Vault
SELECT vault.create_secret(
  'sp_api_refresh_token',
  'Atzr|your-actual-refresh-token',
  'Amazon SP-API refresh token for Brand X'
);

-- Retrieve a secret (only accessible with service role)
SELECT decrypted_secret FROM vault.decrypted_secrets 
WHERE name = 'sp_api_refresh_token';

-- Update a secret
SELECT vault.update_secret(
  secret_id,
  'new-value',
  'Updated refresh token'
)
FROM vault.secrets WHERE name = 'sp_api_refresh_token';
```

### SSL and Network Security

- Supabase enforces SSL on all connections by default — don't disable it
- For production, consider Supabase's network restrictions feature (allowlist specific IP ranges for direct database connections)
- Never open port 5432 to `0.0.0.0/0` on a self-hosted setup

### Audit Logging

For compliance-sensitive operations:

```sql
-- Create an audit log table
CREATE TABLE audit_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name  text NOT NULL,
  operation   text NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
  old_data    jsonb,
  new_data    jsonb,
  user_id     uuid,
  executed_at timestamptz DEFAULT now() NOT NULL
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, old_data, new_data, user_id)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to sensitive tables
CREATE TRIGGER audit_brands
  AFTER INSERT OR UPDATE OR DELETE ON brands
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

---

## 18. Dos & Don'ts

### ✅ DOs

1. **Always use `timestamptz` for any timestamp column.** Amazon data spans multiple timezones. `timestamp` without timezone is a landmine waiting to explode on your 2 AM inventory report.

2. **Always upsert, never blind insert, for Amazon data ingestion.** SP-API reports are idempotent by design — you should be too. Use `ON CONFLICT DO UPDATE` for all automated ingestion workflows.

3. **Use the connection pooler (Supavisor) URL in n8n.** n8n's connection-hungry pattern will hit Postgres `max_connections` without pooling. This kills your database at the worst possible time.

4. **Create indexes AFTER bulk inserts, not before.** Maintaining an index during a 500,000-row bulk insert is dramatically slower than inserting without an index and creating it afterwards.

5. **Use `CONCURRENTLY` for index creation on production tables.** A regular `CREATE INDEX` takes a lock that blocks all writes. `CREATE INDEX CONCURRENTLY` takes longer but doesn't block.

6. **Store SQPR and keyword ranking data indefinitely — or at minimum 2 years.** This historical data is irreplaceable. Amazon doesn't let you re-request it. The cost of storage is negligible compared to losing the data.

7. **Write migrations as SQL files committed to git.** Your schema is code. Treat it that way. Every change is tracked, reviewable, and deployable.

8. **Enable RLS on any table accessible to human users via Supabase Auth.** RLS is not optional for multi-user setups. The default is locked down (no policies = no access) which is safer than forgetting.

9. **Use partial indexes for soft-deleted records.** `WHERE deleted_at IS NULL` in a partial index makes queries on active records dramatically faster than a full table scan.

10. **Use Supabase Vault for SP-API credentials.** Your LWA refresh tokens are the keys to the kingdom — they provide access to a seller's entire Amazon account. Don't store them as plaintext strings.

11. **Run `EXPLAIN ANALYZE` before shipping any query that runs more than once per minute.** Slow queries in automated pipelines accumulate. A 2-second query that n8n runs every 5 minutes is 24 minutes of database CPU per hour.

12. **Separate raw JSONB storage from structured data.** Store the raw SP-API response in a `raw_response jsonb` column, then parse structured data into proper columns. This lets you add new parsed fields later without re-querying Amazon.

### ❌ DON'Ts

1. **Don't use the Supabase dashboard to modify production schema.** Not for "just a quick column add." Not for "it's just an index." Every change through the dashboard is undocumented and unreviewable. Write a migration.

2. **Don't expose the service role key anywhere client-side or in git.** If it's compromised, an attacker has full read/write access to your entire database, bypassing all RLS. Rotate it immediately if you suspect exposure.

3. **Don't use `timestamp` (without timezone).** See Rule #1 in the DOs. This one deserves to be in both lists.

4. **Don't use Firebase or MongoDB for this use case.** Amazon seller data is relational. Joins are your friend. Document stores will make you build the JOIN logic yourself in application code, and you will hate yourself for it.

5. **Don't create a new Supabase project for every small experiment.** The free tier only has 2 active projects. Use your dev project for experiments. Unused projects that accumulate become a management nightmare.

6. **Don't bulk insert rows one at a time in n8n.** 500 separate INSERT statements is 500x slower than a single INSERT with 500 value rows. Always batch.

7. **Don't enable Realtime on high-volume tables.** Enabling Realtime on `sqpr_snapshots` or `order_items` when you're bulk-inserting 100k rows will flood the Realtime server and potentially crash subscriptions.

8. **Don't store full Amazon product images in the database as bytea.** Use Supabase Storage for files. Database columns are for structured data; binary files belong in object storage.

9. **Don't soft-delete without creating a partial index.** Soft deletes are great, but `WHERE deleted_at IS NULL` on a large table without a partial index causes full table scans on every query. The index is not optional.

10. **Don't use Edge Functions for long-running tasks.** 150-second wall-clock limit. Heavy ETL, report downloads, and multi-step orchestration belong in n8n.

11. **Don't rely on Supabase's free tier backups for production data.** Free tier only has daily snapshots. You need Pro tier for PITR. If you lose a day of SQP or PPC data for a major brand, there is no way to get it back.

12. **Don't `DROP TABLE` or `DROP COLUMN` directly in production without a backup and a migration.** Destructive schema changes are irreversible. Back up, write the migration, test on staging, then deploy.

---

## 19. Common Gotchas with Amazon Data Ingestion

### 1. Timezone Confusion in SP-API Responses

Amazon returns timestamps in ISO 8601 format with explicit timezone offsets, but the timezone varies by operation:
- Orders API: `2026-05-06T14:32:00Z` (UTC) ✅
- Reports API dates: sometimes `2026-05-06` (date only, no timezone — assumes Pacific Time!)
- SQP Report: date ranges are in Pacific Time, even for non-US marketplaces

**Mitigation:** Always store `timestamptz`. When parsing report dates that lack timezone, explicitly cast them to Pacific Time first, then convert to UTC:

```sql
-- Convert a date-only string from SP-API reports to timestamptz
SELECT ('2026-05-06'::date AT TIME ZONE 'America/Los_Angeles') AT TIME ZONE 'UTC';
```

### 2. SP-API JSON Quirks

- Monetary amounts come as `{"amount": "12.50", "currencyCode": "USD"}` — note that `amount` is a **string**, not a number. Always cast: `(raw_response->'amount'->>'amount')::numeric`
- Quantity fields can be null even when you'd expect 0
- Some APIs return snake_case fields, others return camelCase — normalize on ingestion
- Boolean fields sometimes come as `"true"` (string) not `true` (boolean)
- Empty arrays are sometimes omitted entirely rather than returned as `[]`

**Defense pattern:** Always parse and validate SP-API JSON before inserting. Use a Code node in n8n or an Edge Function to normalize the shape:

```javascript
// Normalize SP-API order item before insert
function normalizeOrderItem(raw) {
  return {
    amazon_order_item_id: raw.OrderItemId,
    asin: raw.ASIN,
    sku: raw.SellerSKU || null,
    title: raw.Title || null,
    quantity_ordered: parseInt(raw.QuantityOrdered, 10) || 0,
    quantity_shipped: parseInt(raw.QuantityShipped, 10) || 0,
    item_price_amount: raw.ItemPrice ? parseFloat(raw.ItemPrice.Amount) : null,
    item_price_currency: raw.ItemPrice?.CurrencyCode || null,
    is_gift: raw.IsGift === 'true',  // String boolean!
  }
}
```

### 3. Large Report Imports

SP-API reports like `GET_SALES_AND_TRAFFIC_REPORT` or the SQP report can be tens of thousands of rows. Naive n8n handling (loading everything into memory at once) will crash the n8n instance.

**Pattern:** Stream and batch:
1. Download the report file to Supabase Storage first
2. Read and process it in chunks (1,000 rows at a time)
3. Upsert each chunk with a single bulk SQL statement
4. Log progress — these jobs fail mid-way sometimes

```javascript
// Process large report in chunks
const CHUNK_SIZE = 1000
const rows = parseReportFile(rawReportContent)

for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
  const chunk = rows.slice(i, i + CHUNK_SIZE)
  await supabase.rpc('bulk_upsert_sqpr', { rows: chunk })
  console.log(`Processed ${Math.min(i + CHUNK_SIZE, rows.length)} / ${rows.length}`)
}
```

### 4. Report Date Range Gaps

Amazon's reports have data availability delays:
- Sales and Traffic report: data available ~48 hours after the day ends
- SQP report: weekly, data available 3–5 days after the week ends
- Business Report: near real-time

Build gap detection into your ingestion pipelines:

```sql
-- Find days where inventory snapshots are missing
SELECT generate_series(
  (current_date - interval '30 days')::date,
  current_date,
  '1 day'
)::date AS expected_date
EXCEPT
SELECT DISTINCT snapshot_date FROM inventory_snapshots 
WHERE product_id = 'your-product-uuid'
ORDER BY expected_date;
```

### 5. ASIN Matching Across Marketplaces

The same physical product has different ASINs in different marketplaces. Do not assume `asin = 'B001234567'` is the same product across US and UK. Your `products` table's `UNIQUE(asin, marketplace_id)` constraint enforces this correctly — a row is uniquely a combination of ASIN + marketplace.

When doing cross-marketplace analysis, join via your internal `brand_id` and a mapping table if you've set one up.

### 6. SP-API Pagination

SP-API uses `nextToken` for pagination — not `page=1&page=2`. If you stop mid-pagination (network error, n8n timeout), you lose the token and have to start over.

**Pattern:** Collect all pages before inserting, or checkpoint your tokens:

```sql
-- Store pagination state to resume after failures
CREATE TABLE report_ingestion_jobs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id        uuid NOT NULL REFERENCES brands(id),
  report_type     text NOT NULL,
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  status          text NOT NULL DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'failed'
  next_token      text,  -- store pagination token to resume
  rows_ingested   integer DEFAULT 0,
  error_message   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL
);
```

---

## 20. Quick Reference Cheat Sheet

### Connection Strings

```bash
# Local development
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Production (via Supavisor — use this in n8n)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Production (direct — use only for migrations)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### CLI Commands

```bash
supabase login                          # authenticate
supabase link --project-ref <ref>       # link to project
supabase status                         # check local status
supabase start                          # start local stack
supabase stop                           # stop local stack
supabase migration new <name>           # create migration file
supabase db reset                       # reset local DB (apply all migrations)
supabase db push                        # apply migrations to remote
supabase migration list                 # list applied migrations
supabase db diff --linked               # diff local vs remote
supabase functions new <name>           # scaffold Edge Function
supabase functions deploy <name>        # deploy Edge Function
supabase secrets set KEY=VALUE          # set Edge Function env var
```

### Key SQL Patterns

```sql
-- Upsert
INSERT INTO table (...) VALUES (...) ON CONFLICT (unique_col) DO UPDATE SET col = EXCLUDED.col;

-- Soft delete
UPDATE table SET deleted_at = now() WHERE id = $1;

-- Query active records
SELECT * FROM table WHERE deleted_at IS NULL;

-- Get table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size('public.'||tablename)) 
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- Check missing dates in time series
SELECT gs::date AS missing_date FROM generate_series(start_date, end_date, '1 day') gs
WHERE gs::date NOT IN (SELECT DISTINCT snapshot_date FROM your_table WHERE product_id = $1);

-- Similarity search (pgvector)
SELECT id, 1 - (embedding <=> $1::vector) AS similarity FROM product_embeddings ORDER BY embedding <=> $1::vector LIMIT 10;
```

### Extension Enable Commands

```sql
CREATE EXTENSION IF NOT EXISTS vector;            -- pgvector
CREATE EXTENSION IF NOT EXISTS pg_cron;           -- scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_net;            -- HTTP from SQL
CREATE EXTENSION IF NOT EXISTS pg_stat_statements; -- query monitoring
```

### Pricing Quick Reference (2026)

| Tier | Price | DB Storage | Best For |
|---|---|---|---|
| Free | $0 | 500 MB | Development only |
| Pro | $25/mo | 8 GB | Production (minimum viable) |
| Team | $599/mo | Custom | Agency with multiple clients, SLAs |

---

*This document reflects syncflow's preferred patterns for the syncflow stack as of May 2026. Supabase releases updates frequently — verify extension availability and pricing at [supabase.com/pricing](https://supabase.com/pricing) and [supabase.com/docs](https://supabase.com/docs).*
