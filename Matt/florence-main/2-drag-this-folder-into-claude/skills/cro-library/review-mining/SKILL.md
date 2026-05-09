---
name: review-mining
description: Deep review extraction for an Amazon ASIN. Pulls multi-page reviews (1★/3★/5★ + recent verified) via SellerApp n8n MCP, then decomposes them into purchase drivers, objections, surprises, recurring questions, comparison mentions, and photo references — each tagged by frequency. Use when running `review-mining {ASIN}`, when an existing brief needs deeper review evidence, or when surfacing objections for a CVR-leak fix.
---

# review-mining — Claim-Level Review Decomposition

Reviews are the single most important CRO signal source. This skill pulls a wide-and-deep review sample, decomposes it using the 8-layer framework from `~/.claude/skills/cro/review-analysis.md`, and outputs structured insights ready to feed `/cro-content-plan`, `objection-killer`, or any image/copy planning skill.

## Invocation

```
review-mining {ASIN}
review-mining {ASIN} {marketplace}
review-mining {ASIN} --deep   # 5 pages per star bucket instead of 3
```

## Output

Writes to `/tmp/cro-research/{ASIN}-reviews-{date}.md` and opens.

## Tools Used

n8n MCP wrapper (workflow `9RmjDT107uXtrImf`). Tool prefix `mcp__f32016b6-7c77-45e2-b4a2-70195c5f2d2d__*`.

| Pull | Tool | Params |
|------|------|--------|
| Verified positive | `Get_Product_Reviews` | `rating=5`, `reviewer_type=verified_purchase`, pages 1-3 |
| Negative | `Get_Product_Reviews` | `rating=1`, pages 1-3 |
| Critical-but-buying | `Get_Product_Reviews` | `rating=3`, pages 1-2 |
| Nuanced | `Get_Product_Reviews` | `rating=4`, page 1 |
| Recency baseline | `Get_Product_Reviews` | `sort=recent`, page 1 |
| With media | `Get_Product_Reviews` | `media_type=multimedia`, page 1 (photo refs) |

## Phase 1 — Pull

Parallel batch where possible. Default = 3 pages per star bucket = ~30 reviews per bucket. `--deep` flag = 5 pages = ~50 per bucket.

Note: each review page costs 10 SellerApp tokens. Default mode = ~120 tokens per ASIN.

## Phase 2 — Decompose (8-layer framework from cro/review-analysis.md)

For every review, extract:

1. **Aspect** — what part of the product (taste, durability, sizing, packaging, instructions, etc.)
2. **Sentiment** — positive / negative / neutral (with negation handling)
3. **Driver vs Barrier** — does this push them to buy, or stop them?
4. **Modifier** — qualifier ("loud at first" / "small for the price")
5. **Conditional** — when does it apply? ("if you have small hands" / "for the price")
6. **Repurchase signal** — explicit ("would buy again") / implicit (gifting, replacing)
7. **Competitor mention** — did they compare to anyone?
8. **Photo evidence** — did they post a photo? What does it show (demographic / use context)?

## Phase 3 — Categorize Output

Aggregate decomposed claims into 6 buckets per `02-visual-content/listing-images.md` rules:

### A. Purchase Drivers (from 5★ + 4★)
Top 5-10 themes ranked by frequency. Each entry:
- Theme
- Frequency: `N/{total} reviews = X%`
- Tag: 🔴 `>30%` mandatory visual / 🟡 `10-30%` supporting / ⚪ `<10%` nice-to-have
- Quote (one short example, fewer than 15 words, in quotes)

### B. Objections (from 1-3★)
Top 5-10 themes. Same structure. Tag: 🔴 `>20% of negatives` preempt with image / 🟡 `<20%` address in A+ FAQ.

### C. Positive Surprises (from 5★)
Things customers love that nobody pitched. Untapped selling points → candidates for slot 7 or A+ hero.

### D. Recurring Questions / Confusions
Cross-cuts all star levels. "Wait, does it…?" / "I wasn't sure if…" → these are visual-FAQ candidates.

### E. Competitor Mentions
Compared to whom, on what dimension, who won. Builds the differentiation column for `competitor-sweep`.

### F. Photo Review Evidence
- Demographic distribution (age/gender/race/setting visible in customer photos)
- Use context (where they use it, when, with what)
- Defects shown (if any)
- This is the **ground truth** for "Right Demographic" rule — beats stock photo intuition.

## Phase 4 — Write Output File

```markdown
# Review Mining — {Title}

**ASIN:** {ASIN} | **Date:** {date} | **Sample size:** {N reviews across {breakdown}}

## Data Sources

| Bucket | Reviews pulled | Token cost |
|---|---|---|
| 5★ verified | {N} | 30 |
| 4★ | {N} | 10 |
| 3★ | {N} | 20 |
| 1★ | {N} | 30 |
| Recent | {N} | 10 |
| Media | {N} | 10 |
| **Total** | **{N}** | **~120** |

## A. Purchase Drivers
{table with theme, frequency, tag, quote}

## B. Objections
{table}

## C. Positive Surprises
{list}

## D. Recurring Questions
{list, each tagged: → image / → A+ FAQ / → bullet}

## E. Competitor Mentions
{table: competitor, dimension, who won, frequency}

## F. Photo Review Evidence
{demographic summary + use-context summary + 3-5 representative photo URLs}

## Slot Mapping (handoff to content planning)

| Driver / Objection | Slot recommendation | Image type |
|---|---|---|
| {Top driver} | Slot 2 | Benefit photography |
| {Top objection} | Slot 3 | Objection-handling visual |
| ... | ... | ... |

## Sentiment Trajectory

{Pull review_date from each — flag if recent reviews trend more negative; that's a regression signal}
```

## Reference Files

- `~/.claude/skills/cro/review-analysis.md` — full 8-layer framework + validation rules
- Vault: `CRO-Knowledge-Base/01-research/review-mining.md`
- Vault: `CRO-Knowledge-Base/MASTER-CRO-REFERENCE.md` §2 (Review Mining is signal #1 of 4)

## Quality Bar

- [ ] Sample includes all of: 1★, 3★, 5★, recent, media (no bucket missing)
- [ ] Every theme in A & B has a frequency count, not just a list
- [ ] Frequency tags applied (🔴 / 🟡 / ⚪)
- [ ] Quotes fewer than 15 words, in quotation marks (copyright)
- [ ] Slot mapping table is filled — this is the handoff to image planning
- [ ] Sentiment trajectory checked (regressed?)

## Common Mistakes (from review-analysis.md validation rules)

- ❌ Treating "loud at first but you get used to it" as pure negative — it's conditional
- ❌ Counting "doesn't have X" feature requests as objections to existing features
- ❌ Ignoring 5★ reviews because "they're all positive" — they have the purchase drivers
- ❌ Missing comparison mentions ("better than {Brand}") — these are gold for differentiation
- ❌ Not weighting verified purchases higher than non-verified

## Auto-Triggers

Runs (without prefix) when:
- User asks "what do reviews say about {ASIN}" / "mine reviews for X"
- A pipeline (`/cro-content-plan`, `objection-killer`, `cvr-leak-fix`) needs the data
- User uploads a review export and asks for analysis (skill switches to file-input mode)
