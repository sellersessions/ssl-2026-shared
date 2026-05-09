---
project: claude-ui-workflow
last_updated: 2026-04-25
role: operational-runbook
---

# Claude UI Workflow — Runbook

> Read [`PRD.md`](PRD.md) first for the goal. This runbook tells you **where each
> step physically runs today** and what's still being built.
> If something here disagrees with PRD.md, PRD.md wins.

---

## What this is

A workflow (not a single executable) that turns user intent + brand inputs into
premium design output, with an invisible guardrail layer enforcing UI/UX rules.
Claude Code orchestrates between local tools (CSV rule database, brand
profiles), MCP servers (Stitch, NB2, video-transcriber, 21st.dev), and the user.

There is **no `npm run pipeline`** — that was never the design. The list below
is the operational surface.

---

## What you can do today

| Step | Trigger | Where it runs | Input | Output |
|---|---|---|---|---|
| **DECIDE — design brief** | `/design <description>` | Claude Code skill | Free-text prompt + auto-detected brand slug | 9-section design brief in chat (loads `brands/<slug>/profile.md` if matched, else generic CSV mode across `design-db/`) |
| **REFINE — page audit** | `/refine <url>` | Claude Code skill | Live URL | 6-dim audit (refinements, animation, polish, performance, anti-patterns, HCI laws) + ready-to-paste prompt |
| **INSPIRATION — capture** | Paste video URL into Claude Code | `video-transcriber` MCP | YouTube / TikTok / Instagram URL | Markdown record under `records/` with transcript, timestamps, extracted entities |
| **DESIGN — Stitch** | Hand the design brief to Stitch web app, or `generate_screen_from_text` via Stitch MCP | External (Stitch) | Brief from DECIDE | Visual mockup (Stitch project ID) |
| **BUILD — components** | 21st.dev Magic MCP (component generation) | MCP | Stitch mockup + brand tokens | React components |

Anything not on this table is either deferred, retired, or reference material.

---

## Brand profiles (today)

`brands/<slug>/profile.md` is the canonical brand format. See `brands/_template/`
for the schema. Status per brand: see [`brands/INVENTORY.md`](brands/INVENTORY.md).

Only `sellersessions/` is fully populated. Others are stub or partial. New
brands today are hand-authored markdown — automated ingestion is queued for
post-SSL build (see below).

---

## What is being built (active now — curriculum-grade target)

In milestone order, each independently mergeable:

1. **`tokens.json` emit** — machine-readable export from `brands/<slug>/profile.md`. Unblocks 3 + 7 + 9.
2. **Brand ingestion (URL mode)** — given a website URL, derive a populated `profile.md` + `tokens.json` + `ingestion-confidence.md`. Reuses `extract-flow` (4-tier extraction stack).
3. **Brand ingestion (screenshot mode)** — same output, image input. Reuses NB2 / Gemini direct + the OCR pattern in `design-brand-reels-inspiration-extract/`.
4. **Brand ingestion (doc mode)** — same output, style-guide doc input.
5. **`/intake` skill** — guided interview (output type, audience, offer, CTA, vibe, constraints). Output feeds `/design`.
6. **Lock primitive** — `brands/<slug>/locks.json` defines fields the user has frozen (font, button style, palette). Read by `/design` and `/refine`.
7. **Reference-image reliability harness** — pin product image → generate via Stitch → automated visual diff. NB2 fallback when Stitch hallucinates.
8. **Auto-REFINE** — fire `/refine` on every generation, not just on demand.
9. **165-rule audit** — once enforcement is automated, surface dead rules. Collapse what doesn't fire.

See [`OUTSTANDING-WORK.md`](OUTSTANDING-WORK.md) for the active items list and
the recovery plan at `<your local plans dir>/claude-i-fed-some-fuzzy-quilt.md`.

---

## What was retired

- **tldraw moodboard (`tools/moodboard/`)** — worked technically (T1-T4 lifecycle tests passed 11-12 Apr), but added friction for non-designers. Replaced by brand ingestion + guided intake. Code stays in git history; folder moves to `_archive/` post-SSL.
- **Claude Design as default DESIGN surface** — Test A round-trip validated 19 Apr, but Stitch is friendlier for the target user. The bundle handoff pattern (signed URLs, tarball, README contract) is preserved as reusable IP for the brand-ingestion screenshot mode and any future web-app integration.
- Stale demo and reference content scheduled for `_archive/`: see [`_archive/ARCHIVE-MANIFEST.md`](_archive/ARCHIVE-MANIFEST.md) once the manifest is drafted.

---

## Where to read more

- [`PRD.md`](PRD.md) — north star, end-in-mind goal
- [`MASTER-LOG.md`](MASTER-LOG.md) — timeline + active session kickoff
- [`OUTSTANDING-WORK.md`](OUTSTANDING-WORK.md) — rolling work list
- [`DESIGN-PIPELINE-VISUAL.md`](DESIGN-PIPELINE-VISUAL.md) — architecture walkthrough (legacy 8-phase view; banner notes the 25 Apr pivot)
- [`README.md`](README.md) — public-facing intent + 165-rule catalogue
- [`design-system-sections/`](design-system-sections/) — ADRs and design notes
- [`reference/`](reference/) — background material (Stitch capabilities, Claude Design integration spec)

---

## How to contribute (the smallest possible path)

1. Read `PRD.md` (5 min).
2. Read this runbook (1 min).
3. Pick a milestone from "What is being built." Each milestone has its
   own acceptance criterion in the recovery plan.
4. Open a branch, single-purpose. Mergeable in isolation.
5. Update `MASTER-LOG.md` with a one-line entry; tick the matching item in
   `OUTSTANDING-WORK.md`.
