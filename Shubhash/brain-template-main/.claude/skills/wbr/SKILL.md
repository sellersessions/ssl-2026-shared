---
name: wbr
description: Build the Weekly Business Review across all active SKUs and channels. Run from vault root with /wbr --week=YYYY-Wxx. Writes a new daily/wbr-YYYY-Wxx.md from the wbr template.
---

# /wbr

Generate this week's Weekly Business Review.

## When to use
- Every Monday morning, after the restock cycle is done.
- Or any time you need a snapshot of the portfolio.

## Inputs
- `--week=YYYY-Wxx` (optional) - ISO week. Defaults to the current week.

## What the skill does

1. **Resolve the period** (Monday to Sunday of the target ISO week).
2. **Iterate every `wiki/skus/*.md` page** with `status: active | scaling | mature`:
   - Pull `revenue_30d`, `units_30d`, `ad_spend_30d`, `cm3_30d`, `cm3_30d_prior` (if tracked).
   - Compute weekly approximations from 30d (rough, label as such).
3. **Iterate every `wiki/channels/*.md`** page:
   - Pull channel-level `revenue_30d`, `cm3_30d`.
4. **Rank SKUs** by absolute CM3 contribution this week (top 5, bottom 5).
5. **Find new decisions** (any `wiki/decisions/*.md` with `date` inside this week).
6. **Find pending follow-ups** (any decision with `follow_up_date` inside next 7 days).
7. **Write `wiki/daily/wbr-YYYY-Wxx.md`** using `_templates/wbr.md` with all sections prefilled.

## Output expectations

- The WBR page is a draft. Operator reads it Monday morning, edits the bets and blockers, signs off.
- Lift the "decisions to make next week" section into Monday's daily note.

## Failure modes
- No SKUs marked `active`: skill bails with a clear message asking the operator to set statuses.
- No `monthly-close` to read CCC from: omit the cash section and flag.
- Channel pages missing 30d numbers: list the missing channels in the WBR header.

## What this skill does NOT do
- Replace the operator's judgement. The WBR page is a starting point. Active bets, blockers, and decisions to make next week are still operator-written.
