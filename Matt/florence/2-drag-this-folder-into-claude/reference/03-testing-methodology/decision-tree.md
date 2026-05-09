# Test Decision Tree

When a seller asks Florence a question about their listing, the answer
is almost always one of these workflows. Match the seller's framing to a
row, then route to the named workflow or test type.

| Seller says | Florence runs |
|---|---|
| "My CTR is low" | **Main Image Sequencer** (5-step) — see `workflows.md` |
| "My CVR is low but CTR is fine" | **CVR Objection Mining** (4-step) — see `workflows.md` |
| "I want to know what's stopping people from buying" | **CVR Objection Mining**. The literal phrasing "Why wouldn't you buy this?" works in both Pinion Videos and Pinion Ask. |
| "I'm not sure if my new image is better" | (a) Quick: Pinion Poll Image Split Test A vs B. (b) Rigorous: dual Search Simulation — duplicate the baseline, swap in new image, exclude previous respondents, compare click share. |
| "I want to know which of my 5 image ideas wins" | 5-way Pinion Poll Image Split Test. Start at 100–150 respondents, top up if tight. Question framing: "Which of these would you be most likely to click on / buy?" |
| "I want to test a price increase" | Van Westendorp Price Sensitivity test in Pinion Ask. Outputs PMC, PME, optimal price, indifference price. Direct test = raise price on Amazon and watch CTR/CVR. |
| "I want to know why my bullets aren't working" | (1) Pinion Videos asking shoppers to read the bullets. (2) Open-ended Pinion Ask: "How would you improve these?" (3) One-bullet-per-question A/B in Pinion Ask. **Never test all 5 vs all 5.** |
| "I'm losing the buy box" | Out of scope — pricing or hijacker problem, not a consumer panel problem. Redirect. |
| "I'm launching a new product" | Pinion Videos on prototypes (Drive/Dropbox link), Search Simulation against existing competitors, Van Westendorp for launch price. |
| "Should I expand into [country]?" | ~160 countries available. Translate assets, test locally before localising. US ≠ Europe behaviour. |
| "Which variation/bundle should I lead with?" | Pinion Poll Image Split Test on the variations. |
| "I want to test my brand name or logo" | Brand name: Pinion Poll Text Split Test. Logo: Pinion Poll Image Split Test. Test before committing — Invisaband case study returned 98% certainty for $1M brand. |
| "Is my title working?" | Pinion Search Simulation with the new title variant. Cross-check with Amazon's Manage Your Experiments (4–8 weeks). See title heuristics below. |

## Edge cases Florence should flag (not run a test for)

- **Over-promising main image** — high CTR + low CVR often means the
  main image is setting an expectation the listing can't deliver.
- **Scathing 1-star review or "frequently returned" badge** — these
  are conversion killers image testing alone can't fix. Likely a
  product-development issue.
- **Spelling mistakes / wrong image uploaded** — just fix it. Don't test.
- **Product change in flight** — test the product first, then optimise
  the listing.
- **New launch with < a few weeks of data** — too thin to baseline.

## CTR diagnosis: which problem first

If both CTR and CVR are low, fix CTR first. More clicks = more data
to work with for the CVR loop afterwards.

## Title heuristics (when "is my title working?" comes up)

- Most Amazon titles are transactional, boring, keyword-stuffed —
  pattern interruption works at title level too.
- Use a **speed bump word**: a non-typical adjective shoppers wouldn't
  expect in the category. Examples: Indestructible, Revitalize,
  Bespoke, Forged, Hand-stitched, Transform, Artisanal.
- Keep titles under 100 characters — Amazon's own docs say shorter
  titles drive more detail page visits.
- Avoid gimmick spellings ("Klear" instead of "Clear") — AMA research
  shows consumers respond less positively to them.

## When NOT to recommend a test

The ROI of testing is almost always positive — a 5% lift on a
$30K/month product is $18K/year. Default is "always be testing." The
only times Florence should hold off:

1. The change is clearly broken (typo, wrong file) — fix it, don't test it
2. The seller is changing the product itself — test the product first
3. CTR/CVR data is too thin to establish a baseline (new launch)
