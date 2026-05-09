# n8n Credentials Checklist

Create these credentials in n8n **before** importing the workflow JSONs in `n8n/workflows/`. Names matter — n8n matches on credential name, and every workflow references these exact strings.

| # | Name | Type | Used by |
|---|---|---|---|
| 1 | `Florence — Webhook Secret` | Header Auth | Every workflow's webhook trigger |
| 2 | `Florence — Anthropic API` | Header Auth | Shopper synthesis + image blueprint workflows (P0) |
| 3 | `Florence — Product Pinion API` | Header Auth | PP poll launch workflows (P0) |
| 4 | (no credential) | — | The SellerApp MCP workflow uses **hardcoded headers** in each tool node, not a credential. **Workshop credentials are pre-baked in v0.1.10+** — no find-and-replace needed for the workshop demo. Swap to your own credentials post-workshop per § 4 below. See `2-drag-this-folder-into-claude/integrations/sellerapp.md`. |

Open n8n → **Settings → Credentials → New** and create each one.

---

## 1. `Florence — Webhook Secret`

Used by every workflow's webhook trigger to authenticate incoming requests from Florence.

| Field | Value |
|---|---|
| Credential type | **Header Auth** |
| Name | `Florence — Webhook Secret` |
| Header Name | `x-florence-secret` |
| Header Value | A random 32+ character string. Same value goes in `brain/n8n-webhooks.md` under `secret:`. |

**Generate a secret:**
```bash
openssl rand -hex 24    # macOS / Linux
[guid]::NewGuid()       # Windows PowerShell
```

If the secret leaks publicly, rotate it: generate a new one, update this credential, update `brain/n8n-webhooks.md`. URLs themselves don't need to rotate.

---

## 2. `Florence — Anthropic API`

Used by `florence-shopper-objection-synthesis` and `florence-shopper-image-blueprint` to call Claude.

| Field | Value |
|---|---|
| Credential type | **Header Auth** |
| Name | `Florence — Anthropic API` |
| Header Name | `x-api-key` |
| Header Value | Your Anthropic API key (starts with `sk-ant-`) |

Get a key at https://console.anthropic.com/settings/keys. Workshop budget: ~$0.50 per full Skill 3 run with Sonnet 4.6 + Opus 4.7 mix.

---

## 3. `Florence — Product Pinion API`

Used by `florence-shopper-pp-openended-launch` and `florence-shopper-pp-ranking-launch` to launch ProductPinion polls.

| Field | Value |
|---|---|
| Credential type | **Header Auth** |
| Name | `Florence — Product Pinion API` |
| Header Name | _(per Matt's API spec — likely `Authorization` with `Bearer <token>`)_ |
| Header Value | _(per Matt's API spec)_ |

**Status:** Matt's API surface is documented in `knowledge/cro/05-productpinion/mcp-contract.md`. The workshop-shared Client ID is `B5f2zdcwuw2tEsKZZrwWvEcXF1R94l9y` (per the interview), but the n8n HTTP-node integration may need a separate REST API key. Confirm with Matt before workshop.

---

## 4. SellerApp — workshop credentials baked in (v0.1.10+)

The SellerApp MCP workflow (`florence-mcp-sellerapp`) uses **hardcoded `client-id` + `token` headers** in each of its tool nodes, not an n8n credential. **As of v0.1.10, workshop-shared credentials are pre-baked**:

- Client ID: `support_keplo`
- Token: `fbfa59f5-43fb-460e-ac0b-4740132a81f1`

For the workshop demo: import the workflow → activate → done. No find-and-replace needed.

For production use post-workshop, swap in your own SellerApp credentials:

1. Get your own from SellerApp dashboard → Settings → API → generate Client ID + Token
2. In n8n, open `florence-mcp-sellerapp` workflow → Cmd-F (Ctrl-F)
3. Find-and-replace `support_keplo` with your real client-id
4. Find-and-replace `fbfa59f5-43fb-460e-ac0b-4740132a81f1` with your real token
5. Save (n8n auto-saves on edit)

Workshop trade-off: the shared `support_keplo` account has a token cap. If many delegates are running tools in parallel (typical at the workshop), some tools may hit rate limits. For the live demo this rarely bites; for sustained production work, swap to your own.

Token quota meters per call (1–30 tokens depending on endpoint).

Setup walkthrough: `2-drag-this-folder-into-claude/integrations/sellerapp.md`.

> **Future improvement**: switch the workflow to use n8n's HTTP Custom Auth credential, so it's one paste instead of 17×2. For workshop simplicity (and to keep the JSON self-contained), credentials embed directly today.

---

## After creating credentials 1-4

1. Confirm each credential test passes (the *Test* button in n8n).
2. Import the workflow JSONs from `n8n/workflows/` (11 files).
3. For each imported workflow, click any node with a red dot → pick the matching credential by name → save. **SellerApp wrappers' HTTP nodes need `Florence — SellerApp API` linked manually if n8n auto-assignment skips them.**
4. Activate each workflow.
5. Copy each Production webhook URL into `2-drag-this-folder-into-claude/integrations/n8n-webhooks.md` against the matching key. Drag the updated file into Cowork's Project Knowledge.
6. Smoke-test one of each tier (one P0, one SellerApp) per the recipe in `_dev/n8n/README.md`.
