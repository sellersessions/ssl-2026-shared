# Architecture — why 5 schemas

operator-datacore stores everything in 5 dedicated Postgres schemas, never in `public`. Each schema has one job. Mixing them is how dashboards quietly lie for six weeks before someone notices.

---

## The 5 schemas

```
┌──────────────────────────────────────────────────────────────────────┐
│  external sources                                                     │
│  ┌────────────────────────┐                                           │
│  │ SP-API · TikTok · ...  │                                           │
│  └─────────┬──────────────┘                                           │
│            │                                                          │
│            ▼                                                          │
│  ┌─────────────────┐    fetch                                         │
│  │  raw            │    JSONB landing, audit trail                    │
│  └────────┬────────┘                                                  │
│           │ parse                                                     │
│           ▼                                                           │
│  ┌─────────────────┐    one row per source row, source-of-truth      │
│  │  brain          │    fidelity                                     │
│  └────────┬────────┘                                                  │
│           │ aggregate                                                 │
│           ▼                                                           │
│  ┌─────────────────┐    daily / weekly / monthly rollups,             │
│  │  ops            │    metric_date < CURRENT_DATE                    │
│  └────────┬────────┘                                                  │
│           │ enrich + currency-convert                                 │
│           ▼                                                           │
│  ┌─────────────────┐    BI views, opinionated, dashboard-ready        │
│  │  analytics      │                                                  │
│  └────────┬────────┘                                                  │
│           │ read                                                      │
│           ▼                                                           │
│  dashboards · Claude Code · scripts                                   │
│                                                                        │
│  ┌─────────────────┐                                                  │
│  │  meta           │  connection state, sync log, FX rates, config    │
│  └─────────────────┘  (perpendicular to the data flow)                │
└──────────────────────────────────────────────────────────────────────┘
```

| Schema | Purpose | Granularity | Read by |
|---|---|---|---|
| `raw` | Every API response, JSONB. Audit trail. Re-parsable. | One row per API page/document | parsers |
| `brain` | Canonical mirror of source-of-truth reports. | One row per source row | `ops` rollup functions |
| `ops` | Daily / weekly / monthly rollups. Always excludes `CURRENT_DATE`. | Per `(date, dimension)` | `analytics` views |
| `analytics` | BI views with FX conversion, cross-marketplace. | View-level | dashboards, Claude Code, you |
| `meta` | Wiring diagram: connections, sync state, errors, FX rates, config. | Operational | connectors, smoke test |

---

## Why not just put everything in `public`?

Because `public` is where everything else lives too. Supabase Auth puts triggers there. Edge Functions sometimes write there. PostgREST exposes it by default. Dashboards plug into it without thinking.

Three concrete failure modes we've seen:

1. **Silent collisions.** `CREATE TABLE IF NOT EXISTS` no-ops if a name already exists with different columns. Downstream inserts fail against the old shape. Hard to diagnose.
2. **Accidental exposure.** `service_role` queries everything in `public` by default. Auth-related views you didn't realise existed get scraped.
3. **Mental overload.** When `orders` could be Amazon orders, Shopify orders, or that prototype someone built three months ago, every query starts with "wait, which orders?". Naming things well costs nothing.

Five schemas, one job each. No collisions, no confusion.

---

## Why `raw` exists

Two reasons:

1. **Re-parse without re-fetch.** If we find a bug in the parser (or want to extract a new field), we re-run parse against the existing `raw.*` rows. We don't re-pay the SP-API rate-limit cost.
2. **Audit trail.** When a number disagrees with Seller Central, the first question is "did the API return what I think it did?". `raw.sp_api_report.payload` answers it definitively.

Trade-off: storage. A 24-month backfill of Sales & Traffic is roughly 200-500 MB of JSON for an active brand. Cheap. Supabase's free tier (500 MB) is enough for most v1 setups. Pro tier is $25/mo and has 8 GB.

---

## Why `brain` is one-to-one with the source

Every column in `brain.*` is something Amazon's report actually contains. We don't invent derived columns here. If you want "revenue net of refunds", it goes in `ops` or `analytics`, not `brain`.

This is the rule that prevents the 30-40% under-counting incident. `brain.sales_traffic_daily.ordered_product_sales` is **literally** what Amazon stored in the report. Nothing else.

If Amazon adds a new column to the report in 2027, we add it to `brain.sales_traffic_daily`. We don't try to compute it.

---

## Why `ops` excludes `CURRENT_DATE`

Same-day partial rollups freeze incomplete totals.

The rollup runs at 14:30 UTC. If anything prevents it from re-running before midnight (cron hang, deploy freeze, Supabase restart), the partial value sticks as the historical total for that day. **Forever**, until someone notices and triggers a manual refresh.

The fix is structural: every rollup function filters `metric_date < CURRENT_DATE`. There is no "today" row in `ops.*`. If you want a "today so far" surface, build a separate intraday view directly off `brain.sales_traffic_daily`.

This rule cost a previous client (Dr Bo) 6 days of frozen partial data before someone spotted it. Bake the guard in. Never trust the cron not to fail.

---

## Why `analytics` is the only schema dashboards should read

Three reasons:

1. **Currency conversion.** `brain.*` is per-marketplace native. Dashboards want one reporting currency. `analytics.*` does the conversion via `meta.fx_rates`, returning NULL when no rate is available (never inventing a zero).
2. **Cross-marketplace consolidation.** You sell on US + UK + DE. A dashboard wants one revenue number. `analytics.amazon_daily` joins across `meta.marketplace`, converts, sums.
3. **Stable contract.** When you change a `brain.*` column shape (rare, but happens), every downstream dashboard breaks. If you change an `analytics.*` view, you change one place. Dashboards plug into views, not tables.

The `analytics.*` views are the **only** schema we recommend exposing via PostgREST. Dashboards, Claude Code, your custom Next.js apps — all read from here.

---

## Schema exposure (Supabase / PostgREST)

By default, Supabase only exposes `public` to the auto-generated REST API. To use `analytics.*` from outside Postgres:

1. Open Supabase dashboard → **Project Settings** → **API**.
2. In **Exposed schemas**, add `analytics` (and `meta` if you want to query connection / sync state).
3. Save. PostgREST regenerates the API.

**Do not expose `raw` or `brain`.** They are internal. They have no row-level security configured. Exposing them lets `anon` queries hit your full data lake. Even `ops` is best left private; expose only `analytics`.

---

## When to add a 6th schema

If you start storing PII (buyer names, full shipping addresses, tax IDs), put it in a dedicated `pii.*` schema with row-level security and a TTL job that purges rows older than 30-90 days. Never co-mingle with `brain`. operator-datacore v1 deliberately avoids PII.

If you start serving multiple sellers from one database (multi-tenant SaaS), put per-tenant data in `tenant_<id>.*` schemas, never as a `tenant_id` column on shared tables. Cleaner isolation, simpler RLS.

For most operators running their own private data lake on their own Supabase project, 5 schemas is enough. Don't add more without a reason you can articulate in one sentence.
