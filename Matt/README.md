<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/logo-light.svg">
  <img alt="Matt Kostan : SSL 2026" src="assets/logo-dark.svg" width="700">
</picture>

<br/>

![Speaker](https://img.shields.io/badge/Speaker-Matt_Kostan-4A9BD9?style=for-the-badge)
![Project](https://img.shields.io/badge/Project-Florence-6C5CE7?style=for-the-badge)
![Runtime](https://img.shields.io/badge/Runs_in-Claude_Cowork-E74C3C?style=for-the-badge)
![Date](https://img.shields.io/badge/Sat_9_May-SSL_2026-00B894?style=for-the-badge)

**Florence: AI Chief Data Analyst for Amazon.**
**Mines reviews, watches competitors, generates and validates image variants. No SaaS, no subscription, no vendor lock-in.**

> [!NOTE]
> **TL;DR.** Drag a folder into a Claude Cowork project, paste a system prompt, type `ready`. ~18 minutes later you have a fully-wired CRO analyst that knows your brand, products, voice, goals, and remembers them next session.

---

## What's in this folder

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'nodeTextColor': '#e8e8e8', 'primaryTextColor': '#e8e8e8', 'clusterBkg': 'transparent', 'clusterBorder': '#8b949e'}}}%%
flowchart LR
    YOU["You<br/>+ Claude Cowork"] --> FLOR["Florence<br/>(the system)"]
    FLOR --> SKILLS["17 top-level<br/>+ 45 cro-library<br/>skills"]
    FLOR --> MCPS["3 MCPs<br/>ProductPinion / Higgsfield<br/>n8n + SellerApp"]
    FLOR --> ARTIFACTS["10 artifact<br/>templates"]

    style YOU fill:none,stroke:#4A9BD9,stroke-width:1px,color:#fff
    style FLOR fill:none,stroke:#6C5CE7,stroke-width:1px,color:#fff
    style SKILLS fill:none,stroke:#14B8A6,stroke-width:1px,color:#fff
    style MCPS fill:none,stroke:#8B5CF6,stroke-width:1px,color:#fff
    style ARTIFACTS fill:none,stroke:#EC4899,stroke-width:1px,color:#fff
```

---

## The two folders

| Folder | Canonical repo | Purpose |
|---|---|---|
| `florence-main/` | [ctrboost/florence](https://github.com/ctrboost/florence) | The take-home Florence system. Drop into Claude Cowork, paste custom instructions, you're live. |
| `Seller-Sessions-Matt-main/` | (this folder) | Workshop deck, LoRa training set examples, speaker brief, supporting visuals. |

---

## Quick start (~3 minutes to first message)

1. Open Claude Desktop. Sign in (Pro or above; Max recommended). New project, name it **Florence**.
2. Open `florence-main/0-paste-this-into-custom-instructions.txt`. Copy all, paste into the project's **Custom Instructions**, save.
3. Drag `florence-main/2-drag-this-folder-into-claude/` into Cowork's **Project Files** panel.
4. Open the project chat. Type any first message. Florence emits a welcome card. Type `ready` to start the 8-stage onboarding.

About 18 minutes from `ready` to a fully-wired Florence with brand context + 3 MCPs connected.

---

## Heads-up

Florence runs end-to-end inside **Claude Cowork (Claude Desktop)**, not Claude Code. Different surface, different setup. The full quick-start lives in [`florence-main/README.md`](./florence-main/README.md).

---

## Questions

If something's broken or missing, ping the SSL 2026 attendee channel.
