#!/usr/bin/env tsx
// ============================================================================
// verify.ts
// Prints a side-by-side of brain.sales_traffic_daily vs. what you'd expect
// to see in Seller Central. Aim for £0.00 / $0.00 gap.
//
// Usage:
//   npm run verify                          # last 30 completed days
//   npm run verify -- --days 90
//   npm run verify -- --from 2024-01-01 --to 2024-01-31
// ============================================================================

import { parseArgs } from 'node:util';
import { loadEnv, getMarketplaceIds } from '../lib/env.js';
import { getPgClient } from '../lib/supabase.js';

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      days: { type: 'string', default: '30' },
      from: { type: 'string' },
      to: { type: 'string' },
    },
  });

  const env = loadEnv();
  const marketplaceIds = getMarketplaceIds(env);
  const pg = await getPgClient();

  let from: string;
  let to: string;
  if (values.from && values.to) {
    from = values.from;
    to = values.to;
  } else {
    const days = parseInt(values.days!, 10);
    const today = new Date();
    const fromDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - days));
    const toDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
    from = fromDate.toISOString().slice(0, 10);
    to = toDate.toISOString().slice(0, 10);
  }

  console.log('operator-datacore — verification');
  console.log('---------------------------------\n');
  console.log(`Window: ${from} → ${to} (excludes today)\n`);

  try {
    // 1. Per-marketplace totals
    console.log('REVENUE & TRAFFIC PER MARKETPLACE');
    console.log('  Compare against: Seller Central → Reports → Business Reports → Sales and Traffic by Date\n');

    const { rows: mp } = await pg.query<{
      marketplace_id: string;
      currency_code: string;
      revenue: string;
      units: string;
      sessions: string;
      page_views: string;
      days_covered: string;
    }>(
      `SELECT
         marketplace_id,
         currency_code,
         SUM(ordered_product_sales)::text  AS revenue,
         SUM(units_ordered)::text          AS units,
         SUM(sessions)::text               AS sessions,
         SUM(page_views)::text             AS page_views,
         COUNT(DISTINCT metric_date)::text AS days_covered
       FROM brain.sales_traffic_daily
       WHERE metric_date BETWEEN $1::date AND $2::date
         AND marketplace_id = ANY($3)
       GROUP BY marketplace_id, currency_code
       ORDER BY marketplace_id`,
      [from, to, marketplaceIds],
    );

    if (mp.length === 0) {
      console.log('  ⚠  No data in window. Run  npm run backfill  first.\n');
    } else {
      const header = ['Marketplace', 'Currency', 'Revenue', 'Units', 'Sessions', 'Page views', 'Days'];
      console.log('  ' + header.map((h, i) => h.padEnd([15, 9, 16, 12, 12, 14, 6][i]!)).join(''));
      console.log('  ' + '-'.repeat(84));
      for (const r of mp) {
        const cells = [
          r.marketplace_id.padEnd(15),
          r.currency_code.padEnd(9),
          fmtMoney(r.revenue).padEnd(16),
          fmtInt(r.units).padEnd(12),
          fmtInt(r.sessions).padEnd(12),
          fmtInt(r.page_views).padEnd(14),
          r.days_covered.padEnd(6),
        ];
        console.log('  ' + cells.join(''));
      }
      console.log('');
    }

    // 2. Daily breakdown (last 14 days for quick visual check)
    console.log('DAILY (last 14 days, summed across marketplaces)\n');
    const { rows: dly } = await pg.query<{
      metric_date: string;
      revenue: string;
      units: string;
      sessions: string;
    }>(
      `SELECT
         metric_date::text AS metric_date,
         SUM(ordered_product_sales)::text AS revenue,
         SUM(units_ordered)::text         AS units,
         SUM(sessions)::text              AS sessions
       FROM brain.sales_traffic_daily
       WHERE metric_date BETWEEN GREATEST($1::date, ($2::date - INTERVAL '13 days')::date) AND $2::date
         AND marketplace_id = ANY($3)
       GROUP BY metric_date
       ORDER BY metric_date DESC`,
      [from, to, marketplaceIds],
    );
    console.log('  ' + 'Date'.padEnd(13) + 'Revenue'.padEnd(16) + 'Units'.padEnd(10) + 'Sessions');
    console.log('  ' + '-'.repeat(50));
    for (const r of dly) {
      console.log('  ' + r.metric_date.padEnd(13) + fmtMoney(r.revenue).padEnd(16) + fmtInt(r.units).padEnd(10) + fmtInt(r.sessions));
    }
    console.log('');

    // 3. Top 10 ASINs
    console.log('TOP 10 CHILD ASINs BY REVENUE (window)\n');
    const { rows: top } = await pg.query<{
      child_asin: string;
      sku: string | null;
      revenue: string;
      units: string;
      sessions: string;
      conversion: string | null;
    }>(
      `SELECT
         child_asin,
         MAX(sku) AS sku,
         SUM(ordered_product_sales)::text AS revenue,
         SUM(units_ordered)::text         AS units,
         SUM(sessions)::text              AS sessions,
         CASE WHEN SUM(sessions) > 0
              THEN (SUM(units_ordered)::numeric / SUM(sessions))::text
              ELSE NULL END               AS conversion
       FROM brain.sales_traffic_daily
       WHERE metric_date BETWEEN $1::date AND $2::date
         AND marketplace_id = ANY($3)
       GROUP BY child_asin
       ORDER BY SUM(ordered_product_sales) DESC NULLS LAST
       LIMIT 10`,
      [from, to, marketplaceIds],
    );
    console.log('  ' + 'ASIN'.padEnd(13) + 'SKU'.padEnd(20) + 'Revenue'.padEnd(16) + 'Units'.padEnd(10) + 'Sessions'.padEnd(11) + 'Conv');
    console.log('  ' + '-'.repeat(75));
    for (const r of top) {
      console.log(
        '  ' +
          r.child_asin.padEnd(13) +
          (r.sku ?? '-').padEnd(20) +
          fmtMoney(r.revenue).padEnd(16) +
          fmtInt(r.units).padEnd(10) +
          fmtInt(r.sessions).padEnd(11) +
          (r.conversion ? (Number(r.conversion) * 100).toFixed(1) + '%' : '-'),
      );
    }

    console.log('');
    console.log('NEXT STEPS');
    console.log('  1. Open Seller Central → Reports → Business Reports → Sales and Traffic by Date.');
    console.log(`  2. Set the date range to ${from} → ${to}.`);
    console.log('  3. Compare the per-marketplace revenue total above to Seller Central.');
    console.log('  4. Aim for a $0.00 / £0.00 gap. Anything above $1 is worth investigating.');
    console.log('  5. If numbers differ, check ROLLUP_TIMEZONE in .env (default America/Los_Angeles).');
  } finally {
    await pg.end();
  }
}

function fmtMoney(s: string): string {
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtInt(s: string): string {
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  return n.toLocaleString('en-US');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
