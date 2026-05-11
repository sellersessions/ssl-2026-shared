# `explain-module`

**When**
- User says: *"tell me more about Module N"* / *"what is <module-name>?"* / *"why do you recommend <module>?"*
- After the roadmap is rendered, when they want depth on something *other than* the featured module (which already gets a deep-dive page)

**Inputs**
- `<module-id>` or `<module-name>` — which module they're asking about
- The recommended module list from `recommend-modules` (held in context)
- in-context `brain` object
- `reference/sim-knowledge-base.md` § 5 — for case-study text
- `reference/architecture.md` — for archetype reference

**Tools**
- chat — output the explanation

**Outputs**
- A focused explanation in chat — what the module is, why it's recommended for this brand, what it replaces, what it depends on, how Sim built it at Ideal Direct

---

## What this skill is for

The roadmap renders 7 modules in the migration plan. The featured module gets a full deep-dive page. The other 6 are just lines on the timeline. When the user asks about one of those 6, this skill produces the same depth as the featured page — without re-rendering the whole report.

---

## Output structure

```
Module 03 · Advanced PPC, in-house

What it is
  An owned PPC management layer. Replaces Adtomic / Scale Insights / similar.
  Reads SP-API ad data into Supabase, applies your rules, writes adjustments
  back via the Ads API. AI-written recommendations alongside every change so
  every rule is visible.

Why it's recommended for <brand>
  Your stack has Adtomic at $249/mo with placement modifiers firing without
  visible logic. That's both a savings line ($249/mo) AND a black-box risk
  (you can't see why ranking moves). Replacing it gets you full rule
  visibility AND retires the sub.

What it replaces
  · Adtomic ($249/mo)
  · Manual ad reporting deck (2hr/fortnight, Maya)

What it depends on
  · Module 01 (Control Plane) — the Supabase + n8n + ClickUp foundation

What's downstream
  · None directly. Module 03 stands alone after the foundation.

How Sim built it at Ideal Direct
  "Scale Insights was buggy, expensive, opaque. Glitchy rank tracking sent
  placement modifiers awol. Built it in-house with 7-day median rank logic
  and AI-written recommendations. Every rule visible." — sim-knowledge-base.md § 5 #09
  Result: ~$6K/yr SaaS replaced.

Effort: 20 hrs · ~4 weeks part-time
Build sequence: Schema → Ad data ingestion → Rule engine → ClickUp surface → Deploy + alerts

Want the full build plan and verification plan for this module? Say "build plan for Module 03".
```

---

## Behaviour

1. **Identify the module.** Match user's phrasing to a module ID:
   - *"Module 3"* / *"Module 03"* → look up by ID
   - *"the PPC one"* / *"Advanced PPC"* / *"Adtomic replacement"* → match by name or canonical archetype
   - *"the demand thing"* → fuzzy match; if ambiguous, ask once

2. **Read the case-study text** from `sim-knowledge-base.md` § 5 for the corresponding archetype number. The mapping:
   - Module name → Sim's archetype number → § 5 paragraph

3. **Pull the brand-specific "why this matters"** from the brain. Look for the specific tools / hours / pain in `stack.md` that this module retires. *Don't generic-ify.* If the brand has Adtomic, the *"why"* mentions Adtomic by name and cost.

4. **Output the structured explanation** in the format above. Keep it under ~200 words for an explainer; users who want depth can ask for the build plan.

5. **End with the offer:** *"Want the full build plan and verification plan? Say `build plan for Module N`."* — gates the deeper output behind explicit user request.

---

## When the module isn't in the recommended list

If the user asks about a module that *isn't* in their roadmap *(e.g. "what's the Image Upload thing?" but they don't have a Figma → Seller Central flow)*:

1. **Explain the archetype** anyway, briefly.
2. **Be explicit** that it's not on their roadmap and why:

   > *"Image Upload bottleneck is Sim's #01 archetype — Figma plugin → SP-API. It saves Ideal Direct's listing specialist 15 hrs/week. Why it's NOT on your roadmap: your stack doesn't show a Figma → Seller Central upload flow. If you do have one and we missed it, tell me and I'll re-derive."*

This invites correction without re-running the whole pipeline.

---

## When the user wants to compare paths

If the question becomes *"Module 03 vs Module 04 — which first?"*, escalate to `compare-paths` *(planned, not yet shipped)*. For now, stay in `explain-module` and address each module separately, ending with: *"Want me to compare them head-to-head? — say `compare Module 03 and Module 04`."*

---

## Don't

- Don't re-render the roadmap from this skill. This is a chat-only explanation.
- Don't promise outcomes the brain doesn't support. Sim's case-study numbers are HIS — the user's actual savings depend on their stack.
- Don't paraphrase Sim's case study text. **Quote it.** *"`Surfaces top-3 winning ASINs every Monday`"* in quotes attributed to him is more credible than *"surfaces winning products"* paraphrased.
- Don't go longer than ~200 words. The deep dive is the build plan; this is the explainer.
- Don't fire `generate-build-plan` automatically. Wait for the user to explicitly ask. Respecting the user's pace is part of the consultant posture.
