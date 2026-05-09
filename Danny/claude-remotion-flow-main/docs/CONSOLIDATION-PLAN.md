# 18 → 4 Consolidation Plan

**Goal:** Distill 18 conversational workshop recordings into 4 tight, ch05-style animated videos that stand on their own — the magical, useful end-product the audience receives.

**Format target:** Each video = 5–8 scenes, ~90–150s, kinetic typography + UI screenshots/demos in the right half (the ch05 pattern). One-shot pipeline (single-stem VO + post-process + native Remotion render).

---

## TL;DR

| # | Title | Source chapters | Est runtime | Asset count |
|---|-------|----------------|-------------|-------------|
| 1 | **The Setup** | Intro 1–4 + Mod 1 | ~120s | 6–8 (VS Code, marketplace, themes, settings, Claude.md) |
| 2 | **The System** | Intro 6 + Mod 2–4 | ~150s | 8–10 (Master Log, slash menu, 6 MCP tools) |
| 3 | **The Workflow** | Intro 8–9 + Mod 5b–5c | ~140s | 7–9 (APM diagram, iteration loop, agent roles) |
| 4 | **The Payoff** | Intro 7, 10 + Mod 8 | ~100s | 5–6 (recap callouts, no new UI) |

**Total runtime:** ~8–9 mins of polished video — replacing ~52 mins of raw conversational recordings.

**Drop ratio:** ~83% of source minutes cut as conversational tangent / philosophical aside / repetition.

---

## Per-Chapter Substance Audit

### Intro chapters

| # | Title | Substance (max 5) | Filler character |
|---|-------|-------------------|------------------|
| 1 | Workflow Overview & VS Code Setup | 1) Claude Code extension via VS Code marketplace · 2) Loop concept (input → Claude → output → next) · 3) Readers: PDF/Markdown/CSV parsing · 4) Extensions sidebar toggle · 5) Project folder layout | ADHD analogy ("box of spanners down a lighthouse"), generic VS Code orientation |
| 2 | Themes — Designers vs Programmers | 1) Theme marketplace (Dracula example) · 2) Light/dark impact on Mermaid rendering · 3) Theme persistence across sessions · 4) Designer vs programmer naming preference | Sidebar conversation about visual taste |
| 3 | Extensions & Recovering from Loops | 1) "Prompt too long" diagnosis + restart · 2) JSONL terminal recovery (paste into new conversation) · 3) Cmd+Shift+P reload · 4) @Popular marketplace browse · 5) Master Log as recovery anchor | Multi-clarification of error states |
| 4 | Settings, Sidebar & Asking Claude for Help | 1) Cmd+Shift+P command palette · 2) Sidebar toggle · 3) "Ask Claude to write your settings" pattern · 4) Model selection via settings file | Tight chapter, low filler |
| 5 | Screenshots & Typora Markdown Workflow | 1) Cmd+Shift+4 + shift-drag into chat · 2) Typora $14.99 / 15-day trial · 3) Markdown rendered (lists, tables, headings) · 4) Themes (Light/Dark/GitHub) · 5) Mermaid inline rendering | Annotation workflow tangents — **already shipped as ch05** |
| 6 | Slash Commands, Agents & Master Log | 1) `/new`, `/resume`, `/clear`, `/mention`, `/attach`, `/config`, `/mcp-status`, `/models` · 2) 32 agents as slash commands · 3) Master Log as agents source · 4) Command palette discovery | Wandering intro; merge into Video 2 |
| 7 | Human in the Loop vs Fixed Automation | 1) Fixed automation = no interruption · 2) HITL = iterative questioning · 3) "Ask the right questions > craft the perfect prompt" · 4) Slack integration as conversational use case | Philosophical framing — low visual demo value, lives in Video 4 |
| 8 | Actions Per Minute & Domain Knowledge | 1) APM metric (gaming origin) · 2) "15–20× per day" multiplier · 3) Fathom → Notion task distribution example · 4) Domain knowledge as moat | Repetition for emphasis |
| 9 | Iteration & The One-Shot Myth | 1) Three approaches (slow human / fast one-shot / iteration) · 2) Back-and-forth methodology · 3) Multi-instance discouraged · 4) Design-loop analogy (paintings/songs) · 5) Quality degrades without iteration | Strong but conceptual — needs visual diagram |
| 10 | Closing — Build, Don't Imitate | 1) "Toy you tell what to do" framing · 2) Non-programmer + critical thinking + agents · 3) Innovation > imitation | Inspirational close — fits Video 4 wrap |

### Module chapters

| # | Title | Substance (max 5) | Filler character |
|---|-------|-------------------|------------------|
| 11 | Module 1 — Claude.md | 1) Claude.md = project brain (root + README) · 2) Loop: read → copy path → paste → answer → execute · 3) Token management (start slow, expand) · 4) Manual rule evolution · 5) Single-file context injection | Conceptual framing |
| 12 | Module 2 — Master Log Everything | 1) Single source of truth (each conv starts fresh) · 2) JSONL paste-recovery format · 3) Bullets > paragraphs · 4) Update on a regular basis · 5) Session-log vs Master-Log distinction | Some repetition |
| 13 | Module 3 — Slash Commands | 1) Top 20 by memory · 2) `/morning`, `/goodnight` personality routines · 3) Examples: `/update session log`, `/check status`, `/format table` · 4) Don't make 500 (discoverability problem) · 5) Voice-first | Conversation about typing vs voice |
| 14 | Module 4 — MCPs | 1) MCP = protocol tying tools together · 2) **Six tools**: Sequential Thinking, Filesystem, Fetch, Context7 ("your Bible"), AppleScript, Playwright · 3) Setup file + restart required · 4) `/mcp-status` check · 5) Seller Central ToS warning | Dense — almost all substance |
| 15 | Module 5a — Agents: Why & What I Picked | 1) Trimmed 51 → essential set (avoid flooding) · 2) Amazon-seller audience focus · 3) Author uses 3 for architecture/design/testing · 4) "Different hats, same person" | "Magical moment" emotional anchor |
| 16 | Module 5b — Essential Agents | 1) Trend Researcher (Reddit/market) · 2) Content Creator · 3) Growth Hacker (conversion, launches) · 4) TikTok Strategist · 5) Analytics (Seller Central) · 6) Feedback Synthesizer | **Lowest filler chapter** — pure procedural |
| 17 | Module 5c — Concept & Sequencing | 1) Agents = different hats · 2) Hire-a-team mindset · 3) Sequential > parallel (token + conflict risk) · 4) Start one, iterate, document, combine cautiously · 5) Use-case sequence (trends → customers → descriptions → launch → TikTok → reviews → reports → replies) | Strong content |
| 18 | Closing — The Complete Picture | 1) Claude.md + Master Log + slash + MCPs + agents · 2) Workflow comfort > speed · 3) Incremental command adoption · 4) Test agents individually · 5) Capture new behaviours into Claude.md (evergreen) | Reflective close — fits Video 4 |

---

## Cluster Rationale

**Why 4, not 5 or 6?**
- 4 fits a single-screen course-page lineup (no scrolling).
- Each video bundles 4–5 source chapters' substance, which is exactly the density the ch05 template handles cleanly (~5–8 scenes × ~20s each).
- Anything over 4 starts duplicating across videos (Master Log alone appears in 6 source chapters — concentrated in Video 2 with brief callbacks elsewhere).

**Master Log = system hub.** Biggest finding from the audit. Don't spread it. Make it the centrepiece scene of Video 2 ("The System") and call back to it briefly in Videos 1, 3, 4. Reduces context switching for the viewer.

---

## The 4 Videos

> Per-scene COPY (eyebrow / title / caption) is **draft** — meant to validate clustering, not final ship copy. Video 5 (the existing ch05) is excluded from this lineup; it's already shipped.

### Video 1 — The Setup

Eyebrow theme: `SETUP`. ~120s.

| Scene | Title | Caption | Source | Assets needed |
|-------|-------|---------|--------|---------------|
| 1 | Install Claude Code | VS Code marketplace · search Anthropic · install · reload | Intro 1 | VS Code marketplace screenshot |
| 2 | The Loop | You prompt · Claude acts · you check · you prompt again | Intro 1 | Native diagram (4-node loop) |
| 3 | Themes That Stick | Dracula · GitHub Light · Night Owl — picked once, stays | Intro 2 | VS Code theme picker screenshot |
| 4 | Settings the Easy Way | Cmd+Shift+P → reload · or ask Claude to write your config | Intro 4 | Command palette screenshot |
| 5 | When It Loops | Prompt-too-long · restart extension · paste your last log | Intro 3 | Error toast + JSONL paste mock |
| 6 | Claude.md — Your Brain | One file at the project root · Claude reads it every turn | Mod 1 | Folder tree + Claude.md preview |

### Video 2 — The System

Eyebrow theme: `SYSTEM`. ~150s.

| Scene | Title | Caption | Source | Assets needed |
|-------|-------|---------|--------|---------------|
| 1 | The Master Log | Single source of truth · Claude forgets, the log doesn't | Mod 2 | Markdown file with bullet log |
| 2 | Recover Anything | Paste the JSONL into a new conversation · pick up where you stopped | Intro 3, Mod 2 | Terminal + paste-into-Claude flow |
| 3 | Slash Commands | `/new` · `/resume` · `/clear` · `/mcp-status` · `/models` | Intro 6, Mod 3 | Slash menu screenshot |
| 4 | Make Your Own | `/morning` · `/goodnight` · `/update session log` | Mod 3 | Custom slash commands list |
| 5 | MCPs — Six That Matter | Sequential Thinking · Filesystem · Fetch · Context7 · AppleScript · Playwright | Mod 4 | 6-tile grid (one per tool) |
| 6 | Context7 — Your Bible | Live API docs · always current · ask Claude to cite | Mod 4 | Context7 query result |
| 7 | Status Check | `/mcp-status` shows what's wired and what's broken | Mod 4 | mcp-status output mock |

### Video 3 — The Workflow

Eyebrow theme: `WORKFLOW`. ~140s.

| Scene | Title | Caption | Source | Assets needed |
|-------|-------|---------|--------|---------------|
| 1 | Actions Per Minute | A gaming metric · 15–20× per day across one task | Intro 8 | APM bar chart / counter |
| 2 | One Workflow, Many Tasks | Fathom call → Notion tasks → distributed in seconds | Intro 8 | Fathom → Notion handoff diagram |
| 3 | The Iteration Loop | Slow human · fast one-shot · iteration wins | Intro 9 | 3-panel comparison |
| 4 | Different Hats | Architecture · Design · Testing · Trend Researcher · Content · Growth | Mod 5a, 5b | Agent role tiles (6) |
| 5 | The Six Essentials | Trend · Content · Growth · TikTok · Analytics · Feedback | Mod 5b | Same tiles, ordered |
| 6 | Sequence, Don't Swarm | Run agents one at a time · token-safe · conflict-free | Mod 5c | Sequential vs parallel diagram |
| 7 | A Real Run | Trends → customers → descriptions → launch → TikTok → reviews → reports → replies | Mod 5c | 8-step horizontal timeline |

### Video 4 — The Payoff

Eyebrow theme: `MINDSET`. ~100s.

| Scene | Title | Caption | Source | Assets needed |
|-------|-------|---------|--------|---------------|
| 1 | Ask, Don't Prompt | The right question beats the perfect prompt | Intro 7 | Chat-bubble dialogue mock |
| 2 | Domain Knowledge Wins | Claude knows tools · you know your customer | Intro 8, 10 | Venn diagram (you ∩ Claude) |
| 3 | Build, Don't Imitate | A toy you direct · innovation over imitation | Intro 10 | Pull-quote card (text-only) |
| 4 | The Whole Stack | Claude.md · Master Log · Slash · MCPs · Agents | Mod 8 | 5-icon row |
| 5 | What's Next | Add commands as you go · test agents one at a time | Mod 8 | Native checklist |

---

## Cuts (what didn't survive the audit)

- Personal/ADHD asides (the spanner-lighthouse, the multi-Claude-instances anecdote) → out
- Multiple re-explanations of the same concept → kept once, in the most concrete chapter
- Sidebar conversations on workflow taste / personality → out
- "Magical moment" framing in Mod 5a → out (replaced with the concrete agent list in Video 3)
- Light vs dark mode aesthetic discussion → out (kept only the Mermaid-rendering implication)

**No source chapter was dropped wholesale.** Every chapter contributes at least one substance item to the 4-video lineup.

---

## Open questions for Danny

1. **Order of release.** Sequence the 4 as listed (Setup → System → Workflow → Payoff)? Or front-load The System (the hub) and treat The Setup as a quick-start pre-roll?
2. **Length tolerance.** Targeted 100–150s each. Want tighter (sub-90s) for shorter attention spans, or comfortable to let Workflow run to 150s+?
3. **Voiceover scripting.** Want me to write the VO scripts for one of the four (Video 1 is the natural starter) so we can validate the kinetic-typography pacing at this density?
4. **UI assets.** The plan needs ~25 distinct UI captures (VS Code menus, marketplace, Claude.md previews, slash menu, MCP grid, agent tiles, etc.). Capture them yourself, or do you want me to drive headless-browser captures via ExtractFlow against your local Claude Code session?

---

## Next steps (if validated)

1. Lock the clustering (Danny review)
2. Pick Video 1 (or another) as the next one-shot pilot
3. Build voice config + Remotion composition (factory pattern, same as ch05)
4. Capture the UI assets
5. Render → audit → ship
6. Repeat for the remaining 3
