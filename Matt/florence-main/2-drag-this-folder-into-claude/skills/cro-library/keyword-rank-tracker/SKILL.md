---
name: keyword-rank-tracker
description: Schedule daily/weekly keyword rank tracking for an Amazon ASIN portfolio via SellerApp n8n MCP. Up to 150 keywords × 150 ASINs per request. Outputs ranked-position changes, indexing checks, and movers report. Use when running `keyword-rank-tracker {ASIN list}`, when monitoring SEO impact of listing changes, or when client wants ongoing rank visibility.
---

# keyword-rank-tracker — Scheduled Keyword Rank Monitor

Track organic + sponsored rank for keyword × ASIN pairs over time. Detects gains/losses post-listing-change and surfaces indexing issues.

## Invocation

```
keyword-rank-tracker {ASIN list} --keywords={list or path}
keyword-rank-tracker {ASIN list} --keywords-from-reverse-asin   # auto-pick top 20 from reverse ASIN
keyword-rank-tracker --schedule=weekly                            # convert to scheduled task
```

## Output

`/tmp/cro-research/{ASIN-or-portfolio}-rank-tracker-{date}.md` — current snapshot + diff vs prior run if state file exists.

## Tools Used

n8n MCP wrapper.

| Step | Tool | Purpose |
|------|------|---------|
| Schedule batch | Keyword Tracking schedule endpoint | Submit keyword × ASIN job |
| Fetch | Keyword Tracking report endpoint | Pull JSON or CSV results |
| Reverse ASIN | `Keyword_Research_V2_Reverse_ASIN` | Auto-pick keywords if not provided |

## Phase 1 — Determine Keyword List

If `--keywords` provided: use as-is.
If `--keywords-from-reverse-asin`: pull top 20 by relative_score per ASIN, dedupe.
If neither: prompt user.

## Phase 2 — Submit

Batch request: `{keywords, product_ids, geo, enable_index_checking: true, include_sponsored: false, report_type: "json"}`. Save `request_id`.

## Phase 3 — Poll & Parse

Poll the report endpoint every 60s until status=completed. Parse JSON.

For each `{keyword, ASIN}` pair:
- Position (1-100+ or "not in top 100")
- Indexed? (boolean)
- Sponsored position (if checked)

## Phase 4 — Diff vs Prior Run

Look for prior state at `/tmp/cro-research/.rank-state/{portfolio_hash}.json`. If found:
- Compute position delta per pair
- Tag movers: 🟢 ↑5+ / 🔴 ↓5+ / ⚪ stable
- Tag indexing changes: ❌ lost / ✅ gained

Save current run as new state file.

## Phase 5 — Output

```markdown
# Keyword Rank Tracker — {Portfolio name or first ASIN}

**Date:** {date} | **ASINs:** {N} | **Keywords:** {N} | **Pairs tracked:** {N×N}

## Snapshot

| ASIN | Keyword | Pos | Indexed | Δ vs last | Tag |
|------|---------|-----|---------|-----------|-----|
| B0... | "leg pillow" | 3 | ✅ | -2 | 🟢 |
| ... | ... | ... | ... | ... | ... |

## Movers (since last run)

### 🟢 Top Gainers
- B0... × "leg pillow": #5 → #3 (+2)

### 🔴 Top Decliners
- B0... × "wedge": #4 → #12 (-8) — investigate

### ❌ Lost Indexing
- B0... × "elevation": was indexed last week, now not

## Recommended Actions

- For sharp drops: check listing changes, review velocity, competitor moves
- For lost indexing: backend search terms + content keyword density
- Schedule via `/loop weekly keyword-rank-tracker {portfolio}` to automate
```

## Reference Files

- `~/.claude/skills/cro/sellerapp-api.md` — Keyword Tracking endpoints
- Vault: `CRO-Knowledge-Base/04-data-analysis/search-query-performance.md`

## Quality Bar

- [ ] Movers table populated (otherwise skill provides no incremental value over a fresh pull)
- [ ] State file persisted for next run's diff
- [ ] Lost-indexing flagged clearly — that's a high-priority alert

## Auto-Triggers

- User schedules with `/loop weekly`
- After listing changes (post-test, post-image-swap)
- Weekly client recap

## Companion Skill

For ongoing monitoring without writing reports each time, run via `/loop` skill: `/loop weekly keyword-rank-tracker {ASIN list}`.
