---
project: claude-ui-workflow
role: ingestion-confidence
slug: retechuk
generated_at: 2026-04-26
source_url: https://retechuk.com
---

# Ingestion confidence — `retechuk`

Per-field source + confidence for the derived `tokens.json`. Review
anything marked `low` before locking the brand profile.

| Field | Value | Source | Confidence | Action |
|---|---|---|---|---|
| `identity.name` | `Re Tech UK` | og:site_name | high | — |
| `identity.domain` | `retechuk.com` | location.hostname | high | — |
| `theme.mode` | `dark` | body bg luminance | high | — |
| `colors.primary` | `#308900` | primary button bg (dark theme heuristic) | high | — |
| `colors.cta` | `#308900` | primary button bg | high | — |
| `colors.secondary` | `#fafafa` | second section bg | medium | review on a screenshot |
| `colors.text` | `#1f1f1f` | most common body text colour (excl. links) | high | — |
| `colors.card_bg` | `#e0e0e0` | most common container background distinct from body | medium | review on a screenshot |
| `colors.border` | `#313131` | most common rendered border colour | medium | review on a screenshot |
| `typography.headings` | `Montserrat` | h1-h3 dominant font | high | — |
| `typography.body` | `Montserrat` | p/li dominant non-system font | high | — |
| `typography.buttons` | `Montserrat` | primary button computed font | high | — |
| `typography.google_fonts_url` | `https://fonts.googleapis.com/css?family=Montserrat` | <link> stylesheet | high | — |

## Screenshot assist

If any row above is `low` confidence (typically primary brand wash on
light themes, or secondary palette colours), capture a Shottr full-page
of the homepage (`Ctrl+1` for full, `Ctrl+2` for area) and save under
`brands/retechuk/_captures/`. The brand-ingest screenshot mode (B4) will
sample colours at fixed regions (nav strip, hero, primary button) to
disambiguate role assignments that the URL pass got wrong.
