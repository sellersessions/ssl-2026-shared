# Connect Shopify (homework)

Shopify schemas are scaffolded in v1 ([`brain.shopify_*`](../../supabase/migrations/0005_brain_shopify.sql)) but the connector is inert. This runbook activates it.

---

## Prerequisites

- A Shopify store on Basic plan or higher (Custom apps are not available on Starter).
- Admin access to your store.

---

## What you'll end up with

Two values in `.env`:

```
SHOPIFY_STORE_DOMAIN=yourstore.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxx
SHOPIFY_API_VERSION=2025-04
```

---

## Step 1 — Create a custom app

1. Shopify admin → **Settings** → **Apps and sales channels**.
2. **Develop apps** (top-right link).
3. **Allow custom app development** if not already enabled.
4. **Create an app** → name it `operator-datacore`.
5. **Configure Admin API scopes.** At minimum:
   - `read_orders` (last 60 days only by default; for full history request `read_all_orders`)
   - `read_products`
   - `read_inventory`
   - `read_locations`
   - `read_customers` (only if you need customer-level analysis; PII risk)
   - `read_fulfillments`
   - `read_reports`
6. **Save** and **Install app**. Shopify shows your **Admin API access token** ONCE. Copy it now.

For `read_all_orders` access on stores older than 60 days of history, you may need to apply via Shopify's Partner Dashboard with a justification.

## Step 2 — Build the connector

The schemas in place:

| Table | What lands here |
|---|---|
| `brain.shopify_orders` | Order header |
| `brain.shopify_line_items` | One row per line item |
| `brain.shopify_products` | Product catalog |
| `brain.shopify_variants` | Variant + SKU mapping |
| `brain.shopify_inventory_levels` | Per location × variant snapshot |

Connector lives at `src/lib/shopify/`.

**Pull strategy:**

- **Orders.** Use the GraphQL Admin API for delta sync (REST has a 250-result-per-page cap; GraphQL handles 250-1000 cleanly). Filter by `updated_at >= last_run_at` to get changes.
- **Products + variants.** Bulk export endpoint for the initial backfill, then webhook-driven for changes (more efficient than polling).
- **Inventory.** GraphQL `inventoryLevels` query at locations. Snapshot every hour.

**Webhooks (recommended over polling):** Shopify can fire events at a URL when orders, products, or inventory change. Set them up via the Admin API → Webhooks → topics `orders/create`, `orders/updated`, `inventory_levels/update`. Point them at a Supabase Edge Function. Real-time without polling.

## Step 3 — Schedule

For pull-based sync (simpler than webhooks):

```sql
SELECT cron.schedule(
  'operator-datacore-shopify-orders',
  '*/30 * * * *',  -- every 30 min
  $$SELECT net.http_post(
    url := '<your-edge-function-url>/sync-shopify-orders',
    headers := jsonb_build_object('Authorization', 'Bearer <service-role>')
  );$$
);
```

## Step 4 — Verify

Shopify admin → **Orders** → set a date range → compare to:

```sql
SELECT COUNT(*) AS orders, SUM(total_price) AS revenue
FROM brain.shopify_orders
WHERE created_at::date BETWEEN '2026-04-01' AND '2026-04-07'
  AND financial_status NOT IN ('refunded', 'voided');
```

Common discrepancies:
- Cancelled / refunded orders included or excluded? Match Shopify's own filter.
- Shop currency vs. presentment currency. operator-datacore stores both. Use `currency_code` for shop totals.
- Test orders. Filter `WHERE NOT 'test' = ANY(tags)` if you've tagged them.
