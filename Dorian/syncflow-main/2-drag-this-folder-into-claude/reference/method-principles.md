# Method Principles · the operational discipline behind Sim's voice

> **Source:** Sim's huntr-handover · file 02 (Bottleneck Hunt Method, principles section). Cherry-picked into syncflow so the operating logic behind the recommendations is explicit, not just implied. Channel these whenever you reason about whether to remove, accelerate, or tolerate a bottleneck.

---

## Mission

Find the time sinks that don't show up on the org chart. Remove the human from them where possible. Where not possible, give the human AI speed.

This is not a productivity audit. Not performance management. Not cost-cutting. It is the systematic conversion of admin labour into thinking labour, person by person, week by week, until the business runs at AI speed without scaling headcount.

**Stated outcome per recommendation:** at least one bottleneck killed or accelerated, with a measurable hours-per-week recovery and a tool that runs without anyone's laptop being open.

---

## Principles (non-negotiable)

**P1 — Default to removing the human, not speeding them up.** The starting question is *"why is a human here at all?"* — not *"how do we make them faster?"*

**P2 — Domain expert holds 80% authority on the build spec.** The person closest to the work decides what the output should look like. AI builders and external developers serve the spec; they don't write it.

**P3 — The founder runs the early hunts personally.** No internal political guardrails — the founder can restructure roles, automate jobs out, override department heads. As the method scales, division heads inherit it; the founder still runs the hunts on division heads.

**P4 — Hidden work is the rule, not the exception.** Most people are doing far more than the org chart suggests because of intra-team requests nobody else sees. Trust the data, not the job description.

**P5 — Build only what you can trust to run unattended.** If a laptop being open is part of the dependency chain, it isn't shipped. Cloud, scheduled, monitored. Anything else is a chore with extra steps.

**P6 — The hour saved must be redeployed, not just reclaimed.** A bottleneck killed but the time backfilled with admin or low-value coordination is a failed result.

**P7 — Cuts beat optimisations.** Removing a step is always better than making it faster.

**P8 — Repeatable beats clever.** A bespoke one-off is worse than a parametric solution that templates across employees and brands.

---

## The three-option decision (when sequencing modules)

For every bottleneck syncflow names in a roadmap, the implied verdict is one of:

**Option A — Remove.** The human should not be here at all. Default choice. Examples: image uploads, document formatting, data pulls.

**Option B — Accelerate.** Human stays, moves at AI speed. Examples: branded documents, customer outreach with taste/judgment.

**Option C — Tolerate (for now).** Build cost > saving. Document, leave, revisit in 6 months. Don't pretend it's solved.

When a roadmap module says *"automate X"* it should be clear which option it is. If it isn't, the recommendation isn't sharp enough.

---

## Anti-patterns (failure modes to flag)

| Anti-pattern | What it looks like | Fix |
|---|---|---|
| Optimising instead of removing | Falling in love with making something faster instead of asking why it exists | Enforce P1 in every decision |
| AI builder writes the spec | Generic outputs, slow iteration, poor fit | Domain expert writes the spec — always |
| Tool needs babysitting | Local cron, laptop dependencies, manual API key refresh | Cloud + scheduled + monitored or it isn't shipped |
| Hours reclaimed but not redeployed | Same exhaustion, different admin | The recovered time has to land somewhere higher-value, named in the recommendation |
| Bespoke when parametric would work | A Sarah-only flow when a "customer-enquiry-response" pattern would template | Enforce P8 — repeatable beats clever |
| Department heads protecting their people | Often political, sometimes well-meaning | Founder runs early decisions personally to demonstrate authority |

---

## Metrics

**Business level (the three numbers):**
1. **Hours/week recovered, cumulative** across all the modules built since starting
2. **Revenue per FTE** — the headline number for the £20M → £100M thesis
3. **Cycle time from recommendation to working v1** — healthy is 1 week per module. Above 4 weeks, the spec is wrong.

**Per module (the two numbers):**
- Hours saved/week (audited, not estimated)
- Tool uptime % at T+4 weeks

---

## How syncflow uses this

- **`skills/diagnose-sprawl.md`** — apply P1, P4, P7 when surfacing CSV moments and glue-humans. Don't recommend optimisation when removal is the right answer.
- **`skills/design-future-state.md`** — every component should be auditable against P5 (runs unattended) and P8 (parametric, not bespoke).
- **`skills/recommend-modules.md`** — for every module, name which of the three options (Remove / Accelerate / Tolerate) it represents. The "tolerate" answer is a valid output — pretending to solve everything weakens the roadmap.
- **`skills/generate-build-plan.md`** — the build plan should land at "runs unattended, redeploys hours into named higher-value work." If it doesn't, P5 + P6 are violated and the plan needs rework.

## The one-sentence version

Remove the human where possible; accelerate where not; redeploy the recovered hours into higher-value work; build only what runs unattended; prefer parametric over bespoke. Audit at T+4 that the hours were really saved and really redeployed.

That's the operating discipline.
