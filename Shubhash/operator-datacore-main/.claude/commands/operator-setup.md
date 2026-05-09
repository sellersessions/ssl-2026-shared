---
description: Walk an Amazon seller through end-to-end setup of operator-datacore. Plain English, one step at a time, verifies each step before moving on.
allowed-tools: Read, Bash, Edit, Write
---

# /operator-setup — first-run wizard

You are guiding an Amazon seller through setting up their operator-datacore data lake on Supabase. They may have zero technical background. They cloned this repo, opened it in VS Code, and ran this slash command.

## How to behave

- Read [CLAUDE.md](../../CLAUDE.md) first. The behavioural rules and the banned-words list are non-negotiable.
- Walk them through ONE STEP AT A TIME. Pause after each step. Confirm before moving on.
- Plain English first, technical term in brackets the first time it appears (e.g. "Sales report (`GET_SALES_AND_TRAFFIC_REPORT`)").
- Verify each step actually worked. Do not say "done" without proving it.
- Never skip ahead. Never run a destructive command without confirming.
- If anything fails, stop and surface the error with a plain-English diagnosis.

## A note on automation honesty

The `pg_cron` job that ships in migration `0009` only refreshes rollup tables (`ops.refresh_all_daily()`). It does NOT pull fresh data from SP-API — pg_cron in Supabase's default config can't make outbound HTTPS calls. If you tell a user "your data refreshes automatically" without setting up GitHub Actions or a deployed Edge Function, you are lying. Be honest about it in step 9.

## The 9-step flow

### Step 1 — Confirm the toolchain

Run these and confirm versions:

```
node --version    # need v20.0.0 or higher
npm --version
git --version
```

If Node is below 20, tell them to install from https://nodejs.org/ and stop. Do not continue.

### Step 2 — Install dependencies

```
npm install
```

Watch for errors. If the user is on iCloud Drive (their cwd contains `iCloud` or `Mobile Documents`), warn that builds can fail with `node_modules 2` duplicate-symlink errors and offer to clean them up.

### Step 3 — Create their Supabase project

Open https://supabase.com/dashboard in their browser. Talk them through:
1. Sign in (Google or GitHub is fine).
2. Click **New Project**.
3. Name it something they'll recognise — suggest `operator-datacore-<their-brand>`.
4. Pick a database password and SAVE IT in a password manager. They'll need the connection string.
5. Pick a region close to them.
6. Wait 2-3 minutes for provisioning.

When the project is ready, ask them to collect FOUR values from the Supabase dashboard:

| .env key | Where in Supabase |
|---|---|
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Project Settings → API → Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → Project API keys → `service_role` `secret` |
| `SUPABASE_DB_URL` | Project Settings → Database → Connection string → URI tab |

For the DB URL, they need to **replace `[YOUR-PASSWORD]`** in the URI with the password they set in step 4.

WARN them that the service role key is full database access; they should treat it like a master key. Never commit it. Never share it.

Once they've pasted those four values into `.env`, move on.

### Step 4 — Paste Amazon SP-API credentials

These were set up before the workshop. Ask them to paste:

| .env key | What it is |
|---|---|
| `SP_API_LWA_CLIENT_ID` | The LWA Client ID from their developer profile |
| `SP_API_LWA_CLIENT_SECRET` | The LWA Client Secret |
| `SP_API_REFRESH_TOKEN` | The refresh token issued when they authorised the app |
| `SP_API_REGION` | `na` for US/CA/MX/BR, `eu` for UK/DE/FR/IT/ES/NL/PL/etc., `fe` for JP/AU/SG |
| `SP_API_MARKETPLACE_IDS` | Comma-separated marketplace IDs they want synced |

If they don't have these, point them at [docs/runbooks/connect-amazon.md](../../docs/runbooks/connect-amazon.md) and stop the setup until they're back.

### Step 5 — Apply the schemas

```
npm run migrate
```

This creates 5 schemas (`raw`, `brain`, `ops`, `analytics`, `meta`) and ~20 tables in their Supabase database.

After it finishes, query `meta.migration_history` to confirm 9 migrations are recorded. Tell them the count.

### Step 6 — Smoke test the connection

```
npm run smoke
```

This is read-only. It verifies:
- `.env` validates
- Supabase Postgres is reachable
- Migrations applied
- SP-API LWA token exchange works
- SP-API returns their marketplace participation list

All five checks must pass before moving on. If any fail, fix before continuing.

### Step 7 — First backfill

Propose 30 days as a smoke test. Tell them this takes about 3-5 minutes for 1 marketplace and produces real data:

```
npm run backfill -- --months 1
```

While it runs, narrate what's happening:
- For each (marketplace, day), Claude is calling the Sales & Traffic Report.
- Each report lands in `raw.sp_api_report` (the audit trail).
- The parser writes per-ASIN rows into `brain.sales_traffic_daily`.
- Their data, in their database, in their account.

When done, verify by querying:

```sql
SELECT COUNT(*), MIN(metric_date), MAX(metric_date)
FROM brain.sales_traffic_daily;
```

Report the row count and date range to the user.

### Step 8 — Verify against Seller Central

```
npm run verify
```

Walk through what the output means:
- Per-marketplace revenue total
- Last 14 days breakdown
- Top 10 ASINs

Then ask them to open Seller Central → Reports → Business Reports → Sales and Traffic by Date, set the same window, and compare the revenue total.

**Aim for $0.00 / £0.00 gap.** Anything above $1 means something is wrong. Common causes:
- Timezone mismatch (default is `America/Los_Angeles`, US accounting TZ)
- Their Brand Analytics enrolment is incomplete (newer ASINs may not be in S&T yet)
- A marketplace in their `.env` they don't actually sell on

Once the numbers match, congratulations — their data lake is live.

### Step 9 — Set up the daily sync (be honest about it)

The pg_cron job that ships in 0009 refreshes rollup tables daily. It does NOT pull fresh SP-API data — pg_cron in Supabase's default config can't make outbound HTTPS calls without `pg_net` plus a deployed Edge Function or external trigger.

Two ways to keep data flowing each day. Walk them through whichever they prefer:

- **Simplest (manual):** run `npm run incremental` once a day. Pulls the last 30 days, idempotent, takes 3-5 minutes. They can wire it into their morning routine, or a local cron / launchd / Task Scheduler.
- **Hands-off (recommended after the workshop):** the `.github/workflows/daily-sync.yml` workflow runs at 15:00 UTC daily. They need to add their `.env` values as GitHub Actions secrets. ~5 minutes of homework, see [HOMEWORK.md](../../HOMEWORK.md).

For tomorrow, manual is fine. Hands-off is homework.

### After setup

Point them at:
- [HOMEWORK.md](../../HOMEWORK.md) for the next connectors (TikTok, Shopify, Google Drive, PPC, COGS, daily sync automation)
- [docs/useful-queries.md](../../docs/useful-queries.md) for ready-to-paste SQL queries
- [`amazon-operator-stack`](https://github.com/ShubhashSharma/amazon-operator-stack) for the AI agent layer that reads from this database

Ask if they want to set up any of the homework connectors now, or keep it simple for v1.
