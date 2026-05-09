# operator-datacore

**Your Amazon (and TikTok, and Shopify, and Google Drive) data, all in one Supabase database.**

After a 30-minute setup, every order, fee, payout, inventory snapshot and traffic stat from your Seller Central account lives in your own private database, refreshed automatically every day. Claude Code can query it. Your dashboards can plug into it. Nothing leaves your laptop or your Supabase project.

This is the **data layer**. Pair it with [`amazon-operator-stack`](https://github.com/sellersessions/amazon-operator-stack) (the agent layer) and you have a complete operator stack on your own laptop.

---

## Who this is for

Built for **Seller Sessions Live 2026** delegates.

You should be:

- An Amazon seller with at least one **Pro Seller** account
- The **account holder**, not a staff user
- Comfortable copying and pasting into a terminal
- Willing to spend 30 minutes setting up a free Supabase project

You don't need to know what a schema, a migration, or a foreign key is. The setup walks you through every term in plain language, and Claude Code holds your hand inside VS Code from start to finish.

---

## What you get

| Asset | Purpose |
|---|---|
| **5-schema Supabase database** | `raw`, `brain`, `ops`, `analytics`, `meta`. Raw imports kept separate from clean numbers, separate from rollups, separate from BI views, separate from connection state. Nothing in `public`. |
| **Daily Amazon Sales & Traffic sync** | The official Brand Analytics report, pulled on a 14:00 UTC schedule, mirrored to `brain.sales_traffic_daily`. This is the canonical revenue source — same numbers as Seller Central, full stop. |
| **Scaffolded TikTok Shop and Shopify** | Schemas exist, connector contracts are documented, connectors are inert until you activate them. See [HOMEWORK.md](./HOMEWORK.md). |
| **Scaffolded Google Workspace sync** | OAuth flow ready, full Drive sync is in [HOMEWORK.md](./HOMEWORK.md). |
| **Verification query pack** | Compare your `brain.*` numbers to Seller Central. Aim for £0.00 / $0.00 gap. |
| **Claude Code handholding** | A `/operator-setup` slash command walks you through every step, in your IDE, in plain English. |

---

## What it deliberately does NOT do

- **Reconstruct revenue from Orders + custom maths.** That under-counts by 30-40% and we have the scars to prove it. Every metric in `operator-datacore` reads from the SP-API report that owns it canonically. See [docs/canonical-reports.md](./docs/canonical-reports.md).
- **Show you "today" on rollups.** Same-day partial data is misleading. Rollups always run for completed days only. If you want a "today so far" surface, it's a separate intraday view.
- **Mock or seed any data.** Day one of your dashboard shows your real Seller Central numbers, or nothing. Demo data lies; we don't ship it.
- **Phone home.** Nothing leaves your laptop or your Supabase project. There is no "operator-datacore cloud". You are the only operator.

---

## Quick start

If you have **Node 20+**, **git**, and **Claude Code** installed, this takes about 30 minutes.

```bash
# 1. Clone
git clone https://github.com/sellersessions/operator-datacore.git
cd operator-datacore

# 2. Install
npm install

# 3. Open in VS Code (Claude Code takes over from here)
code .
```

Once VS Code is open, type the slash command in Claude Code:

```
/operator-setup
```

Claude Code reads [CLAUDE.md](./CLAUDE.md), pulls in your goal, and walks you through:

1. Creating a free Supabase project
2. Pasting your Supabase keys into `.env`
3. Pasting your Amazon SP-API credentials into `.env` (you set these up before the workshop)
4. Running migrations to create the 5 schemas
5. Triggering the first 24-month backfill of Sales & Traffic
6. Running the verification query against Seller Central

If you'd rather follow written steps, [SETUP.md](./SETUP.md) is the same flow without the agent.

---

## What's pulled, where it lives

Every metric reads from the SP-API report that owns it canonically. No reconstruction.

| Metric | Canonical SP-API report | Where it lands | Refresh cadence |
|---|---|---|---|
| Daily revenue, units, sessions, page views, buy-box, conversion rate | `GET_SALES_AND_TRAFFIC_REPORT` (Brand Analytics) | `brain.sales_traffic_daily` | Daily, 14:00 UTC |
| Order-level detail (order ID, ASIN, qty, ship-to) | `GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL` | `brain.orders` (homework) | Hourly |
| Fees, refunds, adjustments, every cash event | Finances API → `getFinancialEvents` | `brain.financial_events` (homework) | Hourly |
| Payouts to your bank | Finances API → `getFinancialEventGroups` | `brain.payouts` (homework) | Daily |
| FBA inventory levels, reserved, inbound | `GET_FBA_INVENTORY_PLANNING_DATA` + `GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA` | `brain.fba_inventory` (homework) | Hourly |

In v1, only the first row is **active**. Every other row is **scaffolded** — schema, type, runbook all exist, you just flip the switch when you're ready. See [HOMEWORK.md](./HOMEWORK.md).

---

## How fresh is the data

| Surface | Lag from "now" |
|---|---|
| Sales & Traffic Report | 24-48 hours (this is Amazon's lag, not ours) |
| Orders Report | ~15 minutes |
| Finances API | ~1 hour |
| FBA Inventory | ~30 minutes |
| Sponsored Products spend | 12-24 hours |

`operator-datacore` never invents data to plug a lag. If yesterday hasn't landed yet, your dashboard shows "yesterday: pending". That's correct.

---

## The five schemas

| Schema | Purpose | When you'd touch it |
|---|---|---|
| `raw` | Landing zone. Every API response lands here as JSONB before parsing. Audit trail. | Almost never. Useful when debugging. |
| `brain` | The canonical mirror of every source-of-truth report. One row per source row. Source-of-truth fidelity. | Almost never. This IS your data. |
| `ops` | Daily / weekly / monthly rollups. Computed from `brain.*` on schedule. Never includes `CURRENT_DATE`. | When building dashboards. |
| `analytics` | BI views. Cross-marketplace, currency-converted, opinionated. | When connecting to Metabase / Looker / your own dashboard. |
| `meta` | Connection profiles, sync state, error log, FX rates, attendee config. | When troubleshooting a sync. |

Why five? Because mixing raw imports with clean numbers with rollups in one schema is how dashboards quietly lie for six weeks before someone notices. We learned this the hard way. See [docs/architecture.md](./docs/architecture.md) for the full rationale.

---

## Pair with the agent layer

operator-datacore is the **data layer**. Pair it with [`amazon-operator-stack`](https://github.com/ShubhashSharma/amazon-operator-stack) (the **agent layer**) and Claude Code can:

- Query your historical data instantly (from this lake)
- Call SP-API live for current state (via amazon-operator-stack)
- Cross-reference both in a single answer

Setup: 5 minutes. See [docs/pair-with-amazon-operator-stack.md](./docs/pair-with-amazon-operator-stack.md).

---

## Help

- `/operator-setup` in Claude Code — the friendliest path
- [SETUP.md](./SETUP.md) — written step-by-step
- [GLOSSARY.md](./GLOSSARY.md) — every technical term explained in one line
- [HOMEWORK.md](./HOMEWORK.md) — TikTok, Shopify, Google Drive, PPC, COGS, automation
- [docs/canonical-reports.md](./docs/canonical-reports.md) — which SP-API report owns which metric
- [docs/architecture.md](./docs/architecture.md) — why 5 schemas
- [docs/useful-queries.md](./docs/useful-queries.md) — SQL cookbook (paste-and-run)
- [docs/pair-with-amazon-operator-stack.md](./docs/pair-with-amazon-operator-stack.md) — pairing with the agent layer
- [docs/runbooks/](./docs/runbooks/) — one runbook per integration
- [CHANGELOG.md](./CHANGELOG.md) — release history

---

## Built by

[not a square](https://notasquare.io). Operator stack for Amazon-first sellers. Originally built for Seller Sessions Live 2026.
