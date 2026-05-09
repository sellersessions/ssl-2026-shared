# Stage Command — claude-ui-workflow (Block C1)

## Primary demo (it's a workflow surface, not an executable)

There is no `npm run pipeline`. Walk the repo as a tour:

```bash
cd Claude-UI-Workflow/
ls
```

Open in this order:

1. `PRD.md` — north star
2. `RUNBOOK.md` — what works today
3. `PRE-CHECK-CHECKLISTS.md` — 10-stage canonical
4. `DESIGN-PIPELINE-VISUAL.md` — Mermaid + 15 CSV catalogue
5. `brands/` — one folder per brand
6. `design-db/` — 15 CSV databases (165+ rules)

## Optional live demo (brand ingestion)

```bash
npm install                                                          # one-off
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # one-off

python3 scripts/ingest-url.py https://example.com --slug example-derived
```

Writes `brands/example-derived/{tokens.json, profile.md, ingestion-confidence.md}`.

## Notes for stage

- Validated: `python3 scripts/ingest-url.py --help` returns clean usage.
- This repo HIDES complexity — the demo is the docs and CSVs, not a running command.
- If audience asks "what does it actually do?", point at `dogfood/` for per-cycle friction logs and captures.
