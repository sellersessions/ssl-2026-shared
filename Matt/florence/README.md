# Florence

> **AI Chief Data Analyst for Amazon.** Mines reviews, watches competitors, generates image variants, validates them with real shoppers, logs every project in a tracker you own. Runs end-to-end inside Claude Cowork (Claude Desktop) — no SaaS, no subscription, no vendor lock-in.

Florence is a **connected CRO system** built from 100+ hours of distilled Keplo client work + Matt Kostan's ProductPinion test library + three creative-director references for main / listing / A+ image work. Drag a folder into a Cowork project, paste the system prompt, type `ready`, and you have a fully-wired CRO analyst that knows your brand, your products, your goals, your voice — and remembers them next session.

**Versioned at:** `0.1.13-image-verify-embed` · 17 top-level skills + 45 cro-library skills · 10 artifact templates · 1 repo, ~600 KB zipped.

---

## Download

**The audience download (Seller Sessions delegates):**

📦 **<https://github.com/ctrboost/florence/archive/refs/heads/main.zip>**

Unzip anywhere on your laptop. No git, no terminal, no install steps. Three files at the root:

```
florence/
├── README.md                                    ← this file
├── 0-paste-this-into-custom-instructions.txt    ← Step 1: paste contents into Cowork
└── 2-drag-this-folder-into-claude/              ← Step 2: drag this folder into Cowork's Project Files
```

(Plus `_dev/` for advanced contributors — workshop delegates ignore it.)

---

## Quick start (~3 minutes to first message)

### 1. Open Claude Desktop

Sign in (Pro plan or above; Max recommended for Routines and longer sessions). In the sidebar, click **+ New Project**. Name it **Florence**.

### 2. Paste the Custom Instructions

Open `0-paste-this-into-custom-instructions.txt` in any text editor. Select all (Cmd-A / Ctrl-A), copy (Cmd-C / Ctrl-C), paste into the project's **Custom Instructions** panel. Save.

This is Florence's identity — voice, skill catalogue, trigger map, artifact protocol. Don't edit it unless you know what you're doing.

### 3. Drag the folder into Project Files

Drag the folder `2-drag-this-folder-into-claude/` (sitting next to this README) into Cowork's **Project Files** panel. Cowork indexes everything inside — you'll see Florence's skills, reference library, templates, and integrations populate.

### 4. Say "let's start"

Open the project chat. First message: anything (`hi`, `let's start`, `morning`). Florence emits a **welcome card** introducing herself + the workshop ecosystem context. Read it through, then type **`ready`** to start the 8-stage onboarding flow. About 18 minutes from `ready` to a fully-wired Florence with your brand context + 3 MCPs (ProductPinion, Higgsfield, n8n + SellerApp) connected.

---

## What Florence does

The 17 top-level skills, in one line each:

| Command | What it does |
|---|---|
| `onboard` | First-run brain interview — captures brand, products, competitors, voice, goals, optional brand guidelines. Wires the 3 MCPs at Stage 2. Emits `florence-brain.json` to download. ~18 min. |
| `restore-brain` | Rehydrate state from a previously-emitted `florence-brain.json` you re-upload to Project Knowledge. Cross-session continuity. |
| `track-products <ASINs>` | Paste ASINs or amazon URLs — Florence calls SellerApp `Get Product Details`, caches the response, populates the cockpit's products page. |
| `today` | Daily brief: priority pick, signals, scheduled runs, "what I'd do today" line. Schedule via Cowork Routine for 8am delivery. |
| `recommend-test` | Match a CTR / CVR / objection problem to the right ProductPinion test family + template. Decision tree from Matt Kostan's 2026 interview. |
| `optimize-listing <ASIN>` | Fast CRO audit (~30s). Chains 5 SellerApp endpoints + reverse-ASIN keyword research + competitor SERP, returns 3 ranked actions with 40/30/15/15 scores. |
| `shopper-interrogator <ASIN>` | Full CVR objection-mining loop — review-mining → Rufus → Pinion polls → image blueprint. The headline workshop demo. |
| `pinion` | Launch a single ProductPinion test (Ask / Poll / Video) directly via the PP MCP. Lightweight one-off path. Visual-verification gate before spending credits. |
| `image-strategy` | Category research before any render — top 15 bestsellers analysis (~10 min, ~300 SellerApp tokens), reverse-engineers what wins, tunes Florence's Higgsfield prompts to your brand. |
| `render` | Generate image variants via Higgsfield MCP — main image, listing slots 2–7, A+ modules. Per-slot creative-director methodology, visual verification gate, 3-attempt iteration loop, base64-embedded into the deliverable artifact. |
| `setup-validate` | Health check across brain + 3 MCPs + n8n webhooks. |
| `idea <text>` | Capture a hypothesis or thing-to-try-later into the cockpit Ideas tab. |
| `project` / `projects` | Manual control surface for the project tracker (auto-populated by every CRO skill). Rename, change status, close, remove. |
| `resources` / `pin <path>` / `unpin <path>` | Curate the cockpit Resources tab — pin reference docs above the default catalog. |
| `help` | Chat reference card listing every available command + natural-language equivalent. |
| `florence-help` | Diagnostic skill — surface the most likely fix when something breaks. |
| `test-log` / `log <note>` | Capture session feedback during testing — accumulates into a single `florence-test-log` artifact you download + share. |

Plus **45 advanced CRO skills** in `2-drag-this-folder-into-claude/skills/cro-library/` for power users — main-image pipeline, lifestyle-stack generator, A+ premium build, objection killer, CVR leak fix, keyword rank tracker, and more.

---

## How Florence works

Florence is built on the shoulders of:

- **100+ hours of distilled CRO methodology** from Keplo's client work
- **Matt Kostan's 2026 ProductPinion interview** — codified test methodology + the 17 PP test templates with calibration data for what actually lifts CTR / CVR
- **Three creative-director references** — `main-image` (1:1, 8 enhancement techniques, 6-section prompt structure, 5 thumbnail rules), `listing-image` (1:1, editorial design philosophy, 5-spinoff methodology), `aplus` (16:9, 4 critical rules, 5-question pre-gen checklist) — each with a 13-step canonical flow (research → hypothesis → validate → user review → reference upload → render → self-assess → present → propose Pinion → run → results + iterate)
- **52-tactic main-image library** — every variant Florence renders cites a specific tactic by number
- **Brand-level image strategy** — `image-strategy` skill scopes top 15 category bestsellers and tunes prompt adjustments per brand so renders are bespoke to category, not generic

The runtime is **Claude Cowork (Claude Desktop)** — Florence plugs into Slack, Notion, Calendar, ProductPinion, Higgsfield, plus a custom n8n MCP exposing 16 SellerApp tools (`Get Product Details`, `Get Product Reviews`, `Get Rufus AI Queries`, `Keyword Research V2`, `Keyword Search Result`, etc.). All connections are user-owned — no Florence backend, no SaaS hosting, no data leaving your Cowork instance.

The brain (`florence-brain.json`) lives on your laptop. Every CRO output (research / concepts / tests / per-product dossier / image strategy) emits as a Cowork **artifact** — durable, downloadable, designer-shareable. Generated images are base64-embedded so the artifacts survive Cowork's iframe sandbox + temporary URL expiry.

---

## Architecture (1 paragraph)

A **dispatcher pattern**. Florence's identity + voice + 17-skill catalogue + trigger map live in `0-paste-this-into-custom-instructions.txt` (the system prompt). Every skill is a markdown file in `skills/` (top-level) or `skills/cro-library/<name>/SKILL.md` (advanced). Florence routes user messages → reads the matching skill file in full → executes step-by-step → emits the right artifact. The 10 templates in `templates/` define the visual surfaces (cockpit, welcome, today, research, concepts, tests, dossier, test-log, image-strategy, plus the brain JSON schema). The 19 reference docs in `reference/` are the methodology source-of-truth Florence cites in every recommendation. Connectors are 4 official MCPs (Slack/Notion/Calendar via Cowork, Higgsfield direct, ProductPinion direct, plus the SellerApp MCP shipped as an n8n workflow JSON). Brain state (`florence-brain.json`) round-trips through Project Knowledge for cross-session continuity.

---

## What's in the `2-drag-this-folder-into-claude/` folder

```
skills/                                     ← 17 top-level + 45 cro-library
  onboard.md, render.md, optimize-listing.md, …
  cro-library/
    main-image-pipeline/SKILL.md
    aplus-premium-build/SKILL.md
    objection-killer/SKILL.md
    … (42 more)

templates/                                  ← 10 artifact templates
  cockpit.html, welcome.html, today.html
  research.html, concepts.html, tests.html
  dossier.html, test-log.html, image-strategy.html
  brain-schema.json, _placeholders.md

reference/                                  ← 19 reference docs (Florence cites these)
  MASTER-CRO-REFERENCE.md
  sellerapp-api-reference.md
  01-research/, 02-visual-content/, 04-data-analysis/, 05-productpinion/

integrations/                               ← Connector setup walkthroughs
  product-pinion.md, higgsfield.md, sellerapp.md, n8n.md, n8n-webhooks.md

n8n/                                        ← User-accessible n8n assets (v0.1.10+)
  florence-mcp-sellerapp.json               ← Workshop-shared SellerApp creds baked in
  credentials-checklist.md
  README.md

prompts/                                    ← Drop-in chat openers
mcp.json                                    ← Connector registry
```

---

## Origin

Joint **Keplo × ProductPinion** project. Built for delegates of the **Seller Sessions** workshop (Mar 2026 — *AI slop vs. connected systems*).

- **Matt Kostan** — ProductPinion CEO; LoRAs primer + Ethical Prompt Injection skill + workshop methodology + GPT-2 image gen integration
- **Dorian** — Florence integration & flows + Systems Consultant Agent + "make it pretty" output skill
- **Joint** — Florence narrative, dry runs, support-bot training data

Florence is one of four sister tracks at the workshop:

1. **LoRAs primer** — fine-tune image-gen models on your own products *(Matt)*
2. **Ethical Prompt Injection** — bias your shopper's own LLM toward your brand *(Matt)*
3. **Systems Consultant Agent** — interview agent that maps your custom system roadmap *(Dorian)*
4. **Florence** — the connected CRO system you can take home today *(Matt + Dorian)*

The unifying thesis: **most CRO is one-off prompts and disconnected tools. Florence is the opposite — a connected system you own. Build a workflow, integrate it with your stack, automate, train on your brand. Then change it. It's yours.**

---

## Workshop credentials (intentional, time-limited)

Florence ships with **workshop-shared credentials** baked into the n8n SellerApp MCP workflow JSON (`2-drag-this-folder-into-claude/n8n/florence-mcp-sellerapp.json`):

- **SellerApp** Client ID `support_keplo` + token (rate-limited shared account; fine for the workshop demo)
- **ProductPinion** Client ID `B5f2zdcwuw2tEsKZZrwWvEcXF1R94l9y` (workshop default; users OAuth their own PP account on top)
- **Higgsfield** is OAuth-only, no API key

**For sustained production use after the workshop**, swap these for your own credentials per the integration docs (`integrations/sellerapp.md` § Swap to your own credentials).

---

## Updating Florence

Florence ships as a snapshot in the zip. To get the latest:

1. Re-download the zip from <https://github.com/ctrboost/florence/archive/refs/heads/main.zip>
2. Replace `2-drag-this-folder-into-claude/` in your Cowork project (drag the new folder, replace files when prompted)
3. Re-paste the contents of `0-paste-this-into-custom-instructions.txt` into the project's Custom Instructions

Your `florence-brain.json` carries forward — drop it back into Project Knowledge after the upgrade and Florence rehydrates state via the `restore-brain` skill.

Or via git:
```bash
git clone https://github.com/ctrboost/florence.git
git pull origin main
```

---

## Contributing

This is the workshop snapshot — open-source, no warranty, fork-friendly. The `_dev/` folder carries the developer history (CHANGELOG, planning docs, n8n source workflows, tests).

If you build something on top of Florence — a new skill, a new artifact template, a Higgsfield workflow tuned to a specific category — open a PR or fork freely. The dispatcher pattern makes new skills trivial: drop a markdown file in `skills/`, add a row to the trigger map, ship.

For workshop delegate questions, ping Matt or Dorian directly — there's no support email, this isn't a SaaS.

---

**No vendor lock-in. No subscription. You own the code, the data, the brain, the artifacts. Florence runs forever.**
