<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/logo-light.svg">
  <img alt="Shubhash Sharma : SSL 2026" src="assets/logo-dark.svg" width="700">
</picture>

<br/>

![Speaker](https://img.shields.io/badge/Speaker-Shubhash_Sharma-4A9BD9?style=for-the-badge)
![Deliverables](https://img.shields.io/badge/3-Deliverables-6C5CE7?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-E74C3C?style=for-the-badge)
![Date](https://img.shields.io/badge/Sat_9_May-SSL_2026-00B894?style=for-the-badge)

**Architecting the Amazon Operator's Stack.**
**Three deliverables, snapshotted from stage day.**

> [!NOTE]
> **TL;DR.** Operator-grade stack: a one-shot setup, a 5-schema Supabase data lake, and an Obsidian brain template. All three public, all three MIT-licensed.

---

## The stack at a glance

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'nodeTextColor': '#e8e8e8', 'primaryTextColor': '#e8e8e8', 'clusterBkg': 'transparent', 'clusterBorder': '#8b949e'}}}%%
flowchart LR
    STACK["Stack<br/>(setup)"] --> CORE["Datacore<br/>(data lake)"]
    CORE --> BRAIN["Brain<br/>(Obsidian)"]
    STACK -.->|companion form| FORM["Setup form<br/>(Vercel)"]

    style STACK fill:none,stroke:#14B8A6,stroke-width:1px,color:#fff
    style CORE fill:none,stroke:#8B5CF6,stroke-width:1px,color:#fff
    style BRAIN fill:none,stroke:#EC4899,stroke-width:1px,color:#fff
    style FORM fill:none,stroke:#8b949e,stroke-width:1px,color:#cccccc
```

---

## The three deliverables

For the live versions (with future updates), use the canonical repos:

| Folder | Canonical repo | Purpose |
|---|---|---|
| `amazon-operator-stack-main/` | [ShubhashSharma/amazon-operator-stack](https://github.com/ShubhashSharma/amazon-operator-stack) | Take-home stack setup. Companion form: [amazon-operator-stack-setup.vercel.app](https://amazon-operator-stack-setup.vercel.app) |
| `operator-datacore-main/` | [ShubhashSharma/operator-datacore](https://github.com/ShubhashSharma/operator-datacore) | 5-schema Supabase data lake (raw / brain / ops / analytics / meta) |
| `brain-template-main/` | [ShubhashSharma/brain-template](https://github.com/ShubhashSharma/brain-template) | Obsidian Operator's Brain template |

---

## Quick install: Brain template

```bash
curl -fsSL https://raw.githubusercontent.com/ShubhashSharma/brain-template/main/setup.sh | bash
```

For the other two, follow the canonical repo READMEs linked above.

---

## Questions

If something's broken or missing, ping the SSL 2026 attendee channel.
