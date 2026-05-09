# Florence — n8n Workflows

Seven workflows total — six P0 for the workshop demo (`/shopper-interrogator` chain) plus one P1 MCP server that exposes 17 SellerApp endpoints as Claude-callable tools (powering `/optimize-listing`). The P0s implement the full CVR Objection Mining loop documented in `2-drag-this-folder-into-claude/reference/03-testing-methodology/workflows.md`. The MCP workflow is documented in `2-drag-this-folder-into-claude/integrations/sellerapp.md`.

## What's in this folder

```
n8n/
├── README.md                                            ← you are here
├── credentials-checklist.md                             ← four credentials to create before import
└── workflows/
    ├── florence-shopper-review-mining.json              (#9 P0)
    ├── florence-shopper-rufus-extract.json              (#10 P0)
    ├── florence-shopper-pp-openended-launch.json        (#11 P0)
    ├── florence-shopper-objection-synthesis.json        (#12 P0)
    ├── florence-shopper-pp-ranking-launch.json          (#13 P0)
    ├── florence-shopper-image-blueprint.json            (#14 P0)
    └── florence-mcp-sellerapp.json                      (P1 — single MCP workflow with 17 tools)
```

These are skeleton workflows — runnable shape, placeholder URLs for the bits that depend on your environment. Every node that needs a real URL has `REPLACE_WITH_...` in it.

## Import order

The skill walks the user through this in `/n8n-setup-guide`. Doing it manually:

1. **Create the four credentials first** — see `credentials-checklist.md`. n8n won't import nodes that reference a credential by name unless that credential already exists.
2. **Import each JSON file** via *Workflows → Import from File*. Order doesn't matter; they're independent webhooks.
3. **Link credentials inside each workflow.** n8n flags any node missing a credential with a red dot. Click the node → pick the matching credential by name → save.
4. **Replace the placeholder URLs:**
   - `florence-shopper-review-mining` — `https://REPLACE_WITH_YOUR_AMAZON_SCRAPE_MCP_URL/reviews`
   - `florence-shopper-rufus-extract` — `https://REPLACE_WITH_YOUR_AMAZON_RUFUS_MCP_URL/questions`
   - `florence-shopper-pp-openended-launch` and `florence-shopper-pp-ranking-launch` — `https://REPLACE_WITH_PRODUCT_PINION_API_BASE/polls`
5. **Activate each workflow** (toggle in the top-right of the editor view).
6. **Copy each Production webhook URL** and paste into `brain/n8n-webhooks.md` against the matching key.

## Webhook contract

All six workflows follow the same shape:

- **Method:** POST
- **Path:** `florence/shopper/<workflow-suffix>`
- **Auth:** header `x-florence-secret: <your shared secret>` (managed by the *Florence — Webhook Secret* credential)
- **Response mode:** `responseNode` (the workflow returns explicit JSON)

Florence calls them by reading the URL from `brain/n8n-webhooks.md` and adding the `x-florence-secret` header. She never hard-codes URLs; she never reads the secret out loud.

## What each workflow does

The full input/output shape for each is in the sticky note at the top of the workflow itself. Summary:

| # | File | Does | External |
|---|---|---|---|
| 9 | `florence-shopper-review-mining` | Pulls 1–3 star reviews from competitor ASINs, clusters by similarity | Amazon scrape MCP |
| 10 | `florence-shopper-rufus-extract` | Pulls Rufus shopper questions for the target ASIN | Amazon Rufus MCP |
| 11 | `florence-shopper-pp-openended-launch` | Launches a "What's stopping you from buying?" Pinion Ask poll | Product Pinion API |
| 12 | `florence-shopper-objection-synthesis` | Claude consolidates outputs of #9 + #10 + #11 into 5–7 ranked objection clusters | Anthropic API |
| 13 | `florence-shopper-pp-ranking-launch` | Launches a Pinion Poll Ranked Test on the synthesised objections | Product Pinion API |
| 14 | `florence-shopper-image-blueprint` | Claude turns ranked objections into a markdown image brief (Slot 2 → Slot 7) | Anthropic API |
| P1 | `florence-mcp-sellerapp` | **MCP server** — exposes 17 SellerApp endpoints (product details, reviews, Rufus, reverse-ASIN keywords, SERP, offers, Q&A, history, profit calc, bestsellers, category tree, seller profile, token status, etc.) as Claude-callable tools. Florence connects via Cowork's MCP connector. | SellerApp API |

## Latency expectations

| Workflow | Target latency |
|---|---|
| #9 review-mining | <90s for 5 competitors |
| #10 rufus-extract | <30s |
| #11 pp-openended-launch | <10s to launch; **5–60 min for results** |
| #12 objection-synthesis | <60s (Claude Sonnet 4.6) |
| #13 pp-ranking-launch | <10s to launch; **5–60 min for results** |
| #14 image-blueprint | <90s (Claude Opus 4.7) |
| MCP SellerApp tools (each call) | <30s (synchronous, n8n proxies to SellerApp; Get Product Details ~9s for full flags) |

The two PP poll waits are the demo risk. For workshop demos, **pre-launch them Tue/Wed and cache the results in `brain/demo/`** (per Track D of the build plan).

## What's not in here yet

- **`florence-brief-daily` (#20)** — daily Slack DM. Stage 5 work.
- **`florence-demo-live-trigger` (#37)** — single button on stage that fires the whole chain. Track D work.
- **The remaining P1/P2 workflows** in `docs/n8n-workflow-plan.md` — Skills 1, 2, 4 plus the rest of data ingestion and ops. Post-workshop. (The 5 SellerApp wrappers ship now as the first chunk of this.)
- **18 of 23 SellerApp endpoints** — Bestsellers, Category Tree, Category Products, Product Offers, Q&A, LQI (async), Product History, Profit Calculator, Keyword Tracking (async), Keyword Research Bulk (async), Keyword Metrics, Seller Profile, Seller Products, Token Status. Wrap as new skills demand them; the `Florence — SellerApp API` credential is reusable.

## SellerApp MCP specifics

`florence-mcp-sellerapp.json` is a single workflow with one MCP Server Trigger and 17 HTTP Request Tool nodes wired to it. Each tool node:
- Targets one SellerApp endpoint
- Has its query parameters declared via `$fromAI(name, description)` so Claude provides them at call time
- Has the SellerApp `client-id` and `token` headers as **placeholder values** (`REPLACE_WITH_YOUR_*`) — search/replace before activating, or use n8n's JSON-edit-and-reimport flow

Florence connects to this MCP via Cowork's MCP connector (registered with `claude mcp add`). One URL paste = all 17 tools available across every Cowork chat.

Full setup walkthrough — including the SellerApp IP-allowlist gotcha — lives in `2-drag-this-folder-into-claude/integrations/sellerapp.md`.

**Why MCP instead of 5 webhook workflows**:
- 1 import vs 5
- 0 webhook URLs to paste vs 5
- LLM picks the right tool dynamically vs skill code that hard-orchestrates 5 calls
- Tools available to ANY Cowork project that connects, not just Florence

## Versioning

These ship as `v0.1.0` per the `meta.templateVersion` field in each JSON. When Florence's methodology evolves, bump the version in the file and document the breaking change in this README.

## Smoke-testing a single workflow

Before wiring the full chain, prove one workflow works end-to-end:

```bash
curl -X POST https://YOUR_N8N/webhook/florence/shopper/rufus-extract \
  -H "x-florence-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "asin": "B07HB8FNXV" }'
```

Expected: 200 with `{"asin":"B07HB8FNXV","questions":[...]}`. If you get 401, the secret credential isn't right. If you get 404, the workflow isn't activated. If you get 500, open the n8n Execution log — most likely the Amazon Rufus MCP URL placeholder hasn't been replaced.

## Source

Synthesised from `docs/n8n-workflow-plan.md` (P0 list, lines 32–37) and `knowledge/cro/03-testing-methodology/workflows.md` (the 4-step CVR loop). Any divergence between this folder and those references should be reconciled by editing the references first, then regenerating the workflow JSONs.
