# `diagnose-sprawl`

**When**
- After all 4 interview sections complete
- User says *"diagnose"* / *"what's wrong with my stack?"*

**Inputs**
- in-context `brain` object — read via `read-brain`

**Tools**
- chat — output the diagnosis as the first part of the post-interview pipeline
- *(no FS writes — this is analysis, not capture)*

**Outputs**
- structured diagnosis held in context for the next steps (`design-future-state`, `derive-replacement-table`, `recommend-modules`, `render-roadmap`)
- per-tool `prerequisite` flag on `brain.sections.stack.tools[]` — written back so downstream skills don't recompute
- per-tool `monthly_cost` resolved against `email_suite.bundled_apps` — bundled tools render at £0

---

## What "sprawl" means here

Sim's framing — the visible tax of running multiple disconnected SaaS subscriptions that don't talk:

- **CSV moments** — manual export-edit-import rituals. The flow `helium10 → sellerapp → sheet` is the canonical example. Always owned by a named human, always on a fixed cadence.
- **Glue-humans** — people whose role function is *"copy data between tools that don't talk"*. They're not building, they're plumbing.
- **Redundant subscriptions** — multiple tools doing overlapping jobs. Helium 10 + SellerApp + Adtomic all touch listing performance.
- **Black-box tools** — tools whose decisions aren't visible. Adtomic placement-modifier rules. Repricers without rule logs.
- **Source-of-truth ambiguity** — when *"where does this number live?"* has two answers.
- **Forecast-off-historicals** — using last year's sales to plan next month's stock. Sim's anti-pattern.

**What "sprawl" is NOT** *(Track F · Sim #6 — prerequisites are not sprawl)*:

- **Prerequisites** — tools that are table stakes for the brand's channel. For `brand_type=amazon` that's Helium 10 (Cerebro/Magnet KW), Datadive, JungleScout, Keepa, Seller Central, Brand Analytics. For `brand_type=tiktok_native` that's KaloData and Fast Moss. These render as **"prerequisite (table stakes)"** on Page 03 and are excluded from retire-recommendations + rented-subs totals. Whitelist source: `reference/prerequisite-tools.md`.
- **Bundled apps** — tools covered by an existing higher-level subscription. Microsoft Teams under Microsoft 365, Google Meet under Google Workspace, etc. They render at `monthly_cost: "bundled"` (£0 contribution) and are excluded from rented-subs totals. They CAN still be retire candidates if unused — bundled ≠ prerequisite — but the headline framing is *"clutter to remove"* not *"£X/mo to recover."*

---

## Behaviour

1. **Read the brain** (all 5 sections).

2. **Pre-pass — prerequisite + bundled tagging** *(Track F · Sim #1, #6)*. Before the sprawl scan:
   - **Derive `brand_type`.** Order of precedence:
     - `business.channels` contains any of `Amazon UK`, `Amazon US`, `Amazon EU` → `brand_type = amazon`
     - `business.channels` contains `TikTok Shop` (and not Amazon) → `brand_type = tiktok_native`
     - `business.channels` contains `Direct-to-consumer` only → `brand_type = shopify_d2c`
     - Mixed → `brand_type = multi_channel` (apply both whitelists)
     - None of the above → `brand_type = generic` (no whitelist)
   - **Load whitelist** from `reference/prerequisite-tools.md` for the resolved brand_type.
   - **Tag each tool in `stack.tools[]`:**
     - If `tool.name` (case-insensitive, alias-aware) matches the whitelist → set `tool.prerequisite = true`.
     - If `tool.name` matches `brain.email_suite.bundled_apps` → set `tool.monthly_cost = "bundled"` (overrides whatever the interview captured — bundling wins).
     - Otherwise leave `tool.prerequisite = false`.
   - This pass writes back to the in-context brain so `derive-replacement-table` and `recommend-modules` read the same flags.

3. **Scan `stack.md` for sprawl signatures.** For each, capture:
   - **CSV moments** — every `[csv-moment]`-toned entry. Capture: flow, hours/week, owner.
   - **Glue-humans** — every `[glue-human]`-toned entry, plus any tool combination that implies one (e.g. Reviews → Slack → ClickUp without an automation).
   - **Redundancies** — when 2+ rented tools serve overlapping functions (Helium 10 + SellerApp = listing analytics overlap; Adtomic = same domain). **Skip pairs where both are prerequisites** — overlap between two prerequisites is the brand's choice, not sprawl.
   - **Black boxes** — tools the user described as opaque (*"can't see why it ranks"*, *"placement modifiers awol"*). Common: Scale Insights, Adtomic, generic repricers.
   - **Source-of-truth conflicts** — multiple data sources for the same metric (Helium 10 BSR vs SellerApp vs SP-API).
   - **Forecast-off-historicals** — if `goals.md` mentions stock pain or `stack.md` mentions inventory tools without SQPR / search-volume signals as inputs.

4. **Score each signature by impact.** Three axes:
   - **Hours/week** lost (from CSV moments + glue-humans, summed by owner).
   - **£/month** in retired-able subs — sum of `monthly_cost` for `[rented]` entries that map to one of Sim's archetypes AND are not flagged `prerequisite=true` AND have `monthly_cost ≠ "bundled"`. **`"unknown (est. £X)"` strings parse to the X figure with a `confidence: "estimated"` flag** — diagnose-sprawl uses the estimate but `derive-replacement-table` footnotes it.
   - **Risk** (binary) — opaque black-box decisions, single-source-of-truth ambiguity that can silently corrupt downstream work.

5. **Output the diagnosis.** Format — no headers, just consultant prose with named items. **Lead with prerequisites kept** *(Sim #6: don't open with "we're retiring everything you depend on")*, then redundancies, then bundled clutter, then CSV moments. Example:

   > *"Prerequisites kept. Helium 10 stays — Cerebro and Magnet are how this category gets keyword research done. Datadive and Keepa likewise. Brand Analytics free with Brand Registry. Seller Central is the platform.*
   >
   > *Three CSV moments. Maya owns all three.* `Helium 10 → SellerApp → Sheet` *every Monday — 3hr. Adtomic → reporting deck fortnightly — 2hr. Reviews → Slack → ClickUp daily — 30min. Total: 5–6 hours/week of senior ops time on plumbing.*
   >
   > *Three rented subs running parallel jobs that aren't prerequisites:* `SellerApp` *(£99/mo) and* `Adtomic` *(£249/mo) both touch listing performance and PPC respectively.* `Scale Insights` *(£300/mo) is opaque — placement modifiers fire without visible rules. Combined: £648/mo, no source-of-truth reconciliation.*
   >
   > *Bundled clutter. Microsoft Teams in the stack, but the team uses Slack. £0 to recover (it's already paid as part of M365) — but it's a retire candidate purely for clarity. Same with WhatsApp Business — £0, mark for review.*
   >
   > *Forecast off historicals — and you're flagging stock as a goal-section bottleneck. That's the single highest-leverage swap on the table."*

6. **Hand the structured diagnosis** to the next step (`design-future-state`). Don't render to the user as JSON; the consultant summary above is the user-facing output, but the structured form lives in context for downstream skills.

---

## What you're looking for (signal patterns)

| Pattern | What it tells you |
|---|---|
| Multiple rented analytics tools (Helium 10 + SellerApp + Power BI) | Module candidates: Demand Planning *(Sim #10)*, SQL MCP *(Sim #13)* |
| Manual ad reporting (Adtomic / spreadsheet exports) | Module candidate: Advanced PPC, in-house *(Sim #09)* |
| Manual document drafting (POs, QC reports, supplier comms) | Module candidate: Branded Documents *(Sim #07)* |
| Image upload through Seller Central | Module candidate: Image Upload bottleneck *(Sim #01, the strongest "remove the human" archetype)* |
| Influencer ops in spreadsheets | Module candidate: Creator CRM *(Sim #06)* |
| Stock pain + forecast-off-historicals | Module candidate: Demand Planning *(Sim #10)* — Module 03 of the Ideal Direct sample, scored highest by F3 derivation |
| US scaling + single national rank tracking | Module candidate: Hyper-local intelligence *(Sim #12)* |
| Multiple GitHub / Vercel / Supabase projects | Anti-pattern fired: multi-project sprawl. Flag for cleanup before any new build. |

---

## Don't

- Don't diagnose tools you haven't seen captured. If they didn't mention Adtomic, don't assume Adtomic.
- Don't mix diagnosis with recommendations. This skill identifies the sprawl; `recommend-modules` picks what to build. Keep them separate.
- Don't moralise. Sim's worldview is opinionated, but the diagnosis is descriptive — *"three CSV moments owned by Chris"* not *"your team is wasting time."*
- Don't hide black-box tools as a footnote — they're a primary signature, name them.
