# `recommend-test`

**When**
- User says: "recommend-test", "my CTR is low", "my CVR is low", "what test should I run for X?", "is my image working?", "should I test a price increase?"
- Any seller-problem phrasing in `reference/03-testing-methodology/decision-tree.md`

**Inputs**
- The user's stated problem (one or two sentences)
- In-context brain (for ASIN context, goal weighting)
- Reference: `reference/03-testing-methodology/decision-tree.md` (the canonical map)

**Tools**
- Chat (state recommendation, draft poll question, confirm before launch)
- `reference/03-testing-methodology/question-framing.md` (apply 7 rules)
- `reference/03-testing-methodology/workflows.md` (full workflow steps when relevant)
- `reference/05-productpinion/case-studies.md` (cite proof when it adds confidence)

**Outputs**
- Named test recommendation in chat
- Sample size + cost estimate (if PP plan in `brain.integrations.product_pinion`)
- Draft poll question (applying all 7 framing rules)
- Confidence threshold to ship: 70%+
- Final question: "Want me to launch it?"

---

## Behaviour

### Step 1 — Restate the problem

If the user's framing is unclear, restate it back in one sentence and confirm before recommending. Don't recommend a test for a problem you might be solving wrong.

### Step 2 — Look up the matching test

Read `reference/03-testing-methodology/decision-tree.md`. Match the seller's framing to a row in the table. The decision tree covers:

- "Just give me ideas / audit my listing" → `optimize-listing` (fast SellerApp-driven audit, ~30s, no panel cost — best first stop before committing to panel-poll spend)
- "My CTR is low" → Main Image Sequencer (5-step)
- "My CVR is low but CTR is fine" → CVR Objection Mining (4-step)
- "I want to know what's stopping people from buying" → CVR Objection Mining (literal phrasing works)
- "I'm not sure if my new image is better" → Quick A/B or Dual Search Simulation
- "Which of my 5 image ideas wins?" → 5-way Image Split Test
- "Test a price increase" → Van Westendorp in Pinion Ask
- "Why aren't my bullets working?" → Videos + open-ended Ask + per-bullet A/B
- "Losing the buy box" → Out of scope, redirect (pricing/hijacker)
- "Launching a new product" → Videos on prototypes + Search Simulation + Van Westendorp
- "Expanding into a new country" → Local panel test before localising
- "Test a brand name or logo" → Pinion Poll Text/Image Split Test
- "Is my title working?" → Search Simulation + Manage Your Experiments

### Step 3 — Pull the workflow

If the row maps to a multi-step workflow (Main Image Sequencer or CVR Objection Mining), read `reference/03-testing-methodology/workflows.md` for the steps and quote them back. Don't summarise to "two steps" when there are five — accuracy matters here.

### Step 4 — Frame the poll question

Apply every rule in `reference/03-testing-methodology/question-framing.md`:

1. Singular (one question, one thing tested)
2. No superlatives ("which is best" → "which would you click on")
3. Purchase-intent language
4. Don't explain the test in the question
5. Match question to context (CTR test → search behaviour; CVR test → buying intent)
6. No loaded adjectives
7. Never start with the brand name

Run the draft past the 7-rule checklist before showing it.

### Step 5 — Estimate sample size

Default 50/option (per Matt's rule). For a 5-option Image Split Test that's 250 respondents. Florence can also top up on a live test rather than relaunching — surface this option when relevant (especially for the 60–69% confidence zone).

If `brain.integrations.product_pinion` has the seller's plan, show credit cost.

### Step 6 — Present

Use this template:

```
Recommendation: {test type, named}

Why this one: {one sentence — what about the seller's problem maps
to this test, citing decision-tree.md}.

Workflow:
  1. {step 1}
  2. {step 2}
  3. ...

Sample size: {N} respondents per option. {Total cost in credits if known.}

Question I'd ask:
  "{the actual poll question, applying all 7 framing rules}"

Confidence threshold to ship: 70%+. (60–69% = top up. 50% = bigger swings.)

Want me to launch it?
```

### Step 7 — On confirm, launch

When the user says yes:
- For Pinion Polls (open-ended, ranked, image split, etc.): call the matching n8n webhook from `integrations/n8n-webhooks.md`
- For full workflows (e.g. CVR Objection Mining): hand off to `skills/shopper-interrogator.md` to drive the chain

Don't launch silently. Confirm: *"Launching {test} now. Results in 5–60 min depending on PP panel speed. I'll ping you when first results land."*

---

## Edge cases that are NOT a test

If the seller's problem maps to one of these, don't recommend a test — recommend the fix:

- Spelling mistake / wrong image uploaded → just fix it
- Buy box loss → pricing or hijacker, redirect
- Product change in flight → fix the product first
- New launch with < a few weeks of data → too thin to baseline
- High CTR + low CVR + over-promising main image → flag as the likely cause, then run CVR objection mining

---

## Don't

- Don't recommend more than one test per response. Sequence them.
- Don't skip Pinion Videos as the qualitative first step unless the seller explicitly asks to skip — and note the skip in the response.
- Don't promise a result. Quote case-study ranges, not guarantees. ("Similar redesigns lifted CVR 8–12% in our calibration set" — yes. "This will lift CVR by 12%" — never.)
- Don't recommend a test the seller can't action. If they don't have ProductPinion connected, route to `integrations/product-pinion.md` first.
- Don't write a poll question without applying all 7 framing rules. The rules aren't optional.