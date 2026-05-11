# `update-brain`

**When**
- User says: *"actually we don't use SellerApp anymore"* / *"we just hired a brand manager"* / *"forget what I said about X"*
- User edits a brain MD file by hand and wants the roadmap re-derived
- During iteration after the roadmap has already been rendered once

**Inputs**
- The user's correction or new fact (in chat)
- The current in-context `brain` object

**Tools**
- `read-brain` — load current state
- `capture-fact` — append the corrected fact (with `[corrected]` tone)
- chat — confirm and ask whether to re-render

**Outputs**
- Updated brain MDs
- A flagged list of derivative artefacts that need re-deriving (replacement table, modules, roadmap)
- Triggers `regenerate-section` or full `render-roadmap` based on impact

---

## Behaviour

1. **Parse the correction.** Three flavours:
   - **Retraction** — *"forget what I said about X"* → mark the existing fact `[retracted]`. Don't delete; preserve the audit trail.
   - **Replacement** — *"actually we don't use SellerApp, we use Helium 10 only"* → mark old fact `[superseded]`, append new fact `[corrected]`.
   - **Addition** — *"we just hired a brand manager"* / *"we also use Linnworks"* → straight append, no tone tag needed.

2. **Identify the impact zone.** Which downstream artefacts are affected by this change?

   | Field changed | Affects |
   |---|---|
   | `brand`, `category`, `model` | Cover, Manifesto framing |
   | `monthly_revenue_band`, `sku_count` | Summary big numbers, Current state body |
   | `headcount`, `roles`, `bottleneck` | Current state moments, Closing copy |
   | Any `[rented]` tool addition/removal | Replacement table, recommended modules, savings totals |
   | Any `[csv-moment]` / `[glue-human]` | Current state diagnosis, Recommended-first module |
   | Any AI tool | Sub-agent persona recommendations |
   | Goals / vision / bottleneck | Recommended-first module, closing manifesto |
   | Stack tools generally | Replacement table, modules list, featured module — full re-render |

3. **Apply the correction** via `capture-fact`. Always preserve the original entry with the right tone tag — never silently overwrite.

4. **Confirm to the user** what changed, in one sentence:

   > *"Brain updated. SellerApp marked [superseded]. This affects the replacement table (savings drop from $527/mo → $428/mo), the Win card (was anchored on SellerApp retirement), and the recommended modules (Module 02 still Demand Planning; Module 04 was Scorecard with SellerApp as a retire-source — that destination needs re-derivation)."*

5. **Ask before re-rendering.** Don't auto-fire `render-roadmap` — the user might be making multiple updates in a row and only wants one re-render at the end:

   > *"Re-render the roadmap now, or are there more updates first?"*

6. **If they say re-render** — fire the affected pipeline:
   - **Light update** *(brand name, headcount changes)* → `regenerate-section` for affected pages only
   - **Heavy update** *(any stack tool change)* → full `derive-replacement-table` → `recommend-modules` → `render-roadmap` → `emit-roadmap-artifact`

---

## Edge cases

- **They edit a brain MD by hand and ask to re-render.** Read the brain. Compare against the prior structured outputs in context (if any). Surface what changed for confirmation: *"You added Linnworks at $129/mo and removed Adtomic. Replacement table will gain a Linnworks row, drop Adtomic. Confirm?"*

- **They contradict themselves.** *"Actually we DO use SellerApp, ignore my last message."* → mark the most recent `[retracted]` correction itself as `[retracted]`. The audit trail handles it.

- **They want to undo to a specific point.** *"Roll back to before I said anything about Adtomic."* → not supported in v0. Tell them: *"v0 only goes forward — corrections layer on top. To roll back, edit `stack.md` directly and delete the offending lines."*

- **The correction invalidates the recommended-first module.** If they remove the bottleneck that drove the Module 02 choice, recompute. Tell them: *"With that change, the Bottleneck Hunt now picks <new-module> as recommended-first instead of Demand Planning. Re-render?"*

---

## Anti-patterns to flag

- **Multiple corrections without re-rendering** — fine. The user is iterating. Don't pressure a re-render until they explicitly ask.
- **Corrections to facts that aren't in the brain** — refuse politely. *"That's not in the brain — looks like a new fact rather than a correction. Capturing as a new entry."*
- **Silent overwrites** — never. Always tag with `[superseded]` or `[corrected]` or `[retracted]`. Preserve history.

---

## Don't

- Don't auto-fire `render-roadmap`. Confirm first.
- Don't delete brain entries. Tag them. Audit trail matters.
- Don't fabricate impact analysis. If you're unsure whether a change affects the closing copy, say so — *"This might also change the closing manifesto if it shifts the bottleneck framing — let me re-check that section after re-render."*
- Don't lose the `interview-transcript.md` log of corrections. Every correction goes in the transcript with timestamp.
