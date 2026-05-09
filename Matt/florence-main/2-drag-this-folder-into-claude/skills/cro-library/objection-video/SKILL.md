---
name: objection-video
description: Run a ProductPinion Pinion Video using the Objection Test template — shoppers view the listing and answer "would you buy this? why/why not?" out loud. Surfaces hidden objections that text-based reviews don't always reveal. Use when running `objection-video {ASIN}`, when CVR is below category average, or as a sub-step of `objection-killer`.
---

# objection-video — Recorded Shopper Objections

Pinion Videos record shoppers viewing your listing and answering questions out loud — including objections they'd never write in a review. The Objection Test template is purpose-built for this.

## Prerequisites

- ProductPinion MCP
- Live Amazon listing URL

## Invocation

```
objection-video {ASIN}
objection-video {ASIN} --shoppers=15        # 15-25 default; videos cost more credits
objection-video {ASIN} --questions="..."    # override default questions
```

## Output

`/tmp/cro-content/{ASIN}-objection-video-{date}.md` — transcripts, themes, action items.

## Phase 1 — Configure Pinion Test

Test type: **Pinion Videos → Any URL** with **Objection Test** pre-defined template.

Setup:
- URL: live Amazon listing (us / geo)
- Internal name: `{ASIN}-objections-{YYYY-MM-DD}`
- Questions (default Objection Test template):
  1. "Walk me through this listing — what catches your eye?"
  2. "What concerns or doubts do you have about this product?"
  3. "Would you buy it? Why or why not?"
- Sample: 15-25 shoppers (videos are higher cost than polls)
- Audience: research-brief

## Phase 2 — Wait

Pinion Video tests run longer than polls — typically 24-48 hours. Skill exits after submission, returns Pinion test URL, and instructs user to re-invoke when ready.

## Phase 3 — Analyze

Pull:
- Recorded videos
- Auto-generated transcripts
- Pinion's auto-summary (if available)

Decompose objections per `~/.claude/skills/cro/review-analysis.md` 8-layer framework:
- Aspect (what part of product)
- Sentiment + modifier
- Whether the listing already addresses it (is it visible / hidden?)
- Frequency across the 15-25 shoppers

## Phase 4 — Output

```markdown
# Objection Video — {ASIN}

**Sample:** {N} shoppers | **Date:** {date}

## Top Objections (ranked by frequency)

| Rank | Objection | % of shoppers | Listing currently addresses? | Recommended fix |
|------|-----------|----------------|-------------------------------|------------------|
| 1 | "Not sure if it's safe" | 60% (12/20) | ❌ | Slot 4 trust-signal image |
| 2 | "Looks small" | 45% | Partial — bullet only | Slot 3 scale comparison |
| ... | ... | ... | ... | ... |

## Verbatim Highlights (under 15 words each, in quotes)

> "{quote}" — {shopper-id}, {context}

## Patterns

- **Hidden objections** (not in reviews): {list — these are gold; reviews are post-purchase}
- **Confirmed objections** (also in reviews): {list — validation of mining}

## Recommended Next Skill

`objection-killer {ASIN}` — full pipeline: review-mine + this output → preempt-image generation → A+ FAQ refresh
```

## Reference Files

- ProductPinion docs — Pinion Videos + Objection Test template
- `~/.claude/skills/cro/review-analysis.md`
- Vault: `CRO-Knowledge-Base/01-research/review-mining.md`

## Quality Bar

- [ ] At least 15 shoppers (statistical floor for video tests)
- [ ] Objections ranked by frequency
- [ ] "Hidden vs confirmed" split — the hidden ones are the high-leverage finds
- [ ] Verbatim quotes under 15 words each

## Auto-Triggers

- `objection-killer` Phase 1
- User says "why aren't they buying" / "find hidden objections"
- After CVR drop investigation
