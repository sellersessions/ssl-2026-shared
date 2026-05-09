# Product Pinion integration

> **Florence walks you through this during `onboard` Stage 2a (~1 min).** The steps below are the canonical reference for re-wiring or swapping credentials later.

Florence calls ProductPinion via Matt Kostan's MCP server. The full contract is in `reference/05-productpinion/mcp-contract.md` (synthesised from Matt's 2026-05-05 interview); this file is the setup walkthrough.

---

## What you're getting

A connector that lets Florence launch ProductPinion polls (open-ended, ranked, image split, search simulation) and read results — all from inside Cowork, without leaving the chat.

The 6 P0 workflows in `_dev/n8n/workflows/` already integrate PP via HTTP at the n8n layer — that's the workshop demo path. This file describes the **direct MCP connector** Florence can also use for one-off polls outside the Shopper Interrogator chain.

---

## Setup (~30 seconds)

### Step 1 — Open Claude settings

In Cowork (Claude Desktop): *Settings → Connectors → Add Custom Connector*

### Step 2 — Paste the connection details

| Field | Value |
|---|---|
| Server URL | `https://api.productpinion.com/mcp` |
| Client ID (under Advanced Settings) | `B5f2zdcwuw2tEsKZZrwWvEcXF1R94l9y` (workshop-shared) |

This is a workshop-shared Client ID. Each delegate connects their own ProductPinion account underneath; credit pools aren't shared. Source: <https://productpinion.helpscoutdocs.com/article/45-introducing-mcp-connect-productpinion-directly-with-claude>.

### Step 3 — Authenticate

Click connect. Cowork takes you through PP's OAuth flow. You sign in with your PP account and authorise.

### Step 4 — Verify

Type `setup-validate` in Florence. The health view should show **PP connector reachable** as green. Or ask Florence "what PP tools do you see?" — she should list the launch / query / audience tools.

---

## What Florence can do once connected

Per PP's published docs, MCP unlocks:

- **Query past poll data** — patterns across all previous tests in seconds
- **Generate high-converting creatives** — use real shopper feedback as input to image briefs
- **Launch polls from chat** — Pinion Ask, Pinion Polls (any of 5 types + 17 templates), Pinion Videos (2 types + 5 templates) directly via tool calls
- **Automate testing** — continuous tests via routines
- **Build feedback loops** — ideas → tests → insights → creatives

The exact tool surface is whatever PP exposes through its MCP server — Florence checks her runtime tool manifest before assuming a specific tool name. The internal tool taxonomy (synthesised from Matt's interview) is in `reference/05-productpinion/mcp-contract.md` and `reference/05-productpinion/tool-taxonomy.md`. The product-surface contract — test types, templates, audience options — is in `reference/05-productpinion/knowledge-base.md`.

The skill that drives this is `skills/pinion.md`. The full-loop demo skill (`skills/shopper-interrogator.md`) currently runs through n8n for the workshop demo path; the MCP path is the lightweight alternative for one-off tests outside the demo chain.

---

## Latency expectations

| Audience type | First results | Complete |
|---|---|---|
| Broad / open audience | ~5 min | ~15 min |
| Narrow / specific audience | ~5 min | up to ~1 hour |

Florence polls `get_poll_stats` on demand — when you ask "what's the status?", she checks live. No webhook callbacks today.

---

## Two exclusive features Florence uses heavily

1. **Top up a live test instead of relaunching.** Stuck in the 60–69% confidence zone? Florence adds 50 more respondents to the same poll. Way cheaper than starting over.
2. **Exclude previous respondents** when duplicating a test. Critical for the Main Image Sequencer's Step 5 (CTR retest with fresh eyes).

Both features are why ProductPinion is the right tool for the Shopper Interrogator workflow specifically — the workflows would still run on a generic survey tool, but the iteration cost would be 3–4× higher.

---

## Cost notes

Each respondent costs PP credits (varies by audience). For one full `shopper-interrogator` run on a live ASIN with 100 respondents per poll: budget ~300 credits across the open-ended + ranked passes. Plus Anthropic API spend (~$0.50 with Sonnet 4.6 + Opus 4.7 mix).

For workshop demos, polls are pre-launched Tue/Wed before the event so audience picks land on cached results — keeps the live demo under 4 minutes total.

---

## Troubleshooting

If the connector returns errors, route through `help`. Common ones:

| Error | Cause | Fix |
|---|---|---|
| 401 on every call | OAuth token expired | Reconnect via Settings → Connectors |
| 429 rate limited | Bursting too many polls | Wait 60s; Florence won't auto-retry |
| 422 on `create_poll` | Payload missing `target_url` or `question` | Check `skills/shopper-interrogator.md` for the canonical payload |
| Empty response from `get_poll_submissions` | Poll hasn't filled yet | Surface the `expected_fill_minutes` and offer to check back |

---

## Source

`reference/05-productpinion/mcp-contract.md` (full 18-tool list + auth + latency + lifecycle).
`reference/05-productpinion/case-studies.md` (six real wins Florence cites).
`reference/_source/matt-2026-05-05-interview.md` (canonical archive).
