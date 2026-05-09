# Section 07b — tldraw moodboard: what we built instead of Stitch

**Status:** Shipped (11 Apr 2026), persistence validated (12 Apr 2026)
**Created:** 2026-04-12
**Replaces:** Section 07 (Stitch as moodboard — failed at sub-test 1)
**Implements:** Gap #8 from Section 06 (moodboard layer between inspiration capture and DECIDE)
**Source code:** `tools/moodboard/`

---

## Why Stitch didn't work (§07 recap)

Section 07 proposed using Stitch's infinity canvas as the moodboard layer. It failed at the first sub-test: Stitch's model is "upload reference + prompt → generate output". You can't pin arbitrary images onto the canvas as a passive moodboard surface. The canvas holds generated screens, not reference images. the operator confirmed in ~30 seconds — no hands-on run needed.

**Stitch stays in its lane:** DESIGN phase (Workflow A), ref-anchored generation. Moodboarding is a separate layer.

---

## What §06 asked for

Section 06 identified the gap: our pipeline goes from inspiration capture (video transcripts only) straight to DECIDE (CSV-driven brief). There's no intermediate stage where visual references get collected, fingerprinted, and summarised into a corpus the brief can reference.

The proposed solution was `pipeline/moodboard.py` — a Python script chaining gallery-dl capture → DesignLoop Photo Brain fingerprinting → `moodboard.md` output.

---

## What we built instead

A local tldraw canvas with a two-way CLI bridge. The tool gives both the operator (manual drag-and-drop) and Claude (programmatic CLI commands) access to the same persistent canvas.

### Architecture

```
┌─────────────┐     SSE      ┌──────────────┐     HTTP     ┌────────────┐
│  mb.ts CLI  │ ──POST──────>│  server.ts   │ ──broadcast─>│  Browser   │
│             │              │  (port 5274) │              │  (tldraw)  │
└─────────────┘              └──────┬───────┘              └─────┬──────┘
                                    │                            │
                              save/load                    auto-save
                                    │                      (750ms throttle)
                                    v                            │
                             brands/<slug>/                      │
                               moodboard.tldr  <─────────────────┘
```

### What it does

- **Manual moodboarding:** the operator drags images onto the canvas, arranges them, adds annotations
- **Programmatic placement:** Claude fires shapes via `mb.ts` CLI — rectangles, text labels, sticky notes, arrows, grids
- **Persistence:** Auto-saves to `.tldr` on every change (user or programmatic), survives browser restart
- **Per-brand:** Each brand gets its own canvas at `brands/<slug>/moodboard.tldr`
- **Export:** PNG snapshot + markdown summary via the "Export snapshot" button

### What it doesn't do (scope boundaries)

- **Not a fingerprinting engine.** DesignLoop Photo Brain handles that separately. The moodboard is the collection surface, not the analysis layer.
- **Not a generation tool.** Stitch handles generation. This is for references and composition planning.
- **Not multi-user.** Single browser tab per brand. Multiple tabs cause duplicate delivery (fixed 12 Apr with `beforeunload` cleanup + dead subscriber pruning).
- **No cloud sync.** Everything is local files. The `.tldr` file is the source of truth.

---

## How it fits the 8-phase pipeline

```
INSPIRATION → MEMORY → DECIDE → MOODBOARD → ASSETS → DESIGN → BUILD → REFINE
                                     ▲
                                     │
                              this tool lives here
```

The moodboard phase sits between DECIDE (which produces a CSV-driven brief) and ASSETS (which produces the actual images). In practice, moodboarding can happen before or alongside DECIDE — the brief references what's on the canvas, and the canvas collects what the brief points toward.

---

## Brand folder shape

The 11 Apr migration moved brands from flat `.md` files to subfolders:

```
brands/<slug>/
├── profile.md              # Brand identity (operational layer)
├── moodboard.tldr          # tldraw canvas snapshot (this tool)
├── moodboard-assets/       # Uploaded images
├── moodboard-snapshot.png  # Last PNG export
└── moodboard-summary.md    # Last markdown export
```

The `_template/` folder provides the starting shape for new brands.

---

## Key decisions

| Decision | Rationale |
|---|---|
| tldraw over Excalidraw | tldraw has a richer shape API, programmatic `createShape`, and a proper store with snapshot/restore. Excalidraw's API is more limited for external control. |
| Local Node server over file watcher | SSE gives instant two-way flow. A file watcher would need polling and wouldn't support live broadcast to the canvas. |
| `.tldr` JSON over database | One file per brand, human-readable, git-trackable, no dependencies. |
| 750ms throttle on auto-save | Balances responsiveness with disk I/O. Fast enough that closing a tab after arranging shapes won't lose work. |
| `beforeunload` SSE cleanup | Prevents stale tabs from receiving duplicate commands. Server-side dead subscriber pruning as belt-and-suspenders. |

---

## Related files

- `tools/moodboard/README.md` — install, run, CLI usage, troubleshooting
- `design-system-sections/06-moodboard-layer-and-killing-endless-browsing.md` — the gap analysis that motivated this build
- `design-system-sections/07-stitch-infinity-canvas-as-moodboard.md` — the Stitch evaluation that failed
- `design-system-sections/07-TEST-RESULTS.md` — Stitch sub-test results
- `OUTSTANDING-WORK.md` — remaining work tracker
