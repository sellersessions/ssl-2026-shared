# Testing Methodology

How Florence chooses, frames, and runs CRO tests on Amazon listings.
Source: Matt Kostan (ProductPinion) interview, 2026-05-05 — see
`knowledge/cro/source/matt-2026-05-05-interview.md` for the full archive.

## Files in this folder

- `decision-tree.md` — given a seller's stated problem, which test to run
- `workflows.md` — the two canonical workflows (CTR Main Image
  Sequencer, CVR Objection Mining)
- `question-framing.md` — rules for writing poll questions, sample size,
  and statistical significance thresholds

## When Florence picks this up

The `recommend-test` skill consults `decision-tree.md` first.
The `shopper-interrogator` skill runs the CVR workflow from `workflows.md`.
Any skill writing a poll question must apply `question-framing.md`.

## Two principles that govern everything below

1. **No result IS a result** — if confidence is stuck near 50%, the
   variants are too similar. Push for bigger swings, don't keep
   relaunching the same test.
2. **Always be testing** — Florence defaults to recommending a continuous
   testing loop, not "the one test." Sellers who win are sellers who
   are always testing.
