# `generate-verification-plan`

**When**
- Always paired with `generate-build-plan` — fires automatically after the build plan is output
- User says: *"how do I know it's working?"* / *"verification?"*

**Inputs**
- The build plan from `generate-build-plan` (held in context)
- `<module-id>` — which module
- in-context `brain` object — for stack-specific context
- `reference/sim-knowledge-base.md` § 5 — for the case-study verification anchors

**Tools**
- chat — output the structured verification plan

**Outputs**
- Structured verification plan, in chat
- The user can save it alongside the build plan

---

## Why this skill exists

Worldview principle #4: **verification > speed.** Every plan ships with a verification plan. No exceptions.

Worldview principle #5: **frontend is where verification fails.** Backend can look right while UI silently corrupts. Verification has to include visual checks.

The verification plan is **what the build is checked against** — not "did Phase 3 finish" but "does Phase 3's output match reality."

---

## Plan structure

For every module, generate **3–5 verification checks**, organised by phase. Each check has:

- **What** — the concrete check (one line)
- **How** — exact procedure (manual / scripted / scheduled alert)
- **Pass criterion** — the threshold for "this passes"
- **Owner** — named person from the team (from `team.md`)
- **When** — once before launch / weekly / on every run

```
Verification plan · Module 02 · Demand Planning
5 checks · owned by Maya (Head of Ops)

─────────────────────────────────────────
CHECK 1 · Schema integrity (Phase 1)

What: All migrations apply cleanly on a fresh Supabase project.
How:  Run migrations against a branch project; confirm zero errors.
Pass: 0 errors, all RLS policies attached.
Owner: engineer
When: once, before Phase 2 starts.

─────────────────────────────────────────
CHECK 2 · Backtest (Phase 3)

What: Demand plan output matches actuals on 5 known SKUs across 4 weeks.
How:  Manually compare predicted_units vs actual sales for SKUs A, B, C, D, E
      between weeks W-4 and W-1. Run query, eyeball.
Pass: 3 of 5 SKUs within ±15% of actuals. (Sim's bar — this is forecast, not crystal ball.)
Owner: Maya
When: once, before Phase 4 starts; weekly thereafter as a smoke test.

─────────────────────────────────────────
CHECK 3 · Stockout-prone SKU surfacing (Phase 3 / 4)

What: A known stockout-prone SKU surfaces in the reorder list before the stockout.
How:  Pick a SKU that ran out of stock 3 months ago; rewind the input data to
      that period; run the flow; confirm the system flagged the reorder
      sufficient days in advance.
Pass: System flagged ≥7 days before historical stockout.
Owner: Maya
When: once, before Phase 4 ships.

─────────────────────────────────────────
CHECK 4 · ClickUp output sanity (Phase 4)

What: ClickUp tasks land in the right list, with the right fields, assigned
      to the right brand manager.
How:  Visual check on first 2 weeks of generated tasks. Eyeball — frontend is
      where verification fails (worldview #5).
Pass: 0 wrong-list, 0 wrong-assignee, ≤1 missing-field per 20 tasks.
Owner: Maya (manual review for 2 weeks before trusting auto-creation)
When: every task created during the first 2 weeks of operation.

─────────────────────────────────────────
CHECK 5 · Silent-failure alert (Phase 5)

What: When the flow produces zero results in a week, an alert fires.
How:  Add an alert node to the n8n flow: if predicted_units count is 0 for
      a full run, post to Slack #ops-alerts and create a ClickUp task tagged
      [investigate].
Pass: Alert fires within 5 minutes of the silent failure.
Owner: brand manager on call
When: every run.
```

---

## Behaviour

1. **Read the build plan** for the module — phases inform check structure.

2. **Read `sim-knowledge-base.md` § 5** for the archetype. Sim's case studies often state the verification anchor explicitly *("hit 98% in stock for the first time")* — translate that anchor into a check.

3. **Apply the verification framework:**
   - **Schema check** — every Phase 1 generates a schema-integrity check.
   - **Logic check** — every Phase 3 generates a backtest or scenario-replay check.
   - **Surface check** — every Phase 4 generates a visual / output sanity check (frontend is where verification fails).
   - **Silent-failure check** — every flow that produces output gets a "what if it produces zero" alert.
   - **At least one human-in-the-loop check** for the first 2 weeks of operation, even on automated flows. Sim's principle: manual review before trusting auto-creation.

4. **Assign owners** by name. Pull from `team.md`. Refuse generic *"the team"* — every check has a named owner.

5. **Output the structured plan** in the format above.

6. **End with the handoff:**

   > *"Build plan + verification plan above. Save them. When you're ready to start Phase 1, paste this into your own Claude Code session — say `let's implement Phase 1 of [Module Name]`. Want a copy-paste prompt? I can generate one tuned to your stack."*

---

## Quality bar — Sim-anchored thresholds

Where Sim's case studies anchor the bar, use his numbers:

| Module | Sim's anchor → verification target |
|---|---|
| Demand Planning | "Hit 98% in stock for the first time" → in-stock rate ≥95% after 3 months |
| Image Upload bottleneck | "15 hrs/week recovered" → upload time per listing reduced ≥10× |
| Advanced PPC | "$6K/yr SaaS replaced" → SaaS retired AND placement modifier rules visible |
| Branded Documents | "Looks professional and on-brand" → 0 brand-violation reports from internal review across first 20 documents |
| Hyper-local intelligence | "ZIP-level rank tracking" → can answer "what's our rank in 90210 vs 10001" in <30 seconds |

For archetypes without a clear Sim anchor, use **3–5% above their current baseline** as a conservative pass criterion, and explicitly flag *"baseline metric unknown — capture before launch"* if their brain doesn't have one.

---

## Don't

- Don't write a verification plan with fewer than 3 checks. Every plan needs schema + logic + surface at minimum.
- Don't write checks without owners. *"Someone reviews"* is unverifiable.
- Don't write checks without a pass criterion. *"Looks fine"* is not a check.
- Don't skip the silent-failure alert. Sim's principle: fail-loud, not fail-silent.
- Don't promise verification pass criteria the build can't possibly hit *(e.g. "100% accuracy on demand forecast" — that's a lie, real forecasts have variance bands)*.
- Don't merge build and verification plans into one document. They're produced together but stay distinct — the user might run the build plan in one session and the verification plan in another.
