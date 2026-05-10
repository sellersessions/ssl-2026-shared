# `run-interview`

**When**
- After `onboard-delegate` + `init-brain` complete
- User says: *"next section"* / explicit section name / *"continue interview"*
- Resuming a session where the brain has partial data

**Inputs**
- in-context `brain` object — read before each batch (skip questions whose answers already exist)
- `<brand-slug>` — passed from onboarding

**Tools**
- chat — ask the open question, listen, probe
- `read-brain` — load brain into context
- `capture-fact` — append answers
- FS — append to `interview-transcript.md` after every exchange

**Outputs**
- `brain.email_suite`, `brain.revenue_band` populated *(top-level — added schema 1.1)*. `brain.wispr_flow` populated **only when the consultant aside fires and the delegate responds** *(see § Consultant asides)* — null otherwise.
- `brain.sections.{business, team, stack, goals}` populated *(legacy section paths kept; the 5-section interview order maps onto them)*
- `brain.transcript` complete
- Brain status: ready for `diagnose-sprawl`

---

## The 5 sections — order is locked *(Track F · Sim test-run #14: Goals + capacity surface up front)*

```
1. Identity              ~3-4 min · 3 batches
2. Goals + capacity      ~3-4 min · 3 batches   ← Track F new position
3. Stack                 ~6 min   · 6 batches   ← longest; opens with email-suite
4. Pain                  ~3-4 min · 2 batches
5. Aspirations           ~2-3 min · 1 batch
                         ─────────
                         ~17-21 min total
```

**Why the reorder (Sim #14):** Previous order — Business → Team → Stack → Goals — buried "where you're heading" until minute 12, so delegates calibrated stack answers without the vision frame. Goals + capacity now land at minute ~4; every Stack answer follows "is this getting me to that vision."

**Why Pain split from Aspirations (Sim #5):** One Goals batch asking *"what's broken AND what would you build"* produced shallow answers on both. Pain runs first *(concrete, easy to surface)* → Aspirations last *(gets the verbatim magic-wand answer that anchors Page 09's future-state narrative)*.

**Why a top-level email_suite + revenue_band capture (Sim #1, #16):** Two facts shape every downstream calculation — bundled-tool detection (drives F2's prerequisite + bundled exclusions) and the capacity / scope filter (drives F3's revenue-band drop + capacity-fit envelope). Captured as named top-level fields *(not buried in `sections.team`)* so the diagnosis logic stays readable and a v1.5 hosted brain row has them as first-class columns.

**Why `wispr_flow` is opportunistic, not structured (Sim #10, revised 2026-05-08):** The original F1 spec asked Wispr as a forced Section 2 question. Sim flagged that as making the interview feel like a sales funnel. Now: Wispr Flow is a **consultant aside** *(see § Consultant asides below)* — raised once when an organic trigger fires *(heavy typing surfaces, glue-human in comms, etc.)*, walked through inline if interest is expressed, otherwise silent. The brain field stays for opportunistic capture; if the trigger never fires, `wispr_flow` stays `null` and the PDF doesn't push it.

Run sections in order. Transition crisply between sections — see "Transitions" below.

---

## Per-batch pattern

Each batch follows the same shape:

1. **Open with the wide question.** No preamble. No multi-question stacking. *One* open question — though a single open can ask for two related facts at once *(e.g. "vision + who's in the room")*.
2. **Present numbered options** where the answer space is bounded *(revenue band, channels, model, tools, capacity, maintenance tolerance)* — see "Question presentation rule" below. Skip option sets for genuinely free-text questions *(brand description, vision, "what's broken", "the one bottleneck")*.
3. **Listen to the full answer.** Don't interrupt with probes if the open answer covers the captured facts.
4. **Probe only thin parts.** If a fact wasn't named — ask the specific probe. Don't probe what was already covered. *(Track F · Sim #15: probing follow-ups are now mandatory in Section 3 — see "Probe families" below.)*
5. **Capture facts** (silently, via `capture-fact`) as the answer reveals them.
6. **Advance** to the next batch. No *"got it!"*, no *"great!"*. Just the next open question.

---

## Question presentation rule *(reduces typing, speeds the interview)*

Where a question has a bounded answer space, **always present numbered options + an explicit "(custom)" escape**. The delegate replies with a digit (`2`), a comma list (`1,3,5`), or free text. Multi-select where the question is multi-answer; single where it's single.

### Format

```
<one-line open question>

Pick what fits — reply with a number, comma-separated list, or write your own:

  01  <option A>
  02  <option B>
  03  <option C>
  04  <option D>
  05  <option E>
  99  (custom — describe in your own words)
```

Two-digit padding so vertical alignment stays clean past 9 options. **`99` is always the custom escape**, regardless of how many options precede it — delegates learn it once.

### Reply parsing *(this is `capture-fact`'s job, not the interview's)*

| Reply pattern | Behaviour |
|---|---|
| `2` | Capture option 02 only |
| `1,3,5` or `1, 3, 5` | Multi-select: capture options 01, 03, 05 |
| `99` | Prompt for free text in the next message |
| `99: we use SellerApp` | Inline custom — capture the text after the colon |
| `2 and we also use SellerApp` | Mixed: capture option 02 + free-text addition |
| `none` | Capture null for the category |
| anything non-numeric | Free text path — capture verbatim |
| out-of-range digit | Re-ask once: *"just a number from the list, or `99` to write your own"* |

### When NOT to use options

- The brand-description question *("what you sell, who it's for, where you sit")* — needs a real sentence, not a tick.
- The 12-month vision — verbatim phrasing is the value.
- *"What's the single biggest bottleneck"* — same.
- *"What's stopped you from building it already"* — same.
- Anything diagnostic of the delegate's own thinking. Options anchor; that's bad here.

### When TO use options

- Bounded enums *(revenue band, headcount band, capacity band, maintenance tolerance, tool fluency level, growth posture, model, founder involvement, why_not_yet)*.
- Tool selection *(every Stack-section category — Listings, Ads, Analytics, Inventory, etc.)*.
- Channel mix.
- Email/comms suite.

The option lists below are **defaults** — adapt them to what the open answer surfaced. If the delegate already named "Helium 10" while answering an earlier batch, drop it from the options in a later one or pre-select it.

---

## Probe families *(Track F · Sim #15 — probing follow-ups are now mandatory)*

Sim's test-run flagged that the v1.0 interview asked the open question and accepted the first answer too quickly. Three probe families now fire in Section 3 (Stack) and one in Section 4 (Pain):

**(a) "What have you already tried"** *(Sim #15 · fires in Section 3 Batch 1 after each major category)* — surfaces failed automations / abandoned tools / pilots that died after 2 weeks. Captured as `stack.tried_and_dropped[]` so we don't recommend the same path twice.

**(b) "What does it actually cost"** *(Sim #13 · fires in Section 3 Batch 1 per tool)* — replaces the v1.0 *"rough monthly spend across all of these?"* with a per-tool cost probe. Three valid answers: a number in GBP, *"bundled"* *(if covered by email_suite)*, or *"unknown — best estimate"* which gets stored as `monthly_cost: "unknown (est. £X)"`.

**(c) "What breaks when X is on holiday"** *(retained from v1.0 · fires in Section 4 Batch 1)* — exposes glue-human dependencies the delegate doesn't see as fragile because they've never broken.

**(d) "Who's actually building vs running"** *(fires in Section 2 Batch 2)* — splits the team's stated capacity into build-relevant vs day-to-day-running, so F3's capacity-fit filter doesn't double-count.

---

## Section 1 · Identity *(~3-4 min, 3 batches)*

### Batch 1 — *"Tell me about the brand"*

**Open:** *"Tell me about your brand — what you sell, who it's for, and where you sit in the market."*

**Captures:**
- `brand_name` *(already from onboarding)*
- `category` — what they sell (pet supplements, kitchen gadgets, etc.)
- `years_in_business`
- `market_position` — leader / challenger / niche

**Probes (if thin):**
- *"What category specifically?"*
- *"Leader, challenger, or niche?"*
- *"How long have you been at it?"*

### Batch 2 — *"Walk me through the scale"*

**Open:** *"Walk me through the scale. Three things: rough monthly revenue band, where you sell, and SKU count."*

**Option sets** *(present after the open question)*:

```
Monthly revenue band — pick one:
  01  Sub $100k / month     (just launched / pre-PMF)
  02  $100k – $500k / month (early growth)
  03  $500k – $2M / month   (scaling)
  04  $2M – $5M / month     (mid-market)
  05  $5M+ / month          (mature / multi-brand)
  99  (custom)

Channels — pick all that apply:
  01  Amazon US
  02  Amazon UK
  03  Amazon EU
  04  Direct-to-consumer (own site)
  05  Wholesale (B2B)
  06  Retail (physical)
  07  TikTok Shop
  08  Other marketplaces (Walmart, eBay, etc.)
  99  (custom)
```

**Captures:**
- `monthly_revenue_band` — selected band *(narrative — Section 2 Batch 3 captures the structured `revenue_band` enum)*
- `channels` — multi-select
- `sku_count` — number *(free text — just ask)*
- `top3_concentration` — % from top 3 SKUs *(free text — just ask)*

### Batch 3 — *"How do you operate?"*

**Open:** *"How does the business actually operate? Model, growth posture, launch cadence."*

**Option sets:**

```
Model — pick one:
  01  Private label (own brand, own products)
  02  Reseller / arbitrage
  03  White label (others' products, your brand)
  04  Hybrid (mix of above)
  99  (custom)

Growth posture next 12 months — pick one:
  01  Consolidate — fix what we have, no new launches
  02  Scale current SKUs — push winners harder
  03  Launch new products — expand the range
  04  Expand channels — go into new marketplaces / D2C
  05  All of the above
  99  (custom)
```

**Captures:**
- `model` — selected
- `growth_posture` — selected
- `launch_cadence` — launches per year *(free text — just ask)*

### Section 1 close

Write captured facts to in-context brain (`sections.business`) → **brief in-chat verification** *(no artifact emission yet — Milestone 2 is at end of Stack)*:

> *"Identity captured: <2-3 word summary, e.g. 'pet supplements, $500k–2M, 35 SKUs, scaling phase'>. Anything off? If it looks right, say 'continue' and we'll cover Goals + capacity — that's where this gets specific to your team."*

Wait for confirmation, then transition:

> *"Identity locked. Now Goals + capacity — what winning looks like and what your team can actually take on."*

---

## Section 2 · Goals + capacity *(~4-5 min, 3 batches — Track F new position)*

This used to be Section 4. It moves up because the rest of the interview only makes sense if I know (a) what you're building toward and (b) what your team can absorb.

### Batch 1 — *"Where you're heading + who's in the room"*

**Open:** *"Two things up front, because everything else hangs off them. (1) What does winning look like 12 months from now? (2) Walk me through who's in the room with you — names, roles, main outputs."*

**Option set for founder involvement:**

```
Where you sit today — pick one:
  01  Running day-to-day, hands on everything
  02  Founder-led but with key delegates
  03  Pulling back — want a CEO / GM in within 12 months
  04  Already stepped back — focused on strategy / new ventures
  99  (custom)

Headcount including contractors / VAs / agencies — pick one:
  01  Just me                  (solo founder)
  02  2 – 4 people              (founder + 1-3 helpers)
  03  5 – 10 people             (small team)
  04  11 – 25 people            (mid-size)
  05  26 – 50 people            (scaling)
  06  50+ people                (mature)
  99  (custom)
```

**Captures:**
- `sections.goals.vision_12_month` — verbatim *(this is their north star)*
- `sections.goals.founder_involvement` — selected
- `sections.team.headcount` — selected band
- `sections.team.roles[]` — free-text walk-through; one entry per person/role with `name`, `role`, `main_outputs`. If the delegate volunteers a salary number, capture it as `roles[].salary_gbp` *(F2 ROI uses this; never push for it if not volunteered — fallback is revenue-band default rate)*.

**Probes:**
- *"Anyone part-time or VA-based I should know about?"*
- *"Of the people you named — who do you think actually changes their week most when systems land?"*

### Batch 2 — *"Capacity check"*

**Open:** *"Honestly — how many hours per week could the team put into building new systems, on top of running the business?"*

**Option set:**

```
Capacity for build work — pick the closest fit:
  01  Solo / very small      ~10-15 hrs/wk total
  02  Small team             ~30-40 hrs/wk total
  03  Mid team               ~60-100 hrs/wk total
  04  Larger team            100+ hrs/wk total
  99  (custom — give me a number)
```

**Captures:**
- `sections.team.capacity_hours_per_week` — number *(custom answers parse to a number; bands map to midpoints: 01→12, 02→35, 03→80, 04→120)*

**Probes — fire probe family (d) "Who's actually building vs running":**
- *"Of that capacity — who's actually building, and who's running the day-to-day? Build hours land in the F3 envelope; running-the-business hours don't."*

### Batch 3 — *"Revenue band + maintenance tolerance"*

**Open:** *"Two more — your annual revenue band, and what your team will actually maintain after the build. The maintenance answer decides whether we recommend an n8n self-host path or a Claude Code app path for the modules."*

**Option sets:**

```
Annual revenue band — pick one:
  01  <£250k                   (just launched / pre-PMF)
  02  £250k – £1M              (early growth)
  03  £1M – £5M                (scaling)
  04  £5M – £20M               (mid-market)
  05  >£20M                    (mature / multi-brand)
  99  (custom)

What you'll keep alive post-build — pick one:
  01  n8n self-hosted          someone here can keep workflows running on a £8/mo VPS
  02  Claude Code app          small TypeScript scaffold + Claude takes the maintenance load
  03  Neither                  pick the safest path for us; we'll trust your default
  99  (custom)
```

**Captures:**
- `revenue_band` *(top-level — drives F2 salary fallback rates, F3 capacity envelope, scope_mode)*
- `sections.team.maintenance_tolerance` *(drives F4 build-path fork — n8n_self_host vs claude_code_app vs neither → defaults to n8n_self_host with a footnote)*

**Probes:**
- *"Anyone in the team or contractor pool who's already running n8n / Make / Zapier — that's the n8n_self_host signal."*
- *"If the answer is 'neither' I'll default to n8n_self_host and footnote it. Sound fine, or push back?"*

### Section 2 close

Write captured facts to brain *(`sections.goals.vision_12_month`, `sections.goals.founder_involvement`, `sections.team.{headcount, roles, capacity_hours_per_week, maintenance_tolerance}`, top-level `revenue_band`)* → **brief in-chat verification:**

> *"Goals + capacity captured: <summary, e.g. 'scale to £5M, 4-person build capacity ~40 hrs/wk, n8n_self_host'>. Anything off? If it looks right, say 'continue' and we'll cover Stack — that's the longest section, ~6 minutes, opens with your email suite."*

Wait for confirmation, then transition:

> *"Goals + capacity locked. Now Stack — the big one. Email suite first, then every paid line item."*

---

## Section 3 · Stack *(~6 min, 6 batches — longest section)*

### Batch 0 — *"Email + comms suite first"* ← Track F new

**Open:** *"Before we walk every category — what's your email/comms suite? Microsoft 365, Google Workspace, something else? This shapes how we count everything else."*

**Why first (Sim #1):** Bundled apps *(Teams under M365; Meet under Workspace; OneDrive, Outlook, Word, Excel, PowerPoint under M365)* shouldn't show up as separate paid tools in the sprawl diagnosis. Capturing the suite up front lets the rest of Section 3 auto-mark anything bundled as `monthly_cost: "bundled"`.

**Option set:**

```
Email + comms suite — pick one:
  01  Microsoft 365            Teams, OneDrive, Outlook, Word/Excel/PowerPoint bundled
  02  Google Workspace         Meet, Drive, Gmail, Docs/Sheets/Slides bundled
  03  Zoho One                 most everything bundled
  04  Email host only          Fastmail / Proton / etc. — no productivity bundle
  05  None / Gmail free        no paid suite
  99  (custom)
```

**Captures:**
- `email_suite.provider` — selected
- `email_suite.bundled_apps[]` — derived from provider:
  - 01 Microsoft 365 → `["Microsoft Teams", "OneDrive", "Outlook", "Word", "Excel", "PowerPoint"]`
  - 02 Google Workspace → `["Google Meet", "Google Drive", "Gmail", "Google Docs", "Google Sheets", "Google Slides"]`
  - 03 Zoho One → `["Zoho Mail", "Zoho Cliq", "Zoho WorkDrive", "Zoho Writer", "Zoho Sheet"]`
  - 04 / 05 → `[]`
- `email_suite.monthly_cost` — ask: *"rough monthly across the team — number per seat × seat count, or just a total. If you don't have it to hand give me your best estimate and I'll mark it `unknown (est. £X)`."*

**Probes:**
- *"Anything else bundled in there I should know about — Loop, Power Automate, Workspace Marketplace add-ons?"*

### Batch 1 — *"Walk me through what you pay for"*

**Open:** *"Walk me through every paid tool you use monthly. I'll prompt categories so we don't miss anything — pick the ones you use, or `99` to add your own. After each category I'll ask two probes: cost per tool, and what you've already tried in this category that didn't stick."*

**Option sets** *(present per category — multi-select; capture cost + tried-and-dropped in follow-ups)*:

```
Listing optimisation & catalog:
  01  Helium 10
  02  Jungle Scout
  03  Sellerise
  04  Manage By Stats
  05  Native Seller Central only
  06  None
  99  (custom)

Ad management:
  01  Quartile
  02  Adzooma
  03  Scale Insights
  04  Perpetua
  05  PacVue
  06  Native Amazon Ads only
  07  None
  99  (custom)

Analytics / reporting:
  01  SellerBoard
  02  ManageByStats
  03  Power BI / Looker / custom dashboards
  04  Spreadsheets only
  05  None
  99  (custom)

Inventory / demand planning:
  01  SoStocked
  02  Inventory Planner
  03  SellerBoard inventory module
  04  Spreadsheets only
  05  None
  99  (custom)

Accounting / finance:
  01  Xero
  02  QuickBooks
  03  A2X (Amazon → accounting)
  04  Link My Books
  05  Spreadsheets / accountant handles it
  99  (custom)

Customer service / helpdesk:
  01  Gorgias
  02  Zendesk
  03  Help Scout
  04  FeedbackWhiz / FeedbackFive
  05  Native Seller Central messages only
  99  (custom)

Project management:
  01  ClickUp
  02  Notion
  03  Asana
  04  Monday.com
  05  Trello
  06  Linear
  07  Jira
  08  Email + spreadsheets (no PM tool)
  99  (custom)

Comms:
  01  Slack
  02  Microsoft Teams
  03  WhatsApp / WhatsApp Business
  04  Email only
  99  (custom)

Design / creative:
  01  Figma
  02  Adobe Creative Cloud (Photoshop / Illustrator / etc.)
  03  Canva
  04  Sketch
  05  Affinity (Designer / Photo / Publisher)
  06  In-house tools (Cowork projects, custom plugins)
  07  Outsourced — no in-house design tool
  99  (custom)

Multi-channel / fulfilment / 3PL:
  01  Linnworks
  02  ShipStation
  03  ShipBob
  04  Brightpearl
  05  Cin7 / DEAR
  06  ShipMonk
  07  Native Amazon FBA only — no multi-channel layer
  99  (custom)

Keyword research / SEO intel:
  01  Helium 10 Cerebro / Magnet  *(if Helium 10 above)*
  02  Data Dive
  03  DataRover
  04  Brand Analytics direct (SP-API SQPR)
  05  Manual / not systematic
  99  (custom)
```

**Captures (per tool):**
- `name`
- `monthly_cost` — fire probe family **(b) "What does it actually cost"** per tool: *"Monthly cost in GBP — a number, or `bundled` if it's covered by your <email_suite.provider> suite, or `unknown` and I'll mark it `unknown (est. £X)` with your best guess."* Auto-mark as `"bundled"` if `name` matches anything in `email_suite.bundled_apps`.
- `prerequisite` *(boolean)* — F2 sets this from `reference/prerequisite-tools.md` based on `brand_type`. Defaults `false`. Interview just captures the tool name; the prerequisite flag lands in F2's diagnose-sprawl pass.
- `tone` — `[rented]` for paid SaaS, `[owned]` for already-bought-but-extending, `[owned-untouched]` for paid-but-unused.

**Tried-and-dropped probe (fire after each category):** family **(a) "What have you already tried"** — *"In this category specifically, anything you've tried that didn't stick? Failed automations, abandoned pilots, tools you cancelled after 2 months. Capture these so I don't recommend the same path twice."* Append each to `sections.stack.tried_and_dropped[]` with `category`, `tool_or_approach`, `why_it_didnt_stick`.

**Catch-all probes (after the full Batch 1 category sweep):**
- *"Anything else paid that I haven't asked about? — APIs, data aggregators, niche SaaS, tools that someone on the team uses that nobody else touches?"*
- *"What's running in the background — anything connected to the bank, shipping carriers, an aggregator API you forgot about?"*

**Why this matters:** Sim's pre-SSL test-run flagged that Linnworks and Figma weren't surfaced unprompted. The categories above were missing. **Sweep every paid line item — the goal is total stack inventory, not just the obvious headers.**

### Batch 2 — *"AI tools specifically"*

**Open:** *"AI tools specifically — which ones, and where does the output go?"*

**Option set:**

```
AI tools — pick all that apply:
  01  Claude (web / desktop)
  02  ChatGPT (web / API)
  03  Claude Code
  04  Cursor
  05  GitHub Copilot
  06  Midjourney / DALL-E / Nano Banana / image gen
  07  Suno / video / music gen
  08  n8n with AI nodes
  09  Make / Zapier with AI steps
  10  Custom in-house AI tooling
  11  None yet
  99  (custom)
```

**Captures (per tool):** `name`, `use` *(ask: "what's it used for?")*, `output_destination` *(ask: "where does the output go?")*.

**Probes:** *"Is the output going anywhere automatically, or is it manual copy-paste?"*

### Batch 3 — *"Custom and scrappy"*

**Open:** *"What custom or scrappy stuff have you built? Sheets with formulas, scripts, n8n flows, anything in-house — even half-finished counts."*

**Option set:**

```
Custom in-house — pick all that apply:
  01  Google Sheets / Excel with heavy formulas
  02  Airtable bases doing real work
  03  n8n / Make / Zapier flows
  04  Python / Node scripts (locally run)
  05  Internal web apps (Next.js / Streamlit / Retool)
  06  Notion databases doing real work
  07  Bespoke databases (Supabase / Postgres / Firebase)
  08  Nothing custom — all SaaS
  99  (custom)
```

**Captures:** custom tools, sheets, scripts — with cadence + owner *(ask: "who runs each, how often?")*.

### Batch 4 — *"Data and reporting"*

**Open:** *"Where does your truth live, and what reports does someone actually check?"*

**Option sets:**

```
Source-of-truth data — pick all that apply:
  01  SP-API / Brand Analytics / SQPR (raw Amazon data)
  02  Helium 10 exports
  03  Ad platform (Amazon Ads / Google Ads)
  04  Accounting system (Xero / QuickBooks / A2X)
  05  Custom database / data warehouse
  06  Spreadsheets / manual entry
  07  Honestly we don't fully trust any single source
  99  (custom)

Reporting cadence — pick all that apply:
  01  Daily check (sales / ad spend / inventory)
  02  Weekly summary (team-wide)
  03  Monthly P&L / management report
  04  Quarterly board / investor report
  05  Ad-hoc only — when something looks off
  99  (custom)
```

**Captures:**
- `data_sources` — multi-select
- `reporting_cadence` — multi-select + who runs each *(ask)*

### Batch 5 — *"Tool fluency + clockify check"*

**Open:** *"How tech-savvy is the team across the tools we just walked? And — does anyone track their time at the task level (Clockify, Toggl, anything)?"*

**Option sets:**

```
Tool fluency across the team — pick the closest fit:
  01  Spreadsheet-only, mostly hand-written processes
  02  Comfortable with SaaS apps; not technical
  03  Mixed — some technical, most not
  04  Most of the team uses AI tools (Claude / GPT) daily
  05  Engineers / technical staff in the team
  99  (custom)

Time tracking at the task level:
  01  Yes — Clockify
  02  Yes — Toggl
  03  Yes — built into ClickUp / Asana
  04  Partial — some people, not all
  05  No — nobody tracks task-level time
  99  (custom)
```

**Captures:**
- `tool_fluency` — selected level
- `imminent_hires` — free text *(just ask: "any hires coming in the next 90 days?")*
- `clockify_data` — selected level

**Probes:**
- *(If no task-level time tracking)* *"Worth getting it before we go deep on Pain — bottlenecks live in the texture of someone's week, not the org chart. Want me to come back after a 1-week Clockify run, or push forward with what you know?"*

### Section 3 close

Write captured facts to brain *(`sections.stack.*`, `sections.team.{tool_fluency, imminent_hires, clockify_data}`, top-level `email_suite`)* → **THIS IS MILESTONE 2** *(per system prompt § Artifact emission — mid-interview verify)*. Re-render artifact: cover stamped with brand, page 04 (Current state) populates with sprawl + glue-humans + CSV moments emerge in Section 4, page 02 (Summary) partially populates. Progress 70%.

Write file → `update_artifact({ id: "syncflow-roadmap", html_path, update_summary: "Stack mapped — verify before we cover pain points" })`.

In chat, ask the user to verify visually:

> *"Stack section captured. Take a look at page 04 of the artifact — that's your current state, in your own language. Tools listed with cost, suite-bundled flagged, what you've already tried that didn't stick.*
>
> *Anything off? Anything I missed? If it looks right, say 'continue' and we'll cover Pain — where things break and who's the glue."*

Wait for confirmation, then transition:

> *"Stack mapped. Now Pain — where the wheels fall off."*

---

## Section 4 · Pain *(~3-4 min, 2 batches — Track F split from old Goals)*

### Batch 1 — *"Where things break + control plane"*

**Open *(diagnostic framing — don't assume there IS a CSV moment)*:** *"Where do tools fail to talk to each other? Two specific shapes to look for: (a) someone exporting data from one tool and importing/pasting it into another — that's a CSV moment. (b) Someone whose job is to manually move information between tools — that's a glue-human (a person whose role is being the integration). Sometimes neither happens; sometimes both happen all over. Walk me through anything that comes to mind, even if you're not sure it counts."*

**This batch is mostly free-text — CSV moments and glue-human stories are what we want verbatim, not ticked.** Don't ship options for these.

**Defining the terms in-line *(do this on first mention, every interview — Sim test-run #3 flagged "glue-human" as opaque to most readers)*:**
- *"CSV moment"* = any recurring **export-from-one-tool → import-to-another** ritual. Manual copy-paste, downloaded reports, hand-stitched spreadsheets all count.
- *"Glue-human"* = a person whose job is *being the integration* — they're the only thing connecting tool A to tool B because the tools don't talk to each other.

**If neither shows up *(diagnostic, not failure)*:** that's a finding too. Capture *"no CSV moments / glue-humans surfaced"* — and probe the boring places: *"How does inventory data get into the financial reports?"*, *"How do listing changes go from designer to live?"*, *"Where does ad performance turn into a decision?"* Cracks usually surface there.

**Captures:**
- `csv_moments` — verbatim, with hours/week and owner. Empty array is valid if none surfaced.
- `glue_humans` — the people doing the gluing, named *(get the role at minimum, names if they offer)*. Empty array is valid.

**Probes — fire probe family (c) "What breaks when X is on holiday":**
- *"What breaks when [glue-human] is on holiday?"*
- *"How long does that take, roughly, every week?"*
- *(if zero CSV moments after 2 minutes of probing)*: *"Sometimes the answer is genuinely 'none' — but it's rare. Want me to ask the boring questions one by one?"*

### Batch 2 — *"Team-level pain"*

**Open:** *"Stepping up from tool-level pain to team-level. Where does the team complain most? What's the 'we hate doing this every week' task that someone always grinds through? And — what gets dropped first when things get busy?"*

**Captures:**
- `bottleneck` — the single highest-signal answer for which automation lands first
- `failure_mode` — what gets dropped when things get busy

**Probes:**
- *"If you lost your best person tomorrow, what would fall over first?"*
- *"Future hires you're considering — could a system replace any of them?"*

### Section 4 close

Write captured facts to brain *(`sections.stack.{csv_moments, glue_humans}`, `sections.team.{bottleneck, failure_mode}`)* → **brief in-chat verification:**

> *"Pain captured: <summary, e.g. '5 CSV moments, 4 glue-humans, recruitment as #1 bottleneck'>. Anything off? If it looks right, say 'continue' and we'll close out — Aspirations, the magic-wand question."*

Wait for confirmation, then transition:

> *"Pain logged. Last one — what would you build if you could build anything."*

---

## Section 5 · Aspirations *(~2-3 min, 1 batch — Track F split from old Goals)*

### Batch 1 — *"Magic wand + what's stopped you"*

**Open:** *"If you could automate one thing tomorrow, what would it be — and what's stopped you from building it already?"*

**The magic-wand and why-not-yet answers are free-text — capture verbatim. The verbatim phrasing anchors Page 09's future-state narrative.**

**Option set for `why_not_yet`:**

```
What's blocked you from building it already — pick the closest fit:
  01  Time — never high enough on the priority list
  02  Budget — can't justify the cost vs return
  03  Expertise — don't know how / no one in-house can build it
  04  Clarity — not sure what "right" looks like yet
  05  Tried it — failed or got stuck partway
  06  Decision paralysis — too many possible paths
  99  (custom)
```

**Captures:**
- `magic_wand_automation` — verbatim
- `why_not_yet` — selected
- `single_biggest_bottleneck` — already in `sections.team.bottleneck` from Section 4 Batch 2; mirror to `sections.goals.single_biggest_bottleneck` if not already populated, for backward compat with v1.0 readers.

### Section 5 close

Write captured facts to brain *(`sections.goals.{magic_wand_automation, why_not_yet, single_biggest_bottleneck}`)* → **THIS IS MILESTONE 3** *(per system prompt § Artifact emission — post-interview verify)*. Re-render artifact: page 02 (Summary) now fully populates with goals + bottleneck. All captured pages show data; modules + replacement table still locked. Progress 90%.

Write file → `update_artifact({ id: "syncflow-roadmap", html_path, update_summary: "Interview complete — ready to derive recommendations?" })`.

In chat, **final pre-derivation verification**:

> *"Interview complete. Pages 02 (Summary) and 04 (Current state) in the artifact show what I've captured across all five sections.*
>
> *Final check before I derive your modules — anything off? Anything to add?*
>
> *When you say 'continue' I'll run diagnose-sprawl, design-future-state, derive-replacement-table, and recommend-modules. Takes ~30 seconds. The artifact updates one more time after that."*

Wait for confirmation, then trigger the post-interview pipeline:

```
diagnose-sprawl                   (in-context only — no artifact update)
  → design-future-state           (in-context only — no artifact update)
  → derive-replacement-table      (in-context only — no artifact update)
  → recommend-modules             (in-context only — no artifact update)
  → render-roadmap (final pass)
  → MILESTONE 4 — emit complete artifact
  → emit-brain-artifact (id: syncflow-brain) for tier-1 persistence
  → final chat handoff with full next-step menu
```

The derivation steps run silently — **only one final artifact emission at the end**, not one per derivation step. Cleaner and matches the 4-milestone budget in the system prompt.

The "stage: deriving" emissions can fire as a single emit after `recommend-modules` if the derivations run fast in sequence — the user only needs to see one update per logical milestone, not per micro-step. Use the cadence guardrail in `emit-roadmap-artifact` (don't re-emit more than once per ~60 seconds during interview, but derivation typically runs faster — bundle the deriving emits into one).

---

## Consultant asides *(Track F · Sim #10 — opportunistic, not structured)*

A small set of recommendations the consultant raises **once** during the interview when a relevant trigger fires — never as a forced batch question, never twice. These are tools or moves outside the migration plan that compound for it: cheap, fast, no-regret. The asides exist because the migration is 12-16 weeks but the delegate can act on these before Module 01 starts.

**The pattern:**

1. Wait for an organic trigger *(see triggers below)*. Don't fish; if the trigger doesn't fire, the aside doesn't get raised.
2. Drop a one-line offer. Tone: peer suggesting a tool, not consultant pitching one. *"Side note — have you seen X? Worth 30 seconds if you haven't."*
3. If the delegate says yes / tell me more → walk them through the setup *(inline scripts below)*. Capture interest + status to the brain so we don't repeat it.
4. If they say no thanks / already use it / skip → capture the status, move on without re-raising. Asides fire **at most once** per interview.

**Asides fire as a sub-bullet inside whatever batch is currently running.** Don't break the flow with a dedicated header. The delegate experiences it as *"oh and one more thing"*, not as a new section.

---

### Aside · Wispr Flow *(voice-to-text everywhere)*

**What it is.** Wispr Flow is a hotkey-driven voice-to-text app — hold a key, dictate, it types into whatever app has focus *(Slack, ClickUp, Cowork, browsers, email)*. ~£12/mo per seat, ~10 minutes to install, claim is 3-5 hrs/wk saved per heavy typist.

**Triggers — raise the aside when any of these surface organically in the interview:**

- Section 1 / 2: founder mentions long Slack threads, *"I'm typing all day"*, *"my team writes 50 emails to candidates"*, anyone described as on Slack/email "constantly".
- Section 3: heavy use of comms tools *(Slack tier 02+ headcount, ClickUp + Slack both daily)*, especially when paired with senior-role users.
- Section 4: a glue-human whose work is *"writing/messaging/coordinating"* — recruiter sending emails, brand manager writing supplier briefs, ops lead drafting standups.
- Section 5: founder says they want to *"reclaim time from comms"* / *"stop being on Slack"* — even if structured around delegation, a voice-to-text tool is the lower-floor first move.

**The offer (one line — drop it inline, don't elevate):**

> *"Side note — totally outside the migration. Have you seen Wispr Flow? Voice-to-text that types into anything you have open. ~£12/mo, 10-minute install, most heavy typists save 3-5 hrs/week. Want me to walk you through setup, or skip?"*

**If they say "tell me more" / "yes" / "walk me through it" — paste this verbatim:**

> *"Quick setup — 4 steps:*
>
> *1.* `wispr.io` *→ download for Mac or Windows. Free 14-day trial; £12/mo after.*
> *2. Install. It runs as a menu-bar / system-tray app.*
> *3. Set your hotkey — default is Fn (Mac) or Ctrl (Windows). Hold it, talk, release. Whatever app has focus, that's where the text lands.*
> *4. First 24 hours: just use it for Slack and email. Don't try to dictate code or formal docs yet — get the muscle memory first.*
>
> *The trick: it works in Cowork too. You're going to be talking to syncflow a lot during the migration; dictating instead of typing those messages is where the compound starts.*
>
> *Anyone else on the team who'd benefit? — usually the heaviest typist after the founder is whoever runs comms or recruitment."*

Then capture:
- `wispr_flow = false` *(they've now heard about it but not yet adopted)*
- Optionally `brain.recommendations.immediate_wins[]` gets a Wispr entry with `status: "introduced"`.

**If they say "already use it":**

Capture `wispr_flow = true`. No follow-up. Move on.

**If they say "no thanks" / "not interested":**

Capture `wispr_flow = false` with a `wispr_flow_declined: true` flag. Don't re-raise; respect the no.

**If the trigger never fires:**

Don't raise the aside. `wispr_flow` stays `null`. The PDF doesn't push it; the brain just lacks the field. Some delegates will leave the interview without ever hearing about Wispr — that's fine. The aside is a discretionary tool, not a checklist item.

**Why opportunistic, not structured *(Track F revision · Sim's follow-up 2026-05-08)*:**

The original F1 spec asked Wispr as a structured question in Section 2 Batch 2, paired with capacity. That made the interview feel like a sales funnel — *"and now we'll see if you need this product."* Sim's revised note: raise it as a peer-to-peer suggestion when the trigger naturally fires, walk through setup if interested, otherwise stay silent. The brain field stays *(opportunistic capture)*, the Page 07 Immediate Wins block no longer carries a Wispr row *(see render-roadmap.md)*, and the recommendation lives in the chat conversation where it belongs.

---

### Adding new asides

This pattern is extensible. Future asides should follow the same shape:

1. **What it is** — one paragraph, including price.
2. **Triggers** — 3-5 organic moments where raising it makes sense.
3. **The offer** — one inline line, not a multi-step pitch.
4. **Setup script** — verbatim copy if interest is expressed.
5. **Three capture branches** — yes / already-use / no.
6. **What happens if the trigger never fires** — silent skip; brain field stays null.

Candidate future asides *(not yet implemented, listed here so the pattern grows deliberately)*:
- Claude Desktop install *(if delegate doesn't have it but ChatGPT use is heavy)*
- ClickUp brand-as-OS template *(if delegate has ClickUp but uses it as a task tracker only — currently lives on Page 07 Immediate Wins; could move here if it consistently feels intrusive there)*
- 1Password / Vault *(if Section 3 surfaces credential sprawl as a glue-human story)*

---

## Always — every batch

- **Read the brain first.** Skip questions whose facts are already captured. Never ask twice.
- **Append to `interview-transcript.md` after every exchange.** Verbatim — your open question and the user's answer.
- **Stay in voice.** Sharp, named consultant. No *"got it!"* / *"great!"* / *"awesome!"*.
- **Push back on hand-wavy answers.** *"$1M-ish"* is fine. *"a few people"* needs a number.
- **One open question per batch.** Probes only after.
- **Fire probe families.** Section 3 fires (a) and (b) after every category. Section 4 fires (c) on every glue-human. Section 2 fires (d) on stated capacity. Don't accept the first answer when a probe family applies.

---

## Edge cases

- **They want to skip a section:** allow it but flag — *"Skipping Stack means the recommendation gets generic. We'll come back to it before generating modules."* Note that skipping Section 2 (Goals + capacity) breaks F3's capacity-fit filter and F4's build-path fork — the diagnosis falls back to revenue-band defaults and `n8n_self_host`.
- **Pause / resume:** save current `(section, batch)` pointer in `interview-transcript.md` as a comment line. Resume from that pointer.
- **They contradict themselves mid-interview:** append the correction to the brain with a `[corrected]` tone tag. Don't argue.
- **They say "I don't know" repeatedly on Stack:** flag for Clockify pre-prep — *"This is exactly the data Clockify surfaces in a week. Want to run a Clockify week and come back?"*
- **Resuming a v1.0 (4-section) brain:** the legacy section paths still exist; backfill the new top-level fields *(email_suite, revenue_band)* and `team.{capacity_hours_per_week, maintenance_tolerance}` by running just Section 2 Batch 2 + 3 and Section 3 Batch 0. Skip everything else. `wispr_flow` doesn't need backfilling — it's opportunistic and lands during the consultant aside if a trigger fires; otherwise stays null.

---

## Don't

- Don't probe more than 2 follow-ups deep. If they don't know after 2 probes, capture as `[unknown]` and move on.
- Don't repeat questions. Read brain first, every time.
- Don't summarise back to them at the end of each section beyond the 1-line verification.
- Don't promise outcomes mid-interview. Numbers come at render time, anchored in their actual stack.
- Don't accept *"we forecast off historicals"* as fine in Section 3 Batch 4 — that's a tell. Probe: *"What signal would you trust more?"* Note answer for the demand-planning recommendation.
- Don't skip the email_suite question in Section 3 Batch 0. Without it, every Microsoft 365 / Workspace bundle gets double-counted in the sprawl diagnosis.
