# Connect TikTok Shop (homework)

TikTok Shop schemas are scaffolded in v1 ([`brain.tiktok_*`](../../supabase/migrations/0004_brain_tiktok.sql)) but the connector is inert. This runbook activates it.

---

## Prerequisites

- A TikTok Shop seller account (US, UK, or another supported region).
- Access to **TikTok Shop Partner Center** (https://partner.tiktokshop.com).
- An app registered on TikTok Shop's developer platform with at least these scopes: `order`, `product`, `fulfillment`, `finance`.

---

## What you'll end up with

Four values in `.env`:

```
TIKTOK_APP_KEY=
TIKTOK_APP_SECRET=
TIKTOK_SHOP_CIPHER=
TIKTOK_ACCESS_TOKEN=
```

---

## Step 1 — Register an app

In Partner Center → Developer → Apps → Create. Choose **API/SDK**. Add the scopes listed above. Note your **App Key** and **App Secret**.

## Step 2 — Authorise your shop

Use the standard OAuth flow:

```
https://services.tiktokshop.com/open/authorize?app_key=YOUR_APP_KEY&state=anystring
```

Sign in as the shop owner. TikTok redirects back with a `code`. Exchange it via:

```bash
curl 'https://auth.tiktok-shops.com/api/v2/token/get?app_key=YOUR_APP_KEY&app_secret=YOUR_APP_SECRET&auth_code=THE_CODE&grant_type=authorized_code'
```

The response includes:
- `access_token` (lasts ~7 days, refreshable)
- `refresh_token`
- `shop_cipher` for each shop authorised

## Step 3 — Build the connector

The schemas already in place:

| Table | What lands here |
|---|---|
| `brain.tiktok_orders` | Order header (one row per order) |
| `brain.tiktok_order_line_items` | One row per UNIT (TikTok denormalises) |
| `brain.tiktok_products` | Product catalog with nested SKUs |
| `brain.tiktok_ads_daily` | Marketing API spend (separate OAuth) |

Your connector module should live at `src/lib/tiktok/`. Mirror the structure of `src/lib/sp-api/` — auth → client → orders / products / ads.

**Hard-earned gotchas (already commented in the schema migration):**

1. **Orders API silently truncates windows > ~30 days.** Chunk to 7-day windows. Always.
2. **Orders API returns one `line_item` per UNIT.** `SUM(quantity)` is meaningless; `COUNT(*)` per order is units sold.
3. **Products API returns price as nested `{currency, tax_exclusive_price}`.** Parse accordingly.
4. **SKU formats can differ between Orders and Products APIs.** A size SKU might be `-5-6` in Products and `-56` in Orders. Build alias tolerance into every SKU lookup.
5. **There is no per-order ad attribution natively.** Marketing API only goes down to `AUCTION_AD` level (campaign × day). For per-order attribution you need Pixel/CAPI on a separate storefront.

## Step 4 — Schedule the sync

Add to `0009_extensions_and_exposure.sql` (or a new migration):

```sql
SELECT cron.schedule(
  'operator-datacore-tiktok-orders',
  '15 * * * *',  -- hourly at :15
  $$SELECT net.http_post(
    url := '<your-edge-function-url>/sync-tiktok-orders',
    headers := jsonb_build_object('Authorization', 'Bearer <service-role>')
  );$$
);
```

## Step 5 — Verify

TikTok Seller Center → **Orders** → set a date range → compare to:

```sql
SELECT COUNT(*) AS orders, SUM(payment_total) AS revenue
FROM brain.tiktok_orders
WHERE create_time::date BETWEEN '2026-04-01' AND '2026-04-07';
```

Aim for $0.00 gap as with Amazon. If there's a difference, check timezone (TikTok uses GMT for many markets) and fulfillment state filtering.
