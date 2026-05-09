# Stitch 2.0 Capabilities Reference

> Source: [Google Stitch 2.0 Tutorial](https://www.youtube.com/watch?v=QGZ24YhbZT8) by Teacher's Tech (10:45)
> Extracted: 2026-03-05
> Purpose: Reference for Claude when running Phase 1 (Stitch Creative Direction) of the UI Build Pipeline

---

## 1. Input Methods

| Input | Where | Notes |
|-------|-------|-------|
| Text prompt | Web UI + MCP | Be specific -- "crypto dashboard with dark mode and neon accents" not "finance app" |
| Image upload (wireframe/sketch) | Web UI only | Hand-drawn wireframe → high-fidelity screen. Photo of paper works. |
| Website URL | Web UI only | Uploads an existing page for redesign. MCP has no URL upload. |
| Existing screen + feedback | Web UI + MCP (`edit_screens`) | Iterate on a generated screen with natural language |

**Platform toggle:** Switch between **Mobile** and **Web** before generating. Web mode produces wide horizontal layouts (nav bars, hero sections, column grids). Mobile produces vertical app layouts.

**Model toggle:** **Thinking mode** (Gemini 3.0 Pro) follows complex instructions better but takes longer. **Fast mode** is quicker for simple prompts. Default to Thinking mode for anything with layout constraints.

---

## 2. Generation Modes

| Mode | What It Produces |
|------|-----------------|
| Single screen | One screen from a text prompt (mobile or web layout) |
| Continuation | Ask for additions to an existing screen ("add a buy/sell button") -- Stitch even suggests next actions |
| Multi-page | Ask for a second/third page -- Stitch automatically maintains brand consistency (colours, fonts, tone) |
| Wireframe conversion | Upload a sketch photo → outputs polished high-fidelity UI |
| Variation generation | Multiple alternatives with fine-grained controls (see Section 3) |

**Code output formats:** React, Tailwind CSS, HTML. Not just static images -- production-ready code.

---

## 3. Iteration Workflow

### Edit Theme
Select a screen → Edit → Theme. Opens a right panel with controls for:
- Colour changes
- Corner radius adjustments
- Apply instantly

### Generate Variations
Select a screen → Generate → Variations. Controls:

| Control | Options | Notes |
|---------|---------|-------|
| Quantity | 1-N (demo showed 3) | How many alternatives to generate |
| Creative range | **Refine** (small tweaks), **Medium** (standard), **YOLO** (wild/creative) | YOLO = "You Only Look Once" -- maximum creative divergence |
| Aspects to vary | Colour schemes, images, layout, etc. (checkboxes) | Pick which dimensions change |
| Custom instructions | Free text | Additional guidance for the variations |

### Canvas Controls
- Zoom in/out
- Pan (grab and drag)
- Reposition screens (move them around the canvas)
- Fit to screen (auto-arrange)
- Select tool for moving individual screens

### Quick Access
Right-click any screen for a context menu with all edit features + keyboard shortcuts.

### Multi-Page Consistency
When requesting additional pages within the same project, Stitch carries forward the entire design language from the first prompt. No need to re-specify branding.

---

## 4. Output Extraction

| Method | Access | What You Get |
|--------|--------|-------------|
| View Code | More menu on any screen | See the generated code inline |
| Code to Clipboard | More menu → export | Copy code directly for pasting |
| ZIP Download | More menu → download | Full local files (HTML + assets + animations) |
| Export to AI Studio | More menu → export | Send to Google AI Studio |
| Export to Jules | More menu → export | Send to Google's AI coding agent |

### What This Means for Our Pipeline

**the operator's workflow (web UI):**
1. Best option: **ZIP download** -- gives complete local files with animations
2. Quick option: **Code to clipboard** -- paste directly into Claude Code
3. Both are web UI only -- no MCP equivalent

**Claude's workflow (MCP):**
- `get_screen` returns metadata + download URLs, but download URLs require Google auth
- Claude works from screen descriptions and uses `edit_screens` / `generate_variants` to iterate
- For actual HTML code, the operator must use one of the web UI export methods above

---

## 5. Pro Features

### Heat Maps (Attention Prediction)
Select a screen → Generate → Predicted Heat Map

- Shows where users' eyes will look first (attention audit)
- If your CTA button isn't glowing, the design needs fixing before coding
- Use this as a UX validation step before moving to production

### Interactive Prototypes
Select 2+ screens → Prototype button appears

- Creates a clickable prototype with navigation hotspots
- Click elements to navigate between pages (e.g. "Pricing" link → pricing page)
- Restart button to test from the beginning
- Tests the flow/UX before writing any production code

### Suggested Actions
After generating a screen, Stitch suggests next steps ("add a buy/sell button for quick trades"). These are contextual and speed up iteration.

---

## 6. Limitations and Gotchas

| Limitation | Impact | Workaround |
|-----------|--------|------------|
| MCP is text-only input | Can't upload URLs or images via MCP | the operator uses web UI for visual input; Claude describes content in text prompts |
| HTML download URLs need Google auth | Claude can't fetch exported code via URL | the operator copies code via clipboard or ZIP download |
| Thinking mode is slower | Complex prompts take longer | Worth the wait -- much better for multi-section layouts |
| YOLO variations can be extreme | May produce unusable results | Use Medium or Refine for controlled iteration; YOLO for brainstorming only |
| Prototype needs 2+ screens | Can't prototype a single screen | Generate at least 2 pages before prototyping |
| Currently free | May become paid | No timeline given -- use it while available |
| Variation differences can be subtle | Refine mode especially produces minor changes | Use YOLO or specify dramatic changes in custom instructions |
| No direct Figma export mentioned | Can't send to Figma in one click | Export code → manually import, or use ZIP download |

---

## Quick Reference: MCP Tools vs Web UI

| Action | MCP Tool | Web UI |
|--------|----------|--------|
| Generate from text | `generate_screen_from_text` | Prompt box |
| Generate from URL/image | -- | Upload button |
| Edit a screen | `edit_screens` | Edit menu or right-click |
| Generate variants | `generate_variants` | Generate → Variations |
| View code | `get_screen` (metadata only) | More → View Code |
| Copy code | -- | More → Code to Clipboard |
| Download ZIP | -- | More → Download |
| Heat map | -- | Generate → Predicted Heat Map |
| Prototype | -- | Select 2+ screens → Prototype |
| List screens | `list_screens` | Left panel |
| List projects | `list_projects` | All Projects view |
