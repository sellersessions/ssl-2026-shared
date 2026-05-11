# `swap-module`

**When**
- User says: *"replace Module N with X"* / *"I'd rather start with X than Module 02"* / *"swap Demand Planning for Branded Documents"*

**Inputs**
- `<from-module>` — module being replaced
- `<to-module>` — replacement (must be one of Sim's 15 archetypes, or be flagged as off-roadmap)
- Current module list from `recommend-modules` (held in context)
- in-context `brain` object

**Tools**
- chat — confirm and explain consequences
- triggers `recommend-modules` (re-sequence) → `render-roadmap` → `emit-roadmap-artifact` if user confirms

**Outputs**
- Re-sequenced module list with the swap applied
- A clear surfacing of dependency changes that came with the swap
- Re-rendered roadmap.html

---

## Why this skill exists

The user might disagree with syncflow's recommendation. *"Branded Documents will land faster than Demand Planning — we'd rather see a quick win first."* That's legitimate. The user knows their team better than syncflow does.

But swapping a module isn't free. Dependencies shift. The featured-module page might need to switch. Savings totals change. This skill makes those consequences visible BEFORE the swap, so the user can decide with eyes open.

---

## Behaviour

1. **Look up the to-module.** Does it exist in Sim's 15 archetypes?
   - **Yes** — proceed.
   - **No** — flag it: *"That's not one of Sim's 15 archetypes. We can build a custom module for it, but it'll be research as well as implementation. Some of the build playbook won't have proven patterns to draw from. Confirm you want to add it?"*

2. **Compute the consequence map.** What changes?

   - **Sequence position** — does the new module slot in at the same number, or does it want a different position based on dependencies?
   - **Dependencies** — what does the new module require? What depended on the old module?
   - **Effort change** — old module 16hrs vs new module 8hrs?
   - **Featured page** — was the old module the featured one (R08)? If yes, R08 needs to switch.
   - **Savings change** — does the new module retire different rented tools? Recompute net savings.
   - **Cascade** — does the swap break any other module's dependency chain?

3. **Surface the consequences in chat** before applying. Format:

   ```
   Swap requested: Module 02 (Demand Planning) → Branded Documents (Sim #07)

   Consequences:
   - Effort drops: 16-24hrs → 8hrs (faster to ship)
   - Replacement table changes:
       Helium 10 ($179/mo) → no longer retired by Module 02 (no replacement-route now; demote to "consolidate" or
       move to a later Demand Planning module if you want)
       SellerApp ($99/mo)   → same
       Adtomic ($249/mo)    → unaffected (still Module 03)
       Net savings drops: $527/mo → $249/mo (-$278/mo)
   - Featured module page (R08) switches from Demand Planning to Branded Documents — sample content for
     Branded Documents is available in v0
   - Module 06 (Creative Brief Bot) had Demand Planning in its dependency list; needs to drop or remap
   - Recommended-first reasoning shifts from "biggest savings unlock" to "fastest first win"

   Confirm the swap, or want to talk through alternatives first?
   ```

4. **On confirm:**
   - Update the recommend-modules output
   - Re-fire `derive-replacement-table` (the destinations changed)
   - Re-fire `render-roadmap` and `emit-roadmap-artifact`
   - Append the swap to `interview-transcript.md` as a record

5. **On reject / "let me think":**
   - Hold the swap proposal in context but don't apply
   - Don't repeat the consequences unprompted

---

## Common swap patterns

| User wants | Why | What you tell them |
|---|---|---|
| Fastest win first | Visible momentum | Branded Documents (#07) — 8hrs, no Amazon API integration, low risk |
| Biggest savings first | $$ pressure | Demand Planning (#10) or Advanced PPC (#09) depending on stack |
| Most familiar territory | Team's comfort zone | Whatever uses tools they already have running |
| Hardest first | "Eat the frog" | ClickUp OS layer (#15) — meta build, hits everything; only do this with finisher discipline |

If the user's *why* is unclear, ask once: *"Why the swap? — knowing whether you're optimising for speed, savings, or familiarity changes whether this is a good move."*

---

## When to push back on the swap

Push back if the swap creates a worse plan, but only after you've heard the user's reasoning. Per the consultant posture, **push back hard** is principle #7 — but it has to be substantive, not stylistic. Examples:

- **Swap creates a circular dependency** → push back: *"Module 04 depends on Module 02. Swapping in Branded Documents at position 02 means Module 04 has nothing to depend on. Suggest moving Branded Documents to position 04 and keeping Demand Planning at 02."*
- **Swap retires nothing the brain captured** → push back: *"Branded Documents replaces manual purchase order / QC report formatting. Your brain doesn't have those captured as bottlenecks. Are they bottlenecks? If yes, capture them; if no, why are we building this?"*
- **Swap recommends a module the brain doesn't support** → push back. E.g. recommending Image Upload bottleneck without Figma → Seller Central in their flow.

When you push back, **always offer an alternative** — don't just say no. *"That doesn't fit; here's what would."*

---

## Don't

- Don't apply the swap silently. The consequence map matters.
- Don't fire `render-roadmap` until the user confirms.
- Don't promise the swap will work better — that's their call to make. Surface trade-offs; let them decide.
- Don't delete the original module from history. The transcript records both the recommendation AND the swap.
- Don't allow swaps that violate the worldview (e.g. swapping Module 01 Control Plane out — the foundation isn't optional). If they ask, push back: *"Module 01 is the foundation everything else attaches to. You can sequence things differently after Module 01, but you can't skip it."*
