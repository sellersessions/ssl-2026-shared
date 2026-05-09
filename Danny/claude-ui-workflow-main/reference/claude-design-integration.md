---
project: claude-ui-workflow
doc: claude-design-integration
created: 2026-04-17
source: browser review (Comet, CDP 9222) of https://claude.ai/design + https://www.anthropic.com/news/claude-design-anthropic-labs
captures: Claude-UI-Workflow/_captures/claude-design-review/
---

# Claude Design — Integration Spec

> How Anthropic Labs' Claude Design (launched 17 Apr 2026) slots into our 8-phase
> Claude UI Workflow pipeline, with Claude Code staying as the centralised system
> via the **Handoff to Claude Code** bundle.

## WHY

Claude Design is the first Anthropic-native design surface. It overlaps with our
DESIGN phase (currently Stitch-first) and our INSPIRATION phase (currently
ExtractFlow + video transcriber). The new capability — a signed bundle URL that
Claude Code can fetch and implement from — finally makes browser-based design
work **deterministic to pull back into the repo**, which was the missing link in
our Stitch flow (Stitch exports are ZIP + copy-paste HTML, no stable URL).

## WHAT — observed in browser

### Access

- Research preview, Opus 4.7. Available on Claude Max (the operator's plan confirmed).
- URL: `https://claude.ai/design` — also reachable via sidebar "Design" entry
  (new first-class sidebar item, sibling to Projects / Artifacts / Code).

### Home surface (`/design`)

| Area | Items |
|---|---|
| Left panel — "New prototype" | Tabs: **Prototype / Slide deck / From template / Other**. Project name field. Fidelity toggle: **Wireframe** (rough) vs **High fidelity** (polished with real brand assets). "+ Create" button. |
| Left panel — design system card | "Create a design system so anyone can create good-looking designs and assets." → "Set up design system". |
| Right panel — tabs | **Recent / Your designs / Examples / Design systems**. Search field top-right. |
| Sharing default | "Anyone in <org> with the link can see your project by default." |

### Design system setup (`/design/p/<id>?setup=design-system`)

Inputs (the exact slots Claude will use to ground future outputs):

1. **Company name and blurb** — free text.
2. **Link code on GitHub** — `https://github.com/owner/repo` + [Add].
3. **Link code from your computer** — folder drag/drop. Note: "This doesn't
   upload the whole codebase; Claude will copy selected files. For large
   codebases, we recommend attaching a frontend-focused subfolder."
4. **Upload a .fig file** — "Parsed locally in your browser — never uploaded."
5. **Add fonts, logos and assets** — arbitrary files.
6. **Any other notes** — free text (brand voice, palette, etc.).

Right header button: **"Continue to generation"**.

### Project workspace (`/design/p/<id>`)

Two-pane layout:

- **Left (Context + Chat):** "Start with context" with 4 context buttons:
  - Design System
  - Add screenshot
  - Attach codebase
  - Drag in a Figma file
  Bottom: prompt textbox + attach + **Send**. Tabs at top: Chat / Comments / +.

- **Right (Design Files canvas):** Empty-state "Creations will appear here".
  Controls: + New sketch, + Paste, drop zone footer reading
  "Images, docs, references, Figma links, or folders — Claude will use them as context."

- **Top-right buttons:** `Share` | `Export`.

### Share menu

- Name, Access dropdown ("Teammates can comment" default), Copy link.
- **Duplicate project** / **Duplicate as template** (this is how org templates
  are created — confirmed the "Share menu → File type" hint on the Design
  systems tab).

### Export menu — **the handoff surface**

```
↓  Download project as .zip
📄 Export as PDF
📄 Export as PPTX…
📄 Send to Canva…
📄 Export as standalone HTML
📄 Handoff to Claude Code…     ← centralisation anchor
```

### Handoff-to-Claude-Code dialog

Title: **"Send to local coding agent"**.

The dialog shows a copy-ready command aimed at Claude Code (terminal-styled block
labelled "Claude Code"):

```
> Fetch this design file, read its readme, and implement the
  relevant aspects of the design.
  https://api.anthropic.com/v1/design/h/<signed-hash>

  Implement: <user-provided detail, optional>
```

- **[Copy command]** button.
- Option: **Download zip instead** (fallback — drop bundle into Claude Code chat manually).
- Free-text field: "Give the agent more detail on what to implement (optional)".

**This is the centralisation primitive.** The signed `/v1/design/h/<hash>` URL
serves a bundle that Claude Code can fetch on its own; the bundle is promised to
include the design file **plus a readme** describing what to implement.

## HOW — where it slots into the 8-phase pipeline

```
┌──────────────────────────────────────────────────────────────────────┐
│                  CLAUDE UI WORKFLOW — UPDATED PIPELINE                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  INSPIRATION  ──▶  MEMORY  ──▶  DECIDE  ──▶  MOODBOARD               │
│  (ExtractFlow,       (memory,    (design-db,  (tldraw tool           │
│   video-MCP,         brand       brief          :5273/:5274)         │
│   Claude Design      profiles,   output,                             │
│   web-capture†)      MEMORY.md)  9 sections)                         │
│                                                                      │
│         ──▶  ASSETS  ──▶  DESIGN  ──▶  BUILD  ──▶  REFINE  ──┐       │
│              (Nano-       (**Claude   (21st.dev,  (6 dims:   │       │
│              Banana2,      Design**   shadcn,     refinements,│      │
│              Ellis         + Stitch   UI/UX       animation,  │      │
│              Presshot      + hand-    Pro Max,    polish,     │      │
│              template)     off        quality     perf, anti- │      │
│                            bundle)    gates)      patterns,   │      │
│                                                   hci-laws)   │      │
│                                                               │      │
│              ◀───────────────── loop back ───────────────────┘       │
│                                                                      │
│  † = new additions this session                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Slot A — DESIGN phase (primary integration)

| | Stitch (current) | Claude Design (new) |
|---|---|---|
| Input | Free prompt; screenshots; existing Stitch project ID | Free prompt; screenshot; **codebase (GitHub or folder)**; `.fig`; design system |
| Brand grounding | Weak — via prompt text | **Strong** — design system object, codebase analysis, font/logo ingestion |
| Model | Gemini lineage | Opus 4.7 |
| Export | ZIP, copy HTML | ZIP, PDF, PPTX, Canva, standalone HTML, **Handoff URL** |
| Determinism into Claude Code | Manual paste | **Signed bundle URL → `WebFetch` in Claude Code** |
| Canvas fidelity | 2D web-only | Web + code-powered prototypes (voice, video, shaders, 3D) |
| Collab | None (single user) | Org-scoped, comments, templates |

**Recommendation:** make Claude Design the **default** DESIGN surface for any
project that already has a codebase or design system we want respected (SS
design system, Databrill-Core, SSL 2026, DesignLoop). Keep Stitch for
greenfield/jam work with no brand constraints.

### Slot B — INSPIRATION phase (secondary)

Claude Design's built-in **web capture** overlaps with ExtractFlow. We have not
confirmed whether it pulls tokens or just imagery — **needs a side-by-side test
post-SSL**. Until then, keep ExtractFlow as the T1→T3 default and treat Claude
Design web capture as a consumer-grade convenience, not a replacement.

### Slot C — MOODBOARD phase (no change)

Our tldraw tool (`tools/moodboard/`) stays. Claude Design has no pin-board canvas
— its canvas is an output surface, not a collage tool. Moodboard remains the
pre-DESIGN alignment layer.

## Control-from-Claude-Code loop

```
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │   Claude Code (centralised) ──┐                             │
  │         ▲                     │                             │
  │         │                     ▼                             │
  │   ┌─────┴─────┐        ┌──────────────┐                     │
  │   │  handoff  │◀───────│ Claude Design│                     │
  │   │  bundle   │        │  (browser)   │                     │
  │   │  URL fetch│        │  Opus 4.7    │                     │
  │   └─────┬─────┘        └──────┬───────┘                     │
  │         │                     │                             │
  │         │                     │ Design system,              │
  │         │                     │ codebase, .fig,             │
  │         │                     │ screenshots                 │
  │         │                     │                             │
  │         ▼                     │                             │
  │   BUILD (21st.dev,            │                             │
  │   UI/UX Pro Max,              │                             │
  │   quality gates)  ◀───────────┘                             │
  │         │                                                   │
  │         ▼                                                   │
  │   REFINE (6 CSV dimensions, loop)                           │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
```

Concrete flow for a SS 2026 landing revision:

1. the operator opens Claude Design in Comet.
2. Attaches SS design system (GitHub link → `sellersessions/sellersessions-design-system`)
   plus SSLive2026 screenshot plus brand notes.
3. Iterates on canvas, uses sliders for polish.
4. Clicks **Export → Handoff to Claude Code**.
5. Fills "what to implement" with the scope (e.g. *"Apply the new pricing layout
   to the ticket section, keep the rest"*).
6. Copies command, pastes into Claude Code here.
7. Claude Code does `WebFetch` on the signed URL, reads bundle + readme, runs
   BUILD + REFINE + quality gates (Emil / Vercel / React Best Practices /
   Composition Patterns) against our CSVs.
8. Commits diff, opens PR, loops back to the operator in Comet for comments.

## Keep / retire / gate

| Capability | Current tool | Claude Design | Decision |
|---|---|---|---|
| Prompt → visual jam | Stitch | ✓ | **Keep both.** Stitch for greenfield, Claude Design for branded. |
| Codebase-aware output | — | ✓ | **Adopt.** Claude Design wins. |
| `.fig` ingest | — (manual) | ✓ (browser-local) | **Adopt.** |
| Moodboard canvas | tldraw tool | — | **Keep ours.** Claude Design has no pin board. |
| Brand profile (tokens) | `brands/<slug>/profile.md` | Claude Design system object | **Dual-track.** Our markdown is source of truth; mirror into Claude Design system per project. |
| Inspiration web-capture | ExtractFlow (4-tier) | Claude Design web capture | **Test post-SSL,** keep ExtractFlow default until then. |
| Handoff to code | Stitch ZIP + paste; ExtractFlow scripts | **Signed URL bundle** | **Adopt.** This is the anchor. |
| Export to PPTX / Canva | `slides-creator` skill, manual | ✓ | **Adopt as convenience.** Our slides-creator stays for Notion-styled decks. |
| Shader / 3D / voice prototypes | — | ✓ | **Adopt.** Fills a genuine gap. |
| Quality gates (Emil, Vercel, perf) | BUILD sub-step (local) | — | **Keep ours.** Run after handoff bundle lands. |
| REFINE (6 CSV dimensions) | Workflow E | — | **Keep ours.** Claude Design has sliders but no rules DB. |

## Pre-SSL discovery (now → 9 May 2026)

Low-cost, non-blocking steps so we're ready day-one post-SSL without burning
focus on it now.

- [ ] Create **one** design system in Claude Design pointed at
  `sellersessions/sellersessions-design-system` (GitHub link mode). Record what
  tokens it picks up vs our `brands/sellersessions/profile.md`. Capture diff.
- [ ] Run a throwaway generation (existing SSLive2026 page as screenshot
  context), use **Handoff to Claude Code**, verify the signed URL responds and
  returns a bundle we can parse.
- [ ] Document the bundle format (files, readme shape) in
  `Claude-UI-Workflow/reference/claude-design-handoff-bundle.md` (new, post-test).
- [ ] Add a `claude-design` row to each brand's `profile.md` recording the
  Claude Design system ID for that brand.

## Post-SSL adoption (after 9 May 2026)

Sequenced so we don't thrash the pipeline before the event.

1. **Promote Claude Design to default DESIGN surface** for branded work. Stitch
   becomes explicit opt-in (`/design --jam`).
2. **SKILL.md update** — Workflow A (DESIGN) gets a Claude Design sub-flow
   documenting: create project, attach context, generate, Handoff to Claude Code,
   paste command, Claude Code does the BUILD.
3. **Wire handoff URL fetch** — add a helper `scripts/fetch-claude-design-bundle.ts`
   that takes a handoff URL, downloads the bundle, unpacks into
   `_captures/claude-design-bundles/<id>/`, prints the readme. Saves the operator one
   copy-paste.
4. **Brand sync** — decide whether `brands/<slug>/profile.md` stays source of
   truth (recommended) or whether we flip to Claude Design's system object. My
   vote: markdown stays primary, Claude Design system is a mirror created from
   it (scriptable via their GitHub ingest).
5. **Inspiration A/B** — one TikTok batch through ExtractFlow, one through
   Claude Design web capture. Decide whether to retain ExtractFlow as the default
   or swap for branded assets.
6. **README update** — new hero diagram reflecting 8-phase pipeline with Claude
   Design integrated. GitHub-safe hybrid Mermaid pattern per MEMORY rules.
7. **OUTSTANDING-WORK.md** — P3 stacks: Claude Design adoption path, bundle
   fetch helper, brand mirror script.

## Risks / open questions

- **No public API / MCP / CLI** yet. Everything happens through the browser +
  the handoff URL. If Anthropic ships an MCP before post-SSL, accelerate the
  adoption step.
- **Bundle URL auth model** — is the `/v1/design/h/<hash>` URL time-limited?
  Signed? Org-scoped? We need to test before relying on it.
- **Research preview** — feature set and pricing may shift. Avoid rewriting our
  pipeline around it until stable.
- **Enterprise toggle** — disabled-by-default for Enterprise plans. Not an issue
  for the operator (Max), but worth noting for Ellis (Databrill / Enterprise plan).

## Captures index

All screenshots in `Claude-UI-Workflow/_captures/claude-design-review/`:

| File | What |
|---|---|
| `10-current.png` | Sidebar with Design entry visible |
| `20-design-dashboard.png` | Intro overlay (Make prototypes) |
| `21-design-home.png` | Home: Prototype left / Recent-Your-Examples-Design systems right |
| `22-design-systems-tab.png` | Design systems tab, org settings, Create button |
| `23-ds-create.png` | Design system setup form (top) |
| `24-ds-scroll.png` | Design system setup form (`.fig`, fonts, notes) |
| `25-your-designs.png` | Your designs tab |
| `26-examples.png` | Examples gallery (Shader wallpapers, App onboarding) |
| `30-project-view.png` | Project workspace: context buttons, chat, canvas, Share/Export |
| `31-export-menu.png` | Export menu revealing **Handoff to Claude Code** |
| `32-handoff-dialog.png` | "Send to local coding agent" dialog with signed URL command |
| `33-share-menu.png` | Share dialog (Access, Duplicate as template) |

Browser inspector script (ad-hoc, Comet CDP 9222):
`Claude-UI-Workflow/_captures/claude-design-review/inspect-comet.js`
