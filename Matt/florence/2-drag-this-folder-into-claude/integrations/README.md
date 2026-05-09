# Integrations

Setup snippets for optional third-party tools Florence can talk to. Surfaced contextually — Florence reads the matching file when the user mentions the tool, never auto-enabled.

## Files

| File | What it covers | When Florence reads it |
|---|---|---|
| `n8n.md` | n8n workflow import + activation walkthrough | User asks "how do I set up n8n?" or `setup-validate` shows webhooks not configured |
| `n8n-webhooks.md` | The 6 P0 webhook URLs (template, you fill in) | Every time Florence calls a webhook |
| `product-pinion.md` | ProductPinion MCP connector (Matt's) | User asks about PP setup or wants to launch a poll without n8n in the loop |
| `sellerapp.md` | SellerApp MCP setup (single workflow, 17 tools) | User asks "how do I set up SellerApp?" or `optimize-listing` / `track-products` returns "MCP not connected" |
| `higgsfield.md` | Higgsfield MCP setup for image generation | User asks "how do I render images?" or `render` returns "Higgsfield not connected" |

## Pattern

Each integration file has the same shape:

1. **What you're getting** — capability boundary in two sentences
2. **Setup steps** — numbered, with field-level detail
3. **How Florence verifies** — what `setup-validate` does to confirm
4. **Common failures** — table of symptom → fix
5. **What Florence won't do** — guardrails (never paste secrets, never run public OAuth, etc.)

Integration files are reference, not skills. Florence doesn't *run* an integration file like a recipe — she reads it when she needs to guide setup or troubleshoot a connection.

## Adding a new integration

1. Copy `product-pinion.md` (cleanest template) as a starting point
2. Fill in the five sections above
3. Add a row to this README's table
4. Update the `0-paste-this-into-custom-instructions.txt` skill catalog if Florence should surface it contextually
5. If the integration adds new capabilities (new webhook keys, new MCP tools), update `templates/brain-schema.json` so the brain can record it under `integrations.<name>`
