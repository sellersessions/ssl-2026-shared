# `inspect-brain`

> Renders a **scannable, consultant-grade summary** of what's currently captured. The transparency lever — for users who want to verify the brain matches what they said, and for workshop demos where the host says *"now syncflow, show us what you've captured."*

**When**
- User says: *"show me my brain"* / *"what have you captured?"* / *"list facts"* / *"what do you know about us?"* / *"summarise the brain"*
- After a long interview when the user wants a checkpoint before render
- Mid-session when the user wonders whether they've already mentioned something

**Inputs**
- The in-context `brain` object *(via `read-brain`)*

**Tools**
- `read-brain` — load the in-context brain
- chat — render the summary

**Outputs**
- A compact, scannable chat output showing captured facts grouped by section, with counts
- Recommendations status at the bottom *(diagnosis run? modules sequenced? featured derived?)*
- A one-line hint about what to ask next, scoped to where the brain is in its lifecycle

---

## Behaviour

1. **Read the in-context brain.** Default flow inspects only the in-memory brain — don't reach for disk reconciliation here *(that's `read-brain`'s tier-2 territory; this skill is the lightweight transparency surface)*.

2. **If the brain is empty or unset**, render a one-line response:

   > *"No brain captured yet. Type `let's start` to begin a 12-minute interview, or `/demo` to load the Ideal Direct sample brand."*

   Don't fabricate; don't auto-init.

3. **Render the section-by-section summary.** Format — keep it ≤ 30 lines, monospace-friendly so it prints cleanly:

   ```
   Brain · Ideal Direct · 64 facts captured · 11 min interview

   IDENTITY (15 facts)
   - Amazon FBA / multi-brand house · 8yr · niche
   - £10M ARR · Amazon UK + EU · ~100 active parent ASINs · top-3 brands = 80%
   - Private label · aggressive scale · 10-20 launches/yr

   GOALS + CAPACITY (10 facts)
   - 12mo: Rooted Human launched, US + EU scaling, A-players in
   - Capacity: 40 hrs/wk · maintenance: n8n_self_host
   - Revenue band: £1M-5M

   STACK (28 facts)
   - 12 paid tools · email_suite Microsoft 365 (Teams bundled)
   - Prerequisites: Helium 10, Datadive, Seller Central, Brand Analytics
   - Retire-eligible: Scale Insights (£300) · Power BI (£100) · Microsoft Teams (bundled · clutter)
   - CSV moments: 5 (Mondays 3hr Linnworks merge · PPC reports · Figma uploads · etc.)
   - Glue-humans: Cara × recruitment · Chris × demand-planning · Simon × image-upload · Franc × Power BI
   - Tried-and-dropped: SoStocked (cancelled after 2 months)

   PAIN (6 facts)
   - Bottleneck: recruitment — no ATS, Cara + Sim manage candidates from memory
   - Failure mode: stock decisions dropped when launch month hits; Franc single point of failure

   ASPIRATIONS (5 facts)
   - Magic wand: scalable recruitment + real demand planning + ClickUp as OS
   - Why not yet: time + clarity on where to start
   - Forward to: tech lead (TBD — Sim recommends the right hire)

   RECOMMENDATIONS
   ✓ Sprawl diagnosed   ✓ Future-state mapped
   ✓ Replacement table   ✓ 7 modules sequenced   ✓ Featured: Module 03

   Next: type "render" to fill the artifact, or "explain Module 02" for the deep-dive.
   ```

4. **Per-section count** is `sections.<name>.<facts>.length` for keyed-list sections, `Object.keys(sections.<name>).length` for flat ones. Show the total in the header *(`brain.fact_count`)* matched against the per-section sum — if they diverge, append a tiny warning: *"⚠️ fact_count (47) ≠ section sum (45) — mid-interview, normal. Stable after section close."*

5. **Recommendations status** is a 6-tile checklist:
   - Sprawl diagnosed — `brain.recommendations.diagnosis !== null`
   - Future-state mapped — `brain.recommendations.architecture !== null`
   - Replacement table — `brain.recommendations.replacement !== null`
   - Modules sequenced — `brain.recommendations.modules.length > 0`
   - Featured derived — `brain.recommendations.featured_module !== null`
   - Build plans emitted — `any module has deliverables.module_folder`

   ✓ for satisfied, blank for not-yet. Don't render the whole row of blanks if everything is empty *(pre-recommendations stage)* — instead surface: *"Recommendations: not yet derived — finish the interview first."*.

6. **One-line "next" hint at the bottom**, lifecycle-aware:
   - Pre-Section-3 close → *"Next: continue the interview (Section X · what's next: \<batch summary\>)"*
   - Section-3 close, no recommendations → *"Next: type `continue` to derive recommendations, or `inspect` again after"*
   - Recommendations done, no render → *"Next: type `render` to emit the roadmap artifact"*
   - Render complete → *"Next: type `start Module N` to kick off implementation, or `swap Module N for X` to change the roster"*
   - Implementation in flight → *"Next: type `Phase N done on Module M` to advance the lifecycle"*

7. **No artifact emission.** This skill is chat-only. The brain artifact is `emit-brain-artifact`'s territory; this skill produces a human summary, not a machine-readable file.

---

## Edge cases

- **Brain has unusual fields the schema doesn't enumerate** *(post-update-brain hand-edits, future schema versions)*: render the unknown fields under a *"OTHER"* footer with a one-line explainer. Don't drop them — opacity is a lie.
- **Recommendations are partial** *(diagnosis ran, modules didn't)*: surface what's done as ✓, what isn't as blank, and route the *"next"* hint to the next missing step.
- **User asks for raw JSON.** *"Show me the JSON"* — fine, render the structured object verbatim. Make the JSON-vs-summary call explicit; don't dump JSON when the user asked for a summary.
- **Brain loaded from `/demo`** *(`brain.is_demo === true`)*: prepend a small banner — *"📋 Sample data (Ideal Direct demo). Not your brand."* — so workshop attendees don't get confused.
- **Long-running session, brain has 100+ facts**: keep the per-section cap — *"Stack (87 facts) — top 6 surfaces below"*. Truncate to the most salient with *"+ N more"* and offer *"`inspect stack` for the full section"*.

---

## Don't

- Don't dump raw JSON unless the user explicitly says *"show me the JSON"*. The default surface is the consultant-style summary.
- Don't emit this as an artifact. Chat-only.
- Don't include the transcript *(too long — chat history shows it; this is the structured-fact view)*.
- Don't reorder fact entries when summarising. Keep them in capture order; that's the audit trail. The reordering belongs to the render layer, not the inspect layer.
- Don't infer fields that aren't captured. If `top3_concentration` is missing, show the section without it — don't guess "probably 50–60%".
- Don't auto-trigger this on every batch. The skill is user-initiated; running it after every fact-capture would be noise.

---

## Why this exists

Closes the documented v0 GAP-4 in `docs/skills-inventory.md`. Users sometimes want to see what's been captured *(*"am I sure I told you about SoStocked?"*)*. Pre-G2, they could ask in chat and the agent recalled from working memory, but there was no formalised "show the brain" surface. For workshop use this is a transparency lever — Dorian can say *"now syncflow, show us what you've captured for Cordova so far"* and the answer is one-shot, deterministic, and workshop-friendly *(scannable on a projector, no JSON dump)*.

The companion skill `read-brain` exists for system-internal lookups *(other skills calling it as a sub-step)*; `inspect-brain` is the user-facing surface. They share an underlying read but ship different output formats.
