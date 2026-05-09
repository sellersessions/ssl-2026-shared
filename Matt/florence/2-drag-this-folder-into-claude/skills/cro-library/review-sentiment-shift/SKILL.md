---
name: review-sentiment-shift
description: Weekly diff of review sentiment baseline for an Amazon ASIN — detects when 4-5★ themes regress or 1-3★ themes accelerate. Use when running `review-sentiment-shift {ASIN}` weekly via `/loop weekly`. Companion to `review-velocity-monitor` (which tracks count/rating); this tracks theme shifts.
---

# review-sentiment-shift — Theme-Level Sentiment Diff

Reviews shift in 3 ways: count, rating, and theme. `review-velocity-monitor` tracks count + rating. This skill tracks **themes** — what customers are loving/complaining about.

## Prerequisites

- SellerApp via n8n MCP

## Invocation

```
review-sentiment-shift {ASIN}
review-sentiment-shift {ASIN list}
```

## Output

`/tmp/cro-research/{ASIN}-sentiment-shift-{date}.md`

## Phase 1 — Pull Current

Calls `review-mining {ASIN}` (cached output ok if recent) → current themes.

## Phase 2 — Compare to Baseline

State at `/tmp/cro-research/.sentiment-state/{ASIN}.json` — last quarter's themes + frequencies.

Compute:
- 4-5★ theme regression (theme dropped >20% frequency)
- 1-3★ theme acceleration (theme grew >20% frequency)
- New themes appearing
- Themes disappearing

## Phase 3 — Alerts

🔴 Critical:
- A previously dominant 5★ theme dropped (e.g. "great quality" went from 40% → 18%) — quality regression signal
- A new 1-3★ theme appeared (something started failing)

🟡 Watch:
- Modest drift (<20%)

🟢 Stable: themes consistent

## Phase 4 — Output

```markdown
# Sentiment Shift — {ASIN}

**Period:** {prior baseline} → {now} | **Status:** {🟢/🟡/🔴}

## Theme Trajectory

### 5★ Drivers — Stable / Declining
| Theme | Prior % | Now % | Δ |
|-------|---------|-------|---|
| "great quality" | 42% | 18% | 🔴 -24% |
| "perfect size" | 30% | 32% | 🟢 stable |
| ... | ... | ... | ... |

### 1-3★ Objections — Stable / Accelerating
| Theme | Prior % | Now % | Δ |
|-------|---------|-------|---|
| "broke after week" | 5% | 22% | 🔴 +17% NEW PATTERN |
| ... | ... | ... | ... |

## What Changed

🔴 Quality regression: "great quality" dropped 24 points; "broke after week" emerged. Investigate manufacturing / supplier change.

## Recommended Actions

- Pull recent 1-3★ verbatim — `review-velocity-monitor {ASIN}`
- If pattern confirms: trigger `objection-killer` for the new objection
- If quality is real (not perception): escalate beyond CRO scope — manufacturer issue

## Save Snapshot

Updated baseline saved for next-week diff.
```

## Reference Files

- `~/.claude/skills/cro/review-analysis.md`
- Companion skill: `review-velocity-monitor` (count/rating)

## Quality Bar

- [ ] Theme-level diff (not just count diff)
- [ ] Both directions checked (regression AND new objections)
- [ ] Action explicit per alert

## Auto-Triggers

- `/loop weekly review-sentiment-shift {ASIN}`
- After A/B test ends (did sentiment shift?)
