---
stage: 4 (tokens validate / reconcile)
brand: databrill-core
generated: 2026-04-26
---

# Stage 4 — Token reconciliation: extracted (live) vs canonical (intent)

| Token | Extracted (Ellis deploy) | Canonical (intent) | Winner | Why |
|---|---|---|---|---|
| `theme.mode` | dark (after Stage 3 fix) | dark | ✅ both agree | — |
| `colors.background` | `#f8f7fc` (light hero band misread) | `#0c0a14` (dark deep bg) | **canonical** | Live deploy's hero band is a feature, not the brand bg |
| `colors.primary` | `#686353` (image placeholder misread, finding #32) | `#100e1a` (bg surface) | **canonical** | Extracted value is broken-image artefact |
| `colors.cta` | `#e07a3a` ✅ | `#e07a3a` ✅ | ✅ both agree | Brand orange — confirmed |
| `colors.secondary` | `#ef853f` (warmer orange variant) | `#7c6bbd` (purple) | **canonical** | Live deploy doesn't ship purple yet — pulling it forward from canonical |
| `colors.text` | `#3d3852` | `#f5f5fa` (white-ish for dark mode) | **canonical** | Live deploy hero text is dark on light band; brand text-on-dark is white |
| `typography.headings` | Ubuntu Sans | Inter | **canonical** | Ellis deploy uses Ubuntu Sans; canonical specifies Inter for headings |
| `typography.body` | Ubuntu Sans | DM Sans | **canonical** | Same — Ellis hasn't aligned the typeface stack to canonical yet |
| `typography.display` | (not extracted) | Space Grotesk | **canonical** | For logo/display lockups |

## Conclusion

**Cycle-2 brief uses the canonical token set verbatim from `brands/databrill-core/tokens.json`.**

The extracted profile served its purpose: it confirmed the brand orange `#e07a3a` is correctly deployed, and it exposed three workflow findings (#30/#31/#32) about how the extraction handles partial/in-progress deploys.

**Net delta from canonical:** zero — the canonical wins on all contested fields. The live deploy is a partial subset; we're generating the full design.
