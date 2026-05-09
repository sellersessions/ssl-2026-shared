# Metric-to-Action Framework

> **Scope:** Central decision system for translating performance signals into the right CRO action.
>
> **Related files:** Synthesizes business-reports.md, search-query-performance.md, advertising-analysis.md, and brand-analytics.md. Bridges data to /01-research/ and /02-visual-content/.

---

## The Job

This file answers the most important data question:

**Given what the numbers say, what should we do next?**

Data alone does not improve conversion. Action does.

---

## Funnel Lens

Use this simple funnel model:

1. Impressions
2. Clicks
3. Sessions
4. Orders

Which creates two primary CRO levers:

- **CTR problem** - people are not clicking
- **CVR problem** - people click, but do not buy

Sometimes both are weak. Sometimes the data is incomplete. The point is to classify before acting.

---

## Primary Diagnostic Matrix

| Signal | Diagnosis | Primary Lever | First Action |
|---|---|---|---|
| Low CTR | Search shelf weakness | Main image, title, relevance, visibility | Audit main image and title against the target query set |
| High CTR + low CVR | Listing fails after the click | Gallery, bullets, A+, trust, offer | Audit listing images, bullets, and objections |
| Low sessions + healthy CVR | Traffic problem | Visibility and discovery | Review query coverage, ranking, and click performance |
| High sessions + low CVR | High-value CRO opportunity | PDP conversion | Prioritize for full audit and testing |
| High returns / mismatch complaints | Expectation gap | Honest visuals and clarifying copy | Fix images, size representation, contents clarity |
| Weak purchase share with healthy click share | PDP weakness | Conversion proof | Improve lower-funnel content and trust signals |
| Weak click share with healthy conversion share | Discovery weakness | SERP appeal | Improve scroll-stop and search-intent match |

---

## Cross-Source Triangulation

Never rely on one data source when a second source can refine the diagnosis.

Examples:

- Business Reports say sessions are down -> SQP tells you whether the loss is query-specific
- SQP says CTR is healthy -> Business Reports tell you whether that traffic converts
- Ads say conversion is weak -> traffic mix may be the issue, not the listing
- Brand Analytics says click share is weak -> competitor pressure may be stronger than the listing team realized

The better the triangulation, the better the action.

---

## Action Routing Rules

### If it is a CTR problem

Start with:

- Main image
- Title
- Search intent match
- Competitive shelf differentiation

Use:

- ../02-visual-content/main-image.md
- ../03-copy/title-optimization.md
- ../01-research/keyword-analysis.md

### If it is a CVR problem

Start with:

- Listing images
- Bullets
- A+
- Objection handling
- Expectation match

Use:

- ../02-visual-content/listing-images.md
- ../02-visual-content/a-plus-content.md
- ../03-copy/bullet-point-optimization.md
- ../01-research/review-mining.md
- ../01-research/rufus-ai-queries.md

### If it is both

Run a full audit.

Do not assume one image swap will solve a double-decline problem.

---

## Opportunity Sizing

Before prioritizing work, estimate the upside:

```text
Current Units = Sessions x Current CVR
Target Units = Sessions x Target CVR
Unit Gain = Target Units - Current Units
Revenue Gain = Unit Gain x AOV
```

Use opportunity math to rank ASINs, not just intuition.

---

## Research Bridge

When data tells you **what** is broken, use research to find **why**:

- Review mining -> what customers love, fear, and regret
- Keyword analysis -> what shoppers are trying to solve
- Rufus queries -> what questions remain unanswered
- Competitor audit -> what the market shows and what it misses

Those sources should flow into the research brief, then into copy and creative.

---

## Testing Bridge

After the action is chosen, use testing to validate it:

| Lever | Typical Primary Metric |
|---|---|
| Main image | CTR |
| Title | CTR, then downstream conversion context |
| Bullets | CVR |
| Listing images | CVR |
| A+ Content | CVR |

One action, one hypothesis, one primary metric.

---

## Common Failure Modes

- Solving a CVR problem with a CTR-first change
- Solving a traffic problem with more PDP detail
- Blaming the listing when the traffic mix changed
- Forcing a diagnosis when data is incomplete
- Prioritizing low-traffic opinions over high-traffic opportunity

---

## Output Template

When using this framework, the output should include:

- **Diagnosis**
- **Evidence**
- **Confidence**
- **Recommended workstreams**
- **Next actions**
- **Test plan**
- **Missing data** if the evidence is incomplete

This output shape is what Florence enforces.

---

## Quality Checklist

- [ ] The issue is classified as CTR, CVR, both, or insufficient evidence
- [ ] The diagnosis uses more than one data source where possible
- [ ] Opportunity size is calculated before prioritization
- [ ] The action routes to the correct research, copy, or creative files
- [ ] A test plan follows the action, not the other way around
- [ ] Missing data is stated honestly when needed

---

## Source

Mirrored from Drive: `CRO-Knowledge-Base/04-data-analysis/metric-to-action-framework.md`
Last sync: 2026-05-04.
