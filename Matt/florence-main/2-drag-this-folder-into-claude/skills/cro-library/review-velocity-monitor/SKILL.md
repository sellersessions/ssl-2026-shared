---
name: review-velocity-monitor
description: Track new Amazon reviews per ASIN since last run, detect sentiment shifts, and surface critical reviews appearing at the top of the reviews section. Use when running `review-velocity-monitor {ASIN}` weekly or scheduling via `/loop weekly`. Catches review velocity drops, regression signals, and surfaces 1-2★ reviews early so they can be addressed before they kill conversion.
---

# review-velocity-monitor — Weekly Review Health Check

Reviews are CVR's leading indicator. A new 1★ landing at the top of the reviews section can drop CVR within hours. This skill monitors weekly so we catch it.

## Invocation

```
review-velocity-monitor {ASIN}
review-velocity-monitor {ASIN list}
review-velocity-monitor {ASIN} --since=2026-04-01   # custom diff window
```

## Output

`/tmp/cro-research/{ASIN}-review-monitor-{date}.md` — new reviews + sentiment delta + alerts.

## Tools Used

n8n MCP wrapper.

| Step | Tool | Purpose |
|------|------|---------|
| Recent reviews | `Get_Product_Reviews` (sort=recent, page 1-2) | Newest 20 |
| Critical | `Get_Product_Reviews` (rating=1, page 1, sort=recent) | Latest 1★ |
| Top critical | `Get_Product_Reviews` (rating=1, page 1, sort=helpful) | Most-helpful 1★ (this is what shoppers see) |

## Phase 1 — Pull

3 calls. Compare to state file at `/tmp/cro-research/.review-state/{ASIN}.json`.

## Phase 2 — Diff

State file should have:
- Last-run timestamp
- Last-known total review count
- Last-known overall rating
- IDs of reviews that were on page 1 (top of stack)

Compute:
- New reviews since last run (count + IDs)
- Rating delta (e.g. 4.6 → 4.5 = 🔴 alert if drop ≥ 0.1)
- New 1-2★ reviews (count + content)
- Top-of-stack changes — did a critical review move into the top 5? That's the alarm.

## Phase 3 — Alerts

Trigger an alert when:
- 🔴 Overall rating dropped ≥0.1 in this period
- 🔴 A new 1-2★ review appeared in top 5 helpful
- 🟡 Review velocity dropped >50% vs prior period
- 🟡 New 1★ has >5 helpful votes (high visibility)

## Phase 4 — Output

```markdown
# Review Velocity Monitor — {Title}

**ASIN:** {ASIN} | **Period:** {last-run} → {now} | **Status:** {🟢 stable / 🟡 watch / 🔴 alert}

## Snapshot

- Total reviews: {N} (was {N last run}, +{Δ})
- Overall rating: {X.X}★ (was {X.X}★, Δ {±0.X})
- New reviews in period: {N}
- New 1-2★ in period: {N}

## Alerts

🔴 **{Alert title}** — {detail with quote, fewer than 15 words}

(or 🟢 No alerts this period)

## New Reviews — Sample

| Date | Stars | Verified | Headline | Top concern |
|------|-------|----------|----------|-------------|
| ... | 5★ | ✅ | ... | — |
| ... | 1★ | ✅ | ... | "broken on arrival" |

## Top-of-Stack Critical Review (what shoppers see first)

> "{quote, fewer than 15 words}" — {date}, {N helpful votes}

If this review was NOT in top stack last week and now is: priority action — file a request for review (if eligible) or trigger `objection-killer` to preempt the issue.

## Recommended Actions

- {Specific action per alert}
- Schedule via `/loop weekly review-velocity-monitor {ASIN}` if not already scheduled
```

## Reference Files

- `~/.claude/skills/cro/review-analysis.md`
- Vault: `CRO-Knowledge-Base/01-research/review-mining.md`

## Quality Bar

- [ ] State file written for next-run diff
- [ ] Alert section is clear (🟢/🟡/🔴 visible at a glance)
- [ ] Top-of-stack review explicitly checked (this is the highest-impact CVR signal)
- [ ] Quotes under 15 words (copyright)

## Auto-Triggers

- Scheduled via `/loop weekly` for active CRO clients
- After A/B test ends — check review impact
- During quarterly listing refresh
