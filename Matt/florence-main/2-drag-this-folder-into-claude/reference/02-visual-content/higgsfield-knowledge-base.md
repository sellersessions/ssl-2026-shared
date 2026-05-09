# Higgsfield MCP — Knowledge Base (verbatim mirror)

Source: <https://higgsfield.ai/mcp> · Compiled: 2026-05-07

This file is the canonical reference for Higgsfield's image / video generation surface. Florence cites this when picking a model for a render, when the user asks "what can Higgsfield do?", or when troubleshooting connector issues. The skill that uses it is `skills/render.md`.

---

## What is Higgsfield MCP?

Higgsfield MCP turns Claude into a creative studio by connecting Higgsfield's AI image + video platform via Model Context Protocol. Once connected, Claude can generate images, create videos, train consistent characters, and browse generation history — all in one chat.

For Florence's purposes, the high-leverage use is **image generation for A/B testing on Amazon listings** — generating main-image variants for CTR tests, listing-stack images for CVR tests, A+ module variations. Video is technically available but mostly off-mission for Florence's CRO scope.

---

## MCP server

| Field | Value |
|---|---|
| **URL** | `https://mcp.higgsfield.ai/mcp` |
| **Auth** | OAuth via Higgsfield account login (no API key) |

---

## Available models

### Image (8)

| Model | Use case |
|---|---|
| **Soul** | Character consistency, training-based — generate the same person/character across many images |
| **Nano Banana** | General-purpose, fast |
| **Nano Banana Pro** | Higher fidelity general-purpose |
| **Flux** | Strong photorealism, good for product photography |
| **Flux Kontext** | Flux variant with stronger contextual coherence |
| **Seedream 4.0** | High-end photorealism, good for hero shots |
| **GPT Image** | DALL-E-style, broad coverage |
| **Wan 2.2** | Chinese-origin model, strong on certain aesthetics |

### Video

Seedance · Kling (2.1, 2.5 Turbo, 3.0, o1) · Veo (3, 3.1) · Sora 2 · Cinema Studio · Minimax Hailuo · Wan 2.5/2.6 · Seedance Pro

### Upscale

Topaz

### Picking the model for Florence's use

| Florence task | Recommended model |
|---|---|
| Amazon main-image variant (white background, product fills frame) | **Flux** or **Nano Banana Pro** — strongest photorealism with clean compositions |
| Lifestyle / in-context listing image | **Seedream 4.0** or **Flux Kontext** — handles environmental context well |
| Character-consistency across an image stack (model in different poses) | **Soul** — train once, reuse |
| Quick comparison (Multi-Model mode) | Default to running 2-3 models in parallel for the same prompt and presenting results |
| Infographic-style listing image | **Nano Banana Pro** or **GPT Image** — both handle text/icons better than pure photorealism models |

Claude can auto-select or accept user model preference. Florence defaults to auto + offers Multi-Model when the user is unsure.

---

## What you can create

- **Images** — up to 4K, any aspect ratio, from text prompts or reference images
- **Videos** — up to 15 seconds, multiple cinematic styles
- **Consistent characters** — Soul training across scenes
- **Combinations** — text prompts + reference images

---

## Core capabilities (per Higgsfield's published docs)

1. **Image & Video Generation** — pick model, set parameters, generate. 4K, any aspect ratio.
2. **Ad Engine** — finds top-spending niches, generates ads across formats (UGC, TV spot, Wild Card), writes outreach. *(Off-mission for Florence — included for completeness.)*
3. **Brand Builder** — finds underserved products, sources factories, generates listing photos + hero video, mines reviews, builds D2C site. *(Off-mission for Florence's CRO scope; close to /research-niche territory we deferred.)*
4. **Content at Scale** — pulls listings/trends, generates a video per item, distributes via WhatsApp / YouTube. *(Off-mission for Florence.)*
5. **Presets** — 9 curated video presets (UGC, unboxing, product review, hyper motion, TV spot, etc.). *(Mostly off-mission; could fit Pinion Video templates loosely.)*

**Florence's scope: capability 1 only — Image generation for listing assets that go into A/B tests via `pinion`.** Capabilities 2-5 are full-funnel marketing automations beyond Florence's CRO mission. Mention them only if the user explicitly asks.

---

## Workflow modes

### Asset Creation — generate one asset in seconds

> Generate a cinematic wide shot of a neon-lit Tokyo alley at night

Claude picks the model, sets parameters, delivers. Florence's `render` defaults to this mode for single variants.

### Full Production — visual system from a conversation

> Train a Soul Character from these photos, then generate a 10-image lookbook

Multi-step. For Florence: train Soul on the seller's product (or model from prior listing photos), then generate the full image stack (slots 1-7) with consistency.

### Multi-Model — compare models side by side

> Generate this scene on 4 different models and show me the results

Florence offers this when the user is uncertain which aesthetic to test. Picks 3-4 models, runs the same prompt, presents the grid.

---

## Pricing & credits

- Same credit system as Higgsfield platform
- Each generation costs credits based on model + resolution
- Existing Higgsfield plan credits work seamlessly through any MCP-connected agent
- No API key, no separate billing — your account credits

---

## Latency

- Images: typically a few seconds
- Videos: longer, depends on duration + model
- All async — Claude polls for results

---

## Iteration / history

- Every generation is saved to your Higgsfield history
- Past images/videos can be referenced as input ("use the third image from yesterday's lookbook as the base")
- Browse via the platform UI or via MCP tools

---

## Use case categories (per Higgsfield's docs)

| Category | Description |
|---|---|
| **E-Commerce & Product** | Lifestyle product shots, background swaps, promotional videos — no photo studio needed |
| **Social Media** | Scroll-stopping images + short-form video for IG / TikTok / YouTube |
| **Marketing Agencies** | Scale campaign visuals across formats and styles |
| **Filmmaking** | Storyboards, concept art, previs, cinematic clips, Soul Characters for cast consistency |
| **Infographics & Visual Data** | Custom illustrations, icons, supporting imagery |

For Florence: only **E-Commerce & Product** is in scope. The skill won't generate social-media or filmmaking output unless the user explicitly asks (and even then, Florence flags it's off-mission and recommends using Higgsfield directly).

---

## Source links

- MCP: <https://higgsfield.ai/mcp>
- CLI (for Claude Code / terminal): <https://higgsfield.ai/cli>
- Skills: <https://higgsfield.ai/skills>
- Pricing: <https://higgsfield.ai/pricing>
- Discord: <https://discord.gg/higgsfield>
