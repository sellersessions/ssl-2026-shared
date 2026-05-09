---
name: competitor-watch
description: Weekly snapshot of top competitor ASINs — listing changes, BSR shifts, review velocity changes, new SERP entrants. Pulls SellerApp data and diffs vs prior week. Use when running `competitor-watch {portfolio}` weekly via `/loop weekly`. Companion to the existing `competitor-tracker` agent (this is the skill-level wrapper).
---

# competitor-watch — Weekly Competitor Drift Detection

Active CRO clients need to know when their competitors move — new product entrants, pricing changes, listing refreshes. This catches it weekly.

## Prerequisites

- SellerApp via n8n MCP

## Invocation

```
competitor-watch {client-slug}
competitor-watch --asin={ASIN} --top-N=10
```

## Output

`/tmp/cro-research/{client}-competitor-watch-{date}.md`

## Phase 1 — Load Watchlist

State at `/tmp/cro-research/.competitor-watch/{client}.json`:
- ASIN of own product
- Top N competitor ASINs (from latest `competitor-sweep`)
- Last-run snapshot

If no state: trigger `competitor-sweep` first.

## Phase 2 — Pull Current Snapshot

For each watched ASIN: `Get_Product_Details` (with ratings, price, history flags) + `Get_Product_History_30d_`.

## Phase 3 — Diff vs Prior Snapshot

For each ASIN, detect:
- BSR shift (>10% movement in either direction)
- Price change (>5%)
- Rating change (>0.05)
- Review count surge (>20% week-over-week)
- Image change (image_urls[0] hash differs — possible new main image)

## Phase 4 — New Entrants

Re-pull SERP for primary keyword. Anyone in top 10 not in last week's top 10 = new entrant. Flag.

## Phase 5 — Output

```markdown
# Competitor Watch — {client}

**Week of:** {date} | **ASINs watched:** {N+1} (your + N competitors)

## Movers This Week

| ASIN | Brand | BSR Δ | Price Δ | Rating Δ | Reviews Δ | Image Changed | Note |
|------|-------|-------|---------|----------|-----------|---------------|------|
| B0... | Comp 1 | -22% (rising) | -$2 | +0.05 | +180 | YES | New main image — investigate |
| B0... | Yours | +5% (slipping) | — | — | +12 | — | — |

## New SERP Entrants

🆕 Brand X (B0...) — entered #7 for "{keyword}"

## Alerts

🔴 **Comp 1's image changed** — pull screenshot, run `main-image-thumbnail-audit` to see new SERP cluster
🟡 **Comp 2 dropped price** — review your pricing position via `price-sensitivity`

## Recommended Actions

- {specific action per alert}
- Schedule via `/loop weekly competitor-watch {client}` if not already
```

## Reference Files

- Existing agent: `competitor-tracker` (this skill is the scheduled wrapper)
- Vault: `CRO-Knowledge-Base/01-research/competitor-audit.md`

## Quality Bar

- [ ] State file persisted
- [ ] Movers + new entrants both surfaced
- [ ] Action recommendations specific (not "watch closely")

## Auto-Triggers

- `/loop weekly competitor-watch {client}`
- After new client onboarding (initial baseline)
