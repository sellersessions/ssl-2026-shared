# `recommend-modules`

**When**
- After `design-future-state` and `derive-replacement-table` have run
- User says *"what should I build first?"* / *"what's the order?"*

**Inputs**
- in-context `brain` object
- Architecture map from `design-future-state`
- Replacement table from `derive-replacement-table`

**Tools**
- `reference/architecture.md` — read for the 15-archetype catalogue + recommended-first logic
- `reference/sim-knowledge-base.md` — read for case-study detail when sequencing
- `reference/ideal-direct-operating-patterns.md` — read for the structural shape of the ops layer when sequencing modules around an operating-system rebuild *(brand-as-OS template, three-stage NPD pipeline, per-role Ad-Hoc Boards, daily-checks, ScaleReady, etc.)*. Cite specific sections by name when they apply
- `reference/method-principles.md` — read to keep P1 (remove the human, not speed them up), P7 (cuts beat optimisations), P8 (repeatable beats clever) in front of mind when picking modules
- `reference/simplicity-ladder.md` — read at the build/buy moment. Default to the lowest rung that genuinely solves the problem. Reuse what the delegate already pays for before recommending new SaaS or custom code
- `reference/universal-amazon-wins.md` — read **after** picking the brand-specific modules. Cross-check brand profile against the 8 universal triggers; surface the top 3–5 that pass as a "Universal Opportunities" addition
- `reference/role-templates.md` — read when the conversation surfaces a specific role's friction; use the watch-outs to validate the module fits the leak
- `reference/tool-catalogue/tier1.md` — read the relevant tool's section when proposing a tool inside a module (verified pricing, gotchas, common-pattern context). 22 entries, one per H2 section.
- `reference/skills-bible/SKILLS_BIBLE.md` — read § 7 *(Quick Reference Index)* when sequencing modules that depend on auth-heavy / event-driven / multi-marketplace patterns. The index calls out non-obvious gotchas *(SQS principal IDs, RDT requirements, FIFO-not-supported)* that materially affect effort estimates. Don't pull the deep-dives at this stage — they belong to `generate-build-plan`.
- chat — explain the sequence to the user

**Outputs**
- Ordered module list — array of richly-populated module objects:
  ```
  {
    n, name, weeks, effort, deps, status,
    rung,            // INT 1-7 — Simplicity Ladder rung this module sits on
    rung_label,      // STRING — short rung explanation (e.g. "rung 1 — already owned, untouched")
    complexity_grade, // STRING — Track F (Sim #9). "Beginner" | "Intermediate" | "Advanced". Computed from effort_hours + deps.length + tool count. Page 07 renders this as the headline badge; raw hours move to a tooltip.
    dependency_failure_mode, // STRING | null — Track F (Sim #21). One-line "what breaks if a dep fails." Surfaces as a callout on Page 07. Null for foundation modules.
    min_revenue_band, // STRING | null — Track F (Sim #16). Revenue floor. Modules above brain.revenue_band drop to recommendations.deferred_modules[].
    problem,         // the bottleneck it kills, in the delegate's own language
    outcome,         // hours saved, errors prevented, KPI moved
    prerequisites,   // skills, tools, data, people you need first (array)
    owners,          // {primary, contributors[], approver} — derived from brain.team.roles
    key_metrics,     // 2-3 things to measure to know it worked (array)
    projected_savings_per_year_gbp,    // NUMBER or null — £/yr this module saves/recovers
    projected_hours_saved_per_week,    // NUMBER or null — hrs/wk reclaimed for the affected role(s)
    roi_confidence,                     // "high" | "medium" | "low" | null
    week_after,      // narrative — "your Tuesday after this is built"
    risks            // [{risk, mitigation}, ...]
  }
  ```
- **`recommendations.deferred_modules[]`** *(Track F · F3)* — modules the revenue-band or capacity-fit filter dropped, with `defer_reason`. Page 07 footer renders these as *"Phase 2 — once capacity / revenue scales."* Empty array when no filtering occurred.
- **`recommendations.scope_mode ∈ { "starter" | "full" }`** *(Track F · F3)* — `"starter"` when capacity forced a cut to ≤ 3 modules + Immediate Wins; otherwise `"full"`. Drives Page 07 layout (starter mode collapses module grid, foregrounds Immediate Wins).
- **`recommendations.featured_module`** *(Track F · F3)* — module n derived by score, not the default *recommended-start* fallback. See step 10d.
- A `universal_opportunities` array — **always populated, 3–5 items**, even if some triggers are weak:
  ```
  {
    uw_id,           // "UW-01" .. "UW-08"
    name,            // short title
    why_relevant,    // 1 sentence — what brain signal triggered it
    effort,          // "1 day" / "2-3 days" / etc.
    deps             // module IDs from the modules array, if any
  }
  ```
- One module flagged with `status: "recommended start"`
- One module flagged with `status: "foundation"` (always Module 01 · Control Plane)
- The richer fields drive the deeper Page 07 (Migration plan) + Page 08 (Featured module) renders. **Don't skip them — a module without `problem` / `outcome` / `week_after` / `rung` will render shallow.**
- **`rung` is required on every module.** Module cards on Page 07 render a rung pill from this field. If you skip it, the artifact renders without ladder context — defeats the cherry-pick.
- **`universal_opportunities` is always emitted.** Renders as a section in the artifact AND surfaces in the post-emission chat handoff. If no UW triggers cleanly, fall back to the universals weakest-relevant by archetype.

---

## What you're picking

The 15 Sim archetypes from `reference/architecture.md` are the canonical menu. From them, pick **5–7 modules** for the delegate's blueprint. More than 7 makes the migration plan unrealistic; fewer than 5 means you're under-recommending or the brain is too thin.

Plus **Module 01 — Control Plane** as the foundation. Always. Universal.

---

## Behaviour

1. **Read the diagnosis + architecture map + replacement table** *(all in context)*.

2. **Pick the modules.**
   - Start with **Module 01 · Control Plane** (foundation — always).
   - For each retired tool in the replacement table, the destination module is on the list.
   - Add 1–2 modules that aren't tied to a retired tool but address a brain-flagged bottleneck (e.g. founder said *"if I could automate one thing it'd be QC reports"* → Branded Documents *(Sim #07)*).
   - Cap at 7 total.

3. **Pick the recommended start.** Apply the `reference/architecture.md` § "How syncflow recommends a 'first build'" logic, in order:
   1. Figma → Seller Central uploads in their flow → **Image Upload bottleneck** *(Sim #01)*. Highest-impact "remove the human" win.
   2. Manual purchase orders / QC reports / supplier comms → **Branded Documents** *(Sim #07)*.
   3. Spreadsheet-based influencer / creator ops → **Creator CRM** *(Sim #06)*.
   4. SaaS pain (Adtomic / Scale Insights / generic repricer) → **Advanced PPC** *(Sim #09)* or **Buybox Repricer** *(Sim #11)* depending on the SaaS.
   5. **Catch-all** → **Demand Planning** *(Sim #10)*. Every Amazon brand has stock pain; the lift is universal. *(In the Ideal Direct sample, recruitment beats demand-planning to recommended-start because it's the founder's stated #1 bottleneck — but Demand Planning still wins as featured-module per F3 score.)*

4. **Sequence the rest.**
   - Foundation (Module 01) is always first.
   - Recommended-start is Module 02.
   - Modules with the lowest dependencies come early.
   - Modules that unlock multiple downstream modules (Control Plane, Demand Planning, SQL MCP) come earlier than leaf modules.
   - Meta-build (ClickUp OS layer #15) is always last — it wires the others together; nothing to wire if they're not built yet.

5. **Estimate effort.** Per module, use these defaults — adjust if the delegate's stack makes it bigger/smaller:

   | Archetype | Default effort | Default weeks |
   |---|---|---|
   | Control Plane (Module 01) | 8 hrs | wk 1–2 |
   | Demand Planning (#10) | 16–24 hrs | wk 2–5 |
   | Advanced PPC, in-house (#09) | 20 hrs | wk 4–8 |
   | Branded Documents (#07) | 8 hrs | wk 6–8 |
   | SQL MCP (#13) | 12 hrs | wk 8–11 |
   | Buybox Repricer (#11) | 14 hrs | wk 10–13 |
   | Creator CRM (#06) | 30 hrs | wk 6–11 |
   | Image Upload bottleneck (#01) | 12–16 hrs | wk 4–7 |
   | SB coverage (#05) | 16 hrs | wk 8–12 |
   | Hyper-local intelligence (#12) | 18 hrs | wk 10–14 |
   | Multi-market localisation (#02) | 12 hrs | wk 6–10 |
   | Local stack overnight (#14) | 30+ hrs | wk 12–16 |
   | ClickUp OS layer (#15) | 16 hrs | wk 12–16 |

6. **Populate the depth fields per module.** For each module in the list, derive these fields from the brain + reference content. **Do not skip any field — empty strings render as gaps in the report.**

   | Field | How to populate |
|---|---|
   | `problem` | Pull the bottleneck this kills, **in the delegate's own language**. Cross-reference to the relevant entry in `brain.sections.team.bottleneck`, `brain.sections.stack.csv_moments`, or `brain.sections.goals.single_biggest_bottleneck`. If multiple match, pick the most specific. |
   | `outcome` | Pull from `reference/sim-knowledge-base.md` § 5 case studies for the matching archetype. Sim's voice is rich on outcomes — quote or paraphrase: "98% in-stock for the first time ever", "15 hrs/week recovered", etc. |
   | `prerequisites` | Array. Skills (e.g. "n8n familiarity"), tools (e.g. "Brand Analytics access"), data (e.g. "30 days of SQPR exports"), people (e.g. "1 technical owner ~50% time for 2 wks"). 3–5 items. |
   | `owners` | `{primary, contributors[], approver}`. Derive from `brain.sections.team.roles`. **Primary** = the one person whose Monday changes most when this ships — match the module's `problem` to the role whose bottleneck is being killed *(Demand Planning → the inventory analyst / operations lead; Recruitment Pipeline → the recruitment lead / people director; Image Upload → the listing / creative lead)*. **Contributors** = 0-3 others with meaningful build-or-run involvement. **Approver** = the founder/director or the delegated lead who signs off scope + ROI. If `brain.sections.team.roles` is empty or thin, fall back to **generic role labels** in the same shape — *"recruitment lead"*, *"tech lead"*, *"ops director"* — never fabricate a name. Drives the *"Whose Monday changes"* column on the Page 07 First 30 Days table. |
   | `key_metrics` | Array. 2-3 concrete measurable signals that prove the module worked. Each is metric + target. E.g. *"Stockout frequency (target: <2%)"*, *"Manual hours/week on planning (target: <30 min)"*, *"Forecast accuracy at SKU level (target: >85%)"*. |
   | `week_after` | Narrative — 1-3 sentences, present tense. *"Your Tuesday morning, you open ClickUp. The Demand Planning list shows three SKUs flagged for replenishment with quantities, lead times, confidence intervals already calculated overnight. You glance, approve, send. 4 minutes."* |
   | `risks` | Array of `{risk, mitigation}`. 1-3 items. Use Sim's "honest truths" voice — *"AI does 80% in an hour, last 20% takes a week"*-style realism. |

   Default richer-field templates per archetype live in `reference/sim-knowledge-base.md` § 5. Use them; adjust to the delegate's context.

7. **Output the structured plan:**

   ```
   modules: [
     {
       n: "02", name: "Demand Planning",
       weeks: "wk 2–5", effort: "16–24 hrs", deps: "01", status: "recommended start",
       rung: 4, rung_label: "rung 4 — n8n + Supabase, glued to existing SP-API",
       problem: "Every Monday, your inventory analyst pulls 4 CSVs from SoStocked, Helium 10, Brand Analytics, and Seller Central. Stitches them in a spreadsheet. ~3 hrs, error-prone, single point of failure.",
       outcome: "98% in-stock for the first time. Brand managers own the number — not the spreadsheet, not the tool. SQPR + search-volume signals replace historical-sales guessing.",
       prerequisites: ["Brand Analytics access", "SQPR feed pulled into a database", "n8n instance (local OK for dev, hosted for prod)", "1 technical owner at ~50% for ~3 wks"],
       owners: { primary: "Chris", contributors: ["tech lead"], approver: "Sim" },
       key_metrics: ["Stockout frequency (target: <2%)", "Manual planning hours/week (target: <30 min)", "SKU-level forecast accuracy (target: >85%)"],
       projected_savings_per_year_gbp: 28000,    // 12 hrs/wk × £45/hr × 52 wks midpoint
       projected_hours_saved_per_week: 12,        // Adam's Monday ritual + spillover
       roi_confidence: "high",                    // brain has explicit hours + named role
       week_after: "Your Tuesday morning: you open ClickUp's Demand Planning list. Three SKUs flagged for replenishment, with quantities, supplier lead times, confidence intervals already calculated overnight. You glance, approve, send. 4 minutes — vs the 3-hour Monday ritual.",
       risks: [
         { risk: "Seller Central API rate limits hit during the 14-day moving window calc.", mitigation: "Cache intermediate results; run incrementally not all-at-once." },
         { risk: "Brand managers resist owning the number — it's been the analyst's job.", mitigation: "Roll out with one brand, prove the win, then expand. Don't force it." }
       ]
     },
     // ... other modules with same field set, rung field included
   ],
   universal_opportunities: [
     { uw_id: "UW-01", name: "SQPR × PPC gap-filler", why_relevant: "Brand Analytics + active PPC + SP-API access — gap keywords are sitting visible.", effort: "2-3 days", deps: ["02", "04"] },
     { uw_id: "UW-04", name: "Branded search cannibalisation audit", why_relevant: "Active brand-name search volume + Ads API access — defunding offensive cannibalisation is a one-month win.", effort: "2 days", deps: [] },
     { uw_id: "UW-08", name: "A+ content coverage audit", why_relevant: "Brand Registered + multiple ASINs — long-tail without A+ is the typical 5–10% CVR uplift.", effort: "1 day", deps: [] }
     // ... 3-5 entries always
   ]
   ```

8. **Pick the featured module** for the deep-dive page (R08 of the report). Default: the recommended-start module. The featured module gets a full module-page treatment with verification plan.

9. **Cross-check against universals.** After the 5–7 brand-specific modules are picked, walk `reference/universal-amazon-wins.md`. For each of UW-01 through UW-08, evaluate the trigger condition against the brain *(channels, SKU count, PPC scale, stack, Brand Registry status, returns volume)*. Queue any that pass. Rank by impact × effort × synergy with the picked modules. Surface the **top 3–5** as a `universal_opportunities` array alongside `modules`. If the brand-specific picks are thin (weak brain), promote universals to the front of the recommendation. **Every roadmap produces actionable wins.**

10. **Audit each module against the Simplicity Ladder — and write the rung onto the module.** For every module, set `rung: <1-7>` and `rung_label: <short string>` in the structured output. The label is short enough to fit a pill on the artifact card *(e.g. "rung 1 — already owned, extended"; "rung 4 — n8n flow"; "rung 7 — custom build, justified")*. If a lower rung *almost* works, name what it's missing in the rung_label *(e.g. "rung 5 — Cowork can't poll on schedule, so Claude Code routine")*. Modules that quietly assume rung 6–7 without that check are red-flagged.

    **The rung must travel into Page 07 of the artifact and the chat handoff.** Render-roadmap renders it as a pill on each module card. Without it, the cherry-pick is invisible. Do not skip.

10a. **Grade complexity** *(Track F · Sim #9)*. For every module, compute `complexity_grade ∈ { Beginner | Intermediate | Advanced }` from three inputs: `effort_hours` *(midpoint of the range)*, `deps.length` *(count of upstream module dependencies; comma-split the deps string)*, and `tool_count` *(distinct tools/primitives the module touches — read from the prerequisites array)*.

    | Tier | Trigger *(any one of)* |
    |---|---|
    | **Beginner** | effort_hours ≤ 16 AND deps.length ≤ 1 AND tool_count ≤ 2 |
    | **Intermediate** | effort_hours 16-32, OR deps.length == 2, OR tool_count 3-4 |
    | **Advanced** | effort_hours > 32, OR deps.length ≥ 3, OR tool_count ≥ 5 |

    The highest-tier trigger wins *(Advanced supersedes Intermediate which supersedes Beginner)*. Persist as `module.complexity_grade`. Page 07 (F5) renders this as the headline badge — raw hours move to a tooltip.

10b. **Apply revenue-band filter** *(Track F · Sim #16, F3)*. For every module with `min_revenue_band` populated:
    - Compare to `brain.revenue_band`. Bands ordered: `<£250k` < `£250k-1M` < `£1M-5M` < `£5M-20M` < `>£20M`.
    - If `module.min_revenue_band > brain.revenue_band` → **drop from `recommendations.modules[]`**, append to `recommendations.deferred_modules[]` with `defer_reason: "min_revenue_band ({{module.min_revenue_band}}) above current ({{brain.revenue_band}})"`. Page 07 renders these in a "Phase 2 — once revenue scales" footer.
    - If `brain.revenue_band` is null → keep all modules; flag in chat output that revenue_band wasn't captured and recommendations are unfiltered.

10c. **Apply capacity-fit filter** *(Track F · Sim #16, F3 — the binding constraint)*. After the revenue-band filter:
    - Compute envelope: `available_hours = brain.team.capacity_hours_per_week × 16 × 0.4` *(16-week migration plan; 40% of stated capacity is realistic for build work alongside running the business)*.
    - Sum `effort_hours` *(midpoint)* across `recommendations.modules[]`.
    - **If sum > available_hours**: drop the highest-rung modules first *(rung 6-7 before rung 4-5 before rung 1-3 — start with the most ambitious)* until sum ≤ available_hours. Move dropped modules to `recommendations.deferred_modules[]` with `defer_reason: "capacity-fit (envelope {{available_hours}} hrs vs sum {{sum}} hrs)"`.
    - **Always keep Module 01 Foundation in the kept set**, even if it pushes the envelope — without it nothing else is buildable. If the foundation alone exceeds the envelope, the answer is *"start with Wispr Flow + ClickUp brand-as-OS template only"* — set `recommendations.scope_mode = "starter"` and emit only Immediate Wins on Page 07.
    - **Solo founder check:** if `capacity_hours_per_week ≤ 15` → cap kept modules at 3 regardless of envelope arithmetic; further modules are theoretical at that capacity. Set `recommendations.scope_mode = "starter"` if cap fires.
    - Persist `recommendations.scope_mode ∈ { "starter" | "full" }` based on whether the envelope held the original module set or forced a starter cut.

10d. **Derive featured_module — dynamic** *(Track F · Sim #18)*. Replace the v1 default *(featured = recommended-start)* with a score:

    ```
    score(module) = 0.5 × (roi / max_roi)
                  + 0.3 × (1 − complexity_index / 3)
                  + 0.2 × (tools_owned_overlap / total_tools)
    where:
      roi = projected_savings_per_year_gbp || 0
      max_roi = max(projected_savings_per_year_gbp across kept modules)
      complexity_index: Beginner=1, Intermediate=2, Advanced=3
      tools_owned_overlap = count of module.prerequisites that match
                            tools in brain.sections.stack.tools where tone in {owned, owned-untouched, keep}
      total_tools = max(1, module.prerequisites.length)
    ```

    Highest score wins. Persist as `recommendations.featured_module = "<n>"` *(string, e.g. "02")*. Page 08 already templates against this field — F3 only fills it correctly. **Tie-breaker:** if two modules tie on score, prefer the one with lower complexity_index *(Beginner > Intermediate > Advanced)* — closer to the delegate's reach.

    **Sanity check before render:** `featured_module` must be in `recommendations.modules[]` *(not in `deferred_modules[]`)*. If the highest-score pick was dropped by the capacity filter, fall back to the highest-score pick that survived.

11. **Project ROI for each module.** Set three new fields:

    - `projected_savings_per_year_gbp`: a number or null. **Don't fabricate.** Derive only from explicit signal in the brain:
      - SaaS spend captured in `brain.sections.stack.tools[*].monthly_cost` × 12 → if module retires the tool, the saving is straight off
      - Hours/week reclaimed × hourly cost *(default if unknown: £40/hr UK, £60/hr US)* × 52 weeks → if the role is named in `brain.sections.team.roles`
      - Sim case-study deltas in `reference/sim-knowledge-base.md` § 5 *(e.g. demand planning recovered 98% in-stock + 3 hrs/week on Mondays — translate to £)*
      - Use the **midpoint of a defensible range**, not the optimistic end. Example: *"Demand planning saves Adam ~12 hrs/week (range 8-16) at £45/hr blended → £28k/yr midpoint"*.
    - `projected_hours_saved_per_week`: number or null. Same discipline.
    - `roi_confidence`: `"high"` if both numbers come from explicit brain signal *(captured Clockify, named SaaS cost)*; `"medium"` if inferred from stack scale; `"low"` if best-guess.

    **If you can't justify a number, set it to null.** Page 02's ROI card only renders when 3+ modules have at least one projection. Don't pad weak modules with fluffy numbers — that's worse than empty.

12. **Audit the totals.** Sum `projected_savings_per_year_gbp` across modules where `roi_confidence != "low"`. Sum `projected_hours_saved_per_week` same way. Cross-check against `brain.recommendations.replacement.net_savings` and `replacement.net_hours_reclaimed` *(if populated)* — they should be in the same order of magnitude. If they diverge wildly, surface the gap in the chat output before render. Stale net-savings is a render risk.

---

## When to add a module not in the 15 archetypes

Only when:
- The delegate's stack genuinely has a bottleneck that no Sim archetype covers
- AND the bottleneck is high-impact (not a one-off)
- AND it can be built in the small stack (Supabase + n8n + ClickUp)

If you add one, label it clearly as *"new pattern, not in Sim's case studies — building this is research as well as implementation."* Don't quietly invent.

---

## Don't

- Don't recommend more than 7 modules. Real teams can't ship 10 in a quarter.
- Don't propose modules that depend on tools the delegate hasn't expressed willingness to adopt. *(Never assume they'll switch from Asana to ClickUp without checking.)*
- Don't sequence by "most interesting." Sim's principle #10 — lowest-hanging fruit + biggest unlock = priority one.
- Don't load the dependency graph with cross-module deps unless they're real. Most modules depend only on Module 01.
- Don't promise specific savings per module unless the brain has the cost data. Round numbers (*"~$200/mo"*) are fine; specific *"$179/mo"* requires brain confirmation.
- Don't skip the verification plan when designing each module. *Every plan ships with a verification plan* (worldview principle #4).
