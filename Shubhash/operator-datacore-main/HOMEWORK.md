# HOMEWORK.md — what to do after the workshop

operator-datacore v1 ships with one active connector (Amazon Sales & Traffic) and **scaffolding** for everything else. The schemas exist, the runbooks are written, the connector contracts are documented. You just need to switch them on.

Pick whichever matches your priorities. Each one is independent.

---

## 1. Add more Amazon connectors

The most common next step. You already have SP-API auth set up.

| Connector | Why activate it | Effort | Runbook |
|---|---|---|---|
| **Orders Report** | Order-level detail (date, qty, status, ship-to). | 1 hour | [docs/runbooks/connect-amazon-orders.md](./docs/runbooks/connect-amazon-orders.md) |
| **Financial Events** | Every fee, refund, adjustment. The cash-flow truth. | 2 hours | [docs/runbooks/connect-amazon-finances.md](./docs/runbooks/connect-amazon-finances.md) |
| **Settlement Report** | Bank deposits, settlement-by-settlement. | 1 hour | [docs/runbooks/connect-amazon-settlement.md](./docs/runbooks/connect-amazon-settlement.md) |
| **FBA Inventory** | Fulfillable, reserved, inbound, working. | 1 hour | [docs/runbooks/connect-amazon-inventory.md](./docs/runbooks/connect-amazon-inventory.md) |
| **Search Query Performance** | Brand Analytics. Which search terms drove which sales. | 2 hours | [docs/runbooks/connect-amazon-bsqp.md](./docs/runbooks/connect-amazon-bsqp.md) |

Each runbook follows the same pattern: define the report, write the connector module under `src/lib/sp-api/`, add a CLI entry, schedule a `pg_cron` job. The Sales & Traffic connector at [src/lib/sp-api/sales-traffic.ts](./src/lib/sp-api/sales-traffic.ts) is your template.

---

## 2. Add Amazon Ads (PPC)

PPC is on the **Amazon Ads API v3**, not SP-API. Separate OAuth, separate refresh tokens, separate base URL.

- Endpoint: `advertising-api.amazon.com`
- Reports: `spAdvertisedProduct` (Sponsored Products), `sbPurchasedProduct` (Sponsored Brands), `sdAdvertisedProduct` (Sponsored Display)
- Granularity: daily, by campaign / ad group / target / keyword / ASIN
- Backfill ceiling: **95 days from request date.** Anything older has to come from your own historical exports.
- Lands in: `brain.ads_sp_daily`, `brain.ads_sb_daily`, `brain.ads_sd_daily`

Runbook: [docs/runbooks/connect-amazon-ads.md](./docs/runbooks/connect-amazon-ads.md).

Once active, you can compute true CM3 (contribution margin after ad spend) by joining ads to S&T at the (date, asin) grain.

---

## 3. Add TikTok Shop

Inert in v1. Schemas at `brain.tiktok_*` already exist.

- Source: TikTok Shop Open API. Auth: app key + app secret + shop cipher + access token.
- Watch the gotchas baked into [supabase/migrations/0004_brain_tiktok.sql](./supabase/migrations/0004_brain_tiktok.sql) (line item per unit, 7-day chunking, SKU alias tolerance).
- Runbook: [docs/runbooks/connect-tiktok.md](./docs/runbooks/connect-tiktok.md).

---

## 4. Add Shopify

Inert in v1. Schemas at `brain.shopify_*` already exist.

- Source: Shopify Admin API (REST + GraphQL). Auth: Admin API access token from a custom app.
- Runbook: [docs/runbooks/connect-shopify.md](./docs/runbooks/connect-shopify.md).

---

## 5. Add Google Workspace (Drive + Sheets + Docs)

Inert in v1. Schemas at `brain.gdrive_*` already exist.

- Source: Google Drive API + Docs / Sheets / Slides APIs. Auth: workspace OAuth, refresh-token flow.
- Strategy: watch the change feed (`changes.list` with a persistent `pageToken`), upsert metadata, lazily extract text on demand.
- Runbook: [docs/runbooks/connect-google-drive.md](./docs/runbooks/connect-google-drive.md).

Why this matters: every operator's brain spans the marketplace data AND the planning artefacts (cash flow sheets, supplier docs, SOPs, meeting notes) that live in Google Drive. Bringing them into the same database means Claude Code (or any AI agent) can answer questions across both: *"what's our YoY revenue trend, and where did we last document the supplier negotiation that closed in Feb?"*

---

## 6. Upload COGS

Your cost-of-goods-sold doesn't live in any API. It lives in a Google Sheet.

- Pattern: a single Google Sheet, one tab per SKU per (effective_from, effective_to) period, columns for unit cost / freight / duty / packaging.
- Sync: scheduled job reads the sheet, upserts into a `brain.cogs` table.
- Used by: `analytics.amazon_unit_economics` view (created when you activate this connector).

Runbook: [docs/runbooks/upload-cogs.md](./docs/runbooks/upload-cogs.md).

Once COGS is in, your dashboards can show **contribution margin**, not just revenue. CM1 = revenue − COGS. CM2 = CM1 − fees. CM3 = CM2 − ad spend. The honest truth of profitability per SKU.

---

## 7. Build a dashboard

The `analytics.*` views are designed to be read directly by:

| Tool | What you'd plug in |
|---|---|
| **Metabase** (free, open-source) | `SUPABASE_URL` as a Postgres connection. Read from `analytics.*`. |
| **Looker Studio** (free, Google) | Use the Postgres connector. Read from `analytics.*`. |
| **Hex** (paid, notebook-style) | Same. |
| **Custom Next.js dashboard** | Use `@supabase/supabase-js` with the anon key. RLS protects you. |

Runbook: [docs/runbooks/build-dashboard.md](./docs/runbooks/build-dashboard.md) (lightweight starter).

---

## 8. Pair with the AI agent layer

[`amazon-operator-stack`](https://github.com/sellersessions/amazon-operator-stack) is the MCP server that lets Claude Code query SP-API live. Pair it with operator-datacore by pointing it at your Supabase database, and Claude can:

- Query historical data fast (from your local lake)
- Pull live data when historical isn't fresh enough
- Write back annotations to your database (via dedicated write tools)

When the two are paired, you have a complete operator stack: data layer + agent layer, both running on your laptop.

---

## 9. Automate the daily sync

`pg_cron` (which ships in migration 0009) only refreshes rollups — it does not pull fresh data from SP-API. Two ways to keep daily data flowing:

| Path | Effort | Effort to maintain |
|---|---|---|
| **Manual** — run `npm run incremental` once a day | 0 min setup, 30 sec daily | Human-in-the-loop |
| **GitHub Actions** — `.github/workflows/daily-sync.yml` runs daily at 15:00 UTC | 5 min setup (add 8 secrets) | Zero-touch |
| **Supabase Edge Function** (advanced) — deploy a function, schedule it via pg_cron + pg_net | 30 min setup | Zero-touch, all in your Supabase project |

For the GitHub Actions path, fork the repo to your account, then in your repo's **Settings → Secrets and variables → Actions** add:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`
- `SP_API_LWA_CLIENT_ID`, `SP_API_LWA_CLIENT_SECRET`, `SP_API_REFRESH_TOKEN`
- `SP_API_REGION`, `SP_API_MARKETPLACE_IDS`

The workflow is already in `.github/workflows/daily-sync.yml`. It fires automatically once secrets are configured.

---

## A note on order

There's no "correct" order. Pick whichever solves the loudest pain in your business this week:

- **Cash flow visibility hurting?** Activate Financial Events + Settlement.
- **Inventory always tight?** Activate FBA Inventory + Reserved.
- **Want true profitability per SKU?** Activate Financial Events + Ads + COGS.
- **Selling on TikTok too?** Activate TikTok Shop, then build a cross-marketplace view.
- **Drowning in Google Sheets?** Activate Drive sync, then point Claude Code at it.

Each runbook is self-contained. You can do them in any order.
