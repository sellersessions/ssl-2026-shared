# `derive-replacement-table`

**When**
- After `design-future-state` has the architecture mapped
- Used by `render-roadmap` to fill page 06 of the report

**Inputs**
- in-context `brain.sections.stack`
- Architecture map from `design-future-state` (held in context)

**Tools**
- chat — show the table to the user *(optional)*
- *(no FS writes; output lives in context for `render-roadmap`)*

**Outputs**
- Structured replacement table — array of richly-populated rows:
  ```
  { tool, monthly_cost, prerequisite, verdict, dest, why, replaced_by, transition_effort, gotchas }
  ```
- `gross_savings_per_year_gbp` *(salary-anchored — Track F · Sim #8)* — the value of hours reclaimed at the team's loaded hourly rate, summed over a year.
- `gross_subs_savings_per_year_gbp` — sum of retired non-prerequisite, non-bundled subs.
- `new_stack_cost_per_year_gbp` *(Track F · Sim #12)* — what the future state actually costs. Claude sub + n8n self-host VPS + Supabase tier sized off `revenue_band`.
- `net_savings_per_year_gbp` — `gross_savings_per_year_gbp + gross_subs_savings_per_year_gbp − new_stack_cost_per_year_gbp`. **Page 02's headline ROI number is this net figure**, not the gross.
- `net_hours_reclaimed_per_week` total
- The richer fields drive Page 06's deeper render *(why-this-verdict + replaced-by + transition-effort + gotchas columns)*. **Don't skip them — a row without `why` reads as glib.**

---

## What the table is

Per each tool in the delegate's current stack, decide its fate in the future-state architecture. Three verdicts — Sim's framing:

| Verdict | When to use |
|---|---|
| **Keep** | The tool survives unchanged. It's already owned, or it serves a function we're not retiring. *(ClickUp, A2X, Slack, accounting.)* |
| **Consolidate** | The tool gets absorbed by another tool you already own — usually ClickUp absorbs scattered SaaS surface. *(Notion-personal-PM consolidating into ClickUp Spaces.)* |
| **Retire** | The tool is replaced by an owned module. *(Helium 10 stock module → Demand Planning. Adtomic → Advanced PPC.)* |

---

## Behaviour

1. **Walk every tool** captured under `## Tools (paid SaaS)` in `stack.md`. For each:
   - **Look up its function.** What does the user use it for? *(Helium 10 = product research + listing analytics + stock module — usually multiple.)*
   - **Check `tool.prerequisite`** *(set by `diagnose-sprawl`'s pre-pass)*. If true → verdict is **keep** with `why = "prerequisite (table stakes for {{brand_type}}); not retiring"`. Skip the rest of the verdict logic.
   - **Check the architecture map.** Is one of its functions covered by a module in `design-future-state`?
   - **Assign verdict:**
     - All functions retired by modules → **retire**
     - Some functions retired, others stay → **consolidate** *(with note on which functions get retired)*
     - No functions retired → **keep**
   - **Identify the destination** — which module retires/consolidates it. Use the format `Module 0X · <Module Name>`.

2. **Compute subs savings — bundled-aware** *(Track F · Sim #1)*. For every `retire` row:
   - If `monthly_cost` is a number → add to `gross_subs_savings_per_year_gbp` *(× 12)*.
   - If `monthly_cost == "bundled"` → contributes £0. Note in `why`: *"bundled with {{email_suite.provider}} — no sub recovered, just stack clutter removed"*.
   - If `monthly_cost` matches `^unknown \(est\. £(\d+)\)$` → add the parsed number to `gross_subs_savings_per_year_gbp`, but flag the row with `cost_confidence: "estimated"`. Page 06 footnotes estimated rows.

3. **Compute hours-saved gross — salary-anchored** *(Track F · Sim #8)*. For every CSV-moment / glue-human entry mapped to a module:
   - **Resolve the loaded hourly rate** for the entry's `owner`:
     1. If `brain.sections.team.roles[]` has an entry matching `owner` and `salary_gbp` is non-null → `loaded_hourly_rate = salary_gbp × 1.3 / 1872` *(1.3 = employer NI + benefits multiplier; 1872 = 36-hr week × 52 weeks − 4 wks PTO/holiday)*.
     2. Else fall back to `revenue_band` defaults:

        | revenue_band | fallback rate |
        |---|---|
        | `<£250k` | £35/hr |
        | `£250k-1M` | £45/hr |
        | `£1M-5M` | £55/hr |
        | `£5M-20M` | £75/hr |
        | `>£20M` | £85/hr |
        | null / unknown | £55/hr *(median fallback; flag as low-confidence)* |
     3. Mark the entry with `rate_source: "salary"` or `rate_source: "band_default"`.
   - **Compute** `gross_savings_per_entry = hours_per_week × loaded_hourly_rate × 52`. Add to `gross_savings_per_year_gbp`.

4. **Compute new_stack_cost** *(Track F · Sim #12 — future-state tools cost something)*:
   - **Claude subscription:** £18/mo per active builder seat × 12. Default 2 seats *(founder + tech lead)*; bumps to 3 if `team.capacity_hours_per_week ≥ 60`. £18 figure assumes Claude Pro; Claude Max bumps to £100/seat — only use Max if the brain explicitly says so.
   - **n8n self-host VPS:** £8/mo × 12 = £96/yr *(Hetzner CX22 baseline)*. Only when `team.maintenance_tolerance == "n8n_self_host"`.
   - **Claude Code app hosting:** £20/mo × 12 = £240/yr *(Vercel Hobby + small Supabase tier)*. Only when `team.maintenance_tolerance == "claude_code_app"`.
   - **Supabase tier**, sized by revenue_band:

     | revenue_band | tier | cost |
     |---|---|---|
     | `<£250k` | Free | £0/yr |
     | `£250k-1M` | Free | £0/yr |
     | `£1M-5M` | Pro | £20/mo → £240/yr |
     | `£5M-20M` | Pro | £20/mo → £240/yr |
     | `>£20M` | Team | £499/mo → £5988/yr |
   - **Sum** all the above into `new_stack_cost_per_year_gbp`. Itemise the lines in the structured output so Page 05 + Page 06 can render the breakdown.

5. **Compute net** *(Sim #8 + #12)*: `net_savings_per_year_gbp = gross_savings_per_year_gbp + gross_subs_savings_per_year_gbp − new_stack_cost_per_year_gbp`. **This is Page 02's headline number.**

6. **Sum the hours reclaimed.** For every CSV-moment / glue-human entry in `stack.md` that maps to a module being built, add to `net_hours_reclaimed_per_week`. Format: `+ XX hrs/wk reclaimed`.

4. **Populate the depth fields per row.** For every row, derive these — don't skip:

   | Field | How to populate |
|---|---|
   | `why` | One sentence: why this verdict for this tool, anchored to the brain. *"Helium 10's stock module is the source of the Mondays-3hr CSV ritual; Demand Planning replaces that workflow."* Use the delegate's own bottleneck language where possible. |
   | `replaced_by` | Specific destination: Module N, owned primitive, or replacement tool. Same idea as `dest` but more explicit — *"Module 02 · Demand Planning (n8n + Supabase)"* not just *"Module 02"*. |
   | `transition_effort` | One of: `Low` *(cancel sub, no data migration — e.g. Helium 10 paywall feature you don't use)*, `Medium` *(historical data export needed first; some workflow rebuild)*, `High` *(deep integration unwind; significant rebuild; team retraining)*. |
   | `gotchas` | One line on what to watch out for. *"Export your historical search-volume data before cancelling — the API doesn't backfill."* Empty string if there are no real gotchas. |

7. **Output the structured table** for `render-roadmap`:

   ```
   {
     rows: [
       {
         tool: "Helium 10", monthly_cost: 150, prerequisite: true, verdict: "keep",
         dest: "Cerebro/Magnet kept; stock module → Module 03",
         why: "Prerequisite (table stakes for Amazon FBA). Keyword research workflow stays — replacing it means rebuilding research that isn't the bottleneck.",
         replaced_by: "—", transition_effort: "Low (drop a tier if available)",
         gotchas: "Stock module's outputs migrate into Module 03; the Helium 10 KW UI stays put."
       },
       {
         tool: "Scale Insights", monthly_cost: 300, prerequisite: false, verdict: "retire",
         dest: "Module 04 · PPC + Stock Interlock",
         why: "Opaque PPC black-box; placement modifiers fire without visible rules. In-house Module 04 ties bids to stock cover with full visibility.",
         replaced_by: "Module 04 · PPC + Stock Interlock (n8n + Supabase + SP-API Advertising)",
         transition_effort: "Medium",
         gotchas: "Audit Scale Insights usage for 2 weeks before retiring — add anything missing to Module 04 scope."
       },
       {
         tool: "Microsoft Teams", monthly_cost: "bundled", prerequisite: false, verdict: "retire",
         dest: "Slack only",
         why: "Bundled with Microsoft 365 — no sub recovered, just stack clutter removed. Team doesn't actually use it.",
         replaced_by: "Slack (already primary)",
         transition_effort: "Low",
         gotchas: "Export historical Teams messages first if any contain decisions; otherwise just turn it off."
       },
       {
         tool: "Power BI", monthly_cost: 100, prerequisite: false, verdict: "retire",
         dest: "Module 06 · SQL MCP",
         why: "Single-person gatekeeper risk — Franc-only access. SQL MCP gives the whole team self-serve; Franc transitions from gatekeeper to query architect.",
         replaced_by: "Module 06 · SQL MCP (Supabase + Claude SQL MCP)",
         transition_effort: "Medium",
         gotchas: "Franc needs onboarding to the new role — book a 1-day pairing session before retire."
       },
       {
         tool: "ClickUp", monthly_cost: "unknown (est. £30)", prerequisite: false, verdict: "keep",
         dest: "absorbs Modules 01, 02, 03, 04, 06, 07",
         why: "Already paid for; becomes the operating system for everything we're building.",
         replaced_by: "—", transition_effort: "—",
         gotchas: "Plan the space + folder structure before importing automations — see reference/ideal-direct-operating-patterns.md § 2."
       }
     ],
     gross_subs_savings_per_year_gbp: 4800,
     gross_savings_per_year_gbp: 60060,
     new_stack_cost_breakdown: [
       { line: "Claude subscription · 2 seats × £18/mo", annual_gbp: 432 },
       { line: "n8n self-host VPS (Hetzner CX22)",       annual_gbp: 96 },
       { line: "Supabase Pro (revenue band £1M-5M)",     annual_gbp: 240 }
     ],
     new_stack_cost_per_year_gbp: 768,
     net_savings_per_year_gbp: 64092,
     net_hours_reclaimed_per_week: 21,
     loaded_hourly_rate_used: 55,
     rate_source: "band_default (£1M-5M)"
   }
   ```

---

## Edge cases

- **Tool with split functions:** e.g. Helium 10 covers product research AND stock module AND listing analytics. If only one function is retired by a module, the verdict is **consolidate** — note in the destination *"keep for product research only; stock module → Module 02"*. Once another module retires the rest, the verdict becomes **retire**.
- **Prerequisite tool with a redundant overlap:** e.g. Helium 10 (prerequisite) AND SellerApp (not prerequisite) both cover stock alerts. The non-prerequisite gets the retire verdict; the prerequisite stays. Don't retire a prerequisite.
- **Tool the user paid for but doesn't use:** the user mentions it but says *"we don't really use it"* — verdict **retire**, destination *"unused; cancel"*. If `monthly_cost == "bundled"`, the framing shifts to clutter-removal *(see Microsoft Teams in the example)*.
- **Tool that's about to launch / they're considering:** flag separately. Don't put speculative subs in the table.
- **Free tools:** `monthly_cost: 0`. Don't sum into `gross_subs_savings_per_year_gbp`.
- **Tools with hour-cost only (no £):** e.g. *"CSV (manual)"* with `3 hr/wk`. These don't appear in the tools table — they live in `csv_moments` / `glue_humans` and feed `gross_savings_per_year_gbp` via the salary-anchored hours math in step 3.
- **Estimated cost flag:** rows with `cost_confidence: "estimated"` get a `*` after the cost on Page 06 + a footnote: *"estimated; delegate didn't have the figure to hand"*.
- **Salary fallback transparency:** when `loaded_hourly_rate` came from `band_default` rather than a captured salary, Page 02's ROI card shows a footnote: *"Hours-saved valued at the £55/hr median rate for £1M-5M brands; we'll re-anchor to actual salaries the first time you pass them through."*

---

## Decision rules

| Tool seen in stack | Default verdict |
|---|---|
| Helium 10 / Jungle Scout / SellerApp | retire (mostly), → Demand Planning + Advanced PPC |
| Adtomic / Perpetua / Quartile | retire, → Advanced PPC |
| Power BI (per-seat) | retire, → SQL MCP for everyone |
| Notion-as-PM (when they have ClickUp) | consolidate → ClickUp Spaces |
| Generic CRM for influencers / creators | retire, → Creator CRM |
| Generic repricer (multi-marketplace, opaque rules) | retire, → Buybox Repricer |
| ClickUp / Asana / Notion-as-personal-PM / Slack | keep |
| A2X / QuickBooks / Xero | keep |
| Helium 10 keyword-only | consolidate (the data feed survives; the SaaS UI doesn't) |
| Anything labeled `[keep]` in capture | keep (user already declared) |

These are defaults — override when the brain or future-state architecture says otherwise.

---

## Don't

- Don't propose retiring tools that aren't in the brain. The user has to have mentioned the tool.
- Don't make up costs. Use the cost the user gave; if absent, leave blank.
- Don't include the *future* tools (Supabase, n8n) in this table — they're the destination, not what's being retired.
- Don't optimistically claim 100% retirement on a tool whose secondary functions you haven't mapped. Default to **consolidate** if unsure; the user can lock in **retire** later.
- Don't show this table to the user as a chat output during the demo path — it's data for `render-roadmap`. The user sees the rendered version in `roadmap.html`.
