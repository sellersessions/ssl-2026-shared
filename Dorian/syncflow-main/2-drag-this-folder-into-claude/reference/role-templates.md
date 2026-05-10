# Role Templates · per-role time-sink shapes + founder watch-outs

> **Source:** Sim's huntr-handover · file 07. Cherry-picked into syncflow as reference for any team-friction or delegation moment in a roadmap discussion. Originally written as Clockify category templates (huntr's data-collection model); the **shape of the work** + **founder watch-outs** apply regardless of how the data is captured.

---

## How syncflow uses this

When the roadmap conversation surfaces a specific role's friction (*"Sarah is overwhelmed in CS"* / *"Maya can't keep up with image uploads"* / *"the brand manager is still hand-pulling Power BI exports"*), reach for that role's section here. The watch-outs are the leak signatures. Match them to archetype modules in `architecture.md` and universals in `universal-amazon-wins.md`.

The Clockify category templates in each section are a useful **shape of the work** — they show what good time-tracking looks like for that role, and they double as a checklist of "things this role typically does." If the delegate is interested in actually capturing time data per employee, that's a separate engagement (Sim's huntr tool); for syncflow's purposes, the role-shapes alone are what's useful.

---

## Universal briefing script (when the delegate wants to ask their team)

If a delegate decides to capture team-time data themselves, this is the framing — keeps it a waste-hunt, not an audit.

> **Sit-down with the employee, 30 mins, 1:1.**
>
> "I'm running a process across the team — every person, one at a time, over the next year or so. The aim isn't to audit your work. The aim is to find the bits of your week that drag — the parts where you're doing repetitive admin, waiting for someone, or grinding through formatting. The kind of work that's eating your time but isn't using your skills.
>
> The reason: AI tools have got really good at the boring 80% of work. If we can take that off your plate, you spend more time on the thinking parts of the role — the bits you actually want to be doing. We've already done this with [name] in [team] and they got back ~[X] hours a week.
>
> To do this well, I need data on where your time actually goes. Memory and gut feel are wrong about half the time — yours and mine. So for the next two weeks, I'd like you to log how long you're spending on different tasks. It takes 30 seconds at a time.
>
> Then we'll sit down for 30 minutes, look at the data together, and figure out what to fix. Likely we'll build something — a Cowork project, an n8n flow, a Figma plugin — that takes the most painful bit off your plate.
>
> A few things upfront:
>
> 1. **This is not a surveillance tool.** I'm not checking your hours. I'm looking for patterns we can fix.
> 2. **The aim is to expand your role, not shrink it.** People who are good at AI grow in this business. People who insist on doing the same admin forever stay where they are.
> 3. **Be honest in the categories.** If you're stuck waiting for someone for two hours, log that as 'blocked / waiting on [name]' — it's a system problem, not a you problem.
> 4. **Better category names = better solutions.** I'll show you the format."

---

## Category formatting rules

> **Format: `[System] · [Action] · [Subject] · [Optional: Marketplace/Channel]`**
>
> - "Amazon · Image upload · Listing main image · UK"
> - "Cowork · Document drafting · QC report · Tydi factory"
> - "Slack · Replying to Maya · Listing change requests"
> - "Email · Customer enquiry · Product safety questions · Amazon BSR"
>
> **Bad examples:**
> - ❌ "imagery uploads" (which platform? what kind? for what?)
> - ❌ "admin" (what specifically?)
> - ❌ "meeting" (with whom? on what?)
> - ❌ "research" (research what? for what decision?)
>
> **Frustration tags (optional but valuable):**
> - "[blocked]" — waiting on someone or something
> - "[repetitive]" — same task done many times this week
> - "[error retry]" — something broke and had to be redone
> - "[manual handoff]" — copying data between two tools that don't talk

---

## Role: Listing Specialist

**Sub-roles covered:** Amazon listing manager, content optimiser, image manager

**Suggested category templates:**

```
Amazon · Image upload · Main image · [Marketplace]
Amazon · Image upload · Listing gallery · [Marketplace]
Amazon · A+ content · Module build · [ASIN]
Amazon · A+ content · Module update · [ASIN]
Amazon · Bullet writing · New listing · [ASIN]
Amazon · Bullet rewriting · Existing listing · [ASIN]
Amazon · Title optimisation · [ASIN]
Amazon · Listing translation · [Source → target marketplace]
Amazon · SEO keyword research · [Niche]
Amazon · Listing backend update · [What field]
Amazon · Compliance text update · [ASIN]
Amazon · Variation creation · [ASIN parent]
Figma · Image source-of-truth update · [Brand]
Internal · Listing copy review · Brand manager handoff
Internal · Image asset coordination · Designer handoff
Slack · Listing change requests received
Email · Amazon Support tickets · Listing rejections
Meeting · Listing review · [With whom]
[blocked] Waiting on · Designer / Brand manager / Compliance
```

**Watch-outs:**
- "Image upload" without marketplace → push for specificity (UK or US matters)
- Vague "Slack" entries → ask what kind of message (listing update, image approval, escalation)
- "[blocked] Waiting on..." ≥3 hrs/week → that's a structural finding, not a personal bottleneck

**Common patterns to expect:**
- Image upload bottleneck (very high frequency)
- Multi-market localisation (if pan-EU)
- Branded documents (compliance text, listing-launch briefs)
- UW-08 A+ coverage audit (if there are gaps)

---

## Role: Brand Manager

**Sub-roles covered:** Category manager, brand lead, P&L owner

**Suggested category templates:**

```
Amazon · Sales review · [Brand] · Daily
Amazon · Sales review · [Brand] · Weekly
Amazon · PPC review · [Brand] · Weekly
Amazon · Inventory check · [Brand]
Amazon · BSR / rank tracking · [Brand]
Amazon · Brand Analytics review · SQPR · [Brand]
Internal · Demand planning · [Brand] · [Quarterly cycle]
Internal · Launch planning · [New ASIN]
Internal · Launch execution · [New ASIN]
Internal · Brand strategy meeting
Internal · 1:1 with [team member]
Cowork · Briefed report drafting · [What kind]
Power BI / Dashboard · Performance review · [Brand]
Email · Supplier comms · [Supplier]
Email · Customer escalations
Slack · Brand-team coordination
[blocked] Waiting on · Designer / Listing specialist / Supply chain
[manual handoff] Power BI export → Sheets → Slack
```

**Watch-outs:**
- "Sales review" >2 hrs/day → the dashboard is wrong (custom SQL replacement opportunity)
- "Demand planning" entries clustering around historical-sales math → demand planning archetype
- "[manual handoff] Power BI export → ..." → classic glue-human signature

**Common patterns:**
- Advanced PPC (if heavy PPC review hours)
- Demand planning (if forecasting pain)
- SQL-MCP / dashboard replacement (if Power BI dependency)
- UW-01 SQPR×PPC gap-filler

---

## Role: PPC / Ads Manager

**Sub-roles covered:** PPC specialist, ad ops, campaign manager

**Suggested category templates:**

```
Amazon Ads · Campaign Manager · Daily review · [Brand]
Amazon Ads · Bid adjustment · Manual · [Campaign]
Amazon Ads · Campaign creation · [Type] · [Brand]
Amazon Ads · Negative keyword work · [Brand]
Amazon Ads · Search term harvesting · [Brand]
Amazon Ads · Placement performance review · [Campaign]
Amazon Ads · Auto-to-Manual migration · [Campaign]
Amazon Ads · Sponsored Brand video review · [Brand]
Amazon Ads · Sponsored Display · ASIN targeting · [Brand]
Amazon Ads · Budget reallocation · [Brand]
Adtomic / Scale Insights · [Action]
Helium 10 · [Action]
Cowork · Weekly PPC report drafting · [Brand]
Internal · PPC strategy meeting · [Brand]
Email · Ads support tickets · Amazon-side
[manual handoff] Ads UI export → Excel → Slack report
[blocked] Waiting on · Brand manager / Listing specialist
```

**Watch-outs:**
- "Bid adjustment · Manual" >5 hrs/week → in-house advanced PPC is the obvious play
- "Adtomic / Scale Insights" + frustration markers → confirm SaaS retirement opportunity
- "Placement performance review" entries (rare and valuable) → UW-02 worth surfacing

**Common patterns:**
- Advanced PPC in-house (very high relevance)
- UW-01 SQPR×PPC gap-filler
- UW-02 placement performance bid adjuster
- UW-04 branded search cannibalisation audit

---

## Role: Designer / Creative Lead

**Sub-roles covered:** Brand designer, creative lead, motion designer

**Suggested category templates:**

```
Figma · Listing image creation · New ASIN · [Brand]
Figma · Listing image refresh · [Brand]
Figma · A+ module design · [ASIN]
Figma · Brand asset creation · [What asset]
Figma · Translation work · [Source → target market]
Figma · Source file management · Cleanup / organisation
Photoshop / Illustrator · [Specific work]
Studio · Product photography session · [Brand]
Studio · Photo editing · [Brand]
Video · SB video creation · [Brand]
Video · Brand reel · [Brand]
Video · TikTok asset · [Brand]
Cowork · Brand brief drafting · [Project]
Internal · Brand voice / guideline work · [Brand]
Internal · Designer 1:1 / handoff
Slack · Image approval requests · From listing team
Slack · Brand asset requests · From marketing
[blocked] Waiting on · Listing brief / Brand approval
[repetitive] Same image variations across markets
```

**Watch-outs:**
- "Translation work" hours → multi-market localisation pattern
- "Listing image refresh" + "[repetitive]" markers → image-upload pattern (designer-side)
- "SB video creation" hours → SB video coverage scaling
- "Studio · Photo editing" hours → 3D base + texture wrap pattern

**Common patterns:**
- Image upload (designer-side optimisation)
- Multi-market localisation
- AI product imagery (3D base + texture)
- SB video coverage

---

## Role: Customer Service / Reviews Triage

**Sub-roles covered:** CX specialist, returns lead, reviews triage

**Suggested category templates:**

```
Email · Customer enquiry · Product safety · [Brand]
Email · Customer enquiry · Shipping / delivery · [Brand]
Email · Customer enquiry · Product use · [Brand]
Email · Customer enquiry · Compatibility · [Brand]
Amazon BSR · Customer messages · [Brand]
Amazon · Negative review response · [Brand]
Amazon · Review monitoring · [Brand]
Amazon · A-to-z claim handling · [Brand]
Returns · Return decision · [Brand]
Returns · Refund processing · [Brand]
Returns · Investigation · Quality issues · [Brand]
Cowork · CS response drafting (if any)
Internal · CS escalation · To brand manager / QC
Internal · Compliance escalation · To compliance team
[repetitive] Same question shapes · [What kind]
[manual handoff] Returns data → Slack → QC
```

**Watch-outs:**
- "Customer enquiry · [type]" with "[repetitive]" → Cowork response assistant (the IM8-Sarah pattern)
- "Returns · Return decision" hours → UW-06 returnless refunds analysis
- "Negative review response" repetitive themes → UW-05 returns reason mining

**Common patterns:**
- Branded documents (CS response assistant)
- UW-05 returns reason mining
- UW-06 returnless refunds + Grade & Resell
- UW-07 review automation (verify via existing tool)

---

## Role: Operations Manager

**Sub-roles covered:** Ops lead, supplier coordinator, FBA inbound manager

**Suggested category templates:**

```
Supplier · PO drafting · [Supplier]
Supplier · Supplier comms · [Supplier]
Supplier · QC report review · [Factory]
Supplier · Sample tracking · [Project]
Supplier · Production status · [PO]
Supplier · Compliance documentation · [Product]
FBA Inbound · Shipment creation · [Marketplace]
FBA Inbound · Carrier coordination · [Shipment]
FBA Inbound · Reconciliation · Lost/damaged units
3PL · LinnWorks dashboard · [Activity]
3PL · Stock reconciliation · [Brand]
Internal · Supply chain meeting
Internal · Supplier evaluation · [Supplier]
Email · Supplier comms · [Supplier]
Email · 3PL coordination · [Provider]
[manual handoff] LinnWorks → Excel → Slack
[blocked] Waiting on · Supplier / Carrier / 3PL
```

**Watch-outs:**
- "PO drafting" hours → branded documents pattern (huge win)
- "QC report review" + "[manual handoff]" → branded documents + Sim's QC SOP framework
- "FBA Inbound · Reconciliation" hours → custom build candidate
- The supplier-deposit-paid-but-production-not-started gap (Sim's opening story) — surface as a build candidate even if data doesn't show it

**Common patterns:**
- Branded documents
- UW-06 returnless refunds (if returns volume is in scope)
- Custom builds around supplier/PO management

---

## Role: Inventory / Supply Chain

**Sub-roles covered:** Inventory analyst, demand planner, supply chain coordinator

**Suggested category templates:**

```
Inventory · Stock review · [Brand] · Daily
Inventory · Demand forecast · [Brand]
Inventory · Reorder calculation · [Brand]
Inventory · Stockout investigation · [Brand]
Inventory · Overstock review · [Brand]
Inventory · 3PL transfer planning
SP-API · Inventory data pull · [Brand]
Power BI / Dashboard · Inventory review · [Brand]
Sheets · Manual demand calculation · [Brand]
Internal · S&OP meeting
Internal · 1:1 with brand managers
Email · Supplier lead-time chases
[manual handoff] Sheets → Power BI → Slack
[manual handoff] Multiple sources → unified forecast
```

**Watch-outs:**
- "Sheets · Manual demand calculation" → demand planning is the canonical fix
- "[manual handoff] Multiple sources → unified forecast" → glue-human signature
- "Stockout investigation" hours → reactive work; demand planning prevents it

**Common patterns:**
- Demand planning (highest-impact pattern for this role)
- SQL-MCP / dashboard replacement (if Power BI dependency)

---

## Role: Founder / Director (their own time)

**Sub-roles covered:** Director, CEO, founder running ops

**Suggested category templates:**

```
Strategic · Product research · [Niche / brand]
Strategic · Product vetting · [Specific opportunity]
Strategic · Launch decision · [ASIN]
Strategic · Brand-level decisions · [Brand]
Internal · Bottleneck-hunt interview · [Team member]
Internal · 1:1 with [team member]
Internal · All-hands / leadership meeting
Internal · Hiring · [Role]
Operational · Email triage
Operational · Slack triage
Operational · Approval queue (POs, deals, etc.)
External · Investor / advisor calls
External · Industry events / mastermind
Personal · Learning / reading / podcasts
[admin tax] [What kind]
[interrupt] [What pulled focus]
```

**Watch-outs (founder running this on themselves):**
- "Email triage" + "Slack triage" >5 hrs/week → there's a delegation/automation play
- "Operational · Approval queue" >3 hrs/week → ClickUp Automations (rung 1) likely exists
- "[admin tax]" categories of any volume → primary target

**Common patterns:**
- ClickUp OS (founder-side approval flows)
- Branded documents (founder-side reports)
- All Universal Wins are relevant (founders often have everything)

---

## Role: Virtual Assistant / Admin

**Sub-roles covered:** VA, admin assistant, ops support

**Suggested category templates:**

```
Admin · Calendar coordination
Admin · Email triage / inbox zero
Admin · Travel booking
Admin · Document filing / organisation
Admin · Expense reports / receipts
Admin · Meeting notes / follow-ups
Admin · Onboarding paperwork · [Hire]
Admin · Compliance paperwork · [Topic]
Research · [What topic]
Research · Tool / vendor evaluation
Internal · Cross-team coordination
Internal · Slack management for [exec]
[repetitive] Same task type · [What]
[interrupt] Pulled into [what]
```

**Watch-outs:**
- "Email triage" hours → Cowork response drafting + delegation rules
- "Expense reports" hours → Xero/QuickBooks automation (rung 1) likely exists
- "Document filing" hours → branded documents (set defaults so docs land in the right place)

**Common patterns:**
- Branded documents
- Cowork-driven response assistant

---

## Extension shape

This file grows as new role types emerge. Each role added needs:
1. Sub-roles covered (the labels delegates use)
2. Suggested category templates (5–15 typical entries)
3. Watch-outs (3–5 specific signals to look for)
4. Common patterns this role tends to hit

Promotion criteria: encountered in 3+ roadmaps → add to this file.
