# Higgsfield integration

> **Florence walks you through this during `onboard` Stage 2b (~1 min).** The steps below are the canonical reference for re-wiring later.

Florence calls Higgsfield via its MCP server to generate Amazon listing image variants — main-image redesigns, lifestyle shots for the listing stack, A+ module variants. The image gets generated, the user reviews it, and (if it looks right) it gets uploaded to a Pinion Poll via `pinion` for split-testing against the current main.

The full product surface is in `reference/02-visual-content/higgsfield-knowledge-base.md`. The skill that uses this connector is `skills/render.md`.

---

## What you're getting

A connector that lets Florence generate images (and optionally video) directly from chat using 8+ image models — Soul, Nano Banana, Flux, Seedream 4.0, GPT Image, etc. Uses your existing Higgsfield account credits; no API key.

For Florence's mission, this closes the gap between **brief** (Florence writes the spec) and **asset** (designer renders it). With Higgsfield connected, Florence can render the variant herself, hand it to the user, and queue it up for `pinion` testing in one continuous flow.

---

## Setup (~30 seconds)

### Step 1 — Open Claude / Cowork settings

In Cowork (Claude Desktop) or `claude.ai`: **Settings → Connectors → Add Custom Connector**

### Step 2 — Paste the connection details

| Field | Value |
|---|---|
| Name | `Higgsfield` |
| Server URL | `https://mcp.higgsfield.ai/mcp` |

No Client ID, no API key — auth is via your Higgsfield account login.

### Step 3 — Authenticate

Click **Add → Connect**. Cowork takes you through Higgsfield's OAuth flow. Sign in with your Higgsfield account.

### Step 4 — Verify

Type `setup-validate` in Florence. The health view should show **Higgsfield connector reachable** as green.

Or ask Florence: *"What Higgsfield models do you see?"* — she should list the available image / video models from the connector's runtime tool manifest.

> **Tip (per Higgsfield's docs):** if you're using Claude Code or Codex (terminal-based), prefer the Higgsfield CLI at <https://higgsfield.ai/cli>. The MCP path is for Claude Desktop / Cowork.

---

## What Florence does once connected

Per Higgsfield's published docs, MCP unlocks:

- **Image generation** — text-to-image or reference-image-to-image, up to 4K, any aspect ratio
- **Video generation** — up to 15 seconds across cinematic styles
- **Soul Character training** — train a consistent character/product look once, reuse across an image stack
- **Multi-model comparison** — same prompt across Flux / Soul / Cinema Studio / Seedream, pick the winner
- **Generation history** — reference past images as input for new ones

Florence's `render` skill scopes this to: **Amazon main-image variants + listing-stack images + A+ module variants**. Other use cases (social, filmmaking, ad creative) are technically possible but off-mission — the skill flags them and points you at Higgsfield directly.

---

## Cost notes

- Higgsfield credits, same as the platform itself — no separate API billing
- Per-generation cost varies by model + resolution
- Image generation: typically a few seconds, low credit cost
- Video generation: longer, higher credit cost
- Florence surfaces credit estimate before generating expensive assets (4K hero shots, multi-model parallel runs)

For Amazon main-image work: each variant is one image generation, usually <1 minute, low-credit. Generating 3 variants for a Pinion Image Split Test = ~3 generations × low-cost model = trivial credit spend vs the value of the test.

---

## Latency

- Images: typically a few seconds
- Multi-model parallel: depends on slowest model
- Videos: longer (depending on duration + model)

All generation runs async via the MCP — Florence polls for results and surfaces them as soon as they're ready.

---

## Troubleshooting

If the connector returns errors, route through `help`. Common ones:

| Error | Cause | Fix |
|---|---|---|
| 401 / auth failed | OAuth token expired | Reconnect via Settings → Connectors |
| Image generation fails / rejected | Prompt violates Higgsfield's content policy | Florence rewrites the prompt; if persistent, surface and ask user to rephrase |
| Out of credits | Higgsfield account balance hit zero | Top up via Higgsfield platform; Florence can't auto-top-up |
| Wrong aspect ratio | Default model picked wrong format | Florence specifies `aspect_ratio: 1:1` for Amazon main image, retries |

---

## Source

- MCP page: <https://higgsfield.ai/mcp>
- CLI (for Claude Code): <https://higgsfield.ai/cli>
- Pricing: <https://higgsfield.ai/pricing>
- Verbatim mirror: `reference/02-visual-content/higgsfield-knowledge-base.md`
