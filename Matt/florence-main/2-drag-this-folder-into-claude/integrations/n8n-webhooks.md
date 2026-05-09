# n8n Webhooks

The webhook URLs Florence calls into your n8n instance. Fill these in after you've imported and activated the workflows from `_dev/n8n/workflows/` — see `integrations/n8n.md` for the full setup walkthrough. Then drag this file (with your URLs filled) into Project Knowledge so Florence can read it.

If a value is `PASTE_URL_HERE` or empty, that workflow isn't connected yet. Florence treats missing webhooks as "not configured" — skills that need them say so and offer to walk you through setup.

## Workshop-critical (the 6 P0 Shopper Interrogator workflows)

These power `shopper-interrogator`, Florence's headline demo skill.

```yaml
review-mining:        PASTE_URL_HERE
rufus-extract:        PASTE_URL_HERE
pp-openended-launch:  PASTE_URL_HERE
objection-synthesis:  PASTE_URL_HERE
pp-ranking-launch:    PASTE_URL_HERE
image-blueprint:      PASTE_URL_HERE
```

## Post-workshop (Stage 5+ — image generation)

```yaml
imagegen:       PASTE_URL_HERE
```

## SellerApp data layer (MCP — not webhooks)

SellerApp is wired as an **n8n MCP server** that Florence connects to via
Cowork's MCP connector — not via this webhook map. Setup walkthrough is in
`integrations/sellerapp.md`. No URLs to paste here.

The MCP exposes 17 SellerApp endpoints as tools Florence calls directly
from chat (`Get Product Details`, `Get Product Reviews`, etc.). Configured
once via `claude mcp add`, lives across sessions.

## Shared secret

This is what your n8n workflows check on every incoming request. The
same value lives in n8n as the **Florence — Webhook Secret** credential.

```yaml
secret: PASTE_RANDOM_32_CHAR_STRING_HERE
```

Generate any 32+ character random string. Florence sends it as the
`x-florence-secret` header on every webhook call.

## Rotation

If you ever expose a URL or secret publicly:

1. Generate a new random secret
2. Update the value above
3. Update the **Florence — Webhook Secret** credential in n8n
4. n8n's webhook URLs themselves rotate when you regenerate them in
   the Webhook node settings — paste the new URLs above too

## What goes where (reference)

### Workshop-critical (6 P0)

| Key | What it does | Skill |
|---|---|---|
| `review-mining` | Mines competitor 1–3 star reviews for objection patterns | `shopper-interrogator` |
| `rufus-extract` | Pulls Rufus shopper questions for the target ASIN | `shopper-interrogator` |
| `pp-openended-launch` | Launches "What's stopping you from buying?" Pinion Ask | `shopper-interrogator` |
| `objection-synthesis` | Claude consolidates reviews + Rufus + PP into ranked objections | `shopper-interrogator` |
| `pp-ranking-launch` | Launches Pinion Poll Ranked Test on the objections | `shopper-interrogator` |
| `image-blueprint` | Claude turns ranked objections into a markdown image brief | `shopper-interrogator` |

### Post-workshop (Stage 5+)

| Key | What it does | Skill |
|---|---|---|
| `imagegen` | Image generation HTTP wrapper | `/variation-engine` (post-workshop) |

### SellerApp (via MCP — see `integrations/sellerapp.md`)

SellerApp is **not** a webhook map. It's a separate n8n workflow exposing 17 SellerApp endpoints as MCP tools Florence calls directly. One `claude mcp add` step, no URLs in this file.
