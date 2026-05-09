---
name: main-image-poll
description: Validate 2-5 Amazon main image variations with real shoppers via ProductPinion before paying for Manage Your Experiments. Runs an Image Split Test with target audience targeting, returns the winner plus the qualitative "why" from shoppers. Use when running `main-image-poll {ASIN}`, when you have main image candidates that need pre-MYE validation, or as a sub-step of `main-image-pipeline`.
---

# main-image-poll — Pre-MYE Main Image Validation

Insert real-shopper feedback **before** spending on Amazon Manage Your Experiments. ProductPinion's Image Split Test gives both winner-loser data and the qualitative "why" — the part MYE never tells you.

## Prerequisites

**ProductPinion MCP must be connected.** If not:
1. Settings → Connectors → Add Custom → URL `https://api.productpinion.com/mcp`
2. Advanced Settings → Client ID: `B5f2zdcwuw2tEsKZZrwWvEcXF1R94l9y`
3. Sign in. Resume.

## Invocation

```
main-image-poll {ASIN}                       # uses latest concepts from /tmp/cro-content/
main-image-poll {ASIN} --concepts=1,2,3      # specific concept numbers
main-image-poll {ASIN} --shoppers=200        # default 100; recommend 100 per option for 2 options
main-image-poll {ASIN} --audience={name}     # use a saved Custom Audience
```

## Output

Writes to `/tmp/cro-content/{ASIN}-main-poll-{date}.md`. Includes winner declaration, % preference, and the verbatim "why" reasoning grouped into themes.

## Phase 1 — Inputs

Required:
1. **2-5 image options** — file paths or URLs. Defaults to top 3 from latest `/tmp/cro-content/{ASIN}-main-concepts-*.md`
2. **Audience** — defaults to ProductPinion standard, narrowed by:
   - Sex / Age band / Country (geo) — pulled from research brief if available
   - Amazon shopper behavior: Frequent
   - Optional Advanced Targeting category from research brief (e.g. "Pet owners" / "Frequent Amazon shoppers")
3. **Question** — Pinion default: "Which would you most likely click on Amazon?" + auto-prompted "Why?"

## Phase 2 — Configure the Pinion Test

Test type: **Image Split Test** (Pinion Polls)

Setup per `productpinion-knowledge-base.md`:
- Internal name: `{ASIN}-main-{YYYY-MM-DD}` (so we can find it later)
- Question type: Image Split Test
- Options: 2-5 main image candidates
- Shoppers: default 100 per option (i.e. 200 for 2-option, 300 for 3-option, etc.)
- Standard Demographics: pulled from research brief
- Advanced Targeting: one category if signal warrants
- Exclude shoppers from previous polls: yes if `{ASIN}` has prior tests

## Phase 3 — Submit & Wait

Submit via ProductPinion MCP. Pinion typically completes in hours (not days). Skill exits after submission and gives user a wait estimate + the test URL inside ProductPinion.

For autonomous flow (auto mode): poll the test status. When complete, fetch results and proceed to Phase 4.

## Phase 4 — Analyze Results

Pull:
- **Quantitative:** % preference per option, statistical confidence (Pinion provides this)
- **Qualitative:** every shopper's "why" answer

Decompose the "why" answers into themes. Standard themes:

| Theme | What it tells you |
|-------|--------------------|
| Visual clarity | Could they tell what it is at a glance? (Top of funnel) |
| Trust / quality cue | Did the image feel premium / legit? |
| Stand-out factor | Did it pop vs surrounding options? |
| Demographic match | "Looks like it's for me" / "Not for me" |
| Curiosity hook | Did they want to click to learn more? |
| Confusion / doubt | Anything that triggered "what is this?" / "looks fake" |

Then write per-option summaries: "Option A won 62% — top reasons: clearer label legibility (28% mentioned), warmer/more premium feel (24%), color popped from grid (18%)."

## Phase 5 — Output File

```markdown
# Main Image Poll — {Title}

**ASIN:** {ASIN} | **Test ID:** {pinion-id} | **Date:** {date} | **Sample:** {N shoppers}

## Setup

- Audience: {description}
- Options: {N variations}
- Question: "Which would you most likely click on Amazon?" + Why

## Results

| Option | Image | % Preference | Confidence |
|--------|-------|--------------|------------|
| A | ![](concept-1) | {%} | {high/med/low} |
| B | ![](concept-2) | {%} | ... |

**Winner:** Option {X} at {%} preference (vs runner-up {Y} at {%}).

## Why — Qualitative Themes

### Why winner won
- Theme 1: {N% of voters mentioned} — example quote (under 15 words)
- Theme 2: {...}

### Why losers lost
- Theme A: {N% concern} — example
- Theme B: ...

### Surprising signal
{Anything unexpected — e.g. demographic shift, brand association, etc.}

## Recommended Action

✅ **Ship Option {X} to A/B test in MYE** — winner has {confidence} signal + clear "why" themes.

OR ⚠️ **Iterate before MYE** — winner is statistically significant but qualitative feedback flagged {issue}; recommend tweaking and re-polling before paying for MYE.

## Next Step

- If ready for MYE: launch via Amazon Manage Your Experiments
- If iterating: regenerate with `main-image-concepts` using the qualitative feedback as new constraints
```

## Reference Files

- ProductPinion Knowledge Base — Image Split Test setup
- `~/.claude/skills/cro/main-image-best-practices.md` — what "winning" should look like in practice
- Vault: `CRO-Knowledge-Base/05-testing/test-design-methodology.md`
- Vault: `CRO-Knowledge-Base/05-testing/interpreting-results.md`

## Quality Bar

- [ ] 2-5 distinct options (not 5 minor variations)
- [ ] Sample size ≥100 per option (Pinion recommendation)
- [ ] Audience targeted to actual buyer demographic (not generic shoppers)
- [ ] Qualitative "why" themes extracted, not just %
- [ ] Recommendation explicit: ship or iterate
- [ ] Test internal name follows `{ASIN}-main-{date}` pattern (findable later)

## Common Mistakes

- ❌ Polling 5 near-identical variations — Pinion needs distinct options for clear signal
- ❌ Using ProductPinion's default audience for a niche product (use Advanced Targeting)
- ❌ Treating Pinion as the final word — it's pre-MYE validation, not a replacement for MYE
- ❌ Skipping the "why" — that's the whole reason to use Pinion over A/B traffic data
- ❌ Not excluding prior poll respondents on the same ASIN — biases results

## Auto-Triggers

Runs (without prefix) when:
- User says "test these images with shoppers" / "validate before MYE"
- After `main-image-concepts` produces top-3
- `main-image-pipeline` calls it as a sub-step

## v0.1.12 — Read `brain.image_strategy` before generating

**Before drafting any Higgsfield prompt**, read `brain.image_strategy` from working memory:

- **If null** → pause and offer `image-strategy` first (~10 min, makes every future render bespoke). If user proceeds without, flag concept cards with "No category research used — generic aesthetic."
- **If set + fresh (<90d)** → inject `prompt_adjustments.scene_keywords` into prompt section 1, `palette_keywords` + `mood_keywords` into section 4, and `do NOT include {anti_patterns_csv}` near the end. Cite the strategy on each concept card.
- **If stale (>90d)** → flag and recommend `image-strategy --refresh`.

This brand-level strategy comes from `skills/image-strategy.md`'s top-15-bestsellers analysis. Same adjustments apply across every render for this brand.


## v0.1.13 — Visual verification gate + base64 embedding (NON-NEGOTIABLE)

**Florence does NOT present an image she hasn't actually looked at, AND she does NOT use raw Higgsfield URLs in artifact HTML.** Two blocking rules added in v0.1.13:

### Verification gate

After Higgsfield returns each generated image, BEFORE adding to any artifact OR sending to Pinion:

1. **Load the image into Florence's multimodal context** — paste the URL in chat so Cowork's multimodal Claude loads it natively. Narrate: *"Looking at #{N} before I include it."*
2. **Visually inspect** against: aspect ratio (1:1 main+listing / 16:9 A+), product fidelity vs reference, technique landed (visibly), background appropriate, no clipart leak (anti-clipart rules), no text-on-main-image (TOS), no model faces.
3. **If anything fails** → re-prompt with specific fix + regenerate. Cap at 3 attempts per concept; surface honestly on attempt 4.
4. **Only after ALL concepts pass** → proceed to artifact emission.

The eye trumps the score. Even if the rubric said 100/100, if visual inspection finds a wrong product or off-aspect output, it fails the gate.

### Base64 embedding

Higgsfield URLs are temporary AND Cowork's artifact iframe sandbox blocks external image loads in many builds. For every verified concept:

1. HTTP GET the Higgsfield URL → fetch image bytes
2. Detect MIME type from response headers (typically `image/png`)
3. Base64-encode the bytes
4. Substitute `{{image-src}}` (or `{{winner-image-src}}` for tests) with `data:image/png;base64,<encoded>` — NOT the raw Higgsfield URL

This makes the artifact self-contained — survives sandbox + URL expiry. ~1-3 MB per image is fine for Cowork.

The live product image (`{{product-image-url}}` in concepts.html hero strip / dossier head / cockpit product cards) stays as the live Amazon CDN URL — that's permanent and not affected.

