# Database Best Practices for Amazon Seller Operations
*Research compiled May 2026 — framed for companies managing sales, inventory, PPC, SQP, and product research data*

---

## Table of Contents

1. [The Core Question: What Kind of Database Do You Actually Need?](#1-the-core-question)
2. [Solution Providers: Pros, Cons & Pricing](#2-solution-providers)
3. [Recommended Architecture for an Amazon Seller Stack](#3-recommended-architecture)
4. [Schema Design: The Right Tables for Your Data](#4-schema-design)
5. [Dos & Don'ts](#5-dos--donts)
6. [Safety, Security & Access Control](#6-safety-security--access-control)
7. [Data Integrity & Ongoing Validation](#7-data-integrity--ongoing-validation)
8. [Keeping It Clean: Maintenance Routines](#8-keeping-it-clean)
9. [Decision Matrix: Choosing Your Stack](#9-decision-matrix)

---

## 1. The Core Question

Before choosing a provider, answer these three questions:

**a) Who is writing to this database?**
Humans directly, automated pipelines (n8n, APIs), or both? Amazon seller operations typically involve all three — manual product research, automated SQP/PPC ingestion, and n8n workflows.

**b) What are the query patterns?**
Time-series reads (SQP trends over weeks), aggregate rollups (PPC spend vs. revenue by ASIN), and relational lookups (product → orders → inventory). This points toward a **relational (SQL) database**, not a document store like MongoDB or Firebase.

**c) What is your team's technical level?**
If it's just you or a small ops team, pick something with a great UI and low overhead. You want to spend time on the *data*, not the *database*.

**Bottom line for Amazon sellers:** You want a **managed PostgreSQL** database. It handles relational queries well, scales reasonably, has excellent tooling, and every major provider offers it. Do not use a NoSQL/document database as your primary store for this kind of structured, relational business data.

---

## 2. Solution Providers

### 2.1 Supabase ⭐ *Recommended for most Amazon seller operations*

**What it is:** Managed PostgreSQL with a full backend platform (auth, storage, realtime, edge functions, a beautiful UI dashboard).

**Pros:**
- Excellent visual database editor — great for non-technical team members who need to browse/edit records
- Built-in Row Level Security (RLS) for fine-grained access control
- Auto-generated REST and GraphQL APIs from your schema — handy for n8n integrations
- Full Postgres — you get all the power: JSON columns, window functions, CTEs, etc.
- Generous free tier for prototyping; painless upgrade path
- Great for combining database + file storage (e.g. storing research PDFs alongside structured data)
- Active open-source community, excellent documentation

**Cons:**
- Gets expensive quickly if you have many projects (free tier is limited to 2 active projects)
- Some advanced Postgres extensions require higher tiers
- Not the cheapest pure-database option at scale

**Pricing (2026):**
| Tier | Price | Storage | Notes |
|------|-------|---------|-------|
| Free | $0 | 500 MB | 2 projects, pauses after 1 week inactivity |
| Pro | $25/mo | 8 GB | Most small businesses live here |
| Team | $599/mo | Custom | Compliance, SLAs, SSO |
| Enterprise | Custom | Custom | Dedicated infrastructure |

**Best for:** Small to mid-size Amazon seller operations, teams using n8n for automation, anyone who wants a UI-friendly admin panel alongside their database.

---

### 2.2 Neon *Best pure-database value*

**What it is:** Serverless managed PostgreSQL. Acquired by Databricks in early 2026, which drove compute costs down 15–25%.

**Pros:**
- Cheapest pure-database option on the market
- Serverless branching — spin up a copy of your database for testing, then discard it (like Git branches, but for your data)
- Scales to zero when idle — no compute charges when nothing is running
- Postgres-native, full feature support
- Excellent for read-heavy workloads

**Cons:**
- Fewer batteries included than Supabase (no auth, no storage, no UI dashboard out of the box)
- Cold start latency on serverless instances (typically 500ms–2s)
- Databricks acquisition still settling — product roadmap in flux

**Pricing (2026):**
| Tier | Price | Compute | Storage |
|------|-------|---------|---------|
| Free | $0 | 100 compute-hours/mo | 0.5 GB/project, 5 GB total |
| Launch | $19/mo | 300 compute-hours | 10 GB |
| Scale | $69/mo | 750 compute-hours | 50 GB |
| Business | $700/mo | Custom | Custom |

**Best for:** Cost-conscious setups, pipelines where the database is purely a backend store accessed by automated scripts/n8n, developers who want branching for data migrations.

---

### 2.3 PlanetScale *Best for massive scale and schema safety*

**What it is:** MySQL-compatible managed database built on Vitess (the same technology YouTube uses). Famous for zero-downtime schema changes.

**Pros:**
- Schema branching with automatic conflict detection — safely deploy schema changes without downtime
- Extremely high throughput and horizontal scaling
- Excellent connection pooling

**Cons:**
- **No free tier** — eliminated in January 2024
- Starts at $39/month with limited storage
- MySQL, not PostgreSQL — fewer ecosystem tools, some Postgres features unavailable
- Overkill for most Amazon seller operations
- Row-read billing model can surprise you at scale

**Pricing (2026):**
| Tier | Price | Storage | Row Reads |
|------|-------|---------|-----------|
| Scaler | $39/mo | 10 GB | 1B/month |
| Scaler Pro | $99/mo | 25 GB | 2.5B/month |
| Enterprise | Custom | Custom | Custom |

**Best for:** High-scale operations with large dev teams; not recommended for solo or small team Amazon sellers.

---

### 2.4 Azure SQL / Azure Database for PostgreSQL *Best for enterprise or Microsoft-ecosystem teams*

**What it is:** Microsoft's managed SQL Server (Azure SQL) or managed PostgreSQL (Azure Database for PostgreSQL). Part of the Azure cloud ecosystem.

**Pros:**
- Best in class compliance certifications (SOC 2, ISO 27001, HIPAA, GDPR) — important if you're handling customer data at enterprise scale
- Deep integration with Power BI, Azure Data Factory, and Microsoft ecosystem tools
- Reserved instance pricing can save up to 55% versus pay-as-you-go
- Excellent SLAs (99.99% uptime)
- Flexible Server (PostgreSQL) supports stop/start to control costs
- Burstable compute tiers for dev/test workloads

**Cons:**
- Complex pricing model — easy to accidentally over-provision
- Steeper learning curve; more suited to IT/DevOps teams
- Minimum viable setup is more expensive than Supabase or Neon
- Overkill for a lean Amazon seller operation
- Lock-in to Azure ecosystem can become a long-term constraint

**Pricing (2026) — Azure Database for PostgreSQL Flexible Server:**
| Tier | vCores | Approx. Price/mo |
|------|--------|------------------|
| Burstable B1ms | 1 vCore, 2 GB | ~$16/mo |
| General Purpose D2s | 2 vCores, 8 GB | ~$120/mo |
| Business Critical | 4+ vCores | $400+/mo |
| Storage | Any tier | ~$0.11/GB/mo |

**Best for:** Companies already in the Microsoft/Azure ecosystem, enterprise operations with compliance requirements, teams with dedicated IT/DevOps resources.

---

### 2.5 Google Cloud SQL / AlloyDB *Honorable mention*

**What it is:** Google's managed PostgreSQL and MySQL. AlloyDB is Google's proprietary PostgreSQL-compatible product with AI integrations.

**Pros:**
- Excellent for teams using Google Workspace, BigQuery, or Looker Studio for reporting
- AlloyDB is 4x faster than standard PostgreSQL for analytical queries
- Good AI/ML integration hooks

**Cons:**
- Similar complexity and cost profile to Azure
- Minimum instance cost around $50–80/month
- Not cost-effective for small operations

**Best for:** Teams reporting into Google Looker Studio or integrating with BigQuery for large-scale analytics.

---

### 2.6 Railway / Render *Budget-friendly self-managed options*

- Both offer managed PostgreSQL starting around $5–7/month
- Good for simple setups, prototypes, or when you want simplicity above everything
- Less powerful tooling, fewer features, but dead simple to operate
- **Not recommended as a primary production database** for a real Amazon seller operation with meaningful revenue at stake

---

## 3. Recommended Architecture for an Amazon Seller Stack

For a typical Amazon seller company managing: Sales, Inventory, Products, PPC, SQP, Projects, and Research — here is the recommended setup:

```
┌─────────────────────────────────────────────────────────┐
│                   PRIMARY DATABASE                       │
│              Supabase (PostgreSQL)                       │
│    Sales | Products | Inventory | PPC | SQP | Projects  │
└────────────────────────┬────────────────────────────────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
    ┌──────▼──────┐ ┌───▼────┐ ┌─────▼──────┐
    │  n8n / API  │ │ Dashbd │ │ File Store │
    │  Pipelines  │ │ (BI)   │ │ (Research) │
    └─────────────┘ └────────┘ └────────────┘
```

**Why Supabase as the primary:**
- One platform handles database + file storage (research docs, reports)
- The UI dashboard is accessible to non-technical team members
- REST API auto-generation makes n8n integrations trivial
- Row Level Security lets you restrict who can see what (e.g. only see your own client's data)
- You can run reporting SQL directly in the dashboard

**For reporting/analytics:** Connect Supabase to Metabase (free), Retool, or Google Looker Studio. Run complex aggregate queries there rather than building them into your operational database.

**For large-scale historical data (>1 year of SQP/PPC):** Consider archiving to a data warehouse like BigQuery (generous free tier) or MotherDuck (DuckDB-as-a-service, excellent for analytical queries). Keep only the last 90 days "hot" in your operational database.

---

## 4. Schema Design: The Right Tables for Your Data

### Core Principle: Normalize First, Denormalize When Proven Necessary

Good schema design separates concerns. Here is a recommended structure for an Amazon seller operation:

---

### Table Group 1: Product Catalog

```sql
-- Master product record
products (
  id UUID PRIMARY KEY,
  asin VARCHAR(10) UNIQUE NOT NULL,
  parent_asin VARCHAR(10),
  title TEXT NOT NULL,
  brand VARCHAR(100),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  marketplace VARCHAR(10) DEFAULT 'US',
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, discontinued
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Product variants / child ASINs
product_variants (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  asin VARCHAR(10) UNIQUE NOT NULL,
  sku VARCHAR(100),
  size VARCHAR(50),
  color VARCHAR(50),
  pack_count INTEGER DEFAULT 1
)
```

---

### Table Group 2: Sales & Revenue

```sql
-- Daily sales snapshot per ASIN
sales_daily (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  date DATE NOT NULL,
  units_ordered INTEGER DEFAULT 0,
  units_shipped INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  refunds INTEGER DEFAULT 0,
  refund_amount DECIMAL(12,2) DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  buy_box_percentage DECIMAL(5,2),
  marketplace VARCHAR(10) DEFAULT 'US',
  UNIQUE(product_id, date, marketplace)
)

-- Monthly revenue rollup (pre-aggregated for performance)
sales_monthly (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_revenue DECIMAL(12,2),
  total_units INTEGER,
  avg_selling_price DECIMAL(10,2),
  UNIQUE(product_id, year, month)
)
```

---

### Table Group 3: Inventory

```sql
inventory_snapshots (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  snapshot_date DATE NOT NULL,
  units_available INTEGER DEFAULT 0,
  units_inbound INTEGER DEFAULT 0,
  units_reserved INTEGER DEFAULT 0,
  units_unfulfillable INTEGER DEFAULT 0,
  days_of_supply INTEGER,
  reorder_alert BOOLEAN DEFAULT false,
  warehouse_location VARCHAR(50), -- FBA, 3PL name, etc.
  UNIQUE(product_id, snapshot_date, warehouse_location)
)

reorder_events (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  order_date DATE NOT NULL,
  units_ordered INTEGER NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  expected_arrival DATE,
  actual_arrival DATE,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(12,2),
  po_number VARCHAR(100),
  status VARCHAR(20) -- ordered, shipped, received, cancelled
)
```

---

### Table Group 4: PPC Advertising Data

```sql
ppc_campaigns (
  id UUID PRIMARY KEY,
  campaign_id VARCHAR(100) UNIQUE NOT NULL, -- Amazon's campaign ID
  name TEXT NOT NULL,
  campaign_type VARCHAR(20), -- SP, SB, SD
  targeting_type VARCHAR(20), -- AUTO, MANUAL
  status VARCHAR(20),
  daily_budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  portfolio_id VARCHAR(100)
)

ppc_performance_daily (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES ppc_campaigns(id),
  product_id UUID REFERENCES products(id),
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  sales DECIMAL(10,2) DEFAULT 0,
  orders INTEGER DEFAULT 0,
  acos DECIMAL(6,2) GENERATED ALWAYS AS (
    CASE WHEN sales > 0 THEN (spend / sales * 100) ELSE NULL END
  ) STORED,
  roas DECIMAL(8,2) GENERATED ALWAYS AS (
    CASE WHEN spend > 0 THEN (sales / spend) ELSE NULL END
  ) STORED,
  UNIQUE(campaign_id, product_id, date)
)

-- Keyword-level data
ppc_keywords (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES ppc_campaigns(id),
  keyword TEXT NOT NULL,
  match_type VARCHAR(20), -- EXACT, PHRASE, BROAD
  bid DECIMAL(8,2),
  status VARCHAR(20),
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  sales DECIMAL(10,2) DEFAULT 0
)
```

---

### Table Group 5: SQP (Search Query Performance)

```sql
sqp_data (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  search_query TEXT NOT NULL,
  reporting_period_type VARCHAR(10) NOT NULL, -- WEEK, MONTH, QUARTER
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  -- Impressions
  brand_impressions INTEGER DEFAULT 0,
  total_query_impressions INTEGER DEFAULT 0,
  impression_share DECIMAL(6,4),
  -- Clicks
  brand_clicks INTEGER DEFAULT 0,
  total_query_clicks INTEGER DEFAULT 0,
  click_share DECIMAL(6,4),
  -- Purchases
  brand_purchases INTEGER DEFAULT 0,
  total_query_purchases INTEGER DEFAULT 0,
  purchase_share DECIMAL(6,4),
  -- Cart adds
  brand_cart_adds INTEGER DEFAULT 0,
  total_query_cart_adds INTEGER DEFAULT 0,
  marketplace VARCHAR(10) DEFAULT 'US',
  UNIQUE(product_id, search_query, reporting_period_type, period_start, marketplace)
)
```

---

### Table Group 6: Research & Projects

```sql
research_projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type VARCHAR(50), -- product_research, market_analysis, competitor_analysis
  status VARCHAR(20) DEFAULT 'active', -- active, completed, archived
  owner VARCHAR(100),
  start_date DATE,
  target_completion DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

research_asins (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES research_projects(id),
  asin VARCHAR(10) NOT NULL,
  competitor_name TEXT,
  monthly_revenue_estimate DECIMAL(12,2),
  bsr INTEGER,
  review_count INTEGER,
  avg_rating DECIMAL(3,2),
  opportunity_score DECIMAL(5,2),
  notes TEXT,
  researched_at TIMESTAMPTZ DEFAULT now()
)

-- Link research projects back to products (when a product gets launched)
product_research_link (
  product_id UUID REFERENCES products(id),
  project_id UUID REFERENCES research_projects(id),
  PRIMARY KEY (product_id, project_id)
)
```

---

### Essential Indexes

Always add indexes on your most common query patterns:

```sql
-- Sales queries by date range are very common
CREATE INDEX idx_sales_daily_date ON sales_daily(date DESC);
CREATE INDEX idx_sales_daily_product_date ON sales_daily(product_id, date DESC);

-- PPC queries almost always filter by date
CREATE INDEX idx_ppc_performance_date ON ppc_performance_daily(date DESC);
CREATE INDEX idx_ppc_performance_product ON ppc_performance_daily(product_id, date DESC);

-- SQP queries by keyword
CREATE INDEX idx_sqp_query ON sqp_data(search_query);
CREATE INDEX idx_sqp_product_period ON sqp_data(product_id, period_start DESC);

-- Inventory by date
CREATE INDEX idx_inventory_date ON inventory_snapshots(snapshot_date DESC);
```

---

## 5. Dos & Don'ts

### ✅ DOs

**Schema Design:**
- **DO use UUIDs as primary keys** — not auto-increment integers. Makes data portable and merge-safe when combining data from multiple sources.
- **DO use TIMESTAMPTZ (timestamp with timezone)** — always store timestamps with timezone context. Using plain TIMESTAMP is a trap.
- **DO add `created_at` and `updated_at` to every table** — you will always want to know when records were created/changed.
- **DO normalize your data** — put products in one table, sales in another, PPC in another. Do NOT stuff everything into one giant CSV-like table.
- **DO use ENUM-style constraints or reference tables** for status fields — prevent invalid values like `"Active"` vs `"active"` vs `"ACTIVE"` all meaning the same thing.
- **DO use generated/computed columns for derived metrics** — store impressions, clicks, and spend; let the database compute ACOS and ROAS automatically.
- **DO add a `UNIQUE` constraint** on natural composite keys (e.g. `product_id + date + marketplace`) to prevent duplicate rows from API re-ingestion.
- **DO version your schema** — use migration files (numbered SQL files) so you have a history of every change made to the database structure.

**Operations:**
- **DO test schema changes on a branch or staging database first** — never ALTER TABLE in production without testing.
- **DO document every table and column** — even a simple comment in your migration file explaining what a field means saves hours later.
- **DO set up automated daily backups** with at least 7-day retention. For Supabase Pro, this is enabled by default.
- **DO audit your database size monthly** — identify tables growing unexpectedly fast.

---

### ❌ DON'Ts

**Schema Design:**
- **DON'T store comma-separated values in a single column** — if you need multiple keywords per product, create a junction table. Comma-separated fields are a maintenance nightmare.
- **DON'T use floating-point (FLOAT/REAL) for money** — always use `DECIMAL(12,2)`. Floating-point math causes rounding errors that compound over time.
- **DON'T name columns with reserved SQL keywords** — avoid names like `order`, `user`, `date`, `value`. Prefix with the domain (e.g. `order_date`, `order_status`).
- **DON'T skip foreign key constraints** because "it's easier" — referential integrity saves you from ghost records and broken relationships down the line.
- **DON'T use text columns for things that should be numbers** — if a field is always a number, store it as a number. Text "123" cannot be summed or sorted numerically.
- **DON'T create one giant `metadata` JSON column for everything** — it's tempting but becomes a black hole. Use proper columns.
- **DON'T use NULL to mean "zero"** — if sales were zero that day, store 0. If data is genuinely missing/unknown, use NULL. Mixing the two breaks your aggregate queries.

**Operations:**
- **DON'T run `DELETE FROM` without a `WHERE` clause** — ever. If you need to clear a table, use `TRUNCATE` and make absolutely sure that's your intent.
- **DON'T store API keys, passwords, or secrets in the database** — use environment variables or a secrets manager.
- **DON'T give your automation pipelines (n8n, scripts) superuser/admin credentials** — create a dedicated service role with only the permissions it needs.
- **DON'T let raw CSV imports hit your production database directly** — always stage, validate, then load.
- **DON'T put all your data in one massive table** because it's "simpler" — querying 5 million rows of mixed data types is slow, fragile, and hard to maintain.
- **DON'T skip backups before a migration** — even a "safe" ALTER TABLE has gone wrong before.

---

## 6. Safety, Security & Access Control

### 6.1 The Principle of Least Privilege

Create separate database roles with the minimum access required:

| Role | Purpose | Permissions |
|------|---------|-------------|
| `app_admin` | Human admin, schema changes | Full access |
| `app_service` | n8n, API pipelines | INSERT, UPDATE, SELECT on specific tables |
| `app_readonly` | Reporting tools, dashboards | SELECT only |
| `app_etl` | Data import jobs | INSERT, SELECT on staging tables only |

In Supabase, use Row Level Security (RLS) policies to enforce this at the row level — not just the table level.

### 6.2 Encryption

- **At rest:** All major managed providers (Supabase, Neon, Azure) encrypt at rest by default using AES-256. Verify this is enabled; do not assume.
- **In transit:** Always use SSL/TLS connections. Never connect to your database over an unencrypted connection, even on a local network.
- **Sensitive fields:** Consider encrypting specific sensitive columns (e.g. supplier pricing, margin data) using `pgcrypto` extension in PostgreSQL.

### 6.3 Access Credentials

- **Rotate your database passwords every 90 days** — put a calendar reminder.
- **Never hardcode connection strings in code** — use environment variables.
- **Use connection pooling** (PgBouncer, Supabase's built-in pooler) — raw connections are expensive and a naive app can exhaust the connection limit.
- **Enable IP allowlisting** — only allow connections from known IP addresses (your office, your server's static IP, n8n's IP range).
- **Enable MFA on your database admin account** — Supabase and all major providers support this.

### 6.4 Backup Strategy (The 3-2-1 Rule)

Keep **3 copies** of your data, on **2 different media**, with **1 offsite**:

1. Live database (Supabase/Neon managed)
2. Daily automated snapshot (enabled by default on Pro tiers)
3. Weekly export to your own cloud storage (S3, Google Drive) using pg_dump

**Test your backups.** A backup you've never restored from is not a backup — it's a hope. Run a quarterly restore drill.

---

## 7. Data Integrity & Ongoing Validation

### 7.1 Database-Level Constraints (Your First Line of Defense)

Let the database enforce rules, not just your application:

```sql
-- Prevent negative inventory
ALTER TABLE inventory_snapshots ADD CONSTRAINT chk_positive_inventory 
  CHECK (units_available >= 0);

-- ACOS must be between 0 and 1000%
ALTER TABLE ppc_performance_daily ADD CONSTRAINT chk_acos_range 
  CHECK (acos IS NULL OR (acos >= 0 AND acos <= 1000));

-- Date sanity check
ALTER TABLE sales_daily ADD CONSTRAINT chk_future_dates 
  CHECK (date <= CURRENT_DATE + INTERVAL '1 day');

-- Marketplace must be a known value
ALTER TABLE products ADD CONSTRAINT chk_marketplace 
  CHECK (marketplace IN ('US', 'CA', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'AU'));
```

### 7.2 Staged Import Pattern

Never write raw data directly to your production tables. Use a staging pattern:

```
Raw API Data → staging_table → validation checks → production table
                                    ↓ (if validation fails)
                               error_log table
```

```sql
-- Staging table for SQP imports
staging_sqp_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_data JSONB NOT NULL,
  source VARCHAR(50), -- 'manual_csv', 'sp_api', 'n8n_workflow'
  imported_at TIMESTAMPTZ DEFAULT now(),
  status VARCHAR(20) DEFAULT 'pending', -- pending, validated, loaded, failed
  error_message TEXT,
  row_count INTEGER
)
```

### 7.3 Validation Rules for Amazon Seller Data

Key validations to run before loading each data type:

**Sales Data:**
- Revenue must be >= 0
- Units ordered must be >= 0
- Date must be in the past (no future sales)
- No duplicate product+date+marketplace rows
- Revenue per unit (revenue / units) must be within expected price range

**PPC Data:**
- Spend must be >= 0
- Clicks must be <= Impressions
- ACOS outlier check: flag any rows where ACOS > 300% (likely data error or test campaign)
- Date range matches the report period requested

**SQP Data:**
- Impression share must be between 0 and 1 (0% to 100%)
- Brand impressions must be <= total query impressions
- Reporting period must match one of: WEEK, MONTH, QUARTER
- Period start/end dates must align with valid reporting boundaries

**Inventory Data:**
- Available + Reserved + Inbound = Total expected (reconciliation check)
- Days of supply must be >= 0
- Flag any SKU where available units dropped >50% day-over-day

### 7.4 Monitoring Queries to Run Weekly

```sql
-- Check for orphaned records (products in sales table but not in products table)
SELECT DISTINCT s.product_id 
FROM sales_daily s 
LEFT JOIN products p ON p.id = s.product_id 
WHERE p.id IS NULL;

-- Check for duplicate sales records
SELECT product_id, date, marketplace, COUNT(*) as cnt
FROM sales_daily
GROUP BY product_id, date, marketplace
HAVING COUNT(*) > 1;

-- Check for future-dated records (data pipeline issue)
SELECT COUNT(*) FROM sales_daily WHERE date > CURRENT_DATE;

-- Check for stale inventory (no snapshot in last 7 days)
SELECT p.asin, MAX(i.snapshot_date) as last_snapshot
FROM products p
LEFT JOIN inventory_snapshots i ON i.product_id = p.id
WHERE p.status = 'active'
GROUP BY p.asin
HAVING MAX(i.snapshot_date) < CURRENT_DATE - INTERVAL '7 days'
   OR MAX(i.snapshot_date) IS NULL;

-- PPC spend anomaly check (spend > 2x 30-day average)
WITH daily_avg AS (
  SELECT campaign_id, AVG(spend) as avg_spend
  FROM ppc_performance_daily
  WHERE date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY campaign_id
)
SELECT p.campaign_id, p.date, p.spend, d.avg_spend,
       p.spend / NULLIF(d.avg_spend, 0) as spend_ratio
FROM ppc_performance_daily p
JOIN daily_avg d ON d.campaign_id = p.campaign_id
WHERE p.date = CURRENT_DATE - INTERVAL '1 day'
  AND p.spend > d.avg_spend * 2;
```

---

## 8. Keeping It Clean: Maintenance Routines

### 8.1 Daily (Automated)
- Run data ingestion pipelines (SQP, PPC, Sales, Inventory)
- Validate staging data before promoting to production tables
- Log any validation failures to error table + alert via Slack/email
- Archive processed staging rows (mark as `loaded`, keep for 30 days)

### 8.2 Weekly (Semi-automated)
- Run the monitoring queries above; review flagged anomalies
- Check table sizes — flag any unexpected growth (>20% week-over-week)
- Review error log table for recurring import failures
- Confirm backup snapshots completed successfully
- Check index usage: remove unused indexes, add missing ones

### 8.3 Monthly
- Reconcile sales totals against Amazon Business Reports manually (spot-check 5 ASINs)
- Reconcile PPC spend against Amazon Campaign Manager totals
- Archive data older than defined retention period (e.g. move daily PPC data >18 months to archive table)
- Update `sales_monthly` rollup table if using pre-aggregated summaries
- Review and rotate database credentials if approaching 90-day mark

### 8.4 Quarterly
- Run a backup restoration drill — actually restore to a test database and verify data
- Review schema for tables that have grown stale (no new rows in 90 days) — archive or drop
- Review all service roles and permissions — remove any that are no longer needed
- Run `VACUUM ANALYZE` on large tables (Supabase/managed providers do this automatically, but verify it's scheduled)
- Review your retention policies: how long do you actually need daily PPC keyword-level data?

### 8.5 Data Retention Policy (Recommended)

| Data Type | Hot (Full Detail) | Warm (Aggregated) | Cold/Archive |
|-----------|------------------|-------------------|--------------|
| Sales daily | 2 years | Monthly rollup: forever | Raw export to S3 |
| PPC daily keyword | 1 year | Weekly rollup: 3 years | Archive table |
| SQP data | 2 years | Monthly rollup: forever | Archive table |
| Inventory snapshots | 1 year | Weekly snapshot: 3 years | Archive table |
| Research projects | Indefinite (small data) | — | — |
| Staging/import logs | 30 days | — | Delete |
| Error logs | 90 days | — | Delete |

---

## 9. Decision Matrix: Choosing Your Stack

Use this to pick your setup based on your situation:

| Scenario | Recommended Stack |
|----------|------------------|
| Solo operator, just starting out | **Supabase Free → Pro** when you hit limits |
| Small team (2–5 people), n8n automation | **Supabase Pro** — best all-around |
| Technical team, want cheapest pure DB | **Neon Launch or Scale** + Metabase for dashboards |
| Enterprise, compliance requirements | **Azure Database for PostgreSQL** Flexible Server |
| Microsoft ecosystem already | **Azure SQL** or **Azure Database for PostgreSQL** |
| Need to grow to millions of rows fast | **Neon** (serverless scaling) or **PlanetScale** (if MySQL is ok) |
| Multiple geographic markets | **Supabase Pro** with read replicas, or **Azure** with geo-redundancy |

### The Honest Recommendation

**Start with Supabase Pro at $25/month.** You get a real PostgreSQL database, a clean admin UI, file storage for research documents, auto-generated APIs for your n8n workflows, Row Level Security, and a reliable backup system. The vast majority of Amazon seller operations will never outgrow it. If you hit its limits, migrating from Supabase to Neon or a cloud provider is straightforward — Postgres is Postgres.

What will hurt you far more than the wrong provider choice is the wrong schema design, bad data quality, and no validation. Get those right first.

---

## Quick Reference Card

```
PROVIDER SUMMARY
────────────────
Supabase   → Best all-around for Amazon sellers. $25/mo Pro.
Neon       → Cheapest pure DB. Great for automation-heavy setups.
PlanetScale→ High scale, no free tier. Overkill for most.
Azure SQL  → Enterprise, compliance, Microsoft ecosystem.
Google SQL → Best if you're in Google/BigQuery ecosystem.

SCHEMA RULES
────────────
✅ UUID primary keys
✅ DECIMAL for money (not FLOAT)
✅ TIMESTAMPTZ for all timestamps
✅ UNIQUE constraints on natural composite keys
✅ Foreign keys on all relationships
✅ Indexes on date columns and common filters
❌ No comma-separated values in columns
❌ No NULL where you mean 0
❌ No reserved words as column names

SAFETY RULES
────────────
✅ Separate DB roles per service (least privilege)
✅ SSL/TLS connections always
✅ IP allowlisting
✅ Rotate passwords every 90 days
✅ Test backups quarterly
✅ Stage → Validate → Load (never raw import to prod)
❌ No superuser credentials in automation
❌ No secrets in code

MAINTENANCE
───────────
Daily  → Run & validate pipelines
Weekly → Monitor anomalies, check table growth
Monthly → Reconcile totals, rotate credentials
Quarterly → Restore drill, schema review, VACUUM
```

---

*Research sources: Supabase, Neon, PlanetScale, Azure pricing pages; GeeksforGeeks system design; Atlan data integrity best practices; InstaClustr database management 2026; Amazon SP-API SQP documentation; Perpetua SQP analysis guide.*
