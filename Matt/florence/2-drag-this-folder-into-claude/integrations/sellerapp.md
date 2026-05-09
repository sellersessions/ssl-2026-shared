# SellerApp integration (via MCP)

> **Florence walks you through this during `onboard` Stage 2c (~6 min).** The steps below are the canonical reference for swapping to your own credentials post-workshop or re-wiring later.
>
> **v0.1.10 update:** the MCP workflow JSON at `2-drag-this-folder-into-claude/n8n/florence-mcp-sellerapp.json` ships with **workshop-shared credentials pre-baked** (`support_keplo` Client ID, token-capped shared account). For the workshop demo: import + activate + go. For production use: swap in your own SellerApp credentials per § *Swap to your own credentials* below.

Florence calls SellerApp's API by connecting to a single n8n MCP Server that exposes 16 SellerApp endpoints as Claude-callable tools. The endpoint reference is in `reference/sellerapp-api-reference.md`. This file is the setup walkthrough.

---

## Swap to your own credentials (post-workshop)

The workshop-shared `support_keplo` account works for live demos but is rate-limited (multiple delegates share its token cap). For ongoing production use, replace the baked credentials with your own:

1. Get your SellerApp credentials — open <https://app.sellerapp.com> → Settings → API → generate a Client ID + Token
2. In n8n, open the `florence-mcp-sellerapp` workflow
3. Cmd-F (Ctrl-F) → search `support_keplo` → replace with **your** SellerApp Client ID
4. Search `fbfa59f5-43fb-460e-ac0b-4740132a81f1` → replace with **your** SellerApp token
5. Save the workflow (n8n auto-saves on edit)
6. Test: in Cowork chat, ask Florence to run `optimize-listing` on a real ASIN — confirm SellerApp tools respond cleanly

---

## Why this architecture

Florence in Cowork can call MCP tools directly from chat — she picks the right tool by name, fills arguments, and uses the result. No webhook URLs to paste into a config, no per-endpoint workflow to import, no skill code that has to manually orchestrate HTTP calls.

The previous design used 5 separate webhook workflows (one per endpoint) and a skill that fired them in sequence. That works but adds:
- 5 imports instead of 1
- 5 webhook URLs to paste into a config file
- A skill that has to know the exact URL paths
- An auth credential to wire to each workflow

The MCP design collapses all of that into:
- **1 import** — the `florence-mcp-sellerapp.json` workflow
- **1 URL** — paste into Claude's MCP connector config
- **0 credential setup** — auth lives as hardcoded headers inside the workflow nodes (workshop-shared values)

Florence-as-LLM picks which tool to call based on the conversation context. `optimize-listing` becomes "call these tools in this order" — short skill prose, no plumbing.

---

## What you're getting

A single API key gives Florence broad read access to Amazon data via 16 MCP tools (Q&A endpoint deprecated in v0.1.5):

| Tool | What it does | Token cost |
|---|---|---|
| Get Product Details | Title, BSR, price, ratings, sales estimate, fees | 1–14 |
| Get Product Reviews | Paginated reviews, filter by rating/sentiment/keyword | 10/page |
| Get Rufus AI Queries | What shoppers ask before buying | 30 |
| Keyword Research V2 (Reverse ASIN) | Keywords + CTR/CVR/competition | 5+ |
| Keyword Search Result (SERP) | Top ranking products for a search term | 3+ |
| Keyword Metrics | CPC + volume + score for one keyword | 2 |
| Get Product Offers | Sellers + buy-box for an ASIN | 2 |
| Get Product History (30d) | Price/BSR/rating/review-count time series | 2+ |
| Profit Calculator | Amazon fees at a price | 3 |
| Get Category Bestsellers | Top 50 in a category | 2 |
| Get Category Tree | Navigate Amazon's categories | 0 (free) |
| Get Category Products | Products in a category | 3+ |
| Get Seller Profile | Seller details by seller_id | 2 |
| Get Seller Products | Catalog of a specific seller | 3+ |
| Keyword Research V1 (legacy) | Fallback when V2 returns 500 on new ASINs | 2 |
| Get Token Status | Quota check | 0 (free) |

Async endpoints (LQI, Keyword Tracking, Keyword Research Bulk) deliberately skipped — they need schedule + poll patterns that don't fit a single-call MCP tool.

---

## Setup (~10 minutes)

### Step 1 — Get your SellerApp API credentials

Two paths:

**Workshop delegates** — use the workshop-shared SellerApp credentials. They're not in this repo (intentionally — see `## Why credentials aren't in git` below). Get them from the channel the organisers point you at on the day (Notion page, Slack pin, on-stage QR).

**Self-serve / post-workshop** — sign into SellerApp's dashboard → API settings → generate `client-id` + API token. The free tier ships with a meaningful token allowance; paid tiers raise it.

Either path: both values are roughly UUID-shaped strings. Keep them out of chat / email / git.

### Step 2 — Sign up for n8n

Florence's MCP server runs as an n8n workflow. n8n.cloud free tier gives you 5 active workflows + 5,000 executions/month — comfortably fits.

Open <https://n8n.cloud> → sign up → create a workspace.

> **One thing to confirm with SellerApp**: their API may have an IP allowlist on your account. n8n.cloud's egress IPs need to be on that allowlist or every call returns `403 host_not_allowed`. If you hit that error in Step 5, contact SellerApp support to add n8n.cloud's egress range.

### Step 3 — Import the MCP workflow JSON

In n8n:

1. **Workflows** → **Import from File**
2. Select `_dev/n8n/workflows/florence-mcp-sellerapp.json` from this repo
3. Click Import

The workflow lands as a single connected graph: 1 sticky note + 1 MCP Server Trigger + 17 HTTP Request Tool nodes.

### Step 4 — Paste your credentials into every tool node

Each of the 17 tool nodes has two header rows that read:

```
client-id: REPLACE_WITH_YOUR_SELLERAPP_CLIENT_ID
token: REPLACE_WITH_YOUR_SELLERAPP_TOKEN
```

You need to replace both placeholders with your real values **in each node**. n8n doesn't let you bulk-edit, so it's 17 × 2 = 34 fields.

Faster path — use n8n's workflow JSON editor:

1. **Workflow menu (⋯)** → **Download** to get the current JSON
2. Find-and-replace `REPLACE_WITH_YOUR_SELLERAPP_CLIENT_ID` and `REPLACE_WITH_YOUR_SELLERAPP_TOKEN` with your real values
3. Delete the workflow in n8n
4. Re-import the edited file

(Future improvement: switch the headers to use an n8n Custom Auth credential so it's one paste instead of 17×2. For workshop simplicity, the current design embeds credentials directly.)

### Step 5 — Activate + smoke-test

1. **Top-right toggle**: Active. (Workflow goes live; MCP Server URL becomes reachable.)
2. Click the **MCP Server Trigger** node. Note the **Production URL** — it ends in `/sse`. Looks like:
   ```
   https://YOUR_INSTANCE.app.n8n.cloud/mcp/florence-sellerapp/sse
   ```
3. **Smoke-test**: in n8n's UI, click the **Get Product Details** tool node → **Execute step**. Provide test inputs:
   - `asin: B07RYP2PGN`
   - `geo: us`
   - All flag fields blank
4. Watch the response. Expected: 200 with a `product_attributes` block. If you get **403 host_not_allowed**, SellerApp is blocking n8n.cloud's IP — see Step 2's note.

### Step 6 — Register the MCP with Claude

In your terminal, on the same machine where Cowork (or Claude Code) runs:

```bash
claude mcp add --transport sse florence-sellerapp 'https://YOUR_INSTANCE.app.n8n.cloud/mcp/florence-sellerapp/sse'
```

Replace the URL with the one from Step 5. Output should be:

```
Added SSE MCP server florence-sellerapp with URL: ... to local config
```

### Step 7 — Restart Claude

Claude Code only loads MCP servers at startup. Either:

- **Claude Code (terminal)**: `Ctrl-D` to exit, then `claude` to relaunch
- **Cowork (Claude Desktop)**: quit (Cmd-Q / right-click tray icon) and reopen the app

The next chat will have all 16 SellerApp tools available. Florence's `optimize-listing` skill calls them automatically.

### Step 8 — Verify

In a fresh Cowork chat:

> "List the SellerApp tools you have available."

Florence should enumerate the 17. If she says she has none, the MCP didn't load — check the URL spelling and that the n8n workflow is Active.

---

## Geo mapping (`brain.business.marketplaces` → SellerApp `geo`)

SellerApp uses lowercase 2-letter geo codes. Florence maps from the marketplace name in your brain:

| Brain marketplace | SellerApp `geo` |
|---|---|
| `amazon.com` | `us` |
| `amazon.co.uk` | `uk` |
| `amazon.de` | `de` |
| `amazon.fr` | `fr` |
| `amazon.it` | `it` |
| `amazon.es` | `es` |
| `amazon.ca` | `ca` |
| `amazon.com.mx` | `mx` |
| `amazon.com.br` | `br` |
| `amazon.com.au` | `au` |
| `amazon.co.jp` | `jp` |
| `amazon.in` | `in` |
| `amazon.ae` | `ae` |
| `amazon.sg` | `sg` |

Full list in `reference/sellerapp-api-reference.md` line 17. Florence reads `brain.business.marketplaces[0]` by default.

---

## Token economics

SellerApp meters every call. Free tier varies; the workshop-shared account ships with **20,000,000 tokens/month**.

**Cost per `optimize-listing` audit**: ~220 tokens (Product Details + 1-3 review-page batches + Rufus + V2 keywords + 1 SERP call).

**Implied audit budget**: 20M ÷ 220 ≈ **90,000 audits/month**. Real-world usage is well under 1,000/month per seller, so token quota is not a binding constraint.

To check usage live: ask Florence "use Get Token Status to show me my quota." Free call.

---

## Failure modes

| Status | Body | Cause | Fix |
|---|---|---|---|
| 401 | `missing_token_credentials` | Headers aren't being sent | Re-check the workflow's HTTP nodes have both `client-id` and `token` headers populated |
| 401 | `invalid_token_credentials` | One value is wrong | Regenerate in SellerApp dashboard, re-paste into headers |
| 400 | `invalid_request` | Bad params | Check the tool's input schema in the n8n editor; rerun with corrected args |
| 400 | `Cannot use both pagenumber and up_to_page in parameters` | Reviews API quirk — only `up_to_page` is accepted | Don't pass `pagenumber` to the reviews tool; for multi-page just use `up_to_page` |
| 403 | `Host not in allowlist` | n8n.cloud's IP isn't on your SellerApp account's allowlist | Contact SellerApp support to add n8n.cloud's egress range |
| 406 | `api_limit_exceeded` | Out of tokens for the month | Call Get Token Status to confirm; either wait for quota refresh or upgrade plan |
| 500 | `something went wrong, please try after some time` | SellerApp transient error, OR keyword endpoints failing on very-new ASINs (no indexing yet) | Retry. For Keyword Research V2 specifically, fall back to V1 |

---

## Why credentials aren't in git

Florence's credential model: **secrets live in n8n's workflow nodes (or its credential vault), never in the repo.** Three reasons that apply to SellerApp specifically:

1. **Git history is forever.** Even after rotation, every clone / fork / CI cache / offline copy retains the old values in commit history. Force-pushing a rewrite doesn't reach copies that already exist.
2. **The repo will likely go semi-public.** README is MIT-licensed; the workshop plan has Florence distributable to ~100 delegates via zip download. A leak in commit history at that scale is unrecoverable.
3. **SellerApp credentials grant token-metered API access.** A leaked key burns through your monthly quota and lets anyone scrape any ASIN's reviews / Rufus / SERP. Not catastrophic — but worth treating like any other API key.

The workshop-shared values are distributed out-of-band (Notion page, on-stage QR, Slack pin — whatever channel the organisers pick). Post-workshop they rotate; delegates with their own SellerApp accounts unaffected.

---

## What's NOT in this integration (yet)

Out of the 23 SellerApp endpoints, the MCP exposes **17** synchronous ones. The 6 async endpoints are deferred:

- LQI + Fetch LQI Report (schedule + poll)
- Keyword Tracking + Fetch (schedule + poll)
- Keyword Research Bulk + Fetch (schedule + poll)

Adding them requires a wait-and-poll pattern that doesn't fit single-call MCP tools. Could be added as a separate "long-running operations" MCP later.

---

## Source

- `reference/sellerapp-api-reference.md` — verbatim mirror of SellerApp's full Postman docs (23 endpoints, request/response shapes, token costs)
- `_dev/n8n/workflows/florence-mcp-sellerapp.json` — the importable MCP workflow
- `skills/optimize-listing.md` — the orchestrating skill that uses these tools
