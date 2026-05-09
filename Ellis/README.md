# Ellis Whitehead : SSL 2026

![Speaker](https://img.shields.io/badge/Speaker-Ellis_Whitehead-4A9BD9?style=for-the-badge)
![Session](https://img.shields.io/badge/Session-1_of_4-6C5CE7?style=for-the-badge)
![Format](https://img.shields.io/badge/Format-Slides_+_thesis-E74C3C?style=for-the-badge)
![Date](https://img.shields.io/badge/Sat_9_May-SSL_2026-00B894?style=for-the-badge)

**Claude isn't your data analyst. It's your data engineer.**
**Stop making it rediscover your business every session. Have it write the code that does.**

> [!NOTE]
> **TL;DR.** Data-driven decisions need a single source of truth and executable business logic. Centralize your data, then let Claude turn its learnings into a CLI + MCP it can call reliably every time. Session 2 walks through the build (SP-API, your own database).

---

## What's in this folder

| File                           | What it is                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| [`Slides.html`](./Slides.html) | The Session 1 deck. Open in any browser. Space / arrows to navigate, `f` for fullscreen, `.` to hide the footer. |

No take-home repo for Session 1 — this talk sets up the thesis. The build lands in Session 2.

---

## The thesis at a glance

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'nodeTextColor': '#e8e8e8', 'primaryTextColor': '#e8e8e8', 'clusterBkg': 'transparent', 'clusterBorder': '#8b949e'}}}%%
flowchart LR
    REPORTS["Disconnected<br/>reports"] --> DB["Single<br/>database"]
    DB --> GUIDE["Data model<br/>guide"]
    GUIDE --> CLI["CLI<br/>(your queries)"]
    CLI --> MCP["MCP<br/>(typed tool)"]
    MCP --> CLAUDE["Claude<br/>calls it"]

    style REPORTS fill:none,stroke:#8b949e,stroke-width:1px,color:#cccccc
    style DB fill:none,stroke:#14B8A6,stroke-width:1px,color:#fff
    style GUIDE fill:none,stroke:#8B5CF6,stroke-width:1px,color:#fff
    style CLI fill:none,stroke:#8B5CF6,stroke-width:1px,color:#fff
    style MCP fill:none,stroke:#8B5CF6,stroke-width:1px,color:#fff
    style CLAUDE fill:none,stroke:#EC4899,stroke-width:1px,color:#fff
```

---

## Why Claude-as-analyst breaks

Slow, costly, and unreliable when pointed at raw spreadsheets and reports:

- Hallucinates when data is missing.
- Math errors, like a human doing it in their head.
- Different approach every time you ask.
- Misreads columns. Can't connect reports to each other.
- Today's top agents start getting dumber around **50K tokens** of context.

Loading more instructions to fix it makes Claude confused, not smarter.

---

## The fix: foundations + guardrails

Two moves Database Administrators and Software Engineers have been doing for decades. Claude lets non-programmers do them too.

**1. Data foundations.** Centralize all your data in one database. Important insights require merging unconnected reports.

**2. Guardrails.** Translate Claude's learnings into reliable code it can run every time:

| Layer                 | Purpose                                       |
| --------------------- | --------------------------------------------- |
| **Data model guide**  | Document the structure of your business data. |
| **Command-line tool** | Implement the common queries as a small CLI.  |
| **MCP wrapper**       | Expose the CLI to Claude as a typed tool.     |

The result: Claude stops rediscovering your business on every call and starts running the queries you already validated.
