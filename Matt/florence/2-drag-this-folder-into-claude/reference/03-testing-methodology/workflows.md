# Canonical Workflows

Florence runs two end-to-end workflows. Everything else is a variation.

---

## CTR — Main Image Sequencer (5 steps)

When a seller's CTR is low, the listing is failing to stop the scroll.
This is the workflow that took a real listing from 7.07% to 14% in
simulation and +$19K/month on Amazon at $447 in test cost.

### Step 1 — Pinion Videos (qualitative baseline)

Send shoppers to a mocked-up or live Amazon search page.

- Ask: *"Which would you click? What was most attractive? Which would
  you actually buy based on this search page?"*
- Goal: understand what's getting **attention**, not what looks
  prettiest. New competitors, title shifts, and shopper-language drifts
  ("cruelty-free", "vegan" surfacing in competitor titles) appear here
  before any keyword tool catches them.

### Step 2 — Search Simulation Baseline

Send 100+ shoppers (50 per option rule) to a mocked-up Amazon SERP with
the seller's product and closest competitors.

**Competitor selection:**
- Match on price range and product style
- Match on review maturity (a new product isn't competing with a
  10,000-review listing)
- Common sense — who are shoppers actually choosing between?

**Recommended:** hide price and review count. The name of the game
for CTR is pattern interruption — visual stop-the-scroll. When price
and reviews are visible, shoppers anchor on those instead of the image.

### Step 3 — Concept Creation

Use Pinion Video feedback + baseline data combined to generate new
main image concepts. If the seller has no ideas, use the
**52-tactic library** at `knowledge/cro/02-visual-content/main-image-tactics.json`
plus Matt's top-10 weighting in `main-image-tactics-library.md`.

### Step 4 — Image Split Test (A/B/C)

Test the new concepts head-to-head with a Pinion Poll Image Split Test.

### Step 5 — New Concept Search Simulation

Re-run Step 2's baseline with the winning concept swapped in.

**Critical: exclude previous respondents** — they're now biased.
ProductPinion has a one-click feature for this. Compare click share
old vs new. If it's up, ship.

---

## CVR — Objection Mining (4 steps)

When CTR is fine but CVR is low, shoppers are clicking but not buying.
Core principle: **a confused mind never buys.** Remove every objection
before they leave the page.

Context: Amazon data (2022) — 28% of purchases happen in 3 minutes or
less, 50% in 15 minutes or less. Florence is winning or losing the
impulse buy, not running a long sales cycle.

### Step 1 — Pinion Videos (qualitative)

Send shoppers to the live listing.

- Ask: *"What's confusing? What needs more clarity? Why wouldn't you
  buy this?"*
- Goal: watch objections form in real time.

### Step 2 — Pinion Ask (open-ended)

Send 100 shoppers to the listing with a written prompt:

> *"What's confusing about this listing? What's stopping you from buying?"*

Florence synthesises patterns from the written responses. Open-ended
Asks also surface things like spelling mistakes, broken bullets, and
mobile rendering issues that no other test catches.

### Step 3 — Pinion Poll Ranked Test (objection prioritisation)

Once the cluster of objections is known, run a Ranked Poll:

> *"Which of these concerns would most stop you from buying?"*

Output: ordered list of objections, most painful → least painful.

### Step 4 — Image sequencing based on ranked objections

One image, one objection answered. Don't stack messages on a single
image (the **Index Image** is the only exception — see
`knowledge/cro/04-data-analysis/...` and Matt's CVR levers).

Image order = objection rank. Most important buying trigger first,
then supporting images that go deeper on the same point. More content
consumed = more conversions.

Validate the new gallery with a **Stacked Image Test** (Pinion Poll
type): old gallery vs new gallery, head-to-head.

---

## Real result from this workflow (Children's Ride-On Walker case study)

Objections surfaced via Videos and Ask:
- How hard is assembly?
- Weight limits? Sharp edges? Stability? Wheels too thin? Handles too short?
- Will it scratch floors?
- No interactive features (lights, sounds)
- Old-school imagery — "Why are there ducks?!"

Concept C won at 37% vs baseline 24.24% — **52.63% higher CTR**, 128
more shoppers per 1,000 impressions reaching the listing.

> "Why are there ducks?" is the lesson. Shoppers will tell you things
> you'd never think to ask.
