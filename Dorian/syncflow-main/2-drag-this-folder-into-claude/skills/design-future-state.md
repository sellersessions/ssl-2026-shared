# `design-future-state`

**When**
- After `diagnose-sprawl` produces the sprawl diagnosis
- User says *"show me the future state"* / *"what does owned look like for me?"*

**Inputs**
- Output of `diagnose-sprawl` (held in context)
- in-context `brain` object

**Tools**
- `reference/ideal-direct-operating-patterns.md` — read for the structural shape of the ops layer (brand-as-OS template § 2, three-stage NPD pipeline § 3, per-role Ad-Hoc Boards § 4, daily-checks § 5, ScaleReady § 6, Database Repository § 8, Report Hub separation § 10). Cite specific sections by name when describing the future-state ops layer
- chat — describe the future-state architecture
- *(no FS writes)*

**Outputs**
- Owned-state architecture mapped onto the 3 primitives + agents — held in context for `derive-replacement-table` and `render-roadmap`
- A `future_state_narrative` *(1-2 paragraphs, present tense)* describing what the delegate's week looks like 6 months after the migration plan is complete. This populates the closing page (R09) of the roadmap. **Don't skip — without it the closing page reads as generic.**

---

## What "future state" means here

The owned, connected version of their business. Three primitives + agents on top — Sim's pattern from Ideal Direct:

```
        ┌─────────────────────┐
        │ Supabase            │  source of truth
        │ (data, accounts)    │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │ n8n                 │  glue / orchestration
        │ (flows, agents)     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │ ClickUp             │  work surface
        │ (control plane)     │
        └─────────────────────┘
```

Plus **agents** — specific automations the user runs on top, modelled on Sim's 15 case studies. Each agent:

- Reads from Supabase or external sources
- Logic in n8n
- Outputs land in ClickUp (tasks, dashboards, alerts)
- Owned end-to-end. No per-seat fees.

---

## Behaviour

1. **Read the diagnosis.** From `diagnose-sprawl`'s output, you have:
   - List of CSV moments
   - List of redundant rented subs
   - List of black-box tools
   - Source-of-truth conflicts
   - Forecast-off-historicals flag

2. **Map each sprawl signature to one of Sim's 15 archetypes** that retires it. Reference: `reference/architecture.md` "Reference module library — the 15".

   | Sprawl signature | Owned replacement (archetype) |
   |---|---|
   | Helium 10 + SellerApp listing analytics | Demand Planning *(#10)* + SQL MCP *(#13)* |
   | Adtomic black-box ad management | Advanced PPC, in-house *(#09)* |
   | Manual purchase orders / QC reports | Branded Documents *(#07)* |
   | Figma → Seller Central manual upload | Image Upload bottleneck *(#01)* |
   | Influencer spreadsheet | Creator CRM *(#06)* |
   | Forecast-off-historicals + stock pain | Demand Planning *(#10)* |
   | Power BI per-seat / data-team gatekeeping | SQL MCP for everyone *(#13)* |
   | National rank + US scaling | Hyper-local intelligence *(#12)* |
   | Generic repricer + SFP margin loss | Buybox Repricer *(#11)* |
   | Pan-EU listing translation pain | Multi-market localisation *(#02)* |
   | Sponsored Brand asset gaps | SB coverage / Brand Asset App *(#05)* |
   | Manual customer outreach (email / WhatsApp) | WhatsApp outreach *(#08)* |
   | API costs for research/imagery | Local stack overnight *(#14)* |
   | Disconnected agents / silos | ClickUp OS layer *(#15)* — meta |

3. **Decide the foundation.** Always: **Module 01 — Control Plane.** This is the universal foundation — wire ClickUp + Supabase + n8n together with credentials shared, single-project hygiene, and a basic schema. Every brand needs this; nothing else attaches without it.

4. **Output the architecture as consultant prose** *(not a diagram — that's rendered by the report).* Example for the Ideal Direct sample:

   > *"Three primitives. Supabase is your source of truth — every Amazon fact lands there once, reconciled.* n8n *is the glue — every flow logs, retries, alerts. ClickUp is the work surface — your team works there, full stop. No more 'where's the number'.*
   > 
   > *On top, six agents that retire what's broken today:*
   > 
   > - *Demand Planning* *retires the Mondays merge — SQPR + search-volume signals as inputs, brand managers own the number.*
   > - *Advanced PPC* *retires Adtomic — every rule visible, AI-written recommendations.*
   > - *Branded Documents* *retires the inconsistent QC reports and supplier comms.*
   > - *SQL MCP* *retires the Power BI gatekeeping — every brand manager queries Supabase through Claude in plain English.*
   > - *Buybox Repricer* *holds SFP all day, hands cleanly to FBA at 7pm.*
   > - *ClickUp OS* *layer wires it all together — the meta-build.*
   > 
   > *Foundation first (Module 01), then the value modules. Net delta: ~£700/mo of rented retired, 17 hours of senior time back across Cara + Chris + Franc + Simon, ClickUp absorbs six module outputs."*

5. **Write the `future_state_narrative` for page 09 (closing).** 1-2 paragraphs, present tense, written from the delegate's perspective as if they're 6 months into the future. Anchor to specific roles, specific bottlenecks they named, specific tools they're retiring. Don't generalise. Example shape:

   > *"It's a Tuesday morning, six months from now. Chris opens ClickUp at 9am. The Demand Planning list shows three SKUs flagged for replenishment, with quantities and supplier lead times calculated overnight. He approves them in 4 minutes. The Mondays-3hr ritual is gone — and so is the spreadsheet that used to break it. The 17 hours of senior time the team's saved every week, they've spent on Pest X Pro's US launch and the recruitment pipeline that's finally moving.*
   > 
   > *The team has shrunk by zero people, but the team's surface area has doubled. Owned wins what rented can't: the data, the workflow, the leverage."*

   Capture this in `recommendations.future_state_narrative`. **Use the delegate's actual ops-lead name + the specific bottleneck they named in Section 4 + the specific module that retired it.** Generic narratives are slop.

6. **Hand the structured architecture** to `derive-replacement-table` and `recommend-modules`. Don't render the diagram here — that's done at template-fill time by `render-roadmap` using `LiveBlueprint phase="clean"`.

---

## What stays unchanged

Some tools always survive the architecture. Default keeps:

- **ClickUp** — it's the control plane. Even if they barely use it now, it absorbs work.
- **Slack** *(or equivalent)* — narrowed in scope, but keeps as the notification surface.
- **Accounting tool (A2X / QuickBooks / Xero)** — not in scope for syncflow to retire.
- **Their bank, payment processor, payroll** — not consultant scope.

Don't propose retiring these unless the brain explicitly asks.

---

## When to recommend the meta-build (#15 ClickUp OS)

Only when:
- The delegate already has 3+ value modules in scope
- They have a ClickUp Spaces structure already (even if rudimentary)
- They have someone who'll own ClickUp post-build (a brand manager or ops lead)

Otherwise it's premature — value modules first, meta-build later.

---

## Don't

- Don't propose architectures that diverge from the 3-primitive pattern. Custom code orchestration, alternate databases, alternate work surfaces — those are anti-patterns.
- Don't propose more than 7 modules in the future state. Past 7, the migration plan becomes unrealistic.
- Don't include Implementation Mode promises ("syncflow will provision your Supabase"). That's v2; this is consultant-only.
- Don't list every Sim archetype. Pick the ones the diagnosis demands; ignore the rest.
- Don't recommend tools outside the small stack (Claude Code + n8n + Supabase + ClickUp). Hype-train tools belong in personal projects, not the business.
