---
project: claude-ui-workflow
role: ingestion-confidence
slug: databrill-core-extracted
generated_at: 2026-04-26
source_url: https://core.databrill.com
---

# Ingestion confidence — `databrill-core-extracted`

Per-field source + confidence for the derived `tokens.json`. Review
anything marked `low` before locking the brand profile.

| Field | Value | Source | Confidence | Action |
|---|---|---|---|---|
| `identity.name` | `DataBrill` | og:title or <title> | medium | review on a screenshot |
| `identity.domain` | `core.databrill.com` | location.hostname | high | — |
| `theme.mode` | `light` | area-weighted majority | high | — |
| `colors.background` | `#f8f7fc` | body computed bg | high | — |
| `colors.primary` | `#f4f2f9` | first non-white section bg | medium | review on a screenshot |
| `colors.cta` | `#e07a3a` | primary button bg | high | — |
| `colors.secondary` | `#e07a3a` | second section bg | medium | review on a screenshot |
| `colors.text` | `#3d3852` | most common body text colour (excl. links) | high | — |
| `colors.text_secondary` | `#1a1726` | lightest non-white body text colour | medium | review on a screenshot |
| `colors.border` | `#dbd7e5` | most common rendered border colour | medium | review on a screenshot |
| `decorative_palette` | `(empty)` | saturated container bgs distinct from core palette | low | **confirm**: drop a Shottr full-page screenshot |
| `texture` | `gradient` | bg_image_signal heuristic | low | **confirm**: drop a Shottr full-page screenshot |
| `line_work` | `none` | stub — not derivable from URL | low | **confirm**: drop a Shottr full-page screenshot |
| `photography_direction` | `(empty)` | stub — not derivable from URL | low | **confirm**: drop a Shottr full-page screenshot |
| `typography.headings` | `Ubuntu Sans` | h1-h3 dominant font | high | — |
| `typography.body` | `Ubuntu Sans` | p/li dominant non-system font | high | — |
| `typography.buttons` | `Ubuntu Sans` | primary button computed font | high | — |

## Screenshot assist

If any row above is `low` confidence (typically primary brand wash on
light themes, or secondary palette colours), capture a Shottr full-page
of the homepage (`Ctrl+1` for full, `Ctrl+2` for area) and save under
`brands/databrill-core-extracted/_captures/`. The brand-ingest screenshot mode (B4) will
sample colours at fixed regions (nav strip, hero, primary button) to
disambiguate role assignments that the URL pass got wrong.

## Screenshot Overrides

Applied 2026-04-26 from `live-site-reference-2026-04-26.png`.

| Field | URL value | Screenshot value | Was | Now |
|---|---|---|---|---|
| `theme.mode` | `light` | `dark` | high | high |
| `colors.primary` | `#f4f2f9` | `#686353` | medium | high |
| `colors.secondary` | `#e07a3a` | `#ef853f` | medium | high |
| `colors.text_secondary` | `#1a1726` | `#000006` | medium | high |
