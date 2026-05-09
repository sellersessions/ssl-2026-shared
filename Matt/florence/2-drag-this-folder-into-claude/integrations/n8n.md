# n8n integration

> **Florence walks you through this during `onboard` Stage 2c (~10 min).** The steps below are the canonical reference for re-wiring later. The SellerApp MCP workflow JSON ships in `2-drag-this-folder-into-claude/n8n/florence-mcp-sellerapp.json` (added in v0.1.8) — Florence points there during onboarding so the user can download it directly from Cowork's Project Files.

Florence's backend for live data fetches and Pinion poll launches. The 6 workshop-critical Shopper Interrogator workflow JSONs ship in `_dev/n8n/workflows/`. The SellerApp MCP workflow ships in both `_dev/n8n/workflows/` (developer source) and `2-drag-this-folder-into-claude/n8n/` (user-facing copy).

This file is the setup walkthrough Florence reads when you ask "how do I wire up n8n?" or `setup-validate` reports webhooks not configured.

---

## What you're setting up

Six webhook-triggered workflows that power `shopper-interrogator`:

| Workflow | Purpose | External call |
|---|---|---|
| `florence-shopper-review-mining` | Cluster competitor 1–3 star reviews | Amazon scrape MCP |
| `florence-shopper-rufus-extract` | Pull Rufus shopper questions | Amazon Rufus MCP |
| `florence-shopper-pp-openended-launch` | "What's stopping you from buying?" Pinion Ask | Product Pinion API |
| `florence-shopper-objection-synthesis` | Consolidate to 5–7 ranked objections | Anthropic API (Sonnet 4.6) |
| `florence-shopper-pp-ranking-launch` | Ranked Pinion Poll on the objections | Product Pinion API |
| `florence-shopper-image-blueprint` | Markdown image brief | Anthropic API (Opus 4.7) |

Each follows the same shape: webhook in (`x-florence-secret` header check) → external call(s) → shape response → respond.

---

## Setup (~30 minutes total)

### Step 1 — Pick n8n Cloud or Desktop

| Option | Pros | Cons |
|---|---|---|
| **n8n Cloud free tier** (recommended) | Runs 24/7, no laptop dependency, 5 workflows + 5,000 executions/month fits the 6 P0 + room for one more | Cold-start latency ~5s on first call |
| **n8n Desktop** | Free, fully offline, fast | Only runs when the app is open; daily routines die when you close your laptop |

Sign up at https://n8n.cloud (recommended) or install Desktop from https://n8n.io/desktop.

### Step 2 — Create the four credentials

Open *Settings → Credentials → New* in n8n. Create these four (names matter — workflow JSONs reference them exactly):

| Name | Type | Field | Value |
|---|---|---|---|
| `Florence — Webhook Secret` | Header Auth | Header Name: `x-florence-secret` | A random 32+ character string |
| `Florence — Anthropic API` | Header Auth | Header Name: `x-api-key` | Your Anthropic API key (`sk-ant-…`) |
| `Florence — Product Pinion API` | Header Auth | Header Name: per Matt's spec | Your PP API token |
| `Florence — Amazon Scrape MCP` | (varies — usually Header Auth) | per your MCP provider | (see the MCP's docs) |

Generate the webhook secret:
```bash
openssl rand -hex 24    # macOS / Linux
[guid]::NewGuid()       # Windows PowerShell
```

Keep that secret — you'll paste it into `integrations/n8n-webhooks.md` (next file) too.

### Step 3 — Import the 6 workflow JSONs

In n8n: *Workflows → Import from File*. Select all 6 JSON files from `_dev/n8n/workflows/` in this repo:

- `florence-shopper-review-mining.json`
- `florence-shopper-rufus-extract.json`
- `florence-shopper-pp-openended-launch.json`
- `florence-shopper-objection-synthesis.json`
- `florence-shopper-pp-ranking-launch.json`
- `florence-shopper-image-blueprint.json`

n8n imports them as **inactive**. Don't activate yet — credentials need to be linked first.

### Step 4 — Link credentials inside each workflow

Open each workflow. n8n flags any node that needs a credential with a red dot. Click each red node, pick the matching credential by name, save.

When all 6 workflows have zero red dots, you're ready.

This is the step most likely to confuse — credential names must match between the JSON file's reference and what you created in Step 2. If a credential doesn't show up in the dropdown, it's a type mismatch — delete and recreate using the type from the table above.

### Step 5 — Replace placeholder URLs

Three of the six workflows have `REPLACE_WITH_*` URLs you'll fill in:

| Workflow | URL placeholder | What goes here |
|---|---|---|
| `florence-shopper-review-mining` | `https://REPLACE_WITH_YOUR_AMAZON_SCRAPE_MCP_URL/reviews` | Your Amazon-review-scrape MCP endpoint |
| `florence-shopper-rufus-extract` | `https://REPLACE_WITH_YOUR_AMAZON_RUFUS_MCP_URL/questions` | Your Rufus-question MCP endpoint |
| `florence-shopper-pp-openended-launch` and `pp-ranking-launch` | `https://REPLACE_WITH_PRODUCT_PINION_API_BASE/polls` | ProductPinion's poll-launch endpoint |

The Anthropic-API workflows (`objection-synthesis`, `image-blueprint`) hit `https://api.anthropic.com/v1/messages` — already canonical, no replacement needed.

### Step 6 — Activate each workflow

Toggle each one to "Active" (top-right of the editor view). All 6 should go live.

### Step 7 — Copy webhook URLs into the integrations file

For each workflow:

1. Click the Webhook node → copy the **Production URL**
2. Paste into `integrations/n8n-webhooks.md` against the matching key
3. Drag the updated `integrations/n8n-webhooks.md` into Project Knowledge so Florence reads it

The `secret:` line in that file gets the same string you generated in Step 2.

### Step 8 — Smoke-test one workflow

Before relying on the chain, test one webhook with `curl`:

```bash
curl -X POST https://YOUR_N8N_BASE/webhook/florence/shopper/rufus-extract \
  -H "x-florence-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "asin": "B07HB8FNXV" }'
```

Expected: HTTP 200 with `{"asin":"B07HB8FNXV","questions":[...]}`. If you get 401, the secret credential is wrong. If 404, the workflow isn't activated. If 500, open n8n's Execution log — most likely the placeholder URL in Step 5 isn't replaced.

### Step 9 — Confirm in Florence

Type `setup-validate` in chat. The cockpit health view should show all 6 webhooks green. If anything's red, the fix label tells you what to check.

---

## What's not in the 6 P0 set (deferred)

The next-tier workflows — daily brief, slack handoff, image generation — are documented in `_dev/n8n/README.md` and in `_dev/docs/n8n-workflow-plan.md`. They ship after the workshop.

---

## Common failures

| Symptom | Likely cause | Fix |
|---|---|---|
| User can't find "Import from File" | n8n menu changed | Try *Workflows → New → Import URL*, or paste the JSON contents |
| Credentials don't show up in node dropdown | Credential type mismatch | Delete and recreate with the type listed in Step 2 |
| Webhook URL returns "Workflow could not be started" | Workflow not active | Toggle it on |
| Webhook returns 200 but body is empty | Internal node misconfigured | Check the Execution log; route through `help` |
| Free tier already has 5 active workflows | Other n8n work in the same instance | Archive non-Florence workflows, or upgrade |

---

## What Florence won't do

- Import workflows via the n8n API — manual import is faster and avoids needing an API key dependency.
- Paste webhook URLs in chat — they live in `integrations/n8n-webhooks.md` only.
- Skip Step 4 (credential linking) and assume "the user will figure it out." This is the step that fails most often.
