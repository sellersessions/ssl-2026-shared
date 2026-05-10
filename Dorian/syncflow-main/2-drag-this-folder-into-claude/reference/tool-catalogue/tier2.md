# Tier 2 · Recognition cards

> *Source: Sim's huntr 05c, trimmed to Amazon-relevant tools. ~50-word cards so syncflow recognises tools delegates mention but doesn't deeply recommend. For deep recommendations see `tier1/`.*

---

## Format

```
### [Tool Name]
**Category:** [...] · **Rung:** [...] · **Cost:** [...]
[1–2 sentences. Where it sits, when it'd come up.]
**syncflow's verdict:** [Tier 1 alternative if any | "OK if owned" | "Avoid"]
```

---

## Amazon intel and PPC

### Adtomic (Helium 10)
**Category:** Amazon PPC · **Rung:** 6 · **Cost:** Sub (in Helium 10 Diamond)
Helium 10's PPC management tool. Bundled with Diamond tier. Placement-modifier rules notoriously opaque (Sim's anti-pattern: *"modifiers awol"*).
**syncflow's verdict:** Use only if already paying for Diamond. For new builds, in-house advanced PPC wins.

### Scale Insights
**Category:** Amazon PPC · **Rung:** 6 · **Cost:** Sub
PPC management SaaS. Buggy and opaque per Sim's testimony. Glitchy rank tracking causes placement modifier issues.
**syncflow's verdict:** Avoid. In-house build replaces this for ~$500/mo less.

### Pacvue
**Category:** Amazon PPC · **Rung:** 6 · **Cost:** Enterprise
Enterprise PPC management. Heavy-duty for large brands.
**syncflow's verdict:** Recognise; rarely recommend. For brands sub-$10M/yr, in-house wins.

### Profitero
**Category:** Price intel · **Rung:** 6 · **Cost:** Enterprise
Enterprise price intelligence across retailers (Amazon + Walmart + others).
**syncflow's verdict:** Recognise. For Amazon-only, Rainforest + custom build is cheaper.

### Sellerise
**Category:** Amazon analytics · **Rung:** 1-2 · **Cost:** Sub
Profitability and PPC analytics suite. Includes review request automation.
**syncflow's verdict:** OK if owned. Check UW-07 review automation is enabled.

### SellerLegend
**Category:** Amazon analytics · **Rung:** 1-2 · **Cost:** Sub
Real-time profit dashboard. Includes review request automation.
**syncflow's verdict:** OK if owned. Same as Sellerise — confirm UW-07 in use.

### Sellerboard
**Category:** Amazon analytics · **Rung:** 1-2 · **Cost:** Sub
Profit analytics + review request automation. Lower-cost alternative to Helium 10 for analytics-only needs.
**syncflow's verdict:** OK if owned. Coach UW-07 enablement.

### DataRover
**Category:** Amazon intel · **Rung:** 6 · **Cost:** Sub (API on higher tiers)
Niche research and product intelligence. API access on larger tiers.
**syncflow's verdict:** Recognise. Pair with Data Dive depending on team preference.

### Jungle Scout
**Category:** Amazon intel · **Rung:** 6 · **Cost:** Sub
Sales estimates + opportunity finder. Industry standard alongside Helium 10.
**syncflow's verdict:** OK if owned. Comparable to Helium 10 for keyword research.

### Keepa
**Category:** Price/BSR history · **Rung:** 6 · **Cost:** Freemium → Sub
Long-term price and BSR history (3+ years). Gold standard for historical Amazon data.
**syncflow's verdict:** Tier 1 candidate; promote when budget allows. Excellent for OOS detection (offer count drops to zero).

### Cerebro / Magnet (Helium 10 sub-products)
**Category:** Amazon keyword · **Rung:** 1 · **Cost:** Sub (in Helium 10)
Reverse-ASIN and keyword discovery. Best-in-class for keyword research workflows.
**syncflow's verdict:** Use if delegate has Helium 10. UW-01 SQPR×PPC pairs well with these.

---

## Scraping (general)

### Bright Data
**Category:** Scraping · **Rung:** 6 · **Cost:** Enterprise
Residential proxies + scraping infra. Enterprise scale.
**syncflow's verdict:** Recognise. Apify or Rainforest cheaper at sub-enterprise volume.

### ScrapingBee
**Category:** Scraping · **Rung:** 6 · **Cost:** Pay-go
General-purpose scraping API with browser rendering.
**syncflow's verdict:** Recognise. Apify covers most use cases with more flexibility.

### SERP API (serpapi.com)
**Category:** Search results · **Rung:** 6 · **Cost:** Pay-go
Google/Bing/YouTube search results as structured data.
**syncflow's verdict:** Tier 1 candidate. Promote on next iteration.

### DataForSEO
**Category:** SEO data · **Rung:** 6 · **Cost:** Pay-go
SEO and SERP data API for marketing intel.
**syncflow's verdict:** Recognise.

### Firecrawl
**Category:** Web scraping · **Rung:** 6 · **Cost:** Pay-go
Programmatic web scraping with browser automation. LLM-friendly output.
**syncflow's verdict:** Tier 1 candidate. Default for "scrape this website" cases.

---

## Image generation (direct vendors)

### ChatGPT Image (gpt-image-1)
**Category:** Image gen · **Rung:** 5-6 · **Cost:** Pay-go
OpenAI's image generation. Best paired via Kie AI for swappability.
**syncflow's verdict:** Use via Kie AI (Tier 1) for aggregator-first benefits.

### Imagen 3
**Category:** Image gen · **Rung:** 5-6 · **Cost:** Pay-go
Google's image gen. Strong on text rendering.
**syncflow's verdict:** Recognise; via Kie AI for swappability.

### Ideogram
**Category:** Image gen · **Rung:** 5-6 · **Cost:** Freemium → Sub
Image gen with strong text-in-image rendering.
**syncflow's verdict:** Recognise.

### Midjourney
**Category:** Image gen · **Rung:** 5-6 · **Cost:** Sub
Highest-quality artistic image gen but Discord-bound. API access via Kie AI / Replicate.
**syncflow's verdict:** Tier 1 candidate via aggregator. Less suited for product imagery (style bias).

### Flux Pro / Schnell / Dev
**Category:** Image gen · **Rung:** 5-6 · **Cost:** Pay-go (via fal.ai)
Open-source image gen, leading quality 2026. Best via fal.ai.
**syncflow's verdict:** Tier 1 candidate. Promote next iteration.

### Adobe Firefly
**Category:** Image gen · **Rung:** 6 · **Cost:** Sub
Adobe's image gen, integrated with Creative Cloud.
**syncflow's verdict:** Recognise. Direct vendor lock-in; aggregator-first wins.

---

## Video generation

### Seedance 2 (ByteDance)
**Category:** Video gen · **Rung:** 5-6 · **Cost:** Pay-go (via Kie AI)
Strong video gen, popular 2026. Best via Kie AI for swappability.
**syncflow's verdict:** Tier 1 candidate via aggregator.

### Veo 3 (Google)
**Category:** Video gen · **Rung:** 5-6 · **Cost:** Pay-go
Google's flagship video gen.
**syncflow's verdict:** Tier 1 candidate via Kie AI.

### Sora (OpenAI)
**Category:** Video gen · **Rung:** 5-6 · **Cost:** Pay-go (via API)
OpenAI's video gen.
**syncflow's verdict:** Tier 1 candidate via Kie AI.

### Runway Gen-3 / Gen-4
**Category:** Video gen · **Rung:** 5-6 · **Cost:** Sub
Industry-standard for ad/marketing video. Direct subscription.
**syncflow's verdict:** Tier 1 candidate via aggregator if on roadmap.

### Eleven Labs
**Category:** Voice gen · **Rung:** 6 · **Cost:** Sub
Best-in-class TTS. Useful for product video voiceovers.
**syncflow's verdict:** Recognise.

---

## Image-to-3D

### Hyper3D Rodin
**Category:** Image-to-3D · **Rung:** 6 · **Cost:** Pay-go (via fal.ai)
Highest-fidelity image-to-3D in 2026. Built into Blender MCP.
**syncflow's verdict:** Tier 1 candidate. Default for hero-product 3D work.

### Hunyuan3D-2 (Tencent)
**Category:** Image-to-3D · **Rung:** 5 · **Cost:** Free (self-hosted)
Best open-source image-to-3D 2026. Multi-view supported.
**syncflow's verdict:** Tier 1 candidate for local-stack pattern.

---

## LLM gateways and direct vendors

### OpenAI API (direct)
**Category:** LLM · **Rung:** 5-6 · **Cost:** Pay-go
GPT-5 family direct.
**syncflow's verdict:** Use via OpenRouter for swappability unless OpenAI-specific feature (e.g. assistants API) needed.

### Google Gemini API (direct)
**Category:** LLM · **Rung:** 5-6 · **Cost:** Pay-go
Gemini 2.5 Pro, Flash. Free tier on Flash.
**syncflow's verdict:** Use via OpenRouter unless Google-specific feature needed.

### Groq
**Category:** LLM · **Rung:** 6 · **Cost:** Pay-go
Ultra-fast inference for open-source models. Speed differentiator.
**syncflow's verdict:** Use via OpenRouter; direct for latency-critical paths.

### Perplexity API
**Category:** LLM (search-augmented) · **Rung:** 6 · **Cost:** Pay-go
Web-search-augmented model API.
**syncflow's verdict:** Recognise. Use for "we need real-time web context in the LLM" cases.

---

## Orchestration (alternatives to n8n)

### Make.com (was Integromat)
**Category:** Orchestration · **Rung:** 4 · **Cost:** Freemium → Sub
n8n alternative — visual workflow builder. Hosted-only.
**syncflow's verdict:** Recognise; n8n wins on self-hostability + extensibility.

### Zapier
**Category:** Orchestration · **Rung:** 4 · **Cost:** Sub
Original visual orchestration. Mature integrations, expensive at scale.
**syncflow's verdict:** Recognise. n8n wins on cost + flexibility.

---

## Data layer (alternatives)

### Airtable
**Category:** Data layer · **Rung:** 1-3 · **Cost:** Freemium → Sub
Spreadsheet-database hybrid. Good UI, API-accessible.
**syncflow's verdict:** Recognise. ClickUp + Supabase often replaces.

### Notion
**Category:** Data + docs · **Rung:** 1-3 · **Cost:** Freemium → Sub
Docs + databases + AI features.
**syncflow's verdict:** Recognise. Pairs well with Cowork-driven document workflows.

### Google Sheets
**Category:** Data layer · **Rung:** 1-3 · **Cost:** Free
Universal spreadsheet, scriptable via Apps Script.
**syncflow's verdict:** OK for simple cases. Scale up to Supabase when state matters.

### Power BI
**Category:** BI · **Rung:** 1-2 · **Cost:** Sub
Microsoft BI. Common at scale; per-user costs hurt.
**syncflow's verdict:** OK if owned. Build-your-own SQL-MCP dashboards is the typical workaround.

### Metabase
**Category:** BI · **Rung:** 5-6 · **Cost:** Freemium (self-hosted) → Sub
Open-source BI. Good for "Power BI replacement" fallback.
**syncflow's verdict:** Recognise. Custom build often wins for IDL context.

### Tableau
**Category:** BI · **Rung:** 6 · **Cost:** Sub
Industry-standard BI. Per-seat costs.
**syncflow's verdict:** Recognise. Power BI more common in IDL context.

---

## Comms

### WhatsApp Business API
**Category:** Comms (customer) · **Rung:** 6 · **Cost:** Pay-go
Programmatic WhatsApp messaging.
**syncflow's verdict:** Tier 1 candidate. Customer-facing comms layer for international brands.

### Outlook (via MCP)
**Category:** Comms · **Rung:** 1-2 · **Cost:** Bundled with M365
Email + calendar via MCP. In IDL stack.
**syncflow's verdict:** Tier 1 candidate. Use for delegate-side ops.

### Gmail API
**Category:** Comms · **Rung:** 4 · **Cost:** Free (with rate limits)
Programmatic Gmail.
**syncflow's verdict:** Recognise.

### SendGrid / Postmark / Mailgun
**Category:** Comms (transactional) · **Rung:** 6 · **Cost:** Pay-go / Sub
Transactional email APIs. Pick by reliability needs (Postmark) or cost (Mailgun).
**syncflow's verdict:** Recognise.

### Twilio
**Category:** Comms (SMS/voice) · **Rung:** 6 · **Cost:** Pay-go
SMS + voice + WhatsApp Business.
**syncflow's verdict:** Recognise.

---

## Operations (3PL, fulfilment, ERP)

### LinnWorks
**Category:** Multi-channel ops · **Rung:** 1-2 · **Cost:** Sub
Multi-channel order management. In IDL stack via 3PL portal.
**syncflow's verdict:** Tier 1 candidate. Pattern: build branded portals on top of LinnWorks data.

### ShipStation
**Category:** Shipping · **Rung:** 1-2 · **Cost:** Sub
Multi-carrier shipping software.
**syncflow's verdict:** Recognise.

### ShipBob
**Category:** 3PL · **Rung:** 6 · **Cost:** Pay-go (per fulfilment)
Tech-forward 3PL.
**syncflow's verdict:** Recognise.

### Cin7 / DEAR
**Category:** Inventory ERP · **Rung:** 6 · **Cost:** Sub
Mid-market inventory management.
**syncflow's verdict:** Recognise.

### Brightpearl
**Category:** Inventory ERP · **Rung:** 6 · **Cost:** Sub
Multi-channel inventory + accounting.
**syncflow's verdict:** Recognise.

### Xero / QuickBooks
**Category:** Accounting · **Rung:** 1 · **Cost:** Sub
SME accounting. Xero UK-leaning, QuickBooks US-leaning.
**syncflow's verdict:** Recognise. Often un-extended (rung 1 wins) — check Automations and bank-feed rules.

---

## Hosting

### Netlify
**Category:** Hosting · **Rung:** 5-6 · **Cost:** Freemium → Sub
Static + serverless hosting. Vercel competitor.
**syncflow's verdict:** Recognise. Vercel wins for Next.js; Netlify for static-heavy sites.

### Render
**Category:** Hosting · **Rung:** 5-7 · **Cost:** Freemium → Sub
Web services + Postgres + Redis. In IDL MCP stack.
**syncflow's verdict:** Tier 1 candidate. Use when Vercel's serverless model isn't enough.

### Railway / Fly.io
**Category:** Hosting · **Rung:** 5-7 · **Cost:** Pay-go
Modern PaaS / edge-deployed apps. Backend-friendly.
**syncflow's verdict:** Recognise.

### Cloudflare Workers
**Category:** Hosting (edge) · **Rung:** 5-6 · **Cost:** Freemium → Pay-go
Edge functions. Different model from Vercel functions.
**syncflow's verdict:** Recognise. Use for global edge requirements.

---

## MCPs (specific recognition)

### Sequential Thinking MCP
**Category:** Reasoning · **Rung:** 5 · **Cost:** Free
Structured multi-step reasoning. In IDL MCP stack.
**syncflow's verdict:** Recognise. Use for complex decision flows.

### Context7 MCP
**Category:** Live docs · **Rung:** 5 · **Cost:** Free
Library/framework live-docs lookup.
**syncflow's verdict:** Recognise. Useful when delegate's stack uses a tool with fast-moving docs.

### Playwright MCP
**Category:** Browser automation · **Rung:** 5-6 · **Cost:** Free
Programmatic browser control. In IDL stack.
**syncflow's verdict:** Recognise.

### Slack MCP
**Category:** Comms · **Rung:** 4 · **Cost:** Free
Programmatic Slack via MCP.
**syncflow's verdict:** Recognise. See `integrations/slack.md` for setup.

---

## Other

### Bardeen
**Category:** Browser automation · **Rung:** 3-4 · **Cost:** Freemium → Sub
Browser-extension automation. Lives in Chrome.
**syncflow's verdict:** Personal automations only — laptop dependency violates the "runs unattended" principle.

### Helicone / Langfuse / LangSmith
**Category:** LLM observability · **Rung:** 5-6 · **Cost:** Freemium → Sub
LLM call logging + cost tracking.
**syncflow's verdict:** Recognise. Useful at scale.

### Excalidraw / Mermaid
**Category:** Diagrams · **Rung:** 3-5 · **Cost:** Free
Sketchy / clean diagram tools.
**syncflow's verdict:** Recognise. syncflow defaults to native HTML/CSS for branded reports.

### Loom
**Category:** Video comms · **Rung:** 1 · **Cost:** Freemium → Sub
Async video sharing.
**syncflow's verdict:** Recognise. Useful for delegate handoff documentation.

---

## Extension shape

This file is **alive**. New entries are added when:
1. A delegate mentions a recognised tool in a session
2. A Tier 3 (unknown-on-the-day) tool surfaces and is worth recognising next time
3. Sim/Dorian periodic review promotes a researched tool

Entries are pruned when a tool is sunset (note `[discontinued YYYY-MM]`), merges with another (cross-reference), or gets promoted to Tier 1 (move to `tier1/` and remove here).
