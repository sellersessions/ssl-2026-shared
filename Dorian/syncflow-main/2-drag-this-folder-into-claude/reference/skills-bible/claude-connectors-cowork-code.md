# Claude Connectors: CoWork & Claude Code — Complete Integration Guide
*Research compiled: May 2026 | Lens: Amazon / ecommerce brands*

---

## What Are Connectors?

Connectors are the bridge between Claude and the outside world. They let Claude read your data, take actions inside your tools, and work across multiple apps in a single conversation — without you copy-pasting anything.

There are three layers to understand:

1. **Official Connectors** — One-click integrations curated by Anthropic, available in the Claude Connectors Directory (claude.com/connectors). Maintained and verified by the partner companies themselves.
2. **MCP Servers** — Model Context Protocol (open standard). Any tool can build one. Thousands exist in the wild; 75+ are in Anthropic's official registry. This is the engine under the hood of every connector.
3. **Custom Remote MCP** — You (or a developer) build and host a private MCP server pointing at any internal API, database, or proprietary tool. This is how companies connect Claude to their own infrastructure.

---

## The Two Deployment Contexts

### Claude CoWork (Desktop App)
The consumer/business-facing interface. Connectors are set up via the **Customize** menu and work conversationally — Claude can read your Slack, pull a Google Drive doc, check your calendar, and draft a response all in one thread. Available across Free, Pro, Max, Team, and Enterprise plans (paid plans required for most connectors; Free users get 1 custom connector).

### Claude Code (CLI / Terminal)
The developer-facing agent. MCP servers are configured in `~/.claude/settings.json` and invoked programmatically during agentic coding and automation tasks. Optimized for pipelines — a single Claude Code session can hit multiple MCP servers, write code based on the data it reads, commit to GitHub, and deploy. MCP Tool Search (lazy loading) reduces context usage by up to 95%.

Both environments share the same MCP protocol — a server built for one works in the other.

---

## Official Anthropic Connectors Directory (75+ as of May 2026)

### Productivity & Workplace
| Connector | What Claude can do |
|---|---|
| **Google Drive** | Read, search, and summarize documents |
| **Gmail** | Read, draft, send, label, delete emails |
| **Google Calendar** | Create, update, query events; suggest meeting times |
| **Slack** | Read channels/threads, send messages, search conversations |
| **Microsoft 365 (Word, Excel, PowerPoint)** | Create and edit Office files, cross-app workflows |
| **Outlook** | Read and send emails |
| **OneDrive / SharePoint** | Access and manage files |
| **Notion** | Read/write pages and databases |
| **GitHub** | Read issues/PRs, commit code, manage branches |
| **Asana** | Create and update tasks and projects |
| **Jira** | Manage tickets and sprints |
| **HubSpot** | CRM data, contacts, deals, pipelines |
| **Salesforce** | Accounts, leads, reports, opportunity management |
| **Snowflake** | Query data warehouse with natural language |

### Creative & Design (Launched April 28, 2026)
| Connector | What Claude can do |
|---|---|
| **Adobe Creative Cloud** | Work across Photoshop, Premiere, Express, and 50+ apps |
| **Blender** | Analyze/debug scenes, write batch scripts |
| **Figma** | Access live design context for code generation |
| **Autodesk Fusion** | Connect AI to Fusion design environment |
| **SketchUp** | Turn conversation into 3D modeling starting point |
| **Ableton** | Grounded answers in Live and Push documentation |
| **Splice** | Search royalty-free sample catalog |
| **Affinity by Canva** | Creative design work |
| **Resolume Arena / Wire** | AV performance tools |

### Commerce & Finance
| Connector | What Claude can do |
|---|---|
| **Shopify AI Toolkit** | Query products, orders, customers, analytics, metafields with natural language. Open-sourced April 9, 2026 (MIT license) |
| **Klaviyo** | Access real-time customer behavior data; 200,000+ brands connected |
| **Intuit TurboTax** | Tax planning and preparation |
| **Intuit Credit Karma** | Financial insights |

### Everyday Life (Consumer Connectors)
AllTrails, Audible, Booking.com, Instacart, Resy, Spotify, StubHub, Taskrabbit, Thumbtack, Tripadvisor, Uber, Uber Eats, Viator

### Healthcare & Life Sciences
Benchling, 10x Genomics, PubMed, BioRender, Synapse.org, Wiley Scholar Gateway, HealthEx, Function (beta)

---

## Amazon-Specific MCP Ecosystem

This is where it gets serious for Amazon brands. There is no Amazon Seller Central in Anthropic's official directory yet, but the MCP ecosystem has Amazon covered across every critical surface.

### Amazon Ads MCP Server — OFFICIAL (Open Beta since Feb 2, 2026)
**Source:** advertising.amazon.com/API/docs/en-us/mcp/mcp-overview

Amazon Ads officially launched its MCP server into open beta, available globally to Amazon Ads API partners with active credentials. This is the biggest development for Amazon brands wanting to use Claude as an ads agent.

**What it can do (50+ tools):**
- **Campaign creation** — End-to-end Sponsored Products campaign setup in a single prompt (handles campaign creation, ad group setup, and ad creation in one workflow)
- **Marketplace expansion** — Launch campaigns to a new country with a single command
- **Bid optimization** — Adjust bids and budgets across active campaigns
- **Performance reporting** — Pull detailed reports across all ad types
- **Sponsored Products** — Full read/write access
- **Sponsored Brands** — Full read/write access
- **Sponsored Display** — Full read/write access
- **DSP (Demand-Side Platform)** — Access and management
- **Amazon Marketing Cloud (AMC)** — Analytics queries
- **Account settings** — View and manage configurations
- **Billing & financial data** — View financial summaries

**Access requirement:** Amazon Ads API credentials (partner account)

**Use with Claude:** Connect in Claude Code for automated agentic ad management; connect in CoWork for conversational campaign oversight.

### Amazon Seller Central — Via Porter Metrics MCP
Amazon doesn't have an official Seller Central MCP yet, but Porter Metrics fills the gap: 133 Amazon Seller fields and metrics at every reporting level, blendable with Google Ads, GA4, Shopify, HubSpot, and more in a single prompt.

### Key Third-Party Amazon Tools with MCP Support
| Tool | MCP Availability | What It Enables |
|---|---|---|
| **Klaviyo** | Official remote MCP | Email/SMS automation connected to live customer data |
| **Shopify AI Toolkit** | Official (open source) | Sync Amazon brand with Shopify store operations |
| **Meta Ads MCP** | Official (launched April 29, 2026) | Cross-channel ad management alongside Amazon |
| **Google Analytics 4** | Via third-party MCPs | Web traffic analysis blended with sales data |
| **Admaxxer** | MCP-compatible | DTC analytics + AI ad operations; tracks $1.2B+ GMV |

---

## How Connections Work: Three Methods

### Method 1 — One-Click Connectors (CoWork)
For tools in the official Anthropic directory. Go to **Customize → Connectors → Browse Directory**, click the connector, authenticate with OAuth, done. No setup required.

**Best for:** Slack, Gmail, Notion, Google Drive, HubSpot, Shopify, Klaviyo

### Method 2 — Remote MCP URL (CoWork + API)
For any MCP server hosted on the internet (third-party vendors, or your own server). In CoWork: **Customize → Connectors → Add Custom Connector → paste the MCP server URL**. Optionally add OAuth credentials.

In the API: Include MCP server definition in your Messages API request with the header `anthropic-beta: mcp-client-2025-11-20`.

**Best for:** Amazon Ads MCP, Porter Metrics, specialty tools not in Anthropic's directory

### Method 3 — Local MCP (Claude Code)
Install and run the MCP server locally, then register it in `~/.claude/settings.json`. Claude Code discovers and calls it during agentic sessions.

**Best for:** Internal databases (PostgreSQL, Supabase, MongoDB), private APIs, development tools, custom internal tooling

```json
// Example: ~/.claude/settings.json
{
  "mcpServers": {
    "amazon-ads": {
      "command": "npx",
      "args": ["@amazon-ads/mcp-server"],
      "env": {
        "AMAZON_ADS_CLIENT_ID": "...",
        "AMAZON_ADS_CLIENT_SECRET": "..."
      }
    }
  }
}
```

---

## Plugins: The Next Layer Up

Plugins are bundles of Skills + Connectors + Sub-agents packaged together. Instead of configuring each piece individually, a plugin gives Claude a complete role-specific setup from the first conversation.

**Marketplace stats (May 2026):**
- 4,200+ skills available
- 770+ MCP servers
- 2,500+ marketplaces

**How to install in CoWork:** Customize → Plugins → Browse → Install  
**How to install in Claude Code:** `/plugin` → Discover tab, or `/plugin marketplace add [URL]`

**Anthropic's open-source plugin repo:** github.com/anthropics/knowledge-work-plugins — covers sales, finance, legal, marketing, HR, engineering, design, and operations roles.

### Building Custom Plugins
Organizations can build and distribute private plugins through their own plugin marketplace. Plugins bundle:
- **Skills** — SKILL.md instruction files that shape Claude's behavior for specific tasks
- **Connectors** — MCP connections to the tools the plugin needs
- **Sub-agents** — Specialized Claude agents for subtasks

Enterprise orgs can lock plugin configurations so individual employees can't reconfigure them.

---

## How to Build a Custom MCP (For Internal Tools)

When no public connector exists for your internal system (custom ERP, proprietary inventory tool, internal analytics), you build your own MCP server. This is how companies connect Claude to their own infrastructure.

**Available frameworks:**
- **Python** — FastMCP (fastest to write, great for data-heavy tools)
- **TypeScript/Node** — MCP SDK (best for web APIs)
- **Go / Rust** — Available for performance-critical servers

**Deployment options:**
- **Local** — Run on the developer's machine, registers with Claude Code via config file
- **Remote (hosted)** — Deploy to any server, paste URL into CoWork's Custom Connector field. Users authenticate with OAuth.

**API access:** The Claude Messages API supports MCP connector definitions directly in the request body. Requires the `anthropic-beta: mcp-client-2025-11-20` header. You handle OAuth token acquisition and refresh.

**Resources:**
- modelcontextprotocol.io — official open protocol spec
- platform.claude.com/docs/en/agents-and-tools/mcp-connector — API docs
- support.claude.com/en/articles/11503834 — Build custom connectors guide

---

## Amazon Company: Recommended Connector Stack

For an Amazon-focused brand or agency, here's the connector architecture worth building:

### Tier 1 — Connect These First (High ROI, Easy Setup)
| Tool | Method | Why |
|---|---|---|
| **Amazon Ads MCP** | Remote MCP URL | Campaign creation, bid management, AMC queries — all from Claude |
| **Klaviyo** | Official connector | Email flows informed by Amazon purchase behavior |
| **Slack** | Official connector | Get Claude into team comms; send summaries, alerts, reports |
| **Google Drive** | Official connector | SOPs, brand assets, briefs — all searchable by Claude |
| **Notion** | Official connector | Product databases, content calendars, project tracking |

### Tier 2 — Add for Operations
| Tool | Method | Why |
|---|---|---|
| **Shopify AI Toolkit** | Remote MCP | If running D2C alongside Amazon; inventory and order sync |
| **Porter Metrics MCP** | Remote MCP | Amazon Seller Central metrics + blended channel reporting |
| **Meta Ads MCP** | Remote MCP | Cross-channel ad management in one Claude session |
| **HubSpot or Salesforce** | Official connector | B2B/wholesale pipeline management |
| **Snowflake** | Official connector | Warehouse-level analytics with natural language queries |

### Tier 3 — Build Custom (Advanced)
| Tool | Method | Why |
|---|---|---|
| **Internal inventory/ERP** | Custom MCP | Give Claude read access to real-time stock levels |
| **Proprietary analytics** | Custom MCP | Connect Claude to internal BI data |
| **Supplier portal/3PL** | Custom MCP | Automate reorder alerts, shipment status queries |

---

## Key Limitations to Know

- **Free plan:** Limited to 1 custom connector; official connectors available but limited actions
- **Amazon Seller Central:** No official Anthropic connector yet — requires Porter Metrics MCP or building a custom SP-API MCP
- **Amazon Brand Registry / Vine / A+ Content:** No official MCP — these would require custom SP-API integration
- **Data security:** Remote MCP connections send data to Claude's API. Enterprise plans offer additional data residency and privacy controls
- **Rate limits:** MCP servers are subject to the underlying API's rate limits (e.g., Amazon Ads API throttling applies even when accessed via Claude)
- **OAuth token management:** For custom remote MCPs, your app handles OAuth flow and token refresh — not Claude

---

## Resources

- [Claude Connectors Directory](https://claude.com/connectors)
- [Use Connectors — Help Center](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities)
- [Custom Connectors via Remote MCP — Help Center](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)
- [Build Custom Connectors — Developer Guide](https://support.claude.com/en/articles/11503834-build-custom-connectors-via-remote-mcp-servers)
- [MCP Connector — API Docs](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector)
- [Amazon Ads MCP Server Overview](https://advertising.amazon.com/API/docs/en-us/mcp/mcp-overview)
- [Amazon Ads MCP Open Beta Announcement](https://advertising.amazon.com/library/news/amazon-ads-mcp-server-open-beta)
- [Shopify AI Toolkit](https://github.com/Shopify/Shopify-AI-Toolkit)
- [Klaviyo MCP Announcement](https://www.klaviyo.com/blog/klaviyo-data-in-claude)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Anthropic Open-Source Knowledge Work Plugins](https://github.com/anthropics/knowledge-work-plugins)
- [Claude Code MCP Docs](https://code.claude.com/docs/en/mcp)
- [Plugins in Claude Cowork — Help Center](https://support.claude.com/en/articles/13837440-use-plugins-in-claude-cowork)
