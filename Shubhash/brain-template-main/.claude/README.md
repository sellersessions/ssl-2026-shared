# Claude Code skills

Four pre-built skills you can install into Claude Code to operate on this brain.

---

## What's shipped

| Skill | Command | What it does |
|---|---|---|
| `sku-audit` | `/sku-audit {ASIN}` | Pull SP-API numbers, score CM3 + ad efficiency + review health, append findings to the SKU page |
| `restock-memo` | `/restock-memo {ASIN} --weeks=12` | Compute restock recommendation, write a draft to `wiki/decisions/` for sign-off |
| `wbr` | `/wbr --week=YYYY-Wxx` | Build the weekly business review across all active SKUs and channels |
| `onestar-themes` | `/onestar-themes {ASIN} --since=90d` | Cluster recent low-star reviews by theme, update the SKU's tracker block |

Each skill lives in `claude/skills/<name>/SKILL.md`.

---

## Installation

### Option A - Project-scoped (recommended)
Skills live inside your vault. Claude Code picks them up when you run from the vault root.

1. Open Claude Code in the vault directory.
2. Skills are auto-discovered from `claude/skills/`.

### Option B - User-scoped
Copy the skills to your home directory so they're available from any project:

```bash
mkdir -p ~/.claude/skills
cp -r claude/skills/* ~/.claude/skills/
```

---

## What each skill needs to actually run

These skills assume Claude Code can:

1. **Read your vault.** It reads frontmatter from `wiki/skus/*.md` and other folders.
2. **(Optional) Pull live SP-API data** via an MCP server (`mcp-amazon`). Without this, skills work but use whatever numbers are in the frontmatter.
3. **Write back to your vault.** Skills update SKU pages and create decision drafts.

---

## Wiring up `mcp-amazon` (optional but recommended)

The `mcp-amazon` MCP server is what makes the brain *live* rather than static. It pulls from SP-API on demand: orders, ads, reviews, inventory.

Setup is its own small project. See `https://github.com/sellersessions` for the latest reference build (the SSL 2026 talk demo). High-level steps:

1. Get SP-API + Ads API credentials from your Seller Central LWA console.
2. Clone `mcp-amazon`, `npm install`, configure `.env` with your creds.
3. Add the server to your Claude Code MCP config:
   ```json
   {
     "mcpServers": {
       "amazon": {
         "command": "node",
         "args": ["/path/to/mcp-amazon/dist/index.js"]
       }
     }
   }
   ```
4. Restart Claude Code.

Once it's wired, `/sku-audit` and `/restock-memo` will pull live numbers. Without it, they read from frontmatter.

---

## Customising the skills

Skills are markdown files. Edit them in place. The frontmatter `description` field is what Claude Code uses to decide when to trigger.

If you build a useful new skill, save it as `claude/skills/<your-skill>/SKILL.md` and consider pushing it back upstream.

---

## What about Obsidian?

Obsidian is the human interface to the vault. Claude Code is the agent interface. Both read the same plain-text markdown. You can use either, both, or neither.

- Obsidian gives you graph view, backlinks, mobile, search.
- Claude Code gives you skills, MCP, and the ability to ask "audit my whole portfolio".

The wiki belongs to you. Both tools are replaceable.
