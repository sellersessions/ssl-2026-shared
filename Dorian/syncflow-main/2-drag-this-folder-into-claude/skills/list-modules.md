# `list-modules`

> Shows the user the **15 Sim archetypes** as a browsable catalogue — at any point in the conversation. Closes the *"what else could I build?"* gap that `recommend-modules` doesn't answer.

**When**
- User says: *"list modules"* / *"show me the 15 archetypes"* / *"what modules are there?"* / *"what can I build?"* / *"the full menu"*
- Useful as a navigation hand-off after `recommend-modules` runs — user wants to see the un-picked ones to decide on a swap
- Useful pre-interview if a curious delegate asks *"what kinds of things does this build?"* before committing to the 12-minute capture

**Inputs**
- `reference/architecture.md` § "Reference module library — the 15"
- *(optional)* The in-context `brain` — to mark which archetypes are already in the user's recommended set

**Tools**
- `read-brain` — to check `brain.recommendations.modules[*].name` for the *"(in your roadmap)"* annotation
- `reference/architecture.md` — primary source-of-truth for the 15 archetypes
- `reference/sim-knowledge-base.md` § 5 — for the one-line summary per archetype *(the case-study deltas Sim quoted)*
- chat — render the catalogue inline

**Outputs**
- Chat-only listing of all 15 archetypes, organised by category, with one-line summary each
- Annotation on each row showing whether it's in the user's current recommended set

---

## Behaviour

1. **Read `reference/architecture.md` § "Reference module library — the 15"**. The canonical list. Don't fabricate, don't reorder — render in archetype-number order.

2. **Read the in-context brain** *(if it exists)*. For each archetype, check whether it appears in `brain.recommendations.modules[*]` by `archetype_id` or by name match. Build a set of *"already picked"* archetype IDs.

3. **Group by category.** Sim's four categories from `architecture.md`:
   - **Creative engine** *(brand storytelling, content, listings)*
   - **Operational efficiency** *(stock, ops, supply chain)*
   - **Proprietary stack** *(in-house intelligence + competitive moat)*
   - **SaaS-free infrastructure** *(retire-the-rented baseline)*

4. **Render the catalogue.** Compact format, ≤ 40 lines total, scannable on one screen:

   ```
   The 15 Sim archetypes · what you can build

   CREATIVE ENGINE
     #01  Image Upload bottleneck       Figma → Seller Central, no human in the middle
     #02  Multi-market localisation     translate listings + creative across UK/EU/US
     ...

   OPERATIONAL EFFICIENCY
     #07  Branded Documents             POs / QC reports / supplier comms — auto-formatted
     #10  Demand Planning               SQPR + search-volume → stockouts < 2%   ← in your roadmap
     ...

   PROPRIETARY STACK
     #06  Creator CRM                   influencer ops out of spreadsheets
     #09  Advanced PPC, in-house        retire Adtomic / Scale Insights, full visibility
     ...

   SAAS-FREE INFRASTRUCTURE
     #13  SQL MCP                       any team member queries live data in plain English
     #15  ClickUp OS layer              brand-as-OS template + per-role boards
     ...

   In your current roadmap: 5 of 15 picked.
   To swap one in: "swap Module N for #XX"
   To deep-dive: "explain #XX" or "explain Module N"
   To start one: "start Module N" (kicks off start-implementation)
   ```

5. **Annotate already-picked archetypes** with `← in your roadmap` *(green text in the rendered chat surface; muted text in print)*. The annotation is the differentiator — telling the user *"you've got 5 of 15; here are the other 10"* is the value-add over a static reference doc.

6. **End with three navigation hand-offs**, in this order *(most-to-least common ask)*:
   - Swap path: *"swap Module N for #XX"*
   - Deep-dive path: *"explain #XX"* or *"explain Module N"*
   - Build path: *"start Module N"*

7. **No artifact emission.** This skill is chat-only; the rendered catalogue isn't a deliverable. The user's roadmap artifact already lists their 5-7 picked modules with full depth.

---

## Edge cases

- **No brain yet** *(pre-interview)*: skip the *"in your roadmap"* annotations. Render the bare catalogue. Add a footer: *"You haven't started a brain yet. Type `let's start` to capture your stack and get a sequenced subset of these 15 picked for you."*
- **Brain has zero recommendations** *(interview done but `recommend-modules` hasn't run)*: same as above — skip annotations, footer reads *"Brain captured but modules haven't been sequenced yet. Type `recommend modules` to pick 5-7 of these 15 for your roadmap."*
- **Brain has all 15** *(unlikely but possible if user manually swapped 8 extras in)*: render normally; the *"in your roadmap"* annotation appears on every row. Footer adds: *"All 15 picked. Capacity-fit envelope is ~5-7 for most teams; consider swapping out tail-end ones unless your team is genuinely 100+ hrs/wk on build."*
- **User asks for the catalogue scoped to a category**: *"list creative-engine modules"* / *"list ops modules"* — render only that category. Use the same format; just show one of the four groups.

---

## Don't

- Don't fabricate archetypes outside the 15. If a delegate asks for *"the eCom-loyalty-loops archetype"* and it's not in `architecture.md`, say so explicitly. Adding a non-Sim archetype is `recommend-modules`'s territory *(when "add a module not in the 15 archetypes" applies — see that skill's gate)*, not a list-only skill.
- Don't render this as an artifact — it's a chat surface only. The roadmap artifact is the deliverable; the catalogue is reference material.
- Don't include each archetype's full case-study detail. The whole point is *scannable*; if the user wants depth, the hand-off is *"explain #XX"*.
- Don't reorder archetypes per perceived relevance to the brain. The order is locked at the architecture-doc level for predictability — same catalogue, every delegate, every workshop.
- Don't infer category membership for ambiguous archetypes. The category groupings are in `architecture.md`; quote them, don't reinterpret.

---

## Why this exists

Closes the documented v0 GAP-2 in `docs/skills-inventory.md`. Currently the only way users see the 15 archetypes is implicitly via `recommend-modules`'s sequenced output of 5-7. Workshop attendees consistently ask *"what's the full menu?"* — without this skill, the agent fumbles into a freeform list that drifts from the canonical 15. With this skill, the answer is one-shot, deterministic, and ends in the right hand-off *(swap / explain / start)*.
