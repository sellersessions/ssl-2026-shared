# supabase/seed/

operator-datacore deliberately ships **no demo or seed data**. The whole point of the project is real-numbers-only — demo data lies, and dashboards built on demo data make people trust the wrong things.

When connectors are active, Day 1 of your dashboard shows your real Seller Central numbers, or it shows nothing.

The only seeded data lives inside the migrations themselves:

- `meta.marketplace` — Amazon marketplace IDs, regions, currencies, accounting timezones
- `meta.report_catalog` — the canonical metric-to-report ownership map
- `meta.fx_rates` — USD=USD over 36 months as a safety floor for analytics views

That's it.
