---
name: profit-recalc-on-change
description: Re-run Amazon profit calculation when BSR or competitor pricing shifts trigger a margin review. Uses SellerApp Profit Calculator to estimate referral fees, FBA fees, variable closing fees at proposed price. Use when running `profit-recalc-on-change {ASIN}`, when planning a repricing decision, or as a sub-step of pricing pipelines.
---

# profit-recalc-on-change — Margin Re-evaluation Skill

When pricing or BSR shifts (caught by `competitor-watch` or `keyword-rank-tracker`), margin needs re-evaluation. This automates the SellerApp Profit Calculator call.

## Prerequisites

- SellerApp via n8n MCP

## Invocation

```
profit-recalc-on-change {ASIN}
profit-recalc-on-change {ASIN} --listing-price={X}
profit-recalc-on-change {ASIN} --shipping-price={X}
```

## Output

`/tmp/cro-research/{ASIN}-profit-{date}.md`

## Phase 1 — Pull

Single SellerApp call: `Profit_Calculator` with ASIN + proposed price (current price by default).

Returns:
- Referral fee
- Variable closing fee
- Per-item fee
- FBA fee

## Phase 2 — Compute Margin

User provides COGS (or skill prompts for it) → compute:
- Net per unit = listing_price - sum_of_amazon_fees - COGS
- Margin % = net / listing_price

Compare to prior margin if state file exists.

## Phase 3 — Output

```markdown
# Profit Recalc — {ASIN}

**Date:** {date} | **Price tested:** ${X}

## Fee Breakdown

| Fee | Amount |
|-----|--------|
| Referral | ${} |
| Variable closing | ${} |
| Per-item | ${} |
| FBA | ${} |
| **Total Amazon fees** | **${}** |

## Margin

- COGS: ${} (provided)
- Net per unit: ${}
- Margin: {%}

## Compared to Prior Run

- Prior margin: {%}
- Change: {±X%}

## Recommendation

✅ Healthy margin — pricing decision can proceed
⚠️ Compressed — consider COGS optimization or price increase
🔴 Negative — DO NOT ship at this price

## Next

- For pricing decision: `price-sensitivity {ASIN}` to find acceptable range
- For long-term tracking: `/loop weekly profit-recalc-on-change {ASIN}`
```

## Reference Files

- `~/.claude/skills/cro/sellerapp-api.md` (Profit Calculator endpoint)

## Auto-Triggers

- `competitor-watch` flags competitor price drop
- `keyword-rank-tracker` flags BSR shift
- User says "recalc margin" / "what's my margin at ${X}"
