# GLOSSARY.md

Every technical term used in this repo, in one line of plain English.

## Database concepts

| Term | Plain English |
|---|---|
| **Schema** | A folder for tables inside a database. operator-datacore has 5: `raw`, `brain`, `ops`, `analytics`, `meta`. |
| **Migration** | A `.sql` file that applies a change to your database (creates tables, adds columns, etc.). They run in order, only once. |
| **Table** | A spreadsheet-like collection of rows, with named columns. |
| **Row** | A single record in a table. One sale. One order. One inventory snapshot. |
| **Column** | A field on a row. Always the same type across all rows. |
| **Primary key** | The set of columns that uniquely identifies a row. The database enforces no two rows share a primary key. |
| **Foreign key** | A column that points at another table's primary key. Links rows together. |
| **Index** | A pre-sorted lookup that makes queries faster. |
| **View** | A saved query that looks like a table. operator-datacore uses views in `analytics.*` for currency-converted output. |
| **Upsert** | "Insert if new, update if exists." Idempotent — running twice produces the same result. |
| **JSONB** | A column that holds JSON data, queryable inside the database. We use it in `raw.*` to store unparsed API responses. |

## Postgres / Supabase

| Term | Plain English |
|---|---|
| **Postgres** | The database engine Supabase runs. Free, open source, very capable. |
| **PostgREST** | The auto-generated REST API Supabase exposes over your tables. Reads schema, generates endpoints. |
| **Service role key** | A "master password" for your Supabase database. Bypasses row-level security. **Never share it. Never commit it.** |
| **Anon key** | A public key that's safe to use in client-side code. Limited by row-level security. |
| **Row-level security (RLS)** | Postgres rules that restrict which rows each user can see. Off by default in operator-datacore (single-operator workflow). |
| **`pg_cron`** | A Postgres extension that schedules SQL jobs. operator-datacore uses it to trigger daily rollups. |
| **`pg_net`** | A Postgres extension that lets the database make outbound HTTP calls. Useful for triggering Edge Functions from cron. |

## Amazon SP-API

| Term | Plain English |
|---|---|
| **SP-API** | The official Amazon Selling Partner API. The only legitimate way to programmatically pull seller data. |
| **LWA** | "Login With Amazon." The OAuth flavour Amazon uses for seller authorisation. |
| **Refresh token** | A long-lived credential (~12 months) that you exchange for short-lived access tokens. Treat it like a password. |
| **Access token** | A short-lived credential (~1 hour) you put in API request headers. operator-datacore exchanges and caches these automatically. |
| **Marketplace ID** | A 14-character code identifying an Amazon storefront. `ATVPDKIKX0DER` is US. Full list: `meta.marketplace`. |
| **Region** | `na`, `eu`, or `fe`. Determines which SP-API base URL to call. |
| **Report type** | The official identifier for a specific report. Always uppercase, always starts with `GET_`. Example: `GET_SALES_AND_TRAFFIC_REPORT`. |
| **Brand Analytics** | Amazon's reporting suite for brand-registered sellers. Sales & Traffic + Search Query Performance + Search Catalog Performance + Repeat Purchase + Market Basket. |
| **RDT** | "Restricted Data Token." A short-lived token (1 hour) needed to read PII (buyer name, shipping address). Scoped per call. operator-datacore deliberately avoids PII in v1. |
| **Rate limit** | How many requests per second SP-API will accept. operator-datacore handles this automatically with retry + backoff. |

## Sales & Traffic specific

| Term | Plain English |
|---|---|
| **Ordered product sales** | Revenue from orders placed in the window, native currency, before refunds. The number Amazon shows in Seller Central. |
| **Units ordered** | Number of units in those orders. |
| **Sessions** | Distinct visitor sessions to your detail page. Capped at 24 hours per visitor. |
| **Page views** | Detail page loads. Higher than sessions because one visitor can refresh. |
| **Buy box percentage** | Share of detail page views where you held the buy box. |
| **Unit session percentage** | Amazon's official conversion rate: units / sessions. |
| **Parent ASIN / Child ASIN** | Variations roll up under a parent. Most reporting is at child level. |

## TikTok Shop

| Term | Plain English |
|---|---|
| **Shop cipher** | A unique identifier for your TikTok Shop, used in API request signatures. |
| **AUCTION_AD level** | The lowest granularity TikTok Marketing API exposes (campaign × day). No per-order attribution. |

## Google Workspace

| Term | Plain English |
|---|---|
| **Drive change feed** | A stream of file changes since your last `pageToken`. Lets you sync without scanning the whole drive. |
| **Folder allowlist** | A list of folder IDs operator-datacore is permitted to sync. Everything else is ignored. |

## Operations

| Term | Plain English |
|---|---|
| **Backfill** | Pulling historical data once. Different from incremental sync, which pulls only new/changed rows. |
| **Rollup** | Pre-aggregating raw data into daily/weekly/monthly summaries. operator-datacore does this in the `ops.*` schema. |
| **Idempotent** | Running it twice produces the same result. Every connector in operator-datacore is idempotent. |
| **Reconstruction** | Deriving a metric from a different source than the one that owns it canonically. **Forbidden** in operator-datacore. |
| **Source-of-truth** | The single canonical place a piece of data lives. For Amazon revenue, that's `GET_SALES_AND_TRAFFIC_REPORT`. |
| **CM1 / CM2 / CM3** | Contribution margin layers. CM1 = revenue − COGS. CM2 = CM1 − fees. CM3 = CM2 − ad spend. |

## File / repo

| Term | Plain English |
|---|---|
| **`.env`** | A file containing your secrets. Never committed. operator-datacore expects you to fill it. |
| **`.env.example`** | A template showing every key with empty values. Committed. Copy to `.env` to start. |
| **CLAUDE.md** | A file Claude Code reads automatically when you open the repo. Sets context and behaviour rules. |
| **Slash command** | A reusable Claude Code prompt, defined in `.claude/commands/<name>.md`. Run as `/<name>`. |
