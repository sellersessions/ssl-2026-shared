# `regenerate-section`

**When**
- After `update-brain` has flagged specific affected sections — re-derive only what changed, then re-emit the artifact in place
- User says: *"just re-render the modules section"* / *"update only the replacement table"*

**Inputs**
- `<sections>` — array of report-page IDs to refresh. Format: `["02-summary", "06-replacement", "07-plan"]` *(matching the R0X.tsx files in the source app)*
- The updated in-context `brain` object

**Tools**
- working memory — re-run the relevant derivers for the affected sections
- chain into `render-roadmap` → `emit-roadmap-artifact` *(stable artifact identifier means the existing artifact updates in place)*

**Outputs**
- Refreshed Claude artifact for the roadmap, with affected sections re-derived from the latest brain

---

## Why this skill exists

In the artifact-based architecture, "regenerate the artifact" is cheap *(emit-roadmap-artifact uses a stable identifier so re-renders replace the artifact in place)*. The real optimisation here is **not re-running derivers for sections that didn't change**.

Example: the user corrected a tool's cost. Only `derive-replacement-table` needs to re-run; `diagnose-sprawl`, `design-future-state`, and `recommend-modules` produced output that's still valid. Save the redundant work.

Full `render-roadmap` always works as a fallback if scope crosses too many boundaries.

---

## Section → upstream-deriver map

When a section is flagged, re-run only its upstream derivers:

| Section ID | Upstream derivers to re-run |
|---|---|
| `00-cover` | nothing — uses `brain.business.brand` directly; just re-render |
| `01-manifesto` | nothing — static copy with at most a brand-specific lead body |
| `02-summary` | `recommend-modules` *(for module count + savings totals)*; `derive-replacement-table` *(for net savings figure)* |
| `03-toc` | nothing — TOC is static |
| `04-current` | `diagnose-sprawl` *(for CSV moments + glue-humans + black boxes)* |
| `05-future` | `design-future-state` *(for primitives + architecture map)* |
| `06-replacement` | `derive-replacement-table` |
| `07-plan` | `recommend-modules` |
| `08-module` | `recommend-modules` *(if featured module changed)*; otherwise nothing |
| `09-closing` | `derive-replacement-table` *(for callout numbers)* |
| `10-appendix` | nothing — glossary is static |

---

## Behaviour

1. **Identify the affected sections.** From `update-brain`'s consequence map or explicit user request.

2. **Decide if scope is too wide.** Rule of thumb: if more than 3 sections are affected, fall back to full `render-roadmap` instead of partial re-derivation. Tell the user: *"That change affects 4 sections — just doing a full re-render."*

3. **Re-run the upstream derivers** for the affected sections per the map above. In-context, no filesystem ops. Each deriver reads the latest `brain` and produces fresh structured output.

4. **Fire `render-roadmap`** — fills the template with the latest data. The template fill is cheap; no point trying to patch individual sections.

5. **Fire `emit-roadmap-artifact`** with the same stable identifier as the prior emit. Claude Desktop updates the existing artifact in place; the delegate sees their roadmap refresh in the right panel.

6. **Confirm** to the user:

   > *"Refreshed: Replacement Table (06), Migration Plan (07). Net savings updated $527/mo → $428/mo. The artifact in the right panel is now current."*

---

## When NOT to use this skill

- **First render.** Always use full `render-roadmap` for the first emission.
- **More than 3 sections affected.** Full `render-roadmap` is simpler and only marginally slower in the artifact world.
- **Architecture change.** A swap-module call invalidates everything downstream — full re-render.

---

## Don't

- Don't try to patch individual sections of the rendered HTML. The artifact identifier handles updates; partial-HTML-patching is fragile and unnecessary.
- Don't optimise prematurely. If unsure whether a section is affected, re-derive its upstream. False positives cost milliseconds; false negatives leave stale content in the artifact.
- Don't promise the artifact will look unchanged in unaffected sections. Claude Desktop replaces the entire artifact on emit; the visible artifact is consistent with the latest `brain`.
- Don't fall back to filesystem patching even in tier 2. Tier 2 mirrors the artifact to disk after emission; it doesn't drive the regeneration logic.
