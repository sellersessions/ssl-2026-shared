# Changelog

All notable changes to operator-datacore are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] — 2026-05-09

### Initial release
First public release, shipped at Seller Sessions Live 2026.

### Added
- Five-schema Supabase database (`raw`, `brain`, `ops`, `analytics`, `meta`)
- Nine ordered SQL migrations
- `meta.report_catalog` — the canonical metric-to-report ownership map
- `meta.marketplace` — pre-seeded with 20 Amazon marketplaces
- `meta.fx_rates` — seeded with USD=USD over 36 months for rate-NULL safety
- Active connector: Sales & Traffic Report (`GET_SALES_AND_TRAFFIC_REPORT`)
- Scaffolded schemas for: Amazon Orders, Financial Events, Settlement, FBA Inventory, Reserved Inventory, Inventory Ledger, Returns, Catalog Items, Listings, Search Query Performance, Subscribe & Save, Sponsored Products / Brands / Display
- Scaffolded schemas for: TikTok Shop (orders, line items, products, ads), Shopify (orders, line items, products, variants, inventory levels), Google Drive (files, change log)
- CLI: `setup`, `migrate`, `smoke`, `backfill`, `verify`, `exchange-code`, `check:migrations`
- Claude Code `/operator-setup` slash command for in-IDE handholding
- Documentation: README, SETUP, HOMEWORK, GLOSSARY, architecture, canonical-reports, useful-queries, pair-with-amazon-operator-stack
- Runbooks: connect-amazon, connect-tiktok, connect-shopify, connect-google-drive, verify-against-seller-central
- Install scripts: `install.sh` (macOS/Linux), `install.ps1` (Windows)
- GitHub Actions: `daily-sync.yml`, `typecheck.yml`

### Hard rules baked into the codebase
- **No `public` schema.** Every table lives in a dedicated namespace.
- **`metric_date < CURRENT_DATE`** in every rollup function — same-day partial freezes are impossible.
- **Fee signs flipped at parse time.** `brain.financial_events.amount` is always positive; `direction` encodes credit/debit.
- **No reconstruction.** `meta.report_catalog` enforces the canonical-source rule in-database.
- **Per-marketplace native currency** at row level; FX conversion only in `analytics.*`.
- **NULL FX over invented zero.** `analytics.fx_lookup` returns NULL when no rate is known.
- **Idempotent everything.** All upserts use `ON CONFLICT DO UPDATE`.
- **Re-parsable raw.** `raw.sp_api_report.payload` keeps full JSONB; `parsed_at` flag.

### Known gaps (homework, see [HOMEWORK.md](./HOMEWORK.md))
- TikTok Shop, Shopify, Google Drive connectors (schemas + runbooks ship; activation is per-seller homework)
- Amazon Ads API v3 connector (separate OAuth)
- COGS upload pattern + `analytics.amazon_unit_economics` view
- Live FX rate sync
- PII handling (deliberately excluded from v1)
