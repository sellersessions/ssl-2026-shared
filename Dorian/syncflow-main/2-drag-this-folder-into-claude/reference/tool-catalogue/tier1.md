# Tier 1 · Recommended tools

> *Source: Sim's huntr-handover · file 05b. Cherry-picked into syncflow as vetted tool entries to cite during `recommend-modules` and `generate-build-plan`. 22 entries; one section each.*

See `_architecture.md` for the 3-tier curation philosophy + aggregator-first principle and the `tier2.md` recognition cards for tools delegates may mention but syncflow doesn't lead with.

---

## 1. Amazon SP-API (Selling Partner API)

**Category:** Amazon API
**Simplicity rung:** 4-5 (n8n flow / Claude Code routine consuming it)
**Cost tier:** Free (Amazon-side; usage limits apply)
**Auth:** OAuth2 (LWA — Login With Amazon)
**Status:** ✅ Vetted

### Purpose
The official Amazon Seller API. Read inventory, sales, orders, returns, listings; write listings, prices, FBA shipments. Brand Analytics endpoints (SQPR, Market Basket, Repeat Purchase) live here too.

### When to use
- Anything official-data — inventory, sales, returns, pricing
- Listings management at scale (image uploads, bullets, A+)
- Brand Analytics queries (SQPR is the killer endpoint)
- Anywhere "scraping Amazon" was the previous instinct — SP-API is faster, cheaper, more reliable

### When NOT to use
- Competitor data (SP-API only sees your own — use Rainforest/Apify/Keepa for competitor)
- Pre-auth (token rotation is non-trivial; budget setup time)

### Pairs with
n8n, Claude Code, Amazon Ads MCP, Supabase (for caching), Cowork

### Common patterns
P-01 (image uploads), P-09 (advanced PPC), P-10 (demand planning), P-11 (repricer), UW-01, UW-02, UW-05, UW-06, UW-08

### Live docs
- Primary: https://developer-docs.amazon.com/sp-api
- Context7: `amzn/selling-partner-api-docs`
- Quick start: https://developer-docs.amazon.com/sp-api/docs/sp-api-overview

### Pricing
- Free for sellers and approved third parties
- Rate limits per endpoint (Brand Analytics is daily-bucket; Listings is high frequency)
- **Last verified:** 2026-05-06

### Gotchas
- LWA token rotation isn't documented brilliantly. Use a refresh-token script.
- SQPR data is weekly/monthly aggregated, not real-time
- Reports endpoints have wildly different latencies (seconds vs hours)
- Region-specific endpoints; UK/EU/US all have separate base URLs

---

## 2. Amazon Ads API (via Amazon Ads MCP)

**Category:** Amazon API
**Simplicity rung:** 4-5
**Cost tier:** Free (Amazon-side)
**Auth:** OAuth2
**Status:** ✅ Vetted

### Purpose
Programmatic access to Sponsored Products, Sponsored Brands, Sponsored Display, and DSP campaigns. Read performance, write bids, manage placements, create campaigns, manage targeting.

### When to use
- Universal wins UW-01 (campaign creation), UW-02 (placement bid adjuster), UW-04 (branded search audit)
- Pattern P-09 (advanced PPC in-house)
- Anywhere Scale Insights / Adtomic was previously used

### When NOT to use
- Inferring competitor ad spend — not exposed
- Real-time bid changes (Amazon caches; expect 15-60min delay before changes show)

### Pairs with
SP-API (for organic data correlation), Claude Code, n8n, Slack (alerts)

### Common patterns
P-09, UW-01, UW-02, UW-04, UW-05

### Live docs
- Primary: https://advertising.amazon.com/API/docs/en-us/
- Sim's existing setup: see `projects/amazon-ads-mcp/` in IDL workspace
- Token refresh: 1hr expiry; setup script in `amazon-ads-mcp/refresh-token.sh`

### Pricing
- Free
- Different endpoints have different rate limits
- **Last verified:** 2026-05-06

### Gotchas
- Token refresh discipline matters — automate it or you'll waste time
- SP / SB / SD have different column schemas for the same metrics. Don't assume `sales7d` works everywhere — it's `sales` on SD.
- SB rate limiting is much stricter than SP/SD — request SB reports first
- Profile IDs are per-marketplace; UK + DE + US all need separate auth dance

---

## 3. n8n

**Category:** Orchestration
**Simplicity rung:** 4
**Cost tier:** Freemium → Sub
**Auth:** Self-hosted or n8n Cloud (API token)
**Status:** ✅ Vetted

### Purpose
Workflow orchestration backbone — connects systems, schedules jobs, runs the glue logic that bespoke code shouldn't. Default orchestration layer at IDL.

### When to use
- Multi-system handoffs (Amazon → Sheet → Slack)
- Scheduled jobs that need to survive a laptop sleeping
- Reactive flows (webhooks, emails, file drops)
- "Domain expert needs to see and edit later" cases

### When NOT to use
- Pure document/text production → Cowork wins (rung 3)
- Bespoke logic with rich state and files → Claude Code routine (rung 5)
- One-off scripts → just write Python

### Pairs with
SP-API, Ads MCP, Slack, ClickUp, Supabase, Airtable, Sheets, Anthropic API

### Common patterns
P-09, UW-03 (twice-daily price scrape), UW-07 (review automation fallback), UW-08

### Live docs
- Primary: https://docs.n8n.io
- Context7: `n8n-io/n8n` and `n8n-io/n8n-docs`
- 543-node MCP: see Sim's `n8n-mcp` project

### Pricing
- Self-hosted: Free (server costs only — ~£10-30/mo)
- n8n Cloud Starter: ~$20/mo
- n8n Cloud Pro: ~$50/mo
- **Last verified:** 2026-05-06

### Gotchas
- Webhook URLs change between dev and prod — always parameterise
- Self-hosted on a sleeping laptop = not shipped (P5 violation)
- Long-running workflows can hit execution timeouts; chunk them
- Credentials need rotating proactively; n8n won't warn

---

## 4. Claude Cowork

**Category:** Orchestration (no-code)
**Simplicity rung:** 3
**Cost tier:** Sub (bundled with Claude Pro/Team)
**Auth:** Anthropic account
**Status:** ✅ Vetted

### Purpose
Project-based Claude workspace where non-technical staff can self-serve repeated AI tasks. Documents, drafts, formatted outputs. The "Cowork flow" rung of the Simplicity Ladder.

### When to use
- Branded document generation (POs, QC reports, supplier comms)
- Customer enquiry response drafting
- Anything text-out where a non-technical person needs to operate it
- First check before going to Claude Code or n8n

### When NOT to use
- Anything that needs to run unattended on a schedule
- Multi-system orchestration (no API calls out — Cowork is conversational)
- Persistent state (no real DB; each session resets)

### Pairs with
Brand design system files, Sim's branded-doc flow, internal SOPs

### Common patterns
P-07 (branded documents — flagship), UW-04 reports, UW-06 rollout plans, UW-08 A+ briefs

### Live docs
- Primary: https://claude.ai/projects
- Reference: see Katt Cowork Handover bundle for the worked QC pattern

### Pricing
- Bundled with Claude Pro ($20/mo) or Team ($25/user/mo)
- **Last verified:** 2026-05-06

### Gotchas
- Outputs should NOT be saved back into the project (token bloat + visual drift) — see Katt project-instructions for the discipline
- Best for non-technical staff — designers, QC, CS, brand managers
- The brand design system file is the unlock — without it, outputs look generic

---

## 5. Claude Code

**Category:** Orchestration (developer)
**Simplicity rung:** 5
**Cost tier:** Sub (bundled with Claude Pro/Max)
**Auth:** Anthropic account
**Status:** ✅ Vetted

### Purpose
Claude operating in a developer's local environment. Reads files, writes code, runs commands, integrates with MCPs. Where Claude Code itself runs.

### When to use
- Bespoke logic with files, state, multi-step reasoning
- Integration work (custom SP-API routines, custom n8n companions)
- Anywhere a Cowork project can't reach (filesystem, scheduled execution, custom code)

### When NOT to use
- Tasks a non-technical person needs to operate (Cowork wins)
- Pure orchestration (n8n is the right layer)

### Pairs with
Every MCP in the IDL stack (n8n-mcp, Amazon Ads MCP, Supabase MCP, etc.)

### Common patterns
P-09, P-10, P-11, P-13 (SQL MCP), UW-01, UW-02

### Live docs
- Primary: https://docs.claude.com/en/docs/claude-code
- MCP catalogue: https://github.com/anthropics/claude-code-mcps

### Pricing
- Bundled with Claude Pro ($20/mo) or Max ($100/mo)
- **Last verified:** 2026-05-06

### Gotchas
- Sessions don't auto-persist; use the brain-file pattern (markdown state) for long-running work
- Permissions are per-session; configure `.claude/settings.json` for repeated workflows
- Best paired with hooks for automated formatting/lint/test loops

---

## 6. Anthropic Claude API

**Category:** LLM (direct)
**Simplicity rung:** 5
**Cost tier:** Pay-go
**Auth:** API key
**Status:** ✅ Vetted

### Purpose
Direct programmatic access to Claude models (Sonnet, Opus, Haiku). Use when prompt caching matters, when long-context (1M token) is needed, or when bypassing aggregator pricing makes sense.

### When to use
- Prompt caching scenarios (90% cost reduction on repeated context)
- 1M-context workflows (long documents, codebases, multi-file analysis)
- Production reliability where aggregator availability is a concern

### When NOT to use
- Default LLM work where model choice doesn't matter — OpenRouter (rung 6) gives flexibility
- Quick prototyping — Cowork is faster for non-technical work

### Pairs with
Claude Code, n8n (HTTP request node), custom backends

### Common patterns
P-13 (SQL MCP), P-09 (advanced PPC), most custom builds

### Live docs
- Primary: https://docs.claude.com/en/api/getting-started
- Context7: `anthropic/anthropic-sdk-python`, `anthropic/anthropic-sdk-typescript`

### Pricing
- Sonnet 4.7: ~$3 input / $15 output per 1M tokens
- Opus 4.7: ~$15 input / $75 output per 1M tokens
- Haiku 4.5: ~$1 input / $5 output per 1M tokens
- Prompt caching: 90% discount on cached portions
- **Last verified:** 2026-05-06

### Gotchas
- 1M context is opt-in via header; mind the cost
- Prompt caching has a 5-min TTL — design batches accordingly
- Different SKUs for vision/tools/streaming

---

## 7. OpenRouter

**Category:** Aggregator (LLM)
**Simplicity rung:** 5-6
**Cost tier:** Pay-go (with free models available)
**Auth:** API key
**Status:** ✅ Vetted

### Purpose
Multi-LLM gateway. Single API → access Claude, GPT, Gemini, DeepSeek, Llama, Qwen, and dozens of open-source models. **The aggregator-first default for LLM work.**

### When to use
- Any LLM workflow where model swapping matters (research aggregator behaviour, A/B test outputs)
- When free tier models (Gemini Flash, DeepSeek R1, Qwen) cover the use case
- Cost optimisation across model families
- Default first stop for new LLM integrations

### When NOT to use
- Prompt caching is critical (use Anthropic API direct)
- 1M-context Anthropic-specific features (use Anthropic API direct)

### Pairs with
n8n, Claude Code, custom backends

### Common patterns
Any pattern that uses LLMs but doesn't depend on model-specific features

### Live docs
- Primary: https://openrouter.ai/docs
- Free models list: https://openrouter.ai/models?max_price=0

### Pricing
- Pay-go pricing matches each underlying model's pricing
- Some models genuinely free (Gemini 2.0 Flash Thinking, DeepSeek R1 Distill, etc.)
- **Last verified:** 2026-05-06

### Gotchas
- Model availability changes (free models get retired)
- Some models have slower latency through OpenRouter than direct
- Tool-use compatibility varies per model

---

## 8. Kie AI

**Category:** Aggregator (image/video gen)
**Simplicity rung:** 6
**Cost tier:** Pay-go
**Auth:** API key
**Status:** ✅ Vetted

### Purpose
Multi-model image and video generation gateway. Access ChatGPT Image, Seedance 2, Veo 3, Midjourney, Flux, and others through one API. **The aggregator-first default for creative gen.**

### When to use
- Any image/video generation pipeline where model choice should be swappable
- Pattern P-05 (Sponsored Brand video at scale)
- A/B testing creative across multiple models without rebuilding integrations

### When NOT to use
- Open-source-only models you want to host yourself → fal.ai or local stack (P-14)
- Sub-cent-per-image bulk runs → may be cheaper to run open-source locally

### Pairs with
n8n, Claude Code, branded-doc flow (for prompt templating), Cowork (for non-technical creative ops)

### Common patterns
P-05 (SB video coverage), P-08 (WhatsApp video), creative refresh workflows

### Live docs
- Primary: https://kie.ai/docs

### Pricing
- Pay-go per generation
- Pricing varies dramatically by model (ChatGPT Image ~$0.04/image, Seedance 2 ~$0.20/short clip, Veo 3 higher)
- **Last verified:** 2026-05-06

### Gotchas
- Model lineup changes monthly; build with config-driven model selection
- Latency varies wildly per model (Seedance ~30s, Veo can take 2+ min)
- Some models have content moderation that's stricter than direct vendor

---

## 9. fal.ai

**Category:** Aggregator (open-source models)
**Simplicity rung:** 6
**Cost tier:** Pay-go
**Auth:** API key
**Status:** ✅ Vetted

### Purpose
Open-source model hosting. Flux Pro, Hyper3D Rodin, image-to-3D models, audio gen, fast inference. Where you go when Kie AI is closed-source-heavy and you want OS alternatives.

### When to use
- Image-to-3D generation (Hyper3D Rodin)
- Flux Pro / Schnell for image gen
- Open-source model hosting at scale
- When you've outgrown HuggingFace Inference and need production reliability

### When NOT to use
- Local GPU is available and viable (P-14)
- Closed-source proprietary models (use direct vendor)

### Pairs with
Blender MCP, n8n, Claude Code, ComfyUI workflows

### Common patterns
P-03 (3D base shells via Hyper3D Rodin), P-14 (when local GPU isn't viable)

### Live docs
- Primary: https://fal.ai/docs
- Hyper3D Rodin: https://fal.ai/models/fal-ai/hyper3d/rodin

### Pricing
- Hyper3D Rodin: ~$0.10-0.50 per model
- Flux Pro: ~$0.04-0.08 per image
- Variable per model
- **Last verified:** 2026-05-06

### Gotchas
- Open-source models change rapidly; pin versions for production
- Some models cold-start (first request slow)
- Replicate is the obvious alternative if fal pricing or availability is an issue

---

## 10. SellerApp

**Category:** Amazon intel
**Simplicity rung:** 4
**Cost tier:** Sub
**Auth:** Client ID + Token
**Status:** ✅ Vetted (in IDL stack via DorianFlows)

### Purpose
Comprehensive Amazon product intelligence — product details, reviews, keyword research, rankings, sales estimates. The intel layer for any "what's happening on Amazon" workflow.

### When to use
- Product detail pulls (title, brand, images, BSR, sales estimates)
- Keyword research and ranking position tracking
- Review pulls (10 pages = ~500 reviews per ASIN)
- Competitor intel at scale

### When NOT to use
- Your own brand's data — use SP-API direct
- One-off scrapes — Rainforest pay-go is cheaper at low volume

### Pairs with
n8n (DorianFlows pattern), Claude Code, Supabase (for caching)

### Common patterns
P-12 (US scaling), competitor intel workflows, P-09 PPC

### Live docs
- Primary: https://documenter.getpostman.com/view/27769832/2s93sW7aEX (Postman docs — Sim-flagged, hard to find otherwise)
- Token verification: https://api.sellerapp.com/sellmetricsv2/token_status
- Sim's setup: see `projects/DorianFlows/` for the working n8n integration

### Pricing
- Subscription model — varies by volume tier
- **Last verified:** 2026-05-06

### Gotchas
- Token expiry; rotate periodically
- Marketplace param required (us, uk, de, fr, it, es, ca, mx)
- Realtime data flag adds latency but improves freshness

---

## 11. Rainforest API

**Category:** Amazon intel (scraping)
**Simplicity rung:** 6
**Cost tier:** Pay-go (credit packs)
**Auth:** API key
**Status:** ✅ Vetted

### Purpose
Amazon scraping API. Product, reviews, search results — with **ZIP-rotation** for US scaling visibility. The go-to for any "show me what shoppers in different ZIPs see."

### When to use
- US ZIP-level rank tracking (P-12)
- Hyper-local Prime delivery visibility
- Twice-daily competitor price polls (UW-03)
- One-off scrapes where SellerApp's monthly fee is overkill

### When NOT to use
- Continuous high-volume monitoring → SellerApp sub may be cheaper
- Your own brand's data → SP-API direct

### Pairs with
n8n, Claude Code, Supabase (for caching ZIP-keyed data)

### Common patterns
P-12 (hyper-local intelligence), UW-03 (competitor price tracker)

### Live docs
- Primary: https://www.rainforestapi.com/docs

### Pricing
- Credit packs from $50 (50,000 credits)
- ~1 credit per request
- **Last verified:** 2026-05-06

### Gotchas
- ZIP rotation needs explicit zip parameter; default is generic
- Credit consumption varies per request type (search > product detail)
- Cache aggressively — same ASIN+ZIP doesn't change minute-to-minute

---

## 12. Apify

**Category:** Scraping (general)
**Simplicity rung:** 6
**Cost tier:** Freemium → Pay-go
**Auth:** API token
**Status:** ✅ Vetted

### Purpose
Marketplace of pre-built scrapers ("actors") + custom-actor hosting. TikTok, Instagram, LinkedIn, Google Maps, Amazon (less specialised than Rainforest). The general-purpose scraping default.

### When to use
- Off-Amazon scraping (TikTok creator ops, Google Maps for local intel, LinkedIn for outreach)
- One-off custom scrapes (build an actor, deploy, decommission)
- Multi-source pipelines where you'd otherwise need 3 different APIs

### When NOT to use
- Amazon-specific scraping → Rainforest is purpose-built
- Continuous enterprise-scale → Bright Data has better residential proxies

### Pairs with
n8n, Claude Code, Supabase, custom workflows

### Common patterns
Influencer outreach, off-Amazon brand monitoring, alibaba-sourcing pattern

### Live docs
- Primary: https://docs.apify.com

### Pricing
- Free tier: $5/mo credit
- Pro: $49/mo for $20 credit + scaling
- Pay-go for actor runs and proxy use
- **Last verified:** 2026-05-06

### Gotchas
- Actor quality varies wildly (community-built); read reviews before committing
- Proxy use adds significant cost for high-volume runs
- Some scrapers break when target sites update (LinkedIn especially)

---

## 13. Helium 10

**Category:** Amazon intel (suite)
**Simplicity rung:** 1-2
**Cost tier:** Sub
**Auth:** Account-level
**Status:** ✅ Vetted (recognised as industry standard)

### Purpose
Industry-standard Amazon seller suite. Cerebro (reverse ASIN), Magnet (keyword research), Black Box (product research), Adtomic (PPC), Review Insights, automated review requests, and many more. Most established Amazon sellers have this.

### When to use
- Brand already has it → check what they're not using yet (Sim's "rung 1" — already owned, untouched)
- Review request automation (UW-07) — Helium 10 includes this
- Keyword research where Cerebro/Magnet UI is faster than building a custom flow

### When NOT to use
- Brand doesn't have it and the use case is narrow — direct API integrations are cheaper
- High-volume programmatic — Helium 10 has API but it's not the strength

### Pairs with
N/A — Helium 10 is the suite

### Common patterns
UW-07 (review automation), keyword research workflows, listing optimisation

### Live docs
- Primary: https://www.helium10.com
- API docs: https://api-docs.helium10.com

### Pricing
- Starter: ~$39/mo
- Platinum: ~$99/mo
- Diamond: ~$249/mo (includes Adtomic)
- **Last verified:** 2026-05-06

### Gotchas
- API access requires Diamond tier or higher
- Adtomic placement-modifier rules are notoriously opaque ("placement modifiers awol" — Sim's anti-pattern)
- Sub stacks fast when delegate already pays for Helium 10 + SellerApp + ClickUp + Power BI

---

## 14. Data Dive

**Category:** Amazon intel (niche research)
**Simplicity rung:** 1-2
**Cost tier:** Sub
**Auth:** Account
**Status:** ✅ Vetted (in IDL stack — has slash command + MCP)

### Purpose
Niche research and keyword competitive analysis. Used widely by mature Amazon brands for product research, opportunity finding, and ranking analysis.

### When to use
- Product research — competitive landscape, niche analysis, opportunity scoring
- Keyword roots and ranking juices analysis
- "Should we launch in X niche?" decisions

### When NOT to use
- Real-time PPC optimisation (use Ads MCP)
- Listing-level performance tracking (use SP-API SQPR)

### Pairs with
SellerApp, Helium 10, Claude Code (via the datadive-mcp)

### Common patterns
Product research workflows (founder-side, pre-launch decisions)

### Live docs
- Primary: https://datadive.tools
- Sim's MCP: see `projects/datadive-mcp/`

### Pricing
- Subscription tiers vary; full pricing on their site
- **Last verified:** 2026-05-06

### Gotchas
- Strong tool but most powerful when paired with someone who knows the niche-vetting framework
- API access on higher tiers; check before recommending API workflows

---

## 15. Supabase

**Category:** Data layer
**Simplicity rung:** 5-7
**Cost tier:** Freemium → Sub
**Auth:** Project keys (anon + service)
**Status:** ✅ Vetted

### Purpose
Postgres database + auth + realtime + storage + edge functions. The default DB for any custom build at IDL.

### When to use
- Custom apps needing a real DB (P-06 creator CRM, P-13 SQL MCP, custom dashboards)
- Anywhere "Sheets is brittle but we don't need full enterprise"
- Fast prototyping with auth + DB out of the box

### When NOT to use
- Read-only data — Sheets/Airtable simpler
- Massive scale — go Postgres direct + dedicated infra

### Pairs with
Next.js, Vercel, n8n, Claude Code, Anthropic SDK

### Common patterns
P-06, P-13, ProgressiveOverloadApp pattern, kent-11plus-prep pattern

### Live docs
- Primary: https://supabase.com/docs
- Context7: `supabase/supabase`

### Pricing
- Free tier: 2 projects, 500MB DB, 5GB bandwidth
- Pro: $25/mo per org
- **Last verified:** 2026-05-06

### Gotchas
- Anon key vs service key — get this wrong and you've leaked DB access
- RLS (Row-Level Security) is critical for any multi-tenant build
- Permissive RLS for IDL family apps is fine; not for delegate-facing builds

---

## 16. ClickUp

**Category:** Data layer + ops
**Simplicity rung:** 1-2
**Cost tier:** Freemium → Sub
**Auth:** API token
**Status:** ✅ Vetted (operating system at IDL)

### Purpose
Project/task management with deep API + automation layer. Sim's chosen operating system for the business.

### When to use
- Anywhere tasks/projects/handoffs live
- Build the operating system around ClickUp (Sim case 15)
- Coach delegates to use ClickUp Automations as Rung 2 alternatives to n8n flows

### When NOT to use
- Pure data warehouse needs (Supabase or Postgres)
- Real-time messaging (Slack)

### Pairs with
n8n, Slack, Claude Code (via clickup MCP)

### Common patterns
P-15 (ClickUp OS), nearly every ops-layer hunt

### Live docs
- Primary: https://clickup.com/api
- Sim's MCP: see workspace `mcp__218c13a0-...__clickup_*`

### Pricing
- Free tier: limited automations + features
- Unlimited: $7/user/mo
- Business: $12/user/mo
- AI add-on: $7/user/mo (this is where the agent layer lives)
- **Last verified:** 2026-05-06

### Gotchas
- Folder/list/task hierarchy is rigid; plan it carefully
- AI features require the AI add-on subscription
- Custom field types are powerful but cause API complexity

---

## 17. Figma + Plugin SDK

**Category:** Creative
**Simplicity rung:** 1-2
**Cost tier:** Freemium → Sub
**Auth:** Personal access token (for plugins) + Figma account
**Status:** ✅ Vetted

### Purpose
Industry-standard design tool. With the plugin SDK, becomes the source-of-truth for image production pipelines that push to Amazon.

### When to use
- Pattern P-01 (Amazon image upload via Figma plugin)
- Brand-asset management + per-marketplace localisation
- Designer-led workflows where the design team should own the source-of-truth

### When NOT to use
- Pure programmatic image gen (use Nano Banana / Kie AI / fal.ai direct)
- Non-design teams (Cowork is friendlier)

### Pairs with
SP-API (for upload destination), Nano Banana (for in-Figma gen), n8n

### Common patterns
P-01, P-02, all design-led builds

### Live docs
- Primary: https://www.figma.com/plugin-docs
- AI features: https://help.figma.com/hc/en-us/articles/24004711402135

### Pricing
- Free tier: 3 files, basic features
- Professional: $15/user/mo
- Organisation: $45/user/mo
- **Last verified:** 2026-05-06

### Gotchas
- Plugin development requires TypeScript + Figma plugin sandbox knowledge
- Plugin distribution: private (org-only) vs published (community)
- AI features require Organisation tier or higher

---

## 18. Nano Banana (Gemini Image)

**Category:** Creative (image gen)
**Simplicity rung:** 5-6
**Cost tier:** Pay-go
**Auth:** Google AI API key
**Status:** ✅ Vetted (in IDL stack)

### Purpose
Google's premier image generation model. Texture wrap, in-painting, image-to-image transformation. Used in IDL's product imagery pipeline (3D base + Nano Banana texture wrap).

### When to use
- Product imagery refresh and texture wrap (P-03)
- Brand-consistent image variations
- Pattern-based image gen where brand brief is detailed

### When NOT to use
- Open-source-only requirements (use Flux on fal.ai)
- Video work (use Seedance 2 / Veo / Kie AI)

### Pairs with
3D base render (Blender / Hunyuan3D / Tripo3D), Figma plugin, Cowork

### Common patterns
P-03, all imagery refresh workflows

### Live docs
- Primary: https://ai.google.dev/gemini-api/docs/imagen
- Via Kie AI: aggregator-first option

### Pricing
- Direct: ~$0.04 per image
- Via Kie AI: marginally higher with aggregator markup
- **Last verified:** 2026-05-06

### Gotchas
- Quality bar is high but consistency requires careful prompting
- Best paired with reference imagery for brand consistency
- Some content categories restricted

---

## 19. Tripo3D

**Category:** Creative (image-to-3D)
**Simplicity rung:** 6
**Cost tier:** Freemium → Pay-go
**Auth:** API key
**Status:** ✅ Vetted

### Purpose
Image-to-3D model generator with the cleanest topology of any AI tool. Generates quad-based meshes that downstream tools (Blender, Nano Banana texture wrap) handle better.

### When to use
- Image-to-3D where the mesh will be edited downstream (Tripo's quad topology = clean edits)
- Multi-view input (Amazon listing images, multi-angle product shots)
- Free-tier experimentation before committing to paid scale

### When NOT to use
- Highest-fidelity texture wrap needed → Hyper3D Rodin via fal.ai
- Local-stack overnight processing → Hunyuan3D-2 self-hosted

### Pairs with
Blender MCP, Nano Banana (for downstream texture wrap), Rainforest API (for sourcing Amazon images)

### Common patterns
P-03 (when image-to-3D is needed), product imagery scaling workflows

### Live docs
- Primary: https://www.tripo3d.ai

### Pricing
- Free tier: ~200 free credits to start
- Pay-go for higher quality / commercial use
- **Last verified:** 2026-05-06

### Gotchas
- Quality varies by input image quality; use clean white-background product shots
- Multi-view support is paid feature
- Mesh export formats: GLB, OBJ, FBX

---

## 20. Blender + Blender MCP

**Category:** Creative (3D)
**Simplicity rung:** 5
**Cost tier:** Free
**Auth:** Local install + Anthropic-shipped or `ahujasid/blender-mcp` community version
**Status:** ✅ Vetted (free + open source)

### Purpose
Industry-standard 3D suite. Free. With the MCP, Claude can drive Blender directly — generate scenes, materials, lighting, exports. Automates the 3D base shell step in P-03.

### When to use
- 3D base shell creation in product imagery pipeline (P-03)
- Mesh cleanup after image-to-3D (Tripo3D, Hyper3D Rodin output)
- Any 3D work where AI handles the heavy lifting

### When NOT to use
- Real photoshoot quality needed (recognise the ceiling — P-04 Yogii lesson)
- Highly organic shapes (fabric, hair, food close-ups)

### Pairs with
Tripo3D, Hyper3D Rodin via fal.ai, Nano Banana, Hunyuan3D-2

### Common patterns
P-03, P-14 (local stack)

### Live docs
- Primary: https://www.blender.org/lab/mcp-server
- Community alt: https://github.com/ahujasid/blender-mcp

### Pricing
- Blender: Free
- MCP: Free
- **Last verified:** 2026-05-06

### Gotchas
- First-time Blender setup is non-trivial; budget half a day
- MCP access varies between official and community versions
- Built-in Hyper3D Rodin endpoint in `ahujasid/blender-mcp`

---

## 21. Slack

**Category:** Comms
**Simplicity rung:** 1-2
**Cost tier:** Freemium → Sub
**Auth:** Bot token (per workspace)
**Status:** ✅ Vetted

### Purpose
Team chat + workflow alerts + slash-command-driven custom interactions. Default destination for n8n/Claude Code alerts at IDL.

### When to use
- Daily/hourly digests from automation flows (BSR alerts, PPC alerts, OOS alerts)
- Slash-command-driven Claude bots (Sim's `amazon-listing-bot` pattern)
- Internal team comms

### When NOT to use
- Customer-facing comms (email / WhatsApp Business)
- Heavy file/document collaboration (Notion/ClickUp)

### Pairs with
n8n (Slack node), Claude Code (slack MCP), Anthropic API

### Common patterns
UW-03 alerts, P-09 PPC alerts, almost every n8n flow's notification layer

### Live docs
- Primary: https://api.slack.com/apps

### Pricing
- Free: limited message history
- Pro: $7.25/user/mo
- Business+: $12.50/user/mo
- **Last verified:** 2026-05-06

### Gotchas
- Bot token rotation isn't automatic; rotate manually per workspace
- Free-tier message-history limit makes long-term archival impossible — pair with Slack export to S3 if needed
- Channel-level permissions matter for bot deployments

---

## 22. Vercel

**Category:** Hosting
**Simplicity rung:** 5-6
**Cost tier:** Freemium → Sub
**Auth:** GitHub OAuth + project-level deploy hooks
**Status:** ✅ Vetted

### Purpose
Frontend hosting + serverless functions. Default deploy target for Next.js apps in IDL stack.

### When to use
- Next.js / React apps (idl-homepage, ProgressiveOverloadApp, etc.)
- Serverless API routes (lightweight backends)
- Per-PR preview deployments for design review

### When NOT to use
- Long-running backend jobs (Vercel functions have 60s/300s caps)
- Heavy WebSocket / real-time work (use Render / Railway / Fly.io)
- Static sites (Netlify is cheaper at scale)

### Pairs with
Next.js, Supabase, Anthropic API

### Common patterns
P-06 creator CRM, P-13 Power BI replacement frontend, custom dashboards

### Live docs
- Primary: https://vercel.com/docs

### Pricing
- Hobby: Free
- Pro: $20/user/mo
- Enterprise: custom
- **Last verified:** 2026-05-06

### Gotchas
- Function timeout limits matter — pre-deploy check
- Edge runtime vs Node runtime — pick correctly per function
- Per-deployment cost can balloon with many preview branches

---

## Coverage status

22 of ~55 target Tier 1 entries delivered. Remaining gaps include: Brand Analytics (broken out), Vendor Central API, Amazon DSP, Keepa, Jungle Scout, Bright Data, ScrapingBee, Firecrawl, SerpAPI, video-gen models (Seedance 2 / Veo 3 / Sora / Runway / Pika / Kling / Hailuo / Luma), Hyper3D Rodin, Hunyuan3D-2, Airtable, Notion, Sheets, Power BI deeper, Postgres, WhatsApp Business API, Outlook MCP, SendGrid / Postmark / Mailgun, Twilio, Render, Railway, Cloudflare Workers, Firecrawl/Sequential-Thinking/Filesystem/Context7 MCPs.

When a delegate names one of these, drop to `tier2.md` for the recognition card; queue the tool for promotion-to-Tier-1 if it recurs across roadmaps.