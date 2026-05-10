<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="../assets/logo-light.svg">
  <img alt="Dorian Gorski : SSL 2026" src="../assets/logo-dark.svg" width="700">
</picture>

<br/>

![Speaker](https://img.shields.io/badge/Speaker-Dorian_Gorski-4A9BD9?style=for-the-badge)
![Project](https://img.shields.io/badge/Project-syncflow-6C5CE7?style=for-the-badge)
![Runtime](https://img.shields.io/badge/Runs_in-Claude_Cowork-E74C3C?style=for-the-badge)
![Date](https://img.shields.io/badge/Sat_9_May-SSL_2026-00B894?style=for-the-badge)

**syncflow: Connected Systems Consultant for Amazon brands.**
**Lives in a folder. Runs in Claude Desktop. ~10-15 minutes from `let's start` to a Connected Systems Roadmap.**

> [!NOTE]
> **TL;DR.** Drag a folder into a Claude Cowork project, paste a system prompt, type `let's start`. ~15 minutes later you have an 11-page Connected Systems Roadmap artifact + a portable `brain.json` you can resume from in any future chat.

---

## What's in this folder

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'nodeTextColor': '#e8e8e8', 'primaryTextColor': '#e8e8e8', 'clusterBkg': 'transparent', 'clusterBorder': '#8b949e'}}}%%
flowchart LR
    YOU["You<br/>+ Claude Cowork"] --> SYNC["syncflow<br/>(the system)"]
    SYNC --> SKILLS["23 skills<br/>diagnose, interview,<br/>generate-build-plan"]
    SYNC --> PERS["8 expert lenses<br/>(personas)"]
    SYNC --> TEMPL["Roadmap artifact<br/>+ brain.json schema"]
    SYNC --> INTEG["Integrations<br/>ClickUp / Slack / Notion<br/>Supabase / n8n"]

    style YOU fill:none,stroke:#4A9BD9,stroke-width:1px,color:#fff
    style SYNC fill:none,stroke:#6C5CE7,stroke-width:1px,color:#fff
    style SKILLS fill:none,stroke:#14B8A6,stroke-width:1px,color:#fff
    style PERS fill:none,stroke:#8B5CF6,stroke-width:1px,color:#fff
    style TEMPL fill:none,stroke:#EC4899,stroke-width:1px,color:#fff
    style INTEG fill:none,stroke:#F59E0B,stroke-width:1px,color:#fff
```

---

## The folder

| Folder | Canonical repo | Purpose |
|---|---|---|
| `syncflow-main/` | [ctrboost/idealsync-systems](https://github.com/ctrboost/idealsync-systems) | The take-home syncflow pack, **v2.4 build `20260509-082827`**. Drop into Claude Cowork, paste custom instructions, type `let's start`. |

---

## Quick start (~2 minutes to first message)

You need a **Claude Pro or Team** account. Free tier can't use Project Custom Instructions, Project Knowledge, or Artifacts.

1. Open Claude Desktop. Click **Projects** → **New Project**. Name it `syncflow · <your brand>`.
2. Open `syncflow-main/0-paste-this-into-custom-instructions.txt`. Cmd+A, Cmd+C, paste into the project's **Custom Instructions** panel, save.
3. Drag `syncflow-main/2-drag-this-folder-into-claude/` into the project's **Project Knowledge** panel. Wait ~30 seconds for indexing.
4. In the project chat, type `let's start`.

syncflow introduces itself, opens the **Connected Systems Roadmap** artifact in your right panel, and walks you through a ~10-15 minute interview across 4 sections. The roadmap updates at 4 verification gates.

The full guide lives in [`syncflow-main/1-read-me.txt`](./syncflow-main/1-read-me.txt).

---

## What you walk away with

- **Connected Systems Roadmap** : 11-page interactive artifact covering current sprawl, future-state owned blueprint, keep / consolidate / retire table, migration plan, featured module deep-dive
- **`brain.json`** : portable JSON of every fact captured. Drag it back into Project Knowledge in any future chat to resume

---

## Coming back later

After your first roadmap, syncflow offers to save your brain. Click **Download** on the `brain.json` artifact, then drag the file into the same Project's Knowledge.

In any future conversation in that project, type:

```
let's continue
```

syncflow reads the saved brain and picks up where you left off. Update facts, swap modules, generate build plans for specific modules : all on the same brain.

---

## Things you can ask after the roadmap

- *"Re-render the roadmap"* : regenerates the artifact from the current brain
- *"Save my brain"* : re-emits a fresh `brain.json`
- *"Implement Module 02"* : generates a build plan + verification plan you can paste into your own Claude Code session
- *"Swap Module 03 for Branded Documents"* : revises the plan, surfaces consequences
- *"Summon the Amazon expert"* : switches to Sim's voice for category-specific advice
- *"What is X?"* / *"Tell me more about Module N"* : focused explainer

---

## Things syncflow will NOT do *(by design)*

- Connect to your Amazon SP-API or Ads API
- Read or process your sales / inventory / ad data
- Run anything on a schedule *(no cron, no nightly runs)*
- Replace your team

If you want hands-off building or scheduled automations, talk to **syncflow** directly : that's a separate engagement.

---

## Heads-up

syncflow runs end-to-end inside **Claude Cowork (Claude Desktop)**, not Claude Code. Different surface, different setup. If you only know Claude Code, this is a new chair to sit in.

---

## Troubleshooting

If syncflow doesn't introduce itself when you type `let's start` :

```
/health-check
```

If something feels off mid-conversation :

```
/diagnose
```

Both produce structured diagnostics with one concrete fix to try.

---

## Source + support

- Source repo: [ctrboost/idealsync-systems](https://github.com/ctrboost/idealsync-systems) (canonical, fork-friendly)
- Bugs: [open an issue at ctrboost/idealsync-systems](https://github.com/ctrboost/idealsync-systems/issues)
- Questions: SSL 2026 attendee channel, or message Dorian directly

Built by **Dorian Gorski** ([syncflow](https://www.syncflow.coach/)).
