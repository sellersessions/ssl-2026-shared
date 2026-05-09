# Verify your data against Seller Central

The whole point of operator-datacore is that **your numbers match Seller Central exactly**. Not "approximately". Not "within 5%". Exactly. If they don't, something is wrong, and you should find out before building dashboards on top.

This runbook walks you through that verification.

---

## The 30-second version

```bash
npm run verify
```

Open Seller Central → **Reports** → **Business Reports** → **Sales and Traffic by Date**. Set the same date range as the verify output. Compare the per-marketplace revenue total.

**Aim for $0.00 / £0.00 gap.**

If they match, you're done.

---

## When they don't match

90% of the time it's one of these. Work through them in order.

### 1. Timezone mismatch

Most common. Amazon's accounting timezone for the US is **America/Los_Angeles** (Pacific Time). For UK it's Europe/London. For Germany, Berlin.

Check your `.env`:

```
ROLLUP_TIMEZONE=America/Los_Angeles
```

If you're a UK seller and your `.env` says LA, you'll be off by ~8 hours on the day boundary, which makes the daily numbers shift between days but the weekly total still match.

To check: compare a **weekly** total in Seller Central (Sun-Sat) to your `brain.sales_traffic_daily` summed over the same Sun-Sat. If the week matches but the days don't, it's timezone.

Fix: set `ROLLUP_TIMEZONE` to the marketplace's accounting TZ. The S&T report itself is delivered in that TZ — only your rollup display needs adjusting.

### 2. Brand Analytics enrolment incomplete

Some new ASINs (less than ~14 days old) or recently-added marketplaces may not be in S&T yet. They show in Seller Central via a different code path.

To check: query `brain.sales_traffic_daily` for a specific ASIN and date you know had sales. If it's missing, the issue is enrolment, not the connector.

Fix: wait. Brand Analytics catches up within a few days. If it's been more than 2 weeks, contact Seller Support.

### 3. A marketplace in `.env` you don't actually sell on

If your `SP_API_MARKETPLACE_IDS` includes a country you don't have listings in, the connector will dutifully request reports for it (returning empty) and your verification will be confused by a "marketplace with $0 revenue".

To check: `npm run smoke` lists your `marketplaceParticipations`. If a marketplace in your `.env` isn't in that list, remove it.

### 4. Date range off by one

Seller Central uses inclusive date ranges. operator-datacore's `verify` excludes today. If you set a date range "last 7 days" in Seller Central, that's 7 days including yesterday. operator-datacore's "last 7 days" verify is also through yesterday, but make sure you're comparing apples to apples.

To check: pick a specific past date range (e.g. 1 April 2026 to 7 April 2026) and use it in both places.

### 5. Gross vs. net revenue

`brain.sales_traffic_daily.ordered_product_sales` is **gross** (orders placed in the window, before refunds).

Seller Central's "Sales" can be displayed two ways:
- **Sales** in Business Reports → Sales and Traffic by Date = ordered product sales = gross. **This matches operator-datacore.**
- **Sales** on the home page widget = sometimes net (after refunds). Don't compare to this.

When in doubt, use the Business Reports page, not the home dashboard widget.

### 6. B2B vs. B2C split

S&T returns separate B2B and B2C numbers. operator-datacore stores both. Seller Central's default view is **combined**. Make sure your verify query sums both:

```sql
SELECT
  SUM(ordered_product_sales) + SUM(ordered_product_sales_b2b) AS total_revenue
FROM brain.sales_traffic_daily
WHERE metric_date BETWEEN '2026-04-01' AND '2026-04-07';
```

`npm run verify` only shows B2C by default. The total including B2B is what Seller Central shows as "Total".

### 7. Currency confusion

If you sell on multiple marketplaces, each row in `brain.sales_traffic_daily` is in **native currency** (USD for US, GBP for UK, EUR for DE/FR/IT/ES/NL, JPY for JP, etc.). You can't sum across marketplaces without converting.

`analytics.amazon_daily` does the conversion using `meta.fx_rates`. If you're verifying a single marketplace, native currency is fine. If you're verifying a cross-marketplace total, use `analytics.amazon_daily.revenue_reporting`.

In v1, `meta.fx_rates` is seeded with USD=USD only. Run the FX sync (homework) before trusting cross-marketplace totals.

---

## When the gap is over £100 / $100

Stop. Don't build dashboards. Don't trust the data. Find the cause before continuing.

In every previous case where we've had this kind of gap (Dr Bo, Craftikit, Brothers Turvey), the cause was one of:

- Reconstruction. operator-datacore's strict canonical-source rule prevents this.
- A connector pulling from the wrong report (e.g. Orders Report instead of S&T). Check `meta.report_catalog` to confirm you're reading the right canonical source.
- A migration that didn't apply. Check `meta.migration_history` count = 9.
- A backfill that crashed mid-window and was never resumed. Check `meta.sync_run` for `failed` or `partial` status.

---

## Continuous verification

Once you trust the numbers on day 1, you don't have to manually verify every day. But you should do this once a quarter:

1. Run `npm run verify` for last quarter.
2. Open Seller Central, set the same range.
3. Compare per-marketplace revenue.
4. If gap > $1, drill in.

It takes 5 minutes a quarter and saves you from the kind of slow, silent drift that destroys trust in dashboards.
