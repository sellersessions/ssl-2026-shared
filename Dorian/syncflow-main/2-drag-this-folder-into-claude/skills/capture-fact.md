# `capture-fact`

**When**
- Inside `run-interview` after the user gives an answer that contains a capture-able fact
- After a brain edit by the user that needs structuring

**Inputs**
- `<section>` — `business` / `team` / `stack` / `goals`
- `<key>` — the fact's key (e.g. `monthly_revenue_band`, `helium10`, `bottleneck`)
- `<value>` — the fact's value (e.g. `$500k–2M`, `$179/mo`, `Mondays 3hr Helium 10 → SellerApp merge`)
- `<tone>` — optional: `rented` / `owned` / `csv-moment` / `glue-human` / `keep` / `unknown` / `corrected`

**Tools**
- working memory — update the in-context `brain` object
- *(power-user tier 2 only)* if filesystem MCP is configured AND the user opted in, also append to `output/<brand>/brain/<section>.md` on disk

**Outputs**
- in-context `brain.sections.<section>` updated with the new entry
- `brain.transcript` appended with the captured fact
- `brain.fact_count` incremented
- `brain.last_updated_at` refreshed
- *(tier 2 only)* same fact appended to disk MD

---

## Reply-parsing rules *(option-set replies)*

Most interview questions now ship with a numbered option set *(see `run-interview.md` → "Question presentation rule")*. Before capturing, parse the reply:

| Reply pattern | Parsing |
|---|---|
| `2` | Single-select: capture the value at index 02 of the active option set |
| `1,3,5` or `1, 3, 5` | Multi-select: capture values at indexes 01, 03, 05 |
| `99` | Custom escape: respond with *"Go ahead — write it in your own words"* and capture the next message verbatim |
| `99: we use SellerApp` | Inline custom: capture the text after the colon as a free-text addition |
| `2 and we also use SellerApp` | Mixed: capture option 02 + the free-text addition as a separate entry |
| `2 + we tried Quartile but dropped it` | Same as above — capture both, tone-tag the dropped one as `[corrected]` |
| `none` / `n/a` / `nothing` | Capture null for the category — `[unknown]` tone |
| any non-numeric text | Free-text path — capture the whole reply verbatim, no parsing |
| out-of-range digit *(e.g. `15` when only 8 options)* | Don't capture; respond *"just a number from the list, or `99` to write your own"* |
| `0` | Same — out of range *(options start at 01)* |

Active option set context: when `run-interview` presents a question with options, hold the option set in working memory until the next reply comes in. After capture, discard it — the next batch presents its own.

When a reply combines options + custom text *(`2 and we also use X`)*, capture **both**. The option-driven entry gets `[rented]` or whatever default tone the option carries; the custom-text entry gets the same default tone unless it's clearly different *(e.g. *"we tried X but dropped it"* → `[corrected]`)*.

---

## Behaviour

1. **Inspect the in-context brain** for an existing entry with the same `<key>` in `<section>`:
   - If the value is identical → no-op, don't double-capture.
   - If the value differs → mark the old entry as `[superseded]` and append the new one with `[corrected]` tone. Preserve history.

2. **Update the brain object** in your working memory. The shape varies by section — see "Section structures" below. Some sections store key→value maps; others store arrays of typed objects.

3. **Append to `brain.transcript`** with timestamp + section/key:
   ```
   { ts: <ISO>, kind: "capture", section: <section>, key: <key>, value: <value>, tone: <tone or null> }
   ```

4. **Bump counters** — increment `fact_count`; refresh `last_updated_at`.

5. **(Tier 2 only)** If filesystem MCP is on AND user opted in, also append the fact to `output/<brand>/brain/<section>.md` in the format below. The on-disk MD is a mirror of the in-memory brain; it never disagrees.

   ```
   - <key>: <value> [<tone>]
   ```

6. **Stay silent.** Capture is invisible to the user. The next thing they see is the next interview probe or batch question.

---

## Section structures (in-memory shape)

### `brain.sections.business`

Flat key→value map:
```
business: {
  brand, category, years_in_business, market_position,
  monthly_revenue_band, channels, sku_count, top3_concentration,
  model, growth_posture, launch_cadence
}
```

### `brain.sections.team`

Mostly flat, with `roles` as an array:
```
team: {
  headcount, roles: [{ name, role, main_outputs }],
  outsourced_functions, tool_fluency,
  imminent_hires, clockify_data,
  bottleneck, failure_mode
}
```

### `brain.sections.stack`

Multiple typed arrays — every list-style section is an array of objects:
```
stack: {
  tools: [{ name, cost, tone }],            // paid SaaS
  ai_tools: [{ name, use, output_destination }],
  custom_tools: [{ name, description, cadence, owner }],
  data_sources: [{ source, connection_state }],
  reporting_cadence: [{ report, cadence, owner }],
  csv_moments: [{ flow, hours_per_week, owner, tone: "csv-moment" }],
  glue_humans: [{ flow, hours_per_week, owner, tone: "glue-human" }],
  pm_tool, comms_tool
}
```

### `brain.sections.goals`

Flat:
```
goals: {
  vision_12_month, founder_involvement,
  single_biggest_bottleneck, magic_wand_automation, why_not_yet
}
```

---

## Tone tags — when to apply

| Tag | Meaning |
|---|---|
| `[rented]` | A subscription. Vendor-controlled. Compounds against you. |
| `[owned]` | Software they control end-to-end. They decide schema, behaviour, price. |
| `[keep]` | Tool stays in the future-state architecture. |
| `[csv-moment]` | Manual export-edit-import ritual. Visible tax of sprawl. |
| `[glue-human]` | A person paid to copy data between tools that don't talk. |
| `[unknown]` | Captured as a placeholder; user didn't have an answer. |
| `[corrected]` | Replaces a previously-captured fact (the old one gets `[superseded]`). |

If no tone is obvious, omit it.

---

## Don't

- Don't capture verbatim quotes as keys. Keys are slugified concepts; values can be quotes.
- Don't capture multi-fact answers as one entry. Split them. *"We use Helium 10 ($179/mo) and SellerApp ($99/mo)"* → two captures, one per tool — both go into `brain.sections.stack.tools` as separate array entries.
- Don't write to a section that doesn't exist yet — `init-brain` creates the in-memory structure; `capture-fact` only appends.
- Don't tell the user *"captured"* / *"got it"*. Silent.
- Don't capture facts the user explicitly retracted (*"forget what I said about..."*) — instead, mark the existing entry with `[retracted]` tone.
- Don't assume tier 2 (filesystem MCP) is on. Default flow updates the in-memory brain only.
