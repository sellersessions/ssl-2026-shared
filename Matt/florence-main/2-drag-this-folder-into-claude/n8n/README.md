# Florence — n8n workflow files

User-accessible copies of the n8n workflow JSONs Florence needs. Drag these into n8n during `onboard` Stage 2c (or follow `integrations/n8n.md` for the manual walkthrough).

## What's in here

| File | Purpose | When you import it |
|---|---|---|
| `florence-mcp-sellerapp.json` | The SellerApp MCP server — exposes 16 tools as Claude-callable MCP tools (Get Product Details, Get Product Reviews, Get Rufus AI Queries, Keyword Research V2, Keyword Search Result, etc.) | `onboard` Stage 2c — required for `track-products`, `optimize-listing`, `shopper-interrogator` |
| `credentials-checklist.md` | The 4 credentials you need to create in n8n's vault before importing any workflow | Read before Stage 2c.2 |

## How Florence uses these (v0.1.10 — workshop creds baked in)

During `onboard` Stage 2c (n8n + SellerApp wiring), Florence narrates each step. As of v0.1.10, the SellerApp credentials (`support_keplo` Client ID + `fbfa59f5-43fb-460e-ac0b-4740132a81f1` token) are **pre-baked into the workflow JSON** — no find-and-replace, no n8n credential creation required for the workshop demo.

1. Sign up for n8n (`n8n.cloud` free tier or n8n Desktop)
2. Download `florence-mcp-sellerapp.json` from this folder
3. Import into n8n's Workflows panel (Workflows → Import from File)
4. Activate the workflow (toggle top-right Inactive/Active switch)
5. Click the MCP Server Trigger node → copy the **Production URL**
6. Add a Custom Connector in Cowork (Settings → Connectors → Add Custom Connector → paste the URL → restart Cowork)

That's it for the workshop demo. The `credentials-checklist.md` in this folder is now only relevant if you're wiring the optional 6 Shopper Interrogator workflows (Anthropic API + ProductPinion API + Webhook Secret + Amazon Scrape MCP credentials) — see `_dev/n8n/` for those.

If you want the canonical reference (or you're rewiring after a Cowork crash), `integrations/n8n.md` and `integrations/sellerapp.md` carry the full step-by-step.

## What about the other 6 n8n workflows?

The six `florence-shopper-*` workflows (Shopper Interrogator pipeline) live at `_dev/n8n/workflows/` for advanced users — they're optional and not required for the v0.1.8 cold-install path. Florence's `shopper-interrogator` skill needs them; everything else (`optimize-listing`, `render`, `pinion`, `track-products`) works without them.

If you want the full Shopper Interrogator pipeline:

1. Read `_dev/n8n/README.md` (the developer-side reference)
2. Import all 6 `florence-shopper-*.json` workflows
3. Wire the credentials per `credentials-checklist.md` — the Anthropic API key + ProductPinion API token are the two extra pieces
4. Paste the 6 webhook URLs into `integrations/n8n-webhooks.md` so Florence can call them

## Source

`florence-mcp-sellerapp.json` and `credentials-checklist.md` are copies of the canonical files at `_dev/n8n/workflows/` and `_dev/n8n/`. The `_dev/` versions are the source of truth; this folder is the user-facing copy that ships in Cowork's Project Files. If the dev version changes, this folder gets re-synced (manual step in the dev workflow).

Last sync: v0.1.8.
