# Section 01 — `design.md` format, `awesome-design-md` library, and how both fit the Stitch workflow

**Status:** Banked — solid section, ready to compose into final design system
**Created:** 2026-04-11
**Sources:** TikTok reels `7623486895430831382` (Google Stitch → design.md) and `7626499323106299158` (awesome-design-md 58 systems), Databrill Stitch redesign pipeline
**Part of:** Design System Unification (plan file: `<your local plans dir>/groovy-gathering-dongarra.md`, step 1)

---

Good question — they're **the same file format, different sources, fully additive**. Let me pull them apart cleanly.

## 1. What `design.md` actually is

A **portable markdown file** that captures an entire brand system — colours, fonts, spacing, type scale, component rules — in one flat file that any LLM can consume as context.

It's a **format**, not a tool. Think of it as `package.json` for brand identity: a single file you paste (or reference) to give Claude/ChatGPT/Stitch instant brand awareness.

## 2. What Stitch does (the reel's claim)

Stitch can **generate** a `design.md` for you:
- Drop a reference (landing page, logo, client work) into Stitch
- Ask it to "generate a design system based on the reference image"
- Stitch extracts tokens + rules → exports as `design.md`
- You paste that file into any AI tool downstream → on-brand output

**Authorship:** *your own brand*, reverse-engineered from a reference you already have.

## 3. What `awesome-design-md` is

A **GitHub repo of 58 pre-made `design.md` files** — one per known-good design system (Apple, Stripe, Linear, Raycast, Notion, SpaceX, etc.).

**Authorship:** *other companies' brands*, curated by the community as reference material.

## 4. Additive vs overlapping

```
                   SAME FILE FORMAT (design.md)
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
      ┌──────────────┐              ┌──────────────────┐
      │    STITCH    │              │ awesome-design-md│
      │  (generator) │              │    (library)     │
      └──────┬───────┘              └────────┬─────────┘
             │                               │
     "generate ME                    "give me STRIPE's
      a design.md                     design.md so I can
      from this                       build in that style"
      reference"                              │
             │                                │
             ▼                                ▼
     brands/sellersessions/          brands/_refs/stripe/
     design.md                       design.md
     (your own)                      (borrowed)
             │                                │
             └───────────────┬────────────────┘
                             ▼
                  Claude Code / Stitch / any LLM
                      consumes as context
                             │
                             ▼
                    On-brand generation
                   (not generic slop)
```

**They don't compete — they feed the same slot from two different directions.**

## 5. How this maps to our existing Stitch workflow

What we have today (from the Databrill Stitch redesign pipeline):

```
Stitch prompt → Stitch generates HTML → Claude patches text → Output
  (5 prompts         (scaffold's         (2-pass anti-
   ready)           output/ folder)      hallucination)
```

We're **only taking the HTML**. We're throwing away Stitch's design-system reasoning.

What the reel is saying we should *also* do:

```
Stitch prompt → Stitch generates HTML                     → Output
                     +                  ↘
              Stitch generates design.md  →  saves to     → brands/<slug>/design.md
              (extra request)                brand folder    (reusable forever)
```

One extra Stitch request per brand. The `design.md` becomes a **reusable artefact** you can paste into any future prompt, not just a one-shot HTML output.

And `awesome-design-md` gives you a **58-system reference library** for when you want to say *"build the SS marketing site but with Stripe's design sensibility"* — you borrow Stripe's `design.md`, blend it with your own.

## 6. Concrete answer: add both

| What | Where it lives | When you use it |
|---|---|---|
| **Your brand `design.md`** (Stitch-generated) | `brands/sellersessions/design.md`, `brands/databrill/design.md` | Every build — always loaded as context |
| **Reference `design.md` library** (awesome-design-md) | `brands/_refs/stripe/`, `brands/_refs/linear/`, etc. | When you want to borrow a style sensibility or benchmark |
| **Stitch HTML output** (existing pipeline) | `stitch-build/output/` | One-off page builds (unchanged) |

**One change to the existing Stitch pipeline:** add a second request per brand session — *"now export the design system as `design.md`"* — and save it to `brands/<slug>/design.md`. That one extra step turns Stitch from a page-generator into a **brand-file generator** too, and the `design.md` is what unblocks plan step 1 (canonical brand source) we scoped earlier.

**`awesome-design-md` is pure bonus** — a library you install once, browse like stock photos, and borrow from when starting a new brand or benchmarking.

### Short version

> **`design.md` is the format. Stitch produces yours. `awesome-design-md` is a library of 58 you can borrow. Both go into `brands/`. They're additive, not competing. One extra Stitch request per brand wires the loop.**
