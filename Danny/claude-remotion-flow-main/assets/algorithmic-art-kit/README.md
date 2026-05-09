# Algorithmic Art Kit

Reference library of content-shape templates rendered against the locked Remotion Flow design system.

**Live:** https://algorithmic-art-templates.netlify.app
**Admin:** https://app.netlify.com/projects/algorithmic-art-templates
**Site ID:** `1cd093fa-5899-4f02-8009-ccd077e597bd`

## Contents

| Path | Purpose |
|------|---------|
| `index.html` | 3x3 reference gallery, deploys to Netlify root |
| `netlify.toml` | Headers + cache config |
| `previews/` | 10 standalone wrappers (full HTML docs, click-through targets from gallery) |
| `sources/` | Original Desktop-generated fragments + `template-02` original |
| `CATALOGUE.md` | Inventory + use-where matrix from the first Desktop generation pass |

## What's in the gallery

3x3 grid (top-left to bottom-right):

```
01 Node graph              10-Step Production timeline    03 Subway map
04 Dynamic wizard          05 Circuit board               06 Gantt timeline
07 Sankey ribbon           08 Card stack                  10 Pinball path
```

Template 02 (Three lanes converge) lives in `sources/` + `previews/` but is omitted from the grid (replaced by the 10-step Gantt instance per the 9 = 3x3 even-grid rule).

## Redeploy

From the repo root:

```bash
netlify deploy --prod \
  --dir=assets/algorithmic-art-kit \
  --site=1cd093fa-5899-4f02-8009-ccd077e597bd \
  --message="<change summary>"
```

## Design system

Tokens, motion library, spec-header pattern, anti-patterns: see `docs/README-DESIGN-SYSTEM.md` at the repo root.

The paste-ready design-system block (for re-running Claude Desktop generation) is captured in the master log Session 33 entry.
