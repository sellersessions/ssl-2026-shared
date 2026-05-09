# `shopper-interrogator`

**When**
- User says: "shopper-interrogator <ASIN>", "find out what's stopping shoppers", "objection mining", "why aren't people buying B0…?", "run a CVR diagnosis"
- `recommend-test` routed here after the seller acknowledged "CVR is the problem"
- The headline workshop demo skill — fires from a stage trigger via `florence-demo-live-trigger`

**Inputs**
- Target ASIN (from chat or `brain.products`)
- In-context brain (for ASIN context, voice, goals)
- `integrations.n8n.webhooks` populated with the 6 P0 workflow URLs (review-mining, rufus-extract, pp-openended-launch, objection-synthesis, pp-ranking-launch, image-blueprint)
- Anthropic key + ProductPinion key + Amazon scrape MCP URL configured in n8n's credential vault
- Reference: `reference/03-testing-methodology/workflows.md` (CVR Objection Mining 4-step), `reference/02-visual-content/main-image-tactics-library.md` (52 tactics), `reference/05-productpinion/case-studies.md` (proof points)

**Tools**
- 6 webhook calls to n8n (review-mining → rufus-extract → pp-openended → synthesis → ranking → image-blueprint)
- Chat (progress updates between webhook calls; final ranked output)
- Optional: Slack handoff via `integrations/slack.md` if user opted in

This skill is **chat-driven** with a markdown image-blueprint at the end. It does **not** re-emit the cockpit (the cockpit is for onboarding + health). For workshop demos, the long-form image blueprint can be delivered as a separate artifact in a follow-up — for now, output it as a markdown block in chat the user can copy.

**Outputs**
- Top objections ranked by what most stops a sale (3–5 line table in chat)
- Verbatim shopper quotes for the top 2 objections
- Recommended image stack: Slot 2 → Slot 7, one image per ranked objection
- Image blueprint as markdown in chat (the user can copy/save; a dedicated artifact kind is roadmap)
- Updated `brain.history.shopper_runs` with the run record
- Final question: "Want me to draft the image briefs for Slots 2–4, or run the Stacked Image Test once you have new concepts?"

---

## When to run this vs `recommend-test`

- `skills/recommend-test.md` is the **router** — given a seller's question, picks one test.
- `skills/shopper-interrogator.md` is the **full CVR loop** — Videos → Ask → Ranked → image-stack recommendation. Use it when the seller has acknowledged "CVR is the problem" and wants Florence to drive the whole thing.

---

## Behaviour

### Step 0 — Verify inputs

Before launching anything that costs credits:

1. ASIN provided and in `brain.products` (or user explicitly named it)
2. `integrations.n8n.webhooks` has all 6 P0 URLs (not `PASTE_URL_HERE`)
3. ProductPinion plan in `brain.integrations.product_pinion` has enough credits for ~300 respondents

If any input is missing, stop and ask. Don't launch a half-configured chain — partial outputs make the synthesis unreliable.

### Step 1 — Pinion Videos (qualitative baseline, optional but recommended)

Default sample: 5–10 video respondents (3–5 minutes each).

Send shoppers to the live listing URL with the three core questions:

1. "What's confusing about this listing?"
2. "What needs more clarity?"
3. "Why wouldn't you buy this?"

Florence reads `get_video_submissions` once they're back, transcribes if needed, and pulls 8–15 candidate objections in shoppers' own language.

**For workshop demo / time-constrained runs:** seller may skip Videos. Note the skip in the output ("Skipped Pinion Videos for speed — best practice is to run them.").

### Step 2 — Pinion Ask (open-ended)

Default sample: 100 shoppers.

Call `webhooks.pp-openended-launch` with:

```json
{
  "asin": "{ASIN}",
  "sample_size": 100,
  "question": "What's confusing about this listing? What's stopping you from buying?"
}
```

Response: `{ "poll_id", "status", "expected_fill_minutes" }`. Poll fills in 5–60 min.

While waiting, run Step 2.5 in parallel.

### Step 2.5 — Review mining + Rufus extract (parallel)

Two parallel webhook calls (these don't depend on the PP poll):

1. `webhooks.review-mining` — input: `{ asin, competitors: [from brain.competitors[asin]] }` → returns clustered competitor 1–3 star reviews with frequency
2. `webhooks.rufus-extract` — input: `{ asin }` → returns Rufus shopper questions

Hold both outputs.

### Step 3 — Synthesis

When the PP open-ended poll fills (or after a max-wait of ~30 min):

1. Call `webhooks.objection-synthesis` with all three inputs:
   ```json
   {
     "asin": "...",
     "reviews_objections": <output of review-mining>,
     "rufus_questions": <output of rufus-extract>,
     "pp_responses": <verbatim from get_poll_submissions>
   }
   ```
2. Returns 5–7 ranked objection clusters with evidence from each source.

### Step 4 — Pinion Poll Ranked Test (objection prioritisation)

Take the top 5–7 clusters from Step 3.

Call `webhooks.pp-ranking-launch`:

```json
{
  "asin": "...",
  "objections": [...top 5–7 from Step 3...],
  "sample_size": 100
}
```

Wait for fill. Read `get_poll_stats` for the ordered list, most painful → least.

If confidence on the top objection is <70%, surface that: *"Top objection ranked at 62% confidence — I'd top up before image work."* Offer to add 50 more respondents.

### Step 5 — Image-stack recommendation

Call `webhooks.image-blueprint`:

```json
{
  "asin": "...",
  "asin_context": { "title": "...", "category": "...", "current_main_image_url": "..." },
  "ranked_objections": [...output of Step 4...]
}
```

Returns markdown image brief. Cross-reference `reference/02-visual-content/main-image-tactics-library.md` to suggest a tactic per slot if the blueprint doesn't already cite one.

### Step 6 — Validate (optional, deferred)

Once the seller has produced new image concepts, run a **Stacked Image Test** (Pinion Poll type: `stacked_image`) — old gallery vs new gallery — to validate before shipping.

### Step 7 — Output

Use this template:

```
{ASIN} — Shopper Interrogator results

Top objections, ranked by what most stops a sale:
  1. {objection} — {N}% picked it as #1
  2. {objection} — {N}%
  3. ...

In shoppers' own words:
  "{verbatim quote from Step 2 that captures the top objection}"
  "{verbatim quote that captures the second}"

Recommended image stack (Slot 2 → Slot 7):
  Slot 2: {answers objection 1} — tactic: {Add Packaging / Index Image / etc.}
  Slot 3: {answers objection 2} — tactic: {...}
  Slot 4: {answers objection 3} — tactic: {...}
  ...

Total cost: {N} ProductPinion credits.

Want me to draft image briefs for Slots 2–4, or run the Stacked Image Test once you have new concepts? — F.
```

Cite the case studies that ground the recommendation:

- $19K/month sequencer (full workflow, ROI 4,286%): `reference/05-productpinion/case-studies.md`
- Children's Ride-On Walker (full chain, +52.63% CTR): `reference/05-productpinion/case-studies.md`

---

## Voice rules

- **Verbatim wherever possible.** Shopper language is the asset. Don't paraphrase a great quote into a tidy summary.
- **Rank explicitly.** If Step 4 didn't reach 70% confidence on the top objection, say so — recommend topping up before image work.
- **One objection per image** in the recommended stack. The Index Image is a separate pattern (multi-message, top of gallery) — don't conflate it with the per-slot recommendation.

---

## Don't

- Don't skip Steps 1, 2, 2.5 to save credits unless the seller explicitly accepts the trade-off — note the skip and what data is missing.
- Don't run Step 4 (ranked poll) until Step 3 (synthesis) is back. Premature ranking on Florence's guesses defeats the point.
- Don't recommend image production until objections are ranked. The rank determines slot order.
- Don't fabricate verbatim quotes. If the open-ended poll returned thin text, surface that and offer to top up.
- Don't promise lift numbers. Cite the case-study range, not a guarantee.
---

## v0.1.7 — Hand-off to the Higgsfield workflow

After the full Shopper Interrogator chain lands the image blueprint, Florence offers a structured hand-off into the matching Higgsfield render workflow. The blueprint already names the slot type; map it:

| Blueprint targets | Higgsfield workflow | Methodology ref |
|---|---|---|
| Main image (slot 1) | `render main image for {asin}` | `reference/02-visual-content/main-image-creative-director.md` (1:1, 8 techniques) |
| Listing slot 2-7 | `render listing slot {N} for {asin}` | `reference/02-visual-content/listing-image-creative-director.md` (1:1, 5-spinoff) |
| A+ module rebuild | `render A+ module for {asin}` | `reference/02-visual-content/aplus-creative-director.md` (16:9, 4 Critical Rules + 5-question checklist) |

The closing chat narration offers the next step, citing the chosen creative-director ref. Florence does NOT auto-launch the render — the user confirms the hand-off, then `render` runs the 13-step canonical flow including its own user-review gate before spending Higgsfield credits.
