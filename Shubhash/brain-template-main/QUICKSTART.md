# Quickstart - your first 60 minutes

A handhold guide for the first hour inside The Operator's Brain. Designed for non-technical operators. If you're comfortable with Git and markdown, the README's 30-minute path is faster.

---

## Before you start (5 minutes)

You'll need:
- A Mac (Linux + Windows guide coming, see roadmap)
- A GitHub account (free, https://github.com/signup)
- 60 minutes uninterrupted

You will install:
- **Obsidian** - the markdown editor you'll use day-to-day
- **Git, GitHub CLI** - to sync your brain to a private GitHub repo
- **Claude Code** (optional but recommended) - to run the four skills

---

## Step 1 - Get your own copy of the template (10 minutes)

### The easy way (no terminal yet)
1. Open https://github.com/ShubhashSharma/brain-template in your browser.
2. Click the green **"Use this template"** button at the top.
3. Choose **"Create a new repository"**.
4. Name it `my-operator-brain` (or whatever you want). Mark it **Private**.
5. Click **Create repository**. You now own a private copy.

### Now clone it to your Mac
Open Terminal and run:
```bash
cd ~/Documents
git clone https://github.com/YOUR-USERNAME/my-operator-brain.git
```

Replace `YOUR-USERNAME` with your GitHub username.

### Or use the one-line installer
This does everything in one step (prerequisites, repo creation, clone, optional Claude Code wiring):
```bash
curl -fsSL https://raw.githubusercontent.com/ShubhashSharma/brain-template/main/setup.sh | bash
```

---

## Step 2 - Open it in Obsidian (5 minutes)

1. Install Obsidian from https://obsidian.md if you don't have it.
2. Open Obsidian.
3. Click **Open another vault** (bottom-left of the welcome screen).
4. Click **Open folder as vault**.
5. Select `~/Documents/my-operator-brain`.
6. Trust the author when prompted, enable plugins.

You should see the folder tree on the left. `wiki/`, `_templates/`, `raw/`, etc.

---

## Step 3 - Read the example pages (15 minutes)

In this exact order:

1. **`README.md`** at the vault root - the public intro.
2. **`wiki/README.md`** - the operator's tour.
3. **`wiki/skus/EXAMPLE-acme-baby-shampoo-001.md`** - what a SKU page looks like.
4. **`wiki/suppliers/EXAMPLE-shenzhen-soft-goods-co.md`** - what a supplier page looks like.
5. **`wiki/decisions/EXAMPLE-2026-02-price-test.md`** - what a decision page looks like.
6. **`wiki/daily/EXAMPLE-2026-05-09.md`** - what a daily note looks like in actual use.
7. **`wiki/finance/EXAMPLE-monthly-close-2026-04.md`** - what a populated monthly close looks like.

Don't try to absorb everything. Just look at the **shape** of each page. The frontmatter at the top, the body sections, the `[[wikilinks]]` connecting them.

---

## Step 4 - Create your first SKU page (15 minutes)

Pick **one** of your top SKUs. Just one. You'll be tempted to do all of them at once. Don't.

1. In Obsidian, open `_templates/sku.md`.
2. Copy everything (Cmd+A, Cmd+C).
3. Create a new file in `wiki/skus/`. Name it after your SKU, e.g. `mybrand-product-001.md`.
4. Paste the template into the new file.
5. Fill in the frontmatter at the top:
   - `asin`: your parent ASIN
   - `sku`: your internal SKU code
   - `cogs_landed`: your true landed COGS per unit
   - `units_30d`, `revenue_30d`, `ad_spend_30d`: from Seller Central
   - `cm3_30d`: compute it (see `wiki/concepts/cm1-cm2-cm3.md` if you're not sure)
   - `days_on_hand`: from FBA inventory
6. Fill in the body sections as much or as little as you want for now. The 1-star theme tracker and decisions linked sections can stay empty.
7. Save.

---

## Step 5 - Create your first daily note (5 minutes)

1. Copy `_templates/operator-daily.md`.
2. Save it to `wiki/daily/` with today's date as the file name, e.g. `2026-05-09.md`.
3. Fill in yesterday's numbers from each channel admin.
4. Write 3 wins, 3 fires, decisions to make today.
5. Save.

That's the loop. Tomorrow morning, do this again.

---

## Step 6 - Sync back to GitHub (5 minutes)

Your work is on your Mac, not yet on GitHub. To sync:

### Option A - Use the Obsidian Git plugin (recommended)
1. In Obsidian, Settings -> Community plugins -> Browse.
2. Search for **Obsidian Git**, install, enable.
3. Settings -> Obsidian Git -> turn on **Auto pull on startup**, **Auto push** every 10 minutes.

From now on, Obsidian Git auto-syncs every 10 minutes.

### Option B - Manual git
```bash
cd ~/Documents/my-operator-brain
git add .
git commit -m "first SKU + daily note"
git push
```

---

## Step 7 - (Optional) Wire up Claude Code (5 minutes)

If you have Claude Code installed:
1. Open Terminal.
2. `cd ~/Documents/my-operator-brain`
3. Run `claude`.
4. Once Claude Code starts, type `/sku-audit YOUR_ASIN` (replace with the ASIN you put on your SKU page).

The skill reads your frontmatter and gives you a health score. Without `mcp-amazon` wired up, it works on whatever numbers you typed in. With `mcp-amazon` wired up (see `.claude/README.md`), it pulls live SP-API data.

---

## You're done

What you have now:
- A private Git-synced markdown wiki on GitHub
- One SKU page populated with your real numbers
- One daily note for today
- Four operator skills ready to run via Claude Code

What to do tomorrow:
- Add a second SKU page.
- Add the supplier for that SKU.
- Update yesterday's daily note. Create today's.

What to do this week:
- Add your top 5 SKUs (one per day, not all at once).
- Add your top 3 suppliers.
- Read `wiki/concepts/cm1-cm2-cm3.md` and `wiki/concepts/restock-formula.md` properly.

What to do this month:
- Run a Monday restock cycle using `wiki/playbooks/restock-cycle.md`.
- Close out April or May using `_templates/monthly-close.md`.

---

## Stuck?

Common issues:
- **"Obsidian Git can't connect to GitHub"** - you need to install GitHub CLI (`brew install gh`) and run `gh auth login` once.
- **"Templater hotkey doesn't work"** - Settings -> Templater -> Template folder location, set to `_templates`.
- **"Where do I put screenshots / Looms?"** - drop them in `raw/` for now. Curate later.

If you hit something this guide doesn't cover, open an issue at the template repo: https://github.com/ShubhashSharma/brain-template/issues
