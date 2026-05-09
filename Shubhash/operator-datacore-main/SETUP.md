# SETUP.md — operator-datacore in 30 minutes

This is the same flow that the `/operator-setup` slash command does, but written down. If you'd rather have Claude Code hold your hand inside VS Code, run that instead.

If you get stuck on any step, the [GLOSSARY.md](./GLOSSARY.md) explains every technical term in one line.

---

## What you need before you start

- Node.js version 20 or higher. Check: `node --version`. Get it from https://nodejs.org/ if needed.
- A Supabase account. Free tier is fine. Sign up at https://supabase.com.
- Amazon SP-API credentials (LWA Client ID, Client Secret, Refresh Token). Set up before this workshop.
- 30 minutes of focus.

---

## Step 1 — Install dependencies

You already cloned the repo. From the repo folder, run:

```bash
npm install
```

If this fails on a Mac with an `ENOENT: no such file ... 'node_modules 2'` error, your repo is inside iCloud Drive. Run this and try again:

```bash
find . -maxdepth 2 -name "* 2*" -not -path "./node_modules/*" -delete
npm install
```

---

## Step 2 — Create a Supabase project

1. Open https://supabase.com/dashboard. Sign in.
2. Click **New Project**.
3. Name it something memorable, e.g. `operator-datacore-yourbrand`.
4. Pick a database password. **Save it in your password manager. You will need it again.**
5. Choose the region closest to you.
6. Click **Create new project**. Wait 2-3 minutes for it to provision.

Once your project is ready, you'll need 4 values from the dashboard.

| `.env` key | Where to find it in Supabase |
|---|---|
| `SUPABASE_URL` | Project Settings → API → Project URL (looks like `https://abcd1234.supabase.co`) |
| `SUPABASE_ANON_KEY` | Project Settings → API → Project API keys → row labelled `anon` `public` (long JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → Project API keys → row labelled `service_role` `secret` (DO NOT share) |
| `SUPABASE_DB_URL` | Project Settings → Database → Connection string → **URI** tab. Replace `[YOUR-PASSWORD]` with the password you set in step 4. |

Copy `.env.example` to `.env` (or run `npm run setup`):

```bash
cp .env.example .env
```

Open `.env` in your editor and paste the four values.

---

## Step 3 — Add Amazon SP-API credentials

Add these to `.env` too:

| `.env` key | What it is |
|---|---|
| `SP_API_LWA_CLIENT_ID` | Your LWA app's Client ID |
| `SP_API_LWA_CLIENT_SECRET` | Your LWA app's Client Secret |
| `SP_API_REFRESH_TOKEN` | The long refresh token issued when you authorised the app on your seller account |
| `SP_API_REGION` | `na`, `eu`, or `fe` |
| `SP_API_MARKETPLACE_IDS` | Comma-separated marketplace IDs (e.g. `ATVPDKIKX0DER` for US) |

If you don't have these, see [docs/runbooks/connect-amazon.md](./docs/runbooks/connect-amazon.md). Don't continue without them.

---

## Step 4 — Apply the database schemas

```bash
npm run migrate
```

This applies 9 SQL files to your Supabase database, creating 5 schemas:

| Schema | What it holds |
|---|---|
| `raw` | Every API response, stored as JSON. Audit trail. |
| `brain` | Source-of-truth mirror, one table per Amazon report. |
| `ops` | Daily / weekly / monthly rollups, computed from `brain`. |
| `analytics` | Currency-converted views for dashboards. |
| `meta` | Connection state, sync log, FX rates, configuration. |

You should see 9 `✓` lines and a schema summary at the end.

---

## Step 5 — Smoke test

```bash
npm run smoke
```

This is read-only. It checks:

1. `.env` loads and validates.
2. Your Supabase database is reachable.
3. Migrations are applied.
4. SP-API token exchange works.
5. SP-API returns your marketplace participation list.

All 5 must pass before you go further. If anything fails, the error message tells you what to fix.

---

## Step 6 — First backfill (30 days)

```bash
npm run backfill -- --months 1
```

This pulls the last 30 days of Sales & Traffic data from SP-API. Takes about 3-5 minutes for 1 marketplace, longer for multiple.

You'll see one line per (marketplace, day) as it progresses. When it finishes, your `brain.sales_traffic_daily` table has real data.

If you want the full 24 months, run:

```bash
npm run backfill -- --months 24
```

This takes 1-2 hours per marketplace. Run it overnight.

---

## Step 7 — Verify against Seller Central

```bash
npm run verify
```

This prints:
- Per-marketplace revenue, units, sessions, page views over the window.
- Last 14 days breakdown.
- Top 10 child ASINs by revenue.

Now open Seller Central → **Reports** → **Business Reports** → **Sales and Traffic by Date**. Set the same date range. Compare the revenue total.

**Aim for a $0.00 / £0.00 gap.**

If the numbers differ:
- Most common cause: timezone. Default is `America/Los_Angeles` (Amazon's accounting timezone for the US). Set `ROLLUP_TIMEZONE` in `.env` if your marketplace is different.
- Brand Analytics enrolment incomplete (some new ASINs may not be in S&T yet).
- A marketplace in `.env` you don't actually sell on (returns zero).

---

## Step 8 — You're done

The migrations include a `pg_cron` job that re-rolls daily summaries automatically at 14:30 UTC. **It does not pull fresh data from SP-API.** Two ways to keep your data fresh going forward:

- **Manual** — run `npm run incremental` once a day. Pulls the last 30 days, idempotent, takes 3-5 minutes.
- **Hands-off** — set up the GitHub Actions workflow at `.github/workflows/daily-sync.yml`. See [HOMEWORK.md](./HOMEWORK.md) section 9. ~5 minutes of one-time setup.

What to do next:

- **Connect the AI agent.** [`amazon-operator-stack`](https://github.com/sellersessions/amazon-operator-stack) is the MCP server that lets Claude Code query SP-API live and your `operator-datacore` together.
- **Activate the next connector.** [HOMEWORK.md](./HOMEWORK.md) has TikTok, Shopify, Google Drive, PPC, and COGS, each as its own runbook.
- **Build a dashboard.** Connect Metabase, Looker Studio, Hex, or a custom Next.js app to your Supabase project and read from `analytics.amazon_daily` and `analytics.amazon_top_asins`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Environment validation failed` | Open `.env`, fill in the missing values listed in the error. |
| `relation "brain.sales_traffic_daily" does not exist` | Run `npm run migrate`. |
| `403 Forbidden` from SP-API | Refresh token expired or wrong region. Regenerate the refresh token in Seller Central → Apps and Services → Develop Apps. |
| `429 Too Many Requests` from SP-API | Backfill paginates and retries automatically. Just wait. Reduce `--concurrency` if it's persistent. |
| First backfill returns 0 rows | Brand Analytics enrolment incomplete. Seller Central → Brand Analytics. Free for brand-registered sellers. |
| Numbers don't match Seller Central | Most likely a timezone mismatch. Set `ROLLUP_TIMEZONE` in `.env`. |
| `npm install` fails with `node_modules 2` error | iCloud sync conflict. See Step 1. |

If none of those help, paste the full error and the last 20 rows of `meta.sync_log` (ordered by logged_at desc) into your Claude Code session and ask for help.
