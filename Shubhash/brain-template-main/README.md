# The Operator's Brain

A Karpathy-style markdown wiki for Amazon and multi-channel ecom operators. Plain text. Structured frontmatter. Claude Code reads it end-to-end and runs four operator skills against it.

Built as the companion deliverable for the **Seller Sessions Live 2026** opening talk: *Architecting the Amazon Operator's Stack*.

---

## What this is

> "Your brain in plain text, your agent in the same room."

The atomic unit is **one page per parent ASIN**. Suppliers feed SKUs. Channels sell SKUs. Campaigns push SKUs. Reviews judge SKUs. Decisions move SKUs. Playbooks operationalise SKUs.

Everything else exists to give context to a SKU.

---

## What's inside

```
brain-template/
  _templates/        11 starting blanks (sku, supplier, channel, decision, playbook, etc)
  wiki/
    skus/            one page per parent ASIN  (with worked example)
    suppliers/       one page per factory      (with worked example)
    channels/        amazon-us, amazon-uk, tiktok-shop-us, shopify (pre-stubbed)
    decisions/       irreversible calls log    (with worked example)
    playbooks/       prime-day, bfcm, q5, restock-cycle, new-launch, review-crisis
    concepts/        cm3, cash cycle, tacos, fba fees, restock formula, review velocity
    daily/           the operator daily ritual (with worked example)
    team/            internal, china sourcing, US VA, agencies (with worked example)
    ip/              trademarks, patents, compliance
    finance/         monthly close, cash plan, restock budget (with worked example)
  raw/               unfiltered inbox
  .claude/skills/
    sku-audit/       /sku-audit {ASIN}
    restock-memo/    /restock-memo {ASIN} --weeks=12
    wbr/             /wbr --week=YYYY-Wxx
    onestar-themes/  /onestar-themes {ASIN} --since=90d
  CLAUDE.md          vault-context file Claude Code reads on session start
  QUICKSTART.md      60-minute first-time guide
  setup.sh           one-line installer
  LICENSE            MIT
```

---

## Quick start

For a full handhold, read **[QUICKSTART.md](QUICKSTART.md)** - the 60-minute first-time guide. The TL;DR is below.

### Option A - Use this template (recommended)
1. Click the green **"Use this template"** button at the top of this repo on GitHub.
2. Name your copy something like `my-operator-brain`. Mark it private.
3. Clone it locally:
   ```bash
   gh repo clone YOUR-USERNAME/my-operator-brain ~/Documents/my-operator-brain
   ```

### Option B - One-line installer
Runs the prerequisite checks (Homebrew, Git, GitHub CLI, Obsidian), creates a private copy of this template under your GitHub account, clones it, and (optionally) wires up Claude Code.

```bash
curl -fsSL https://raw.githubusercontent.com/ShubhashSharma/brain-template/main/setup.sh | bash
```

macOS only.

---

## First 30 minutes inside the brain

1. Open the vault in Obsidian (or any markdown editor).
2. Read `wiki/README.md`.
3. Open `wiki/skus/EXAMPLE-acme-baby-shampoo-001.md`. This is what a "good" SKU page looks like.
4. Copy `_templates/sku.md` into `wiki/skus/`. Fill in **one** of your top SKUs. Just one. Not all of them.
5. Link the supplier (create the supplier page from `_templates/supplier.md`).
6. Link the channel (`wiki/channels/amazon-us.md` is already there).
7. Open `wiki/concepts/cm1-cm2-cm3.md`. This is the language used everywhere else.
8. Create today's daily note from `_templates/operator-daily.md`.

That's the loop. Every time something happens, you know which page it belongs on.

---

## Claude Code integration

Open Claude Code in the vault root. The four shipped skills are auto-discovered from `.claude/skills/`. Claude Code also reads `CLAUDE.md` at the vault root on every session, so it understands the structure without prompting.

| Command | What it does |
|---|---|
| `/sku-audit {ASIN}` | Health score, drift detection, append findings to the SKU page |
| `/restock-memo {ASIN} --weeks=12` | Compute restock recommendation, write a draft to `wiki/decisions/` |
| `/wbr --week=YYYY-Wxx` | Build the Weekly Business Review across all active SKUs and channels |
| `/onestar-themes {ASIN} --since=90d` | Cluster recent low-star reviews, update the SKU's tracker block |

Skills work read-only on frontmatter by default. To pull live SP-API data (orders, ads, reviews, inventory), wire up the `mcp-amazon` MCP server. See `.claude/README.md` for setup.

---

## Why a markdown wiki, and not Notion / Airtable / a SaaS dashboard

Three reasons:

1. **You own it.** Plain text in a Git repo. No vendor lock-in. Diffable, searchable, forkable.
2. **An LLM can read all of it.** Claude Code can ingest 90 days of dailies + every SKU + every decision in one prompt. SaaS dashboards can't do this.
3. **It compounds.** Every page links to others. The graph gets denser every week. After 6 months, the brain is doing work for you that you don't remember writing into it.

---

## Who this is for

- Amazon FBA / FBM operators doing **$1M to $100M annual revenue**.
- Multi-channel-curious (Amazon + TikTok Shop + Shopify) but Amazon-primary.
- Comfortable with a plain-text editor and basic Git.
- Building or running with a small team (or planning to hire one).

If you're sub-$1M, this is more structure than you need. Use a notebook for now.
If you're 9-figures, this is a starting point. Fork it, customise hard.

---

## Roadmap (post-talk)

- v1.1: live `mcp-amazon` reference build (SP-API + Ads API hooks)
- v1.2: TikTok Shop MCP companion
- v1.3: Shopify Admin MCP companion
- v1.4: Linux + Windows installer
- v1.5: visual builder for new SKU pages

---

## Credits

Built by [not a square](https://notasquare.io) for the operators in the SSL 2026 room.

Karpathy framing: an LLM-friendly wiki where structure makes the agent useful, not the other way around.

---

## Licence

MIT for the structure and templates. The ideas are yours to use, fork, and remix. If you build something good on top, an attribution back to this repo is appreciated but not required.
