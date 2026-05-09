# Section 03 — Anthropic's Top 6 Claude Skills for Designers (Adrien Ninet)

**Status:** Banked — install commands captured, ready for skills-register cross-check
**Created:** 2026-04-11
**Source:** TikTok photo carousel `7617803923662933270` by @adrien.ninet — *"Top 6 Claude Skills for Designers"*
**Original URL:** https://www.tiktok.com/@adrien.ninet/photo/7617803923662933270
**Capture method:** `gallery-dl` (slide JPEGs) + `ocrmac` (Apple Vision OCR)
**Slide assets:** `Claude-UI-Workflow/design-brand-reels-inspiration-extract/screenshots/claude-skills-top6/`
**Part of:** Design System Unification — feeds **skills register / Memory** (cross-cutting, not a stage)

---

## What this is

A **direct gap-finding hit** for the operator's Claude Code skills library. Adrien Ninet curated the 6 official Anthropic skills designed for designers — each shipped from the [`anthropics/skills`](https://github.com/anthropics/skills) GitHub repo, each install via a single `npx skills add` command. Some of these we may already have installed under different names; some are likely missing.

> *"What are Skills? Simple plug-ins that change how Claude designs."* — slide 02

---

## The 6 skills (verbatim install commands)

| # | Skill | What it does | Install command |
|---|---|---|---|
| 1 | **Front-End Design** | "Claude goes through a full design thinking process before writing code." | `npx skills add https://github.com/anthropics/skills --skill frontend-design` |
| 2 | **Figma to Code** | "Paste a Figma URL → Production-ready code with 1:1 fidelity." | `npx skills add https://github.com/anthropics/skills --skill figma` |
| 3 | **Theme Factory** | "10 professional themes with curated palettes + font pairings." | `npx skills add https://github.com/anthropics/skills --skill theme-factory` |
| 4 | **Brand Guidelines** | "Your colors, fonts, spacing, tone — enforced automatically across everything Claude outputs." | `npx skills add https://github.com/anthropics/skills --skill brand-guidelines` |
| 5 | **Canvas Design** | "Creates actual visual art, posters, compositions as real PNG/PDF files." | `npx skills add https://github.com/anthropics/skills --skill canvas-design` |
| 6 | **Skill Creator** | "Build your own custom skills for your design system, brand voice, or workflow." | `npx skills add https://github.com/anthropics/skills --skill skill-creator` |

> **OCR caveat:** A couple of slides showed `nox skills add` (Vision misread `npx`). Corrected above. Verify against the upstream repo before running.

---

## Cross-reference against our installed skills

Our existing design-related skills (from MEMORY notes + `.claude/skills/`):

```
ui-ux-pro-max          composition-patterns      emil-design-eng
web-design-guidelines  visual-explainer          algorithmic-art
slides-creator         claude-ui-workflow        ascii-flowchart
```

**Quick read on overlap vs gaps** (needs the operator verification):

| Anthropic skill | Likely overlap with ours | Gap? |
|---|---|---|
| Front-End Design | `emil-design-eng` / `ui-ux-pro-max` partially cover this | **Probably already covered** — but worth comparing the design-thinking framework |
| **Figma to Code** | Nothing direct in our register | **GAP** — the operator doesn't currently use Figma but if/when we do, this is the on-ramp |
| **Theme Factory** | `web-design-guidelines` overlaps loosely | **Likely gap** — 10 curated palette+font combos is concrete tooling we don't have |
| **Brand Guidelines** | This is **exactly what plan step 1** (canonical brand source) is trying to build manually. The skill may give us the runtime enforcement layer we don't yet have. | **HIGH-VALUE GAP** — direct hit on unification plan step 1 |
| Canvas Design | `algorithmic-art` partially | **Likely gap** — Canvas outputs PNG/PDF as real files; algorithmic-art is more code-as-art |
| Skill Creator | We hand-build skills today | **Gap (low-priority)** — our hand-built process works; this would just speed it up |

**Top 2 to install and test next session:** Brand Guidelines (plan step 1 multiplier) + Theme Factory (concrete additions to `design-db/`).

---

## How this maps to the unification plan

| Plan step | How this skill carousel feeds it |
|---|---|
| **Step 1: Canonical brand source** | **Brand Guidelines skill** could be the runtime enforcement layer that reads from `brands/<slug>/tokens.json` and enforces them on every Claude output. May reduce manual `style-enforcer` agent work. |
| Step 2: Logo Brain | Not directly related — but Canvas Design could be a stop-gap PNG/PDF outputter while Logo Brain is being built |
| Step 5: REFINE guard rails | Brand Guidelines skill could supply the runtime checks REFINE currently lacks |

**Action queued for post-SSL or sooner if the operator wants:** install all 6, test each against a known design task, document which ones we keep and where they slot into the existing skills register.

---

### Short version

> **Anthropic ships 6 official designer skills via `anthropics/skills` repo. Brand Guidelines and Theme Factory are the highest-value gaps for our plan. All install via `npx skills add` from a single GitHub source. Cross-check + install pass should happen post-SSL — the Brand Guidelines skill may collapse plan step 1 into a one-line install.**
