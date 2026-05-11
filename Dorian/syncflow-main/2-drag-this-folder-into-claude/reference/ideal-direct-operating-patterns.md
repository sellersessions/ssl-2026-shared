# Ideal Direct — Operating Patterns

**Sanitised structural patterns observable from Ideal Direct's actual operating system.**

> **Why this file exists.** `architecture.md` distils the worldview. `sim-knowledge-base.md` preserves Sim's voice on philosophy and the 15 case-study highlight reel. This file fills the missing layer between them: **the concrete structural shape of how a £20M Amazon brand actually operates day-to-day** — visible as space hierarchies, folder taxonomies, naming conventions, and template lists in their ClickUp workspace.
>
> When syncflow recommends *"build a ClickUp ops layer"*, it should not wave at an abstract pattern. It should point here: *"start with the brand-as-OS template — six department folders. If you run multiple brands, replicate the template. Add per-role Ad-Hoc Boards once the team grows past four people."*
>
> **Confidentiality boundary:** every pattern below is observable from list and folder *names alone* — no task content, no SOPs, no SKUs, no supplier identities, no financials. Patterns are taxonomy, not implementation.

**Source:** read-only survey of the Ideal Direct ClickUp workspace, 2026-05-06. Patterns generalised; specific names and identifiers redacted.

---

## 1. The multi-brand operating parent

**The pattern.** One ClickUp workspace; brand sub-structures replicated for each brand under the umbrella. Identical folder shape per brand makes templates, automations, and SOPs *one-to-many* rather than *one-per-brand*.

**Concrete shape.** A "Product Research and Development" space contains a folder per brand. Each brand folder uses the same internal taxonomy *(Ad Hoc list, sourcing lists per product line, product database list)*. The launches space has the same brand-folder pattern. The reorder space has the same brand-folder pattern. **The brand isn't a label — it's a structural unit that repeats across every operational space.**

**Why this matters.** Without this pattern, multi-brand operators end up with N siloed workspaces, N inconsistent SOPs, N independent automations. With it, one improvement to the template propagates to all brands the next time you instantiate.

**Tied to principle.** *Owned > rented* and *plan before execute*. The structure is owned and planned; the brand-specific content fills the structure.

**When syncflow should recommend this.** Delegate runs ≥2 brands and currently has separate tools/folders/repos per brand. Surface as a structural recommendation in `design-future-state` *before* picking specific modules.

---

## 2. The brand-as-OS template *(canonical six-department shape)*

**The pattern.** One brand's space, organised by **department, not by tool**:

| Department | What lives here |
|---|---|
| **Growth** | Launch plans, ad strategy, market expansion, A/B tests |
| **Creatives** | Image briefs, video briefs, listing copy, asset versioning |
| **Demand Forecast** | Demand planning *(not forecasting — see principle below)*, replenishment cadence, stockouts/overstock signals |
| **Operations** | Customer service ops, returns, ratings/reviews, listing health |
| **Logistics** | Inbound shipments, 3PL coordination, freight bookings, dispatch |
| **Finance** | Cost of goods, margin tracking, supplier payments, COGS reconciliation |

Each department is a folder; lists inside are the working surfaces. Custom fields, statuses, and views are configured *per department's needs*, not as one universal flow.

**Why this works.** Most brands organise by tool *(Google Sheets folder, ClickUp folder, Slack folder)* or by phase *(launch projects, ongoing projects, archived)*. Both create handoff cliffs. **Department is the only frame that survives the brand growing from 1 person to 50.**

**Concrete recommendation order if a delegate is starting from zero:**
1. **Operations** first — it's the day-zero surface (customer service inbox, returns).
2. **Logistics** second — once orders flow, dispatch & 3PL coordination dominate.
3. **Demand Forecast** third — when stockouts start hurting, this becomes life-or-death.
4. **Finance** fourth — bring it in once monthly close becomes the bottleneck.
5. **Creatives** fifth — usually informally exists in Figma/Drive; bring into the OS when launching new SKUs becomes the bottleneck.
6. **Growth** last — the most nebulous; needs the other five mature enough to feed it data.

**Tied to principle.** *Lowest-hanging fruit + biggest unlock = priority one.* Don't try to instantiate all six on day one. Build the shape, fill it in priority order.

---

## 3. The three-stage NPD pipeline

**The pattern.** New Product Development is **three lifecycle spaces, not one project space**:

1. **Idea & vetting** — *"Product Research and Development"*. Pre-commitment exploration. Brand folders contain ad-hoc sourcing lists, product database, idea boards, sourcing-stage lists per product line.
2. **Active launch** — *"New Product & Major Relaunches"*. Post-commitment, pre-live execution. Each launch is its own list, identified by a **regional sequence convention** *(format: `<region>-<YY>-<NNN>`, e.g. `UK-99-001`, `US-99-002` — illustrative IDs, year `99` to disambiguate from real launches)*. The list aggregates everything that has to happen for that launch — sourcing, sampling, content, compliance, listing, ad setup.
3. **Reorder / no-major-change** — *"Resourcing Flow: NO MAJOR CHANGE"*. Post-launch repeat orders. Same brand-folder pattern; lighter taxonomy because the SKU is already alive. Carries its own naming convention for reorder runs.

Each stage has a **🗂 template list pinned at the bottom** *(`🗂 CU Flow Template`, `🗂 Reorder Flow Template`)* — the literal scaffolding to copy when starting a new launch or reorder.

**Why three stages, not one.** A single "launches" space conflates fundamentally different lifecycles. Idea-vetting is exploratory and discardable; active launch is committed and high-stakes; reorder is repetitive and SOP-driven. The custom fields, statuses, and views that work for one fail for the others.

**The naming convention unlock.** `<region>-<YY>-<NNN>` is searchable, sortable, and disambiguates the ~hundreds of launches a brand runs over years. Without it: "the new XL board launch" — which one? With it: `UK-99-001` is unambiguous, file-system-friendly, ad-platform-friendly.

**Tied to principle.** *Plan before execute.* The three-stage pipeline is the plan. Each stage's template is the executable.

**When syncflow should recommend this.** Any delegate launching ≥6 SKUs/year. Below that, one space is fine — three is over-engineering.

---

## 4. Per-role Ad-Hoc Boards + the personal-workspace pattern

**The pattern.** Every key person on a team gets an **Ad-Hoc Board** — a personal list inside the relevant department space, named `<Person> - <Role> Ad Hoc Board`. Catch-all for work that doesn't fit a project board: spontaneous tasks, follow-ups, meeting outputs, things-to-remember.

For people whose work spans multiple departments *(usually senior or coordination roles)*, the pattern escalates to a **personal space** — a top-level space named after the person, with their own internal department folders *(Dispatch, Customer Service, Meetings, Suppliers, etc.)*.

**Why this exists.** Without an explicit personal surface, ad-hoc work either:
- Lives in someone's head *(forgotten)*, or
- Lives in their email inbox *(invisible to the team)*, or
- Pollutes project boards *(noise)*.

Giving each person a sanctioned personal surface offloads cognitive load to the system without polluting shared spaces. Other team members can still see the board for context.

**The progression is ladder-shaped:**
1. **Just an Ad-Hoc Board** for individual contributors *(IC engineer, junior ops)*.
2. **Ad-Hoc Board + watching project boards** for senior ICs.
3. **Personal space with department folders** for cross-functional roles *(coordinators, ops leads, founders)*.

**Tied to principle.** *Remove the human, don't accelerate them.* Applied at the cognitive layer: the human's working memory shouldn't be the operating system. The board is.

**When syncflow should recommend this.** Team ≥4 people, OR ≥2 cross-functional roles. Below that, the founder's notebook is fine.

---

## 5. The daily-checks pattern

**The pattern.** Operational hygiene that "should happen every day" is encoded as **a recurring list** with checklists, not as a manager's mental note.

Examples observed: `Dispatch Daily Checks`, `Forklift Daily Checks`, `Warehouse Daily Checks`. Each one is a list with the day's checks as tasks; recurrence handles the daily roll-over.

**Why this works.** Operational risks compound silently — the dispatch lane tape that's slowly getting unstuck, the forklift safety check that's been quietly skipped for two weeks. By the time the failure happens, the chain of skipped checks is long. A recurring list:
- Surfaces the check whether or not anyone remembers
- Records *who* checked it and *when*
- Creates an audit trail for compliance / insurance / incident review
- Is far cheaper than building a real "checklist app" — ClickUp does it for free

**Tied to principle.** *Verification > speed.* Each daily check is a hard-coded verification step. *Working local doesn't count* applied to operational hygiene: if the check only happens when someone remembers, it isn't a check.

**When syncflow should recommend this.** Any operationally-physical surface — warehouse, fulfilment, in-house production, equipment-with-safety-implications. Knowledge-work surfaces *(content review, code review)* benefit from the pattern but feel slower-moving and are less critical.

---

## 6. ScaleReady — process discovery → SOP creation

**The pattern.** A two-stage framework, scoped by department, for going from *"we have processes that exist"* to *"they're documented well enough to be automated"*:

| Stage | What gets produced | Per department |
|---|---|---|
| **Stage 1 · Process Flows** | Map *what actually happens* — every step, every handoff, every decision point. Diagrammatic / list-based, low-fidelity. | Finance / Supply Chain & Operations / Sales & Marketing / Content & Creatives / HR & Recruitment / Customer Service |
| **Stage 2 · SOP Creation** | Turn the maps into written, repeatable procedures. Higher fidelity. Reviewed. Version-controlled. | Same six departments |

Each department gets its own list inside Stage 1 and Stage 2. The same six departments. Always.

**Why this order.** You cannot write an SOP for a process that hasn't been mapped — you'll codify what *should* happen, not what *does*. Stage 1 surfaces the gaps between the official process and reality; Stage 2 closes them deliberately.

**The third stage *(implicit, post-Stage-2)*** — automation. Once an SOP is documented, it can be automated. But automation skips both stages prematurely if you don't have the SOP to encode.

**Tied to principle.** *Plan before execute* applied to process work itself. The 80%-handoff applied at the documentation layer: Stage 1 is the 80% rough sketch; Stage 2 is the 20% polish.

**When syncflow should recommend this.** Delegate is ≥2 years in, has been running on tribal knowledge, and is now hitting the wall where new hires can't onboard because nothing is written down. Most pre-£5M brands aren't there yet; most £10M+ brands desperately need this.

---

## 7. Templates as first-class artefacts

**The pattern.** Operating templates are visible, named, and pinned in the workspace itself — not hidden in a "templates" admin panel.

Concrete examples: `🗂 CU Flow Template`, `🗂 Reorder Flow Template`, `New Product Development Template`. They sit at the bottom of their respective spaces, marked with the 🗂 emoji, and are the literal copy-source for new launches/reorders/products.

**Why this matters.** When templates live in admin panels:
- Nobody remembers they exist
- They drift from reality because no one uses them
- New work starts from a blank slate, recreating mistakes

When templates live alongside the work they spawn:
- They're the obvious starting point
- They get updated when reality changes *(because the person editing the template is also the person doing the work)*
- The 🗂 emoji is a visual cue: "this is the recipe, not a real launch"

**Tied to principle.** *Pick a small stack, go deep, ship.* Templates are how you compound — small stack improvements propagate every time the template instantiates.

**When syncflow should recommend this.** Any delegate launching/reordering at frequency ≥2/month. Below that, copy-paste is fine.

---

## 8. The Database Repository pattern

**The pattern.** Master reference data lives in a **separate space** dedicated to it, not inside operational tools.

Example: a "Database Repository" space holds Stock Locations, Forwarders List, Sample Info & Locations, Product List 4.0, Supplier List 4.0. Note the **`4.0` versioning** — these aren't accidental ad-hoc lists; they are deliberately maintained, versioned, and rebased.

**Why separation matters.** Master data has different needs from operational data:
- It changes *less frequently* but *more deliberately* — schema changes, vendor swaps, location rebases
- It's *referenced* by operational tools, not *created* by them
- Different access patterns *(read-heavy vs write-heavy)*
- Different audit needs *(every change to "supplier list" is significant)*

When master data is buried inside an operational tool, it fragments — three different "supplier lists" emerge in three different ClickUp folders, all subtly different. The Database Repository pattern centralises the source of truth.

**Tied to principle.** *Owned > rented.* Master data is the most expensive thing to lose; it deserves its own space.

**When syncflow should recommend this.** Any delegate ≥30 SKUs and/or ≥10 suppliers. Below that, a single Google Sheet survives.

---

## 9. The per-partner co-working space

**The pattern.** Major external partners *(suppliers, agencies, freight forwarders)* get a **shared top-level space** — `Brand × Partner` — where work flowing between the two organisations lives.

**Why this works better than email or a shared folder:**
- Tasks are first-class, with status, owner, due date — not buried in email threads
- Both sides see the same view *(no "did you get my email?" failures)*
- History is preserved when the human contact on either side rotates
- Sensitive internal context stays out *(only the work-shared-with-this-partner is in this space)*

**The three observed examples** *(redacted to pattern level)* — a sourcing partner, a freight/3PL partner, and a manufacturing partner. The pattern repeats whenever a partner is doing enough work to warrant durable shared infrastructure.

**Tied to principle.** *Remove the human, don't accelerate them* applied to inter-org coordination. The shared space is the system; the human is the participant.

**When syncflow should recommend this.** Any partnership doing ≥10 ongoing tasks/month for ≥3 months. Below that, shared docs or email threads are cheaper.

---

## 10. Report Hub separation

**The pattern.** Outputs *(dashboards, reports, summaries)* live in a **separate top-level space** from operational lists.

**Why.** Operational lists are write-heavy and high-noise; reports are read-heavy and low-noise. Mixing them creates noise pollution: people glancing at reports get distracted by ops chatter, and people working in ops drift into reading reports.

The pattern also creates a deliberate publication step: a report only lands in Report Hub when it's ready for stakeholders. That step prevents half-baked dashboards from being mistaken for finished ones.

**Tied to principle.** *Plan before execute.* The Report Hub is where the plan reads itself back; ops lists are where execution happens.

**When syncflow should recommend this.** Any delegate producing ≥3 recurring reports/dashboards. Below that, a `reports/` folder inside ops is fine.

---

## What this proves about the worldview

The 12 principles aren't abstract — they're observable in this structure:

| Principle | Where it shows up here |
|---|---|
| **Owned > rented** | Database Repository as a first-class space; `4.0` versioning of master data; templates pinned in workspace not in admin panels |
| **Plan before execute** | Three-stage NPD pipeline; ScaleReady Stage 1 → Stage 2 ordering; brand-as-OS shape before content |
| **Verification > speed** | Daily-checks pattern; per-launch lists with explicit handoff statuses |
| **A→Z over feature-by-feature** | Brand-as-OS template covers all six departments before any one is mature |
| **Push back hard** | The Stage 1 → Stage 2 split refuses to skip ahead to automation |
| **Working local doesn't count** | All operational surfaces are in ClickUp, not local apps; daily-checks must run whether the manager is in office or not |
| **Remove the human, don't accelerate them** | Per-role Ad-Hoc Boards; daily checks; partner co-working spaces |
| **Lowest-hanging fruit + biggest unlock = priority one** | Brand-as-OS recommended order *(Operations → Logistics → Forecast → Finance → Creatives → Growth)* |
| **AI does 50–80%; the last 20% takes longer** | ScaleReady Stage 2 is explicitly the "polish" layer that takes longer than Stage 1 |
| **Pick a small stack, go deep, ship** | Everything fits in ClickUp; no per-department tool sprawl |

---

## Caveats

**This is one brand at one stage.** Ideal Direct in 2026 is a £20M operation running 9 brands across UK/EU/US with ~30+ employees. The patterns scale down to smaller operations only with adaptation:

- Below £1M / 1 brand / <5 people: the brand-as-OS template is overkill. A single shared space with department-as-tag is sufficient.
- £1M–£5M / 1–3 brands / 5–15 people: introduce per-role Ad-Hoc Boards and the brand-as-OS template. Skip ScaleReady.
- £5M–£20M / 3+ brands / 15+ people: full multi-brand parent + ScaleReady + Database Repository pattern.

**Patterns are templates, not laws.** Every delegate's stack will deviate — different department names, different naming conventions, different partner mix. Use these as starting shapes, not endpoints.

**One snapshot of an evolving system.** This survey was taken at a point in time. Sim's team is actively building the ClickUp 4.0 AI layer on top of these structures; future versions of this file should refresh from new observations.

---

## How syncflow should use this file

When the active conversation hits any of the following triggers, syncflow should consult the relevant section of this file and cite it explicitly *(don't paraphrase — point at the pattern by name)*:

| Trigger in conversation | Section to surface |
|---|---|
| Delegate runs multiple brands | §1 — multi-brand operating parent |
| Delegate is rebuilding their ops layer | §2 — brand-as-OS template, with recommended order |
| Delegate launches ≥6 SKUs/year | §3 — three-stage NPD pipeline |
| Team is ≥4 people, multiple cross-functional roles | §4 — per-role Ad-Hoc Boards |
| Operational surface with hygiene risk *(warehouse, dispatch)* | §5 — daily-checks pattern |
| Delegate is ≥£10M and onboarding new hires struggle | §6 — ScaleReady |
| Delegate launches/reorders ≥2/month | §7 — templates as first-class |
| ≥30 SKUs and/or ≥10 suppliers | §8 — Database Repository pattern |
| Partnership doing ≥10 tasks/month for ≥3 months | §9 — per-partner co-working space |
| ≥3 recurring reports/dashboards | §10 — Report Hub separation |

When syncflow cites this file in a `recommend-modules` or `design-future-state` output, the citation should look like:

> *"For the ops layer, use the **brand-as-OS template** *(see `reference/ideal-direct-operating-patterns.md` §2)* — six department folders, recommended order: Operations → Logistics → Demand Forecast → Finance → Creatives → Growth."*

Specific. Citable. Replicable.
