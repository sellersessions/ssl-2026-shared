# CLAUDE.md - vault context

You are working inside an **operator's brain**: a markdown wiki built around the SKUs, suppliers, channels, decisions, and playbooks of an Amazon-and-multi-channel ecom operator.

This file orients you whenever a session opens at the vault root.

---

## What this vault is

The atomic unit is **one page per parent ASIN**. Suppliers feed SKUs. Channels sell SKUs. Campaigns push SKUs. Reviews judge SKUs. Decisions move SKUs. Playbooks operationalise SKUs.

Every page has:
1. **Frontmatter** at the top - structured fields you can read deterministically.
2. **Numbers** block - what's true now (timestamped).
3. **Body** - context, history, links.
4. **Claude prompt block** at the bottom (where applicable) - shorthand for skills the operator can run on the page.

Plain markdown. No databases. No SaaS. The wiki *is* the data layer.

---

## Folder map

| Folder | What lives here |
|---|---|
| `wiki/skus/` | One page per parent ASIN. The atomic unit. |
| `wiki/suppliers/` | One page per factory or trader. |
| `wiki/channels/` | Amazon-US, Amazon-UK, TikTok-Shop-US, Shopify, etc. |
| `wiki/decisions/` | Every irreversible call. Date-prefixed file names. |
| `wiki/playbooks/` | Repeatable event runbooks (Prime Day, BFCM, Q5, restock-cycle, new-launch, review-crisis). |
| `wiki/concepts/` | Operator vocabulary: CM1/2/3, cash cycle, TACoS, FBA fees, restock formula, review velocity. |
| `wiki/daily/` | One per day. `YYYY-MM-DD.md`. Yesterday's numbers, OOS list, 3 wins, 3 fires. |
| `wiki/team/` | Internal team, China sourcing, US VAs, UK ops, agencies. |
| `wiki/ip/` | Trademarks, patents, compliance docs, lab tests. |
| `wiki/finance/` | P&L closes, cash plan, restock budget. |
| `raw/` | Inbox. Untrusted. Curate into `wiki/` or delete. |
| `_templates/` | Starting blanks for every page type. |
| `.claude/skills/` | Pre-built Claude Code skills - see below. |

---

## Skills available in this vault

Project-scoped skills in `.claude/skills/`:

| Skill | Trigger | What it does |
|---|---|---|
| `sku-audit` | `/sku-audit {ASIN}` | Score one SKU's health (CM3, ad efficiency, review velocity, inventory) and append findings to its page. |
| `restock-memo` | `/restock-memo {ASIN} --weeks=12` | Compute restock recommendation, write a draft to `wiki/decisions/`. Never submits the PO. |
| `wbr` | `/wbr --week=YYYY-Wxx` | Build the Weekly Business Review across all active SKUs and channels. |
| `onestar-themes` | `/onestar-themes {ASIN} --since=90d` | Cluster recent low-star reviews, update the SKU's tracker block. |

Each skill's full spec is in `.claude/skills/<name>/SKILL.md`.

---

## How to read this vault as an agent

When asked about a SKU:
1. Find the SKU page by frontmatter `asin:` field match (preferred), or by file name match.
2. Read the frontmatter for hard numbers (cogs_landed, units_30d, cm3_30d, etc).
3. Read the body for context (lifecycle, 1-star themes, decisions linked).
4. Follow `[[wikilinks]]` to suppliers, channels, decisions for fuller context.

When asked to "audit", "review", or "score" a SKU: run `/sku-audit`.
When asked to "plan a restock" or "place an order": run `/restock-memo`. Never place a PO directly.
When asked for "this week's numbers" or "WBR": run `/wbr`.
When asked about "review patterns" or "1-star issues": run `/onestar-themes`.

---

## Writing back to the vault

When a skill writes findings:
- **Append, don't overwrite.** Existing page sections stay; new sections get a date heading.
- **Update frontmatter conservatively.** Only change fields the skill is authoritative on (e.g. `last_audit`, refreshed numbers from MCP).
- **Never delete decision pages.** Set `status: superseded` instead.

When the operator asks you to draft a new page:
- Use the relevant template in `_templates/`.
- Fill in the frontmatter completely. Leave body sections blank rather than fabricated.
- Place the file in the right folder.

---

## House style

- **UK English** in body prose where in doubt (analyse, organise, behaviour).
- **No em dashes.** Use commas, colons, parentheses, or rephrase. No en dashes in prose either.
- **No emoji** unless explicitly requested.
- **Tables for data.** Bullets for lists. Headers for structure.
- **Brief.** First-draft is final-draft quality.
- **Avoid AI slop:** never use words like leverage, robust, seamless, first-class, delve, unleash, gold mine, load-bearing.

---

## What this vault is NOT

- Not a Notion replacement. (It can be, but the goal is operator decisions, not knowledge management.)
- Not a database. (It's plain text. Frontmatter is structured but not normalised.)
- Not a CRM, ERP, or accounting system. (It links to those, doesn't replace them.)
- Not a journal. (Daily notes are operational, not personal.)

---

## When the operator asks for something this vault isn't built for

Say so directly. Suggest the right tool (Notion / Linear / their accountant / etc). Don't try to bend the wiki to fit.

---

## On reversibility and risk

When the operator asks you to do something with real-world consequences (place a PO, send an email to a supplier, change a price), default to writing a **decision draft** to `wiki/decisions/` and asking for sign-off. The brain is a thinking partner, not an executor of last resort.

---

## Companion docs
- `README.md` - the public-facing repo intro
- `QUICKSTART.md` - the 60-minute first-day path
- `wiki/README.md` - the operator's tour of the vault
- `.claude/README.md` - skills setup, including `mcp-amazon` wiring
