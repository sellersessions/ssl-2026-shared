---
name: price-sensitivity
description: Run a ProductPinion Pinion Ask Price Sensitivity test to determine PMC (Point of Marginal Cheapness), PME (Point of Marginal Expensiveness), OPP (Optimal Price Point), and Acceptable Price Range for an Amazon product. Use when running `price-sensitivity {ASIN}`, when launching a new product, or when considering a repricing decision.
---

# price-sensitivity — Van Westendorp Price Sensitivity

ProductPinion's Pinion Ask supports the Van Westendorp model out of the box. Returns the 4 standard outputs: PMC, PME, OPP, IPP, and Acceptable Range.

## Prerequisites

- ProductPinion MCP
- Product images + brief description (the test shows shoppers what they'd be buying)

## Invocation

```
price-sensitivity {ASIN}
price-sensitivity {ASIN} --shoppers=200    # default 100; 200 recommended for tighter range
```

## Output

`/tmp/cro-content/{ASIN}-price-sensitivity-{date}.md`

## Phase 1 — Configure

Pinion Ask → **Price Sensitivity** question type.

Setup:
- Show product images + brief description (1-2 sentences)
- 4 standard Van Westendorp questions:
  1. "At what price would this product start to feel expensive but still acceptable?" (PME — top of range)
  2. "At what price would this product feel too expensive to consider?" (Top reject)
  3. "At what price would this product feel like a great deal?" (PMC — bottom of range)
  4. "At what price would this product feel too cheap, and you'd worry about quality?" (Bottom reject)
- Sample: 100-200 shoppers
- Audience: research-brief

## Phase 2 — Compute Outputs

Pinion returns:
- **PMC** (Point of Marginal Cheapness): lowest price before quality doubt
- **PME** (Point of Marginal Expensiveness): highest price before "too expensive"
- **OPP** (Optimal Price Point): where most consider it fair
- **IPP** (Indifference Price Point): even split between "too cheap" and "too expensive"
- **Acceptable Range** (PMC to PME)

## Phase 3 — Output

```markdown
# Price Sensitivity — {Title}

**Sample:** {N} | **Date:** {date}

## Van Westendorp Outputs

- **OPP (Optimal Price):** ${price}
- **PMC (Marginal Cheap):** ${price}
- **PME (Marginal Expensive):** ${price}
- **IPP (Indifference):** ${price}
- **Acceptable Range:** ${PMC} – ${PME}

## Visual

{Pinion provides the curves chart — embed if available}

## Recommendation

Current price: ${current}

| Scenario | Price | Why |
|----------|-------|-----|
| Maximize unit volume | ${PMC + buffer} | Just above quality-doubt threshold |
| Maximize revenue | ${OPP} | Most acceptable to most shoppers |
| Premium positioning | ${PME - 1} | Cap before "too expensive" rejection |

## Action Items

- If current is below PMC: shoppers may be doubting quality (raise price)
- If current is above PME: leaving units on the table (lower price)
- If within range: validate other levers (image, copy) drive CVR
```

## Reference Files

- ProductPinion docs — Price Sensitivity question type
- `~/.claude/skills/cro/methodology.md`

## Quality Bar

- [ ] 4 Van Westendorp outputs all populated
- [ ] Acceptable range calculated
- [ ] Current price compared to range
- [ ] Recommendation per pricing strategy (volume vs revenue vs premium)

## When NOT to Use

- Mature, well-established pricing — no value
- Race-to-bottom commodity categories — Van Westendorp doesn't fit

## Auto-Triggers

- New product launch
- Repricing decision
- `listing-launch-pack` calls it
- User asks "what should I price this" / "is my price right"
